import type { Color, GameView } from './game'

/**
 * Final jugable contra el motor. El usuario juega `user`; el motor, el otro bando.
 * - 'mate': hay que dar jaque mate en `maxMoves` jugadas propias como máximo.
 * - 'hold': hay que salvar las tablas; se logra con una tabla (ahogado, material
 *   insuficiente, repetición, 50 jugadas) o aguantando `maxMoves` jugadas propias.
 * - 'promote': hay que coronar el peón y conservar la dama después de la respuesta del rival,
 *   en `maxMoves` jugadas propias como máximo (por ejemplo, la posición de Lucena).
 */
export interface EndgameDef {
  id: string
  title: string
  summary: string
  fen: string
  user: Color
  goal: 'mate' | 'hold' | 'promote'
  maxMoves: number
  tips: string[]
}

export type EndgameState = 'playing' | 'won' | 'lost'

export interface EndgameVerdict {
  state: EndgameState
  /** Texto corto para mostrar. */
  message: string
}

const rank = (fen: string) => fen.split(' ')[0]!

function count(fen: string, piece: string): number {
  return [...rank(fen)].filter((c) => c === piece).length
}

/** Juzga el estado de un final. `userMoves` = jugadas del usuario hechas hasta ahora. */
export function judgeEndgame(def: EndgameDef, view: GameView, userMoves: number): EndgameVerdict {
  const s = view.status
  if (s.kind === 'checkmate') {
    return s.winner === def.user
      ? { state: 'won', message: '¡Jaque mate!' }
      : { state: 'lost', message: 'Te dieron mate.' }
  }
  if (s.kind === 'stalemate' || s.kind === 'draw') {
    const why = s.kind === 'stalemate' ? 'Ahogado' : 'Tablas'
    return def.goal === 'hold'
      ? { state: 'won', message: `${why}: salvaste la partida.` }
      : { state: 'lost', message: `${why}. Había que dar mate.` }
  }
  if (def.goal === 'promote') {
    const queen = def.user === 'w' ? 'Q' : 'q'
    const pawn = def.user === 'w' ? 'P' : 'p'
    // Con la dama en el tablero después de la respuesta del rival, el peón ya coronó.
    if (view.turn === def.user && count(view.fen, queen) > 0) return { state: 'won', message: '¡Coronaste! La posición está ganada.' }
    if (count(view.fen, queen) === 0 && count(view.fen, pawn) === 0) return { state: 'lost', message: 'Perdiste el peón.' }
  }
  if (userMoves >= def.maxMoves) {
    return def.goal === 'hold'
      ? { state: 'won', message: `Aguantaste ${def.maxMoves} jugadas: tablas.` }
      : { state: 'lost', message: `Se acabaron las ${def.maxMoves} jugadas.` }
  }
  return { state: 'playing', message: '' }
}
