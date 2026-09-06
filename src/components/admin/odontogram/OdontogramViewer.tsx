import React, { useState, useMemo } from 'react'
import type { Patient, ToothState, ToothCondition, ToothSurface } from '../../../types'
import {
  ADULT_UPPER_Q1,
  ADULT_UPPER_Q2,
  ADULT_LOWER_Q4,
  ADULT_LOWER_Q3,
  PEDIATRIC_UPPER_Q5,
  PEDIATRIC_UPPER_Q6,
  PEDIATRIC_LOWER_Q8,
  PEDIATRIC_LOWER_Q7,
  createInitialOdontogramData,
  createDefaultToothState,
  CONDITION_TOOLS,
} from './odontogramConstants'
import { ToothSurfaceSVG } from './ToothSurfaceSVG'
import { OdontogramPalette } from './OdontogramPalette'
import { ToothDetailModal } from './ToothDetailModal'
import { useOdontograms } from '../../../hooks/useOdontograms'

interface OdontogramViewerProps {
  patient: Patient
}

export const OdontogramViewer: React.FC<OdontogramViewerProps> = ({ patient }) => {
  const {
    odontograms,
    createOdontogram,
    isCreating,
    updateOdontogram,
    isUpdating,
  } = useOdontograms(patient.id)

  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [dentitionType, setDentitionType] = useState<'adult' | 'pediatric'>('adult')
  const [activeTool, setActiveTool] = useState<ToothCondition>('caries')
  const [recordTitle, setRecordTitle] = useState('Odontograma Inicial')
  const [recordNotes, setRecordNotes] = useState('')
  const [modalTooth, setModalTooth] = useState<ToothState | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const currentRecord = odontograms.find((o) => o.id === selectedRecordId) || odontograms[0] || null

  const [teethData, setTeethData] = useState<Record<string, ToothState>>(() => {
    return currentRecord?.teeth_data || createInitialOdontogramData(dentitionType)
  })

  // Synchronize when changing records
  React.useEffect(() => {
    if (currentRecord) {
      setTeethData(currentRecord.teeth_data || createInitialOdontogramData(currentRecord.dentition_type))
      setDentitionType(currentRecord.dentition_type || 'adult')
      setRecordTitle(currentRecord.title || 'Odontograma Inicial')
      setRecordNotes(currentRecord.notes || '')
    }
  }, [currentRecord])

  // Change dentition type
  const handleDentitionChange = (type: 'adult' | 'pediatric') => {
    setDentitionType(type)
    if (!currentRecord) {
      setTeethData(createInitialOdontogramData(type))
    }
  }

  // Handle clicking a surface
  const handleSurfaceClick = (toothNumber: number, surface: ToothSurface) => {
    const currentTooth = teethData[toothNumber.toString()] || createDefaultToothState(toothNumber)
    const tool = CONDITION_TOOLS.find((t) => t.id === activeTool)

    if (tool?.appliesTo === 'whole_tooth') {
      // Apply to whole tooth
      setTeethData((prev) => ({
        ...prev,
        [toothNumber.toString()]: {
          ...currentTooth,
          general_condition: activeTool,
        },
      }))
    } else {
      // Apply to specific surface
      setTeethData((prev) => ({
        ...prev,
        [toothNumber.toString()]: {
          ...currentTooth,
          surfaces: {
            ...currentTooth.surfaces,
            [surface]: activeTool,
          },
        },
      }))
    }
  }

  // Handle clicking tooth body
  const handleToothClick = (toothNumber: number) => {
    const currentTooth = teethData[toothNumber.toString()] || createDefaultToothState(toothNumber)
    const tool = CONDITION_TOOLS.find((t) => t.id === activeTool)

    if (tool?.appliesTo === 'whole_tooth') {
      setTeethData((prev) => ({
        ...prev,
        [toothNumber.toString()]: {
          ...currentTooth,
          general_condition: activeTool,
        },
      }))
    } else if (activeTool === 'healthy') {
      // Reset whole tooth
      setTeethData((prev) => ({
        ...prev,
        [toothNumber.toString()]: createDefaultToothState(toothNumber),
      }))
    }
  }

  // Summarize findings
  const findingsSummary = useMemo(() => {
    const summary: Record<string, number> = {
      caries: 0,
      composite: 0,
      amalgam: 0,
      crown: 0,
      endodontics_done: 0,
      endodontics_needed: 0,
      missing: 0,
      extraction_needed: 0,
      implant: 0,
      sealant: 0,
      fracture: 0,
    }

    Object.values(teethData).forEach((tooth) => {
      // General conditions
      if (tooth.general_condition && tooth.general_condition !== 'healthy') {
        summary[tooth.general_condition] = (summary[tooth.general_condition] || 0) + 1
      }

      // Surfaces
      const surfaceValues = Object.values(tooth.surfaces)
      const hasCaries = surfaceValues.some((v) => v === 'caries')
      const hasComposite = surfaceValues.some((v) => v === 'composite')
      const hasAmalgam = surfaceValues.some((v) => v === 'amalgam')
      const hasSealant = surfaceValues.some((v) => v === 'sealant')

      if (hasCaries && tooth.general_condition !== 'caries') summary.caries += 1
      if (hasComposite && tooth.general_condition !== 'composite') summary.composite += 1
      if (hasAmalgam && tooth.general_condition !== 'amalgam') summary.amalgam += 1
      if (hasSealant && tooth.general_condition !== 'sealant') summary.sealant += 1
    })

    return summary
  }, [teethData])

  const handleSave = async () => {
    setErrorMsg(null)
    try {
      if (currentRecord) {
        await updateOdontogram({
          id: currentRecord.id,
          data: {
            title: recordTitle,
            dentition_type: dentitionType,
            teeth_data: teethData,
            findings_summary: findingsSummary,
            notes: recordNotes,
          },
        })
      } else {
        const created = await createOdontogram({
          patient_id: patient.id,
          doctor_name: 'Dra. Marisol García',
          title: recordTitle,
          dentition_type: dentitionType,
          teeth_data: teethData,
          findings_summary: findingsSummary,
          notes: recordNotes,
        })
        setSelectedRecordId(created.id)
      }
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Error al guardar odontograma')
    }
  }

  const handleNewOdontogram = () => {
    setSelectedRecordId(null)
    setTeethData(createInitialOdontogramData(dentitionType))
    setRecordTitle('Odontograma Evolutivo')
    setRecordNotes('')
  }

  return (
    <div className="space-y-6 font-montserrat">
      {/* Encabezado */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-playfair font-bold text-navy">
              Odontograma Digital Interactivo
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gold/20 text-gold">
              FDI Anatómico 5 Superficies
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Mapeo gráfico dental de patologías, restauraciones y tratamientos requeridos
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {odontograms.length > 0 && (
            <select
              value={currentRecord?.id || ''}
              onChange={(e) => setSelectedRecordId(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs text-navy focus:ring-1 focus:ring-gold"
            >
              {odontograms.map((rec) => (
                <option key={rec.id} value={rec.id}>
                  {rec.title} ({new Date(rec.exam_date).toLocaleDateString()}) - {rec.dentition_type === 'adult' ? 'Adulto' : 'Infantil'}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={handleNewOdontogram}
            className="px-3 py-1.5 bg-navy text-white text-xs font-medium rounded-lg hover:bg-navy/90 transition-colors"
          >
            + Nuevo Odontograma
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isCreating || isUpdating}
            className="px-5 py-1.5 bg-gold text-white text-xs font-semibold rounded-lg hover:bg-gold/90 transition-colors shadow-sm disabled:opacity-50"
          >
            {isCreating || isUpdating ? 'Guardando...' : 'Guardar Odontograma'}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <span>✓ Odontograma guardado exitosamente en el historial del paciente.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
          {errorMsg}
        </div>
      )}

      {/* Selector de Dentición y Título */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="w-full sm:w-80 flex items-center gap-2">
          <label className="font-semibold text-navy whitespace-nowrap">Sesión:</label>
          <input
            type="text"
            value={recordTitle}
            onChange={(e) => setRecordTitle(e.target.value)}
            placeholder="Ej: Odontograma Inicial..."
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-navy focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>

        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => handleDentitionChange('adult')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              dentitionType === 'adult'
                ? 'bg-navy text-gold shadow-sm'
                : 'text-gray-600 hover:text-navy'
            }`}
          >
            Dentición Adulta (32 Piezas)
          </button>
          <button
            type="button"
            onClick={() => handleDentitionChange('pediatric')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              dentitionType === 'pediatric'
                ? 'bg-navy text-gold shadow-sm'
                : 'text-gray-600 hover:text-navy'
            }`}
          >
            Dentición Temporal / Infantil (20 Piezas)
          </button>
        </div>
      </div>

      {/* Paleta de Herramientas */}
      <OdontogramPalette activeTool={activeTool} onSelectTool={setActiveTool} />

      {/* Resumen de Hallazgos */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
          <h3 className="text-xs font-bold text-navy uppercase tracking-wider">
            Resumen de Hallazgos y Diagnósticos
          </h3>
          <span className="text-[11px] text-gray-500">
            Piezas con patologías o tratamientos detectados
          </span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {findingsSummary.caries > 0 && (
            <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg font-semibold">
              🔴 {findingsSummary.caries} Caries activa(s)
            </span>
          )}
          {findingsSummary.composite > 0 && (
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-semibold">
              🔵 {findingsSummary.composite} Resina(s)
            </span>
          )}
          {findingsSummary.amalgam > 0 && (
            <span className="px-2.5 py-1 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-semibold">
              ⚪ {findingsSummary.amalgam} Amalgama(s)
            </span>
          )}
          {findingsSummary.crown > 0 && (
            <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded-lg font-semibold">
              🟡 {findingsSummary.crown} Corona(s)
            </span>
          )}
          {findingsSummary.endodontics_needed > 0 && (
            <span className="px-2.5 py-1 bg-red-100 text-red-800 border border-red-300 rounded-lg font-bold">
              ⚠️ {findingsSummary.endodontics_needed} Endodoncia(s) indicada(s)
            </span>
          )}
          {findingsSummary.endodontics_done > 0 && (
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-semibold">
              🟩 {findingsSummary.endodontics_done} Endodoncia(s) realizada(s)
            </span>
          )}
          {findingsSummary.missing > 0 && (
            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg font-semibold">
              ✖️ {findingsSummary.missing} Diente(s) ausente(s)
            </span>
          )}
          {findingsSummary.extraction_needed > 0 && (
            <span className="px-2.5 py-1 bg-red-50 text-red-800 border border-red-300 rounded-lg font-semibold">
              ❌ {findingsSummary.extraction_needed} Extracción(es)
            </span>
          )}
          {findingsSummary.implant > 0 && (
            <span className="px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg font-semibold">
              🔩 {findingsSummary.implant} Implante(s)
            </span>
          )}
          {findingsSummary.sealant > 0 && (
            <span className="px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg font-semibold">
              🟠 {findingsSummary.sealant} Sellante(s)
            </span>
          )}
          {findingsSummary.fracture > 0 && (
            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg font-semibold">
              ⚡ {findingsSummary.fracture} Fractura(s)
            </span>
          )}
          {Object.values(findingsSummary).every((v) => v === 0) && (
            <span className="text-gray-400 italic">No se han registrado patologías activas.</span>
          )}
        </div>
      </div>

      {/* ARCADAS DENTALES */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-8">
        {/* ARCADA SUPERIOR */}
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider">
              Arcada Superior ({dentitionType === 'adult' ? 'Cuadrante 1 y 2' : 'Cuadrante 5 y 6'})
            </h3>
            <span className="text-[10px] text-gray-400">Derecha ➔ Izquierda</span>
          </div>

          <div className="overflow-x-auto pb-2 scrollbar-thin">
            <div className="flex justify-center gap-1.5 min-w-max">
              {/* Cuadrante 1 (o 5) */}
              <div className="flex gap-1.5 pr-3 border-r-2 border-dashed border-gray-300">
                {(dentitionType === 'adult' ? ADULT_UPPER_Q1 : PEDIATRIC_UPPER_Q5).map((num) => {
                  const tooth = teethData[num.toString()] || createDefaultToothState(num)
                  return (
                    <ToothSurfaceSVG
                      key={num}
                      tooth={tooth}
                      isUpper={true}
                      activeTool={activeTool}
                      onSurfaceClick={(s) => handleSurfaceClick(num, s)}
                      onToothClick={() => handleToothClick(num)}
                      onOpenModal={() => setModalTooth(tooth)}
                    />
                  )
                })}
              </div>

              {/* Cuadrante 2 (o 6) */}
              <div className="flex gap-1.5 pl-1">
                {(dentitionType === 'adult' ? ADULT_UPPER_Q2 : PEDIATRIC_UPPER_Q6).map((num) => {
                  const tooth = teethData[num.toString()] || createDefaultToothState(num)
                  return (
                    <ToothSurfaceSVG
                      key={num}
                      tooth={tooth}
                      isUpper={true}
                      activeTool={activeTool}
                      onSurfaceClick={(s) => handleSurfaceClick(num, s)}
                      onToothClick={() => handleToothClick(num)}
                      onOpenModal={() => setModalTooth(tooth)}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* LÍNEA DE OCLUSIÓN SEPARADORA */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-gray-200 w-full" />
          <span className="absolute bg-white px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Plano Oclusal
          </span>
        </div>

        {/* ARCADA INFERIOR */}
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider">
              Arcada Inferior ({dentitionType === 'adult' ? 'Cuadrante 4 y 3' : 'Cuadrante 8 y 7'})
            </h3>
            <span className="text-[10px] text-gray-400">Derecha ➔ Izquierda</span>
          </div>

          <div className="overflow-x-auto pb-2 scrollbar-thin">
            <div className="flex justify-center gap-1.5 min-w-max">
              {/* Cuadrante 4 (o 8) */}
              <div className="flex gap-1.5 pr-3 border-r-2 border-dashed border-gray-300">
                {(dentitionType === 'adult' ? ADULT_LOWER_Q4 : PEDIATRIC_LOWER_Q8).map((num) => {
                  const tooth = teethData[num.toString()] || createDefaultToothState(num)
                  return (
                    <ToothSurfaceSVG
                      key={num}
                      tooth={tooth}
                      isUpper={false}
                      activeTool={activeTool}
                      onSurfaceClick={(s) => handleSurfaceClick(num, s)}
                      onToothClick={() => handleToothClick(num)}
                      onOpenModal={() => setModalTooth(tooth)}
                    />
                  )
                })}
              </div>

              {/* Cuadrante 3 (o 7) */}
              <div className="flex gap-1.5 pl-1">
                {(dentitionType === 'adult' ? ADULT_LOWER_Q3 : PEDIATRIC_LOWER_Q7).map((num) => {
                  const tooth = teethData[num.toString()] || createDefaultToothState(num)
                  return (
                    <ToothSurfaceSVG
                      key={num}
                      tooth={tooth}
                      isUpper={false}
                      activeTool={activeTool}
                      onSurfaceClick={(s) => handleSurfaceClick(num, s)}
                      onToothClick={() => handleToothClick(num)}
                      onOpenModal={() => setModalTooth(tooth)}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notas del Odontograma */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
        <label className="block font-bold text-navy text-xs uppercase tracking-wider">
          Observaciones y Plan de Tratamiento Odontológico
        </label>
        <textarea
          rows={3}
          value={recordNotes}
          onChange={(e) => setRecordNotes(e.target.value)}
          placeholder="Anotar plan de rehabilitación, secuencias de citas, prioridades de operatoria o endodoncia..."
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-gold"
        />
      </div>

      {/* Modal de Detalle de Diente */}
      {modalTooth && (
        <ToothDetailModal
          tooth={modalTooth}
          onClose={() => setModalTooth(null)}
          onSave={(updated) => {
            setTeethData((prev) => ({
              ...prev,
              [updated.tooth_number.toString()]: updated,
            }))
          }}
        />
      )}
    </div>
  )
}
