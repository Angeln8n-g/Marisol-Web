// src/lib/utils.test.ts

import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatTime,
  formatDateTime,
  getAppointmentStatusColor,
  getAppointmentStatusLabel,
  getClinicMarkerColor,
  formatCurrency,
  isValidEmail,
  isValidPhone,
  truncateText,
  cn,
  calculateAge,
  getInitials,
  formatFileSize,
  isValidCoordinates,
  getDateRange,
} from './utils'

describe('Date Formatting Utilities', () => {
  it('should format date correctly', () => {
    const result = formatDate('2024-01-15')
    expect(result).toContain('enero')
    expect(result).toContain('2024')
  })

  it('should return empty string for invalid date', () => {
    expect(formatDate('invalid-date')).toBe('')
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
  })

  it('should format time correctly', () => {
    const result = formatTime('2024-01-15T14:30:00')
    expect(result).toBe('14:30')
  })

  it('should format datetime correctly', () => {
    const result = formatDateTime('2024-01-15T14:30:00')
    expect(result).toContain('enero')
    expect(result).toContain('14:30')
  })
})

describe('Appointment Status Utilities', () => {
  it('should return correct color for appointment status', () => {
    expect(getAppointmentStatusColor('pending')).toContain('yellow')
    expect(getAppointmentStatusColor('confirmed')).toContain('green')
    expect(getAppointmentStatusColor('in_progress')).toContain('blue')
    expect(getAppointmentStatusColor('completed')).toContain('gray')
    expect(getAppointmentStatusColor('cancelled')).toContain('red')
    expect(getAppointmentStatusColor('rescheduled')).toContain('purple')
  })

  it('should return correct label for appointment status', () => {
    expect(getAppointmentStatusLabel('pending')).toBe('Pendiente')
    expect(getAppointmentStatusLabel('confirmed')).toBe('Confirmada')
    expect(getAppointmentStatusLabel('in_progress')).toBe('En Progreso')
    expect(getAppointmentStatusLabel('completed')).toBe('Completada')
    expect(getAppointmentStatusLabel('cancelled')).toBe('Cancelada')
    expect(getAppointmentStatusLabel('rescheduled')).toBe('Reprogramada')
  })
})

describe('Clinic Marker Color', () => {
  it('should return green for low capacity', () => {
    expect(getClinicMarkerColor(30)).toBe('#22c55e')
    expect(getClinicMarkerColor(50)).toBe('#22c55e')
  })

  it('should return yellow for medium capacity', () => {
    expect(getClinicMarkerColor(51)).toBe('#eab308')
    expect(getClinicMarkerColor(80)).toBe('#eab308')
  })

  it('should return red for high capacity', () => {
    expect(getClinicMarkerColor(81)).toBe('#ef4444')
    expect(getClinicMarkerColor(100)).toBe('#ef4444')
  })
})

describe('Currency Formatting', () => {
  it('should format DOP currency correctly', () => {
    expect(formatCurrency(1500)).toBe('RD$ 1,500.00')
    expect(formatCurrency(1500, 'DOP')).toBe('RD$ 1,500.00')
  })

  it('should format USD currency correctly', () => {
    expect(formatCurrency(1500, 'USD')).toBe('US$ 1,500.00')
  })

  it('should format EUR currency correctly', () => {
    expect(formatCurrency(1500, 'EUR')).toBe('€ 1,500.00')
  })
})

describe('Validation Utilities', () => {
  it('should validate email correctly', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true)
    expect(isValidEmail('invalid-email')).toBe(false)
    expect(isValidEmail('missing@domain')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
  })

  it('should validate phone correctly', () => {
    expect(isValidPhone('8095551234')).toBe(true)
    expect(isValidPhone('809-555-1234')).toBe(true)
    expect(isValidPhone('(809) 555-1234')).toBe(true)
    expect(isValidPhone('123')).toBe(false)
  })

  it('should validate coordinates correctly', () => {
    expect(isValidCoordinates(18.4861, -69.9312)).toBe(true) // Santo Domingo
    expect(isValidCoordinates(0, 0)).toBe(true)
    expect(isValidCoordinates(200, 300)).toBe(false)
    expect(isValidCoordinates(NaN, 0)).toBe(false)
  })
})

describe('Text Utilities', () => {
  it('should truncate text correctly', () => {
    expect(truncateText('Short text', 20)).toBe('Short text')
    expect(truncateText('This is a very long text that needs truncation', 10)).toBe('This is a...')
  })

  it('should combine classes correctly', () => {
    expect(cn('base', 'extra')).toBe('base extra')
    expect(cn('base', false && 'hidden')).toBe('base')
    expect(cn('base', { active: true, disabled: false })).toBe('base active')
    expect(cn('base', null, undefined, 'extra')).toBe('base extra')
  })

  it('should generate initials correctly', () => {
    expect(getInitials('María García')).toBe('MG')
    expect(getInitials('Juan')).toBe('J')
    expect(getInitials('Ana María López García')).toBe('AG')
    expect(getInitials('')).toBe('')
  })
})

describe('Age Calculation', () => {
  it('should calculate age correctly', () => {
    const birthDate = '1990-01-15'
    const age = calculateAge(birthDate)
    expect(age).toBeGreaterThan(30)
    expect(age).toBeLessThan(40)
  })

  it('should return null for invalid date', () => {
    expect(calculateAge('invalid-date')).toBe(null)
    expect(calculateAge(null)).toBe(null)
    expect(calculateAge(undefined)).toBe(null)
  })
})

describe('File Size Formatting', () => {
  it('should format file size correctly', () => {
    expect(formatFileSize(0)).toBe('0 Bytes')
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(1048576)).toBe('1 MB')
    expect(formatFileSize(1073741824)).toBe('1 GB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
  })
})

describe('Date Range', () => {
  it('should generate date range correctly', () => {
    const range = getDateRange('2024-01-01', '2024-01-31')
    expect(range.start).toContain('2024-01-01')
    expect(range.end).toContain('2024-01-31')
    
    // Verify start is at beginning of day
    const startDate = new Date(range.start)
    expect(startDate.getUTCHours()).toBe(0)
    expect(startDate.getUTCMinutes()).toBe(0)
    
    // Verify end is at end of day
    const endDate = new Date(range.end)
    expect(endDate.getUTCHours()).toBe(23)
    expect(endDate.getUTCMinutes()).toBe(59)
  })
})
