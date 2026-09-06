import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Procedure, ProcedureProfitability } from '../types'

/**
 * Función pura que calcula los Unit Economics y el Margen Neto Real
 * de un procedimiento dental en pesos dominicanos (RD$).
 */
export function calculateProcedureProfitability(
  procedure: Procedure,
  overrides?: {
    price?: number
    commissionPercent?: number
    chairHourlyCost?: number
    labCost?: number
  }
): ProcedureProfitability {
  const currentPriceObj = Array.isArray(procedure.current_price)
    ? (procedure.current_price.find((p: any) => !p.effective_to) || procedure.current_price[0])
    : procedure.current_price
  const price = overrides?.price ?? (Number(currentPriceObj?.price) || 3000)
  const labCost = overrides?.labCost ?? (Number(procedure.lab_cost) || 0)
  const commissionPercent = overrides?.commissionPercent ?? (Number(procedure.doctor_commission_percent) || 40)
  const chairHourlyCost = overrides?.chairHourlyCost ?? (Number(procedure.chair_hourly_cost) || 800)

  // 1. Costo real de insumos y materiales consumibles gastados por sesión
  let suppliesCost = 0
  const supplies = procedure.supplies || []
  for (const s of supplies) {
    const item = (s as any).item
    if (item) {
      const packageCost = Number(item.cost_price) || 0
      const unitsPerPackage = Math.max(1, Number(item.units_per_package) || 1)
      const costPerDispenseUnit = packageCost / unitsPerPackage
      const quantityUsed = Number(s.quantity) || 1
      suppliesCost += quantityUsed * costPerDispenseUnit
    }
  }

  // 2. Comisión médica del especialista (calculada sobre el precio neto de laboratorio)
  const revenueBaseForDoctor = Math.max(0, price - labCost)
  const doctorCommissionAmount = revenueBaseForDoctor * (commissionPercent / 100)

  // 3. Asignación de costo fijo de sillón por tiempo ocupado
  const durationHours = Math.max(0.25, (Number(procedure.duration_minutes) || 60) / 60)
  const chairOverheadAmount = durationHours * chairHourlyCost

  // 4. Márgenes
  const grossMargin = price - suppliesCost - labCost
  const grossMarginPercent = price > 0 ? (grossMargin / price) * 100 : 0

  const netMargin = grossMargin - doctorCommissionAmount - chairOverheadAmount
  const netMarginPercent = price > 0 ? (netMargin / price) * 100 : 0

  const profitPerHour = durationHours > 0 ? netMargin / durationHours : netMargin

  let marginStatus: ProcedureProfitability['marginStatus'] = 'moderate_margin'
  if (netMargin < 0) {
    marginStatus = 'loss'
  } else if (netMarginPercent >= 40) {
    marginStatus = 'high_margin'
  } else if (netMarginPercent >= 20) {
    marginStatus = 'moderate_margin'
  } else {
    marginStatus = 'low_margin'
  }

  return {
    procedure,
    price,
    suppliesCost,
    labCost,
    doctorCommissionAmount,
    doctorCommissionPercent: commissionPercent,
    chairHourlyCost,
    chairOverheadAmount,
    grossMargin,
    grossMarginPercent,
    netMargin,
    netMarginPercent,
    profitPerHour,
    marginStatus,
    suppliesCount: supplies.length,
  }
}

export function useProceduresProfitability() {
  const { data: procedures = [], isLoading, error, refetch } = useQuery({
    queryKey: ['procedures-profitability'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procedures')
        .select(`
          *,
          current_price:procedure_prices!inner(*),
          supplies:procedure_supplies(
            *,
            item:inventory_items(
              id,
              name,
              code,
              unit,
              units_per_package,
              dispense_unit,
              cost_price
            )
          )
        `)
        .eq('is_active', true)
        .is('procedure_prices.effective_to', null)
        .order('name')

      if (error) throw error
      return (data || []) as unknown as Procedure[]
    },
    staleTime: 5 * 60 * 1000,
  })

  // Computar métricas de rentabilidad para todo el catálogo
  const profitabilityList = useMemo(() => {
    return procedures.map((p) => calculateProcedureProfitability(p))
  }, [procedures])

  // KPIs agregados de la clínica
  const clinicKpis = useMemo(() => {
    if (profitabilityList.length === 0) {
      return {
        averageNetMarginPercent: 0,
        averageProfitPerHour: 0,
        topProcedure: null,
        lowestProcedure: null,
      }
    }

    const totalMarginPercent = profitabilityList.reduce((sum, p) => sum + p.netMarginPercent, 0)
    const avgMargin = totalMarginPercent / profitabilityList.length

    const totalHourlyProfit = profitabilityList.reduce((sum, p) => sum + p.profitPerHour, 0)
    const avgHourly = totalHourlyProfit / profitabilityList.length

    const sortedByProfit = [...profitabilityList].sort((a, b) => b.profitPerHour - a.profitPerHour)

    return {
      averageNetMarginPercent: avgMargin,
      averageProfitPerHour: avgHourly,
      topProcedure: sortedByProfit[0] || null,
      lowestProcedure: sortedByProfit[sortedByProfit.length - 1] || null,
    }
  }, [profitabilityList])

  // Mapa indexado por ID para acceso O(1) rápido
  const profitabilityMap = useMemo(() => {
    const map = new Map<string, ProcedureProfitability>()
    for (const item of profitabilityList) {
      map.set(item.procedure.id, item)
    }
    return map
  }, [profitabilityList])

  return {
    profitabilityList,
    profitabilityMap,
    clinicKpis,
    isLoading,
    error,
    refetch,
  }
}
