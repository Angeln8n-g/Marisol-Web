import React from 'react'
import type { ToothCondition, ToothState, ToothSurface } from '../../../types'
import { getSurfaceColor, getToothRenderUrl } from './odontogramConstants'

interface ToothSurfaceSVGProps {
  tooth: ToothState
  isUpper: boolean
  activeTool: ToothCondition
  onSurfaceClick: (surface: ToothSurface) => void
  onToothClick: () => void
  onOpenModal: () => void
}

export const ToothSurfaceSVG: React.FC<ToothSurfaceSVGProps> = ({
  tooth,
  isUpper,
  activeTool,
  onSurfaceClick,
  onToothClick,
  onOpenModal,
}) => {
  const isMissing = tooth.general_condition === 'missing'
  const isExtraction = tooth.general_condition === 'extraction_needed'
  const isImplant = tooth.general_condition === 'implant'
  const isCrown = tooth.general_condition === 'crown'
  const hasEndoDone = tooth.general_condition === 'endodontics_done'
  const hasEndoNeeded = tooth.general_condition === 'endodontics_needed'
  const isFracture = tooth.general_condition === 'fracture'

  // Map top & bottom surfaces according to upper / lower arch
  const topSurface: ToothSurface = isUpper ? 'vestibular' : 'lingual_palatal'
  const bottomSurface: ToothSurface = isUpper ? 'lingual_palatal' : 'vestibular'
  const leftSurface: ToothSurface = 'mesial'
  const rightSurface: ToothSurface = 'distal'
  const centerSurface: ToothSurface = 'occlusal_incisal'

  const handlePolygonClick = (surface: ToothSurface, e: React.MouseEvent) => {
    e.stopPropagation()
    onSurfaceClick(surface)
  }

  return (
    <div className="flex flex-col items-center w-16 p-1 bg-white hover:bg-gold/5 rounded-lg border border-gray-200 transition-all select-none group">
      {/* Etiqueta del Diente y Acciones */}
      <div className="w-full flex items-center justify-between text-[11px] font-bold font-montserrat text-navy mb-1 px-1">
        <span>{tooth.tooth_number}</span>
        <button
          type="button"
          onClick={onOpenModal}
          title="Ver detalle / notas"
          className="text-gray-400 hover:text-gold text-[10px]"
        >
          ⚙
        </button>
      </div>

      {/* SVG del Diente */}
      <div
        className="relative w-14 h-24 cursor-pointer"
        onClick={onToothClick}
        title={`Diente ${tooth.tooth_number} - Clic para aplicar ${activeTool}`}
      >
        <svg className="w-full h-full" viewBox="0 0 60 90">
          {/* RAIZ DENTAL - RENDER ANATÓMICO 3D REAL SEPA */}
          {isUpper ? (
            // Diente superior: Raíz real en la parte superior (0 a 35)
            <g>
              <image
                href={getToothRenderUrl(tooth.tooth_number, true)}
                x="6"
                y="0"
                width="48"
                height="35"
                preserveAspectRatio="xMidYMid meet"
              />
              {/* Conducto radicular / Endodoncia sobre la raíz real */}
              {(hasEndoDone || hasEndoNeeded) && (
                <line
                  x1="30"
                  y1="5"
                  x2="30"
                  y2="34"
                  stroke={hasEndoDone ? '#10b981' : '#dc2626'}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )}
            </g>
          ) : (
            // Diente inferior: Raíz real en la parte inferior (55 a 90)
            <g>
              <image
                href={getToothRenderUrl(tooth.tooth_number, false)}
                x="6"
                y="55"
                width="48"
                height="35"
                preserveAspectRatio="xMidYMid meet"
              />
              {/* Conducto radicular / Endodoncia sobre la raíz real */}
              {(hasEndoDone || hasEndoNeeded) && (
                <line
                  x1="30"
                  y1="56"
                  x2="30"
                  y2="85"
                  stroke={hasEndoDone ? '#10b981' : '#dc2626'}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )}
            </g>
          )}

          {/* CORONA - 5 SUPERFICIES ANATÓMICAS */}
          <g transform={isUpper ? 'translate(5, 35)' : 'translate(5, 5)'}>
            {/* Superficie Superior (Vestibular o Lingual) */}
            <polygon
              points="0,0 50,0 35,15 15,15"
              fill={getSurfaceColor(tooth.surfaces[topSurface])}
              stroke="#64748b"
              strokeWidth="1"
              className="hover:opacity-80 transition-opacity"
              onClick={(e) => handlePolygonClick(topSurface, e)}
            />

            {/* Superficie Inferior (Palatino o Vestibular) */}
            <polygon
              points="15,35 35,35 50,50 0,50"
              fill={getSurfaceColor(tooth.surfaces[bottomSurface])}
              stroke="#64748b"
              strokeWidth="1"
              className="hover:opacity-80 transition-opacity"
              onClick={(e) => handlePolygonClick(bottomSurface, e)}
            />

            {/* Superficie Izquierda (Mesial) */}
            <polygon
              points="0,0 15,15 15,35 0,50"
              fill={getSurfaceColor(tooth.surfaces[leftSurface])}
              stroke="#64748b"
              strokeWidth="1"
              className="hover:opacity-80 transition-opacity"
              onClick={(e) => handlePolygonClick(leftSurface, e)}
            />

            {/* Superficie Derecha (Distal) */}
            <polygon
              points="50,0 50,50 35,35 35,15"
              fill={getSurfaceColor(tooth.surfaces[rightSurface])}
              stroke="#64748b"
              strokeWidth="1"
              className="hover:opacity-80 transition-opacity"
              onClick={(e) => handlePolygonClick(rightSurface, e)}
            />

            {/* Superficie Central (Oclusal / Incisal) */}
            <polygon
              points="15,15 35,15 35,35 15,35"
              fill={getSurfaceColor(tooth.surfaces[centerSurface])}
              stroke="#64748b"
              strokeWidth="1"
              className="hover:opacity-80 transition-opacity"
              onClick={(e) => handlePolygonClick(centerSurface, e)}
            />

            {/* Marcador de Corona (Borde Dorado) */}
            {isCrown && (
              <rect
                x="-2"
                y="-2"
                width="54"
                height="54"
                fill="none"
                stroke="#d97706"
                strokeWidth="3"
                rx="4"
              />
            )}
          </g>

          {/* Superposiciones de Estado General */}
          {isMissing && (
            <g>
              <line x1="10" y1="10" x2="50" y2="80" stroke="#475569" strokeWidth="3.5" />
              <line x1="50" y1="10" x2="10" y2="80" stroke="#475569" strokeWidth="3.5" />
            </g>
          )}

          {isExtraction && (
            <g>
              <line x1="10" y1="10" x2="50" y2="80" stroke="#dc2626" strokeWidth="3.5" />
              <line x1="50" y1="10" x2="10" y2="80" stroke="#dc2626" strokeWidth="3.5" />
            </g>
          )}

          {isImplant && (
            <g>
              <circle cx="30" cy={isUpper ? 60 : 30} r="18" fill="#0284c7" fillOpacity="0.2" />
              <rect x="24" y={isUpper ? 10 : 50} width="12" height="30" fill="#0284c7" rx="2" />
              <line x1="20" y1={isUpper ? 18 : 58} x2="40" y2={isUpper ? 18 : 58} stroke="#ffffff" strokeWidth="2" />
              <line x1="20" y1={isUpper ? 26 : 66} x2="40" y2={isUpper ? 26 : 66} stroke="#ffffff" strokeWidth="2" />
            </g>
          )}

          {isFracture && (
            <path
              d="M 15 20 L 35 45 L 20 60 L 45 80"
              fill="none"
              stroke="#9333ea"
              strokeWidth="2.5"
              strokeDasharray="2,2"
            />
          )}
        </svg>
      </div>

      {/* Indicador de notas o hallazgos */}
      <div className="w-full text-center mt-1">
        {tooth.notes ? (
          <span className="text-[9px] px-1 bg-amber-100 text-amber-800 rounded truncate block max-w-full" title={tooth.notes}>
            {tooth.notes}
          </span>
        ) : (
          <span className="text-[9px] text-gray-400 capitalize truncate block">
            {tooth.general_condition !== 'healthy' ? tooth.general_condition.replace('_', ' ') : ''}
          </span>
        )}
      </div>
    </div>
  )
}
