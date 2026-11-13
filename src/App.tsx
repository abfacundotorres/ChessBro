import { Suspense, lazy, useEffect } from 'react'
import { HashRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Home } from './features/home/Home'
import { Welcome } from './features/welcome/Welcome'
import { refreshAnalyses } from './data/games'
import { toDateStr } from './engine/dates'
import { useStyleChoice } from './data/style'
import { useLevelChoice } from './data/level'
import { Learn } from './features/learn/Learn'
import { UpdateBanner } from './ui/UpdateBanner'
import { ErrorBoundary } from './ui/ErrorBoundary'
import { Icon, type IconName } from './ui/Icon'
import { Progress } from './features/plan/Plan'

/** Cada pantalla pesada se baja aparte (y queda en la caché sin conexión): el arranque carga solo Hoy y Aprender. */
const Tactics = lazy(() => import('./features/tactics/Tactics').then((m) => ({ default: m.Tactics })))
const Repertoire = lazy(() => import('./features/repertoire/Repertoire').then((m) => ({ default: m.Repertoire })))
const LineView = lazy(() => import('./features/repertoire/LineView').then((m) => ({ default: m.LineView })))
const ReviewRepertoire = lazy(() => import('./features/repertoire/Review').then((m) => ({ default: m.ReviewRepertoire })))
const Lessons = lazy(() => import('./features/lessons/Lessons').then((m) => ({ default: m.Lessons })))
const LessonView = lazy(() => import('./features/lessons/LessonView').then((m) => ({ default: m.LessonView })))
const EndgamePlay = lazy(() => import('./features/endgames/EndgamePlay').then((m) => ({ default: m.EndgamePlay })))
const Games = lazy(() => import('./features/games/Games').then((m) => ({ default: m.Games })))
const GameDetail = lazy(() => import('./features/games/GameDetail').then((m) => ({ default: m.GameDetail })))
const FreeBoard = lazy(() => import('./features/board/FreeBoard').then((m) => ({ default: m.FreeBoard })))
const Openings = lazy(() => import('./features/openings/Openings').then((m) => ({ default: m.Openings })))
const OpeningView = lazy(() => import('./features/openings/OpeningView').then((m) => ({ default: m.OpeningView })))
const Settings = lazy(() => import('./features/settings/Settings').then((m) => ({ default: m.Settings })))

/** Cuatro pestañas; cada una cubre varias rutas (por ejemplo, Aprender incluye lecciones, aperturas, táctica y finales). */
const NAV: { to: string; label: string; icon: IconName; match: string[] }[] = [
  { to: '/', label: 'Hoy', icon: 'hoy', match: ['/', '/progreso'] },
  { to: '/aprender', label: 'Aprender', icon: 'aprender', match: ['/aprender', '/lecciones', '/tactica', '/aperturas', '/repertorio', '/finales', '/tablero'] },
  { to: '/partidas', label: 'Partidas', icon: 'partidas', match: ['/partidas'] },
  { to: '/ajustes', label: 'Ajustes', icon: 'ajustes', match: ['/ajustes'] },
]

/** Rutas con la barra de pestañas fuera del límite de error: si una pantalla falla, la barra sigue. */
function RoutedScreens() {
  const { pathname } = useLocation()
  return (
    <ErrorBoundary key={pathname}>
      <Suspense fallback={<p className="p-4 text-muted">Cargando…</p>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/aperturas" element={<Openings />} />
        <Route path="/aperturas/:id" element={<OpeningView />} />
        <Route path="/repertorio" element={<Repertoire />} />
        <Route path="/repertorio/repaso" element={<ReviewRepertoire />} />
        <Route path="/repertorio/:id" element={<LineView />} />
        <Route path="/plan" element={<Navigate to="/" replace />} />
        <Route path="/progreso" element={<Progress />} />
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
      </Suspense>
    </ErrorBoundary>
  )
}

function TabBar() {
  const { pathname } = useLocation()
  const active = NAV.find((n) => n.match.some((m) => (m === '/' ? pathname === '/' : pathname === m || pathname.startsWith(`${m}/`)))) ?? NAV[0]
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {NAV.map((n) => (
          <li key={n.to}>
            <Link
              to={n.to}
              aria-current={n === active ? 'page' : undefined}
              className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs ${n === active ? 'font-bold text-accent' : 'font-medium text-muted'}`}
            >
              <span className={`flex h-7 w-14 items-center justify-center rounded-full ${n === active ? 'bg-surface-2' : ''}`}>
                <Icon name={n.icon} size={21} />
              </span>
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
