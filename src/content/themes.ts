import THEMES from './themes.json'

export interface Theme {
  key: string
  label: string
  bit: number
}

/** El orden de themes.json define los bits: no reordenar sin regenerar los puzzles. */
export const THEME_LIST: Theme[] = THEMES.map((t, i) => ({ key: t.key, label: t.label, bit: 1 << i }))

const byKey = new Map(THEME_LIST.map((t) => [t.key, t]))

export function themeByKey(key: string): Theme | undefined {
  return byKey.get(key)
}

/** Etiquetas de los temas presentes en una máscara (sin los genéricos de fase). */
export function themeLabels(mask: number): string[] {
  const generic = new Set(['endgame', 'middlegame', 'opening', 'mate'])
  return THEME_LIST.filter((t) => (mask & t.bit) !== 0 && !generic.has(t.key)).map((t) => t.label)
}

/** Grupos para el selector, en el orden del currículo. */
export const THEME_GROUPS: { label: string; keys: string[] }[] = [
  { label: 'Básicos', keys: ['hangingPiece', 'mateIn1', 'mateIn2', 'fork', 'pin', 'skewer', 'backRankMate'] },
  {
    label: 'Intermedios',
    keys: ['discoveredAttack', 'doubleCheck', 'deflection', 'attraction', 'capturingDefender', 'trappedPiece', 'promotion', 'mateLong', 'smotheredMate'],
  },
  { label: 'Avanzados', keys: ['clearance', 'interference', 'intermezzo', 'xRayAttack', 'sacrifice', 'quietMove', 'defensiveMove', 'zugzwang', 'kingsideAttack'] },
  { label: 'Por fase', keys: ['opening', 'middlegame', 'endgame', 'pawnEndgame', 'rookEndgame'] },
]
