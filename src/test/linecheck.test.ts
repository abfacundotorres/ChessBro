// Autoría: comprueba líneas candidatas con Stockfish. LINECHECK=1, lee /tmp/cc/cand.json [{id,color,moves}] → /tmp/cc/cand.txt
import { describe, it } from 'vitest'
import { readFileSync, writeFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import { nodeEngine } from './stockfishNode'
import { toCp, winPercent } from '../engine/analysis'

const run = process.env.LINECHECK ? describe : describe.skip
run('líneas candidatas (Stockfish)', () => {
  it('evalúa', async () => {
    const eng = await nodeEngine()
    const cands = JSON.parse(readFileSync('/tmp/cc/cand.json', 'utf8')) as { id: string; color: 'w' | 'b'; moves: string }[]
    const out: string[] = []
    for (const l of cands) {
      const moves = l.moves.split(' ')
      const c = new Chess()
      const fens = [c.fen()]
      try { for (const m of moves) { c.move(m); fens.push(c.fen()) } } catch (e) { out.push(`${l.id}: ILEGAL ${String(e).slice(0, 80)}`); continue }
      const ev = []
      for (const f of fens) ev.push(await eng.evaluate(f, 14))
      const flags: string[] = []
      for (let i = 0; i < moves.length; i++) {
        const mine = (i % 2 === 0) === (l.color === 'w')
        const loss = Math.max(0, winPercent(toCp(ev[i]!.score)) - winPercent(-toCp(ev[i + 1]!.score)))
        if (loss >= (mine ? 8 : 15)) flags.push(`${i}${mine ? 'T' : 'R'}:${moves[i]}-${loss.toFixed(0)}(${ev[i]!.best})`)
      }
      out.push(`${l.id}: ${flags.length ? flags.join(' ') : 'OK'} final ${(toCp(ev.at(-1)!.score) * (moves.length % 2 === 0 ? 1 : -1) / 100).toFixed(2)}`)
    }
    writeFileSync('/tmp/cc/cand.txt', out.join('\n') + '\n')
  }, 1_800_000)
})
