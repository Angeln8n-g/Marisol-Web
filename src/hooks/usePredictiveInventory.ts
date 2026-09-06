import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { InventoryItem, PredictiveRestockItem } from '../types'

export interface PredictiveAppointmentData {
  id: string
  scheduled_at: string
  patient?: { full_name?: string } | null
  procedure?: {
    id: string
    name: string
    procedure_supplies?: Array<{
      item_id: string
      quantity: number
      dispense_unit?: string | null
    }> | null
  } | null
}

/**
 * Función pura que calcula la demanda proyectada y sugerencia de reorden
 * de insumos basándose en citas programadas y stock actual en unidades de dispensación.
 */
export function calculatePredictiveRestock(
  items: InventoryItem[],
  appointments: PredictiveAppointmentData[]
): PredictiveRestockItem[] {
  // 1. Mapeo de demanda por item_id
  const demandMap = new Map<
    string,
    {
      totalUnits: number
      appointments: Array<{
        appointmentId: string
        patientName: string
        scheduledAt: string
        procedureName: string
        requiredUnits: number
      }>
    }
  >()

  for (const appt of appointments) {
    const supplies = appt.procedure?.procedure_supplies || []
    for (const supply of supplies) {
      if (!supply.item_id) continue
      const existing = demandMap.get(supply.item_id) || {
        totalUnits: 0,
        appointments: [],
      }

      const qty = Number(supply.quantity) || 0
      existing.totalUnits += qty
      existing.appointments.push({
        appointmentId: appt.id,
        patientName: appt.patient?.full_name || 'Paciente sin nombre',
        scheduledAt: appt.scheduled_at,
        procedureName: appt.procedure?.name || 'Procedimiento clínico',
        requiredUnits: qty,
      })

      demandMap.set(supply.item_id, existing)
    }
  }

  // 2. Procesar cada ítem del inventario
  const restockItems: PredictiveRestockItem[] = items.map((item) => {
    const unitsPerPackage = Math.max(1, Number(item.units_per_package) || 1)
    const currentStockPackages = Number(item.current_stock) || 0
    const minimumStockPackages = Number(item.minimum_stock) || 0
    const dispenseUnit = item.dispense_unit || item.unit || 'unidad'
    const costPrice = Number(item.cost_price) || 0

    const demandInfo = demandMap.get(item.id)
    const totalUnitsRequired = demandInfo ? demandInfo.totalUnits : 0
    const availableUnits = currentStockPackages * unitsPerPackage
    const projectedRemainingUnits = availableUnits - totalUnitsRequired
    const projectedRemainingPackages = projectedRemainingUnits / unitsPerPackage

    // Determinar nivel de urgencia
    let urgency: PredictiveRestockItem['urgency'] = 'sufficient'
    if (currentStockPackages === 0) {
      urgency = 'out_of_stock'
    } else if (projectedRemainingUnits < 0) {
      urgency = 'critical_shortage'
    } else if (projectedRemainingPackages <= minimumStockPackages) {
      urgency = 'low_stock'
    }

    // Calcular paquetes sugeridos a reordenar con un colchón de seguridad
    let suggestedPackagesToOrder = 0
    if (urgency !== 'sufficient') {
      // Objetivo: cubrir la demanda y dejar un stock seguro (1.5x el stock mínimo)
      const targetUnits = Math.ceil(minimumStockPackages * 1.5) * unitsPerPackage
      const deficitUnits = Math.max(0, targetUnits - projectedRemainingUnits)
      suggestedPackagesToOrder = Math.max(1, Math.ceil(deficitUnits / unitsPerPackage))

      // Si el stock actual ya está por debajo del mínimo, garantizar reposición mínima
      if (currentStockPackages <= minimumStockPackages) {
        const packageDeficit = Math.ceil(minimumStockPackages - currentStockPackages + 1)
        suggestedPackagesToOrder = Math.max(suggestedPackagesToOrder, packageDeficit)
      }
    }

    const estimatedCost = suggestedPackagesToOrder * costPrice

    return {
      item,
      currentStockPackages,
      minimumStockPackages,
      unitsPerPackage,
      dispenseUnit,
      totalUnitsRequired,
      availableUnits,
      projectedRemainingUnits,
      projectedRemainingPackages: Math.max(0, projectedRemainingPackages),
      suggestedPackagesToOrder,
      estimatedCost,
      urgency,
      upcomingAppointments: demandInfo ? demandInfo.appointments : [],
    }
  })

  // 3. Ordenar por prioridad: Agotados primero, luego Déficit Crítico, Bajo Stock y Suficiente
  const urgencyWeight: Record<PredictiveRestockItem['urgency'], number> = {
    out_of_stock: 1,
    critical_shortage: 2,
    low_stock: 3,
    sufficient: 4,
  }

  return restockItems.sort((a, b) => {
    const weightDiff = urgencyWeight[a.urgency] - urgencyWeight[b.urgency]
    if (weightDiff !== 0) return weightDiff
    return b.suggestedPackagesToOrder - a.suggestedPackagesToOrder
  })
}

export interface UsePredictiveInventoryParams {
  clinicId?: string
  forecastDays?: number // default 14
}

export function usePredictiveInventory({
  clinicId,
  forecastDays = 14,
}: UsePredictiveInventoryParams = {}) {
  // 1. Obtener citas programadas dentro del horizonte de días
  const appointmentsQuery = useQuery({
    queryKey: ['predictive-appointments', clinicId, forecastDays],
    queryFn: async () => {
      const now = new Date()
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + forecastDays)

      let query = supabase
        .from('appointments')
        .select(`
          id,
          scheduled_at,
          status,
          clinic_id,
          patient:patients(full_name),
          procedure:procedures(
            id,
            name,
            procedure_supplies:procedure_supplies(
              item_id,
              quantity,
              dispense_unit
            )
          )
        `)
        .in('status', ['pending', 'confirmed'])
        .gte('scheduled_at', now.toISOString())
        .lte('scheduled_at', futureDate.toISOString())
        .order('scheduled_at', { ascending: true })

      if (clinicId) {
        query = query.eq('clinic_id', clinicId)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as unknown as PredictiveAppointmentData[]
    },
    staleTime: 3 * 60 * 1000,
  })

  // 2. Obtener insumos del inventario clínico y general
  const itemsQuery = useQuery({
    queryKey: ['predictive-items', clinicId],
    queryFn: async () => {
      let query = supabase
        .from('inventory_items')
        .select('*, clinic:clinics(id, name), category:inventory_categories(id, name, item_type)')
        .eq('is_active', true)
        .order('name')

      if (clinicId) {
        query = query.eq('clinic_id', clinicId)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as unknown as InventoryItem[]
    },
    staleTime: 3 * 60 * 1000,
  })

  // 3. Computar predicción y sugerencias
  const predictiveReport = useMemo(() => {
    const items = itemsQuery.data || []
    const appointments = appointmentsQuery.data || []
    return calculatePredictiveRestock(items, appointments)
  }, [itemsQuery.data, appointmentsQuery.data])

  // Artículos que requieren pedido urgente o preventivo
  const itemsToReorder = useMemo(() => {
    return predictiveReport.filter((r) => r.suggestedPackagesToOrder > 0)
  }, [predictiveReport])

  const totalEstimatedReorderCost = useMemo(() => {
    return itemsToReorder.reduce((sum, item) => sum + item.estimatedCost, 0)
  }, [itemsToReorder])

  return {
    report: predictiveReport,
    itemsToReorder,
    totalEstimatedReorderCost,
    totalAppointmentsInWindow: appointmentsQuery.data?.length || 0,
    isLoading: appointmentsQuery.isLoading || itemsQuery.isLoading,
    isError: appointmentsQuery.isError || itemsQuery.isError,
    refetch: () => {
      appointmentsQuery.refetch()
      itemsQuery.refetch()
    },
  }
}
