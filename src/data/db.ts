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

export interface LessonProgress {
  id: string
  /** Ejercicios resueltos (ids). */
  exercises: string[]
  /** ms desde epoch al marcarla como terminada. */
  doneAt?: number
  /** Mejor puntaje (1 a 3 estrellas) de las pasadas completas. */
  stars?: number
}

/** Tarjeta de repaso de repertorio: una posición y la jugada que hay que recordar. */
export interface RepCard {
  id: string
  color: 'w' | 'b'
  /** Primera línea que la contiene (para mostrar de dónde viene). */
  lineId: string
  fen: string
  uci: string
  san: string
  box: number
  due: string
  lapses: number
  /** Último día en que se repasó. */
  last?: string
}

export interface RepLineProgress {
  id: string
  /** Veces que se practicó completa. */
  practiced: number
  /** Primer día en que se practicó (se usa para el plan semanal). */
  firstDate: string
  lastDate: string
}

/** Un día con práctica (para la racha). */
export interface ActivityDay {
  date: string
  count: number
}

export interface EndgameResult {
  id?: number
  endgameId: string
  ts: number
  date: string
  success: boolean
  /** Jugadas del usuario hasta el final. */
  moves: number
  /** Veces que pidió pista en esa partida. */
  hints: number
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
  lessons!: EntityTable<LessonProgress, 'id'>
  endgames!: EntityTable<EndgameResult, 'id'>
  activity!: EntityTable<ActivityDay, 'date'>
  repcards!: EntityTable<RepCard, 'id'>
  replines!: EntityTable<RepLineProgress, 'id'>

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
    this.version(3).stores({
      lessons: '&id',
      endgames: '++id, endgameId, date',
    })
    this.version(4).stores({
      activity: '&date',
    })
    this.version(5).stores({
      repcards: '&id, due, lineId',
      replines: '&id',
    })
  }
}

export const db = new ChessBroDB()
