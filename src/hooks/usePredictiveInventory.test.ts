import { describe, it, expect } from 'vitest'
import {
  calculatePredictiveRestock,
  type PredictiveAppointmentData,
} from './usePredictiveInventory'
import type { InventoryItem } from '../types'

describe('Predictive Restock Engine (usePredictiveInventory)', () => {
  const mockItems: InventoryItem[] = [
    {
      id: 'item-anesthesia',
      name: 'Anestesia Articaína 4%',
      code: 'ANES-01',
      item_type: 'consumable_clinical',
      unit: 'caja',
      units_per_package: 50,
      dispense_unit: 'carpule',
      current_stock: 1, // 1 box = 50 carpules
      minimum_stock: 2, // 2 boxes minimum
      cost_price: 2500,
      status: 'active',
      is_active: true,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'item-bibs',
      name: 'Baberos Desechables',
      code: 'BIO-BAB',
      item_type: 'consumable_clinical',
      unit: 'paquete',
      units_per_package: 500,
      dispense_unit: 'unidad',
      current_stock: 0, // Out of stock!
      minimum_stock: 1,
      cost_price: 450,
      status: 'active',
      is_active: true,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'item-composite',
      name: 'Resina Filtek Z250 A2',
      code: 'RES-A2',
      item_type: 'consumable_clinical',
      unit: 'jeringa',
      units_per_package: 1,
      dispense_unit: 'jeringa',
      current_stock: 10,
      minimum_stock: 2,
      cost_price: 1800,
      status: 'active',
      is_active: true,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
  ]

  const mockAppointments: PredictiveAppointmentData[] = [
    {
      id: 'appt-1',
      scheduled_at: '2026-09-08T10:00:00Z',
      patient: { full_name: 'Juan Perez' },
      procedure: {
        id: 'proc-implante',
        name: 'Implantes Dentales',
        procedure_supplies: [
          {
            item_id: 'item-anesthesia',
            quantity: 30, // 30 carpules
            dispense_unit: 'carpule',
          },
          {
            item_id: 'item-bibs',
            quantity: 2,
            dispense_unit: 'unidad',
          },
        ],
      },
    },
    {
      id: 'appt-2',
      scheduled_at: '2026-09-10T14:00:00Z',
      patient: { full_name: 'Maria Rodriguez' },
      procedure: {
        id: 'proc-endo',
        name: 'Endodoncia',
        procedure_supplies: [
          {
            item_id: 'item-anesthesia',
            quantity: 25, // 25 carpules -> Total required = 55 carpules (Stock is 50 -> Deficit!)
            dispense_unit: 'carpule',
          },
          {
            item_id: 'item-bibs',
            quantity: 1,
            dispense_unit: 'unidad',
          },
        ],
      },
    },
  ]

  it('correctly calculates total demand across multiple appointments', () => {
    const report = calculatePredictiveRestock(mockItems, mockAppointments)

    const anesthesia = report.find((r) => r.item.id === 'item-anesthesia')
    expect(anesthesia).toBeDefined()
    expect(anesthesia?.totalUnitsRequired).toBe(55) // 30 + 25 carpules
    expect(anesthesia?.availableUnits).toBe(50) // 1 box * 50 carpules
    expect(anesthesia?.projectedRemainingUnits).toBe(-5) // 50 - 55 = -5
    expect(anesthesia?.urgency).toBe('critical_shortage')
    expect(anesthesia?.upcomingAppointments.length).toBe(2)
  })

  it('flags items with 0 stock as out_of_stock and suggests order', () => {
    const report = calculatePredictiveRestock(mockItems, mockAppointments)

    const bibs = report.find((r) => r.item.id === 'item-bibs')
    expect(bibs).toBeDefined()
    expect(bibs?.currentStockPackages).toBe(0)
    expect(bibs?.urgency).toBe('out_of_stock')
    expect(bibs?.suggestedPackagesToOrder).toBeGreaterThanOrEqual(1)
    expect(bibs?.estimatedCost).toBe((bibs?.suggestedPackagesToOrder || 0) * 450)
  })

  it('marks items with abundant stock as sufficient with 0 suggested packages', () => {
    const report = calculatePredictiveRestock(mockItems, mockAppointments)

    const composite = report.find((r) => r.item.id === 'item-composite')
    expect(composite).toBeDefined()
    expect(composite?.totalUnitsRequired).toBe(0)
    expect(composite?.urgency).toBe('sufficient')
    expect(composite?.suggestedPackagesToOrder).toBe(0)
    expect(composite?.estimatedCost).toBe(0)
  })

  it('sorts report prioritizing out_of_stock and critical_shortage at the top', () => {
    const report = calculatePredictiveRestock(mockItems, mockAppointments)

    expect(report[0].urgency).toBe('out_of_stock')
    expect(report[1].urgency).toBe('critical_shortage')
    expect(report[2].urgency).toBe('sufficient')
  })

  it('accurately calculates packages to order considering package conversion and safety buffer', () => {
    const report = calculatePredictiveRestock(mockItems, mockAppointments)

    const anesthesia = report.find((r) => r.item.id === 'item-anesthesia')
    // Needs 55 units, has 50. Minimum stock is 2 boxes = 100 units.
    // Target units (1.5x minimum) = 3 boxes * 50 = 150 units.
    // Remaining = -5 units. Deficit to target = 150 - (-5) = 155 units.
    // In packages of 50 = ceil(155 / 50) = 4 boxes (or at least minimum stock deficit).
    expect(anesthesia?.suggestedPackagesToOrder).toBeGreaterThanOrEqual(2)
    expect(anesthesia?.estimatedCost).toBe((anesthesia?.suggestedPackagesToOrder || 0) * 2500)
  })
})
