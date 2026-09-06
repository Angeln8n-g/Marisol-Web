import React from 'react'
import { Badge } from '../../ui'
import type { Appointment, AppointmentStatus } from '../../../types'
import { formatDateTime } from '../../../lib/utils'

interface AppointmentListViewProps {
  appointments: Appointment[]
  onSelectAppointment: (apt: Appointment) => void
  onEditAppointment: (apt: Appointment) => void
  onStatusChange: (id: string, status: AppointmentStatus) => Promise<void>
  onCancelAppointment: (id: string) => Promise<void>
  onReschedule?: (apt: Appointment) => void
  onInvoice?: (apt: Appointment) => void
  onWhatsAppModal?: (apt: Appointment) => void
}

export const AppointmentListView: React.FC<AppointmentListViewProps> = ({
  appointments,
  onSelectAppointment,
  onEditAppointment,
  onStatusChange,
  onCancelAppointment,
  onReschedule,
  onInvoice,
  onWhatsAppModal,
}) => {
  if (appointments.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
        <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-sm font-semibold text-navy font-montserrat mt-3">No hay citas registradas</h3>
        <p className="text-xs text-gray-500 font-montserrat mt-1">No se encontraron citas con los filtros seleccionados.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider font-montserrat">
                Fecha y Hora
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider font-montserrat">
                Paciente
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider font-montserrat">
                Clínica / Sede
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider font-montserrat">
                Procedimiento
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider font-montserrat">
                Estado
              </th>
              <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider font-montserrat">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {appointments.map((apt) => {
              const whatsappUrl = apt.patient?.phone
                ? `https://wa.me/${apt.patient.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Hola ${apt.patient.full_name}, le recordamos su cita odontológica en la clínica ${apt.clinic?.name || 'Dra. García'} para ${apt.procedure?.name || 'su consulta'} el día ${formatDateTime(apt.scheduled_at)}. ¡Le esperamos!`
                  )}`
                : null

              return (
                <tr key={apt.id} className="hover:bg-sand/10 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-navy font-montserrat">
                      {formatDateTime(apt.scheduled_at)}
                    </div>
                    <div className="text-xs text-gray-500 font-montserrat">
                      {apt.duration_minutes} min
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onSelectAppointment(apt)}
                      className="text-left text-sm font-medium text-navy hover:text-gold transition-colors font-montserrat"
                    >
                      {apt.patient?.full_name || '—'}
                    </button>
                    {apt.patient?.phone && (
                      <div className="text-xs text-gray-500 font-montserrat">
                        {apt.patient.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-montserrat">
                    {apt.clinic?.name || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-navy font-montserrat">
                      {apt.procedure?.name || 'Consulta General'}
                    </div>
                    {apt.notes && (
                      <div className="text-xs text-gray-500 truncate max-w-xs font-montserrat mt-0.5">
                        {apt.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge status={apt.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-1.5 text-xs font-montserrat">
                    {/* WhatsApp Template / Direct */}
                    {apt.patient?.phone && (
                      onWhatsAppModal ? (
                        <button
                          type="button"
                          onClick={() => onWhatsAppModal(apt)}
                          className="p-1.5 inline-flex items-center text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title="Plantillas WhatsApp"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                          </svg>
                        </button>
                      ) : whatsappUrl ? (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 inline-flex items-center text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title="Recordatorio WhatsApp"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                          </svg>
                        </a>
                      ) : null
                    )}

                    {/* Quick Invoice Button for Completed Appointments */}
                    {apt.status === 'completed' && onInvoice && (
                      <button
                        onClick={() => onInvoice(apt)}
                        className="px-2.5 py-1 text-xs font-semibold text-white bg-gold rounded hover:bg-gold/90 transition-colors shadow-xs"
                        title="Generar Factura"
                      >
                        Facturar
                      </button>
                    )}

                    {/* Medical Record Shortcut */}
                    {apt.patient_id && (
                      <a
                        href={`/admin/medical-records?patientId=${apt.patient_id}`}
                        className="px-2 py-1 text-xs font-semibold text-navy bg-sand/40 hover:bg-sand/60 rounded border border-gold/30 transition-colors"
                        title="Ver Historial Clínico"
                      >
                        Historial
                      </a>
                    )}

                    <button
                      onClick={() => onEditAppointment(apt)}
                      className="px-2 py-1 text-xs font-semibold text-gold bg-gold/10 rounded hover:bg-gold/20 transition-colors"
                    >
                      Editar
                    </button>

                    {onReschedule && apt.status !== 'cancelled' && (
                      <button
                        onClick={() => onReschedule(apt)}
                        className="px-2 py-1 text-xs font-semibold text-purple-700 bg-purple-50 rounded hover:bg-purple-100 transition-colors"
                      >
                        Reprogramar
                      </button>
                    )}

                    {apt.status === 'pending' && (
                      <button
                        onClick={() => onStatusChange(apt.id, 'confirmed')}
                        className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-50 rounded hover:bg-green-100 transition-colors"
                      >
                        Confirmar
                      </button>
                    )}

                    {apt.status === 'confirmed' && (
                      <button
                        onClick={() => onStatusChange(apt.id, 'in_progress')}
                        className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                      >
                        En Sillón
                      </button>
                    )}

                    {apt.status === 'in_progress' && (
                      <button
                        onClick={() => onStatusChange(apt.id, 'completed')}
                        className="px-2 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 rounded hover:bg-emerald-200 transition-colors"
                      >
                        Completar
                      </button>
                    )}

                    {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                      <button
                        onClick={() => {
                          if (window.confirm('¿Deseas cancelar esta cita?')) {
                            onCancelAppointment(apt.id)
                          }
                        }}
                        className="px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
