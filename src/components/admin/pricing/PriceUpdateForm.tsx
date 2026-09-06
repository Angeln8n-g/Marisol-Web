import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const priceSchema = z.object({
  price: z.coerce.number().positive('El precio debe ser mayor a 0'),
  currency: z.enum(['DOP', 'USD', 'EUR'], { required_error: 'Selecciona una moneda' }),
  effective_from: z.string().min(1, 'Selecciona una fecha de inicio'),
  change_reason: z.string().min(1, 'El motivo del cambio es requerido').max(500),
})

export type PriceUpdateFormValues = z.infer<typeof priceSchema>

interface PriceUpdateFormProps {
  procedureName: string
  currentPrice?: number | null
  currentCurrency?: string
  onSubmit: (data: PriceUpdateFormValues) => Promise<void>
  isSubmitting?: boolean
  onCancel?: () => void
}

export const PriceUpdateForm: React.FC<PriceUpdateFormProps> = ({
  procedureName,
  currentPrice,
  currentCurrency = 'DOP',
  onSubmit,
  isSubmitting = false,
  onCancel,
}) => {
  const isInitialPrice = currentPrice === null || currentPrice === undefined || currentPrice <= 0

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PriceUpdateFormValues>({
    resolver: zodResolver(priceSchema),
    defaultValues: {
      price: currentPrice && currentPrice > 0 ? currentPrice : undefined,
      currency: (currentCurrency || 'DOP') as 'DOP' | 'USD' | 'EUR',
      effective_from: new Date().toISOString().split('T')[0],
      change_reason: isInitialPrice ? 'Precio inicial fijado al catálogo' : '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="bg-sand/30 p-3.5 rounded-lg border border-gold/30">
        <p className="text-sm text-gray-700 font-montserrat">
          {isInitialPrice ? (
            <>Asignando <span className="font-semibold text-gold">precio inicial</span> para: </>
          ) : (
            <>Actualizando precio vigente para: </>
          )}
          <span className="font-bold text-navy">{procedureName}</span>
        </p>
        {!isInitialPrice && currentPrice && (
          <p className="text-xs text-gray-500 font-montserrat mt-1">
            Precio actual: <span className="font-semibold text-navy">{currentCurrency} {currentPrice.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-navy mb-1.5">
            {isInitialPrice ? 'Precio Inicial *' : 'Nuevo Precio *'}
          </label>
          <input
            id="price"
            type="number"
            step="0.01"
            min="0"
            {...register('price')}
            className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold ${
              errors.price ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
        </div>

        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-navy mb-1.5">
            Moneda *
          </label>
          <select
            id="currency"
            {...register('currency')}
            className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold ${
              errors.currency ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="DOP">DOP (RD$)</option>
            <option value="USD">USD (US$)</option>
            <option value="EUR">EUR (€)</option>
          </select>
          {errors.currency && <p className="mt-1 text-sm text-red-600">{errors.currency.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="effective_from" className="block text-sm font-medium text-navy mb-1.5">
          Fecha de Inicio *
        </label>
        <input
          id="effective_from"
          type="date"
          {...register('effective_from')}
          className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold ${
            errors.effective_from ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.effective_from && <p className="mt-1 text-sm text-red-600">{errors.effective_from.message}</p>}
      </div>

      <div>
        <label htmlFor="change_reason" className="block text-sm font-medium text-navy mb-1.5">
          Motivo del Cambio *
        </label>
        <textarea
          id="change_reason"
          rows={3}
          {...register('change_reason')}
          className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold ${
            errors.change_reason ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Ej: Ajuste anual de tarifas, Cambio en costos de materiales..."
        />
        {errors.change_reason && <p className="mt-1 text-sm text-red-600">{errors.change_reason.message}</p>}
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
          {isSubmitting ? 'Guardando...' : isInitialPrice ? 'Asignar Precio' : 'Actualizar Precio'}
        </button>
      </div>
    </form>
  )
}
