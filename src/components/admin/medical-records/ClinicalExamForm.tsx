import React, { useState } from 'react'
import type {
  Patient,
  ChiefComplaintData,
  MedicalHistoryData,
  DentalHistoryData,
  HygieneHabitsData,
  PeriodontalEvaluationData,
  PatientPerceptionData,
  ProfessionalExamData,
} from '../../../types'
import { useClinicalExaminations } from '../../../hooks/useClinicalExaminations'
import { ClinicalExamPrintView } from './ClinicalExamPrintView'

interface ClinicalExamFormProps {
  patient: Patient
}

export const ClinicalExamForm: React.FC<ClinicalExamFormProps> = ({ patient }) => {
  const {
    examinations,
    createExamination,
    isCreating,
    updateExamination,
    isUpdating,
  } = useClinicalExaminations(patient.id)

  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<
    'anamnesis_1' | 'anamnesis_2' | 'anamnesis_3' | 'anamnesis_4' | 'anamnesis_5' | 'anamnesis_6' | 'professional'
  >('anamnesis_1')
  const [isPrintMode, setIsPrintMode] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Current active examination or state for a new one
  const currentExam = examinations.find((e) => e.id === selectedExamId) || examinations[0] || null

  // Local form state
  const [formData, setFormData] = useState<{
    chief_complaint: ChiefComplaintData
    medical_history: MedicalHistoryData
    dental_history: DentalHistoryData
    hygiene_habits: HygieneHabitsData
    periodontal_evaluation: PeriodontalEvaluationData
    patient_perception: PatientPerceptionData
    professional_exam: ProfessionalExamData
  }>(() => ({
    chief_complaint: currentExam?.chief_complaint || {
      reason: '',
      discomfort: '',
      duration: '',
      previous_treatments: '',
    },
    medical_history: currentExam?.medical_history || {
      current_illnesses: '',
      medications: '',
      allergies: '',
      surgeries_hospitalizations: '',
      bleeding_healing_problems: '',
      anesthesia_reactions: '',
      pregnancy_status: '',
    },
    dental_history: currentExam?.dental_history || {
      last_dental_visit: '',
      gum_disease_history: '',
      scaling_root_planing: '',
      surgeries_implants_grafts: '',
      pending_treatments: '',
      pain_bleeding_mobility_sensitivity: '',
      teeth_migration: '',
    },
    hygiene_habits: currentExam?.hygiene_habits || {
      brushing_frequency: '2-3 veces al día',
      floss_interdental: '',
      mouthwash: '',
      tobacco_use: 'No',
      alcohol_consumption: 'Ocasional',
      bruxism_parafunctions: '',
    },
    periodontal_evaluation: currentExam?.periodontal_evaluation || {
      gum_bleeding: '',
      gum_changes: '',
      persistent_halitosis: '',
      pus_secretion: 'No',
      tooth_mobility: 'No',
      teeth_spacing: 'No',
      family_history_periodontal: '',
    },
    patient_perception: currentExam?.patient_perception || {
      treatment_expectations: '',
      areas_of_concern: '',
      smile_improvements: '',
    },
    professional_exam: currentExam?.professional_exam || {
      oral_hygiene_plaque: '',
      dental_calculus: '',
      gum_status: '',
      bleeding_on_probing: '',
      probing_depth_summary: '',
      clinical_attachment_level: '',
      recessions: '',
      tooth_mobility: '',
      furcation_involvement: '',
      suppuration: '',
      dental_migration: '',
      mucosa_lesions: '',
      occlusion_evaluation: '',
      missing_teeth: '',
      caries_restorations: '',
      radiographs_cbct: '',
      periodontal_diagnosis: '',
      prognosis: '',
      treatment_plan: '',
    },
  }))

  // Synchronize when switching exams
  React.useEffect(() => {
    if (currentExam) {
      setFormData({
        chief_complaint: currentExam.chief_complaint || {
          reason: '',
          discomfort: '',
          duration: '',
          previous_treatments: '',
        },
        medical_history: currentExam.medical_history || {
          current_illnesses: '',
          medications: '',
          allergies: '',
          surgeries_hospitalizations: '',
          bleeding_healing_problems: '',
          anesthesia_reactions: '',
          pregnancy_status: '',
        },
        dental_history: currentExam.dental_history || {
          last_dental_visit: '',
          gum_disease_history: '',
          scaling_root_planing: '',
          surgeries_implants_grafts: '',
          pending_treatments: '',
          pain_bleeding_mobility_sensitivity: '',
          teeth_migration: '',
        },
        hygiene_habits: currentExam.hygiene_habits || {
          brushing_frequency: '',
          floss_interdental: '',
          mouthwash: '',
          tobacco_use: '',
          alcohol_consumption: '',
          bruxism_parafunctions: '',
        },
        periodontal_evaluation: currentExam.periodontal_evaluation || {
          gum_bleeding: '',
          gum_changes: '',
          persistent_halitosis: '',
          pus_secretion: '',
          tooth_mobility: '',
          teeth_spacing: '',
          family_history_periodontal: '',
        },
        patient_perception: currentExam.patient_perception || {
          treatment_expectations: '',
          areas_of_concern: '',
          smile_improvements: '',
        },
        professional_exam: currentExam.professional_exam || {
          oral_hygiene_plaque: '',
          dental_calculus: '',
          gum_status: '',
          bleeding_on_probing: '',
          probing_depth_summary: '',
          clinical_attachment_level: '',
          recessions: '',
          tooth_mobility: '',
          furcation_involvement: '',
          suppuration: '',
          dental_migration: '',
          mucosa_lesions: '',
          occlusion_evaluation: '',
          missing_teeth: '',
          caries_restorations: '',
          radiographs_cbct: '',
          periodontal_diagnosis: '',
          prognosis: '',
          treatment_plan: '',
        },
      })
    }
  }, [currentExam])

  const handleSave = async () => {
    setErrorMsg(null)
    try {
      if (currentExam) {
        await updateExamination({
          id: currentExam.id,
          data: formData,
        })
      } else {
        const created = await createExamination({
          patient_id: patient.id,
          doctor_name: 'Dra. Marisol García',
          ...formData,
        })
        setSelectedExamId(created.id)
      }
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Error al guardar ficha clínica')
    }
  }

  const handleNewExam = () => {
    setSelectedExamId(null)
    setFormData({
      chief_complaint: { reason: '', discomfort: '', duration: '', previous_treatments: '' },
      medical_history: {
        current_illnesses: '',
        medications: '',
        allergies: '',
        surgeries_hospitalizations: '',
        bleeding_healing_problems: '',
        anesthesia_reactions: '',
        pregnancy_status: '',
      },
      dental_history: {
        last_dental_visit: '',
        gum_disease_history: '',
        scaling_root_planing: '',
        surgeries_implants_grafts: '',
        pending_treatments: '',
        pain_bleeding_mobility_sensitivity: '',
        teeth_migration: '',
      },
      hygiene_habits: {
        brushing_frequency: '2-3 veces al día',
        floss_interdental: '',
        mouthwash: '',
        tobacco_use: 'No',
        alcohol_consumption: 'No',
        bruxism_parafunctions: '',
      },
      periodontal_evaluation: {
        gum_bleeding: '',
        gum_changes: '',
        persistent_halitosis: '',
        pus_secretion: 'No',
        tooth_mobility: 'No',
        teeth_spacing: 'No',
        family_history_periodontal: '',
      },
      patient_perception: {
        treatment_expectations: '',
        areas_of_concern: '',
        smile_improvements: '',
      },
      professional_exam: {
        oral_hygiene_plaque: '',
        dental_calculus: '',
        gum_status: '',
        bleeding_on_probing: '',
        probing_depth_summary: '',
        clinical_attachment_level: '',
        recessions: '',
        tooth_mobility: '',
        furcation_involvement: '',
        suppuration: '',
        dental_migration: '',
        mucosa_lesions: '',
        occlusion_evaluation: '',
        missing_teeth: '',
        caries_restorations: '',
        radiographs_cbct: '',
        periodontal_diagnosis: '',
        prognosis: '',
        treatment_plan: '',
      },
    })
    setActiveSection('anamnesis_1')
  }

  if (isPrintMode && currentExam) {
    return (
      <ClinicalExamPrintView
        examination={currentExam}
        patient={patient}
        onClose={() => setIsPrintMode(false)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con Acciones y Selector de Historial */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-playfair font-bold text-navy">
            Ficha de Examen Clínico Odontológico & Periodontal
          </h2>
          <p className="text-xs text-gray-500 font-montserrat mt-0.5">
            Interrogatorio anamnésico sistemático y registro exhaustivo del profesional
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {examinations.length > 0 && (
            <select
              value={currentExam?.id || ''}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-montserrat text-navy focus:ring-1 focus:ring-gold"
            >
              {examinations.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  Examen {new Date(exam.exam_date).toLocaleDateString()} - {exam.doctor_name || 'Dra. Marisol'}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={handleNewExam}
            className="px-3 py-1.5 bg-navy text-white text-xs font-medium rounded-lg hover:bg-navy/90 transition-colors font-montserrat"
          >
            + Nueva Ficha
          </button>

          {currentExam && (
            <button
              type="button"
              onClick={() => setIsPrintMode(true)}
              className="px-3 py-1.5 border border-gold text-gold text-xs font-medium rounded-lg hover:bg-gold/10 transition-colors flex items-center gap-1.5 font-montserrat"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir / PDF
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isCreating || isUpdating}
            className="px-5 py-1.5 bg-gold text-white text-xs font-semibold rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50 shadow-sm font-montserrat"
          >
            {isCreating || isUpdating ? 'Guardando...' : 'Guardar Ficha'}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-montserrat flex items-center gap-2">
          <span>✓ Ficha clínica guardada exitosamente en el expediente.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-montserrat">
          {errorMsg}
        </div>
      )}

      {/* Navegación por Secciones */}
      <div className="flex overflow-x-auto pb-2 border-b border-gray-200 gap-1 font-montserrat text-xs scrollbar-thin">
        {[
          { id: 'anamnesis_1', label: '1. Motivo de Consulta' },
          { id: 'anamnesis_2', label: '2. Antecedentes Médicos' },
          { id: 'anamnesis_3', label: '3. Antecedentes Odontológicos' },
          { id: 'anamnesis_4', label: '4. Higiene y Hábitos' },
          { id: 'anamnesis_5', label: '5. Evaluación Periodontal' },
          { id: 'anamnesis_6', label: '6. Percepción del Paciente' },
          { id: 'professional', label: '★ Examen Clínico del Profesional' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSection(tab.id as typeof activeSection)}
            className={`px-4 py-2.5 rounded-t-lg whitespace-nowrap transition-colors font-medium ${
              activeSection === tab.id
                ? tab.id === 'professional'
                  ? 'bg-navy text-gold font-bold shadow-sm'
                  : 'bg-gold/15 text-navy font-bold border-b-2 border-gold'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido de la sección seleccionada */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        {/* SECCIÓN 1: MOTIVO DE CONSULTA */}
        {activeSection === 'anamnesis_1' && (
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-base font-playfair font-bold text-navy">1. Motivo de Consulta</h3>
              <p className="text-xs text-gray-500 font-montserrat">
                Explore las razones principales que motivan la visita del paciente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-montserrat">
              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Cuál es el motivo principal de su visita?
                </label>
                <textarea
                  rows={3}
                  value={formData.chief_complaint.reason}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      chief_complaint: { ...formData.chief_complaint, reason: e.target.value },
                    })
                  }
                  placeholder="Ej: Molestia en encías al cepillarse, revisión general, valoración periodontal..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Qué molestia o problema presenta actualmente?
                </label>
                <textarea
                  rows={3}
                  value={formData.chief_complaint.discomfort}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      chief_complaint: { ...formData.chief_complaint, discomfort: e.target.value },
                    })
                  }
                  placeholder="Ej: Dolor localizado, inflamación, sangrado, movilidad en molares..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Desde cuándo lo presenta? (Tiempo de evolución)
                </label>
                <input
                  type="text"
                  value={formData.chief_complaint.duration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      chief_complaint: { ...formData.chief_complaint, duration: e.target.value },
                    })
                  }
                  placeholder="Ej: Hace 2 semanas, 3 meses, crónico de más de 1 año..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Ha recibido algún tratamiento para este problema?
                </label>
                <input
                  type="text"
                  value={formData.chief_complaint.previous_treatments}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      chief_complaint: { ...formData.chief_complaint, previous_treatments: e.target.value },
                    })
                  }
                  placeholder="Ej: Enjuagues, antibióticos, limpieza previa sin mejoría..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN 2: ANTECEDENTES MÉDICOS */}
        {activeSection === 'anamnesis_2' && (
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-base font-playfair font-bold text-navy">2. Antecedentes Médicos Sistémicos</h3>
              <p className="text-xs text-gray-500 font-montserrat">
                Factores sistémicos que inciden directamente en la cicatrización y respuesta periodontal.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-montserrat">
              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Padece actualmente alguna enfermedad o condición médica?
                </label>
                <input
                  type="text"
                  value={formData.medical_history.current_illnesses}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      medical_history: { ...formData.medical_history, current_illnesses: e.target.value },
                    })
                  }
                  placeholder="Ej: Diabetes Tipo 2, Hipertensión, Cardiopatía, Osteoporosis..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Está tomando algún medicamento actualmente? ¿Cuál?
                </label>
                <input
                  type="text"
                  value={formData.medical_history.medications}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      medical_history: { ...formData.medical_history, medications: e.target.value },
                    })
                  }
                  placeholder="Ej: Metformina 850mg, Losartán 50mg, Anticoagulantes, Bifosfonatos..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Es alérgico(a) a algún medicamento, alimento, látex u otra sustancia?
                </label>
                <input
                  type="text"
                  value={formData.medical_history.allergies}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      medical_history: { ...formData.medical_history, allergies: e.target.value },
                    })
                  }
                  placeholder="Ej: Penicilina, Látex, AINEs, Yodo, Sulfas (o 'Ninguna referida')..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Ha sido hospitalizado(a) o sometido(a) a alguna cirugía?
                </label>
                <input
                  type="text"
                  value={formData.medical_history.surgeries_hospitalizations}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      medical_history: { ...formData.medical_history, surgeries_hospitalizations: e.target.value },
                    })
                  }
                  placeholder="Ej: Apendicectomía hace 5 años, sin complicaciones..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Ha presentado problemas de sangrado o dificultad para cicatrizar?
                </label>
                <input
                  type="text"
                  value={formData.medical_history.bleeding_healing_problems}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      medical_history: { ...formData.medical_history, bleeding_healing_problems: e.target.value },
                    })
                  }
                  placeholder="Ej: No refiere / Cicatrización queloide / Sangrado prolongado..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Ha tenido alguna reacción a la anestesia dental anteriormente?
                </label>
                <input
                  type="text"
                  value={formData.medical_history.anesthesia_reactions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      medical_history: { ...formData.medical_history, anesthesia_reactions: e.target.value },
                    })
                  }
                  placeholder="Ej: Taquicardia, mareo, síncope o 'Ninguna, tolera bien'..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Está embarazada o existe posibilidad de embarazo? (cuando corresponda)
                </label>
                <input
                  type="text"
                  value={formData.medical_history.pregnancy_status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      medical_history: { ...formData.medical_history, pregnancy_status: e.target.value },
                    })
                  }
                  placeholder="Ej: No / Sí (Segundo trimestre - 16 semanas) / Lactancia activa..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN 3: ANTECEDENTES ODONTOLÓGICOS */}
        {activeSection === 'anamnesis_3' && (
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-base font-playfair font-bold text-navy">3. Antecedentes Odontológicos</h3>
              <p className="text-xs text-gray-500 font-montserrat">
                Historial de visitas, tratamientos previos y evolución de patologías orales.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-montserrat">
              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Cuándo fue su última visita al dentista?
                </label>
                <input
                  type="text"
                  value={formData.dental_history.last_dental_visit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dental_history: { ...formData.dental_history, last_dental_visit: e.target.value },
                    })
                  }
                  placeholder="Ej: Hace 6 meses para limpieza / Hace más de 2 años..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Ha tenido anteriormente enfermedad de las encías o tratamiento periodontal?
                </label>
                <input
                  type="text"
                  value={formData.dental_history.gum_disease_history}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dental_history: { ...formData.dental_history, gum_disease_history: e.target.value },
                    })
                  }
                  placeholder="Ej: Diagnosticado con periodontitis hace 3 años / Gingivitis frecuente..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Ha recibido raspado y alisado radicular (curetajes)?
                </label>
                <input
                  type="text"
                  value={formData.dental_history.scaling_root_planing}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dental_history: { ...formData.dental_history, scaling_root_planing: e.target.value },
                    })
                  }
                  placeholder="Ej: Sí, por cuadrantes en 2024 / No nunca..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Ha tenido extracciones, cirugías, implantes o injertos?
                </label>
                <input
                  type="text"
                  value={formData.dental_history.surgeries_implants_grafts}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dental_history: { ...formData.dental_history, surgeries_implants_grafts: e.target.value },
                    })
                  }
                  placeholder="Ej: Extracción de 3ros molares, 1 implante en pieza 36..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Tiene actualmente algún tratamiento odontológico pendiente?
                </label>
                <input
                  type="text"
                  value={formData.dental_history.pending_treatments}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dental_history: { ...formData.dental_history, pending_treatments: e.target.value },
                    })
                  }
                  placeholder="Ej: Corona pendiente en pieza 46, endodoncia iniciada..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Ha presentado dolor, sangrado de las encías, movilidad dental o sensibilidad?
                </label>
                <input
                  type="text"
                  value={formData.dental_history.pain_bleeding_mobility_sensitivity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dental_history: {
                        ...formData.dental_history,
                        pain_bleeding_mobility_sensitivity: e.target.value,
                      },
                    })
                  }
                  placeholder="Ej: Sensibilidad al frío en molares inferiores, sangrado con el cepillado..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Siente que algún diente se ha movido o cambiado de posición?
                </label>
                <input
                  type="text"
                  value={formData.dental_history.teeth_migration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dental_history: { ...formData.dental_history, teeth_migration: e.target.value },
                    })
                  }
                  placeholder="Ej: Separación en incisivos superiores (diastema reciente), migración hacia vestibular..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN 4: HIGIENE Y HÁBITOS */}
        {activeSection === 'anamnesis_4' && (
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-base font-playfair font-bold text-navy">4. Higiene y Hábitos</h3>
              <p className="text-xs text-gray-500 font-montserrat">
                Rutina diaria de higiene oral y factores conductuales de riesgo.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-montserrat">
              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Cuántas veces al día se cepilla los dientes?
                </label>
                <input
                  type="text"
                  value={formData.hygiene_habits.brushing_frequency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hygiene_habits: { ...formData.hygiene_habits, brushing_frequency: e.target.value },
                    })
                  }
                  placeholder="Ej: 2 veces al día, técnica manual / eléctrica..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Utiliza hilo dental o cepillos interproximales?
                </label>
                <input
                  type="text"
                  value={formData.hygiene_habits.floss_interdental}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hygiene_habits: { ...formData.hygiene_habits, floss_interdental: e.target.value },
                    })
                  }
                  placeholder="Ej: Diario por la noche / Ocasional / No utiliza..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Utiliza enjuague bucal?
                </label>
                <input
                  type="text"
                  value={formData.hygiene_habits.mouthwash}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hygiene_habits: { ...formData.hygiene_habits, mouthwash: e.target.value },
                    })
                  }
                  placeholder="Ej: Clorhexidina 0.12%, Flúor diario, enjuague comercial..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Fuma o utiliza algún producto de tabaco?
                </label>
                <input
                  type="text"
                  value={formData.hygiene_habits.tobacco_use}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hygiene_habits: { ...formData.hygiene_habits, tobacco_use: e.target.value },
                    })
                  }
                  placeholder="Ej: No fuma / Sí (10 cigarrillos/día) / Vapeador..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Consume bebidas alcohólicas con frecuencia?
                </label>
                <input
                  type="text"
                  value={formData.hygiene_habits.alcohol_consumption}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hygiene_habits: { ...formData.hygiene_habits, alcohol_consumption: e.target.value },
                    })
                  }
                  placeholder="Ej: No / Social los fines de semana / Frecuente..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Tiene algún hábito como apretar o rechinar los dientes?
                </label>
                <input
                  type="text"
                  value={formData.hygiene_habits.bruxism_parafunctions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hygiene_habits: { ...formData.hygiene_habits, bruxism_parafunctions: e.target.value },
                    })
                  }
                  placeholder="Ej: Bruxismo nocturno consciente, morder uñas, bolígrafos..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN 5: EVALUACIÓN PERIODONTAL */}
        {activeSection === 'anamnesis_5' && (
          <div className="space-y-4">
            <div className="border-b border-amber-200 pb-3 bg-amber-50/40 p-4 rounded-lg">
              <h3 className="text-base font-playfair font-bold text-amber-900">
                5. Evaluación Periodontal (Interrogatorio Especializado)
              </h3>
              <p className="text-xs text-amber-800 font-montserrat mt-0.5">
                Preguntas clave para el diagnóstico y estadiaje de enfermedades periodontales y periimplantarias.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-montserrat">
              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Le sangran las encías al cepillarse o espontáneamente?
                </label>
                <input
                  type="text"
                  value={formData.periodontal_evaluation.gum_bleeding}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      periodontal_evaluation: { ...formData.periodontal_evaluation, gum_bleeding: e.target.value },
                    })
                  }
                  placeholder="Ej: Sí, al cepillarse y con el hilo dental / Sangrado espontáneo..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Ha notado que sus encías han aumentado de tamaño, cambiado de color o se han retraído?
                </label>
                <input
                  type="text"
                  value={formData.periodontal_evaluation.gum_changes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      periodontal_evaluation: { ...formData.periodontal_evaluation, gum_changes: e.target.value },
                    })
                  }
                  placeholder="Ej: Encías rojas inflamadas / Retracción evidente con raíces expuestas..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Ha notado mal aliento persistente (halitosis)?
                </label>
                <input
                  type="text"
                  value={formData.periodontal_evaluation.persistent_halitosis}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      periodontal_evaluation: { ...formData.periodontal_evaluation, persistent_halitosis: e.target.value },
                    })
                  }
                  placeholder="Ej: Sí, persistente a pesar del cepillado / Sabor amargo matutino..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Ha observado pus o secreción alrededor de algún diente?
                </label>
                <input
                  type="text"
                  value={formData.periodontal_evaluation.pus_secretion}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      periodontal_evaluation: { ...formData.periodontal_evaluation, pus_secretion: e.target.value },
                    })
                  }
                  placeholder="Ej: Supuración ocasional en molar superior derecho / No ha observado..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Ha sentido movilidad en algún diente?
                </label>
                <input
                  type="text"
                  value={formData.periodontal_evaluation.tooth_mobility}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      periodontal_evaluation: { ...formData.periodontal_evaluation, tooth_mobility: e.target.value },
                    })
                  }
                  placeholder="Ej: Leve en incisivos inferiores / Movilidad al masticar..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Ha notado que sus dientes se han separado o cambiado de posición?
                </label>
                <input
                  type="text"
                  value={formData.periodontal_evaluation.teeth_spacing}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      periodontal_evaluation: { ...formData.periodontal_evaluation, teeth_spacing: e.target.value },
                    })
                  }
                  placeholder="Ej: Se ha abierto espacio entre los dos dientes de adelante..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Tiene antecedentes familiares de pérdida de dientes por enfermedad de las encías?
                </label>
                <input
                  type="text"
                  value={formData.periodontal_evaluation.family_history_periodontal}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      periodontal_evaluation: {
                        ...formData.periodontal_evaluation,
                        family_history_periodontal: e.target.value,
                      },
                    })
                  }
                  placeholder="Ej: Madre y abuela perdieron piezas jóvenes por piorrea / Sin antecedentes..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN 6: PERCEPCIÓN DEL PACIENTE */}
        {activeSection === 'anamnesis_6' && (
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-base font-playfair font-bold text-navy">6. Percepción del Paciente</h3>
              <p className="text-xs text-gray-500 font-montserrat">
                Expectativas estéticas, funcionales y objetivos prioritarios del paciente.
              </p>
            </div>

            <div className="space-y-4 text-xs font-montserrat">
              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Qué espera obtener con su tratamiento?
                </label>
                <textarea
                  rows={2}
                  value={formData.patient_perception.treatment_expectations}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      patient_perception: {
                        ...formData.patient_perception,
                        treatment_expectations: e.target.value,
                      },
                    })
                  }
                  placeholder="Ej: Detener el sangrado, salvar sus dientes naturales, eliminar el mal aliento..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Hay alguna zona de su boca que le preocupe especialmente?
                </label>
                <input
                  type="text"
                  value={formData.patient_perception.areas_of_concern}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      patient_perception: { ...formData.patient_perception, areas_of_concern: e.target.value },
                    })
                  }
                  placeholder="Ej: Zona anterior superior por estética, molares izquierdos al masticar..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  ¿Qué aspecto de su sonrisa o salud oral le gustaría mejorar?
                </label>
                <input
                  type="text"
                  value={formData.patient_perception.smile_improvements}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      patient_perception: { ...formData.patient_perception, smile_improvements: e.target.value },
                    })
                  }
                  placeholder="Ej: Color de los dientes, encías que no se vean rojas o hinchadas, alinear piezas..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN 7: EXAMEN CLÍNICO DEL PROFESIONAL */}
        {activeSection === 'professional' && (
          <div className="space-y-6">
            <div className="border-b border-gold pb-3 bg-navy p-4 rounded-xl text-white">
              <h3 className="text-base font-playfair font-bold text-gold">
                ★ Examen Clínico del Profesional
              </h3>
              <p className="text-xs text-gray-300 font-montserrat mt-0.5">
                Evaluación física minuciosa, sondaje periodontal, oclusión, diagnóstico EFP/AAP y plan de tratamiento por fases.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-montserrat">
              <div>
                <label className="block font-bold text-navy mb-1">Higiene oral y presencia de placa</label>
                <input
                  type="text"
                  value={formData.professional_exam.oral_hygiene_plaque}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      professional_exam: { ...formData.professional_exam, oral_hygiene_plaque: e.target.value },
                    })
                  }
                  placeholder="Ej: Regular, placa visible en tercio cervical generalizada (>40%)..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-bold text-navy mb-1">Cálculo dental</label>
                <input
                  type="text"
                  value={formData.professional_exam.dental_calculus}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      professional_exam: { ...formData.professional_exam, dental_calculus: e.target.value },
                    })
                  }
                  placeholder="Ej: Supragingival abundante en anteroinferiores, subgingival en molares..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-bold text-navy mb-1">Estado de las encías</label>
                <input
                  type="text"
                  value={formData.professional_exam.gum_status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      professional_exam: { ...formData.professional_exam, gum_status: e.target.value },
                    })
                  }
                  placeholder="Ej: Eritematosa, edematosa, pérdida de festoneado, fenotipo fino..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-bold text-navy mb-1">Sangrado al sondaje (BOP)</label>
                <input
                  type="text"
                  value={formData.professional_exam.bleeding_on_probing}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      professional_exam: { ...formData.professional_exam, bleeding_on_probing: e.target.value },
                    })
                  }
                  placeholder="Ej: Generalizado (>30% de sitios sangrantes)..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-bold text-navy mb-1">Profundidad de sondaje (PS)</label>
                <input
                  type="text"
                  value={formData.professional_exam.probing_depth_summary}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      professional_exam: { ...formData.professional_exam, probing_depth_summary: e.target.value },
                    })
                  }
                  placeholder="Ej: Bolsas de 5-7mm en molares y premolares, 3mm en anteriores..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-bold text-navy mb-1">Nivel de inserción clínica (NIC)</label>
                <input
                  type="text"
                  value={formData.professional_exam.clinical_attachment_level}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      professional_exam: {
                        ...formData.professional_exam,
                        clinical_attachment_level: e.target.value,
                      },
                    })
                  }
                  placeholder="Ej: Pérdida de soporte clínico moderada a severa (3-5mm)..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-bold text-navy mb-1">Recesiones gingivales</label>
                <input
                  type="text"
                  value={formData.professional_exam.recessions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      professional_exam: { ...formData.professional_exam, recessions: e.target.value },
                    })
                  }
                  placeholder="Ej: Cairo RT1 en caninos de 2mm, Miller Clase II en premolares..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-bold text-navy mb-1">Movilidad dental</label>
                <input
                  type="text"
                  value={formData.professional_exam.tooth_mobility}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      professional_exam: { ...formData.professional_exam, tooth_mobility: e.target.value },
                    })
                  }
                  placeholder="Ej: Grado 1 en 31 y 41; Grado 2 en molar 16..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-bold text-navy mb-1">Compromiso de furcaciones</label>
                <input
                  type="text"
                  value={formData.professional_exam.furcation_involvement}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      professional_exam: { ...formData.professional_exam, furcation_involvement: e.target.value },
                    })
                  }
                  placeholder="Ej: Furca Grado I en 16 (vestibular); Furca Grado II en 46..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-bold text-navy mb-1">Supuración</label>
                <input
                  type="text"
                  value={formData.professional_exam.suppuration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      professional_exam: { ...formData.professional_exam, suppuration: e.target.value },
                    })
                  }
                  placeholder="Ej: Positiva en bolsa distovestibular de pieza 16..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-bold text-navy mb-1">Migración dental</label>
                <input
                  type="text"
                  value={formData.professional_exam.dental_migration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      professional_exam: { ...formData.professional_exam, dental_migration: e.target.value },
                    })
                  }
                  placeholder="Ej: Extrusión de 26 por ausencia de antagonista..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-bold text-navy mb-1">Lesiones de mucosa</label>
                <input
                  type="text"
                  value={formData.professional_exam.mucosa_lesions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      professional_exam: { ...formData.professional_exam, mucosa_lesions: e.target.value },
                    })
                  }
                  placeholder="Ej: Mucosa oral normocoloreada, sin lesiones aparentes..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-bold text-navy mb-1">Evaluación de oclusión</label>
                <input
                  type="text"
                  value={formData.professional_exam.occlusion_evaluation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      professional_exam: { ...formData.professional_exam, occlusion_evaluation: e.target.value },
                    })
                  }
                  placeholder="Ej: Clase I molar bilateral, overbite 30%, facetas de desgaste oclusal..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-bold text-navy mb-1">Dientes ausentes</label>
                <input
                  type="text"
                  value={formData.professional_exam.missing_teeth}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      professional_exam: { ...formData.professional_exam, missing_teeth: e.target.value },
                    })
                  }
                  placeholder="Ej: 18, 28, 36 (ausente no rehabilitado), 48..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block font-bold text-navy mb-1">Caries y restauraciones</label>
                <input
                  type="text"
                  value={formData.professional_exam.caries_restorations}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      professional_exam: { ...formData.professional_exam, caries_restorations: e.target.value },
                    })
                  }
                  placeholder="Ej: Caries oclusal en 17, obturación desajustada con margen desbordante en 25..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block font-bold text-navy mb-1">Radiografías / CBCT</label>
                <input
                  type="text"
                  value={formData.professional_exam.radiographs_cbct}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      professional_exam: { ...formData.professional_exam, radiographs_cbct: e.target.value },
                    })
                  }
                  placeholder="Ej: Serie periapical completa: pérdida ósea horizontal generalizada del 30%, defecto vertical angular en distal de 16..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3 bg-amber-50/70 p-4 rounded-xl border border-amber-200">
                <label className="block font-bold text-navy mb-1.5 text-sm">
                  Diagnóstico Clínico (Clasificación Periodontal EFP/AAP 2018)
                </label>
                <input
                  type="text"
                  value={formData.professional_exam.periodontal_diagnosis}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      professional_exam: {
                        ...formData.professional_exam,
                        periodontal_diagnosis: e.target.value,
                      },
                    })
                  }
                  placeholder="Ej: Periodontitis Estadio III, Grado B, Generalizada. Factor modificador: Fumador leve."
                  className="w-full px-3 py-2.5 rounded-lg border border-amber-300 bg-white font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block font-bold text-navy mb-1">Pronóstico</label>
                <input
                  type="text"
                  value={formData.professional_exam.prognosis}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      professional_exam: { ...formData.professional_exam, prognosis: e.target.value },
                    })
                  }
                  placeholder="Ej: Pronóstico general Favorable con buen cumplimiento; Diente 16 con pronóstico Reservado/Dudoso..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block font-bold text-navy mb-1.5">
                  Plan de Tratamiento Estructurado por Fases
                </label>
                <textarea
                  rows={5}
                  value={formData.professional_exam.treatment_plan}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      professional_exam: { ...formData.professional_exam, treatment_plan: e.target.value },
                    })
                  }
                  placeholder={`Fase I (Higiénica/Sistémica): Instrucción de higiene oral, raspado y alisado radicular (RAR) en 4 cuadrantes bajo anestesia local, eliminación de retentores de placa.\nFase II (Quirúrgica/Correctiva): Reevaluación a las 6-8 semanas. Cirugía de acceso periodontal o regenerativa en 16.\nFase III (Rehabilitadora): Restauración de piezas cariadas y rehabilitación protésica del diente ausente 36 con implante.\nFase IV (Mantenimiento): Terapia periodontal de soporte (SPT) cada 3 meses.`}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold font-sans"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Barra de Navegación de Secciones inferior */}
      <div className="flex items-center justify-between pt-2 font-montserrat">
        <button
          type="button"
          onClick={() => {
            const sections: Array<typeof activeSection> = [
              'anamnesis_1',
              'anamnesis_2',
              'anamnesis_3',
              'anamnesis_4',
              'anamnesis_5',
              'anamnesis_6',
              'professional',
            ]
            const idx = sections.indexOf(activeSection)
            if (idx > 0) setActiveSection(sections[idx - 1])
          }}
          disabled={activeSection === 'anamnesis_1'}
          className="px-4 py-2 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
        >
          ← Sección Anterior
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isCreating || isUpdating}
          className="px-6 py-2.5 bg-gold text-white text-xs font-semibold rounded-lg hover:bg-gold/90 transition-colors shadow-sm disabled:opacity-50"
        >
          {isCreating || isUpdating ? 'Guardando...' : 'Guardar Ficha del Paciente'}
        </button>

        <button
          type="button"
          onClick={() => {
            const sections: Array<typeof activeSection> = [
              'anamnesis_1',
              'anamnesis_2',
              'anamnesis_3',
              'anamnesis_4',
              'anamnesis_5',
              'anamnesis_6',
              'professional',
            ]
            const idx = sections.indexOf(activeSection)
            if (idx < sections.length - 1) setActiveSection(sections[idx + 1])
          }}
          disabled={activeSection === 'professional'}
          className="px-4 py-2 bg-navy text-white rounded-lg text-xs hover:bg-navy/90 disabled:opacity-40"
        >
          Siguiente Sección →
        </button>
      </div>
    </div>
  )
}
