import { sanToFigurine } from '../engine/game'
import { moveTags } from '../engine/moveTags'
import { Speak } from './Speak'

/** Flecha de la última jugada: pizarra oscura si fue tuya, naranja si fue del rival (contrastan con el tablero verde). */
export function moveArrow(from: string, to: string, mine: boolean) {
  return { startSquare: from, endSquare: to, color: mine ? 'rgba(30, 40, 60, 0.85)' : 'rgba(234, 88, 12, 0.9)' }
}

interface NoteCardProps {
  ply: number
  san: string
  mine: boolean
  note: string
}

/** La nota de una jugada: quién la hizo, etiquetas (jaque, captura…) y el porqué. Aparece con una entrada corta. */
export function NoteCard({ ply, san, mine, note }: NoteCardProps) {
  const tags = moveTags(san)
  return (
    <div
      key={ply}
      className={`note-in flex items-start gap-2 rounded-xl border-l-4 bg-surface p-3 text-sm ${mine ? 'border-accent' : 'border-rival'}`}
      aria-live="polite"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono font-semibold">
            {Math.floor(ply / 2) + 1}
            {ply % 2 ? '…' : '.'} {sanToFigurine(san)}
          </span>
          <span className={`text-xs font-semibold ${mine ? 'text-accent' : 'text-rival'}`}>{mine ? 'Tu jugada' : 'Rival'}</span>
          {tags.map((t) => (
            <span key={t} className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium">
              {t}
            </span>
          ))}
        </div>
        <p className="text-[15px] leading-snug">{note}</p>
      </div>
      <Speak text={note} auto className="shrink-0" />
    </div>
  )
}

/** Avance por la línea: un segmento por jugada (verde las tuyas, ámbar las del rival). Los jugados se ven llenos. */
export function LineProgress({ steps, done }: { steps: readonly { mine: boolean }[]; done: number }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`Jugada ${done} de ${steps.length}`}>
      {steps.map((s, i) => (
        <span
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-opacity ${s.mine ? 'bg-accent' : 'bg-rival'} ${i < done ? 'opacity-100' : 'opacity-25'}`}
        />
      ))}
    </div>
  )
}
