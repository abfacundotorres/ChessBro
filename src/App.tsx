import { useEffect } from 'react'
import { HashRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
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
import { Lessons } from './features/lessons/Lessons'
import { LessonView } from './features/lessons/LessonView'
import { EndgamePlay } from './features/endgames/EndgamePlay'
import { Games } from './features/games/Games'
import { GameDetail } from './features/games/GameDetail'
import { FreeBoard } from './features/board/FreeBoard'
import { Learn } from './features/learn/Learn'
import { Openings } from './features/openings/Openings'
import { OpeningView } from './features/openings/OpeningView'
import { Settings } from './features/settings/Settings'
import { UpdateBanner } from './ui/UpdateBanner'
import { ErrorBoundary } from './ui/ErrorBoundary'

/** Cuatro pestañas; cada una cubre varias rutas (por ejemplo, Aprender incluye lecciones, aperturas, táctica y finales). */
const NAV = [
  { to: '/', label: 'Hoy', match: ['/'] },
  { to: '/aprender', label: 'Aprender', match: ['/aprender', '/lecciones', '/tactica', '/aperturas', '/repertorio', '/finales', '/tablero'] },
  { to: '/partidas', label: 'Partidas', match: ['/partidas'] },
  { to: '/ajustes', label: 'Ajustes', match: ['/ajustes'] },
]

/** Rutas con la barra de pestañas fuera del límite de error: si una pantalla falla, la barra sigue. */
function RoutedScreens() {
  const { pathname } = useLocation()
  return (
    <ErrorBoundary key={pathname}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/aperturas" element={<Openings />} />
        <Route path="/aperturas/:id" element={<OpeningView />} />
        <Route path="/repertorio" element={<Repertoire />} />
        <Route path="/repertorio/repaso" element={<ReviewRepertoire />} />
        <Route path="/repertorio/:id" element={<LineView />} />
        <Route path="/plan" element={<Navigate to="/" replace />} />
        <Route path="/aprender" element={<Learn />} />
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
    </ErrorBoundary>
  )
}

function TabBar() {
  const { pathname } = useLocation()
  const active = NAV.find((n) => n.match.some((m) => (m === '/' ? pathname === '/' : pathname === m || pathname.startsWith(`${m}/`)))) ?? NAV[0]
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {NAV.map((n) => (
          <li key={n.to}>
            <Link
              to={n.to}
              aria-current={n === active ? 'page' : undefined}
              className={`flex min-h-14 items-center justify-center text-sm font-medium ${n === active ? 'text-accent' : 'text-muted'}`}
            >
              {n.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function App() {
  const style = useStyleChoice()
  const level = useLevelChoice()
  useEffect(() => {
    // Si cambiaron las reglas de análisis, recalcula las partidas ya analizadas con las evaluaciones guardadas.
    void refreshAnalyses(toDateStr(new Date())).catch(() => undefined)
  }, [])
  if (style === undefined || level === undefined) return <p className="p-4 text-muted">Cargando…</p>
  if (style === null || level === null) return <Welcome />
  return (
    <HashRouter>
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
        <UpdateBanner />
        <main className="flex-1 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
          <RoutedScreens />
        </main>
        <TabBar />
      </div>
    </HashRouter>
  )
}
