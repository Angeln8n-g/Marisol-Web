import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface MiniCalendarWidgetProps {
  selectedDate?: string | null
  onDateSelect?: (date: string) => void
  appointmentDates?: string[] // ['2026-03-05', '2026-03-19', ...]
}

export const MiniCalendarWidget: React.FC<MiniCalendarWidgetProps> = ({
  selectedDate: externalSelectedDate,
  onDateSelect,
  appointmentDates = [],
}) => {
  const navigate = useNavigate()
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => {
    if (externalSelectedDate) {
      const parsed = new Date(externalSelectedDate)
      if (!isNaN(parsed.getTime())) return parsed
    }
    return new Date()
  })
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date>(() => {
    if (externalSelectedDate) {
      const parsed = new Date(externalSelectedDate)
      if (!isNaN(parsed.getTime())) return parsed
    }
    return new Date()
  })

  const year = currentMonthDate.getFullYear()
  const month = currentMonthDate.getMonth()

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1))
  }

  // Generar cuadrícula de días
  const firstDayIndex = new Date(year, month, 1).getDay() // 0 = Domingo
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  // Días del mes anterior
  const prevDays = []
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    prevDays.push({ day: daysInPrevMonth - i, isCurrentMonth: false, date: new Date(year, month - 1, daysInPrevMonth - i) })
  }

  // Días del mes actual
  const currentDays = []
  for (let i = 1; i <= daysInMonth; i++) {
    currentDays.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) })
  }

  // Días del siguiente mes para completar 35 o 42 celdas
  const totalCells = prevDays.length + currentDays.length
  const nextCellsCount = totalCells > 35 ? 42 - totalCells : 35 - totalCells
  const nextDays = []
  for (let i = 1; i <= nextCellsCount; i++) {
    nextDays.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) })
  }

  const allDays = [...prevDays, ...currentDays, ...nextDays]

  const handleSelectDay = (d: Date) => {
    setInternalSelectedDate(d)
    const isoString = d.toISOString().split('T')[0]
    if (onDateSelect) {
      onDateSelect(isoString)
    }
  }

  const isSelected = (d: Date) => {
    return (
      d.getDate() === internalSelectedDate.getDate() &&
      d.getMonth() === internalSelectedDate.getMonth() &&
      d.getFullYear() === internalSelectedDate.getFullYear()
    )
  }

  const isToday = (d: Date) => {
    const today = new Date()
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    )
  }

  const hasAppointment = (d: Date) => {
    const iso = d.toISOString().split('T')[0]
    return appointmentDates.includes(iso)
  }

  const formattedSelected = internalSelectedDate.toLocaleDateString('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full">
      <div>
        {/* Cabecera del Mes */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-navy transition-colors"
            aria-label="Mes anterior"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h3 className="text-sm font-playfair font-bold text-navy tracking-wide">
            {monthNames[month]} {year}
          </h3>

          <button
            onClick={nextMonth}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-navy transition-colors"
            aria-label="Mes siguiente"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Días de la Semana */}
        <div className="grid grid-cols-7 text-center mb-2">
          {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map((d, idx) => (
            <span
              key={idx}
              className="text-[11px] font-montserrat font-semibold text-gray-400 py-1"
            >
              {d}
            </span>
          ))}
        </div>

        {/* Cuadrícula de Fechas */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {allDays.map((cell, idx) => {
            const selected = isSelected(cell.date)
            const today = isToday(cell.date)
            const marked = hasAppointment(cell.date)

            return (
              <button
                key={idx}
                onClick={() => handleSelectDay(cell.date)}
                className={`relative h-8 w-8 mx-auto flex items-center justify-center rounded-xl text-xs font-montserrat transition-all duration-150 ${
                  selected
                    ? 'bg-navy text-gold font-bold shadow-sm'
                    : today
                    ? 'bg-gold/20 text-navy font-bold ring-1 ring-gold'
                    : cell.isCurrentMonth
                    ? 'text-navy hover:bg-gray-100 font-medium'
                    : 'text-gray-300 hover:bg-gray-50'
                }`}
              >
                <span>{cell.day}</span>
                {marked && !selected && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Pie de Calendario con Input de Fecha y Botón + Cita */}
      <div className="pt-4 mt-4 border-t border-gray-100 flex items-center gap-2">
        <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200/80 rounded-xl text-xs font-montserrat text-navy font-medium text-center">
          {formattedSelected}
        </div>

        <button
          onClick={() => navigate(`/admin/appointments?date=${internalSelectedDate.toISOString().split('T')[0]}&action=new`)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy hover:bg-navy-light text-white text-xs font-montserrat font-semibold rounded-xl shadow-sm transition-colors whitespace-nowrap"
        >
          <svg className="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>+ Cita</span>
        </button>
      </div>
    </div>
  )
}
