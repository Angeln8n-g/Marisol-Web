import type {
  Patient,
  PatientMedicalHistory,
  MedicalHistoryData,
  HygieneHabitsData,
} from '../types'

/**
 * Precarga los datos de Antecedentes Médicos y Hábitos para la Ficha Clínica Odontológica
 * a partir de los datos registrados en la ficha del paciente (admisión/recepción).
 */
export function preloadClinicalExamFromPatient(patient: Patient): {
  medical_history: MedicalHistoryData
  hygiene_habits: Partial<HygieneHabitsData>
} {
  const pmh = patient.medical_history || {}

  // 1. Construir descripción de enfermedades actuales
  const illnesses: string[] = []
  if (pmh.hypertension) illnesses.push('Hipertensión Arterial')
  if (pmh.diabetes) illnesses.push('Diabetes Mellitus')
  if (pmh.heart_disease) illnesses.push('Enfermedad Cardíaca / Cardiopatía')
  if (pmh.asthma) illnesses.push('Asma Bronquial')
  if (pmh.hepatitis) illnesses.push('Hepatitis / Trastorno Hepático')

  // 2. Construir descripción de alergias
  const allergiesList: string[] = []
  if (pmh.allergies_penicillin) allergiesList.push('Penicilina / Amoxicilina')
  if (pmh.allergies_latex) allergiesList.push('Látex')
  if (pmh.allergies_anesthesia) allergiesList.push('Anestésicos locales')
  if (pmh.allergies_other && pmh.allergies_other.trim()) {
    allergiesList.push(pmh.allergies_other.trim())
  }

  // 3. Estado de embarazo / lactancia
  const pregnancyList: string[] = []
  if (pmh.is_pregnant) pregnancyList.push('Embarazada')
  if (pmh.is_breastfeeding) pregnancyList.push('En período de lactancia')

  const medical_history: MedicalHistoryData = {
    current_illnesses: illnesses.length > 0 ? illnesses.join(', ') : '',
    medications: pmh.current_medications?.trim() || '',
    allergies: allergiesList.length > 0 ? allergiesList.join(', ') : '',
    surgeries_hospitalizations: pmh.previous_surgeries?.trim() || '',
    bleeding_healing_problems: '',
    anesthesia_reactions: pmh.allergies_anesthesia ? 'Reacción adversa a anestésicos locales referida en admisión' : '',
    pregnancy_status: pregnancyList.length > 0 ? pregnancyList.join(' / ') : 'No refiere / No aplica',
    additional_notes: pmh.notes?.trim() || '',
  }

  // 4. Hábitos
  const hygiene_habits: Partial<HygieneHabitsData> = {
    tobacco_use: pmh.smoker ? 'Sí (Fumador habitual)' : 'No fuma',
    alcohol_consumption: pmh.alcohol ? 'Consumo habitual' : 'No / Ocasional',
    bruxism_parafunctions: pmh.bruxism ? 'Bruxismo / Apretamiento dental referido' : '',
  }

  return {
    medical_history,
    hygiene_habits,
  }
}

/**
 * Infiere y extrae la información actualizada para la ficha maestra del paciente (`patients`)
 * a partir de lo registrado por el odontólogo en la Ficha Clínica.
 */
export function extractPatientUpdatesFromClinicalExam(
  medicalHistory: MedicalHistoryData,
  hygieneHabits: HygieneHabitsData,
  existingPatient?: Patient | null
): {
  medical_history: PatientMedicalHistory
  medical_alerts: string | null
} {
  const current = existingPatient?.medical_history || {}

  const illnessesText = (medicalHistory.current_illnesses || '').toLowerCase()
  const allergiesText = (medicalHistory.allergies || '').toLowerCase()
  const anesthesiaText = (medicalHistory.anesthesia_reactions || '').toLowerCase()
  const pregnancyText = (medicalHistory.pregnancy_status || '').toLowerCase()
  const tobaccoText = (hygieneHabits.tobacco_use || '').toLowerCase()
  const alcoholText = (hygieneHabits.alcohol_consumption || '').toLowerCase()
  const bruxismText = (hygieneHabits.bruxism_parafunctions || '').toLowerCase()

  // Detección de enfermedades
  const hasHypertension =
    Boolean(current.hypertension) ||
    /hipertensi|hta|presi[oó]n alta/i.test(illnessesText)
  const hasDiabetes =
    Boolean(current.diabetes) ||
    /diabet|az[uú]car|glucemia/i.test(illnessesText)
  const hasHeartDisease =
    Boolean(current.heart_disease) ||
    /cardiopat|coraz[oó]n|infarto|marcapasos|arritmia/i.test(illnessesText)
  const hasAsthma =
    Boolean(current.asthma) ||
    /asma|bronqu|respirator/i.test(illnessesText)
  const hasHepatitis =
    Boolean(current.hepatitis) ||
    /hepatit|h[ií]gado|hep[aá]tic/i.test(illnessesText)

  // Detección de alergias
  const hasPenicillinAllergy =
    Boolean(current.allergies_penicillin) ||
    /penicil|amoxicil|betalact/i.test(allergiesText)
  const hasLatexAllergy =
    Boolean(current.allergies_latex) ||
    /l[aá]tex/i.test(allergiesText)
  const hasAnesthesiaAllergy =
    Boolean(current.allergies_anesthesia) ||
    /anest[eé]si/i.test(allergiesText) ||
    /anest[eé]si|reacci[oó]n|toxicidad/i.test(anesthesiaText)

  // Detección de embarazo/lactancia
  const isPregnant =
    Boolean(current.is_pregnant) ||
    /embaraz|gesta/i.test(pregnancyText)
  const isBreastfeeding =
    Boolean(current.is_breastfeeding) ||
    /lactan|amamant/i.test(pregnancyText)

  // Detección de hábitos
  const isSmoker =
    Boolean(current.smoker) ||
    (/s[ií]|fuma|cigarrillo|tabaco|vape/i.test(tobaccoText) && !/no fuma/i.test(tobaccoText))
  const consumesAlcohol =
    Boolean(current.alcohol) ||
    (/frecuente|habitual|diario|fin de semana/i.test(alcoholText) && !/no/i.test(alcoholText))
  const hasBruxism =
    Boolean(current.bruxism) ||
    (/s[ií]|bruxis|apret|rechin|desgaste/i.test(bruxismText) && !/no/i.test(bruxismText))

  // Extracción de otras alergias
  let otherAllergies = current.allergies_other || ''
  if (medicalHistory.allergies && medicalHistory.allergies.trim()) {
    const cleanAllergies = medicalHistory.allergies.trim()
    if (!/^(ninguna|no refiere|no conocida|no)$/i.test(cleanAllergies)) {
      otherAllergies = cleanAllergies
    }
  }

  const updatedMedicalHistory: PatientMedicalHistory = {
    ...current,
    hypertension: hasHypertension,
    diabetes: hasDiabetes,
    heart_disease: hasHeartDisease,
    asthma: hasAsthma,
    hepatitis: hasHepatitis,
    allergies_penicillin: hasPenicillinAllergy,
    allergies_latex: hasLatexAllergy,
    allergies_anesthesia: hasAnesthesiaAllergy,
    allergies_other: otherAllergies,
    current_medications: medicalHistory.medications?.trim() || current.current_medications || '',
    previous_surgeries: medicalHistory.surgeries_hospitalizations?.trim() || current.previous_surgeries || '',
    is_pregnant: isPregnant,
    is_breastfeeding: isBreastfeeding,
    smoker: isSmoker,
    alcohol: consumesAlcohol,
    bruxism: hasBruxism,
    notes: medicalHistory.additional_notes?.trim() || current.notes || '',
  }

  // Generar resumen para alertas críticas de cabecera si no existe uno personalizado
  const alertsList: string[] = []
  if (hasPenicillinAllergy) alertsList.push('Alergia Penicilina')
  if (hasLatexAllergy) alertsList.push('Alergia Látex')
  if (hasAnesthesiaAllergy) alertsList.push('Reacción a Anestesia')
  if (hasHeartDisease) alertsList.push('Cardiopatía')
  if (isPregnant) alertsList.push('Embarazo')
  if (updatedMedicalHistory.current_medications) {
    if (/anticoagulan|aspirina|warfarina|clopidogrel|eliquis|xarelto/i.test(updatedMedicalHistory.current_medications)) {
      alertsList.push('Riesgo Anticoagulante')
    }
  }

  let generatedAlerts = existingPatient?.medical_alerts || null
  if (!generatedAlerts && alertsList.length > 0) {
    generatedAlerts = alertsList.join(' · ')
  }

  return {
    medical_history: updatedMedicalHistory,
    medical_alerts: generatedAlerts,
  }
}
