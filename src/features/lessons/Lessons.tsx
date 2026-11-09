import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { BANDS } from '../../content/curriculum'
import { ENDGAMES } from '../../content/endgames'
import { LESSONS } from '../../content/lessons'
import { endgameStats, getProgress } from '../../data/lessons'

export function Lessons() {
  const progress = useLiveQuery(() => getProgress(), [])
  const stats = useLiveQuery(() => endgameStats(), [])

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-bold">Lecciones</h1>
        <p className="text-muted">Leé, practicá y pasá a la siguiente.</p>
      </header>

      {(['b1', 'b2'] as const).map((bid) => {
        const band = BANDS.find((b) => b.id === bid)
        return (
          <section key={bid} className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Elo {band?.range}</h2>
            {LESSONS.filter((l) => l.band === bid).map((l) => {
              const p = progress?.get(l.id)
              const done = p?.doneAt !== undefined
              const solved = p?.exercises.length ?? 0
              return (
                <Link key={l.id} to={`/lecciones/${l.id}`} className="flex items-center justify-between gap-3 rounded-xl bg-surface p-4 active:scale-[0.99]">
                  <div className="min-w-0">
                    <p className="font-semibold">{l.title}</p>
                    <p className="text-sm text-muted">{l.summary}</p>
                  </div>
                  <span className={`shrink-0 text-sm tabular-nums ${done ? 'text-accent' : 'text-muted'}`}>
                    {done ? '✓' : l.exercises.length > 0 ? `${solved}/${l.exercises.length}` : ''}
                  </span>
                </Link>
              )
            })}
          </section>
        )
      })}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Finales para jugar</h2>
        <p className="text-sm text-muted">Contra el motor. Podés pedir pista, pero entonces no cuenta para tu progreso.</p>
        {ENDGAMES.map((e) => {
          const s = stats?.get(e.id)
          return (
            <Link key={e.id} to={`/finales/${e.id}`} className="flex items-center justify-between gap-3 rounded-xl bg-surface p-4 active:scale-[0.99]">
              <div className="min-w-0">
                <p className="font-semibold">{e.title}</p>
                <p className="text-sm text-muted">{e.summary}</p>
              </div>
              <span className="shrink-0 text-right text-xs text-muted">
                {s ? `${s.wins}/${s.attempts}` : ''}
                {e.goal === 'mate' && s?.bestClean != null && <span className="block">mejor {s.bestClean}</span>}
              </span>
            </Link>
          )
        })}
      </section>
    </div>
  )
}
