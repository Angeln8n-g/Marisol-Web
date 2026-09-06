import React from 'react'

interface InventoryStatsProps {
  totalValuation: number
  totalItems: number
  lowStockCount: number
  outOfStockCount: number
  expiringBatchesCount: number
  pendingMaintenancesCount: number
  activeStockFilter?: string
  onSelectStockFilter?: (filter: 'all' | 'low_stock' | 'out_of_stock') => void
  onSelectMaintenanceTab?: () => void
}

export const InventoryStats: React.FC<InventoryStatsProps> = ({
  totalValuation,
  totalItems,
  lowStockCount,
  outOfStockCount,
  expiringBatchesCount,
  pendingMaintenancesCount,
  activeStockFilter = 'all',
  onSelectStockFilter,
  onSelectMaintenanceTab,
}) => {
  const criticalCount = lowStockCount + outOfStockCount

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-montserrat">
      {/* 1. Valor Total del Inventario */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">
            Valor del Inventario
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <p className="text-2xl font-bold text-navy font-playfair mt-2">
          RD$ {totalValuation.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-500">
          <span>{totalItems} producto{totalItems !== 1 ? 's' : ''} valorizado{totalItems !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* 2. Total Artículos Activos */}
      <div 
        onClick={() => onSelectStockFilter?.('all')}
        className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
          activeStockFilter === 'all'
            ? 'border-gold/80 shadow-sm ring-1 ring-gold/40'
            : 'border-gray-200/80 hover:border-gold/50 shadow-sm hover:shadow-md'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">
            Artículos en Catálogo
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        </div>
        <p className="text-2xl font-bold text-navy font-playfair mt-2">
          {totalItems}
        </p>
        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-500">
          <span>Disponibles en el sistema</span>
        </div>
      </div>

      {/* 3. Stock Crítico / Agotado (Interactivo) */}
      <div
        onClick={() => onSelectStockFilter?.(activeStockFilter === 'low_stock' ? 'all' : 'low_stock')}
        className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
          activeStockFilter === 'low_stock'
            ? 'border-amber-400 bg-amber-50/20 ring-2 ring-amber-300 shadow-sm'
            : 'border-gray-200/80 hover:border-amber-400 shadow-sm hover:shadow-md'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">
            Stock Crítico / Agotado
          </span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            criticalCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'
          }`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
        <p className={`text-2xl font-bold font-playfair mt-2 ${
          criticalCount > 0 ? 'text-amber-600' : 'text-navy'
        }`}>
          {criticalCount}
        </p>
        <div className="flex items-center justify-between mt-1 text-[11px]">
          <span className="text-gray-500">
            {outOfStockCount} agotado{outOfStockCount !== 1 ? 's' : ''} · {lowStockCount} bajo mín.
          </span>
          <span className="text-amber-700 font-medium text-[10px]">
            {activeStockFilter === 'low_stock' ? '✓ Filtrando' : 'Clic para filtrar'}
          </span>
        </div>
      </div>

      {/* 4. Alertas Preventivas (Lotes & Mantenimiento) */}
      <div 
        onClick={onSelectMaintenanceTab}
        className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">
            Servicios & Caducidad
          </span>
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <p className="text-2xl font-bold text-navy font-playfair mt-2">
          {expiringBatchesCount + pendingMaintenancesCount}
        </p>
        <div className="flex items-center justify-between mt-1 text-[11px]">
          <span className="text-gray-500">
            {expiringBatchesCount} lotes &lt; 60d · {pendingMaintenancesCount} mantenimientos
          </span>
          <span className="text-purple-700 font-medium text-[10px]">Ver bitácora →</span>
        </div>
      </div>
    </div>
  )
}
