import React, { useState, useEffect } from 'react'
import type { InventoryItem, Clinic, SterilePackageType, SterilizationCycleProgram, BiologicalIndicatorStatus } from '../../../types'

interface PackageItemForm {
  description: string
  item_id?: string
  package_type: SterilePackageType
  expiration_days: number
  notes?: string
}

interface SterilizationCycleModalProps {
  isOpen: boolean
  onClose: () => void
  clinics: Clinic[]
  defaultClinicId?: string
  autoclaves: InventoryItem[]
  rotaryTools: InventoryItem[]
  onSave: (payload: {
    clinic_id?: string | null
    autoclave_item_id?: string | null
    autoclave_name: string
    cycle_date: string
    start_time?: string | null
    end_time?: string | null
    temperature_c: number
    pressure_bar: number
    exposure_time_minutes: number
    drying_time_minutes: number
    cycle_program: SterilizationCycleProgram
    operator_name: string
    chemical_indicator_passed: boolean
    biological_indicator_status: BiologicalIndicatorStatus
    biological_indicator_lot?: string | null
    notes?: string | null
    packages: Array<{
      description: string
      item_id?: string | null
      package_type: SterilePackageType
      expiration_days: number
      notes?: string | null
    }>
  }) => Promise<void>
  isSaving: boolean
}

export const SterilizationCycleModal: React.FC<SterilizationCycleModalProps> = ({
  isOpen,
  onClose,
  clinics,
  defaultClinicId,
  autoclaves,
  rotaryTools,
  onSave,
  isSaving,
}) => {
  const [clinicId, setClinicId] = useState(defaultClinicId || '')
  const [autoclaveId, setAutoclaveId] = useState('')
  const [autoclaveName, setAutoclaveName] = useState('Autoclave Clase B 18L')
  const [cycleDate, setCycleDate] = useState(new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState('08:30')
  const [endTime, setEndTime] = useState('09:15')
  const [program, setProgram] = useState<SterilizationCycleProgram>('instrumental_empaquetado')
  const [temperature, setTemperature] = useState(134.0)
  const [pressure, setPressure] = useState(2.15)
  const [exposureTime, setExposureTime] = useState(18)
  const [dryingTime, setDryingTime] = useState(15)
  const [operatorName, setOperatorName] = useState('Lic. Carmen Rosario (Asistente Dental)')
  const [chemicalPassed, setChemicalPassed] = useState(true)
  const [biologicalStatus, setBiologicalStatus] = useState<BiologicalIndicatorStatus>('not_applied')
  const [biologicalLot, setBiologicalLot] = useState('')
  const [cycleNotes, setCycleNotes] = useState('')
  const [packages, setPackages] = useState<PackageItemForm[]>([])

  useEffect(() => {
    if (!isOpen) return

    setClinicId(defaultClinicId || (clinics[0]?.id || ''))
    setCycleDate(new Date().toISOString().split('T')[0])

    if (autoclaves.length > 0) {
      setAutoclaveId(autoclaves[0].id)
      setAutoclaveName(autoclaves[0].name)
    }

    // Default package list
    setPackages([
      {
        description: 'Kit de Diagnóstico y Exploración #1',
        package_type: 'pouch',
        expiration_days: 30,
      },
      {
        description: 'Turbina de Alta Velocidad LED #1',
        item_id: rotaryTools[0]?.id || undefined,
        package_type: 'pouch',
        expiration_days: 30,
        notes: 'Pre-lubricada',
      },
      {
        description: 'Bandeja Quirúrgica de Extracción e Implantes',
        package_type: 'cassette',
        expiration_days: 30,
      },
    ])
  }, [isOpen, defaultClinicId, clinics, autoclaves, rotaryTools])

  if (!isOpen) return null

  const handleProgramChange = (prog: SterilizationCycleProgram) => {
    setProgram(prog)
    if (prog === 'instrumental_empaquetado') {
      setTemperature(134.0)
      setPressure(2.15)
      setExposureTime(18)
      setDryingTime(15)
    } else if (prog === 'instrumental_libre') {
      setTemperature(134.0)
      setPressure(2.15)
      setExposureTime(5)
      setDryingTime(10)
    } else if (prog === 'textiles_gomas') {
      setTemperature(121.0)
      setPressure(1.15)
      setExposureTime(30)
      setDryingTime(15)
    } else if (prog === 'prion') {
      setTemperature(134.0)
      setPressure(2.15)
      setExposureTime(25)
      setDryingTime(20)
    }
  }

  const handleAddPackage = () => {
    setPackages((prev) => [
      ...prev,
      {
        description: `Bolsa Instrumental #${prev.length + 1}`,
        package_type: 'pouch',
        expiration_days: 30,
      },
    ])
  }

  const handleRemovePackage = (index: number) => {
    setPackages((prev) => prev.filter((_, i) => i !== index))
  }

  const handlePackageChange = (index: number, field: keyof PackageItemForm, value: any) => {
    setPackages((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!operatorName.trim()) {
      alert('Por favor indica el nombre del operador o asistente responsable.')
      return
    }
    if (packages.length === 0) {
      alert('Debes registrar al menos un paquete o instrumental en este ciclo.')
      return
    }

    await onSave({
      clinic_id: clinicId || null,
      autoclave_item_id: autoclaveId || null,
      autoclave_name: autoclaveName.trim(),
      cycle_date: cycleDate,
      start_time: startTime || null,
      end_time: endTime || null,
      temperature_c: temperature,
      pressure_bar: pressure,
      exposure_time_minutes: exposureTime,
      drying_time_minutes: dryingTime,
      cycle_program: program,
      operator_name: operatorName.trim(),
      chemical_indicator_passed: chemicalPassed,
      biological_indicator_status: biologicalStatus,
      biological_indicator_lot: biologicalLot.trim() || null,
      notes: cycleNotes.trim() || null,
      packages,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs font-montserrat overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-gray-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-lg">
              🛡️
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-playfair font-bold text-navy">
                Registrar Ciclo de Esterilización en Autoclave
              </h3>
              <p className="text-xs text-gray-500">
                Control estricto de bioseguridad, parámetros físicos, testigos químicos y código de lote
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Machine & Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-navy mb-1">
                Autoclave / Esterilizador *
              </label>
              {autoclaves.length > 0 ? (
                <select
                  value={autoclaveId}
                  onChange={(e) => {
                    setAutoclaveId(e.target.value)
                    const found = autoclaves.find((a) => a.id === e.target.value)
                    if (found) setAutoclaveName(found.name)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none bg-white"
                >
                  {autoclaves.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.brand || 'S/M'})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={autoclaveName}
                  onChange={(e) => setAutoclaveName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none"
                />
              )}
            </div>

            <div>
              <label className="block font-semibold text-navy mb-1">Fecha del Ciclo *</label>
              <input
                type="date"
                required
                value={cycleDate}
                onChange={(e) => setCycleDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-navy mb-1">Horario (Inicio / Fin)</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-xl text-xs"
                />
                <span>-</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* Program & Cycle Parameters */}
          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-navy uppercase tracking-wider text-[11px]">
                Parámetros Físicos del Ciclo
              </span>
              <div className="flex items-center gap-1">
                {(
                  [
                    { id: 'instrumental_empaquetado', label: '134°C Empaquetado' },
                    { id: 'instrumental_libre', label: '134°C Flash / Libre' },
                    { id: 'textiles_gomas', label: '121°C Textiles / Gomas' },
                    { id: 'prion', label: 'Priones (25 min)' },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleProgramChange(p.id)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      program === p.id
                        ? 'bg-teal-700 text-white shadow-2xs'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Temperatura (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-xl font-bold text-navy"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Presión (bar)</label>
                <input
                  type="number"
                  step="0.01"
                  value={pressure}
                  onChange={(e) => setPressure(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-xl font-bold text-navy"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Tiempo Meseta (min)</label>
                <input
                  type="number"
                  value={exposureTime}
                  onChange={(e) => setExposureTime(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-xl font-bold text-navy"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Secado al Vacío (min)</label>
                <input
                  type="number"
                  value={dryingTime}
                  onChange={(e) => setDryingTime(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-xl font-bold text-navy"
                />
              </div>
            </div>
          </div>

          {/* Chemical & Biological Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pt-1">
            {/* Chemical Test Toggle */}
            <div className="p-3 bg-white border border-gray-200 rounded-2xl flex items-center justify-between shadow-2xs">
              <div>
                <div className="font-semibold text-navy">Indicador Químico (Viraje)</div>
                <div className="text-[10px] text-gray-500">
                  {chemicalPassed ? 'Cinta/tira virada a negro (Aprobado)' : 'Viraje incompleto (Fallido)'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChemicalPassed(!chemicalPassed)}
                className={`w-12 h-6 rounded-full p-0.5 transition-colors flex items-center ${
                  chemicalPassed ? 'bg-emerald-500 justify-end' : 'bg-red-400 justify-start'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white shadow-md block" />
              </button>
            </div>

            {/* Biological Indicator Status */}
            <div>
              <label className="block font-semibold text-navy mb-1">Test Biológico (Esporas)</label>
              <select
                value={biologicalStatus}
                onChange={(e) => setBiologicalStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none bg-white"
              >
                <option value="not_applied">No aplicado en este ciclo</option>
                <option value="pending">En Incubación (24h/48h)</option>
                <option value="passed">Negativo a Esporas (Aprobado ✓)</option>
                <option value="failed">Positivo a Esporas (Fallido ✕)</option>
              </select>
            </div>

            {/* Operator Name */}
            <div>
              <label className="block font-semibold text-navy mb-1">
                Operador / Asistente Responsable *
              </label>
              <input
                type="text"
                required
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="Nombre del profesional"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none"
              />
            </div>
          </div>

          {/* Biological Lot & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-semibold text-navy mb-1">
                Lote de Indicador Biológico (si aplica)
              </label>
              <input
                type="text"
                value={biologicalLot}
                onChange={(e) => setBiologicalLot(e.target.value)}
                placeholder="ej. BIO-3M-2026-W36"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-navy mb-1">
                Observaciones del Ciclo
              </label>
              <input
                type="text"
                value={cycleNotes}
                onChange={(e) => setCycleNotes(e.target.value)}
                placeholder="ej. Carga completa; mantenimiento preventivo al día"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none"
              />
            </div>
          </div>

          {/* Packages List */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="font-bold text-navy uppercase tracking-wider text-[11px]">
                Instrumental y Bolsas en la Cámara ({packages.length})
              </span>
              <button
                type="button"
                onClick={handleAddPackage}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 transition-colors flex items-center gap-1"
              >
                + Agregar otro paquete
              </button>
            </div>

            <div className="max-h-52 overflow-y-auto border border-gray-200 rounded-2xl divide-y divide-gray-100">
              {packages.map((pkg, idx) => (
                <div key={idx} className="p-3 grid grid-cols-12 gap-2 items-center text-xs bg-gray-50/50 hover:bg-white transition-colors">
                  {/* Package description */}
                  <div className="col-span-12 sm:col-span-6">
                    <input
                      type="text"
                      required
                      value={pkg.description}
                      onChange={(e) => handlePackageChange(idx, 'description', e.target.value)}
                      placeholder="ej. Kit Exploración #2 / Turbina Kavo"
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-xl text-xs"
                    />
                  </div>

                  {/* Presentation Type */}
                  <div className="col-span-6 sm:col-span-3">
                    <select
                      value={pkg.package_type}
                      onChange={(e) => handlePackageChange(idx, 'package_type', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-xl text-xs bg-white"
                    >
                      <option value="pouch">Bolsa Autosellable (Pouch)</option>
                      <option value="cassette">Casete Quirúrgico Perforado</option>
                      <option value="container">Contenedor Rígido con Filtro</option>
                      <option value="wrap">Envoltorio Quirúrgico Grado Médico</option>
                    </select>
                  </div>

                  {/* Expiration days */}
                  <div className="col-span-4 sm:col-span-2">
                    <select
                      value={pkg.expiration_days}
                      onChange={(e) => handlePackageChange(idx, 'expiration_days', Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-xl text-xs bg-white text-center"
                    >
                      <option value={30}>30 días</option>
                      <option value={60}>60 días</option>
                      <option value={180}>6 meses (Doble barrera)</option>
                    </select>
                  </div>

                  {/* Delete button */}
                  <div className="col-span-2 sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemovePackage(idx)}
                      disabled={packages.length <= 1}
                      className="w-6 h-6 rounded-lg text-red-400 hover:text-red-700 hover:bg-red-50 flex items-center justify-center transition-colors disabled:opacity-30"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : '✓ Registrar Ciclo y Generar Lotes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
