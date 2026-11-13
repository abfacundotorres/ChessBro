import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DailyPuzzle, themeKeysOf, themeLabel } from './DailyPuzzle'
import { DailyOpening } from './DailyOpening'
import { TodayTasks } from '../plan/Plan'
import { Mascot, type Mood } from '../../ui/Mascot'
import { Icon } from '../../ui/Icon'
import { StreakChip } from '../../ui/StreakChip'
import { OPENINGS, openingById } from '../../content/openings'
import { deepLinesOf } from '../../content/openingLines'
import { getDaily, type DailyState } from '../../data/daily'
import { dailyOpeningId, greetingFor } from '../../engine/daily'
import { toDateStr } from '../../engine/dates'

/** Aperturas con líneas a fondo: las únicas que sirven para «apertura del día» (las genéricas no tienen nada para entrenar). */
const DAILY_OPENING_IDS = OPENINGS.filter((o) => deepLinesOf(o.id).length > 0).map((o) => o.id)

/** «Hoy»: te recibe el puzzle del día y la apertura del día. Lo de la semana y los errores vive en «Tu progreso». */
export function Home() {
  const today = toDateStr(new Date())
  const [daily, setDaily] = useState<DailyState | null | 'cargando'>('cargando')
  const [error, setError] = useState(false)

  useEffect(() => {
    let vivo = true
    getDaily(today)
      .then((d) => vivo && setDaily(d))
      .catch((e) => {
        console.error(e)
        if (vivo) setError(true)
      })
    return () => {
      vivo = false
    }
  }, [today])

  const opening = openingById(dailyOpeningId(DAILY_OPENING_IDS, today) ?? '')
  const puzzle = daily && daily !== 'cargando' ? daily : null
  const hora = new Date().getHours()
  const fecha = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

  const mood: Mood = puzzle?.outcome === 'solved' ? 'sorprendido' : puzzle?.outcome === 'failed' ? 'pensando' : 'contento'
  const tema = puzzle && puzzle.outcome === null ? themeKeysOf(puzzle.puzzle.themes)[0] : undefined
  const frase =
    puzzle?.outcome === 'solved'
      ? '¡Qué bien! El puzzle de hoy ya es tuyo.'
      : puzzle?.outcome === 'failed'
        ? 'Hoy costó, pero así se aprende. Mañana hay otro.'
        : tema
          ? `Te dejé un puzzle de ${themeLabel(tema).toLowerCase()}. ¿Lo encontrás?`
          : 'Te dejé un puzzle para hoy. ¿Lo encontrás?'

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted first-letter:uppercase">{fecha}</p>
          <h1 className="text-3xl font-bold">Hoy</h1>
        </div>
        <Link to="/progreso" aria-label="Tu progreso" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface text-accent">
          <Icon name="progreso" size={22} />
        </Link>
      </header>

      <div className="flex items-end gap-3">
        <Mascot mood={mood} />
        <div className="relative mb-2 flex-1 rounded-2xl rounded-bl-sm bg-surface p-3 text-[15px] leading-snug">
          <p>
            <span className="font-semibold">{greetingFor(hora)}</span> {opening ? `${frase} Y de paso, conocé la ${opening.name}.` : frase}
          </p>
        </div>
      </div>
      <StreakChip />

      {daily === 'cargando' && !error && <p className="rounded-3xl bg-surface p-8 text-center text-muted">Preparando tu puzzle…</p>}
      {error && <p className="rounded-3xl bg-surface p-6 text-center">No se pudo cargar el puzzle de hoy. Podés probar desde <Link to="/tactica" className="underline">Táctica</Link>.</p>}
      {daily === null && !error && <p className="rounded-3xl bg-surface p-6 text-center">No encontré un puzzle para hoy. Probá desde <Link to="/tactica" className="underline">Táctica</Link>.</p>}
      {puzzle && <DailyPuzzle key={puzzle.puzzle.id} daily={puzzle} onOutcome={(o) => setDaily((d) => (d && d !== 'cargando' ? { ...d, outcome: o } : d))} />}

      {opening && <DailyOpening opening={opening} />}

      <TodayTasks />
    </div>
  )
}
