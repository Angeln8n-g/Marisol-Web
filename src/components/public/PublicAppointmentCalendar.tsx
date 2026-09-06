import React, { useState } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns'
import { es } from 'date-fns/locale/es'
import { useClinicMonthAvailability, useClinicTimeSlots } from '../../hooks/useClinicTimeSlots'

interface SelectedSlot {
  date: Date
  time: string
  formattedTime: string
  datetime: string
}

interface PublicAppointmentCalendarProps {
  clinicId: string
  durationMinutes?: number
  selectedSlot: SelectedSlot | null
  onSelectSlot: (slot: SelectedSlot) => void
}

export const PublicAppointmentCalendar: React.FC<PublicAppointmentCalendarProps> = ({
  clinicId,
  durationMinutes = 30,
  selectedSlot,
  onSelectSlot,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(selectedSlot?.date || null)

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  // Fetch month availability
  const { data: monthStatus, isLoading: isLoadingMonth } = useClinicMonthAvailability(
    clinicId,
    year,
    month
  )

  // Fetch specific day slots
  const { data: daySlotsData, isLoading: isLoadingSlots } = useClinicTimeSlots(
    clinicId,
    selectedDate,
    durationMinutes
  )

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = eachDayOfInterval({ start: startDate, end: endDate })
  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  const handlePrevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1))
  const handleNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1))

  const handleDateClick = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd')
    const dayInfo = monthStatus?.[dateKey]

    if (dayInfo?.isPast || dayInfo?.isOpen === false) {
      return // Closed or past day
    }

    setSelectedDate(day)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all">
      {/* Header del Calendario */}
      <div className="bg-navy p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="font-playfair text-lg capitalize font-semibold tracking-wide">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </span>
          {isLoadingMonth && (
            <span className="text-[10px] bg-gold/20 text-gold px-2 py-0.5 rounded-full font-montserrat animate-pulse">
              Actualizando...
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            disabled={isSameMonth(currentMonth, new Date())}
            className="p-1.5 rounded-md hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Mes anterior"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
            aria-label="Mes siguiente"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Leyenda de Días de la semana */}
        <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-500 font-montserrat uppercase tracking-wider mb-2">
          {weekDays.map((d) => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>

        {/* Cuadrícula de Días */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isDayToday = isSameDay(day, new Date())
            const isDaySelected = selectedDate ? isSameDay(day, selectedDate) : false
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayInfo = monthStatus?.[dateKey]

            const isPast = day.getTime() < today.getTime()
            const isClosed = isCurrentMonth && dayInfo ? !dayInfo.isOpen : false
            const isAvailable = isCurrentMonth && !isPast && !isClosed

            let buttonClass = 'relative flex flex-col items-center justify-center h-10 sm:h-12 rounded-lg text-sm font-montserrat font-medium transition-all '

            if (!isCurrentMonth) {
              buttonClass += 'text-gray-300 opacity-40 cursor-not-allowed'
            } else if (isPast) {
              buttonClass += 'text-gray-300 bg-gray-50 cursor-not-allowed'
            } else if (isClosed) {
              buttonClass += 'text-gray-400 bg-gray-100/70 cursor-not-allowed'
            } else if (isDaySelected) {
              buttonClass += 'bg-gold text-white shadow-md font-bold ring-2 ring-gold ring-offset-2'
            } else {
              buttonClass += 'text-navy bg-white hover:bg-gold/10 hover:border-gold border border-gray-200 cursor-pointer'
            }

            return (
              <button
                key={day.toString()}
                type="button"
                disabled={!isAvailable}
                onClick={() => handleDateClick(day)}
                className={buttonClass}
              >
                <span>{format(day, 'd')}</span>
                {isDayToday && !isDaySelected && (
                  <span className="absolute bottom-1 w-1 h-1 bg-gold rounded-full" />
                )}
                {isClosed && isCurrentMonth && !isPast && (
                  <span className="text-[9px] text-gray-400 leading-none">Cerrado</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Leyenda Rápida */}
        <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 font-montserrat pt-2 border-t border-gray-100 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border border-gray-300 bg-white" />
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gold" />
            <span>Seleccionado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gray-200" />
            <span>Cerrado / No disponible</span>
          </div>
        </div>

        {/* Sección de Horarios Disponibles */}
        {selectedDate && (
          <div className="pt-4 border-t border-gray-200 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-navy font-montserrat flex items-center gap-2">
                <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Horarios para el {format(selectedDate, "d 'de' MMMM", { locale: es })}
              </h4>
              {selectedSlot && isSameDay(selectedDate, selectedSlot.date) && (
                <span className="text-xs bg-gold/10 text-gold px-2.5 py-1 rounded-full font-medium">
                  {selectedSlot.formattedTime}
                </span>
              )}
            </div>

            {isLoadingSlots ? (
              <div className="py-8 flex justify-center items-center gap-2 text-sm text-gray-500 font-montserrat">
                <svg className="animate-spin h-5 w-5 text-gold" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Calculando disponibilidad de horarios...</span>
              </div>
            ) : !daySlotsData?.isOpen ? (
              <div className="p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-600 font-montserrat">
                La clínica no tiene horario de atención disponible para esta fecha.
              </div>
            ) : daySlotsData.slots.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center text-sm text-amber-800 font-montserrat">
                No hay turnos disponibles para este día debido a la duración del servicio. Por favor selecciona otra fecha.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                {daySlotsData.slots.map((slot) => {
                  const isSlotSelected =
                    selectedSlot &&
                    isSameDay(selectedDate, selectedSlot.date) &&
                    selectedSlot.time === slot.time

                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() =>
                        onSelectSlot({
                          date: selectedDate,
                          time: slot.time,
                          formattedTime: slot.formattedTime,
                          datetime: slot.datetime,
                        })
                      }
                      className={`px-3 py-2.5 rounded-lg text-xs font-montserrat font-medium transition-all flex items-center justify-center gap-1.5 ${
                        isSlotSelected
                          ? 'bg-navy text-gold shadow border border-gold font-bold'
                          : slot.available
                          ? 'bg-cream text-navy hover:bg-gold/20 hover:border-gold border border-gray-200 cursor-pointer'
                          : 'bg-gray-100 text-gray-400 border border-gray-200/60 line-through cursor-not-allowed opacity-60'
                      }`}
                    >
                      <span>{slot.formattedTime}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
