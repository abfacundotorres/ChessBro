import type { Color, GameView } from './game'

/**
 * Final jugable contra el motor. El usuario juega `user`; el motor, el otro bando.
 * - 'mate': hay que dar jaque mate en `maxMoves` jugadas propias como máximo.
 * - 'hold': hay que salvar las tablas; se logra con una tabla (ahogado, material
 *   insuficiente, repetición, 50 jugadas) o aguantando `maxMoves` jugadas propias.
 */
export interface EndgameDef {
  id: string
  title: string
  summary: string
  fen: string
  user: Color
  goal: 'mate' | 'hold'
  maxMoves: number
  tips: string[]
}

export type EndgameState = 'playing' | 'won' | 'lost'

export interface EndgameVerdict {
  state: EndgameState
  /** Texto corto para mostrar. */
  message: string
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
  if (userMoves >= def.maxMoves) {
    return def.goal === 'hold'
      ? { state: 'won', message: `Aguantaste ${def.maxMoves} jugadas: tablas.` }
      : { state: 'lost', message: `Se acabaron las ${def.maxMoves} jugadas.` }
  }
  return { state: 'playing', message: '' }
}
