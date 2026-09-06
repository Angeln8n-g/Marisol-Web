import type { ToothCondition, ToothState } from '../../../types'

export const ADULT_UPPER_Q1 = [18, 17, 16, 15, 14, 13, 12, 11]
export const ADULT_UPPER_Q2 = [21, 22, 23, 24, 25, 26, 27, 28]
export const ADULT_LOWER_Q4 = [48, 47, 46, 45, 44, 43, 42, 41]
export const ADULT_LOWER_Q3 = [31, 32, 33, 34, 35, 36, 37, 38]

export const PEDIATRIC_UPPER_Q5 = [55, 54, 53, 52, 51]
export const PEDIATRIC_UPPER_Q6 = [61, 62, 63, 64, 65]
export const PEDIATRIC_LOWER_Q8 = [85, 84, 83, 82, 81]
export const PEDIATRIC_LOWER_Q7 = [71, 72, 73, 74, 75]

export interface ConditionTool {
  id: ToothCondition
  label: string
  color: string
  bgColor: string
  borderColor: string
  appliesTo: 'surface' | 'whole_tooth'
  description: string
}

export const CONDITION_TOOLS: ConditionTool[] = [
  {
    id: 'healthy',
    label: 'Sano / Limpiar',
    color: '#10b981',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-300',
    appliesTo: 'surface',
    description: 'Restaura la superficie a estado sano',
  },
  {
    id: 'caries',
    label: 'Caries Activa',
    color: '#ef4444',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    appliesTo: 'surface',
    description: 'Pinta lesión de caries en superficie',
  },
  {
    id: 'composite',
    label: 'Resina / Obturación',
    color: '#3b82f6',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    appliesTo: 'surface',
    description: 'Restauración estética de resina',
  },
  {
    id: 'amalgam',
    label: 'Amalgama',
    color: '#64748b',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-300',
    appliesTo: 'surface',
    description: 'Restauración metálica de amalgama',
  },
  {
    id: 'sealant',
    label: 'Sellante',
    color: '#f97316',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    appliesTo: 'surface',
    description: 'Sellante de fosas y fisuras',
  },
  {
    id: 'crown',
    label: 'Corona / Funda',
    color: '#d97706',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-400',
    appliesTo: 'whole_tooth',
    description: 'Corona protésica sobre diente',
  },
  {
    id: 'endodontics_done',
    label: 'Endodoncia Realizada',
    color: '#059669',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-400',
    appliesTo: 'whole_tooth',
    description: 'Conducto obturado en buen estado',
  },
  {
    id: 'endodontics_needed',
    label: 'Endodoncia Indicada',
    color: '#dc2626',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-400',
    appliesTo: 'whole_tooth',
    description: 'Tratamiento de conducto requerido',
  },
  {
    id: 'missing',
    label: 'Diente Ausente',
    color: '#475569',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-400',
    appliesTo: 'whole_tooth',
    description: 'Diente perdido o extraído',
  },
  {
    id: 'extraction_needed',
    label: 'Extracción Indicada',
    color: '#b91c1c',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-500',
    appliesTo: 'whole_tooth',
    description: 'Exodoncia requerida por destrucción',
  },
  {
    id: 'implant',
    label: 'Implante Dental',
    color: '#0284c7',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-400',
    appliesTo: 'whole_tooth',
    description: 'Pilar o corona sobre implante',
  },
  {
    id: 'fracture',
    label: 'Fractura',
    color: '#9333ea',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    appliesTo: 'whole_tooth',
    description: 'Fractura coronaria o radicular',
  },
]

export const createDefaultToothState = (num: number): ToothState => ({
  tooth_number: num,
  general_condition: 'healthy',
  surfaces: {
    vestibular: 'healthy',
    lingual_palatal: 'healthy',
    mesial: 'healthy',
    distal: 'healthy',
    occlusal_incisal: 'healthy',
  },
  notes: '',
})

export const createInitialOdontogramData = (
  dentition: 'adult' | 'pediatric' = 'adult'
): Record<string, ToothState> => {
  const data: Record<string, ToothState> = {}
  if (dentition === 'adult') {
    ;[...ADULT_UPPER_Q1, ...ADULT_UPPER_Q2, ...ADULT_LOWER_Q4, ...ADULT_LOWER_Q3].forEach((num) => {
      data[num.toString()] = createDefaultToothState(num)
    })
  } else {
    ;[...PEDIATRIC_UPPER_Q5, ...PEDIATRIC_UPPER_Q6, ...PEDIATRIC_LOWER_Q8, ...PEDIATRIC_LOWER_Q7].forEach(
      (num) => {
        data[num.toString()] = createDefaultToothState(num)
      }
    )
  }
  return data
}

export const getSurfaceColor = (cond: ToothCondition): string => {
  switch (cond) {
    case 'caries':
      return '#ef4444' // Rojo
    case 'composite':
      return '#3b82f6' // Azul
    case 'amalgam':
      return '#64748b' // Gris
    case 'sealant':
      return '#f97316' // Naranja
    default:
      return '#ffffff' // Blanco (sano)
  }
}

/**
 * Mapea cualquier número de diente (incluyendo dentición infantil 51-85)
 * a su homólogo anatómico adulto en los renders 3D oficiales (11-48).
 */
export const mapToothToRenderNumber = (toothNumber: number): number => {
  if (toothNumber >= 11 && toothNumber <= 48) return toothNumber

  // Cuadrante 5 (51-55) -> 11, 12, 13, 14, 16
  if (toothNumber === 51) return 11
  if (toothNumber === 52) return 12
  if (toothNumber === 53) return 13
  if (toothNumber === 54) return 14
  if (toothNumber === 55) return 16

  // Cuadrante 6 (61-65) -> 21, 22, 23, 24, 26
  if (toothNumber === 61) return 21
  if (toothNumber === 62) return 22
  if (toothNumber === 63) return 23
  if (toothNumber === 64) return 24
  if (toothNumber === 65) return 26

  // Cuadrante 7 (71-75) -> 31, 32, 33, 34, 36
  if (toothNumber === 71) return 31
  if (toothNumber === 72) return 32
  if (toothNumber === 73) return 33
  if (toothNumber === 74) return 34
  if (toothNumber === 75) return 36

  // Cuadrante 8 (81-85) -> 41, 42, 43, 44, 46
  if (toothNumber === 81) return 41
  if (toothNumber === 82) return 42
  if (toothNumber === 83) return 43
  if (toothNumber === 84) return 44
  if (toothNumber === 85) return 46

  return 11
}

export const getToothRenderUrl = (toothNumber: number, isUpper: boolean): string => {
  const renderNum = mapToothToRenderNumber(toothNumber)
  const view = isUpper ? 'upper_vestibular' : 'lower_vestibular'
  return `/images/periodontogram/${view}_${renderNum}.png`
}
