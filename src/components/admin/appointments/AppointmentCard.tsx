import React, { useState } from 'react'
import { Badge } from '../../ui'
import type { Appointment, AppointmentStatus } from '../../../types'
import { formatDateTime } from '../../../lib/utils'
import { ClinicalTrayDispatchModal } from './ClinicalTrayDispatchModal'
import { WhatsAppTemplateModal } from './WhatsAppTemplateModal'
import { MedicalAlertBadge } from '../patients'

interface AppointmentCardProps {
  appointment: Appointment
  onConfirm?: (id: string) => void
  onReschedule?: (id: string) => void
  onCancel?: (id: string) => void
  onEdit?: (appointment: Appointment) => void
  onStatusChange?: (id: string, status: AppointmentStatus) => void
  onDelete?: (id: string) => void
  onClose?: () => void
  onInvoice?: (appointment: Appointment) => void
  onWhatsAppModal?: (appointment: Appointment) => void
  onDispatchTray?: (appointment: Appointment) => void
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onConfirm,
  onReschedule,
  onCancel,
  onEdit,
  onStatusChange,
  onDelete,
  onClose,
  onInvoice,
  onWhatsAppModal,
  onDispatchTray,
}) => {
  const [showTrayModal, setShowTrayModal] = useState(false)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="text-lg font-playfair text-navy font-semibold">Detalle de Cita</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm font-montserrat">
        <div>
          <p className="text-xs text-gray-500">Paciente</p>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <p className="font-semibold text-navy">{appointment.patient?.full_name || '—'}</p>
            <MedicalAlertBadge patient={appointment.patient} />
          </div>
          {appointment.patient?.phone && (
            <p className="text-xs text-gray-500">{appointment.patient.phone}</p>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-500">Estado</p>
          <div className="mt-0.5">
            <Badge status={appointment.status} />
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500">Fecha y Hora</p>
          <p className="font-semibold text-navy mt-0.5">{formatDateTime(appointment.scheduled_at)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Duración Prevista</p>
          <p className="font-semibold text-navy mt-0.5">{appointment.duration_minutes} min</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Clínica / Sede</p>
          <p className="font-medium text-navy mt-0.5">{appointment.clinic?.name || '—'}</p>
          {appointment.clinic?.address && (
            <p className="text-[11px] text-gray-400 truncate">{appointment.clinic.address}</p>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-500">Procedimiento</p>
          <p className="font-medium text-navy mt-0.5">{appointment.procedure?.name || 'Consulta General'}</p>
          {appointment.procedure?.category && (
            <span className="text-[11px] text-gold font-medium">{appointment.procedure.category}</span>
          )}
        </div>
      </div>

      {appointment.notes && (
        <div className="bg-sand/20 p-3 rounded-md border border-gold/20">
          <p className="text-xs font-semibold text-navy font-montserrat mb-1">Notas Clínicas / Instrucciones</p>
          <p className="text-xs text-gray-700 font-montserrat whitespace-pre-wrap">{appointment.notes}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-3 border-t border-gray-100 space-y-2">
        <div className="flex flex-wrap gap-2">
          {appointment.status === 'pending' && (onConfirm || onStatusChange) && (
            <button
              onClick={() => onStatusChange ? onStatusChange(appointment.id, 'confirmed') : onConfirm?.(appointment.id)}
              className="px-3 py-1.5 bg-green-100 text-green-800 text-xs font-semibold rounded-md hover:bg-green-200 transition-colors font-montserrat flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Confirmar Cita
            </button>
          )}

          {appointment.status === 'confirmed' && onStatusChange && (
            <button
              onClick={() => onStatusChange(appointment.id, 'in_progress')}
              className="px-3 py-1.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-md hover:bg-blue-200 transition-colors font-montserrat flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
              Iniciar Atención (En Sillón)
            </button>
          )}

          {appointment.status === 'in_progress' && onStatusChange && (
            <button
              onClick={() => onStatusChange(appointment.id, 'completed')}
              className="px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-md hover:bg-emerald-200 transition-colors font-montserrat flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Marcar como Completada
            </button>
          )}

          {appointment.status === 'completed' && onInvoice && (
            appointment.billing_status === 'billed' || appointment.invoice_id ? (
              <button
                type="button"
                onClick={() => onInvoice(appointment)}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-semibold rounded-md hover:bg-emerald-100 transition-colors font-montserrat flex items-center gap-1 shadow-xs"
                title="Cita ya facturada. Clic para ver o imprimir comprobante fiscal."
              >
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Facturada (Ver Recibo)
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onInvoice(appointment)}
                className="px-3 py-1.5 bg-gold text-white text-xs font-semibold rounded-md hover:bg-gold/90 transition-colors font-montserrat flex items-center gap-1 shadow-xs"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Facturar Cita
              </button>
            )
          )}

          {appointment.patient_id && (
            <a
              href={`/admin/medical-records?patientId=${appointment.patient_id}`}
              className="px-3 py-1.5 bg-sand/40 text-navy text-xs font-semibold rounded-md hover:bg-sand/60 transition-colors font-montserrat flex items-center gap-1 border border-gold/30"
            >
              <svg className="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Historial Clínico
            </a>
          )}

          {appointment.procedure_id && (
            <button
              type="button"
              onClick={() => onDispatchTray ? onDispatchTray(appointment) : setShowTrayModal(true)}
              className="px-3 py-1.5 bg-sand/60 text-navy text-xs font-semibold rounded-md hover:bg-sand transition-colors font-montserrat flex items-center gap-1 border border-gold/40 shadow-2xs"
              title="Despachar materiales e instrumental clínico para esta cita"
            >
              <span className="text-xs">📦</span>
              Bandeja Clínica
            </button>
          )}

          {onEdit && (
            <button
              onClick={() => onEdit(appointment)}
              className="px-3 py-1.5 bg-gold/10 text-gold text-xs font-semibold rounded-md hover:bg-gold/20 transition-colors font-montserrat flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar Cita
            </button>
          )}

          {onReschedule && (
            <button
              onClick={() => onReschedule(appointment.id)}
              className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-md hover:bg-purple-200 transition-colors font-montserrat"
            >
              Reprogramar
            </button>
          )}

          {appointment.status !== 'cancelled' && appointment.status !== 'completed' && onCancel && (
            <button
              onClick={() => {
                if (window.confirm('¿Estás seguro de cancelar esta cita?')) {
                  onCancel(appointment.id)
                }
              }}
              className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-semibold rounded-md hover:bg-red-100 transition-colors font-montserrat"
            >
              Cancelar Cita
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => {
                if (window.confirm('¿Deseas eliminar definitivamente este registro de cita?')) {
                  onDelete(appointment.id)
                }
              }}
              className="px-2.5 py-1.5 text-gray-400 hover:text-red-600 text-xs transition-colors font-montserrat ml-auto"
              title="Eliminar cita"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        {appointment.patient?.phone && (
          <button
            type="button"
            onClick={() => onWhatsAppModal ? onWhatsAppModal(appointment) : setShowWhatsAppModal(true)}
            className="w-full py-2 bg-emerald-600 text-white text-xs font-semibold rounded-md hover:bg-emerald-700 transition-colors font-montserrat flex items-center justify-center gap-1.5 shadow-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
            </svg>
            <span>Plantillas WhatsApp (Recordatorio / Post-Op / Aviso)</span>
          </button>
        )}
      </div>

      {/* Modal Despacho de Bandeja Clínica */}
      <ClinicalTrayDispatchModal
        isOpen={showTrayModal}
        onClose={() => setShowTrayModal(false)}
        appointment={appointment}
      />

      {/* Modal Centro de Plantillas WhatsApp */}
      <WhatsAppTemplateModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        appointment={appointment}
      />
    </div>
  )
}
