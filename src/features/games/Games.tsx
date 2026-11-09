import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type GameRecord } from '../../data/db'
import { LICHESS_USER, getSetting, saveImported, setSetting, summarize } from '../../data/games'
import { USERNAME_RE, fetchLichessGames } from '../../data/lichess'
import { KIND_LABELS, KIND_TRAINING, type ErrorKind } from '../../engine/analysis'
import { formatDayMonth, toDateStr } from '../../engine/dates'

export function resultText(g: GameRecord): { text: string; tone: 'win' | 'loss' | 'draw' } {
  if (!g.winner) return { text: 'Tablas', tone: 'draw' }
  const won = (g.winner === 'white') === (g.me === 'w')
  return won ? { text: 'Ganaste', tone: 'win' } : { text: 'Perdiste', tone: 'loss' }
}

const SPEED: Record<string, string> = { blitz: 'Blitz', rapid: 'Rápida', classical: 'Clásica', correspondence: 'Por correspondencia' }

export function Games() {
  const user = useLiveQuery(() => getSetting(LICHESS_USER), [], undefined)
  const games = useLiveQuery(() => db.games.orderBy('createdAt').reverse().toArray(), [], [])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function onImport(username: string) {
    setBusy(true)
    setMsg(null)
    try {
      const list = await fetchLichessGames(username, 20)
      const fresh = await saveImported(list)
      setMsg(list.length === 0 ? 'No encontré partidas blitz, rápidas o clásicas.' : fresh === 0 ? 'No hay partidas nuevas.' : fresh === 1 ? '1 partida nueva.' : `${fresh} partidas nuevas.`)
    } catch (e) {
      setMsg(e instanceof Error && e.name !== 'TypeError' ? e.message : 'Sin conexión con Lichess. Probá más tarde.')
    } finally {
      setBusy(false)
    }
  }

  if (user === undefined) return null

  if (user === null) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Tus partidas</h1>
        <p className="text-muted">
          Traé tus partidas de Lichess. El análisis corre en tu teléfono y tus errores tácticos se convierten en ejercicios.
        </p>
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const u = draft.trim()
            if (!USERNAME_RE.test(u)) {
              setMsg('Ese usuario no parece válido.')
              return
            }
            void setSetting(LICHESS_USER, u).then(() => onImport(u))
          }}
        >
          <label className="text-sm font-medium" htmlFor="lichess-user">
            Usuario de Lichess
          </label>
          <input
            id="lichess-user"
            className="min-h-12 rounded-xl border border-border bg-surface px-3"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={busy || draft.trim() === ''}>
            Guardar y traer partidas
          </button>
        </form>
        {msg && <p aria-live="polite">{msg}</p>}
      </div>
    )
  }

  const summary = summarize(games)
  const topKinds = summary
    ? (Object.entries(summary.kinds) as [ErrorKind, number][]).sort((a, b) => b[1] - a[1])
    : []
  const train = topKinds.map(([k]) => KIND_TRAINING[k]).find((k) => k !== null)

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Tus partidas</h1>
          <p className="text-sm text-muted">Lichess: {user}</p>
        </div>
        <button type="button" className="btn" disabled={busy} onClick={() => void onImport(user)}>
          {busy ? 'Trayendo…' : 'Traer nuevas'}
        </button>
      </header>
      {msg && <p aria-live="polite">{msg}</p>}

      {summary && (
        <section className="flex flex-col gap-2 rounded-xl bg-surface p-4 text-sm">
          <p className="font-semibold">Últimas {summary.analyzed} analizadas</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat value={summary.blundersPerGame.toFixed(1)} label="graves por partida" />
            <Stat value={summary.mistakesPerGame.toFixed(1)} label="errores por partida" />
            <Stat value={`${summary.accuracy}%`} label="precisión" />
          </div>
          {topKinds.length > 0 && (
            <ul className="flex flex-col gap-1">
              {topKinds.map(([k, v]) => (
                <li key={k} className="flex items-center gap-2">
                  <span className="w-40 shrink-0">{KIND_LABELS[k]}</span>
                  <span className="h-2 rounded-full bg-accent" style={{ width: `${(v / topKinds[0]![1]) * 100}%`, maxWidth: '50%' }} />
                  <span className="text-muted tabular-nums">{v}</span>
                </li>
              ))}
            </ul>
          )}
          {train && (
            <Link to={`/tactica?tema=${train}`} className="btn-primary flex items-center justify-center">
              Entrenar lo que más te cuesta
            </Link>
          )}
        </section>
      )}

      {games.length === 0 ? (
        <p className="text-muted">Todavía no hay partidas importadas.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {games.map((g) => {
            const r = resultText(g)
            const rival = g.me === 'w' ? g.black : g.white
            const a = g.analysis?.summary
            return (
              <li key={g.id}>
                <Link to={`/partidas/${g.id}`} className="flex items-center justify-between gap-3 rounded-xl bg-surface p-3 active:scale-[0.99]">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      vs {rival.name}
                      {rival.rating !== null && <span className="text-muted"> ({rival.rating})</span>}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDayMonth(toDateStr(new Date(g.createdAt)))} · {SPEED[g.speed] ?? g.speed} · {g.me === 'w' ? 'blancas' : 'negras'}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-sm">
                    <p className={r.tone === 'win' ? 'text-accent' : r.tone === 'loss' ? 'text-red-500' : 'text-muted'}>{r.text}</p>
                    <p className="text-xs text-muted">{a ? `${a.accuracy}% · ${a.counts.blunder} graves` : 'Sin analizar'}</p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg bg-surface-2 p-2">
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  )
}
