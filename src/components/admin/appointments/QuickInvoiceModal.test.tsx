import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QuickInvoiceModal } from './QuickInvoiceModal'
import type { Appointment } from '../../../types'

const mockCreateInvoice = vi.fn()
const mockRegisterPaymentReceived = vi.fn()
const mockOpenReceiptPrintWindow = vi.fn()

let mockInvoiceQueryResult: { data: any; error: any } = { data: null, error: null }

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve(mockInvoiceQueryResult)),
        })),
      })),
    })),
  },
}))

vi.mock('../../../hooks/useAccounting', () => ({
  useAccountingMutations: () => ({
    createInvoice: mockCreateInvoice,
    registerPaymentReceived: mockRegisterPaymentReceived,
  }),
}))

const mockPricingList = [
  {
    id: 'price-1',
    procedure_id: 'proc-1',
    price: 2500,
    currency: 'DOP',
    procedure: { id: 'proc-1', name: 'Limpieza Dental Profunda' },
  },
]

const mockBudgetsList: any[] = []

vi.mock('../../../hooks/usePricing', () => ({
  usePricing: () => ({
    currentPrices: mockPricingList,
  }),
}))

vi.mock('../../../hooks/useBudgets', () => ({
  useBudgets: () => ({
    data: mockBudgetsList,
    isLoading: false,
  }),
}))

vi.mock('../../../lib/receiptPrintUtils', () => ({
  openReceiptPrintWindow: (...args: any[]) => mockOpenReceiptPrintWindow(...args),
}))

const baseAppointment: Appointment = {
  id: 'apt-100',
  patient_id: 'pat-1',
  clinic_id: 'clinic-1',
  procedure_id: 'proc-1',
  assigned_doctor: 'Dra. Marisol',
  notes: 'Consulta rutinaria',
  scheduled_at: '2026-09-10T10:00:00Z',
  duration_minutes: 60,
  status: 'completed',
  billing_status: 'unbilled',
  invoice_id: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  patient: {
    id: 'pat-1',
    full_name: 'Carlos Santana',
    phone: '809-555-1234',
    email: 'carlos@example.com',
    birth_date: '1985-05-15',
    gender: 'male',
    medical_alerts: null,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  procedure: {
    id: 'proc-1',
    name: 'Limpieza Dental Profunda',
    category: 'Profilaxis',
    description: null,
    duration_minutes: 60,
    is_active: true,
    created_at: '2026-01-01',
  },
  clinic: {
    id: 'clinic-1',
    name: 'Clínica Dra. Marisol Piantini',
    address: 'Calle Federico Geraldino 84',
    latitude: 18.48,
    longitude: -69.93,
    phone: '809-555-0199',
    whatsapp: '809-555-0199',
    operating_hours: {} as any,
    special_hours: [],
    is_active: true,
    is_deleted: false,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
}

describe('QuickInvoiceModal - Single Invoice per Appointment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInvoiceQueryResult = { data: null, error: null }
  })

  it('renders creation form when appointment is unbilled and passes appointment_id on submit', async () => {
    mockCreateInvoice.mockResolvedValueOnce({
      id: 'inv-created-1',
      invoice_number: 'FAC-2026-0001',
      total: 2500,
    })
    mockRegisterPaymentReceived.mockResolvedValueOnce({ id: 'pay-1' })

    render(
      <QuickInvoiceModal
        isOpen={true}
        onClose={vi.fn()}
        appointment={baseAppointment}
        onInvoiceCreated={vi.fn()}
      />
    )

    // Verify appointment & patient data are displayed
    await waitFor(() => {
      expect(screen.getByText('Carlos Santana')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Limpieza Dental Profunda')).toBeInTheDocument()
    })

    // Submit the invoice
    const submitBtn = screen.getByRole('button', { name: /Generar Factura y Cobro/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockCreateInvoice).toHaveBeenCalledTimes(1)
      expect(mockCreateInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          appointment_id: 'apt-100',
          patient_id: 'pat-1',
          clinic_id: 'clinic-1',
        })
      )
    })

    // Success screen should be visible
    await waitFor(() => {
      expect(screen.getByText('¡Factura Generada Exitosamente!')).toBeInTheDocument()
      expect(screen.getByText('FAC-2026-0001')).toBeInTheDocument()
    })
  })

  it('detects already billed appointment and shows read-only banner preventing duplicate invoice', async () => {
    // Return existing invoice from Supabase
    mockInvoiceQueryResult = {
      data: {
        id: 'inv-existing-99',
        invoice_number: 'FAC-2026-0099',
        appointment_id: 'apt-100',
        patient_id: 'pat-1',
        clinic_id: 'clinic-1',
        subtotal: 2500,
        discount: 0,
        tax: 0,
        total: 2500,
        status: 'paid',
        created_at: '2026-09-10T11:00:00Z',
        items: [
          {
            id: 'item-1',
            description: 'Limpieza Dental Profunda',
            quantity: 1,
            unit_price: 2500,
          },
        ],
      },
      error: null,
    }

    const billedAppointment: Appointment = {
      ...baseAppointment,
      billing_status: 'billed',
      invoice_id: 'inv-existing-99',
    }

    render(
      <QuickInvoiceModal
        isOpen={true}
        onClose={vi.fn()}
        appointment={billedAppointment}
        onInvoiceCreated={vi.fn()}
      />
    )

    // Verify that the duplicate warning / notice is displayed
    await waitFor(() => {
      expect(screen.getByText('Cita Ya Facturada')).toBeInTheDocument()
      expect(screen.getByText('FAC-2026-0099')).toBeInTheDocument()
      expect(screen.getByText(/no se permite crear una segunda factura/i)).toBeInTheDocument()
    })

    // The submit button to create invoice should NOT be present
    expect(screen.queryByRole('button', { name: /Generar Factura/i })).not.toBeInTheDocument()

    // The button to view/print receipt should be present
    const printBtn = screen.getByRole('button', { name: /Ver \/ Imprimir Recibo Oficial/i })
    expect(printBtn).toBeInTheDocument()

    // Clicking print receipt calls openReceiptPrintWindow
    fireEvent.click(printBtn)
    expect(mockOpenReceiptPrintWindow).toHaveBeenCalledTimes(1)
    expect(mockOpenReceiptPrintWindow).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceNumber: 'FAC-2026-0099',
        total: 2500,
        isPaid: true,
      })
    )

    // Ensure createInvoice was never called
    expect(mockCreateInvoice).not.toHaveBeenCalled()
  })
})
