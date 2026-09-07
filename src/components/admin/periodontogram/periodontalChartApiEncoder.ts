import type { PeriodontogramToothData } from '../../../types'

/**
 * Orden estricto de cuadrantes según la documentación de periodontalchart-online.com:
 * 1. Superior derecho al centro: 18, 17, 16, 15, 14, 13, 12, 11
 * 2. Superior izquierdo al centro: 28, 27, 26, 25, 24, 23, 22, 21
 * 3. Inferior izquierdo al centro: 38, 37, 36, 35, 34, 33, 32, 31
 * 4. Inferior derecho al centro: 48, 47, 46, 45, 44, 43, 42, 41
 */
export const TOOTH_ORDER_API = [
  // Cuadrante 1
  18, 17, 16, 15, 14, 13, 12, 11,
  // Cuadrante 2
  28, 27, 26, 25, 24, 23, 22, 21,
  // Cuadrante 3
  38, 37, 36, 35, 34, 33, 32, 31,
  // Cuadrante 4
  48, 47, 46, 45, 44, 43, 42, 41,
] as const

const UPPER_MOLARS = new Set([18, 17, 16, 26, 27, 28])
const UPPER_PREMOLARS_1 = new Set([14, 24])
const LOWER_MOLARS = new Set([48, 47, 46, 36, 37, 38])

/**
 * Codifica un valor individual añadiendo el desplazamiento +50 y rellenando a 2 dígitos.
 * Ejemplo: 1 -> "51", 0 -> "50", -2 -> "48", 6 -> "56"
 */
export function encodeValue(value: number): string {
  const rounded = Math.round(isNaN(value) ? 0 : value)
  const offset = rounded + 50
  return offset.toString().padStart(2, '0')
}

export interface EncodeOptions {
  isReevaluation?: boolean
}

/**
 * Codifica la totalidad de los datos periodontales en una cadena de exactamente 1.800 dígitos numéricos
 * requerida por el visualizador de periodontalchart-online.com (Universidad de Berna).
 */
export function encodePeriodontalChartData(
  teethData: Record<string, PeriodontogramToothData>,
  options: EncodeOptions = {}
): string {
  const parts: string[] = []

  // 1. Tipo de examen: initial_exam y reevaluation (4 dígitos)
  if (options.isReevaluation) {
    parts.push(encodeValue(0)) // initial_exam = 0 -> "50"
    parts.push(encodeValue(1)) // reevaluation = 1 -> "51"
  } else {
    parts.push(encodeValue(1)) // initial_exam = 1 -> "51"
    parts.push(encodeValue(0)) // reevaluation = 0 -> "50"
  }

  // 2. Iterar por cada diente en el orden de la API
  for (const toothNum of TOOTH_ORDER_API) {
    const tooth = teethData[toothNum.toString()]
    const isMissing = !tooth || tooth.status === 'missing'
    const isImplant = Boolean(tooth && tooth.status === 'implant')

    // tooth_<No>: 0 = ausente, 1 = presente
    parts.push(encodeValue(isMissing ? 0 : 1))

    // mobility_<No>: 0, 1, 2, 3
    parts.push(encodeValue(isMissing ? 0 : tooth.mobility || 0))

    // Furcaciones según anatomía del diente
    if (UPPER_MOLARS.has(toothNum)) {
      // 3 furcaciones: b (bucal), dp (distopalatino), mp (mesiopalatino)
      parts.push(encodeValue(isMissing ? 0 : tooth.furcation || 0))
      parts.push(encodeValue(isMissing ? 0 : tooth.palatal_furcation || 0))
      parts.push(encodeValue(0)) // mp
    } else if (UPPER_PREMOLARS_1.has(toothNum)) {
      // 2 furcaciones: dp (distopalatino), mp (mesiopalatino)
      parts.push(encodeValue(isMissing ? 0 : tooth.furcation || tooth.palatal_furcation || 0))
      parts.push(encodeValue(0)) // mp
    } else if (LOWER_MOLARS.has(toothNum)) {
      // 2 furcaciones: b (bucal), l (lingual)
      parts.push(encodeValue(isMissing ? 0 : tooth.furcation || 0))
      parts.push(encodeValue(isMissing ? 0 : tooth.palatal_furcation || 0))
    }

    // implant_<No>: 0 = no implant, 1 = implant presente (gris)
    parts.push(encodeValue(isImplant ? 1 : 0))

    // Sitios vestibulares (bucales) y palatinos/linguales
    const vest = tooth?.vestibular
    const ling = tooth?.palatal_lingual

    // 5. BoP Vestibular (db, b, mb)
    parts.push(encodeValue(!isMissing && vest?.distal?.bleeding ? 1 : 0))
    parts.push(encodeValue(!isMissing && vest?.middle?.bleeding ? 1 : 0))
    parts.push(encodeValue(!isMissing && vest?.mesial?.bleeding ? 1 : 0))

    // 6. PI Vestibular (db, b, mb)
    parts.push(encodeValue(!isMissing && vest?.distal?.plaque ? 1 : 0))
    parts.push(encodeValue(!isMissing && vest?.middle?.plaque ? 1 : 0))
    parts.push(encodeValue(!isMissing && vest?.mesial?.plaque ? 1 : 0))

    // 5b. BoP Palatino/Lingual (dp/dl, p/l, mp/ml)
    parts.push(encodeValue(!isMissing && ling?.distal?.bleeding ? 1 : 0))
    parts.push(encodeValue(!isMissing && ling?.middle?.bleeding ? 1 : 0))
    parts.push(encodeValue(!isMissing && ling?.mesial?.bleeding ? 1 : 0))

    // 6b. PI Palatino/Lingual (dp/dl, p/l, mp/ml)
    parts.push(encodeValue(!isMissing && ling?.distal?.plaque ? 1 : 0))
    parts.push(encodeValue(!isMissing && ling?.middle?.plaque ? 1 : 0))
    parts.push(encodeValue(!isMissing && ling?.mesial?.plaque ? 1 : 0))

    // 7. Margen Gingival (GM) Vestibular (db, b, mb)
    parts.push(encodeValue(isMissing ? 0 : vest?.distal?.gingival_margin ?? 0))
    parts.push(encodeValue(isMissing ? 0 : vest?.middle?.gingival_margin ?? 0))
    parts.push(encodeValue(isMissing ? 0 : vest?.mesial?.gingival_margin ?? 0))

    // 8. Profundidad de Sondaje (PD) Vestibular (db, b, mb)
    parts.push(encodeValue(isMissing ? 0 : vest?.distal?.probing_depth ?? 0))
    parts.push(encodeValue(isMissing ? 0 : vest?.middle?.probing_depth ?? 0))
    parts.push(encodeValue(isMissing ? 0 : vest?.mesial?.probing_depth ?? 0))

    // 7b. Margen Gingival (GM) Palatino/Lingual (dp/dl, p/l, mp/ml)
    parts.push(encodeValue(isMissing ? 0 : ling?.distal?.gingival_margin ?? 0))
    parts.push(encodeValue(isMissing ? 0 : ling?.middle?.gingival_margin ?? 0))
    parts.push(encodeValue(isMissing ? 0 : ling?.mesial?.gingival_margin ?? 0))

    // 8b. Profundidad de Sondaje (PD) Palatino/Lingual (dp/dl, p/l, mp/ml)
    parts.push(encodeValue(isMissing ? 0 : ling?.distal?.probing_depth ?? 0))
    parts.push(encodeValue(isMissing ? 0 : ling?.middle?.probing_depth ?? 0))
    parts.push(encodeValue(isMissing ? 0 : ling?.mesial?.probing_depth ?? 0))
  }

  const result = parts.join('')

  if (result.length !== 1800) {
    throw new Error(
      `Error de codificación en periodontograma: se esperaban 1.800 dígitos pero se generaron ${result.length} dígitos.`
    )
  }

  return result
}

/**
 * Retorna la URL completa al visor online de periodontalchart-online.com
 */
export function getPeriodontalChartViewerUrl(
  teethData: Record<string, PeriodontogramToothData>,
  options: EncodeOptions = {}
): string {
  const encoded = encodePeriodontalChartData(teethData, options)
  return `https://www.periodontalchart-online.com/api/?i=${encoded}`
}
