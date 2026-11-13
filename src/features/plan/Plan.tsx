import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { planSnapshot, WEEKLY_HOURS } from '../../data/plan'
import { setSetting } from '../../data/games'
import { toDateStr } from '../../engine/dates'
import { MAX_HOURS, MIN_HOURS, fitToSession, goalsFor, todayTasks, weekProgress, type Task } from '../../engine/plan'
import { StreakChip } from '../../ui/StreakChip'
import { FOCUS, MIN_GAMES, type Patterns as PatternsData } from '../../engine/patterns'
import { lessonById } from '../../content/lessons'
import { Diagnosis } from '../home/Diagnosis'
import { IconTile, iconForRoute } from '../../ui/Icon'

const HOURS = Array.from({ length: MAX_HOURS - MIN_HOURS + 1 }, (_, i) => MIN_HOURS + i)

function Details({ title, open, children }: { title: string; open?: boolean; children: ReactNode }) {
  return (
    <details open={open} className="rounded-xl bg-surface p-4">
      <summary className="cursor-pointer text-lg font-semibold">{title}</summary>
      <div className="mt-3">{children}</div>
    </details>
  )
}

/** Las tareas sugeridas para hoy (el plan según tu semana y tus errores), en filas compactas. */
export function TodayTasks() {
  const today = toDateStr(new Date())
  const snap = useLiveQuery(() => planSnapshot(today), [today])
  if (!snap) return null
  const { goals, input } = snap
  const { today: tasks, more } = fitToSession(todayTasks(input), goals.minutesPerSession)
  const minutes = tasks.reduce((a, t) => a + t.minutes, 0)

  return (
    <section className="flex flex-col gap-2" aria-labelledby="mas-hoy">
      <h2 id="mas-hoy" className="text-lg font-semibold">
        Para seguir hoy
      </h2>
      {tasks.length === 0 ? (
        <p className="rounded-xl bg-surface p-4 text-sm">
          <span className="font-semibold text-accent">¡Al día!</span> Cumpliste todo lo sugerido de esta semana. Podés jugar un rato en el tablero o repasar lo que quieras.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted">Unos {minutes} minutos si querés una sesión completa.</p>
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} />
          ))}
          {more.length > 0 && (
            <details className="rounded-xl bg-surface p-4 text-sm">
              <summary className="font-semibold">Si te queda tiempo ({more.length})</summary>
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
  )
}

/** «Tu progreso»: cómo viene la semana, tus errores, tu banda y tu semana tipo. Es lo que antes ocupaba el inicio. */
export function Progress() {
  const today = toDateStr(new Date())
  const snap = useLiveQuery(() => planSnapshot(today), [today])
  if (!snap) return null
  const { goals, input, patterns: pat } = snap
  const progress = weekProgress(goals, input.counts)

  return (
    <div className="flex flex-col gap-4">
      <header>
        <Link to="/" className="back-link">
          ← Hoy
        </Link>
        <h1 className="text-3xl font-bold">Tu progreso</h1>
        <div className="mt-1">
          <StreakChip />
        </div>
      </header>

      <Details title="Esta semana" open>
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
        <p className="mt-3 text-xs text-muted">Además, repasá lo que vence: {input.counts.repReviews} posiciones del repertorio repasadas esta semana.</p>
      </Details>

      <Details title="Tus errores">
        <Errors pat={pat} />
      </Details>

      <Details title="Tu banda">
        <Diagnosis />
      </Details>

      <Details title="Tu semana tipo">
        <p className="text-sm text-muted">¿Cuántas horas por semana podés dedicarle? Las metas se ajustan solas.</p>
        <div className="mt-2 grid grid-cols-4 gap-2" role="radiogroup" aria-label="Horas por semana">
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
        <ul className="mt-3 list-disc pl-5 text-sm">
          <li>
            {goals.sessions} sesiones de unos {goals.minutesPerSession} minutos
          </li>
          <li>
            {goalsFor(goals.hours).games} {goals.games === 1 ? 'partida lenta' : 'partidas lentas'} (15+10 o más), analizadas
          </li>
          <li>Nada de bullet: no sirve para aprender</li>
        </ul>
      </Details>
    </div>
  )
}

function Errors({ pat }: { pat: PatternsData }) {
  if (pat.games < MIN_GAMES) {
    return (
      <div className="flex flex-col gap-2 text-sm">
        <p className="text-muted">
          Analizá al menos {MIN_GAMES} partidas (tenés {pat.games}) y el plan se adapta a lo que más te cuesta.
        </p>
        <Link to="/partidas" className="btn flex items-center justify-center">
          Ir a mis partidas
        </Link>
      </div>
    )
  }
  const focus = pat.weakness ? FOCUS[pat.weakness.kind] : null
  const lesson = focus?.lessonId ? lessonById(focus.lessonId) : undefined
  const max = pat.kinds[0]?.count ?? 1
  return (
    <div className="flex flex-col gap-3 text-sm">
      <p className="text-muted">
        Últimas {pat.games} partidas analizadas: {pat.blundersPerGame.toFixed(1).replace('.', ',')} errores graves por partida.
      </p>
      {pat.kinds.length === 0 ? (
        <p>Sin errores marcados en esas partidas. Seguí así.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {pat.kinds.map((k) => (
            <li key={k.kind} className="flex items-center gap-2">
              <span className="w-36 shrink-0">{k.label}</span>
              <span className="h-2 rounded-full bg-accent" style={{ width: `${(k.count / max) * 100}%`, maxWidth: '50%' }} />
              <span className="tabular-nums text-muted">{k.count}</span>
            </li>
          ))}
        </ul>
      )}
      {pat.weakness && focus && (
        <div className="flex flex-col gap-2 rounded-xl border border-accent p-3">
          <p>
            <span className="font-semibold">Lo que más conviene entrenar: {pat.weakness.label.toLowerCase()}.</span> {focus.advice}
          </p>
          <div className="flex flex-wrap gap-2">
            {focus.theme && (
              <Link to={`/tactica?tema=${focus.theme}`} className="btn-primary flex min-h-12 items-center justify-center px-4">
                Practicar puzzles del tema
              </Link>
            )}
            {lesson && (
              <Link to={`/lecciones/${lesson.id}`} className="btn flex items-center justify-center px-4">
                Lección: {lesson.title}
              </Link>
            )}
            {focus.to && (
              <Link to={focus.to} className="btn flex items-center justify-center px-4">
                Ver mis aperturas
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function TaskRow({ task }: { task: Task }) {
  return (
    <Link to={task.to} className="flex items-center gap-3 rounded-2xl bg-surface p-3 active:scale-[0.99]">
      <IconTile name={iconForRoute(task.to)} />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{task.label}</span>
        <span className="block text-sm text-muted">{task.detail}</span>
      </span>
      <span className="shrink-0 text-xs text-muted">~{task.minutes} min</span>
    </Link>
  )
}
