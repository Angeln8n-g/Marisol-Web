// src/lib/utils.ts

import { format, parseISO, isValid } from 'date-fns'
import { es } from 'date-fns/locale/es'
import type { AppointmentStatus } from '../types'

/**
 * Formatea una fecha ISO a un formato legible en español.
 * 
 * @param dateString - Fecha en formato ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss)
 * @param formatString - Formato de salida (por defecto: 'PPP' = "1 de enero de 2024")
 * @returns Fecha formateada o cadena vacía si la fecha es inválida
 * 
 * @example
 * formatDate('2024-01-15') // "15 de enero de 2024"
 * formatDate('2024-01-15T14:30:00', 'PPPp') // "15 de enero de 2024 a las 14:30"
 */
export function formatDate(dateString: string | null | undefined, formatString: string = 'PPP'): string {
  if (!dateString) return ''
  
  try {
    const date = parseISO(dateString)
    if (!isValid(date)) return ''
    return format(date, formatString, { locale: es })
  } catch {
    return ''
  }
}

/**
 * Formatea una fecha y hora ISO a formato de hora legible.
 * 
 * @param dateString - Fecha/hora en formato ISO
 * @returns Hora formateada (HH:mm) o cadena vacía si es inválida
 * 
 * @example
 * formatTime('2024-01-15T14:30:00') // "14:30"
 */
export function formatTime(dateString: string | null | undefined): string {
  if (!dateString) return ''
  
  try {
    const date = parseISO(dateString)
    if (!isValid(date)) return ''
    return format(date, 'HH:mm')
  } catch {
    return ''
  }
}

/**
 * Formatea una fecha y hora ISO a formato completo legible en español.
 * 
 * @param dateString - Fecha/hora en formato ISO
 * @returns Fecha y hora formateadas o cadena vacía si es inválida
 * 
 * @example
 * formatDateTime('2024-01-15T14:30:00') // "15 de enero de 2024 a las 14:30"
 */
export function formatDateTime(dateString: string | null | undefined): string {
  return formatDate(dateString, 'PPPp')
}

/**
 * Retorna el color de badge apropiado según el estado de la cita.
 * 
 * @param status - Estado de la cita
 * @returns Clase de color de Tailwind CSS
 * 
 * @example
 * getAppointmentStatusColor('confirmed') // "bg-green-100 text-green-800"
 */
export function getAppointmentStatusColor(status: AppointmentStatus): string {
  const colorMap: Record<AppointmentStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    confirmed: 'bg-green-100 text-green-800 border-green-300',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
    completed: 'bg-gray-100 text-gray-800 border-gray-300',
    cancelled: 'bg-red-100 text-red-800 border-red-300',
    rescheduled: 'bg-purple-100 text-purple-800 border-purple-300',
  }
  
  return colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-300'
}

/**
 * Retorna el texto legible en español para el estado de la cita.
 * 
 * @param status - Estado de la cita
 * @returns Texto del estado en español
 * 
 * @example
 * getAppointmentStatusLabel('confirmed') // "Confirmada"
 */
export function getAppointmentStatusLabel(status: AppointmentStatus): string {
  const labelMap: Record<AppointmentStatus, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    in_progress: 'En Progreso',
    completed: 'Completada',
    cancelled: 'Cancelada',
    rescheduled: 'Reprogramada',
  }
  
  return labelMap[status] || status
}

/**
 * Retorna el color del marcador del mapa según el porcentaje de capacidad.
 * 
 * @param capacityPercentage - Porcentaje de capacidad (0-100)
 * @returns Color hexadecimal para el marcador
 * 
 * @example
 * getClinicMarkerColor(30) // "#22c55e" (verde)
 * getClinicMarkerColor(65) // "#eab308" (amarillo)
 * getClinicMarkerColor(90) // "#ef4444" (rojo)
 */
export function getClinicMarkerColor(capacityPercentage: number): string {
  if (capacityPercentage <= 50) return '#22c55e' // green-500
  if (capacityPercentage <= 80) return '#eab308' // yellow-500
  return '#ef4444' // red-500
}

/**
 * Formatea un número como moneda.
 * 
 * @param amount - Cantidad a formatear
 * @param currency - Código de moneda (por defecto: 'DOP')
 * @returns Cantidad formateada con símbolo de moneda
 * 
 * @example
 * formatCurrency(1500) // "RD$ 1,500.00"
 * formatCurrency(1500, 'USD') // "US$ 1,500.00"
 */
export function formatCurrency(amount: number, currency: string = 'DOP'): string {
  const currencySymbols: Record<string, string> = {
    DOP: 'RD$',
    USD: 'US$',
    EUR: '€',
  }
  
  const symbol = currencySymbols[currency] || currency
  const formatted = new Intl.NumberFormat('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  
  return `${symbol} ${formatted}`
}

/**
 * Valida si una cadena es un email válido.
 * 
 * @param email - Cadena a validar
 * @returns true si es un email válido
 * 
 * @example
 * isValidEmail('test@example.com') // true
 * isValidEmail('invalid-email') // false
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valida si una cadena es un teléfono válido (formato dominicano).
 * 
 * @param phone - Cadena a validar
 * @returns true si es un teléfono válido
 * 
 * @example
 * isValidPhone('809-555-1234') // true
 * isValidPhone('8095551234') // true
 * isValidPhone('123') // false
 */
export function isValidPhone(phone: string): boolean {
  // Acepta formatos: 809-555-1234, 8095551234, (809) 555-1234
  const phoneRegex = /^(\+?1)?[\s.-]?\(?([2-9]\d{2})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

/**
 * Trunca un texto a una longitud máxima y añade puntos suspensivos.
 * 
 * @param text - Texto a truncar
 * @param maxLength - Longitud máxima (por defecto: 50)
 * @returns Texto truncado con "..." si excede la longitud
 * 
 * @example
 * truncateText('Este es un texto muy largo', 10) // "Este es un..."
 */
export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

/**
 * Combina clases de CSS de forma condicional (similar a clsx/classnames).
 * 
 * @param classes - Clases a combinar (strings, objetos condicionales, arrays)
 * @returns String con las clases combinadas
 * 
 * @example
 * cn('base-class', { 'active': true, 'disabled': false }) // "base-class active"
 * cn('btn', isActive && 'btn-active') // "btn btn-active" (si isActive es true)
 */
export function cn(...classes: (string | boolean | undefined | null | Record<string, boolean>)[]): string {
  return classes
    .filter(Boolean)
    .map(cls => {
      if (typeof cls === 'string') return cls
      if (typeof cls === 'object' && cls !== null) {
        return Object.entries(cls)
          .filter(([, value]) => value)
          .map(([key]) => key)
          .join(' ')
      }
      return ''
    })
    .join(' ')
    .trim()
}

/**
 * Calcula la edad a partir de una fecha de nacimiento.
 * 
 * @param birthDate - Fecha de nacimiento en formato ISO
 * @returns Edad en años o null si la fecha es inválida
 * 
 * @example
 * calculateAge('1990-05-15') // 34 (en 2024)
 */
export function calculateAge(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null
  
  try {
    const birth = parseISO(birthDate)
    if (!isValid(birth)) return null
    
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  } catch {
    return null
  }
}

/**
 * Genera iniciales a partir de un nombre completo.
 * 
 * @param fullName - Nombre completo
 * @returns Iniciales (máximo 2 caracteres)
 * 
 * @example
 * getInitials('María García') // "MG"
 * getInitials('Juan') // "J"
 */
export function getInitials(fullName: string): string {
  if (!fullName) return ''
  
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

/**
 * Convierte bytes a formato legible (KB, MB, GB).
 * 
 * @param bytes - Cantidad de bytes
 * @returns String formateado con unidad
 * 
 * @example
 * formatFileSize(1024) // "1.00 KB"
 * formatFileSize(1048576) // "1.00 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Valida si las coordenadas de latitud y longitud son válidas.
 * 
 * @param latitude - Latitud
 * @param longitude - Longitud
 * @returns true si las coordenadas son válidas
 * 
 * @example
 * isValidCoordinates(18.4861, -69.9312) // true (Santo Domingo)
 * isValidCoordinates(200, 300) // false
 */
export function isValidCoordinates(latitude: number, longitude: number): boolean {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !isNaN(latitude) &&
    !isNaN(longitude)
  )
}

/**
 * Genera un rango de fechas para filtros.
 * 
 * @param startDate - Fecha de inicio en formato ISO
 * @param endDate - Fecha de fin en formato ISO
 * @returns Objeto con fechas de inicio y fin en formato ISO
 * 
 * @example
 * getDateRange('2024-01-01', '2024-01-31')
 * // { start: '2024-01-01T00:00:00.000Z', end: '2024-01-31T23:59:59.999Z' }
 */
export function getDateRange(startDate: string, endDate: string): { start: string; end: string } {
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  
  start.setUTCHours(0, 0, 0, 0)
  end.setUTCHours(23, 59, 59, 999)
  
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

/**
 * Debounce function para limitar la frecuencia de ejecución de una función.
 * 
 * @param func - Función a ejecutar
 * @param wait - Tiempo de espera en milisegundos
 * @returns Función debounced
 * 
 * @example
 * const debouncedSearch = debounce((query) => search(query), 300)
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Verifica si un horario está disponible comparando con las citas existentes.
 * 
 * @param appointments - Lista de citas existentes en la misma fecha/clínica
 * @param scheduledAt - Fecha y hora propuesta para la nueva cita
 * @param durationMinutes - Duración en minutos de la cita propuesta
 * @returns true si el horario está disponible, false si hay solapamiento
 * 
 * @example
 * checkSlotAvailability(existingAppointments, '2024-01-15T10:00:00', 30)
 * // true si no hay solapamiento, false si ya hay una cita en ese horario
 */
export function checkSlotAvailability(
  appointments: { scheduled_at: string; duration_minutes: number }[],
  scheduledAt: string,
  durationMinutes: number
): boolean {
  const proposedStart = new Date(scheduledAt)
  const proposedEnd = new Date(proposedStart.getTime() + durationMinutes * 60000)

  return !appointments.some((apt) => {
    const existingStart = new Date(apt.scheduled_at)
    const existingEnd = new Date(existingStart.getTime() + apt.duration_minutes * 60000)
    return proposedStart < existingEnd && proposedEnd > existingStart
  })
}
