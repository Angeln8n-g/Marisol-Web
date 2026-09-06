import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClinics } from '../../hooks/useClinics'
import { ClinicMap, ClinicCard, ClinicWorkloadChart, AdminLocationList } from '../../components/admin/clinics'
import type { ClinicWorkload } from '../../types'

export const ClinicsPage: React.FC = () => {
  const navigate = useNavigate()
  const { clinics, isLoading, updateClinic, deleteClinic, calculateClinicWorkloads } = useClinics()
  const [workloads, setWorkloads] = useState<ClinicWorkload[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'manage'>('overview')
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const dailyCapacity = 20

  useEffect(() => {
    const loadWorkloads = async () => {
      const today = new Date().toISOString().split('T')[0]
      const result = await calculateClinicWorkloads(today, dailyCapacity)
      setWorkloads(result)
    }
    loadWorkloads()
  }, [clinics, calculateClinicWorkloads])

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateClinic({ id, is_active: !isActive })
      setNotification({
        type: 'success',
        message: `Clínica ${!isActive ? 'activada' : 'desactivada'} correctamente`,
      })
      setTimeout(() => setNotification(null), 3000)
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error al actualizar el estado',
      })
      setTimeout(() => setNotification(null), 5000)
    }
  }

  const handleDeleteClinic = async (id: string) => {
    try {
      await deleteClinic(id)
      setNotification({
        type: 'success',
        message: 'Clínica eliminada correctamente (historial de citas preservado)',
      })
      setTimeout(() => setNotification(null), 3500)
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error al eliminar la clínica',
      })
      setTimeout(() => setNotification(null), 5000)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-8 w-8 text-gold" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with actions and tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-playfair text-navy font-bold">Gestión de Clínicas y Sedes</h1>
          <p className="text-sm text-gray-600 font-montserrat mt-1">
            Administra ubicaciones, agrega o quita sedes y monitorea la carga laboral
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab buttons */}
          <div className="inline-flex rounded-md border border-gray-200 bg-white p-0.5 shadow-sm">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 text-xs font-semibold rounded font-montserrat flex items-center gap-1.5 transition-colors ${
                activeTab === 'overview'
                  ? 'bg-navy text-white shadow-xs'
                  : 'text-gray-600 hover:text-navy hover:bg-gray-50'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Mapa & Carga
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-3 py-1.5 text-xs font-semibold rounded font-montserrat flex items-center gap-1.5 transition-colors ${
                activeTab === 'manage'
                  ? 'bg-navy text-white shadow-xs'
                  : 'text-gray-600 hover:text-navy hover:bg-gray-50'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Gestión de Sedes ({clinics.length})
            </button>
          </div>

          <button
            onClick={() => navigate('/admin/locations/new')}
            className="px-4 py-2 bg-gold text-white text-sm font-semibold rounded-md hover:bg-gold/90 transition-colors flex items-center gap-2 shadow-sm font-montserrat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            + Nueva Clínica
          </button>
        </div>
      </div>

      {/* Notification banner */}
      {notification && (
        <div
          className={`p-4 rounded-md border shadow-sm font-montserrat text-sm flex items-center gap-2 ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
          role="alert"
        >
          {notification.type === 'success' ? (
            <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Tab content */}
      {activeTab === 'overview' ? (
        <div className="space-y-6">
          <ClinicMap clinics={clinics} workloads={workloads} />

          <div className="grid lg:grid-cols-2 gap-6">
            <ClinicWorkloadChart workloads={workloads} />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-navy font-montserrat">
                  Sedes Activas e Inactivas ({clinics.length})
                </h3>
                <button
                  onClick={() => navigate('/admin/locations/new')}
                  className="text-xs text-gold font-semibold hover:underline font-montserrat"
                >
                  + Agregar Sede
                </button>
              </div>

              {clinics.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center shadow-sm">
                  <p className="text-sm text-gray-500 font-montserrat">No hay clínicas registradas</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {clinics.map((clinic) => (
                    <ClinicCard
                      key={clinic.id}
                      clinic={clinic}
                      onEdit={() => navigate(`/admin/locations/${clinic.id}/edit`)}
                      onToggleActive={() => handleToggleActive(clinic.id, clinic.is_active)}
                      onDelete={() => handleDeleteClinic(clinic.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <AdminLocationList
          clinics={clinics}
          onDelete={handleDeleteClinic}
          onToggleActive={handleToggleActive}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}

