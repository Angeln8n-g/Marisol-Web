import { describe, it, expect } from 'vitest'
import {
  calculateBudgetTotals,
  generatePaymentSchedule,
  validateInstallmentBalance,
} from './budgetUtils'

describe('budgetUtils', () => {
  describe('calculateBudgetTotals', () => {
    it('calculates subtotal correctly with multiple items', () => {
      const items = [
        { quantity: 2, unit_price: 2500 },
        { quantity: 1, unit_price: 15000 },
      ]
      const totals = calculateBudgetTotals(items, 0, 0)
      expect(totals.subtotal).toBe(20000)
      expect(totals.discountAmount).toBe(0)
      expect(totals.taxAmount).toBe(0)
      expect(totals.total).toBe(20000)
    })

    it('applies percentage discount accurately', () => {
      const items = [{ quantity: 1, unit_price: 10000 }]
      const totals = calculateBudgetTotals(items, 15, 0) // 15% discount
      expect(totals.subtotal).toBe(10000)
      expect(totals.discountAmount).toBe(1500)
      expect(totals.total).toBe(8500)
    })

    it('applies tax on discounted base', () => {
      const items = [{ quantity: 1, unit_price: 10000 }]
      const totals = calculateBudgetTotals(items, 10, 18) // 10% disc = 9000, 18% tax = 1620
      expect(totals.subtotal).toBe(10000)
      expect(totals.discountAmount).toBe(1000)
      expect(totals.taxAmount).toBe(1620)
      expect(totals.total).toBe(10620)
    })
  })

  describe('generatePaymentSchedule', () => {
    const fixedBaseDate = new Date('2026-09-01T00:00:00.000Z')

    it('generates 1 single payment for single_payment modality', () => {
      const schedule = generatePaymentSchedule({
        total: 25000,
        modality: 'single_payment',
        baseDate: fixedBaseDate,
      })

      expect(schedule).toHaveLength(1)
      expect(schedule[0].amount).toBe(25000)
      expect(schedule[0].installment_number).toBe(1)
      expect(validateInstallmentBalance(25000, schedule).isBalanced).toBe(true)
    })

    it('generates initial + installments with exact sum match', () => {
      const total = 50000
      const downPayment = 15000
      const installmentsCount = 3

      const schedule = generatePaymentSchedule({
        total,
        modality: 'installments',
        downPayment,
        installmentsCount,
        frequency: 'monthly',
        baseDate: fixedBaseDate,
      })

      // 1 down payment + 3 installments = 4 rows
      expect(schedule).toHaveLength(4)
      expect(schedule[0].concept).toContain('Inicial')
      expect(schedule[0].amount).toBe(15000)

      const balance = validateInstallmentBalance(total, schedule)
      expect(balance.isBalanced).toBe(true)
      expect(balance.difference).toBe(0)
    })

    it('handles rounding without balance drift when splitting indivisible totals', () => {
      const total = 10000
      const installmentsCount = 3

      const schedule = generatePaymentSchedule({
        total,
        modality: 'installments',
        downPayment: 0,
        installmentsCount,
        frequency: 'biweekly',
        baseDate: fixedBaseDate,
      })

      expect(schedule).toHaveLength(3)
      const balance = validateInstallmentBalance(total, schedule)
      expect(balance.isBalanced).toBe(true)
      expect(balance.difference).toBe(0)
    })

    it('generates installments per clinical session', () => {
      const total = 30000
      const sessionsCount = 3

      const schedule = generatePaymentSchedule({
        total,
        modality: 'per_session',
        sessionsCount,
        baseDate: fixedBaseDate,
      })

      expect(schedule).toHaveLength(3)
      expect(schedule[0].concept).toContain('Sesión Clínica 1')
      expect(schedule[1].concept).toContain('Sesión Clínica 2')
      expect(schedule[2].concept).toContain('Sesión Clínica 3')

      const balance = validateInstallmentBalance(total, schedule)
      expect(balance.isBalanced).toBe(true)
      expect(balance.difference).toBe(0)
    })
  })

  describe('validateInstallmentBalance', () => {
    it('detects balanced installments', () => {
      const res = validateInstallmentBalance(1500, [{ amount: 500 }, { amount: 1000 }])
      expect(res.isBalanced).toBe(true)
      expect(res.difference).toBe(0)
    })

    it('detects unbalanced installments', () => {
      const res = validateInstallmentBalance(1500, [{ amount: 500 }, { amount: 800 }])
      expect(res.isBalanced).toBe(false)
      expect(res.difference).toBe(200)
    })
  })
})
