# ChessBro — PWA offline para aprender ajedrez de 0 a 1800

App personal (un usuario, Facu, hoy <1200 online, 2–5 h/semana) con currículo por
bandas de Elo, táctica con repaso espaciado y análisis de partidas propias.
100% offline salvo la importación opcional desde Lichess. Sin backend.
Diseño aprobado: `docs/DISEÑO.md`. Decisiones y supuestos: `docs/DECISIONES.md`.

## Stack
Vite 8 + React 19 + TypeScript (strict) + Tailwind 4 + vite-plugin-pwa (Workbox)
+ react-router (HashRouter) + Vitest + chess.js (reglas) + react-chessboard (tablero).
Próximos: Dexie (H1), Stockfish WASM lite single-thread (H2).
Licencia GPL-3.0-or-later (obligatoria por Stockfish). Deploy en GitHub Pages por Actions.

## Comandos
- `npm run dev` — desarrollo (sin CSP, sin SW)
- `npm test` — Vitest
- `npm run lint` — ESLint (incluye la regla del motor sin dependencias)
- `npm run build` — typecheck + build + service worker
- `BASE=/ChessBro/ npm run build && npx vite preview --base /ChessBro/` — probar como en Pages
- `node scripts/gen-icons.mjs` — regenerar PNG desde `public/icons/icon.svg`

## Estructura
- `src/engine/` — lógica pura de TS. Solo puede importar relativos y `chess.js`
  (regla ESLint). Tests en `src/engine/__tests__/`.
- `src/content/` — contenido estático (currículo, lecciones). Toda posición/solución
  se valida en tests con chess.js (y con Stockfish desde H2).
- `src/features/<pantalla>/` — pantallas. `src/ui/` — componentes reutilizables (Board, MoveList).
- `src/lib/` — integración con el navegador (PWA).

## Convenciones
- Español rioplatense (es-AR). Notación figurativa (♘f3) en UI; SAN inglés internamente.
- Tono: corto, neutro/positivo, honesto sobre el progreso. Sin sermones.
- Mobile first, una mano: botones ≥ 48 px, sin scroll horizontal.
- Cero requests en runtime salvo `lichess.org` (cuando exista la importación).
  CSP inyectada en build (`vite.config.ts`).
- Pocas dependencias: sin librería de UI, de gráficos ni state manager.
- Un commit por hito, tests en verde. Supuestos nuevos → `docs/DECISIONES.md`.

## Hitos
- [x] H0 Esqueleto PWA, tablero interactivo, CI y deploy
- [ ] H1 Táctica: subset de puzzles Lichess, Glicko-2, repaso espaciado (Dexie)
- [ ] H2 Importar partidas de Lichess + análisis Stockfish + tarjetas de error + diagnóstico
- [ ] H3 Currículo 800–1400: lecciones y finales jugables
- [ ] H4 Repertorio con repaso espaciado + plan semanal
- [ ] H5 Currículo 1400–1800, pulido, e2e offline
