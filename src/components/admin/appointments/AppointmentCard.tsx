import React from 'react'
import { Badge } from '../../ui'
import type { Appointment } from '../../../types'
import { formatDateTime } from '../../../lib/utils'

interface AppointmentCardProps {
  appointment: Appointment
  onConfirm?: (id: string) => void
  onReschedule?: (id: string) => void
  onCancel?: (id: string) => void
  onClose?: () => void
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onConfirm,
  onReschedule,
  onCancel,
  onClose,
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-playfair text-navy">Detalle de Cita</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
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
          <p className="text-gray-500">Paciente</p>
          <p className="font-medium text-navy">{appointment.patient?.full_name || '—'}</p>
        </div>
        <div>
          <p className="text-gray-500">Estado</p>
          <Badge status={appointment.status} />
        </div>
        <div>
          <p className="text-gray-500">Fecha y Hora</p>
          <p className="font-medium text-navy">{formatDateTime(appointment.scheduled_at)}</p>
        </div>
        <div>
          <p className="text-gray-500">Duración</p>
          <p className="font-medium text-navy">{appointment.duration_minutes} min</p>
        </div>
        <div>
          <p className="text-gray-500">Clínica</p>
          <p className="font-medium text-navy">{appointment.clinic?.name || '—'}</p>
        </div>
        <div>
          <p className="text-gray-500">Procedimiento</p>
          <p className="font-medium text-navy">{appointment.procedure?.name || '—'}</p>
        </div>
      </div>

      {appointment.notes && (
        <div>
          <p className="text-xs text-gray-500 font-montserrat mb-1">Notas</p>
          <p className="text-sm text-gray-700 font-montserrat">{appointment.notes}</p>
        </div>
      )}

      {(onConfirm || onReschedule || onCancel) && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          {appointment.status === 'pending' && onConfirm && (
            <button
              onClick={() => onConfirm(appointment.id)}
              className="px-4 py-1.5 bg-green-100 text-green-700 text-sm rounded-md hover:bg-green-200 transition-colors font-montserrat"
            >
              Confirmar
            </button>
          )}
          {onReschedule && (
            <button
              onClick={() => onReschedule(appointment.id)}
              className="px-4 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-md hover:bg-blue-200 transition-colors font-montserrat"
            >
              Reprogramar
            </button>
          )}
          {appointment.status !== 'completed' && appointment.status !== 'cancelled' && onCancel && (
            <button
              onClick={() => onCancel(appointment.id)}
              className="px-4 py-1.5 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200 transition-colors font-montserrat"
            >
              Cancelar
            </button>
          )}
        </div>
      )}
    </div>
  )
}
