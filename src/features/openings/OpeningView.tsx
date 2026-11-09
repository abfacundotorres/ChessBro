import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Board } from '../../ui/Board'
import { MoveList } from '../../ui/MoveList'
import { GROUP_LABELS, openingById, openingFamily, type Opening } from '../../content/openings'
import { repLineById } from '../../content/repertoire'
import { db } from '../../data/db'
import { replay, sanLineToUci, sanToFigurine, START_FEN } from '../../engine/game'
import { openingStats } from '../../engine/openingStats'
import { gameStats, StatsRows } from './Openings'
import { Speak } from '../../ui/Speak'

export function OpeningView() {
  const { id = '' } = useParams()
  const o = openingById(id)
  if (!o) {
    return (
      <p>
        No encontré esa apertura. <Link to="/aperturas" className="underline">Volver</Link>
      </p>
    )
  }
  return <Body key={o.id} o={o} />
}

/** Tablero con avance jugada por jugada. */
function Stepper({ moves, orientation }: { moves: string[]; orientation: 'white' | 'black' }) {
  const [i, setI] = useState(moves.length)
  const ucis = useMemo(() => sanLineToUci(START_FEN, moves) ?? [], [moves])
  const view = useMemo(
    () => replay(START_FEN, ucis.slice(0, i).map((u) => ({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] as 'q' | 'r' | 'b' | 'n' | undefined }))),
    [ucis, i],
  )
  return (
    <div className="flex flex-col gap-3">
      <Board fen={view.fen} orientation={orientation} lastMove={view.lastMove} checkSquare={view.checkSquare} movableColor={null} />
      <div className="grid grid-cols-4 gap-2">
        <button type="button" className="btn" aria-label="Inicio" disabled={i === 0} onClick={() => setI(0)}>
          ⏮
        </button>
        <button type="button" className="btn" aria-label="Anterior" disabled={i === 0} onClick={() => setI(i - 1)}>
          ◀
        </button>
        <button type="button" className="btn" aria-label="Siguiente" disabled={i === moves.length} onClick={() => setI(i + 1)}>
          ▶
        </button>
        <button type="button" className="btn" aria-label="Final" disabled={i === moves.length} onClick={() => setI(moves.length)}>
          ⏭
        </button>
      </div>
      <MoveList startFen={START_FEN} moves={view.moves} />
    </div>
  )
}

function Body({ o }: { o: Opening }) {
  const games = useLiveQuery(() => db.games.toArray(), [], [])
  const mine = openingStats(
    gameStats(games.filter((g) => openingFamily(g.opening)?.id === o.id)),
    () => o.id,
  )
  const lines = o.repLines.map((id) => repLineById(id)).filter((l) => l !== undefined)
  return (
    <div className="flex flex-col gap-3">
      <header>
        <Link to="/aperturas" className="text-sm text-muted">
          ← Aperturas
        </Link>
        <h1 className="text-xl font-bold">{o.name}</h1>
        <p className="text-sm text-muted">
          {GROUP_LABELS[o.group]} · {o.side === 'blancas' ? 'la elegís con blancas' : 'la jugás con negras'}
        </p>
        <p className="mt-1 font-mono text-sm">{o.moves.map((m, k) => `${k % 2 === 0 ? `${k / 2 + 1}.` : ''}${sanToFigurine(m)}`).join(' ')}</p>
      </header>

      <div className="rounded-xl bg-surface p-4">
        <p className="font-semibold">La idea</p>
        <p className="mt-1">{o.idea}</p>
        <Speak className="mt-2" text={`${o.name}. ${o.idea} Planes: ${o.plans.join('. ')}. Errores típicos: ${o.mistakes.join('. ')}.`} />
      </div>

      <Stepper moves={o.moves} orientation={o.side === 'negras' ? 'black' : 'white'} />

      <div className="rounded-xl bg-surface p-4 text-sm">
        <p className="font-semibold">Planes</p>
        <ul className="mt-1 list-disc pl-5">
          {o.plans.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl bg-surface p-4 text-sm">
        <p className="font-semibold">Errores típicos</p>
        <ul className="mt-1 list-disc pl-5">
          {o.mistakes.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>

      {o.trap && (
        <section className="flex flex-col gap-2 rounded-xl border border-accent p-4 text-sm">
          <p className="font-semibold">Trampa: {o.trap.name}</p>
          <p>{o.trap.text}</p>
          <Stepper moves={o.trap.moves} orientation={o.side === 'negras' ? 'black' : 'white'} />
        </section>
      )}

      {lines.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-semibold">Para memorizar (repertorio)</h2>
          {lines.map((l) => (
            <Link key={l.id} to={`/repertorio/${l.id}`} className="rounded-xl bg-surface p-3 active:scale-[0.99]">
              <p className="font-medium">{l.name}</p>
              <p className="text-xs text-muted">{l.group}</p>
            </Link>
          ))}
        </section>
      )}

      {mine.length > 0 && (
        <section className="flex flex-col gap-2 rounded-xl bg-surface p-4 text-sm">
          <h2 className="font-semibold">En tus partidas</h2>
          <StatsRows stats={mine} />
        </section>
      )}
    </div>
  )
}
