// Herramienta de revisión: vuelca los pasos de lectura de las lecciones (texto de los dos estilos, diagrama, flechas y
// casillas resaltadas) con una hoja de hechos de chess.js: tablero, qué hay en cada casilla que el texto menciona y
// quién la ataca, y si cada flecha es una jugada legal. STEPS=1; STEPS_OUT = informe de texto.
import { describe, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { Chess, type Square } from 'chess.js'
import { LESSONS } from '../content/lessons'
import { SERIO } from '../content/lessonsSerias'

const NAME: Record<string, string> = { p: 'peón', n: 'caballo', b: 'alfil', r: 'torre', q: 'dama', k: 'rey' }

function describeSquare(c: Chess, sq: string): string {
  const p = c.get(sq as Square)
  const what = p ? `${NAME[p.type]} ${p.color === 'w' ? 'blanco' : 'negro'}` : 'vacía'
  const w = c.attackers(sq as Square, 'w').join(',') || '—'
  const b = c.attackers(sq as Square, 'b').join(',') || '—'
  return `${sq}: ${what} · la atacan blancas [${w}] negras [${b}]`
}

/** La flecha como jugada: legal para el bando que mueve, legal si moviera el otro, o no es una jugada. */
function arrowFact(fen: string, from: string, to: string): string {
  const tryIt = (f: string): string | null => {
    try {
      const c = new Chess(f)
      const m = c.moves({ verbose: true }).find((x) => x.from === from && x.to === to)
      return m ? m.san : null
    } catch {
      return null
    }
  }
  const san = tryIt(fen)
  if (san) return `legal (${san})`
  const parts = fen.split(' ')
  parts[1] = parts[1] === 'w' ? 'b' : 'w'
  parts[3] = '-'
  const other = tryIt(parts.join(' '))
  if (other) return `legal solo si moviera el otro bando (${other})`
  return 'NO es una jugada legal'
}

const run = process.env.STEPS ? describe : describe.skip
run('pasos de lectura', () => {
  it('vuelca', () => {
    const out: string[] = []
    let n = 0
    for (const l of LESSONS) {
      out.push(`\n################ ${l.id} (${l.band}) — ${l.title}\n${l.summary}`)
      l.steps.forEach((s, i) => {
        n++
        out.push(`\n=== ${l.id}#${i + 1}${s.challenge ? ` [desafío ${s.challenge.kind}]` : ''} ${s.title ?? ''}`)
        out.push(s.text)
        const serio = SERIO[l.id]?.steps[i]
        if (serio) out.push(`--- serio: ${serio.title ?? ''}\n${serio.text}`)
        if (!s.fen) return
        const c = new Chess(s.fen)
        out.push(`FEN ${s.fen} (${s.orientation ?? 'white'})\n${c.ascii()}`)
        out.push(`mueve ${c.turn() === 'w' ? 'blancas' : 'negras'}${c.isCheck() ? ' · EN JAQUE' : ''}${c.isCheckmate() ? ' · MATE' : ''}${c.isStalemate() ? ' · AHOGADO' : ''}`)
        for (const a of s.arrows ?? []) out.push(`flecha ${a.kind} ${a.from}→${a.to}: ${arrowFact(s.fen, a.from, a.to)}`)
        const squares = new Set<string>([...(s.highlights ?? [])])
        const texts = [s.text, serio?.text ?? ''].join(' ')
        for (const m of texts.matchAll(/(?<![a-zA-Z])([a-h][1-8])(?![0-9a-z])/g)) squares.add(m[1]!)
        for (const a of s.arrows ?? []) {
          squares.add(a.from)
          squares.add(a.to)
        }
        if (s.highlights?.length) out.push(`resaltadas: ${s.highlights.join(', ')}`)
        for (const sq of [...squares].sort()) out.push('  ' + describeSquare(c, sq))
      })
    }
    out.push(`\nTotal de pasos: ${n}`)
    writeFileSync(process.env.STEPS_OUT!, out.join('\n') + '\n')
  })
})
