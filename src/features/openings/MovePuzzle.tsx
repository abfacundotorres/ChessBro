import { useCallback, useMemo, useState } from 'react'
import { Board } from '../../ui/Board'
import { Speak } from '../../ui/Speak'
import type { PuzzleItem } from '../../content/openingExtras'
import { sanToFigurine, tryMove, type MoveInput } from '../../engine/game'

function shuffled<T>(list: readonly T[], seed: number): T[] {
  const a = [...list]
  let s = seed || 1
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 4294967296
    const j = s % (i + 1)
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

const LABEL: Record<PuzzleItem['kind'], string> = { plan: 'Plan del medio juego', punish: 'El rival se equivocó' }

/** Ejercicios de una jugada con una idea detrás (plan o castigo). Acepta las jugadas alternativas que el motor también aprueba. */
export function MovePuzzle({ items, size, onDone, doneLabel }: { items: PuzzleItem[]; size?: number; onDone?: () => void; doneLabel?: string }) {
  const [round, setRound] = useState(1)
  const set = useMemo(() => shuffled(items, round * 15485863).slice(0, size ?? items.length), [items, round, size])
  const [i, setI] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [hint, setHint] = useState(false)
  const [played, setPlayed] = useState<string | null>(null) // SAN aceptado
  const [clean, setClean] = useState(0)
  const [finished, setFinished] = useState(false)
  const item = set[i]

  const onMove = useCallback(
    (m: MoveInput): boolean => {
      if (!item || played) return false
      const mv = tryMove(item.fen, m)
      if (!mv) return false
      const uci = `${m.from}${m.to}${m.promotion ?? ''}`
      if (uci === item.uci || item.alt.includes(uci)) {
        setPlayed(mv.san)
        if (wrong === 0 && !hint) setClean((c) => c + 1)
        return true
      }
      setWrong((w) => w + 1)
      return false
    },
    [item, played, wrong, hint],
  )

  if (!item) return null
  if (finished) {
    return (
      <div className="flex flex-col gap-2 rounded-xl bg-surface p-4 text-sm">
        <p className="text-lg font-semibold">
          {clean} de {set.length} a la primera
        </p>
        {onDone && (
          <button type="button" className="btn-primary" onClick={onDone}>
            {doneLabel ?? 'Siguiente'}
          </button>
        )}
        <button
          type="button"
          className={onDone ? 'btn' : 'btn-primary'}
          onClick={() => {
            setRound((r) => r + 1)
            setI(0)
            setWrong(0)
            setHint(false)
            setPlayed(null)
            setClean(0)
            setFinished(false)
          }}
        >
          Otra tanda
        </button>
      </div>
    )
  }
  const solved = played !== null
  const altPlayed = solved && played !== item.san
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted">
        {LABEL[item.kind]} · {i + 1} de {set.length} · jugás con {item.color === 'w' ? 'blancas' : 'negras'}
      </p>
      <p className="font-semibold">{item.title}</p>
      <Board
        fen={item.fen}
        orientation={item.color === 'w' ? 'white' : 'black'}
        lastMove={item.prev ? { from: item.prev.from, to: item.prev.to } : null}
        checkSquare={null}
        movableColor={solved ? null : item.color}
        onMove={onMove}
        highlights={hint && !solved ? [item.uci.slice(0, 2)] : []}
        arrows={solved ? [{ startSquare: item.uci.slice(0, 2), endSquare: item.uci.slice(2, 4), color: 'rgba(22, 163, 74, 0.85)' }] : undefined}
      />
      <p className={`text-center font-medium ${solved ? 'text-accent' : wrong > 0 ? 'text-red-500' : ''}`} aria-live="polite">
        {solved ? (altPlayed ? `Vale ${sanToFigurine(played)}. La idea principal era ${sanToFigurine(item.san)}.` : `¡Eso! ${sanToFigurine(item.san)}`) : wrong > 0 ? 'No es esa. Probá otra.' : item.prompt}
      </p>
      {solved ? (
        <div className="flex flex-col gap-2 rounded-xl bg-surface p-4 text-sm">
          <p>{item.why}</p>
          <Speak text={item.why} auto />
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              if (i + 1 >= set.length) setFinished(true)
              else {
                setI(i + 1)
                setWrong(0)
                setHint(false)
                setPlayed(null)
              }
            }}
          >
            {i + 1 >= set.length ? 'Terminar' : 'Siguiente'}
          </button>
        </div>
      ) : (
        <button type="button" className="btn" disabled={hint} onClick={() => setHint(true)}>
          Pista
        </button>
      )}
    </div>
  )
}
