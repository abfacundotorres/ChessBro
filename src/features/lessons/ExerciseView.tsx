import { useEffect, useState } from 'react'
import { Board } from '../../ui/Board'
import { checkSquareOf, sanToFigurine, type MoveInput } from '../../engine/game'
import { revealSolution, type PuzzleState } from '../../engine/puzzle'
import { startExercise, tryExercise, type Exercise } from '../../engine/lesson'

interface Props {
  exercise: Exercise
  /** Se llama una vez al resolver por cuenta propia (sin ver la solución). */
  onSolved: () => void
  onNext: () => void
  isLast: boolean
  /** Cada intento equivocado y cuando se pide la solución. */
  onMistake?: () => void
}

const GOAL_TEXT = {
  mate: (n: number) => (n === 1 ? 'Dá mate en 1.' : `Dá mate en ${n}.`),
  win: () => 'Encontrá la mejor jugada.',
  hold: () => 'Encontrá la jugada que salva la posición.',
}

export function ExerciseView({ exercise, onSolved, onNext, isLast, onMistake }: Props) {
  const [state, setState] = useState<PuzzleState>(() => startExercise(exercise))
  const [shown, setShown] = useState(0)
  const [wrong, setWrong] = useState(false)
  const [hint, setHint] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [reported, setReported] = useState(false)

  // Muestra las jugadas aplicadas de a una (la del usuario ya; la respuesta, con demora).
  useEffect(() => {
    if (shown >= state.played.length) return
    const t = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 0 : 450)
    return () => clearTimeout(t)
  }, [shown, state.played.length])

  const last = shown > 0 ? state.played[shown - 1] : undefined
  const fen = last?.fen ?? exercise.fen
  const animating = shown < state.played.length
  const done = state.solved && !animating
  const goal = exercise.goal
  const goalText = goal.kind === 'mate' ? GOAL_TEXT.mate(goal.in) : GOAL_TEXT[goal.kind]()

  function onMove(m: MoveInput): boolean {
    if (state.solved || animating) return false
    const r = tryExercise(exercise, state, m)
    if (!r.ok) {
      setWrong(true)
      onMistake?.()
      return false
    }
    setWrong(false)
    setHint(false)
    setState(r.state)
    // La jugada del usuario se ve ya; la respuesta del rival entra animada.
    setShown(r.state.played.length > 1 ? r.state.played.length - 1 : r.state.played.length)
    if (r.state.solved && !reported && !revealed) {
      setReported(true)
      onSolved()
    }
    return true
  }

  function onReveal() {
    const s = revealSolution({ ...state, ply: state.played.length })
    setRevealed(true)
    onMistake?.()
    setState(s)
  }

  return (
    <div className="flex flex-col gap-3">
      <Board
        fen={fen}
        orientation={state.solver === 'w' ? 'white' : 'black'}
        lastMove={last ? { from: last.from, to: last.to } : null}
        checkSquare={checkSquareOf(fen)}
        movableColor={state.solved || animating ? null : state.solver}
        onMove={onMove}
        highlights={hint && !state.solved ? [exercise.accept[0]!.slice(0, 2)] : []}
      />
      <p className={`text-center font-medium ${wrong && !done ? 'text-red-500' : done && !revealed ? 'text-accent' : ''}`} aria-live="polite">
        {done ? (revealed ? 'Esta era la solución.' : '¡Muy bien!') : wrong ? 'No es esa. Probá otra.' : goalText}
      </p>
      {done ? (
        <div className="flex flex-col gap-2 rounded-xl bg-surface p-4 text-sm">
          {exercise.why && <p>{exercise.why}</p>}
          {state.played.length > 0 && (
            <p className="font-mono text-muted">{state.played.map((m) => sanToFigurine(m.san)).join(' ')}</p>
          )}
          <button type="button" className="btn-primary mt-1" onClick={onNext}>
            {isLast ? 'Terminar' : 'Siguiente'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn" disabled={animating || hint} onClick={() => setHint(true)}>
            Pista
          </button>
          <button type="button" className="btn" disabled={animating} onClick={onReveal}>
            Ver solución
          </button>
        </div>
      )}
    </div>
  )
}
