// Verificación con Stockfish de los ejercicios y partidas de ejemplo de las aperturas. Se activa con EXTRAS=1 → /tmp/cc/extras.txt
import { describe, it, expect } from 'vitest'
import { writeFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import { nodeEngine } from './stockfishNode'
import { EXTRAS } from '../content/openingExtras'
import { toCp, winPercent } from '../engine/analysis'

const run = process.env.EXTRAS ? describe : describe.skip

run('ejercicios de aperturas (Stockfish)', () => {
  it('las respuestas son de las mejores y los errores del rival son errores', async () => {
    const eng = await nodeEngine()
    const out: string[] = []
    const lossOf = async (fen: string, san: string) => {
      const base = await eng.evaluate(fen, 14)
      const c = new Chess(fen)
      c.move(san)
      const after = await eng.evaluate(c.fen(), 14)
      return Math.max(0, winPercent(toCp(base.score)) - winPercent(-toCp(after.score)))
    }
    let bad = 0
    for (const [id, ex] of Object.entries(EXTRAS)) {
      for (const it of ex.items) {
        const c = new Chess()
        for (const m of it.moves) c.move(m)
        const fen = c.fen()
        const parts: string[] = []
        for (const mv of [it.answer, ...(it.alt ?? [])]) {
          const l = await lossOf(fen, mv)
          parts.push(`${mv}:${l.toFixed(1)}`)
          if (l > (mv === it.answer ? 2.5 : 3.5)) { bad++; parts.push('<<MAL') }
        }
        if (it.kind === 'punish') {
          const p = new Chess()
          for (const m of it.moves.slice(0, -1)) p.move(m)
          const l = await lossOf(p.fen(), it.moves.at(-1)!)
          parts.push(`error del rival pierde ${l.toFixed(1)}`)
          if (l < 4) { bad++; parts.push('<<NO ES ERROR') }
        }
        out.push(`${id} ${it.id} ${parts.join(' ')}`)
      }
      if (ex.model) {
        const g = ex.model
        const c = new Chess()
        const flags: string[] = []
        for (let i = 0; i < g.moves.length; i++) {
          const mine = (i % 2 === 0) === (g.color === 'w')
          const base = await eng.evaluate(c.fen(), 14)
          const before = toCp(base.score)
          c.move(g.moves[i]!)
          const after = await eng.evaluate(c.fen(), 14)
          const loss = Math.max(0, winPercent(before) - winPercent(-toCp(after.score)))
          if (loss >= (mine ? 6 : 12)) { flags.push(`${i}${mine ? 'T' : 'R'}:${g.moves[i]}-${loss.toFixed(0)}(${base.best})`); bad++ }
        }
        out.push(`${id} MODELO ${flags.length ? flags.join(' ') : 'OK'}`)
      }
    }
    writeFileSync('/tmp/cc/extras.txt', out.join('\n') + `\nMALOS ${bad}\n`)
    expect(bad).toBe(0)
  }, 3_000_000)
})
