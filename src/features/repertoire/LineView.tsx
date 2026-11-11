import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Board } from '../../ui/Board'
import { MoveList } from '../../ui/MoveList'
import { ALL_CARDS, anyLineById } from '../../content/repertoireCards'
import { markLinePracticed } from '../../data/repertoire'
import { toDateStr } from '../../engine/dates'
import { replay, sanToFigurine, type MoveInput } from '../../engine/game'
import { lineSteps, type RepLine } from '../../engine/repertoire'
import { uciToMove } from '../../engine/puzzle'
import { Speak } from '../../ui/Speak'
import { LineProgress, NoteCard, moveArrow } from '../../ui/NoteCard'
import { QuizView } from '../openings/QuizView'
import { openingById } from '../../content/openings'

/** Reinicia el estado al cambiar de línea. */
export function LineView() {
  const { id = '' } = useParams()
  const line = anyLineById(id)
  if (!line) {
    return (
      <p>
        No encontré esa línea. <Link to="/repertorio" className="underline">Volver</Link>
      </p>
    )
  }
  return <Body key={line.id} line={line} />
}

function Body({ line }: { line: RepLine }) {
  const [mode, setMode] = useState<'study' | 'practice'>('study')
  return (
    <div className="flex flex-col gap-3">
      <header>
        <Link to={line.opening ? `/aperturas/${line.opening}` : '/repertorio'} className="text-sm text-muted">
          ← {line.opening ? (openingById(line.opening)?.name ?? 'Aperturas') : 'Repertorio'}
        </Link>
        <h1 className="text-xl font-bold">{line.name}</h1>
        <p className="text-sm text-muted">{line.group}</p>
      </header>
      <div className="grid grid-cols-2 gap-2" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'study'} className={mode === 'study' ? 'btn-primary' : 'btn'} onClick={() => setMode('study')}>
          Estudiar
        </button>
        <button type="button" role="tab" aria-selected={mode === 'practice'} className={mode === 'practice' ? 'btn-primary' : 'btn'} onClick={() => setMode('practice')}>
          Practicar
        </button>
      </div>
      {mode === 'study' ? <Study line={line} onPractice={() => setMode('practice')} /> : <Practice line={line} />}
    </div>
  )
}

function Study({ line, onPractice }: { line: RepLine; onPractice: () => void }) {
  const steps = useMemo(() => lineSteps(line), [line])
  const [i, setI] = useState(0) // jugadas mostradas
  const view = useMemo(() => replay(steps[0]!.fenBefore, steps.slice(0, i).map((s) => uciToMove(s.uci))), [steps, i])
  const cur = i > 0 ? steps[i - 1]! : null
  const note = cur ? line.notes?.[cur.ply] : undefined

  return (
    <div className="flex flex-col gap-3">
      <Board
        fen={view.fen}
        orientation={line.color === 'w' ? 'white' : 'black'}
        lastMove={view.lastMove}
        checkSquare={view.checkSquare}
        movableColor={null}
        arrows={cur ? [moveArrow(cur.from, cur.to, cur.mine)] : undefined}
      />
      <LineProgress steps={steps} done={i} />
      <p className="min-h-6 text-center text-sm" aria-live="polite">
        {cur ? (
          <>
            <span className="font-mono font-semibold">
              {Math.floor(cur.ply / 2) + 1}
              {cur.ply % 2 ? '…' : '.'} {sanToFigurine(cur.san)}
            </span>
            <span className="text-muted"> {cur.mine ? '· tu jugada' : '· del rival'}</span>
          </>
        ) : (
          <span className="text-muted">Posición inicial</span>
        )}
      </p>
      {cur && note && <NoteCard ply={cur.ply} san={cur.san} mine={cur.mine} note={note} />}
      <div className="grid grid-cols-4 gap-2">
        <button type="button" className="btn" aria-label="Inicio" disabled={i === 0} onClick={() => setI(0)}>
          ⏮
        </button>
        <button type="button" className="btn" aria-label="Anterior" disabled={i === 0} onClick={() => setI(i - 1)}>
          ◀
        </button>
        <button type="button" className="btn" aria-label="Siguiente" disabled={i === steps.length} onClick={() => setI(i + 1)}>
          ▶
        </button>
        <button type="button" className="btn" aria-label="Final" disabled={i === steps.length} onClick={() => setI(steps.length)}>
          ⏭
        </button>
      </div>
      <MoveList startFen={steps[0]!.fenBefore} moves={view.moves} />
      <details className="rounded-xl bg-surface p-4 text-sm">
        <summary className="cursor-pointer font-semibold">La idea y el plan</summary>
        <p className="mt-2">{line.idea}</p>
        <Speak className="mt-2" text={line.idea} />
        <ul className="mt-2 list-disc pl-5">
          {line.plan.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </details>
      {line.quiz && line.quiz.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-semibold">Preguntas</h2>
          <QuizView items={line.quiz} />
        </section>
      )}
      <button type="button" className="btn-primary" onClick={onPractice}>
        Practicarla
      </button>
    </div>
  )
}

function Practice({ line }: { line: RepLine }) {
  const steps = useMemo(() => lineSteps(line), [line])
  const [k, setK] = useState(0) // jugadas ya hechas
  const [mistakes, setMistakes] = useState(0)
  const [hint, setHint] = useState<'none' | 'square' | 'move'>('none')
  const [wrong, setWrong] = useState(false)
  const [result, setResult] = useState<{ newCards: number } | null>(null)
  const saved = useRef(false)

  const done = k >= steps.length
  const next = steps[k]
  const fen = k === 0 ? steps[0]!.fenBefore : steps[k - 1]!.fenAfter
  const last = k > 0 ? steps[k - 1]! : null
  const myTurn = !done && next?.mine === true

  // El rival juega solo, con un pequeño retraso para que se vea.
  useEffect(() => {
    if (done || myTurn) return
    const t = setTimeout(() => setK((n) => n + 1), k === 0 ? 500 : 650)
    return () => clearTimeout(t)
  }, [k, done, myTurn])

  // Al terminar, se guarda (una sola vez) y se crean las tarjetas de repaso.
  useEffect(() => {
    if (!done || saved.current) return
    saved.current = true
    void markLinePracticed(line, ALL_CARDS, toDateStr(new Date())).then(setResult)
  }, [done, line])

  const onMove = useCallback(
    (m: MoveInput): boolean => {
      if (!myTurn || !next) return false
      if (`${m.from}${m.to}${m.promotion ?? ''}` !== next.uci) {
        setWrong(true)
        setMistakes((x) => x + 1)
        return false
      }
      setWrong(false)
      setHint('none')
      setK((n) => n + 1)
      return true
    },
    [myTurn, next],
  )

  function restart() {
    setK(0)
    setMistakes(0)
    setHint('none')
    setWrong(false)
    setResult(null)
    saved.current = false
  }

  const view = replay(steps[0]!.fenBefore, steps.slice(0, k).map((s) => uciToMove(s.uci)))

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">Jugá tus jugadas; el rival responde solo.</p>
      <Board
        fen={fen}
        orientation={line.color === 'w' ? 'white' : 'black'}
        lastMove={last ? { from: last.from, to: last.to } : null}
        checkSquare={view.checkSquare}
        movableColor={myTurn ? line.color : null}
        onMove={onMove}
        highlights={hint !== 'none' && next ? [next.from] : []}
        arrows={
          hint === 'move' && next
            ? [{ startSquare: next.from, endSquare: next.to, color: 'rgba(36, 120, 255, 0.85)' }]
            : last
              ? [moveArrow(last.from, last.to, last.mine)]
              : undefined
        }
      />
      <LineProgress steps={steps} done={k} />
      {last && line.notes?.[k - 1] && <NoteCard ply={last.ply} san={last.san} mine={last.mine} note={line.notes[k - 1]!} />}
      <p className={`text-center font-medium ${wrong ? 'text-red-500' : done ? 'text-accent' : ''}`} aria-live="polite">
        {done
          ? mistakes === 0
            ? '¡Línea completa y sin errores!'
            : `¡Línea completa! Tuviste ${mistakes} ${mistakes === 1 ? 'error' : 'errores'}.`
          : wrong
            ? 'No es la jugada de la línea. Probá otra.'
            : myTurn
              ? 'Tu turno.'
              : 'Juega el rival…'}
      </p>
      {done ? (
        <div className="flex flex-col gap-2 rounded-xl bg-surface p-4 text-sm">
          <p>
            {result && result.newCards > 0
              ? `Sumaste ${result.newCards} ${result.newCards === 1 ? 'posición' : 'posiciones'} al repaso: aparecen desde mañana.`
              : 'Estas posiciones ya están en tu repaso.'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="btn" onClick={restart}>
              Otra vez
            </button>
            <Link to={line.opening ? `/aperturas/${line.opening}` : '/repertorio'} className="btn-primary flex items-center justify-center">
              {line.opening ? 'Volver a la apertura' : 'Repertorio'}
            </Link>
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
