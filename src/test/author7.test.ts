// Autoría de partidas de ejemplo (H24+): parte de una línea de la apertura, deja que el motor siga solo contra sí mismo
// y escribe, jugada por jugada, hechos de chess.js (capturas, jaques, qué ataca, qué queda sin defensa) y la evaluación,
// para redactar las notas sobre lo que de verdad pasa en el tablero. MODELS=1; entrada y salida por variables de entorno:
//   MODELS_IN  = ruta a un JSON [{ id, start: [SAN], plies }]   (plies = largo total de la partida)
//   MODELS_OUT = ruta del informe de texto
import { describe, it } from 'vitest'
import { readFileSync, writeFileSync } from 'node:fs'
import { Chess, type PieceSymbol, type Square } from 'chess.js'
import { nodeEngine } from './stockfishNode'
import { toCp, winPercent } from '../engine/analysis'
import { MORE_MODELS } from '../content/modelGames'

const run = process.env.MODELS ? describe : describe.skip
const VAL: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 }
const NAME: Record<PieceSymbol, string> = { p: 'peón', n: 'caballo', b: 'alfil', r: 'torre', q: 'dama', k: 'rey' }

/** Piezas del bando contrario que la pieza recién movida ataca, y si están defendidas. */
function attacked(c: Chess, to: Square): string[] {
  const mover = c.get(to)
  if (!mover) return []
  const out: string[] = []
  const opp = mover.color === 'w' ? 'b' : 'w'
  for (const row of c.board()) {
    for (const p of row) {
      if (!p || p.color !== opp || p.type === 'k') continue
      if (c.attackers(p.square, mover.color).includes(to)) {
        const def = c.attackers(p.square, opp).length > 0
        out.push(`${NAME[p.type]}${p.square}${def ? '(def)' : '(SIN DEFENSA)'}`)
      }
    }
  }
  return out
}

/** Piezas de `color` atacadas por el rival y sin defensa, o atacadas por algo de menos valor. */
function loose(c: Chess, color: 'w' | 'b'): string[] {
  const opp = color === 'w' ? 'b' : 'w'
  const out: string[] = []
  for (const row of c.board()) {
    for (const p of row) {
      if (!p || p.color !== color || p.type === 'k') continue
      const att = c.attackers(p.square, opp)
      if (att.length === 0) continue
      const defended = c.attackers(p.square, color).length > 0
      const lowest = Math.min(...att.map((s) => VAL[c.get(s)!.type]))
      if (!defended || lowest < VAL[p.type]) out.push(`${NAME[p.type]}${p.square}`)
    }
  }
  return out
}

run('partidas de ejemplo', () => {
  it('juega y describe', async () => {
    const eng = await nodeEngine()
    const items = JSON.parse(readFileSync(process.env.MODELS_IN!, 'utf8')) as { id: string; start: string[]; plies: number }[]
    const out: string[] = []
    for (const it of items) {
      const c = new Chess()
      const lines: string[] = []
      const log = (san: string, ply: number, evalCp: string) => {
        const last = c.history({ verbose: true }).at(-1)!
        const flags = [last.captured ? `captura ${NAME[last.captured]}` : '', c.isCheckmate() ? 'MATE' : c.inCheck() ? 'jaque' : '', last.san.startsWith('O-O') ? 'enroque' : '']
          .filter(Boolean)
          .join(', ')
        const atk = attacked(c, last.to)
        const lo = loose(c, last.color)
        lines.push(
          `${String(ply).padStart(2)} ${Math.ceil(ply / 2)}${ply % 2 ? '.' : '…'} ${san.padEnd(7)} ${evalCp.padStart(7)}${flags ? `  [${flags}]` : ''}${atk.length ? `  ataca: ${atk.join(' ')}` : ''}${lo.length ? `  SUELTAS(propias): ${lo.join(' ')}` : ''}`,
        )
      }
      let ply = 0
      for (const m of it.start) {
        c.move(m)
        ply++
        log(m, ply, '—')
      }
      // Pasado el largo pedido, sigue mientras la última jugada sea una captura o un jaque (máx. 10 más): no termina a mitad de una táctica.
      const settling = () => {
        const last = c.history({ verbose: true }).at(-1)
        return ply >= it.plies && ply < it.plies + 10 && !!last && (!!last.captured || c.inCheck())
      }
      while ((ply < it.plies || settling()) && !c.isGameOver()) {
        const e = await eng.evaluate(c.fen(), 14)
        const b = e.best!
        const mv = c.move({ from: b.slice(0, 2), to: b.slice(2, 4), promotion: b.slice(4) || undefined })
        ply++
        // La evaluación del motor es para el bando que mueve en la posición previa; la pasamos al punto de vista de las blancas.
        const sign = mv.color === 'w' ? 1 : -1
        const ev = 'cp' in e.score ? `${((sign * e.score.cp) / 100).toFixed(2)}` : `M${sign * e.score.mate}`
        log(mv.san, ply, ev)
      }
      out.push(`## ${it.id} (${ply} jugadas${c.isGameOver() ? ', terminó' : ''})\n${lines.join('\n')}\nSAN: ${c.history().join(' ')}\n`)
    }
    writeFileSync(process.env.MODELS_OUT!, out.join('\n'))
  }, 3_600_000)

  // Con MODELS_CHECK=1: ninguna jugada de las partidas armadas pierde mucho (8 puntos de probabilidad las tuyas, 12 las del rival).
  it.skipIf(!process.env.MODELS_CHECK)('verifica las partidas armadas con el motor', async () => {
    const eng = await nodeEngine()
    const flags: string[] = []
    for (const [id, list] of Object.entries(MORE_MODELS)) {
      for (const [k, g] of list.entries()) {
        const c = new Chess()
        for (let i = 0; i < g.moves.length; i++) {
          const mine = (i % 2 === 0) === (g.color === 'w')
          const base = await eng.evaluate(c.fen(), 14)
          c.move(g.moves[i]!)
          const after = await eng.evaluate(c.fen(), 14)
          const loss = Math.max(0, winPercent(toCp(base.score)) - winPercent(-toCp(after.score)))
          if (loss >= (mine ? 8 : 12)) flags.push(`${id}#${k} jugada ${i} ${g.moves[i]} pierde ${loss.toFixed(0)} (mejor ${base.best})`)
        }
      }
    }
    writeFileSync(process.env.MODELS_OUT ?? '/dev/null', flags.length ? flags.join('\n') : 'OK\n')
    if (flags.length) throw new Error(flags.join('; '))
  }, 3_600_000)
})
