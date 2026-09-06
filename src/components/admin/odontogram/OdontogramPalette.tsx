import React from 'react'
import type { ToothCondition } from '../../../types'
import { CONDITION_TOOLS } from './odontogramConstants'

interface OdontogramPaletteProps {
  activeTool: ToothCondition
  onSelectTool: (tool: ToothCondition) => void
}

export const OdontogramPalette: React.FC<OdontogramPaletteProps> = ({
  activeTool,
  onSelectTool,
}) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm font-montserrat">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
        <h3 className="text-xs font-bold text-navy uppercase tracking-wider">
          Paleta de Diagnósticos y Tratamientos Odontológicos
        </h3>
        <span className="text-[11px] text-gray-500">
          Selecciona una herramienta y haz clic sobre la superficie o pieza dental
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {CONDITION_TOOLS.map((tool) => {
          const isSelected = activeTool === tool.id
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSelectTool(tool.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                isSelected
                  ? `${tool.bgColor} ${tool.borderColor} ring-2 ring-gold font-bold shadow-sm scale-105`
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
              title={`${tool.description} (${
                tool.appliesTo === 'surface' ? 'Aplica a cara' : 'Aplica a diente completo'
              })`}
            >
              <span
                className="w-3 h-3 rounded-full border border-gray-400 flex-shrink-0"
                style={{ backgroundColor: tool.color }}
              />
              <span>{tool.label}</span>
              <span className="text-[9px] text-gray-400 font-normal">
                {tool.appliesTo === 'surface' ? 'cara' : 'pieza'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
