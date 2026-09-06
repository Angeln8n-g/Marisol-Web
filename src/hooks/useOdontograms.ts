import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { PatientOdontogram, CreateOdontogramDTO } from '../types'

export function useOdontograms(patientId: string | undefined) {
  const queryClient = useQueryClient()

  const odontogramsQuery = useQuery({
    queryKey: ['odontograms', patientId],
    queryFn: async () => {
      if (!patientId) return []
      const { data, error } = await supabase
        .from('patient_odontograms')
        .select('*')
        .eq('patient_id', patientId)
        .order('exam_date', { ascending: false })

      if (error) throw error
      return (data || []) as PatientOdontogram[]
    },
    enabled: Boolean(patientId),
  })

  const createMutation = useMutation({
    mutationFn: async (dto: CreateOdontogramDTO) => {
      const { data, error } = await supabase
        .from('patient_odontograms')
        .insert({
          patient_id: dto.patient_id,
          doctor_id: dto.doctor_id,
          doctor_name: dto.doctor_name,
          title: dto.title || 'Odontograma Inicial',
          dentition_type: dto.dentition_type || 'adult',
          exam_date: dto.exam_date || new Date().toISOString(),
          teeth_data: dto.teeth_data,
          findings_summary: dto.findings_summary || {},
          notes: dto.notes,
        } as never)
        .select()
        .single()

      if (error) throw error
      return data as PatientOdontogram
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['odontograms', patientId] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateOdontogramDTO> }) => {
      const { data: updated, error } = await supabase
        .from('patient_odontograms')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return updated as PatientOdontogram
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['odontograms', patientId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('patient_odontograms')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['odontograms', patientId] })
    },
  })

  return {
    odontograms: odontogramsQuery.data || [],
    isLoading: odontogramsQuery.isLoading,
    error: odontogramsQuery.error,
    createOdontogram: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateOdontogram: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteOdontogram: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    refetch: odontogramsQuery.refetch,
  }
}
