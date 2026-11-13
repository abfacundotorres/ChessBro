import { useState } from 'react'
import { Speak } from './Speak'

/**
 * «Explicame más»: la explicación corta queda como está y este botón despliega la larga (3 a 5 frases).
 * Sin texto largo no muestra nada.
 */
export function More({ text, label = 'Explicame más' }: { text?: string; label?: string }) {
  const [open, setOpen] = useState(false)
  if (!text) return null
  return (
    <div className="flex flex-col gap-2">
      <button type="button" className="btn text-left" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? 'Ocultar' : label}
      </button>
      {open && (
        <div className="note-in flex flex-col gap-2 rounded-xl bg-surface-2 p-3 text-sm">
          <p>{text}</p>
          <Speak text={text} />
        </div>
      )}
    </div>
  )
}
