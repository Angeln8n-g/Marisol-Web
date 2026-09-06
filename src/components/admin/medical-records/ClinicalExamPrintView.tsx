import React from 'react'
import type { PatientClinicalExamination, Patient } from '../../../types'

interface ClinicalExamPrintViewProps {
  examination: PatientClinicalExamination
  patient: Patient
  onClose?: () => void
}

export const ClinicalExamPrintView: React.FC<ClinicalExamPrintViewProps> = ({
  examination,
  patient,
  onClose,
}) => {
  const handlePrint = () => {
    window.print()
  }

  const {
    chief_complaint: cc,
    medical_history: mh,
    dental_history: dh,
    hygiene_habits: hh,
    periodontal_evaluation: pe,
    patient_perception: pp,
    professional_exam: px,
    exam_date,
    doctor_name,
  } = examination

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto font-montserrat text-gray-800 print:p-0 print:m-0 print:max-w-none">
      {/* Botones de acción no imprimibles */}
      <div className="print:hidden flex items-center justify-between pb-6 mb-6 border-b border-gray-200">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
        >
          ← Volver a la Edición
        </button>
        <button
          onClick={handlePrint}
          className="px-5 py-2 bg-navy text-gold text-sm font-semibold rounded-lg hover:bg-navy/90 flex items-center gap-2 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir Ficha Clínica
        </button>
      </div>

      {/* Encabezado Membretado */}
      <div className="border-b-2 border-gold pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-playfair font-bold text-navy">Dra. Marisol García</h1>
            <p className="text-xs uppercase tracking-widest text-gold font-semibold mt-0.5">
              Odontología Integral & Periodoncia Avanzada
            </p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>Fecha de Evaluación: {new Date(exam_date).toLocaleDateString()}</p>
            <p>Dr.(a): {doctor_name || 'Dra. Marisol García'}</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-gray-500 block">Paciente:</span>
            <span className="font-bold text-navy">{patient.full_name}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Identificación:</span>
            <span className="font-bold text-navy">{patient.identification_number || 'Sin cédula'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Teléfono:</span>
            <span className="font-bold text-navy">{patient.phone}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Seguro Médico / ARS:</span>
            <span className="font-bold text-navy">{patient.insurance_provider || 'Particular'}</span>
          </div>
        </div>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-lg font-playfair font-bold text-navy uppercase tracking-wider">
          FICHA DE EXAMEN CLÍNICO ODONTOLÓGICO Y PERIODONTAL
        </h2>
      </div>

      {/* SECCIÓN 1: MOTIVO DE CONSULTA */}
      <div className="mb-5 border border-gray-200 rounded-lg p-4">
        <h3 className="text-xs font-bold font-montserrat uppercase tracking-wider text-navy bg-gray-100 px-2 py-1 rounded mb-3">
          1. Motivo de Consulta
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <p className="font-semibold text-gray-700">¿Cuál es el motivo principal de su visita?</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded">{cc.reason || '—'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">¿Qué molestia o problema presenta actualmente?</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded">{cc.discomfort || '—'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">¿Desde cuándo lo presenta?</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded">{cc.duration || '—'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">¿Ha recibido algún tratamiento para este problema?</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded">{cc.previous_treatments || '—'}</p>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: ANTECEDENTES MÉDICOS */}
      <div className="mb-5 border border-gray-200 rounded-lg p-4">
        <h3 className="text-xs font-bold font-montserrat uppercase tracking-wider text-navy bg-gray-100 px-2 py-1 rounded mb-3">
          2. Antecedentes Médicos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <p className="font-semibold text-gray-700">¿Padece actualmente alguna enfermedad o condición médica?</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded">{mh.current_illnesses || 'Ninguna referida'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">¿Está tomando algún medicamento actualmente? ¿Cuál?</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded">{mh.medications || 'Ninguno'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">¿Es alérgico(a) a algún medicamento, alimento, látex u otra sustancia?</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded">{mh.allergies || 'Ninguna conocida'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">¿Ha sido hospitalizado(a) o sometido(a) a alguna cirugía?</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded">{mh.surgeries_hospitalizations || 'No refiere'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">¿Ha presentado problemas de sangrado o dificultad para cicatrizar?</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded">{mh.bleeding_healing_problems || 'No refiere'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">¿Ha tenido alguna reacción a la anestesia dental anteriormente?</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded">{mh.anesthesia_reactions || 'No refiere'}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="font-semibold text-gray-700">¿Está embarazada o existe posibilidad de embarazo?</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded">{mh.pregnancy_status || 'No aplica'}</p>
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: ANTECEDENTES ODONTOLÓGICOS */}
      <div className="mb-5 border border-gray-200 rounded-lg p-4">
        <h3 className="text-xs font-bold font-montserrat uppercase tracking-wider text-navy bg-gray-100 px-2 py-1 rounded mb-3">
          3. Antecedentes Odontológicos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <p className="font-semibold text-gray-700">¿Cuándo fue su última visita al dentista?</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded">{dh.last_dental_visit || '—'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">¿Ha tenido anteriormente enfermedad de las encías o tratamiento periodontal?</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded">{dh.gum_disease_history || 'No refiere'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">¿Ha recibido raspado y alisado radicular?</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded">{dh.scaling_root_planing || 'No'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">¿Ha tenido extracciones, cirugías, implantes o injertos?</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded">{dh.surgeries_implants_grafts || 'No refiere'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">¿Tiene actualmente algún tratamiento odontológico pendiente?</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded">{dh.pending_treatments || 'No'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">¿Ha presentado dolor, sangrado de las encías, movilidad dental o sensibilidad?</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded">{dh.pain_bleeding_mobility_sensitivity || 'No'}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="font-semibold text-gray-700">¿Siente que algún diente se ha movido o cambiado de posición?</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded">{dh.teeth_migration || 'No'}</p>
          </div>
        </div>
      </div>

      {/* SECCIÓN 4: HIGIENE Y HÁBITOS */}
      <div className="mb-5 border border-gray-200 rounded-lg p-4">
        <h3 className="text-xs font-bold font-montserrat uppercase tracking-wider text-navy bg-gray-100 px-2 py-1 rounded mb-3">
          4. Higiene y Hábitos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <p className="font-semibold text-gray-700">Frecuencia cepillado/día:</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded">{hh.brushing_frequency || '—'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Hilo dental / Interproximales:</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded">{hh.floss_interdental || '—'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Enjuague bucal:</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded">{hh.mouthwash || '—'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Tabaco / Fuma:</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded">{hh.tobacco_use || 'No'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Consumo de alcohol:</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded">{hh.alcohol_consumption || 'No / Ocasional'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Bruxismo / Apretar dientes:</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded">{hh.bruxism_parafunctions || 'No'}</p>
          </div>
        </div>
      </div>

      {/* SECCIÓN 5: EVALUACIÓN PERIODONTAL */}
      <div className="mb-5 border border-amber-200 bg-amber-50/30 rounded-lg p-4">
        <h3 className="text-xs font-bold font-montserrat uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-1 rounded mb-3">
          5. Evaluación Periodontal (Interrogatorio Especializado)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <p className="font-semibold text-gray-700">¿Le sangran las encías al cepillarse o espontáneamente?</p>
            <p className="text-gray-900 mt-0.5 bg-white p-2 rounded border border-gray-200">{pe.gum_bleeding || '—'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">¿Encías con aumento de tamaño, cambio de color o retraídas?</p>
            <p className="text-gray-900 mt-0.5 bg-white p-2 rounded border border-gray-200">{pe.gum_changes || '—'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">¿Ha notado mal aliento persistente?</p>
            <p className="text-gray-900 mt-0.5 bg-white p-2 rounded border border-gray-200">{pe.persistent_halitosis || '—'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">¿Ha observado pus o secreción alrededor de algún diente?</p>
            <p className="text-gray-900 mt-0.5 bg-white p-2 rounded border border-gray-200">{pe.pus_secretion || '—'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">¿Ha sentido movilidad en algún diente?</p>
            <p className="text-gray-900 mt-0.5 bg-white p-2 rounded border border-gray-200">{pe.tooth_mobility || '—'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">¿Dientes separados o cambiados de posición?</p>
            <p className="text-gray-900 mt-0.5 bg-white p-2 rounded border border-gray-200">{pe.teeth_spacing || '—'}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="font-semibold text-gray-700">¿Antecedentes familiares de pérdida de dientes por enfermedad periodontal?</p>
            <p className="text-gray-900 mt-0.5 bg-white p-2 rounded border border-gray-200">{pe.family_history_periodontal || '—'}</p>
          </div>
        </div>
      </div>

      {/* SECCIÓN 6: PERCEPCIÓN DEL PACIENTE */}
      <div className="mb-5 border border-gray-200 rounded-lg p-4">
        <h3 className="text-xs font-bold font-montserrat uppercase tracking-wider text-navy bg-gray-100 px-2 py-1 rounded mb-3">
          6. Percepción del Paciente
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <p className="font-semibold text-gray-700">Expectativas del tratamiento:</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded">{pp.treatment_expectations || '—'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Zonas de mayor preocupación:</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded">{pp.areas_of_concern || '—'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Aspecto de su sonrisa a mejorar:</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded">{pp.smile_improvements || '—'}</p>
          </div>
        </div>
      </div>

      {/* SECCIÓN 7: EXAMEN CLÍNICO DEL PROFESIONAL */}
      <div className="mb-6 border-2 border-navy rounded-lg p-4 bg-white">
        <h3 className="text-xs font-bold font-montserrat uppercase tracking-wider text-white bg-navy px-3 py-1.5 rounded mb-4">
          PARA EL EXAMEN CLÍNICO DEL PROFESIONAL
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div>
            <p className="font-bold text-gray-700">Higiene oral y placa:</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded border border-gray-200">{px.oral_hygiene_plaque || '—'}</p>
          </div>
          <div>
            <p className="font-bold text-gray-700">Cálculo dental:</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded border border-gray-200">{px.dental_calculus || '—'}</p>
          </div>
          <div>
            <p className="font-bold text-gray-700">Estado de las encías:</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded border border-gray-200">{px.gum_status || '—'}</p>
          </div>
          <div>
            <p className="font-bold text-gray-700">Sangrado al sondaje:</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded border border-gray-200">{px.bleeding_on_probing || '—'}</p>
          </div>
          <div>
            <p className="font-bold text-gray-700">Profundidad de sondaje:</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded border border-gray-200">{px.probing_depth_summary || '—'}</p>
          </div>
          <div>
            <p className="font-bold text-gray-700">Nivel de inserción clínica (NIC):</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded border border-gray-200">{px.clinical_attachment_level || '—'}</p>
          </div>
          <div>
            <p className="font-bold text-gray-700">Recesiones:</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded border border-gray-200">{px.recessions || '—'}</p>
          </div>
          <div>
            <p className="font-bold text-gray-700">Movilidad dental:</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded border border-gray-200">{px.tooth_mobility || '—'}</p>
          </div>
          <div>
            <p className="font-bold text-gray-700">Compromiso de furcaciones:</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded border border-gray-200">{px.furcation_involvement || '—'}</p>
          </div>
          <div>
            <p className="font-bold text-gray-700">Supuración:</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded border border-gray-200">{px.suppuration || '—'}</p>
          </div>
          <div>
            <p className="font-bold text-gray-700">Migración dental:</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded border border-gray-200">{px.dental_migration || '—'}</p>
          </div>
          <div>
            <p className="font-bold text-gray-700">Lesiones de mucosa:</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded border border-gray-200">{px.mucosa_lesions || '—'}</p>
          </div>
          <div>
            <p className="font-bold text-gray-700">Evaluación de oclusión:</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded border border-gray-200">{px.occlusion_evaluation || '—'}</p>
          </div>
          <div>
            <p className="font-bold text-gray-700">Dientes ausentes:</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded border border-gray-200">{px.missing_teeth || '—'}</p>
          </div>
          <div>
            <p className="font-bold text-gray-700">Caries y restauraciones:</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded border border-gray-200">{px.caries_restorations || '—'}</p>
          </div>
          <div className="sm:col-span-3">
            <p className="font-bold text-gray-700">Radiografías / CBCT:</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded border border-gray-200">{px.radiographs_cbct || '—'}</p>
          </div>
          <div className="sm:col-span-3">
            <p className="font-bold text-navy">Diagnóstico Periodontal / Odontológico:</p>
            <p className="text-navy font-semibold mt-0.5 bg-amber-50/50 p-2.5 rounded border border-amber-200">{px.periodontal_diagnosis || '—'}</p>
          </div>
          <div className="sm:col-span-3">
            <p className="font-bold text-gray-700">Pronóstico:</p>
            <p className="text-gray-900 mt-0.5 bg-gray-50 p-2 rounded border border-gray-200">{px.prognosis || '—'}</p>
          </div>
          <div className="sm:col-span-3">
            <p className="font-bold text-navy">Plan de Tratamiento:</p>
            <p className="text-gray-900 whitespace-pre-line mt-0.5 bg-gray-50 p-2.5 rounded border border-gray-200 font-sans">{px.treatment_plan || '—'}</p>
          </div>
        </div>
      </div>

      {/* Firmas */}
      <div className="pt-8 border-t border-gray-200 grid grid-cols-2 gap-8 text-center text-xs mt-10">
        <div>
          <div className="w-48 mx-auto border-b border-gray-400 pb-1 mb-2 h-12 flex items-end justify-center font-playfair italic text-navy">
            {doctor_name || 'Dra. Marisol García'}
          </div>
          <p className="font-bold text-navy">Firma Odontólogo(a) / Periodoncista</p>
          <p className="text-gray-500 text-[10px]">Colegiatura / Exeq. Médica</p>
        </div>
        <div>
          <div className="w-48 mx-auto border-b border-gray-400 pb-1 mb-2 h-12 flex items-end justify-center font-montserrat text-gray-600">
            {patient.full_name}
          </div>
          <p className="font-bold text-navy">Firma del Paciente / Tutor</p>
          <p className="text-gray-500 text-[10px]">Doc: {patient.identification_number || 'N/A'}</p>
        </div>
      </div>
    </div>
  )
}
