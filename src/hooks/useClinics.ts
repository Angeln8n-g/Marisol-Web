import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Clinic, ClinicWorkload } from '../types'

export function useClinics() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['clinics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinics')
        .select('id, name, address, latitude, longitude, phone, whatsapp, is_active, created_at')
        .order('name')
        .limit(100)

      if (error) throw error
      return data as unknown as Clinic[]
    },
    staleTime: 5 * 60 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: async (clinic: {
      name: string
      address: string
      latitude: number
      longitude: number
      phone: string
      whatsapp: string
    }) => {
      const { data, error } = await supabase.from('clinics').insert(clinic as never).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clinics'] }),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase.from('clinics').update(updates as never).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clinics'] }),
  })

  const calculateClinicWorkloads = async (
    date: string,
    dailyCapacity: number
  ): Promise<ClinicWorkload[]> => {
    const clinics = query.data ?? []
    const activeClinics = clinics.filter((c) => c.is_active)
    if (activeClinics.length === 0) return []

    const startOfDay = `${date}T00:00:00.000Z`
    const endOfDay = `${date}T23:59:59.999Z`

    const clinicIds = activeClinics.map((c) => c.id)

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('clinic_id, status')
      .in('clinic_id', clinicIds)
      .gte('scheduled_at', startOfDay)
      .lte('scheduled_at', endOfDay)

    if (error) throw error

    const rows = (appointments ?? []) as unknown as { clinic_id: string; status: string }[]

    const workloads: ClinicWorkload[] = activeClinics.map((clinic) => {
      const clinicAppts = rows.filter((a) => a.clinic_id === clinic.id)
      const confirmed = clinicAppts.filter((a) => a.status === 'confirmed').length
      const inProgress = clinicAppts.filter((a) => a.status === 'in_progress').length
      const pending = clinicAppts.filter((a) => a.status === 'pending').length
      const total = clinicAppts.length

      const rawPercentage = dailyCapacity > 0
        ? ((confirmed + inProgress) / dailyCapacity) * 100
        : 0
      const capacityPercentage = Math.round(Math.min(Math.max(rawPercentage, 0), 100))

      return {
        clinic,
        total_appointments: total,
        pending_appointments: pending,
        confirmed_appointments: confirmed + inProgress,
        capacity_percentage: capacityPercentage,
      }
    })

    return workloads
  }

  const reassignAppointment = async (appointmentId: string, targetClinicId: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ clinic_id: targetClinicId } as never)
      .eq('id', appointmentId)

    if (error) throw error
    queryClient.invalidateQueries({ queryKey: ['appointments'] })
  }

  const getClinicWorkload = async (clinicId: string, date: string): Promise<number> => {
    const startOfDay = `${date}T00:00:00.000Z`
    const endOfDay = `${date}T23:59:59.999Z`

    const { data, error } = await supabase
      .from('appointments')
      .select('status')
      .eq('clinic_id', clinicId)
      .gte('scheduled_at', startOfDay)
      .lte('scheduled_at', endOfDay)

    if (error) return 0
    return (data as unknown as { status: string }[])?.length ?? 0
  }

  return {
    clinics: query.data ?? [],
    activeClinics: (query.data ?? []).filter((c) => c.is_active),
    isLoading: query.isLoading,
    isError: query.isError,
    createClinic: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateClinic: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    calculateClinicWorkloads,
    reassignAppointment,
    getClinicWorkload,
    refetch: query.refetch,
  }
}
