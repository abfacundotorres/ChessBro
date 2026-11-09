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
