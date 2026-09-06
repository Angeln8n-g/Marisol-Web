import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { InventoryBatchesModal } from './InventoryBatchesModal'
import type { InventoryItem } from '../../../types'

describe('InventoryBatchesModal', () => {
  const mockItem: InventoryItem = {
    id: 'item-1',
    name: 'Anestesia Mepivacaína 2%',
    item_type: 'consumable_clinical',
    unit: 'caja',
    current_stock: 25,
    minimum_stock: 5,
    cost_price: 650,
    is_active: true,
    status: 'active',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    batches: [
      {
        id: 'batch-1',
        item_id: 'item-1',
        batch_number: 'LOT-2026-A',
        initial_quantity: 20,
        current_quantity: 15,
        expiration_date: '2027-12-31',
        received_date: '2026-01-01',
        status: 'active',
        created_at: '2026-01-01',
      },
      {
        id: 'batch-2',
        item_id: 'item-1',
        batch_number: 'LOT-2025-EXPIRED',
        initial_quantity: 10,
        current_quantity: 10,
        expiration_date: '2025-01-01',
        received_date: '2025-01-01',
        status: 'active',
        created_at: '2025-01-01',
      },
    ],
  }

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <InventoryBatchesModal
        isOpen={false}
        onClose={vi.fn()}
        item={mockItem}
        onAddBatch={vi.fn()}
        isAddingBatch={false}
        onDepleteBatch={vi.fn()}
        isUpdatingBatch={false}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders registered batches and item details', () => {
    render(
      <InventoryBatchesModal
        isOpen={true}
        onClose={vi.fn()}
        item={mockItem}
        onAddBatch={vi.fn()}
        isAddingBatch={false}
        onDepleteBatch={vi.fn()}
        isUpdatingBatch={false}
      />
    )

    expect(screen.getByText(/Control de Lotes y Caducidades/i)).toBeInTheDocument()
    expect(screen.getByText(/Anestesia Mepivacaína 2%/i)).toBeInTheDocument()
    expect(screen.getByText('LOT-2026-A')).toBeInTheDocument()
    expect(screen.getByText('LOT-2025-EXPIRED')).toBeInTheDocument()
    expect(screen.getByText(/VENCIDO/i)).toBeInTheDocument()
  })

  it('switches to create tab and submits a new batch', async () => {
    const onAddBatch = vi.fn().mockResolvedValue(undefined)

    const { container } = render(
      <InventoryBatchesModal
        isOpen={true}
        onClose={vi.fn()}
        item={mockItem}
        onAddBatch={onAddBatch}
        isAddingBatch={false}
        onDepleteBatch={vi.fn()}
        isUpdatingBatch={false}
      />
    )

    const createTabBtn = screen.getByText(/\+ Registrar Nuevo Lote/i)
    fireEvent.click(createTabBtn)

    const batchNumberInput = screen.getByPlaceholderText(/LOT-2026-X8 o BATCH-309/i)
    const expDateInput = container.querySelector('input[type="date"]') as HTMLInputElement
    const submitBtn = screen.getByRole('button', { name: /Registrar Lote/i })

    fireEvent.change(batchNumberInput, { target: { value: 'LOT-NEW-2026' } })
    fireEvent.change(expDateInput, { target: { value: '2027-06-30' } })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(onAddBatch).toHaveBeenCalledWith(
        expect.objectContaining({
          item_id: 'item-1',
          batch_number: 'LOT-NEW-2026',
          expiration_date: '2027-06-30',
          initial_quantity: 10,
        })
      )
    })
  })

  it('triggers onDepleteBatch when clicking discard batch button with confirmation', async () => {
    const onDepleteBatch = vi.fn().mockResolvedValue(undefined)
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(
      <InventoryBatchesModal
        isOpen={true}
        onClose={vi.fn()}
        item={mockItem}
        onAddBatch={vi.fn()}
        isAddingBatch={false}
        onDepleteBatch={onDepleteBatch}
        isUpdatingBatch={false}
      />
    )

    const depleteButtons = screen.getAllByTitle(/Descartar lote/i)
    fireEvent.click(depleteButtons[0])

    expect(window.confirm).toHaveBeenCalled()
    expect(onDepleteBatch).toHaveBeenCalled()
  })
})
