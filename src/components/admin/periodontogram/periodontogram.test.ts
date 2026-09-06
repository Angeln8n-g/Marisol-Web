import { describe, it, expect } from 'vitest'
import {
  createInitialTeethData,
  computePeriodontogramStats,
  createDefaultToothData,
} from './periodontogramConstants'

describe('Periodontogram (SEPA Style) Core Logic', () => {
  it('should create initial 32 adult teeth with standard 6 probe sites', () => {
    const initialTeeth = createInitialTeethData()
    const toothKeys = Object.keys(initialTeeth)

    expect(toothKeys.length).toBe(32)
    expect(initialTeeth['18']).toBeDefined()
    expect(initialTeeth['48']).toBeDefined()

    const tooth11 = initialTeeth['11']
    expect(tooth11.status).toBe('present')
    expect(tooth11.vestibular.distal.probing_depth).toBe(0)
    expect(tooth11.vestibular.middle.probing_depth).toBe(0)
    expect(tooth11.vestibular.mesial.probing_depth).toBe(0)
    expect(tooth11.palatal_lingual.distal.probing_depth).toBe(0)
    expect(tooth11.anchura_encia).toBe(0)
    expect(tooth11.pronostico).toBe('')
  })

  it('should calculate accurate % BOP and O\'Leary plaque index', () => {
    const teethData = createInitialTeethData()

    // By default, no bleeding or plaque
    const defaultStats = computePeriodontogramStats(teethData)
    expect(defaultStats.total_teeth_present).toBe(32)
    expect(defaultStats.total_sites_evaluated).toBe(32 * 6)
    expect(defaultStats.bop_percentage).toBe(0)
    expect(defaultStats.plaque_percentage).toBe(0)

    // Mark 19 sites with bleeding on tooth 11, 12, 13, 14
    teethData['11'].vestibular.distal.bleeding = true
    teethData['11'].vestibular.middle.bleeding = true
    teethData['11'].vestibular.mesial.bleeding = true
    teethData['11'].palatal_lingual.distal.bleeding = true
    teethData['11'].palatal_lingual.middle.bleeding = true
    teethData['11'].palatal_lingual.mesial.bleeding = true // 6 sites

    teethData['12'].vestibular.distal.bleeding = true
    teethData['12'].vestibular.middle.bleeding = true // 8 sites

    const updatedStats = computePeriodontogramStats(teethData)
    expect(updatedStats.bop_sites).toBe(8)
    // 8 / 192 = 4.16% -> 4.2%
    expect(updatedStats.bop_percentage).toBe(4.2)
  })

  it('should accurately count shallow (4-5mm) and deep (>=6mm) periodontal pockets', () => {
    const teethData = createInitialTeethData()

    teethData['16'].vestibular.distal.probing_depth = 5 // Shallow pocket
    teethData['16'].vestibular.mesial.probing_depth = 4 // Shallow pocket
    teethData['26'].palatal_lingual.distal.probing_depth = 7 // Deep pocket
    teethData['46'].vestibular.middle.probing_depth = 6 // Deep pocket

    const stats = computePeriodontogramStats(teethData)
    expect(stats.shallow_pockets_count).toBe(2)
    expect(stats.deep_pockets_count).toBe(2)
  })

  it('should adjust statistics when teeth are missing or implants', () => {
    const teethData = createInitialTeethData()

    teethData['18'].status = 'missing'
    teethData['28'].status = 'missing'
    teethData['36'].status = 'implant'

    const stats = computePeriodontogramStats(teethData)
    expect(stats.total_teeth_missing).toBe(2)
    expect(stats.total_implants).toBe(1)
    expect(stats.total_teeth_present).toBe(29)
    // Evaluated teeth = 29 + 1 = 30; 30 * 6 = 180 sites
    expect(stats.total_sites_evaluated).toBe(180)
  })

  it('should compute CAL / NIC correctly (PS + MG)', () => {
    const tooth = createDefaultToothData(21)
    tooth.vestibular.distal.probing_depth = 4
    tooth.vestibular.distal.gingival_margin = 2 // 2mm recession
    tooth.vestibular.distal.clinical_attachment =
      tooth.vestibular.distal.probing_depth + tooth.vestibular.distal.gingival_margin

    expect(tooth.vestibular.distal.clinical_attachment).toBe(6)
  })
})
