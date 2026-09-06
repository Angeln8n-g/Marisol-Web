import React from 'react'
import type { PeriodontogramStats } from '../../../types'

interface PeriodontogramStatsPanelProps {
  stats: PeriodontogramStats
}

export const PeriodontogramStatsPanel: React.FC<PeriodontogramStatsPanelProps> = ({ stats }) => {
  // SEPA BOP risk classification
  const bopRisk =
    stats.bop_percentage < 10
      ? { label: 'Riesgo Bajo (<10%)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
      : stats.bop_percentage <= 25
      ? { label: 'Riesgo Moderado (10-25%)', color: 'text-amber-800 bg-amber-50 border-amber-200' }
      : { label: 'Riesgo Alto (>25%)', color: 'text-red-700 bg-red-50 border-red-200' }

  // O'Leary Plaque classification
  const plaqueStatus =
    stats.plaque_percentage < 15
      ? { label: 'Excelente (<15%)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
      : stats.plaque_percentage <= 25
      ? { label: 'Aceptable (15-25%)', color: 'text-amber-800 bg-amber-50 border-amber-200' }
      : { label: 'Deficiente (>25%)', color: 'text-red-700 bg-red-50 border-red-200' }

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm font-montserrat">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gold/15 text-gold flex items-center justify-center font-bold text-xs">
            SEPA
          </div>
          <div>
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider">
              Índices y Parámetros Clínicos Periodontales
            </h3>
            <p className="text-[11px] text-gray-500">
              Evaluación en tiempo real según criterios de la Sociedad Española de Periodoncia
            </p>
          </div>
        </div>

        <div className="text-[11px] text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200">
          <span className="font-semibold text-navy">{stats.total_teeth_present}</span> dientes presentes ·{' '}
          <span className="font-semibold text-navy">{stats.total_implants}</span> implantes ·{' '}
          <span className="font-semibold text-gray-500">{stats.total_teeth_missing}</span> ausentes
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
        {/* Sangrado al Sondaje BOP */}
        <div className={`p-3 rounded-lg border flex flex-col justify-between ${bopRisk.color}`}>
          <div>
            <span className="text-[11px] font-semibold block uppercase tracking-wider opacity-80">
              Sangrado (BOP)
            </span>
            <span className="text-2xl font-playfair font-bold mt-0.5 block">
              {stats.bop_percentage}%
            </span>
          </div>
          <div className="mt-2 pt-1 border-t border-current/20 text-[10px] font-medium flex items-center justify-between">
            <span>{stats.bop_sites} sitios sangrantes</span>
            <span>{bopRisk.label.split(' ')[0]}</span>
          </div>
        </div>

        {/* Índice de Placa O'Leary */}
        <div className={`p-3 rounded-lg border flex flex-col justify-between ${plaqueStatus.color}`}>
          <div>
            <span className="text-[11px] font-semibold block uppercase tracking-wider opacity-80">
              Índice de Placa
            </span>
            <span className="text-2xl font-playfair font-bold mt-0.5 block">
              {stats.plaque_percentage}%
            </span>
          </div>
          <div className="mt-2 pt-1 border-t border-current/20 text-[10px] font-medium flex items-center justify-between">
            <span>{stats.plaque_sites} sitios con placa</span>
            <span>{plaqueStatus.label.split(' ')[0]}</span>
          </div>
        </div>

        {/* Bolsas Leves 4-5 mm */}
        <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 text-amber-900 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold block uppercase tracking-wider text-amber-800">
              Bolsas 4-5 mm
            </span>
            <span className="text-2xl font-playfair font-bold text-amber-900 mt-0.5 block">
              {stats.shallow_pockets_count}
            </span>
          </div>
          <span className="text-[10px] text-amber-700 mt-2 pt-1 border-t border-amber-200/60 block">
            Afectación leve / moderada
          </span>
        </div>

        {/* Bolsas Profundas >= 6 mm */}
        <div className="p-3 rounded-lg border border-red-200 bg-red-50/60 text-red-900 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold block uppercase tracking-wider text-red-800">
              Bolsas ≥ 6 mm
            </span>
            <span className="text-2xl font-playfair font-bold text-red-700 mt-0.5 block">
              {stats.deep_pockets_count}
            </span>
          </div>
          <span className="text-[10px] text-red-700 mt-2 pt-1 border-t border-red-200/60 block">
            Periodontitis severa activa
          </span>
        </div>

        {/* Furcaciones y Supuración */}
        <div className="p-3 rounded-lg border border-gray-200 bg-gray-50 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold block uppercase tracking-wider text-gray-500">
              Furcas & Supuración
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold text-navy">{stats.furcation_sites_count}</span>
              <span className="text-[10px] text-gray-500">furcas</span>
              <span className="text-xl font-bold text-amber-700 ml-1">{stats.suppuration_sites_count}</span>
              <span className="text-[10px] text-gray-500">pus</span>
            </div>
          </div>
          <span className="text-[10px] text-gray-500 mt-2 pt-1 border-t border-gray-200 block">
            Sitios multi-radiculares
          </span>
        </div>

        {/* Diagnóstico SEPA sugerido */}
        <div className="p-3 rounded-lg border border-navy/20 bg-navy text-white flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-gold uppercase tracking-wider block">
              Sugerencia SEPA
            </span>
            <p className="text-xs font-semibold mt-1 leading-snug">
              {stats.deep_pockets_count > 0
                ? 'Periodontitis Estadio III/IV'
                : stats.shallow_pockets_count > 0
                ? 'Periodontitis Estadio I/II'
                : stats.bop_percentage >= 10
                ? 'Gingivitis Inducida por Placa'
                : 'Salud Periodontal'}
            </p>
          </div>
          <span className="text-[9px] text-gray-300 mt-1 block">
            {stats.bop_percentage >= 10 ? 'Inflamación activa' : 'Periodonto estable'}
          </span>
        </div>
      </div>
    </div>
  )
}
