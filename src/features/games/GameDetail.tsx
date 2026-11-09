import { useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../data/db'
import { Board } from '../../ui/Board'
import { replay, sanToFigurine } from '../../engine/game'
import { uciToMove } from '../../engine/puzzle'
import { KIND_LABELS, toCp, type MoveError, type Score } from '../../engine/analysis'
import { shouldCard } from '../../engine/gameCards'
import { explainError } from '../../engine/commentary'
import { Speak } from '../../ui/Speak'
import { runAnalysis } from './runAnalysis'
import { resultText } from './Games'

const SEVERITY: Record<MoveError['severity'], string> = { blunder: '??', mistake: '?', inaccuracy: '?!' }

function scoreText(s: Score, whiteToMove: boolean): string {
  // Se muestra siempre desde el punto de vista de las blancas, como en Lichess.
  const sign = whiteToMove ? 1 : -1
  if ('mate' in s) return s.mate === 0 ? '#' : `#${sign * s.mate}`
  const cp = (sign * toCp(s)) / 100
  return `${cp > 0 ? '+' : ''}${cp.toFixed(1)}`
}

export function GameDetail() {
  const { id = '' } = useParams()
  const game = useLiveQuery(() => db.games.get(id), [id])
  const [ply, setPly] = useState(0)
  const [focus, setFocus] = useState<MoveError | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const abort = useRef<AbortController | null>(null)

  const view = useMemo(() => (game ? replay(game.startFen, game.moves.map(uciToMove)) : null), [game])
  if (game === undefined) return null
  if (!game || !view) return <p>No encontré esa partida. <Link to="/partidas" className="underline">Volver</Link></p>

  const total = view.moves.length
  const fen = ply === 0 ? game.startFen : view.moves[ply - 1]!.fen
  const last = ply > 0 ? view.moves[ply - 1]! : null
  const evals = game.analysis?.evals
  const evalHere = evals?.[ply]
  const r = resultText(game)

  async function analyze() {
    if (!game) return
    const ctrl = new AbortController()
    abort.current = ctrl
    setMsg(null)
    setProgress({ done: 0, total: game.moves.length + 1 })
    try {
      const res = await runAnalysis(game, (done, t) => setProgress({ done, total: t }), ctrl.signal)
      setMsg(res.cards === 0 ? 'Análisis listo.' : res.cards === 1 ? '1 ejercicio nuevo en Repaso.' : `${res.cards} ejercicios nuevos en Repaso.`)
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        console.error(e)
        setMsg('No se pudo analizar la partida.')
      }
    } finally {
      setProgress(null)
      abort.current = null
    }
  }

  const arrows =
    focus && ply === focus.ply
      ? [
          { startSquare: game.moves[focus.ply]!.slice(0, 2), endSquare: game.moves[focus.ply]!.slice(2, 4), color: 'rgba(220, 38, 38, 0.8)' },
          { startSquare: focus.bestUci.slice(0, 2), endSquare: focus.bestUci.slice(2, 4), color: 'rgba(22, 163, 74, 0.85)' },
        ]
      : []

  const go = (p: number) => {
    setPly(Math.max(0, Math.min(total, p)))
    setFocus(null)
  }

  return (
    <div className="flex flex-col gap-3">
      <header>
        <Link to="/partidas" className="text-sm text-muted">
          ← Partidas
        </Link>
        <h1 className="text-xl font-bold">
          {game.white.name} – {game.black.name}
        </h1>
        <p className="text-sm text-muted">
          {r.text}
          {game.opening && ` · ${game.opening}`}
        </p>
      </header>

      <Board fen={fen} orientation={game.me === 'w' ? 'white' : 'black'} lastMove={last} checkSquare={null} movableColor={null} arrows={arrows} />

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">
          {ply === 0 ? 'Inicio' : `${Math.ceil(ply / 2)}${ply % 2 ? '.' : '…'} ${sanToFigurine(last!.san)}`}
        </span>
        {evalHere && <span className="font-mono tabular-nums">{scoreText(evalHere.score, fen.split(' ')[1] === 'w')}</span>}
      </div>
      <div className="grid grid-cols-4 gap-2">
        <button type="button" className="btn" aria-label="Inicio" onClick={() => go(0)}>⏮</button>
        <button type="button" className="btn" aria-label="Anterior" onClick={() => go(ply - 1)}>◀</button>
        <button type="button" className="btn" aria-label="Siguiente" onClick={() => go(ply + 1)}>▶</button>
        <button type="button" className="btn" aria-label="Final" onClick={() => go(total)}>⏭</button>
      </div>

      {focus && ply === focus.ply && (
        <div className="flex flex-col gap-2 rounded-xl border border-accent p-3 text-sm" aria-live="polite">
          <p>{explainError(focus)}</p>
          <Speak text={explainError(focus)} auto />
        </div>
      )}

      {progress ? (
        <div className="flex flex-col gap-2 rounded-xl bg-surface p-4">
          <p className="text-sm">
            Analizando… {progress.done}/{progress.total}
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full bg-accent transition-[width]" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
          <button type="button" className="btn" onClick={() => abort.current?.abort()}>
            Cancelar
          </button>
        </div>
      ) : !game.analysis ? (
        <button type="button" className="btn-primary" onClick={() => void analyze()}>
          Analizar con Stockfish
        </button>
      ) : null}
      {msg && <p aria-live="polite">{msg}</p>}

      {game.analysis && (
        <section className="flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <h2 className="font-semibold">Tus errores</h2>
            <span className="text-muted">Precisión {game.analysis.summary.accuracy}%</span>
          </div>
          {game.analysis.summary.errors.length === 0 ? (
            <p className="text-muted">Sin errores marcados. Buena partida.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {game.analysis.summary.errors.map((e) => (
                <li key={e.ply}>
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between gap-2 rounded-xl p-3 text-left ${focus?.ply === e.ply ? 'bg-surface-2' : 'bg-surface'}`}
                    onClick={() => {
                      setPly(e.ply)
                      setFocus(e)
                    }}
                  >
                    <span>
                      <span className="font-mono">
                        {Math.floor(e.ply / 2) + 1}
                        {e.ply % 2 ? '…' : '.'} {sanToFigurine(e.san)}
                        {SEVERITY[e.severity]}
                      </span>
                      <span className="text-muted"> · mejor {sanToFigurine(e.bestSan)}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted">
                      {KIND_LABELS[e.kind]}
                      {shouldCard(e) ? ' · repaso' : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted">Flecha roja: lo que jugaste. Verde: lo que sugiere el motor.</p>
        </section>
      )}
    </div>
  )
}
