import { addDays } from './dates'

/**
 * Plan semanal. A partir de las horas por semana que el usuario puede dedicar, se fijan metas y se
 * sugieren las tareas de hoy. Es una guía, no una obligación: nada se bloquea si no se cumple.
 */

export const MIN_HOURS = 2
export const MAX_HOURS = 5
export const DEFAULT_HOURS = 3

/** Una partida lenta (15+10) con su análisis lleva ~30 minutos. */
const MINUTES_PER_GAME = 30
const PUZZLES_PER_HOUR = 12

export interface Goals {
  hours: number
  /** Sesiones de estudio por semana. */
  sessions: number
  minutesPerSession: number
  puzzles: number
  lessons: number
  newLines: number
  /** Partidas lentas jugadas y analizadas. */
  games: number
}

export function clampHours(h: number): number {
  return Math.min(MAX_HOURS, Math.max(MIN_HOURS, Math.round(h)))
}

export function goalsFor(hoursRaw: number): Goals {
  const hours = clampHours(hoursRaw)
  const games = hours >= 4 ? 3 : hours >= 3 ? 2 : 1
  const sessions = hours <= 2 ? 2 : hours <= 3 ? 3 : 4
  const studyMinutes = hours * 60 - games * MINUTES_PER_GAME
  return {
    hours,
    sessions,
    minutesPerSession: Math.round(studyMinutes / sessions / 5) * 5,
    puzzles: hours * PUZZLES_PER_HOUR,
    lessons: hours >= 4 ? 2 : 1,
    newLines: hours >= 3 ? 2 : 1,
    games,
  }
}

/** Lunes de la semana de `date` ('YYYY-MM-DD'). */
export function weekStart(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const dow = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay() // 0 = domingo
  return addDays(date, -((dow + 6) % 7))
}

export interface WeekCounts {
  puzzles: number
  lessons: number
  newLines: number
  games: number
  /** Posiciones del repertorio repasadas (informativo; no tiene meta fija: se repasa lo que vence). */
  repReviews: number
}

export interface Progress {
  key: 'puzzles' | 'lessons' | 'newLines' | 'games'
  label: string
  done: number
  goal: number
}

export function weekProgress(goals: Goals, counts: WeekCounts): Progress[] {
  return [
    { key: 'puzzles', label: 'Puzzles', done: counts.puzzles, goal: goals.puzzles },
    { key: 'lessons', label: 'Lecciones', done: counts.lessons, goal: goals.lessons },
    { key: 'newLines', label: 'Líneas nuevas del repertorio', done: counts.newLines, goal: goals.newLines },
    { key: 'games', label: 'Partidas analizadas', done: counts.games, goal: goals.games },
  ]
}

/** Punto débil detectado en tus partidas (ver engine/patterns.ts). */
export interface WeaknessInput {
  label: string
  perGame: number
  theme: string | null
  /** Ruta propia cuando no hay tema de táctica (por ejemplo, /aperturas). */
  to: string | null
}

export interface TaskInput {
  goals: Goals
  counts: WeekCounts
  dueRep: number
  duePuzzles: number
  puzzlesToday: number
  gamesPending: number
  nextLesson: { id: string; title: string; /** La eligió el punto débil, no el orden del currículo. */ forWeakness?: boolean } | null
  weakness?: WeaknessInput | null
  /** Estilo serio: sin giros del estilo juego en los textos. */
  serio?: boolean
  nextLine: { id: string; name: string } | null
}

export interface Task {
  id: string
  label: string
  detail: string
  to: string
  minutes: number
}

/**
 * Reparte las tareas entre las que entran en una sesión (en orden, hasta cubrir `budget` minutos; siempre
 * al menos una) y las que quedan para si sobra tiempo.
 */
export function fitToSession(tasks: readonly Task[], budget: number): { today: Task[]; more: Task[] } {
  const today: Task[] = []
  let used = 0
  for (const t of tasks) {
    if (today.length > 0 && used >= budget) break
    // Una tarea larga que no entra se achica en vez de dejar la sesión a medias: se la deja para después.
    if (today.length > 0 && used + t.minutes > budget * 1.25) continue
    today.push(t)
    used += t.minutes
  }
  return { today, more: tasks.filter((t) => !today.includes(t)) }
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** Tareas sugeridas para hoy, en orden: primero lo que vence, después lo nuevo. */
export function todayTasks(i: TaskInput): Task[] {
  const out: Task[] = []
  if (i.dueRep > 0) {
    out.push({ id: 'rep', label: 'Repaso del repertorio', detail: plural(i.dueRep, 'posición', 'posiciones'), to: '/repertorio/repaso', minutes: Math.max(3, Math.ceil(i.dueRep / 4)) })
  }
  if (i.duePuzzles > 0) {
    out.push({ id: 'review', label: 'Repaso de puzzles fallados', detail: plural(i.duePuzzles, 'puzzle', 'puzzles'), to: '/tactica', minutes: Math.max(3, i.duePuzzles * 2) })
  }
  const w = i.weakness
  if (w) {
    const to = w.theme ? `/tactica?tema=${w.theme}` : (w.to ?? '/partidas')
    out.push({
      id: 'focus',
      label: `Tu punto débil: ${w.label.toLowerCase()}`,
      detail: `${w.perGame.toFixed(1).replace('.', ',')} por partida en las últimas${w.theme ? ' · puzzles de ese tema' : ''}`,
      to,
      minutes: 10,
    })
  }
  const perSession = Math.ceil(i.goals.puzzles / i.goals.sessions)
  // Si ya se sugirió práctica del punto débil con puzzles, se descuenta del resto de la táctica.
  const left = Math.min(perSession - i.puzzlesToday, i.goals.puzzles - i.counts.puzzles) - (w?.theme ? 5 : 0)
  if (left > 0) {
    out.push({ id: 'puzzles', label: 'Táctica', detail: plural(left, 'puzzle', 'puzzles'), to: '/tactica', minutes: left * 2 })
  }
  if (i.counts.lessons < i.goals.lessons && i.nextLesson) {
    out.push({ id: 'lesson', label: `Lección: ${i.nextLesson.title}`, detail: i.nextLesson.forWeakness ? 'Para tu punto débil' : i.serio ? 'Leé y practicá' : 'Leé, adiviná y practicá', to: `/lecciones/${i.nextLesson.id}`, minutes: 15 })
  }
  if (i.counts.newLines < i.goals.newLines && i.nextLine) {
    out.push({ id: 'line', label: `Aprender: ${i.nextLine.name}`, detail: 'Estudiala y practicala una vez', to: `/repertorio/${i.nextLine.id}`, minutes: 10 })
  }
  if (i.gamesPending > 0) {
    out.push({ id: 'analyze', label: 'Analizá tus partidas', detail: `${plural(i.gamesPending, 'partida sin analizar', 'partidas sin analizar')}`, to: '/partidas', minutes: 10 })
  } else if (i.counts.games < i.goals.games) {
    out.push({ id: 'play', label: 'Jugá una partida lenta', detail: '15+10 o más, en Lichess; después traela y analizala', to: '/partidas', minutes: 30 })
  }
  return out
}
