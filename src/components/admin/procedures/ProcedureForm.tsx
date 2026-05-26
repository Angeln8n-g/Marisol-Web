import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const procedureSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  category: z.string().min(1, 'La categoría es requerida').max(100),
  description: z.string().max(1000).optional(),
  duration_minutes: z.coerce.number().min(5, 'Mínimo 5 minutos').max(480, 'Máximo 8 horas'),
})

export type ProcedureFormValues = z.infer<typeof procedureSchema>

const categories = [
  'Periodoncia',
  'Implantes',
  'Estética Dental',
  'Ortodoncia',
  'Endodoncia',
  'Odontología General',
  'Cirugía Oral',
  'Radiología',
]

interface ProcedureFormProps {
  onSubmit: (data: ProcedureFormValues) => Promise<void>
  isSubmitting?: boolean
  defaultValues?: Partial<ProcedureFormValues>
  onCancel?: () => void
}

export const ProcedureForm: React.FC<ProcedureFormProps> = ({
  onSubmit,
  isSubmitting = false,
  defaultValues,
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProcedureFormValues>({
    resolver: zodResolver(procedureSchema),
    defaultValues: {
      name: '',
      category: '',
      description: '',
      duration_minutes: 30,
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-navy mb-1.5">
          Nombre *
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-navy mb-1.5">
          Categoría *
        </label>
        <select
          id="category"
          {...register('category')}
          className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold ${
            errors.category ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Selecciona una categoría</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
      </div>

      <div>
        <label htmlFor="duration_minutes" className="block text-sm font-medium text-navy mb-1.5">
          Duración (minutos) *
        </label>
        <input
          id="duration_minutes"
          type="number"
          min={5}
          max={480}
          {...register('duration_minutes')}
          className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold ${
            errors.duration_minutes ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.duration_minutes && <p className="mt-1 text-sm text-red-600">{errors.duration_minutes.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-navy mb-1.5">
          Descripción
        </label>
        <textarea
          id="description"
          rows={3}
          {...register('description')}
          className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-gold text-white text-sm font-semibold rounded-md hover:bg-gold/90 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Guardando...' : 'Guardar Procedimiento'}
        </button>
      </div>
    </form>
  )
}
