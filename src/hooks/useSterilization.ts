import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type {
  SterilizationCycle,
  SterilizationPackage,
  SterilizationCycleProgram,
  BiologicalIndicatorStatus,
  SterilePackageType,
} from '../types'

interface UseSterilizationCyclesParams {
  clinicId?: string
  limit?: number
}

export function useSterilizationCycles(params: UseSterilizationCyclesParams = {}) {
  const { clinicId, limit = 50 } = params

  return useQuery({
    queryKey: ['sterilization-cycles', clinicId, limit],
    queryFn: async () => {
      let query = supabase
        .from('sterilization_cycles')
        .select(`
          *,
          packages:sterilization_packages(*),
          autoclave:inventory_items(id, name, code, brand, serial_number)
        `)
        .order('cycle_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit)

      if (clinicId) {
        query = query.eq('clinic_id', clinicId)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as unknown as SterilizationCycle[]
    },
    staleTime: 2 * 60 * 1000,
  })
}

interface UseSterilePackagesParams {
  clinicId?: string
  status?: 'sterile' | 'used' | 'expired' | 'all'
}

export function useSterilePackages(params: UseSterilePackagesParams = {}) {
  const { clinicId, status = 'sterile' } = params

  return useQuery({
    queryKey: ['sterile-packages', clinicId, status],
    queryFn: async () => {
      let query = supabase
        .from('sterilization_packages')
        .select(`
          *,
          cycle:sterilization_cycles(id, cycle_number, cycle_date, autoclave_name, operator_name)
        `)
        .order('expiration_date', { ascending: true })

      if (clinicId) {
        query = query.eq('clinic_id', clinicId)
      }

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as unknown as SterilizationPackage[]
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useSterilizationMutations() {
  const queryClient = useQueryClient()

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['sterilization-cycles'] })
    queryClient.invalidateQueries({ queryKey: ['sterile-packages'] })
  }

  // 1. Registrar Nuevo Ciclo de Autoclave con sus paquetes/casetes esterilizados
  const createCycle = useMutation({
    mutationFn: async (payload: {
      clinic_id?: string | null
      autoclave_item_id?: string | null
      autoclave_name: string
      cycle_number?: number
      cycle_date?: string
      start_time?: string | null
      end_time?: string | null
      temperature_c?: number
      pressure_bar?: number
      exposure_time_minutes?: number
      drying_time_minutes?: number
      cycle_program?: SterilizationCycleProgram
      operator_name: string
      chemical_indicator_passed: boolean
      biological_indicator_status?: BiologicalIndicatorStatus
      biological_indicator_lot?: string | null
      notes?: string | null
      packages: Array<{
        description: string
        item_id?: string | null
        package_type: SterilePackageType
        expiration_days?: number // default 30
        notes?: string | null
      }>
    }) => {
      const cycleDate = payload.cycle_date || new Date().toISOString().split('T')[0]

      // Determinar correlativo de ciclo del día si no viene provisto
      let cycleNumber = payload.cycle_number
      if (!cycleNumber) {
        const { data: latestCycles } = await supabase
          .from('sterilization_cycles')
          .select('cycle_number')
          .order('cycle_number', { ascending: false })
          .limit(1)

        const latest = latestCycles as Array<{ cycle_number: number }> | null
        cycleNumber = (latest?.[0]?.cycle_number || 100) + 1
      }

      // Insertar ciclo principal
      const { data: cycle, error: cycleErr } = (await supabase
        .from('sterilization_cycles')
        .insert({
          clinic_id: payload.clinic_id || null,
          autoclave_item_id: payload.autoclave_item_id || null,
          autoclave_name: payload.autoclave_name || 'Autoclave Principal',
          cycle_number: cycleNumber,
          cycle_date: cycleDate,
          start_time: payload.start_time || null,
          end_time: payload.end_time || null,
          temperature_c: payload.temperature_c ?? 134.0,
          pressure_bar: payload.pressure_bar ?? 2.15,
          exposure_time_minutes: payload.exposure_time_minutes ?? 18,
          drying_time_minutes: payload.drying_time_minutes ?? 15,
          cycle_program: payload.cycle_program || 'instrumental_empaquetado',
          operator_name: payload.operator_name.trim(),
          chemical_indicator_passed: payload.chemical_indicator_passed,
          biological_indicator_status: payload.biological_indicator_status || 'not_applied',
          biological_indicator_lot: payload.biological_indicator_lot?.trim() || null,
          status: payload.chemical_indicator_passed ? 'completed' : 'failed',
          notes: payload.notes?.trim() || null,
        } as never)
        .select()
        .single()) as { data: SterilizationCycle | null; error: any }

      if (cycleErr || !cycle) throw cycleErr || new Error('Error al registrar ciclo de esterilización')

      // Generar paquetes y casetes estériles
      if (payload.packages.length > 0) {
        const dateCompact = cycleDate.replace(/-/g, '')
        const packagesToInsert = payload.packages.map((pkg, idx) => {
          const expDays = pkg.expiration_days || 30
          const expDate = new Date(cycleDate)
          expDate.setDate(expDate.getDate() + expDays)

          const itemIndexStr = String(idx + 1).padStart(2, '0')
          const packageCode = `EST-${dateCompact}-C${cycleNumber}-${itemIndexStr}`

          return {
            cycle_id: cycle.id,
            clinic_id: payload.clinic_id || null,
            package_code: packageCode,
            description: pkg.description.trim(),
            item_id: pkg.item_id || null,
            package_type: pkg.package_type || 'pouch',
            sterilization_date: cycleDate,
            expiration_date: expDate.toISOString().split('T')[0],
            status: payload.chemical_indicator_passed ? 'sterile' : 'discarded',
            notes: pkg.notes?.trim() || null,
          }
        })

        const { error: pkgErr } = await supabase
          .from('sterilization_packages')
          .insert(packagesToInsert as never)

        if (pkgErr) throw pkgErr
      }

      return cycle
    },
    onSuccess: invalidateAll,
  })

  // 2. Actualizar Control Biológico o Estado del Ciclo
  const updateCycle = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string
      biological_indicator_status?: BiologicalIndicatorStatus
      biological_indicator_read_date?: string | null
      notes?: string | null
      status?: 'in_progress' | 'completed' | 'failed' | 'cancelled'
    }) => {
      const { data, error } = await supabase
        .from('sterilization_cycles')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: invalidateAll,
  })

  // 3. Vincular Paquete Estéril a Cita / Paciente
  const markPackageAsUsed = useMutation({
    mutationFn: async (params: {
      packageId: string
      appointmentId?: string | null
      patientName?: string | null
    }) => {
      const { data, error } = await supabase
        .from('sterilization_packages')
        .update({
          status: 'used',
          used_in_appointment_id: params.appointmentId || null,
          used_at: new Date().toISOString(),
          used_by_patient_name: params.patientName || null,
        } as never)
        .eq('id', params.packageId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: invalidateAll,
  })

  // 4. Descartar Paquete Vencido o Contaminado
  const discardPackage = useMutation({
    mutationFn: async (packageId: string) => {
      const { data, error } = await supabase
        .from('sterilization_packages')
        .update({ status: 'discarded' } as never)
        .eq('id', packageId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: invalidateAll,
  })

  return {
    createCycle: createCycle.mutateAsync,
    isCreatingCycle: createCycle.isPending,
    updateCycle: updateCycle.mutateAsync,
    isUpdatingCycle: updateCycle.isPending,
    markPackageAsUsed: markPackageAsUsed.mutateAsync,
    isMarkingPackage: markPackageAsUsed.isPending,
    discardPackage: discardPackage.mutateAsync,
  }
}
