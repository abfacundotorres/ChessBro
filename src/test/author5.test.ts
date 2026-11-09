// Verificación con Stockfish de las líneas de la biblioteca de aperturas. Se activa con DEEP=1 (opcional: DEEP_IDS=a,b).
// Escribe el informe en /tmp/cc/deep.txt: pérdidas de probabilidad de ganar por jugada (propias ≥ 8, del rival ≥ 15).
import { describe, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import { nodeEngine } from './stockfishNode'
import { DEEP_LINES } from '../content/openingLines'
import { toCp, winPercent } from '../engine/analysis'

const run = process.env.DEEP ? describe : describe.skip

run('líneas de aperturas (Stockfish)', () => {
  it('ninguna jugada propia pierde más de 8 puntos ni el rival comete errores grandes', async () => {
    const eng = await nodeEngine()
    const ids = process.env.DEEP_IDS?.split(',')
    const out: string[] = []
    for (const line of DEEP_LINES) {
      if (ids && !ids.includes(line.id)) continue
      const c = new Chess()
      const fens = [c.fen()]
      for (const san of line.moves) { c.move(san); fens.push(c.fen()) }
      const evals = []
      for (const f of fens) evals.push(await eng.evaluate(f, 14))
      let flagged = 0
      for (let i = 0; i < line.moves.length; i++) {
        const mine = (i % 2 === 0) === (line.color === 'w')
        const loss = Math.max(0, winPercent(toCp(evals[i]!.score)) - winPercent(-toCp(evals[i + 1]!.score)))
        if (loss >= (mine ? 8 : 15)) {
          flagged++
          const best = evals[i]!.best ?? '?'
          out.push(`${line.id} ply ${i} ${mine ? 'TUYA' : 'RIVAL'} ${line.moves[i]} pierde ${loss.toFixed(1)} (motor: ${best})`)
        }
      }
      out.push(`${line.id}: ${flagged === 0 ? 'OK' : flagged + ' marcas'} · final ${(toCp(evals.at(-1)!.score) * (line.moves.length % 2 === 0 ? 1 : -1) / 100).toFixed(2)} (blancas)`)
    }
    writeFileSync('/tmp/cc/deep.txt', out.join('\n') + '\n')
  }, 1_800_000)
})
