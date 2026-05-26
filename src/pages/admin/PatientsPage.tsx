import React from 'react'
import { PatientList } from '../../components/admin/patients'

export const PatientsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-playfair text-navy">Pacientes</h1>
        <p className="text-sm text-gray-600 font-montserrat mt-1">
          Gestiona los pacientes registrados en el sistema
        </p>
      </div>

      <PatientList />
    </div>
  )
}
