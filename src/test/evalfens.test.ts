// Herramienta de revisión: evalúa con Stockfish una lista de posiciones y escribe la evaluación (en centipeones, desde el punto de
// vista de las blancas). EVALFENS=1; FENS_IN = JSON [{ id, fen }], FENS_OUT = informe de texto. Profundidad 16.
import { describe, it } from 'vitest'
import { readFileSync, writeFileSync } from 'node:fs'
import { toCp } from '../engine/analysis'
import { nodeEngine } from './stockfishNode'

const run = process.env.EVALFENS ? describe : describe.skip
run('evaluar posiciones', () => {
  it('evalúa', async () => {
    const eng = await nodeEngine()
    const items = JSON.parse(readFileSync(process.env.FENS_IN!, 'utf8')) as { id: string; fen: string }[]
    const out: string[] = []
    for (const it of items) {
      const e = await eng.evaluate(it.fen, 16)
      const white = it.fen.split(' ')[1] === 'w'
      const cp = toCp(e.score) * (white ? 1 : -1)
      out.push(`${it.id}: ${(cp / 100).toFixed(2)} (blancas) · mejor ${e.best}`)
    }
    writeFileSync(process.env.FENS_OUT!, out.join('\n') + '\n')
  }, 600_000)
})
