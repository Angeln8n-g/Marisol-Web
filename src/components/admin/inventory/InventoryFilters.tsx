import React from 'react'
import type { Clinic, InventoryItemType } from '../../../types'

export type InventoryTabType = InventoryItemType | 'all' | 'maintenance' | 'movements' | 'purchase_orders' | 'sterilization'
export type StockHealthFilter = 'all' | 'optimal' | 'low_stock' | 'out_of_stock'

interface InventoryFiltersProps {
  clinics: Clinic[]
  selectedClinicId: string
  onClinicChange: (clinicId: string) => void
  activeTab: InventoryTabType
  onTabChange: (tab: InventoryTabType) => void
  searchTerm: string
  onSearchChange: (search: string) => void
  stockFilter: StockHealthFilter
  onStockFilterChange: (filter: StockHealthFilter) => void
  onOpenCreateItem: () => void
  onOpenCreateMaintenance: () => void
  onOpenMovementModal: () => void
  onExportCSV: () => void
  itemsCount: number
}

export const InventoryFilters: React.FC<InventoryFiltersProps> = ({
  clinics,
  selectedClinicId,
  onClinicChange,
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  stockFilter,
  onStockFilterChange,
  onOpenCreateItem,
  onOpenCreateMaintenance,
  onOpenMovementModal,
  onExportCSV,
  itemsCount,
}) => {
  return (
    <div className="space-y-4 font-montserrat">
      {/* Barra superior de controles: Selector de Clínica, Búsqueda y Botones de Acción */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
        {/* Izquierda: Sede + Búsqueda */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-2xl">
          <div className="sm:w-52 flex-shrink-0">
            <select
              value={selectedClinicId}
              onChange={(e) => onClinicChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold transition-colors"
            >
              <option value="">Todas las Sedes</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por artículo, marca o SKU..."
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold transition-colors"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 text-xs"
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Derecha: Exportar CSV + Movimiento Rápido + Botón Principal */}
        <div className="flex items-center gap-2 justify-end flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={onExportCSV}
            title="Descargar listado filtrado en formato CSV"
            className="px-3 py-2 bg-white border border-gray-300 hover:border-navy text-navy text-xs font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <svg className="w-4 h-4 text-navy/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span className="hidden sm:inline">Exportar</span> CSV
          </button>

          <button
            type="button"
            onClick={onOpenMovementModal}
            title="Registrar entrada, salida clínica o traslado"
            className="px-3.5 py-2 bg-white border border-gold/60 text-navy hover:bg-gold/15 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span>± Movimiento</span>
          </button>

          {activeTab === 'maintenance' ? (
            <button
              type="button"
              onClick={onOpenCreateMaintenance}
              className="px-4 py-2 bg-gold text-white text-xs font-bold rounded-xl hover:bg-gold/90 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Programar Mantenimiento
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenCreateItem}
              className="px-4 py-2 bg-gold text-white text-xs font-bold rounded-xl hover:bg-gold/90 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Ítem
            </button>
          )}
        </div>
      </div>


      {/* Tabs principales de Categoría y Chips de Salud de Stock */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 pb-1">
        {/* Tabs de Tipo */}
        <div className="flex gap-1 overflow-x-auto py-1 scrollbar-none">
          <button
            onClick={() => onTabChange('all')}
            className={`pb-2.5 px-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
              activeTab === 'all'
                ? 'border-gold text-navy font-bold'
                : 'border-transparent text-gray-500 hover:text-navy'
            }`}
          >
            Todo el Inventario
          </button>
          <button
            onClick={() => onTabChange('tool')}
            className={`pb-2.5 px-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
              activeTab === 'tool'
                ? 'border-gold text-navy font-bold'
                : 'border-transparent text-gray-500 hover:text-navy'
            }`}
          >
            Herramientas y Equipos
          </button>
          <button
            onClick={() => onTabChange('consumable_clinical')}
            className={`pb-2.5 px-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
              activeTab === 'consumable_clinical'
                ? 'border-gold text-navy font-bold'
                : 'border-transparent text-gray-500 hover:text-navy'
            }`}
          >
            Material Gastable Clínico
          </button>
          <button
            onClick={() => onTabChange('consumable_admin')}
            className={`pb-2.5 px-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
              activeTab === 'consumable_admin'
                ? 'border-gold text-navy font-bold'
                : 'border-transparent text-gray-500 hover:text-navy'
            }`}
          >
            Gastable Administrativo
          </button>
          <button
            onClick={() => onTabChange('maintenance')}
            className={`pb-2.5 px-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
              activeTab === 'maintenance'
                ? 'border-gold text-navy font-bold'
                : 'border-transparent text-gray-500 hover:text-navy'
            }`}
          >
            Mantenimiento y Servicios
          </button>
          <button
            onClick={() => onTabChange('movements')}
            className={`pb-2.5 px-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 flex items-center gap-1 ${
              activeTab === 'movements'
                ? 'border-gold text-navy font-bold'
                : 'border-transparent text-gray-500 hover:text-navy'
            }`}
          >
            <span>🔄 Kárdex y Movimientos</span>
          </button>
          <button
            onClick={() => onTabChange('purchase_orders')}
            className={`pb-2.5 px-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 flex items-center gap-1 ${
              activeTab === 'purchase_orders'
                ? 'border-gold text-navy font-bold'
                : 'border-transparent text-gray-500 hover:text-navy'
            }`}
          >
            <span>📦 Órdenes de Compra</span>
          </button>
          <button
            onClick={() => onTabChange('sterilization')}
            className={`pb-2.5 px-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 flex items-center gap-1 ${
              activeTab === 'sterilization'
                ? 'border-gold text-navy font-bold'
                : 'border-transparent text-gray-500 hover:text-navy'
            }`}
          >
            <span>🛡️ Autoclave y Bioseguridad</span>
          </button>
        </div>

        {/* Chips de filtro por Stock (solo si estamos en tabs de productos) */}
        {activeTab !== 'maintenance' &&
          activeTab !== 'movements' &&
          activeTab !== 'purchase_orders' &&
          activeTab !== 'sterilization' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[11px] text-gray-400 font-medium mr-1 hidden lg:inline">Estado:</span>
            <button
              type="button"
              onClick={() => onStockFilterChange('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                stockFilter === 'all'
                  ? 'bg-navy text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos ({itemsCount})
            </button>
            <button
              type="button"
              onClick={() => onStockFilterChange('low_stock')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 ${
                stockFilter === 'low_stock'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Stock Bajo
            </button>
            <button
              type="button"
              onClick={() => onStockFilterChange('out_of_stock')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 ${
                stockFilter === 'out_of_stock'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
              Agotados
            </button>
            <button
              type="button"
              onClick={() => onStockFilterChange('optimal')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 ${
                stockFilter === 'optimal'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Óptimo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
