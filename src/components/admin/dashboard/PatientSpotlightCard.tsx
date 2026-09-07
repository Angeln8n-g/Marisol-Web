import React from 'react'
import { useNavigate } from 'react-router-dom'
import type { Appointment } from '../../../types'

interface PatientSpotlightCardProps {
  appointment?: Appointment | null
  isLoading?: boolean
}

export const PatientSpotlightCard: React.FC<PatientSpotlightCardProps> = ({
  appointment,
  isLoading = false,
}) => {
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm animate-pulse h-full flex flex-col justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-200" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded w-28" />
            <div className="h-3 bg-gray-100 rounded w-20" />
          </div>
        </div>
        <div className="h-16 bg-gray-50 rounded-xl my-4" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 bg-gray-100 rounded-xl" />
          <div className="h-16 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  // Si no hay cita próxima, mostrar estado vacío elegante
  if (!appointment || !appointment.patient) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-sm font-playfair font-bold text-navy">
              Próximo Paciente
            </h2>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>

          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gold/10 text-gold flex items-center justify-center border border-gold/20">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-navy font-montserrat">Agenda despejada</h3>
              <p className="text-xs text-gray-500 font-montserrat max-w-xs mx-auto">
                No hay citas inmediatas en los próximos 60 minutos.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/admin/appointments')}
          className="w-full py-2.5 px-4 text-xs font-montserrat font-semibold text-navy bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors"
        >
          Consultar agenda completa →
        </button>
      </div>
    )
  }

  const { patient, procedure, clinic, scheduled_at, duration_minutes, notes } = appointment

  // Cálculo de edad si existe fecha de nacimiento
  let patientAge = ''
  if (patient.birth_date) {
    const birth = new Date(patient.birth_date)
    const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    patientAge = `${age} años`
  }

  const aptDate = new Date(scheduled_at)
  const timeFormatted = aptDate.toLocaleTimeString('es-DO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  // Mensaje de WhatsApp directo
  const whatsappUrl = patient.phone
    ? `https://wa.me/${patient.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Hola ${patient.full_name}, le escribimos de la Clínica Dra. García para confirmar su cita de hoy a las ${timeFormatted}.`
      )}`
    : null

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full">
      <div>
        {/* Cabecera del Paciente con Avatar y Enlace */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-navy text-gold flex items-center justify-center font-playfair font-bold text-lg shadow-sm">
              {patient.full_name.charAt(0)}
            </div>
            <div>
              <h2 className="text-base font-bold text-navy font-playfair leading-tight">
                {patient.full_name}
              </h2>
              <p className="text-xs text-gray-500 font-montserrat">
                {patientAge ? `${patientAge} · ` : ''}{patient.gender === 'male' ? 'Masculino' : patient.gender === 'female' ? 'Femenino' : 'Paciente'}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate(`/admin/patients?search=${encodeURIComponent(patient.full_name)}`)}
            className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-navy flex items-center justify-center transition-colors border border-gray-200/60"
            title="Ver expediente del paciente"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        </div>

        {/* Motivo de consulta / Observación */}
        <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100 mb-4">
          <p className="text-[11px] font-montserrat font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Procedimiento / Motivo
          </p>
          <p className="text-xs font-montserrat font-medium text-navy leading-relaxed">
            {procedure?.name || notes || 'Consulta odontológica general'}
          </p>
        </div>

        {/* Indicadores clínicos clave */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-amber-50/60 border border-amber-100/80 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-playfair font-bold text-navy tabular-nums">
                {duration_minutes || 45} m
              </p>
              <p className="text-[10px] font-montserrat text-gray-500 uppercase font-medium">Duración</p>
            </div>
          </div>

          <div className="bg-sky-50/60 border border-sky-100/80 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="truncate">
              <p className="text-sm font-playfair font-bold text-navy truncate">
                {clinic?.name || 'Sede Central'}
              </p>
              <p className="text-[10px] font-montserrat text-gray-500 uppercase font-medium">Consultorio</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pie de tarjeta con Horario y Botón de Contacto Rápido */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-montserrat font-bold text-navy">{timeFormatted}</p>
            <p className="text-[10px] font-montserrat text-emerald-600 font-medium">Turno programado</p>
          </div>
        </div>

        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-colors"
            title="Enviar mensaje por WhatsApp al paciente"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </a>
        ) : (
          <button
            onClick={() => navigate('/admin/appointments')}
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gray-100 hover:bg-navy hover:text-white text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
