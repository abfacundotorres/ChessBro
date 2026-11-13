import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Board } from '../../ui/Board'
import { Speak } from '../../ui/Speak'
import { checkSquareOf, sanToFigurine, type MoveInput } from '../../engine/game'
import { hint, playMove, revealSolution, startPuzzle, type PuzzleState } from '../../engine/puzzle'
import { THEME_LIST } from '../../content/themes'
import { blurbsFor } from '../../content/themeBlurbs'
import { recordAttempt } from '../../data/tactics'
import { saveDailyOutcome, type DailyState } from '../../data/daily'
import { toDateStr } from '../../engine/dates'

const GENERIC = new Set(['endgame', 'middlegame', 'opening', 'mate'])

/** Claves de los temas de un puzzle (sin los genéricos de fase). */
export function themeKeysOf(mask: number): string[] {
  return THEME_LIST.filter((t) => (mask & t.bit) !== 0 && !GENERIC.has(t.key)).map((t) => t.key)
}

export function themeLabel(key: string): string {
  return THEME_LIST.find((t) => t.key === key)?.label ?? key
}

/**
 * El puzzle del día, jugable ahí mismo. El resultado cuenta como cualquier puzzle (rating y repaso) y queda guardado:
 * si volvés a abrir la app el mismo día, ves cómo te fue y la solución.
 */
export function DailyPuzzle({ daily, onOutcome }: { daily: DailyState; onOutcome: (o: 'solved' | 'failed') => void }) {
  const puzzle = daily.puzzle
  // Si ya estaba resuelto al abrir la app (no si lo resolvés ahora): `daily` cambia cuando termina, esto no.
  const [finishedBefore] = useState(() => daily.outcome !== null)
  const [state, setState] = useState<PuzzleState>(() => {
    const s = startPuzzle(puzzle)
    return finishedBefore ? revealSolution(s) : s
  })
  const [shown, setShown] = useState(finishedBefore ? state.played.length : 0)
  const [hintSquare, setHintSquare] = useState<string | null>(null)
  const [wrong, setWrong] = useState(false)
  const [delta, setDelta] = useState<number | null>(null)
  const recorded = useRef(finishedBefore)

  // Las jugadas pendientes (la del rival al empezar y sus respuestas) entran de a una.
  useEffect(() => {
    if (shown >= state.played.length) return
    const t = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 600 : 400)
    return () => clearTimeout(t)
  }, [shown, state.played.length])

  const today = toDateStr(new Date())

  async function record(s: PuzzleState, solved: boolean) {
    if (recorded.current) return
    recorded.current = true
    const r = await recordAttempt({ puzzle: s.puzzle, solved, mode: 'new', today })
    setDelta(Math.round(r.ratingAfter - r.ratingBefore))
    await saveDailyOutcome(today, solved ? 'solved' : 'failed')
    onOutcome(solved ? 'solved' : 'failed')
  }

  const animating = shown < state.played.length
  const shownMove = shown > 0 ? state.played[shown - 1] : undefined
  const fen = shownMove?.fen ?? puzzle.fen
  const done = state.solved && !animating
  const side = state.solver === 'w' ? 'blancas' : 'negras'

  function onMove(m: MoveInput): boolean {
    if (state.solved || animating) return false
    const { state: next, result } = playMove(state, m)
    if (result.kind === 'wrong') {
      setState(next)
      setWrong(true)
      void record(next, false)
      return false
    }
    setWrong(false)
    setHintSquare(null)
    setState(next)
    // La jugada propia se ve ya; la respuesta del rival entra animada.
    setShown(result.kind === 'correct' ? next.played.length - 1 : next.played.length)
    if (result.kind === 'solved') void record(next, !next.failed)
    return true
  }

  function onHint() {
    const h = hint(state)
    setState(h.state)
    setHintSquare(h.square)
    void record(h.state, false)
  }

  function onSolution() {
    const s = revealSolution(state)
    setState(s)
    setHintSquare(null)
    void record(s, false)
  }

  const keys = themeKeysOf(puzzle.themes)
  const line = state.played.map((m) => sanToFigurine(m.san)).join(' ')
  const won = done && !state.failed
  const message = done
    ? won
      ? '¡Resuelto!'
      : finishedBefore
        ? 'Hoy no salió, pero ya lo viste. Mañana hay otro.'
        : 'Esta era la solución.'
    : wrong
      ? 'No es esa. Podés seguir intentando.'
      : `Juegan ${side}: encontrá la mejor jugada.`

  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-surface p-4" aria-labelledby="daily-puzzle-title">
      <header className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Puzzle del día</p>
          <h2 id="daily-puzzle-title" className="text-xl font-bold">
            {done ? (keys.length > 0 ? keys.map(themeLabel).join(' · ') : 'Táctica') : 'Un desafío para hoy'}
          </h2>
        </div>
        <span className="shrink-0 whitespace-nowrap rounded-full bg-surface-2 px-3 py-1 text-sm font-semibold tabular-nums" title="Dificultad del puzzle">
          ★ {puzzle.rating}
        </span>
      </header>

      <Board
        fen={fen}
        orientation={state.solver === 'w' ? 'white' : 'black'}
        lastMove={shownMove ? { from: shownMove.from, to: shownMove.to } : null}
        checkSquare={checkSquareOf(fen)}
        movableColor={!state.solved && !animating ? state.solver : null}
        onMove={onMove}
        highlights={hintSquare ? [hintSquare] : []}
      />

      <p
        key={done ? 'done' : wrong ? 'wrong' : 'play'}
        className={`text-center text-lg font-semibold ${won ? 'pop text-accent' : wrong && !done ? 'text-red-500' : ''}`}
        aria-live="polite"
      >
        {message}
      </p>

      {done ? (
        <div className="flex flex-col gap-3 text-sm">
          {line && (
            <p>
              <span className="font-semibold">La línea: </span>
              <span className="font-mono">{line}</span>
            </p>
          )}
          {blurbsFor(keys).map((b) => (
            <div key={b.key} className="rounded-xl bg-surface-2 p-3">
              <p className="font-semibold">{themeLabel(b.key)}</p>
              <p className="mt-1">{b.text}</p>
            </div>
          ))}
          {delta !== null && (
            <p className="text-muted">
              Tu rating de puzzles: <span className={delta >= 0 ? 'font-semibold text-accent' : 'font-semibold text-red-500'}>{delta >= 0 ? `+${delta}` : delta}</span>
            </p>
          )}
          <Speak
            text={[won ? 'Bien resuelto.' : 'Esta era la solución.', line ? `La línea: ${state.played.map((m) => m.san).join(', ')}.` : '', ...blurbsFor(keys).map((b) => `${themeLabel(b.key)}. ${b.text}`)]
              .filter(Boolean)
              .join(' ')}
          />
          <Link to="/tactica" className="btn-primary flex items-center justify-center">
            Más puzzles
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn" disabled={animating || hintSquare !== null} onClick={onHint}>
            Pista
          </button>
          <button type="button" className="btn" disabled={animating} onClick={onSolution}>
            Ver solución
          </button>
        </div>
      )}
      {!done && <p className="text-center text-xs text-muted">Pista o solución cuentan como fallado · el tema se revela al terminar</p>}
    </section>
  )
}
