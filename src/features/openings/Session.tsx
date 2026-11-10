import { useMemo, useState } from 'react'
import { Drill } from './Drill'
import { QuizView } from './QuizView'
import { Sparring } from './Sparring'
import { TrapExercise } from './TrapExercise'
import { MovePuzzle } from './MovePuzzle'
import type { PuzzleItem } from '../../content/openingExtras'
import type { Opening } from '../../content/openings'
import type { DrillItem, RepLine } from '../../engine/repertoire'

type Step = 'sparring' | 'drill' | 'plan' | 'punish' | 'quiz' | 'trap'

const TITLE: Record<Step, string> = {
  sparring: 'Jugá la línea contra el rival',
  drill: '¿Qué jugás acá?',
  plan: 'Un plan del medio juego',
  punish: 'El rival se equivocó',
  quiz: 'Una pregunta',
  trap: 'Una trampa',
}

/** Sesión de unos 5 minutos: una partida de práctica, 3 posiciones, un plan, un error del rival y una pregunta. Se avanza paso a paso. */
export function Session({ opening, lines, items, plans, punish, quiz, onExit }: { opening: Opening; lines: RepLine[]; items: DrillItem[]; plans: PuzzleItem[]; punish: PuzzleItem[]; quiz: { q: string; options: string[]; answer: number; why: string }[]; onExit: () => void }) {
  const steps = useMemo<Step[]>(
    () => [
      ...(lines.length > 0 ? (['sparring'] as const) : []),
      ...(items.length > 0 ? (['drill'] as const) : []),
      ...(plans.length > 0 ? (['plan'] as const) : []),
      ...(punish.length > 0 ? (['punish'] as const) : opening.trap?.punishAt !== undefined ? (['trap'] as const) : []),
      ...(quiz.length > 0 ? (['quiz'] as const) : []),
    ],
    [lines.length, items.length, plans.length, punish.length, quiz.length, opening.trap],
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
      {step === 'drill' && <Drill key={`d${i}`} items={items} size={3} onDone={next} doneLabel={label} />}
      {step === 'plan' && <MovePuzzle key={`p${i}`} items={plans} size={1} onDone={next} doneLabel={label} />}
      {step === 'punish' && <MovePuzzle key={`x${i}`} items={punish} size={1} onDone={next} doneLabel={label} />}
      {step === 'quiz' && <QuizView key={`q${i}`} items={quiz} limit={1} onDone={next} doneLabel={label} />}
      {step === 'trap' && <TrapExercise key={`t${i}`} opening={opening} onDone={next} doneLabel={label} />}
    </div>
  )
}
