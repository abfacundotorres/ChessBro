import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { GROUP_LABELS, OPENINGS, openingFamily, type OpeningGroup } from '../../content/openings'
import { db, type GameRecord } from '../../data/db'
import { openingStats, OPENING_PLIES, type OpeningStat, type StatGame } from '../../engine/openingStats'
import { REPERTOIRE } from '../../content/repertoire'
import { deepLinesOf } from '../../content/openingLines'

const GROUPS: OpeningGroup[] = ['e4-e5', 'e4-otras', 'd4', 'flanco']

/** Adapta partidas guardadas a la forma que usa el motor de estadísticas. */
export function gameStats(games: readonly GameRecord[]): StatGame[] {
  return games.map((g) => ({
    opening: g.opening,
    me: g.me,
    winner: g.winner,
    openingErrors: g.analysis ? g.analysis.summary.errors.filter((e) => e.severity !== 'inaccuracy' && e.ply < OPENING_PLIES).length : null,
  }))
}

export function Openings() {
  const [tab, setTab] = useState<'library' | 'mine'>('library')
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold">Aperturas</h1>
        <p className="text-sm text-muted">Entender de qué va cada una vale más que memorizar jugadas.</p>
      </header>
      <div className="grid grid-cols-2 gap-2" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'library'} className={tab === 'library' ? 'btn-primary' : 'btn'} onClick={() => setTab('library')}>
          Biblioteca
        </button>
        <button type="button" role="tab" aria-selected={tab === 'mine'} className={tab === 'mine' ? 'btn-primary' : 'btn'} onClick={() => setTab('mine')}>
          Tus aperturas
        </button>
      </div>
      {tab === 'library' ? <Library /> : <Mine />}
      <Link to="/repertorio" className="btn flex items-center justify-center">
        Ir al repertorio ({REPERTOIRE.length} líneas)
      </Link>
    </div>
  )
}

function Library() {
  return (
    <div className="flex flex-col gap-4">
      {GROUPS.map((g) => (
        <section key={g} className="flex flex-col gap-2">
          <h2 className="font-semibold">{GROUP_LABELS[g]}</h2>
          {OPENINGS.filter((o) => o.group === g).map((o) => (
            <Link key={o.id} to={`/aperturas/${o.id}`} className="rounded-xl bg-surface p-3 active:scale-[0.99]">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{o.name}</p>
                {deepLinesOf(o.id).length > 0 ? (
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-accent">{deepLinesOf(o.id).length} líneas a fondo</span>
                ) : (
                  o.repLines.length > 0 && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">en el repertorio</span>
                )}
              </div>
              <p className="text-xs text-muted">{o.side === 'blancas' ? 'Con blancas' : 'Con negras'}{o.trap ? ' · con trampa' : ''}</p>
            </Link>
          ))}
        </section>
      ))}
    </div>
  )
}

function nameOf(key: string): { label: string; to: string | null } {
  if (key.startsWith('raw:')) return { label: key.slice(4) || 'Sin nombre', to: null }
  const o = OPENINGS.find((x) => x.id === key)
  return { label: o?.name ?? key, to: o ? `/aperturas/${o.id}` : null }
}

/** Una fila por apertura y bando. */
export function StatsRows({ stats }: { stats: OpeningStat[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {stats.map((s) => {
        const n = nameOf(s.key)
        const body = (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-medium">
                {n.label} <span className="text-xs font-normal text-muted">· {s.me === 'w' ? 'con blancas' : 'con negras'}</span>
              </p>
              <p className="text-xs text-muted tabular-nums">{s.games} {s.games === 1 ? 'partida' : 'partidas'}</p>
            </div>
            <p className="text-xs text-muted tabular-nums">
              {s.wins} ganadas · {s.draws} tablas · {s.losses} perdidas
              {s.analyzed > 0 && ` · ${(s.errors / s.analyzed).toFixed(1)} errores en las primeras 10 jugadas`}
            </p>
          </>
        )
        return (
          <li key={`${s.key}|${s.me}`} className="rounded-xl bg-surface-2 p-3">
            {n.to ? <Link to={n.to}>{body}</Link> : body}
          </li>
        )
      })}
    </ul>
  )
}

/** Clave de agrupación: la familia conocida o, si no hay, el nombre original sin la variante. */
function keyOf(name: string | null): string {
  const fam = openingFamily(name)
  if (fam) return fam.id
  return `raw:${(name ?? 'Sin nombre').split(':')[0]!.trim()}`
}

function Mine() {
  const games = useLiveQuery(() => db.games.toArray(), [], [])
  if (games.length === 0) {
    return (
      <p className="text-muted">
        Todavía no hay partidas. <Link to="/partidas" className="underline">Importá las tuyas</Link> para ver cómo te va con cada apertura.
      </p>
    )
  }
  const stats = openingStats(gameStats(games), keyOf)
  const worst = stats.filter((s) => s.analyzed >= 2 && s.errors / s.analyzed >= 1).sort((a, b) => b.errors / b.analyzed - a.errors / a.analyzed)[0]
  const pending = games.filter((g) => !g.analysis).length
  return (
    <div className="flex flex-col gap-3">
      {worst && (
        <p className="rounded-xl border border-accent p-3 text-sm">
          Donde más errores cometés al arrancar: <strong>{nameOf(worst.key).label}</strong> {worst.me === 'w' ? 'con blancas' : 'con negras'} ({(worst.errors / worst.analyzed).toFixed(1)} por partida analizada).
        </p>
      )}
      {pending > 0 && (
        <p className="text-sm text-muted">
          {pending} {pending === 1 ? 'partida sin analizar' : 'partidas sin analizar'}: los errores por apertura salen solo de las analizadas.
        </p>
      )}
      <StatsRows stats={stats} />
    </div>
  )
}
