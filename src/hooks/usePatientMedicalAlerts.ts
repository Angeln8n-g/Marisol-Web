import { useMemo } from 'react'
import type { Patient, PatientMedicalHistory } from '../types'

export type AlertSeverity = 'critical' | 'warning' | 'info'

export interface ParsedMedicalAlert {
  id: string
  label: string
  severity: AlertSeverity
  category: 'allergy' | 'condition' | 'medication' | 'lifestyle' | 'other'
  recommendation?: string
}

export interface PatientMedicalAlertsSummary {
  alerts: ParsedMedicalAlert[]
  hasAlerts: boolean
  hasCriticalAlerts: boolean
  hasWarningAlerts: boolean
  criticalCount: number
  warningCount: number
  infoCount: number
}

/**
 * Parsea el historial médico y las alertas libres de un paciente para generar
 * un semáforo clínico estandarizado de seguridad médica en el sillón dental.
 */
export function parsePatientMedicalAlerts(
  patient?: Partial<Patient> | null,
  overrideHistory?: PatientMedicalHistory | null,
  overrideAlerts?: string | null
): PatientMedicalAlertsSummary {
  const history = overrideHistory !== undefined ? overrideHistory : patient?.medical_history
  const rawAlerts = overrideAlerts !== undefined ? overrideAlerts : patient?.medical_alerts

  const alerts: ParsedMedicalAlert[] = []

  // 1. Alergias Críticas
  if (history?.allergies_penicillin) {
    alerts.push({
      id: 'allergy_penicillin',
      label: 'Alergia a Penicilinas / Amoxicilina',
      severity: 'critical',
      category: 'allergy',
      recommendation: 'Prohibido amoxicilina o betalactámicos. Prescribir clindamicina o azitromicina.',
    })
  }

  if (history?.allergies_latex) {
    alerts.push({
      id: 'allergy_latex',
      label: 'Alergia Severa al Látex',
      severity: 'critical',
      category: 'allergy',
      recommendation: 'Usar guantes de nitrilo y dique de goma libre de látex en todo momento.',
    })
  }

  if (history?.allergies_anesthesia) {
    alerts.push({
      id: 'allergy_anesthesia',
      label: 'Reacción a Anestésicos Locales',
      severity: 'critical',
      category: 'allergy',
      recommendation: 'Verificar antecedentes de toxicidad/alergia previa antes de infiltrar.',
    })
  }

  if (history?.allergies_other && history.allergies_other.trim().length > 0) {
    alerts.push({
      id: 'allergy_other',
      label: `Alergia: ${history.allergies_other.trim()}`,
      severity: 'critical',
      category: 'allergy',
      recommendation: 'Verificar contraindicaciones de fármacos y materiales de impresión.',
    })
  }

  // 2. Condiciones Médicas Críticas
  if (history?.heart_disease) {
    alerts.push({
      id: 'condition_heart',
      label: 'Cardiopatía / Riesgo Cardíaco',
      severity: 'critical',
      category: 'condition',
      recommendation: 'Evaluar profilaxis para endocarditis y restringir epinefrina.',
    })
  }

  if (history?.hypertension) {
    alerts.push({
      id: 'condition_hypertension',
      label: 'Hipertensión Arterial',
      severity: 'critical',
      category: 'condition',
      recommendation: 'Tomar PA previa. Dosificar vasoconstrictor a máx 2 carpules si está descompensado.',
    })
  }

  if (history?.is_pregnant) {
    alerts.push({
      id: 'condition_pregnancy',
      label: 'Paciente Embarazada',
      severity: 'critical',
      category: 'condition',
      recommendation: 'Evitar rayos X innecesarios (mandil plomado). No usar AINEs en 1er/3er trimestre.',
    })
  }

  // 3. Condiciones Médicas de Advertencia (Warning)
  if (history?.diabetes) {
    alerts.push({
      id: 'condition_diabetes',
      label: 'Diabetes Mellitus',
      severity: 'warning',
      category: 'condition',
      recommendation: 'Verificar glucemia y medicación. Mayor riesgo de retraso en cicatrización e infección.',
    })
  }

  if (history?.asthma) {
    alerts.push({
      id: 'condition_asthma',
      label: 'Asma Bronquial',
      severity: 'warning',
      category: 'condition',
      recommendation: 'Confirmar inhalador broncodilatador a mano en el box. Evitar AINEs si es sensible.',
    })
  }

  if (history?.hepatitis) {
    alerts.push({
      id: 'condition_hepatitis',
      label: 'Hepatitis / Trastorno Hepático',
      severity: 'warning',
      category: 'condition',
      recommendation: 'Precaución con anestésicos amidas y fármacos de metabolización hepática.',
    })
  }

  if (history?.is_breastfeeding) {
    alerts.push({
      id: 'condition_breastfeeding',
      label: 'Periodo de Lactancia',
      severity: 'warning',
      category: 'condition',
      recommendation: 'Indicar fármacos de alta seguridad en lactancia (paracetamol, amoxicilina).',
    })
  }

  // 4. Medicaciones Actuales
  if (history?.current_medications && history.current_medications.trim().length > 0) {
    const medText = history.current_medications.trim()
    const isAnticoagulant = /anticoagulante|aspirina|warfarina|clopidogrel|eliquis|xarelto/i.test(medText)
    alerts.push({
      id: 'medication_current',
      label: `Medicación: ${medText}`,
      severity: isAnticoagulant ? 'critical' : 'warning',
      category: 'medication',
      recommendation: isAnticoagulant
        ? 'Riesgo de sangrado quirúrgico aumentado. No suspender sin interconsulta médica.'
        : undefined,
    })
  }

  // 5. Alertas Libres
  if (rawAlerts && rawAlerts.trim().length > 0) {
    alerts.push({
      id: 'custom_alert',
      label: rawAlerts.trim(),
      severity: 'critical',
      category: 'other',
      recommendation: 'Revisar notas clínicas específicas en la ficha del paciente.',
    })
  }

  // 6. Hábitos / Estilo de Vida (Info)
  if (history?.bruxism) {
    alerts.push({
      id: 'lifestyle_bruxism',
      label: 'Bruxismo / Desgaste Oclusal',
      severity: 'info',
      category: 'lifestyle',
      recommendation: 'Evaluar placa miorelajante y proteger cúspides restauradas.',
    })
  }

  if (history?.smoker) {
    alerts.push({
      id: 'lifestyle_smoker',
      label: 'Fumador Habitual',
      severity: 'info',
      category: 'lifestyle',
      recommendation: 'Mayor riesgo de periimplantitis, retracción gingival y manchas en resinas.',
    })
  }

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length
  const warningCount = alerts.filter((a) => a.severity === 'warning').length
  const infoCount = alerts.filter((a) => a.severity === 'info').length

  return {
    alerts,
    hasAlerts: alerts.length > 0,
    hasCriticalAlerts: criticalCount > 0,
    hasWarningAlerts: warningCount > 0,
    criticalCount,
    warningCount,
    infoCount,
  }
}

/**
 * Hook para reactividad en componentes
 */
export function usePatientMedicalAlerts(
  patient?: Partial<Patient> | null,
  overrideHistory?: PatientMedicalHistory | null,
  overrideAlerts?: string | null
): PatientMedicalAlertsSummary {
  return useMemo(
    () => parsePatientMedicalAlerts(patient, overrideHistory, overrideAlerts),
    [patient, overrideHistory, overrideAlerts]
  )
}
