import React, { useState } from 'react'
import type { Patient, PatientClinicalPhoto, ClinicalPhotoStage } from '../../../types'
import { useClinicalCases, useClinicalPhotoMutations } from '../../../hooks/useClinicalPhotos'
import { useProcedures } from '../../../hooks/useProcedures'
import { BeforeAfterSlider } from './BeforeAfterSlider'
import { ClinicalPhotoUploadModal } from './ClinicalPhotoUploadModal'

interface ClinicalPhotographyGalleryProps {
  patient: Patient
}

export const ClinicalPhotographyGallery: React.FC<ClinicalPhotographyGalleryProps> = ({
  patient,
}) => {
  const { photos, cases, isLoading } = useClinicalCases(patient.id)
  const { procedures = [] } = useProcedures()
  const { addPhoto, deletePhoto, isAddingPhoto } = useClinicalPhotoMutations(patient.id)

  const [selectedCaseTitle, setSelectedCaseTitle] = useState<string>('')
  const [stageFilter, setStageFilter] = useState<ClinicalPhotoStage | 'all'>('all')
  const [showUploadModal, setShowUploadModal] = useState(false)

  // Active case for slider
  const activeCase =
    cases.find((c) => c.caseTitle === selectedCaseTitle) || cases[0]

  const filteredPhotos = photos.filter((p) => {
    if (stageFilter === 'all') return true
    return p.stage === stageFilter
  })

  const existingCaseTitles = Array.from(new Set(photos.map((p) => p.case_title)))

  const handleSavePhoto = async (payload: any) => {
    try {
      await addPhoto(payload)
      setShowUploadModal(false)
      setSelectedCaseTitle(payload.case_title)
    } catch {
      alert('Error al guardar la fotografía clínica.')
    }
  }

  const handleDeletePhoto = async (photo: PatientClinicalPhoto) => {
    if (window.confirm(`¿Deseas eliminar esta fotografía (${photo.stage})?`)) {
      await deletePhoto(photo.id)
    }
  }

  return (
    <div className="space-y-6 font-montserrat">
      {/* Top action bar & Case pills */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-gray-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-playfair font-bold text-navy">
              Registro Fotográfico & Casos Estéticos
            </h3>
            <span className="px-2.5 py-0.5 bg-gold/20 text-gold font-bold text-[10px] rounded-full border border-gold/30">
              HD Odontología
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {photos.length} fotografía(s) clínica(s) registradas para {patient.full_name}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2.5 bg-gold hover:bg-gold/90 text-navy font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 self-start sm:self-center hover:scale-[1.02] active:scale-95"
        >
          <span className="text-sm">+</span>
          <span>Añadir Fotografía</span>
        </button>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="py-12 text-center text-gray-400 text-xs animate-pulse">
          Cargando fotografías clínicas...
        </div>
      ) : photos.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200/80 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gold/15 text-gold flex items-center justify-center mx-auto text-2xl">
            📷
          </div>
          <h4 className="text-base font-playfair font-bold text-navy">
            Sin fotografías clínicas registradas
          </h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Comienza documentando el estado pre-operatorio (antes) y post-operatorio (después) de los
            tratamientos estéticos, ortodoncia o rehabilitación.
          </p>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-navy text-gold text-xs font-bold rounded-xl hover:bg-navy/90 transition-all shadow-sm"
          >
            + Subir Primera Fotografía
          </button>
        </div>
      ) : (
        <>
          {/* Case Selector Pills if multiple cases */}
          {cases.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs text-gray-400 font-semibold mr-1">Casos:</span>
              {cases.map((c) => (
                <button
                  key={c.caseTitle}
                  type="button"
                  onClick={() => setSelectedCaseTitle(c.caseTitle)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    (activeCase?.caseTitle || '') === c.caseTitle
                      ? 'bg-navy text-gold font-bold shadow-xs'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {c.caseTitle}
                </button>
              ))}
            </div>
          )}

          {/* Interactive Before / After Slider Component */}
          {activeCase && activeCase.beforePhoto && activeCase.afterPhoto ? (
            <BeforeAfterSlider
              caseTitle={activeCase.caseTitle}
              procedureName={activeCase.procedureName}
              beforePhoto={activeCase.beforePhoto}
              afterPhoto={activeCase.afterPhoto}
              patientName={patient.full_name}
            />
          ) : activeCase && (!activeCase.beforePhoto || !activeCase.afterPhoto) ? (
            <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-5 text-xs text-amber-900 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">💡</span>
                <div>
                  <strong>Caso Clínico en Proceso:</strong> "{activeCase.caseTitle}". Para activar el
                  comparador deslizante, añade una foto marcada como{' '}
                  <strong>{!activeCase.beforePhoto ? 'Antes (Pre-operatorio)' : 'Después (Post-operatorio)'}</strong>.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-xl font-bold text-xs whitespace-nowrap"
              >
                + Añadir Foto Faltante
              </button>
            </div>
          ) : null}

          {/* Photos Grid & Stage Filter */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-3">
              <h4 className="text-sm font-playfair font-bold text-navy">
                Galería Completa de Fotografías ({filteredPhotos.length})
              </h4>

              {/* Stage Filter tabs */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl self-start sm:self-center">
                {(
                  [
                    { id: 'all', label: 'Todas' },
                    { id: 'before', label: 'Pre-operatorio (Antes)' },
                    { id: 'in_progress', label: 'Durante' },
                    { id: 'after', label: 'Post-operatorio (Después)' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setStageFilter(t.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      stageFilter === t.id
                        ? 'bg-white text-navy shadow-xs font-bold'
                        : 'text-gray-500 hover:text-navy'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-2xs hover:shadow-md transition-all flex flex-col"
                >
                  {/* Photo Container */}
                  <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden">
                    <img
                      src={photo.image_url}
                      alt={photo.case_title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Stage Tag */}
                    <span
                      className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        photo.stage === 'before'
                          ? 'bg-black/80 text-white'
                          : photo.stage === 'after'
                          ? 'bg-gold text-navy'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {photo.stage === 'before'
                        ? 'Antes'
                        : photo.stage === 'after'
                        ? 'Después'
                        : 'Proceso'}
                    </span>

                    {/* Marketing Consent Icon */}
                    <span
                      className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/90 text-gray-700 shadow-xs"
                      title={
                        photo.consent_for_marketing
                          ? 'Autorizado para difusión / redes sociales'
                          : 'Uso clínico privado exclusivamente'
                      }
                    >
                      {photo.consent_for_marketing ? '🌐 Social' : '🔒 Privado'}
                    </span>
                  </div>

                  {/* Photo Details */}
                  <div className="p-3 text-xs space-y-1 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="font-semibold text-navy line-clamp-1">{photo.case_title}</div>
                      <div className="text-[10px] text-gray-500 flex items-center justify-between">
                        <span>{photo.photo_type.replace(/_/g, ' ')}</span>
                        <span>{photo.taken_at}</span>
                      </div>
                      {photo.doctor_notes && (
                        <p className="text-[11px] text-gray-600 line-clamp-2 mt-1 bg-gray-50 p-1.5 rounded-lg">
                          {photo.doctor_notes}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(photo)}
                        className="text-[10px] text-red-500 hover:text-red-700 font-medium transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Upload Modal */}
      <ClinicalPhotoUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        patientId={patient.id}
        existingCases={existingCaseTitles}
        procedures={procedures}
        onSave={handleSavePhoto}
        isSaving={isAddingPhoto}
      />
    </div>
  )
}
