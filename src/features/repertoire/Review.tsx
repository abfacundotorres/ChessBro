import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Board } from '../../ui/Board'
import { REPERTOIRE } from '../../content/repertoire'
import { ALL_CARDS, anyLineById } from '../../content/repertoireCards'
import { dueRepCards, reviewRepCard } from '../../data/repertoire'
import type { RepCard } from '../../data/db'
import { toDateStr } from '../../engine/dates'
import { sanToFigurine, tryMove, type MoveInput } from '../../engine/game'
import { StreakChip } from '../../ui/StreakChip'
import { useStyle } from '../../data/style'

export function ReviewRepertoire() {
  const [cards, setCards] = useState<RepCard[] | null>(null)
  useEffect(() => {
    let cancelled = false
    void dueRepCards(toDateStr(new Date())).then((list) => {
      if (!cancelled) setCards(list)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex flex-col gap-3">
      <header>
        <Link to="/repertorio" className="text-sm text-muted">
          ← Repertorio
        </Link>
        <h1 className="text-xl font-bold">Repaso del repertorio</h1>
      </header>
      {cards === null ? (
        <p className="py-16 text-center text-muted">Cargando…</p>
      ) : cards.length === 0 ? (
        <div className="flex flex-col gap-3 rounded-xl bg-surface p-5 text-center">
          <p className="text-lg font-semibold">Nada para repasar hoy</p>
          <p className="text-sm text-muted">Practicá una línea nueva y sus posiciones aparecen acá desde el día siguiente.</p>
          <Link to="/repertorio" className="btn-primary flex items-center justify-center">
            Ver el repertorio
          </Link>
        </div>
      ) : (
        <Session cards={cards} />
      )}
    </div>
  )
}

function Session({ cards }: { cards: RepCard[] }) {
  const [i, setI] = useState(0)
  const [right, setRight] = useState(0)
  const [failed, setFailed] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [solved, setSolved] = useState(false)
  const [ready, setReady] = useState<{ right: number } | null>(null)
  // El resultado de cada tarjeta se registra una sola vez: en el primer intento (acierto o error) o al pedir la respuesta.
  const recorded = useRef(false)
  const style = useStyle()

  const card = cards[i]
  const spec = useMemo(() => (card ? ALL_CARDS.find((c) => c.id === card.id) : undefined), [card])
  const line = spec ? anyLineById(spec.lineIds[0]!) : undefined
  const today = toDateStr(new Date())

  if (ready) {
    const total = cards.length
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl bg-surface p-5 text-center">
        {style === 'juego' && (
          <p className="text-4xl" aria-hidden="true">
            {ready.right === total ? '🏆' : '💪'}
          </p>
        )}
        <p className="text-lg font-semibold">Repaso terminado</p>
        <p className="text-sm text-muted">
          {ready.right} de {total} bien a la primera.
          {total - ready.right === 1 && ' La otra vuelve mañana.'}
          {total - ready.right > 1 && ` Las otras ${total - ready.right} vuelven mañana.`}
        </p>
        <StreakChip />
        <Link to="/repertorio" className="btn-primary flex w-full items-center justify-center">
          Listo
        </Link>
      </div>
    )
  }
  if (!card || !spec) return null

  function record(ok: boolean) {
    if (recorded.current || !card) return
    recorded.current = true
    void reviewRepCard(card.id, ok, today)
  }

  function onMove(m: MoveInput): boolean {
    if (solved || !card) return false
    if (!tryMove(card.fen, m)) return false
    if (`${m.from}${m.to}${m.promotion ?? ''}` === card.uci) {
      setSolved(true)
      if (!failed) setRight((r) => r + 1)
      record(true) // si ya había fallado, el registro ya quedó como fallo
      return true
    }
    setFailed(true)
    record(false)
    return false
  }

  function reveal() {
    setRevealed(true)
    setSolved(true)
    setFailed(true)
    record(false)
  }

  function next() {
    if (i + 1 >= cards.length) setReady({ right })
    else {
      setI(i + 1)
      recorded.current = false
      setFailed(false)
      setRevealed(false)
      setSolved(false)
    }
  }

  const note = line && spec ? line.notes?.[spec.history.length] : undefined
  const ply = spec.history.length

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          {i + 1} de {cards.length}
        </span>
        <span>{line?.name}</span>
      </div>
      <Board
        key={card.id}
        fen={card.fen}
        orientation={card.color === 'w' ? 'white' : 'black'}
        lastMove={spec.prev ? { from: spec.prev.from, to: spec.prev.to } : null}
        checkSquare={null}
        movableColor={solved ? null : card.color}
        onMove={onMove}
        arrows={revealed || solved ? [{ startSquare: card.uci.slice(0, 2), endSquare: card.uci.slice(2, 4), color: 'rgba(22, 163, 74, 0.85)' }] : undefined}
      />
      <p className={`text-center font-medium ${failed && !solved ? 'text-red-500' : solved && !failed ? 'text-accent' : ''}`} aria-live="polite">
        {solved
          ? revealed || failed
            ? `Era ${sanToFigurine(card.san)}. Vuelve mañana.`
            : '¡Bien!'
          : failed
            ? 'No es esa. Probá otra.'
            : spec.prev
              ? `Jugaron ${sanToFigurine(spec.prev.san)}. ¿Qué jugás?`
              : '¿Cuál es tu primera jugada?'}
      </p>
      {solved && (
        <div className="flex flex-col gap-2 rounded-xl bg-surface p-4 text-sm">
          <p className="font-mono">
            {Math.floor(ply / 2) + 1}
            {ply % 2 ? '…' : '.'} {sanToFigurine(card.san)}
          </p>
          {note && <p>{note}</p>}
          {!note && line && <p className="text-muted">{line.idea}</p>}
        </div>
      )}
      {solved ? (
        <button type="button" className="btn-primary" onClick={next}>
          {i + 1 >= cards.length ? 'Terminar' : 'Siguiente'}
        </button>
      ) : (
        <button type="button" className="btn" onClick={reveal}>
          Ver la respuesta
        </button>
      )}
      <p className="text-center text-xs text-muted">Hay {REPERTOIRE.length} líneas en tu repertorio. Fallar no es grave: la posición vuelve mañana.</p>
    </div>
  )
}
