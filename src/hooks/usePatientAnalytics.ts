import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

interface PatientAnalyticsOptions {
  dateFrom?: string | null
  dateTo?: string | null
}

export interface PatientAnalytics {
  totalPatients: number
  newPatients: number
  returningPatients: number
  genderDistribution: Array<{ gender: string; count: number }>
  ageGroups: Array<{ group: string; count: number }>
  averageAge: number
}

export function usePatientAnalytics(options: PatientAnalyticsOptions = {}) {
  let { dateFrom, dateTo } = options

  if (!dateFrom && !dateTo) {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - 30)
    dateFrom = from.toISOString().split('T')[0]
    dateTo = to.toISOString().split('T')[0]
  }

  const query = useQuery<PatientAnalytics, Error>({
    queryKey: ['patient-analytics', { dateFrom, dateTo }],
    queryFn: async () => {
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('created_at, gender, birth_date')
        .limit(10000)

      if (patientsError) throw patientsError
      type RawPatient = { created_at: string; gender: string | null; birth_date: string | null }
      const patients = (patientsData ?? []) as unknown as RawPatient[]

      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('patient_id')
        .gte('scheduled_at', `${dateFrom}T00:00:00.000Z`)
        .lte('scheduled_at', `${dateTo}T23:59:59.999Z`)
        .limit(10000)

      if (appointmentsError) throw appointmentsError

      const visitCounts: Record<string, number> = {}
      const appointments = (appointmentsData ?? []) as unknown as { patient_id: string }[]
      appointments.forEach(appointment => {
        visitCounts[appointment.patient_id] = (visitCounts[appointment.patient_id] || 0) + 1
      })

      const newPatients = patients.filter(p => {
        if (p.created_at < dateFrom!) return false
        if (p.created_at > dateTo!) return false
        return true
      }).length

      const returningPatients = Object.values(visitCounts).filter(count => count > 1).length

      const genderCounts: Record<string, number> = {}
      patients.forEach(p => {
        const gender = p.gender || 'prefer_not_to_say'
        genderCounts[gender] = (genderCounts[gender] || 0) + 1
      })
      const genderDistribution = Object.entries(genderCounts)
        .map(([gender, count]) => ({ gender, count }))

      const now = new Date()
      const ageGroups: Record<string, number> = {
        '0-18': 0, '19-30': 0, '31-45': 0, '46-60': 0, '60+': 0,
      }
      let ageSum = 0
      let ageCount = 0

      patients.forEach(p => {
        if (!p.birth_date) return
        const birth = new Date(p.birth_date)
        const age = Math.floor((now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        ageSum += age
        ageCount++

        if (age <= 18) ageGroups['0-18']++
        else if (age <= 30) ageGroups['19-30']++
        else if (age <= 45) ageGroups['31-45']++
        else if (age <= 60) ageGroups['46-60']++
        else ageGroups['60+']++
      })

      const averageAge = ageCount > 0 ? Math.round(ageSum / ageCount) : 0

      return {
        totalPatients: patients.length,
        newPatients,
        returningPatients,
        genderDistribution,
        ageGroups: Object.entries(ageGroups).map(([group, count]) => ({ group, count })),
        averageAge,
      }
    },
    staleTime: 5 * 60 * 1000,
  })

  return { ...query, data: query.data }
}