import { useMemo, useState } from 'react'
import type { QuizItem } from '../../engine/repertoire'
import { Speak } from '../../ui/Speak'

/** Mezcla determinística por semilla (para que el orden no cambie en cada render). */
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

/** Preguntas de concepto de a una, con la explicación al responder. */
export function QuizView({ items }: { items: QuizItem[] }) {
  const [round, setRound] = useState(1)
  const order = useMemo(() => shuffled(items, round * 7919), [items, round])
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [right, setRight] = useState(0)
  const [finished, setFinished] = useState(false)

  if (items.length === 0) return null
  if (finished) {
    return (
      <div className="flex flex-col gap-2 rounded-xl bg-surface p-4 text-sm">
        <p className="font-semibold">
          {right} de {order.length} bien a la primera
        </p>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setRound((r) => r + 1)
            setI(0)
            setPicked(null)
            setRight(0)
            setFinished(false)
          }}
        >
          Otra vuelta
        </button>
      </div>
    )
  }
  const item = order[i]!
  const done = picked === item.answer
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-surface p-4 text-sm">
      <p className="text-xs text-muted">
        Pregunta {i + 1} de {order.length}
      </p>
      <p className="font-semibold">{item.q}</p>
      <div className="flex flex-col gap-2">
        {item.options.map((o, k) => (
          <button
            key={o}
            type="button"
            disabled={done}
            className={`min-h-12 rounded-xl border px-3 text-left ${done && k === item.answer ? 'border-accent bg-surface-2' : picked === k ? 'border-red-500' : 'border-border'}`}
            onClick={() => {
              if (picked === null && k === item.answer) setRight((r) => r + 1)
              setPicked(k)
            }}
          >
            {o}
          </button>
        ))}
      </div>
      {picked !== null && (
        <div className="flex flex-col gap-2" aria-live="polite">
          <p className={done ? 'text-accent' : 'text-red-500'}>{done ? '¡Correcto!' : 'No es esa. Probá otra.'}</p>
          {done && (
            <>
              <p>{item.why}</p>
              <Speak text={item.why} auto />
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  if (i + 1 >= order.length) setFinished(true)
                  else {
                    setI(i + 1)
                    setPicked(null)
                  }
                }}
              >
                {i + 1 >= order.length ? 'Terminar' : 'Siguiente'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
