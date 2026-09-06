import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useMedicalRecords } from '../../hooks/useMedicalRecords'
import { MedicalRecordView, MedicalRecordForm, type MedicalRecordFormValues } from '../../components/admin/medical-records'
import { ConsentManager } from '../../components/admin/medical-records/ConsentManager'
import type { Patient } from '../../types'

export const MedicalRecordsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const patientIdFromParams = searchParams.get('patient_id') || undefined

  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(patientIdFromParams)
  const [activeTab, setActiveTab] = useState<'records' | 'consents'>('records')
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [uploadingRecordId, setUploadingRecordId] = useState<string | null>(null)

  const [patientSearch, setPatientSearch] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 25

  useEffect(() => {
    if (patientIdFromParams) {
      setSelectedPatientId(patientIdFromParams)
    }
  }, [patientIdFromParams])

  // Fetch patient details
  const { data: patient } = useQuery({
    queryKey: ['patient-detail', selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return null
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', selectedPatientId)
        .single()
      if (error) return null
      return data as Patient
    },
    enabled: Boolean(selectedPatientId),
  })

  // Quick patients search list
  const { data: patientOptions = [] } = useQuery({
    queryKey: ['patients-quick-search', patientSearch],
    queryFn: async () => {
      let query = supabase.from('patients').select('id, full_name, phone, identification_number').order('full_name').limit(10)
      if (patientSearch.trim()) {
        query = query.ilike('full_name', `%${patientSearch.trim()}%`)
      }
      const { data } = await query
      return (data || []) as Patient[]
    },
  })

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

  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id)
    setSearchParams({ patient_id: id })
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-playfair text-navy font-bold">Historial Clínico de Pacientes</h1>
          <p className="text-sm text-gray-600 font-montserrat mt-0.5">
            Evolución médica, odontológica y consentimientos legales por doctor
          </p>
        </div>

        {/* Selector Rápido de Paciente con Filtro */}
        <div className="w-full sm:w-80 flex flex-col gap-1.5">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-montserrat text-navy focus:outline-none focus:ring-1 focus:ring-gold"
          />
          <select
            value={selectedPatientId || ''}
            onChange={(e) => handleSelectPatient(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-montserrat text-navy focus:outline-none focus:ring-2 focus:ring-gold"
          >
            <option value="">Seleccionar paciente ({patientOptions.length})...</option>
            {patientOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name} {p.identification_number ? `(${p.identification_number})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedPatientId ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-sand/30 flex items-center justify-center text-gold">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-playfair font-semibold text-navy">Selecciona un Paciente</h3>
          <p className="text-sm text-gray-500 font-montserrat max-w-md mx-auto">
            Elige un paciente en el selector superior o desde el módulo de Pacientes para revisar su historial y consentimientos.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Tarjeta de Resumen del Paciente Activo */}
          {patient && (
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gold/20 text-gold font-bold flex items-center justify-center font-montserrat">
                  {patient.full_name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-playfair font-bold text-navy">{patient.full_name}</h2>
                  <p className="text-xs text-gray-500 font-montserrat">
                    Tel: {patient.phone} · ID: {patient.identification_number || 'Sin cédula'} · ARS: {patient.insurance_provider || 'Particular'}
                  </p>
                </div>
              </div>

              {patient.medical_alerts && (
                <div className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-montserrat font-medium flex items-center gap-1.5">
                  <span>⚠️ {patient.medical_alerts}</span>
                </div>
              )}
            </div>
          )}

          {/* Selector de Pestañas: Evolución Clínica vs. Consentimientos */}
          <div className="flex border-b border-gray-200 gap-2 font-montserrat">
            <button
              type="button"
              onClick={() => setActiveTab('records')}
              className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'records'
                  ? 'border-gold text-navy font-bold'
                  : 'border-transparent text-gray-500 hover:text-navy'
              }`}
            >
              Evolución y Diagnósticos ({records.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('consents')}
              className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'consents'
                  ? 'border-gold text-navy font-bold'
                  : 'border-transparent text-gray-500 hover:text-navy'
              }`}
            >
              Consentimientos Informados
            </button>
          </div>

          {/* Contenido según pestaña */}
          {activeTab === 'records' && (
            <div className="space-y-4">
              <div className="flex items-center justify-end">
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="px-4 py-2 bg-gold text-white text-xs font-semibold rounded-lg hover:bg-gold/90 transition-colors flex items-center gap-1.5 shadow-sm font-montserrat"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm ? 'M6 18L18 6M6 6l12 12' : 'M12 6v6m0 0v6m0-6h6m-6 0H6'} />
                  </svg>
                  {showForm ? 'Cancelar' : 'Nueva Nota de Evolución'}
                </button>
              </div>

              {showForm && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-base font-playfair text-navy font-bold mb-4">Nueva Nota Clínica</h3>
                  {formError && (
                    <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 font-montserrat" role="alert">
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

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-gray-500 font-montserrat">
                  {records.length} registro{records.length !== 1 ? 's' : ''} clínicos
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={!hasPreviousPage}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 font-montserrat"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasNextPage}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 font-montserrat"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'consents' && patient && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <ConsentManager patient={patient} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
