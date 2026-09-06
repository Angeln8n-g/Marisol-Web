import React, { useState, useEffect, useMemo } from 'react'
import { Modal } from '../../ui'
import type { Appointment, WhatsAppMessageTemplate } from '../../../types'
import {
  useWhatsAppAutomation,
  renderWhatsAppTemplate,
  formatDominicanPhoneForWhatsApp,
  createWhatsAppUrl,
  type WhatsAppTemplateContext,
} from '../../../hooks/useWhatsAppAutomation'

interface WhatsAppTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: Appointment | null
}

export const WhatsAppTemplateModal: React.FC<WhatsAppTemplateModalProps> = ({
  isOpen,
  onClose,
  appointment,
}) => {
  const { templates, recordSentReminder, isRecording } = useWhatsAppAutomation()

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [editableMessage, setEditableMessage] = useState<string>('')
  const [copied, setCopied] = useState<boolean>(false)
  const [sentSuccess, setSentSuccess] = useState<boolean>(false)

  // Contexto dinámico de la cita
  const templateContext: WhatsAppTemplateContext = useMemo(() => {
    if (!appointment) {
      return {
        patientName: 'Paciente',
        procedureName: 'Procedimiento Dental',
      }
    }

    const scheduledDate = new Date(appointment.scheduled_at)
    const formattedDate = !isNaN(scheduledDate.getTime())
      ? scheduledDate.toLocaleDateString('es-DO', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : ''

    const formattedTime = !isNaN(scheduledDate.getTime())
      ? scheduledDate.toLocaleTimeString('es-DO', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      : ''

    return {
      patientName: appointment.patient?.full_name || 'Estimado/a Paciente',
      procedureName: appointment.procedure?.name || 'Consulta Odontológica',
      doctorName: appointment.assigned_doctor || 'Dra. Marisol',
      formattedDate,
      formattedTime,
      clinicName: appointment.clinic?.name || 'Dra. Marisol - Odontología Especializada',
      clinicAddress: appointment.clinic?.address || 'Santo Domingo, R.D.',
      quoteAmount: '0.00',
    }
  }, [appointment])

  // Seleccionar la primera plantilla por defecto al abrir
  useEffect(() => {
    if (isOpen && templates.length > 0) {
      const initialTemplate = templates[0]
      setSelectedTemplateId(initialTemplate.id)
      const rendered = renderWhatsAppTemplate(initialTemplate.body, templateContext)
      setEditableMessage(rendered)
      setCopied(false)
      setSentSuccess(false)
    }
  }, [isOpen, templates, templateContext])

  const handleSelectTemplate = (template: WhatsAppMessageTemplate) => {
    setSelectedTemplateId(template.id)
    const rendered = renderWhatsAppTemplate(template.body, templateContext)
    setEditableMessage(rendered)
    setCopied(false)
    setSentSuccess(false)
  }

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editableMessage)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback
      setCopied(false)
    }
  }

  const handleSendWhatsApp = async () => {
    if (!appointment?.patient?.phone) return

    const sanitizedPhone = formatDominicanPhoneForWhatsApp(appointment.patient.phone)
    const url = createWhatsAppUrl(sanitizedPhone, editableMessage)

    // 1. Abrir en pestaña nueva de WhatsApp
    window.open(url, '_blank', 'noopener,noreferrer')

    // 2. Registrar envío atómico en appointment_reminders y en la cita
    try {
      await recordSentReminder({
        appointment,
        messageContent: editableMessage,
      })
      setSentSuccess(true)
      setTimeout(() => {
        setSentSuccess(false)
      }, 3500)
    } catch (err) {
      console.error('Error logging reminder:', err)
    }
  }

  const phoneDisplay = appointment?.patient?.phone || ''
  const hasPhone = Boolean(phoneDisplay.trim())

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Centro de Automatización WhatsApp"
      size="lg"
    >
      <div className="space-y-4 font-montserrat text-xs">
        {/* Recipient Card */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-sand/30 border border-gold/30 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              💬
            </div>
            <div>
              <p className="font-bold text-navy text-sm">
                {appointment?.patient?.full_name || 'Paciente'}
              </p>
              <p className="text-gray-500 text-[11px]">
                {appointment?.procedure?.name || 'Consulta'} • {templateContext.formattedDate} ({templateContext.formattedTime})
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase text-gray-400 font-semibold block">
              Teléfono WhatsApp
            </span>
            <span
              className={`font-mono text-xs font-bold ${
                hasPhone ? 'text-emerald-700' : 'text-red-500'
              }`}
            >
              {hasPhone ? phoneDisplay : 'Sin teléfono registrado'}
            </span>
            {appointment?.reminder_count ? (
              <span className="text-[10px] text-gray-500 block mt-0.5">
                🔔 {appointment.reminder_count} recordatorio(s) enviado(s)
              </span>
            ) : null}
          </div>
        </div>

        {/* Template Selector Pills */}
        <div>
          <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
            1. Selecciona la Plantilla Odontológica:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {templates.map((tpl) => {
              const isSelected = selectedTemplateId === tpl.id
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950 font-semibold shadow-xs ring-1 ring-emerald-500/20'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50/80'
                  }`}
                >
                  <span className="text-base mt-0.5">
                    {tpl.category === 'appointment_reminder'
                      ? '📅'
                      : tpl.category === 'post_op'
                      ? '🩹'
                      : tpl.category === 'post_op_checkin'
                      ? '👋'
                      : '📋'}
                  </span>
                  <div className="truncate">
                    <p className="text-xs font-bold truncate">{tpl.title}</p>
                    <p className="text-[10px] text-gray-400 truncate">
                      {tpl.procedure_category && tpl.procedure_category !== 'all'
                        ? `Específico: ${tpl.procedure_category}`
                        : 'Para todo procedimiento'}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* WhatsApp Chat Preview & Editor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Editor */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-navy uppercase tracking-wider text-[11px]">
                2. Mensaje Dinámico Personalizable:
              </label>
              <button
                type="button"
                onClick={handleCopyToClipboard}
                className="text-[11px] text-gold hover:text-gold/80 font-bold transition-colors"
              >
                {copied ? '✓ ¡Copiado!' : '📋 Copiar texto'}
              </button>
            </div>
            <textarea
              rows={9}
              value={editableMessage}
              onChange={(e) => setEditableMessage(e.target.value)}
              className="w-full p-3 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 font-sans leading-relaxed resize-none shadow-inner"
              placeholder="Escribe o edita el mensaje..."
            />
            <p className="text-[10px] text-gray-400">
              Puedes editar cualquier parte del texto o añadir indicaciones específicas antes de enviar.
            </p>
          </div>

          {/* Realistic WhatsApp Chat Bubble */}
          <div className="space-y-1.5 flex flex-col">
            <span className="font-bold text-navy uppercase tracking-wider text-[11px]">
              Vista Previa WhatsApp del Paciente:
            </span>
            <div className="flex-1 bg-[#efeae2] p-3.5 rounded-2xl border border-gray-200 shadow-inner flex flex-col justify-start">
              {/* WhatsApp Message Bubble */}
              <div className="bg-[#d9fdd3] text-gray-900 p-3 rounded-2xl rounded-tl-xs shadow-xs max-w-[95%] space-y-1 relative border border-[#c3f7b9]">
                <p className="whitespace-pre-wrap text-[11.5px] leading-relaxed font-sans text-gray-800">
                  {editableMessage}
                </p>
                <div className="flex items-center justify-end gap-1 text-[9px] text-gray-500 pt-1">
                  <span>Ahora</span>
                  <span className="text-emerald-700 font-bold">✓✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Alert Banner */}
        {sentSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <span>✅</span>
            <span>¡Mensaje despachado a WhatsApp y registrado en el historial de la cita con éxito!</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyToClipboard}
              className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold transition-colors"
            >
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>

            {hasPhone ? (
              <button
                type="button"
                disabled={isRecording}
                onClick={handleSendWhatsApp}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                </svg>
                <span>{isRecording ? 'Registrando...' : '1-Clic: Abrir en WhatsApp'}</span>
              </button>
            ) : (
              <span className="text-xs text-amber-600 italic">
                El paciente no tiene teléfono registrado
              </span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
