import React from 'react'
import { useNavigate } from 'react-router-dom'

interface ClinicalStatusWidgetProps {
  stableCount?: number
  inTreatmentCount?: number
  alertCount?: number
  ageDistribution?: {
    senior: number // 31+ o 25+
    adult: number  // 16-30
    young: number  // 0-15
  }
}

export const ClinicalStatusWidget: React.FC<ClinicalStatusWidgetProps> = ({
  stableCount = 28,
  inTreatmentCount = 14,
  alertCount = 3,
  ageDistribution = { senior: 24, adult: 12, young: 7 },
}) => {
  const navigate = useNavigate()

  const totalAgePatients =
    ageDistribution.senior + ageDistribution.adult + ageDistribution.young || 1

  const seniorPercent = Math.round((ageDistribution.senior / totalAgePatients) * 100)
  const adultPercent = Math.round((ageDistribution.adult / totalAgePatients) * 100)
  const youngPercent = Math.round((ageDistribution.young / totalAgePatients) * 100)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* Tarjeta 1: Pacientes Estables / En Control */}
      <div
        onClick={() => navigate('/admin/patients')}
        className="cursor-pointer bg-white rounded-2xl border border-emerald-100/80 p-5 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-[10px] font-montserrat font-bold text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded-full">
            Al día
          </span>
        </div>
        <div className="space-y-0.5">
          <div className="text-2xl sm:text-3xl font-playfair font-bold text-navy tabular-nums">
            {stableCount}
          </div>
          <p className="text-xs font-montserrat font-semibold text-gray-600">
            Pacientes Estables
          </p>
        </div>
      </div>

      {/* Tarjeta 2: En Tratamiento Activo */}
      <div
        onClick={() => navigate('/admin/appointments?status=in_progress')}
        className="cursor-pointer bg-white rounded-2xl border border-amber-100/80 p-5 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-200 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-[10px] font-montserrat font-bold text-amber-700 uppercase bg-amber-50 px-2 py-0.5 rounded-full">
            Activo
          </span>
        </div>
        <div className="space-y-0.5">
          <div className="text-2xl sm:text-3xl font-playfair font-bold text-navy tabular-nums">
            {inTreatmentCount}
          </div>
          <p className="text-xs font-montserrat font-semibold text-gray-600">
            En Tratamiento
          </p>
        </div>
      </div>

      {/* Tarjeta 3: Seguimiento Crítico / Requerido */}
      <div
        onClick={() => navigate('/admin/appointments')}
        className="cursor-pointer bg-white rounded-2xl border border-rose-100/80 p-5 shadow-sm hover:shadow-md hover:border-rose-200 transition-all duration-200 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <span className="text-[10px] font-montserrat font-bold text-rose-700 uppercase bg-rose-50 px-2 py-0.5 rounded-full">
            Revisión
          </span>
        </div>
        <div className="space-y-0.5">
          <div className="text-2xl sm:text-3xl font-playfair font-bold text-navy tabular-nums">
            {alertCount}
          </div>
          <p className="text-xs font-montserrat font-semibold text-gray-600">
            Seguimiento Crítico
          </p>
        </div>
      </div>

      {/* Tarjeta 4: Rango de Edad de Pacientes (Estilo DigiClinic Blue Pill) */}
      <div className="bg-navy text-white rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-gold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xs font-montserrat font-bold uppercase tracking-wider text-gray-200">
              Rango de Edad
            </h3>
          </div>
          <span className="text-[11px] font-montserrat text-gold font-semibold">
            {totalAgePatients} Pacientes
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center my-1">
          <div className="bg-white/10 rounded-xl p-2">
            <div className="text-lg font-playfair font-bold text-gold tabular-nums">
              {ageDistribution.senior}
            </div>
            <p className="text-[10px] font-montserrat text-gray-300 font-medium">
              25+ Años
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-2">
            <div className="text-lg font-playfair font-bold text-white tabular-nums">
              {ageDistribution.adult}
            </div>
            <p className="text-[10px] font-montserrat text-gray-300 font-medium">
              16-30 Años
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-2">
            <div className="text-lg font-playfair font-bold text-white tabular-nums">
              {ageDistribution.young}
            </div>
            <p className="text-[10px] font-montserrat text-gray-300 font-medium">
              0-15 Años
            </p>
          </div>
        </div>

        {/* Barra de distribución porcentual */}
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden flex mt-2">
          <div style={{ width: `${seniorPercent}%` }} className="bg-gold h-full" title={`25+ Años: ${seniorPercent}%`} />
          <div style={{ width: `${adultPercent}%` }} className="bg-sky-400 h-full" title={`16-30 Años: ${adultPercent}%`} />
          <div style={{ width: `${youngPercent}%` }} className="bg-emerald-400 h-full" title={`0-15 Años: ${youngPercent}%`} />
        </div>
      </div>
    </div>
  )
}
