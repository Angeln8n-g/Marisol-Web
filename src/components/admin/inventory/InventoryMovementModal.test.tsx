import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InventoryMovementModal } from './InventoryMovementModal'
import type { InventoryItem, Clinic } from '../../../types'

describe('InventoryMovementModal', () => {
  const mockItem: InventoryItem = {
    id: 'item-1',
    name: 'Anestesia Lidocaína 2%',
    code: 'ANES-01',
    item_type: 'consumable_clinical',
    unit: 'carpule',
    current_stock: 50,
    minimum_stock: 10,
    cost_price: 120,
    is_active: true,
    status: 'active',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  }

  const mockClinics = [
    {
      id: 'clinic-1',
      name: 'Sede Piantini',
      address: 'Av. Abraham Lincoln',
      phone: '809-555-0101',
      is_active: true,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'clinic-2',
      name: 'Sede Bella Vista',
      address: 'Av. Sarasota',
      phone: '809-555-0102',
      is_active: true,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
  ] as unknown as Clinic[]

  it('renders modal with item information and stock preview', () => {
    render(
      <InventoryMovementModal
        isOpen={true}
        onClose={vi.fn()}
        items={[mockItem]}
        preselectedItem={mockItem}
        clinics={mockClinics}
        defaultClinicId="clinic-1"
        onRegister={vi.fn()}
        isRegistering={false}
      />
    )

    expect(screen.getByText(/Registrar Movimiento de Inventario/i)).toBeInTheDocument()
    expect(screen.getByText('Anestesia Lidocaína 2%')).toBeInTheDocument()
    expect(screen.getByText(/50 carpule/i)).toBeInTheDocument()
  })

  it('calculates projected stock when quantity is entered', () => {
    render(
      <InventoryMovementModal
        isOpen={true}
        onClose={vi.fn()}
        items={[mockItem]}
        preselectedItem={mockItem}
        clinics={mockClinics}
        defaultClinicId="clinic-1"
        onRegister={vi.fn()}
        isRegistering={false}
      />
    )

    // Default operation is exit_clinical (Salida Clínica)
    const quantityInput = screen.getByRole('spinbutton')
    fireEvent.change(quantityInput, { target: { value: '5' } })

    // 50 - 5 = 45 carpule
    expect(screen.getByText('45 carpule')).toBeInTheDocument()
  })

  it('prevents submitting when quantity exceeds stock for clinical exit', () => {
    const onRegister = vi.fn()
    render(
      <InventoryMovementModal
        isOpen={true}
        onClose={vi.fn()}
        items={[mockItem]}
        preselectedItem={mockItem}
        clinics={mockClinics}
        defaultClinicId="clinic-1"
        onRegister={onRegister}
        isRegistering={false}
      />
    )

    const quantityInput = screen.getByRole('spinbutton')
    // Attempt to withdraw 60 when available is 50
    fireEvent.change(quantityInput, { target: { value: '60' } })

    const submitBtn = screen.getByRole('button', { name: /Confirmar Movimiento/i })
    expect(submitBtn).toBeDisabled()
    expect(onRegister).not.toHaveBeenCalled()
  })

  it('calls onRegister with correct params on valid submit', async () => {
    const onRegister = vi.fn().mockResolvedValue(undefined)
    render(
      <InventoryMovementModal
        isOpen={true}
        onClose={vi.fn()}
        items={[mockItem]}
        preselectedItem={mockItem}
        clinics={mockClinics}
        defaultClinicId="clinic-1"
        onRegister={onRegister}
        isRegistering={false}
      />
    )

    const quantityInput = screen.getByRole('spinbutton')
    fireEvent.change(quantityInput, { target: { value: '3' } })

    const reasonInput = screen.getByPlaceholderText(/ej\. Procedimiento de resina/i)
    fireEvent.change(reasonInput, { target: { value: 'Extracción muela del juicio' } })

    const submitBtn = screen.getByRole('button', { name: /Confirmar Movimiento/i })
    fireEvent.click(submitBtn)

    expect(onRegister).toHaveBeenCalledWith({
      item_id: 'item-1',
      movement_type: 'exit_clinical',
      quantity: 3,
      clinic_id: 'clinic-1',
      destination_clinic_id: undefined,
      batch_id: undefined,
      reason: 'Extracción muela del juicio',
    })
  })

  it('handles re-rendering with isOpen changing from false to true without hook order errors', () => {
    const { rerender } = render(
      <InventoryMovementModal
        isOpen={false}
        onClose={vi.fn()}
        items={[mockItem]}
        preselectedItem={mockItem}
        clinics={mockClinics}
        defaultClinicId="clinic-1"
        onRegister={vi.fn()}
        isRegistering={false}
      />
    )

    expect(screen.queryByText(/Registrar Movimiento de Inventario/i)).not.toBeInTheDocument()

    // Rerender with isOpen = true
    rerender(
      <InventoryMovementModal
        isOpen={true}
        onClose={vi.fn()}
        items={[mockItem]}
        preselectedItem={mockItem}
        clinics={mockClinics}
        defaultClinicId="clinic-1"
        onRegister={vi.fn()}
        isRegistering={false}
      />
    )

    expect(screen.getByText(/Registrar Movimiento de Inventario/i)).toBeInTheDocument()
  })
})
