import React from 'react'
import type { SterilizationPackage, SterilizationCycle } from '../../../types'

interface SterilePouchLabelModalProps {
  isOpen: boolean
  onClose: () => void
  cycle?: SterilizationCycle | null
  packageItem?: SterilizationPackage | null
}

export const SterilePouchLabelModal: React.FC<SterilePouchLabelModalProps> = ({
  isOpen,
  onClose,
  cycle,
  packageItem,
}) => {
  if (!isOpen) return null

  const packagesToDisplay = packageItem ? [packageItem] : cycle?.packages || []

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-montserrat overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-gray-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center text-xl font-bold">
              🏷️
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-playfair font-bold text-navy">
                Rótulos de Trazabilidad y Esterilidad
              </h3>
              <p className="text-xs text-gray-500">
                Imprime o adhiere a las bolsas autosellables y casetes para trazabilidad en sillón
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Printable Labels Grid */}
        <div className="space-y-4 max-h-96 overflow-y-auto p-2">
          {packagesToDisplay.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-xs">
              No hay paquetes disponibles para rotular.
            </div>
          ) : (
            packagesToDisplay.map((pkg) => (
              <div
                key={pkg.id || pkg.package_code}
                className="border-2 border-dashed border-gray-300 rounded-2xl p-4 bg-white hover:border-teal-500 transition-colors shadow-2xs space-y-2 text-xs"
              >
                {/* Clinic & Pouch Header */}
                <div className="flex items-center justify-between border-b border-gray-200 pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-playfair font-bold text-navy text-xs uppercase tracking-wider">
                      Dra. Marisol - Bioseguridad Dental
                    </span>
                    <span className="px-1.5 py-0.5 bg-teal-100 text-teal-800 text-[10px] font-bold rounded-md">
                      ESTÉRIL
                    </span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-gray-700">
                    {pkg.package_code}
                  </span>
                </div>

                {/* Content Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div className="sm:col-span-2">
                    <span className="text-gray-400 block text-[10px]">Contenido:</span>
                    <strong className="text-navy text-xs">{pkg.description}</strong>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[10px]">Fecha Esterilización:</span>
                    <strong className="text-gray-700">{pkg.sterilization_date}</strong>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[10px]">Fecha de Caducidad:</span>
                    <strong className="text-red-700 font-bold bg-red-50 px-1 py-0.5 rounded">
                      {pkg.expiration_date}
                    </strong>
                  </div>
                </div>

                {/* Machine & Operator Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[10px] text-gray-500">
                  <div>
                    {cycle ? (
                      <span>
                        Ciclo #{cycle.cycle_number} • {cycle.autoclave_name} ({cycle.temperature_c}°C / {cycle.pressure_bar} bar)
                      </span>
                    ) : (
                      <span>Autoclave Clase B • Control Físico y Químico Aprobado</span>
                    )}
                  </div>
                  <div className="font-medium">
                    Op: {cycle?.operator_name || 'Asistente Dental'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            {packagesToDisplay.length} etiqueta(s) lista(s) para impresión térmica / papel
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-xl text-xs text-gray-600 hover:bg-gray-50"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              🖨️ Imprimir Rótulos
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
