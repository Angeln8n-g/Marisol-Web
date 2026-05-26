import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMedicalRecords } from '../../hooks/useMedicalRecords'
import { MedicalRecordView, MedicalRecordForm, type MedicalRecordFormValues } from '../../components/admin/medical-records'

export const MedicalRecordsPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const patientIdFromParams = searchParams.get('patient_id') || undefined

  const [selectedPatientId] = useState<string | undefined>(patientIdFromParams)
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [uploadingRecordId, setUploadingRecordId] = useState<string | null>(null)

  const [page, setPage] = useState(0)
  const pageSize = 25

  const {
    records,
    isLoading,
    createRecord,
    isCreating,
    uploadDocument,
    deleteDocument,
    refetch,
    hasNextPage,
    hasPreviousPage,
  } = useMedicalRecords(selectedPatientId, page, pageSize)

  const handleCreateRecord = async (data: MedicalRecordFormValues) => {
    if (!selectedPatientId) return
    setFormError(null)
    try {
      await createRecord({
        patient_id: selectedPatientId,
        ...data,
      })
      setShowForm(false)
      refetch()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Error al crear registro')
    }
  }

  const handleUploadDocument = async (recordId: string, file: File) => {
    setUploadingRecordId(recordId)
    try {
      await uploadDocument(recordId, file)
    } finally {
      setUploadingRecordId(null)
    }
  }

  const handleDeleteDocument = async (documentId: string, fileUrl: string) => {
    await deleteDocument(documentId, fileUrl)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-playfair text-navy">Historiales Médicos</h1>
          <p className="text-sm text-gray-600 font-montserrat mt-1">
            Consulta y gestiona los registros médicos de los pacientes
          </p>
        </div>
      </div>

      {!selectedPatientId ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm text-gray-500 font-montserrat mt-3">
            Selecciona un paciente desde el módulo de pacientes para ver su historial médico.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-end">
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-gold text-white text-sm font-semibold rounded-md hover:bg-gold/90 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm ? 'M6 18L18 6M6 6l12 12' : 'M12 6v6m0 0v6m0-6h6m-6 0H6'} />
              </svg>
              {showForm ? 'Cancelar' : 'Nuevo Registro'}
            </button>
          </div>

          {showForm && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-playfair text-navy mb-4">Nuevo Registro Médico</h3>
              {formError && (
                <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700 font-montserrat" role="alert">
                  {formError}
                </div>
              )}
              <MedicalRecordForm onSubmit={handleCreateRecord} isSubmitting={isCreating} onCancel={() => setShowForm(false)} />
            </div>
          )}

          <MedicalRecordView
            records={records}
            isLoading={isLoading}
            onUploadDocument={handleUploadDocument}
            onDeleteDocument={handleDeleteDocument}
            isUploading={!!uploadingRecordId}
          />
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-gray-500 font-montserrat">
              {records.length} registro{records.length !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={!hasPreviousPage}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-montserrat"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNextPage}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-montserrat"
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
