import React from 'react'
import { useNavigate } from 'react-router-dom'
import type { Appointment } from '../../../types'

interface RecentAppointmentsTableProps {
  appointments: Appointment[]
  isLoading?: boolean
}

const statusBadgeStyles: Record<string, { bg: string; text: string; label: string }> = {
  pending: {
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800',
    label: 'Pendiente',
  },
  confirmed: {
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-800',
    label: 'Confirmada',
  },
  in_progress: {
    bg: 'bg-sky-50 border-sky-200',
    text: 'text-sky-800',
    label: 'En Progreso',
  },
  completed: {
    bg: 'bg-gray-100 border-gray-200',
    text: 'text-gray-700',
    label: 'Completada',
  },
  cancelled: {
    bg: 'bg-rose-50 border-rose-200',
    text: 'text-rose-700',
    label: 'Cancelada',
  },
  rescheduled: {
    bg: 'bg-purple-50 border-purple-200',
    text: 'text-purple-800',
    label: 'Reprogramada',
  },
}

export const RecentAppointmentsTable: React.FC<RecentAppointmentsTableProps> = ({
  appointments,
  isLoading = false,
}) => {
  const navigate = useNavigate()

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden transition-all duration-200">
      {/* Cabecera de la Tabla */}
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-playfair font-bold text-navy">
            Citas Recientes de Pacientes
          </h2>
          <p className="text-xs font-montserrat text-gray-500 mt-0.5">
            Registro cronológico de las últimas consultas agendadas
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/appointments')}
          className="inline-flex items-center gap-1.5 text-xs font-montserrat font-semibold text-navy hover:text-gold transition-colors self-start sm:self-auto"
        >
          <span>Ver todas las citas</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Contenido de la Tabla */}
      {isLoading ? (
        <div className="p-8 space-y-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="p-12 text-center space-y-2">
          <svg className="w-10 h-10 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-montserrat text-gray-500">No hay citas registradas recientemente</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 text-[11px] font-montserrat font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="py-3.5 px-6">ID Cita</th>
                <th className="py-3.5 px-6">Horario</th>
                <th className="py-3.5 px-6">Paciente</th>
                <th className="py-3.5 px-6">Contacto</th>
                <th className="py-3.5 px-6">Procedimiento</th>
                <th className="py-3.5 px-6">Estado</th>
                <th className="py-3.5 px-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-montserrat">
              {appointments.slice(0, 7).map((apt) => {
                const badge = statusBadgeStyles[apt.status] || statusBadgeStyles.pending
                const aptDate = new Date(apt.scheduled_at)
                const timeStr = aptDate.toLocaleTimeString('es-DO', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })
                const dateStr = aptDate.toLocaleDateString('es-DO', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })

                const patientName = apt.patient?.full_name || 'Paciente no registrado'
                const displayId = apt.id.slice(0, 6).toUpperCase()

                return (
                  <tr
                    key={apt.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/admin/appointments?search=${encodeURIComponent(patientName)}`)}
                  >
                    {/* ID */}
                    <td className="py-4 px-6 font-semibold text-navy">
                      <span className="bg-gray-100 text-navy px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium">
                        #{displayId}
                      </span>
                    </td>

                    {/* Horario */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <p className="font-bold text-navy">{timeStr}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{dateStr}</p>
                    </td>

                    {/* Paciente */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-navy/10 text-navy font-playfair font-bold flex items-center justify-center flex-shrink-0 text-xs">
                          {patientName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-navy truncate">{patientName}</p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {apt.patient?.city || apt.clinic?.name || 'República Dominicana'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contacto */}
                    <td className="py-4 px-6">
                      <p className="text-gray-700 font-medium truncate max-w-[160px]">
                        {apt.patient?.phone || 'Sin teléfono'}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate max-w-[160px]">
                        {apt.patient?.email || '—'}
                      </p>
                    </td>

                    {/* Procedimiento */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200/60 max-w-[180px] truncate">
                        {apt.procedure?.name || apt.notes || 'Consulta Dental'}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.text}`}
                      >
                        {badge.label}
                      </span>
                    </td>

                    {/* Acción */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/admin/appointments?search=${encodeURIComponent(patientName)}`)
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-navy hover:bg-gray-100 transition-colors"
                        title="Ver detalles de la cita"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
