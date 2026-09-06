import React from 'react'
import type { PaymentModality, PaymentFrequency, CreateBudgetInstallmentDTO } from '../../../types'
import { generatePaymentSchedule } from '../../../lib/budgetUtils'

interface BudgetPaymentPlanFormProps {
  totalBudget: number
  modality: PaymentModality
  onModalityChange: (m: PaymentModality) => void
  downPayment: number
  onDownPaymentChange: (amt: number) => void
  installmentsCount: number
  onInstallmentsCountChange: (count: number) => void
  frequency: PaymentFrequency
  onFrequencyChange: (f: PaymentFrequency) => void
  installments: CreateBudgetInstallmentDTO[]
  onInstallmentsChange: (items: CreateBudgetInstallmentDTO[]) => void
  sessionsCount?: number
}

export const BudgetPaymentPlanForm: React.FC<BudgetPaymentPlanFormProps> = ({
  totalBudget,
  modality,
  onModalityChange,
  downPayment,
  onDownPaymentChange,
  installmentsCount,
  onInstallmentsCountChange,
  frequency,
  onFrequencyChange,
  installments,
  onInstallmentsChange,
  sessionsCount = 1,
}) => {
  // Regenerate installments schedule automatically when parameters change
  const generateSchedule = (
    currentModality: PaymentModality,
    dp: number,
    count: number,
    freq: PaymentFrequency,
    total: number
  ) => {
    const schedule = generatePaymentSchedule({
      total,
      modality: currentModality,
      downPayment: dp,
      installmentsCount: count,
      frequency: freq,
      sessionsCount,
    })
    onInstallmentsChange(schedule)
  }

  // Handle manual changes to installment row
  const handleInstallmentChange = (index: number, field: keyof CreateBudgetInstallmentDTO, value: any) => {
    const updated = [...installments]
    updated[index] = { ...updated[index], [field]: value }
    onInstallmentsChange(updated)
  }

  const handleAddCustomInstallment = () => {
    const newNum = installments.length + 1
    onInstallmentsChange([
      ...installments,
      {
        installment_number: newNum,
        concept: `Hito / Cuota ${newNum}`,
        amount: 0,
        due_date: new Date(Date.now() + newNum * 15 * 86400000).toISOString().split('T')[0],
      },
    ])
  }

  const handleRemoveCustomInstallment = (index: number) => {
    const updated = installments.filter((_, idx) => idx !== index)
    // Renumber
    const renumbered = updated.map((item, idx) => ({
      ...item,
      installment_number: idx + 1,
    }))
    onInstallmentsChange(renumbered)
  }

  // Sum of installments
  const totalInstallmentsSum = installments.reduce((acc, it) => acc + (Number(it.amount) || 0), 0)
  const difference = Math.round((totalBudget - totalInstallmentsSum) * 100) / 100

  return (
    <div className="space-y-4 font-montserrat">
      {/* Modality Selector Cards */}
      <div>
        <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
          Modalidad y Disposición de Pago
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => {
              onModalityChange('single_payment')
              generateSchedule('single_payment', 0, 1, frequency, totalBudget)
            }}
            className={`p-3 text-left rounded-lg border transition-all ${
              modality === 'single_payment'
                ? 'border-gold bg-gold/10 text-navy ring-1 ring-gold'
                : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-navy">Pago Único / Contado</span>
            </div>
            <p className="text-[11px] text-gray-500">100% al inicio del tratamiento o liquidación total.</p>
          </button>

          <button
            type="button"
            onClick={() => {
              onModalityChange('installments')
              const initialDp = Math.round(totalBudget * 0.3)
              onDownPaymentChange(initialDp)
              generateSchedule('installments', initialDp, installmentsCount || 3, frequency, totalBudget)
            }}
            className={`p-3 text-left rounded-lg border transition-all ${
              modality === 'installments'
                ? 'border-gold bg-gold/10 text-navy ring-1 ring-gold'
                : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs font-bold text-navy">Inicial + Cuotas</span>
            </div>
            <p className="text-[11px] text-gray-500">Anticipo inicial y saldo dividido en cuotas fijas.</p>
          </button>

          <button
            type="button"
            onClick={() => {
              onModalityChange('per_session')
              generateSchedule('per_session', 0, sessionsCount || 3, frequency, totalBudget)
            }}
            className={`p-3 text-left rounded-lg border transition-all ${
              modality === 'per_session'
                ? 'border-gold bg-gold/10 text-navy ring-1 ring-gold'
                : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-xs font-bold text-navy">Por Cita / Sesión</span>
            </div>
            <p className="text-[11px] text-gray-500">Abono progresivo conforme el paciente asiste a consulta.</p>
          </button>

          <button
            type="button"
            onClick={() => {
              onModalityChange('custom_financing')
              generateSchedule('custom_financing', downPayment, installmentsCount, frequency, totalBudget)
            }}
            className={`p-3 text-left rounded-lg border transition-all ${
              modality === 'custom_financing'
                ? 'border-gold bg-gold/10 text-navy ring-1 ring-gold'
                : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-navy">Fases / Hitos a Medida</span>
            </div>
            <p className="text-[11px] text-gray-500">Distribución personalizada por etapas quirúrgicas o protésicas.</p>
          </button>
        </div>
      </div>

      {/* Configuration Controls for Installments */}
      {modality === 'installments' && (
        <div className="bg-sand/20 border border-gold/30 rounded-lg p-3.5 space-y-3">
          <span className="text-xs font-bold text-navy uppercase tracking-wider block">
            Parámetros del Financiamiento en Cuotas
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-navy mb-1">
                Inicial / Anticipo (RD$)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  max={totalBudget}
                  value={downPayment}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0
                    onDownPaymentChange(val)
                    generateSchedule(modality, val, installmentsCount, frequency, totalBudget)
                  }}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded bg-white font-semibold"
                />
                <button
                  type="button"
                  onClick={() => {
                    const dp30 = Math.round(totalBudget * 0.3)
                    onDownPaymentChange(dp30)
                    generateSchedule(modality, dp30, installmentsCount, frequency, totalBudget)
                  }}
                  className="px-2 py-1 text-[10px] bg-white border border-gold text-navy rounded hover:bg-gold/10 font-bold whitespace-nowrap"
                  title="Aplicar 30% de inicial"
                >
                  30%
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const dp50 = Math.round(totalBudget * 0.5)
                    onDownPaymentChange(dp50)
                    generateSchedule(modality, dp50, installmentsCount, frequency, totalBudget)
                  }}
                  className="px-2 py-1 text-[10px] bg-white border border-gold text-navy rounded hover:bg-gold/10 font-bold whitespace-nowrap"
                  title="Aplicar 50% de inicial"
                >
                  50%
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-navy mb-1">
                Número de Cuotas
              </label>
              <select
                value={installmentsCount}
                onChange={(e) => {
                  const count = parseInt(e.target.value) || 1
                  onInstallmentsCountChange(count)
                  generateSchedule(modality, downPayment, count, frequency, totalBudget)
                }}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded bg-white"
              >
                <option value={2}>2 Cuotas</option>
                <option value={3}>3 Cuotas</option>
                <option value={4}>4 Cuotas</option>
                <option value={6}>6 Cuotas</option>
                <option value={10}>10 Cuotas</option>
                <option value={12}>12 Cuotas</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-navy mb-1">
                Periodicidad de Pago
              </label>
              <select
                value={frequency}
                onChange={(e) => {
                  const f = e.target.value as PaymentFrequency
                  onFrequencyChange(f)
                  generateSchedule(modality, downPayment, installmentsCount, f, totalBudget)
                }}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded bg-white"
              >
                <option value="monthly">Mensual (Cada 30 días)</option>
                <option value="biweekly">Quincenal (Cada 15 días)</option>
                <option value="weekly">Semanal (Cada 7 días)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-navy uppercase tracking-wider">
            Cronograma de Cuotas y Vencimientos
          </label>
          {modality === 'custom_financing' && (
            <button
              type="button"
              onClick={handleAddCustomInstallment}
              className="text-xs text-gold font-semibold hover:underline flex items-center gap-1"
            >
              + Agregar Hito / Etapa
            </button>
          )}
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-center w-12">#</th>
                <th className="px-3 py-2">Concepto / Hito</th>
                <th className="px-3 py-2 w-36">Fecha Límite</th>
                <th className="px-3 py-2 text-right w-36">Monto (RD$)</th>
                {modality === 'custom_financing' && <th className="px-2 py-2 w-10 text-center"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {installments.map((inst, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-center font-bold text-navy">
                    {inst.installment_number}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={inst.concept}
                      onChange={(e) => handleInstallmentChange(index, 'concept', e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:ring-1 focus:ring-gold"
                      required
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      value={inst.due_date || ''}
                      onChange={(e) => handleInstallmentChange(index, 'due_date', e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:ring-1 focus:ring-gold"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="relative">
                      <span className="absolute left-2 top-1 text-xs text-gray-400">$</span>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={inst.amount}
                        onChange={(e) => handleInstallmentChange(index, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-full pl-5 pr-2 py-1 text-xs border border-gray-300 rounded text-right font-semibold text-navy bg-white focus:ring-1 focus:ring-gold"
                        required
                      />
                    </div>
                  </td>
                  {modality === 'custom_financing' && (
                    <td className="px-2 py-2 text-center">
                      {installments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomInstallment(index)}
                          className="text-gray-400 hover:text-red-600 p-0.5"
                          title="Eliminar cuota"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Balance Indicator */}
        <div className="flex items-center justify-between text-xs pt-2 px-1">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Suma de cuotas programadas:</span>
            <span className="font-bold text-navy font-mono">
              RD$ {totalInstallmentsSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {Math.abs(difference) > 0.01 ? (
            <div className="text-red-600 font-semibold flex items-center gap-1">
              <span>⚠ Descuadre:</span>
              <span className="font-mono">
                {difference > 0 ? `Faltan RD$ ${difference.toLocaleString()}` : `Excede por RD$ ${Math.abs(difference).toLocaleString()}`}
              </span>
              <button
                type="button"
                onClick={() => {
                  // Adjust difference to the last installment
                  if (installments.length > 0) {
                    const lastIdx = installments.length - 1
                    const newAmount = Math.max(0, (Number(installments[lastIdx].amount) || 0) + difference)
                    handleInstallmentChange(lastIdx, 'amount', Math.round(newAmount * 100) / 100)
                  }
                }}
                className="ml-2 text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded hover:bg-red-200"
              >
                Ajustar a última cuota
              </button>
            </div>
          ) : (
            <div className="text-emerald-700 font-semibold flex items-center gap-1">
              <span>✓ Cuotas exactamente balanceadas con el total</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
