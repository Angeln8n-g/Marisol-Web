import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { ProcedurePrice } from '../types'

export function usePriceHistory(procedureId: string | null) {
  return useQuery({
    queryKey: ['pricing', 'history', procedureId],
    queryFn: async () => {
      if (!procedureId) return []
      const { data, error } = await supabase
        .from('procedure_prices')
        .select('*')
        .eq('procedure_id', procedureId)
        .order('effective_from', { ascending: false })

      if (error) throw error
      return data as unknown as ProcedurePrice[]
    },
    enabled: !!procedureId,
  })
}

export interface ProcedurePricingItem {
  id: string | null
  procedure_id: string
  price: number | null
  currency: string
  effective_from: string | null
  effective_to: string | null
  procedure: {
    id: string
    name: string
    category: string
    description?: string | null
    duration_minutes: number
    clinical_duration_minutes?: number
    is_active: boolean
  }
}

export function usePricing() {
  const queryClient = useQueryClient()

  const currentPricesQuery = useQuery({
    queryKey: ['pricing', 'current'],
    queryFn: async (): Promise<ProcedurePricingItem[]> => {
      // 1. Fetch all active procedures
      const { data: procedures, error: procError } = await supabase
        .from('procedures')
        .select('*')
        .order('name', { ascending: true })

      if (procError) throw procError

      // 2. Fetch current prices (where effective_to is null)
      const { data: prices, error: priceError } = await supabase
        .from('procedure_prices')
        .select('*')
        .is('effective_to', null)

      if (priceError) throw priceError

      const procList = (procedures || []) as unknown as import('../types').Procedure[]
      const priceList = (prices || []) as unknown as ProcedurePrice[]

      const priceMap = new Map<string, ProcedurePrice>()
      priceList.forEach((p) => {
        priceMap.set(p.procedure_id, p)
      })

      // 3. Merge procedures with current price (if any)
      const items: ProcedurePricingItem[] = procList.map((proc) => {
        const currentPrice = priceMap.get(proc.id)
        if (currentPrice) {
          return {
            id: currentPrice.id,
            procedure_id: proc.id,
            price: currentPrice.price,
            currency: currentPrice.currency,
            effective_from: currentPrice.effective_from,
            effective_to: null,
            procedure: proc,
          }
        }
        return {
          id: null,
          procedure_id: proc.id,
          price: null,
          currency: 'DOP',
          effective_from: null,
          effective_to: null,
          procedure: proc,
        }
      })

      return items
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (update: {
      procedure_id: string
      price: number
      currency: string
      effective_from: string
      change_reason: string
    }) => {
      // Check if there is an existing active price
      const { data: existingPriceData } = await supabase
        .from('procedure_prices')
        .select('id, effective_from')
        .eq('procedure_id', update.procedure_id)
        .is('effective_to', null)
        .maybeSingle()

      const existingPrice = existingPriceData as unknown as { id: string; effective_from: string } | null
      let closeDate: string | null = null

      if (existingPrice) {
        // Set close date to the day before effective_from
        const effDate = new Date(update.effective_from + 'T00:00:00')
        effDate.setDate(effDate.getDate() - 1)
        closeDate = effDate.toISOString().split('T')[0]

        const { error: closeError } = await supabase
          .from('procedure_prices')
          .update({ effective_to: closeDate } as never)
          .eq('id', existingPrice.id)

        if (closeError) throw closeError
      }

      const { data: { session } } = await supabase.auth.getSession()
      const changedBy = session?.user?.id ?? null

      const { data, error } = await supabase
        .from('procedure_prices')
        .insert({
          procedure_id: update.procedure_id,
          price: update.price,
          currency: update.currency,
          effective_from: update.effective_from,
          change_reason: update.change_reason || (existingPrice ? 'Ajuste de precio' : 'Precio inicial'),
          changed_by: changedBy,
        } as never)
        .select()
        .single()

      if (error) {
        // Revert previous price close if insert fails
        if (existingPrice && closeDate) {
          await supabase
            .from('procedure_prices')
            .update({ effective_to: null } as never)
            .eq('id', existingPrice.id)
        }

        if (error.message?.includes('no_overlapping_prices')) {
          throw new Error('No se puede actualizar el precio debido a fechas superpuestas. Verifica la fecha de vigencia.')
        }
        throw error
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] })
      queryClient.invalidateQueries({ queryKey: ['procedures'] })
    },
  })

  const currentPrices = currentPricesQuery.data ?? []
  const totalProcedures = currentPrices.length
  const pricedCount = currentPrices.filter((p) => p.price !== null).length
  const unpricedCount = totalProcedures - pricedCount

  return {
    currentPrices,
    totalProcedures,
    pricedCount,
    unpricedCount,
    isLoading: currentPricesQuery.isLoading,
    isError: currentPricesQuery.isError,
    error: currentPricesQuery.error,
    updatePrice: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    refetch: currentPricesQuery.refetch,
  }
}
