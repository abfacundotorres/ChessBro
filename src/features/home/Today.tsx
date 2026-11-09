import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { planSnapshot } from '../../data/plan'
import { toDateStr } from '../../engine/dates'
import { fitToSession, todayTasks } from '../../engine/plan'

/** Las tareas más importantes de hoy, con acceso al plan completo. */
export function Today() {
  const today = toDateStr(new Date())
  const snap = useLiveQuery(() => planSnapshot(today), [today])
  if (!snap) return null
  const first = fitToSession(todayTasks(snap.input), snap.goals.minutesPerSession).today.slice(0, 3)
  return (
    <section className="flex flex-col gap-2 rounded-xl bg-surface p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Para hoy</h2>
        <Link to="/plan" className="text-sm text-accent underline">
          Ver el plan
        </Link>
      </div>
      {first.length === 0 ? (
        <p className="text-sm text-muted">
          <span className="font-semibold text-accent">¡Al día!</span> Cumpliste lo sugerido de la semana.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {first.map((t) => (
            <li key={t.id}>
              <Link to={t.to} className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-2 active:scale-[0.99]">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{t.label}</span>
                  <span className="block truncate text-xs text-muted">{t.detail}</span>
                </span>
                <span className="shrink-0 text-xs text-muted">~{t.minutes} min</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
