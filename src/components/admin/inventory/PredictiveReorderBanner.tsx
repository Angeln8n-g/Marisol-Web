import React, { useState } from 'react'
import type { PredictiveRestockItem } from '../../../types'

interface PredictiveReorderBannerProps {
  itemsToReorder: PredictiveRestockItem[]
  totalAppointments: number
  totalEstimatedCost: number
  forecastDays: number
  onChangeForecastDays: (days: number) => void
  onGeneratePurchaseOrder: (items: PredictiveRestockItem[]) => void
  isLoading?: boolean
}

export const PredictiveReorderBanner: React.FC<PredictiveReorderBannerProps> = ({
  itemsToReorder,
  totalAppointments,
  totalEstimatedCost,
  forecastDays,
  onChangeForecastDays,
  onGeneratePurchaseOrder,
  isLoading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const criticalCount = itemsToReorder.filter(
    (i) => i.urgency === 'out_of_stock' || i.urgency === 'critical_shortage'
  ).length

  const warningCount = itemsToReorder.filter((i) => i.urgency === 'low_stock').length

  return (
    <div className="bg-gradient-to-br from-navy/95 via-navy to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-gold/30 relative overflow-hidden transition-all font-montserrat">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gold/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Header bar with intelligence title & Horizon selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gold/20 border border-gold/40 flex items-center justify-center flex-shrink-0 text-gold shadow-inner">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-playfair font-bold text-white tracking-wide">
                Reorden Predictivo Clínico
              </h2>
              <span className="bg-gold/25 text-gold text-[10px] font-bold px-2 py-0.5 rounded-full border border-gold/30 uppercase tracking-wider">
                IA & BOM Clínico
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-0.5">
              Demanda calculada automáticamente según los insumos de las citas de los próximos{' '}
              <strong className="text-gold">{forecastDays} días</strong> ({totalAppointments} procedimientos).
            </p>
          </div>
        </div>

        {/* Days selector */}
        <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-xl border border-white/15 self-start sm:self-center">
          <span className="text-[11px] text-gray-400 font-medium px-2 hidden sm:inline">
            Horizonte:
          </span>
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => onChangeForecastDays(days)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                forecastDays === days
                  ? 'bg-gold text-navy font-bold shadow-xs'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {days} días
            </button>
          ))}
        </div>
      </div>

      {/* Main metrics and action */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-1 items-center relative z-10">
        {/* Status indicator */}
        <div className="md:col-span-3 flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-3 h-3 rounded-full ${
                criticalCount > 0
                  ? 'bg-red-500 animate-ping'
                  : warningCount > 0
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
            />
            <div>
              <span className="text-xl sm:text-2xl font-bold font-playfair text-white">
                {itemsToReorder.length}
              </span>
              <span className="text-xs text-gray-300 ml-1.5">
                artículos con déficit o bajo stock
              </span>
            </div>
          </div>

          {criticalCount > 0 && (
            <div className="px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-xs font-semibold flex items-center gap-1.5">
              <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{criticalCount} en riesgo de desabastecimiento</span>
            </div>
          )}

          <div className="text-xs text-gray-300">
            Inversión estimada de reposición:{' '}
            <strong className="text-gold text-sm font-bold ml-1">
              RD$ {totalEstimatedCost.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-start md:justify-end gap-2">
          <button
            type="button"
            disabled={itemsToReorder.length === 0 || isLoading}
            onClick={() => onGeneratePurchaseOrder(itemsToReorder)}
            className="w-full sm:w-auto px-4 py-2.5 bg-gold hover:bg-gold/90 text-navy font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <span>Generar Orden de Compra</span>
          </button>
        </div>
      </div>

      {/* Item summary pill chips */}
      {itemsToReorder.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2 relative z-10">
          <span className="text-[11px] text-gray-400 font-semibold mr-1">Insumos Críticos:</span>
          {itemsToReorder.slice(0, 5).map((ri) => {
            const isCritical = ri.urgency === 'out_of_stock' || ri.urgency === 'critical_shortage'
            return (
              <span
                key={ri.item.id}
                className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 ${
                  isCritical
                    ? 'bg-red-950/60 border-red-500/40 text-red-200'
                    : 'bg-white/10 border-white/15 text-gray-200'
                }`}
              >
                <span>{ri.item.name}</span>
                <span className="font-bold text-gold">
                  +{ri.suggestedPackagesToOrder} {ri.item.unit}
                </span>
                {ri.totalUnitsRequired > 0 && (
                  <span className="text-[10px] text-gray-400">
                    ({ri.totalUnitsRequired} {ri.dispenseUnit} requeridos)
                  </span>
                )}
              </span>
            )
          })}

          {itemsToReorder.length > 5 && (
            <span className="text-[11px] text-gold/80 font-medium">
              +{itemsToReorder.length - 5} más
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-auto text-xs text-gold hover:text-white font-medium underline flex items-center gap-1 transition-colors"
          >
            {isExpanded ? 'Ocultar desglose detallado ↑' : 'Ver desglose completo de demanda ↓'}
          </button>
        </div>
      )}

      {/* Expandable breakdown drawer */}
      {isExpanded && itemsToReorder.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/15 overflow-x-auto relative z-10 animate-fadeIn">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-white/10 text-[11px] uppercase tracking-wider">
                <th className="pb-2 font-medium">Insumo Clínico</th>
                <th className="pb-2 font-medium text-center">Stock Actual</th>
                <th className="pb-2 font-medium text-center">Demanda ({forecastDays}d)</th>
                <th className="pb-2 font-medium text-center">Saldo Proyectado</th>
                <th className="pb-2 font-medium text-center">Reorden Sugerido</th>
                <th className="pb-2 font-medium text-right">Costo Estimado</th>
                <th className="pb-2 font-medium text-center">Citas Asociadas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {itemsToReorder.map((r) => (
                <tr key={r.item.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-2.5 pr-3">
                    <div className="font-semibold text-white">{r.item.name}</div>
                    <div className="text-[10px] text-gray-400">
                      {r.item.code || 'Sin código'} • Presentación: {r.unitsPerPackage} {r.dispenseUnit} / {r.item.unit}
                    </div>
                  </td>
                  <td className="py-2.5 text-center text-gray-200">
                    <span className="font-bold">{r.currentStockPackages}</span> {r.item.unit}
                    <div className="text-[10px] text-gray-400">
                      ({r.availableUnits} {r.dispenseUnit})
                    </div>
                  </td>
                  <td className="py-2.5 text-center text-amber-300 font-semibold">
                    {r.totalUnitsRequired > 0 ? (
                      <span>
                        {r.totalUnitsRequired} {r.dispenseUnit}
                      </span>
                    ) : (
                      <span className="text-gray-400">0 (Stock bajo)</span>
                    )}
                  </td>
                  <td className="py-2.5 text-center">
                    <span
                      className={`font-bold ${
                        r.projectedRemainingUnits < 0
                          ? 'text-red-400'
                          : r.projectedRemainingPackages <= r.minimumStockPackages
                          ? 'text-amber-300'
                          : 'text-emerald-400'
                      }`}
                    >
                      {r.projectedRemainingUnits} {r.dispenseUnit}
                    </span>
                    <div className="text-[10px] text-gray-400">
                      Mínimo: {r.minimumStockPackages} {r.item.unit}
                    </div>
                  </td>
                  <td className="py-2.5 text-center">
                    <span className="px-2 py-0.5 bg-gold/20 text-gold font-bold rounded-lg border border-gold/40">
                      +{r.suggestedPackagesToOrder} {r.item.unit}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-semibold text-white">
                    RD$ {r.estimatedCost.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 text-center text-gray-400">
                    {r.upcomingAppointments.length > 0 ? (
                      <span
                        title={r.upcomingAppointments
                          .map((a: any) => `${a.patientName} (${a.procedureName})`)
                          .join(', ')}
                        className="cursor-help underline text-gray-300 hover:text-gold"
                      >
                        {r.upcomingAppointments.length} procedimiento(s)
                      </span>
                    ) : (
                      <span>0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
