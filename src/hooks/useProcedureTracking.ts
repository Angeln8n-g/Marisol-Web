import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { ProcedureTracking } from '../types'

export function generateFollowupAlerts(
  records: ProcedureTracking[],
  daysAhead: number
): ProcedureTracking[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + daysAhead)
  cutoff.setHours(23, 59, 59, 999)

  return records.filter((r) => {
    if (!r.next_followup_date) return false
    if (r.status === 'completed' || r.status === 'cancelled') return false
    if (r.alert_sent) return false

    const followupDate = new Date(r.next_followup_date)
    return followupDate <= cutoff
  })
}

export function useProcedureTracking(patientId?: string) {
  const queryClient = useQueryClient()
  const queryKey = ['procedure-tracking', patientId]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      let dbQuery = supabase
        .from('procedure_tracking')
        .select(`
          id,
          patient_id,
          procedure_id,
          status,
          next_followup_date,
          alert_sent,
          patient:patients(full_name),
          procedure:procedures(name)
        `)
        .not('next_followup_date', 'is', null)
        .in('status', ['scheduled', 'in_progress', 'on_hold'])
        .order('next_followup_date', { ascending: true })
        .limit(200)

      if (patientId) {
        dbQuery = dbQuery.eq('patient_id', patientId)
      }

      const { data, error } = await dbQuery
      if (error) throw error
      return data as unknown as (ProcedureTracking & { patient: { full_name: string }; procedure: { name: string } })[]
    },
  })

  const createMutation = useMutation({
    mutationFn: async (tracking: {
      patient_id: string
      procedure_id: string
      start_date: string
      expected_end_date?: string
      progress_notes?: string
      next_followup_date?: string
    }) => {
      const insertData = { ...tracking, status: 'scheduled' as const }
      const { data, error } = await supabase.from('procedure_tracking').insert(insertData as never).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedure-tracking'] }),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase.from('procedure_tracking').update(updates as never).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedure-tracking'] }),
  })

  const markAlertsSent = async (ids: string[]) => {
    if (ids.length === 0) return
    const { error } = await supabase
      .from('procedure_tracking')
      .update({ alert_sent: true } as never)
      .in('id', ids)
    if (error) throw error
    queryClient.invalidateQueries({ queryKey: ['procedure-tracking'] })
  }

  return {
    records: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    createTracking: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateTracking: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    markAlertsSent,
    refetch: query.refetch,
  }
}
