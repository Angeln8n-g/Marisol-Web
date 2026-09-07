import React from 'react'
import { useNavigate } from 'react-router-dom'
import type { Appointment } from '../../../types'

interface TodayTimelineWidgetProps {
  appointments?: Appointment[]
  doctorName?: string
  doctorHours?: string
  isLoading?: boolean
}

export const TodayTimelineWidget: React.FC<TodayTimelineWidgetProps> = ({
  appointments = [],
  doctorName = 'Dra. Marisol García',
  doctorHours = '09:00 AM - 06:00 PM',
  isLoading = false,
}) => {
  const navigate = useNavigate()

  // Filtrar citas del día de hoy o tomar las primeras disponibles
  const todayStr = new Date().toISOString().split('T')[0]
  const todayAppointments = appointments
    .filter((a) => a.scheduled_at.startsWith(todayStr))
    .slice(0, 5)

  // Citas a renderizar (si no hay appointments hoy, mostrar lista ilustrativa o vacía)
  const itemsToRender = todayAppointments.length > 0 ? todayAppointments : appointments.slice(0, 3)

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full">
      <div>
        {/* Cabecera del Widget */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-playfair font-bold text-navy">
              Agenda del Día
            </h2>
            <p className="text-xs font-montserrat text-gray-500">
              Turnos y citas programadas para la jornada
            </p>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200/60 px-3 py-1.5 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-montserrat font-medium text-navy">
              En consulta
            </span>
          </div>
        </div>

        {/* Tarjeta del Especialista en Turno (Estilo DigiClinic) */}
        <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy text-gold flex items-center justify-center font-playfair font-bold text-sm shadow-sm">
              {doctorName.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-montserrat font-bold text-navy">
                {doctorName}
              </p>
              <p className="text-[11px] font-montserrat text-gray-500">
                Horario: {doctorHours}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/admin/appointments')}
            className="text-[11px] font-montserrat font-semibold text-navy hover:text-gold transition-colors"
          >
            Ver calendario →
          </button>
        </div>

        {/* Timeline Items */}
        {isLoading ? (
          <div className="space-y-3 py-4 animate-pulse">
            <div className="h-16 bg-gray-100 rounded-xl" />
            <div className="h-16 bg-gray-100 rounded-xl" />
          </div>
        ) : itemsToRender.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <div className="w-10 h-10 mx-auto rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xs font-montserrat text-gray-500">
              No hay citas programadas para el resto del día.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
            {itemsToRender.map((apt, idx) => {
              const aptTime = new Date(apt.scheduled_at)
              const timeFormatted = aptTime.toLocaleTimeString('es-DO', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })

              const isPaid = apt.billing_status === 'billed' || apt.status === 'completed'

              return (
                <div key={apt.id || idx} className="relative group">
                  {/* Punto en la línea de tiempo */}
                  <div className="absolute -left-[27px] top-3.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-navy group-hover:scale-110 transition-transform shadow-sm" />

                  <div className="bg-white hover:bg-slate-50/90 border border-gray-200/80 rounded-xl p-3.5 transition-all duration-150 shadow-sm">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-montserrat font-bold text-navy">
                        {timeFormatted} · {apt.duration_minutes || 45} min
                      </span>

                      <span
                        className={`text-[10px] font-montserrat font-bold px-2 py-0.5 rounded-full ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isPaid ? 'Pagado' : 'Pendiente'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-montserrat">
                      <span className="font-semibold text-gray-800 truncate">
                        {apt.patient?.full_name || 'Paciente asignado'}
                      </span>
                      <span className="text-gray-400 text-[11px] truncate max-w-[140px]">
                        {apt.procedure?.name || apt.notes || 'Consulta regular'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="pt-3 mt-4 border-t border-gray-100 text-center">
        <button
          onClick={() => navigate('/admin/appointments')}
          className="w-full py-2 text-xs font-montserrat font-semibold text-navy hover:text-gold transition-colors"
        >
          Gestionar todos los turnos del día →
        </button>
      </div>
    </div>
  )
}
