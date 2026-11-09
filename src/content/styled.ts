import type { Challenge } from '../engine/challenge'
import type { Style } from '../data/style'
import type { Lesson, LessonStep } from './lessons'
import { SERIO, type SerioStep } from './lessonsSerias'

/**
 * Variantes de estilo de una lección. "juego" es el texto original (historias, personajes); "serio" lo
 * reemplaza por una versión técnica y directa si existe. Los ejercicios, las posiciones y las respuestas
 * son los mismos en ambos estilos.
 */

function serioChallenge(ch: Challenge, s: SerioStep): Challenge {
  const why = s.why ?? ch.why
  if (ch.kind === 'choice') return { ...ch, question: s.prompt ?? ch.question, why }
  return { ...ch, prompt: s.prompt ?? ch.prompt, why }
}

export function styledStep(step: LessonStep, serio: SerioStep | undefined, style: Style): LessonStep {
  if (style !== 'serio' || !serio) return step
  return {
    ...step,
    title: serio.title ?? step.title,
    text: serio.text,
    ...(step.challenge ? { challenge: serioChallenge(step.challenge, serio) } : {}),
  }
}

export function styledLesson(lesson: Lesson, style: Style): Lesson {
  const s = SERIO[lesson.id]
  if (style !== 'serio' || !s) return lesson
  return {
    ...lesson,
    title: s.title,
    summary: s.summary,
    steps: lesson.steps.map((step, i) => styledStep(step, s.steps[i], style)),
  }
}
