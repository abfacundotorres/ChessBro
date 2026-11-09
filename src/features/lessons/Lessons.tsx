import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { BANDS } from '../../content/curriculum'
import { ENDGAMES } from '../../content/endgames'
import { LESSONS } from '../../content/lessons'
import { styledLesson } from '../../content/styled'
import { useStyle } from '../../data/style'
import { endgameStats, getProgress } from '../../data/lessons'
import { StreakChip } from '../../ui/StreakChip'

export function Lessons() {
  const progress = useLiveQuery(() => getProgress(), [])
  const stats = useLiveQuery(() => endgameStats(), [])
  const style = useStyle()

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-bold">Lecciones</h1>
        <p className="text-muted">{style === 'serio' ? 'Leé, practicá y avanzá a la siguiente.' : 'Leé, adiviná, practicá y ganá estrellas.'}</p>
        <div className="mt-2">
          <StreakChip />
        </div>
      </header>

      {BANDS.map((band) => {
        const bid = band.id
        if (!LESSONS.some((l) => l.band === bid)) return null
        return (
          <section key={bid} className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Elo {band.range}</h2>
            {LESSONS.filter((l) => l.band === bid).map((base) => {
              const l = styledLesson(base, style)
              const p = progress?.get(l.id)
              const done = p?.doneAt !== undefined
              const solved = p?.exercises.length ?? 0
              return (
                <Link key={l.id} to={`/lecciones/${l.id}`} className="flex items-center justify-between gap-3 rounded-xl bg-surface p-4 active:scale-[0.99]">
                  <div className="min-w-0">
                    <p className="font-semibold">{l.title}</p>
                    <p className="text-sm text-muted">{l.summary}</p>
                  </div>
                  <span className={`shrink-0 text-right text-sm tabular-nums ${done ? 'text-accent' : 'text-muted'}`}>
                    {style === 'juego' && p?.stars ? (
                      <span aria-label={`${p.stars} de 3 estrellas`}>
                        {'★'.repeat(p.stars)}
                        <span className="text-border">{'★'.repeat(3 - p.stars)}</span>
                      </span>
                    ) : done ? (
                      '✓'
                    ) : l.exercises.length > 0 ? (
                      `${solved}/${l.exercises.length}`
                    ) : (
                      ''
                    )}
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
                {e.goal !== 'hold' && s?.bestClean != null && <span className="block">mejor {s.bestClean}</span>}
              </span>
            </Link>
          )
        })}
      </section>
    </div>
  )
}
