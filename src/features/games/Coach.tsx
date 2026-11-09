import { useState } from 'react'
import { coachAnswer, TOPICS, type Topic } from '../../engine/commentary'
import type { MoveError } from '../../engine/analysis'
import { Speak } from '../../ui/Speak'

/** Conversación sobre un error: arranca con "¿Qué pasó?" y vas preguntando lo que quieras. Reiniciar con `key`. */
export function Coach({ error }: { error: MoveError }) {
  const [shown, setShown] = useState<Topic[]>(['what'])
  const [seed, setSeed] = useState(0)
  const rest = TOPICS.filter((t) => !shown.includes(t.key))
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-accent p-3 text-sm" aria-live="polite">
      {shown.map((k, i) => (
        <div key={k} className="flex flex-col gap-2">
          {i > 0 && <p className="self-end rounded-2xl bg-accent px-3 py-1.5 text-xs text-white">{TOPICS.find((t) => t.key === k)!.label}</p>}
          <div className="flex flex-col gap-2 rounded-2xl bg-surface p-3">
            <p>{coachAnswer(error, k, seed)}</p>
            <Speak text={coachAnswer(error, k, seed)} auto={i === shown.length - 1} />
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        {rest.map((t) => (
          <button key={t.key} type="button" className="min-h-11 rounded-full border border-accent px-3" onClick={() => setShown((s) => [...s, t.key])}>
            {t.label}
          </button>
        ))}
        <button type="button" className="min-h-11 rounded-full bg-surface-2 px-3" onClick={() => setSeed((n) => n + 1)}>
          Decímelo de otra forma
        </button>
      </div>
    </div>
  )
}
