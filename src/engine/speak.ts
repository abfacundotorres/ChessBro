/** Convierte texto de la app a algo que un sintetizador de voz en español lea bien (notación, símbolos, emojis). */

const PIECE: Record<string, string> = { K: 'rey', Q: 'dama', R: 'torre', B: 'alfil', N: 'caballo', A: 'alfil', C: 'caballo', T: 'torre', D: 'dama' }
const FIG: Record<string, string> = { '♔': 'rey', '♕': 'dama', '♖': 'torre', '♗': 'alfil', '♘': 'caballo', '♙': 'peón', '♚': 'rey', '♛': 'dama', '♜': 'torre', '♝': 'alfil', '♞': 'caballo', '♟': 'peón' }

export function toSpeech(text: string): string {
  let s = text
  s = s.replace(/[♔♕♖♗♘♙♚♛♜♝♞♟]/g, (c) => ` ${FIG[c]} `)
  // Enroques
  s = s.replace(/\b0-0-0\b|\bO-O-O\b/g, 'enroque largo').replace(/\b0-0\b|\bO-O\b/g, 'enroque corto')
  // Pieza (letra inglesa o española) que captura: "Axc6" / "Bxc6" → "alfil captura c6"
  s = s.replace(/\b([KQRBNACTDR])x([a-h][1-8])/g, (_m, p: string, sq: string) => ` ${PIECE[p]} captura ${sq} `)
  // Peón que captura: "exd5"
  s = s.replace(/\b([a-h])x([a-h][1-8])/g, (_m, f: string, sq: string) => ` peón ${f} captura ${sq} `)
  // Pieza + casilla: "Cf3", "Bb5"
  s = s.replace(/\b([KQRBNACTDR])([a-h][1-8])\b/g, (_m, p: string, sq: string) => ` ${PIECE[p]} ${sq} `)
  // Numeración "1." o "3…" antes de una jugada
  s = s.replace(/\b(\d+)(\.{1,3}|…)\s*(?=[a-h][1-8]|\s*(?:peón|alfil|caballo|torre|dama|rey|enroque))/g, 'jugada $1, ')
  s = s.replace(/\?\?/g, ' error grave ').replace(/\?!/g, ' imprecisión ').replace(/!!/g, ' jugadón ')
  s = s.replace(/#/g, ' mate ').replace(/\+(?=\s|$|[.,;:)])/g, ' jaque ')
  s = s.replace(/[…·→★•]/g, ', ').replace(/\p{Extended_Pictographic}|️/gu, '').replace(/[*_`~]/g, '')
  return s.replace(/\s+([,.;:])/g, '$1').replace(/\s+/g, ' ').trim()
}
