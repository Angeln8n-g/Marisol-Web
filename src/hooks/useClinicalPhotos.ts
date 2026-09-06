import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { PatientClinicalPhoto, ClinicalPhotoStage, ClinicalPhotoType } from '../types'

export interface ClinicalCaseComparison {
  caseTitle: string
  procedureName?: string
  beforePhoto?: PatientClinicalPhoto
  afterPhoto?: PatientClinicalPhoto
  inProgressPhotos: PatientClinicalPhoto[]
  allPhotos: PatientClinicalPhoto[]
}

export function useClinicalPhotos(patientId?: string) {
  return useQuery({
    queryKey: ['clinical-photos', patientId],
    queryFn: async () => {
      if (!patientId) return []

      const { data, error } = await supabase
        .from('patient_clinical_photos')
        .select(`
          *,
          procedure:procedures(id, name, category)
        `)
        .eq('patient_id', patientId)
        .order('taken_at', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as unknown as PatientClinicalPhoto[]
    },
    enabled: Boolean(patientId),
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Agrupa las fotos del paciente en casos clínicos con pares Antes/Después para el Slider
 */
export function useClinicalCases(patientId?: string) {
  const { data: photos = [], isLoading, isError, refetch } = useClinicalPhotos(patientId)

  const casesMap = new Map<string, ClinicalCaseComparison>()

  for (const photo of photos) {
    const key = photo.case_title || photo.procedure?.name || 'Caso Clínico'
    const existing = casesMap.get(key) || {
      caseTitle: key,
      procedureName: photo.procedure?.name,
      inProgressPhotos: [],
      allPhotos: [],
    }

    existing.allPhotos.push(photo)

    if (photo.stage === 'before' && !existing.beforePhoto) {
      existing.beforePhoto = photo
    } else if (photo.stage === 'after' && !existing.afterPhoto) {
      existing.afterPhoto = photo
    } else if (photo.stage === 'in_progress') {
      existing.inProgressPhotos.push(photo)
    }

    casesMap.set(key, existing)
  }

  const cases = Array.from(casesMap.values())

  return {
    photos,
    cases,
    isLoading,
    isError,
    refetch,
  }
}

export function useClinicalPhotoMutations(patientId?: string) {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['clinical-photos', patientId] })
  }

  const addPhoto = useMutation({
    mutationFn: async (payload: {
      patient_id: string
      procedure_id?: string | null
      case_title: string
      stage: ClinicalPhotoStage
      photo_type: ClinicalPhotoType
      image_url: string
      taken_at?: string
      doctor_notes?: string | null
      consent_for_marketing?: boolean
    }) => {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData?.session?.user?.id || null

      const { data, error } = await supabase
        .from('patient_clinical_photos')
        .insert({
          patient_id: payload.patient_id,
          procedure_id: payload.procedure_id || null,
          case_title: payload.case_title.trim(),
          stage: payload.stage,
          photo_type: payload.photo_type,
          image_url: payload.image_url.trim(),
          taken_at: payload.taken_at || new Date().toISOString().split('T')[0],
          doctor_notes: payload.doctor_notes?.trim() || null,
          consent_for_marketing: payload.consent_for_marketing ?? false,
          created_by: userId,
        } as never)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: invalidate,
  })

  const deletePhoto = useMutation({
    mutationFn: async (photoId: string) => {
      const { data, error } = await supabase
        .from('patient_clinical_photos')
        .delete()
        .eq('id', photoId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: invalidate,
  })

  const updatePhoto = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string
      doctor_notes?: string | null
      consent_for_marketing?: boolean
      case_title?: string
    }) => {
      const { data, error } = await supabase
        .from('patient_clinical_photos')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: invalidate,
  })

  return {
    addPhoto: addPhoto.mutateAsync,
    isAddingPhoto: addPhoto.isPending,
    deletePhoto: deletePhoto.mutateAsync,
    isDeletingPhoto: deletePhoto.isPending,
    updatePhoto: updatePhoto.mutateAsync,
  }
}
