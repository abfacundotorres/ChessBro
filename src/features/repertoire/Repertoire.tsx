import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { REPERTOIRE } from '../../content/repertoire'
import { REP_CARDS } from '../../content/repertoireCards'
import { repStats } from '../../data/repertoire'
import { toDateStr } from '../../engine/dates'
import type { RepLine } from '../../engine/repertoire'

const COLOR_TITLE = { w: 'Con blancas: 1.e4', b: 'Con negras: 1…e5 y 1…d5' } as const

export function Repertoire() {
  const today = toDateStr(new Date())
  const stats = useLiveQuery(() => repStats(REPERTOIRE, REP_CARDS, today), [today])
  const totalDue = stats ? [...stats.values()].reduce((a, s) => a + s.due, 0) : 0
  const practiced = stats ? [...stats.values()].filter((s) => s.practiced).length : 0

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-bold">Repertorio</h1>
        <p className="text-muted">
          Pocas líneas, bien entendidas. {practiced} de {REPERTOIRE.length} practicadas.
        </p>
      </header>

      <Link
        to="/repertorio/repaso"
        className={`flex items-center justify-between rounded-xl p-4 ${totalDue > 0 ? 'bg-accent text-accent-text' : 'bg-surface'}`}
      >
        <span>
          <span className="block font-semibold">Repaso de hoy</span>
          <span className={`text-sm ${totalDue > 0 ? '' : 'text-muted'}`}>
            {totalDue > 0 ? `${totalDue} ${totalDue === 1 ? 'posición' : 'posiciones'} para repasar` : 'Nada pendiente por ahora'}
          </span>
        </span>
        <span aria-hidden="true" className="text-2xl">
          →
        </span>
      </Link>

      {(['w', 'b'] as const).map((color) => {
        const lines = REPERTOIRE.filter((l) => l.color === color)
        const groups = [...new Set(lines.map((l) => l.group))]
        return (
          <section key={color} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{COLOR_TITLE[color]}</h2>
            {groups.map((g) => (
              <div key={g} className="flex flex-col gap-2">
                <h3 className="text-sm font-medium text-muted">{g}</h3>
                {lines
                  .filter((l) => l.group === g)
                  .map((l) => (
                    <LineRow key={l.id} line={l} stats={stats?.get(l.id)} />
                  ))}
              </div>
            ))}
          </section>
        )
      })}
    </div>
  )
}

function LineRow({ line, stats }: { line: RepLine; stats: { practiced: boolean; cards: number; due: number; solid: number } | undefined }) {
  const total = REP_CARDS.filter((c) => c.lineIds.includes(line.id)).length
  return (
    <Link to={`/repertorio/${line.id}`} className="flex items-center justify-between gap-3 rounded-xl bg-surface p-3 active:scale-[0.99]">
      <div className="min-w-0">
        <p className="truncate font-semibold">{line.name}</p>
        <p className="truncate font-mono text-xs text-muted">{previewMoves(line)}</p>
      </div>
      <div className="shrink-0 text-right text-xs">
        {!stats?.practiced ? (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-muted">Nueva</span>
        ) : stats.due > 0 ? (
          <span className="rounded-full bg-accent px-2 py-0.5 text-accent-text">{stats.due} para repasar</span>
        ) : (
          <span className="text-accent">
            ✓ {stats.solid}/{total}
          </span>
        )}
      </div>
    </Link>
  )
}

/** Las primeras jugadas, para reconocer la línea de un vistazo. */
function previewMoves(line: RepLine): string {
  const out: string[] = []
  line.moves.slice(0, 6).forEach((m, i) => out.push(i % 2 === 0 ? `${i / 2 + 1}.${m}` : m))
  return out.join(' ') + (line.moves.length > 6 ? ' …' : '')
}
