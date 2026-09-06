import React, { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale/es'
import { useConsentTemplates, usePatientConsents, useSignConsent } from '../../../hooks/useConsents'
import { useProcedures } from '../../../hooks/useProcedures'
import { useAuth } from '../../../hooks/useAuth'
import type { Patient, SignedConsent } from '../../../types'

interface ConsentManagerProps {
  patient: Patient
}

export const ConsentManager: React.FC<ConsentManagerProps> = ({ patient }) => {
  const { user } = useAuth()
  const { data: templates = [], isLoading: loadingTemplates } = useConsentTemplates()
  const { data: consents = [], isLoading: loadingConsents } = usePatientConsents(patient.id)
  const { procedures } = useProcedures()
  const signConsentMutation = useSignConsent()

  const [showModal, setShowModal] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [selectedProcedureId, setSelectedProcedureId] = useState<string>('')
  const [doctorName, setDoctorName] = useState<string>(user?.full_name ? `Dra. ${user.full_name}` : 'Dra. Marisol García')
  const [clinicName, setClinicName] = useState<string>('Clínica Dental Dra. García - Sede Principal')
  const [renderedText, setRenderedText] = useState<string>('')

  const [viewingConsent, setViewingConsent] = useState<SignedConsent | null>(null)

  // Signature Canvas state
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  // Initialize modal defaults
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id)
    }
  }, [templates, selectedTemplateId])

  // Re-render text when template, doctor or procedure changes
  useEffect(() => {
    const template = templates.find((t) => t.id === selectedTemplateId)
    if (!template) {
      setRenderedText('')
      return
    }

    const procedure = procedures.find((p) => p.id === selectedProcedureId)
    const procName = procedure?.name || 'Procedimiento Odontológico Especializado'
    const todayFormatted = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })
    const patientDoc = patient.identification_number
      ? `${patient.identification_type?.toUpperCase() || 'ID'}: ${patient.identification_number}`
      : 'Documento en trámite'

    let text = template.template_content
    text = text.replace(/\{\{patient_name\}\}/g, patient.full_name)
    text = text.replace(/\{\{patient_id\}\}/g, patientDoc)
    text = text.replace(/\{\{doctor_name\}\}/g, doctorName)
    text = text.replace(/\{\{clinic_name\}\}/g, clinicName)
    text = text.replace(/\{\{procedure_name\}\}/g, procName)
    text = text.replace(/\{\{date\}\}/g, todayFormatted)

    setRenderedText(text)
  }, [selectedTemplateId, selectedProcedureId, doctorName, clinicName, patient, templates, procedures])

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsDrawing(true)
    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#0F172A' // Navy
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const handleSaveConsent = async () => {
    const canvas = canvasRef.current
    const signatureUrl = canvas && hasSignature ? canvas.toDataURL('image/png') : undefined

    await signConsentMutation.mutateAsync({
      patient_id: patient.id,
      procedure_id: selectedProcedureId || undefined,
      doctor_name: doctorName,
      doctor_id: user?.id,
      template_id: selectedTemplateId || undefined,
      content_rendered: renderedText,
      signature_data_url: signatureUrl,
    })

    setShowModal(false)
    clearCanvas()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-playfair font-bold text-navy">
            Consentimientos Informados
          </h3>
          <p className="text-xs text-gray-500 font-montserrat">
            Documentación legal personalizada por doctor y procedimiento
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowModal(true)
            setTimeout(clearCanvas, 100)
          }}
          className="px-3.5 py-1.5 bg-gold text-white text-xs font-semibold rounded-lg hover:bg-gold/90 transition-colors flex items-center gap-1.5 shadow-sm font-montserrat"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Consentimiento
        </button>
      </div>

      {loadingConsents ? (
        <div className="p-8 text-center text-xs text-gray-400 font-montserrat">
          Cargando consentimientos firmados...
        </div>
      ) : consents.length === 0 ? (
        <div className="p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-center">
          <svg className="w-8 h-8 mx-auto text-gray-400 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-xs text-gray-500 font-montserrat">
            No hay consentimientos informados registrados para este paciente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {consents.map((consent) => (
            <div
              key={consent.id}
              className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2 hover:border-gold transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-bold font-montserrat">
                    Firmado
                  </span>
                  <h4 className="text-sm font-bold text-navy font-playfair mt-1">
                    {consent.procedure?.name || 'Procedimiento Odontológico'}
                  </h4>
                  <p className="text-xs text-gray-500 font-montserrat">
                    Tratante: <span className="font-semibold text-navy">{consent.doctor_name}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingConsent(consent)}
                  className="text-gold hover:text-gold/80 text-xs font-montserrat font-medium"
                >
                  Ver Documento
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-400 font-montserrat pt-1 border-t border-gray-100">
                <span>Fecha: {format(new Date(consent.signed_at), 'dd/MM/yyyy hh:mm a')}</span>
                {consent.signature_data_url && <span className="text-navy font-medium">✓ Firma Digital</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para Crear y Firmar Nuevo Consentimiento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-xl font-playfair font-bold text-navy">
                  Emitir Consentimiento Informado
                </h3>
                <p className="text-xs text-gray-500 font-montserrat">
                  Paciente: <strong className="text-navy">{patient.full_name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* Parámetros del Consentimiento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-navy mb-1 font-montserrat">
                  Plantilla de Procedimiento *
                </label>
                {loadingTemplates ? (
                  <div className="h-9 bg-gray-100 animate-pulse rounded" />
                ) : (
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-gold font-montserrat"
                  >
                    {templates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-navy mb-1 font-montserrat">
                  Procedimiento Específico en Catálogo
                </label>
                <select
                  value={selectedProcedureId}
                  onChange={(e) => setSelectedProcedureId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-gold font-montserrat"
                >
                  <option value="">Selecciona procedimiento relacionado</option>
                  {procedures.map((proc) => (
                    <option key={proc.id} value={proc.id}>
                      {proc.name} ({proc.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-navy mb-1 font-montserrat">
                  Nombre del Doctor(a) Tratante *
                </label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="ej. Dra. Marisol García"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-gold font-montserrat"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-navy mb-1 font-montserrat">
                  Sede / Clínica *
                </label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-gold font-montserrat"
                />
              </div>
            </div>

            {/* Vista Previa del Documento */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-navy uppercase tracking-wider font-montserrat">
                Texto Legal Resultante
              </label>
              <div className="p-4 bg-sand/20 rounded-xl border border-gold/30 text-xs font-montserrat text-gray-700 whitespace-pre-line max-h-48 overflow-y-auto leading-relaxed">
                {renderedText || 'Selecciona una plantilla para previsualizar el documento...'}
              </div>
            </div>

            {/* Canvas de Firma Digital */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-navy uppercase tracking-wider font-montserrat">
                  Firma Digital del Paciente o Tutor Legal
                </label>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-xs text-red-600 hover:text-red-700 underline font-montserrat"
                >
                  Limpiar Firma
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={140}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-32 touch-none cursor-crosshair"
                />
              </div>
              <p className="text-[11px] text-gray-400 font-montserrat text-center">
                ✍️ Firma en el recuadro superior usando el ratón o pantalla táctil
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-montserrat text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={signConsentMutation.isPending || !renderedText}
                onClick={handleSaveConsent}
                className="px-6 py-2 bg-gold text-white text-xs font-bold font-montserrat rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50 shadow-md"
              >
                {signConsentMutation.isPending ? 'Registrando...' : 'Firmar y Registrar Consentimiento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Ver Consentimiento Firmado */}
      {viewingConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-gold font-bold font-montserrat">
                  Documento Certificado
                </span>
                <h3 className="text-xl font-playfair font-bold text-navy">
                  Consentimiento Informado Registrado
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingConsent(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 bg-sand/20 rounded-xl border border-gold/30 text-xs font-montserrat text-gray-800 whitespace-pre-line leading-relaxed">
              {viewingConsent.content_rendered}
            </div>

            {viewingConsent.signature_data_url && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center space-y-2">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider font-montserrat">
                  Firma Digital Registrada
                </p>
                <img
                  src={viewingConsent.signature_data_url}
                  alt="Firma del paciente"
                  className="h-20 mx-auto border-b border-gray-300 pb-1"
                />
                <p className="text-[10px] text-gray-400 font-montserrat">
                  Registrado el {format(new Date(viewingConsent.signed_at), "dd/MM/yyyy 'a las' hh:mm a")} · Tratante: {viewingConsent.doctor_name}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-navy text-gold text-xs font-montserrat font-semibold rounded-lg hover:bg-navy/90 flex items-center gap-1.5"
              >
                🖨️ Imprimir Documento
              </button>
              <button
                type="button"
                onClick={() => setViewingConsent(null)}
                className="px-4 py-2 bg-gray-200 text-navy text-xs font-montserrat font-medium rounded-lg hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
