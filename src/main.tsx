import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { ErrorBoundary } from './ui/ErrorBoundary'
import { registerPwa } from './lib/pwa'
import './index.css'

registerPwa()

// Pide que el navegador no borre los datos (IndexedDB) si falta espacio. Si lo niega, no pasa nada: queda el backup manual.
try {
  void navigator.storage?.persist?.().catch(() => undefined)
} catch {
  /* sin soporte */
}

const root = document.getElementById('root')
if (!root) throw new Error('Falta #root')
createRoot(root).render(
  <StrictMode>
    <ErrorBoundary scope="app">
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
