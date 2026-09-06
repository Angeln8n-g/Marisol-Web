import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePatients } from '../../../hooks/usePatients'
import { PatientForm, type PatientFormValues } from './PatientForm'
import { PatientCard } from './PatientCard'
import type { Patient } from '../../../types'

export const PatientList: React.FC = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    patients,
    count,
    isLoading,
    hasNextPage,
    hasPreviousPage,
    createPatient,
    isCreating,
    updatePatient,
    isUpdating,
    refetch,
  } = usePatients({ search: debouncedSearch, page, pageSize: 10 })

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(0)
    const timeout = setTimeout(() => setDebouncedSearch(value), 300)
    return () => clearTimeout(timeout)
  }

  const handleCreate = async (data: PatientFormValues) => {
    setFormError(null)
    try {
      await createPatient(data as Parameters<typeof createPatient>[0])
      setShowForm(false)
      refetch()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Error al crear paciente')
    }
  }

  const handleUpdate = async (data: PatientFormValues) => {
    if (!editingPatient) return
    setFormError(null)
    try {
      await updatePatient({ id: editingPatient.id, ...data })
      setEditingPatient(null)
      setSelectedPatient(null)
      refetch()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Error al actualizar paciente')
    }
  }

  const formErrorDisplay = formError && (
    <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700 font-montserrat" role="alert">
      {formError}
    </div>
  )

  if (showForm) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-playfair text-navy mb-4">Nuevo Paciente</h3>
        {formErrorDisplay}
        <PatientForm onSubmit={handleCreate} isSubmitting={isCreating} onCancel={() => setShowForm(false)} />
      </div>
    )
  }

  if (editingPatient) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-playfair text-navy mb-4">Editar Paciente</h3>
        {formErrorDisplay}
        <PatientForm
          onSubmit={handleUpdate}
          isSubmitting={isUpdating}
          defaultValues={{
            full_name: editingPatient.full_name,
            phone: editingPatient.phone,
            email: editingPatient.email || '',
            birth_date: editingPatient.birth_date || '',
            gender: editingPatient.gender || undefined,
            identification_type: editingPatient.identification_type || 'cedula',
            identification_number: editingPatient.identification_number || '',
            address: editingPatient.address || '',
            city: editingPatient.city || '',
            province: editingPatient.province || '',
            occupation: editingPatient.occupation || '',
            civil_status: editingPatient.civil_status || undefined,
            emergency_contact_name: editingPatient.emergency_contact_name || '',
            emergency_contact_phone: editingPatient.emergency_contact_phone || '',
            emergency_contact_relationship: editingPatient.emergency_contact_relationship || '',
            insurance_provider: editingPatient.insurance_provider || '',
            insurance_card_number: editingPatient.insurance_card_number || '',
            medical_alerts: editingPatient.medical_alerts || '',
            medical_history: editingPatient.medical_history || {},
          }}
          onCancel={() => setEditingPatient(null)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar por nombre, teléfono o email..."
              className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-gold text-white text-sm font-semibold rounded-md hover:bg-gold/90 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo Paciente
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 flex justify-center">
          <svg className="animate-spin h-8 w-8 text-gold" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : patients.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm text-gray-500 font-montserrat mt-3">
            {search ? 'No se encontraron pacientes con ese criterio de búsqueda' : 'No hay pacientes registrados'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Teléfono</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Registrado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {patients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center text-xs font-semibold">
                          {patient.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-navy">{patient.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{patient.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{patient.email || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(patient.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/admin/medical-records?patient_id=${patient.id}`)
                          }}
                          className="text-navy hover:text-gold font-medium flex items-center gap-1"
                          title="Abrir Historial Clínico"
                        >
                          <span>Expediente</span>
                          <span>→</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingPatient(patient) }}
                          className="text-gold hover:text-gold/80 font-medium"
                        >
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-600 font-montserrat">
              {count} paciente{count !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={!hasPreviousPage}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNextPage}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}

      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedPatient(null)} />
          <div className="relative z-10 w-full max-w-lg">
            <PatientCard
              patient={selectedPatient}
              onEdit={() => { setEditingPatient(selectedPatient); setSelectedPatient(null) }}
              onClose={() => setSelectedPatient(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
