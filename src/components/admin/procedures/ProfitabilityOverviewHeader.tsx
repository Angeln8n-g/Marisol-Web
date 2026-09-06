import React from 'react'
import type { ProcedureProfitability } from '../../../types'

interface ProfitabilityOverviewHeaderProps {
  kpis: {
    averageNetMarginPercent: number
    averageProfitPerHour: number
    topProcedure: ProcedureProfitability | null
    lowestProcedure: ProcedureProfitability | null
  }
  isLoading?: boolean
  onSelectProcedure?: (procedure: ProcedureProfitability) => void
}

export const ProfitabilityOverviewHeader: React.FC<ProfitabilityOverviewHeaderProps> = ({
  kpis,
  isLoading = false,
  onSelectProcedure,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl border border-gray-200" />
        ))}
      </div>
    )
  }

  const { averageNetMarginPercent, averageProfitPerHour, topProcedure, lowestProcedure } = kpis

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-montserrat">
      {/* KPI 1: Margen Neto Promedio */}
      <div className="bg-gradient-to-br from-white to-gray-50/80 p-4 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Margen Neto Promedio
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
            📈
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-playfair text-navy">
            {averageNetMarginPercent.toFixed(1)}%
          </span>
          <span
            className={`text-xs font-semibold ${
              averageNetMarginPercent >= 35 ? 'text-emerald-600' : 'text-amber-600'
            }`}
          >
            {averageNetMarginPercent >= 35 ? 'Rentable' : 'Ajustable'}
          </span>
        </div>
        <p className="text-[11px] text-gray-500 mt-1">
          Rentabilidad neta media por procedimiento clínico
        </p>
      </div>

      {/* KPI 2: Rendimiento Sillón / Hora */}
      <div className="bg-gradient-to-br from-white to-gray-50/80 p-4 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Rendimiento Sillón/Hora
          </span>
          <div className="w-8 h-8 rounded-xl bg-gold/20 text-gold flex items-center justify-center text-sm font-bold">
            🪑
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-playfair text-navy">
            RD$ {averageProfitPerHour.toLocaleString('es-DO', { maximumFractionDigits: 0 })}
          </span>
          <span className="text-xs text-gray-500">/hr</span>
        </div>
        <p className="text-[11px] text-gray-500 mt-1">
          Ganancia neta clínica por hora de box ocupado
        </p>
      </div>

      {/* KPI 3: Procedimiento Estrella */}
      <div
        onClick={() => topProcedure && onSelectProcedure?.(topProcedure)}
        className={`bg-gradient-to-br from-emerald-50/70 to-white p-4 rounded-2xl border border-emerald-200 shadow-xs hover:shadow-md transition-all ${
          topProcedure ? 'cursor-pointer hover:border-emerald-300' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            Top Rendimiento
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">
            ⭐
          </div>
        </div>
        <div className="truncate">
          <span className="text-base font-bold text-navy truncate block">
            {topProcedure ? topProcedure.procedure.name : '—'}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-bold text-emerald-700">
              {topProcedure ? `${topProcedure.netMarginPercent.toFixed(0)}% neto` : ''}
            </span>
            {topProcedure && (
              <span className="text-[11px] text-gray-500">
                • RD$ {topProcedure.profitPerHour.toLocaleString('es-DO', { maximumFractionDigits: 0 })}/hr
              </span>
            )}
          </div>
        </div>
        <p className="text-[10px] text-emerald-700/80 mt-1">
          {topProcedure ? 'Haz clic para simular variables' : 'Sin datos suficientes'}
        </p>
      </div>

      {/* KPI 4: Optimización Prioritaria */}
      <div
        onClick={() => lowestProcedure && onSelectProcedure?.(lowestProcedure)}
        className={`bg-gradient-to-br from-amber-50/70 to-white p-4 rounded-2xl border border-amber-200 shadow-xs hover:shadow-md transition-all ${
          lowestProcedure ? 'cursor-pointer hover:border-amber-300' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
            Optimizar Insumos
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center text-sm font-bold">
            🎯
          </div>
        </div>
        <div className="truncate">
          <span className="text-base font-bold text-navy truncate block">
            {lowestProcedure ? lowestProcedure.procedure.name : '—'}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-bold text-amber-700">
              {lowestProcedure ? `${lowestProcedure.netMarginPercent.toFixed(0)}% margen` : ''}
            </span>
            {lowestProcedure && (
              <span className="text-[11px] text-gray-500">
                • {lowestProcedure.suppliesCount} insumos
              </span>
            )}
          </div>
        </div>
        <p className="text-[10px] text-amber-700/80 mt-1">
          {lowestProcedure ? 'Oportunidad de reducción de costos' : 'Sin datos suficientes'}
        </p>
      </div>
    </div>
  )
}
