import React, { useState, useEffect, useMemo } from 'react'
import type { Clinic, InventoryItem, InventoryItemType, InventoryItemStatus, InventoryCategory } from '../../../types'

interface InventoryItemModalProps {
  isOpen: boolean
  onClose: () => void
  editingItem: InventoryItem | null
  clinics: Clinic[]
  categories?: InventoryCategory[]
  defaultClinicId: string
  defaultItemType: InventoryItemType
  onSave: (payload: Partial<InventoryItem>) => Promise<void>
  isSaving: boolean
}

export const InventoryItemModal: React.FC<InventoryItemModalProps> = ({
  isOpen,
  onClose,
  editingItem,
  clinics,
  categories = [],
  defaultClinicId,
  defaultItemType,
  onSave,
  isSaving,
}) => {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [itemType, setItemType] = useState<InventoryItemType>('consumable_clinical')
  const [categoryId, setCategoryId] = useState('')
  const [unit, setUnit] = useState('unidad')
  const [unitsPerPackage, setUnitsPerPackage] = useState<number>(1)
  const [dispenseUnit, setDispenseUnit] = useState('unidad')
  const [currentStock, setCurrentStock] = useState<number>(10)
  const [minimumStock, setMinimumStock] = useState<number>(5)
  const [costPrice, setCostPrice] = useState<number>(0)
  const [brand, setBrand] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [locationRoom, setLocationRoom] = useState('')
  const [clinicId, setClinicId] = useState('')
  const [status, setStatus] = useState<InventoryItemStatus>('active')

  // Categorías filtradas por el tipo de ítem seleccionado
  const availableCategories = useMemo(() => {
    return categories.filter((c) => c.item_type === itemType)
  }, [categories, itemType])

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name || '')
      setCode(editingItem.code || '')
      setItemType(editingItem.item_type || 'consumable_clinical')
      setCategoryId(editingItem.category_id || '')
      setUnit(editingItem.unit || 'unidad')
      setUnitsPerPackage(Number(editingItem.units_per_package) || 1)
      setDispenseUnit(editingItem.dispense_unit || 'unidad')
      setCurrentStock(Number(editingItem.current_stock) || 0)
      setMinimumStock(Number(editingItem.minimum_stock) || 0)
      setCostPrice(Number(editingItem.cost_price) || 0)
      setBrand(editingItem.brand || '')
      setSerialNumber(editingItem.serial_number || '')
      setLocationRoom(editingItem.location_room || '')
      setClinicId(editingItem.clinic_id || '')
      setStatus(editingItem.status || 'active')
    } else {
      setName('')
      setCode('')
      setItemType(defaultItemType || 'consumable_clinical')
      setCategoryId('')
      setUnit('unidad')
      setUnitsPerPackage(1)
      setDispenseUnit('unidad')
      setCurrentStock(10)
      setMinimumStock(5)
      setCostPrice(0)
      setBrand('')
      setSerialNumber('')
      setLocationRoom('')
      setClinicId(defaultClinicId || (clinics[0]?.id || ''))
      setStatus('active')
    }
  }, [editingItem, isOpen, defaultClinicId, defaultItemType, clinics])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    await onSave({
      ...(editingItem ? { id: editingItem.id } : {}),
      name: name.trim(),
      code: code.trim() || undefined,
      item_type: itemType,
      category_id: categoryId || undefined,
      unit: unit.trim() || 'unidad',
      units_per_package: Math.max(1, Number(unitsPerPackage) || 1),
      dispense_unit: dispenseUnit.trim() || 'unidad',
      current_stock: Math.max(0, Number(currentStock)),
      minimum_stock: Math.max(0, Number(minimumStock)),
      cost_price: Math.max(0, Number(costPrice)),
      brand: brand.trim() || undefined,
      serial_number: serialNumber.trim() || undefined,
      location_room: locationRoom.trim() || undefined,
      clinic_id: clinicId || undefined,
      status,
      is_active: true,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-montserrat">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
          <div>
            <h3 className="text-lg font-playfair font-bold text-navy">
              {editingItem ? 'Editar Ficha de Artículo' : 'Registrar Nuevo Artículo de Inventario'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Completa la información técnica, de existencias y ubicación física.
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

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* SECCIÓN 1: Identificación y Tipo */}
          <div className="space-y-3">
            <h4 className="text-[11px] uppercase tracking-wider font-bold text-gray-400 border-b border-gray-100 pb-1">
              1. Identificación del Producto
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-navy mb-1">
                  Nombre del Artículo / Instrumental *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ej. Turbina de Alta Velocidad Pana-Max o Resina Filtek Z350 XT"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1">
                  Tipo de Artículo *
                </label>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value as InventoryItemType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs bg-white"
                >
                  <option value="consumable_clinical">Material Gastable Clínico</option>
                  <option value="tool">Herramienta / Equipo Odontológico</option>
                  <option value="consumable_admin">Gastable Administrativo / Oficina</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1">
                  Categoría Odontológica Especializada
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs bg-white"
                >
                  <option value="">Seleccionar categoría...</option>
                  {availableCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1">
                  Código / SKU Interno
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="ej. MAT-RES-001 o INS-TURB-04"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs font-mono"
                />
              </div>
            </div>
          </div>


          {/* SECCIÓN 2: Stock, Precios y Unidades */}
          <div className="space-y-3">
            <h4 className="text-[11px] uppercase tracking-wider font-bold text-gray-400 border-b border-gray-100 pb-1">
              2. Control de Stock y Precios
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-navy mb-1">
                  Stock Actual *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={currentStock}
                  onChange={(e) => setCurrentStock(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1">
                  Stock Mínimo (Alerta) *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={minimumStock}
                  onChange={(e) => setMinimumStock(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1">
                  Unidad de Empaque / Almacén *
                </label>
                <input
                  type="text"
                  required
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="paquete, caja, kit, frasco, tubo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1">
                  Costo por Empaque (RD$)
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs"
                />
              </div>
            </div>

            {/* Sub-fila: Conversión de Unidades Individuales / Uso Clínico */}
            <div className="p-3 bg-sand/20 rounded-2xl border border-gold/25 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-navy text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  💊 Desglose para Dispensación Clínica Individual
                </span>
                {unitsPerPackage > 1 && costPrice > 0 && (
                  <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    RD$ {(costPrice / unitsPerPackage).toFixed(2)} por {dispenseUnit || 'unidad'}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Unidades contenidas en el empaque
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={unitsPerPackage}
                    onChange={(e) => setUnitsPerPackage(Math.max(1, Number(e.target.value)))}
                    placeholder="ej. 500 baberos, 50 carpules, 100 agujas"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs bg-white font-semibold"
                  />
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Ej: si una caja trae 50 carpules o un paquete trae 500 baberos, coloca aquí ese número.
                  </p>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Nombre de la Unidad Individual
                  </label>
                  <input
                    type="text"
                    value={dispenseUnit}
                    onChange={(e) => setDispenseUnit(e.target.value)}
                    placeholder="babero, carpule, aguja, unidad, sobre"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs bg-white"
                  />
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Se usará en bandejas de procedimientos para un costeo proporcional exacto.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: Ubicación Física y Ficha Técnica */}
          <div className="space-y-3">
            <h4 className="text-[11px] uppercase tracking-wider font-bold text-gray-400 border-b border-gray-100 pb-1">
              3. Sede, Ubicación y Estado
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-navy mb-1">
                  Sede Asignada
                </label>
                <select
                  value={clinicId}
                  onChange={(e) => setClinicId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs bg-white"
                >
                  <option value="">Sede General (Todas)</option>
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1">
                  Ubicación Interna
                </label>
                <input
                  type="text"
                  value={locationRoom}
                  onChange={(e) => setLocationRoom(e.target.value)}
                  placeholder="Consultorio 1, Vitrina B"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1">
                  Estado Operativo
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as InventoryItemStatus)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs bg-white"
                >
                  <option value="active">Activo / Operativo</option>
                  <option value="in_maintenance">En Mantenimiento</option>
                  <option value="damaged">Dañado / Con Fallas</option>
                  <option value="retired">Retirado / Baja</option>
                </select>
              </div>

              {/* Campos específicos si es herramienta o equipo */}
              {itemType === 'tool' && (
                <>
                  <div className="sm:col-span-1">
                    <label className="block font-semibold text-navy mb-1">
                      Marca / Fabricante
                    </label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="NSK, 3M ESPE, Dentsply Sirona"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-navy mb-1">
                      Número de Serie (S/N)
                    </label>
                    <input
                      type="text"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      placeholder="SN-994827103"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs font-mono"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer con Botones */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-gold text-white font-bold rounded-xl hover:bg-gold/90 transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <span>{editingItem ? 'Actualizar Artículo' : 'Guardar Artículo'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
