import React, { useState, useEffect } from 'react'
import type { EquipmentMaintenance, MaintenanceStatus } from '../../../types'

interface MaintenanceDetailModalProps {
  isOpen: boolean
  onClose: () => void
  maintenance: EquipmentMaintenance | null
  onUpdate: (id: string, updates: Partial<EquipmentMaintenance>) => Promise<void>
  isUpdating: boolean
}

export const MaintenanceDetailModal: React.FC<MaintenanceDetailModalProps> = ({
  isOpen,
  onClose,
  maintenance,
  onUpdate,
  isUpdating,
}) => {
  const [status, setStatus] = useState<MaintenanceStatus>('scheduled')
  const [cost, setCost] = useState<number>(0)
  const [completedDate, setCompletedDate] = useState('')
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState('')
  const [findings, setFindings] = useState('')
  const [actionsTaken, setActionsTaken] = useState('')
  const [techName, setTechName] = useState('')
  const [techContact, setTechContact] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (maintenance) {
      setStatus(maintenance.status || 'scheduled')
      setCost(Number(maintenance.cost) || 0)
      setCompletedDate(maintenance.completed_date || new Date().toISOString().split('T')[0])
      setNextMaintenanceDate(maintenance.next_maintenance_date || '')
      setFindings(maintenance.findings || '')
      setActionsTaken(maintenance.actions_taken || '')
      setTechName(maintenance.technician_name || '')
      setTechContact(maintenance.technician_contact || '')
      setErrorMsg(null)
    }
  }, [maintenance, isOpen])

  if (!isOpen || !maintenance) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    try {
      await onUpdate(maintenance.id, {
        item_id: maintenance.item_id,
        status,
        cost: Math.max(0, Number(cost)),
        completed_date: status === 'completed' ? completedDate : undefined,
        next_maintenance_date: nextMaintenanceDate || undefined,
        findings: findings.trim() || undefined,
        actions_taken: actionsTaken.trim() || undefined,
        technician_name: techName.trim(),
        technician_contact: techContact.trim() || undefined,
      })
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar el servicio técnico.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-montserrat">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
          <div>
            <h3 className="text-lg font-playfair font-bold text-navy">
              Ficha de Mantenimiento Técnico
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {maintenance.item?.name} {maintenance.item?.serial_number ? `(S/N: ${maintenance.item.serial_number})` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Tarjeta resumen del servicio */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-navy text-xs">{maintenance.title}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                maintenance.maintenance_type === 'preventive'
                  ? 'bg-blue-100 text-blue-800'
                  : maintenance.maintenance_type === 'corrective'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {maintenance.maintenance_type === 'preventive' ? 'Preventivo' : maintenance.maintenance_type === 'corrective' ? 'Correctivo' : 'Calibración'}
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              Fecha programada original: <strong>{maintenance.scheduled_date}</strong>
            </p>
          </div>

          {/* Estado del Servicio */}
          <div>
            <label className="block font-semibold text-navy mb-1">Estado del Servicio Técnico *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as MaintenanceStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none bg-white font-semibold text-xs"
            >
              <option value="scheduled">Programado / En espera de visita</option>
              <option value="in_progress">En Curso / Equipo en taller técnico</option>
              <option value="completed">Completado / Equipo reparado y operativo</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          {/* Técnico y Costo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy mb-1">Técnico / Empresa Responsable *</label>
              <input
                type="text"
                required
                value={techName}
                onChange={(e) => setTechName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-navy mb-1">Teléfono / Contacto</label>
              <input
                type="text"
                value={techContact}
                onChange={(e) => setTechContact(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-navy mb-1">Costo Final Real (RD$)</label>
              <input
                type="number"
                min={0}
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs font-semibold"
              />
            </div>

            {status === 'completed' && (
              <div>
                <label className="block font-semibold text-navy mb-1">Fecha de Finalización *</label>
                <input
                  type="date"
                  required
                  value={completedDate}
                  onChange={(e) => setCompletedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs font-semibold"
                />
              </div>
            )}
          </div>

          {/* Hallazgos y Acciones tomadas */}
          <div>
            <label className="block font-semibold text-navy mb-1">Hallazgos Técnicos / Diagnóstico</label>
            <textarea
              rows={2}
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              placeholder="ej. Desgaste en rodamientos cerámicos y fuga de aire en acople rápido..."
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-navy mb-1">Acciones Tomadas / Reparaciones</label>
            <textarea
              rows={2}
              value={actionsTaken}
              onChange={(e) => setActionsTaken(e.target.value)}
              placeholder="ej. Reemplazo de turbina rotor, calibración de presión a 2.5 bar y limpieza ultrasónica..."
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs"
            />
          </div>

          {/* Próximo Servicio */}
          <div>
            <label className="block font-semibold text-navy mb-1">Próxima Fecha de Mantenimiento Sugerida</label>
            <input
              type="date"
              value={nextMaintenanceDate}
              onChange={(e) => setNextMaintenanceDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-6 py-2 bg-gold text-white font-bold rounded-xl hover:bg-gold/90 transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {isUpdating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar Cambios</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
