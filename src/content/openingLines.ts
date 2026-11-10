import { buildCards, type RepCardSpec, type RepLine } from '../engine/repertoire'
import { openingById } from './openings'
import { LINES_E4E5 } from './deep/e4e5'
import { LINES_E4 } from './deep/e4'
import { LINES_D4 } from './deep/d4'
import { MORE_E4E5 } from './deep/more-e4e5'
import { MORE_E4 } from './deep/more-e4'
import { MORE_D4 } from './deep/more-d4'
import { deep, type DeepDef } from './deep/kit'

/**
 * Líneas de la biblioteca de aperturas: 3 a 4 por apertura, con una explicación para cada jugada.
 * Dentro de una apertura, las líneas solo se separan por jugadas del rival (las del usuario no se contradicen), así
 * que comparten tarjetas de repaso. Las tarjetas llevan el id de la apertura como prefijo: no chocan con el repertorio.
 */
const DEFS: DeepDef[] = [...LINES_E4E5, ...MORE_E4E5, ...LINES_E4, ...MORE_E4, ...LINES_D4, ...MORE_D4]

export const DEEP_LINES: RepLine[] = DEFS.map((d) => deep(d, openingById(d.opening)?.name ?? d.opening))

export function deepLinesOf(openingId: string): RepLine[] {
  return DEEP_LINES.filter((l) => l.opening === openingId)
}

const openingIds = [...new Set(DEEP_LINES.map((l) => l.opening!))]

/** Tarjetas de repaso de todas las líneas de aperturas, calculadas por apertura. */
export const DEEP_CARDS: RepCardSpec[] = openingIds.flatMap((id) => buildCards(deepLinesOf(id), `${id}:`).cards)

/** Conflictos (misma posición, dos jugadas propias distintas) dentro de cada apertura. Un test exige que no haya. */
export function deepConflicts() {
  return openingIds.flatMap((id) => buildCards(deepLinesOf(id), `${id}:`).conflicts.map((c) => ({ opening: id, ...c })))
}
