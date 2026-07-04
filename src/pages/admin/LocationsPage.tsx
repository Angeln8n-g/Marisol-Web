import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useClinicLocations } from '../../hooks/useClinicLocations'
import { useDeleteClinic, useUpdateClinic } from '../../hooks/useClinicMutations'
import { AdminLocationList } from '../../components/admin/clinics'

/**
 * LocationsPage Component
 * 
 * Admin page for viewing and managing all clinic locations.
 * 
 * **Implements: Requirements 1.1, 1.3, 1.4**
 * 
 * Features:
 * - Display all clinic locations in a list
 * - Navigate to create new location
 * - Navigate to edit existing location
 * - Delete clinic locations (soft delete)
 * - Toggle active/inactive status
 * - Show success/error notifications
 */

export const LocationsPage: React.FC = () => {
  const location = useLocation()
  const { data: clinics = [], isLoading } = useClinicLocations({ includeInactive: true })
  const { mutateAsync: deleteClinic } = useDeleteClinic()
  const { mutateAsync: updateClinic } = useUpdateClinic()
  
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Handle notifications from navigation state (e.g., after successful create/update)
  useEffect(() => {
    if (location.state?.notification) {
      setNotification(location.state.notification)
      setTimeout(() => setNotification(null), 3000)
      // Clear the navigation state
      window.history.replaceState({}, document.title)
    }
  }, [location])

  const handleDelete = async (id: string) => {
    try {
      await deleteClinic(id)
      setNotification({ type: 'success', message: 'Clínica eliminada correctamente' })
      setTimeout(() => setNotification(null), 3000)
    } catch (error) {
      setNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Error al eliminar la clínica' 
      })
      setTimeout(() => setNotification(null), 5000)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateClinic({ id, data: { is_active: !currentStatus } })
      setNotification({ 
        type: 'success', 
        message: `Clínica ${!currentStatus ? 'activada' : 'desactivada'} correctamente` 
      })
      setTimeout(() => setNotification(null), 3000)
    } catch (error) {
      setNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Error al actualizar el estado' 
      })
      setTimeout(() => setNotification(null), 5000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-playfair text-navy">Gestión de Locaciones</h1>
        <p className="text-sm text-gray-600 font-montserrat mt-1">
          Administra las sedes de las clínicas dentales
        </p>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`p-4 rounded-md border ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
          role="alert"
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="text-sm font-montserrat">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Location List */}
      <AdminLocationList
        clinics={clinics}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
        isLoading={isLoading}
      />
    </div>
  )
}
