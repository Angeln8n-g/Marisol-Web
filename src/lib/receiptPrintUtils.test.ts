import { describe, it, expect } from 'vitest'
import {
  generateReceiptPrintHtml,
  paymentMethodLabels,
  type PrintReceiptOptions,
} from './receiptPrintUtils'

describe('Receipt Print Engine (receiptPrintUtils)', () => {
  const mockReceiptOptions: PrintReceiptOptions = {
    invoiceNumber: 'FAC-2026-1982',
    issueDate: '2026-09-08T10:00:00Z',
    patientName: 'Annie Maratan',
    patientPhone: '849-354-2160',
    patientIdDoc: '402-1234567-8',
    clinicName: 'Clínica Centro - Santo Domingo',
    clinicAddress: 'Calle Federico Geraldino 84, Piantini, Santo Domingo',
    clinicPhone: '(809) 555-0199',
    clinicRnc: '1-31-98765-4',
    doctorName: 'Dra. Marisol',
    procedureName: 'Implantes Dentales',
    appointmentDate: '8 de septiembre de 2026 a las 05:00 PM',
    items: [
      {
        description: 'Implantes Dentales - Fase Quirúrgica',
        quantity: 1,
        unit_price: 18000,
        total: 18000,
      },
    ],
    subtotal: 18000,
    discount: 0,
    tax: 0,
    total: 18000,
    paymentMethod: 'cash',
    referenceNumber: 'REC-001',
    isPaid: true,
    notes: 'Atención odontológica cita 8 de septiembre',
  }

  it('generates a complete HTML receipt with correct clinic, patient, and invoice details', () => {
    const html = generateReceiptPrintHtml(mockReceiptOptions)

    expect(html).toContain('FAC-2026-1982')
    expect(html).toContain('Annie Maratan')
    expect(html).toContain('849-354-2160')
    expect(html).toContain('402-1234567-8')
    expect(html).toContain('Clínica Centro - Santo Domingo')
    expect(html).toContain('Calle Federico Geraldino 84')
    expect(html).toContain('Implantes Dentales - Fase Quirúrgica')
    expect(html).toContain('18,000.00')
    expect(html).toContain('Efectivo')
    expect(html).toContain('✓ COBRADO EN CAJA')
  })

  it('translates payment methods correctly into user-facing Spanish', () => {
    expect(paymentMethodLabels.cash).toBe('Efectivo')
    expect(paymentMethodLabels.credit_card).toBe('Tarjeta de Crédito')
    expect(paymentMethodLabels.bank_transfer).toBe('Transferencia Bancaria')
    expect(paymentMethodLabels.insurance).toBe('Seguro Médico Dental')
  })

  it('includes discount and tax breakdown when applicable', () => {
    const htmlWithTaxes = generateReceiptPrintHtml({
      ...mockReceiptOptions,
      subtotal: 20000,
      discount: 2000,
      tax: 500,
      total: 18500,
    })

    expect(htmlWithTaxes).toContain('Descuento aplicado')
    expect(htmlWithTaxes).toContain('ITBIS / Impuestos')
    expect(htmlWithTaxes).toContain('18,500.00')
  })

  it('does NOT contain external page elements like calendars, headers, or navbars', () => {
    const html = generateReceiptPrintHtml(mockReceiptOptions)

    expect(html).not.toContain('Gestión de Citas')
    expect(html).not.toContain('calendar')
    expect(html).not.toContain('sidebar')
  })
})
