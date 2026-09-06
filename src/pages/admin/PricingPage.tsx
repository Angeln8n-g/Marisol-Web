import React, { useState } from 'react'
import { PricingTable, BudgetGeneratorModal } from '../../components/admin/pricing'

export const PricingPage: React.FC = () => {
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false)

  return (
    <div className="space-y-6 font-montserrat">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-playfair text-navy font-bold">Catálogo de Precios</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gestiona los precios vigentes de tratamientos, audita cambios y elabora presupuestos formales
          </p>
        </div>

        <button
          onClick={() => setIsBudgetModalOpen(true)}
          className="px-4 py-2 bg-gold text-white text-sm font-semibold rounded-md hover:bg-gold/90 transition-colors flex items-center gap-2 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          + Generar Presupuesto
        </button>
      </div>

      <PricingTable />

      <BudgetGeneratorModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
      />
    </div>
  )
}

