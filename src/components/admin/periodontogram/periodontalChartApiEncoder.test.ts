import { describe, it, expect } from 'vitest'
import {
  encodeValue,
  encodePeriodontalChartData,
  getPeriodontalChartViewerUrl,
  TOOTH_ORDER_API,
} from './periodontalChartApiEncoder'
import { createInitialTeethData, createDefaultToothData } from './periodontogramConstants'

describe('periodontalChartApiEncoder', () => {
  it('encodeValue adds +50 offset and pads to 2 digits', () => {
    expect(encodeValue(0)).toBe('50')
    expect(encodeValue(1)).toBe('51')
    expect(encodeValue(6)).toBe('56')
    expect(encodeValue(-2)).toBe('48')
    expect(encodeValue(10)).toBe('60')
    expect(encodeValue(NaN)).toBe('50')
  })

  it('contains all 32 teeth in TOOTH_ORDER_API', () => {
    expect(TOOTH_ORDER_API).toHaveLength(32)
    expect(TOOTH_ORDER_API[0]).toBe(18)
    expect(TOOTH_ORDER_API[7]).toBe(11)
    expect(TOOTH_ORDER_API[8]).toBe(28)
    expect(TOOTH_ORDER_API[15]).toBe(21)
    expect(TOOTH_ORDER_API[16]).toBe(38)
    expect(TOOTH_ORDER_API[23]).toBe(31)
    expect(TOOTH_ORDER_API[24]).toBe(48)
    expect(TOOTH_ORDER_API[31]).toBe(41)
  })

  it('generates an exact 1800-digit string for initial exam', () => {
    const teethData = createInitialTeethData()
    const encoded = encodePeriodontalChartData(teethData, { isReevaluation: false })

    expect(encoded).toHaveLength(1800)
    expect(/^[0-9]+$/.test(encoded)).toBe(true)
    // Initial exam begins with "5150"
    expect(encoded.slice(0, 4)).toBe('5150')
  })

  it('generates an exact 1800-digit string for reevaluation', () => {
    const teethData = createInitialTeethData()
    const encoded = encodePeriodontalChartData(teethData, { isReevaluation: true })

    expect(encoded).toHaveLength(1800)
    expect(/^[0-9]+$/.test(encoded)).toBe(true)
    // Reevaluation begins with "5051"
    expect(encoded.slice(0, 4)).toBe('5051')
  })

  it('encodes clinical findings with correct values', () => {
    const teethData = createInitialTeethData()

    // Tooth 18: molar with probing depth 7, bleeding and mobility 2
    const tooth18 = createDefaultToothData(18)
    tooth18.mobility = 2
    tooth18.furcation = 1
    tooth18.palatal_furcation = 2
    tooth18.vestibular.distal.probing_depth = 7
    tooth18.vestibular.distal.gingival_margin = -1
    tooth18.vestibular.distal.bleeding = true
    tooth18.vestibular.distal.plaque = true

    teethData['18'] = tooth18

    const encoded = encodePeriodontalChartData(teethData, { isReevaluation: false })
    expect(encoded).toHaveLength(1800)

    // Prefix for initial exam: "5150"
    // Tooth 18 is first tooth after prefix (starts at index 4)
    // tooth_18: 1 -> "51"
    expect(encoded.slice(4, 6)).toBe('51')
    // mobility_18: 2 -> "52"
    expect(encoded.slice(6, 8)).toBe('52')
    // furcation_18_b: 1 -> "51"
    expect(encoded.slice(8, 10)).toBe('51')
    // furcation_18_dp: 2 -> "52"
    expect(encoded.slice(10, 12)).toBe('52')
    // furcation_18_mp: 0 -> "50"
    expect(encoded.slice(12, 14)).toBe('50')
    // implant_18: 0 -> "50"
    expect(encoded.slice(14, 16)).toBe('50')
    // bop_18_db: 1 -> "51"
    expect(encoded.slice(16, 18)).toBe('51')
  })

  it('marks missing teeth with 0 (50) for tooth and measurements', () => {
    const teethData = createInitialTeethData()
    teethData['18'] = {
      ...createDefaultToothData(18),
      status: 'missing',
    }

    const encoded = encodePeriodontalChartData(teethData)
    // tooth_18: 0 -> "50"
    expect(encoded.slice(4, 6)).toBe('50')
  })

  it('generates a full valid viewer URL', () => {
    const teethData = createInitialTeethData()
    const url = getPeriodontalChartViewerUrl(teethData)

    expect(url.startsWith('https://www.periodontalchart-online.com/api/?i=')).toBe(true)
    const param = url.split('?i=')[1]
    expect(param).toHaveLength(1800)
  })
})
