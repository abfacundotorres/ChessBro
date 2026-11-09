import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { LESSONS } from '../lessons'
import { ENDGAMES } from '../endgames'
import { BANDS } from '../curriculum'
import { themeByKey } from '../themes'
import { toCp, winPercent } from '../../engine/analysis'
import { judgeEndgame } from '../../engine/endgame'
import { replay, validateFen } from '../../engine/game'
import { startExercise, tryExercise } from '../../engine/lesson'
import { uciToMove } from '../../engine/puzzle'
import { nodeEngine } from '../../test/stockfishNode'
import { verifyExercise } from '../../test/verifyExercise'

const SQUARE = /^[a-h][1-8]$/
const allExercises = LESSONS.flatMap((l) => l.exercises.map((e) => ({ lesson: l.id, ex: e })))

describe('estructura de las lecciones', () => {
  it('ids únicos y bandas existentes', () => {
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length)
    expect(new Set(allExercises.map((x) => x.ex.id)).size).toBe(allExercises.length)
    for (const l of LESSONS) expect(BANDS.some((b) => b.id === l.band)).toBe(true)
  })

  it('cada lección tiene pasos, y los diagramas son válidos', () => {
    for (const l of LESSONS) {
      expect(l.steps.length, l.id).toBeGreaterThan(0)
      for (const s of l.steps) {
        expect(s.text.length).toBeGreaterThan(20)
        if (s.fen) expect(validateFen(s.fen), `${l.id}: ${s.fen}`).toBeNull()
        for (const a of s.arrows ?? []) expect([a.from, a.to].every((q) => SQUARE.test(q))).toBe(true)
        for (const h of s.highlights ?? []) expect(SQUARE.test(h)).toBe(true)
      }
    }
  })

  it('las lecciones referencian finales y temas que existen', () => {
    for (const l of LESSONS) {
      if (l.endgame) expect(ENDGAMES.some((e) => e.id === l.endgame), l.id).toBe(true)
      if (l.practice) expect(themeByKey(l.practice), `${l.id}: ${l.practice}`).toBeDefined()
    }
  })

  it('hay ejercicios para cada tema táctico de la banda', () => {
    for (const id of ['seguridad', 'mate1', 'mate2', 'horquilla', 'clavada', 'ensartada', 'descubierta', 'desviacion', 'defensor', 'atrapada', 'cuadrado', 'oposicion']) {
      expect(LESSONS.find((l) => l.id === id)?.exercises.length, id).toBeGreaterThan(0)
    }
  })
})

describe('ejercicios: jugabilidad (todos)', () => {
  it('la línea es legal, empieza con una jugada aceptada y mueve el bando correcto', () => {
    for (const { ex } of allExercises) {
      expect(validateFen(ex.fen), ex.id).toBeNull()
      expect(ex.accept, ex.id).toContain(ex.line[0])
      const view = replay(ex.fen, ex.line.map(uciToMove))
      expect(view.moves.length).toBe(ex.line.length)
    }
  })

  it('resolver con la línea principal termina el ejercicio', () => {
    for (const { ex } of allExercises) {
      let s = startExercise(ex)
      for (let i = 0; i < ex.line.length && !s.solved; i += 2) {
        const r = tryExercise(ex, s, uciToMove(ex.line[i]!))
        expect(r.ok, `${ex.id} jugada ${i}`).toBe(true)
        s = r.state
      }
      expect(s.solved, ex.id).toBe(true)
    }
  })

  it('una jugada que no es solución no resuelve ni avanza', () => {
    for (const { ex } of allExercises) {
      const legal = new Chess(ex.fen).moves({ verbose: true }).find((m) => !ex.accept.includes(`${m.from}${m.to}${m.promotion ?? ''}`))
      if (!legal) continue
      const r = tryExercise(ex, startExercise(ex), { from: legal.from, to: legal.to, promotion: legal.promotion as 'q' | undefined })
      // Un mate también es válido aunque no esté en accept (ej.: varios mates en 1).
      if (new Chess(ex.fen).move(legal).san.endsWith('#')) continue
      expect(r.ok, ex.id).toBe(false)
    }
  })
})

describe('ejercicios escritos a mano: verificados con Stockfish', () => {
  const own = allExercises.filter((x) => x.ex.source !== 'lichess')
  it.each(own.map((x) => [x.ex.id, x.ex] as const))('%s', async (_id, ex) => {
    const v = await verifyExercise(ex)
    expect(v.problems, `${ex.id}: ${v.problems.join(' | ')}`).toEqual([])
  }, 120_000)
})

describe('finales jugables', () => {
  it.each(ENDGAMES.map((e) => [e.id, e] as const))('%s: posición inicial válida y con el resultado esperado', async (_id, def) => {
    expect(validateFen(def.fen)).toBeNull()
    const sf = await nodeEngine()
    const ev = await sf.evaluate(def.fen, 16)
    const turn = def.fen.split(' ')[1]
    const cpMover = toCp(ev.score)
    const cpUser = turn === def.user ? cpMover : -cpMover
    if (def.goal === 'mate') expect(winPercent(cpUser)).toBeGreaterThan(80)
    else expect(cpUser).toBeGreaterThanOrEqual(-80)
  }, 120_000)

  it.each(ENDGAMES.map((e) => [e.id, e] as const))('%s: el motor contra sí mismo cumple el objetivo dentro del límite', async (_id, def) => {
    const sf = await nodeEngine()
    const moves: ReturnType<typeof uciToMove>[] = []
    let verdict = judgeEndgame(def, replay(def.fen, moves), 0)
    const userTurnFirst = def.fen.split(' ')[1] === def.user
    let userMoves = 0
    for (let ply = 0; ply < 200 && verdict.state === 'playing'; ply++) {
      const view = replay(def.fen, moves)
      // El usuario (aquí también el motor) juega a fondo; el rival, con la profundidad de la app.
      const userSide = view.turn === def.user
      const ev = await sf.evaluate(view.fen, userSide ? (def.goal === 'mate' ? 18 : 12) : 10)
      if (!ev.best) break
      moves.push(uciToMove(ev.best))
      const nowUser = (userTurnFirst ? ply % 2 === 0 : ply % 2 === 1)
      if (nowUser) userMoves++
      verdict = judgeEndgame(def, replay(def.fen, moves), userMoves)
    }
    expect(verdict.state, `${def.id}: ${verdict.message} (${userMoves} jugadas)`).toBe('won')
  }, 300_000)
})
