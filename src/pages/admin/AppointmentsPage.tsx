import React, { useState } from 'react'
import { AppointmentCalendar, AppointmentFilters, AppointmentCard } from '../../components/admin/appointments'
import { useAppointments } from '../../hooks/useAppointments'
import { useAppointmentStore } from '../../store/appointmentStore'
import type { Appointment } from '../../types'

export const AppointmentsPage: React.FC = () => {
  const { filters, setCalendarDate, setCalendarView, calendarDate, calendarView } =
    useAppointmentStore()
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  const {
    appointments,
    isLoading,
    updateAppointment,
  } = useAppointments({
    filters: {
      clinicId: filters.clinicId,
      status: filters.status,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    },
  })

  const handleConfirm = async (id: string) => {
    await updateAppointment({ id, status: 'confirmed' })
    setSelectedAppointment(null)
  }

  const handleCancel = async (id: string) => {
    await updateAppointment({ id, status: 'cancelled' })
    setSelectedAppointment(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-playfair text-navy">Citas</h1>
        <p className="text-sm text-gray-600 font-montserrat mt-1">
          Gestiona las citas de tus pacientes
        </p>
      </div>

      <AppointmentFilters />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 flex items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-gold" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : (
            <AppointmentCalendar
              appointments={appointments}
              onSelectEvent={(apt) => setSelectedAppointment(apt)}
              onSelectSlot={() => {}}
              date={calendarDate}
              onNavigate={(d) => setCalendarDate(d)}
              onView={(v) => setCalendarView(v as 'month' | 'week' | 'day' | 'agenda')}
              defaultView={calendarView}
            />
          )}
        </div>

        <div>
          {selectedAppointment ? (
            <AppointmentCard
              appointment={selectedAppointment}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              onClose={() => setSelectedAppointment(null)}
            />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-500 font-montserrat mt-3">
                Selecciona una cita en el calendario para ver sus detalles
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
