import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { ConsentTemplate, SignedConsent } from '../types'

export function useConsentTemplates() {
  return useQuery({
    queryKey: ['consent-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consent_templates')
        .select('*')
        .eq('is_active', true)
        .order('title', { ascending: true })

      if (error) throw error
      return (data || []) as unknown as ConsentTemplate[]
    },
    staleTime: 10 * 60 * 1000,
  })
}

export function usePatientConsents(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patient-consents', patientId],
    queryFn: async () => {
      if (!patientId) return []

      const { data, error } = await supabase
        .from('signed_consents')
        .select('*, procedure:procedures(name, category), template:consent_templates(title, code, category)')
        .eq('patient_id', patientId)
        .order('signed_at', { ascending: false })

      if (error) throw error
      return (data || []) as unknown as SignedConsent[]
    },
    enabled: Boolean(patientId),
  })
}

export function useSignConsent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (consentData: {
      patient_id: string
      procedure_id?: string
      doctor_name: string
      doctor_id?: string
      doctor_exequatur?: string
      doctor_signature_url?: string
      template_id?: string
      content_rendered: string
      signature_data_url?: string
      signer_role?: 'patient' | 'guardian' | 'representative'
      signer_name?: string
      signer_id_doc?: string
      metadata?: Record<string, any>
    }) => {
      const { data, error } = await supabase
        .from('signed_consents')
        .insert({
          patient_id: consentData.patient_id,
          procedure_id: consentData.procedure_id || null,
          doctor_name: consentData.doctor_name,
          doctor_id: consentData.doctor_id || null,
          doctor_exequatur: consentData.doctor_exequatur || '4521-18',
          doctor_signature_url: consentData.doctor_signature_url || null,
          template_id: consentData.template_id || null,
          content_rendered: consentData.content_rendered,
          signature_data_url: consentData.signature_data_url || null,
          signer_role: consentData.signer_role || 'patient',
          signer_name: consentData.signer_name || null,
          signer_id_doc: consentData.signer_id_doc || null,
          metadata: consentData.metadata || {},
          status: 'signed',
        } as never)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patient-consents', variables.patient_id] })
    },
  })
}
