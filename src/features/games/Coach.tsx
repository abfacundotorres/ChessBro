import { useState } from 'react'
import { Link } from 'react-router-dom'
import { coachAnswer, TOPICS, type Topic } from '../../engine/commentary'
import type { MoveError } from '../../engine/analysis'
import { FOCUS } from '../../engine/patterns'
import { lessonById } from '../../content/lessons'
import { styledLesson } from '../../content/styled'
import { useStyle } from '../../data/style'
import { Speak } from '../../ui/Speak'

/** Conversación sobre un error: arranca con "¿Qué pasó?" y vas preguntando lo que quieras. Reiniciar con `key`. */
export function Coach({ error }: { error: MoveError }) {
  const [shown, setShown] = useState<Topic[]>(['what'])
  const [seed, setSeed] = useState(0)
  const rest = TOPICS.filter((t) => !shown.includes(t.key))
  const style = useStyle()
  const focus = FOCUS[error.kind]
  const base = focus.lessonId ? lessonById(focus.lessonId) : undefined
  const lesson = base ? styledLesson(base, style) : undefined
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
      {shown.includes('avoid') && (
        <div className="flex flex-col gap-2 rounded-2xl border border-accent p-3">
          <p className="font-semibold">Para practicarlo</p>
          <p className="text-muted">{focus.advice}</p>
          <div className="flex flex-wrap gap-2">
            {lesson && (
              <Link to={`/lecciones/${lesson.id}`} className="btn-primary flex items-center px-4">
                Lección: {lesson.title}
              </Link>
            )}
            {focus.theme && (
              <Link to={`/tactica?tema=${focus.theme}`} className="btn flex items-center px-4">
                Puzzles del tema
              </Link>
            )}
            {focus.to && (
              <Link to={focus.to} className="btn flex items-center px-4">
                Ir a Aperturas
              </Link>
            )}
          </div>
        </div>
      )}
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
