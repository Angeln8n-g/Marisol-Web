import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const recordSchema = z.object({
  chief_complaint: z.string().min(1, 'El motivo de consulta es requerido').max(1000),
  diagnosis: z.string().max(2000).optional(),
  treatment_plan: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
  record_date: z.string().min(1, 'Selecciona una fecha'),
})

export type MedicalRecordFormValues = z.infer<typeof recordSchema>

interface MedicalRecordFormProps {
  onSubmit: (data: MedicalRecordFormValues) => Promise<void>
  isSubmitting?: boolean
  onCancel?: () => void
  defaultValues?: Partial<MedicalRecordFormValues>
}

export const MedicalRecordForm: React.FC<MedicalRecordFormProps> = ({
  onSubmit,
  isSubmitting = false,
  onCancel,
  defaultValues,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MedicalRecordFormValues>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      chief_complaint: '',
      diagnosis: '',
      treatment_plan: '',
      notes: '',
      record_date: new Date().toISOString().split('T')[0],
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div>
        <label htmlFor="record_date" className="block text-sm font-medium text-navy mb-1.5">
          Fecha *
        </label>
        <input
          id="record_date"
          type="date"
          {...register('record_date')}
          className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold ${
            errors.record_date ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.record_date && <p className="mt-1 text-sm text-red-600">{errors.record_date.message}</p>}
      </div>

      <div>
        <label htmlFor="chief_complaint" className="block text-sm font-medium text-navy mb-1.5">
          Motivo de Consulta *
        </label>
        <textarea
          id="chief_complaint"
          rows={3}
          {...register('chief_complaint')}
          className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold ${
            errors.chief_complaint ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Motivo principal de la consulta"
        />
        {errors.chief_complaint && <p className="mt-1 text-sm text-red-600">{errors.chief_complaint.message}</p>}
      </div>

      <div>
        <label htmlFor="diagnosis" className="block text-sm font-medium text-navy mb-1.5">
          Diagnóstico
        </label>
        <textarea
          id="diagnosis"
          rows={3}
          {...register('diagnosis')}
          className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          placeholder="Diagnóstico del paciente"
        />
      </div>

      <div>
        <label htmlFor="treatment_plan" className="block text-sm font-medium text-navy mb-1.5">
          Plan de Tratamiento
        </label>
        <textarea
          id="treatment_plan"
          rows={3}
          {...register('treatment_plan')}
          className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          placeholder="Plan de tratamiento recomendado"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-navy mb-1.5">
          Notas Adicionales
        </label>
        <textarea
          id="notes"
          rows={3}
          {...register('notes')}
          className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          placeholder="Notas adicionales"
        />
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
          {isSubmitting ? 'Guardando...' : 'Guardar Registro'}
        </button>
      </div>
    </form>
  )
}
