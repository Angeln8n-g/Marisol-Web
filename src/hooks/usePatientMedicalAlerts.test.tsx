import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { parsePatientMedicalAlerts } from './usePatientMedicalAlerts'
import { MedicalAlertBanner } from '../components/admin/patients/MedicalAlertBanner'
import { MedicalAlertBadge } from '../components/admin/patients/MedicalAlertBadge'
import type { Patient } from '../types'

describe('usePatientMedicalAlerts', () => {
  it('detects critical allergy alerts properly', () => {
    const patient: Partial<Patient> = {
      medical_history: {
        allergies_penicillin: true,
        allergies_latex: true,
        allergies_anesthesia: true,
      },
    }

    const summary = parsePatientMedicalAlerts(patient)
    expect(summary.hasAlerts).toBe(true)
    expect(summary.hasCriticalAlerts).toBe(true)
    expect(summary.criticalCount).toBe(3)
    expect(summary.alerts.some((a) => a.id === 'allergy_penicillin')).toBe(true)
    expect(summary.alerts.some((a) => a.id === 'allergy_latex')).toBe(true)
  })

  it('detects hypertension, pregnancy and anticoagulant warnings', () => {
    const patient: Partial<Patient> = {
      medical_history: {
        hypertension: true,
        is_pregnant: true,
        current_medications: 'Toma warfarina sódica 5mg diarios',
      },
    }

    const summary = parsePatientMedicalAlerts(patient)
    expect(summary.hasCriticalAlerts).toBe(true)
    expect(summary.alerts.some((a) => a.id === 'condition_hypertension')).toBe(true)
    expect(summary.alerts.some((a) => a.id === 'condition_pregnancy')).toBe(true)
    expect(summary.alerts.some((a) => a.id === 'medication_current' && a.severity === 'critical')).toBe(true)
  })

  it('returns empty alerts when patient has clean history', () => {
    const patient: Partial<Patient> = {
      medical_history: {},
      medical_alerts: null,
    }

    const summary = parsePatientMedicalAlerts(patient)
    expect(summary.hasAlerts).toBe(false)
    expect(summary.criticalCount).toBe(0)
    expect(summary.alerts.length).toBe(0)
  })
})

describe('MedicalAlertBanner and Badge', () => {
  const riskyPatient: Partial<Patient> = {
    full_name: 'Carlos Santana',
    medical_history: {
      allergies_penicillin: true,
      diabetes: true,
    },
    medical_alerts: 'Sensibilidad severa a ketorolaco',
  }

  it('renders MedicalAlertBadge with alert count', () => {
    render(<MedicalAlertBadge patient={riskyPatient} />)
    expect(screen.getByText(/Alerta.*Médica/i)).toBeInTheDocument()
  })

  it('renders MedicalAlertBanner with critical and warning items', () => {
    render(<MedicalAlertBanner patient={riskyPatient} />)
    expect(screen.getByText(/Semáforo de Seguridad Médica/i)).toBeInTheDocument()
    expect(screen.getByText(/Alergia a Penicilinas \/ Amoxicilina/i)).toBeInTheDocument()
    expect(screen.getByText(/Diabetes Mellitus/i)).toBeInTheDocument()
    expect(screen.getByText(/Sensibilidad severa a ketorolaco/i)).toBeInTheDocument()
  })

  it('renders null when patient has no alerts', () => {
    const { container } = render(<MedicalAlertBanner patient={{ medical_history: {} }} />)
    expect(container.firstChild).toBeNull()
  })
})
