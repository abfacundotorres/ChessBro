import { Chess, type PieceSymbol, type Square } from 'chess.js'

/**
 * Detector de afirmaciones falsas en notas de jugadas (partidas de ejemplo y líneas a fondo). Solo mira patrones que se pueden
 * comprobar sin interpretar el texto: «ataca el <pieza> de <casilla>», «protege el <pieza> de <casilla>», «recapturás con el <pieza>»,
 * «cambiás <pieza>», «jaque» y «torres conectadas». No reemplaza leer las notas: si no encuentra nada, no quiere decir que estén bien.
 */
const TYPE: Record<string, PieceSymbol> = { peón: 'p', caballo: 'n', alfil: 'b', torre: 'r', dama: 'q', rey: 'k' }
const W = '(peón|caballo|alfil|torre|dama|rey)'
const SQ = '([a-h][1-8])'

export function lintNote(moves: string[], k: number, note: string): string[] {
  const c = new Chess()
  for (let i = 0; i <= k; i++) c.move(moves[i]!)
  const last = c.history({ verbose: true }).at(-1)!
  const me = last.color
  const out: string[] = []
  const at = (sq: string) => c.get(sq as Square)
  for (const m of note.matchAll(new RegExp(`ataca(?:s|n)? (?:a |al )?(?:el |la |los |las )?${W} (?:negr[oa] |blanc[oa] )?de ${SQ}`, 'gi'))) {
    const [, w, sq] = m
    const p = at(sq!)
    if (!p) out.push(`ataca ${w} de ${sq}: casilla vacía`)
    else if (p.type !== TYPE[w!.toLowerCase()]) out.push(`ataca ${w} de ${sq}: ahí hay otra pieza (${p.type})`)
    else if (p.color !== me && !c.attackers(sq as Square, me).includes(last.to)) out.push(`ataca ${w} de ${sq}: la pieza movida (${last.to}) no lo ataca`)
  }
  for (const m of note.matchAll(new RegExp(`(?:protege|defiende|apoya)(?:s|n)? (?:a |al )?(?:el |la |los |las )?${W} de ${SQ}`, 'gi'))) {
    const [, w, sq] = m
    const p = at(sq!)
    if (!p) out.push(`protege ${w} de ${sq}: casilla vacía`)
    else if (p.type !== TYPE[w!.toLowerCase()]) out.push(`protege ${w} de ${sq}: ahí hay otra pieza (${p.type})`)
    else if (p.color === me && !c.attackers(sq as Square, me).includes(last.to)) out.push(`protege ${w} de ${sq}: la pieza movida (${last.to}) no lo protege`)
  }
  if (!/\bsi\b/i.test(note)) {
    for (const m of note.matchAll(new RegExp(`[Rr]ecaptur[aá]s? con (?:el |la )${W}`, 'g'))) if (TYPE[m[1]!] !== last.piece || !last.captured) out.push(`recaptura con ${m[1]}: la jugada es ${last.san}`)
    for (const m of note.matchAll(new RegExp(`[Cc]ambi[aá]s (?:tu |el |la )?${W}`, 'g'))) if (!last.captured) out.push(`cambiás ${m[1]}: la jugada ${last.san} no captura`)
  }
  if (/jaque/i.test(note) && !/(sin jaque|jaques|tapa|tapás|tapan|interpone|evit|no hay|todavía|ante el|del jaque)/i.test(note) && !c.inCheck()) out.push('menciona jaque: la posición no es jaque')
  if (/conectad/i.test(note)) {
    const rooks = c.board().flat().filter((p) => p && p.type === 'r' && p.color === me)
    if (rooks.length === 2 && rooks[0]!.square[1] === rooks[1]!.square[1]) {
      const rank = rooks[0]!.square[1]!
      const files = [rooks[0]!.square[0]!, rooks[1]!.square[0]!].sort()
      const blocked: string[] = []
      for (let f = files[0]!.charCodeAt(0) + 1; f < files[1]!.charCodeAt(0); f++) if (at(String.fromCharCode(f) + rank)) blocked.push(String.fromCharCode(f) + rank)
      if (blocked.length) out.push(`torres conectadas: hay piezas en ${blocked.join(', ')}`)
    } else out.push('torres conectadas: las torres no están en la misma fila')
  }
  return out
}
