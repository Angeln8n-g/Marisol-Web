import React, { useState, useEffect, useMemo } from 'react'
import type { Appointment } from '../../../types'
import { useProcedureSupplies, useProcedureSuppliesMutations } from '../../../hooks/useProcedureSupplies'
import { useInventoryItems } from '../../../hooks/useInventory'
import { MedicalAlertBanner } from '../patients'

interface ClinicalTrayDispatchModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: Appointment | null
  onDispatched?: () => void
}

interface DispatchItemState {
  supplyId: string
  itemId: string
  itemName: string
  itemType: string
  unit: string
  packageUnit: string
  dispenseUnit: string
  unitsPerPackage: number
  quantity: number
  availableStock: number
  selectedBatchId?: string
  batches: Array<{ id: string; batch_number: string; current_quantity: number; expiration_date: string }>
  isIncluded: boolean
  isOptional: boolean
  notes?: string | null
}

export const ClinicalTrayDispatchModal: React.FC<ClinicalTrayDispatchModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onDispatched,
}) => {
  const procedureId = appointment?.procedure_id || null
  const clinicId = appointment?.clinic_id || ''

  const { data: supplies = [], isLoading: loadingSupplies } = useProcedureSupplies(procedureId)
  const { data: clinicItems = [], isLoading: loadingItems } = useInventoryItems({
    clinicId: clinicId || undefined,
  })
  const { dispatchClinicalTray, isDispatchingTray } = useProcedureSuppliesMutations()

  const [itemsState, setItemsState] = useState<DispatchItemState[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Sincronizar estado cuando se cargan los supplies y el appointment
  useEffect(() => {
    if (isOpen && supplies.length > 0) {
      const initial: DispatchItemState[] = supplies.map((sup) => {
        // Encontrar el item en la sede seleccionada o general
        const foundItem = clinicItems.find((ci) => ci.id === sup.item_id) || sup.item
        const stock = Number(foundItem?.current_stock) || 0
        const batches = (foundItem?.batches || [])
          .filter((b) => b.status === 'active' && b.current_quantity > 0)
          .sort((a, b) => new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime())

        const unitsPerPkg = Number(foundItem?.units_per_package) || 1
        const packageUnit = foundItem?.unit || sup.item?.unit || 'unidad'
        const dispenseUnit = sup.dispense_unit || foundItem?.dispense_unit || packageUnit

        return {
          supplyId: sup.id,
          itemId: sup.item_id,
          itemName: foundItem?.name || sup.item?.name || 'Insumo',
          itemType: foundItem?.item_type || sup.item?.item_type || 'consumable_clinical',
          unit: packageUnit,
          packageUnit,
          dispenseUnit,
          unitsPerPackage: unitsPerPkg,
          quantity: Number(sup.quantity) || 1,
          availableStock: stock,
          selectedBatchId: batches[0]?.id || undefined,
          batches,
          isIncluded: true,
          isOptional: Boolean(sup.is_optional),
          notes: sup.notes,
        }
      })
      setItemsState(initial)
      setErrorMsg(null)
      setSuccessMsg(null)
    }
  }, [isOpen, supplies, clinicItems])

  const consumables = useMemo(
    () => itemsState.filter((it) => it.itemType !== 'tool'),
    [itemsState]
  )
  const tools = useMemo(
    () => itemsState.filter((it) => it.itemType === 'tool'),
    [itemsState]
  )

  // Comprobar si hay stock insuficiente en algún consumible seleccionado (considerando conversión a empaque)
  const hasInsufficientStock = useMemo(() => {
    return consumables.some((c) => {
      if (!c.isIncluded) return false
      const isIndiv = c.unitsPerPackage > 1 && c.dispenseUnit.toLowerCase() !== c.packageUnit.toLowerCase()
      const requiredInPkg = isIndiv ? c.quantity / c.unitsPerPackage : c.quantity
      return requiredInPkg > c.availableStock
    })
  }, [consumables])

  if (!isOpen || !appointment) return null

  const handleToggleInclude = (supplyId: string) => {
    setItemsState((prev) =>
      prev.map((it) => (it.supplyId === supplyId ? { ...it, isIncluded: !it.isIncluded } : it))
    )
  }

  const handleQuantityChange = (supplyId: string, val: number) => {
    setItemsState((prev) =>
      prev.map((it) =>
        it.supplyId === supplyId ? { ...it, quantity: Math.max(0.01, Number(val) || 0) } : it
      )
    )
  }

  const handleBatchChange = (supplyId: string, bId: string) => {
    setItemsState((prev) =>
      prev.map((it) => (it.supplyId === supplyId ? { ...it, selectedBatchId: bId || undefined } : it))
    )
  }

  const handleConfirmDispatch = async () => {
    setErrorMsg(null)
    const itemsToDispatch = consumables
      .filter((c) => c.isIncluded && c.quantity > 0)
      .map((c) => ({
        itemId: c.itemId,
        itemName: c.itemName,
        itemType: c.itemType,
        quantity: c.quantity,
        dispenseUnit: c.dispenseUnit,
        batchId: c.selectedBatchId,
      }))

    if (itemsToDispatch.length === 0 && consumables.length > 0) {
      setErrorMsg('No has seleccionado ningún insumo consumible para despachar.')
      return
    }

    try {
      await dispatchClinicalTray({
        procedureId: appointment.procedure_id || '',
        procedureName: appointment.procedure?.name || 'Procedimiento Clínico',
        clinicId: appointment.clinic_id,
        patientId: appointment.patient_id,
        patientName: appointment.patient?.full_name,
        appointmentId: appointment.id,
        items: itemsToDispatch,
      })

      setSuccessMsg('Bandeja clínica despachada con éxito. Stock descontado en inventario.')
      setTimeout(() => {
        onDispatched?.()
        onClose()
      }, 1500)
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al despachar la bandeja.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-montserrat">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📦</span>
              <h3 className="text-lg font-playfair font-bold text-navy">
                Despacho de Bandeja Clínica
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Procedimiento: <strong>{appointment.procedure?.name || 'Consulta'}</strong> · Paciente:{' '}
              <strong>{appointment.patient?.full_name || 'Paciente'}</strong>
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

        {/* Semáforo de Seguridad Médica del Paciente */}
        <MedicalAlertBanner
          patient={appointment.patient}
          title="Semáforo de Seguridad Médica (Verificar antes de suministrar fármacos)"
          compact
        />

        {/* Notificaciones */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Resumen de Sede */}
        <div className="flex items-center justify-between p-3 bg-sand/20 border border-gold/20 rounded-2xl text-xs">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-gray-700 font-medium">
              Sede de Atención: <strong>{appointment.clinic?.name || 'Sede Principal'}</strong>
            </span>
          </div>
          <span className="text-[11px] text-gray-500">
            Los insumos se descontarán de esta sede
          </span>
        </div>

        {/* Contenido Principal */}
        {loadingSupplies || loadingItems ? (
          <div className="p-8 text-center text-gray-400 text-xs">
            Preparando bandeja clínica y consultando existencias...
          </div>
        ) : supplies.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200/80 space-y-2">
            <p className="text-gray-600 font-semibold text-xs">
              Este procedimiento no tiene insumos configurados en su bandeja.
            </p>
            <p className="text-[11px] text-gray-400">
              Puedes configurarlos en el módulo de Procedimientos usando el botón 📦 Bandeja.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Sección Consumibles */}
            {consumables.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-navy uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Materiales Consumibles a Descontar ({consumables.filter((c) => c.isIncluded).length})
                  </h4>
                  {hasInsufficientStock && (
                    <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                      ⚠️ Stock bajo en algunos insumos
                    </span>
                  )}
                </div>

                <div className="divide-y divide-gray-100 border border-gray-200/80 rounded-2xl overflow-hidden">
                  {consumables.map((item) => {
                    const isIndiv =
                      item.unitsPerPackage > 1 &&
                      item.dispenseUnit.toLowerCase() !== item.packageUnit.toLowerCase()
                    const requiredInPkg = isIndiv
                      ? Number((item.quantity / item.unitsPerPackage).toFixed(4))
                      : item.quantity
                    const isLow = requiredInPkg > item.availableStock

                    return (
                      <div
                        key={item.supplyId}
                        className={`p-3.5 flex items-center justify-between gap-3 transition-colors ${
                          !item.isIncluded
                            ? 'bg-gray-50/50 opacity-60'
                            : isLow
                            ? 'bg-red-50/40'
                            : 'bg-white hover:bg-gray-50/60'
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={item.isIncluded}
                            onChange={() => handleToggleInclude(item.supplyId)}
                            className="mt-1 rounded text-gold focus:ring-gold cursor-pointer"
                          />
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-navy text-xs">{item.itemName}</span>
                              {item.isOptional && (
                                <span className="px-2 py-0.2 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800">
                                  Opcional
                                </span>
                              )}
                              {isIndiv && (
                                <span className="px-2 py-0.2 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">
                                  Uso Individual
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-gray-500 flex-wrap">
                              <span>
                                Existencias en Sede:{' '}
                                <strong className={isLow ? 'text-red-600 font-bold' : 'text-navy'}>
                                  {item.availableStock} {item.packageUnit}
                                  {item.unitsPerPackage > 1 && (
                                    <span className="text-gray-400 font-normal ml-1">
                                      (≈ {Math.round(item.availableStock * item.unitsPerPackage).toLocaleString()} {item.dispenseUnit})
                                    </span>
                                  )}
                                </strong>
                              </span>
                              {isLow && (
                                <span className="text-red-600 font-semibold">(Insuficiente)</span>
                              )}
                            </div>
                            {item.notes && <p className="text-[11px] text-gray-400 italic">"{item.notes}"</p>}

                            {/* Selector de Lote si tiene lotes */}
                            {item.batches.length > 0 && item.isIncluded && (
                              <div className="pt-1 flex items-center gap-1.5">
                                <span className="text-[10px] text-gray-400">Lote (FEFO):</span>
                                <select
                                  value={item.selectedBatchId || ''}
                                  onChange={(e) => handleBatchChange(item.supplyId, e.target.value)}
                                  className="text-[11px] py-0.5 px-2 border border-gray-200 rounded-lg bg-white text-navy focus:ring-1 focus:ring-gold"
                                >
                                  {item.batches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                      {b.batch_number} (Vence: {b.expiration_date}) - {b.current_quantity} disp.
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Selector de Cantidad */}
                        <div className="flex items-center gap-1.5 text-right flex-shrink-0">
                          <label className="text-[10px] text-gray-400 uppercase mr-1">Cantidad:</label>
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="any"
                                min={0.01}
                                disabled={!item.isIncluded}
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.supplyId, Number(e.target.value))}
                                className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-center focus:ring-1 focus:ring-gold disabled:bg-gray-100"
                              />
                              <span className="text-xs font-semibold text-navy text-left whitespace-nowrap">
                                {item.dispenseUnit}
                              </span>
                            </div>
                            {isIndiv && (
                              <span className="text-[10px] text-gray-400 block mt-0.5">
                                ≈ {requiredInPkg} {item.packageUnit}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Sección Equipos Requeridos */}
            {tools.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-navy uppercase tracking-wider text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Instrumental y Equipamiento a Verificar ({tools.length})
                </h4>
                <div className="divide-y divide-gray-100 border border-gray-200/80 rounded-2xl overflow-hidden bg-gray-50/40">
                  {tools.map((item) => (
                    <div key={item.supplyId} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-semibold text-navy">{item.itemName}</span>
                        {item.notes && <p className="text-[11px] text-gray-400 italic">"{item.notes}"</p>}
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Equipo Esterilizado / Operativo ✅
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 text-xs font-semibold"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmDispatch}
            disabled={isDispatchingTray || supplies.length === 0}
            className="px-6 py-2 bg-gold text-white font-bold rounded-xl hover:bg-gold/90 transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5 text-xs"
          >
            {isDispatchingTray ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Despachando...</span>
              </>
            ) : (
              <>
                <span>📦 Confirmar y Despachar Bandeja</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
