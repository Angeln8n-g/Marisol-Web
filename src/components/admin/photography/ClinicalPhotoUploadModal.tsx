import React, { useState } from 'react'
import type { Procedure, ClinicalPhotoStage, ClinicalPhotoType } from '../../../types'

interface ClinicalPhotoUploadModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  existingCases: string[]
  procedures: Procedure[]
  onSave: (payload: {
    patient_id: string
    procedure_id?: string | null
    case_title: string
    stage: ClinicalPhotoStage
    photo_type: ClinicalPhotoType
    image_url: string
    taken_at: string
    doctor_notes?: string | null
    consent_for_marketing: boolean
  }) => Promise<void>
  isSaving: boolean
}

export const ClinicalPhotoUploadModal: React.FC<ClinicalPhotoUploadModalProps> = ({
  isOpen,
  onClose,
  patientId,
  existingCases,
  procedures,
  onSave,
  isSaving,
}) => {
  const [caseTitle, setCaseTitle] = useState(existingCases[0] || 'Diseño de Sonrisa y Estética')
  const [stage, setStage] = useState<ClinicalPhotoStage>('before')
  const [photoType, setPhotoType] = useState<ClinicalPhotoType>('frontal_smile')
  const [imageUrl, setImageUrl] = useState('')
  const [procedureId, setProcedureId] = useState('')
  const [takenAt, setTakenAt] = useState(new Date().toISOString().split('T')[0])
  const [doctorNotes, setDoctorNotes] = useState('')
  const [consentForMarketing, setConsentForMarketing] = useState(true)

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageUrl.trim()) {
      alert('Por favor selecciona una imagen o introduce un enlace de foto.')
      return
    }
    if (!caseTitle.trim()) {
      alert('Por favor indica el título del caso clínico.')
      return
    }

    await onSave({
      patient_id: patientId,
      procedure_id: procedureId || null,
      case_title: caseTitle.trim(),
      stage,
      photo_type: photoType,
      image_url: imageUrl.trim(),
      taken_at: takenAt,
      doctor_notes: doctorNotes.trim() || null,
      consent_for_marketing: consentForMarketing,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-montserrat overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-100 my-8">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gold/15 text-gold flex items-center justify-center font-bold text-lg">
              📷
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-playfair font-bold text-navy">
                Añadir Fotografía Clínica
              </h3>
              <p className="text-xs text-gray-500">
                Categorización clínica, encuadre anatómico y etapa del tratamiento
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Case Title */}
          <div>
            <label className="block font-semibold text-navy mb-1">
              Título del Caso Clínico *
            </label>
            <input
              type="text"
              required
              value={caseTitle}
              onChange={(e) => setCaseTitle(e.target.value)}
              placeholder="ej. Carillas Anteriores BL2 / Blanqueamiento LED"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none"
            />
            {existingCases.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[10px] text-gray-400">Casos existentes:</span>
                {existingCases.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCaseTitle(c)}
                    className="text-[10px] bg-gray-100 hover:bg-gold/20 text-gray-700 hover:text-navy px-2 py-0.5 rounded-md transition-colors"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stage & View Angle */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy mb-1">Etapa Clínica *</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as ClinicalPhotoStage)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none bg-white"
              >
                <option value="before">1. Pre-Operatorio (Antes)</option>
                <option value="in_progress">2. Proceso / Provisional</option>
                <option value="after">3. Post-Operatorio (Después)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-navy mb-1">Encuadre / Vista *</label>
              <select
                value={photoType}
                onChange={(e) => setPhotoType(e.target.value as ClinicalPhotoType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none bg-white"
              >
                <option value="frontal_smile">Sonrisa Frontal</option>
                <option value="intraoral_frontal">Intraoral Frontal Oclusión</option>
                <option value="intraoral_upper">Arcada Superior Oclusal</option>
                <option value="intraoral_lower">Arcada Inferior Oclusal</option>
                <option value="lateral_right">Lateral Derecha</option>
                <option value="lateral_left">Lateral Izquierda</option>
                <option value="profile">Perfil Facial</option>
                <option value="other">Otro ángulo</option>
              </select>
            </div>
          </div>

          {/* Image Input (File or URL) */}
          <div className="space-y-2">
            <label className="block font-semibold text-navy mb-0.5">
              Fotografía Dental *
            </label>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gold/15 file:text-navy hover:file:bg-gold/25 cursor-pointer"
              />
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400">O ingresa URL:</span>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-2.5 py-1 border border-gray-300 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Image Preview */}
            {imageUrl && (
              <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 mt-2 bg-gray-50">
                <img
                  src={imageUrl}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Procedure & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy mb-1">Procedimiento</label>
              <select
                value={procedureId}
                onChange={(e) => setProcedureId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none bg-white"
              >
                <option value="">Sin procedimiento específico</option>
                {procedures.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-navy mb-1">Fecha de la Toma *</label>
              <input
                type="date"
                required
                value={takenAt}
                onChange={(e) => setTakenAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none"
              />
            </div>
          </div>

          {/* Doctor Clinical Notes */}
          <div>
            <label className="block font-semibold text-navy mb-1">
              Notas Clínicas / Color / Indicaciones
            </label>
            <textarea
              rows={2}
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="ej. Tono inicial A3.5 en guía VITA; aislamiento absoluto con dique de goma."
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none"
            />
          </div>

          {/* Marketing Consent */}
          <div className="p-3 bg-sand/30 border border-sand/60 rounded-xl flex items-center justify-between">
            <div>
              <div className="font-semibold text-navy">Consentimiento para Redes Sociales</div>
              <div className="text-[10px] text-gray-500">
                El paciente autoriza exhibir su antes/después manteniendo anonimato
              </div>
            </div>
            <input
              type="checkbox"
              checked={consentForMarketing}
              onChange={(e) => setConsentForMarketing(e.target.checked)}
              className="w-4 h-4 text-gold rounded border-gray-300 focus:ring-gold"
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-navy text-gold hover:bg-navy/90 font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : 'Guardar Fotografía'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
