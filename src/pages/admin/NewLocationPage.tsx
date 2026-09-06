import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateClinic } from '../../hooks/useClinicMutations'
import { LocationManagerForm } from '../../components/admin/clinics'
import type { CreateClinicDTO, UpdateClinicDTO } from '../../types'

/**
 * NewLocationPage Component
 * 
 * Admin page for creating a new clinic location.
 * 
 * **Implements: Requirements 1.1, 1.2**
 * 
 * Features:
 * - Form for creating new clinic location
 * - Validation with Zod schema
 * - Success/error handling
 * - Navigation after successful creation
 */

export const NewLocationPage: React.FC = () => {
  const navigate = useNavigate()
  const { mutateAsync: createClinic, isPending } = useCreateClinic()
  const [error, setError] = useState<string>('')

  const handleSubmit = async (data: CreateClinicDTO | UpdateClinicDTO) => {
    try {
      setError('')
      await createClinic(data as CreateClinicDTO)
      navigate('/admin/clinics', { 
        state: { 
          notification: { 
            type: 'success', 
            message: 'Clínica creada correctamente' 
          } 
        } 
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la clínica')
    }
  }

  const handleCancel = () => {
    navigate('/admin/clinics')
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
          <h1 className="text-2xl font-playfair text-navy">Nueva Clínica</h1>
        </div>
        <p className="text-sm text-gray-600 font-montserrat">
          Completa la información para agregar una nueva sede
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
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isPending}
        />
      </div>
    </div>
  )
}
