# ChessBro — PWA offline para aprender ajedrez de 0 a 1800

App personal (un usuario, Facu, hoy <1200 online, 2–5 h/semana) con currículo por
bandas de Elo, táctica con repaso espaciado y análisis de partidas propias.
100% offline salvo la importación opcional desde Lichess. Sin backend.
Diseño aprobado: `docs/DISEÑO.md`. Decisiones y supuestos: `docs/DECISIONES.md`.

## Stack
Vite 8 + React 19 + TypeScript (strict) + Tailwind 4 + vite-plugin-pwa (Workbox)
+ react-router (HashRouter) + Vitest + chess.js (reglas) + react-chessboard (tablero).
Dexie + dexie-react-hooks + zod (datos). Stockfish 19 lite single-thread WASM en Web Worker
(`public/engine/`, versionado; `src/lib/stockfish.ts`).
Licencia GPL-3.0-or-later (obligatoria por Stockfish). Deploy en GitHub Pages por Actions.

## Comandos
- `npm run dev` — desarrollo (sin CSP, sin SW)
- `npm test` — Vitest
- `npm run lint` — ESLint (incluye la regla del motor sin dependencias)
- `npm run build` — typecheck + build + service worker
- `BASE=/ChessBro/ npm run build && npx vite preview --base /ChessBro/` — probar como en Pages
- `node scripts/gen-icons.mjs` — regenerar PNG desde `public/icons/icon.svg`
- `node scripts/build-lesson-puzzles.mjs` — regenerar `src/content/lessonPuzzles.json` (ejercicios tácticos de las lecciones)
- `node scripts/build-puzzles.mjs` — regenerar `public/puzzles/` desde `data-raw/lichess_db_puzzle.csv`
  (ver cabecera del script para la descarga y descompresión)

## Estructura
- `src/engine/` — lógica pura de TS. Solo puede importar relativos y `chess.js`
  (regla ESLint). Tests en `src/engine/__tests__/`.
- `src/data/` — Dexie (`db.ts`; migraciones: agregar `version(n)`, nunca editar las viejas),
  táctica (`tactics.ts`), carga de puzzles (`puzzles.ts`), backup (`backup.ts`).
- `src/content/` — contenido estático (currículo, temas, lecciones). Toda posición/solución
  se valida en tests con chess.js (y con Stockfish desde H2).
- `src/features/<pantalla>/` — pantallas. `src/ui/` — componentes reutilizables (Board, MoveList).
- `src/lib/` — integración con el navegador (PWA, motor).
- `src/features/games/` — importación de Lichess, análisis y detalle de partida.
- `src/features/lessons/`, `src/features/endgames/` — lecciones con ejercicios y finales contra el motor.
- `src/test/` — utilidades de tests (Stockfish en Node, `verifyExercise`, `verifyMoveChallenge`) y herramientas
  de autoría que imprimen lo que dice el motor de posiciones candidatas: `author.test.ts` (ejercicios),
  `author2.test.ts` (adivinanzas de jugadas, `CHALLENGES=…`) y `author3.test.ts` (mini-juegos de tocar, `TAPS=…`) y `author4.test.ts` (líneas de repertorio, `REP_LINES=…`).
- `src/content/lessonKit.ts` — helpers para escribir lecciones; `lessonsNuevas.ts` — lecciones lúdicas.
- `src/content/repertoire.ts` — las 24 líneas del repertorio (1.e4; 1…e5 / 1…d5); `src/engine/repertoire.ts`
  deriva las tarjetas de repaso. `src/engine/plan.ts` — metas y tareas del plan semanal.
- `src/features/repertoire/`, `src/features/plan/` — repertorio (estudiar, practicar, repasar) y plan.

## Convenciones
- Español rioplatense (es-AR). Notación figurativa (♘f3) en UI; SAN inglés internamente.
- Tono: corto, neutro/positivo, honesto sobre el progreso. Sin sermones.
- Mobile first, una mano: botones ≥ 48 px, sin scroll horizontal.
- Cero requests en runtime salvo `lichess.org` (importación de partidas).
  CSP inyectada en build (`vite.config.ts`).
- Pocas dependencias: sin librería de UI, de gráficos ni state manager.
- Un commit por hito, tests en verde. Supuestos nuevos → `docs/DECISIONES.md`.
- Todo ejercicio escrito a mano se verifica con Stockfish en los tests (`verifyExercise`); toda posición
  pasa `validateFen` (rechaza posiciones ilegales). Las respuestas de los mini-juegos de tocar salen de
  `engine/structure.ts` (con tests); las adivinanzas de jugadas, de Stockfish. Lo que no se puede verificar
  por código va como opción múltiple de concepto, con fuentes que coincidan.
- El repertorio no puede contradecirse (una jugada por posición) y Stockfish verifica cada línea; las
  explicaciones no las verifica nadie: revisarlas.
- Lecciones lúdicas: tono cálido, personajes, frases cortas; cada desafío explica el porqué al resolver.

## Hitos
- [x] H0 Esqueleto PWA, tablero interactivo, CI y deploy
- [x] H1 Táctica: subset de puzzles Lichess, Glicko-2, repaso espaciado (Dexie)
- [x] H2 Importar partidas de Lichess + análisis Stockfish + tarjetas de error + diagnóstico
- [x] H3 Currículo 800–1400: lecciones y finales jugables
- [x] H4 Repertorio con repaso espaciado + plan semanal
- [ ] H5 Currículo 1400–1800, pulido, e2e offline
