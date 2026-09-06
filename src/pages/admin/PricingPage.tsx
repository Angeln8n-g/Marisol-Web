import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { PricingTable } from '../../components/admin/pricing'
import { BudgetModal } from '../../components/admin/budgets'

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

        <div className="flex items-center gap-2">
          <Link
            to="/admin/budgets"
            className="px-3.5 py-2 border border-gold text-navy text-xs font-semibold rounded-md hover:bg-gold/10 transition-colors flex items-center gap-1.5"
          >
            Ver Presupuestos →
          </Link>
          <button
            onClick={() => setIsBudgetModalOpen(true)}
            className="px-4 py-2 bg-gold text-white text-xs font-bold rounded-md hover:bg-gold/90 transition-colors flex items-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            + Nuevo Presupuesto
          </button>
        </div>
      </div>

      <PricingTable />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
      />
    </div>
  )
}


