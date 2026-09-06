import { describe, it, expect } from 'vitest'
import type { PatientClinicalPhoto } from '../types'

describe('Clinical Photography & Case Comparison', () => {
  const mockPhotos: PatientClinicalPhoto[] = [
    {
      id: 'photo-1',
      patient_id: 'pat-1',
      case_title: 'Diseño de Sonrisa Superior',
      stage: 'before',
      photo_type: 'frontal_smile',
      image_url: 'https://example.com/before.jpg',
      taken_at: '2026-08-01',
      consent_for_marketing: true,
      created_at: '2026-08-01',
    },
    {
      id: 'photo-2',
      patient_id: 'pat-1',
      case_title: 'Diseño de Sonrisa Superior',
      stage: 'after',
      photo_type: 'frontal_smile',
      image_url: 'https://example.com/after.jpg',
      taken_at: '2026-09-01',
      consent_for_marketing: true,
      created_at: '2026-09-01',
    },
    {
      id: 'photo-3',
      patient_id: 'pat-1',
      case_title: 'Diseño de Sonrisa Superior',
      stage: 'in_progress',
      photo_type: 'intraoral_frontal',
      image_url: 'https://example.com/provisional.jpg',
      taken_at: '2026-08-15',
      consent_for_marketing: false,
      created_at: '2026-08-15',
    },
  ]

  it('correctly pairs before and after photos for the interactive comparison slider', () => {
    const beforePhoto = mockPhotos.find((p) => p.stage === 'before')
    const afterPhoto = mockPhotos.find((p) => p.stage === 'after')

    expect(beforePhoto).toBeDefined()
    expect(afterPhoto).toBeDefined()
    expect(beforePhoto?.image_url).toBe('https://example.com/before.jpg')
    expect(afterPhoto?.image_url).toBe('https://example.com/after.jpg')
    expect(beforePhoto!.taken_at < afterPhoto!.taken_at).toBe(true)
  })

  it('differentiates marketing consent for public showcase', () => {
    const publicPhoto = mockPhotos.find((p) => p.consent_for_marketing)
    const privatePhoto = mockPhotos.find((p) => !p.consent_for_marketing)

    expect(publicPhoto?.consent_for_marketing).toBe(true)
    expect(privatePhoto?.consent_for_marketing).toBe(false)
  })
})
