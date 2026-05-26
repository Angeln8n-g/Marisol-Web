import React, { useMemo } from 'react'
import { Calendar, dateFnsLocalizer, type Event, type View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale/es'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import type { Appointment, AppointmentStatus } from '../../../types'

const locales = { es }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

const statusColors: Record<AppointmentStatus, string> = {
  pending: '#EAB308',
  confirmed: '#22C55E',
  in_progress: '#3B82F6',
  completed: '#6B7280',
  cancelled: '#EF4444',
  rescheduled: '#A855F7',
}

interface CalendarEvent extends Event {
  id: string
  status: AppointmentStatus
  patientName: string
  clinicName: string
}

interface AppointmentCalendarProps {
  appointments: Appointment[]
  onSelectSlot?: (start: Date) => void
  onSelectEvent?: (appointment: Appointment) => void
  defaultView?: View
  date?: Date
  onNavigate?: (date: Date) => void
  onView?: (view: View) => void
}

export const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  appointments,
  onSelectSlot,
  onSelectEvent,
  defaultView = 'month',
  date,
  onNavigate,
  onView,
}) => {
  const events = useMemo<CalendarEvent[]>(
    () =>
      appointments.map((apt) => ({
        id: apt.id,
        title: `${apt.patient?.full_name || 'Paciente'} - ${apt.procedure?.name || apt.clinic?.name || ''}`,
        start: new Date(apt.scheduled_at),
        end: new Date(new Date(apt.scheduled_at).getTime() + apt.duration_minutes * 60000),
        status: apt.status,
        patientName: apt.patient?.full_name || '',
        clinicName: apt.clinic?.name || '',
        resource: apt,
      })),
    [appointments]
  )

  const eventPropGetter = (event: CalendarEvent) => ({
    style: {
      backgroundColor: statusColors[event.status] || '#6B7280',
      borderRadius: '6px',
      border: 'none',
      color: '#fff',
      fontSize: '0.8rem',
      padding: '2px 4px',
    },
  })

  const handleSelectSlot = ({ start }: { start: Date }) => {
    onSelectSlot?.(start)
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    const apt = appointments.find((a) => a.id === event.id)
    if (apt) onSelectEvent?.(apt)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        defaultView={defaultView}
        views={['month', 'week', 'day', 'agenda']}
        date={date}
        onNavigate={onNavigate}
        onView={onView}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        selectable
        eventPropGetter={eventPropGetter}
        messages={{
          next: 'Siguiente',
          previous: 'Anterior',
          today: 'Hoy',
          month: 'Mes',
          week: 'Semana',
          day: 'Día',
          agenda: 'Agenda',
          date: 'Fecha',
          time: 'Hora',
          event: 'Cita',
          noEventsInRange: 'No hay citas en este período',
          showMore: (total) => `+${total} más`,
        }}
      />
    </div>
  )
}
