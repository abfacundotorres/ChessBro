// Herramienta de autoría para adivinanzas de jugadas. Uso:
//   CHALLENGES=/ruta/c.json npx vitest run src/test/author2.test.ts --silent=false
// El JSON es una lista de { fen, options, answer }. Imprime la evaluación de cada opción.
import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import { it } from 'vitest'
import { verifyMoveChallenge } from './verifyExercise'

it.runIf(process.env.CHALLENGES)('adivinanzas', async () => {
  const list = JSON.parse(readFileSync(process.env.CHALLENGES!, 'utf8')) as { id: string; fen: string; options: string[]; answer: string }[]
  for (const c of list) {
    const v = await verifyMoveChallenge(c.fen, c.options, c.answer)
    const san = (u: string) => { const ch = new Chess(c.fen); try { return ch.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }).san } catch { return '?' } }
    const top = Object.entries(v.all).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([u, cp]) => `${san(u)}:${cp}`).join(' ')
    console.log(`${c.id}  opciones: ${c.options.map((o) => `${san(o)}=${v.all[o]}`).join(' ')}  | mejores: ${top}\\n   ${v.problems.join(' | ') || 'OK'}`)
  }
}, 600_000)
