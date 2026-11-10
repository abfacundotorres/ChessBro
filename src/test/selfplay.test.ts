// Autoría: continúa una línea con el motor jugando contra sí mismo. SELFPLAY=1, lee /tmp/cc/selfplay.json [{id,moves:[SAN],plies}] → /tmp/cc/selfplay.txt
import { describe, it } from 'vitest'
import { readFileSync, writeFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import { nodeEngine } from './stockfishNode'

const run = process.env.SELFPLAY ? describe : describe.skip
run('autojuego', () => {
  it('juega', async () => {
    const eng = await nodeEngine()
    const items = JSON.parse(readFileSync('/tmp/cc/selfplay.json', 'utf8')) as { id: string; moves: string[]; plies: number }[]
    const out: string[] = []
    for (const it of items) {
      const c = new Chess()
      for (const m of it.moves) c.move(m)
      const start = it.moves.length
      for (let k = 0; k < it.plies && !c.isGameOver(); k++) {
        const e = await eng.evaluate(c.fen(), 12)
        const b = e.best!
        c.move({ from: b.slice(0, 2), to: b.slice(2, 4), promotion: b.slice(4) || undefined })
      }
      const h = c.history()
      out.push(`${it.id} (${start} dadas) ${h.join(' ')}`)
    }
    writeFileSync('/tmp/cc/selfplay.txt', out.join('\n') + '\n')
  }, 1_800_000)
})
