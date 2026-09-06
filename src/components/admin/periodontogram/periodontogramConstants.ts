import type { PeriodontogramToothData, PeriodontogramStats, PeriodontogramSiteData } from '../../../types'

export const UPPER_TEETH_Q1 = [18, 17, 16, 15, 14, 13, 12, 11]
export const UPPER_TEETH_Q2 = [21, 22, 23, 24, 25, 26, 27, 28]
export const LOWER_TEETH_Q4 = [48, 47, 46, 45, 44, 43, 42, 41]
export const LOWER_TEETH_Q3 = [31, 32, 33, 34, 35, 36, 37, 38]

export const UPPER_TEETH = [...UPPER_TEETH_Q1, ...UPPER_TEETH_Q2]
export const LOWER_TEETH = [...LOWER_TEETH_Q4, ...LOWER_TEETH_Q3]
export const ALL_TEETH = [...UPPER_TEETH, ...LOWER_TEETH]

// Piezas con furcación susceptible (molares y premolares superiores)
export const FURCATION_TEETH = [18, 17, 16, 14, 24, 26, 27, 28, 38, 37, 36, 46, 47, 48]

export const createDefaultSite = (pd = 0, gm = 0): PeriodontogramSiteData => ({
  probing_depth: pd,
  gingival_margin: gm,
  clinical_attachment: pd + gm,
  bleeding: false,
  plaque: false,
  suppuration: false,
})

export const createDefaultToothData = (toothNumber: number): PeriodontogramToothData => ({
  tooth_number: toothNumber,
  status: 'present',
  mobility: 0,
  furcation: FURCATION_TEETH.includes(toothNumber) ? 0 : undefined,
  vestibular: {
    distal: createDefaultSite(0, 0),
    middle: createDefaultSite(0, 0),
    mesial: createDefaultSite(0, 0),
  },
  palatal_lingual: {
    distal: createDefaultSite(0, 0),
    middle: createDefaultSite(0, 0),
    mesial: createDefaultSite(0, 0),
  },
  anchura_encia: 0,
  pronostico: '',
  notes: '',
})

export const createInitialTeethData = (): Record<string, PeriodontogramToothData> => {
  const data: Record<string, PeriodontogramToothData> = {}
  ALL_TEETH.forEach((num) => {
    data[num.toString()] = createDefaultToothData(num)
  })
  return data
}

export const computePeriodontogramStats = (
  teethData: Record<string, PeriodontogramToothData>
): PeriodontogramStats => {
  let totalPresent = 0
  let totalMissing = 0
  let totalImplants = 0
  let bopSites = 0
  let plaqueSites = 0
  let shallowPockets = 0
  let deepPockets = 0
  let furcationSites = 0
  let suppurationSites = 0
  let sumProbingDepth = 0
  let sumAttachmentLevel = 0

  const activeTeeth = Object.values(teethData)

  activeTeeth.forEach((tooth) => {
    if (tooth.status === 'missing') {
      totalMissing += 1
      return
    }

    if (tooth.status === 'implant') {
      totalImplants += 1
    } else {
      totalPresent += 1
    }

    if (tooth.furcation && tooth.furcation > 0) {
      furcationSites += 1
    }

    const sites = [
      tooth.vestibular.distal,
      tooth.vestibular.middle,
      tooth.vestibular.mesial,
      tooth.palatal_lingual.distal,
      tooth.palatal_lingual.middle,
      tooth.palatal_lingual.mesial,
    ]

    sites.forEach((site) => {
      if (site.bleeding) bopSites += 1
      if (site.plaque) plaqueSites += 1
      if (site.suppuration) suppurationSites += 1

      sumProbingDepth += site.probing_depth || 0
      sumAttachmentLevel += site.clinical_attachment || 0

      if (site.probing_depth >= 4 && site.probing_depth <= 5) {
        shallowPockets += 1
      } else if (site.probing_depth >= 6) {
        deepPockets += 1
      }
    })
  })

  const totalEvaluatedTeeth = totalPresent + totalImplants
  const totalSitesEvaluated = totalEvaluatedTeeth * 6

  const bopPercentage =
    totalSitesEvaluated > 0 ? Math.round((bopSites / totalSitesEvaluated) * 1000) / 10 : 0
  const plaquePercentage =
    totalSitesEvaluated > 0 ? Math.round((plaqueSites / totalSitesEvaluated) * 1000) / 10 : 0
  const mediaProfundidad =
    totalSitesEvaluated > 0 ? Math.round((sumProbingDepth / totalSitesEvaluated) * 10) / 10 : 0
  const mediaNivelInsercion =
    totalSitesEvaluated > 0 ? Math.round((sumAttachmentLevel / totalSitesEvaluated) * 10) / 10 : 0

  return {
    total_teeth_present: totalPresent,
    total_teeth_missing: totalMissing,
    total_implants: totalImplants,
    total_sites_evaluated: totalSitesEvaluated,
    bop_sites: bopSites,
    bop_percentage: bopPercentage,
    plaque_sites: plaqueSites,
    plaque_percentage: plaquePercentage,
    shallow_pockets_count: shallowPockets,
    deep_pockets_count: deepPockets,
    furcation_sites_count: furcationSites,
    suppuration_sites_count: suppurationSites,
    media_profundidad: mediaProfundidad,
    media_nivel_insercion: mediaNivelInsercion,
  }
}
