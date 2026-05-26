import React from 'react'
import { PricingTable } from '../../components/admin/pricing'

export const PricingPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-playfair text-navy">Precios</h1>
        <p className="text-sm text-gray-600 font-montserrat mt-1">
          Gestiona los precios de los procedimientos y consulta el historial de cambios
        </p>
      </div>

      <PricingTable />
    </div>
  )
}
