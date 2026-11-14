import { useMemo, useState } from 'react'
import { Board } from '../../ui/Board'
import { MoveList } from '../../ui/MoveList'
import { Speak } from '../../ui/Speak'
import type { ModelGame } from '../../content/deep/kit'
import { START_FEN, replay, sanLineToUci, sanToFigurine } from '../../engine/game'
import { uciToMove } from '../../engine/puzzle'

/** Partidas de ejemplo de una apertura: si hay más de una, un selector arriba. */
export function ModelGameView({ games }: { games: ModelGame[] }) {
  const [idx, setIdx] = useState(0)
  const game = games[Math.min(idx, games.length - 1)]!
  return (
    <div className="flex flex-col gap-3">
      {games.length > 1 && (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${games.length}, minmax(0, 1fr))` }} role="tablist" aria-label="Partidas de ejemplo">
          {games.map((g, k) => (
            <button key={g.title} type="button" role="tab" aria-selected={k === idx} className={k === idx ? 'btn-primary' : 'btn'} onClick={() => setIdx(k)}>
              Partida {k + 1}
            </button>
          ))}
        </div>
      )}
      <Game key={game.title} game={game} />
    </div>
  )
}

/** Una partida de ejemplo (ilustrativa), jugada por jugada, con comentarios en los momentos clave. */
function Game({ game }: { game: ModelGame }) {
  const [i, setI] = useState(0)
  const ucis = useMemo(() => sanLineToUci(START_FEN, game.moves) ?? [], [game])
  const view = useMemo(() => replay(START_FEN, ucis.slice(0, i).map(uciToMove)), [ucis, i])
  const keyPlies = useMemo(() => Object.keys(game.notes).map(Number).sort((a, b) => a - b), [game])
  const note = i > 0 ? game.notes[i - 1] : undefined
  const nextKey = keyPlies.find((p) => p + 1 > i)
  const cur = i > 0 ? game.moves[i - 1]! : null
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="font-semibold">{game.title}</p>
        <p className="text-sm text-muted">
          {game.engine
            ? 'Partida de ejemplo: Stockfish jugó las dos partes desde una línea de la apertura. No es una partida real.'
            : 'Partida de ejemplo, armada para estudiar: no es una partida real.'}
        </p>
      </div>
      <Board fen={view.fen} orientation={game.color === 'w' ? 'white' : 'black'} lastMove={view.lastMove} checkSquare={view.checkSquare} movableColor={null} />
      <p className="min-h-6 text-center text-sm">
        {cur ? (
          <span className="font-mono font-semibold">
            {Math.ceil(i / 2)}
            {i % 2 ? '.' : '…'} {sanToFigurine(cur)}
          </span>
        ) : (
          <span className="text-muted">Posición inicial</span>
        )}
      </p>
      {note && (
        <div className="flex items-start gap-2 rounded-xl border border-accent p-3 text-sm" aria-live="polite">
          <p className="min-w-0 flex-1">{note}</p>
          <Speak text={note} auto className="shrink-0" />
        </div>
      )}
      <div className="grid grid-cols-4 gap-2">
        <button type="button" className="btn" aria-label="Inicio" disabled={i === 0} onClick={() => setI(0)}>
          ⏮
        </button>
        <button type="button" className="btn" aria-label="Anterior" disabled={i === 0} onClick={() => setI(i - 1)}>
          ◀
        </button>
        <button type="button" className="btn" aria-label="Siguiente" disabled={i === game.moves.length} onClick={() => setI(i + 1)}>
          ▶
        </button>
        <button type="button" className="btn" aria-label="Final" disabled={i === game.moves.length} onClick={() => setI(game.moves.length)}>
          ⏭
        </button>
      </div>
      <button type="button" className="btn" disabled={nextKey === undefined} onClick={() => nextKey !== undefined && setI(nextKey + 1)}>
        Próximo momento clave
      </button>
      {i === game.moves.length && <p className="rounded-xl bg-surface p-3 text-sm">{game.summary}</p>}
      <MoveList startFen={START_FEN} moves={view.moves} />
    </div>
  )
}
