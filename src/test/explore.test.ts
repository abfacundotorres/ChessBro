// Herramienta de autoría: evalúa con Stockfish posiciones y jugadas candidatas. Se activa con EXPLORE=1 y lee /tmp/cc/explore.json:
// [{ id, moves: [SAN...], cands: [SAN...] }] → /tmp/cc/explore.txt (mejor jugada, pérdida de cada candidata y de la última jugada).
import { describe, it } from 'vitest'
import { readFileSync, writeFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import { nodeEngine } from './stockfishNode'
import { toCp, winPercent } from '../engine/analysis'

const run = process.env.EXPLORE ? describe : describe.skip

run('explorar posiciones (Stockfish)', () => {
  it('evalúa', async () => {
    const eng = await nodeEngine()
    const items = JSON.parse(readFileSync('/tmp/cc/explore.json', 'utf8')) as { id: string; moves: string[]; cands?: string[] }[]
    const out: string[] = []
    const depth = Number(process.env.DEPTH ?? 14)
    for (const it of items) {
      const c = new Chess()
      const fens = [c.fen()]
      try {
        for (const m of it.moves) { c.move(m); fens.push(c.fen()) }
      } catch (e) {
        out.push(`${it.id}: ILEGAL ${String(e).slice(0, 60)}`)
        continue
      }
      const here = await eng.evaluate(fens.at(-1)!, depth)
      const hereCp = toCp(here.score)
      const pvSan = (fen: string, pv: string[]) => { const t = new Chess(fen); const o: string[] = []; for (const u of pv.slice(0, 6)) { try { o.push(t.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u.slice(4) || undefined }).san) } catch { break } } return o.join(' ') }
      let bestSan = '?'
      try { const b = new Chess(fens.at(-1)!); const mv = b.move({ from: here.best!.slice(0, 2), to: here.best!.slice(2, 4), promotion: here.best!.slice(4) || undefined }); bestSan = mv.san } catch { /* */ }
      let lastLoss = ''
      if (it.moves.length > 0) {
        const before = await eng.evaluate(fens.at(-2)!, depth)
        lastLoss = ` última jugada ${it.moves.at(-1)} pierde ${Math.max(0, winPercent(toCp(before.score)) - winPercent(-hereCp)).toFixed(1)}`
      }
      const cs: string[] = []
      for (const cand of it.cands ?? []) {
        try {
          const d = new Chess(fens.at(-1)!)
          d.move(cand)
          const after = await eng.evaluate(d.fen(), depth)
          cs.push(`${cand}:${Math.max(0, winPercent(hereCp) - winPercent(-toCp(after.score))).toFixed(1)}`)
        } catch { cs.push(`${cand}:ILEGAL`) }
      }
      const turn = fens.at(-1)!.split(' ')[1]
      out.push(`${it.id} [${turn}] eval ${(hereCp / 100 * (turn === 'w' ? 1 : -1)).toFixed(2)}(blancas) mejor ${bestSan} (${pvSan(fens.at(-1)!, here.pv)})${lastLoss} | ${cs.join(' ')}`)
    }
    writeFileSync('/tmp/cc/explore.txt', out.join('\n') + '\n')
  }, 1_800_000)
})
