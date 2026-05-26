import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Appointment, AppointmentStatus } from '../types'

interface AppointmentFilters {
  clinicId?: string | null
  status?: AppointmentStatus | null
  dateFrom?: string | null
  dateTo?: string | null
  searchQuery?: string
}

interface UseAppointmentsOptions {
  filters?: AppointmentFilters
  page?: number
  pageSize?: number
}

export function useAppointments({ filters = {}, page = 0, pageSize = 25 }: UseAppointmentsOptions = {}) {
  const queryClient = useQueryClient()

  const queryKey = ['appointments', filters, page, pageSize]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select('*, patient:patients(*), clinic:clinics(*), procedure:procedures(*)', { count: 'estimated' })
        .order('scheduled_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (filters.clinicId) query = query.eq('clinic_id', filters.clinicId)
      if (filters.status) query = query.eq('status', filters.status)
      if (filters.dateFrom) query = query.gte('scheduled_at', filters.dateFrom)
      if (filters.dateTo) query = query.lte('scheduled_at', filters.dateTo)

      const { data, error, count } = await query

      if (error) throw error

      return {
        data: data as unknown as Appointment[],
        count: count ?? 0,
        hasNextPage: (page + 1) * pageSize < (count ?? 0),
        hasPreviousPage: page > 0,
      }
    },
  })

  const createMutation = useMutation({
    mutationFn: async (appointment: {
      patient_id: string
      clinic_id: string
      procedure_id: string
      scheduled_at: string
      duration_minutes: number
      status: AppointmentStatus
      notes?: string
    }) => {
      const { data, error } = await supabase.from('appointments').insert(appointment as never).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase.from('appointments').update(updates as never).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('appointments').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  })

  return {
    appointments: query.data?.data ?? [],
    count: query.data?.count ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.data?.hasNextPage ?? false,
    hasPreviousPage: query.data?.hasPreviousPage ?? false,
    createAppointment: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateAppointment: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteAppointment: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    refetch: query.refetch,
  }
}
