import { useCallback, useMemo, useState } from 'react'
import { Board } from '../../ui/Board'
import { Speak } from '../../ui/Speak'
import type { DrillItem } from '../../engine/repertoire'
import { sanToFigurine, tryMove, type MoveInput } from '../../engine/game'
import { reviewRepCard } from '../../data/repertoire'
import { toDateStr } from '../../engine/dates'

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

const SIZE = 10

/**
 * "¿Qué jugás acá?": posiciones sueltas de las líneas de la apertura. Si fallás, avisa y da pistas; al acertar explica por qué.
 * Lo que fallás vuelve en el repaso (si esa posición ya estaba en tu repaso).
 */
export function Drill({ items, size = SIZE, onDone, doneLabel }: { items: DrillItem[]; size?: number; onDone?: () => void; doneLabel?: string }) {
  const [round, setRound] = useState(1)
  const set = useMemo(() => shuffled(items, round * 104729).slice(0, size), [items, round, size])
  const [i, setI] = useState(0)
  const [wrong, setWrong] = useState(0) // errores en esta posición
  const [hint, setHint] = useState<'none' | 'square' | 'move'>('none')
  const [solved, setSolved] = useState(false)
  const [clean, setClean] = useState(0) // aciertos a la primera
  const [finished, setFinished] = useState(false)

  const item = set[i]
  const fail = useCallback((it: DrillItem) => {
    void reviewRepCard(it.cardId, false, toDateStr(new Date())).catch(() => undefined) // si no estaba en el repaso, no pasa nada
  }, [])

  const onMove = useCallback(
    (m: MoveInput): boolean => {
      if (!item || solved || !tryMove(item.fen, m)) return false
      if (`${m.from}${m.to}${m.promotion ?? ''}` === item.uci) {
        setSolved(true)
        if (wrong === 0 && hint === 'none') setClean((c) => c + 1)
        return true
      }
      if (wrong === 0) fail(item)
      setWrong((w) => w + 1)
      return false
    },
    [item, solved, wrong, hint, fail],
  )

  if (!item && !finished) return null
  if (finished) {
    return (
      <div className="flex flex-col gap-2 rounded-xl bg-surface p-4 text-sm">
        <p className="text-lg font-semibold">
          {clean} de {set.length} a la primera
        </p>
        <p className="text-muted">Las que fallaste vuelven en tu repaso del repertorio.</p>
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
            setHint('none')
            setSolved(false)
            setClean(0)
            setFinished(false)
          }}
        >
          Otra tanda
        </button>
      </div>
    )
  }
  const it = item!
  const from = it.uci.slice(0, 2)
  const to = it.uci.slice(2, 4)
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted">
        Posición {i + 1} de {set.length} · jugás con {it.color === 'w' ? 'blancas' : 'negras'}
      </p>
      <Board
        fen={it.fen}
        orientation={it.color === 'w' ? 'white' : 'black'}
        lastMove={it.prev ? { from: it.prev.from, to: it.prev.to } : null}
        checkSquare={null}
        movableColor={solved ? null : it.color}
        onMove={onMove}
        highlights={hint !== 'none' && !solved ? [from] : []}
        arrows={hint === 'move' || solved ? [{ startSquare: from, endSquare: to, color: 'rgba(22, 163, 74, 0.85)' }] : undefined}
      />
      <p className={`text-center font-medium ${solved ? 'text-accent' : wrong > 0 ? 'text-red-500' : ''}`} aria-live="polite">
        {solved ? `¡Eso! ${sanToFigurine(it.san)}` : wrong > 0 ? 'No es esa. Probá otra.' : `¿Qué jugás acá?${it.prev ? ` (el rival jugó ${sanToFigurine(it.prev.san)})` : ''}`}
      </p>
      {solved ? (
        <div className="flex flex-col gap-2 rounded-xl bg-surface p-4 text-sm">
          <p>{it.why}</p>
          <Speak text={it.why} auto />
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              if (i + 1 >= set.length) setFinished(true)
              else {
                setI(i + 1)
                setWrong(0)
                setHint('none')
                setSolved(false)
              }
            }}
          >
            {i + 1 >= set.length ? 'Terminar' : 'Siguiente'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="btn"
            disabled={hint !== 'none'}
            onClick={() => {
              if (wrong === 0) fail(it)
              setHint('square')
            }}
          >
            Pista
          </button>
          <button
            type="button"
            className="btn"
            disabled={hint === 'move'}
            onClick={() => {
              if (wrong === 0 && hint === 'none') fail(it)
              setHint('move')
            }}
          >
            Ver jugada
          </button>
        </div>
      )}
    </div>
  )
}
