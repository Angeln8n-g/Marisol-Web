import React from 'react'
import { usePatientAnalytics } from '../../../../hooks/usePatientAnalytics'

export const PatientAnalytics: React.FC = () => {
  const { data, isLoading, error } = usePatientAnalytics()

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-6 w-6 text-gold" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-navy font-montserrat mb-4">Patient Analytics</h3>
        <p className="text-red-500 text-sm font-montserrat">Error loading patient data</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-navy font-montserrat mb-4">Patient Analytics</h3>
        <p className="text-gray-500 text-sm font-montserrat">No patient data available</p>
      </div>
    )
  }

  const { totalPatients, newPatients, returningPatients, genderDistribution, ageGroups, averageAge } = data

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-navy font-montserrat mb-4">Patient Analytics</h3>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-playfair font-bold text-navy">{totalPatients}</p>
          <p className="text-xs text-gray-500 font-montserrat">Total</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-playfair font-bold text-green-600">{newPatients}</p>
          <p className="text-xs text-gray-500 font-montserrat">New</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-playfair font-bold text-blue-600">{returningPatients}</p>
          <p className="text-xs text-gray-500 font-montserrat">Returning</p>
        </div>
      </div>

      {genderDistribution.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-600 font-montserrat mb-2">Gender</p>
          <div className="space-y-1">
            {genderDistribution.map(({ gender, count }) => (
              <div key={gender} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 font-montserrat capitalize">{gender.replace('_', ' ')}</span>
                <span className="text-navy font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {ageGroups.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-600 font-montserrat mb-2">Age Groups</p>
          <div className="space-y-1">
            {ageGroups.map(({ group, count }) => (
              <div key={group} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 font-montserrat">{group}</span>
                <span className="text-navy font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 font-montserrat">Average Age</span>
          <span className="text-navy font-medium">{averageAge} years</span>
        </div>
      </div>
    </div>
  )
}