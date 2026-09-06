import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MaintenanceDetailModal } from './MaintenanceDetailModal'
import type { EquipmentMaintenance } from '../../../types'

describe('MaintenanceDetailModal', () => {
  const mockMaintenance: EquipmentMaintenance = {
    id: 'maint-1',
    item_id: 'item-tool-1',
    maintenance_type: 'preventive',
    title: 'Calibración semestral de autoclave',
    technician_name: 'Carlos Mendoza',
    technician_contact: '809-555-1234',
    scheduled_date: '2026-03-01',
    cost: 4500,
    status: 'scheduled',
    item: {
      id: 'item-tool-1',
      name: 'Autoclave W&H Lisa',
      brand: 'W&H',
      serial_number: 'SN-WH-9981',
      item_type: 'tool',
      unit: 'unidad',
      current_stock: 1,
      minimum_stock: 1,
      cost_price: 250000,
      is_active: true,
      status: 'active',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  }

  it('renders null when isOpen is false or maintenance is null', () => {
    const { container } = render(
      <MaintenanceDetailModal
        isOpen={false}
        onClose={vi.fn()}
        maintenance={mockMaintenance}
        onUpdate={vi.fn()}
        isUpdating={false}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders maintenance and equipment info accurately', () => {
    render(
      <MaintenanceDetailModal
        isOpen={true}
        onClose={vi.fn()}
        maintenance={mockMaintenance}
        onUpdate={vi.fn()}
        isUpdating={false}
      />
    )

    expect(screen.getByText(/Ficha de Mantenimiento Técnico/i)).toBeInTheDocument()
    expect(screen.getByText(/Autoclave W&H Lisa/i)).toBeInTheDocument()
    expect(screen.getByText(/Calibración semestral de autoclave/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('Carlos Mendoza')).toBeInTheDocument()
    expect(screen.getByDisplayValue('4500')).toBeInTheDocument()
  })

  it('submits status update and technical findings', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined)

    render(
      <MaintenanceDetailModal
        isOpen={true}
        onClose={vi.fn()}
        maintenance={mockMaintenance}
        onUpdate={onUpdate}
        isUpdating={false}
      />
    )

    const statusSelect = screen.getByRole('combobox')
    fireEvent.change(statusSelect, { target: { value: 'completed' } })

    const findingsInput = screen.getByPlaceholderText(/ej. Desgaste en rodamientos cerámicos/i)
    fireEvent.change(findingsInput, { target: { value: 'Todo calibrado según norma ISO' } })

    const submitBtn = screen.getByText(/Guardar Cambios/i)
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        'maint-1',
        expect.objectContaining({
          status: 'completed',
          findings: 'Todo calibrado según norma ISO',
        })
      )
    })
  })
})
