import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { registerPwa } from './lib/pwa'
import './index.css'

registerPwa()

const root = document.getElementById('root')
if (!root) throw new Error('Falta #root')
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
