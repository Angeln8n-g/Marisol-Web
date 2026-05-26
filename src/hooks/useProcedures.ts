import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Procedure } from '../types'

export function useProcedures(page: number = 0, pageSize: number = 25) {
  const queryClient = useQueryClient()
  const queryKey = ['procedures', page, pageSize]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('procedures')
        .select('*', { count: 'estimated' })
        .order('name', { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (error) throw error
      return {
        data: data as unknown as Procedure[],
        count: count ?? 0,
        hasNextPage: (page + 1) * pageSize < (count ?? 0),
        hasPreviousPage: page > 0,
      }
    },
    staleTime: 5 * 60 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: async (procedure: {
      name: string
      category: string
      description?: string
      duration_minutes: number
    }) => {
      const { data, error } = await supabase.from('procedures').insert(procedure as never).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedures'] }),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase.from('procedures').update(updates as never).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedures'] }),
  })

  const toggleActive = async (id: string, isActive: boolean) => {
    return updateMutation.mutateAsync({ id, is_active: !isActive })
  }

  return {
    procedures: query.data?.data ?? [],
    count: query.data?.count ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    hasNextPage: query.data?.hasNextPage ?? false,
    hasPreviousPage: query.data?.hasPreviousPage ?? false,
    createProcedure: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateProcedure: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    toggleActive,
    refetch: query.refetch,
  }
}
