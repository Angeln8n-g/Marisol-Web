import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateClinicSchema } from '../../../lib/schemas'
import { useGeocode } from '../../../hooks/useGeocode'
import { locationService } from '../../../lib/services/LocationService'
import type { Clinic, CreateClinicDTO, UpdateClinicDTO, OperatingHours, SpecialHour } from '../../../types'

/**
 * LocationManagerForm Component
 * 
 * Form component for creating and editing clinic locations.
 * 
 * **Implements: Requirements 1.1, 1.2, 7.1, 7.4, 7.5, 8.2, 8.3**
 * 
 * Features:
 * - Create new clinics or edit existing ones
 * - Real-time Zod validation
 * - Address geocoding integration
 * - Manual coordinate adjustment
 * - Operating hours configuration (7 days)
 * - Special hours configuration (holidays/exceptions)
 * - Validation warnings for inconsistent data
 */

interface LocationManagerFormProps {
  clinic?: Clinic
  onSubmit: (data: CreateClinicDTO | UpdateClinicDTO) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

const defaultOperatingHours: OperatingHours = {
  monday: { open: '08:00', close: '18:00', closed: false },
  tuesday: { open: '08:00', close: '18:00', closed: false },
  wednesday: { open: '08:00', close: '18:00', closed: false },
  thursday: { open: '08:00', close: '18:00', closed: false },
  friday: { open: '08:00', close: '18:00', closed: false },
  saturday: { open: '09:00', close: '14:00', closed: false },
  sunday: { open: '00:00', close: '00:00', closed: true },
}

export const LocationManagerForm: React.FC<LocationManagerFormProps> = ({
  clinic,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const isEditMode = !!clinic
  const [geocodeWarning, setGeocodeWarning] = useState<string>('')
  const [specialHours, setSpecialHours] = useState<SpecialHour[]>(clinic?.special_hours || [])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<CreateClinicDTO>({
    resolver: zodResolver(CreateClinicSchema),
    defaultValues: clinic ? {
      name: clinic.name,
      address: clinic.address,
      latitude: clinic.latitude,
      longitude: clinic.longitude,
      phone: clinic.phone,
      whatsapp: clinic.whatsapp,
      operating_hours: clinic.operating_hours,
      special_hours: clinic.special_hours,
    } : {
      name: '',
      address: '',
      latitude: 0,
      longitude: 0,
      phone: '',
      whatsapp: '',
      operating_hours: defaultOperatingHours,
      special_hours: [],
    },
  })

  const { mutate: geocode, isPending: isGeocoding } = useGeocode()

  const currentAddress = watch('address')
  const currentLatitude = watch('latitude')
  const currentLongitude = watch('longitude')

  useEffect(() => {
    const checkConsistency = async () => {
      if (currentLatitude === 0 && currentLongitude === 0) {
        setGeocodeWarning('Las coordenadas (0,0) son poco probables. Por favor verifica.')
        return
      }

      if (currentAddress && currentAddress.length >= 10 && currentLatitude && currentLongitude) {
        try {
          const result = await locationService.checkCoordinateConsistency(
            currentAddress,
            currentLatitude,
            currentLongitude
          )
          if (!result.consistent && result.warning) {
            setGeocodeWarning(result.warning)
          } else {
            setGeocodeWarning('')
          }
        } catch (e) {
          setGeocodeWarning('')
        }
      } else {
        setGeocodeWarning('')
      }
    }

    checkConsistency()
  }, [currentAddress, currentLatitude, currentLongitude])

  const handleGeocode = () => {
    if (!currentAddress || currentAddress.length < 10) {
      setGeocodeWarning('Por favor ingresa una dirección válida primero.')
      return
    }

    geocode(currentAddress, {
      onSuccess: (result) => {
        setValue('latitude', result.latitude)
        setValue('longitude', result.longitude)
        setGeocodeWarning(
          result.confidence === 'low' 
            ? 'Geocodificación con baja confianza. Verifica las coordenadas.' 
            : ''
        )
      },
      onError: (error) => {
        setGeocodeWarning(`Error al geocodificar: ${error.message}`)
      },
    })
  }

  const handleAddSpecialHour = () => {
    const newSpecialHour: SpecialHour = {
      date: '',
      reason: '',
      closed: false,
    }
    setSpecialHours([...specialHours, newSpecialHour])
  }

  const handleRemoveSpecialHour = (index: number) => {
    setSpecialHours(specialHours.filter((_, i) => i !== index))
  }

  const handleSpecialHourChange = (index: number, field: keyof SpecialHour, value: any) => {
    const updated = [...specialHours]
    updated[index] = { ...updated[index], [field]: value }
    setSpecialHours(updated)
  }

  const onFormSubmit = async (data: CreateClinicDTO) => {
    await onSubmit({ ...data, special_hours: specialHours })
  }

  const dayNames: (keyof OperatingHours)[] = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ]

  const dayLabels: Record<keyof OperatingHours, string> = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6" noValidate>
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-navy font-montserrat">Información Básica</h3>
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-navy mb-1.5">
            Nombre de la Clínica *
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Clínica Dental Centro"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-navy mb-1.5">
            Dirección Completa *
          </label>
          <textarea
            id="address"
            rows={2}
            {...register('address')}
            className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold ${
              errors.address ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Calle, número, ciudad, código postal"
          />
          {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
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
              placeholder="+1 809-555-1234"
            />
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
          </div>

          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-navy mb-1.5">
              WhatsApp *
            </label>
            <input
              id="whatsapp"
              type="tel"
              {...register('whatsapp')}
              className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold ${
                errors.whatsapp ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="+1 809-555-1234"
            />
            {errors.whatsapp && <p className="mt-1 text-sm text-red-600">{errors.whatsapp.message}</p>}
          </div>
        </div>
      </div>

      {/* Geographic Coordinates */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-navy font-montserrat">Coordenadas Geográficas</h3>
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleGeocode}
            disabled={isGeocoding || !currentAddress}
            className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-md hover:bg-navy/90 transition-colors disabled:opacity-50"
          >
            {isGeocoding ? 'Geocodificando...' : 'Obtener Coordenadas'}
          </button>
          <span className="text-xs text-gray-500 self-center">
            Geocodifica automáticamente desde la dirección
          </span>
        </div>

        {geocodeWarning && (
          <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200 text-sm text-yellow-700 font-montserrat">
            {geocodeWarning}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="latitude" className="block text-sm font-medium text-navy mb-1.5">
              Latitud *
            </label>
            <input
              id="latitude"
              type="number"
              step="any"
              {...register('latitude', { valueAsNumber: true })}
              className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold ${
                errors.latitude ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="18.4861"
            />
            {errors.latitude && <p className="mt-1 text-sm text-red-600">{errors.latitude.message}</p>}
          </div>

          <div>
            <label htmlFor="longitude" className="block text-sm font-medium text-navy mb-1.5">
              Longitud *
            </label>
            <input
              id="longitude"
              type="number"
              step="any"
              {...register('longitude', { valueAsNumber: true })}
              className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold ${
                errors.longitude ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="-69.9312"
            />
            {errors.longitude && <p className="mt-1 text-sm text-red-600">{errors.longitude.message}</p>}
          </div>
        </div>
      </div>

      {/* Operating Hours */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-navy font-montserrat">Horario de Operación</h3>
        
        <div className="space-y-3">
          {dayNames.map((day) => (
            <div key={day} className="flex items-center gap-4">
              <div className="w-24">
                <span className="text-sm text-navy font-medium">{dayLabels[day]}</span>
              </div>
              
              <Controller
                name={`operating_hours.${day}.closed`}
                control={control}
                render={({ field }) => (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="w-4 h-4 text-gold border-gray-300 rounded focus:ring-gold"
                    />
                    <span className="text-sm text-gray-600">Cerrado</span>
                  </label>
                )}
              />

              {!watch(`operating_hours.${day}.closed`) && (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      {...register(`operating_hours.${day}.open`)}
                      className="px-2 py-1 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                    />
                    <span className="text-sm text-gray-600">a</span>
                    <input
                      type="time"
                      {...register(`operating_hours.${day}.close`)}
                      className="px-2 py-1 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Special Hours */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-navy font-montserrat">Horarios Especiales</h3>
          <button
            type="button"
            onClick={handleAddSpecialHour}
            className="text-sm text-gold hover:text-gold/80 font-semibold"
          >
            + Agregar Fecha Especial
          </button>
        </div>

        {specialHours.length > 0 && (
          <div className="space-y-3">
            {specialHours.map((specialHour, index) => (
              <div key={index} className="p-3 border border-gray-200 rounded-md space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-navy mb-1">Fecha</label>
                    <input
                      type="date"
                      value={specialHour.date}
                      onChange={(e) => handleSpecialHourChange(index, 'date', e.target.value)}
                      className="w-full px-2 py-1 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy mb-1">Motivo</label>
                    <input
                      type="text"
                      value={specialHour.reason}
                      onChange={(e) => handleSpecialHourChange(index, 'reason', e.target.value)}
                      placeholder="Ej: Navidad"
                      className="w-full px-2 py-1 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={specialHour.closed}
                      onChange={(e) => handleSpecialHourChange(index, 'closed', e.target.checked)}
                      className="w-4 h-4 text-gold border-gray-300 rounded focus:ring-gold"
                    />
                    <span className="text-sm text-gray-600">Cerrado todo el día</span>
                  </label>

                  {!specialHour.closed && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={specialHour.open || ''}
                        onChange={(e) => handleSpecialHourChange(index, 'open', e.target.value)}
                        className="px-2 py-1 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                      />
                      <span className="text-sm text-gray-600">a</span>
                      <input
                        type="time"
                        value={specialHour.close || ''}
                        onChange={(e) => handleSpecialHourChange(index, 'close', e.target.value)}
                        className="px-2 py-1 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveSpecialHour(index)}
                    className="ml-auto text-sm text-red-600 hover:text-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-gold text-white text-sm font-semibold rounded-md hover:bg-gold/90 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Guardando...' : isEditMode ? 'Actualizar Clínica' : 'Crear Clínica'}
        </button>
      </div>
    </form>
  )
}
