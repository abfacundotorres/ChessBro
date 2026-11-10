import type { Color } from '../../engine/game'
import type { QuizItem, RepLine } from '../../engine/repertoire'

/** Definición de una línea de la biblioteca de aperturas: una nota por cada jugada (mismo largo que `moves`). */
export interface DeepDef {
  id: string
  /** Id de la apertura (content/openings.ts). */
  opening: string
  /** Quién sos en la línea: el que elige la apertura con blancas, o quien la responde con negras. */
  color: Color
  name: string
  moves: string[]
  idea: string
  plan: string[]
  /** Explicación de cada jugada, en orden: por qué se juega y qué consigue. */
  notes: string[]
  quiz?: QuizItem[]
}

export const q = (question: string, options: string[], answer: number, why: string): QuizItem => ({ q: question, options, answer, why })

export function deep(d: DeepDef, group: string): RepLine {
  if (d.notes.length !== d.moves.length) throw new Error(`${d.id}: ${d.notes.length} notas para ${d.moves.length} jugadas`)
  return {
    id: d.id,
    opening: d.opening,
    color: d.color,
    group,
    name: d.name,
    moves: d.moves,
    idea: d.idea,
    plan: d.plan,
    notes: Object.fromEntries(d.notes.map((n, i) => [i, n])),
    quiz: d.quiz,
  }
}

/**
 * Posición de ejercicio dentro de una apertura. `moves` lleva desde la posición inicial hasta la posición del ejercicio
 * (el que mueve es el usuario: en 'punish' la última jugada es el error del rival).
 */
export interface MoveItem {
  id: string
  kind: 'plan' | 'punish'
  title: string
  /** Una frase con lo que hay que hacer ("¿Cuál es el plan?", "El rival se equivocó: castigalo"). */
  prompt: string
  moves: string[]
  /** La jugada correcta (SAN). */
  answer: string
  /** Otras jugadas que también valen (casi igual de buenas según el motor). */
  alt?: string[]
  /** Por qué: el plan o el motivo táctico. */
  why: string
}

export interface ModelGame {
  title: string
  /** Quién sos en la partida. */
  color: Color
  moves: string[]
  /** Comentario de momentos clave: índice de la jugada → texto. */
  notes: Record<number, string>
  summary: string
}

export interface OpeningExtras {
  items: MoveItem[]
  model?: ModelGame
}
