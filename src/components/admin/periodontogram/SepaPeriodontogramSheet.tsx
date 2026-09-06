import React from 'react'
import type { Patient, PeriodontogramToothData, PeriodontogramStats, PeriodontogramSiteData } from '../../../types'
import {
  UPPER_TEETH_Q1,
  UPPER_TEETH_Q2,
  LOWER_TEETH_Q4,
  LOWER_TEETH_Q3,
} from './periodontogramConstants'
import { SepaToothArtwork } from './SepaToothArtwork'

interface SepaPeriodontogramSheetProps {
  patient: Patient
  teethData: Record<string, PeriodontogramToothData>
  stats: PeriodontogramStats
  examDate?: string
  comments?: string
  doctorName?: string
  onToothChange: (toothNumber: number, updated: PeriodontogramToothData) => void
  onCommentsChange?: (c: string) => void
}

export const SepaPeriodontogramSheet: React.FC<SepaPeriodontogramSheetProps> = ({
  patient,
  teethData,
  stats,
  examDate = new Date().toISOString(),
  comments = '',
  doctorName = 'Dra. Marisol García',
  onToothChange,
  onCommentsChange,
}) => {
  // Format tooth number with dot (e.g. 18 -> 1.8)
  const formatToothNumber = (num: number) => {
    const q = Math.floor(num / 10)
    const t = num % 10
    return `${q}.${t}`
  }

  // Update a single site field (probing depth, margin, bleeding, plaque, suppuration)
  const handleSiteUpdate = (
    toothNum: number,
    aspect: 'vestibular' | 'palatal_lingual',
    siteKey: 'distal' | 'middle' | 'mesial',
    field: keyof PeriodontogramSiteData,
    val: unknown
  ) => {
    const tooth = teethData[toothNum.toString()]
    if (!tooth) return
    const currentSite = tooth[aspect][siteKey]
    const updatedSite: PeriodontogramSiteData = {
      ...currentSite,
      [field]: val,
    }

    if (field === 'probing_depth' || field === 'gingival_margin') {
      const pd = field === 'probing_depth' ? Number(val) : currentSite.probing_depth
      const gm = field === 'gingival_margin' ? Number(val) : currentSite.gingival_margin
      updatedSite.clinical_attachment = (isNaN(pd) ? 0 : pd) + (isNaN(gm) ? 0 : gm)
    }

    onToothChange(toothNum, {
      ...tooth,
      [aspect]: {
        ...tooth[aspect],
        [siteKey]: updatedSite,
      },
    })
  }

  // Update tooth-level field (mobility, furcation, implant, prognosis, anchura, nota)
  const handleToothFieldUpdate = (
    toothNum: number,
    field: keyof PeriodontogramToothData,
    val: unknown
  ) => {
    const tooth = teethData[toothNum.toString()]
    if (!tooth) return
    onToothChange(toothNum, {
      ...tooth,
      [field]: val,
    })
  }

  // Helper cell color for probing depth
  const getProbingDepthStyle = (val: number) => {
    if (val >= 6) return 'text-red-600 font-bold bg-red-50/70'
    if (val >= 4) return 'text-amber-700 font-semibold bg-amber-50/50'
    return 'text-gray-800'
  }

  // Render a 3-site row (Sangrado, Supuración, Placa, Margen, Profundidad)
  const renderTriSiteRow = (
    teethList: number[],
    aspect: 'vestibular' | 'palatal_lingual',
    type: 'bop' | 'pus' | 'plaque' | 'margin' | 'depth'
  ) => {
    return teethList.map((num) => {
      const tooth = teethData[num.toString()]
      if (!tooth) return null
      const sites = tooth[aspect]
      const siteKeys: Array<'distal' | 'middle' | 'mesial'> = ['distal', 'middle', 'mesial']

      if (type === 'bop' || type === 'pus' || type === 'plaque') {
        const fieldMap = {
          bop: { key: 'bleeding' as const, color: 'bg-red-600', activeChar: '●', label: 'Sangrado' },
          pus: { key: 'suppuration' as const, color: 'bg-amber-500', activeChar: '●', label: 'Supuración' },
          plaque: { key: 'plaque' as const, color: 'bg-blue-600', activeChar: '●', label: 'Placa' },
        }[type]

        return (
          <td key={num} className="p-0 border-r border-gray-300">
            <div className="flex h-5 w-full divide-x divide-gray-200">
              {siteKeys.map((site) => {
                const isActive = sites[site][fieldMap.key]
                return (
                  <button
                    key={site}
                    type="button"
                    onClick={() => handleSiteUpdate(num, aspect, site, fieldMap.key, !isActive)}
                    className="flex-1 h-full flex items-center justify-center hover:bg-gray-100 transition-colors focus:outline-none"
                    title={`${fieldMap.label} en ${formatToothNumber(num)} ${site}`}
                  >
                    {isActive ? (
                      <span className={`w-2 h-2 rounded-full ${fieldMap.color} inline-block`} />
                    ) : (
                      <span className="w-1 h-1 rounded-full bg-gray-200 inline-block opacity-40 hover:opacity-100" />
                    )}
                  </button>
                )
              })}
            </div>
          </td>
        )
      }

      if (type === 'margin') {
        return (
          <td key={num} className="p-0 border-r border-gray-300">
            <div className="flex h-5 w-full divide-x divide-gray-200 text-[10px] font-sans">
              {siteKeys.map((site) => (
                <input
                  key={site}
                  type="text"
                  inputMode="numeric"
                  value={sites[site].gingival_margin || 0}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10)
                    handleSiteUpdate(num, aspect, site, 'gingival_margin', isNaN(parsed) ? 0 : parsed)
                  }}
                  className="w-full text-center p-0 bg-transparent text-gray-700 hover:bg-gray-50 focus:bg-gold/10 focus:outline-none"
                />
              ))}
            </div>
          </td>
        )
      }

      if (type === 'depth') {
        return (
          <td key={num} className="p-0 border-r border-gray-300">
            <div className="flex h-5 w-full divide-x divide-gray-200 text-[10px] font-sans">
              {siteKeys.map((site) => {
                const depthVal = sites[site].probing_depth || 0
                return (
                  <input
                    key={site}
                    type="text"
                    inputMode="numeric"
                    value={depthVal}
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value, 10)
                      handleSiteUpdate(num, aspect, site, 'probing_depth', isNaN(parsed) ? 0 : parsed)
                    }}
                    className={`w-full text-center p-0 font-medium hover:bg-gray-50 focus:bg-gold/10 focus:outline-none ${getProbingDepthStyle(
                      depthVal
                    )}`}
                  />
                )
              })}
            </div>
          </td>
        )
      }

      return null
    })
  }

  // Render whole-tooth rows (Movilidad, Implante, Furca, Anchura encía, Pronóstico, Nota)
  const renderSingleValueRow = (
    teethList: number[],
    type: 'implant' | 'mobility' | 'prognosis' | 'furca' | 'anchura' | 'nota' | 'toothNumber'
  ) => {
    return teethList.map((num) => {
      const tooth = teethData[num.toString()]
      if (!tooth) return null

      if (type === 'toothNumber') {
        return (
          <th
            key={num}
            className="w-[52px] min-w-[52px] max-w-[52px] h-6 text-center font-bold text-xs text-gray-900 border-r border-gray-300 bg-gray-50/80 font-sans"
          >
            {formatToothNumber(num)}
          </th>
        )
      }

      if (type === 'implant') {
        return (
          <td key={num} className="h-5 text-center border-r border-gray-300 p-0">
            <input
              type="checkbox"
              checked={tooth.status === 'implant'}
              onChange={(e) =>
                handleToothFieldUpdate(num, 'status', e.target.checked ? 'implant' : 'present')
              }
              className="w-3.5 h-3.5 rounded text-navy focus:ring-0 cursor-pointer"
            />
          </td>
        )
      }

      if (type === 'mobility') {
        return (
          <td key={num} className="h-5 text-center border-r border-gray-300 p-0 text-[10px] font-sans">
            <input
              type="text"
              value={tooth.mobility || 0}
              onChange={(e) => {
                const m = parseInt(e.target.value, 10)
                handleToothFieldUpdate(num, 'mobility', isNaN(m) ? 0 : m)
              }}
              className="w-full text-center p-0 bg-transparent text-gray-700 hover:bg-gray-50 focus:bg-gold/10 focus:outline-none"
            />
          </td>
        )
      }

      if (type === 'prognosis') {
        return (
          <td key={num} className="h-5 text-center border-r border-gray-300 p-0 text-[9px] font-sans">
            <input
              type="text"
              value={tooth.pronostico || ''}
              onChange={(e) => handleToothFieldUpdate(num, 'pronostico', e.target.value)}
              placeholder="—"
              className="w-full text-center p-0 bg-transparent text-gray-700 hover:bg-gray-50 focus:bg-gold/10 focus:outline-none"
            />
          </td>
        )
      }

      if (type === 'furca') {
        return (
          <td key={num} className="h-5 text-center border-r border-gray-300 p-0 text-[10px] font-sans">
            <input
              type="text"
              value={tooth.furcation || ''}
              onChange={(e) => {
                const f = parseInt(e.target.value, 10)
                handleToothFieldUpdate(num, 'furcation', isNaN(f) ? 0 : f)
              }}
              placeholder="—"
              className="w-full text-center p-0 bg-transparent text-amber-800 font-semibold hover:bg-gray-50 focus:bg-gold/10 focus:outline-none"
            />
          </td>
        )
      }

      if (type === 'anchura') {
        return (
          <td key={num} className="h-5 text-center border-r border-gray-300 p-0 text-[10px] font-sans">
            <input
              type="text"
              value={tooth.anchura_encia || 0}
              onChange={(e) => {
                const a = parseInt(e.target.value, 10)
                handleToothFieldUpdate(num, 'anchura_encia', isNaN(a) ? 0 : a)
              }}
              className="w-full text-center p-0 bg-transparent text-gray-700 hover:bg-gray-50 focus:bg-gold/10 focus:outline-none"
            />
          </td>
        )
      }

      if (type === 'nota') {
        return (
          <td key={num} className="h-5 text-center border-r border-gray-300 p-0 text-[9px] font-sans">
            <input
              type="text"
              value={tooth.notes || ''}
              onChange={(e) => handleToothFieldUpdate(num, 'notes', e.target.value)}
              placeholder=""
              className="w-full text-center p-0 bg-transparent text-gray-600 hover:bg-gray-50 focus:bg-gold/10 focus:outline-none"
            />
          </td>
        )
      }

      return null
    })
  }

  // Row header label cell (e.g. "Profundidad de sondaje", "Margen gingival", etc.)
  const renderRowHeader = (label: string) => (
    <td className="w-36 min-w-36 max-w-36 px-2 py-0.5 text-[10px] font-medium text-gray-700 border-r border-gray-300 bg-white text-right select-none whitespace-nowrap">
      {label}
    </td>
  )

  return (
    <div className="bg-white text-gray-900 font-montserrat select-none print:p-0">
      {/* ========================================================================= */}
      {/* PÁGINA 1: SUPERIOR */}
      {/* ========================================================================= */}
      <div className="p-6 max-w-[1280px] mx-auto bg-white border border-gray-200 rounded-xl shadow-sm mb-8 print:shadow-none print:border-none print:p-2 print:m-0 print:break-after-page print:[page-break-after:always]">
        {/* Encabezado Oficial: Sepa. / Periodontograma / Bexident by ISDIN */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold font-sans tracking-tight text-gray-900">Sepa</span>
            <span className="text-3xl font-bold text-gray-900">.</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-sans text-gray-900 tracking-wide text-center">
            Periodontograma
          </h1>

          <div className="text-right">
            <span className="text-lg sm:text-xl font-bold font-sans text-gray-900 tracking-tight block leading-none">
              Bexident
            </span>
            <span className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">
              by ISDIN · {doctorName}
            </span>
          </div>
        </div>

        {/* DATOS DEL PACIENTE */}
        <div className="mb-6 border border-gray-300 rounded-lg p-3 bg-white text-xs">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            DATOS DEL PACIENTE
          </p>

          <div className="grid grid-cols-5 gap-3 pb-3 border-b border-gray-200 text-xs">
            <div>
              <span className="text-[10px] text-gray-400 block font-medium">Fecha</span>
              <span className="font-semibold text-gray-800">{new Date(examDate).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-medium">Núm. Expediente</span>
              <span className="font-semibold text-gray-800">{patient.identification_number || 'EXP-' + patient.id.slice(0, 6).toUpperCase()}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-medium">Apellidos</span>
              <span className="font-semibold text-gray-800">{patient.full_name.split(' ').slice(1).join(' ') || '—'}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-medium">Nombre</span>
              <span className="font-semibold text-gray-800">{patient.full_name.split(' ')[0] || patient.full_name}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-medium">Fecha de nacimiento</span>
              <span className="font-semibold text-gray-800">{patient.birth_date ? new Date(patient.birth_date).toLocaleDateString() : '—'}</span>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[10px] text-gray-400 block font-medium">Comentarios</span>
            <input
              type="text"
              value={comments}
              onChange={(e) => onCommentsChange?.(e.target.value)}
              placeholder="Notas generales del examen periodontal superior..."
              className="w-full text-xs text-gray-700 bg-transparent focus:outline-none focus:bg-gold/5 rounded p-1"
            />
          </div>
        </div>

        {/* Título SUPERIOR */}
        <div className="text-center mb-3">
          <h2 className="text-sm font-semibold tracking-widest text-gray-600 uppercase font-sans">
            SUPERIOR
          </h2>
        </div>

        {/* TABLA MATRIZ SUPERIOR */}
        <div className="overflow-x-auto pb-4 scrollbar-thin">
          <table className="w-full border-collapse border border-gray-300 text-[10px] bg-white">
            <tbody>
              {/* FILA 1: Diente 1.8..1.1 | 2.1..2.8 */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('')}
                {renderSingleValueRow(UPPER_TEETH_Q1, 'toothNumber')}
                <td className="w-4 min-w-4 bg-gray-100 border-r border-gray-300" />
                {renderSingleValueRow(UPPER_TEETH_Q2, 'toothNumber')}
              </tr>

              {/* FILA 2: Implante */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Implante')}
                {renderSingleValueRow(UPPER_TEETH_Q1, 'implant')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderSingleValueRow(UPPER_TEETH_Q2, 'implant')}
              </tr>

              {/* FILA 3: Movilidad */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Movilidad')}
                {renderSingleValueRow(UPPER_TEETH_Q1, 'mobility')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderSingleValueRow(UPPER_TEETH_Q2, 'mobility')}
              </tr>

              {/* FILA 4: Pronóstico individual */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Pronóstico individual')}
                {renderSingleValueRow(UPPER_TEETH_Q1, 'prognosis')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderSingleValueRow(UPPER_TEETH_Q2, 'prognosis')}
              </tr>

              {/* FILA 5: Furca */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Furca')}
                {renderSingleValueRow(UPPER_TEETH_Q1, 'furca')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderSingleValueRow(UPPER_TEETH_Q2, 'furca')}
              </tr>

              {/* FILA 6: Sangrado */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Sangrado')}
                {renderTriSiteRow(UPPER_TEETH_Q1, 'vestibular', 'bop')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderTriSiteRow(UPPER_TEETH_Q2, 'vestibular', 'bop')}
              </tr>

              {/* FILA 7: Supuración */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Supuración')}
                {renderTriSiteRow(UPPER_TEETH_Q1, 'vestibular', 'pus')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderTriSiteRow(UPPER_TEETH_Q2, 'vestibular', 'pus')}
              </tr>

              {/* FILA 8: Placa */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Placa')}
                {renderTriSiteRow(UPPER_TEETH_Q1, 'vestibular', 'plaque')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderTriSiteRow(UPPER_TEETH_Q2, 'vestibular', 'plaque')}
              </tr>

              {/* FILA 9: Anchura encía */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Anchura encía')}
                {renderSingleValueRow(UPPER_TEETH_Q1, 'anchura')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderSingleValueRow(UPPER_TEETH_Q2, 'anchura')}
              </tr>

              {/* FILA 10: Margen gingival */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Margen gingival')}
                {renderTriSiteRow(UPPER_TEETH_Q1, 'vestibular', 'margin')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderTriSiteRow(UPPER_TEETH_Q2, 'vestibular', 'margin')}
              </tr>

              {/* FILA 11: Profundidad de sondaje */}
              <tr className="border-b-2 border-gray-400">
                {renderRowHeader('Profundidad de sondaje')}
                {renderTriSiteRow(UPPER_TEETH_Q1, 'vestibular', 'depth')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderTriSiteRow(UPPER_TEETH_Q2, 'vestibular', 'depth')}
              </tr>

              {/* ========================================================= */}
              {/* FILAS DE ILUSTRACIÓN ANATÓMICA DENTAL */}
              {/* ========================================================= */}
              {/* VESTIBULAR ANATOMY */}
              <tr className="border-b border-gray-200 bg-white">
                <td className="w-36 text-right pr-3 font-semibold text-xs text-gray-500 border-r border-gray-300">
                  Vestibular
                </td>
                {UPPER_TEETH_Q1.map((num) => (
                  <td key={num} className="p-0 border-r border-gray-300">
                    <SepaToothArtwork
                      toothNumber={num}
                      view="upper_vestibular"
                      isMissing={teethData[num.toString()]?.status === 'missing'}
                      isImplant={teethData[num.toString()]?.status === 'implant'}
                    />
                  </td>
                ))}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {UPPER_TEETH_Q2.map((num) => (
                  <td key={num} className="p-0 border-r border-gray-300">
                    <SepaToothArtwork
                      toothNumber={num}
                      view="upper_vestibular"
                      isMissing={teethData[num.toString()]?.status === 'missing'}
                      isImplant={teethData[num.toString()]?.status === 'implant'}
                    />
                  </td>
                ))}
              </tr>

              {/* PALATINO ANATOMY */}
              <tr className="border-b-2 border-gray-400 bg-white">
                <td className="w-36 text-right pr-3 font-semibold text-xs text-gray-500 border-r border-gray-300">
                  Palatino
                </td>
                {UPPER_TEETH_Q1.map((num) => (
                  <td key={num} className="p-0 border-r border-gray-300">
                    <SepaToothArtwork
                      toothNumber={num}
                      view="upper_palatal"
                      isMissing={teethData[num.toString()]?.status === 'missing'}
                      isImplant={teethData[num.toString()]?.status === 'implant'}
                    />
                  </td>
                ))}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {UPPER_TEETH_Q2.map((num) => (
                  <td key={num} className="p-0 border-r border-gray-300">
                    <SepaToothArtwork
                      toothNumber={num}
                      view="upper_palatal"
                      isMissing={teethData[num.toString()]?.status === 'missing'}
                      isImplant={teethData[num.toString()]?.status === 'implant'}
                    />
                  </td>
                ))}
              </tr>

              {/* ========================================================= */}
              {/* FILAS INFERIORES PALATINAS */}
              {/* ========================================================= */}
              {/* FILA: Profundidad de sondaje */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Profundidad de sondaje')}
                {renderTriSiteRow(UPPER_TEETH_Q1, 'palatal_lingual', 'depth')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderTriSiteRow(UPPER_TEETH_Q2, 'palatal_lingual', 'depth')}
              </tr>

              {/* FILA: Margen gingival */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Margen gingival')}
                {renderTriSiteRow(UPPER_TEETH_Q1, 'palatal_lingual', 'margin')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderTriSiteRow(UPPER_TEETH_Q2, 'palatal_lingual', 'margin')}
              </tr>

              {/* FILA: Placa */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Placa')}
                {renderTriSiteRow(UPPER_TEETH_Q1, 'palatal_lingual', 'plaque')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderTriSiteRow(UPPER_TEETH_Q2, 'palatal_lingual', 'plaque')}
              </tr>

              {/* FILA: Sangrado */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Sangrado')}
                {renderTriSiteRow(UPPER_TEETH_Q1, 'palatal_lingual', 'bop')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderTriSiteRow(UPPER_TEETH_Q2, 'palatal_lingual', 'bop')}
              </tr>

              {/* FILA: Supuración */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Supuración')}
                {renderTriSiteRow(UPPER_TEETH_Q1, 'palatal_lingual', 'pus')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderTriSiteRow(UPPER_TEETH_Q2, 'palatal_lingual', 'pus')}
              </tr>

              {/* FILA: Furca */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Furca')}
                {renderSingleValueRow(UPPER_TEETH_Q1, 'furca')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderSingleValueRow(UPPER_TEETH_Q2, 'furca')}
              </tr>

              {/* FILA: Nota */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Nota')}
                {renderSingleValueRow(UPPER_TEETH_Q1, 'nota')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderSingleValueRow(UPPER_TEETH_Q2, 'nota')}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PÁGINA 2: INFERIOR */}
      {/* ========================================================================= */}
      <div className="p-6 max-w-[1280px] mx-auto bg-white border border-gray-200 rounded-xl shadow-sm print:shadow-none print:border-none print:p-2 print:m-0">
        {/* Título INFERIOR */}
        <div className="text-center mb-3">
          <h2 className="text-sm font-semibold tracking-widest text-gray-600 uppercase font-sans">
            INFERIOR
          </h2>
        </div>

        {/* TABLA MATRIZ INFERIOR */}
        <div className="overflow-x-auto pb-4 scrollbar-thin">
          <table className="w-full border-collapse border border-gray-300 text-[10px] bg-white">
            <tbody>
              {/* FILA 1: Nota */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Nota')}
                {renderSingleValueRow(LOWER_TEETH_Q4, 'nota')}
                <td className="w-4 min-w-4 bg-gray-100 border-r border-gray-300" />
                {renderSingleValueRow(LOWER_TEETH_Q3, 'nota')}
              </tr>

              {/* FILA 2: Furca */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Furca')}
                {renderSingleValueRow(LOWER_TEETH_Q4, 'furca')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderSingleValueRow(LOWER_TEETH_Q3, 'furca')}
              </tr>

              {/* FILA 3: Sangrado */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Sangrado')}
                {renderTriSiteRow(LOWER_TEETH_Q4, 'palatal_lingual', 'bop')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderTriSiteRow(LOWER_TEETH_Q3, 'palatal_lingual', 'bop')}
              </tr>

              {/* FILA 4: Supuración */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Supuración')}
                {renderTriSiteRow(LOWER_TEETH_Q4, 'palatal_lingual', 'pus')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderTriSiteRow(LOWER_TEETH_Q3, 'palatal_lingual', 'pus')}
              </tr>

              {/* FILA 5: Placa */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Placa')}
                {renderTriSiteRow(LOWER_TEETH_Q4, 'palatal_lingual', 'plaque')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderTriSiteRow(LOWER_TEETH_Q3, 'palatal_lingual', 'plaque')}
              </tr>

              {/* FILA 6: Margen gingival */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Margen gingival')}
                {renderTriSiteRow(LOWER_TEETH_Q4, 'palatal_lingual', 'margin')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderTriSiteRow(LOWER_TEETH_Q3, 'palatal_lingual', 'margin')}
              </tr>

              {/* FILA 7: Profundidad de sondaje */}
              <tr className="border-b-2 border-gray-400">
                {renderRowHeader('Profundidad de sondaje')}
                {renderTriSiteRow(LOWER_TEETH_Q4, 'palatal_lingual', 'depth')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderTriSiteRow(LOWER_TEETH_Q3, 'palatal_lingual', 'depth')}
              </tr>

              {/* ========================================================= */}
              {/* FILAS DE ILUSTRACIÓN ANATÓMICA INFERIOR */}
              {/* ========================================================= */}
              {/* LINGUAL ANATOMY */}
              <tr className="border-b border-gray-200 bg-white">
                <td className="w-36 text-right pr-3 font-semibold text-xs text-gray-500 border-r border-gray-300">
                  Lingual
                </td>
                {LOWER_TEETH_Q4.map((num) => (
                  <td key={num} className="p-0 border-r border-gray-300">
                    <SepaToothArtwork
                      toothNumber={num}
                      view="lower_lingual"
                      isMissing={teethData[num.toString()]?.status === 'missing'}
                      isImplant={teethData[num.toString()]?.status === 'implant'}
                    />
                  </td>
                ))}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {LOWER_TEETH_Q3.map((num) => (
                  <td key={num} className="p-0 border-r border-gray-300">
                    <SepaToothArtwork
                      toothNumber={num}
                      view="lower_lingual"
                      isMissing={teethData[num.toString()]?.status === 'missing'}
                      isImplant={teethData[num.toString()]?.status === 'implant'}
                    />
                  </td>
                ))}
              </tr>

              {/* VESTIBULAR ANATOMY */}
              <tr className="border-b-2 border-gray-400 bg-white">
                <td className="w-36 text-right pr-3 font-semibold text-xs text-gray-500 border-r border-gray-300">
                  Vestibular
                </td>
                {LOWER_TEETH_Q4.map((num) => (
                  <td key={num} className="p-0 border-r border-gray-300">
                    <SepaToothArtwork
                      toothNumber={num}
                      view="lower_vestibular"
                      isMissing={teethData[num.toString()]?.status === 'missing'}
                      isImplant={teethData[num.toString()]?.status === 'implant'}
                    />
                  </td>
                ))}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {LOWER_TEETH_Q3.map((num) => (
                  <td key={num} className="p-0 border-r border-gray-300">
                    <SepaToothArtwork
                      toothNumber={num}
                      view="lower_vestibular"
                      isMissing={teethData[num.toString()]?.status === 'missing'}
                      isImplant={teethData[num.toString()]?.status === 'implant'}
                    />
                  </td>
                ))}
              </tr>

              {/* ========================================================= */}
              {/* FILAS INFERIORES VESTIBULARES */}
              {/* ========================================================= */}
              {/* FILA: Profundidad de sondaje */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Profundidad de sondaje')}
                {renderTriSiteRow(LOWER_TEETH_Q4, 'vestibular', 'depth')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderTriSiteRow(LOWER_TEETH_Q3, 'vestibular', 'depth')}
              </tr>

              {/* FILA: Margen gingival */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Margen gingival')}
                {renderTriSiteRow(LOWER_TEETH_Q4, 'vestibular', 'margin')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderTriSiteRow(LOWER_TEETH_Q3, 'vestibular', 'margin')}
              </tr>

              {/* FILA: Anchura encía */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Anchura encía')}
                {renderSingleValueRow(LOWER_TEETH_Q4, 'anchura')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderSingleValueRow(LOWER_TEETH_Q3, 'anchura')}
              </tr>

              {/* FILA: Placa */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Placa')}
                {renderTriSiteRow(LOWER_TEETH_Q4, 'vestibular', 'plaque')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderTriSiteRow(LOWER_TEETH_Q3, 'vestibular', 'plaque')}
              </tr>

              {/* FILA: Sangrado */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Sangrado')}
                {renderTriSiteRow(LOWER_TEETH_Q4, 'vestibular', 'bop')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderTriSiteRow(LOWER_TEETH_Q3, 'vestibular', 'bop')}
              </tr>

              {/* FILA: Supuración */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Supuración')}
                {renderTriSiteRow(LOWER_TEETH_Q4, 'vestibular', 'pus')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderTriSiteRow(LOWER_TEETH_Q3, 'vestibular', 'pus')}
              </tr>

              {/* FILA: Furca */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Furca')}
                {renderSingleValueRow(LOWER_TEETH_Q4, 'furca')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderSingleValueRow(LOWER_TEETH_Q3, 'furca')}
              </tr>

              {/* FILA: Pronóstico individual */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Pronóstico individual')}
                {renderSingleValueRow(LOWER_TEETH_Q4, 'prognosis')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderSingleValueRow(LOWER_TEETH_Q3, 'prognosis')}
              </tr>

              {/* FILA: Movilidad */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Movilidad')}
                {renderSingleValueRow(LOWER_TEETH_Q4, 'mobility')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderSingleValueRow(LOWER_TEETH_Q3, 'mobility')}
              </tr>

              {/* FILA: Implante */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('Implante')}
                {renderSingleValueRow(LOWER_TEETH_Q4, 'implant')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderSingleValueRow(LOWER_TEETH_Q3, 'implant')}
              </tr>

              {/* FILA: Número de diente */}
              <tr className="border-b border-gray-300">
                {renderRowHeader('')}
                {renderSingleValueRow(LOWER_TEETH_Q4, 'toothNumber')}
                <td className="w-4 bg-gray-100 border-r border-gray-300" />
                {renderSingleValueRow(LOWER_TEETH_Q3, 'toothNumber')}
              </tr>
            </tbody>
          </table>
        </div>

        {/* ========================================================================= */}
        {/* BARRA INFERIOR DE TOTALES Y PROMEDIOS SEPA */}
        {/* ========================================================================= */}
        <div className="mt-4 bg-gray-100 rounded-lg p-2.5 text-xs text-gray-800 font-sans border border-gray-300">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="border-r border-gray-300 pr-2">
              <span className="font-semibold text-gray-700">
                Media de prof. de sondaje = {stats.media_profundidad ?? 0} mm
              </span>
            </div>
            <div className="border-r border-gray-300 pr-2">
              <span className="font-semibold text-gray-700">
                Media de nivel de inserción = {stats.media_nivel_insercion ?? 0}mm
              </span>
            </div>
            <div className="border-r border-gray-300 pr-2">
              <span className="font-semibold text-gray-700">
                {stats.plaque_percentage}% Placa
              </span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">
                {stats.bop_percentage}% Sangrado al sondaje
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
