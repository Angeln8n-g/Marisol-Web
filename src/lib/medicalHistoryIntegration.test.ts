import { describe, it, expect } from 'vitest'
import {
  preloadClinicalExamFromPatient,
  extractPatientUpdatesFromClinicalExam,
} from './medicalHistoryIntegration'
import type { Patient, MedicalHistoryData, HygieneHabitsData } from '../types'

describe('medicalHistoryIntegration', () => {
  const mockPatient: Patient = {
    id: 'pat-123',
    full_name: 'Juan Pérez',
    email: 'juan@example.com',
    phone: '809-555-1234',
    birth_date: '1985-05-15',
    gender: 'male',
    medical_alerts: 'Alergia severa a penicilina',
    medical_history: {
      hypertension: true,
      diabetes: false,
      heart_disease: false,
      asthma: true,
      hepatitis: false,
      allergies_penicillin: true,
      allergies_latex: false,
      allergies_anesthesia: true,
      allergies_other: 'Sulfas',
      current_medications: 'Losartán 50mg, Salbutamol aerosol',
      previous_surgeries: 'Apendicectomía en 2015',
      is_pregnant: false,
      is_breastfeeding: false,
      smoker: true,
      alcohol: false,
      bruxism: true,
      notes: 'Control médico regular',
    },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }

  describe('preloadClinicalExamFromPatient', () => {
    it('correctly preloads medical history and hygiene habits from patient profile', () => {
      const { medical_history, hygiene_habits } = preloadClinicalExamFromPatient(mockPatient)

      expect(medical_history.current_illnesses).toContain('Hipertensión Arterial')
      expect(medical_history.current_illnesses).toContain('Asma Bronquial')
      expect(medical_history.medications).toBe('Losartán 50mg, Salbutamol aerosol')
      expect(medical_history.allergies).toContain('Penicilina / Amoxicilina')
      expect(medical_history.allergies).toContain('Anestésicos locales')
      expect(medical_history.allergies).toContain('Sulfas')
      expect(medical_history.surgeries_hospitalizations).toBe('Apendicectomía en 2015')
      expect(medical_history.anesthesia_reactions).toContain('Reacción adversa')
      expect(medical_history.additional_notes).toBe('Control médico regular')

      expect(hygiene_habits.tobacco_use).toContain('Sí (Fumador habitual)')
      expect(hygiene_habits.bruxism_parafunctions).toContain('Bruxismo')
      expect(hygiene_habits.alcohol_consumption).toContain('No / Ocasional')
    })

    it('handles empty medical history gracefully without errors', () => {
      const emptyPatient: Patient = {
        id: 'pat-empty',
        full_name: 'Ana Gómez',
        email: null,
        phone: '809-555-9999',
        birth_date: null,
        gender: 'female',
        medical_alerts: null,
        medical_history: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      }

      const { medical_history, hygiene_habits } = preloadClinicalExamFromPatient(emptyPatient)

      expect(medical_history.current_illnesses).toBe('')
      expect(medical_history.medications).toBe('')
      expect(medical_history.allergies).toBe('')
      expect(hygiene_habits.tobacco_use).toBe('No fuma')
    })
  })

  describe('extractPatientUpdatesFromClinicalExam', () => {
    it('infers updated patient flags and keeps existing data in sync', () => {
      const examMedicalHistory: MedicalHistoryData = {
        current_illnesses: 'Diabetes Tipo 2 controlada, cardiopatía isquémica',
        medications: 'Metformina 850mg, Aspirina 100mg protect',
        allergies: 'Alérgico al látex y mariscos',
        surgeries_hospitalizations: 'Colocación de stent en 2023',
        bleeding_healing_problems: 'Mayor tiempo de sangrado',
        anesthesia_reactions: 'Ninguna',
        pregnancy_status: 'No aplica',
        additional_notes: 'Paciente acude con familiar',
      }

      const examHygieneHabits: HygieneHabitsData = {
        brushing_frequency: '2 veces al día',
        floss_interdental: 'Sí',
        mouthwash: 'Clorhexidina',
        tobacco_use: 'No fuma hace 2 años',
        alcohol_consumption: 'Social los fines de semana',
        bruxism_parafunctions: 'Sí, aprieta dientes al dormir',
      }

      const result = extractPatientUpdatesFromClinicalExam(
        examMedicalHistory,
        examHygieneHabits,
        mockPatient
      )

      expect(result.medical_history.diabetes).toBe(true)
      expect(result.medical_history.heart_disease).toBe(true)
      expect(result.medical_history.allergies_latex).toBe(true)
      expect(result.medical_history.current_medications).toBe('Metformina 850mg, Aspirina 100mg protect')
      expect(result.medical_history.previous_surgeries).toBe('Colocación de stent en 2023')
      expect(result.medical_history.bruxism).toBe(true)
      expect(result.medical_history.notes).toBe('Paciente acude con familiar')
    })
  })
})
