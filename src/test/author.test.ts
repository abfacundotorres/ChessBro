// Herramienta de autoría (no es un test real): imprime qué jugadas son buenas en cada candidato.
// Uso: CANDS=/ruta/candidatos.json npx vitest run src/test/author.test.ts --silent=false
// El JSON es una lista de `Exercise` (ver src/engine/lesson.ts); `accept` puede ir vacío.
import { readFileSync } from 'node:fs'
import { it } from 'vitest'
import type { Exercise } from '../engine/lesson'
import { verifyExercise } from './verifyExercise'

it.runIf(process.env.CANDS)('autoría', async () => {
  const cands = JSON.parse(readFileSync(process.env.CANDS!, 'utf8')) as Exercise[]
  for (const ex of cands) {
    const v = await verifyExercise(ex)
    const top = Object.entries(v.all)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([u, c]) => `${u}:${c}`)
      .join(' ')
    console.log(`${ex.id.padEnd(16)} best=${String(v.best).padStart(6)} good=[${v.good.join(' ')}] top: ${top}\n   línea: ${v.bestLine.join(' ')}\n   ${v.problems.join(' | ') || 'OK'}`)
  }
}, 600_000)
