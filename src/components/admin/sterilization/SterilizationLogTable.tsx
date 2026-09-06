import React, { useState } from 'react'
import type { SterilizationCycle, BiologicalIndicatorStatus } from '../../../types'

interface SterilizationLogTableProps {
  cycles: SterilizationCycle[]
  isLoading: boolean
  onOpenCreateCycle: () => void
  onPrintCycleLabels: (cycle: SterilizationCycle) => void
  onUpdateBiologicalStatus: (cycleId: string, status: BiologicalIndicatorStatus) => Promise<void>
}

export const SterilizationLogTable: React.FC<SterilizationLogTableProps> = ({
  cycles,
  isLoading,
  onOpenCreateCycle,
  onPrintCycleLabels,
  onUpdateBiologicalStatus,
}) => {
  const [expandedCycleId, setExpandedCycleId] = useState<string | null>(null)

  const toggleExpand = (cycleId: string) => {
    setExpandedCycleId((prev) => (prev === cycleId ? null : cycleId))
  }

  const getBiologicalBadge = (cycle: SterilizationCycle) => {
    switch (cycle.biological_indicator_status) {
      case 'passed':
        return (
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold border border-emerald-300">
            ✓ Negativo a Esporas
          </span>
        )
      case 'failed':
        return (
          <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-md text-[10px] font-bold border border-red-300 animate-pulse">
            ✕ Positivo (Contaminado)
          </span>
        )
      case 'pending':
        return (
          <div className="flex items-center gap-1">
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-bold border border-amber-300">
              ⏳ En Incubación
            </span>
            <button
              type="button"
              onClick={() => onUpdateBiologicalStatus(cycle.id, 'passed')}
              className="text-[10px] text-teal-700 hover:underline font-semibold"
            >
              Aprobar
            </button>
          </div>
        )
      default:
        return (
          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px]">
            No aplicado
          </span>
        )
    }
  }

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100 space-y-4 font-montserrat">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-playfair font-bold text-navy">
              Bitácora de Esterilización y Autoclave
            </h3>
            <span className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded-full text-[10px] font-bold border border-teal-200">
              Bioseguridad CDC/ADA
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Registro legal de parámetros físicos, controles químicos, esporas biológicas y lotes de instrumental
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateCycle}
          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95 self-start sm:self-center"
        >
          <span className="text-sm">+</span>
          <span>Nuevo Ciclo Autoclave</span>
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-12 text-center text-gray-400 text-xs animate-pulse">
          Cargando registros de esterilización...
        </div>
      ) : cycles.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto text-xl font-bold">
            🛡️
          </div>
          <p className="text-xs font-semibold text-gray-700">
            No se han registrado ciclos de esterilización.
          </p>
          <p className="text-[11px] text-gray-400">
            Inicia registrando el primer ciclo del autoclave para activar la trazabilidad de paquetes.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 text-[11px] uppercase tracking-wider">
                <th className="pb-3 font-medium">Ciclo / Fecha</th>
                <th className="pb-3 font-medium">Autoclave / Programa</th>
                <th className="pb-3 font-medium text-center">Físicos (°C / bar)</th>
                <th className="pb-3 font-medium text-center">Control Químico</th>
                <th className="pb-3 font-medium text-center">Control Biológico</th>
                <th className="pb-3 font-medium">Operador</th>
                <th className="pb-3 font-medium text-center">Paquetes</th>
                <th className="pb-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cycles.map((cycle) => {
                const isExpanded = expandedCycleId === cycle.id
                const packagesCount = cycle.packages?.length || 0

                return (
                  <React.Fragment key={cycle.id}>
                    <tr className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 pr-3">
                        <span className="font-bold text-navy text-xs">
                          Ciclo #{cycle.cycle_number}
                        </span>
                        <div className="text-[10px] text-gray-400">
                          {cycle.cycle_date}{' '}
                          {cycle.start_time && `• ${cycle.start_time.slice(0, 5)}`}
                        </div>
                      </td>

                      <td className="py-3 pr-3">
                        <div className="font-semibold text-gray-800">{cycle.autoclave_name}</div>
                        <div className="text-[10px] text-gray-400">
                          {cycle.cycle_program.replace(/_/g, ' ')}
                        </div>
                      </td>

                      <td className="py-3 text-center">
                        <span className="font-bold text-teal-800">
                          {cycle.temperature_c}°C
                        </span>
                        <div className="text-[10px] text-gray-400">
                          {cycle.pressure_bar} bar • {cycle.exposure_time_minutes}m
                        </div>
                      </td>

                      <td className="py-3 text-center">
                        {cycle.chemical_indicator_passed ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold border border-emerald-300">
                            ✓ Viraje OK
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-md text-[10px] font-bold border border-red-300">
                            ✕ Fallido
                          </span>
                        )}
                      </td>

                      <td className="py-3 text-center">{getBiologicalBadge(cycle)}</td>

                      <td className="py-3 text-gray-700 text-[11px]">{cycle.operator_name}</td>

                      <td className="py-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleExpand(cycle.id)}
                          className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-md text-[11px] transition-colors"
                        >
                          {packagesCount} paquete(s) {isExpanded ? '▲' : '▼'}
                        </button>
                      </td>

                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onPrintCycleLabels(cycle)}
                            className="px-2 py-1 rounded-lg text-teal-800 bg-teal-50 hover:bg-teal-100 text-[11px] font-semibold transition-colors flex items-center gap-1"
                            title="Imprimir etiquetas con códigos de lote de esterilización"
                          >
                            🏷️ Rótulos
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable row showing pouches and barcodes */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="p-3 bg-teal-50/40 border-b border-teal-100">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-semibold text-teal-900">
                              <span>Instrumental esterilizado en este ciclo:</span>
                              <span className="text-[11px] text-gray-500">
                                Validez estándar: 30 días en bolsa sellada
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {cycle.packages?.map((pkg) => (
                                <div
                                  key={pkg.id}
                                  className="p-2.5 bg-white rounded-xl border border-gray-200 text-xs space-y-1 shadow-2xs"
                                >
                                  <div className="flex items-center justify-between">
                                    <strong className="text-navy">{pkg.description}</strong>
                                    <span
                                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                        pkg.status === 'sterile'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : pkg.status === 'used'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {pkg.status === 'sterile'
                                        ? 'Disponible'
                                        : pkg.status === 'used'
                                        ? 'Utilizado'
                                        : 'Vencido'}
                                    </span>
                                  </div>
                                  <div className="text-[10px] font-mono text-gray-500">
                                    Lote: {pkg.package_code}
                                  </div>
                                  <div className="text-[10px] text-gray-400">
                                    Vence: <strong className="text-gray-700">{pkg.expiration_date}</strong>
                                    {pkg.used_by_patient_name && (
                                      <span> • Usado en: {pkg.used_by_patient_name}</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
