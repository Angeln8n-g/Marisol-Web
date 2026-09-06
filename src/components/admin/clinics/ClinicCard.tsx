import React from 'react'
import type { Clinic } from '../../../types'

interface ClinicCardProps {
  clinic: Clinic
  onEdit?: () => void
  onToggleActive?: () => void
  onDelete?: () => void
}

export const ClinicCard: React.FC<ClinicCardProps> = ({
  clinic,
  onEdit,
  onToggleActive,
  onDelete,
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-playfair text-lg text-navy font-semibold">{clinic.name}</h3>
          <p className="text-xs text-gray-500 font-montserrat mt-0.5">{clinic.address}</p>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            clinic.is_active
              ? 'bg-green-100 text-green-700 border-green-200'
              : 'bg-gray-100 text-gray-500 border-gray-200'
          }`}
        >
          {clinic.is_active ? 'Activa' : 'Inactiva'}
        </span>
      </div>

      <div className="text-sm font-montserrat space-y-1.5">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span className="text-gray-600">{clinic.phone}</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-gray-600">{clinic.whatsapp || '—'}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        {onEdit && (
          <button
            onClick={onEdit}
            className="px-3 py-1.5 text-xs font-semibold text-navy bg-navy/5 hover:bg-navy/10 rounded-md transition-colors"
          >
            Editar
          </button>
        )}
        {onToggleActive && (
          <button
            onClick={onToggleActive}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              clinic.is_active
                ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                : 'text-green-700 bg-green-50 hover:bg-green-100'
            }`}
          >
            {clinic.is_active ? 'Desactivar' : 'Activar'}
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => {
              if (window.confirm(`¿Estás seguro de quitar la sede "${clinic.name}"? Los datos históricos de citas y pacientes serán preservados.`)) {
                onDelete()
              }
            }}
            className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-md transition-colors ml-auto flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Quitar
          </button>
        )}
      </div>
    </div>
  )
}
