import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'

const appointmentSchema = z.object({
  full_name: z.string().min(1, 'El nombre completo es requerido').max(100),
  phone: z.string().min(1, 'El teléfono es requerido').regex(
    /^(\+?1)?[\s.-]?\(?([2-9]\d{2})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})$/,
    'Ingresa un número de teléfono válido'
  ),
  service: z.string().min(1, 'Selecciona un servicio'),
  preferred_date: z.string().min(1, 'Selecciona una fecha preferida'),
  preferred_time_slot: z.enum(['morning', 'afternoon'], {
    required_error: 'Selecciona una franja horaria',
  }),
  clinic_id: z.string().optional(),
})

type AppointmentFormValues = z.infer<typeof appointmentSchema>

const services = [
  { value: 'periodoncia', label: 'Periodoncia' },
  { value: 'implantes', label: 'Implantes Dentales' },
  { value: 'estetica', label: 'Estética Dental' },
  { value: 'ortodoncia', label: 'Ortodoncia' },
  { value: 'endodoncia', label: 'Endodoncia' },
  { value: 'general', label: 'Odontología General' },
]

export const AppointmentForm: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      service: '',
      preferred_date: '',
      preferred_time_slot: undefined,
      clinic_id: '',
    },
  })

  const onSubmit = async (data: AppointmentFormValues) => {
    setSubmitError(null)

    const scheduledAt = data.preferred_time_slot === 'morning'
      ? `${data.preferred_date}T09:00:00`
      : `${data.preferred_date}T14:00:00`

    const { error } = await supabase.from('appointments').insert({
      patient_id: '00000000-0000-0000-0000-000000000000',
      clinic_id: data.clinic_id || '00000000-0000-0000-0000-000000000000',
      procedure_id: '00000000-0000-0000-0000-000000000000',
      assigned_doctor: null,
      scheduled_at: scheduledAt,
      duration_minutes: 30,
      status: 'pending',
      notes: `Solicitud pública - Servicio: ${data.service} - Franja: ${data.preferred_time_slot === 'morning' ? 'Mañana' : 'Tarde'} - Nombre: ${data.full_name} - Tel: ${data.phone}`,
    } as never)

    if (error) {
      setSubmitError('Ocurrió un error al enviar tu solicitud. Por favor intenta de nuevo.')
      return
    }

    setIsSubmitted(true)
    reset()
  }

  if (isSubmitted) {
    return (
      <section id="appointment-form" className="py-24 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-playfair text-navy mb-3">
            ¡Solicitud Enviada!
          </h3>
          <p className="text-gray-600 font-montserrat mb-6">
            Hemos recibido tu solicitud de cita. Nos pondremos en contacto contigo
            pronto para confirmar el horario disponible.
          </p>
          <button
            onClick={() => setIsSubmitted(false)}
            className="px-6 py-2.5 bg-gold text-white font-montserrat font-semibold rounded-md hover:bg-gold/90 transition-colors"
          >
            Enviar otra solicitud
          </button>
        </div>
      </section>
    )
  }

  return (
    <section id="appointment-form" className="py-24 bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-gold font-montserrat text-sm tracking-[0.3em] uppercase mb-4">
            Agenda tu cita
          </p>
          <h2 className="text-3xl sm:text-4xl font-playfair text-navy">
            Reserva tu Primera Consulta
          </h2>
          <p className="mt-4 text-gray-600 font-montserrat">
            Déjanos tus datos y te contactaremos para confirmar tu cita.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-navy mb-1.5">
              Nombre Completo *
            </label>
            <input
              id="full_name"
              type="text"
              {...register('full_name')}
              className={`w-full px-4 py-2.5 rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold ${
                errors.full_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
              }`}
              placeholder="Tu nombre completo"
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-600" role="alert">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-navy mb-1.5">
              Teléfono *
            </label>
            <input
              id="phone"
              type="tel"
              {...register('phone')}
              className={`w-full px-4 py-2.5 rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold ${
                errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
              }`}
              placeholder="809-555-1234"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600" role="alert">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="service" className="block text-sm font-medium text-navy mb-1.5">
              Servicio *
            </label>
            <select
              id="service"
              {...register('service')}
              className={`w-full px-4 py-2.5 rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold ${
                errors.service ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Selecciona un servicio</option>
              {services.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            {errors.service && (
              <p className="mt-1 text-sm text-red-600" role="alert">{errors.service.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="preferred_date" className="block text-sm font-medium text-navy mb-1.5">
              Fecha Preferida *
            </label>
            <input
              id="preferred_date"
              type="date"
              {...register('preferred_date')}
              className={`w-full px-4 py-2.5 rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold ${
                errors.preferred_date ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
              }`}
            />
            {errors.preferred_date && (
              <p className="mt-1 text-sm text-red-600" role="alert">{errors.preferred_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">
              Franja Horaria Preferida *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center justify-center px-4 py-3 rounded-md border cursor-pointer transition-colors ${
                  errors.preferred_time_slot ? 'border-red-500' : 'border-gray-300'
                } hover:border-gold has-[:checked]:bg-gold/10 has-[:checked]:border-gold`}
              >
                <input
                  type="radio"
                  value="morning"
                  {...register('preferred_time_slot')}
                  className="sr-only"
                />
                <span className="text-sm font-montserrat text-navy">
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Mañana
                </span>
              </label>
              <label
                className={`flex items-center justify-center px-4 py-3 rounded-md border cursor-pointer transition-colors ${
                  errors.preferred_time_slot ? 'border-red-500' : 'border-gray-300'
                } hover:border-gold has-[:checked]:bg-gold/10 has-[:checked]:border-gold`}
              >
                <input
                  type="radio"
                  value="afternoon"
                  {...register('preferred_time_slot')}
                  className="sr-only"
                />
                <span className="text-sm font-montserrat text-navy">
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  Tarde
                </span>
              </label>
            </div>
            {errors.preferred_time_slot && (
              <p className="mt-1 text-sm text-red-600" role="alert">{errors.preferred_time_slot.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="clinic_id" className="block text-sm font-medium text-navy mb-1.5">
              Clínica Preferida (opcional)
            </label>
            <select
              id="clinic_id"
              {...register('clinic_id')}
              className="w-full px-4 py-2.5 rounded-md border border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold"
            >
              <option value="">Sin preferencia</option>
            </select>
          </div>

          {submitError && (
            <div className="p-4 rounded-md bg-red-50 border border-red-200 text-sm text-red-700 font-montserrat" role="alert">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-8 py-3.5 bg-gold text-white font-montserrat font-semibold rounded-md hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Enviando...
              </>
            ) : (
              'Solicitar Cita'
            )}
          </button>
        </form>
      </div>
    </section>
  )
}
