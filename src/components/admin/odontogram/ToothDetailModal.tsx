import React, { useState } from 'react'
import type { ToothState, ToothCondition, ToothSurface } from '../../../types'
import { CONDITION_TOOLS } from './odontogramConstants'

interface ToothDetailModalProps {
  tooth: ToothState
  onClose: () => void
  onSave: (updated: ToothState) => void
}

export const ToothDetailModal: React.FC<ToothDetailModalProps> = ({
  tooth,
  onClose,
  onSave,
}) => {
  const [localTooth, setLocalTooth] = useState<ToothState>({ ...tooth })

  const handleGeneralConditionChange = (condition: ToothCondition) => {
    setLocalTooth((prev) => ({
      ...prev,
      general_condition: condition,
    }))
  }

  const handleSurfaceChange = (surface: ToothSurface, condition: ToothCondition) => {
    setLocalTooth((prev) => ({
      ...prev,
      surfaces: {
        ...prev.surfaces,
        [surface]: condition,
      },
    }))
  }

  const handleSave = () => {
    onSave(localTooth)
    onClose()
  }

  const surfaces: Array<{ key: ToothSurface; label: string }> = [
    { key: 'vestibular', label: 'Cara Vestibular' },
    { key: 'lingual_palatal', label: 'Cara Palatina / Lingual' },
    { key: 'mesial', label: 'Cara Mesial' },
    { key: 'distal', label: 'Cara Distal' },
    { key: 'occlusal_incisal', label: 'Cara Oclusal / Incisal' },
  ]

  const surfaceConditions: ToothCondition[] = ['healthy', 'caries', 'composite', 'amalgam', 'sealant']
  const generalConditions: ToothCondition[] = [
    'healthy',
    'crown',
    'endodontics_done',
    'endodontics_needed',
    'missing',
    'extraction_needed',
    'implant',
    'fracture',
    'bridge',
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 font-montserrat">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
          <div>
            <h3 className="text-base font-playfair font-bold text-navy">
              Detalle Clínico: Pieza Dental #{tooth.tooth_number}
            </h3>
            <p className="text-xs text-gray-500">
              Configuración anatómica de superficies y estado general
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo con Scroll */}
        <div className="p-5 space-y-5 overflow-y-auto text-xs">
          {/* Estado General de la Pieza */}
          <div>
            <label className="block font-bold text-navy mb-2 uppercase tracking-wider text-[11px]">
              Estado General de la Pieza
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {generalConditions.map((cond) => {
                const tool = CONDITION_TOOLS.find((t) => t.id === cond)
                const isSelected = localTooth.general_condition === cond
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => handleGeneralConditionChange(cond)}
                    className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-navy text-gold border-navy font-bold shadow-sm'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tool?.color || '#cbd5e1' }}
                    />
                    <span className="truncate">{tool?.label || cond}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Estado por Superficie */}
          <div className="border-t border-gray-100 pt-4">
            <label className="block font-bold text-navy mb-2 uppercase tracking-wider text-[11px]">
              Condición por Superficie Dental
            </label>
            <div className="space-y-3">
              {surfaces.map((s) => (
                <div
                  key={s.key}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100"
                >
                  <span className="font-semibold text-gray-700">{s.label}</span>
                  <div className="flex gap-1">
                    {surfaceConditions.map((cond) => {
                      const tool = CONDITION_TOOLS.find((t) => t.id === cond)
                      const isSelected = localTooth.surfaces[s.key] === cond
                      return (
                        <button
                          key={cond}
                          type="button"
                          onClick={() => handleSurfaceChange(s.key, cond)}
                          className={`px-2 py-1 rounded text-[10px] font-medium border transition-colors ${
                            isSelected
                              ? `${tool?.bgColor} ${tool?.borderColor} font-bold ring-1 ring-gold`
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {tool?.label.split(' ')[0]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notas Clínicas de la Pieza */}
          <div className="border-t border-gray-100 pt-4">
            <label className="block font-bold text-navy mb-1.5 uppercase tracking-wider text-[11px]">
              Notas Clínicas y Observaciones
            </label>
            <textarea
              rows={2}
              value={localTooth.notes || ''}
              onChange={(e) => setLocalTooth({ ...localTooth, notes: e.target.value })}
              placeholder="Ej: Sensibilidad a la percusión, caries de cuello grado 2..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold text-xs"
            />
          </div>
        </div>

        {/* Pie con Acciones */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              setLocalTooth({
                ...tooth,
                general_condition: 'healthy',
                surfaces: {
                  vestibular: 'healthy',
                  lingual_palatal: 'healthy',
                  mesial: 'healthy',
                  distal: 'healthy',
                  occlusal_incisal: 'healthy',
                },
                notes: '',
              })
            }
            className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg"
          >
            Restaurar a Sano
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-gold text-white text-xs font-semibold rounded-lg hover:bg-gold/90 shadow-sm"
            >
              Aplicar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
