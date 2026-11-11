/** Etiquetas de una jugada que se leen directo de su notación SAN (no hay nada que interpretar ni verificar a mano). */
export type MoveTag = 'Mate' | 'Jaque' | 'Captura' | 'Enroque' | 'Coronación'

export function moveTags(san: string): MoveTag[] {
  const tags: MoveTag[] = []
  if (san.startsWith('O-O')) tags.push('Enroque')
  if (san.includes('x')) tags.push('Captura')
  if (san.includes('=')) tags.push('Coronación')
  if (san.endsWith('#')) tags.push('Mate')
  else if (san.endsWith('+')) tags.push('Jaque')
  return tags
}
