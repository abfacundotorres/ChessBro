import { buildCards, type RepCardSpec, type RepLine } from '../engine/repertoire'
import { openingById } from './openings'
import { LINES_E4E5 } from './deep/e4e5'
import { LINES_E4 } from './deep/e4'
import { LINES_D4 } from './deep/d4'
import { MORE_E4E5 } from './deep/more-e4e5'
import { MORE_E4 } from './deep/more-e4'
import { MORE_D4 } from './deep/more-d4'
import { MORE2_E4E5 } from './deep/more2-e4e5'
import { MORE2_E4 } from './deep/more2-e4'
import { MORE2_D4 } from './deep/more2-d4'
import { deep, type DeepDef } from './deep/kit'
import { BRANCHES } from './deep/branches'

/**
 * Líneas de la biblioteca de aperturas: 3 a 4 por apertura, con una explicación para cada jugada.
 * Dentro de una apertura, las líneas solo se separan por jugadas del rival (las del usuario no se contradicen), así
 * que comparten tarjetas de repaso. Las tarjetas llevan el id de la apertura como prefijo: no chocan con el repertorio.
 */
const DEFS: DeepDef[] = [...LINES_E4E5, ...MORE_E4E5, ...LINES_E4, ...MORE_E4, ...LINES_D4, ...MORE_D4, ...MORE2_E4E5, ...MORE2_E4, ...MORE2_D4]

const BASE_LINES: RepLine[] = DEFS.map((d) => deep(d, openingById(d.opening)?.name ?? d.opening))

/** Ramas nuevas: las notas de las jugadas ya escritas en otra línea de la misma apertura se heredan. */
const BRANCH_LINES: RepLine[] = BRANCHES.map((b) => {
  const same = BASE_LINES.filter((l) => l.opening === b.opening)
  let shared = 0
  for (let k = 1; k <= b.moves.length; k++) if (same.some((l) => b.moves.slice(0, k).every((m, i) => l.moves[i] === m))) shared = k
  if (b.tail.length !== b.moves.length - shared) throw new Error(`${b.id}: ${b.tail.length} notas nuevas para ${b.moves.length - shared} jugadas nuevas`)
  const donor = same.find((l) => b.moves.slice(0, shared).every((m, i) => l.moves[i] === m))
  const notes: string[] = [...Array.from({ length: shared }, (_, i) => donor?.notes?.[i] ?? ''), ...b.tail]
  return deep({ ...b, notes }, openingById(b.opening)?.name ?? b.opening)
})

export const DEEP_LINES: RepLine[] = [...BASE_LINES, ...BRANCH_LINES]

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
