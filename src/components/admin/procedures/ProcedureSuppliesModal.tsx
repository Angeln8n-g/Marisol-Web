import React, { useState, useMemo } from 'react'
import type { Procedure } from '../../../types'
import { useProcedureSupplies, useProcedureSuppliesMutations } from '../../../hooks/useProcedureSupplies'
import { useInventoryItems } from '../../../hooks/useInventory'

interface ProcedureSuppliesModalProps {
  isOpen: boolean
  onClose: () => void
  procedure: Procedure | null
}

export const ProcedureSuppliesModal: React.FC<ProcedureSuppliesModalProps> = ({
  isOpen,
  onClose,
  procedure,
}) => {
  const [selectedItemId, setSelectedItemId] = useState('')
  const [unitMode, setUnitMode] = useState<'individual' | 'package'>('individual')
  const [quantity, setQuantity] = useState<number>(1)
  const [isOptional, setIsOptional] = useState(false)
  const [notes, setNotes] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const { data: supplies = [], isLoading: loadingSupplies } = useProcedureSupplies(procedure?.id)
  const { data: allItems = [], isLoading: loadingItems } = useInventoryItems()
  const { addSupply, isAddingSupply, removeSupply, isRemovingSupply } = useProcedureSuppliesMutations()

  // Item actualmente seleccionado en el formulario
  const selectedItem = useMemo(
    () => allItems.find((i) => i.id === selectedItemId),
    [allItems, selectedItemId]
  )

  const selectedUnitsPerPkg = Number(selectedItem?.units_per_package) || 1
  const hasMultipleUnits = selectedUnitsPerPkg > 1
  const isIndividualMode = hasMultipleUnits && unitMode === 'individual'

  const unitCostToAdd = isIndividualMode
    ? (Number(selectedItem?.cost_price) || 0) / selectedUnitsPerPkg
    : Number(selectedItem?.cost_price) || 0

  const totalCostToAdd = unitCostToAdd * (Number(quantity) || 0)

  const handleItemChange = (itemId: string) => {
    setSelectedItemId(itemId)
    const it = allItems.find((i) => i.id === itemId)
    if (it && it.units_per_package && it.units_per_package > 1) {
      setUnitMode('individual')
    } else {
      setUnitMode('package')
    }
  }

  // Items disponibles para agregar (excluyendo los que ya están en la bandeja)
  const existingItemIds = useMemo(() => new Set(supplies.map((s) => s.item_id)), [supplies])
  const availableItems = useMemo(
    () => allItems.filter((i) => !existingItemIds.has(i.id)),
    [allItems, existingItemIds]
  )

  // Separar consumibles de herramientas/equipamiento
  const consumables = useMemo(
    () => supplies.filter((s) => s.item?.item_type !== 'tool'),
    [supplies]
  )
  const tools = useMemo(
    () => supplies.filter((s) => s.item?.item_type === 'tool'),
    [supplies]
  )

  // Cálculo del costo total estimado de insumos por procedimiento con soporte para unidades individuales
  const estimatedCost = useMemo(() => {
    return consumables.reduce((acc, s) => {
      const item = s.item
      const unitsPerPkg = Number(item?.units_per_package) || 1
      const isIndividual =
        unitsPerPkg > 1 &&
        s.dispense_unit &&
        s.dispense_unit.toLowerCase() !== (item?.unit || '').toLowerCase()
      const unitCost = isIndividual
        ? (Number(item?.cost_price) || 0) / unitsPerPkg
        : Number(item?.cost_price) || 0
      const qty = Number(s.quantity) || 0
      return acc + unitCost * qty
    }, 0)
  }, [consumables])

  const procedurePrice = Number(procedure?.current_price?.price) || 0
  const estimatedMargin = procedurePrice > 0 ? Math.max(0, procedurePrice - estimatedCost) : 0
  const marginPercentage = procedurePrice > 0 ? ((estimatedMargin / procedurePrice) * 100).toFixed(0) : '—'

  if (!isOpen || !procedure) return null

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!selectedItemId) {
      setErrorMsg('Selecciona un artículo del catálogo.')
      return
    }

    try {
      const chosenDispenseUnit = isIndividualMode
        ? (selectedItem?.dispense_unit || 'unidad')
        : (selectedItem?.unit || 'unidad')

      await addSupply({
        procedure_id: procedure.id,
        item_id: selectedItemId,
        quantity: Math.max(0.01, Number(quantity)),
        dispense_unit: chosenDispenseUnit,
        is_optional: isOptional,
        notes: notes.trim() || undefined,
      })
      setSelectedItemId('')
      setQuantity(1)
      setIsOptional(false)
      setNotes('')
      showToast('Artículo agregado a la bandeja clínica.')
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al agregar artículo.')
    }
  }

  const handleRemove = async (supplyId: string) => {
    try {
      await removeSupply({ id: supplyId, procedureId: procedure.id })
      showToast('Artículo retirado de la bandeja.')
    } catch {
      setErrorMsg('Error al retirar artículo.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-montserrat">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 space-y-5 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        {/* Toast Local */}
        {toast && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
            <span>{toast}</span>
            <button type="button" onClick={() => setToast(null)} className="text-emerald-500 hover:text-emerald-700">✕</button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-playfair font-bold text-navy">
                Bandeja Clínica & Insumos
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sand/60 text-navy border border-gold/30">
                {procedure.category}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Protocolo de materiales y equipamiento para: <strong>{procedure.name}</strong>
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

        {/* Panel de Rentabilidad y Costos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gray-50/80 rounded-2xl border border-gray-200/70">
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Costo Estimado Materiales</p>
            <p className="text-base font-bold text-navy mt-0.5 font-mono">
              RD$ {estimatedCost.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-gray-500">{consumables.length} consumibles configurados</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Precio de Catálogo</p>
            <p className="text-base font-bold text-emerald-700 mt-0.5 font-mono">
              {procedurePrice > 0
                ? `RD$ ${procedurePrice.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`
                : 'No asignado'}
            </p>
            <p className="text-[10px] text-gray-500">Tarifa actual al paciente</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Margen Bruto de Materiales</p>
            <p className="text-base font-bold text-gold mt-0.5 font-mono">
              {procedurePrice > 0 ? `${marginPercentage}%` : '—'}
            </p>
            <p className="text-[10px] text-gray-500">
              {procedurePrice > 0
                ? `RD$ ${estimatedMargin.toLocaleString('es-DO', { minimumFractionDigits: 2 })} de utilidad`
                : 'Sin tarifa base'}
            </p>
          </div>
        </div>

        {/* Formulario Agregar a la Bandeja */}
        <form onSubmit={handleAdd} className="p-4 bg-sand/15 rounded-2xl border border-gold/20 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-navy text-xs uppercase tracking-wider flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Agregar Material o Instrumental a la Bandeja
            </span>
            {errorMsg && <span className="text-red-600 font-semibold">{errorMsg}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6">
              <label className="block font-medium text-gray-600 mb-1">Artículo del Inventario *</label>
              <select
                required
                value={selectedItemId}
                onChange={(e) => handleItemChange(e.target.value)}
                disabled={loadingItems}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none bg-white text-xs"
              >
                <option value="">Selecciona un insumo o equipo...</option>
                {availableItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} {item.item_type === 'tool' ? '⚙️ [Equipo]' : `🧪 (${item.unit})`}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block font-medium text-gray-600 mb-1">
                Cantidad Sugerida ({isIndividualMode ? (selectedItem?.dispense_unit || 'uds') : (selectedItem?.unit || 'uds')}) *
              </label>
              <input
                type="number"
                step="any"
                min={0.01}
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs"
              />
            </div>

            <div className="sm:col-span-3 flex items-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2 text-xs">
                <input
                  type="checkbox"
                  checked={isOptional}
                  onChange={(e) => setIsOptional(e.target.checked)}
                  className="rounded text-gold focus:ring-gold"
                />
                <span className="text-gray-700 font-medium">Uso Opcional</span>
              </label>
            </div>

            {/* Selector de Modalidad: Unidad Individual vs Empaque Completo */}
            {hasMultipleUnits && selectedItem && (
              <div className="sm:col-span-12 p-3 bg-white/95 rounded-xl border border-gold/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <span className="text-[11px] font-semibold text-navy flex items-center gap-1">
                  <span>💊</span>
                  <span>Unidad de Costeo Clínico:</span>
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setUnitMode('individual')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                      isIndividualMode
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-400/30'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <span>✓ Unidad Individual ({selectedItem.dispense_unit || 'unidad'})</span>
                    <strong className="text-emerald-700 font-mono">
                      RD$ {((Number(selectedItem.cost_price) || 0) / selectedUnitsPerPkg).toFixed(2)} c/u
                    </strong>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUnitMode('package')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                      !isIndividualMode
                        ? 'bg-navy text-white border-navy ring-2 ring-navy/20'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <span>Empaque Completo ({selectedItem.unit})</span>
                    <strong className="font-mono">
                      RD$ {Number(selectedItem.cost_price || 0).toFixed(2)}
                    </strong>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instrucción clínica opcional (ej. tono de composite, fresa de pulido #4)"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs"
            />
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {selectedItem && (
                <span className="text-xs font-mono text-gray-600 whitespace-nowrap bg-white px-2.5 py-1.5 rounded-xl border border-gray-200">
                  Costo: <strong className="text-navy">RD$ {totalCostToAdd.toFixed(2)}</strong>
                </span>
              )}
              <button
                type="submit"
                disabled={isAddingSupply || !selectedItemId}
                className="w-full sm:w-auto px-5 py-2 bg-navy text-white font-bold rounded-xl hover:bg-navy/90 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                {isAddingSupply ? 'Agregando...' : '+ Agregar a Bandeja'}
              </button>
            </div>
          </div>
        </form>

        {/* Listado de Insumos Configurados */}
        {loadingSupplies ? (
          <div className="p-8 text-center text-gray-400 text-xs">Cargando bandeja clínica...</div>
        ) : supplies.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200/80 space-y-1">
            <p className="text-gray-600 font-semibold text-xs">Esta bandeja aún no tiene insumos configurados.</p>
            <p className="text-[11px] text-gray-400">
              Agrega los consumibles e instrumental que el doctor utiliza habitualmente para este procedimiento.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sección Consumibles */}
            {consumables.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Materiales Consumibles Desechables ({consumables.length})
                </h4>
                <div className="divide-y divide-gray-100 border border-gray-200/80 rounded-2xl overflow-hidden text-xs">
                  {consumables.map((s) => {
                    const item = s.item
                    const unitsPerPkg = Number(item?.units_per_package) || 1
                    const isIndividual =
                      unitsPerPkg > 1 &&
                      s.dispense_unit &&
                      s.dispense_unit.toLowerCase() !== (item?.unit || '').toLowerCase()
                    const unitCost = isIndividual
                      ? (Number(item?.cost_price) || 0) / unitsPerPkg
                      : Number(item?.cost_price) || 0
                    const lineCost = unitCost * Number(s.quantity)
                    const unitLabel = s.dispense_unit || (isIndividual ? item?.dispense_unit : item?.unit) || 'uds'

                    return (
                      <div
                        key={s.id}
                        className="p-3 bg-white hover:bg-gray-50/70 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-navy">{s.item?.name || 'Insumo'}</span>
                            {s.is_optional && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                                Opcional
                              </span>
                            )}
                            {s.item?.category?.name && (
                              <span className="text-[10px] text-gray-400">({s.item.category.name})</span>
                            )}
                          </div>
                          {s.notes && <p className="text-[11px] text-gray-500 italic">"{s.notes}"</p>}
                          <p className="text-[11px] text-gray-500">
                            Costo Unitario: RD$ {unitCost.toFixed(2)} / {unitLabel} · Total: <strong>RD$ {lineCost.toFixed(2)}</strong>
                            {isIndividual && (
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 ml-1.5 font-medium">
                                Unidad clínica (1 {unitLabel} de empaque de {unitsPerPkg})
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <span className="text-[10px] text-gray-400 block uppercase">Cantidad</span>
                            <span className="font-bold text-xs text-navy">
                              {s.quantity} {unitLabel}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemove(s.id)}
                            disabled={isRemovingSupply}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Eliminar de la bandeja"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Sección Instrumental y Equipamiento */}
            {tools.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Instrumental & Equipos Clínicos ({tools.length})
                </h4>
                <div className="divide-y divide-gray-100 border border-gray-200/80 rounded-2xl overflow-hidden text-xs">
                  {tools.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 bg-white hover:bg-gray-50/70 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-navy">{s.item?.name || 'Equipo'}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              s.item?.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {s.item?.status === 'active' ? 'Operativo' : 'En Taller / Mantenimiento'}
                          </span>
                        </div>
                        {s.item?.brand && (
                          <p className="text-[11px] text-gray-400">Marca: {s.item.brand} {s.item.serial_number ? `· S/N: ${s.item.serial_number}` : ''}</p>
                        )}
                        {s.notes && <p className="text-[11px] text-gray-500 italic">"{s.notes}"</p>}
                      </div>

                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => handleRemove(s.id)}
                          disabled={isRemovingSupply}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Eliminar de la bandeja"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition-colors"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
