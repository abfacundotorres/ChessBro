import { useMemo, useState } from 'react'
import { Board } from '../../ui/Board'
import { checkChallenge, type Challenge } from '../../engine/challenge'
import { sanToFigurine, tryMove, type Color } from '../../engine/game'
import { useStyle } from '../../data/style'

interface Props {
  challenge: Challenge
  /** Cada respuesta equivocada. */
  onMistake: () => void
  /** Una sola vez, al resolver (o al pedir la respuesta). */
  onSolved: (cleanly: boolean) => void
}

const TRIES_BEFORE_SHOW = 2

export function ChallengeView({ challenge, onMistake, onSolved }: Props) {
  const [solved, setSolved] = useState(false)
  const [wrongs, setWrongs] = useState(0)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [badOptions, setBadOptions] = useState<Set<string>>(new Set())
  const [flash, setFlash] = useState<string | null>(null)
  const serio = useStyle() === 'serio'

  function wrong() {
    setWrongs((w) => w + 1)
    onMistake()
  }

  function finish(cleanly: boolean) {
    setSolved(true)
    onSolved(cleanly)
  }

  function answerChoice(index: number) {
    if (challenge.kind !== 'choice' || solved) return
    if (checkChallenge(challenge, { kind: 'choice', index })) finish(wrongs === 0)
    else {
      wrong()
      setBadOptions((s) => new Set(s).add(String(index)))
    }
  }

  function answerMove(uci: string) {
    if (challenge.kind !== 'move' || solved) return
    if (checkChallenge(challenge, { kind: 'move', uci })) finish(wrongs === 0)
    else {
      wrong()
      setBadOptions((s) => new Set(s).add(uci))
    }
  }

  function tap(square: string) {
    if (challenge.kind !== 'tap' || solved) return
    setFlash(null)
    if (challenge.mode === 'any') {
      if (checkChallenge(challenge, { kind: 'tap', squares: [square] })) {
        setPicked(new Set([square]))
        finish(wrongs === 0)
      } else {
        wrong()
        setFlash(square)
      }
      return
    }
    setPicked((s) => {
      const n = new Set(s)
      if (n.has(square)) n.delete(square)
      else n.add(square)
      return n
    })
  }

  function confirmTap() {
    if (challenge.kind !== 'tap' || solved) return
    if (checkChallenge(challenge, { kind: 'tap', squares: [...picked] })) finish(wrongs === 0)
    else {
      wrong()
      setFlash('x')
    }
  }

  function showAnswer() {
    setSolved(true)
    onSolved(false)
  }

  const marks = useMemo(() => {
    if (challenge.kind !== 'tap') return {}
    const m: Record<string, 'sel' | 'ok' | 'bad'> = {}
    if (solved) {
      for (const q of challenge.answer) m[q] = 'ok'
      return m
    }
    for (const q of picked) m[q] = 'sel'
    if (flash && flash !== 'x') m[flash] = 'bad'
    return m
  }, [challenge, picked, solved, flash])

  const showReveal = !solved && wrongs >= TRIES_BEFORE_SHOW

  if (challenge.kind === 'choice') {
    return (
      <div className="flex flex-col gap-2">
        {challenge.fen && (
          <Board fen={challenge.fen} lastMove={null} checkSquare={null} movableColor={null} />
        )}
        <p className="font-semibold">{challenge.question}</p>
        <div className="flex flex-col gap-2">
          {challenge.options.map((o, i) => {
            const isAnswer = solved && i === challenge.answer
            const isBad = badOptions.has(String(i))
            return (
              <button
                key={o}
                type="button"
                disabled={solved || isBad}
                onClick={() => answerChoice(i)}
                className={`min-h-12 rounded-xl px-4 py-2 text-left ${isAnswer ? 'bg-accent text-accent-text' : isBad ? 'bg-red-500/20 text-muted line-through' : 'bg-surface-2'}`}
              >
                {o}
              </button>
            )
          })}
        </div>
        <Feedback serio={serio} solved={solved} wrongs={wrongs} why={challenge.why} onShow={showReveal ? showAnswer : undefined} />
      </div>
    )
  }

  if (challenge.kind === 'move') {
    const turn: Color = challenge.fen.split(' ')[1] === 'b' ? 'b' : 'w'
    return (
      <div className="flex flex-col gap-2">
        <Board
          fen={challenge.fen}
          orientation={turn === 'w' ? 'white' : 'black'}
          lastMove={null}
          checkSquare={null}
          movableColor={null}
          arrows={solved ? [{ startSquare: challenge.answer.slice(0, 2), endSquare: challenge.answer.slice(2, 4), color: 'rgba(22, 163, 74, 0.85)' }] : undefined}
        />
        <p className="font-semibold">{challenge.prompt}</p>
        <div className="grid grid-cols-2 gap-2">
          {challenge.options.map((u) => {
            const san = tryMove(challenge.fen, { from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] as 'q' | undefined })?.san ?? u
            const isAnswer = solved && u === challenge.answer
            const isBad = badOptions.has(u)
            return (
              <button
                key={u}
                type="button"
                disabled={solved || isBad}
                onClick={() => answerMove(u)}
                className={`min-h-12 rounded-xl px-3 py-2 font-mono text-lg ${isAnswer ? 'bg-accent text-accent-text' : isBad ? 'bg-red-500/20 text-muted line-through' : 'bg-surface-2'}`}
              >
                {sanToFigurine(san)}
              </button>
            )
          })}
        </div>
        <Feedback serio={serio} solved={solved} wrongs={wrongs} why={challenge.why} onShow={showReveal ? showAnswer : undefined} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Board
        fen={challenge.fen}
        orientation={challenge.orientation ?? 'white'}
        lastMove={null}
        checkSquare={null}
        movableColor={null}
        onSquareTap={tap}
        marks={marks}
      />
      <p className="font-semibold">{challenge.prompt}</p>
      {challenge.mode === 'all' && !solved && (
        <button type="button" className="btn-primary" disabled={picked.size === 0} onClick={confirmTap}>
          Listo{picked.size > 0 ? ` (${picked.size})` : ''}
        </button>
      )}
      <Feedback serio={serio} solved={solved} wrongs={wrongs} why={challenge.why} hint={flash ? (serio ? 'Incorrecto. Revisá la posición.' : 'Casi. Mirá otra vez.') : undefined} onShow={showReveal ? showAnswer : undefined} />
    </div>
  )
}

function Feedback({ serio, solved, wrongs, why, hint, onShow }: { serio: boolean; solved: boolean; wrongs: number; why: string; hint?: string; onShow?: () => void }) {
  return (
    <div aria-live="polite" className="flex flex-col gap-2">
      {solved ? (
        <p className="rounded-xl bg-surface p-3 text-sm">
          <span className="font-semibold text-accent">{serio ? 'Correcto. ' : wrongs === 0 ? '¡Eso! ' : '¡Ahora sí! '}</span>
          {why}
        </p>
      ) : (
        wrongs > 0 && <p className="text-sm text-red-500">{hint ?? (serio ? 'Incorrecto. Probá de nuevo.' : 'No es esa. Probá de nuevo.')}</p>
      )}
      {onShow && (
        <button type="button" className="btn" onClick={onShow}>
          {serio ? 'Ver la respuesta' : 'Mostrame la respuesta'}
        </button>
      )}
    </div>
  )
}
