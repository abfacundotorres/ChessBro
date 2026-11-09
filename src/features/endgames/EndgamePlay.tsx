import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Board } from '../../ui/Board'
import { endgameById } from '../../content/endgames'
import { judgeEndgame, type EndgameDef } from '../../engine/endgame'
import { checkSquareOf, replay, tryMove, type MoveInput } from '../../engine/game'
import { uciToMove } from '../../engine/puzzle'
import { toDateStr } from '../../engine/dates'
import { getEngine } from '../../lib/stockfish'
import { saveEndgameResult } from '../../data/lessons'
import { MoveList } from '../../ui/MoveList'

const DEPTH = 10

export function EndgamePlay() {
  const { id = '' } = useParams()
  const def = endgameById(id)
  if (!def) {
    return (
      <p>
        No encontré ese final. <Link to="/lecciones" className="underline">Volver</Link>
      </p>
    )
  }
  return <Game key={def.id} def={def} />
}

function Game({ def }: { def: EndgameDef }) {
  const [moves, setMoves] = useState<MoveInput[]>([])
  const [busy, setBusy] = useState(false)
  const [hints, setHints] = useState(0)
  const [hintMove, setHintMove] = useState<{ from: string; to: string } | null>(null)
  const [error, setError] = useState(false)
  const [round, setRound] = useState(0)
  const saved = useRef(false)

  const view = useMemo(() => replay(def.fen, moves), [def.fen, moves])
  const startsWithUser = def.fen.split(' ')[1] === def.user
  // Jugadas del usuario hechas: si empieza el usuario, las pares (0,2,…); si no, las impares.
  const userMoves = startsWithUser ? Math.ceil(moves.length / 2) : Math.floor(moves.length / 2)
  const verdict = judgeEndgame(def, view, userMoves)
  const over = verdict.state !== 'playing'
  const userTurn = view.turn === def.user
  // El motor piensa mientras le toca mover, o mientras calcula una pista.
  const thinking = busy || (!over && !userTurn)

  // Respuesta del motor.
  useEffect(() => {
    if (over || userTurn) return
    let cancelled = false
    getEngine()
      .evaluate(view.fen, DEPTH)
      .then((ev) => {
        if (cancelled || !ev.best) return
        const m = tryMove(view.fen, uciToMove(ev.best))
        if (m) setTimeout(() => !cancelled && setMoves((prev) => [...prev, uciToMove(ev.best!)]), 350)
      })
      .catch(() => !cancelled && setError(true))
    return () => {
      cancelled = true
    }
  }, [view.fen, over, userTurn, round])

  // Guardar el resultado una sola vez.
  useEffect(() => {
    if (!over || saved.current) return
    saved.current = true
    void saveEndgameResult({
      endgameId: def.id,
      ts: Date.now(),
      date: toDateStr(new Date()),
      success: verdict.state === 'won',
      moves: userMoves,
      hints,
    })
  }, [over, verdict.state, def.id, userMoves, hints])

  const onMove = useCallback(
    (m: MoveInput): boolean => {
      if (over || !userTurn || thinking) return false
      if (!tryMove(view.fen, m)) return false
      setHintMove(null)
      setMoves((prev) => [...prev, m])
      return true
    },
    [over, userTurn, thinking, view.fen],
  )

  async function askHint() {
    if (over || !userTurn || thinking) return
    setBusy(true)
    try {
      const ev = await getEngine().evaluate(view.fen, 12)
      if (ev.best) {
        setHintMove({ from: ev.best.slice(0, 2), to: ev.best.slice(2, 4) })
        setHints((h) => h + 1)
      }
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  function restart() {
    setMoves([])
    setHints(0)
    setHintMove(null)
    setError(false)
    saved.current = false
    setRound((r) => r + 1)
  }

  const remaining = Math.max(0, def.maxMoves - userMoves)

  return (
    <div className="flex flex-col gap-3">
      <header>
        <Link to="/lecciones" className="text-sm text-muted">
          ← Lecciones
        </Link>
        <h1 className="text-xl font-bold">{def.title}</h1>
        <p className="text-sm text-muted">
          {def.goal === 'mate' ? `Dá mate en ${def.maxMoves} jugadas o menos` : `Salvá las tablas (${def.maxMoves} jugadas)`} · te quedan {remaining}
        </p>
      </header>

      <Board
        fen={view.fen}
        orientation={def.user === 'w' ? 'white' : 'black'}
        lastMove={view.lastMove}
        checkSquare={checkSquareOf(view.fen)}
        movableColor={over || thinking || !userTurn ? null : def.user}
        onMove={onMove}
        arrows={hintMove ? [{ startSquare: hintMove.from, endSquare: hintMove.to, color: 'rgba(36, 120, 255, 0.85)' }] : undefined}
      />

      <p
        className={`text-center font-medium ${verdict.state === 'won' ? 'text-accent' : verdict.state === 'lost' ? 'text-red-500' : ''}`}
        aria-live="polite"
      >
        {error ? 'No se pudo cargar el motor.' : over ? verdict.message : thinking ? 'El motor piensa…' : 'Tu turno.'}
      </p>
      {over && verdict.state === 'won' && hints > 0 && <p className="text-center text-sm text-muted">Con pistas no cuenta para tu progreso.</p>}

      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn" disabled={over || thinking || !userTurn} onClick={() => void askHint()}>
          Pista{hints > 0 ? ` (${hints})` : ''}
        </button>
        <button type="button" className="btn" onClick={restart}>
          {over ? 'Jugar de nuevo' : 'Reiniciar'}
        </button>
      </div>

      {!over && (
        <ul className="flex flex-col gap-1 rounded-xl bg-surface p-3 text-sm text-muted">
          {def.tips.map((t) => (
            <li key={t}>• {t}</li>
          ))}
        </ul>
      )}
      <MoveList startFen={def.fen} moves={view.moves} />
    </div>
  )
}
