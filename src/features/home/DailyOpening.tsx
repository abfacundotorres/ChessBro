import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Board } from '../../ui/Board'
import { GROUP_LABELS, type Opening } from '../../content/openings'
import { deepLinesOf } from '../../content/openingLines'
import { replay, sanLineToUci, sanToFigurine, START_FEN } from '../../engine/game'

/** La apertura del día: una tarjeta con la posición característica, la idea y el acceso al entrenamiento de 5 minutos. */
export function DailyOpening({ opening: o }: { opening: Opening }) {
  const view = useMemo(() => {
    const ucis = sanLineToUci(START_FEN, o.moves) ?? []
    return replay(START_FEN, ucis.map((u) => ({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] as 'q' | 'r' | 'b' | 'n' | undefined })))
  }, [o.moves])
  const lines = deepLinesOf(o.id).length
  const first = o.moves.map((m, k) => `${k % 2 === 0 ? `${k / 2 + 1}.` : ''}${sanToFigurine(m)}`).join(' ')

  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-surface p-4" aria-labelledby="daily-opening-title">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Apertura del día</p>
        <h2 id="daily-opening-title" className="text-xl font-bold">
          {o.name}
        </h2>
        <p className="text-sm text-muted">
          {GROUP_LABELS[o.group]} · {o.side === 'blancas' ? 'la elegís con blancas' : 'la jugás con negras'}
        </p>
      </header>

      <div className="grid grid-cols-5 items-center gap-3">
        <div className="col-span-2">
          <Board fen={view.fen} orientation={o.side === 'blancas' ? 'white' : 'black'} lastMove={view.lastMove} checkSquare={null} movableColor={null} notation={false} />
        </div>
        <div className="col-span-3 flex flex-col gap-2 text-sm">
          <p className="font-mono">{first}</p>
          <p>{o.idea}</p>
        </div>
      </div>

      {o.trap && (
        <p className="rounded-xl bg-surface-2 p-3 text-sm">
          <span className="font-semibold">Ojo con la trampa: {o.trap.name}. </span>
          {o.trap.text}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {lines > 0 ? (
          <Link to={`/aperturas/${o.id}?modo=sesion`} className="btn-primary flex items-center justify-center text-center">
            Entrenar · 5 min
          </Link>
        ) : (
          <Link to={`/aperturas/${o.id}`} className="btn-primary flex items-center justify-center text-center">
            Conocerla
          </Link>
        )}
        <Link to={`/aperturas/${o.id}`} className="btn flex items-center justify-center text-center">
          Ver todo
        </Link>
      </div>
    </section>
  )
}
