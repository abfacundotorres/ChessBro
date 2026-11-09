import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Board } from '../../ui/Board'
import { lessonById, type LessonStep } from '../../content/lessons'
import { styledLesson } from '../../content/styled'
import { useStyle } from '../../data/style'
import { endgameById } from '../../content/endgames'
import { repLineById } from '../../content/repertoire'
import { db } from '../../data/db'
import { finishLesson, markExercise, markLessonDone, touchPractice } from '../../data/lessons'
import { StreakChip } from '../../ui/StreakChip'
import { ExerciseView } from './ExerciseView'
import { ChallengeView } from './ChallengeView'
import { Speak } from '../../ui/Speak'

/** Si el desafío del paso ya muestra su propio tablero con la misma posición, el diagrama del paso sobra (se vería duplicado). */
function challengeShowsSameBoard(step: LessonStep): boolean {
  const ch = step.challenge
  if (!ch || !step.fen) return false
  if (ch.kind === 'choice') return ch.fen === step.fen
  return ch.fen === step.fen
}

/** Reinicia el estado al cambiar de lección (por ejemplo, con atrás/adelante del navegador). */
export function LessonView() {
  const { id = '' } = useParams()
  return <LessonBody key={id} id={id} />
}

function LessonBody({ id }: { id: string }) {
  const lesson = lessonById(id)
  const style = useStyle()
  const progress = useLiveQuery(() => db.lessons.get(id), [id], undefined)
  const [phase, setPhase] = useState<{ kind: 'read'; i: number } | { kind: 'practice'; i: number } | { kind: 'end' }>({ kind: 'read', i: 0 })
  const [cleared, setCleared] = useState<ReadonlySet<number>>(new Set())
  const [mistakes, setMistakes] = useState(0)
  const [result, setResult] = useState<{ stars: 1 | 2 | 3; best: number } | null>(null)

  if (!lesson) {
    return (
      <p>
        No encontré esa lección. <Link to="/lecciones" className="underline">Volver</Link>
      </p>
    )
  }
  const l = styledLesson(lesson, style)
  const serio = style === 'serio'

  const challenges = l.steps.filter((st) => st.challenge).length
  const items = challenges + l.exercises.length

  function goEnd() {
    // Las lecciones de pura lectura no tienen puntaje: solo se marcan como vistas.
    if (items === 0) void markLessonDone(l.id).then(() => touchPractice())
    else void finishLesson(l.id, mistakes, items).then(setResult)
    setPhase({ kind: 'end' })
  }

  function afterReading() {
    if (l.exercises.length > 0) setPhase({ kind: 'practice', i: 0 })
    else goEnd()
  }

  function restart() {
    setCleared(new Set())
    setMistakes(0)
    setResult(null)
    setPhase({ kind: 'read', i: 0 })
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
        {step.fen && !challengeShowsSameBoard(step) && (
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
          <p className="mt-1 whitespace-pre-line">{step.text}</p>
          <Speak className="mt-2" text={[step.title, step.text].filter(Boolean).join('. ')} auto />
        </div>
        {step.challenge && (
          <div className="rounded-xl border border-accent p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">{serio ? 'Ejercicio' : 'Adiviná'}</p>
            <ChallengeView
              key={`${l.id}-${phase.i}`}
              challenge={step.challenge}
              onMistake={() => setMistakes((m) => m + 1)}
              onSolved={() => {
                void touchPractice()
                setCleared((c) => new Set(c).add(phase.i))
              }}
            />
          </div>
        )}
        <p className="text-center text-xs text-muted">
          {phase.i + 1} de {l.steps.length}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn" disabled={phase.i === 0} onClick={() => setPhase({ kind: 'read', i: phase.i - 1 })}>
            Anterior
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={!!step.challenge && !cleared.has(phase.i)}
            onClick={() => (last ? afterReading() : setPhase({ kind: 'read', i: phase.i + 1 }))}
          >
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
          onMistake={() => setMistakes((m) => m + 1)}
          onNext={() => (lastEx ? goEnd() : setPhase({ kind: 'practice', i: phase.i + 1 }))}
        />
      </div>
    )
  }

  const solved = progress?.exercises.length ?? 0
  const eg = l.endgame ? endgameById(l.endgame) : undefined
  const rep = l.repLine ? repLineById(l.repLine) : undefined
  return (
    <div className="flex flex-col gap-3">
      {header}
      <div className="flex flex-col items-center gap-2 rounded-xl bg-surface p-5 text-center">
        {items > 0 && !serio && (
          <p className="text-4xl tracking-widest text-accent" aria-label={`${result?.stars ?? 0} de 3 estrellas`}>
            {'★'.repeat(result?.stars ?? 0)}
            <span className="text-border">{'★'.repeat(3 - (result?.stars ?? 0))}</span>
          </p>
        )}
        <p className="text-lg font-semibold">
          {serio ? 'Lección completada' : items === 0 ? '¡Lección terminada!' : result?.stars === 3 ? '¡Perfecta!' : result?.stars === 2 ? '¡Muy bien!' : '¡Lección completada!'}
        </p>
        {items > 0 && (
          <p className="text-sm text-muted">
            {mistakes === 0 ? 'Sin ningún error.' : mistakes === 1 ? 'Con un error.' : `Con ${mistakes} errores.`}
            {!serio && result && result.best > result.stars && ` Tu mejor marca: ${result.best} ★.`}
            {!serio && result && result.stars !== 3 && ' Podés repasarla para conseguir las 3 estrellas.'}
            {serio && mistakes > 0 && ' Conviene repasar los conceptos con errores.'}
          </p>
        )}
        {l.exercises.length > 0 && (
          <p className="text-sm text-muted">
            Ejercicios resueltos por tu cuenta: {solved} de {l.exercises.length}.
          </p>
        )}
        <StreakChip />
      </div>
      {l.practice && (
        <Link to={`/tactica?tema=${l.practice}`} className="btn-primary flex items-center justify-center">
          Practicar más puzzles de este tema
        </Link>
      )}
      {rep && (
        <Link to={`/repertorio/${rep.id}`} className="btn-primary flex items-center justify-center">
          Practicar la línea: {rep.name}
        </Link>
      )}
      {eg && (
        <Link to={`/finales/${eg.id}`} className="btn-primary flex items-center justify-center">
          Jugar el final: {eg.title}
        </Link>
      )}
      {l.sources && l.sources.length > 0 && (
        <details className="rounded-xl bg-surface p-4 text-sm">
          <summary className="cursor-pointer font-semibold">Para seguir leyendo</summary>
          <p className="mt-2 text-muted">Ideas relacionadas (en inglés, sitios externos). El texto de la lección es propio.</p>
          <ul className="mt-1 list-disc pl-5">
            {l.sources.map((src) => (
              <li key={src.url}>
                <a href={src.url} target="_blank" rel="noopener noreferrer" className="underline">
                  {src.title}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn" onClick={restart}>
          Repasar
        </button>
        <Link to="/lecciones" className="btn flex items-center justify-center">
          Lecciones
        </Link>
      </div>
    </div>
  )
}
