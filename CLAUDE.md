# ChessBro — PWA offline para aprender ajedrez de 0 a 1800 (arranca desde 400)

App personal (un usuario, Facu, hoy ~500–600 en Chess.com, 2–5 h/semana) con currículo por
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
- `node scripts/gen-icons.mjs` — regenerar el ícono (el dibujo está en el propio script; escribe el SVG y los PNG)
- `node scripts/build-lesson-puzzles.mjs` — regenerar `src/content/lessonPuzzles.json` (ejercicios tácticos de las lecciones)
- `node scripts/e2e-offline.mjs [url] [carpeta]` — prueba de punta a punta sin conexión (necesita Playwright y la app
  servida con `vite preview`; ver la cabecera del script)
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
- `src/lib/` — integración con el navegador (PWA, motor). `src/ui/ErrorBoundary.tsx` — límite de error por pantalla (evita la pantalla en blanco).
- `src/features/games/` — importación de Lichess, análisis y detalle de partida.
- `src/features/lessons/`, `src/features/endgames/` — lecciones con ejercicios y finales contra el motor.
- `src/test/` — utilidades de tests (Stockfish en Node, `verifyExercise`, `verifyMoveChallenge`) y herramientas
  de autoría que imprimen lo que dice el motor de posiciones candidatas: `author.test.ts` (ejercicios),
  `author2.test.ts` (adivinanzas de jugadas, `CHALLENGES=…`) y `author3.test.ts` (mini-juegos de tocar, `TAPS=…`) y `author4.test.ts` (líneas de repertorio, `REP_LINES=…`) y `author5.test.ts` (líneas de la biblioteca de aperturas, `DEEP=1`), `author6.test.ts` (ejercicios y partidas de ejemplo, `EXTRAS=1`), más `explore`/`explore2`/`linecheck`/`selfplay` (búsqueda de candidatas).
- `src/content/lessonKit.ts` — helpers para escribir lecciones; `lessonsPrincipiantes.ts` — banda 400–800 y aperturas;
  `lessonsNuevas.ts` — lecciones lúdicas;
  `lessonsSerias.ts` — sus versiones serias; `styled.ts` aplica el estilo elegido.
- `src/content/repertoire.ts` — las 31 líneas del repertorio (1.e4; 1…e5 / 1…d5); `src/engine/repertoire.ts`
  deriva las tarjetas de repaso. `src/engine/plan.ts` — metas y tareas del plan semanal.
- `src/features/repertoire/`, `src/features/plan/` (pantalla "Hoy"), `src/features/learn/` ("Aprender") — repertorio (estudiar, practicar, repasar), plan y hub.
- `src/data/chesscom.ts` — importación de Chess.com (API pública). `src/content/openings.ts` + `src/features/openings/` — biblioteca
  de aperturas y "Tus aperturas"; `src/engine/openingStats.ts` — estadísticas por apertura; `src/engine/sparring.ts` — árbol de variantes para practicar contra el rival.
  `src/content/deep/` + `openingLines.ts` — 85 líneas con una nota por jugada (`deep/branches.ts` hereda notas) (se reusan en la pantalla del repertorio); `openingExtras.ts` — planes, errores del rival y partidas de ejemplo.
- `src/engine/commentary.ts` (explicación de errores), `src/engine/speak.ts` (texto → voz), `src/lib/speech.ts` y `src/ui/Speak.tsx` (voz del navegador).

## Convenciones
- Español rioplatense (es-AR). Notación figurativa (♘f3) en UI; SAN inglés internamente.
- Tono: corto, neutro/positivo, honesto sobre el progreso. Sin sermones.
- Mobile first, una mano: botones ≥ 48 px, sin scroll horizontal.
- Cero requests en runtime salvo `lichess.org` y `api.chess.com` (importación de partidas).
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
- Cada lección nueva se verifica antes de afirmarla: posiciones y respuestas con Stockfish o funciones con tests; las
  explicaciones de cada jugada se comparan con la línea real (un error mío salió así).
- Dos estilos (`data/style.ts`): "juego" y "serio". Toda lección lúdica nueva lleva su versión seria en
  `content/lessonsSerias.ts` (mismos ejercicios y respuestas; sin personajes, estrellas ni rachas).

## Hitos
- [x] H0 Esqueleto PWA, tablero interactivo, CI y deploy
- [x] H1 Táctica: subset de puzzles Lichess, Glicko-2, repaso espaciado (Dexie)
- [x] H2 Importar partidas de Lichess + análisis Stockfish + tarjetas de error + diagnóstico
- [x] H3 Currículo 800–1400: lecciones y finales jugables
- [x] H4 Repertorio con repaso espaciado + plan semanal
- [x] H5 Currículo 1400–1800, pulido, e2e offline
- [x] Primeros pasos (banda 400–800 y nivel de partida a elección), aperturas desde cero, ícono nuevo
- [x] H7 Ícono verde/negro con rey, importación de Chess.com, biblioteca de aperturas y estadísticas por apertura
- [x] H8 Análisis más exigente (umbrales 5/10/20, precisión armónica) y explicaciones con voz
- [x] H9 Comentarios de entrenador por error (preguntas y variantes) y elección de voz/velocidad
- [x] H10 Plan semanal según tus errores (punto débil, lección y puzzles del tema)
- [x] H11 Aperturas a fondo: 30 líneas con una explicación por jugada, ejercicios y repaso
- [x] H12 Cuatro pestañas (Hoy, Aprender, Partidas, Ajustes) y aperturas vivas: sesión de 5 min y práctica contra el rival que se desvía
- [x] H13 Aperturas a fondo (1ª entrega): 39 líneas, planes del medio juego, errores del rival y partidas de ejemplo
- [x] H14 Aperturas a fondo (2ª entrega): las 11 aperturas restantes (72 líneas en total), con planes, errores del rival y partidas de ejemplo
- [x] H15 Más ramas del rival: 13 líneas nuevas (85 en total) en las aperturas más comunes
- [x] H16 Robustez: avisos de error en vez de pantalla en blanco (límite de error, motor caído, partidas inválidas)
