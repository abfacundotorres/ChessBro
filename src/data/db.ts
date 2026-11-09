import { Dexie, type EntityTable } from 'dexie'
import type { Rating } from '../engine/glicko2'
import type { ReviewCard } from '../engine/srs'
import type { Puzzle } from '../engine/puzzle'
import type { GameAnalysis, PositionEval } from '../engine/analysis'
import type { CardOrigin } from '../engine/gameCards'
import type { ImportedGame } from './lichess'

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
  /** Presente si el ejercicio sale de un error en una partida propia. */
  origin?: CardOrigin
}

export interface GameRecord extends ImportedGame {
  importedAt: number
  analysis?: {
    depth: number
    evals: PositionEval[]
    summary: GameAnalysis
    analyzedAt: number
  }
}

export interface Setting {
  key: string
  value: string
}

export class ChessBroDB extends Dexie {
  profile!: EntityTable<Profile, 'id'>
  attempts!: EntityTable<Attempt, 'id'>
  reviews!: EntityTable<ReviewRecord, 'puzzleId'>
  games!: EntityTable<GameRecord, 'id'>
  settings!: EntityTable<Setting, 'key'>

  constructor(name = 'chessbro') {
    super(name)
    // Migraciones: agregar db.version(n+1); nunca editar versiones existentes.
    this.version(1).stores({
      profile: '&id',
      attempts: '++id, puzzleId, date',
      reviews: '&puzzleId, due',
    })
    this.version(2).stores({
      games: '&id, createdAt',
      settings: '&key',
    })
  }
}

export const db = new ChessBroDB()
