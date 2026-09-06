import React, { useState } from 'react'
import type { Patient } from '../../../types'
import { usePatientMedicalAlerts } from '../../../hooks/usePatientMedicalAlerts'

interface MedicalAlertBadgeProps {
  patient?: Partial<Patient> | null
  showDetailsOnClick?: boolean
  className?: string
}

export const MedicalAlertBadge: React.FC<MedicalAlertBadgeProps> = ({
  patient,
  showDetailsOnClick = true,
  className = '',
}) => {
  const { alerts, hasAlerts, hasCriticalAlerts, criticalCount, warningCount } =
    usePatientMedicalAlerts(patient)
  const [showPopover, setShowPopover] = useState(false)

  if (!hasAlerts) return null

  const isCritical = hasCriticalAlerts

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          if (showDetailsOnClick) {
            e.stopPropagation()
            setShowPopover((prev) => !prev)
          }
        }}
        title={`${alerts.length} alertas médicas registradas`}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shadow-2xs ${
          isCritical
            ? 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 animate-pulse'
            : 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
        }`}
      >
        <span>{isCritical ? '🚨' : '⚠️'}</span>
        <span>
          {isCritical
            ? `${criticalCount} Alerta${criticalCount > 1 ? 's' : ''} Médica${criticalCount > 1 ? 's' : ''}`
            : `${warningCount} Precaución${warningCount > 1 ? 'es' : ''}`}
        </span>
      </button>

      {/* Popover con desglose al hacer clic o hover */}
      {showPopover && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 left-0 mt-1.5 w-72 p-3 bg-white rounded-2xl shadow-xl border border-gray-200 text-xs font-montserrat text-left space-y-2 animate-in fade-in-50 zoom-in-95"
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
            <span className="font-bold text-navy text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <span>🛡️</span>
              <span>Alertas Médicas del Paciente</span>
            </span>
            <button
              type="button"
              onClick={() => setShowPopover(false)}
              className="text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {alerts.map((a) => (
              <div
                key={a.id}
                className={`p-2 rounded-xl text-[11px] border ${
                  a.severity === 'critical'
                    ? 'bg-red-50 text-red-900 border-red-200'
                    : a.severity === 'warning'
                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                    : 'bg-blue-50 text-blue-900 border-blue-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <span>{a.severity === 'critical' ? '🔴' : a.severity === 'warning' ? '🟠' : 'ℹ️'}</span>
                  <span>{a.label}</span>
                </div>
                {a.recommendation && (
                  <p className="mt-0.5 text-[10px] text-gray-600 font-normal leading-tight">
                    {a.recommendation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
