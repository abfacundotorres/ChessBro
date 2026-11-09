import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import { it } from 'vitest'
import { toCp, winPercent } from '../engine/analysis'
import { nodeEngine } from './stockfishNode'

it.runIf(process.env.DBG2)('dbg2', async () => {
  const sf = await nodeEngine()
  const puzzles = JSON.parse(readFileSync(new URL('../content/lessonPuzzles.json', import.meta.url), 'utf8')) as Record<string, { id: string; fen: string; line: string[]; rating: number }[]>
  for (const theme of ['mateIn3', 'quietMove', 'defensiveMove']) for (const p of puzzles[theme]!) {
    const c = new Chess(p.fen)
    const rows: string[] = []
    for (const m of c.moves({ verbose: true })) {
      const k = new Chess(p.fen); k.move(m)
      const uci = `${m.from}${m.to}${m.promotion ?? ''}`
      const cp = k.isCheckmate() ? 10000 : -toCp((await sf.evaluate(k.fen(), 12)).score)
      if (uci === p.line[0] || m.san.includes('+') || m.captured) rows.push(`${uci === p.line[0] ? '*' : ''}${m.san}:${Math.round(winPercent(cp))}%`)
    }
    console.log(`${theme} ${p.id} r${p.rating} ${p.fen}\n   ${rows.join(' ')}`)
  }
}, 900000)
