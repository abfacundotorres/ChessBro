import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Board } from '../../ui/Board'
import { Speak } from '../../ui/Speak'
import type { RepLine } from '../../engine/repertoire'
import { replay, sanToFigurine, tryMove, type Color, type MoveInput } from '../../engine/game'
import { choices, isMyTurn, lineFor, noteOf, pickRival, type Choice } from '../../engine/sparring'
import { uciToMove } from '../../engine/puzzle'
import { markLinePracticed } from '../../data/repertoire'
import { ALL_CARDS } from '../../content/repertoireCards'
import { toDateStr } from '../../engine/dates'

interface Played extends Choice {
  /** El rival tenía más de una jugada posible acá (se desvió de otra línea). */
  branch: boolean
}

/**
 * Jugás tus jugadas de la apertura y el rival responde solo; a veces elige otra variante y tenés que reaccionar.
 * Una nota corta explica cada jugada, la tuya y la del rival.
 */
export function Sparring({ lines, color, onDone, doneLabel }: { lines: RepLine[]; color: Color; onDone?: () => void; doneLabel?: string }) {
  const [moves, setMoves] = useState<Played[]>([])
  const [mistakes, setMistakes] = useState(0)
  const [wrong, setWrong] = useState(false)
  const [hint, setHint] = useState<'none' | 'square' | 'move'>('none')
  const [result, setResult] = useState<{ line: RepLine; newCards: number } | null>(null)
  const lastBranch = useRef<Map<string, string>>(new Map())
  const saved = useRef(false)

  const played = useMemo(() => moves.map((m) => m.san), [moves])
  const view = useMemo(() => replay('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', moves.map((m) => uciToMove(m.uci))), [moves])
  const options = useMemo(() => choices(lines, played), [lines, played])
  const done = options.length === 0
  const myTurn = !done && isMyTurn(color, played)
  const next = myTurn ? options[0] : undefined

  // Turno del rival: espera un momento y elige una rama (evita repetir la anterior en ese mismo punto).
  useEffect(() => {
    if (done || myTurn) return
    const t = setTimeout(() => {
      const key = played.join(' ')
      const pick = pickRival(options, Math.random, lastBranch.current.get(key))
      if (!pick) return
      lastBranch.current.set(key, pick.san)
      setMoves((m) => [...m, { ...pick, branch: options.length > 1 }])
    }, played.length === 0 ? 500 : 750)
    return () => clearTimeout(t)
  }, [done, myTurn, options, played])

  // Al terminar: la línea queda practicada (sus posiciones entran al repaso).
  useEffect(() => {
    if (!done || saved.current || moves.length === 0) return
    const line = lineFor(lines, played)
    if (!line) return
    saved.current = true
    void markLinePracticed(line, ALL_CARDS, toDateStr(new Date())).then((r) => setResult({ line, newCards: r.newCards }))
  }, [done, lines, played, moves.length])

  const onMove = useCallback(
    (m: MoveInput): boolean => {
      if (!next || !tryMove(view.fen, m)) return false
      if (`${m.from}${m.to}${m.promotion ?? ''}` !== next.uci) {
        setWrong(true)
        setMistakes((x) => x + 1)
        return false
      }
      setWrong(false)
      setHint('none')
      setMoves((list) => [...list, { ...next, branch: false }])
      return true
    },
    [next, view.fen],
  )

  const last = moves.at(-1)
  const note = noteOf(lines, played)
  const lastLine = last?.branch && isMyTurn(color, played) ? lineFor(lines, played) : undefined

  function restart() {
    setMoves([])
    setMistakes(0)
    setWrong(false)
    setHint('none')
    setResult(null)
    saved.current = false
  }

  const status = done
    ? mistakes === 0
      ? '¡Línea completa y sin errores!'
      : `¡Línea completa! ${mistakes} ${mistakes === 1 ? 'error' : 'errores'}.`
    : wrong
      ? 'No es la jugada de la línea. Probá otra.'
      : myTurn
        ? played.length === 0
          ? 'Empezás vos.'
          : 'Tu turno.'
        : 'Juega el rival…'

  return (
    <div className="flex flex-col gap-3">
      <Board
        fen={view.fen}
        orientation={color === 'w' ? 'white' : 'black'}
        lastMove={view.lastMove}
        checkSquare={view.checkSquare}
        movableColor={myTurn ? color : null}
        onMove={onMove}
        highlights={hint !== 'none' && next ? [next.uci.slice(0, 2)] : []}
        arrows={hint === 'move' && next ? [{ startSquare: next.uci.slice(0, 2), endSquare: next.uci.slice(2, 4), color: 'rgba(36, 120, 255, 0.85)' }] : undefined}
      />
      <p className={`text-center font-medium ${wrong ? 'text-red-500' : done ? 'text-accent' : ''}`} aria-live="polite">
        {status}
      </p>
      {lastLine && (
        <p className="rounded-xl bg-surface-2 px-3 py-2 text-center text-sm">
          El rival eligió otra variante: <span className="font-semibold">{lastLine.name}</span>
        </p>
      )}
      {last && note && (
        <div className="flex items-start gap-2 rounded-xl border border-accent p-3 text-sm" aria-live="polite">
          <p className="min-w-0 flex-1">
            <span className="font-mono font-semibold">{sanToFigurine(last.san)}</span> · {note}
          </p>
          <Speak text={note} auto className="shrink-0" />
        </div>
      )}
      {done ? (
        <div className="flex flex-col gap-2 rounded-xl bg-surface p-4 text-sm">
          {result && <p>{result.newCards > 0 ? `Sumaste ${result.newCards} ${result.newCards === 1 ? 'posición' : 'posiciones'} al repaso.` : 'Esas posiciones ya estaban en tu repaso.'}</p>}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="btn" onClick={restart}>
              Otra vez (rival distinto)
            </button>
            {onDone && (
              <button type="button" className="btn-primary" onClick={onDone}>
                {doneLabel ?? 'Siguiente'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn" disabled={!myTurn || hint !== 'none'} onClick={() => setHint('square')}>
            Pista
          </button>
          <button type="button" className="btn" disabled={!myTurn || hint === 'move'} onClick={() => setHint('move')}>
            Ver jugada
          </button>
        </div>
      )}
    </div>
  )
}
