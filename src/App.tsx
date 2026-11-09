import { useEffect } from 'react'
import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import { Home } from './features/home/Home'
import { Tactics } from './features/tactics/Tactics'
import { Welcome } from './features/welcome/Welcome'
import { refreshAnalyses } from './data/games'
import { toDateStr } from './engine/dates'
import { useStyleChoice } from './data/style'
import { useLevelChoice } from './data/level'
import { Repertoire } from './features/repertoire/Repertoire'
import { LineView } from './features/repertoire/LineView'
import { ReviewRepertoire } from './features/repertoire/Review'
import { Plan } from './features/plan/Plan'
import { Lessons } from './features/lessons/Lessons'
import { LessonView } from './features/lessons/LessonView'
import { EndgamePlay } from './features/endgames/EndgamePlay'
import { Games } from './features/games/Games'
import { GameDetail } from './features/games/GameDetail'
import { FreeBoard } from './features/board/FreeBoard'
import { Openings } from './features/openings/Openings'
import { OpeningView } from './features/openings/OpeningView'
import { Settings } from './features/settings/Settings'
import { UpdateBanner } from './ui/UpdateBanner'

const NAV = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/lecciones', label: 'Lecciones', end: false },
  { to: '/tactica', label: 'Táctica', end: false },
  { to: '/partidas', label: 'Partidas', end: false },
  { to: '/ajustes', label: 'Ajustes', end: false },
]

export function App() {
  const style = useStyleChoice()
  const level = useLevelChoice()
  useEffect(() => {
    // Si cambiaron las reglas de análisis, recalcula las partidas ya analizadas con las evaluaciones guardadas.
    void refreshAnalyses(toDateStr(new Date())).catch(() => undefined)
  }, [])
  if (style === undefined || level === undefined) return null // cargando
  if (style === null || level === null) return <Welcome />
  return (
    <HashRouter>
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
        <UpdateBanner />
        <main className="flex-1 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-24">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/aperturas" element={<Openings />} />
            <Route path="/aperturas/:id" element={<OpeningView />} />
            <Route path="/repertorio" element={<Repertoire />} />
            <Route path="/repertorio/repaso" element={<ReviewRepertoire />} />
            <Route path="/repertorio/:id" element={<LineView />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="/lecciones" element={<Lessons />} />
            <Route path="/lecciones/:id" element={<LessonView />} />
            <Route path="/finales/:id" element={<EndgamePlay />} />
            <Route path="/tactica" element={<Tactics />} />
            <Route path="/partidas" element={<Games />} />
            <Route path="/partidas/:id" element={<GameDetail />} />
            <Route path="/tablero" element={<FreeBoard />} />
            <Route path="/ajustes" element={<Settings />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
          <ul className="mx-auto grid max-w-lg grid-cols-5">
            {NAV.map((n) => (
              <li key={n.to}>
                <NavLink
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) =>
                    `flex min-h-14 items-center justify-center text-[13px] font-medium ${isActive ? 'text-accent' : 'text-muted'}`
                  }
                >
                  {n.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </HashRouter>
  )
}
