// Herramienta de autoría para mini-juegos de tocar el tablero. Uso:
//   TAPS=/ruta/t.json npx vitest run src/test/author3.test.ts --silent=false
// El JSON es una lista de { id, fen, rule, side }. Imprime el tablero y la respuesta calculada.
import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import { it } from 'vitest'
import { tapAnswer, type TapRule } from '../engine/structure'

it.runIf(process.env.TAPS)('taps', () => {
  const list = JSON.parse(readFileSync(process.env.TAPS!, 'utf8')) as { id: string; fen: string; rule: TapRule; side: 'w' | 'b' | 'both' }[]
  for (const c of list) {
    const board = new Chess(c.fen).board().map((r) => r.map((x) => (x ? (x.color === 'w' ? x.type.toUpperCase() : x.type) : '.')).join(' ')).join('\n   ')
    console.log(`${c.id} [${c.rule}/${c.side}]\n   ${board}\n   → ${tapAnswer(c.rule, c.fen, c.side).sort().join(' ')}`)
  }
})
