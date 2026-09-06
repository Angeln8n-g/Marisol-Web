import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { PatientClinicalExamination, CreateClinicalExaminationDTO } from '../types'

export function useClinicalExaminations(patientId: string | undefined) {
  const queryClient = useQueryClient()

  const examinationsQuery = useQuery({
    queryKey: ['clinical-examinations', patientId],
    queryFn: async () => {
      if (!patientId) return []
      const { data, error } = await supabase
        .from('patient_clinical_examinations')
        .select('*')
        .eq('patient_id', patientId)
        .order('exam_date', { ascending: false })

      if (error) throw error
      return (data || []) as PatientClinicalExamination[]
    },
    enabled: Boolean(patientId),
  })

  const createMutation = useMutation({
    mutationFn: async (dto: CreateClinicalExaminationDTO) => {
      const { data, error } = await supabase
        .from('patient_clinical_examinations')
        .insert({
          patient_id: dto.patient_id,
          doctor_id: dto.doctor_id,
          doctor_name: dto.doctor_name,
          exam_date: dto.exam_date || new Date().toISOString(),
          chief_complaint: dto.chief_complaint,
          medical_history: dto.medical_history,
          dental_history: dto.dental_history,
          hygiene_habits: dto.hygiene_habits,
          periodontal_evaluation: dto.periodontal_evaluation,
          patient_perception: dto.patient_perception,
          professional_exam: dto.professional_exam,
        } as never)
        .select()
        .single()

      if (error) throw error
      return data as PatientClinicalExamination
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-examinations', patientId] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateClinicalExaminationDTO> }) => {
      const { data: updated, error } = await supabase
        .from('patient_clinical_examinations')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return updated as PatientClinicalExamination
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-examinations', patientId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('patient_clinical_examinations')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-examinations', patientId] })
    },
  })

  return {
    examinations: examinationsQuery.data || [],
    isLoading: examinationsQuery.isLoading,
    error: examinationsQuery.error,
    createExamination: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateExamination: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteExamination: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    refetch: examinationsQuery.refetch,
  }
}
