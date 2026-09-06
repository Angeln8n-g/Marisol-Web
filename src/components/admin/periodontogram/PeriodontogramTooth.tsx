import React from 'react'
import type { PeriodontogramToothData, PeriodontogramSiteData } from '../../../types'

interface PeriodontogramToothProps {
  tooth: PeriodontogramToothData
  aspect: 'vestibular' | 'palatal_lingual'
  isUpper: boolean
  onChange: (updated: PeriodontogramToothData) => void
}

export const PeriodontogramTooth: React.FC<PeriodontogramToothProps> = ({
  tooth,
  aspect,
  isUpper,
  onChange,
}) => {
  const sites = tooth[aspect]
  const isMissing = tooth.status === 'missing'
  const isImplant = tooth.status === 'implant'

  const handleStatusChange = (newStatus: 'present' | 'missing' | 'implant') => {
    onChange({
      ...tooth,
      status: newStatus,
    })
  }

  const handleMobilityChange = (m: 0 | 1 | 2 | 3) => {
    onChange({
      ...tooth,
      mobility: m,
    })
  }

  const handleFurcaChange = (f: 0 | 1 | 2 | 3) => {
    onChange({
      ...tooth,
      furcation: f,
    })
  }

  const handleSiteChange = (
    siteKey: 'distal' | 'middle' | 'mesial',
    field: keyof PeriodontogramSiteData,
    value: unknown
  ) => {
    const currentSite = sites[siteKey]
    const updatedSite: PeriodontogramSiteData = {
      ...currentSite,
      [field]: value,
    }

    // Auto calculate clinical attachment (NIC = PS + MG)
    if (field === 'probing_depth' || field === 'gingival_margin') {
      const pd = field === 'probing_depth' ? Number(value) : currentSite.probing_depth
      const gm = field === 'gingival_margin' ? Number(value) : currentSite.gingival_margin
      updatedSite.clinical_attachment = (isNaN(pd) ? 0 : pd) + (isNaN(gm) ? 0 : gm)
    }

    onChange({
      ...tooth,
      [aspect]: {
        ...sites,
        [siteKey]: updatedSite,
      },
    })
  }

  // Get color for probing depth
  const getPdColor = (pd: number) => {
    if (pd >= 6) return 'text-red-600 font-bold bg-red-50 border-red-300'
    if (pd >= 4) return 'text-amber-700 font-bold bg-amber-50 border-amber-300'
    return 'text-navy border-gray-200'
  }

  const siteKeys: Array<'distal' | 'middle' | 'mesial'> = ['distal', 'middle', 'mesial']

  return (
    <div
      className={`w-28 flex flex-col items-center border rounded-lg p-1.5 transition-colors text-xs font-montserrat select-none ${
        isMissing
          ? 'bg-gray-100/70 border-gray-300 opacity-60'
          : isImplant
          ? 'bg-blue-50/40 border-blue-200'
          : 'bg-white border-gray-200 hover:border-gold/60'
      }`}
    >
      {/* Cabecera del Diente: Número FDI y Estado */}
      <div className="w-full flex items-center justify-between pb-1 border-b border-gray-100 text-[11px]">
        <span className="font-bold text-navy font-montserrat">{tooth.tooth_number}</span>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            title="Diente Presente"
            onClick={() => handleStatusChange('present')}
            className={`px-1 py-0.5 rounded text-[9px] font-bold ${
              tooth.status === 'present' ? 'bg-navy text-gold' : 'text-gray-400 hover:text-navy'
            }`}
          >
            P
          </button>
          <button
            type="button"
            title="Implante"
            onClick={() => handleStatusChange('implant')}
            className={`px-1 py-0.5 rounded text-[9px] font-bold ${
              tooth.status === 'implant' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-blue-600'
            }`}
          >
            I
          </button>
          <button
            type="button"
            title="Diente Ausente"
            onClick={() => handleStatusChange('missing')}
            className={`px-1 py-0.5 rounded text-[9px] font-bold ${
              tooth.status === 'missing' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-red-500'
            }`}
          >
            A
          </button>
        </div>
      </div>

      {/* Controles de Movilidad y Furca */}
      {!isMissing && (
        <div className="w-full flex items-center justify-between py-1 px-0.5 text-[10px] text-gray-500 border-b border-gray-100">
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-semibold text-gray-400">Mov:</span>
            <select
              value={tooth.mobility}
              onChange={(e) => handleMobilityChange(Number(e.target.value) as 0 | 1 | 2 | 3)}
              className="bg-gray-50 rounded px-0.5 text-[10px] font-bold text-navy border border-gray-200 focus:outline-none"
            >
              <option value="0">0</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>

          {tooth.furcation !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-semibold text-amber-700">Fur:</span>
              <select
                value={tooth.furcation}
                onChange={(e) => handleFurcaChange(Number(e.target.value) as 0 | 1 | 2 | 3)}
                className={`bg-gray-50 rounded px-0.5 text-[10px] font-bold border focus:outline-none ${
                  tooth.furcation > 0 ? 'text-amber-800 border-amber-300' : 'text-gray-500 border-gray-200'
                }`}
              >
                <option value="0">0</option>
                <option value="1">I</option>
                <option value="2">II</option>
                <option value="3">III</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Representación Anatómica SVG del Diente */}
      <div className="relative w-full h-24 my-1 flex items-center justify-center">
        {isMissing ? (
          <div className="flex flex-col items-center justify-center text-gray-400">
            <svg className="w-12 h-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-[10px] font-medium text-gray-400">Ausente</span>
          </div>
        ) : isImplant ? (
          <svg className="w-12 h-20 text-blue-500" viewBox="0 0 40 80" fill="currentColor">
            {/* Tornillo Implante */}
            <rect x="14" y={isUpper ? 5 : 45} width="12" height="30" rx="3" fill="#64748b" />
            <line x1="12" y1={isUpper ? 12 : 52} x2="28" y2={isUpper ? 12 : 52} stroke="#334155" strokeWidth="2" />
            <line x1="12" y1={isUpper ? 18 : 58} x2="28" y2={isUpper ? 18 : 58} stroke="#334155" strokeWidth="2" />
            <line x1="12" y1={isUpper ? 24 : 64} x2="28" y2={isUpper ? 24 : 64} stroke="#334155" strokeWidth="2" />
            {/* Corona / Pilar */}
            <path
              d={
                isUpper
                  ? 'M 10 40 Q 20 75 30 40 Z'
                  : 'M 10 40 Q 20 5 30 40 Z'
              }
              fill="#cbd5e1"
              stroke="#475569"
              strokeWidth="1.5"
            />
          </svg>
        ) : (
          <svg className="w-14 h-22" viewBox="0 0 50 80">
            {/* Cuadrícula milimétrica de referencia (3, 6, 9 mm) */}
            <line x1="5" y1="20" x2="45" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2,2" />
            <line x1="5" y1="40" x2="45" y2="40" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2,2" />
            <line x1="5" y1="60" x2="45" y2="60" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2,2" />

            {isUpper ? (
              // Diente Superior: Raíz arriba (0 a 45), Corona abajo (45 a 75)
              <g>
                {/* Raíces */}
                <path
                  d="M 16 45 C 14 25 12 10 20 6 C 24 18 26 28 25 45 C 24 28 26 18 30 6 C 38 10 36 25 34 45 Z"
                  fill="#fef3c7"
                  stroke="#d97706"
                  strokeWidth="1.2"
                />
                {/* Corona anatómica */}
                <path
                  d="M 12 45 C 8 52 10 72 25 76 C 40 72 42 52 38 45 Z"
                  fill="#ffffff"
                  stroke="#64748b"
                  strokeWidth="1.5"
                />
              </g>
            ) : (
              // Diente Inferior: Corona arriba (5 a 35), Raíz abajo (35 a 75)
              <g>
                {/* Corona anatómica */}
                <path
                  d="M 12 35 C 8 28 10 8 25 4 C 40 8 42 28 38 35 Z"
                  fill="#ffffff"
                  stroke="#64748b"
                  strokeWidth="1.5"
                />
                {/* Raíces */}
                <path
                  d="M 16 35 C 14 55 12 70 20 74 C 24 62 26 52 25 35 C 24 52 26 62 30 74 C 38 70 36 55 34 35 Z"
                  fill="#fef3c7"
                  stroke="#d97706"
                  strokeWidth="1.2"
                />
              </g>
            )}

            {/* Puntos de Sangrado BOP */}
            {sites.distal.bleeding && <circle cx="12" cy={isUpper ? 45 : 35} r="3" fill="#ef4444" />}
            {sites.middle.bleeding && <circle cx="25" cy={isUpper ? 45 : 35} r="3" fill="#ef4444" />}
            {sites.mesial.bleeding && <circle cx="38" cy={isUpper ? 45 : 35} r="3" fill="#ef4444" />}

            {/* Puntos de Placa */}
            {sites.distal.plaque && <circle cx="12" cy={isUpper ? 52 : 28} r="2.5" fill="#3b82f6" />}
            {sites.middle.plaque && <circle cx="25" cy={isUpper ? 52 : 28} r="2.5" fill="#3b82f6" />}
            {sites.mesial.plaque && <circle cx="38" cy={isUpper ? 52 : 28} r="2.5" fill="#3b82f6" />}

            {/* Puntos de Supuración */}
            {sites.distal.suppuration && <circle cx="12" cy={isUpper ? 38 : 42} r="2.5" fill="#eab308" />}
            {sites.middle.suppuration && <circle cx="25" cy={isUpper ? 38 : 42} r="2.5" fill="#eab308" />}
            {sites.mesial.suppuration && <circle cx="38" cy={isUpper ? 38 : 42} r="2.5" fill="#eab308" />}
          </svg>
        )}
      </div>

      {/* Fila de Toggles: Sangrado (BOP), Placa, Supuración */}
      {!isMissing && (
        <div className="w-full space-y-1 my-1 border-t border-b border-gray-100 py-1 text-[10px]">
          {/* Fila Sangrado BOP */}
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-bold text-red-600">BOP:</span>
            <div className="flex gap-1">
              {siteKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSiteChange(key, 'bleeding', !sites[key].bleeding)}
                  className={`w-5 h-4 rounded flex items-center justify-center font-bold text-[9px] transition-colors ${
                    sites[key].bleeding ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-red-100'
                  }`}
                  title={`Sangrado al sondaje en ${key}`}
                >
                  ●
                </button>
              ))}
            </div>
          </div>

          {/* Fila Placa bacteriana */}
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-bold text-blue-600">Placa:</span>
            <div className="flex gap-1">
              {siteKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSiteChange(key, 'plaque', !sites[key].plaque)}
                  className={`w-5 h-4 rounded flex items-center justify-center font-bold text-[9px] transition-colors ${
                    sites[key].plaque ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400 hover:bg-blue-100'
                  }`}
                  title={`Placa en ${key}`}
                >
                  ■
                </button>
              ))}
            </div>
          </div>

          {/* Fila Supuración */}
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-bold text-amber-600">Pus:</span>
            <div className="flex gap-1">
              {siteKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSiteChange(key, 'suppuration', !sites[key].suppuration)}
                  className={`w-5 h-4 rounded flex items-center justify-center font-bold text-[9px] transition-colors ${
                    sites[key].suppuration ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-amber-100'
                  }`}
                  title={`Supuración en ${key}`}
                >
                  ▲
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mediciones Numéricas (MG, PS, NIC) */}
      {!isMissing && (
        <div className="w-full space-y-1 text-[10px]">
          {/* Margen Gingival (MG) */}
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold text-gray-400">MG:</span>
            <div className="flex gap-1">
              {siteKeys.map((key) => (
                <input
                  key={key}
                  type="number"
                  min="-9"
                  max="15"
                  value={sites[key].gingival_margin}
                  onChange={(e) => handleSiteChange(key, 'gingival_margin', Number(e.target.value))}
                  className="w-5 h-5 text-center text-[10px] bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gold"
                  title={`Margen gingival ${key} en mm`}
                />
              ))}
            </div>
          </div>

          {/* Profundidad de Sondaje (PS) */}
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-navy">PS:</span>
            <div className="flex gap-1">
              {siteKeys.map((key) => (
                <input
                  key={key}
                  type="number"
                  min="0"
                  max="15"
                  value={sites[key].probing_depth}
                  onChange={(e) => handleSiteChange(key, 'probing_depth', Number(e.target.value))}
                  className={`w-5 h-5 text-center text-[10px] border rounded focus:outline-none focus:ring-1 focus:ring-gold ${getPdColor(
                    sites[key].probing_depth
                  )}`}
                  title={`Profundidad de sondaje ${key} en mm`}
                />
              ))}
            </div>
          </div>

          {/* Nivel de Inserción Clínica (NIC = PS + MG) */}
          <div className="flex items-center justify-between bg-sand/20 px-1 py-0.5 rounded">
            <span className="text-[9px] font-bold text-gold">NIC:</span>
            <div className="flex gap-1">
              {siteKeys.map((key) => (
                <span
                  key={key}
                  className="w-5 text-center text-[10px] font-bold text-navy"
                  title={`Nivel de inserción clínica ${key} (PS + MG)`}
                >
                  {sites[key].clinical_attachment}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
