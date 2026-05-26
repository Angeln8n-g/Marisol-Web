import React, { useState, useEffect } from 'react'
import { useClinics } from '../../hooks/useClinics'
import { ClinicMap, ClinicCard, ClinicWorkloadChart } from '../../components/admin/clinics'
import type { ClinicWorkload } from '../../types'

export const ClinicsPage: React.FC = () => {
  const { clinics, isLoading, updateClinic, calculateClinicWorkloads } = useClinics()
  const [workloads, setWorkloads] = useState<ClinicWorkload[]>([])
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
    await updateClinic({ id, is_active: !isActive })
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-playfair text-navy">Clínicas</h1>
        <p className="text-sm text-gray-600 font-montserrat mt-1">
          Gestiona las sedes y consulta la carga laboral
        </p>
      </div>

      <ClinicMap clinics={clinics} workloads={workloads} />

      <div className="grid lg:grid-cols-2 gap-6">
        <ClinicWorkloadChart workloads={workloads} />

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-navy font-montserrat">Sedes</h3>
          {clinics.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <p className="text-sm text-gray-500 font-montserrat">No hay clínicas registradas</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {clinics.map((clinic) => (
                <ClinicCard
                  key={clinic.id}
                  clinic={clinic}
                  onToggleActive={() => handleToggleActive(clinic.id, clinic.is_active)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
