import React from 'react'
import { useNavigate } from 'react-router-dom'
import type { Clinic } from '../../../types'

/**
 * AdminLocationList Component
 * 
 * Displays a list of all clinic locations with edit and delete actions.
 * 
 * **Implements: Requirements 1.1, 1.3, 1.4**
 * 
 * Features:
 * - Display all clinics in a table format
 * - Show active/inactive status indicators
 * - Edit and delete actions for each clinic
 * - Add new location button
 */

interface AdminLocationListProps {
  clinics: Clinic[]
  onDelete: (id: string) => void
  onToggleActive: (id: string, currentStatus: boolean) => void
  isLoading?: boolean
}

export const AdminLocationList: React.FC<AdminLocationListProps> = ({
  clinics,
  onDelete,
  onToggleActive,
  isLoading = false,
}) => {
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <svg className="animate-spin h-8 w-8 text-gold" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    )
  }

  if (clinics.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-semibold text-navy font-montserrat">
            No hay clínicas registradas
          </h3>
          <p className="mt-1 text-sm text-gray-500 font-montserrat">
            Comienza agregando una nueva clínica.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/admin/locations/new')}
              className="px-4 py-2 bg-gold text-white text-sm font-semibold rounded-md hover:bg-gold/90 transition-colors"
            >
              + Nueva Clínica
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-navy font-montserrat">
          Clínicas ({clinics.length})
        </h3>
        <button
          onClick={() => navigate('/admin/locations/new')}
          className="px-4 py-2 bg-gold text-white text-sm font-semibold rounded-md hover:bg-gold/90 transition-colors"
        >
          + Nueva Clínica
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Nombre
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Dirección
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Teléfono
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Estado
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clinics.map((clinic) => (
              <tr key={clinic.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-navy">{clinic.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600 max-w-xs truncate">
                    {clinic.address}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">{clinic.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onToggleActive(clinic.id, clinic.is_active)}
                    className="inline-flex items-center"
                  >
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        clinic.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {clinic.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => navigate(`/admin/locations/${clinic.id}/edit`)}
                      className="text-navy hover:text-navy/80 transition-colors"
                      title="Editar"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Estás seguro de eliminar "${clinic.name}"?`)) {
                          onDelete(clinic.id)
                        }
                      }}
                      className="text-red-600 hover:text-red-700 transition-colors"
                      title="Eliminar"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
