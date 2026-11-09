import { analyzeGame, type PositionEval } from '../engine/analysis'
import { errorToCard } from '../engine/gameCards'
import { newCard } from '../engine/srs'
import { THEME_LIST } from '../content/themes'
import { db as defaultDb, type ChessBroDB, type GameRecord } from './db'
import type { ImportedGame } from './lichess'

export async function getSetting(key: string, db: ChessBroDB = defaultDb): Promise<string | null> {
  return (await db.settings.get(key))?.value ?? null
}

export async function setSetting(key: string, value: string | null, db: ChessBroDB = defaultDb): Promise<void> {
  if (value === null || value === '') await db.settings.delete(key)
  else await db.settings.put({ key, value })
}

export const LICHESS_USER = 'lichessUser'

/** Guarda partidas nuevas; las ya importadas (y su análisis) no se tocan. */
export async function saveImported(games: readonly ImportedGame[], now = Date.now(), db: ChessBroDB = defaultDb): Promise<number> {
  return db.transaction('rw', db.games, async () => {
    const existing = new Set((await db.games.bulkGet(games.map((g) => g.id))).filter(Boolean).map((g) => g!.id))
    const fresh = games.filter((g) => !existing.has(g.id))
    await db.games.bulkAdd(fresh.map((g) => ({ ...g, importedAt: now })))
    return fresh.length
  })
}

const bitOf = (key: string) => THEME_LIST.find((t) => t.key === key)?.bit ?? 0

/**
 * Guarda el análisis y agrega al repaso los errores tácticos graves (vencen hoy,
 * para practicarlos en caliente). Devuelve cuántos ejercicios nuevos se crearon.
 */
export async function saveAnalysis(
  gameId: string,
  evals: PositionEval[],
  depth: number,
  today: string,
  now = Date.now(),
  db: ChessBroDB = defaultDb,
): Promise<{ cards: number; game: GameRecord }> {
  return db.transaction('rw', db.games, db.reviews, async () => {
    const game = await db.games.get(gameId)
    if (!game) throw new Error('Partida no encontrada')
    const summary = analyzeGame({ startFen: game.startFen, moves: game.moves, evals, me: game.me })
    const updated: GameRecord = { ...game, analysis: { depth, evals, summary, analyzedAt: now } }
    await db.games.put(updated)
    const myRating = (game.me === 'w' ? game.white.rating : game.black.rating) ?? 1200
    let cards = 0
    for (const e of summary.errors) {
      const before = evals[e.ply]
      if (!before) continue
      const c = errorToCard(gameId, e, before, myRating, bitOf)
      if (!c || (await db.reviews.get(c.puzzle.id))) continue
      await db.reviews.put({ ...newCard(c.puzzle.id, today), due: today, puzzle: c.puzzle, origin: c.origin })
      cards++
    }
    return { cards, game: updated }
  })
}

export interface GamesSummary {
  analyzed: number
  /** Errores graves (blunders) por partida, en las últimas analizadas. */
  blundersPerGame: number
  mistakesPerGame: number
  accuracy: number
  kinds: Record<string, number>
}

/** Resumen de las últimas `n` partidas analizadas. */
export function summarize(games: readonly GameRecord[], n = 10): GamesSummary | null {
  const analyzed = games
    .filter((g) => g.analysis)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, n)
  if (analyzed.length === 0) return null
  const kinds: Record<string, number> = {}
  let blunders = 0
  let mistakes = 0
  let acc = 0
  for (const g of analyzed) {
    const s = g.analysis!.summary
    blunders += s.counts.blunder
    mistakes += s.counts.mistake
    acc += s.accuracy
    for (const e of s.errors) if (e.severity !== 'inaccuracy') kinds[e.kind] = (kinds[e.kind] ?? 0) + 1
  }
  return {
    analyzed: analyzed.length,
    blundersPerGame: blunders / analyzed.length,
    mistakesPerGame: mistakes / analyzed.length,
    accuracy: Math.round(acc / analyzed.length),
    kinds,
  }
}
