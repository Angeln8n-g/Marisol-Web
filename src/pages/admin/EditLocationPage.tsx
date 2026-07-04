import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useClinicLocations } from '../../hooks/useClinicLocations'
import { useUpdateClinic } from '../../hooks/useClinicMutations'
import { LocationManagerForm } from '../../components/admin/clinics'
import type { UpdateClinicDTO } from '../../types'

/**
 * EditLocationPage Component
 * 
 * Admin page for editing an existing clinic location.
 * 
 * **Implements: Requirements 1.1, 1.3**
 * 
 * Features:
 * - Form pre-filled with existing clinic data
 * - Validation with Zod schema
 * - Success/error handling
 * - Navigation after successful update
 */

export const EditLocationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: clinics = [], isLoading } = useClinicLocations({ includeInactive: true })
  const { mutateAsync: updateClinic, isPending } = useUpdateClinic()
  const [error, setError] = useState<string>('')

  const clinic = clinics.find((c) => c.id === id)

  const handleSubmit = async (data: UpdateClinicDTO) => {
    if (!id) return

    try {
      setError('')
      await updateClinic({ id, data })
      navigate('/admin/locations', { 
        state: { 
          notification: { 
            type: 'success', 
            message: 'Clínica actualizada correctamente' 
          } 
        } 
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la clínica')
    }
  }

  const handleCancel = () => {
    navigate('/admin/locations')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-8 w-8 text-gold" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  if (!clinic) {
    return (
      <div className="max-w-4xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-red-900">Clínica no encontrada</h3>
              <p className="text-sm text-red-700 mt-1">La clínica que buscas no existe o fue eliminada.</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-white border border-red-300 text-red-700 text-sm font-semibold rounded-md hover:bg-red-50 transition-colors"
            >
              Volver a la lista
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={handleCancel}
            className="text-gray-600 hover:text-navy transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-playfair text-navy">Editar Clínica</h1>
        </div>
        <p className="text-sm text-gray-600 font-montserrat">
          Actualiza la información de {clinic.name}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200 text-sm text-red-700 font-montserrat" role="alert">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <LocationManagerForm
          clinic={clinic}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isPending}
        />
      </div>
    </div>
  )
}
