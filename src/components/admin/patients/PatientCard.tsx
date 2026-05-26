import React from 'react'
import type { Patient } from '../../../types'
import { formatDate, getInitials, calculateAge } from '../../../lib/utils'

interface PatientCardProps {
  patient: Patient
  onEdit?: () => void
  onClose?: () => void
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient, onEdit, onClose }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gold/20 text-gold flex items-center justify-center text-lg font-semibold font-montserrat">
            {getInitials(patient.full_name)}
          </div>
          <div>
            <h3 className="font-playfair text-lg text-navy">{patient.full_name}</h3>
            <p className="text-xs text-gray-500 font-montserrat">
              {patient.gender ? (patient.gender === 'male' ? 'Masculino' : patient.gender === 'female' ? 'Femenino' : 'Otro') : '—'}
              {patient.birth_date && ` · ${calculateAge(patient.birth_date)} años`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-gold transition-colors"
              aria-label="Editar paciente"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600" aria-label="Cerrar">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm font-montserrat">
        <div>
          <p className="text-gray-500 text-xs">Teléfono</p>
          <p className="font-medium text-navy">{patient.phone || '—'}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Email</p>
          <p className="font-medium text-navy">{patient.email || '—'}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Fecha de Nacimiento</p>
          <p className="font-medium text-navy">{patient.birth_date ? formatDate(patient.birth_date) : '—'}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Registrado</p>
          <p className="font-medium text-navy">{formatDate(patient.created_at)}</p>
        </div>
      </div>

      {patient.medical_alerts && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200">
          <p className="text-xs font-semibold text-red-700 font-montserrat mb-1">Alertas Médicas</p>
          <p className="text-sm text-red-600 font-montserrat">{patient.medical_alerts}</p>
        </div>
      )}

      <div className="border-t border-gray-100 pt-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-montserrat">Secciones</p>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 text-xs font-montserrat cursor-pointer hover:bg-blue-100 transition-colors">
            Citas
          </span>
          <span className="px-3 py-1.5 rounded-md bg-green-50 text-green-700 text-xs font-montserrat cursor-pointer hover:bg-green-100 transition-colors">
            Historial Médico
          </span>
          <span className="px-3 py-1.5 rounded-md bg-purple-50 text-purple-700 text-xs font-montserrat cursor-pointer hover:bg-purple-100 transition-colors">
            Seguimientos
          </span>
        </div>
      </div>
    </div>
  )
}
