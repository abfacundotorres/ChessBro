import { useMemo, useState } from 'react'
import { Drill } from './Drill'
import { QuizView } from './QuizView'
import { Sparring } from './Sparring'
import { TrapExercise } from './TrapExercise'
import type { Opening } from '../../content/openings'
import type { DrillItem, RepLine } from '../../engine/repertoire'

type Step = 'sparring' | 'drill' | 'quiz' | 'trap'

const TITLE: Record<Step, string> = {
  sparring: 'Jugá la línea contra el rival',
  drill: '¿Qué jugás acá?',
  quiz: 'Una pregunta',
  trap: 'Una trampa',
}

/** Sesión de unos 5 minutos: una partida de práctica, 4 posiciones, 2 preguntas y una trampa. Se avanza paso a paso. */
export function Session({ opening, lines, items, quiz, onExit }: { opening: Opening; lines: RepLine[]; items: DrillItem[]; quiz: { q: string; options: string[]; answer: number; why: string }[]; onExit: () => void }) {
  const steps = useMemo<Step[]>(
    () => [...(lines.length > 0 ? (['sparring'] as const) : []), ...(items.length > 0 ? (['drill'] as const) : []), ...(quiz.length > 0 ? (['quiz'] as const) : []), ...(opening.trap?.punishAt !== undefined ? (['trap'] as const) : [])],
    [lines.length, items.length, quiz.length, opening.trap],
  )
  const [i, setI] = useState(0)
  if (steps.length === 0) return null
  const step = steps[i]
  const last = i === steps.length - 1
  const next = () => (last ? setI(steps.length) : setI(i + 1))
  const label = last ? 'Terminar' : 'Siguiente paso'

  if (i >= steps.length) {
    return (
      <div className="flex flex-col gap-3 rounded-xl bg-surface p-5 text-center">
        <p className="text-lg font-semibold">¡Sesión completa!</p>
        <p className="text-sm text-muted">Lo que fallaste vuelve en tu repaso. Con una sesión por día, esta apertura se te queda.</p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn" onClick={() => setI(0)}>
            Otra sesión
          </button>
          <button type="button" className="btn-primary" onClick={onExit}>
            Listo
          </button>
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">
          {i + 1}/{steps.length} · {TITLE[step!]}
        </p>
        <button type="button" className="text-sm text-muted underline" onClick={onExit}>
          Salir
        </button>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={i + 1} aria-valuemax={steps.length}>
        <div className="h-full bg-accent transition-[width]" style={{ width: `${((i + 1) / steps.length) * 100}%` }} />
      </div>
      {step === 'sparring' && <Sparring key={`s${i}`} lines={lines} color={lines[0]!.color} onDone={next} doneLabel={label} />}
      {step === 'drill' && <Drill key={`d${i}`} items={items} size={4} onDone={next} doneLabel={label} />}
      {step === 'quiz' && <QuizView key={`q${i}`} items={quiz} limit={2} onDone={next} doneLabel={label} />}
      {step === 'trap' && <TrapExercise key={`t${i}`} opening={opening} onDone={next} doneLabel={label} />}
    </div>
  )
}
