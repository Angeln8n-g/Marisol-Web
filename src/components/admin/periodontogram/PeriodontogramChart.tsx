import React, { useState } from 'react'
import type { Patient, PeriodontogramToothData } from '../../../types'
import {
  UPPER_TEETH,
  LOWER_TEETH,
  createInitialTeethData,
  createDefaultToothData,
  computePeriodontogramStats,
} from './periodontogramConstants'
import { PeriodontogramTooth } from './PeriodontogramTooth'
import { PeriodontogramStatsPanel } from './PeriodontogramStatsPanel'
import { SepaPeriodontogramSheet } from './SepaPeriodontogramSheet'
import { PeriodontalOnlineExportModal } from './PeriodontalOnlineExportModal'
import { usePeriodontograms } from '../../../hooks/usePeriodontograms'

interface PeriodontogramChartProps {
  patient: Patient
}

export const PeriodontogramChart: React.FC<PeriodontogramChartProps> = ({ patient }) => {
  const {
    periodontograms,
    createPeriodontogram,
    isCreating,
    updatePeriodontogram,
    isUpdating,
  } = usePeriodontograms(patient.id)

  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'sepa_sheet' | 'cards'>('sepa_sheet')
  const [activeAspect, setActiveAspect] = useState<'vestibular' | 'palatal_lingual'>('vestibular')
  const [activeArch, setActiveArch] = useState<'all' | 'upper' | 'lower'>('all')
  const [recordTitle, setRecordTitle] = useState('Periodontograma Inicial')
  const [recordNotes, setRecordNotes] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)


  const currentRecord = periodontograms.find((p) => p.id === selectedRecordId) || periodontograms[0] || null

  const [teethData, setTeethData] = useState<Record<string, PeriodontogramToothData>>(() => {
    return currentRecord?.teeth_data || createInitialTeethData()
  })

  // Sincronizar al cambiar el registro seleccionado
  React.useEffect(() => {
    if (currentRecord) {
      setTeethData(currentRecord.teeth_data || createInitialTeethData())
      setRecordTitle(currentRecord.title || 'Periodontograma Inicial')
      setRecordNotes(currentRecord.notes || '')
    }
  }, [currentRecord])

  // Estadísticas en tiempo real
  const currentStats = computePeriodontogramStats(teethData)

  const handleToothUpdate = (updated: PeriodontogramToothData) => {
    setTeethData((prev) => ({
      ...prev,
      [updated.tooth_number.toString()]: updated,
    }))
  }

  const handleSave = async () => {
    setErrorMsg(null)
    try {
      if (currentRecord) {
        await updatePeriodontogram({
          id: currentRecord.id,
          data: {
            title: recordTitle,
            teeth_data: teethData,
            summary_stats: currentStats,
            notes: recordNotes,
          },
        })
      } else {
        const created = await createPeriodontogram({
          patient_id: patient.id,
          doctor_name: 'Dra. Marisol García',
          title: recordTitle,
          teeth_data: teethData,
          summary_stats: currentStats,
          notes: recordNotes,
        })
        setSelectedRecordId(created.id)
      }
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Error al guardar periodontograma')
    }
  }

  const handleNewRecord = () => {
    setSelectedRecordId(null)
    setTeethData(createInitialTeethData())
    setRecordTitle('Periodontograma de Reevaluación')
    setRecordNotes('')
  }

  const handlePrint = () => {
    // Si estamos en vista de tarjetas, cambiar temporalmente a la hoja oficial SEPA para imprimir
    if (viewMode !== 'sepa_sheet') {
      setViewMode('sepa_sheet')
      setTimeout(() => {
        window.print()
      }, 300)
    } else {
      window.print()
    }
  }

  return (
    <div className="space-y-6 font-montserrat">
      {/* Estilos específicos para impresión en formato PDF horizontal de 2 páginas */}
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 5mm;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, nav, aside, footer, .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Barra de Control y Acciones Superiores */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-playfair font-bold text-navy">
              Periodontograma SEPA / Bexident
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-navy text-gold">
              Fiel al PDF 100%
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
              6 Sitios EFP / SEPA
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Registro métrico de profundidad de sondaje, margen gingival, inserción clínica y sangrado al sondaje
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {periodontograms.length > 0 && (
            <select
              value={currentRecord?.id || ''}
              onChange={(e) => setSelectedRecordId(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs text-navy focus:ring-1 focus:ring-gold"
            >
              {periodontograms.map((rec) => (
                <option key={rec.id} value={rec.id}>
                  {rec.title} ({new Date(rec.exam_date).toLocaleDateString()}) - BOP: {rec.summary_stats?.bop_percentage || 0}%
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={handleNewRecord}
            className="px-3 py-1.5 bg-navy text-white text-xs font-medium rounded-lg hover:bg-navy/90 transition-colors"
          >
            + Nueva Sesión
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-gray-100 text-navy hover:bg-gray-200 text-xs font-semibold rounded-lg transition-colors border border-gray-300 flex items-center gap-1.5 shadow-sm"
            title="Imprimir o guardar en PDF con formato oficial SEPA (2 páginas)"
          >
            <span>🖨️</span>
            <span>Imprimir / Exportar PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="px-3.5 py-1.5 bg-teal-50 text-teal-800 hover:bg-teal-100 text-xs font-semibold rounded-lg transition-colors border border-teal-200 flex items-center gap-1.5 shadow-sm"
            title="Generar enlace al visor interactivo de la Universidad de Berna y código QR para el paciente"
          >
            <span>🌐</span>
            <span>Visor Online / QR</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isCreating || isUpdating}
            className="px-5 py-1.5 bg-gold text-white text-xs font-semibold rounded-lg hover:bg-gold/90 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
          >
            <span>💾</span>
            <span>{isCreating || isUpdating ? 'Guardando...' : 'Guardar Periodontograma'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2 no-print">
          <span>✓ Periodontograma guardado exitosamente en el historial del paciente.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg no-print">
          {errorMsg}
        </div>
      )}

      {/* Selector de Modalidad: Hoja Oficial SEPA (PDF) vs Tarjetas */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs no-print">
        <div className="w-full sm:w-80 flex items-center gap-2">
          <label className="font-semibold text-navy whitespace-nowrap">Sesión:</label>
          <input
            type="text"
            value={recordTitle}
            onChange={(e) => setRecordTitle(e.target.value)}
            placeholder="Ej: Periodontograma Inicial / Control..."
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-navy focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-500 font-medium">Modo de Vista:</span>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('sepa_sheet')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                viewMode === 'sepa_sheet'
                  ? 'bg-navy text-gold shadow-sm'
                  : 'text-gray-600 hover:text-navy'
              }`}
            >
              <span>📄</span>
              <span>Hoja Oficial SEPA (PDF)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                viewMode === 'cards'
                  ? 'bg-navy text-gold shadow-sm'
                  : 'text-gray-600 hover:text-navy'
              }`}
            >
              <span>🗂️</span>
              <span>Vista Rápida de Dientes</span>
            </button>
          </div>
        </div>
      </div>

      {/* VISTA 1: HOJA OFICIAL SEPA / BEXIDENT (100% IDÉNTICA AL PDF) */}
      {viewMode === 'sepa_sheet' && (
        <div>
          {/* Instrucciones sutiles */}
          <div className="mb-3 px-4 py-2 bg-sand/30 border border-sand rounded-lg text-xs text-navy flex items-center justify-between no-print">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Rejilla interactiva editable:</span>
              <span className="text-gray-600">
                Haz clic en los puntos circulares para marcar Sangrado (rojo), Supuración (ámbar) o Placa (azul). Escribe directamente los números de Profundidad, Margen, Furca o Movilidad.
              </span>
            </div>
            <span className="text-[11px] text-gray-500 italic hidden lg:inline">
              Formato de impresión: 2 Páginas Horizontales (SUPERIOR / INFERIOR)
            </span>
          </div>

          <SepaPeriodontogramSheet
            patient={patient}
            teethData={teethData}
            stats={currentStats}
            examDate={currentRecord?.exam_date || new Date().toISOString()}
            comments={recordNotes}
            onToothChange={(_num, updated) => handleToothUpdate(updated)}
            onCommentsChange={(c) => setRecordNotes(c)}
          />
        </div>
      )}

      {/* VISTA 2: TARJETAS DINÁMICAS POR DIENTE */}
      {viewMode === 'cards' && (
        <div className="space-y-6">
          {/* Panel Estadístico SEPA en Tiempo Real */}
          <PeriodontogramStatsPanel stats={currentStats} />

          {/* Filtros de Cara y Arcadas */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200">
            {/* Selector de Cara: Vestibular vs Palatino/Lingual */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveAspect('vestibular')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  activeAspect === 'vestibular'
                    ? 'bg-navy text-gold shadow-sm'
                    : 'text-gray-600 hover:text-navy'
                }`}
              >
                Cara Vestibular
              </button>
              <button
                type="button"
                onClick={() => setActiveAspect('palatal_lingual')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  activeAspect === 'palatal_lingual'
                    ? 'bg-navy text-gold shadow-sm'
                    : 'text-gray-600 hover:text-navy'
                }`}
              >
                Cara Palatina / Lingual
              </button>
            </div>

            {/* Selector de Arcadas */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveArch('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                  activeArch === 'all' ? 'bg-white text-navy shadow-sm' : 'text-gray-600'
                }`}
              >
                Ambas Arcadas
              </button>
              <button
                type="button"
                onClick={() => setActiveArch('upper')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                  activeArch === 'upper' ? 'bg-white text-navy shadow-sm' : 'text-gray-600'
                }`}
              >
                Superior
              </button>
              <button
                type="button"
                onClick={() => setActiveArch('lower')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                  activeArch === 'lower' ? 'bg-white text-navy shadow-sm' : 'text-gray-600'
                }`}
              >
                Inferior
              </button>
            </div>
          </div>

          {/* Rejilla de Dientes en Tarjetas */}
          <div className="space-y-6">
            {/* ARCADA SUPERIOR (MAXILAR) */}
            {(activeArch === 'all' || activeArch === 'upper') && (
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="font-playfair font-bold text-sm text-navy uppercase tracking-wider">
                    Maxilar Superior (Cuadrante 1 y 2) · Cara {activeAspect === 'vestibular' ? 'Vestibular' : 'Palatina'}
                  </span>
                  <span className="text-[11px] text-gray-400">1.8 ➔ 1.1 | 2.1 ➔ 2.8</span>
                </div>

                <div className="overflow-x-auto pb-4 scrollbar-thin">
                  <div className="flex gap-2 min-w-max">
                    {UPPER_TEETH.map((toothNumber) => {
                      const tooth = teethData[toothNumber.toString()] || createDefaultToothData(toothNumber)
                      return (
                        <PeriodontogramTooth
                          key={toothNumber}
                          tooth={tooth}
                          aspect={activeAspect}
                          isUpper={true}
                          onChange={handleToothUpdate}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ARCADA INFERIOR (MANDÍBULA) */}
            {(activeArch === 'all' || activeArch === 'lower') && (
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="font-playfair font-bold text-sm text-navy uppercase tracking-wider">
                    Mandíbula Inferior (Cuadrante 4 y 3) · Cara {activeAspect === 'vestibular' ? 'Vestibular' : 'Lingual'}
                  </span>
                  <span className="text-[11px] text-gray-400">4.8 ➔ 4.1 | 3.1 ➔ 3.8</span>
                </div>

                <div className="overflow-x-auto pb-4 scrollbar-thin">
                  <div className="flex gap-2 min-w-max">
                    {LOWER_TEETH.map((toothNumber) => {
                      const tooth = teethData[toothNumber.toString()] || createDefaultToothData(toothNumber)
                      return (
                        <PeriodontogramTooth
                          key={toothNumber}
                          tooth={tooth}
                          aspect={activeAspect}
                          isUpper={false}
                          onChange={handleToothUpdate}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal para exportar y visualizar en Periodontal Chart Online con Código QR */}
      <PeriodontalOnlineExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        patient={patient}
        teethData={teethData}
        recordTitle={recordTitle}
        examDate={currentRecord?.exam_date}
      />
    </div>
  )
}
