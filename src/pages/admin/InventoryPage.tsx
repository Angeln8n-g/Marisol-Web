import React, { useState, useMemo } from 'react'
import {
  useInventoryItems,
  useInventoryAlerts,
  useEquipmentMaintenances,
  useInventoryMovements,
  useInventoryMutations,
  useInventoryCategories,
} from '../../hooks/useInventory'
import { useClinics } from '../../hooks/useClinics'
import { usePredictiveInventory } from '../../hooks/usePredictiveInventory'
import { usePurchaseOrders, usePurchaseOrderMutations } from '../../hooks/usePurchaseOrders'
import { useSterilizationCycles, useSterilizationMutations } from '../../hooks/useSterilization'
import type {
  InventoryItem,
  EquipmentMaintenance,
  PurchaseOrder,
  PredictiveRestockItem,
  SterilizationCycle,
  BiologicalIndicatorStatus,
} from '../../types'
import {
  SterilizationCycleModal,
  SterilePouchLabelModal,
  SterilizationLogTable,
} from '../../components/admin/sterilization'
import { exportToCSV } from '../../lib/exportUtils'
import {
  InventoryStats,
  InventoryFilters,
  InventoryTable,
  InventoryItemModal,
  MaintenanceTable,
  InventoryMovementModal,
  KardexTable,
  InventoryBatchesModal,
  MaintenanceDetailModal,
  PredictiveReorderBanner,
  PurchaseOrderModal,
  PurchaseOrdersTable,
  type InventoryTabType,
  type StockHealthFilter,
} from '../../components/admin/inventory'

export const InventoryPage: React.FC = () => {
  // Navigation & Filtering State
  const [activeTab, setActiveTab] = useState<InventoryTabType>('all')
  const [selectedClinicId, setSelectedClinicId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [stockFilter, setStockFilter] = useState<StockHealthFilter>('all')

  // Toast Feedback State
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text })
    setTimeout(() => {
      setToastMessage(null)
    }, 4000)
  }

  // Data Queries
  const { clinics } = useClinics()
  const { data: alerts } = useInventoryAlerts(selectedClinicId || undefined)
  const { data: categories = [] } = useInventoryCategories()

  const { data: rawItems = [], isLoading: loadingItems } = useInventoryItems({
    clinicId: selectedClinicId || undefined,
    itemType:
      activeTab === 'all' ||
      activeTab === 'maintenance' ||
      activeTab === 'movements' ||
      activeTab === 'purchase_orders' ||
      activeTab === 'sterilization'
        ? 'all'
        : activeTab,
    search: searchTerm,
  })

  const { data: maintenances = [], isLoading: loadingMaintenances } = useEquipmentMaintenances(
    selectedClinicId || undefined
  )

  const { data: movements = [], isLoading: loadingMovements } = useInventoryMovements({
    clinicId: selectedClinicId || undefined,
  })

  // Bioseguridad y Esterilización en Autoclave
  const { data: sterilizationCycles = [], isLoading: loadingCycles } = useSterilizationCycles({
    clinicId: selectedClinicId || undefined,
  })
  const { createCycle, updateCycle, isCreatingCycle } = useSterilizationMutations()

  // Reorden Predictivo Inteligente
  const [forecastDays, setForecastDays] = useState(14)
  const {
    itemsToReorder,
    totalEstimatedReorderCost,
    totalAppointmentsInWindow,
    isLoading: loadingPredictive,
  } = usePredictiveInventory({
    clinicId: selectedClinicId || undefined,
    forecastDays,
  })

  // Órdenes de Compra
  const { data: purchaseOrders = [], isLoading: loadingOrders } = usePurchaseOrders({
    clinicId: selectedClinicId || undefined,
  })

  const {
    createOrder,
    receiveOrder,
    cancelOrder,
    isCreatingOrder,
    isReceivingOrder,
  } = usePurchaseOrderMutations()

  const {
    createItem,
    updateItem,
    deleteItem,
    createMaintenance,
    updateMaintenance,
    addBatch,
    updateBatchStatus,
    registerMovement,
    isCreatingItem,
    isUpdatingItem,
    isRegisteringMovement,
    isUpdatingMaintenance,
    isUpdatingBatchStatus,
  } = useInventoryMutations()

  // Modals State
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [batchModalItem, setBatchModalItem] = useState<InventoryItem | null>(null)
  const [selectedMaintenance, setSelectedMaintenance] = useState<EquipmentMaintenance | null>(null)
  const [showMaintModal, setShowMaintModal] = useState(false)
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [movementModalItem, setMovementModalItem] = useState<InventoryItem | null>(null)
  const [showPurchaseOrderModal, setShowPurchaseOrderModal] = useState(false)
  const [prefilledOrderItems, setPrefilledOrderItems] = useState<PredictiveRestockItem[] | null>(null)
  const [showSterilizationModal, setShowSterilizationModal] = useState(false)
  const [labelModalCycle, setLabelModalCycle] = useState<SterilizationCycle | null>(null)

  // Maintenance Form State
  const [maintItemId, setMaintItemId] = useState('')
  const [maintType, setMaintType] = useState<'preventive' | 'corrective' | 'calibration'>('preventive')
  const [maintTitle, setMaintTitle] = useState('')
  const [maintTech, setMaintTech] = useState('')
  const [maintContact, setMaintContact] = useState('')
  const [maintDate, setMaintDate] = useState(new Date().toISOString().split('T')[0])
  const [maintCost, setMaintCost] = useState<number>(0)
  const [maintNextDate, setMaintNextDate] = useState('')
  const [isSavingMaint, setIsSavingMaint] = useState(false)

  // Computed Metrics & KPIs
  const { totalValuation, lowStockCount, outOfStockCount, pendingMaintenancesCount } = useMemo(() => {
    let valuation = 0
    let lowStock = 0
    let outStock = 0

    rawItems.forEach((item) => {
      const stock = Number(item.current_stock) || 0
      const minStock = Number(item.minimum_stock) || 0
      const cost = Number(item.cost_price) || 0

      valuation += stock * cost
      if (stock === 0) {
        outStock++
      } else if (stock <= minStock) {
        lowStock++
      }
    })

    const pendingMaint = maintenances.filter(
      (m) => m.status === 'scheduled' || m.status === 'in_progress'
    ).length

    return {
      totalValuation: valuation,
      lowStockCount: lowStock,
      outOfStockCount: outStock,
      pendingMaintenancesCount: pendingMaint,
    }
  }, [rawItems, maintenances])

  // Filter items by stock health
  const filteredItems = useMemo(() => {
    return rawItems.filter((item) => {
      const stock = Number(item.current_stock) || 0
      const minStock = Number(item.minimum_stock) || 0

      if (stockFilter === 'low_stock') {
        return stock <= minStock && stock > 0
      }
      if (stockFilter === 'out_of_stock') {
        return stock === 0
      }
      if (stockFilter === 'optimal') {
        return stock > minStock
      }
      return true
    })
  }, [rawItems, stockFilter])

  // Handlers
  const handleOpenCreateItem = () => {
    setEditingItem(null)
    setShowItemModal(true)
  }

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item)
    setShowItemModal(true)
  }

  const handleDeleteItem = async (item: InventoryItem) => {
    const confirm = window.confirm(
      `¿Estás seguro de que deseas desactivar el artículo "${item.name}"? Podrás reactivarlo más adelante.`
    )
    if (!confirm) return

    try {
      await deleteItem(item.id)
      showToast(`Artículo "${item.name}" desactivado con éxito.`, 'success')
    } catch {
      showToast('Error al desactivar el artículo.', 'error')
    }
  }

  const handleSaveItem = async (payload: Partial<InventoryItem>) => {
    try {
      if (editingItem) {
        await updateItem({ id: editingItem.id, ...payload })
        showToast(`Artículo "${payload.name}" actualizado con éxito.`, 'success')
      } else {
        await createItem(payload)
        showToast(`Artículo "${payload.name}" registrado con éxito.`, 'success')
      }
      setShowItemModal(false)
    } catch {
      showToast('Error al guardar el artículo. Por favor verifica los datos.', 'error')
    }
  }

  const handleSaveMaintenance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!maintItemId || !maintTitle || !maintTech) return

    try {
      setIsSavingMaint(true)
      await createMaintenance({
        item_id: maintItemId,
        clinic_id: selectedClinicId || undefined,
        maintenance_type: maintType,
        title: maintTitle.trim(),
        technician_name: maintTech.trim(),
        technician_contact: maintContact.trim() || undefined,
        scheduled_date: maintDate,
        cost: Math.max(0, Number(maintCost)),
        next_maintenance_date: maintNextDate || undefined,
        status: 'scheduled',
      })
      showToast('Mantenimiento técnico programado con éxito.', 'success')
      setShowMaintModal(false)
      setMaintTitle('')
      setMaintTech('')
      setMaintContact('')
      setMaintCost(0)
      setMaintNextDate('')
    } catch {
      showToast('Error al programar el mantenimiento.', 'error')
    } finally {
      setIsSavingMaint(false)
    }
  }

  const handleRegisterMovement = async (params: any) => {
    try {
      await registerMovement(params)
      showToast('Movimiento de inventario registrado con éxito.', 'success')
      setShowMovementModal(false)
      setMovementModalItem(null)
    } catch (err: any) {
      showToast(err.message || 'Error al registrar el movimiento.', 'error')
      throw err
    }
  }

  const handleGeneratePurchaseOrder = (items: PredictiveRestockItem[]) => {
    setPrefilledOrderItems(items)
    setShowPurchaseOrderModal(true)
  }

  const handleOpenEmptyPurchaseOrder = () => {
    setPrefilledOrderItems(null)
    setShowPurchaseOrderModal(true)
  }

  const handleSavePurchaseOrder = async (payload: any) => {
    try {
      await createOrder(payload)
      showToast(
        payload.status === 'sent'
          ? 'Orden de compra enviada y registrada con éxito.'
          : 'Borrador de orden de compra guardado.',
        'success'
      )
      setShowPurchaseOrderModal(false)
      setPrefilledOrderItems(null)
    } catch {
      showToast('Error al guardar la orden de compra.', 'error')
    }
  }

  const handleReceivePurchaseOrder = async (order: PurchaseOrder) => {
    try {
      await receiveOrder(order.id)
      showToast(
        `¡Orden #${order.order_number} recibida! El inventario y el Kárdex han sido actualizados con éxito.`,
        'success'
      )
    } catch (err: any) {
      showToast(err.message || 'Error al recibir la orden de compra.', 'error')
      throw err
    }
  }

  const handleCancelPurchaseOrder = async (orderId: string) => {
    try {
      await cancelOrder(orderId)
      showToast('Orden de compra cancelada.', 'success')
    } catch {
      showToast('Error al cancelar la orden.', 'error')
    }
  }

  const handleSaveSterilizationCycle = async (payload: any) => {
    try {
      await createCycle(payload)
      showToast('Ciclo de esterilización y lotes de instrumental registrados con éxito.', 'success')
      setShowSterilizationModal(false)
    } catch {
      showToast('Error al registrar el ciclo de esterilización.', 'error')
    }
  }

  const handleUpdateBiologicalStatus = async (cycleId: string, status: BiologicalIndicatorStatus) => {
    try {
      await updateCycle({ id: cycleId, biological_indicator_status: status })
      showToast('Control biológico de esporas actualizado con éxito.', 'success')
    } catch {
      showToast('Error al actualizar el control biológico.', 'error')
    }
  }

  const handleExportCSV = () => {
    if (filteredItems.length === 0) {
      showToast('No hay artículos disponibles para exportar.', 'error')
      return
    }

    const exportData = filteredItems.map((item) => {
      const stock = Number(item.current_stock) || 0
      const cost = Number(item.cost_price) || 0
      return {
        'Artículo': item.name,
        'SKU / Código': item.code || 'N/A',
        'Tipo': item.item_type,
        'Marca': item.brand || 'N/A',
        'Serial': item.serial_number || 'N/A',
        'Stock Actual': stock,
        'Unidad': item.unit,
        'Stock Mínimo': item.minimum_stock,
        'Costo Unitario (RD$)': cost,
        'Valor Total (RD$)': stock * cost,
        'Sede': item.clinic?.name || 'Sede General',
        'Ubicación': item.location_room || 'N/A',
        'Estado': item.status,
      }
    })

    const clinicName = clinics.find((c) => c.id === selectedClinicId)?.name || 'General'
    const dateStr = new Date().toISOString().split('T')[0]
    exportToCSV(exportData, `inventario-${clinicName.toLowerCase().replace(/\s+/g, '-')}-${dateStr}`)
    showToast('Archivo CSV generado y descargado.', 'success')
  }

  return (
    <div className="space-y-6 pb-12 font-montserrat">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 transition-all animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-navy text-white border-gold/40'
              : 'bg-red-900 text-white border-red-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <svg className="w-5 h-5 text-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className="text-xs font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-playfair text-navy font-bold">
            Inventario General y Equipamiento
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
            Control de instrumental, stock clínico/administrativo, lotes de caducidad y servicios técnicos
          </p>
        </div>
      </div>

      {/* KPIs Ejecutivos Superiores */}
      <InventoryStats
        totalValuation={totalValuation}
        totalItems={rawItems.length}
        lowStockCount={lowStockCount}
        outOfStockCount={outOfStockCount}
        expiringBatchesCount={alerts?.expiringBatches.length || 0}
        pendingMaintenancesCount={pendingMaintenancesCount}
        activeStockFilter={stockFilter}
        onSelectStockFilter={(f) => {
          setStockFilter(f)
          if (activeTab === 'maintenance') setActiveTab('all')
        }}
        onSelectMaintenanceTab={() => setActiveTab('maintenance')}
      />

      {/* Alertas Rápidas Contextuales */}
      {alerts && alerts.totalAlerts > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.lowStockItems.length > 0 && (
            <div className="p-4 bg-amber-50/90 border border-amber-200/80 rounded-2xl space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                  <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Alerta de Reposición ({alerts.lowStockItems.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStockFilter('low_stock')
                    if (activeTab === 'maintenance') setActiveTab('all')
                  }}
                  className="text-[11px] text-amber-800 font-semibold hover:underline"
                >
                  Ver todos →
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {alerts.lowStockItems.slice(0, 4).map((item) => (
                  <span key={item.id} className="text-[11px] bg-white px-2 py-0.5 rounded-lg border border-amber-200 text-amber-900">
                    <strong>{item.name}</strong>: {item.current_stock} {item.unit}
                  </span>
                ))}
                {alerts.lowStockItems.length > 4 && (
                  <span className="text-[10px] text-amber-700 self-center">
                    +{alerts.lowStockItems.length - 4} más
                  </span>
                )}
              </div>
            </div>
          )}

          {alerts.expiringBatches.length > 0 && (
            <div className="p-4 bg-red-50/90 border border-red-200/80 rounded-2xl space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-red-900 uppercase tracking-wider">
                  <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Lotes Próximos a Vencer ({alerts.expiringBatches.length})</span>
                </div>
                <span className="text-[10px] text-red-700 bg-red-100/70 px-2 py-0.5 rounded-full font-medium">
                  &lt; 60 días
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {alerts.expiringBatches.slice(0, 3).map((b) => (
                  <span key={b.id} className="text-[11px] bg-white px-2 py-0.5 rounded-lg border border-red-200 text-red-900">
                    {b.item?.name} (Lote: {b.batch_number}) - Vence: <strong>{b.expiration_date}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Banner Inteligente de Reorden Predictivo Clínico */}
      <PredictiveReorderBanner
        itemsToReorder={itemsToReorder}
        totalAppointments={totalAppointmentsInWindow}
        totalEstimatedCost={totalEstimatedReorderCost}
        forecastDays={forecastDays}
        onChangeForecastDays={setForecastDays}
        onGeneratePurchaseOrder={handleGeneratePurchaseOrder}
        isLoading={loadingPredictive}
      />

      {/* Filtros, Búsqueda, Tabs y Acciones */}
      <InventoryFilters
        clinics={clinics}
        selectedClinicId={selectedClinicId}
        onClinicChange={setSelectedClinicId}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        stockFilter={stockFilter}
        onStockFilterChange={setStockFilter}
        onOpenCreateItem={handleOpenCreateItem}
        onOpenCreateMaintenance={() => setShowMaintModal(true)}
        onOpenMovementModal={() => {
          setMovementModalItem(null)
          setShowMovementModal(true)
        }}
        onExportCSV={handleExportCSV}
        itemsCount={filteredItems.length}
      />

      {/* Vista de Contenido Principal */}
      {activeTab === 'maintenance' ? (
        <MaintenanceTable
          maintenances={maintenances}
          isLoading={loadingMaintenances}
          onOpenCreateMaintenance={() => setShowMaintModal(true)}
          onManageMaintenance={(m) => setSelectedMaintenance(m)}
        />
      ) : activeTab === 'movements' ? (
        <KardexTable
          movements={movements}
          isLoading={loadingMovements}
          onOpenMovementModal={() => {
            setMovementModalItem(null)
            setShowMovementModal(true)
          }}
        />
      ) : activeTab === 'purchase_orders' ? (
        <PurchaseOrdersTable
          orders={purchaseOrders}
          isLoading={loadingOrders}
          onReceiveOrder={handleReceivePurchaseOrder}
          onCancelOrder={handleCancelPurchaseOrder}
          onOpenCreateOrder={handleOpenEmptyPurchaseOrder}
          isReceiving={isReceivingOrder}
        />
      ) : activeTab === 'sterilization' ? (
        <SterilizationLogTable
          cycles={sterilizationCycles}
          isLoading={loadingCycles}
          onOpenCreateCycle={() => setShowSterilizationModal(true)}
          onPrintCycleLabels={(cycle) => setLabelModalCycle(cycle)}
          onUpdateBiologicalStatus={handleUpdateBiologicalStatus}
        />
      ) : (
        <InventoryTable
          items={filteredItems}
          isLoading={loadingItems}
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItem}
          onOpenBatchModal={(item) => setBatchModalItem(item)}
          onOpenQuickMovement={(item) => {
            setMovementModalItem(item)
            setShowMovementModal(true)
          }}
        />
      )}

      {/* Modal Movimiento de Inventario */}
      <InventoryMovementModal
        isOpen={showMovementModal}
        onClose={() => {
          setShowMovementModal(false)
          setMovementModalItem(null)
        }}
        items={rawItems}
        preselectedItem={movementModalItem}
        clinics={clinics}
        defaultClinicId={selectedClinicId}
        onRegister={handleRegisterMovement}
        isRegistering={isRegisteringMovement}
      />

      {/* Modal Crear / Editar Artículo */}
      <InventoryItemModal
        isOpen={showItemModal}
        onClose={() => setShowItemModal(false)}
        editingItem={editingItem}
        clinics={clinics}
        categories={categories}
        defaultClinicId={selectedClinicId}
        defaultItemType={
          activeTab === 'tool' || activeTab === 'consumable_admin' || activeTab === 'consumable_clinical'
            ? activeTab
            : 'consumable_clinical'
        }
        onSave={handleSaveItem}
        isSaving={isCreatingItem || isUpdatingItem}
      />

      {/* Modal Gestión de Lotes y Caducidades */}
      <InventoryBatchesModal
        isOpen={Boolean(batchModalItem)}
        onClose={() => setBatchModalItem(null)}
        item={batchModalItem}
        onAddBatch={async (batch) => {
          await addBatch(batch)
          showToast(`Lote "${batch.batch_number}" registrado con éxito.`, 'success')
        }}
        isAddingBatch={false}
        onDepleteBatch={async (batchId, itemId, discountQty) => {
          await updateBatchStatus({ id: batchId, itemId, status: 'expired', discountCurrentStock: discountQty })
          showToast('Lote dado de baja y existencias actualizadas.', 'success')
        }}
        isUpdatingBatch={isUpdatingBatchStatus}
      />

      {/* Modal Detalle / Gestión Técnica de Mantenimiento */}
      <MaintenanceDetailModal
        isOpen={Boolean(selectedMaintenance)}
        onClose={() => setSelectedMaintenance(null)}
        maintenance={selectedMaintenance}
        onUpdate={async (id, updates) => {
          await updateMaintenance({ id, ...updates })
          showToast('Servicio técnico actualizado con éxito.', 'success')
        }}
        isUpdating={isUpdatingMaintenance}
      />

      {/* Modal Programar Mantenimiento */}
      {showMaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-montserrat">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-playfair font-bold text-navy">
                  Programar Servicio Técnico / Mantenimiento
                </h3>
                <p className="text-xs text-gray-500">
                  Registra la cita preventiva o correctiva de instrumental y equipos
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMaintModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMaintenance} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-navy mb-1">
                  Equipo o Instrumental *
                </label>
                <select
                  required
                  value={maintItemId}
                  onChange={(e) => setMaintItemId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none bg-white text-xs"
                >
                  <option value="">Selecciona un equipo</option>
                  {rawItems
                    .filter((i) => i.item_type === 'tool')
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.serial_number ? `(S/N: ${t.serial_number})` : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-navy mb-1">
                    Tipo de Servicio *
                  </label>
                  <select
                    value={maintType}
                    onChange={(e) => setMaintType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none bg-white text-xs"
                  >
                    <option value="preventive">Mantenimiento Preventivo</option>
                    <option value="corrective">Reparación Correctiva</option>
                    <option value="calibration">Calibración Técnica</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-navy mb-1">
                    Fecha Programada *
                  </label>
                  <input
                    type="date"
                    required
                    value={maintDate}
                    onChange={(e) => setMaintDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1">
                  Motivo / Detalle del Servicio *
                </label>
                <input
                  type="text"
                  required
                  value={maintTitle}
                  onChange={(e) => setMaintTitle(e.target.value)}
                  placeholder="ej. Cambio de rodamientos de turbina y lubricación semestral"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-navy mb-1">
                    Técnico / Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={maintTech}
                    onChange={(e) => setMaintTech(e.target.value)}
                    placeholder="ej. Dental Tech Dominicana"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-navy mb-1">
                    Contacto / Teléfono
                  </label>
                  <input
                    type="text"
                    value={maintContact}
                    onChange={(e) => setMaintContact(e.target.value)}
                    placeholder="809-555-9090"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-navy mb-1">
                    Costo Estimado (RD$)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={maintCost}
                    onChange={(e) => setMaintCost(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-navy mb-1">
                    Próxima Fecha Sugerida
                  </label>
                  <input
                    type="date"
                    value={maintNextDate}
                    onChange={(e) => setMaintNextDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowMaintModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingMaint}
                  className="px-5 py-2 bg-gold text-white font-bold rounded-xl hover:bg-gold/90 transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingMaint ? 'Guardando...' : 'Guardar Mantenimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Orden de Compra Inteligente */}
      <PurchaseOrderModal
        isOpen={showPurchaseOrderModal}
        onClose={() => {
          setShowPurchaseOrderModal(false)
          setPrefilledOrderItems(null)
        }}
        clinics={clinics}
        defaultClinicId={selectedClinicId}
        inventoryItems={rawItems}
        prefilledItems={prefilledOrderItems}
        forecastDays={forecastDays}
        onSave={handleSavePurchaseOrder}
        isSaving={isCreatingOrder}
      />

      {/* Modal Ciclo de Esterilización en Autoclave */}
      <SterilizationCycleModal
        isOpen={showSterilizationModal}
        onClose={() => setShowSterilizationModal(false)}
        clinics={clinics}
        defaultClinicId={selectedClinicId}
        autoclaves={rawItems.filter(
          (i) => i.item_type === 'tool' && i.name.toLowerCase().includes('autoclave')
        )}
        rotaryTools={rawItems.filter((i) => i.item_type === 'tool')}
        onSave={handleSaveSterilizationCycle}
        isSaving={isCreatingCycle}
      />

      {/* Modal Rótulos de Esterilidad e Impresión */}
      <SterilePouchLabelModal
        isOpen={Boolean(labelModalCycle)}
        onClose={() => setLabelModalCycle(null)}
        cycle={labelModalCycle}
      />
    </div>
  )
}
export default InventoryPage
