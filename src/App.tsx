import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import { Home } from './features/home/Home'
import { Tactics } from './features/tactics/Tactics'
import { FreeBoard } from './features/board/FreeBoard'
import { Settings } from './features/settings/Settings'
import { UpdateBanner } from './ui/UpdateBanner'

const NAV = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/tactica', label: 'Táctica', end: false },
  { to: '/tablero', label: 'Tablero', end: false },
  { to: '/ajustes', label: 'Ajustes', end: false },
]

export function App() {
  return (
    <HashRouter>
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
        <UpdateBanner />
        <main className="flex-1 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-24">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tactica" element={<Tactics />} />
            <Route path="/tablero" element={<FreeBoard />} />
            <Route path="/ajustes" element={<Settings />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
          <ul className="mx-auto grid max-w-lg grid-cols-4">
            {NAV.map((n) => (
              <li key={n.to}>
                <NavLink
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) =>
                    `flex min-h-14 items-center justify-center text-sm font-medium ${isActive ? 'text-accent' : 'text-muted'}`
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
