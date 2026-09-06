import type {
  PaymentModality,
  PaymentFrequency,
  CreateBudgetInstallmentDTO,
} from '../types'

export interface BudgetTotalsResult {
  subtotal: number
  discountAmount: number
  taxAmount: number
  total: number
}

/**
 * Calcula subtotal, descuento, impuesto y total de un presupuesto.
 */
export function calculateBudgetTotals(
  items: Array<{ quantity: number; unit_price: number }>,
  discountPercent: number = 0,
  taxPercent: number = 0
): BudgetTotalsResult {
  const subtotal = items.reduce(
    (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0),
    0
  )
  const clampedDiscount = Math.max(0, Math.min(100, Number(discountPercent) || 0))
  const discountAmount = Math.round(subtotal * (clampedDiscount / 100) * 100) / 100

  const taxableBase = Math.max(0, subtotal - discountAmount)
  const clampedTax = Math.max(0, Math.min(100, Number(taxPercent) || 0))
  const taxAmount = Math.round(taxableBase * (clampedTax / 100) * 100) / 100

  const total = Math.max(0, Math.round((taxableBase + taxAmount) * 100) / 100)

  return { subtotal, discountAmount, taxAmount, total }
}

/**
 * Genera el cronograma de cuotas y fechas límites según la modalidad seleccionada.
 */
export function generatePaymentSchedule(params: {
  total: number
  modality: PaymentModality
  downPayment?: number
  installmentsCount?: number
  frequency?: PaymentFrequency
  sessionsCount?: number
  baseDate?: Date
}): CreateBudgetInstallmentDTO[] {
  const {
    total,
    modality,
    downPayment = 0,
    installmentsCount = 3,
    frequency = 'monthly',
    sessionsCount = 1,
    baseDate = new Date(),
  } = params

  if (total <= 0) return []

  const formattedBaseDate = baseDate.toISOString().split('T')[0]

  if (modality === 'single_payment') {
    return [
      {
        installment_number: 1,
        concept: 'Pago Único de Contado (100%)',
        amount: total,
        due_date: formattedBaseDate,
      },
    ]
  }

  if (modality === 'installments') {
    const actualDp = Math.min(total, Math.max(0, downPayment))
    const balance = Math.max(0, total - actualDp)
    const count = Math.max(1, installmentsCount)
    const baseInstallment = Math.floor((balance / count) * 100) / 100

    const schedule: CreateBudgetInstallmentDTO[] = []

    if (actualDp > 0) {
      schedule.push({
        installment_number: 1,
        concept: 'Inicial / Anticipo de Materiales y Laboratorio',
        amount: actualDp,
        due_date: formattedBaseDate,
      })
    }

    const daysStep = frequency === 'weekly' ? 7 : frequency === 'biweekly' ? 15 : 30
    let allocated = 0

    for (let i = 1; i <= count; i++) {
      const dueDate = new Date(baseDate)
      dueDate.setDate(dueDate.getDate() + i * daysStep)

      const amount = i === count
        ? Math.round((balance - allocated) * 100) / 100
        : baseInstallment

      allocated += amount

      schedule.push({
        installment_number: actualDp > 0 ? i + 1 : i,
        concept: `Cuota ${i} de ${count} (${frequency === 'weekly' ? 'Semanal' : frequency === 'biweekly' ? 'Quincenal' : 'Mensual'})`,
        amount,
        due_date: dueDate.toISOString().split('T')[0],
      })
    }

    return schedule
  }

  if (modality === 'per_session') {
    const sessions = Math.max(1, sessionsCount || installmentsCount || 2)
    const baseAmount = Math.floor((total / sessions) * 100) / 100
    let allocated = 0
    const schedule: CreateBudgetInstallmentDTO[] = []

    for (let i = 1; i <= sessions; i++) {
      const dueDate = new Date(baseDate)
      dueDate.setDate(dueDate.getDate() + (i - 1) * 14)

      const amount = i === sessions
        ? Math.round((total - allocated) * 100) / 100
        : baseAmount

      allocated += amount

      schedule.push({
        installment_number: i,
        concept: `Sesión Clínica ${i} de ${sessions}`,
        amount,
        due_date: dueDate.toISOString().split('T')[0],
      })
    }

    return schedule
  }

  // Custom financing default: 2 phases
  const half = Math.round((total / 2) * 100) / 100
  const dueDate2 = new Date(baseDate)
  dueDate2.setDate(dueDate2.getDate() + 30)

  return [
    {
      installment_number: 1,
      concept: 'Fase 1: Inicio y Diagnóstico / Quirúrgica',
      amount: half,
      due_date: formattedBaseDate,
    },
    {
      installment_number: 2,
      concept: 'Fase 2: Finalización y Rehabilitación Protésica',
      amount: Math.round((total - half) * 100) / 100,
      due_date: dueDate2.toISOString().split('T')[0],
    },
  ]
}

/**
 * Valida si la suma de cuotas coincide con el total del presupuesto.
 */
export function validateInstallmentBalance(
  total: number,
  installments: Array<{ amount: number }>
): { isBalanced: boolean; difference: number } {
  const sum = installments.reduce((acc, it) => acc + (Number(it.amount) || 0), 0)
  const difference = Math.round((total - sum) * 100) / 100
  return {
    isBalanced: Math.abs(difference) <= 0.01,
    difference,
  }
}
