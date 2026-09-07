import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { PatientMedicalHistory } from '../../../types'

const patientSchema = z.object({
  full_name: z.string().min(1, 'El nombre completo es requerido').max(200),
  phone: z.string().min(1, 'El teléfono es requerido').regex(
    /^(\+?1)?[\s.-]?\(?([2-9]\d{2})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})$/,
    'Ingresa un número de teléfono válido (ej. 809-555-1234)'
  ),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
  birth_date: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  identification_type: z.enum(['cedula', 'passport', 'rnc', 'other']).default('cedula'),
  identification_number: z.string().max(50).optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  occupation: z.string().max(100).optional(),
  civil_status: z.enum(['single', 'married', 'divorced', 'widowed', 'other']).optional(),
  emergency_contact_name: z.string().max(150).optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().max(50).optional(),
  insurance_provider: z.string().max(100).optional(),
  insurance_card_number: z.string().max(50).optional(),
  medical_alerts: z.string().max(500).optional(),

  // Anamnesis / Antecedentes Médicos
  medical_history: z.object({
    hypertension: z.boolean().default(false),
    diabetes: z.boolean().default(false),
    heart_disease: z.boolean().default(false),
    asthma: z.boolean().default(false),
    hepatitis: z.boolean().default(false),
    allergies_penicillin: z.boolean().default(false),
    allergies_latex: z.boolean().default(false),
    allergies_anesthesia: z.boolean().default(false),
    allergies_other: z.string().optional(),
    current_medications: z.string().optional(),
    previous_surgeries: z.string().optional(),
    is_pregnant: z.boolean().default(false),
    is_breastfeeding: z.boolean().default(false),
    smoker: z.boolean().default(false),
    alcohol: z.boolean().default(false),
    bruxism: z.boolean().default(false),
    notes: z.string().optional(),
  }).default({}),
})

export type PatientFormValues = z.infer<typeof patientSchema>

interface PatientFormProps {
  onSubmit: (data: PatientFormValues) => Promise<void>
  isSubmitting?: boolean
  defaultValues?: Partial<Omit<PatientFormValues, 'medical_history'>> & {
    medical_history?: Partial<PatientMedicalHistory>
  }
  onCancel?: () => void
}

const insuranceProviders = [
  'Particular / Sin Seguro',
  'Primera ARS de Humano',
  'ARS Humano',
  'ARS Palic / Mapfre Salud',
  'ARS Senasa Contributivo',
  'ARS Senasa Subsidiado',
  'ARS Universal',
  'ARS Monumental',
  'ARS Simag',
  'Seguro Internacional / Otro',
]

export const PatientForm: React.FC<PatientFormProps> = ({
  onSubmit,
  isSubmitting = false,
  defaultValues,
  onCancel,
}) => {
  const [activeTab, setActiveTab] = useState<'personal' | 'contact' | 'insurance' | 'anamnesis'>('personal')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      birth_date: '',
      gender: undefined,
      identification_type: 'cedula',
      identification_number: '',
      address: '',
      city: 'Santo Domingo',
      province: 'Distrito Nacional',
      occupation: '',
      civil_status: undefined,
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relationship: '',
      insurance_provider: '',
      insurance_card_number: '',
      medical_alerts: '',
      medical_history: {
        hypertension: false,
        diabetes: false,
        heart_disease: false,
        asthma: false,
        hepatitis: false,
        allergies_penicillin: false,
        allergies_latex: false,
        allergies_anesthesia: false,
        allergies_other: '',
        current_medications: '',
        previous_surgeries: '',
        is_pregnant: false,
        is_breastfeeding: false,
        smoker: false,
        alcohol: false,
        bruxism: false,
        notes: '',
        ...defaultValues?.medical_history,
      },
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Pestañas de Navegación del Formulario */}
      <div className="flex border-b border-gray-200 overflow-x-auto gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('personal')}
          className={`pb-3 px-4 text-sm font-montserrat font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'personal'
              ? 'border-gold text-navy font-semibold'
              : 'border-transparent text-gray-500 hover:text-navy hover:border-gray-300'
          }`}
        >
          1. Datos Personales
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('contact')}
          className={`pb-3 px-4 text-sm font-montserrat font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'contact'
              ? 'border-gold text-navy font-semibold'
              : 'border-transparent text-gray-500 hover:text-navy hover:border-gray-300'
          }`}
        >
          2. Contacto y Emergencia
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('insurance')}
          className={`pb-3 px-4 text-sm font-montserrat font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'insurance'
              ? 'border-gold text-navy font-semibold'
              : 'border-transparent text-gray-500 hover:text-navy hover:border-gray-300'
          }`}
        >
          3. Seguro Médico / ARS
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('anamnesis')}
          className={`pb-3 px-4 text-sm font-montserrat font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'anamnesis'
              ? 'border-gold text-navy font-semibold'
              : 'border-transparent text-gray-500 hover:text-navy hover:border-gray-300'
          }`}
        >
          <span>4. Triage & Alertas de Salud</span>
          <span className="w-2 h-2 rounded-full bg-red-500" />
        </button>
      </div>

      {/* Tab 1: Datos Personales */}
      {activeTab === 'personal' && (
        <div className="space-y-4 animate-fadeIn">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-navy mb-1.5">
              Nombre Completo *
            </label>
            <input
              id="full_name"
              type="text"
              placeholder="ej. Carlos Alberto Gómez Martínez"
              {...register('full_name')}
              className={`w-full px-3.5 py-2.5 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold ${
                errors.full_name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="identification_type" className="block text-sm font-medium text-navy mb-1.5">
                Tipo de Documento
              </label>
              <select
                id="identification_type"
                {...register('identification_type')}
                className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <option value="cedula">Cédula de Identidad</option>
                <option value="passport">Pasaporte</option>
                <option value="rnc">RNC</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <div>
              <label htmlFor="identification_number" className="block text-sm font-medium text-navy mb-1.5">
                Número de Documento
              </label>
              <input
                id="identification_number"
                type="text"
                placeholder="402-1234567-8"
                {...register('identification_number')}
                className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="birth_date" className="block text-sm font-medium text-navy mb-1.5">
                Fecha de Nacimiento
              </label>
              <input
                id="birth_date"
                type="date"
                {...register('birth_date')}
                className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-navy mb-1.5">
                Género
              </label>
              <select
                id="gender"
                {...register('gender')}
                className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <option value="">Seleccionar</option>
                <option value="female">Femenino</option>
                <option value="male">Masculino</option>
                <option value="other">Otro</option>
                <option value="prefer_not_to_say">Prefiero no especificar</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="occupation" className="block text-sm font-medium text-navy mb-1.5">
                Ocupación / Profesión
              </label>
              <input
                id="occupation"
                type="text"
                placeholder="ej. Docente, Ingeniero, Estudiante"
                {...register('occupation')}
                className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>

            <div>
              <label htmlFor="civil_status" className="block text-sm font-medium text-navy mb-1.5">
                Estado Civil
              </label>
              <select
                id="civil_status"
                {...register('civil_status')}
                className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <option value="">Seleccionar</option>
                <option value="single">Soltero(a)</option>
                <option value="married">Casado(a)</option>
                <option value="divorced">Divorciado(a)</option>
                <option value="widowed">Viudo(a)</option>
                <option value="other">Unión Libre</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Contacto y Dirección */}
      {activeTab === 'contact' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-navy mb-1.5">
                Teléfono Principal / WhatsApp *
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="809-555-1234"
                {...register('phone')}
                className={`w-full px-3.5 py-2.5 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-navy mb-1.5">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                placeholder="ejemplo@correo.com"
                {...register('email')}
                className={`w-full px-3.5 py-2.5 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gold ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-navy mb-1.5">
              Dirección Residencial
            </label>
            <input
              id="address"
              type="text"
              placeholder="Calle, Número, Edificio, Apto."
              {...register('address')}
              className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-navy mb-1.5">
                Ciudad / Municipio
              </label>
              <input
                id="city"
                type="text"
                placeholder="Santo Domingo"
                {...register('city')}
                className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>

            <div>
              <label htmlFor="province" className="block text-sm font-medium text-navy mb-1.5">
                Provincia / Sector
              </label>
              <input
                id="province"
                type="text"
                placeholder="Distrito Nacional / Piantini"
                {...register('province')}
                className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
          </div>

          {/* Contacto de Emergencia */}
          <div className="p-4 bg-sand/30 rounded-lg border border-gold/30 space-y-3 mt-4">
            <h4 className="text-xs font-bold text-navy font-montserrat uppercase tracking-wider">
              🚨 Contacto en Caso de Emergencia
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="emergency_contact_name" className="block text-xs font-medium text-navy mb-1">
                  Nombre del Contacto
                </label>
                <input
                  id="emergency_contact_name"
                  type="text"
                  placeholder="ej. María Gómez"
                  {...register('emergency_contact_name')}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label htmlFor="emergency_contact_phone" className="block text-xs font-medium text-navy mb-1">
                  Teléfono de Emergencia
                </label>
                <input
                  id="emergency_contact_phone"
                  type="tel"
                  placeholder="809-555-5678"
                  {...register('emergency_contact_phone')}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label htmlFor="emergency_contact_relationship" className="block text-xs font-medium text-navy mb-1">
                  Parentesco / Relación
                </label>
                <input
                  id="emergency_contact_relationship"
                  type="text"
                  placeholder="Cónyuge, Madre, Hermano..."
                  {...register('emergency_contact_relationship')}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Seguro Médico / ARS */}
      {activeTab === 'insurance' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="insurance_provider" className="block text-sm font-medium text-navy mb-1.5">
                Aseguradora / ARS
              </label>
              <select
                id="insurance_provider"
                {...register('insurance_provider')}
                className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <option value="">Selecciona una ARS</option>
                {insuranceProviders.map((ars) => (
                  <option key={ars} value={ars}>{ars}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="insurance_card_number" className="block text-sm font-medium text-navy mb-1.5">
                Número de Afiliado / Carnet
              </label>
              <input
                id="insurance_card_number"
                type="text"
                placeholder="Número de carnet de la ARS"
                {...register('insurance_card_number')}
                className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 font-montserrat">
            💡 <strong>Nota:</strong> Los datos del seguro se utilizarán automáticamente en la facturación y generación de reclamaciones para coberturas odontológicas.
          </div>
        </div>
      )}

      {/* Tab 4: Triage & Alertas de Salud */}
      {activeTab === 'anamnesis' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Banner explicativo de integración con el Historial Clínico */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 font-montserrat flex items-start gap-2.5 shadow-2xs">
            <span className="text-base flex-shrink-0">💡</span>
            <div>
              <strong>Triage Inicial de Admisión:</strong> Esta información activa de inmediato el semáforo de seguridad clínica y <strong>se transferirá automáticamente a la Ficha Clínica Odontológica</strong> del doctor, evitando tener que volver a interrogar al paciente sobre estos mismos datos en consulta.
            </div>
          </div>

          {/* Alertas Médicas Críticas */}
          <div>
            <label htmlFor="medical_alerts" className="block text-sm font-bold text-red-700 mb-1 flex items-center gap-1.5">
              <span>⚠️ Alertas Médicas Destacadas</span>
              <span className="text-xs font-normal text-gray-500">(Visible prominentemente en la ficha clínica)</span>
            </label>
            <textarea
              id="medical_alerts"
              rows={2}
              {...register('medical_alerts')}
              placeholder="Alergias graves a fármacos, afecciones cardíacas, uso de marcapasos, etc."
              className="w-full px-3.5 py-2 rounded-md border border-red-300 bg-red-50/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Antecedentes Sistémicos */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-navy font-montserrat uppercase tracking-wider">
              Enfermedades Sistémicas Preexistentes
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-montserrat">
              <label className="flex items-center gap-2 p-2 rounded border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" {...register('medical_history.hypertension')} className="rounded text-gold focus:ring-gold" />
                <span>Hipertensión Arterial</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" {...register('medical_history.diabetes')} className="rounded text-gold focus:ring-gold" />
                <span>Diabetes</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" {...register('medical_history.heart_disease')} className="rounded text-gold focus:ring-gold" />
                <span>Enfermedad Cardíaca</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" {...register('medical_history.asthma')} className="rounded text-gold focus:ring-gold" />
                <span>Asma / Respiratorio</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" {...register('medical_history.hepatitis')} className="rounded text-gold focus:ring-gold" />
                <span>Hepatitis / Hepático</span>
              </label>
            </div>
          </div>

          {/* Alergias */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-navy font-montserrat uppercase tracking-wider">
              Alergias a Medicamentos o Materiales
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-montserrat">
              <label className="flex items-center gap-2 p-2 rounded border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" {...register('medical_history.allergies_penicillin')} className="rounded text-gold focus:ring-gold" />
                <span>Penicilina / Antibióticos</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" {...register('medical_history.allergies_latex')} className="rounded text-gold focus:ring-gold" />
                <span>Látex</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" {...register('medical_history.allergies_anesthesia')} className="rounded text-gold focus:ring-gold" />
                <span>Anestésicos Locales</span>
              </label>
            </div>
            <div>
              <input
                type="text"
                placeholder="Otras alergias conocidas..."
                {...register('medical_history.allergies_other')}
                className="w-full px-3 py-2 rounded-md border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
          </div>

          {/* Medicación y Hábitos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-navy mb-1">
                Medicamentos que toma actualmente
              </label>
              <textarea
                rows={2}
                placeholder="Anticoagulantes, aspirina, antihipertensivos..."
                {...register('medical_history.current_medications')}
                className="w-full px-3 py-2 rounded-md border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-navy mb-1">
                Cirugías previas u hospitalizaciones
              </label>
              <textarea
                rows={2}
                placeholder="Detalle de procedimientos quirúrgicos previos..."
                {...register('medical_history.previous_surgeries')}
                className="w-full px-3 py-2 rounded-md border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
          </div>

          {/* Estado Fisiológico y Hábitos */}
          <div className="flex flex-wrap gap-4 text-xs font-montserrat pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('medical_history.is_pregnant')} className="rounded text-gold focus:ring-gold" />
              <span>Embarazada</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('medical_history.is_breastfeeding')} className="rounded text-gold focus:ring-gold" />
              <span>Lactancia</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('medical_history.smoker')} className="rounded text-gold focus:ring-gold" />
              <span>Fumador</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('medical_history.alcohol')} className="rounded text-gold focus:ring-gold" />
              <span>Alcohol habitual</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('medical_history.bruxism')} className="rounded text-gold focus:ring-gold" />
              <span>Bruxismo (aprieta dientes)</span>
            </label>
          </div>
        </div>
      )}

      {/* Acciones de Guardar y Cancelar */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex gap-2">
          {activeTab !== 'personal' && (
            <button
              type="button"
              onClick={() => {
                const tabs: Array<'personal' | 'contact' | 'insurance' | 'anamnesis'> = ['personal', 'contact', 'insurance', 'anamnesis']
                const prevIdx = tabs.indexOf(activeTab) - 1
                if (prevIdx >= 0) setActiveTab(tabs[prevIdx])
              }}
              className="px-3.5 py-2 text-xs font-montserrat text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ← Anterior
            </button>
          )}
          {activeTab !== 'anamnesis' && (
            <button
              type="button"
              onClick={() => {
                const tabs: Array<'personal' | 'contact' | 'insurance' | 'anamnesis'> = ['personal', 'contact', 'insurance', 'anamnesis']
                const nextIdx = tabs.indexOf(activeTab) + 1
                if (nextIdx < tabs.length) setActiveTab(tabs[nextIdx])
              }}
              className="px-3.5 py-2 text-xs font-montserrat text-navy bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Siguiente Sección →
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gold text-white text-sm font-semibold rounded-md hover:bg-gold/90 transition-colors disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Ficha del Paciente'}
          </button>
        </div>
      </div>
    </form>
  )
}
