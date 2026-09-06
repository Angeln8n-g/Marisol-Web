import { describe, it, expect } from 'vitest'
import { calculateProcedureProfitability } from './useProcedureProfitability'
import type { Procedure } from '../types'

describe('Procedure Profitability & Unit Economics (calculateProcedureProfitability)', () => {
  const mockProcedure: Procedure = {
    id: 'proc-carillas',
    name: 'Diseño de Sonrisa (Carillas)',
    category: 'Estética Dental',
    description: 'Carillas de porcelana',
    duration_minutes: 120, // 2 hours
    chair_hourly_cost: 800, // 2h * 800 = 1,600 RD$
    doctor_commission_percent: 35, // 35%
    lab_cost: 4500, // 4,500 RD$
    is_active: true,
    created_at: '2026-01-01',
    current_price: {
      id: 'price-1',
      procedure_id: 'proc-carillas',
      price: 18000,
      currency: 'DOP',
      effective_from: '2026-01-01',
      effective_to: null,
      changed_by: 'admin',
      change_reason: 'Tarifa oficial',
    },
    supplies: [
      {
        id: 'ps-1',
        procedure_id: 'proc-carillas',
        item_id: 'item-anestesia',
        quantity: 2, // 2 carpules
        dispense_unit: 'carpule',
        is_optional: false,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
        item: {
          id: 'item-anestesia',
          name: 'Anestesia Articaína 4%',
          unit: 'caja',
          units_per_package: 50,
          dispense_unit: 'carpule',
          cost_price: 2500, // 2500 / 50 = 50 RD$ per carpule -> 2 * 50 = 100 RD$
          current_stock: 5,
          minimum_stock: 2,
          item_type: 'consumable_clinical',
          status: 'active',
          is_active: true,
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        },
      },
      {
        id: 'ps-2',
        procedure_id: 'proc-carillas',
        item_id: 'item-babero',
        quantity: 1, // 1 bib
        dispense_unit: 'unidad',
        is_optional: false,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
        item: {
          id: 'item-babero',
          name: 'Babero Dental',
          unit: 'paquete',
          units_per_package: 500,
          dispense_unit: 'unidad',
          cost_price: 450, // 450 / 500 = 0.9 RD$ -> 1 * 0.9 = 0.90 RD$
          current_stock: 3,
          minimum_stock: 1,
          item_type: 'consumable_clinical',
          status: 'active',
          is_active: true,
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        },
      },
    ],
  }

  it('correctly computes clinical supplies cost using package conversion factors', () => {
    const result = calculateProcedureProfitability(mockProcedure)
    // Supplies: 2 * (2500 / 50) + 1 * (450 / 500) = 100 + 0.9 = 100.90 RD$
    expect(result.suppliesCost).toBeCloseTo(100.9, 2)
  })

  it('correctly calculates doctor commission based on net revenue after lab cost', () => {
    const result = calculateProcedureProfitability(mockProcedure)
    // Revenue base = 18000 - 4500 = 13500 RD$
    // Doctor commission = 13500 * 35% = 4725 RD$
    expect(result.doctorCommissionAmount).toBe(4725)
  })

  it('correctly allocates chair overhead for procedure duration', () => {
    const result = calculateProcedureProfitability(mockProcedure)
    // Duration: 120 mins = 2.0 hours. Chair hourly = 800.
    // Overhead = 2 * 800 = 1600 RD$
    expect(result.chairOverheadAmount).toBe(1600)
  })

  it('computes exact gross and net margins and hourly profit', () => {
    const result = calculateProcedureProfitability(mockProcedure)
    // Price = 18000
    // Supplies = 100.9
    // Lab = 4500
    // Gross margin = 18000 - 100.9 - 4500 = 13399.10 RD$
    expect(result.grossMargin).toBeCloseTo(13399.1, 2)

    // Net margin = Gross margin - Doctor commission (4725) - Chair overhead (1600)
    // = 13399.10 - 4725 - 1600 = 7074.10 RD$
    expect(result.netMargin).toBeCloseTo(7074.1, 2)

    // Net Margin % = (7074.10 / 18000) * 100 = 39.30%
    expect(result.netMarginPercent).toBeCloseTo(39.3, 1)

    // Profit per hour = 7074.10 / 2 = 3537.05 RD$/hr
    expect(result.profitPerHour).toBeCloseTo(3537.05, 2)
    expect(result.marginStatus).toBe('moderate_margin') // 20% to 39.9%
  })

  it('categorizes margins into appropriate financial health status', () => {
    // High margin: 50% net
    const highMargin = calculateProcedureProfitability(mockProcedure, {
      price: 30000,
    })
    expect(highMargin.marginStatus).toBe('high_margin')

    // Low margin: 15% net
    const lowMargin = calculateProcedureProfitability(mockProcedure, {
      price: 10000,
    })
    expect(lowMargin.marginStatus).toBe('low_margin')

    // Loss: negative net margin
    const loss = calculateProcedureProfitability(mockProcedure, {
      price: 6000,
      commissionPercent: 50,
      chairHourlyCost: 2000,
    })
    expect(loss.marginStatus).toBe('loss')
    expect(loss.netMargin).toBeLessThan(0)
  })

  it('supports simulation overrides without modifying original procedure', () => {
    const simulated = calculateProcedureProfitability(mockProcedure, {
      price: 25000,
      commissionPercent: 40,
      chairHourlyCost: 1000,
      labCost: 5000,
    })

    expect(simulated.price).toBe(25000)
    expect(simulated.doctorCommissionPercent).toBe(40)
    expect(simulated.chairHourlyCost).toBe(1000)
    expect(simulated.labCost).toBe(5000)

    // Original procedure fields remain untouched
    expect(mockProcedure.lab_cost).toBe(4500)
  })
})
