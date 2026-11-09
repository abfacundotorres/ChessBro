import { describe, expect, it } from 'vitest'
import { clampHours, fitToSession, goalsFor, todayTasks, weekProgress, weekStart, type Task, type TaskInput } from '../plan'

describe('metas según las horas', () => {
  it('2, 3 y 5 horas por semana', () => {
    expect(goalsFor(2)).toEqual({ hours: 2, sessions: 2, minutesPerSession: 45, puzzles: 24, lessons: 1, newLines: 1, games: 1 })
    expect(goalsFor(3)).toEqual({ hours: 3, sessions: 3, minutesPerSession: 40, puzzles: 36, lessons: 1, newLines: 2, games: 2 })
    expect(goalsFor(5)).toEqual({ hours: 5, sessions: 4, minutesPerSession: 55, puzzles: 60, lessons: 2, newLines: 2, games: 3 })
  })

  it('las horas se acotan a 2–5', () => {
    expect(clampHours(0)).toBe(2)
    expect(clampHours(9)).toBe(5)
    expect(clampHours(3.4)).toBe(3)
    expect(goalsFor(10).hours).toBe(5)
  })

  it('el tiempo planificado no supera las horas elegidas', () => {
    for (const h of [2, 3, 4, 5]) {
      const g = goalsFor(h)
      expect(g.sessions * g.minutesPerSession + g.games * 30).toBeLessThanOrEqual(h * 60 + g.sessions * 3)
    }
  })
})

describe('semana', () => {
  it('empieza el lunes', () => {
    expect(weekStart('2026-11-09')).toBe('2026-11-09') // lunes
    expect(weekStart('2026-11-15')).toBe('2026-11-09') // domingo
    expect(weekStart('2026-11-11')).toBe('2026-11-09')
    expect(weekStart('2026-11-01')).toBe('2026-10-26') // domingo
    expect(weekStart('2027-01-01')).toBe('2026-12-28') // cruza de año
  })

  it('progreso', () => {
    const p = weekProgress(goalsFor(3), { puzzles: 10, lessons: 1, newLines: 0, games: 1, repReviews: 5 })
    expect(p.map((x) => `${x.key}:${x.done}/${x.goal}`)).toEqual(['puzzles:10/36', 'lessons:1/1', 'newLines:0/2', 'games:1/2'])
  })
})

describe('fitToSession', () => {
  const t = (id: string, minutes: number): Task => ({ id, label: id, detail: '', to: '/', minutes })

  it('llena la sesión en orden y deja el resto para después', () => {
    // Se tolera pasarse hasta un 25 % del tiempo (10 + 24 + 15 = 49 ≤ 50); lo que viene después ya no entra.
    const r = fitToSession([t('a', 10), t('b', 24), t('c', 15), t('d', 10)], 40)
    expect(r.today.map((x) => x.id)).toEqual(['a', 'b', 'c'])
    expect(r.more.map((x) => x.id)).toEqual(['d'])
  })

  it('una tarea que se pasaría mucho queda para después, y se sigue con las que sí entran', () => {
    const r = fitToSession([t('a', 30), t('b', 30), t('c', 8)], 40)
    expect(r.today.map((x) => x.id)).toEqual(['a', 'c'])
    expect(r.more.map((x) => x.id)).toEqual(['b'])
  })

  it('siempre incluye al menos una tarea, aunque sea larga', () => {
    expect(fitToSession([t('a', 90)], 40).today).toHaveLength(1)
    expect(fitToSession([], 40)).toEqual({ today: [], more: [] })
  })

  it('con poco para hacer, entra todo', () => {
    expect(fitToSession([t('a', 5), t('b', 5)], 40).more).toEqual([])
  })
})

describe('tareas de hoy', () => {
  const base: TaskInput = {
    goals: goalsFor(3),
    counts: { puzzles: 0, lessons: 0, newLines: 0, games: 0, repReviews: 0 },
    dueRep: 0,
    duePuzzles: 0,
    puzzlesToday: 0,
    gamesPending: 0,
    nextLesson: { id: 'balanza', title: 'La balanza de las piezas' },
    nextLine: { id: 'w-italiana-c3', name: 'Italiana: 3…Ac5' },
  }

  it('primero lo que vence, después lo nuevo', () => {
    const t = todayTasks({ ...base, dueRep: 8, duePuzzles: 3 })
    expect(t.map((x) => x.id)).toEqual(['rep', 'review', 'puzzles', 'lesson', 'line', 'play'])
    expect(t[0]).toMatchObject({ detail: '8 posiciones', to: '/repertorio/repaso' })
    expect(t.find((x) => x.id === 'puzzles')?.detail).toBe('12 puzzles')
  })

  it('en estilo serio, los textos no usan giros del estilo juego', () => {
    const t = todayTasks({ ...base, serio: true }).find((x) => x.id === 'lesson')
    expect(t?.detail).toBe('Leé y practicá')
    expect(todayTasks(base).find((x) => x.id === 'lesson')?.detail).toBe('Leé, adiviná y practicá')
  })

  it('no sugiere lo que ya cumpliste ni lo que no tiene con qué hacerse', () => {
    const t = todayTasks({
      ...base,
      counts: { puzzles: 36, lessons: 1, newLines: 2, games: 2, repReviews: 0 },
      nextLesson: null,
    })
    expect(t).toEqual([])
  })

  it('descuenta los puzzles que ya hiciste hoy y respeta el total de la semana', () => {
    expect(todayTasks({ ...base, puzzlesToday: 5 }).find((x) => x.id === 'puzzles')?.detail).toBe('7 puzzles')
    expect(todayTasks({ ...base, puzzlesToday: 12 }).some((x) => x.id === 'puzzles')).toBe(false)
    expect(todayTasks({ ...base, counts: { ...base.counts, puzzles: 30 } }).find((x) => x.id === 'puzzles')?.detail).toBe('6 puzzles')
  })

  it('con partidas sin analizar, las analiza antes de sugerir jugar otra', () => {
    const t = todayTasks({ ...base, gamesPending: 2 })
    expect(t.at(-1)).toMatchObject({ id: 'analyze', detail: '2 partidas sin analizar' })
    expect(t.some((x) => x.id === 'play')).toBe(false)
  })
})
