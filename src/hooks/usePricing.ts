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

export function usePricing() {
  const queryClient = useQueryClient()

  const currentPricesQuery = useQuery({
    queryKey: ['pricing', 'current'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procedure_prices')
        .select('*, procedure:procedures(*)')
        .is('effective_to', null)
        .order('procedure_id')

      if (error) throw error
      return data as unknown as (ProcedurePrice & { procedure: { name: string; category: string; is_active: boolean } })[]
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
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const closeDate = yesterday.toISOString().split('T')[0]

      const { error: closeError } = await supabase
        .from('procedure_prices')
        .update({ effective_to: closeDate } as never)
        .eq('procedure_id', update.procedure_id)
        .is('effective_to', null)
      if (closeError) throw closeError

      const { data: { session } } = await supabase.auth.getSession()
      const changedBy = session?.user?.id ?? null

      const { data, error } = await supabase
        .from('procedure_prices')
        .insert({
          procedure_id: update.procedure_id,
          price: update.price,
          currency: update.currency,
          effective_from: update.effective_from,
          change_reason: update.change_reason,
          changed_by: changedBy,
        } as never)
        .select()
        .single()

      if (error) {
        // Revertir cierre del precio anterior si falla la inserción
        await supabase
          .from('procedure_prices')
          .update({ effective_to: null } as never)
          .eq('procedure_id', update.procedure_id)
          .eq('effective_to', closeDate)

        if (error.message?.includes('no_overlapping_prices')) {
          throw new Error('No se puede actualizar el precio debido a fechas superpuestas')
        }
        throw error
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] })
    },
  })

  return {
    currentPrices: currentPricesQuery.data ?? [],
    isLoading: currentPricesQuery.isLoading,
    isError: currentPricesQuery.isError,
    error: currentPricesQuery.error,
    updatePrice: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    refetch: currentPricesQuery.refetch,
  }
}
