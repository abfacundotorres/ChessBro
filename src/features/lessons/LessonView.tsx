import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Board } from '../../ui/Board'
import { lessonById } from '../../content/lessons'
import { endgameById } from '../../content/endgames'
import { db } from '../../data/db'
import { markExercise, markLessonDone } from '../../data/lessons'
import { ExerciseView } from './ExerciseView'

/** Reinicia el estado al cambiar de lección (por ejemplo, con atrás/adelante del navegador). */
export function LessonView() {
  const { id = '' } = useParams()
  return <LessonBody key={id} id={id} />
}

function LessonBody({ id }: { id: string }) {
  const lesson = lessonById(id)
  const progress = useLiveQuery(() => db.lessons.get(id), [id], undefined)
  const [phase, setPhase] = useState<{ kind: 'read'; i: number } | { kind: 'practice'; i: number } | { kind: 'end' }>({ kind: 'read', i: 0 })

  if (!lesson) {
    return (
      <p>
        No encontré esa lección. <Link to="/lecciones" className="underline">Volver</Link>
      </p>
    )
  }
  const l = lesson

  function afterReading() {
    if (l.exercises.length > 0) setPhase({ kind: 'practice', i: 0 })
    else {
      void markLessonDone(l.id)
      setPhase({ kind: 'end' })
    }
  }

  const header = (
    <header>
      <Link to="/lecciones" className="text-sm text-muted">
        ← Lecciones
      </Link>
      <h1 className="text-xl font-bold">{l.title}</h1>
    </header>
  )

  if (phase.kind === 'read') {
    const step = l.steps[phase.i]!
    const last = phase.i === l.steps.length - 1
    return (
      <div className="flex flex-col gap-3">
        {header}
        {step.fen && (
          <Board
            fen={step.fen}
            orientation={step.orientation ?? 'white'}
            lastMove={null}
            checkSquare={null}
            movableColor={null}
            highlights={step.highlights}
            arrows={(step.arrows ?? []).map((a) => ({
              startSquare: a.from,
              endSquare: a.to,
              color: a.kind === 'good' ? 'rgba(22, 163, 74, 0.85)' : 'rgba(220, 38, 38, 0.8)',
            }))}
          />
        )}
        <div className="rounded-xl bg-surface p-4">
          {step.title && <p className="font-semibold">{step.title}</p>}
          <p className="mt-1">{step.text}</p>
        </div>
        <p className="text-center text-xs text-muted">
          {phase.i + 1} de {l.steps.length}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn" disabled={phase.i === 0} onClick={() => setPhase({ kind: 'read', i: phase.i - 1 })}>
            Anterior
          </button>
          <button type="button" className="btn-primary" onClick={() => (last ? afterReading() : setPhase({ kind: 'read', i: phase.i + 1 }))}>
            {last ? (l.exercises.length > 0 ? 'A practicar' : 'Terminar') : 'Siguiente'}
          </button>
        </div>
      </div>
    )
  }

  if (phase.kind === 'practice') {
    const ex = l.exercises[phase.i]!
    const lastEx = phase.i === l.exercises.length - 1
    return (
      <div className="flex flex-col gap-3">
        {header}
        <p className="text-sm text-muted">
          Ejercicio {phase.i + 1} de {l.exercises.length}
        </p>
        <ExerciseView
          key={ex.id}
          exercise={ex}
          isLast={lastEx}
          onSolved={() => void markExercise(l.id, ex.id, l.exercises.length)}
          onNext={() => setPhase(lastEx ? { kind: 'end' } : { kind: 'practice', i: phase.i + 1 })}
        />
      </div>
    )
  }

  const solved = progress?.exercises.length ?? 0
  const eg = l.endgame ? endgameById(l.endgame) : undefined
  return (
    <div className="flex flex-col gap-3">
      {header}
      <div className="flex flex-col gap-2 rounded-xl bg-surface p-4">
        <p className="text-lg font-semibold">¡Lección terminada!</p>
        {l.exercises.length > 0 && (
          <p className="text-sm text-muted">
            Resolviste {solved} de {l.exercises.length} ejercicios por tu cuenta.
          </p>
        )}
      </div>
      {l.practice && (
        <Link to={`/tactica?tema=${l.practice}`} className="btn-primary flex items-center justify-center">
          Practicar más puzzles de este tema
        </Link>
      )}
      {eg && (
        <Link to={`/finales/${eg.id}`} className="btn-primary flex items-center justify-center">
          Jugar el final: {eg.title}
        </Link>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn" onClick={() => setPhase({ kind: 'read', i: 0 })}>
          Repasar
        </button>
        <Link to="/lecciones" className="btn flex items-center justify-center">
          Lecciones
        </Link>
      </div>
    </div>
  )
}
