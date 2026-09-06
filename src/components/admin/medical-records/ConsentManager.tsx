import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale/es'
import { useConsentTemplates, usePatientConsents, useSignConsent } from '../../../hooks/useConsents'
import { useProcedures } from '../../../hooks/useProcedures'
import { useAuth } from '../../../hooks/useAuth'
import { openConsentPrintWindow } from '../../../lib/consentPrintUtils'
import type { Patient, SignedConsent, ConsentTemplate } from '../../../types'

interface ConsentManagerProps {
  patient: Patient
}

const CATEGORY_NAMES: Record<string, { label: string; icon: string; badgeClass: string }> = {
  ingreso_general: {
    label: 'Ingreso & Admisión',
    icon: '📋',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  periodoncia_implantes: {
    label: 'Periodoncia e Implantes',
    icon: '🦷',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  estetica_ortodoncia: {
    label: 'Estética & Ortodoncia',
    icon: '💎',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  endodoncia_prevencion: {
    label: 'Endodoncia & Prevención',
    icon: '🔬',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
}

export const ConsentManager: React.FC<ConsentManagerProps> = ({ patient }) => {
  const { user } = useAuth()
  const { data: templates = [], isLoading: loadingTemplates } = useConsentTemplates()
  const { data: consents = [], isLoading: loadingConsents } = usePatientConsents(patient.id)
  const { procedures } = useProcedures()
  const signConsentMutation = useSignConsent()

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [selectedProcedureId, setSelectedProcedureId] = useState<string>('')
  const [doctorName, setDoctorName] = useState<string>('Dra. Marisol García')
  const doctorTitle = 'Estomatóloga · Periodoncia e Implantes Dentales'
  const [doctorExequatur, setDoctorExequatur] = useState<string>('4521-18')
  const clinicName = 'Clínica Odontológica Dra. Marisol García'

  // Dynamic fields
  const [treatmentZone, setTreatmentZone] = useState<string>('')
  const [toothNumber, setToothNumber] = useState<string>('')
  const [isGuardian, setIsGuardian] = useState(false)
  const [signerRole, setSignerRole] = useState<'patient' | 'guardian' | 'representative'>('patient')
  const [signerName, setSignerName] = useState<string>('')
  const [signerIdDoc, setSignerIdDoc] = useState<string>('')

  // Filter for listed consents
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Rendered preview
  const [renderedText, setRenderedText] = useState<string>('')
  const [viewingConsent, setViewingConsent] = useState<SignedConsent | null>(null)

  // Signature Canvas state & calibration
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [strokeHistory, setStrokeHistory] = useState<ImageData[]>([])
  const [strokeCount, setStrokeCount] = useState<number>(0)
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null)
  const [strokeWidth, setStrokeWidth] = useState<number>(2.4)
  const [strokeColor, setStrokeColor] = useState<string>('#0F172A')
  const [dprValue, setDprValue] = useState<number>(1)

  // Selected template object
  const currentTemplate: ConsentTemplate | undefined = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId)
  }, [templates, selectedTemplateId])

  // Needs specific inputs?
  const requiresTreatmentZone = useMemo(() => {
    if (!currentTemplate) return false
    return (
      currentTemplate.required_fields?.includes('treatment_zone') ||
      currentTemplate.template_content.includes('{{treatment_zone}}')
    )
  }, [currentTemplate])

  const requiresToothNumber = useMemo(() => {
    if (!currentTemplate) return false
    return (
      currentTemplate.required_fields?.includes('tooth_number') ||
      currentTemplate.template_content.includes('{{tooth_number}}')
    )
  }, [currentTemplate])

  // Initialize modal defaults
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id)
    }
  }, [templates, selectedTemplateId])

  // Update Doctor Name if user profile has full name
  useEffect(() => {
    if (user?.full_name && !user.full_name.toLowerCase().includes('admin')) {
      setDoctorName(`Dra. ${user.full_name}`)
    }
  }, [user])

  // Re-render text when inputs change
  useEffect(() => {
    if (!currentTemplate) {
      setRenderedText('')
      return
    }

    const procedure = procedures.find((p) => p.id === selectedProcedureId)
    const procName = procedure?.name || 'Procedimiento Odontológico Especializado'
    const todayFormatted = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })
    const patientDoc = patient.identification_number
      ? `${patient.identification_type?.toUpperCase() || 'Cédula'}: ${patient.identification_number}`
      : 'Documento en trámite'

    let text = currentTemplate.template_content

    // Standard Replacements
    text = text.replace(/\{\{patient_name\}\}/g, isGuardian && signerName ? `${patient.full_name} (representado por ${signerName})` : patient.full_name)
    text = text.replace(/\{\{patient_id\}\}/g, isGuardian && signerIdDoc ? `${patientDoc} / Tutor Doc: ${signerIdDoc}` : patientDoc)
    text = text.replace(/\{\{doctor_name\}\}/g, doctorName)
    text = text.replace(/\{\{doctor_exequatur\}\}/g, doctorExequatur)
    text = text.replace(/\{\{clinic_name\}\}/g, clinicName)
    text = text.replace(/\{\{procedure_name\}\}/g, procName)
    text = text.replace(/\{\{date\}\}/g, todayFormatted)

    // Dynamic Clinical Replacements
    text = text.replace(/\{\{treatment_zone\}\}/g, treatmentZone.trim() || '____________________')
    text = text.replace(/\{\{tooth_number\}\}/g, toothNumber.trim() || '_____')

    setRenderedText(text)
  }, [
    currentTemplate,
    selectedProcedureId,
    doctorName,
    doctorExequatur,
    clinicName,
    patient,
    procedures,
    treatmentZone,
    toothNumber,
    isGuardian,
    signerName,
    signerIdDoc,
  ])

  // Calibrate and size canvas for 1:1 High-DPI displays (Retina, iPads, Surface, 4K)
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    const dpr = window.devicePixelRatio || 1
    setDprValue(dpr)

    const targetW = Math.round(rect.width * dpr)
    const targetH = Math.round(rect.height * dpr)

    if (canvas.width !== targetW || canvas.height !== targetH) {
      let tempCanvas: HTMLCanvasElement | null = null
      if (canvas.width > 0 && canvas.height > 0) {
        tempCanvas = document.createElement('canvas')
        tempCanvas.width = canvas.width
        tempCanvas.height = canvas.height
        const tempCtx = tempCanvas.getContext('2d')
        if (tempCtx) {
          tempCtx.drawImage(canvas, 0, 0)
        }
      }

      canvas.width = targetW
      canvas.height = targetH

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.lineWidth = strokeWidth
        ctx.strokeStyle = strokeColor

        if (tempCanvas && tempCanvas.width > 0 && tempCanvas.height > 0) {
          ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height)
        }
      }
    }
  }, [strokeWidth, strokeColor])

  // ResizeObserver to recalibrate immediately when modal opens or viewport adjusts
  useEffect(() => {
    if (!showModal) return

    const timer = setTimeout(() => {
      setupCanvas()
    }, 100)

    const canvas = canvasRef.current
    if (!canvas) return () => clearTimeout(timer)

    const observer = new ResizeObserver(() => {
      setupCanvas()
    })
    observer.observe(canvas)

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [showModal, setupCanvas])

  // Precise 1:1 canvas coordinates
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Ignored if unsupported
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Save snapshot for undo
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setStrokeHistory((prev) => [...prev, snapshot])

    const coords = getCanvasCoords(e)
    setIsDrawing(true)
    setLastPoint(coords)

    ctx.beginPath()
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = strokeWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Draw single dot on tap
    ctx.arc(coords.x, coords.y, strokeWidth / 2, 0, Math.PI * 2)
    ctx.fillStyle = strokeColor
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(coords.x, coords.y)

    setHasSignature(true)
    setStrokeCount((c) => c + 1)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    e.preventDefault()

    const canvas = canvasRef.current
    if (!canvas || !lastPoint) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const currentPoint = getCanvasCoords(e)

    // Midpoint quadratic interpolation for silky-smooth handwriting
    const midPoint = {
      x: (lastPoint.x + currentPoint.x) / 2,
      y: (lastPoint.y + currentPoint.y) / 2,
    }

    ctx.beginPath()
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = strokeWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.moveTo(lastPoint.x, lastPoint.y)
    ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, midPoint.x, midPoint.y)
    ctx.lineTo(currentPoint.x, currentPoint.y)
    ctx.stroke()

    setLastPoint(currentPoint)
    setHasSignature(true)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    e.preventDefault()
    setIsDrawing(false)
    setLastPoint(null)

    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // Ignored
    }
  }

  const handleUndo = () => {
    const canvas = canvasRef.current
    if (!canvas || strokeHistory.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const lastSnapshot = strokeHistory[strokeHistory.length - 1]
    ctx.putImageData(lastSnapshot, 0, 0)
    setStrokeHistory((prev) => prev.slice(0, prev.length - 1))
    setStrokeCount((c) => Math.max(0, c - 1))

    if (strokeHistory.length <= 1) {
      setHasSignature(false)
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setStrokeHistory([])
    setHasSignature(false)
    setLastPoint(null)
    setStrokeCount(0)
  }

  // Handle saving digital consent
  const handleSaveConsent = async () => {
    const canvas = canvasRef.current
    const signatureUrl = canvas && hasSignature ? canvas.toDataURL('image/png') : undefined

    await signConsentMutation.mutateAsync({
      patient_id: patient.id,
      procedure_id: selectedProcedureId || undefined,
      doctor_name: doctorName,
      doctor_id: user?.id,
      doctor_exequatur: doctorExequatur,
      template_id: selectedTemplateId || undefined,
      content_rendered: renderedText,
      signature_data_url: signatureUrl,
      signer_role: isGuardian ? signerRole : 'patient',
      signer_name: isGuardian ? signerName : undefined,
      signer_id_doc: isGuardian ? signerIdDoc : undefined,
      metadata: {
        treatment_zone: treatmentZone || undefined,
        tooth_number: toothNumber || undefined,
        clinic_name: clinicName,
        template_title: currentTemplate?.title,
      },
    })

    setShowModal(false)
    clearCanvas()
  }

  // Print blank document for physical signature
  const handlePrintBlank = () => {
    if (!currentTemplate) return

    openConsentPrintWindow({
      title: currentTemplate.title,
      contentRendered: renderedText,
      patientName: patient.full_name,
      patientIdDoc: patient.identification_number
        ? `${patient.identification_type?.toUpperCase() || 'Cédula'}: ${patient.identification_number}`
        : '____________________',
      patientPhone: patient.phone || '',
      doctorName,
      doctorTitle,
      doctorExequatur,
      clinicName,
      treatmentZone: treatmentZone || undefined,
      toothNumber: toothNumber || undefined,
      signerRole: isGuardian ? signerRole : 'patient',
      signerName: isGuardian ? signerName : undefined,
      signerIdDoc: isGuardian ? signerIdDoc : undefined,
      isBlankForManualSign: true,
    })
  }

  // Print existing signed consent
  const handlePrintExistingConsent = (consent: SignedConsent) => {
    openConsentPrintWindow({
      title: consent.template?.title || consent.procedure?.name || 'Consentimiento Informado Odontológico',
      contentRendered: consent.content_rendered,
      signedAt: consent.signed_at,
      patientName: patient.full_name,
      patientIdDoc: patient.identification_number
        ? `${patient.identification_type?.toUpperCase() || 'Cédula'}: ${patient.identification_number}`
        : '',
      patientPhone: patient.phone || '',
      doctorName: consent.doctor_name || 'Dra. Marisol García',
      doctorExequatur: consent.doctor_exequatur || '4521-18',
      signatureDataUrl: consent.signature_data_url,
      signerRole: consent.signer_role || 'patient',
      signerName: consent.signer_name || undefined,
      signerIdDoc: consent.signer_id_doc || undefined,
      procedureName: consent.procedure?.name,
      treatmentZone: consent.metadata?.treatment_zone,
      toothNumber: consent.metadata?.tooth_number,
      isBlankForManualSign: false,
    })
  }

  // Filtered consents
  const filteredConsents = useMemo(() => {
    if (categoryFilter === 'all') return consents
    return consents.filter((c) => c.template?.category === categoryFilter)
  }, [consents, categoryFilter])

  // Group templates by category for modal
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, ConsentTemplate[]> = {}
    templates.forEach((tpl) => {
      const cat = tpl.category || 'general'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(tpl)
    })
    return groups
  }, [templates])

  return (
    <div className="space-y-5 font-montserrat">
      {/* Header y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-playfair font-bold text-navy">
              Consentimientos Informados Oficiales
            </h3>
            <span className="text-[10px] bg-gold/15 text-gold border border-gold/40 px-2 py-0.5 rounded-full font-bold">
              10 Modelos Clínicos
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Documentación médico-legal membretada para <strong className="text-navy">Dra. Marisol García – Estomatóloga</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowModal(true)
            setTimeout(clearCanvas, 150)
          }}
          className="px-4 py-2 bg-gold hover:bg-gold/90 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Consentimiento
        </button>
      </div>

      {/* Filtros de Categorías */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
            categoryFilter === 'all'
              ? 'bg-navy text-white border-navy shadow-xs'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          Todos ({consents.length})
        </button>
        {Object.entries(CATEGORY_NAMES).map(([key, config]) => {
          const count = consents.filter((c) => c.template?.category === key).length
          return (
            <button
              key={key}
              type="button"
              onClick={() => setCategoryFilter(key)}
              className={`px-3 py-1.5 rounded-lg border whitespace-nowrap font-medium transition-colors flex items-center gap-1.5 ${
                categoryFilter === key
                  ? 'bg-navy text-white border-navy shadow-xs'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span>{config.icon}</span>
              <span>{config.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                categoryFilter === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Lista de Consentimientos Registrados */}
      {loadingConsents ? (
        <div className="p-10 text-center text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          Cargando consentimientos informados del paciente...
        </div>
      ) : filteredConsents.length === 0 ? (
        <div className="p-8 bg-gray-50/70 rounded-xl border border-dashed border-gray-300 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-sand/30 border border-gold/40 text-gold flex items-center justify-center mx-auto text-xl">
            📑
          </div>
          <p className="text-xs font-semibold text-navy">
            {categoryFilter === 'all'
              ? 'No hay consentimientos informados registrados para este paciente.'
              : 'No hay consentimientos registrados en esta categoría específica.'}
          </p>
          <p className="text-[11px] text-gray-400 max-w-md mx-auto">
            Puedes emitir uno nuevo y capturar la firma digital en pantalla o imprimir el formato físico membretado de 1 página.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="px-3 py-1.5 bg-navy text-gold text-xs font-bold rounded-md hover:bg-navy/90"
            >
              Emitir Primer Consentimiento
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredConsents.map((consent) => {
            const catConfig = consent.template?.category
              ? CATEGORY_NAMES[consent.template.category]
              : null

            return (
              <div
                key={consent.id}
                className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs hover:border-gold hover:shadow-sm transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                      ✓ Firmado & Certificado
                    </span>
                    {catConfig && (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${catConfig.badgeClass}`}>
                        {catConfig.icon} {catConfig.label}
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-navy font-playfair leading-snug">
                      {consent.template?.title || consent.procedure?.name || 'Consentimiento Odontológico'}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Tratante: <strong className="text-navy">{consent.doctor_name}</strong>
                      {consent.doctor_exequatur && (
                        <span className="text-gray-400 text-[10px]"> (Exeq: {consent.doctor_exequatur})</span>
                      )}
                    </p>
                  </div>

                  {/* Metadatos adicionales */}
                  {(consent.metadata?.treatment_zone || consent.metadata?.tooth_number) && (
                    <div className="text-[11px] bg-sand/20 border border-gold/30 rounded px-2 py-1 text-navy font-medium inline-block">
                      {consent.metadata?.treatment_zone && `📍 Zona: ${consent.metadata.treatment_zone}`}
                      {consent.metadata?.tooth_number && `🦷 Diente No. ${consent.metadata.tooth_number}`}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">
                    {format(new Date(consent.signed_at), "dd/MM/yyyy · hh:mm a")}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setViewingConsent(consent)}
                      className="px-2.5 py-1 text-navy bg-gray-100 hover:bg-gray-200 rounded font-medium transition-colors"
                    >
                      Ver
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrintExistingConsent(consent)}
                      className="px-2.5 py-1 bg-gold/20 text-gold hover:bg-gold/30 font-bold rounded transition-colors flex items-center gap-1"
                      title="Imprimir formato oficial en 1 sola página"
                    >
                      <span>🖨️</span>
                      <span>Imprimir (1 pág.)</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EMITIR NUEVO CONSENTIMIENTO (10 MODELOS OFICIALES)                 */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header del Modal */}
            <div className="px-6 py-4 bg-navy text-white flex items-center justify-between border-b border-navy">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gold/20 border border-gold flex items-center justify-center text-lg">
                  📋
                </div>
                <div>
                  <h3 className="text-base font-playfair font-bold text-sand">
                    Emitir Consentimiento Informado Odontológico
                  </h3>
                  <p className="text-[11px] text-gray-300">
                    Paciente: <strong className="text-white">{patient.full_name}</strong> · Cédula: {patient.identification_number || 'N/D'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-300 hover:text-white p-1 rounded-md text-sm"
              >
                ✕
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Selección de Modelo / Plantilla */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-navy uppercase tracking-wider">
                  1. Seleccionar Modelo de Consentimiento Clínico (10 Modelos Oficiales) *
                </label>
                {loadingTemplates ? (
                  <div className="h-9 bg-gray-100 animate-pulse rounded" />
                ) : (
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => {
                      setSelectedTemplateId(e.target.value)
                      setTreatmentZone('')
                      setToothNumber('')
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs font-medium text-navy focus:outline-none focus:ring-2 focus:ring-gold bg-white"
                  >
                    {Object.entries(groupedTemplates).map(([catKey, list]) => {
                      const catName = CATEGORY_NAMES[catKey]?.label || catKey.toUpperCase()
                      return (
                        <optgroup key={catKey} label={`── ${catName} ──`}>
                          {list.map((tpl) => (
                            <option key={tpl.id} value={tpl.id}>
                              {tpl.title}
                            </option>
                          ))}
                        </optgroup>
                      )
                    })}
                  </select>
                )}
                {currentTemplate?.description && (
                  <p className="text-[11px] text-gray-500 italic">
                    ℹ️ {currentTemplate.description}
                  </p>
                )}
              </div>

              {/* Parámetros Dinámicos Específicos */}
              <div className="bg-sand/15 border border-gold/30 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-gold/20 pb-2">
                  <span className="font-bold text-navy uppercase tracking-wider text-[11px]">
                    2. Parámetros del Acto Clínico y Tratante
                  </span>
                  <span className="text-[10px] text-gold font-bold">
                    Membrete Oficial: Dra. Marisol García – Estomatóloga
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Zona Anatómica (Si aplica a Implantes, Cirugía Periodontal, RAR) */}
                  {requiresTreatmentZone && (
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-navy mb-1">
                        📍 Zona(s) o Cuadrantes a Intervenir *
                      </label>
                      <input
                        type="text"
                        value={treatmentZone}
                        onChange={(e) => setTreatmentZone(e.target.value)}
                        placeholder="ej. Zona anterosuperior, Cuadrantes 1 y 2, Pieza 46"
                        className="w-full px-3 py-2 rounded-lg border border-gold/60 text-xs focus:ring-2 focus:ring-gold bg-white"
                      />
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Especifica la región anatómica exacta para el consentimiento informado.
                      </p>
                    </div>
                  )}

                  {/* Diente No. (Si aplica a Endodoncia) */}
                  {requiresToothNumber && (
                    <div>
                      <label className="block text-[11px] font-bold text-navy mb-1">
                        🦷 Diente No. / Órgano Dental *
                      </label>
                      <input
                        type="text"
                        value={toothNumber}
                        onChange={(e) => setToothNumber(e.target.value)}
                        placeholder="ej. Diente No. 21 (Incisivo central sup)"
                        className="w-full px-3 py-2 rounded-lg border border-gold/60 text-xs focus:ring-2 focus:ring-gold bg-white"
                      />
                    </div>
                  )}

                  {/* Procedimiento de Catálogo (Opcional) */}
                  <div>
                    <label className="block text-[11px] font-medium text-navy mb-1">
                      Procedimiento en Catálogo
                    </label>
                    <select
                      value={selectedProcedureId}
                      onChange={(e) => setSelectedProcedureId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-gold bg-white"
                    >
                      <option value="">Selecciona del catálogo...</option>
                      {procedures.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Profesional Odontólogo */}
                  <div>
                    <label className="block text-[11px] font-medium text-navy mb-1">
                      Profesional Odontólogo(a) *
                    </label>
                    <input
                      type="text"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-gold bg-white"
                    />
                  </div>

                  {/* Exequátur */}
                  <div>
                    <label className="block text-[11px] font-medium text-navy mb-1">
                      Exequátur Profesional *
                    </label>
                    <input
                      type="text"
                      value={doctorExequatur}
                      onChange={(e) => setDoctorExequatur(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-gold bg-white"
                    />
                  </div>
                </div>

                {/* Opción de Tutor Legal o Representante */}
                <div className="pt-2 border-t border-gold/15">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isGuardian}
                      onChange={(e) => {
                        setIsGuardian(e.target.checked)
                        if (!e.target.checked) {
                          setSignerRole('patient')
                          setSignerName('')
                          setSignerIdDoc('')
                        }
                      }}
                      className="rounded text-gold focus:ring-gold h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-navy">
                      Firmado por Padre, Tutor Legal o Representante Autorizado (Menores de edad / Dependientes)
                    </span>
                  </label>

                  {isGuardian && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2.5 pt-2 border-t border-dashed border-gray-200">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">
                          Rol del Firmante
                        </label>
                        <select
                          value={signerRole}
                          onChange={(e) => setSignerRole(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-xs"
                        >
                          <option value="guardian">Padre / Madre / Tutor Legal</option>
                          <option value="representative">Representante Autorizado</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">
                          Nombre Completo del Tutor *
                        </label>
                        <input
                          type="text"
                          value={signerName}
                          onChange={(e) => setSignerName(e.target.value)}
                          placeholder="Nombre y apellido"
                          className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">
                          Cédula / Documento del Tutor *
                        </label>
                        <input
                          type="text"
                          value={signerIdDoc}
                          onChange={(e) => setSignerIdDoc(e.target.value)}
                          placeholder="Cédula de identidad"
                          className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Vista Previa Membretada en Tiempo Real */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider">
                    3. Previsualización Membretada del Documento (Ajustado a 1 Página)
                  </label>
                  <span className="text-[10px] text-gray-400">
                    Formato oficial A4 / Carta listo para impresión
                  </span>
                </div>

                <div className="p-4 bg-white rounded-xl border border-gray-300 shadow-inner max-h-52 overflow-y-auto space-y-2">
                  <div className="text-center pb-2 border-b border-gray-200">
                    <h5 className="font-playfair font-bold text-navy text-sm uppercase">
                      {currentTemplate?.title}
                    </h5>
                    <p className="text-[10px] text-gold font-bold uppercase">
                      {doctorName} – {doctorTitle} · Exeq: {doctorExequatur}
                    </p>
                  </div>
                  <div className="text-xs text-gray-700 whitespace-pre-line leading-relaxed text-justify">
                    {renderedText}
                  </div>
                </div>
              </div>

              {/* Canvas de Firma Digital Calibrada */}
              <div className="space-y-2.5 pt-2 border-t border-gray-200">
                {/* Barra de Calibración y Herramientas */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-sand/20 border border-gold/30 p-2.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-navy uppercase tracking-wider">
                      4. Firma Digital Calibrada
                    </span>
                    {hasSignature ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                        <span>✓</span>
                        <span>{strokeCount} trazo{strokeCount !== 1 ? 's' : ''} ({dprValue}x DPR)</span>
                      </span>
                    ) : (
                      <span className="text-[10px] bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">
                        ○ Lista para firmar
                      </span>
                    )}
                  </div>

                  {/* Controles de Calibración: Color, Grosor, Deshacer y Limpiar */}
                  <div className="flex items-center gap-3">
                    {/* Selector de Tinta */}
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-gray-500 font-medium text-[10px]">Tinta:</span>
                      <button
                        type="button"
                        onClick={() => setStrokeColor('#0F172A')}
                        className={`w-4 h-4 rounded-full border transition-all ${
                          strokeColor === '#0F172A' ? 'ring-2 ring-gold scale-110' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: '#0F172A' }}
                        title="Negro Ónix"
                      />
                      <button
                        type="button"
                        onClick={() => setStrokeColor('#1E3A8A')}
                        className={`w-4 h-4 rounded-full border transition-all ${
                          strokeColor === '#1E3A8A' ? 'ring-2 ring-gold scale-110' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: '#1E3A8A' }}
                        title="Azul Marino Notarial"
                      />
                    </div>

                    {/* Selector de Grosor */}
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-gray-500 font-medium text-[10px]">Trazo:</span>
                      <button
                        type="button"
                        onClick={() => setStrokeWidth(1.8)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                          strokeWidth === 1.8 ? 'bg-navy text-white border-navy' : 'bg-white text-gray-600 border-gray-200'
                        }`}
                      >
                        Fino
                      </button>
                      <button
                        type="button"
                        onClick={() => setStrokeWidth(2.4)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                          strokeWidth === 2.4 ? 'bg-navy text-white border-navy' : 'bg-white text-gray-600 border-gray-200'
                        }`}
                      >
                        Medio
                      </button>
                      <button
                        type="button"
                        onClick={() => setStrokeWidth(3.4)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                          strokeWidth === 3.4 ? 'bg-navy text-white border-navy' : 'bg-white text-gray-600 border-gray-200'
                        }`}
                      >
                        Grueso
                      </button>
                    </div>

                    {/* Deshacer y Limpiar */}
                    <div className="flex items-center gap-1 border-l border-gray-300 pl-2">
                      <button
                        type="button"
                        disabled={strokeHistory.length === 0}
                        onClick={handleUndo}
                        className="px-2 py-0.5 text-[10px] font-medium text-gray-600 hover:text-navy disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-white flex items-center gap-1"
                        title="Deshacer último trazo"
                      >
                        <span>↩</span>
                        <span>Deshacer</span>
                      </button>
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="px-2 py-0.5 text-[10px] font-bold text-red-600 hover:text-red-800 rounded hover:bg-red-50 flex items-center gap-1"
                        title="Limpiar firma"
                      >
                        <span>🗑️</span>
                        <span>Limpiar</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recuadro de Dibujo Calibrado con Guía */}
                <div className="relative border-2 border-dashed border-gray-300 hover:border-gold rounded-xl overflow-hidden bg-white shadow-inner">
                  {/* Guía visual inferior */}
                  <div className="absolute inset-x-8 bottom-5 border-b border-gray-300 pointer-events-none flex items-center justify-between text-[10px] text-gray-400 select-none">
                    <span className="font-semibold text-gray-400">✕ Firme sobre la línea con el dedo, lápiz óptico o ratón</span>
                    <span className="text-[9px] text-gray-300">Calibración 1:1 Pixel-Perfect</span>
                  </div>

                  <canvas
                    ref={canvasRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    style={{ touchAction: 'none' }}
                    className="w-full h-36 touch-none cursor-crosshair bg-transparent relative z-10 block"
                  />
                </div>
              </div>
            </div>

            {/* Footer con Acciones Duales */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handlePrintBlank}
                className="w-full sm:w-auto px-4 py-2 border border-navy text-navy hover:bg-navy/5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                title="Generar formato de 1 página con líneas vacías para firma con bolígrafo"
              >
                <span>🖨️</span>
                <span>Imprimir en Blanco (Firma Física)</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={signConsentMutation.isPending || !renderedText || !hasSignature}
                  onClick={handleSaveConsent}
                  className="px-5 py-2 bg-gold hover:bg-gold/90 text-white text-xs font-bold rounded-lg transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {signConsentMutation.isPending ? (
                    'Guardando y Certificando...'
                  ) : (
                    <>
                      <span>✍️</span>
                      <span>Firmar & Registrar Digitalmente</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VER CONSENTIMIENTO FIRMADO & IMPRESIÓN OFICIAL                     */}
      {/* ========================================================================= */}
      {viewingConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-navy text-white flex items-center justify-between border-b border-navy">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-gold font-bold block">
                  Documento Médico-Legal Certificado
                </span>
                <h3 className="text-base font-playfair font-bold text-sand">
                  {viewingConsent.template?.title || viewingConsent.procedure?.name || 'Consentimiento Informado Registrado'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingConsent(null)}
                className="text-gray-300 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="p-4 bg-sand/15 rounded-xl border border-gold/30 text-xs text-navy whitespace-pre-line leading-relaxed text-justify">
                {viewingConsent.content_rendered}
              </div>

              {viewingConsent.signature_data_url && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center space-y-2">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Firma Electrónica del Paciente / Tutor Registrada
                  </p>
                  <img
                    src={viewingConsent.signature_data_url}
                    alt="Firma del paciente"
                    className="h-16 mx-auto border-b border-gray-300 pb-1"
                  />
                  <p className="text-[10px] text-gray-400">
                    Firmado el {format(new Date(viewingConsent.signed_at), "dd/MM/yyyy 'a las' hh:mm a")} · Tratante: {viewingConsent.doctor_name}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handlePrintExistingConsent(viewingConsent)}
                className="px-4 py-2 bg-gold hover:bg-gold/90 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <span>🖨️</span>
                <span>Imprimir Documento Oficial (1 Pág / PDF)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingConsent(null)}
                className="px-4 py-2 bg-gray-200 text-navy hover:bg-gray-300 text-xs font-semibold rounded-lg"
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
