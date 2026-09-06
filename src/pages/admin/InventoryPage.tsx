import React, { useState } from 'react'
import { useInventoryItems, useInventoryAlerts, useEquipmentMaintenances, useInventoryMutations } from '../../hooks/useInventory'
import { useClinics } from '../../hooks/useClinics'
import type { InventoryItem, InventoryItemType } from '../../types'

export const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InventoryItemType | 'all' | 'maintenance'>('all')
  const [selectedClinicId, setSelectedClinicId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  const { clinics } = useClinics()
  const { data: alerts } = useInventoryAlerts(selectedClinicId || undefined)

  const { data: items = [], isLoading: loadingItems } = useInventoryItems({
    clinicId: selectedClinicId || undefined,
    itemType: activeTab === 'all' || activeTab === 'maintenance' ? 'all' : activeTab,
    search: searchTerm,
  })

  const { data: maintenances = [], isLoading: loadingMaintenances } = useEquipmentMaintenances(
    selectedClinicId || undefined
  )

  const { createItem, updateItem, createMaintenance, addBatch, isCreatingItem } = useInventoryMutations()

  // Modals
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [batchModalItem, setBatchModalItem] = useState<InventoryItem | null>(null)
  const [showMaintModal, setShowMaintModal] = useState(false)

  // Item Form State
  const [itemName, setItemName] = useState('')
  const [itemCode, setItemCode] = useState('')
  const [itemType, setItemType] = useState<InventoryItemType>('consumable_clinical')
  const [itemUnit, setItemUnit] = useState('unidad')
  const [itemStock, setItemStock] = useState<number>(10)
  const [itemMinStock, setItemMinStock] = useState<number>(5)
  const [itemCost, setItemCost] = useState<number>(0)
  const [itemBrand, setItemBrand] = useState('')
  const [itemSerial, setItemSerial] = useState('')
  const [itemLocation, setItemLocation] = useState('')
  const [itemClinicId, setItemClinicId] = useState('')

  // Batch Form State
  const [batchNumber, setBatchNumber] = useState('')
  const [batchQuantity, setBatchQuantity] = useState<number>(10)
  const [batchExpDate, setBatchExpDate] = useState('')

  // Maintenance Form State
  const [maintItemId, setMaintItemId] = useState('')
  const [maintType, setMaintType] = useState<'preventive' | 'corrective' | 'calibration'>('preventive')
  const [maintTitle, setMaintTitle] = useState('')
  const [maintTech, setMaintTech] = useState('')
  const [maintContact, setMaintContact] = useState('')
  const [maintDate, setMaintDate] = useState(new Date().toISOString().split('T')[0])
  const [maintCost, setMaintCost] = useState<number>(0)
  const [maintNextDate, setMaintNextDate] = useState('')

  const handleOpenCreateItem = () => {
    setEditingItem(null)
    setItemName('')
    setItemCode('')
    setItemType(activeTab === 'tool' || activeTab === 'consumable_admin' || activeTab === 'consumable_clinical' ? activeTab : 'consumable_clinical')
    setItemUnit('unidad')
    setItemStock(10)
    setItemMinStock(5)
    setItemCost(0)
    setItemBrand('')
    setItemSerial('')
    setItemLocation('')
    setItemClinicId(selectedClinicId || (clinics[0]?.id || ''))
    setShowItemModal(true)
  }

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemName.trim()) return

    const payload = {
      name: itemName,
      code: itemCode || undefined,
      item_type: itemType,
      unit: itemUnit,
      current_stock: Number(itemStock) || 0,
      minimum_stock: Number(itemMinStock) || 0,
      cost_price: Number(itemCost) || 0,
      brand: itemBrand || undefined,
      serial_number: itemSerial || undefined,
      location_room: itemLocation || undefined,
      clinic_id: itemClinicId || undefined,
      is_active: true,
      status: 'active' as const,
    }

    if (editingItem) {
      await updateItem({ id: editingItem.id, ...payload })
    } else {
      await createItem(payload)
    }

    setShowItemModal(false)
  }

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!batchModalItem || !batchNumber || !batchExpDate) return

    await addBatch({
      item_id: batchModalItem.id,
      batch_number: batchNumber,
      initial_quantity: Number(batchQuantity) || 0,
      current_quantity: Number(batchQuantity) || 0,
      expiration_date: batchExpDate,
      status: 'active',
    })

    setBatchModalItem(null)
    setBatchNumber('')
    setBatchQuantity(10)
    setBatchExpDate('')
  }

  const handleSaveMaintenance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!maintItemId || !maintTitle || !maintTech) return

    await createMaintenance({
      item_id: maintItemId,
      clinic_id: selectedClinicId || undefined,
      maintenance_type: maintType,
      title: maintTitle,
      technician_name: maintTech,
      technician_contact: maintContact || undefined,
      scheduled_date: maintDate,
      cost: Number(maintCost) || 0,
      next_maintenance_date: maintNextDate || undefined,
      status: 'scheduled',
    })

    setShowMaintModal(false)
    setMaintTitle('')
    setMaintTech('')
    setMaintContact('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-playfair text-navy font-bold">Inventario General y Equipamiento</h1>
          <p className="text-sm text-gray-600 font-montserrat mt-0.5">
            Gestión de instrumental, material gastable clínico/administrativo y mantenimientos
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sede Selector */}
          <select
            value={selectedClinicId}
            onChange={(e) => setSelectedClinicId(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-montserrat text-navy focus:outline-none focus:ring-2 focus:ring-gold"
          >
            <option value="">Todas las Sedes</option>
            {clinics.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {activeTab === 'maintenance' ? (
            <button
              type="button"
              onClick={() => setShowMaintModal(true)}
              className="px-4 py-2 bg-gold text-white text-xs font-bold font-montserrat rounded-lg hover:bg-gold/90 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Programar Mantenimiento
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenCreateItem}
              className="px-4 py-2 bg-gold text-white text-xs font-bold font-montserrat rounded-lg hover:bg-gold/90 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Ítem
            </button>
          )}
        </div>
      </div>

      {/* Alertas de Stock y Vencimiento */}
      {alerts && alerts.totalAlerts > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.lowStockItems.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider font-montserrat">
                <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Stock Crítico ({alerts.lowStockItems.length} ítems)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {alerts.lowStockItems.slice(0, 5).map((item) => (
                  <span key={item.id} className="text-xs bg-white/80 px-2 py-1 rounded border border-amber-200 text-amber-900 font-montserrat">
                    <strong>{item.name}</strong>: {item.current_stock} {item.unit} (Mín: {item.minimum_stock})
                  </span>
                ))}
              </div>
            </div>
          )}

          {alerts.expiringBatches.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-red-900 uppercase tracking-wider font-montserrat">
                <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Lotes Próximos a Vencer ({alerts.expiringBatches.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {alerts.expiringBatches.slice(0, 4).map((b) => (
                  <span key={b.id} className="text-xs bg-white/80 px-2 py-1 rounded border border-red-200 text-red-900 font-montserrat">
                    {b.item?.name} (Lote: {b.batch_number}) - Vence: {b.expiration_date}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navegación por Categorías */}
      <div className="flex border-b border-gray-200 gap-2 font-montserrat overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'all'
              ? 'border-gold text-navy font-bold'
              : 'border-transparent text-gray-500 hover:text-navy'
          }`}
        >
          Todo el Inventario
        </button>
        <button
          onClick={() => setActiveTab('tool')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'tool'
              ? 'border-gold text-navy font-bold'
              : 'border-transparent text-gray-500 hover:text-navy'
          }`}
        >
          Herramientas y Equipos
        </button>
        <button
          onClick={() => setActiveTab('consumable_clinical')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'consumable_clinical'
              ? 'border-gold text-navy font-bold'
              : 'border-transparent text-gray-500 hover:text-navy'
          }`}
        >
          Material Gastable Clínico
        </button>
        <button
          onClick={() => setActiveTab('consumable_admin')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'consumable_admin'
              ? 'border-gold text-navy font-bold'
              : 'border-transparent text-gray-500 hover:text-navy'
          }`}
        >
          Gastable Administrativo
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'maintenance'
              ? 'border-gold text-navy font-bold'
              : 'border-transparent text-gray-500 hover:text-navy'
          }`}
        >
          Mantenimiento y Servicios
        </button>
      </div>

      {/* Vista de Mantenimientos */}
      {activeTab === 'maintenance' ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {loadingMaintenances ? (
            <div className="p-12 text-center text-xs text-gray-400 font-montserrat">Cargando bitácora de mantenimientos...</div>
          ) : maintenances.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500 font-montserrat">
              No hay registros de mantenimientos técnicos preventivos o correctivos.
            </div>
          ) : (
            <table className="w-full text-left font-montserrat text-xs">
              <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Equipo / Instrumental</th>
                  <th className="px-6 py-3">Tipo</th>
                  <th className="px-6 py-3">Título / Detalle</th>
                  <th className="px-6 py-3">Técnico Responsable</th>
                  <th className="px-6 py-3">Fecha Programada</th>
                  <th className="px-6 py-3">Próximo Servicio</th>
                  <th className="px-6 py-3">Costo</th>
                  <th className="px-6 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {maintenances.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-navy">
                      {m.item?.name}
                      {m.item?.serial_number && <span className="block text-[11px] text-gray-400">S/N: {m.item.serial_number}</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        m.maintenance_type === 'preventive'
                          ? 'bg-blue-100 text-blue-800'
                          : m.maintenance_type === 'corrective'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {m.maintenance_type === 'preventive' ? 'Preventivo' : m.maintenance_type === 'corrective' ? 'Correctivo' : 'Calibración'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">{m.title}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {m.technician_name} {m.technician_contact ? `(${m.technician_contact})` : ''}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{m.scheduled_date}</td>
                    <td className="px-6 py-4 text-gray-600">{m.next_maintenance_date || '—'}</td>
                    <td className="px-6 py-4 font-medium text-navy">RD$ {m.cost?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                        {m.status === 'scheduled' ? 'Programado' : m.status === 'in_progress' ? 'En Curso' : 'Completado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* Vista de Ítems de Inventario */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative max-w-sm w-full">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, código o marca..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-xs font-montserrat focus:outline-none focus:ring-2 focus:ring-gold"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-xs text-gray-500 font-montserrat">
              {items.length} artículo{items.length !== 1 ? 's' : ''} registrado{items.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {loadingItems ? (
              <div className="p-12 text-center text-xs text-gray-400 font-montserrat">Cargando inventario...</div>
            ) : items.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-500 font-montserrat">
                No se encontraron artículos con ese criterio. Haz clic en "Nuevo Ítem" para registrar uno.
              </div>
            ) : (
              <table className="w-full text-left font-montserrat text-xs">
                <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3">Artículo / Instrumental</th>
                    <th className="px-6 py-3">Tipo</th>
                    <th className="px-6 py-3">Stock Actual</th>
                    <th className="px-6 py-3">Mínimo</th>
                    <th className="px-6 py-3">Costo Unit.</th>
                    <th className="px-6 py-3">Sede / Ubicación</th>
                    <th className="px-6 py-3">Lotes / Venc.</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => {
                    const isLowStock = Number(item.current_stock) <= Number(item.minimum_stock)
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-semibold text-navy block text-sm">{item.name}</span>
                          <span className="text-[11px] text-gray-400">
                            {item.code ? `SKU: ${item.code}` : ''} {item.brand ? `· Marca: ${item.brand}` : ''}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.item_type === 'tool'
                              ? 'bg-blue-100 text-blue-800'
                              : item.item_type === 'consumable_clinical'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {item.item_type === 'tool' ? 'Herramienta/Equipo' : item.item_type === 'consumable_clinical' ? 'Clínico' : 'Administrativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-bold text-sm ${isLowStock ? 'text-red-600' : 'text-navy'}`}>
                            {item.current_stock}
                          </span>{' '}
                          <span className="text-gray-500 text-[11px]">{item.unit}</span>
                          {isLowStock && <span className="block text-[10px] text-red-600 font-bold uppercase">Stock Bajo</span>}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {item.minimum_stock} {item.unit}
                        </td>
                        <td className="px-6 py-4 font-medium text-navy">
                          RD$ {item.cost_price?.toLocaleString() || '0'}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {item.clinic?.name || 'Sede General'}
                          {item.location_room && <span className="block text-[11px] text-gray-400">📍 {item.location_room}</span>}
                        </td>
                        <td className="px-6 py-4">
                          {item.item_type === 'consumable_clinical' ? (
                            <button
                              type="button"
                              onClick={() => setBatchModalItem(item)}
                              className="px-2 py-1 rounded bg-sand/40 hover:bg-gold/20 text-navy text-[11px] font-medium transition-colors border border-gold/30 flex items-center gap-1"
                            >
                              <span>+ Lote</span>
                              <span className="text-gray-400">({item.batches?.length || 0})</span>
                            </button>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItem(item)
                              setItemName(item.name)
                              setItemCode(item.code || '')
                              setItemType(item.item_type)
                              setItemUnit(item.unit)
                              setItemStock(item.current_stock)
                              setItemMinStock(item.minimum_stock)
                              setItemCost(item.cost_price || 0)
                              setItemBrand(item.brand || '')
                              setItemSerial(item.serial_number || '')
                              setItemLocation(item.location_room || '')
                              setItemClinicId(item.clinic_id || '')
                              setShowItemModal(true)
                            }}
                            className="text-gold hover:text-gold/80 font-semibold text-xs"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modal de Crear / Editar Ítem */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-playfair font-bold text-navy">
                {editingItem ? 'Editar Artículo de Inventario' : 'Registrar Nuevo Artículo'}
              </h3>
              <button type="button" onClick={() => setShowItemModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 font-montserrat text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-medium text-navy mb-1">Nombre del Artículo / Instrumental *</label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="ej. Turbina de Alta Velocidad Pana-Max"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-navy mb-1">Tipo de Artículo *</label>
                  <select
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value as InventoryItemType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none text-xs"
                  >
                    <option value="consumable_clinical">Material Gastable Clínico</option>
                    <option value="tool">Herramienta / Equipo Odontológico</option>
                    <option value="consumable_admin">Gastable Administrativo / Oficina</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-navy mb-1">Código / SKU Interno</label>
                  <input
                    type="text"
                    value={itemCode}
                    onChange={(e) => setItemCode(e.target.value)}
                    placeholder="ej. MAT-RES-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-navy mb-1">Stock Inicial *</label>
                  <input
                    type="number"
                    min={0}
                    value={itemStock}
                    onChange={(e) => setItemStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-navy mb-1">Stock Mínimo (Alerta) *</label>
                  <input
                    type="number"
                    min={0}
                    value={itemMinStock}
                    onChange={(e) => setItemMinStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-navy mb-1">Unidad de Medida</label>
                  <input
                    type="text"
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    placeholder="unidad, caja, kit, ml"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-navy mb-1">Costo Unitario (RD$)</label>
                  <input
                    type="number"
                    min={0}
                    value={itemCost}
                    onChange={(e) => setItemCost(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-navy mb-1">Sede / Clínica</label>
                  <select
                    value={itemClinicId}
                    onChange={(e) => setItemClinicId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none text-xs"
                  >
                    <option value="">Sede General</option>
                    {clinics.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-navy mb-1">Ubicación / Consultorio</label>
                  <input
                    type="text"
                    value={itemLocation}
                    onChange={(e) => setItemLocation(e.target.value)}
                    placeholder="Consultorio 1, Gabinete A"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none text-xs"
                  />
                </div>

                {itemType === 'tool' && (
                  <>
                    <div>
                      <label className="block font-medium text-navy mb-1">Marca / Fabricante</label>
                      <input
                        type="text"
                        value={itemBrand}
                        onChange={(e) => setItemBrand(e.target.value)}
                        placeholder="NSK, 3M, Dentsply"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-navy mb-1">Número de Serie</label>
                      <input
                        type="text"
                        value={itemSerial}
                        onChange={(e) => setItemSerial(e.target.value)}
                        placeholder="SN-9948271"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none text-xs"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingItem}
                  className="px-6 py-2 bg-gold text-white font-bold rounded-lg hover:bg-gold/90 shadow-sm disabled:opacity-50"
                >
                  {isCreatingItem ? 'Guardando...' : 'Guardar Artículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Nuevo Lote para Clínicos */}
      {batchModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-playfair font-bold text-navy">Registrar Lote y Caducidad</h3>
                <p className="text-xs text-gray-500 font-montserrat">{batchModalItem.name}</p>
              </div>
              <button type="button" onClick={() => setBatchModalItem(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleSaveBatch} className="space-y-4 font-montserrat text-xs">
              <div>
                <label className="block font-medium text-navy mb-1">Número de Lote *</label>
                <input
                  type="text"
                  required
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="ej. LOT-2026-X8"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-navy mb-1">Cantidad Recibida ({batchModalItem.unit}) *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={batchQuantity}
                  onChange={(e) => setBatchQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-navy mb-1">Fecha de Expiración / Caducidad *</label>
                <input
                  type="date"
                  required
                  value={batchExpDate}
                  onChange={(e) => setBatchExpDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setBatchModalItem(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gold text-white font-bold rounded-lg hover:bg-gold/90 shadow-sm"
                >
                  Registrar Lote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Programar Mantenimiento */}
      {showMaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-playfair font-bold text-navy">Programar Servicio Técnico / Mantenimiento</h3>
              <button type="button" onClick={() => setShowMaintModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleSaveMaintenance} className="space-y-4 font-montserrat text-xs">
              <div>
                <label className="block font-medium text-navy mb-1">Equipo o Instrumental *</label>
                <select
                  required
                  value={maintItemId}
                  onChange={(e) => setMaintItemId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                >
                  <option value="">Selecciona un equipo</option>
                  {items.filter((i) => i.item_type === 'tool').map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.serial_number ? `(S/N: ${t.serial_number})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-navy mb-1">Tipo de Servicio *</label>
                  <select
                    value={maintType}
                    onChange={(e) => setMaintType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                  >
                    <option value="preventive">Mantenimiento Preventivo</option>
                    <option value="corrective">Reparación Correctiva</option>
                    <option value="calibration">Calibración Técnica</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-navy mb-1">Fecha Programada *</label>
                  <input
                    type="date"
                    required
                    value={maintDate}
                    onChange={(e) => setMaintDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-navy mb-1">Motivo / Título del Mantenimiento *</label>
                <input
                  type="text"
                  required
                  value={maintTitle}
                  onChange={(e) => setMaintTitle(e.target.value)}
                  placeholder="ej. Cambio de rotor de turbina y lubricación semestral"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-navy mb-1">Técnico / Empresa de Servicio *</label>
                  <input
                    type="text"
                    required
                    value={maintTech}
                    onChange={(e) => setMaintTech(e.target.value)}
                    placeholder="ej. Dental Tech Dominicana"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-navy mb-1">Teléfono del Técnico</label>
                  <input
                    type="text"
                    value={maintContact}
                    onChange={(e) => setMaintContact(e.target.value)}
                    placeholder="809-555-9090"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-navy mb-1">Costo Estimado (RD$)</label>
                  <input
                    type="number"
                    min={0}
                    value={maintCost}
                    onChange={(e) => setMaintCost(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-navy mb-1">Próxima Fecha Sugerida</label>
                  <input
                    type="date"
                    value={maintNextDate}
                    onChange={(e) => setMaintNextDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowMaintModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gold text-white font-bold rounded-lg hover:bg-gold/90 shadow-sm"
                >
                  Guardar Mantenimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
