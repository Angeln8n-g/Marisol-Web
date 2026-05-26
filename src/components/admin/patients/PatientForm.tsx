import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const patientSchema = z.object({
  full_name: z.string().min(1, 'El nombre completo es requerido').max(200),
  phone: z.string().min(1, 'El teléfono es requerido').regex(
    /^(\+?1)?[\s.-]?\(?([2-9]\d{2})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})$/,
    'Ingresa un número de teléfono válido'
  ),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
  birth_date: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  medical_alerts: z.string().max(500).optional(),
})

export type PatientFormValues = z.infer<typeof patientSchema>

interface PatientFormProps {
  onSubmit: (data: PatientFormValues) => Promise<void>
  isSubmitting?: boolean
  defaultValues?: Partial<PatientFormValues>
  onCancel?: () => void
}

export const PatientForm: React.FC<PatientFormProps> = ({
  onSubmit,
  isSubmitting = false,
  defaultValues,
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      birth_date: '',
      gender: undefined,
      medical_alerts: '',
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-navy mb-1.5">
          Nombre Completo *
        </label>
        <input
          id="full_name"
          type="text"
          {...register('full_name')}
          className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold ${
            errors.full_name ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.full_name && <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-navy mb-1.5">
          Teléfono *
        </label>
        <input
          id="phone"
          type="tel"
          {...register('phone')}
          className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold ${
            errors.phone ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="809-555-1234"
        />
        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-navy mb-1.5">
          Correo Electrónico
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="birth_date" className="block text-sm font-medium text-navy mb-1.5">
            Fecha de Nacimiento
          </label>
          <input
            id="birth_date"
            type="date"
            {...register('birth_date')}
            className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>

        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-navy mb-1.5">
            Género
          </label>
          <select
            id="gender"
            {...register('gender')}
            className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          >
            <option value="">Seleccionar</option>
            <option value="male">Masculino</option>
            <option value="female">Femenino</option>
            <option value="other">Otro</option>
            <option value="prefer_not_to_say">Prefiero no decirlo</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="medical_alerts" className="block text-sm font-medium text-navy mb-1.5">
          Alertas Médicas
        </label>
        <textarea
          id="medical_alerts"
          rows={3}
          {...register('medical_alerts')}
          className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          placeholder="Alergias, condiciones preexistentes, etc."
        />
        {errors.medical_alerts && <p className="mt-1 text-sm text-red-600">{errors.medical_alerts.message}</p>}
      </div>

      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-gold text-white text-sm font-semibold rounded-md hover:bg-gold/90 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Guardando...' : 'Guardar Paciente'}
        </button>
      </div>
    </form>
  )
}
