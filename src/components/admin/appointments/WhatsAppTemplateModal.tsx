import React, { useState, useEffect } from 'react'
import { Modal } from '../../ui'
import type { Appointment } from '../../../types'
import { formatDateTime } from '../../../lib/utils'

interface WhatsAppTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: Appointment | null
}

type TemplateKey = 'confirmation' | 'reminder_24h' | 'reschedule' | 'post_op' | 'quote'

export const WhatsAppTemplateModal: React.FC<WhatsAppTemplateModalProps> = ({
  isOpen,
  onClose,
  appointment,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>('confirmation')
  const [customMessage, setCustomMessage] = useState<string>('')
  const [copied, setCopied] = useState<boolean>(false)

  const patientName = appointment?.patient?.full_name || 'Estimado/a paciente'
  const clinicName = appointment?.clinic?.name || 'Dra. Marisol García'
  const procedureName = appointment?.procedure?.name || 'su consulta odontológica'
  const formattedDateTime = appointment ? formatDateTime(appointment.scheduled_at) : ''
  const phoneDigits = appointment?.patient?.phone ? appointment.patient.phone.replace(/\D/g, '') : ''

  const getTemplateText = (key: TemplateKey): string => {
    switch (key) {
      case 'confirmation':
        return `Hola ${patientName}, le confirmamos su cita odontológica para ${procedureName} en nuestra sede ${clinicName} el día ${formattedDateTime}. Por favor responda con un 'CONFIRMO' para asegurar su turno. ¡Le esperamos con gusto!`
      case 'reminder_24h':
        return `Hola ${patientName}, le recordamos que tiene programada su cita para ${procedureName} el día ${formattedDateTime} en la clínica ${clinicName}. Le agradecemos llegar 10 minutos antes. En caso de requerir algún cambio, por favor avísenos con antelación.`
      case 'reschedule':
        return `Estimado/a ${patientName}, le informamos que su cita en la clínica ${clinicName} ha sido reprogramada para el día ${formattedDateTime} para ${procedureName}. Si este nuevo horario presenta algún inconveniente, con gusto podemos evaluar otra opción. ¡Gracias por su confianza!`
      case 'post_op':
        return `Estimado/a ${patientName}, esperamos que se encuentre muy bien tras su procedimiento de ${procedureName}. Le recordamos: mantener reposo relativo hoy, no consumir alimentos duros o muy calientes, aplicar frío local si nota inflamación y seguir la medicación pautada. Ante cualquier duda, estamos a su orden.`
      case 'quote':
        return `Hola ${patientName}, un cordial saludo del equipo de Dra. Marisol García. Le informamos que su plan de tratamiento y presupuesto para ${procedureName} ya está preparado y disponible para su revisión. Quedamos atentos para coordinar el inicio de su tratamiento.`
      default:
        return ''
    }
  }

  // Update message when template or appointment changes
  useEffect(() => {
    if (appointment && isOpen) {
      setCustomMessage(getTemplateText(selectedTemplate))
      setCopied(false)
    }
  }, [selectedTemplate, appointment, isOpen])

  const handleTemplateChange = (key: TemplateKey) => {
    setSelectedTemplate(key)
    setCustomMessage(getTemplateText(key))
    setCopied(false)
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(customMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const whatsappUrl = phoneDigits
    ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(customMessage)}`
    : null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Centro de Plantillas WhatsApp"
      size="md"
    >
      <div className="space-y-4 font-montserrat">
        {/* Recipient Info */}
        <div className="flex items-center justify-between bg-sand/30 border border-gold/30 rounded-lg p-3 text-xs">
          <div>
            <p className="text-gray-500">Destinatario:</p>
            <p className="font-semibold text-navy mt-0.5">{patientName}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500">Teléfono:</p>
            <p className="font-semibold text-navy mt-0.5 font-mono">
              {appointment?.patient?.phone || 'Sin teléfono registrado'}
            </p>
          </div>
        </div>

        {/* Template Options */}
        <div>
          <label className="block text-xs font-semibold text-navy mb-2">
            Selecciona el tipo de mensaje:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'confirmation', label: '1. Confirmación' },
              { id: 'reminder_24h', label: '2. Recordatorio 24h' },
              { id: 'reschedule', label: '3. Reprogramada' },
              { id: 'post_op', label: '4. Post-Operatorio' },
              { id: 'quote', label: '5. Presupuesto' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTemplateChange(t.id as TemplateKey)}
                className={`px-3 py-2 text-xs font-medium rounded-md border transition-colors text-left ${
                  selectedTemplate === t.id
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-semibold shadow-xs'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message Editor */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-navy">
              Mensaje a enviar (personalizable antes de despachar):
            </label>
            <button
              type="button"
              onClick={handleCopyToClipboard}
              className="text-xs text-gold hover:text-gold/80 font-medium flex items-center gap-1"
            >
              {copied ? '✓ ¡Texto copiado!' : 'Copiar texto'}
            </button>
          </div>
          <textarea
            rows={5}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 text-gray-800"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Puedes agregar indicaciones personalizadas o ajustar el saludo según lo requiera el paciente.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cerrar
          </button>

          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
              </svg>
              <span>Abrir en WhatsApp</span>
            </a>
          ) : (
            <span className="text-xs text-amber-600 italic">
              El paciente no tiene número de teléfono registrado
            </span>
          )}
        </div>
      </div>
    </Modal>
  )
}
