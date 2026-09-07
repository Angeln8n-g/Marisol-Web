import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../store/authStore'

interface DashboardWelcomeHeroProps {
  todayAppointmentsCount?: number
  pendingCount?: number
  onExport?: () => void
}

export const DashboardWelcomeHero: React.FC<DashboardWelcomeHeroProps> = ({
  todayAppointmentsCount = 0,
  pendingCount = 0,
  onExport,
}) => {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  // Saludo dinámico según la hora del día
  const currentHour = new Date().getHours()
  const greeting =
    currentHour < 12
      ? '¡Buenos días'
      : currentHour < 19
      ? '¡Buenas tardes'
      : '¡Buenas noches'

  const doctorName = user?.full_name || 'Dra. Marisol García'

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-sm transition-all duration-200">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Lado izquierdo: Avatar e información del doctor */}
        <div className="flex items-start sm:items-center gap-4 sm:gap-5">
          <div className="relative flex-shrink-0">
            <img
              src="/Marisol_picture.jpeg"
              alt={doctorName}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-gold/40 shadow-md"
              onError={(e) => {
                // Fallback a monograma si la imagen no carga
                const target = e.target as HTMLElement
                target.style.display = 'none'
                target.nextElementSibling?.classList.remove('hidden')
              }}
            />
            <div className="hidden w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-navy text-gold font-playfair font-bold text-2xl flex items-center justify-center ring-2 ring-gold/40 shadow-md">
              {doctorName.charAt(0)}
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" title="En servicio" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-playfair font-bold text-navy tracking-tight">
                {greeting}, <span className="text-navy">{doctorName}</span>
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-montserrat font-medium bg-gold/15 text-navy border border-gold/30">
                Especialista Dental
              </span>
            </div>

            <p className="text-sm text-gray-600 font-montserrat max-w-2xl leading-relaxed italic">
              "La excelencia clínica y la calidez humana son el corazón de cada sonrisa que cuidamos."
            </p>

            <div className="flex items-center gap-3 pt-1 text-xs font-montserrat text-gray-500">
              <span className="flex items-center gap-1.5 text-navy font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                {todayAppointmentsCount} {todayAppointmentsCount === 1 ? 'cita programada hoy' : 'citas programadas hoy'}
              </span>
              {pendingCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-700 font-medium">
                    {pendingCount} por confirmar
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Lado derecho: Acciones directas */}
        <div className="flex items-center gap-3 self-end lg:self-center">
          {onExport && (
            <button
              onClick={onExport}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-montserrat font-medium text-navy bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-navy/10"
              title="Descargar reporte en formato CSV"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Exportar CSV</span>
            </button>
          )}

          <button
            onClick={() => navigate('/admin/appointments?action=new')}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-montserrat font-semibold text-white bg-navy hover:bg-navy-light active:scale-[0.98] rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
          >
            <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Nueva Cita</span>
          </button>
        </div>
      </div>
    </div>
  )
}
