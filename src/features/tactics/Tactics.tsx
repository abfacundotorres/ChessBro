import { useCallback, useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSearchParams } from 'react-router-dom'
import { Board } from '../../ui/Board'
import { checkSquareOf, sanToFigurine, tryMove, type MoveInput } from '../../engine/game'
import { isProvisional } from '../../engine/glicko2'
import { acceptAlternative, currentFen, hint, uciToMove, playMove, revealSolution, startPuzzle, type Puzzle, type PuzzleState } from '../../engine/puzzle'
import { pickPuzzle } from '../../engine/selection'
import { addDays, toDateStr } from '../../engine/dates'
import { THEME_GROUPS, THEME_LIST, themeByKey, themeLabels } from '../../content/themes'
import { db } from '../../data/db'
import { dueReviews, getProfile, initialProfile, recordAttempt, seenPuzzleIds, tacticsStats } from '../../data/tactics'
import { loadPoolFor } from '../../data/puzzles'
import { isGoodAlternative, type CardOrigin } from '../../engine/gameCards'
import { KIND_LABELS, winPercent } from '../../engine/analysis'
import { getEngine } from '../../lib/stockfish'

type Mode = 'new' | 'review'
type Feedback = 'start' | 'good' | 'wrong' | 'checking' | 'done'

interface Current {
  mode: Mode
  state: PuzzleState
  /** Cantidad de jugadas de `state.played` que ya se muestran (para animar de a una). */
  shown: number
  feedback: Feedback
  hintSquare: string | null
  delta: number | null
  /** Si el ejercicio sale de una partida propia. */
  origin: CardOrigin | null
  /** Se aceptó una jugada distinta de la del motor. */
  alternative: boolean
}

const THEME_KEY = 'chessbro.tactics.theme'

function readTheme(): string {
  try {
    const v = localStorage.getItem(THEME_KEY)
    return v && themeByKey(v) ? v : 'mix'
  } catch {
    return 'mix'
  }
}

function writeTheme(v: string) {
  try {
    localStorage.setItem(THEME_KEY, v)
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

/** SAN de la jugada esperada, en la posición anterior a la última jugada aplicada. */
function engineChoice(state: PuzzleState): string {
  const uci = state.puzzle.moves.at(-1)
  if (!uci) return ''
  const fen = state.played.at(-2)?.fen ?? state.puzzle.fen
  return tryMove(fen, uciToMove(uci))?.san ?? uci
}

function today() {
  return toDateStr(new Date())
}

export function Tactics() {
  const profile = useLiveQuery(() => getProfile(), [], initialProfile())
  const dueCount = useLiveQuery(() => db.reviews.where('due').belowOrEqual(today()).count(), [], 0)
  const stats = useLiveQuery(() => tacticsStats(today(), addDays(today(), -6)), [])

  const [params, setParams] = useSearchParams()
  const [theme, setTheme] = useState(() => {
    const t = params.get('tema')
    return t && themeByKey(t) ? t : readTheme()
  })
  const [mode, setMode] = useState<Mode>('new')
  const [current, setCurrent] = useState<Current | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'empty' | 'error'>('idle')
  const recorded = useRef<string | null>(null)

  const next = useCallback(
    async (wanted: Mode, themeKey: string) => {
      setStatus('loading')
      try {
        let puzzle: Puzzle | null = null
        let origin: CardOrigin | null = null
        let m: Mode = wanted
        if (wanted === 'review') {
          const card = (await dueReviews(today()))[0]
          puzzle = card?.puzzle ?? null
          origin = card?.origin ?? null
          if (!puzzle) m = 'new'
        }
        if (!puzzle) {
          const p = await getProfile()
          const [pool, seen] = await Promise.all([loadPoolFor(p.rating), seenPuzzleIds()])
          puzzle = pickPuzzle({
            pool,
            rating: p.rating,
            themeBit: themeKey === 'mix' ? null : (themeByKey(themeKey)?.bit ?? null),
            seen,
            random: Math.random,
          })
        }
        if (!puzzle) {
          setCurrent(null)
          setStatus('empty')
          return
        }
        recorded.current = null
        setMode(m)
        setCurrent({ mode: m, state: startPuzzle(puzzle), shown: 0, feedback: 'start', hintSquare: null, delta: null, origin, alternative: false })
        setStatus('idle')
      } catch (e) {
        console.error(e)
        setStatus('error')
      }
    },
    [],
  )

  // Primer puzzle al entrar.
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    const t = params.get('tema')
    if (t) {
      writeTheme(t)
      setParams({}, { replace: true })
    }
    void next('new', t && themeByKey(t) ? t : readTheme())
  }, [next, params, setParams])

  // Animación: mostrar las jugadas pendientes de a una.
  useEffect(() => {
    if (!current || current.shown >= current.state.played.length) return
    const t = setTimeout(
      () => setCurrent((c) => (c ? { ...c, shown: c.shown + 1 } : c)),
      current.shown === 0 ? 600 : 400,
    )
    return () => clearTimeout(t)
  }, [current])

  async function record(c: Current, solved: boolean) {
    const id = c.state.puzzle.id
    if (recorded.current === id) return
    recorded.current = id
    const r = await recordAttempt({ puzzle: c.state.puzzle, solved, mode: c.mode, today: today() })
    if (c.mode === 'new') {
      const delta = Math.round(r.ratingAfter - r.ratingBefore)
      setCurrent((cur) => (cur && cur.state.puzzle.id === id ? { ...cur, delta } : cur))
    }
  }

  /** En ejercicios de partidas propias, una jugada distinta puede ser igual de buena: lo decide el motor. */
  async function checkAlternative(c: Current, m: MoveInput) {
    const origin = c.origin
    const after = tryMove(currentFen(c.state), m)
    if (!origin || !after) return
    let good = false
    try {
      if (after.san.endsWith('#')) good = true
      else good = isGoodAlternative(origin.bestCp, (await getEngine().evaluate(after.fen, 12)).score, winPercent)
    } catch (e) {
      console.error(e)
    }
    const id = c.state.puzzle.id
    if (good) {
      const state = acceptAlternative(c.state, m)
      const done: Current = { ...c, state, shown: state.played.length, feedback: 'done', alternative: true }
      setCurrent((cur) => (cur?.state.puzzle.id === id ? done : cur))
      void record(done, true)
    } else {
      const failed: Current = { ...c, state: { ...c.state, failed: true }, feedback: 'wrong' }
      setCurrent((cur) => (cur?.state.puzzle.id === id ? failed : cur))
      void record(failed, false)
    }
  }

  function onMove(m: MoveInput): boolean {
    if (!current || current.state.solved || current.feedback === 'checking' || current.shown < current.state.played.length) return false
    const { state, result } = playMove(current.state, m)
    if (result.kind === 'wrong' && current.origin && !current.state.failed) {
      const c: Current = { ...current, feedback: 'checking' }
      setCurrent(c)
      void checkAlternative(c, m)
      return false
    }
    if (result.kind === 'wrong') {
      const c = { ...current, state, feedback: 'wrong' as const }
      setCurrent(c)
      void record(c, false)
      return false
    }
    const c: Current = {
      ...current,
      state,
      // La jugada del usuario se ve ya; la respuesta del rival entra animada.
      shown: result.kind === 'correct' ? state.played.length - 1 : state.played.length,
      feedback: result.kind === 'solved' ? 'done' : 'good',
      hintSquare: null,
    }
    setCurrent(c)
    if (result.kind === 'solved') void record(c, !state.failed)
    return true
  }

  function onHint() {
    if (!current) return
    const h = hint(current.state)
    const c = { ...current, state: h.state, hintSquare: h.square }
    setCurrent(c)
    void record(c, false)
  }

  function onSolution() {
    if (!current) return
    const c: Current = { ...current, state: revealSolution(current.state), feedback: 'done', hintSquare: null }
    setCurrent(c)
    void record(c, false)
  }

  function changeTheme(v: string) {
    setTheme(v)
    writeTheme(v)
    void next(mode === 'review' ? 'review' : 'new', v)
  }

  const rating = Math.round(profile.rating)
  const provisional = isProvisional(profile)

  return (
    <div className="flex flex-col gap-3">
      <header className="flex items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Táctica</h1>
          <p className="text-sm text-muted">
            {stats ? `Hoy ${stats.today.solved}/${stats.today.total} · 7 días ${stats.last7.solved}/${stats.last7.total}` : ' '}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums">
            {rating}
            {provisional && <span className="text-muted">?</span>}
          </p>
          <p className="text-xs text-muted">{provisional ? 'rating provisional' : 'tu rating'}</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <select
          aria-label="Tema"
          className="min-h-12 rounded-xl border border-border bg-surface px-3"
          value={theme}
          onChange={(e) => changeTheme(e.target.value)}
        >
          <option value="mix">Mezcla</option>
          {THEME_GROUPS.map((g) => (
            <optgroup key={g.label} label={g.label}>
              {g.keys.map((k) => (
                <option key={k} value={k}>
                  {THEME_LIST.find((t) => t.key === k)?.label ?? k}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <button
          type="button"
          className={mode === 'review' ? 'btn-primary' : 'btn'}
          disabled={dueCount === 0 && mode !== 'review'}
          onClick={() => {
            const m = mode === 'review' ? 'new' : 'review'
            setMode(m)
            void next(m, theme)
          }}
        >
          {mode === 'review' ? 'Repasando' : `Repaso (${dueCount})`}
        </button>
      </div>

      {status === 'error' && (
        <p className="rounded-xl bg-surface p-4 text-center">
          No se pudieron cargar los puzzles.{' '}
          <button type="button" className="underline" onClick={() => void next(mode, theme)}>
            Reintentar
          </button>
        </p>
      )}
      {status === 'empty' && (
        <p className="rounded-xl bg-surface p-4 text-center">No quedan puzzles nuevos con este filtro. Probá otro tema.</p>
      )}

      {current && <PuzzleView current={current} onMove={onMove} onHint={onHint} onSolution={onSolution} onNext={() => void next(mode, theme)} loading={status === 'loading'} />}
      {!current && status === 'loading' && <p className="py-20 text-center text-muted">Cargando…</p>}
    </div>
  )
}

function PuzzleView({
  current,
  onMove,
  onHint,
  onSolution,
  onNext,
  loading,
}: {
  current: Current
  onMove: (m: MoveInput) => boolean
  onHint: () => void
  onSolution: () => void
  onNext: () => void
  loading: boolean
}) {
  const { state, shown, feedback } = current
  const shownMove = shown > 0 ? state.played[shown - 1] : undefined
  const fen = shownMove?.fen ?? state.puzzle.fen
  const animating = shown < state.played.length
  const side = state.solver === 'w' ? 'blancas' : 'negras'
  const done = state.solved && !animating

  let message: string
  if (done)
    message = state.failed
      ? current.mode === 'review'
        ? 'Para repasar de nuevo mañana.'
        : 'Va al repaso.'
      : current.alternative
        ? '¡También sirve!'
        : '¡Resuelto!'
  else if (feedback === 'checking') message = 'Consultando al motor…'
  else if (feedback === 'wrong') message = 'No es esa. Probá otra.'
  else if (feedback === 'good') message = '¡Bien! Seguí.'
  else message = `Juegan ${side}: encontrá la mejor jugada.`

  return (
    <>
      <Board
        fen={fen}
        orientation={state.solver === 'w' ? 'white' : 'black'}
        lastMove={shownMove ? { from: shownMove.from, to: shownMove.to } : null}
        checkSquare={checkSquareOf(fen)}
        movableColor={!state.solved && !animating ? state.solver : null}
        onMove={onMove}
        highlights={current.hintSquare ? [current.hintSquare] : []}
      />
      <p
        className={`text-center font-medium ${feedback === 'wrong' && !done ? 'text-red-500' : done && !state.failed ? 'text-accent' : ''}`}
        aria-live="polite"
      >
        {message}
      </p>
      {current.origin && (
        <p className="text-center text-sm text-muted">
          De tu partida: jugaste {sanToFigurine(current.origin.played)} ({KIND_LABELS[current.origin.kind].toLowerCase()}).
        </p>
      )}

      {done ? (
        <div className="flex flex-col gap-2 rounded-xl bg-surface p-4 text-sm">
          {current.alternative && (
            <p>
              El motor prefería {sanToFigurine(engineChoice(state))}, pero lo tuyo también está bien.
            </p>
          )}
          <div className="flex justify-between">
            <span className="text-muted">{current.origin ? 'Ejercicio' : 'Puzzle'}</span>
            <span className="tabular-nums">
              {state.puzzle.rating}
              {current.delta !== null && (
                <span className={current.delta >= 0 ? 'ml-2 text-accent' : 'ml-2 text-red-500'}>
                  {current.delta >= 0 ? `+${current.delta}` : current.delta}
                </span>
              )}
            </span>
          </div>
          {current.origin ? (
            <p className="text-muted">{KIND_LABELS[current.origin.kind]}</p>
          ) : themeLabels(state.puzzle.themes).length > 0 && (
            <p className="text-muted">{themeLabels(state.puzzle.themes).join(' · ')}</p>
          )}
          <button type="button" className="btn-primary mt-1" disabled={loading} onClick={onNext}>
            Siguiente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn" disabled={animating || current.hintSquare !== null} onClick={onHint}>
            Pista
          </button>
          <button type="button" className="btn" disabled={animating} onClick={onSolution}>
            Ver solución
          </button>
        </div>
      )}
      <p className="text-center text-xs text-muted">
        {current.mode === 'review' ? 'Repaso · no cambia tu rating' : 'Pista o solución cuentan como fallado'}
      </p>
    </>
  )
}
