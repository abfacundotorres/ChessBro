import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type GameRecord } from '../../data/db'
import { CHESSCOM_USER, LICHESS_USER, getSetting, saveImported, setSetting, summarize } from '../../data/games'
import { USERNAME_RE, fetchLichessGames, type ImportedGame } from '../../data/lichess'
import { CHESSCOM_USERNAME_RE, fetchChesscomGames } from '../../data/chesscom'
import { KIND_LABELS, KIND_TRAINING, type ErrorKind } from '../../engine/analysis'
import { formatDayMonth, toDateStr } from '../../engine/dates'
import { runAnalysis } from './runAnalysis'

export function resultText(g: GameRecord): { text: string; tone: 'win' | 'loss' | 'draw' } {
  if (!g.winner) return { text: 'Tablas', tone: 'draw' }
  const won = (g.winner === 'white') === (g.me === 'w')
  return won ? { text: 'Ganaste', tone: 'win' } : { text: 'Perdiste', tone: 'loss' }
}

const SPEED: Record<string, string> = { blitz: 'Blitz', rapid: 'Rápida', classical: 'Clásica', correspondence: 'Por correspondencia', daily: 'Diaria' }
const SOURCE: Record<string, string> = { lichess: 'Lichess', chesscom: 'Chess.com' }
/** Cuántas partidas se analizan por tanda (cada una tarda un par de minutos en un celular). */
const BATCH = 5

function errText(e: unknown, site: string): string {
  return e instanceof Error && e.name !== 'TypeError' ? e.message : `Sin conexión con ${site}. Probá más tarde.`
}

export function Games() {
  const lichess = useLiveQuery(() => getSetting(LICHESS_USER), [], undefined)
  const chesscom = useLiveQuery(() => getSetting(CHESSCOM_USER), [], undefined)
  const games = useLiveQuery(() => db.games.orderBy('createdAt').reverse().toArray(), [], [])
  const [draftL, setDraftL] = useState('')
  const [draftC, setDraftC] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [batch, setBatch] = useState<{ game: number; of: number; done: number; total: number } | null>(null)
  const abort = useRef<AbortController | null>(null)

  async function onImport(users: { lichess: string | null; chesscom: string | null }) {
    setBusy(true)
    setMsg(null)
    const notes: string[] = []
    let fresh = 0
    let found = 0
    const jobs: [string, string | null, (u: string) => Promise<ImportedGame[]>][] = [
      ['Lichess', users.lichess, (u) => fetchLichessGames(u, 20)],
      ['Chess.com', users.chesscom, (u) => fetchChesscomGames(u, 20)],
    ]
    for (const [site, user, fetcher] of jobs) {
      if (!user) continue
      try {
        const list = await fetcher(user)
        found += list.length
        fresh += await saveImported(list)
      } catch (e) {
        notes.push(`${site}: ${errText(e, site)}`)
      }
    }
    const base = found === 0 ? 'No encontré partidas blitz, rápidas o clásicas.' : fresh === 0 ? 'No hay partidas nuevas.' : fresh === 1 ? '1 partida nueva.' : `${fresh} partidas nuevas.`
    setMsg(notes.length === 0 ? base : [found > 0 ? base : '', ...notes].filter(Boolean).join(' '))
    setBusy(false)
  }

  async function onAnalyzePending() {
    const pending = games.filter((g) => !g.analysis).slice(0, BATCH)
    if (pending.length === 0) return
    const ctrl = new AbortController()
    abort.current = ctrl
    setMsg(null)
    let cards = 0
    let doneGames = 0
    try {
      for (const [i, g] of pending.entries()) {
        setBatch({ game: i + 1, of: pending.length, done: 0, total: g.moves.length + 1 })
        const r = await runAnalysis(g, (done, total) => setBatch({ game: i + 1, of: pending.length, done, total }), ctrl.signal)
        cards += r.cards
        doneGames++
      }
    } catch {
      /* cancelado o el motor falló: se informa lo que alcanzó a terminar */
    }
    setBatch(null)
    setMsg(`${doneGames} ${doneGames === 1 ? 'partida analizada' : 'partidas analizadas'}${cards > 0 ? ` · ${cards} ${cards === 1 ? 'ejercicio nuevo' : 'ejercicios nuevos'} en el repaso` : ''}.`)
  }

  if (lichess === undefined || chesscom === undefined) return null

  if (lichess === null && chesscom === null) {
    const l = draftL.trim()
    const c = draftC.trim()
    const input = (id: string, label: string, v: string, set: (s: string) => void) => (
      <>
        <label className="text-sm font-medium" htmlFor={id}>
          {label}
        </label>
        <input
          id={id}
          className="min-h-12 rounded-xl border border-border bg-surface px-3"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={v}
          onChange={(e) => set(e.target.value)}
        />
      </>
    )
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Tus partidas</h1>
        <p className="text-muted">
          Traé tus partidas de Chess.com o Lichess (alcanza con una). El análisis corre en tu teléfono y tus errores tácticos se convierten en ejercicios.
        </p>
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if ((l && !USERNAME_RE.test(l)) || (c && !CHESSCOM_USERNAME_RE.test(c))) {
              setMsg('Alguno de los usuarios no parece válido.')
              return
            }
            void Promise.all([setSetting(LICHESS_USER, l || null), setSetting(CHESSCOM_USER, c || null)]).then(() => onImport({ lichess: l || null, chesscom: c || null }))
          }}
        >
          {input('chesscom-user', 'Usuario de Chess.com', draftC, setDraftC)}
          {input('lichess-user', 'Usuario de Lichess', draftL, setDraftL)}
          <button type="submit" className="btn-primary" disabled={busy || (l === '' && c === '')}>
            Guardar y traer partidas
          </button>
        </form>
        {msg && <p aria-live="polite">{msg}</p>}
      </div>
    )
  }

  const summary = summarize(games)
  const pendingCount = games.filter((g) => !g.analysis).length
  const topKinds = summary
    ? (Object.entries(summary.kinds) as [ErrorKind, number][]).sort((a, b) => b[1] - a[1])
    : []
  const train = topKinds.map(([k]) => KIND_TRAINING[k]).find((k) => k !== null)

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Tus partidas</h1>
          <p className="text-sm text-muted">{[chesscom && `Chess.com: ${chesscom}`, lichess && `Lichess: ${lichess}`].filter(Boolean).join(' · ')}</p>
        </div>
        <button type="button" className="btn" disabled={busy || batch !== null} onClick={() => void onImport({ lichess, chesscom })}>
          {busy ? 'Trayendo…' : 'Traer nuevas'}
        </button>
      </header>
      {msg && <p aria-live="polite">{msg}</p>}

      {batch ? (
        <section className="flex flex-col gap-2 rounded-xl bg-surface p-4 text-sm">
          <p>
            Analizando partida {batch.game} de {batch.of}… {batch.done}/{batch.total}
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full bg-accent transition-[width]" style={{ width: `${(batch.done / batch.total) * 100}%` }} />
          </div>
          <button type="button" className="btn" onClick={() => abort.current?.abort()}>
            Cancelar
          </button>
        </section>
      ) : (
        pendingCount > 0 && (
          <button type="button" className="btn flex items-center justify-center" disabled={busy} onClick={() => void onAnalyzePending()}>
            Analizar {Math.min(BATCH, pendingCount)} {pendingCount === 1 ? 'pendiente' : 'pendientes'} (de {pendingCount})
          </button>
        )
      )}

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
                      {formatDayMonth(toDateStr(new Date(g.createdAt)))} · {SOURCE[g.source ?? 'lichess']} · {SPEED[g.speed] ?? g.speed} · {g.me === 'w' ? 'blancas' : 'negras'}
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
