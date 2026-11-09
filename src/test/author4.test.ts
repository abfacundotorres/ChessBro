// Herramienta de autoría para repertorio. Uso:
//   REP_LINES=/ruta/lineas.json npx vitest run src/test/author4.test.ts --silent=false
// El JSON es una lista de { id, color, moves: ["e4", "e5", ...] } (SAN). Imprime, jugada por jugada, cuánto
// pierde cada una respecto de la mejor del motor (en puntos de probabilidad de ganar).
import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import { it } from 'vitest'
import { toCp, winPercent } from '../engine/analysis'
import { nodeEngine } from './stockfishNode'

it.runIf(process.env.REP_LINES)('repertorio', async () => {
  const lines = JSON.parse(readFileSync(process.env.REP_LINES!, 'utf8')) as { id: string; color: 'w' | 'b'; moves: string[] }[]
  const sf = await nodeEngine()
  for (const l of lines) {
    const c = new Chess()
    const out: string[] = []
    let ok = true
    for (const san of l.moves) {
      const side = c.turn()
      const before = await sf.evaluate(c.fen(), 12)
      const bestCp = toCp(before.score)
      let move
      try { move = c.move(san) } catch { out.push(`${san}:ILEGAL`); ok = false; break }
      const after = c.isGameOver() ? null : await sf.evaluate(c.fen(), 12)
      const cp = after ? -toCp(after.score) : 0
      const loss = Math.max(0, winPercent(bestCp) - winPercent(cp))
      out.push(`${side === l.color ? '' : '('}${move.san}${side === l.color ? '' : ')'}${loss >= 5 ? `[-${loss.toFixed(0)}]` : ''}`)
    }
    const fin = await sf.evaluate(c.fen(), 14)
    const finCp = toCp(fin.score) * (c.turn() === l.color ? 1 : -1)
    console.log(`${l.id.padEnd(16)} ${ok ? '' : 'ERROR '}fin(${l.color}): ${finCp} cp | ${out.join(' ')}`)
  }
}, 900_000)
