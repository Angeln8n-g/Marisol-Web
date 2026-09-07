import React, { useMemo } from 'react'
import {
  Calendar,
  dateFnsLocalizer,
  type Event,
  type View,
  type ToolbarProps,
} from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale/es'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './AppointmentCalendar.css'
import type { Appointment, AppointmentStatus } from '../../../types'

const locales = { es }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

const statusConfig: Record<
  AppointmentStatus,
  { bg: string; text: string; border: string; label: string }
> = {
  pending: {
    bg: '#FEF3C7',
    text: '#92400E',
    border: '#F59E0B',
    label: 'Pendiente',
  },
  confirmed: {
    bg: '#D1FAE5',
    text: '#065F46',
    border: '#10B981',
    label: 'Confirmada',
  },
  in_progress: {
    bg: '#DBEAFE',
    text: '#1E40AF',
    border: '#3B82F6',
    label: 'En Consulta',
  },
  completed: {
    bg: '#F3F4F6',
    text: '#374151',
    border: '#9CA3AF',
    label: 'Completada',
  },
  cancelled: {
    bg: '#FEE2E2',
    text: '#991B1B',
    border: '#EF4444',
    label: 'Cancelada',
  },
  rescheduled: {
    bg: '#F3E8FF',
    text: '#6B21A8',
    border: '#A855F7',
    label: 'Reprogramada',
  },
}

interface CalendarEvent extends Event {
  id: string
  status: AppointmentStatus
  patientName: string
  clinicName: string
  procedureName?: string
  resource: Appointment
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

/**
 * Barra de herramientas personalizada con diseño clínico de alta gama.
 */
const CustomToolbar: React.FC<ToolbarProps<CalendarEvent>> = ({
  label,
  date,
  view,
  onNavigate,
  onView,
}) => {
  // Formatear etiqueta en español con mayúscula inicial
  const formattedLabel = useMemo(() => {
    if (view === 'month') {
      const monthStr = date.toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })
      return monthStr.charAt(0).toUpperCase() + monthStr.slice(1)
    }
    return label
  }, [date, label, view])

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 mb-4 border-b border-gray-100">
      {/* Controles de Navegación y Fecha */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-gray-100/90 rounded-xl p-1 border border-gray-200/50">
          <button
            type="button"
            onClick={() => onNavigate('PREV')}
            className="w-8 h-8 rounded-lg hover:bg-white text-gray-600 hover:text-navy flex items-center justify-center transition-colors focus:outline-none"
            title="Período anterior"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('TODAY')}
            className="px-3 py-1 text-xs font-montserrat font-bold text-navy hover:bg-white rounded-lg transition-colors focus:outline-none"
          >
            Hoy
          </button>

          <button
            type="button"
            onClick={() => onNavigate('NEXT')}
            className="w-8 h-8 rounded-lg hover:bg-white text-gray-600 hover:text-navy flex items-center justify-center transition-colors focus:outline-none"
            title="Período siguiente"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <h2 className="text-lg sm:text-xl font-playfair font-bold text-navy tracking-tight">
          {formattedLabel}
        </h2>
      </div>

      {/* Selector de Vistas Segmentado */}
      <div className="flex items-center gap-1 bg-gray-100/90 rounded-xl p-1 border border-gray-200/50 self-start sm:self-auto">
        {(['month', 'week', 'day', 'agenda'] as View[]).map((v) => {
          const viewLabels: Record<string, string> = {
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            agenda: 'Agenda',
          }

          const isActive = view === v

          return (
            <button
              key={v}
              type="button"
              onClick={() => onView(v)}
              className={`px-3 py-1.5 text-xs font-montserrat font-medium rounded-lg transition-all ${
                isActive
                  ? 'bg-navy text-gold shadow-sm font-bold'
                  : 'text-gray-500 hover:text-navy hover:bg-gray-200/50'
              }`}
            >
              {viewLabels[v] || v}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Renderizado de evento individual con estilo de pastilla clínica.
 */
const CustomEventComponent: React.FC<{ event: CalendarEvent }> = ({ event }) => {
  const config = statusConfig[event.status] || statusConfig.pending

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-montserrat font-semibold truncate border shadow-2xs"
      style={{
        backgroundColor: config.bg,
        color: config.text,
        borderColor: config.border,
      }}
      title={`${event.patientName} (${event.procedureName || 'Consulta'}) - ${config.label}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: config.border }}
      />
      <span className="truncate flex-1 font-bold">{event.patientName}</span>
      {event.procedureName && (
        <span className="opacity-75 text-[10px] hidden sm:inline truncate">
          · {event.procedureName}
        </span>
      )}
    </div>
  )
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
        title: `${apt.patient?.full_name || 'Paciente'}`,
        start: new Date(apt.scheduled_at),
        end: new Date(new Date(apt.scheduled_at).getTime() + (apt.duration_minutes || 45) * 60000),
        status: apt.status,
        patientName: apt.patient?.full_name || 'Paciente',
        clinicName: apt.clinic?.name || '',
        procedureName: apt.procedure?.name,
        resource: apt,
      })),
    [appointments]
  )

  const handleSelectSlot = ({ start }: { start: Date }) => {
    onSelectSlot?.(start)
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    onSelectEvent?.(event.resource)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-sm transition-all duration-200">
      {/* Leyenda de Estados en la parte superior */}
      <div className="flex flex-wrap items-center gap-3 pb-4 mb-4 border-b border-gray-100 text-[11px] font-montserrat font-medium text-gray-500">
        <span className="font-bold text-navy uppercase text-[10px] tracking-wider">Estados:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Confirmada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Pendiente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>En Consulta</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span>Reprogramada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
          <span>Completada</span>
        </div>
      </div>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 680 }}
        defaultView={defaultView}
        views={['month', 'week', 'day', 'agenda']}
        date={date}
        onNavigate={onNavigate}
        onView={onView}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        selectable
        components={{
          toolbar: CustomToolbar,
          event: CustomEventComponent,
        }}
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
