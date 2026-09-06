import { describe, it, expect } from 'vitest'
import {
  formatDominicanPhoneForWhatsApp,
  renderWhatsAppTemplate,
  createWhatsAppUrl,
  type WhatsAppTemplateContext,
} from './useWhatsAppAutomation'

describe('WhatsApp Automation Engine (useWhatsAppAutomation)', () => {
  describe('formatDominicanPhoneForWhatsApp', () => {
    it('formats 10-digit Dominican number by prepending country code 1', () => {
      expect(formatDominicanPhoneForWhatsApp('8095551234')).toBe('18095551234')
      expect(formatDominicanPhoneForWhatsApp('829-333-4444')).toBe('18293334444')
      expect(formatDominicanPhoneForWhatsApp('(849) 777-8888')).toBe('18497778888')
    })

    it('handles numbers that already have the 1 country code or + sign', () => {
      expect(formatDominicanPhoneForWhatsApp('+1-809-555-1234')).toBe('18095551234')
      expect(formatDominicanPhoneForWhatsApp('18095551234')).toBe('18095551234')
    })

    it('handles empty or malformed strings gracefully', () => {
      expect(formatDominicanPhoneForWhatsApp('')).toBe('')
      expect(formatDominicanPhoneForWhatsApp('   ')).toBe('')
    })
  })

  describe('renderWhatsAppTemplate', () => {
    const mockContext: WhatsAppTemplateContext = {
      patientName: 'Carmen Morales',
      procedureName: 'Limpieza y Profilaxis Ultrasónica',
      doctorName: 'Dr. Alejandro Peña',
      formattedDate: 'Lunes 14 de Septiembre 2026',
      formattedTime: '10:30 AM',
      clinicName: 'Clínica Dental Dra. Marisol - Sede Piantini',
      clinicAddress: 'Av. Abraham Lincoln #456',
      quoteAmount: '12,500.00',
    }

    it('correctly substitutes all dental tokens in the message template', () => {
      const template =
        'Hola {paciente}, cita para {procedimiento} el {fecha} a las {hora} con {doctor} en {clinica} ({direccion_clinica}). Total: RD$ {monto}.'

      const rendered = renderWhatsAppTemplate(template, mockContext)

      expect(rendered).toContain('Hola Carmen Morales')
      expect(rendered).toContain('Limpieza y Profilaxis Ultrasónica')
      expect(rendered).toContain('Lunes 14 de Septiembre 2026')
      expect(rendered).toContain('10:30 AM')
      expect(rendered).toContain('Dr. Alejandro Peña')
      expect(rendered).toContain('Clínica Dental Dra. Marisol - Sede Piantini')
      expect(rendered).toContain('Av. Abraham Lincoln #456')
      expect(rendered).toContain('RD$ 12,500.00')
      expect(rendered).not.toContain('{paciente}')
    })

    it('uses sensible fallbacks when optional context parameters are missing', () => {
      const partialContext: WhatsAppTemplateContext = {
        patientName: 'Pedro Gómez',
        procedureName: 'Exodoncia',
      }

      const template = 'Hola {paciente}, tu doctor es {doctor} en {clinica}.'
      const rendered = renderWhatsAppTemplate(template, partialContext)

      expect(rendered).toContain('Hola Pedro Gómez')
      expect(rendered).toContain('Dra. Marisol')
      expect(rendered).toContain('Dra. Marisol - Odontología Especializada')
    })
  })

  describe('createWhatsAppUrl', () => {
    it('creates a standard https://wa.me/ URL with URI-encoded text', () => {
      const phone = '809-555-1234'
      const message = '¡Hola Carmen! Tu cita es mañana 📅'

      const url = createWhatsAppUrl(phone, message)

      expect(url.startsWith('https://wa.me/18095551234?text=')).toBe(true)
      expect(url).toContain(encodeURIComponent('¡Hola Carmen! Tu cita es mañana 📅'))
    })
  })
})
