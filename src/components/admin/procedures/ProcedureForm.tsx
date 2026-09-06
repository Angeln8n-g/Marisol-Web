import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const procedureSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  category: z.string().min(1, 'La categoría es requerida').max(100),
  description: z.string().max(1000).optional(),
  clinical_duration_minutes: z.coerce.number().min(5, 'Mínimo 5 min de atención clínica').max(480, 'Máximo 8 horas'),
  setup_buffer_minutes: z.coerce.number().min(0, 'Mínimo 0 minutos').max(120, 'Máximo 2 horas').default(10),
  cleanup_buffer_minutes: z.coerce.number().min(0, 'Mínimo 0 minutos').max(120, 'Máximo 2 horas').default(15),
  duration_minutes: z.coerce.number().min(5, 'Mínimo 5 minutos').max(600, 'Máximo 10 horas'),
  estimated_sessions: z.coerce.number().min(1, 'Mínimo 1 sesión').max(50, 'Máximo 50 sesiones').default(1),
  min_days_between_sessions: z.coerce.number().min(0, 'Mínimo 0 días').max(365, 'Máximo 1 año').default(0),
  requires_previous_cleaning: z.boolean().default(false),
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
  'Rehabilitación Oral',
  'Odontopediatría',
  'Radiología y Diagnóstico',
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
  const initialClinical = defaultValues?.clinical_duration_minutes ?? (defaultValues?.duration_minutes ? Math.max(15, defaultValues.duration_minutes - 25) : 45)
  const initialSetup = defaultValues?.setup_buffer_minutes ?? 10
  const initialCleanup = defaultValues?.cleanup_buffer_minutes ?? 15

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProcedureFormValues>({
    resolver: zodResolver(procedureSchema),
    defaultValues: {
      name: '',
      category: '',
      description: '',
      clinical_duration_minutes: initialClinical,
      setup_buffer_minutes: initialSetup,
      cleanup_buffer_minutes: initialCleanup,
      duration_minutes: defaultValues?.duration_minutes ?? (initialClinical + initialSetup + initialCleanup),
      estimated_sessions: defaultValues?.estimated_sessions ?? 1,
      min_days_between_sessions: defaultValues?.min_days_between_sessions ?? 0,
      requires_previous_cleaning: defaultValues?.requires_previous_cleaning ?? false,
      ...defaultValues,
    },
  })

  const clinical = watch('clinical_duration_minutes')
  const setup = watch('setup_buffer_minutes')
  const cleanup = watch('cleanup_buffer_minutes')
  const estimatedSessions = watch('estimated_sessions')

  // Auto-calculate total blocked duration whenever any timing component changes
  useEffect(() => {
    const c = Number(clinical) || 0
    const s = Number(setup) || 0
    const cl = Number(cleanup) || 0
    setValue('duration_minutes', c + s + cl)
  }, [clinical, setup, cleanup, setValue])

  const totalMinutes = (Number(clinical) || 0) + (Number(setup) || 0) + (Number(cleanup) || 0)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-navy mb-1.5">
            Nombre del Procedimiento *
          </label>
          <input
            id="name"
            type="text"
            placeholder="ej. Profilaxis Profunda, Implante Dental Titánico"
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
      </div>

      {/* Tiempos y Buffers */}
      <div className="bg-sand/30 p-4 rounded-lg border border-gold/30 space-y-4">
        <div className="flex items-center justify-between border-b border-gold/20 pb-2">
          <div>
            <h4 className="text-sm font-semibold text-navy font-montserrat flex items-center gap-2">
              <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Tiempos y Bloqueo de Sillón Dental
            </h4>
            <p className="text-xs text-gray-500 font-montserrat">
              Configura los tiempos clínicos y de higiene para optimizar la agenda de la clínica
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500">Bloqueo Total:</span>
            <span className="ml-2 font-bold text-navy text-sm font-montserrat">{totalMinutes} min</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="clinical_duration_minutes" className="block text-xs font-medium text-navy mb-1">
              Atención Clínica * (min)
            </label>
            <input
              id="clinical_duration_minutes"
              type="number"
              min={5}
              max={480}
              {...register('clinical_duration_minutes')}
              className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold ${
                errors.clinical_duration_minutes ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <p className="text-[11px] text-gray-500 mt-0.5">Tiempo activo con el paciente</p>
            {errors.clinical_duration_minutes && <p className="mt-1 text-xs text-red-600">{errors.clinical_duration_minutes.message}</p>}
          </div>

          <div>
            <label htmlFor="setup_buffer_minutes" className="block text-xs font-medium text-navy mb-1">
              Buffer Preparación (min)
            </label>
            <input
              id="setup_buffer_minutes"
              type="number"
              min={0}
              max={120}
              {...register('setup_buffer_minutes')}
              className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold ${
                errors.setup_buffer_minutes ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <p className="text-[11px] text-gray-500 mt-0.5">Alistamiento de instrumental</p>
            {errors.setup_buffer_minutes && <p className="mt-1 text-xs text-red-600">{errors.setup_buffer_minutes.message}</p>}
          </div>

          <div>
            <label htmlFor="cleanup_buffer_minutes" className="block text-xs font-medium text-navy mb-1">
              Buffer Desinfección (min)
            </label>
            <input
              id="cleanup_buffer_minutes"
              type="number"
              min={0}
              max={120}
              {...register('cleanup_buffer_minutes')}
              className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold ${
                errors.cleanup_buffer_minutes ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <p className="text-[11px] text-gray-500 mt-0.5">Esterilización de gabinete</p>
            {errors.cleanup_buffer_minutes && <p className="mt-1 text-xs text-red-600">{errors.cleanup_buffer_minutes.message}</p>}
          </div>
        </div>

        {/* Hidden input to ensure total duration_minutes is submitted */}
        <input type="hidden" {...register('duration_minutes')} />
      </div>

      {/* Sesiones y Planificación */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="estimated_sessions" className="block text-sm font-medium text-navy mb-1.5">
            Sesiones Estimadas para Completar
          </label>
          <input
            id="estimated_sessions"
            type="number"
            min={1}
            max={50}
            {...register('estimated_sessions')}
            className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold ${
              errors.estimated_sessions ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <p className="text-xs text-gray-500 mt-1">
            Indica si el procedimiento requiere múltiples citas (ej. endodoncias o prótesis)
          </p>
          {errors.estimated_sessions && <p className="mt-1 text-sm text-red-600">{errors.estimated_sessions.message}</p>}
        </div>

        <div>
          <label htmlFor="min_days_between_sessions" className="block text-sm font-medium text-navy mb-1.5">
            Días Mínimos Entre Sesiones
          </label>
          <input
            id="min_days_between_sessions"
            type="number"
            min={0}
            max={365}
            disabled={Number(estimatedSessions) <= 1}
            {...register('min_days_between_sessions')}
            className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold disabled:bg-gray-100 disabled:text-gray-400 ${
              errors.min_days_between_sessions ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <p className="text-xs text-gray-500 mt-1">
            Tiempo de espera para fraguado, laboratorio o cicatrización
          </p>
          {errors.min_days_between_sessions && <p className="mt-1 text-sm text-red-600">{errors.min_days_between_sessions.message}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="requires_previous_cleaning"
          type="checkbox"
          {...register('requires_previous_cleaning')}
          className="w-4 h-4 rounded text-gold focus:ring-gold border-gray-300"
        />
        <label htmlFor="requires_previous_cleaning" className="text-sm text-navy cursor-pointer font-montserrat">
          Requiere profilaxis o limpieza dental previa obligatoria
        </label>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-navy mb-1.5">
          Descripción y Detalles Clínicos
        </label>
        <textarea
          id="description"
          rows={3}
          placeholder="Detalles sobre el procedimiento, recomendaciones para el paciente, etc."
          {...register('description')}
          className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
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
          {isSubmitting ? 'Guardando...' : 'Guardar Procedimiento'}
        </button>
      </div>
    </form>
  )
}
