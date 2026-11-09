import { useLiveQuery } from 'dexie-react-hooks'
import { currentStreak } from '../data/activity'
import { toDateStr } from '../engine/dates'
import { useStyle } from '../data/style'

export function StreakChip() {
  const s = useLiveQuery(() => currentStreak(toDateStr(new Date())), [])
  const style = useStyle()
  if (!s || style === 'serio') return null // el estilo serio no muestra rachas (se siguen registrando)
  const days = (n: number) => `${n} ${n === 1 ? 'día' : 'días'}`
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-sm" title={`Mejor racha: ${days(s.best)}`}>
      <span aria-hidden="true">{s.current > 0 ? '🔥' : '🌱'}</span>
      <span>
        {s.current > 0 ? (
          <>
            <span className="font-semibold">{days(s.current)}</span>
            {!s.activeToday && <span className="text-muted"> · practicá hoy para sumar</span>}
          </>
        ) : (
          <span className="text-muted">Practicá hoy y empezá una racha</span>
        )}
      </span>
    </div>
  )
}
