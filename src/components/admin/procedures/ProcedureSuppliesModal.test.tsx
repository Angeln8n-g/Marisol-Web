import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProcedureSuppliesModal } from './ProcedureSuppliesModal'
import type { Procedure, InventoryItem, ProcedureSupply } from '../../../types'

// Mocks
const mockAddSupply = vi.fn().mockResolvedValue(undefined)
const mockRemoveSupply = vi.fn().mockResolvedValue(undefined)
const mockUpdateSupply = vi.fn().mockResolvedValue(undefined)

vi.mock('../../../hooks/useProcedureSupplies', () => ({
  useProcedureSupplies: () => ({
    data: mockSupplies,
    isLoading: false,
  }),
  useProcedureSuppliesMutations: () => ({
    addSupply: mockAddSupply,
    isAddingSupply: false,
    updateSupply: mockUpdateSupply,
    isUpdatingSupply: false,
    removeSupply: mockRemoveSupply,
    isRemovingSupply: false,
  }),
}))

vi.mock('../../../hooks/useInventory', () => ({
  useInventoryItems: () => ({
    data: mockInventoryItems,
    isLoading: false,
  }),
}))

const mockProcedure: Procedure = {
  id: 'proc-1',
  name: 'Resina Compuesta Posterior',
  category: 'Estética Dental',
  description: 'Restauración estética con resina nanohíbrida',
  duration_minutes: 60,
  clinical_duration_minutes: 45,
  setup_buffer_minutes: 10,
  cleanup_buffer_minutes: 15,
  is_active: true,
  created_at: '2026-01-01',
  current_price: {
    id: 'price-1',
    procedure_id: 'proc-1',
    price: 3500,
    currency: 'DOP',
    effective_from: '2026-01-01',
    effective_to: null,
    changed_by: 'admin',
    change_reason: null,
  },
}

const mockInventoryItems: InventoryItem[] = [
  {
    id: 'item-1',
    name: 'Anestesia Mepivacaína 2%',
    item_type: 'consumable_clinical',
    unit: 'caja',
    current_stock: 20,
    minimum_stock: 5,
    cost_price: 650,
    is_active: true,
    status: 'active',
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
  {
    id: 'item-3',
    name: 'Resina Filtek Z250 A2',
    item_type: 'consumable_clinical',
    unit: 'jeringa',
    current_stock: 12,
    minimum_stock: 3,
    cost_price: 1200,
    is_active: true,
    status: 'active',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 'item-4',
    name: 'Baberos Dentales Desechables',
    item_type: 'consumable_clinical',
    unit: 'paquete',
    units_per_package: 500,
    dispense_unit: 'babero',
    current_stock: 5,
    minimum_stock: 1,
    cost_price: 1100,
    is_active: true,
    status: 'active',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
]

const mockSupplies: ProcedureSupply[] = [
  {
    id: 'supply-1',
    procedure_id: 'proc-1',
    item_id: 'item-1',
    quantity: 1,
    dispense_unit: 'caja',
    is_optional: false,
    notes: '1 carpule por cuadrante',
    item: mockInventoryItems[0],
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 'supply-2',
    procedure_id: 'proc-1',
    item_id: 'item-2',
    quantity: 1,
    is_optional: false,
    notes: 'Verificar batería y cono de luz',
    item: mockInventoryItems[1],
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
]

describe('ProcedureSuppliesModal', () => {
  it('renders null when isOpen is false', () => {
    const { container } = render(
      <ProcedureSuppliesModal isOpen={false} onClose={vi.fn()} procedure={mockProcedure} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders procedure info, supplies list and estimated costs', () => {
    render(<ProcedureSuppliesModal isOpen={true} onClose={vi.fn()} procedure={mockProcedure} />)

    expect(screen.getByText(/Bandeja Clínica & Insumos/i)).toBeInTheDocument()
    expect(screen.getByText(/Resina Compuesta Posterior/i)).toBeInTheDocument()
    expect(screen.getByText('Anestesia Mepivacaína 2%')).toBeInTheDocument()
    expect(screen.getByText('Lámpara de Fotocurado LED')).toBeInTheDocument()
    expect(screen.getAllByText(/RD\$ 650.00/i).length).toBeGreaterThanOrEqual(1)
  })

  it('submits a new supply to the procedure tray', async () => {
    render(<ProcedureSuppliesModal isOpen={true} onClose={vi.fn()} procedure={mockProcedure} />)

    const selectItem = screen.getByRole('combobox')
    fireEvent.change(selectItem, { target: { value: 'item-3' } })

    const addBtn = screen.getByRole('button', { name: /\+ Agregar a Bandeja/i })
    fireEvent.click(addBtn)

    await waitFor(() => {
      expect(mockAddSupply).toHaveBeenCalledWith(
        expect.objectContaining({
          procedure_id: 'proc-1',
          item_id: 'item-3',
          quantity: 1,
        })
      )
    })
  })

  it('shows individual unit cost option for items with packaging conversion', async () => {
    render(<ProcedureSuppliesModal isOpen={true} onClose={vi.fn()} procedure={mockProcedure} />)

    const selectItem = screen.getByRole('combobox')
    fireEvent.change(selectItem, { target: { value: 'item-4' } })

    // Debe mostrar la opción de unidad individual (RD$ 2.20 c/u)
    expect(screen.getByText(/Unidad Individual \(babero\)/i)).toBeInTheDocument()
    expect(screen.getByText(/RD\$ 2.20 c\/u/i)).toBeInTheDocument()

    const addBtn = screen.getByRole('button', { name: /\+ Agregar a Bandeja/i })
    fireEvent.click(addBtn)

    await waitFor(() => {
      expect(mockAddSupply).toHaveBeenCalledWith(
        expect.objectContaining({
          procedure_id: 'proc-1',
          item_id: 'item-4',
          quantity: 1,
          dispense_unit: 'babero',
        })
      )
    })
  })

  it('calls removeSupply when removing an item', async () => {
    render(<ProcedureSuppliesModal isOpen={true} onClose={vi.fn()} procedure={mockProcedure} />)

    const removeBtns = screen.getAllByTitle(/Eliminar de la bandeja/i)
    fireEvent.click(removeBtns[0])

    await waitFor(() => {
      expect(mockRemoveSupply).toHaveBeenCalledWith({
        id: 'supply-1',
        procedureId: 'proc-1',
      })
    })
  })
})
