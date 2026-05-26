import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { MedicalRecord, RecordDocument } from '../types'

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const MAX_FILE_SIZE = 50 * 1024 * 1024

export function validateDocumentFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'Tipo de archivo no permitido. Usa PDF, JPEG, PNG, WebP o Word.'
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'El archivo excede el tamaño máximo de 50 MB.'
  }
  return null
}

export function useMedicalRecords(patientId: string | undefined, page: number = 0, pageSize: number = 25) {
  const queryClient = useQueryClient()
  const queryKey = ['medical-records', patientId, page, pageSize]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!patientId) return { data: [], count: 0, hasNextPage: false, hasPreviousPage: false }
      const { data, error, count } = await supabase
        .from('medical_records')
        .select('*, documents:record_documents(*)', { count: 'estimated' })
        .eq('patient_id', patientId)
        .order('record_date', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (error) throw error
      return {
        data: data as unknown as (MedicalRecord & { documents: RecordDocument[] })[],
        count: count ?? 0,
        hasNextPage: (page + 1) * pageSize < (count ?? 0),
        hasPreviousPage: page > 0,
      }
    },
    enabled: !!patientId,
  })

  const createMutation = useMutation({
    mutationFn: async (record: {
      patient_id: string
      chief_complaint: string
      diagnosis?: string
      treatment_plan?: string
      notes?: string
      record_date: string
    }) => {
      const { data, error } = await supabase.from('medical_records').insert(record as never).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['medical-records'] }),
  })

  const deleteRecordMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('medical_records').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['medical-records'] }),
  })

  const uploadDocument = async (
    recordId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<RecordDocument> => {
    const validationError = validateDocumentFile(file)
    if (validationError) throw new Error(validationError)

    const filePath = `${recordId}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('medical-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) throw uploadError
    if (onProgress) onProgress(100)

    const { data: urlData } = await supabase.storage
      .from('medical-documents')
      .createSignedUrl(filePath, 3600)

    const { data, error: dbError } = await supabase
      .from('record_documents')
      .insert({
        medical_record_id: recordId,
        file_name: file.name,
        file_url: urlData?.signedUrl || filePath,
        file_type: file.type,
        file_size_bytes: file.size,
      } as never)
      .select()
      .single()

    if (dbError) throw dbError

    queryClient.invalidateQueries({ queryKey: ['medical-records'] })
    return data as unknown as RecordDocument
  }

  const deleteDocument = async (documentId: string, fileUrl: string) => {
    const { error: storageError } = await supabase.storage
      .from('medical-documents')
      .remove([fileUrl])

    if (storageError) throw storageError

    const { error: dbError } = await supabase
      .from('record_documents')
      .delete()
      .eq('id', documentId)

    if (dbError) throw dbError

    queryClient.invalidateQueries({ queryKey: ['medical-records'] })
  }

  const getDocumentDownloadUrl = async (filePath: string): Promise<string> => {
    const { data } = await supabase.storage
      .from('medical-documents')
      .createSignedUrl(filePath, 3600)

    return data?.signedUrl || filePath
  }

  return {
    records: query.data?.data ?? [],
    count: query.data?.count ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.data?.hasNextPage ?? false,
    hasPreviousPage: query.data?.hasPreviousPage ?? false,
    createRecord: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteRecord: deleteRecordMutation.mutateAsync,
    uploadDocument,
    deleteDocument,
    getDocumentDownloadUrl,
    refetch: query.refetch,
  }
}
