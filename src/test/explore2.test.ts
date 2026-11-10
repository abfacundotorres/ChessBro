// Autoría: busca errores plausibles del rival en las líneas de la biblioteca. EXPLORE2=1 → /tmp/cc/explore2.txt
import { describe, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import { nodeEngine } from './stockfishNode'
import { DEEP_LINES } from '../content/openingLines'
import { toCp, winPercent } from '../engine/analysis'

const run = process.env.EXPLORE2 ? describe : describe.skip

run('errores del rival (Stockfish)', () => {
  it('busca', async () => {
    const eng = await nodeEngine()
    const depth = Number(process.env.DEPTH ?? 11)
    const out: string[] = []
    const seen = new Set<string>()
    const only = process.env.ONLY?.split(',')
    for (const line of DEEP_LINES) {
      if (only && !only.includes(line.opening!)) continue
      const maxPly = Math.min(line.moves.length, 12)
      for (let i = 0; i < maxPly; i++) {
        const mine = (i % 2 === 0) === (line.color === 'w')
        if (mine) continue
        const prefix = line.moves.slice(0, i)
        const key = prefix.join(' ')
        if (seen.has(key)) continue
        seen.add(key)
        const c = new Chess()
        for (const m of prefix) c.move(m)
        const baseFen = c.fen()
        const base = await eng.evaluate(baseFen, depth)
        const baseCp = toCp(base.score)
        for (const mv of c.moves({ verbose: true })) {
          const d = new Chess(baseFen)
          d.move(mv.san)
          const after = await eng.evaluate(d.fen(), depth)
          // pérdida del rival: su win% antes menos su win% después (desde su punto de vista)
          const loss = winPercent(baseCp) - winPercent(-toCp(after.score))
          if (loss < 12 || loss > 45) continue
          if (d.isGameOver()) continue
          let reply = '?'
          try { const r = new Chess(d.fen()); const b = after.best!; reply = r.move({ from: b.slice(0, 2), to: b.slice(2, 4), promotion: b.slice(4) || undefined }).san } catch { /* */ }
          out.push(`${line.opening} ${line.id} | ${prefix.join(' ')} | ${mv.san} pierde ${loss.toFixed(0)} | réplica ${reply} | eval(usuario) ${((line.color === 'w' ? -1 : 1) * toCp(after.score) / 100 * -1).toFixed(1)}`)
        }
        writeFileSync('/tmp/cc/explore2.txt', out.join('\n') + '\n')
      }
    }
    writeFileSync('/tmp/cc/explore2.txt', out.join('\n') + '\nFIN\n')
  }, 3_000_000)
})
