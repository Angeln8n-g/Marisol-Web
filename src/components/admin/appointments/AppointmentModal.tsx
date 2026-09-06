import React, { useState, useEffect, useMemo } from 'react'
import { Modal } from '../../ui'
import { useAppointments } from '../../../hooks/useAppointments'
import { useClinics } from '../../../hooks/useClinics'
import { useProcedures } from '../../../hooks/useProcedures'
import { usePatients } from '../../../hooks/usePatients'
import { useAppointmentConflicts } from '../../../hooks/useAppointmentConflicts'
import { formatTime } from '../../../lib/utils'
import type { Appointment, AppointmentStatus } from '../../../types'

const safeToIsoString = (val: string | null | undefined): string | null => {
  if (!val) return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

const getLocalDatetimeInputString = (dateStrOrDate: string | Date | null | undefined): string => {
  if (!dateStrOrDate) return ''
  const date = typeof dateStrOrDate === 'string' ? new Date(dateStrOrDate) : dateStrOrDate
  if (isNaN(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)
}

interface AppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  initialDate?: Date | null
  appointmentToEdit?: Appointment | null
  onSaved?: () => void
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  initialDate,
  appointmentToEdit,
  onSaved,
}) => {
  const { createAppointment, updateAppointment, isCreating, isUpdating } = useAppointments()
  const { activeClinics } = useClinics()
  const { procedures } = useProcedures(0, 100)
  const { patients, createPatient, isCreating: isCreatingPatient } = usePatients({ pageSize: 200 })

  const isEditMode = !!appointmentToEdit

  // Form states
  const [patientId, setPatientId] = useState<string>('')
  const [clinicId, setClinicId] = useState<string>('')
  const [procedureId, setProcedureId] = useState<string>('')
  const [scheduledAt, setScheduledAt] = useState<string>('')
  const [durationMinutes, setDurationMinutes] = useState<number>(45)
  const [status, setStatus] = useState<AppointmentStatus>('confirmed')
  const [notes, setNotes] = useState<string>('')

  // Quick patient creation mode
  const [isNewPatient, setIsNewPatient] = useState<boolean>(false)
  const [newPatientName, setNewPatientName] = useState<string>('')
  const [newPatientPhone, setNewPatientPhone] = useState<string>('')
  const [newPatientEmail, setNewPatientEmail] = useState<string>('')

  // Patient search filter
  const [patientSearch, setPatientSearch] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [allowConflictOverride, setAllowConflictOverride] = useState<boolean>(false)

  // Real-time conflict detection with safe ISO conversion
  const safeScheduledAtIso = useMemo(() => safeToIsoString(scheduledAt), [scheduledAt])

  const { conflicts, hasConflict, isLoading: checkingConflicts } = useAppointmentConflicts({
    clinicId: clinicId || null,
    scheduledAt: safeScheduledAtIso,
    durationMinutes,
    excludeAppointmentId: appointmentToEdit?.id,
    enabled: isOpen && !!clinicId && !!safeScheduledAtIso,
  })

  // Initialize or reset form values
  useEffect(() => {
    if (appointmentToEdit) {
      setPatientId(appointmentToEdit.patient_id)
      setClinicId(appointmentToEdit.clinic_id)
      setProcedureId(appointmentToEdit.procedure_id || '')
      setScheduledAt(getLocalDatetimeInputString(appointmentToEdit.scheduled_at))
      setDurationMinutes(appointmentToEdit.duration_minutes || 45)
      setStatus(appointmentToEdit.status)
      setNotes(appointmentToEdit.notes || '')
      setIsNewPatient(false)
    } else {
      // Default to initialDate or next upcoming hour
      const date = initialDate ? new Date(initialDate) : new Date()
      if (!initialDate) {
        date.setHours(date.getHours() + 1, 0, 0, 0)
      }
      setScheduledAt(getLocalDatetimeInputString(date))
      setPatientId('')
      setClinicId(activeClinics[0]?.id || '')
      setProcedureId(procedures[0]?.id || '')
      setDurationMinutes(45)
      setStatus('confirmed')
      setNotes('')
      setIsNewPatient(false)
      setNewPatientName('')
      setNewPatientPhone('')
      setNewPatientEmail('')
    }
    setAllowConflictOverride(false)
    setErrorMessage(null)
  }, [appointmentToEdit, initialDate, isOpen])

  // Automatically update clinicId if empty and clinics are loaded
  useEffect(() => {
    if (!clinicId && activeClinics.length > 0) {
      setClinicId(activeClinics[0].id)
    }
  }, [activeClinics, clinicId])

  // Automatically update procedureId if empty and procedures are loaded
  useEffect(() => {
    if (!procedureId && procedures.length > 0) {
      setProcedureId(procedures[0].id)
    }
  }, [procedureId, procedures])

  // Auto-set duration when procedure changes in create mode
  const handleProcedureChange = (newProcId: string) => {
    setProcedureId(newProcId)
    const proc = procedures.find((p) => p.id === newProcId)
    if (proc) {
      const dur = proc.clinical_duration_minutes || proc.duration_minutes || 45
      setDurationMinutes(dur)
    }
  }

  // Filter patients by search text
  const filteredPatients = patients.filter((p) => {
    if (!patientSearch.trim()) return true
    const q = patientSearch.toLowerCase()
    return (
      p.full_name?.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      p.email?.toLowerCase().includes(q)
    )
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    let finalPatientId = patientId

    // If creating a quick patient
    if (isNewPatient) {
      if (!newPatientName.trim()) {
        setErrorMessage('Por favor ingresa el nombre completo del nuevo paciente.')
        return
      }
      if (!newPatientPhone.trim()) {
        setErrorMessage('Por favor ingresa el teléfono del nuevo paciente.')
        return
      }
      try {
        const created = await createPatient({
          full_name: newPatientName.trim(),
          phone: newPatientPhone.trim(),
          email: newPatientEmail.trim() || undefined,
        }) as unknown as { id: string }
        finalPatientId = created.id
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Error al registrar nuevo paciente')
        return
      }
    } else {
      if (!finalPatientId) {
        setErrorMessage('Por favor selecciona un paciente existente o registra uno nuevo.')
        return
      }
    }

    if (!clinicId) {
      setErrorMessage('Por favor selecciona una clínica.')
      return
    }

    if (!scheduledAt) {
      setErrorMessage('Por favor selecciona fecha y hora para la cita.')
      return
    }

    if (hasConflict && !allowConflictOverride) {
      setErrorMessage('Existe un solapamiento con otra cita en este horario. Por favor selecciona otro horario o marca la casilla para permitir solapamiento.')
      return
    }

    const scheduledIso = safeToIsoString(scheduledAt)
    if (!scheduledIso) {
      setErrorMessage('Por favor selecciona una fecha y hora válidas para la cita.')
      return
    }

    try {

      if (isEditMode && appointmentToEdit) {
        await updateAppointment({
          id: appointmentToEdit.id,
          patient_id: finalPatientId,
          clinic_id: clinicId,
          procedure_id: procedureId || null,
          scheduled_at: scheduledIso,
          duration_minutes: durationMinutes,
          status,
          notes: notes.trim() || null,
        })
      } else {
        await createAppointment({
          patient_id: finalPatientId,
          clinic_id: clinicId,
          procedure_id: procedureId || (procedures[0]?.id as string),
          scheduled_at: scheduledIso,
          duration_minutes: durationMinutes,
          status,
          notes: notes.trim() || undefined,
        })
      }

      onSaved?.()
      onClose()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al guardar la cita.')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Cita' : 'Agendar Nueva Cita'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 font-montserrat">
            {errorMessage}
          </div>
        )}

        {/* Patient Selection or Quick Creation */}
        <div className="bg-sand/20 p-4 rounded-lg border border-gold/30 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-navy font-montserrat flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Paciente *
            </label>
            {!isEditMode && (
              <button
                type="button"
                onClick={() => setIsNewPatient(!isNewPatient)}
                className="text-xs font-semibold text-gold hover:text-gold/80 font-montserrat underline"
              >
                {isNewPatient ? '← Seleccionar paciente existente' : '+ Registrar nuevo paciente'}
              </button>
            )}
          </div>

          {isNewPatient ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  placeholder="ej. Juan Pérez"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono / WhatsApp *</label>
                <input
                  type="tel"
                  value={newPatientPhone}
                  onChange={(e) => setNewPatientPhone(e.target.value)}
                  placeholder="809-555-0123"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={newPatientEmail}
                  onChange={(e) => setNewPatientEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Filtrar por nombre o teléfono de paciente..."
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs font-montserrat focus:outline-none focus:ring-2 focus:ring-gold"
              />
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white"
                required
              >
                <option value="">-- Seleccionar Paciente --</option>
                {filteredPatients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.phone || 'Sin tel.'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Clinic and Procedure Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">
              Sede / Clínica *
            </label>
            <select
              value={clinicId}
              onChange={(e) => setClinicId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white"
              required
            >
              <option value="">Selecciona una clínica</option>
              {activeClinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">
              Procedimiento *
            </label>
            <select
              value={procedureId}
              onChange={(e) => handleProcedureChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white"
              required
            >
              <option value="">Selecciona un procedimiento</option>
              {procedures.map((proc) => (
                <option key={proc.id} value={proc.id}>
                  {proc.name} ({proc.clinical_duration_minutes || proc.duration_minutes || 60} min)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date, Time, Duration and Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">
              Fecha y Hora *
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">
              Duración Estimada (min) *
            </label>
            <input
              type="number"
              min={10}
              max={360}
              step={5}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">
              Estado de la Cita *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white"
            >
              <option value="confirmed">Confirmada</option>
              <option value="pending">Pendiente</option>
              <option value="in_progress">En Sillón / En Curso</option>
              <option value="completed">Completada</option>
              <option value="rescheduled">Reprogramada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
        </div>

        {/* Real-time conflict feedback */}
        {checkingConflicts && (
          <p className="text-xs text-gray-500 font-montserrat animate-pulse">
            Verificando disponibilidad de horario en la sede...
          </p>
        )}

        {hasConflict && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-md space-y-2 font-montserrat">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-xs text-amber-800">
                <span className="font-semibold">Alerta de Solapamiento:</span> Ya existe una o más citas agendadas en ese horario en esta clínica:
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
              <span className="text-xs text-amber-900">
                Permitir solapamiento (la sede cuenta con múltiples sillones o doctores en simultáneo)
              </span>
            </label>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-navy mb-1.5">
            Observaciones o Indicaciones Clínicas
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Alergias conocidas, motivo de consulta, preparaciones previas..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold font-montserrat"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-montserrat"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isCreating || isUpdating || isCreatingPatient}
            className="px-6 py-2 bg-gold text-white font-montserrat font-semibold rounded-md hover:bg-gold/90 transition-colors disabled:opacity-50 shadow-sm"
          >
            {isCreating || isUpdating || isCreatingPatient
              ? 'Guardando Cita...'
              : isEditMode
              ? 'Actualizar Cita'
              : 'Agendar Cita'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
