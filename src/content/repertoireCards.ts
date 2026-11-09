import { buildCards } from '../engine/repertoire'
import { REPERTOIRE, repLineById } from './repertoire'
import { DEEP_CARDS, DEEP_LINES } from './openingLines'

/** Tarjetas de repaso de todo el repertorio (se calculan una vez). Un test garantiza que no hay conflictos. */
export const REP_CARDS = buildCards(REPERTOIRE).cards

/** Tarjetas del repertorio y de las líneas de la biblioteca de aperturas (para repasar todo junto). */
export const ALL_CARDS = [...REP_CARDS, ...DEEP_CARDS]

/** Línea del repertorio o de la biblioteca de aperturas. */
export function anyLineById(id: string) {
  return repLineById(id) ?? DEEP_LINES.find((l) => l.id === id)
}
