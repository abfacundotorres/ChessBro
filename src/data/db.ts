import { Dexie, type EntityTable } from 'dexie'
import type { Rating } from '../engine/glicko2'
import type { ReviewCard } from '../engine/srs'
import type { Puzzle } from '../engine/puzzle'

export interface Profile extends Rating {
  id: 'me'
  /** Puzzles puntuados (los repasos no cuentan para el rating). */
  ratedCount: number
  updatedAt: number
}

export interface Attempt {
  id?: number
  puzzleId: string
  /** Fecha local 'YYYY-MM-DD'. */
  date: string
  ts: number
  mode: 'new' | 'review'
  solved: boolean
  puzzleRating: number
  themes: number
  /** Solo en intentos puntuados. */
  ratingBefore?: number
  ratingAfter?: number
}

/** Tarjeta de repaso con una copia del puzzle, para no depender de los chunks cargados. */
export interface ReviewRecord extends ReviewCard {
  puzzle: Puzzle
}

export class ChessBroDB extends Dexie {
  profile!: EntityTable<Profile, 'id'>
  attempts!: EntityTable<Attempt, 'id'>
  reviews!: EntityTable<ReviewRecord, 'puzzleId'>

  constructor(name = 'chessbro') {
    super(name)
    // Migraciones: agregar db.version(n+1); nunca editar versiones existentes.
    this.version(1).stores({
      profile: '&id',
      attempts: '++id, puzzleId, date',
      reviews: '&puzzleId, due',
    })
  }
}

export const db = new ChessBroDB()
