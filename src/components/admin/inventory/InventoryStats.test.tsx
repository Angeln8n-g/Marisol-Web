import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InventoryStats } from './InventoryStats'

describe('InventoryStats', () => {
  const defaultProps = {
    totalValuation: 245000,
    totalItems: 42,
    lowStockCount: 5,
    outOfStockCount: 2,
    expiringBatchesCount: 3,
    pendingMaintenancesCount: 1,
    activeStockFilter: 'all',
    onSelectStockFilter: vi.fn(),
    onSelectMaintenanceTab: vi.fn(),
  }

  it('renders total valuation in Dominican Pesos format', () => {
    render(<InventoryStats {...defaultProps} />)
    expect(screen.getByText(/Valor del Inventario/i)).toBeInTheDocument()
    expect(screen.getByText(/245,000.00/i)).toBeInTheDocument()
  })

  it('renders total items count correctly', () => {
    render(<InventoryStats {...defaultProps} />)
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText(/42 productos valorizados/i)).toBeInTheDocument()
  })

  it('renders critical stock count (low stock + out of stock)', () => {
    render(<InventoryStats {...defaultProps} />)
    // 5 low stock + 2 out of stock = 7
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText(/2 agotados · 5 bajo mín./i)).toBeInTheDocument()
  })

  it('triggers onSelectStockFilter when clicking the critical stock card', () => {
    const onSelectStockFilter = vi.fn()
    render(<InventoryStats {...defaultProps} onSelectStockFilter={onSelectStockFilter} />)

    const criticalCardTitle = screen.getByText(/Stock Crítico \/ Agotado/i)
    fireEvent.click(criticalCardTitle)

    expect(onSelectStockFilter).toHaveBeenCalledWith('low_stock')
  })

  it('triggers onSelectMaintenanceTab when clicking the services card', () => {
    const onSelectMaintenanceTab = vi.fn()
    render(<InventoryStats {...defaultProps} onSelectMaintenanceTab={onSelectMaintenanceTab} />)

    const maintCardTitle = screen.getByText(/Servicios & Caducidad/i)
    fireEvent.click(maintCardTitle)

    expect(onSelectMaintenanceTab).toHaveBeenCalledTimes(1)
  })
})
