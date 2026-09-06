import React, { useState } from 'react'

export type ToothViewType = 'upper_vestibular' | 'upper_palatal' | 'lower_lingual' | 'lower_vestibular'

interface SepaToothArtworkProps {
  toothNumber: number
  view: ToothViewType
  isMissing?: boolean
  isImplant?: boolean
}

export const SepaToothArtwork: React.FC<SepaToothArtworkProps> = ({
  toothNumber,
  view,
  isMissing = false,
  isImplant = false,
}) => {
  const [imageError, setImageError] = useState(false)
  const isUpper = view.startsWith('upper')

  if (isMissing) {
    return (
      <div className="w-full h-24 flex items-center justify-center bg-white select-none relative">
        <img
          src={`/images/periodontogram/${view}_${toothNumber}.png`}
          alt={`Diente ${toothNumber} ausente`}
          className="h-full w-auto max-w-full object-contain mx-auto opacity-20 filter grayscale"
          loading="lazy"
          onError={() => setImageError(true)}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-7 h-7 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2.5" strokeDasharray="3,3" />
            <line x1="20" y1="4" x2="4" y2="20" strokeWidth="2.5" strokeDasharray="3,3" />
          </svg>
        </div>
      </div>
    )
  }

  if (isImplant) {
    return (
      <div className="w-full h-24 flex items-center justify-center bg-white select-none">
        <svg className="w-7 h-20" viewBox="0 0 30 80">
          <defs>
            <linearGradient id={`implantGrad-${toothNumber}-${view}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
          </defs>
          <rect x="9" y={isUpper ? 5 : 40} width="12" height="35" rx="3" fill={`url(#implantGrad-${toothNumber}-${view})`} />
          {/* Roscas del implante */}
          <line x1="7" y1={isUpper ? 12 : 47} x2="23" y2={isUpper ? 12 : 47} stroke="#334155" strokeWidth="1.5" />
          <line x1="7" y1={isUpper ? 18 : 53} x2="23" y2={isUpper ? 18 : 53} stroke="#334155" strokeWidth="1.5" />
          <line x1="7" y1={isUpper ? 24 : 59} x2="23" y2={isUpper ? 24 : 59} stroke="#334155" strokeWidth="1.5" />
          <line x1="7" y1={isUpper ? 30 : 65} x2="23" y2={isUpper ? 30 : 65} stroke="#334155" strokeWidth="1.5" />
          {/* Pilar y corona protésica */}
          <path
            d={isUpper ? 'M 6 42 Q 15 78 24 42 Z' : 'M 6 38 Q 15 2 24 38 Z'}
            fill="#e2e8f0"
            stroke="#64748b"
            strokeWidth="1.2"
          />
        </svg>
      </div>
    )
  }

  // 1. Renderizar imagen 3D real extraída del PDF oficial SEPA
  if (!imageError) {
    return (
      <div className="w-full h-24 flex items-center justify-center bg-white select-none relative overflow-hidden">
        <img
          src={`/images/periodontogram/${view}_${toothNumber}.png`}
          alt={`Diente ${toothNumber} (${view})`}
          className="h-full w-auto max-w-full object-contain mx-auto pointer-events-none transition-transform duration-150 hover:scale-105"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      </div>
    )
  }

  // Identify tooth anatomy class for SVG fallback
  const lastDigit = toothNumber % 10
  const isMolar = lastDigit >= 6 // 6, 7, 8
  const isPremolar = lastDigit === 4 || lastDigit === 5
  const isCanine = lastDigit === 3
  const isLateral = lastDigit === 2
  const isCentral = lastDigit === 1

  return (
    <div className="w-full h-24 flex items-center justify-center relative select-none">
      {/* Línea de base anatómica (cementoenamel junction) */}
      <div
        className={`absolute left-0 right-0 border-t border-gray-300 pointer-events-none opacity-40 ${
          isUpper ? 'bottom-8' : 'top-8'
        }`}
      />

      <svg className="w-8 h-24 overflow-visible" viewBox="0 0 40 100">
        <defs>
          {/* Gradiente realista de corona blanco-marfil perlado con sombra sutil */}
          <linearGradient id={`crownGrad-${toothNumber}-${view}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="25%" stopColor="#f1f5f9" />
            <stop offset="60%" stopColor="#ffffff" />
            <stop offset="85%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>

          {/* Gradiente realista de raíz en tono gris-cemento con sombreado 3D */}
          <linearGradient id={`rootGrad-${toothNumber}-${view}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="30%" stopColor="#cbd5e1" />
            <stop offset="65%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>

          {/* Sombra de relieve */}
          <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0.5" dy="0.5" stdDeviation="0.8" floodOpacity="0.15" />
          </filter>
        </defs>

        {isUpper ? (
          // ================= UPPER TEETH (Raíces arriba de 0 a 65, Corona abajo de 65 a 95) =================
          <g filter="url(#softShadow)">
            {/* RAÍCES */}
            {isMolar && (
              // Molares Superiores: 3 raíces divergentes
              <path
                d="M 12 65 C 10 40 4 15 11 5 C 15 15 18 35 20 65 C 22 35 25 15 29 5 C 36 15 30 40 28 65 Z"
                fill={`url(#rootGrad-${toothNumber}-${view})`}
                stroke="#64748b"
                strokeWidth="0.8"
              />
            )}

            {isPremolar && (
              // Premolares Superiores: 2 raíces o raíz ancha biselada
              <path
                d="M 14 65 C 12 42 10 12 18 8 C 22 18 24 35 26 65 Z"
                fill={`url(#rootGrad-${toothNumber}-${view})`}
                stroke="#64748b"
                strokeWidth="0.8"
              />
            )}

            {isCanine && (
              // Canino Superior: Raíz única, muy larga y robusta
              <path
                d="M 13 65 C 12 40 14 6 20 3 C 26 6 28 40 27 65 Z"
                fill={`url(#rootGrad-${toothNumber}-${view})`}
                stroke="#64748b"
                strokeWidth="0.8"
              />
            )}

            {(isCentral || isLateral) && (
              // Incisivos Superiores: Raíz cónica estilizada
              <path
                d={
                  isCentral
                    ? 'M 14 65 C 13 40 15 10 20 5 C 25 10 27 40 26 65 Z'
                    : 'M 15 65 C 14 40 16 10 20 6 C 24 10 26 40 25 65 Z'
                }
                fill={`url(#rootGrad-${toothNumber}-${view})`}
                stroke="#64748b"
                strokeWidth="0.8"
              />
            )}

            {/* CORONA ANATÓMICA */}
            {isMolar && (
              <path
                d="M 8 65 C 4 72 6 92 20 95 C 34 92 36 72 32 65 Z"
                fill={`url(#crownGrad-${toothNumber}-${view})`}
                stroke="#475569"
                strokeWidth="1"
              />
            )}

            {isPremolar && (
              <path
                d="M 10 65 C 7 74 10 93 20 95 C 30 93 33 74 30 65 Z"
                fill={`url(#crownGrad-${toothNumber}-${view})`}
                stroke="#475569"
                strokeWidth="1"
              />
            )}

            {isCanine && (
              <path
                d="M 11 65 C 8 74 12 94 20 98 C 28 94 32 74 29 65 Z"
                fill={`url(#crownGrad-${toothNumber}-${view})`}
                stroke="#475569"
                strokeWidth="1"
              />
            )}

            {isCentral && (
              <path
                d="M 9 65 C 8 72 10 95 20 96 C 30 95 32 72 31 65 Z"
                fill={`url(#crownGrad-${toothNumber}-${view})`}
                stroke="#475569"
                strokeWidth="1"
              />
            )}

            {isLateral && (
              <path
                d="M 11 65 C 10 73 12 94 20 95 C 28 94 30 73 29 65 Z"
                fill={`url(#crownGrad-${toothNumber}-${view})`}
                stroke="#475569"
                strokeWidth="1"
              />
            )}

            {/* Línea cervical de unión cemento-esmalte (CEJ) */}
            <path
              d="M 11 65 Q 20 62 29 65"
              fill="none"
              stroke="#64748b"
              strokeWidth="0.8"
              strokeOpacity="0.7"
            />
          </g>
        ) : (
          // ================= LOWER TEETH (Corona arriba de 5 a 35, Raíces abajo de 35 a 95) =================
          <g filter="url(#softShadow)">
            {/* CORONA ANATÓMICA */}
            {isMolar && (
              <path
                d="M 8 35 C 4 28 6 8 20 5 C 34 8 36 28 32 35 Z"
                fill={`url(#crownGrad-${toothNumber}-${view})`}
                stroke="#475569"
                strokeWidth="1"
              />
            )}

            {isPremolar && (
              <path
                d="M 10 35 C 7 26 10 7 20 5 C 30 7 33 26 30 35 Z"
                fill={`url(#crownGrad-${toothNumber}-${view})`}
                stroke="#475569"
                strokeWidth="1"
              />
            )}

            {isCanine && (
              <path
                d="M 11 35 C 8 26 12 6 20 2 C 28 6 32 26 29 35 Z"
                fill={`url(#crownGrad-${toothNumber}-${view})`}
                stroke="#475569"
                strokeWidth="1"
              />
            )}

            {(isCentral || isLateral) && (
              <path
                d="M 12 35 C 10 26 12 6 20 4 C 28 6 30 26 28 35 Z"
                fill={`url(#crownGrad-${toothNumber}-${view})`}
                stroke="#475569"
                strokeWidth="1"
              />
            )}

            {/* Línea cervical de unión cemento-esmalte (CEJ) */}
            <path
              d="M 11 35 Q 20 38 29 35"
              fill="none"
              stroke="#64748b"
              strokeWidth="0.8"
              strokeOpacity="0.7"
            />

            {/* RAÍCES */}
            {isMolar && (
              // Molares Inferiores: 2 raíces divergentes (mesial y distal)
              <path
                d="M 12 35 C 10 60 4 85 11 95 C 15 85 18 65 20 35 C 22 65 25 85 29 95 C 36 85 30 60 28 35 Z"
                fill={`url(#rootGrad-${toothNumber}-${view})`}
                stroke="#64748b"
                strokeWidth="0.8"
              />
            )}

            {isPremolar && (
              // Premolares Inferiores: Raíz cónica
              <path
                d="M 14 35 C 12 58 14 88 20 94 C 26 88 28 58 26 35 Z"
                fill={`url(#rootGrad-${toothNumber}-${view})`}
                stroke="#64748b"
                strokeWidth="0.8"
              />
            )}

            {isCanine && (
              // Canino Inferior: Raíz larga única
              <path
                d="M 13 35 C 12 60 14 94 20 97 C 26 94 28 60 27 35 Z"
                fill={`url(#rootGrad-${toothNumber}-${view})`}
                stroke="#64748b"
                strokeWidth="0.8"
              />
            )}

            {(isCentral || isLateral) && (
              // Incisivos Inferiores: Raíces finas rectas
              <path
                d="M 15 35 C 14 60 16 90 20 95 C 24 90 26 60 25 35 Z"
                fill={`url(#rootGrad-${toothNumber}-${view})`}
                stroke="#64748b"
                strokeWidth="0.8"
              />
            )}
          </g>
        )}
      </svg>
    </div>
  )
}
