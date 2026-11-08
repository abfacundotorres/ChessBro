# Diseño de ChessBro

Objetivo: llevar a un jugador de <1200 online a ~1800 con 2–5 h/semana.
Estimación honesta: 1,5 a 2,5 años con constancia. La app no reemplaza jugar:
se recomiendan 2–3 partidas por semana a 15+10 o más lento, analizadas. Bullet no.

## Premisa
Hasta ~1400 las partidas se deciden por piezas colgadas y táctica simple que no se vio.
Por eso el orden es: (1) chequeo de seguridad antes de cada jugada, (2) táctica por
patrones con repaso espaciado, (3) análisis de las partidas propias para convertir
errores en ejercicios. Aperturas y estrategia pesan recién a partir de ~1400.

## Currículo por bandas
Avanzar de banda tiene criterios medibles (rating de puzzles, errores graves por partida,
finales ganados contra el motor). Contenido en `src/content/curriculum.ts`.

| Banda | Foco | Para avanzar |
|---|---|---|
| 800–1100 | No colgar piezas, mate en 1-2, horquilla/clavada/doble, principios de apertura, mates D+R y T+R | Puzzles ≥ 1200, < 1 error grave por partida |
| 1100–1400 | Descubierta, desviación, sobrecarga, eliminación del defensor; oposición, regla del cuadrado; repertorio mínimo | Puzzles ≥ 1450, mate T+R en < 30 jugadas |
| 1400–1600 | Estructuras de peones, piezas buenas/malas, planes, conversión; finales de torre (Lucena, Philidor) | Ganar/defender esos finales vs. motor |
| 1600–1800 | Cálculo profundo, profilaxis, transición a finales, repertorio ampliado | Puzzles ≥ 1900, rating real subiendo |

Semana tipo (3 sesiones de 45–60 min): 10' repaso · 20' táctica · 20' lección o final,
más 2–3 partidas lentas analizadas.

## Módulos
1. **Diagnóstico inicial** — ~30 puzzles calibrados + análisis de las últimas partidas de Lichess → ubica en una banda.
2. **Táctica** — subset de 30–50k puzzles de la base de Lichess (CC0) por tema y rating;
   rating propio Glicko-2; los fallados entran al repaso espaciado.
3. **Lecciones** — posición + explicación corta + ejercicios.
4. **Finales jugables** — posiciones a ganar o defender contra Stockfish.
5. **Análisis de partidas** — importación desde Lichess (API pública, sin token),
   Stockfish local marca errores, se clasifican (pieza colgada, táctica no vista, final,
   apertura) y se convierten en tarjetas.
6. **Repertorio** — líneas con repaso espaciado (banda 1100–1400 en adelante).
7. **Progreso y plan** — rating de puzzles, errores graves por partida, rating de Lichess, plan semanal.

## Técnica
- Mismo enfoque que una PWA offline: Vite + React + TS + Tailwind + Workbox, Dexie para datos.
- `chess.js` (BSD-2) para reglas; `react-chessboard` (MIT) para el tablero (piezas SVG embebidas).
- Stockfish WASM *lite single-thread* (~7 MB): la versión multihilo necesita headers
  COOP/COEP que GitHub Pages no permite configurar. Stockfish es GPL-3 → el repo es GPL-3.
- Puzzles: un script procesa el CSV de Lichess (cientos de MB, no se versiona: `data-raw/`)
  y genera un subset de pocos MB que sí se empaqueta.
- Red: cero requests salvo `lichess.org` para importar partidas.
- Riesgo principal: errores en el contenido escrito a mano. Mitigación: cada FEN y
  solución se valida en tests con chess.js y, desde H2, con Stockfish.

## Hitos
- **H0** Esqueleto PWA, tablero interactivo, CI y deploy.
- **H1** Táctica: subset de puzzles, Glicko-2, repaso espaciado.
- **H2** Importar partidas de Lichess, análisis con Stockfish, tarjetas de error, diagnóstico.
- **H3** Currículo 800–1400: lecciones y finales jugables.
- **H4** Repertorio con repaso espaciado y plan semanal.
- **H5** Currículo 1400–1800, pulido y e2e offline.
