import React, { useState } from 'react'
import type { Procedure } from '../../../types'
import { calculateProcedureProfitability } from '../../../hooks/useProcedureProfitability'

interface ProcedureProfitabilityModalProps {
  isOpen: boolean
  onClose: () => void
  procedure: Procedure | null
}

export const ProcedureProfitabilityModal: React.FC<ProcedureProfitabilityModalProps> = ({
  isOpen,
  onClose,
  procedure,
}) => {
  if (!isOpen || !procedure) return null

  const initialPrice = Number(procedure.current_price?.price) || 3000
  const initialCommission = Number(procedure.doctor_commission_percent) || 40
  const initialChairHourly = Number(procedure.chair_hourly_cost) || 800
  const initialLabCost = Number(procedure.lab_cost) || 0

  const [simulatedPrice, setSimulatedPrice] = useState<number>(initialPrice)
  const [simulatedCommission, setSimulatedCommission] = useState<number>(initialCommission)
  const [simulatedChairHourly, setSimulatedChairHourly] = useState<number>(initialChairHourly)
  const [simulatedLabCost, setSimulatedLabCost] = useState<number>(initialLabCost)

  // Compute live profitability
  const metrics = calculateProcedureProfitability(procedure, {
    price: simulatedPrice,
    commissionPercent: simulatedCommission,
    chairHourlyCost: simulatedChairHourly,
    labCost: simulatedLabCost,
  })

  const durationHours = (procedure.duration_minutes || 60) / 60

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs font-montserrat overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-gray-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg font-bold">
              💰
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-playfair font-bold text-navy">
                Simulador de Rentabilidad y Unit Economics
              </h3>
              <p className="text-xs text-gray-500">
                {procedure.name} • {procedure.category} ({procedure.duration_minutes} min)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Executive KPI Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-navy text-white rounded-2xl border border-gold/40 shadow-inner">
          <div>
            <span className="text-[10px] text-gray-300 block uppercase">Margen Neto (RD$)</span>
            <strong
              className={`text-base sm:text-lg font-bold ${
                metrics.netMargin >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              RD$ {metrics.netMargin.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </strong>
          </div>

          <div>
            <span className="text-[10px] text-gray-300 block uppercase">Rentabilidad Neta</span>
            <strong
              className={`text-base sm:text-lg font-bold ${
                metrics.netMarginPercent >= 40
                  ? 'text-emerald-400'
                  : metrics.netMarginPercent >= 20
                  ? 'text-amber-300'
                  : 'text-red-400'
              }`}
            >
              {metrics.netMarginPercent.toFixed(1)}%
            </strong>
          </div>

          <div>
            <span className="text-[10px] text-gray-300 block uppercase">Rendimiento Sillón</span>
            <strong className="text-base sm:text-lg font-bold text-gold">
              RD$ {metrics.profitPerHour.toLocaleString('es-DO', { maximumFractionDigits: 0 })}/hr
            </strong>
          </div>

          <div>
            <span className="text-[10px] text-gray-300 block uppercase">Salud Financiera</span>
            <span
              className={`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold ${
                metrics.marginStatus === 'high_margin'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : metrics.marginStatus === 'moderate_margin'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-red-500/20 text-red-300 border border-red-500/40'
              }`}
            >
              {metrics.marginStatus === 'high_margin'
                ? 'Margen Óptimo'
                : metrics.marginStatus === 'moderate_margin'
                ? 'Margen Sano'
                : 'Margen Crítico'}
            </span>
          </div>
        </div>

        {/* Dynamic Simulator Sliders */}
        <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200/80 space-y-3.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-navy uppercase text-[11px]">
              Ajuste de Variables Clínicas en Tiempo Real
            </span>
            <span className="text-[10px] text-gray-400">
              Modifica los valores para proyectar el resultado
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Price Slider */}
            <div>
              <div className="flex justify-between font-semibold text-gray-700 mb-1">
                <span>Precio Cobrado al Paciente:</span>
                <span className="text-navy font-bold">
                  RD$ {simulatedPrice.toLocaleString('es-DO')}
                </span>
              </div>
              <input
                type="range"
                min={1000}
                max={80000}
                step={500}
                value={simulatedPrice}
                onChange={(e) => setSimulatedPrice(Number(e.target.value))}
                className="w-full accent-gold cursor-pointer"
              />
            </div>

            {/* Doctor Commission Slider */}
            <div>
              <div className="flex justify-between font-semibold text-gray-700 mb-1">
                <span>Comisión del Especialista (%):</span>
                <span className="text-navy font-bold">{simulatedCommission}%</span>
              </div>
              <input
                type="range"
                min={20}
                max={60}
                step={1}
                value={simulatedCommission}
                onChange={(e) => setSimulatedCommission(Number(e.target.value))}
                className="w-full accent-gold cursor-pointer"
              />
            </div>

            {/* Chair Hourly Cost Slider */}
            <div>
              <div className="flex justify-between font-semibold text-gray-700 mb-1">
                <span>Costo Fijo por Hora de Sillón:</span>
                <span className="text-navy font-bold">
                  RD$ {simulatedChairHourly.toLocaleString('es-DO')}/hr
                </span>
              </div>
              <input
                type="range"
                min={300}
                max={2500}
                step={50}
                value={simulatedChairHourly}
                onChange={(e) => setSimulatedChairHourly(Number(e.target.value))}
                className="w-full accent-gold cursor-pointer"
              />
            </div>

            {/* Lab Cost */}
            <div>
              <div className="flex justify-between font-semibold text-gray-700 mb-1">
                <span>Costo Laboratorio Dental:</span>
                <span className="text-navy font-bold">
                  RD$ {simulatedLabCost.toLocaleString('es-DO')}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={25000}
                step={500}
                value={simulatedLabCost}
                onChange={(e) => setSimulatedLabCost(Number(e.target.value))}
                className="w-full accent-gold cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Cost Breakdown Waterfall */}
        <div className="space-y-2 border border-gray-200 rounded-2xl p-4 bg-white text-xs">
          <div className="font-bold text-navy uppercase text-[11px] mb-2">
            Estructura de Costos del Procedimiento
          </div>

          <div className="space-y-2 divide-y divide-gray-100">
            <div className="flex items-center justify-between pt-1">
              <span className="text-gray-700">Ingreso por Procedimiento (Tarifa):</span>
              <strong className="text-navy text-sm font-bold">
                + RD$ {metrics.price.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div className="flex items-center justify-between pt-1 text-gray-600">
              <span className="flex items-center gap-1.5">
                <span>📦 Insumos Clínicos Gastados ({metrics.suppliesCount} ítems):</span>
              </span>
              <span className="text-red-700 font-semibold">
                - RD$ {metrics.suppliesCost.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {metrics.labCost > 0 && (
              <div className="flex items-center justify-between pt-1 text-gray-600">
                <span>🔬 Laboratorio Dental / Fresado:</span>
                <span className="text-red-700 font-semibold">
                  - RD$ {metrics.labCost.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 text-gray-600">
              <span>👨‍⚕️ Honorarios del Especialista ({metrics.doctorCommissionPercent}%):</span>
              <span className="text-red-700 font-semibold">
                - RD${' '}
                {metrics.doctorCommissionAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 text-gray-600">
              <span>
                🪑 Costo Operativo Sillón ({durationHours.toFixed(1)}h a RD$ {metrics.chairHourlyCost}
                /h):
              </span>
              <span className="text-red-700 font-semibold">
                - RD${' '}
                {metrics.chairOverheadAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 text-sm font-bold border-t border-gray-200">
              <span className="text-navy">Margen Neto para la Clínica:</span>
              <span className={metrics.netMargin >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                RD$ {metrics.netMargin.toLocaleString('es-DO', { minimumFractionDigits: 2 })} (
                {metrics.netMarginPercent.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-navy text-white font-bold rounded-xl text-xs hover:bg-navy/90 transition-colors shadow-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
