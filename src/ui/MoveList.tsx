import { pairMoves, sanToFigurine, type PlayedMove } from '../engine/game'

export function MoveList({ startFen, moves }: { startFen: string; moves: readonly PlayedMove[] }) {
  if (moves.length === 0) return <p className="text-center text-sm text-muted">Todavía no hay jugadas.</p>
  return (
    <ol className="grid grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-1 rounded-xl bg-surface p-3 font-mono text-sm">
      {pairMoves(startFen, moves).map((p) => (
        <li key={p.number} className="contents">
          <span className="text-muted">{p.number}.</span>
          <span>{p.white ? sanToFigurine(p.white.san) : '…'}</span>
          <span>{p.black ? sanToFigurine(p.black.san) : ''}</span>
        </li>
      ))}
    </ol>
  )
}
