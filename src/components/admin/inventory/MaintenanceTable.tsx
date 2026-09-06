import React from 'react'
import type { EquipmentMaintenance } from '../../../types'

interface MaintenanceTableProps {
  maintenances: EquipmentMaintenance[]
  isLoading: boolean
  onOpenCreateMaintenance: () => void
  onManageMaintenance: (maint: EquipmentMaintenance) => void
}

export const MaintenanceTable: React.FC<MaintenanceTableProps> = ({
  maintenances,
  isLoading,
  onOpenCreateMaintenance,
  onManageMaintenance,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center shadow-sm">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gold border-t-transparent mb-3"></div>
        <p className="text-xs text-gray-500 font-montserrat">Cargando bitácora de mantenimientos...</p>
      </div>
    )
  }

  if (maintenances.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center shadow-sm space-y-3 font-montserrat">
        <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-500 mx-auto flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h4 className="text-sm font-bold text-navy">No hay mantenimientos programados</h4>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          No se registran servicios técnicos preventivos ni correctivos para los equipos de esta sede.
        </p>
        <button
          type="button"
          onClick={onOpenCreateMaintenance}
          className="px-4 py-2 bg-gold text-white text-xs font-bold rounded-xl hover:bg-gold/90 transition-all shadow-sm inline-flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Programar Primer Mantenimiento
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm font-montserrat">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50/80 text-gray-600 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200">
            <tr>
              <th className="px-5 py-3.5">Equipo / Instrumental</th>
              <th className="px-5 py-3.5">Tipo</th>
              <th className="px-5 py-3.5">Título / Detalle</th>
              <th className="px-5 py-3.5">Técnico Responsable</th>
              <th className="px-5 py-3.5">Fecha Programada</th>
              <th className="px-5 py-3.5">Próximo Servicio</th>
              <th className="px-5 py-3.5">Costo Estimado</th>
              <th className="px-5 py-3.5">Estado</th>
              <th className="px-5 py-3.5 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {maintenances.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-5 py-3.5 font-semibold text-navy">
                  {m.item?.name}
                  {m.item?.serial_number && (
                    <span className="block text-[10px] text-gray-400 font-mono">
                      S/N: {m.item.serial_number}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                      m.maintenance_type === 'preventive'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : m.maintenance_type === 'corrective'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}
                  >
                    {m.maintenance_type === 'preventive'
                      ? 'Preventivo'
                      : m.maintenance_type === 'corrective'
                      ? 'Correctivo'
                      : 'Calibración'}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-medium text-gray-800">{m.title}</td>
                <td className="px-5 py-3.5 text-gray-600">
                  <span className="font-medium text-navy block">{m.technician_name}</span>
                  {m.technician_contact && (
                    <span className="text-[10px] text-gray-400">{m.technician_contact}</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-gray-600 font-medium">{m.scheduled_date}</td>
                <td className="px-5 py-3.5 text-gray-600">{m.next_maintenance_date || '—'}</td>
                <td className="px-5 py-3.5 font-semibold text-navy">
                  RD$ {(Number(m.cost) || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      m.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : m.status === 'in_progress'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : m.status === 'cancelled'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {m.status === 'scheduled'
                      ? 'Programado'
                      : m.status === 'in_progress'
                      ? 'En Curso'
                      : m.status === 'completed'
                      ? 'Completado'
                      : 'Cancelado'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    type="button"
                    onClick={() => onManageMaintenance(m)}
                    className="px-2.5 py-1 rounded-lg border border-gray-200 hover:border-gold text-navy hover:text-gold font-bold text-xs transition-colors bg-white shadow-2xs"
                  >
                    {m.status === 'completed' ? 'Ver Ficha' : 'Gestionar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  )
}
