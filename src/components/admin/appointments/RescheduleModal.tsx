import React, { useState, useEffect } from 'react'
import { Modal } from '../../ui'
import { useAppointments } from '../../../hooks/useAppointments'
import { useAppointmentConflicts } from '../../../hooks/useAppointmentConflicts'
import type { Appointment } from '../../../types'
import { formatDateTime, formatTime } from '../../../lib/utils'

interface RescheduleModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: Appointment | null
  onRescheduled?: () => void
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onRescheduled,
}) => {
  const { updateAppointment, isUpdating } = useAppointments()

  const [newScheduledAt, setNewScheduledAt] = useState<string>('')
  const [durationMinutes, setDurationMinutes] = useState<number>(45)
  const [reason, setReason] = useState<string>('')
  const [allowConflictOverride, setAllowConflictOverride] = useState<boolean>(false)
  const [isSuccess, setIsSuccess] = useState<boolean>(false)
  const [rescheduledDateFormatted, setRescheduledDateFormatted] = useState<string>('')

  // Pre-fill on open
  useEffect(() => {
    if (appointment && isOpen) {
      const date = new Date(appointment.scheduled_at)
      const localIso = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
      setNewScheduledAt(localIso)
      setDurationMinutes(appointment.duration_minutes || 45)
      setReason('')
      setAllowConflictOverride(false)
      setIsSuccess(false)
    }
  }, [appointment, isOpen])

  // Conflict detection hook
  const { conflicts, hasConflict, isLoading: checkingConflicts } = useAppointmentConflicts({
    clinicId: appointment?.clinic_id,
    scheduledAt: newScheduledAt ? new Date(newScheduledAt).toISOString() : null,
    durationMinutes,
    excludeAppointmentId: appointment?.id,
    enabled: isOpen && !!appointment,
  })

  // Date quick-shift helpers
  const handleShiftDays = (days: number) => {
    const base = newScheduledAt ? new Date(newScheduledAt) : new Date()
    base.setDate(base.getDate() + days)
    const localIso = new Date(base.getTime() - base.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    setNewScheduledAt(localIso)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appointment || !newScheduledAt) return

    const isoDate = new Date(newScheduledAt).toISOString()
    const updatedNotes = reason.trim()
      ? `${appointment.notes ? `${appointment.notes}\n` : ''}[Reprogramada: ${reason.trim()}]`
      : appointment.notes

    try {
      await updateAppointment({
        id: appointment.id,
        scheduled_at: isoDate,
        duration_minutes: durationMinutes,
        status: 'rescheduled',
        notes: updatedNotes,
      })

      setRescheduledDateFormatted(formatDateTime(isoDate))
      setIsSuccess(true)
      onRescheduled?.()
    } catch (err) {
      console.error('Error rescheduling appointment:', err)
    }
  }

  const whatsappMessage = appointment && appointment.patient?.phone
    ? encodeURIComponent(
        `Hola ${appointment.patient.full_name}, le confirmamos que su cita odontológica para ${
          appointment.procedure?.name || 'su consulta'
        } en la clínica ${
          appointment.clinic?.name || 'Dra. Marisol García'
        } ha sido reprogramada para el día ${rescheduledDateFormatted || formatDateTime(new Date(newScheduledAt).toISOString())}. Por favor responda 'CONFIRMO' para validar su nuevo turno. ¡Gracias!`
      )
    : ''

  const whatsappUrl = appointment?.patient?.phone
    ? `https://wa.me/${appointment.patient.phone.replace(/\D/g, '')}?text=${whatsappMessage}`
    : null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reprogramar Cita Odontológica"
      size="md"
    >
      {!isSuccess ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current appointment info banner */}
          <div className="bg-sand/30 border border-gold/30 rounded-lg p-3 text-xs font-montserrat space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Paciente:</span>
              <span className="font-semibold text-navy">{appointment?.patient?.full_name || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Procedimiento:</span>
              <span className="font-semibold text-navy">{appointment?.procedure?.name || 'Consulta'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Clínica:</span>
              <span className="font-semibold text-navy">{appointment?.clinic?.name || '—'}</span>
            </div>
            <div className="flex justify-between border-t border-gold/20 pt-1">
              <span className="text-gray-500">Horario actual:</span>
              <span className="font-semibold text-purple-700">
                {appointment ? formatDateTime(appointment.scheduled_at) : '—'}
              </span>
            </div>
          </div>

          {/* Quick Date Presets */}
          <div>
            <label className="block text-xs font-semibold text-navy font-montserrat mb-1.5">
              Accesos rápidos para nueva fecha:
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleShiftDays(1)}
                className="px-2.5 py-1 text-xs font-montserrat font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
              >
                +1 Día
              </button>
              <button
                type="button"
                onClick={() => handleShiftDays(2)}
                className="px-2.5 py-1 text-xs font-montserrat font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
              >
                +2 Días
              </button>
              <button
                type="button"
                onClick={() => handleShiftDays(7)}
                className="px-2.5 py-1 text-xs font-montserrat font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
              >
                +1 Semana
              </button>
              <button
                type="button"
                onClick={() => handleShiftDays(14)}
                className="px-2.5 py-1 text-xs font-montserrat font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
              >
                +2 Semanas
              </button>
            </div>
          </div>

          {/* New Scheduled Date & Time */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-navy font-montserrat mb-1">
                Nueva Fecha y Hora <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={newScheduledAt}
                onChange={(e) => setNewScheduledAt(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gold font-montserrat"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy font-montserrat mb-1">
                Duración (min)
              </label>
              <input
                type="number"
                min={15}
                max={240}
                step={15}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gold font-montserrat"
              />
            </div>
          </div>

          {/* Conflict warning banner */}
          {checkingConflicts && (
            <p className="text-[11px] text-gray-500 font-montserrat animate-pulse">
              Comprobando disponibilidad de sillones...
            </p>
          )}

          {hasConflict && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-md space-y-2">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-xs text-amber-800 font-montserrat">
                  <span className="font-semibold">Atención: Conflicto de horario detectado.</span>
                  <p className="mt-0.5">Ya existen las siguientes citas en ese horario:</p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px]">
                    {conflicts.map((c) => (
                      <li key={c.id}>
                        {c.patient?.full_name || 'Paciente'} ({formatTime(c.scheduled_at)} - {c.procedure?.name || 'Procedimiento'})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <label className="flex items-center gap-2 pt-1 border-t border-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowConflictOverride}
                  onChange={(e) => setAllowConflictOverride(e.target.checked)}
                  className="rounded text-gold focus:ring-gold"
                />
                <span className="text-[11px] text-amber-900 font-montserrat">
                  Permitir solapamiento (la sede cuenta con más de un sillón disponible)
                </span>
              </label>
            </div>
          )}

          {/* Reschedule Reason */}
          <div>
            <label className="block text-xs font-semibold text-navy font-montserrat mb-1">
              Motivo o nota de reprogramación (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Solicitado por el paciente por motivos laborales"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gold font-montserrat"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors font-montserrat"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUpdating || !newScheduledAt || (hasConflict && !allowConflictOverride)}
              className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-md transition-colors font-montserrat flex items-center gap-1.5"
            >
              {isUpdating ? 'Guardando...' : 'Confirmar Reprogramación'}
            </button>
          </div>
        </form>
      ) : (
        /* Success Screen with WhatsApp notification */
        <div className="text-center py-4 space-y-4 font-montserrat">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h4 className="text-base font-semibold text-navy">¡Cita Reprogramada con Éxito!</h4>
            <p className="text-xs text-gray-500 mt-1">
              El nuevo turno ha quedado registrado para el {rescheduledDateFormatted}.
            </p>
          </div>

          {whatsappUrl && (
            <div className="pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                </svg>
                <span>Enviar Notificación por WhatsApp</span>
              </a>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-navy"
            >
              Cerrar ventana
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
