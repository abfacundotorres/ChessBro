import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { planSnapshot, WEEKLY_HOURS } from '../../data/plan'
import { setSetting } from '../../data/games'
import { toDateStr } from '../../engine/dates'
import { MAX_HOURS, MIN_HOURS, fitToSession, goalsFor, todayTasks, weekProgress, type Task } from '../../engine/plan'
import { StreakChip } from '../../ui/StreakChip'

const HOURS = Array.from({ length: MAX_HOURS - MIN_HOURS + 1 }, (_, i) => MIN_HOURS + i)

export function Plan() {
  const today = toDateStr(new Date())
  const snap = useLiveQuery(() => planSnapshot(today), [today])
  if (!snap) return null
  const { goals, input } = snap
  const { today: tasks, more } = fitToSession(todayTasks(input), goals.minutesPerSession)
  const progress = weekProgress(goals, input.counts)
  const minutes = tasks.reduce((a, t) => a + t.minutes, 0)

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-bold">Plan</h1>
        <p className="text-muted">Una guía para estudiar con orden. Nada se bloquea si no la cumplís.</p>
        <div className="mt-2">
          <StreakChip />
        </div>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Hoy</h2>
        {tasks.length === 0 ? (
          <p className="rounded-xl bg-surface p-4 text-sm">
            <span className="font-semibold text-accent">¡Al día!</span> Cumpliste todo lo sugerido de esta semana. Podés jugar un rato en el tablero o repasar lo que quieras.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted">Unos {minutes} minutos: una sesión.</p>
            {tasks.map((t, i) => (
              <TaskRow key={t.id} task={t} index={i + 1} />
            ))}
            {more.length > 0 && (
              <details className="rounded-xl bg-surface p-4 text-sm">
                <summary className="cursor-pointer font-semibold">Si te queda tiempo ({more.length})</summary>
                <div className="mt-2 flex flex-col gap-2">
                  {more.map((t) => (
                    <TaskRow key={t.id} task={t} />
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-xl bg-surface p-4">
        <h2 className="text-lg font-semibold">Esta semana</h2>
        <ul className="flex flex-col gap-3">
          {progress.map((p) => (
            <li key={p.key}>
              <div className="flex justify-between text-sm">
                <span>{p.label}</span>
                <span className="tabular-nums text-muted">
                  {p.done}/{p.goal}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={Math.min(p.done, p.goal)} aria-valuemax={p.goal} aria-label={p.label}>
                <div className={`h-full ${p.done >= p.goal ? 'bg-accent' : 'bg-accent/60'}`} style={{ width: `${Math.min(100, (p.done / p.goal) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted">Además, repasá lo que vence: {input.counts.repReviews} posiciones del repertorio repasadas esta semana.</p>
      </section>

      <section className="flex flex-col gap-2 rounded-xl bg-surface p-4">
        <h2 className="text-lg font-semibold">Tu semana tipo</h2>
        <p className="text-sm text-muted">¿Cuántas horas por semana podés dedicarle? Las metas se ajustan solas.</p>
        <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Horas por semana">
          {HOURS.map((h) => (
            <button
              key={h}
              type="button"
              role="radio"
              aria-checked={goals.hours === h}
              className={goals.hours === h ? 'btn-primary' : 'btn'}
              onClick={() => void setSetting(WEEKLY_HOURS, String(h))}
            >
              {h} h
            </button>
          ))}
        </div>
        <ul className="mt-1 list-disc pl-5 text-sm">
          <li>
            {goals.sessions} sesiones de unos {goals.minutesPerSession} minutos
          </li>
          <li>
            {goalsFor(goals.hours).games} {goals.games === 1 ? 'partida lenta' : 'partidas lentas'} (15+10 o más), analizadas
          </li>
          <li>Nada de bullet: no sirve para aprender</li>
        </ul>
      </section>
    </div>
  )
}

function TaskRow({ task, index }: { task: Task; index?: number }) {
  return (
    <Link to={task.to} className="flex items-center gap-3 rounded-xl bg-surface-2 p-3 active:scale-[0.99]">
      {index !== undefined && <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-semibold">{index}</span>}
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{task.label}</span>
        <span className="block text-sm text-muted">{task.detail}</span>
      </span>
      <span className="shrink-0 text-xs text-muted">~{task.minutes} min</span>
    </Link>
  )
}
