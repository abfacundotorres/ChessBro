import { useMemo, useState } from 'react'
import { Chess } from 'chess.js'
import { Board } from '../../ui/Board'
import { Speak } from '../../ui/Speak'
import type { Opening } from '../../content/openings'
import { sanToFigurine, tryMove, type Color, type MoveInput } from '../../engine/game'

/** "Encontrá el golpe": la posición justo antes de la jugada que castiga la trampa. */
export function TrapExercise({ opening }: { opening: Opening }) {
  const trap = opening.trap!
  const at = trap.punishAt!
  const { fen, color, expected } = useMemo(() => {
    const c = new Chess()
    for (const m of trap.moves.slice(0, at)) c.move(m)
    const f = c.fen()
    const turn = c.turn() as Color
    const mv = c.move(trap.moves[at]!)
    return { fen: f, color: turn, expected: `${mv.from}${mv.to}${mv.promotion ?? ''}` }
  }, [trap, at])
  const [wrong, setWrong] = useState(false)
  const [solved, setSolved] = useState(false)

  function onMove(m: MoveInput): boolean {
    if (solved || !tryMove(fen, m)) return false
    if (`${m.from}${m.to}${m.promotion ?? ''}` === expected) {
      setSolved(true)
      setWrong(false)
      return true
    }
    setWrong(true)
    return false
  }

  const answer = sanToFigurine(trap.moves[at]!)
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-accent p-3 text-sm">
      <p className="font-semibold">Trampa: {trap.name}</p>
      <p className="text-muted">El rival cayó en la trampa. Jugás con {color === 'w' ? 'blancas' : 'negras'}: encontrá la jugada que lo castiga.</p>
      <Board fen={fen} orientation={color === 'w' ? 'white' : 'black'} lastMove={null} checkSquare={null} movableColor={solved ? null : color} onMove={onMove} />
      <p className={`text-center font-medium ${solved ? 'text-accent' : wrong ? 'text-red-500' : ''}`} aria-live="polite">
        {solved ? `¡Eso! ${answer}` : wrong ? 'No es esa. Probá otra.' : 'Tu turno.'}
      </p>
      {solved ? (
        <div className="flex flex-col gap-2">
          <p>{trap.text}</p>
          <Speak text={trap.text} auto />
        </div>
      ) : (
        <button type="button" className="btn" onClick={() => setSolved(true)}>
          Ver la respuesta ({answer})
        </button>
      )}
    </section>
  )
}
