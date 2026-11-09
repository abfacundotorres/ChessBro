import { INITIAL_RATING, ratePuzzle } from '../engine/glicko2'
import { isDue, newCard, review } from '../engine/srs'
import type { Puzzle } from '../engine/puzzle'
import { db as defaultDb, type Attempt, type ChessBroDB, type Profile, type ReviewRecord } from './db'
import { touchActivity } from './activity'

export function initialProfile(): Profile {
  return { id: 'me', ...INITIAL_RATING, ratedCount: 0, updatedAt: 0 }
}

export async function getProfile(db: ChessBroDB = defaultDb): Promise<Profile> {
  return (await db.profile.get('me')) ?? initialProfile()
}

export async function seenPuzzleIds(db: ChessBroDB = defaultDb): Promise<Set<string>> {
  const keys = await db.attempts.orderBy('puzzleId').uniqueKeys()
  return new Set(keys.map(String))
}

export async function dueReviews(today: string, db: ChessBroDB = defaultDb): Promise<ReviewRecord[]> {
  const cards = await db.reviews.where('due').belowOrEqual(today).sortBy('due')
  return cards.filter((c) => isDue(c, today))
}

export interface AttemptInput {
  puzzle: Puzzle
  solved: boolean
  mode: 'new' | 'review'
  today: string
  now?: number
}

export interface AttemptOutcome {
  ratingBefore: number
  ratingAfter: number
}

/**
 * Registra el resultado de un puzzle en una transacción:
 * - nuevo: actualiza el rating; si se falló, entra al repaso.
 * - repaso: no toca el rating; mueve la tarjeta de caja o la retira si quedó aprendida.
 */
export async function recordAttempt(input: AttemptInput, db: ChessBroDB = defaultDb): Promise<AttemptOutcome> {
  const { puzzle, solved, mode, today } = input
  const now = input.now ?? Date.now()
  return db.transaction('rw', db.profile, db.attempts, db.reviews, db.activity, async () => {
    await touchActivity(today, db)
    const profile = await getProfile(db)
    const base: Attempt = { puzzleId: puzzle.id, date: today, ts: now, mode, solved, puzzleRating: puzzle.rating, themes: puzzle.themes }

    if (mode === 'review') {
      const card = await db.reviews.get(puzzle.id)
      const outcome = review(card ?? newCard(puzzle.id, today), solved, today)
      if (outcome.kind === 'learned') await db.reviews.delete(puzzle.id)
      else await db.reviews.put({ ...outcome.card, puzzle })
      await db.attempts.add(base)
      return { ratingBefore: profile.rating, ratingAfter: profile.rating }
    }

    const next = ratePuzzle(profile, puzzle, solved)
    await db.profile.put({ ...profile, ...next, ratedCount: profile.ratedCount + 1, updatedAt: now })
    await db.attempts.add({ ...base, ratingBefore: profile.rating, ratingAfter: next.rating })
    if (!solved && !(await db.reviews.get(puzzle.id))) {
      await db.reviews.put({ ...newCard(puzzle.id, today), puzzle })
    }
    return { ratingBefore: profile.rating, ratingAfter: next.rating }
  })
}

export interface TacticsStats {
  today: { solved: number; total: number }
  last7: { solved: number; total: number }
}

export async function tacticsStats(today: string, weekStart: string, db: ChessBroDB = defaultDb): Promise<TacticsStats> {
  const recent = await db.attempts.where('date').aboveOrEqual(weekStart).toArray()
  const count = (xs: Attempt[]) => ({ solved: xs.filter((a) => a.solved).length, total: xs.length })
  return { today: count(recent.filter((a) => a.date === today)), last7: count(recent) }
}
