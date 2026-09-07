import React from 'react'

export interface StatCard {
  label: string
  value: string | number
  icon: React.ReactNode
  color?: string
  trend?: string
  trendPositive?: boolean
  sparklineBars?: number[] // e.g. [40, 70, 50, 90, 60]
  accent?: 'emerald' | 'blue' | 'gold' | 'rose'
  onClick?: () => void
}

interface StatsCardsProps {
  stats: StatCard[]
  isLoading?: boolean
}

const accentStyles = {
  emerald: {
    bg: 'bg-emerald-50/80',
    border: 'border-emerald-100',
    text: 'text-emerald-700',
    bar: 'bg-emerald-400',
    barActive: 'bg-emerald-600',
  },
  blue: {
    bg: 'bg-sky-50/80',
    border: 'border-sky-100',
    text: 'text-sky-700',
    bar: 'bg-sky-400',
    barActive: 'bg-sky-600',
  },
  gold: {
    bg: 'bg-amber-50/80',
    border: 'border-amber-100',
    text: 'text-amber-800',
    bar: 'bg-amber-400',
    barActive: 'bg-amber-600',
  },
  rose: {
    bg: 'bg-rose-50/80',
    border: 'border-rose-100',
    text: 'text-rose-700',
    bar: 'bg-rose-400',
    barActive: 'bg-rose-600',
  },
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200/70 p-5 animate-pulse shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200" />
              <div className="flex gap-1 items-end h-8">
                <div className="w-1.5 h-4 bg-gray-200 rounded" />
                <div className="w-1.5 h-7 bg-gray-200 rounded" />
                <div className="w-1.5 h-5 bg-gray-200 rounded" />
                <div className="w-1.5 h-8 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="h-7 w-24 bg-gray-200 rounded mb-1.5" />
            <div className="h-3.5 w-20 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    )
  }

  const defaultAccents: Array<'blue' | 'gold' | 'rose' | 'emerald'> = ['blue', 'gold', 'rose', 'emerald']

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {stats.map((stat, idx) => {
        const accentKey = stat.accent || defaultAccents[idx % defaultAccents.length]
        const theme = accentStyles[accentKey]
        const bars = stat.sparklineBars || [35, 60, 45, 80, 55, 95]

        return (
          <div
            key={stat.label}
            onClick={stat.onClick}
            className={`group bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-200 ${
              stat.onClick ? 'cursor-pointer active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-gold/50' : ''
            }`}
            role={stat.onClick ? 'button' : undefined}
            tabIndex={stat.onClick ? 0 : undefined}
            onKeyDown={stat.onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') stat.onClick?.() } : undefined}
          >
            <div className="flex items-center justify-between mb-3">
              {/* Contenedor de Ícono Suave con Borde */}
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-colors ${theme.bg} ${theme.border} ${theme.text}`}
              >
                {stat.icon}
              </div>

              {/* Mini Sparkline Bar Chart idéntico al de DigiClinic */}
              <div className="flex items-end gap-1 h-8 px-1">
                {bars.map((height, bIdx) => (
                  <div
                    key={bIdx}
                    className={`w-1.5 rounded-full transition-all duration-300 ${
                      bIdx === bars.length - 1 ? theme.barActive : theme.bar
                    } group-hover:opacity-100 opacity-80`}
                    style={{ height: `${Math.max(15, Math.min(100, height))}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Cifra Principal y Etiqueta */}
            <div className="space-y-0.5">
              <div className="text-2xl sm:text-3xl font-playfair font-bold text-navy tracking-tight tabular-nums">
                {stat.value}
              </div>
              <p className="text-xs font-montserrat font-medium text-gray-500 tracking-wide uppercase">
                {stat.label}
              </p>
            </div>

            {/* Subtítulo / Tendencia si está presente */}
            {stat.trend && (
              <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] font-montserrat">
                <span className={`font-semibold ${stat.trendPositive ? 'text-emerald-600' : 'text-gray-500'}`}>
                  {stat.trend}
                </span>
                <span className="text-gray-400">este período</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export const defaultStatIcons = {
  appointments: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  pending: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  procedures: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  followups: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  patients: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
}