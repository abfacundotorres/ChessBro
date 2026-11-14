import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Board } from '../../ui/Board'
import { MoveList } from '../../ui/MoveList'
import { GROUP_LABELS, openingById, openingFamily, type Opening } from '../../content/openings'
import { repLineById } from '../../content/repertoire'
import { db } from '../../data/db'
import { replay, sanLineToUci, sanToFigurine, START_FEN } from '../../engine/game'
import { openingStats } from '../../engine/openingStats'
import { drillItems } from '../../engine/repertoire'
import { gameStats, StatsRows } from './Openings'
import { Speak } from '../../ui/Speak'
import { Drill } from './Drill'
import { QuizView } from './QuizView'
import { TrapExercise } from './TrapExercise'
import { Sparring } from './Sparring'
import { Session } from './Session'
import { MovePuzzle } from './MovePuzzle'
import { ModelGameView } from './ModelGameView'
import { modelsOf, puzzlesOf } from '../../content/openingExtras'
import { deepLinesOf } from '../../content/openingLines'
import { ALL_CARDS } from '../../content/repertoireCards'
import { repStats } from '../../data/repertoire'
import { toDateStr } from '../../engine/dates'

export function OpeningView() {
  const { id = '' } = useParams()
  const o = openingById(id)
  if (!o) {
    return (
      <p>
        No encontré esa apertura. <Link to="/aperturas" className="underline">Volver</Link>
      </p>
    )
  }
  return <Body key={o.id} o={o} />
}

/** Tablero con avance jugada por jugada. */
function Stepper({ moves, orientation }: { moves: string[]; orientation: 'white' | 'black' }) {
  const [i, setI] = useState(moves.length)
  const ucis = useMemo(() => sanLineToUci(START_FEN, moves) ?? [], [moves])
  const view = useMemo(
    () => replay(START_FEN, ucis.slice(0, i).map((u) => ({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] as 'q' | 'r' | 'b' | 'n' | undefined }))),
    [ucis, i],
  )
  return (
    <div className="flex flex-col gap-3">
      <Board fen={view.fen} orientation={orientation} lastMove={view.lastMove} checkSquare={view.checkSquare} movableColor={null} />
      <div className="grid grid-cols-4 gap-2">
        <button type="button" className="btn" aria-label="Inicio" disabled={i === 0} onClick={() => setI(0)}>
          ⏮
        </button>
        <button type="button" className="btn" aria-label="Anterior" disabled={i === 0} onClick={() => setI(i - 1)}>
          ◀
        </button>
        <button type="button" className="btn" aria-label="Siguiente" disabled={i === moves.length} onClick={() => setI(i + 1)}>
          ▶
        </button>
        <button type="button" className="btn" aria-label="Final" disabled={i === moves.length} onClick={() => setI(moves.length)}>
          ⏭
        </button>
      </div>
      <MoveList startFen={START_FEN} moves={view.moves} />
    </div>
  )
}

type Mode = 'home' | 'session' | 'sparring' | 'drill' | 'quiz' | 'trap' | 'plan' | 'punish' | 'model'

function Body({ o }: { o: Opening }) {
  const [params] = useSearchParams()
  const [mode, setMode] = useState<Mode>(params.get('modo') === 'sesion' ? 'session' : 'home')
  const games = useLiveQuery(() => db.games.toArray(), [], [])
  const mine = openingStats(
    gameStats(games.filter((g) => openingFamily(g.opening)?.id === o.id)),
    () => o.id,
  )
  const lines = o.repLines.map((id) => repLineById(id)).filter((l) => l !== undefined)
  const deepLines = useMemo(() => deepLinesOf(o.id), [o.id])
  const today = toDateStr(new Date())
  const stats = useLiveQuery(() => repStats(deepLines, ALL_CARDS, today), [deepLines, today])
  const items = useMemo(() => drillItems(deepLines, `${o.id}:`), [deepLines, o.id])
  const quiz = useMemo(() => deepLines.flatMap((l) => l.quiz ?? []), [deepLines])
  const plans = useMemo(() => puzzlesOf(o.id, 'plan'), [o.id])
  const punish = useMemo(() => puzzlesOf(o.id, 'punish'), [o.id])
  const models = modelsOf(o.id)
  const hasTrap = o.trap?.punishAt !== undefined
  const deep = deepLines.length > 0
  const back = () => setMode('home')

  const header = (
    <header>
      <Link to="/aperturas" className="back-link">
        ← Aperturas
      </Link>
      <h1 className="text-xl font-bold">{o.name}</h1>
      <p className="text-sm text-muted">
        {GROUP_LABELS[o.group]} · {o.side === 'blancas' ? 'la elegís con blancas' : 'la jugás con negras'}
      </p>
    </header>
  )

  if (mode !== 'home') {
    return (
      <div className="flex flex-col gap-3">
        <button type="button" className="back-link self-start" onClick={back}>
          ← {o.name}
        </button>
        {mode === 'session' && <Session opening={o} lines={deepLines} items={items} plans={plans} punish={punish} quiz={quiz} onExit={back} />}
        {mode === 'plan' && <MovePuzzle key="pl" items={plans} />}
        {mode === 'punish' && <MovePuzzle key="pu" items={punish} />}
        {mode === 'model' && models.length > 0 && <ModelGameView games={models} />}
        {mode === 'sparring' && <Sparring key="sp" lines={deepLines} color={deepLines[0]!.color} onDone={back} doneLabel="Volver" />}
        {mode === 'drill' && <Drill key="dr" items={items} />}
        {mode === 'quiz' && <QuizView key="qz" items={quiz} />}
        {mode === 'trap' && hasTrap && <TrapExercise key="tr" opening={o} />}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {header}
      <p className="font-mono text-sm">{o.moves.map((m, k) => `${k % 2 === 0 ? `${k / 2 + 1}.` : ''}${sanToFigurine(m)}`).join(' ')}</p>

      {deep ? (
        <>
          <button type="button" className="btn-primary min-h-14 text-base" onClick={() => setMode('session')}>
            Entrenar esta apertura · 5 min
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="btn" onClick={() => setMode('sparring')}>
              Jugar contra el rival
            </button>
            <button type="button" className="btn" onClick={() => setMode('drill')}>
              ¿Qué jugás acá?
            </button>
            <button type="button" className="btn" onClick={() => setMode('quiz')}>
              Preguntas
            </button>
            {plans.length > 0 && (
              <button type="button" className="btn" onClick={() => setMode('plan')}>
                Planes del medio juego
              </button>
            )}
            {punish.length > 0 && (
              <button type="button" className="btn" onClick={() => setMode('punish')}>
                Errores del rival
              </button>
            )}
            {hasTrap && (
              <button type="button" className="btn" onClick={() => setMode('trap')}>
                Trampa
              </button>
            )}
            {models.length > 0 && (
              <button type="button" className="btn" onClick={() => setMode('model')}>
                {models.length > 1 ? `Partidas de ejemplo (${models.length})` : 'Partida de ejemplo'}
              </button>
            )}
          </div>

          <section className="flex flex-col gap-2">
            <h2 className="font-semibold">Estudiar las líneas</h2>
            {deepLines.map((l) => {
              const st = stats?.get(l.id)
              return (
                <Link key={l.id} to={`/repertorio/${l.id}`} className="rounded-xl bg-surface p-3 active:scale-[0.99]">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{l.name}</p>
                    {st?.practiced && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-accent">practicada</span>}
                  </div>
                  <p className="text-xs text-muted">
                    {l.moves.length} jugadas · jugás con {l.color === 'w' ? 'blancas' : 'negras'}
                    {st && st.cards > 0 ? ` · ${st.solid}/${st.cards} bien aprendidas` : ''}
                  </p>
                </Link>
              )
            })}
          </section>
        </>
      ) : (
        <>
          <p className="rounded-xl bg-surface p-4">{o.idea}</p>
          <Stepper moves={o.moves} orientation={o.side === 'negras' ? 'black' : 'white'} />
          {hasTrap && (
            <button type="button" className="btn" onClick={() => setMode('trap')}>
              Ejercicio de trampa: {o.trap!.name}
            </button>
          )}
          {lines.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="font-semibold">Para memorizar (repertorio)</h2>
              {lines.map((l) => (
                <Link key={l.id} to={`/repertorio/${l.id}`} className="rounded-xl bg-surface p-3 active:scale-[0.99]">
                  <p className="font-medium">{l.name}</p>
                  <p className="text-xs text-muted">{l.group}</p>
                </Link>
              ))}
            </section>
          )}
        </>
      )}

      <details className="rounded-xl bg-surface p-4 text-sm">
        <summary className="cursor-pointer font-semibold">La idea, los planes y los errores típicos</summary>
        <div className="mt-2 flex flex-col gap-2">
          {deep && <p>{o.idea}</p>}
          <Speak text={`${o.name}. ${o.idea} Planes: ${o.plans.join('. ')}. Errores típicos: ${o.mistakes.join('. ')}.`} />
          <p className="font-semibold">Planes</p>
          <ul className="list-disc pl-5">
            {o.plans.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <p className="font-semibold">Errores típicos</p>
          <ul className="list-disc pl-5">
            {o.mistakes.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      </details>

      {deep && o.trap && (
        <details className="rounded-xl bg-surface p-4 text-sm">
          <summary className="cursor-pointer font-semibold">Trampa: {o.trap.name}</summary>
          <div className="mt-2 flex flex-col gap-2">
            <p>{o.trap.text}</p>
            <Stepper moves={o.trap.moves} orientation={o.side === 'negras' ? 'black' : 'white'} />
          </div>
        </details>
      )}

      {mine.length > 0 && (
        <details className="rounded-xl bg-surface p-4 text-sm">
          <summary className="cursor-pointer font-semibold">En tus partidas</summary>
          <div className="mt-2">
            <StatsRows stats={mine} />
          </div>
        </details>
      )}
    </div>
  )
}
