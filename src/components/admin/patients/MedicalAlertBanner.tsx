import React from 'react'
import type { Patient, PatientMedicalHistory } from '../../../types'
import { usePatientMedicalAlerts } from '../../../hooks/usePatientMedicalAlerts'

interface MedicalAlertBannerProps {
  patient?: Partial<Patient> | null
  overrideHistory?: PatientMedicalHistory | null
  overrideAlerts?: string | null
  title?: string
  className?: string
  compact?: boolean
}

export const MedicalAlertBanner: React.FC<MedicalAlertBannerProps> = ({
  patient,
  overrideHistory,
  overrideAlerts,
  title = 'Semáforo de Seguridad Médica del Paciente',
  className = '',
  compact = false,
}) => {
  const { alerts, hasAlerts, hasCriticalAlerts } = usePatientMedicalAlerts(
    patient,
    overrideHistory,
    overrideAlerts
  )

  if (!hasAlerts) return null

  const isCritical = hasCriticalAlerts

  return (
    <div
      className={`rounded-2xl border p-3.5 space-y-2 font-montserrat transition-all shadow-xs ${
        isCritical
          ? 'bg-red-50/90 border-red-300/80 text-red-950'
          : 'bg-amber-50/90 border-amber-300/80 text-amber-950'
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">{isCritical ? '🚨' : '⚠️'}</span>
          <span className="font-bold text-xs uppercase tracking-wider">
            {title}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              isCritical
                ? 'bg-red-200 text-red-800'
                : 'bg-amber-200 text-amber-800'
            }`}
          >
            {isCritical ? 'Riesgo Crítico' : 'Precaución'}
          </span>
        </div>
        <span className="text-[10px] font-medium opacity-75">
          Verificar antes de suministrar anestesia o medicación
        </span>
      </div>

      <div className={`grid gap-2 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-2.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 ${
              alert.severity === 'critical'
                ? 'bg-white/90 border-red-200 text-red-900 shadow-2xs'
                : alert.severity === 'warning'
                ? 'bg-white/90 border-amber-200 text-amber-900 shadow-2xs'
                : 'bg-white/80 border-blue-100 text-blue-900'
            }`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs">
                {alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟠' : 'ℹ️'}
              </span>
              <strong className="font-semibold">{alert.label}</strong>
            </div>
            {alert.recommendation && (
              <span className="text-[11px] text-gray-600 font-normal italic">
                {alert.recommendation}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
