import { describe, it, expect } from 'vitest'
import {
  createInitialOdontogramData,
  createDefaultToothState,
  getSurfaceColor,
} from './odontogramConstants'

describe('Odontogram Digital Logic', () => {
  it('should initialize 32 teeth for adult dentition', () => {
    const adultData = createInitialOdontogramData('adult')
    expect(Object.keys(adultData).length).toBe(32)
    expect(adultData['18']).toBeDefined()
    expect(adultData['48']).toBeDefined()
    expect(adultData['11'].general_condition).toBe('healthy')
    expect(adultData['11'].surfaces.occlusal_incisal).toBe('healthy')
  })

  it('should initialize 20 teeth for pediatric dentition', () => {
    const pediatricData = createInitialOdontogramData('pediatric')
    expect(Object.keys(pediatricData).length).toBe(20)
    expect(pediatricData['55']).toBeDefined()
    expect(pediatricData['85']).toBeDefined()
    expect(pediatricData['11']).toBeUndefined()
  })

  it('should return correct surface colors for dental conditions', () => {
    expect(getSurfaceColor('healthy')).toBe('#ffffff')
    expect(getSurfaceColor('caries')).toBe('#ef4444')
    expect(getSurfaceColor('composite')).toBe('#3b82f6')
    expect(getSurfaceColor('amalgam')).toBe('#64748b')
    expect(getSurfaceColor('sealant')).toBe('#f97316')
  })

  it('should allow modifying tooth surfaces and general condition', () => {
    const tooth = createDefaultToothState(16)
    tooth.surfaces.occlusal_incisal = 'caries'
    tooth.surfaces.mesial = 'composite'
    tooth.general_condition = 'crown'
    tooth.notes = 'Corona sobre muñón vital'

    expect(tooth.surfaces.occlusal_incisal).toBe('caries')
    expect(tooth.surfaces.mesial).toBe('composite')
    expect(tooth.general_condition).toBe('crown')
    expect(tooth.notes).toBe('Corona sobre muñón vital')
  })
})
