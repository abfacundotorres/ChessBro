import { useMemo, useState } from 'react'
import { Board } from '../../ui/Board'
import { MoveList } from '../../ui/MoveList'
import { START_FEN, replay, tryMove, type GameStatus, type MoveInput } from '../../engine/game'

function statusText(s: GameStatus, turn: 'w' | 'b'): string {
  switch (s.kind) {
    case 'checkmate':
      return `Jaque mate. Ganan ${s.winner === 'w' ? 'blancas' : 'negras'}.`
    case 'stalemate':
      return 'Ahogado: tablas.'
    case 'draw':
      return {
        insufficient: 'Tablas por material insuficiente.',
        threefold: 'Tablas por triple repetición.',
        'fifty-moves': 'Tablas por la regla de 50 jugadas.',
      }[s.reason]
    case 'playing':
      return `Juegan ${turn === 'w' ? 'blancas' : 'negras'}.`
  }
}

/** Tablero libre: mover ambos bandos, deshacer, girar. Sirve para probar ideas. */
export function FreeBoard() {
  const [moves, setMoves] = useState<MoveInput[]>([])
  const [flipped, setFlipped] = useState(false)
  const game = useMemo(() => replay(START_FEN, moves), [moves])
  const over = game.status.kind !== 'playing'

  function onMove(m: MoveInput): boolean {
    if (over || !tryMove(game.fen, m)) return false
    setMoves((prev) => [...prev, m])
    return true
  }

  return (
    <div className="flex flex-col gap-3">
      <header>
        <h1 className="text-2xl font-bold">Tablero libre</h1>
        <p className="text-sm text-muted">Mové las piezas de los dos bandos y probá ideas.</p>
      </header>
      <Board
        fen={game.fen}
        orientation={flipped ? 'black' : 'white'}
        lastMove={game.lastMove}
        checkSquare={game.checkSquare}
        movableColor={over ? null : 'both'}
        onMove={onMove}
      />
      <p className="text-center text-sm text-muted" aria-live="polite">
        {statusText(game.status, game.turn)}
      </p>
      <div className="grid grid-cols-3 gap-2">
        <button type="button" className="btn" disabled={moves.length === 0} onClick={() => setMoves((p) => p.slice(0, -1))}>
          Deshacer
        </button>
        <button type="button" className="btn" onClick={() => setFlipped((f) => !f)}>
          Girar
        </button>
        <button type="button" className="btn" disabled={moves.length === 0} onClick={() => setMoves([])}>
          Reiniciar
        </button>
      </div>
      <MoveList startFen={START_FEN} moves={game.moves} />
    </div>
  )
}
