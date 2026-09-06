import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { PatientPeriodontogram, CreatePeriodontogramDTO } from '../types'

export function usePeriodontograms(patientId: string | undefined) {
  const queryClient = useQueryClient()

  const periodontogramsQuery = useQuery({
    queryKey: ['periodontograms', patientId],
    queryFn: async () => {
      if (!patientId) return []
      const { data, error } = await supabase
        .from('patient_periodontograms')
        .select('*')
        .eq('patient_id', patientId)
        .order('exam_date', { ascending: false })

      if (error) throw error
      return (data || []) as PatientPeriodontogram[]
    },
    enabled: Boolean(patientId),
  })

  const createMutation = useMutation({
    mutationFn: async (dto: CreatePeriodontogramDTO) => {
      const { data, error } = await supabase
        .from('patient_periodontograms')
        .insert({
          patient_id: dto.patient_id,
          doctor_id: dto.doctor_id,
          doctor_name: dto.doctor_name,
          title: dto.title || 'Periodontograma Inicial',
          exam_date: dto.exam_date || new Date().toISOString(),
          teeth_data: dto.teeth_data,
          summary_stats: dto.summary_stats,
          notes: dto.notes,
        } as never)
        .select()
        .single()

      if (error) throw error
      return data as PatientPeriodontogram
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodontograms', patientId] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreatePeriodontogramDTO> }) => {
      const { data: updated, error } = await supabase
        .from('patient_periodontograms')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return updated as PatientPeriodontogram
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodontograms', patientId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('patient_periodontograms')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodontograms', patientId] })
    },
  })

  return {
    periodontograms: periodontogramsQuery.data || [],
    isLoading: periodontogramsQuery.isLoading,
    error: periodontogramsQuery.error,
    createPeriodontogram: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updatePeriodontogram: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deletePeriodontogram: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    refetch: periodontogramsQuery.refetch,
  }
}
