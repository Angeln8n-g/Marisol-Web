import React, { useState, useRef, useCallback } from 'react'
import type { PatientClinicalPhoto } from '../../../types'

interface BeforeAfterSliderProps {
  caseTitle: string
  procedureName?: string
  beforePhoto: PatientClinicalPhoto
  afterPhoto: PatientClinicalPhoto
  patientName?: string
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  caseTitle,
  procedureName,
  beforePhoto,
  afterPhoto,
  patientName,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50) // 0 to 100%
  const [isDragging, setIsDragging] = useState(false)
  const [viewMode, setViewMode] = useState<'slider' | 'side_by_side'>('slider')
  const [showExportModal, setShowExportModal] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100))
      setSliderPosition(percent)
    },
    []
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return
      handleMove(e.touches[0].clientX)
    },
    [isDragging, handleMove]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return
      handleMove(e.clientX)
    },
    [isDragging, handleMove]
  )

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100 space-y-4 font-montserrat">
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-playfair font-bold text-navy">
              {caseTitle}
            </h3>
            {procedureName && (
              <span className="px-2 py-0.5 bg-gold/15 text-gold text-[10px] font-bold rounded-full border border-gold/30">
                {procedureName}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Desliza el comparador interactivo para evaluar el resultado clínico y la estética dental
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {/* View Mode */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('slider')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'slider'
                  ? 'bg-white text-navy shadow-xs font-bold'
                  : 'text-gray-500 hover:text-navy'
              }`}
            >
              ↔ Slider Deslizante
            </button>
            <button
              type="button"
              onClick={() => setViewMode('side_by_side')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'side_by_side'
                  ? 'bg-white text-navy shadow-xs font-bold'
                  : 'text-gray-500 hover:text-navy'
              }`}
            >
              ⊞ Paralelo
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="px-3.5 py-1.5 bg-navy text-gold hover:bg-navy/90 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            title="Generar tarjeta de caso clínico para redes o paciente"
          >
            <span>📸 Exportar Tarjeta</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Comparison Area */}
      {viewMode === 'slider' ? (
        <div
          ref={containerRef}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onMouseMove={handleMouseMove}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onTouchMove={handleTouchMove}
          className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[500px] rounded-2xl overflow-hidden select-none cursor-ew-resize border border-gray-200 shadow-inner bg-slate-900"
        >
          {/* After Image (Full background) */}
          <img
            src={afterPhoto.image_url}
            alt="Resultado Después"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />

          {/* Before Image (Clipped Overlay) */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={beforePhoto.image_url}
              alt="Estado Inicial Antes"
              className="absolute inset-0 w-full h-full object-cover max-w-none"
              style={{
                width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
              }}
            />
          </div>

          {/* Dividing Vertical Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl pointer-events-none"
            style={{ left: `${sliderPosition}%` }}
          >
            {/* Center Handle Button */}
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white text-navy font-bold shadow-xl border-2 border-gold flex items-center justify-center text-xs pointer-events-auto cursor-ew-resize hover:scale-110 transition-transform">
              <span className="text-gray-400 text-[10px] mr-0.5">◀</span>
              <span className="text-gray-400 text-[10px] ml-0.5">▶</span>
            </div>
          </div>

          {/* Floating Badges */}
          <div className="absolute top-3 left-3 pointer-events-none">
            <span className="px-3 py-1 bg-black/70 backdrop-blur-md text-white text-[11px] font-bold rounded-full border border-white/20 uppercase tracking-wider">
              Antes ({beforePhoto.taken_at})
            </span>
          </div>

          <div className="absolute top-3 right-3 pointer-events-none">
            <span className="px-3 py-1 bg-gold text-navy text-[11px] font-bold rounded-full shadow-lg border border-white/20 uppercase tracking-wider">
              Después ({afterPhoto.taken_at})
            </span>
          </div>
        </div>
      ) : (
        /* Side-by-side View */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-gray-200 shadow-xs bg-slate-100">
              <img
                src={beforePhoto.image_url}
                alt="Antes"
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 left-3 px-3 py-1 bg-black/70 text-white text-[11px] font-bold rounded-full backdrop-blur-xs uppercase">
                Antes • {beforePhoto.taken_at}
              </span>
            </div>
            {beforePhoto.doctor_notes && (
              <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                <strong>Diagnóstico Inicial:</strong> {beforePhoto.doctor_notes}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-gray-200 shadow-xs bg-slate-100">
              <img
                src={afterPhoto.image_url}
                alt="Después"
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 right-3 px-3 py-1 bg-gold text-navy text-[11px] font-bold rounded-full shadow-md uppercase">
                Después • {afterPhoto.taken_at}
              </span>
            </div>
            {afterPhoto.doctor_notes && (
              <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                <strong>Resultado Clínico:</strong> {afterPhoto.doctor_notes}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Clinical Notes Summary Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
        <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
          <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">
            Pre-Operatorio ({beforePhoto.taken_at})
          </span>
          <p className="text-gray-700">
            {beforePhoto.doctor_notes || 'Fotografía clínica inicial sin observaciones adicionales.'}
          </p>
        </div>

        <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200">
          <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-0.5">
            Post-Operatorio ({afterPhoto.taken_at})
          </span>
          <p className="text-emerald-900">
            {afterPhoto.doctor_notes || 'Fotografía de alta estética finalizada.'}
          </p>
        </div>
      </div>

      {/* Export Printable Card Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-montserrat overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-gray-100 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-playfair font-bold text-navy">
                  Ficha de Caso Clínico Digital
                </h3>
                <p className="text-xs text-gray-500">
                  Formato institucional listo para compartir con el paciente o redes sociales
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Branded Card Preview */}
            <div className="bg-gradient-to-br from-navy via-slate-900 to-navy text-white p-5 rounded-2xl space-y-4 shadow-lg border border-gold/40">
              <div className="flex items-center justify-between border-b border-white/15 pb-2">
                <div>
                  <h4 className="font-playfair font-bold text-base text-gold">
                    Dra. Marisol - Odontología Estética
                  </h4>
                  <p className="text-[10px] text-gray-300">
                    {patientName ? `Paciente: ${patientName}` : 'Caso Clínico Exclusivo'}
                  </p>
                </div>
                <span className="text-xs font-bold text-white bg-white/10 px-2.5 py-1 rounded-full border border-white/20">
                  {caseTitle}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/20">
                    <img
                      src={beforePhoto.image_url}
                      alt="Antes"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 text-white text-[10px] font-bold rounded">
                      ANTES
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-gold/50 shadow-md">
                    <img
                      src={afterPhoto.image_url}
                      alt="Después"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-gold text-navy text-[10px] font-bold rounded">
                      DESPUÉS
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-white/10">
                <span>Resultados clínicos certificados</span>
                <span className="text-gold font-semibold">www.dramarisol.com</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs text-gray-600 hover:bg-gray-50"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-gold hover:bg-gold/90 text-navy font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                🖨️ Imprimir / Guardar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
