import { addDays } from '../engine/dates'
import { INTERVALS } from '../engine/srs'
import { cardsOfLine, type RepCardSpec, type RepLine } from '../engine/repertoire'
import { touchActivity } from './activity'
import { db as defaultDb, type ChessBroDB, type RepCard } from './db'

/** Repaso espaciado del repertorio: mismas cajas que los puzzles (1, 3, 7, 16, 35 días), pero nunca se "gradúa":
 *  una tarjeta dominada vuelve cada 35 días para no olvidar la línea. */
const LAST_BOX = INTERVALS.length - 1

/**
 * Marca una línea como practicada de punta a punta. Crea las tarjetas de sus posiciones que todavía no
 * existan (vencen mañana, no hoy: se acaba de practicar).
 */
export async function markLinePracticed(
  line: RepLine,
  allCards: readonly RepCardSpec[],
  today: string,
  db: ChessBroDB = defaultDb,
): Promise<{ newCards: number }> {
  return db.transaction('rw', db.repcards, db.replines, db.activity, async () => {
    await touchActivity(today, db)
    const cur = await db.replines.get(line.id)
    await db.replines.put({ id: line.id, practiced: (cur?.practiced ?? 0) + 1, firstDate: cur?.firstDate ?? today, lastDate: today })
    let created = 0
    for (const spec of cardsOfLine(allCards, line.id)) {
      if (await db.repcards.get(spec.id)) continue
      await db.repcards.put({ id: spec.id, color: spec.color, lineId: line.id, fen: spec.fen, uci: spec.uci, san: spec.san, box: 0, due: addDays(today, 1), lapses: 0 })
      created++
    }
    return { newCards: created }
  })
}

export async function dueRepCards(today: string, db: ChessBroDB = defaultDb): Promise<RepCard[]> {
  return db.repcards.where('due').belowOrEqual(today).sortBy('due')
}

/** Resultado de repasar una tarjeta: acertar sube de caja; fallar vuelve a la primera. */
export async function reviewRepCard(id: string, solved: boolean, today: string, db: ChessBroDB = defaultDb): Promise<RepCard> {
  return db.transaction('rw', db.repcards, db.activity, async () => {
    const card = await db.repcards.get(id)
    if (!card) throw new Error('Tarjeta no encontrada')
    await touchActivity(today, db)
    const next: RepCard = solved
      ? { ...card, box: Math.min(card.box + 1, LAST_BOX), due: addDays(today, INTERVALS[Math.min(card.box + 1, LAST_BOX)]!), last: today }
      : { ...card, box: 0, due: addDays(today, INTERVALS[0]), lapses: card.lapses + 1, last: today }
    await db.repcards.put(next)
    return next
  })
}

export interface LineStats {
  /** ¿Se practicó alguna vez? */
  practiced: boolean
  cards: number
  due: number
  /** Tarjetas en la caja 3 o más: ya se recuerdan bien. */
  solid: number
}

/** Estadísticas por línea, a partir de las tarjetas guardadas. */
export async function repStats(lines: readonly RepLine[], allCards: readonly RepCardSpec[], today: string, db: ChessBroDB = defaultDb): Promise<Map<string, LineStats>> {
  const [stored, progress] = await Promise.all([db.repcards.toArray(), db.replines.toArray()])
  const byId = new Map(stored.map((c) => [c.id, c]))
  const practiced = new Set(progress.map((p) => p.id))
  const out = new Map<string, LineStats>()
  for (const line of lines) {
    const mine = cardsOfLine(allCards, line.id).map((s) => byId.get(s.id)).filter((c): c is RepCard => c !== undefined)
    out.set(line.id, {
      practiced: practiced.has(line.id),
      cards: mine.length,
      due: mine.filter((c) => c.due <= today).length,
      solid: mine.filter((c) => c.box >= 3).length,
    })
  }
  return out
}

export async function resetRepertoire(db: ChessBroDB = defaultDb): Promise<void> {
  await db.transaction('rw', db.repcards, db.replines, async () => {
    await db.repcards.clear()
    await db.replines.clear()
  })
}
