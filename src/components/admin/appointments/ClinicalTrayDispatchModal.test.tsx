import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ClinicalTrayDispatchModal } from './ClinicalTrayDispatchModal'
import type { Appointment, ProcedureSupply, InventoryItem } from '../../../types'

const mockDispatchTray = vi.fn().mockResolvedValue({ dispatchedCount: 1 })

vi.mock('../../../hooks/useProcedureSupplies', () => ({
  useProcedureSupplies: () => ({
    data: mockSupplies,
    isLoading: false,
  }),
  useProcedureSuppliesMutations: () => ({
    dispatchClinicalTray: mockDispatchTray,
    isDispatchingTray: false,
  }),
}))

vi.mock('../../../hooks/useInventory', () => ({
  useInventoryItems: () => ({
    data: mockInventoryItems,
    isLoading: false,
  }),
}))

const mockAppointment: Appointment = {
  id: 'app-1',
  patient_id: 'pat-1',
  clinic_id: 'clinic-1',
  procedure_id: 'proc-1',
  assigned_doctor: null,
  notes: null,
  scheduled_at: '2026-09-10T10:00:00Z',
  duration_minutes: 60,
  status: 'confirmed',
  patient: {
    id: 'pat-1',
    full_name: 'Ana María Gómez',
    phone: '809-555-8888',
    email: 'ana@example.com',
    birth_date: '1990-01-01',
    gender: 'female',
    medical_alerts: null,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  procedure: {
    id: 'proc-1',
    name: 'Resina Compuesta Posterior',
    category: 'Estética Dental',
    description: null,
    duration_minutes: 60,
    is_active: true,
    created_at: '2026-01-01',
  },
  clinic: {
    id: 'clinic-1',
    name: 'Sede Piantini',
    address: 'Av. Abraham Lincoln',
    latitude: 18.48,
    longitude: -69.93,
    phone: '809-555-0101',
    whatsapp: '809-555-0101',
    operating_hours: {} as any,
    special_hours: [],
    is_active: true,
    is_deleted: false,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
}

const mockInventoryItems: InventoryItem[] = [
  {
    id: 'item-1',
    name: 'Anestesia Mepivacaína 2%',
    item_type: 'consumable_clinical',
    unit: 'caja',
    current_stock: 15,
    minimum_stock: 5,
    cost_price: 650,
    is_active: true,
    status: 'active',
    batches: [
      {
        id: 'batch-1',
        item_id: 'item-1',
        batch_number: 'LOT-2026-X',
        initial_quantity: 20,
        current_quantity: 15,
        expiration_date: '2027-12-31',
        received_date: '2026-01-01',
        status: 'active',
        created_at: '2026-01-01',
      },
    ],
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 'item-2',
    name: 'Lámpara de Fotocurado LED',
    item_type: 'tool',
    unit: 'unidad',
    current_stock: 2,
    minimum_stock: 1,
    cost_price: 18000,
    is_active: true,
    status: 'active',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
]

const mockSupplies: ProcedureSupply[] = [
  {
    id: 'sup-1',
    procedure_id: 'proc-1',
    item_id: 'item-1',
    quantity: 1,
    is_optional: false,
    notes: 'Infiltrativa',
    item: mockInventoryItems[0],
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 'sup-2',
    procedure_id: 'proc-1',
    item_id: 'item-2',
    quantity: 1,
    is_optional: false,
    notes: null,
    item: mockInventoryItems[1],
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
]

describe('ClinicalTrayDispatchModal', () => {
  it('renders null when isOpen is false', () => {
    const { container } = render(
      <ClinicalTrayDispatchModal isOpen={false} onClose={vi.fn()} appointment={mockAppointment} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders appointment details and preloaded materials', () => {
    render(<ClinicalTrayDispatchModal isOpen={true} onClose={vi.fn()} appointment={mockAppointment} />)

    expect(screen.getByText(/Despacho de Bandeja Clínica/i)).toBeInTheDocument()
    expect(screen.getByText(/Ana María Gómez/i)).toBeInTheDocument()
    expect(screen.getByText(/Resina Compuesta Posterior/i)).toBeInTheDocument()
    expect(screen.getByText('Anestesia Mepivacaína 2%')).toBeInTheDocument()
    expect(screen.getByText('Lámpara de Fotocurado LED')).toBeInTheDocument()
    expect(screen.getByText(/15 caja/i)).toBeInTheDocument()
  })

  it('confirms and dispatches the clinical tray', async () => {
    render(<ClinicalTrayDispatchModal isOpen={true} onClose={vi.fn()} appointment={mockAppointment} />)

    const dispatchBtn = screen.getByRole('button', { name: /Confirmar y Despachar Bandeja/i })
    fireEvent.click(dispatchBtn)

    await waitFor(() => {
      expect(mockDispatchTray).toHaveBeenCalledWith(
        expect.objectContaining({
          procedureId: 'proc-1',
          clinicId: 'clinic-1',
          patientId: 'pat-1',
          items: expect.arrayContaining([
            expect.objectContaining({
              itemId: 'item-1',
              quantity: 1,
            }),
          ]),
        })
      )
    })
  })
})
