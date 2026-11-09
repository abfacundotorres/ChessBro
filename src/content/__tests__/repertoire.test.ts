import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { REPERTOIRE } from '../repertoire'
import { toCp, winPercent } from '../../engine/analysis'
import { buildCards, lineSteps } from '../../engine/repertoire'
import { nodeEngine } from '../../test/stockfishNode'

describe('repertorio: estructura', () => {
  it('ids únicos y cantidad razonable por color (10 a 20 líneas)', () => {
    expect(new Set(REPERTOIRE.map((l) => l.id)).size).toBe(REPERTOIRE.length)
    for (const c of ['w', 'b'] as const) {
      const n = REPERTOIRE.filter((l) => l.color === c).length
      expect(n, c).toBeGreaterThanOrEqual(10)
      expect(n, c).toBeLessThanOrEqual(20)
    }
  })

  it('todas las líneas son legales, de 5 a 9 jugadas propias, y terminan donde le toca al rival', () => {
    for (const l of REPERTOIRE) {
      const steps = lineSteps(l) // lanza si hay una jugada ilegal
      const mine = steps.filter((s) => s.mine).length
      expect(mine, l.id).toBeGreaterThanOrEqual(5)
      expect(mine, l.id).toBeLessThanOrEqual(9)
      expect(steps[0]!.mine, l.id).toBe(l.color === 'w')
    }
  })

  it('con blancas siempre 1.e4; con negras, 1…e5 contra 1.e4 y 1…d5 contra 1.d4', () => {
    for (const l of REPERTOIRE.filter((x) => x.color === 'w')) expect(l.moves[0], l.id).toBe('e4')
    const firstReply = (l: (typeof REPERTOIRE)[number]) => `${l.moves[0]} ${l.moves[1]}`
    for (const l of REPERTOIRE.filter((x) => x.color === 'b' && x.moves[0] === 'e4')) expect(firstReply(l), l.id).toBe('e4 e5')
    for (const l of REPERTOIRE.filter((x) => x.color === 'b' && x.moves[0] === 'd4')) expect(firstReply(l), l.id).toBe('d4 d5')
  })

  it('el repertorio es consistente: una sola jugada propia por posición', () => {
    for (const color of ['w', 'b'] as const) {
      const { conflicts, cards } = buildCards(REPERTOIRE.filter((l) => l.color === color))
      expect(conflicts, JSON.stringify(conflicts)).toEqual([])
      expect(cards.length).toBeGreaterThan(50)
    }
  })

  it('los textos están completos y las notas apuntan a jugadas propias', () => {
    for (const l of REPERTOIRE) {
      expect(l.idea.length, l.id).toBeGreaterThan(40)
      expect(l.plan.length, l.id).toBeGreaterThanOrEqual(2)
      const steps = lineSteps(l)
      for (const k of Object.keys(l.notes ?? {})) {
        const i = Number(k)
        expect(steps[i], `${l.id}: nota ${k}`).toBeDefined()
        expect(steps[i]!.mine, `${l.id}: la nota ${k} no es sobre una jugada propia`).toBe(true)
      }
    }
  })
})

describe('repertorio: Stockfish', () => {
  it.each(REPERTOIRE.map((l) => [l.id, l] as const))('%s: ninguna jugada propia pierde más de 8 puntos y la posición final es sana', async (_id, line) => {
    const sf = await nodeEngine()
    const chess = new Chess()
    const problems: string[] = []
    for (const san of line.moves) {
      const mine = chess.turn() === line.color
      const bestCp = toCp((await sf.evaluate(chess.fen(), 12)).score)
      const m = chess.move(san)
      const cp = -toCp((await sf.evaluate(chess.fen(), 12)).score)
      const loss = winPercent(bestCp) - winPercent(cp)
      // Jugadas propias: casi las mejores. Jugadas del rival: que no sean un regalo (si no, la línea enseña a ganar a un rival que no existe).
      if (mine && loss > 8) problems.push(`${m.san} pierde ${loss.toFixed(1)}`)
      if (!mine && loss > 15) problems.push(`la respuesta rival ${m.san} regala ${loss.toFixed(1)}`)
    }
    expect(problems, problems.join(' | ')).toEqual([])
    const fin = toCp((await sf.evaluate(chess.fen(), 14)).score) * (chess.turn() === line.color ? 1 : -1)
    expect(fin, `evaluación final ${fin}`).toBeGreaterThanOrEqual(-60)
  }, 120_000)
})
