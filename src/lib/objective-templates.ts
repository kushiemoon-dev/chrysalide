import type { ObjectiveCategory } from './types'

export interface ObjectiveTemplate {
  id: string
  category: ObjectiveCategory
  context: 'feminizing' | 'masculinizing' | 'common'
  estimatedDuration?: string
}

export const FEMINIZING_TEMPLATES: ObjectiveTemplate[] = [
  { id: 'ths-feminisant', category: 'medical', context: 'feminizing', estimatedDuration: '5 ans' },
  {
    id: 'epilation-visage',
    category: 'medical',
    context: 'feminizing',
    estimatedDuration: '18-24 mois',
  },
  {
    id: 'epilation-corps',
    category: 'medical',
    context: 'feminizing',
    estimatedDuration: '12-18 mois',
  },
  { id: 'chirurgie-mammoplastie', category: 'medical', context: 'feminizing' },
  { id: 'chirurgie-vaginoplastie', category: 'medical', context: 'feminizing' },
  { id: 'chirurgie-ffs', category: 'medical', context: 'feminizing' },
]

export const MASCULINIZING_TEMPLATES: ObjectiveTemplate[] = [
  {
    id: 'ths-masculinisant',
    category: 'medical',
    context: 'masculinizing',
    estimatedDuration: '5 ans',
  },
  { id: 'chirurgie-torsoplastie', category: 'medical', context: 'masculinizing' },
  { id: 'chirurgie-hysterectomie', category: 'medical', context: 'masculinizing' },
  { id: 'chirurgie-phalloplastie', category: 'medical', context: 'masculinizing' },
  { id: 'chirurgie-metoidioplastie', category: 'medical', context: 'masculinizing' },
]

export const COMMON_TEMPLATES: ObjectiveTemplate[] = [
  { id: 'changement-etat-civil', category: 'administrative', context: 'common' },
  { id: 'changement-prenom', category: 'administrative', context: 'common' },
  { id: 'parcours-psy', category: 'mental', context: 'common' },
  { id: 'coming-out-proche', category: 'social', context: 'common' },
  { id: 'coming-out-travail', category: 'social', context: 'common' },
]

export function getTemplatesForContext(
  context: 'feminizing' | 'masculinizing' | 'non-binary'
): ObjectiveTemplate[] {
  switch (context) {
    case 'feminizing':
      return [...FEMINIZING_TEMPLATES, ...COMMON_TEMPLATES]
    case 'masculinizing':
      return [...MASCULINIZING_TEMPLATES, ...COMMON_TEMPLATES]
    case 'non-binary':
      return [...FEMINIZING_TEMPLATES, ...MASCULINIZING_TEMPLATES, ...COMMON_TEMPLATES]
    default:
      return COMMON_TEMPLATES
  }
}

export const ALL_OBJECTIVE_TEMPLATES: ObjectiveTemplate[] = [
  ...FEMINIZING_TEMPLATES,
  ...MASCULINIZING_TEMPLATES,
  ...COMMON_TEMPLATES,
]
