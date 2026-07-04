import React, { useMemo } from 'react'
import type { ClinicWithAvailability } from '../../types'
import { useClinicOperatingStatus } from '../../hooks/useClinicOperatingStatus'

export interface ClinicDetailsPopupProps {
  clinic: ClinicWithAvailability
  allClinics: ClinicWithAvailability[]
  onClose: () => void
  onSelectClinic: (clinicId: string) => void
  onBookAppointment: () => void
}

/**
 * Helper to calculate distance between two coordinates in km (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * ClinicDetailsPopup Component
 * 
 * Renders detailed clinic information in a card/sidebar, including:
 * - Contact information (phone, whatsapp) with clickable actions
 * - Real-time open/closed status (via useClinicOperatingStatus)
 * - 7-day and 30-day availability indicators
 * - "Book Appointment" navigation triggers
 * - Alternative clinic suggestions if current clinic has no availability
 * 
 * **Validates: Requirements 2.3, 3.6, 4.1, 4.2, 4.4, 8.1, 8.4, 8.5, 9.3**
 */
export const ClinicDetailsPopup: React.FC<ClinicDetailsPopupProps> = ({
  clinic,
  allClinics,
  onClose,
  onSelectClinic,
  onBookAppointment,
}) => {
  const isOpen = useClinicOperatingStatus(clinic)

  // Find nearest alternative clinics that have availability
  const alternativeClinics = useMemo(() => {
    if (clinic.has_availability) return []

    return allClinics
      .filter((c) => c.id !== clinic.id && c.has_availability && c.is_active && !c.is_deleted)
      .map((c) => {
        const distance = calculateDistance(
          clinic.latitude,
          clinic.longitude,
          c.latitude,
          c.longitude
        )
        return { clinic: c, distance }
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2) // Suggest top 2 nearest clinics
  }, [clinic, allClinics])

  // Get current day name in Spanish
  const todayDayName = useMemo(() => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayIndex = new Date().getDay()
    return days[dayIndex]
  }, [])

  const todayHours = clinic.operating_hours[todayDayName as keyof typeof clinic.operating_hours]

  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden font-montserrat flex flex-col h-full max-h-[600px] w-full">
      {/* Header */}
      <div className="bg-navy text-white px-6 py-4 flex justify-between items-center relative">
        <div>
          <h3 className="font-playfair text-xl font-bold tracking-wide">{clinic.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                isOpen ? 'bg-green-400' : 'bg-red-400'
              }`}
            />
            <span className="text-xs text-gray-300 font-medium">
              {isOpen ? 'Abierto ahora' : 'Cerrado ahora'}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-300 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Cerrar detalles de la clínica"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body content */}
      <div className="p-6 overflow-y-auto space-y-6 flex-1">
        {/* Address & Contact Info */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-gold shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm text-gray-700 leading-relaxed">{clinic.address}</p>
          </div>

          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-gold shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <a href={`tel:${clinic.phone}`} className="text-sm text-navy hover:text-gold transition-colors font-medium">
              {clinic.phone}
            </a>
          </div>

          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.37 5.05L2 22l5.075-1.33a9.927 9.927 0 004.933 1.303h.004c5.505 0 9.988-4.478 9.989-9.984a9.98 9.98 0 00-9.99-9.989zM18.15 15.688c-.27.76-1.56 1.48-2.15 1.55-.58.07-1.16.29-3.76-.73-3.13-1.24-5.13-4.41-5.29-4.62-.16-.22-1.3-1.73-1.3-3.3 0-1.57.82-2.34 1.11-2.65.29-.3.64-.38.86-.38.22 0 .43.01.62.02.2.01.46-.08.72.54.27.65.92 2.24 1 2.4.08.16.14.35.03.57-.11.22-.16.35-.33.54-.16.19-.35.43-.5.58-.16.16-.33.34-.14.67.19.32.85 1.41 1.83 2.28 1.26 1.12 2.33 1.47 2.66 1.63.33.16.53.12.72-.1.19-.22.82-.95 1.04-1.28.22-.33.43-.27.73-.16.3.11 1.91.9 2.24 1.06.33.16.54.24.62.38.08.14.08.82-.19 1.58z" />
            </svg>
            <a
              href={`https://wa.me/${clinic.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-navy hover:text-gold transition-colors font-medium"
            >
              WhatsApp
            </a>
          </div>
        </div>

        {/* Operating Hours Today */}
        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-semibold text-navy mb-2 flex items-center gap-2">
            <svg className="h-4.5 w-4.5 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Horario Hoy:
          </h4>
          <p className="text-sm text-gray-600 pl-6.5">
            {todayHours?.closed
              ? 'Cerrado'
              : `${todayHours?.open || '08:00'} - ${todayHours?.close || '18:00'}`}
          </p>
        </div>

        {/* Availability Info */}
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <h4 className="text-sm font-semibold text-navy mb-1 flex items-center gap-2">
            <svg className="h-4.5 w-4.5 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Disponibilidad de Citas:
          </h4>
          <div className="grid grid-cols-2 gap-4 pl-6.5">
            <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Próximos 7 días</p>
              <p className="text-lg font-bold text-navy mt-1">
                {clinic.available_slots_7d} {clinic.available_slots_7d === 1 ? 'cupo' : 'cupos'}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Próximos 30 días</p>
              <p className="text-lg font-bold text-navy mt-1">
                {clinic.available_slots_30d} {clinic.available_slots_30d === 1 ? 'cupo' : 'cupos'}
              </p>
            </div>
          </div>
        </div>

        {/* No Availability Case: Alternatives */}
        {!clinic.has_availability && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-2 text-red-800">
              <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-semibold">Sin cupos disponibles</p>
                <p className="text-xs mt-0.5">Esta sede no tiene citas disponibles en este momento.</p>
              </div>
            </div>

            {alternativeClinics.length > 0 && (
              <div className="border-t border-red-100 pt-3 space-y-2">
                <p className="text-xs font-semibold text-gray-700">Sedes cercanas disponibles:</p>
                <div className="space-y-2">
                  {alternativeClinics.map(({ clinic: alt, distance }) => (
                    <div
                      key={alt.id}
                      className="flex items-center justify-between bg-white border border-gray-200 p-2.5 rounded-md hover:border-gold transition-colors duration-200"
                    >
                      <div className="text-left">
                        <p className="text-xs font-semibold text-navy">{alt.name}</p>
                        <p className="text-[10px] text-gray-500">A {distance.toFixed(1)} km · {alt.available_slots_7d} cupos</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectClinic(alt.id)}
                        className="text-xs font-semibold text-gold hover:text-navy transition-colors font-montserrat"
                      >
                        Ver Sede
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <button
          onClick={onBookAppointment}
          disabled={!clinic.has_availability}
          className={`w-full py-3 px-4 font-montserrat font-bold text-sm tracking-wide rounded-md transition-colors shadow-sm uppercase ${
            clinic.has_availability
              ? 'bg-gold hover:bg-gold/90 text-white cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
          }`}
        >
          {clinic.has_availability ? 'Reservar Cita' : 'Reserva No Disponible'}
        </button>
      </div>
    </div>
  )
}
