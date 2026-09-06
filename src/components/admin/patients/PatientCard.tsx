import React from 'react'
import { useNavigate } from 'react-router-dom'
import type { Patient } from '../../../types'
import { getInitials, calculateAge } from '../../../lib/utils'

interface PatientCardProps {
  patient: Patient
  onEdit?: () => void
  onClose?: () => void
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient, onEdit, onClose }) => {
  const navigate = useNavigate()

  const cleanPhone = patient.phone.replace(/\D/g, '')
  const whatsappUrl = `https://wa.me/${cleanPhone.length === 10 ? '1' + cleanPhone : cleanPhone}?text=${encodeURIComponent(
    `Estimado(a) ${patient.full_name}, nos comunicamos desde la clínica dental Dra. García para saludarle y dar seguimiento a su atención.`
  )}`

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-lg max-h-[85vh] overflow-y-auto">
      {/* Header del Paciente */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gold/20 text-gold flex items-center justify-center text-lg font-bold font-montserrat shadow-sm">
            {getInitials(patient.full_name)}
          </div>
          <div>
            <h3 className="font-playfair text-xl text-navy font-bold">{patient.full_name}</h3>
            <p className="text-xs text-gray-500 font-montserrat flex items-center gap-1.5">
              <span>{patient.identification_number ? `${patient.identification_type?.toUpperCase()}: ${patient.identification_number}` : 'Sin ID'}</span>
              <span>·</span>
              <span>{patient.gender === 'male' ? 'Masc.' : patient.gender === 'female' ? 'Fem.' : 'Otro'}</span>
              {patient.birth_date && <span>· {calculateAge(patient.birth_date)} años</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-gold transition-colors rounded-md hover:bg-gold/10"
              aria-label="Editar paciente"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Alerta Médica */}
      {patient.medical_alerts && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200">
          <div className="flex items-center gap-2 text-xs font-bold text-red-700 font-montserrat uppercase tracking-wider mb-1">
            <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Alerta Médica Crítica</span>
          </div>
          <p className="text-xs text-red-700 font-montserrat font-medium">{patient.medical_alerts}</p>
        </div>
      )}

      {/* Datos Principales */}
      <div className="grid grid-cols-2 gap-3 text-xs font-montserrat">
        <div className="bg-gray-50 p-2.5 rounded-lg">
          <p className="text-gray-500 text-[11px]">Teléfono Principal</p>
          <p className="font-semibold text-navy mt-0.5">{patient.phone || '—'}</p>
        </div>
        <div className="bg-gray-50 p-2.5 rounded-lg">
          <p className="text-gray-500 text-[11px]">Correo Electrónico</p>
          <p className="font-semibold text-navy mt-0.5 truncate">{patient.email || '—'}</p>
        </div>
        <div className="bg-gray-50 p-2.5 rounded-lg">
          <p className="text-gray-500 text-[11px]">Dirección</p>
          <p className="font-semibold text-navy mt-0.5 truncate">{patient.address || '—'}</p>
        </div>
        <div className="bg-gray-50 p-2.5 rounded-lg">
          <p className="text-gray-500 text-[11px]">Seguro Médico / ARS</p>
          <p className="font-semibold text-navy mt-0.5">{patient.insurance_provider || 'Particular'}</p>
        </div>
      </div>

      {/* Contacto de Emergencia */}
      {patient.emergency_contact_name && (
        <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200/60 text-xs font-montserrat">
          <p className="font-bold text-amber-900 text-[11px] uppercase tracking-wider mb-1">Contacto de Emergencia</p>
          <p className="text-navy font-semibold">
            {patient.emergency_contact_name}{' '}
            {patient.emergency_contact_relationship && (
              <span className="text-gray-500 font-normal">({patient.emergency_contact_relationship})</span>
            )}
          </p>
          {patient.emergency_contact_phone && (
            <p className="text-gray-600 mt-0.5">📞 {patient.emergency_contact_phone}</p>
          )}
        </div>
      )}

      {/* Antecedentes Clínicos Resumen */}
      {patient.medical_history && Object.keys(patient.medical_history).length > 0 && (
        <div className="space-y-1.5 text-xs font-montserrat">
          <p className="font-bold text-gray-700 text-[11px] uppercase tracking-wider">Antecedentes Médicos</p>
          <div className="flex flex-wrap gap-1.5">
            {patient.medical_history.hypertension && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[11px] font-medium">Hipertensión</span>
            )}
            {patient.medical_history.diabetes && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[11px] font-medium">Diabetes</span>
            )}
            {patient.medical_history.allergies_penicillin && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-[11px] font-medium">Alergia Penicilina</span>
            )}
            {patient.medical_history.allergies_latex && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-[11px] font-medium">Alergia Látex</span>
            )}
            {patient.medical_history.heart_disease && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[11px] font-medium">Cardiopatía</span>
            )}
            {patient.medical_history.bruxism && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[11px] font-medium">Bruxismo</span>
            )}
            {patient.medical_history.smoker && (
              <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-[11px] font-medium">Fumador</span>
            )}
          </div>
        </div>
      )}

      {/* Acciones Rápidas */}
      <div className="border-t border-gray-100 pt-4 space-y-2">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider font-montserrat">
          Acciones y Módulos Clínicos
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-montserrat">
          <button
            type="button"
            onClick={() => {
              onClose?.()
              navigate(`/admin/medical-records?patient_id=${patient.id}`)
            }}
            className="w-full px-3 py-2 rounded-lg bg-navy text-gold text-xs font-semibold hover:bg-navy/90 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Ver Historial Médico</span>
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
            </svg>
            <span>Enviar WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  )
}
