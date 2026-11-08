import { useMemo, useState, type CSSProperties } from 'react'
import { Chessboard, defaultPieces } from 'react-chessboard'
import {
  legalTargets,
  needsPromotion,
  pieceColorAt,
  type Color,
  type MoveInput,
  type PromoPiece,
} from '../engine/game'

interface BoardProps {
  fen: string
  orientation?: 'white' | 'black'
  lastMove?: { from: string; to: string } | null
  checkSquare?: string | null
  /** Bando que el usuario puede mover; null = ninguno (tablero de solo lectura). */
  movableColor?: Color | 'both' | null
  /** Devuelve true si la jugada fue aceptada. */
  onMove?: (move: MoveInput) => boolean
}

const LIGHT = '#dee3e6'
const DARK = '#8ca2ad'
const LAST_MOVE: CSSProperties = { backgroundColor: 'rgba(155, 199, 0, 0.41)' }
const SELECTED: CSSProperties = { backgroundColor: 'rgba(20, 85, 30, 0.5)' }
const TARGET_EMPTY: CSSProperties = {
  background: 'radial-gradient(rgba(20, 85, 30, 0.5) 22%, transparent 24%)',
}
const TARGET_CAPTURE: CSSProperties = {
  background: 'radial-gradient(transparent 0%, transparent 78%, rgba(20, 85, 30, 0.45) 80%)',
}
const CHECK: CSSProperties = {
  background: 'radial-gradient(rgba(255, 0, 0, 0.9) 0%, rgba(231, 0, 0, 0.5) 40%, transparent 72%)',
}

const PROMO_ORDER: PromoPiece[] = ['q', 'n', 'r', 'b']
const PROMO_NAMES: Record<PromoPiece, string> = { q: 'Dama', n: 'Caballo', r: 'Torre', b: 'Alfil' }

function turnOf(fen: string): Color {
  return fen.split(' ')[1] === 'b' ? 'b' : 'w'
}

export function Board({ fen, orientation = 'white', lastMove, checkSquare, movableColor = 'both', onMove }: BoardProps) {
  const [selected, setSelected] = useState<{ fen: string; square: string } | null>(null)
  const [promo, setPromo] = useState<{ fen: string; from: string; to: string } | null>(null)

  // La selección y la coronación pendiente se invalidan solas si cambia la posición.
  const sel = selected?.fen === fen ? selected.square : null
  const pendingPromo = promo?.fen === fen ? promo : null

  const turn = turnOf(fen)
  const canMove = onMove !== undefined && (movableColor === 'both' || movableColor === turn)
  const targets = useMemo(() => (sel ? legalTargets(fen, sel) : []), [fen, sel])

  function attempt(from: string, to: string): boolean {
    if (!onMove) return false
    if (needsPromotion(fen, from, to)) {
      setPromo({ fen, from, to })
      return false
    }
    const ok = onMove({ from, to })
    setSelected(null)
    return ok
  }

  function onSquareClick(square: string) {
    if (!canMove || pendingPromo) return
    if (sel && targets.includes(square)) {
      attempt(sel, square)
      return
    }
    if (sel === square) {
      setSelected(null)
      return
    }
    setSelected(pieceColorAt(fen, square) === turn ? { fen, square } : null)
  }

  function choosePromotion(p: PromoPiece) {
    if (!pendingPromo || !onMove) return
    onMove({ from: pendingPromo.from, to: pendingPromo.to, promotion: p })
    setPromo(null)
    setSelected(null)
  }

  const squareStyles: Record<string, CSSProperties> = {}
  if (lastMove) {
    squareStyles[lastMove.from] = LAST_MOVE
    squareStyles[lastMove.to] = LAST_MOVE
  }
  if (checkSquare) squareStyles[checkSquare] = { ...squareStyles[checkSquare], ...CHECK }
  if (sel) squareStyles[sel] = SELECTED
  for (const t of targets) {
    const occupied = pieceColorAt(fen, t) !== null
    squareStyles[t] = { ...squareStyles[t], ...(occupied ? TARGET_CAPTURE : TARGET_EMPTY) }
  }

  return (
    <div className="relative w-full select-none" style={{ touchAction: 'none' }}>
      <Chessboard
        options={{
          position: fen,
          boardOrientation: orientation,
          lightSquareStyle: { backgroundColor: LIGHT },
          darkSquareStyle: { backgroundColor: DARK },
          squareStyles,
          allowDragging: canMove && !pendingPromo,
          canDragPiece: ({ piece }) => canMove && piece.pieceType[0] === turn,
          animationDurationInMs: 150,
          onSquareClick: ({ square }) => onSquareClick(square),
          onPieceDrag: ({ square }) => {
            if (square) setSelected({ fen, square })
          },
          onPieceDrop: ({ sourceSquare, targetSquare }) => {
            if (!targetSquare || sourceSquare === targetSquare) return false
            return attempt(sourceSquare, targetSquare)
          },
        }}
      />
      {pendingPromo && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/50"
          onClick={() => setPromo(null)}
        >
          <div
            className="flex gap-2 rounded-2xl bg-surface p-3 shadow-xl"
            role="dialog"
            aria-label="Elegí la pieza para coronar"
            onClick={(e) => e.stopPropagation()}
          >
            {PROMO_ORDER.map((p) => {
              const render = defaultPieces[`${turn}${p.toUpperCase()}`]
              return (
                <button
                  key={p}
                  type="button"
                  aria-label={PROMO_NAMES[p]}
                  className="size-16 rounded-xl bg-surface-2 p-1 active:scale-95"
                  onClick={() => choosePromotion(p)}
                >
                  {render?.()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
