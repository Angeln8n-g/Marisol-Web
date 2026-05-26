import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const appointmentSchema = z.object({
  patient_id: z.string().min(1, 'Selecciona un paciente'),
  clinic_id: z.string().min(1, 'Selecciona una clínica'),
  procedure_id: z.string().min(1, 'Selecciona un procedimiento'),
  scheduled_at: z.string().min(1, 'Selecciona una fecha y hora'),
  duration_minutes: z.coerce.number().min(15, 'Mínimo 15 minutos').max(480, 'Máximo 8 horas'),
  notes: z.string().optional(),
})

export type AppointmentFormValues = z.infer<typeof appointmentSchema>

interface AppointmentFormProps {
  onSubmit: (data: AppointmentFormValues) => Promise<void>
  isSubmitting?: boolean
  defaultValues?: Partial<AppointmentFormValues>
  patients?: { id: string; full_name: string }[]
  clinics?: { id: string; name: string }[]
  procedures?: { id: string; name: string }[]
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  onSubmit,
  isSubmitting = false,
  defaultValues,
  patients = [],
  clinics = [],
  procedures = [],
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient_id: '',
      clinic_id: '',
      procedure_id: '',
      scheduled_at: '',
      duration_minutes: 30,
      notes: '',
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div>
        <label htmlFor="patient_id" className="block text-sm font-medium text-navy mb-1.5">
          Paciente *
        </label>
        <select
          id="patient_id"
          {...register('patient_id')}
          className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold ${
            errors.patient_id ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Selecciona un paciente</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.full_name}</option>
          ))}
        </select>
        {errors.patient_id && <p className="mt-1 text-sm text-red-600">{errors.patient_id.message}</p>}
      </div>

      <div>
        <label htmlFor="clinic_id" className="block text-sm font-medium text-navy mb-1.5">
          Clínica *
        </label>
        <select
          id="clinic_id"
          {...register('clinic_id')}
          className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold ${
            errors.clinic_id ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Selecciona una clínica</option>
          {clinics.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {errors.clinic_id && <p className="mt-1 text-sm text-red-600">{errors.clinic_id.message}</p>}
      </div>

      <div>
        <label htmlFor="procedure_id" className="block text-sm font-medium text-navy mb-1.5">
          Procedimiento *
        </label>
        <select
          id="procedure_id"
          {...register('procedure_id')}
          className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold ${
            errors.procedure_id ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Selecciona un procedimiento</option>
          {procedures.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {errors.procedure_id && <p className="mt-1 text-sm text-red-600">{errors.procedure_id.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="scheduled_at" className="block text-sm font-medium text-navy mb-1.5">
            Fecha y Hora *
          </label>
          <input
            id="scheduled_at"
            type="datetime-local"
            {...register('scheduled_at')}
            className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold ${
              errors.scheduled_at ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.scheduled_at && <p className="mt-1 text-sm text-red-600">{errors.scheduled_at.message}</p>}
        </div>

        <div>
          <label htmlFor="duration_minutes" className="block text-sm font-medium text-navy mb-1.5">
            Duración (min) *
          </label>
          <input
            id="duration_minutes"
            type="number"
            min={15}
            max={480}
            {...register('duration_minutes')}
            className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold ${
              errors.duration_minutes ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.duration_minutes && <p className="mt-1 text-sm text-red-600">{errors.duration_minutes.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-navy mb-1.5">
          Notas
        </label>
        <textarea
          id="notes"
          rows={3}
          {...register('notes')}
          className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-2.5 bg-gold text-white font-montserrat font-semibold rounded-md hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Guardando...' : 'Guardar Cita'}
      </button>
    </form>
  )
}
