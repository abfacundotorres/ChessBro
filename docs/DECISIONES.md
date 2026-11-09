# Decisiones y supuestos

## H0
- **Licencia GPL-3.0-or-later** desde el inicio, porque en H2 se empaqueta Stockfish (GPL-3).
- **Notación figurativa** (♘f3) en la UI: es la que se ve en Lichess y no depende del idioma
  (la española R/D/T/A/C no se usa online). Internamente se guarda SAN inglés y jugadas from/to.
- **Estado de partida = posición inicial + lista de jugadas**, y la vista se deriva con
  `replay()`. Así funcionan deshacer y la triple repetición (que necesita historia).
- **El tablero acepta clic-clic y arrastre.** Clic-clic es más cómodo con una mano en el celular.
- **Coronación con selector** (no se corona dama automáticamente: la subpromoción es parte de la táctica).
- **Colores del tablero gris azulado** (alto contraste, cómodo en claro y oscuro).
- **Tema claro/oscuro según el sistema**, sin selector manual por ahora.
- **CSP sin 'unsafe-inline'**: los estilos dinámicos del tablero se aplican por CSSOM (React),
  que la CSP no bloquea. Verificado en el build sin violaciones.
- **El SW pide confirmación para actualizar** (banner) en vez de recargar solo en medio de un ejercicio.
- **El usuario de Lichess es un ajuste opcional** (H2), no se escribe en el código.

## H1
- **Subset de puzzles de Lichess (CC0)**: 20.458 puzzles entre 400 y 2400, filtrados por
  RD ≤ 80, popularidad ≥ 80 y ≥ 300 partidas jugadas. Por franja de 100 puntos se toman los
  450 más jugados + los 50 más jugados de cada tema (cobertura de temas en todos los niveles).
  Se versiona la salida (2,3 MB, `public/puzzles/`), no la base cruda. Un test reproduce
  la solución de cada puzzle con chess.js.
- **Descompresión**: la base usa zstd *seekable* (un frame "skippable" al inicio) que el
  zstd de Node 22 no lee. Se descomprime con `zstd -d --long=31` o con Python `zstandard`.
- **31 temas propios** (máscara de bits de 32 bits) que agrupan los de Lichess; el orden de
  `src/content/themes.json` define los bits y no se puede reordenar sin regenerar los puzzles.
- **Rating Glicko-2** (τ = 0,5), inicial 1300 ± 300: por debajo de 1200 online el rating de
  puzzles suele estar en 1100–1400. RD acotado a [45, 350] para que siga moviéndose.
  Se muestra "?" mientras RD > 110 (provisional). Los primeros puzzles mueven mucho el rating.
- **Se puntúa al primer error** (o pista/solución) y no se espera al final: así "Siguiente"
  no sirve para esquivar un fallo. Después del error se puede seguir intentando.
- **Mate alternativo vale**: como en Lichess, cualquier jugada que da mate es correcta.
- **Ventana de selección** de −75 a +150 respecto del rating (un poco por encima, para que
  cueste), que se agranda si no hay candidatos. No se repiten puzzles ya intentados.
- **Repaso espaciado tipo Leitner** solo para puzzles fallados: 1, 3, 7, 16, 35 días;
  fallar vuelve a la caja 0; acertar en la última caja lo retira. Los repasos no cambian
  el rating. La tarjeta guarda una copia del puzzle para no depender de los chunks cargados.
- **El rating y los temas del puzzle se muestran recién al terminar**, para no sesgar.
- **Backup JSON** (export/import con validación zod) en Ajustes: los datos viven solo en
  IndexedDB y el navegador puede borrarlos.
- **Entorno de Claude Code "ChessBro"** con acceso a `database.lichess.org` y `lichess.org`.

## H2
- **Stockfish 19 lite single-thread** (1,8 MB, GPL-3) versionado en `public/engine/` con su
  licencia, en vez de depender del paquete npm (205 MB por todas las variantes). Corre en un
  Web Worker; la CSP suma `'wasm-unsafe-eval'`. Se precachea: funciona offline.
- **Profundidad 14** por posición (~0,1–0,2 s en desktop; estimado ~1 s en un celular medio,
  ~30–90 s por partida). Se puede cancelar. Las evaluaciones se guardan para no recalcular.
- **Importación desde Lichess**: `GET /api/games/user/{usuario}` en ndjson, últimas 20
  partidas blitz/rápidas/clásicas/correspondencia (sin bullet: demasiado rápido para aprender).
  No necesita token. La CSP suma `connect-src https://lichess.org`.
  **No se pudo probar contra Lichess real desde el entorno de desarrollo** (la exportación
  de partidas responde 404 a ese servidor aunque el resto de la API funciona); se probó con
  respuestas simuladas con el formato de la especificación OpenAPI oficial.
- **Clasificación de errores**: umbrales de Lichess sobre probabilidad de ganar (10/20/30
  puntos = imprecisión/error/error grave). Tipo, en orden de prioridad: permitiste mate,
  se te pasó un mate, pieza colgada (el rival gana ≥ 2 puntos de material en 3 jugadas,
  empezando con una captura), táctica no vista (la mejor jugada era jaque o captura y ganaba
  material o ≥ +3), apertura (jugada ≤ 12), final (material sin peones ≤ 26), posicional.
  Son heurísticas: aciertan en lo grueso, no en cada caso.
- **Solo los errores tácticos graves (error y error grave) se vuelven ejercicios**: tienen una
  respuesta clara. Los de apertura/posicionales/finales se muestran en la partida pero no
  entran al repaso. Los ejercicios vencen el mismo día, para practicarlos en caliente.
- **En los ejercicios de partidas propias se aceptan alternativas**: si la jugada no es la del
  motor, se evalúa con Stockfish (profundidad 12) y vale si pierde < 10 puntos de probabilidad
  de ganar respecto de la mejor.
- **Diagnóstico sin test aparte**: la fase provisional del rating de puzzles (RD > 110, ~20–30
  puzzles) cumple la función del test de ubicación. La banda actual es la más baja cuyos
  criterios medibles no se cumplen; hacen falta ≥ 5 partidas analizadas para el criterio de
  errores graves. Los criterios que la app todavía no mide (finales contra el motor) se
  muestran como pendientes y no bloquean.
- **Backup v2** incluye partidas, análisis y ajustes; sigue importando backups v1.
- Cambiar de modo (nuevos/repaso) o de tema carga otro puzzle al instante.

## H3
- **Dos tipos de ejercicios en las lecciones**: los *tácticos* (horquilla, clavada, descubierta…) salen de
  puzzles de Lichess elegidos por `scripts/build-lesson-puzzles.mjs` (los más populares y fáciles de cada
  tema, un solo motivo por puzzle, sin repetir entre lecciones); los de *mates y finales* están escritos
  a mano y los verifica un test con Stockfish.
- **Verificación con el motor de los ejercicios escritos a mano** (`src/test/verifyExercise.ts`): para cada
  posición evalúa TODAS las jugadas legales (profundidad 12) y exige que `accept` sea exactamente el conjunto
  de jugadas buenas (< 8 puntos de probabilidad de ganar menos que la mejor; para mate en n, las que dan
  mate en ≤ n). Si el motor encuentra otra jugada tan buena, el test falla: o se agrega a `accept` o se cambia
  la posición. Los mates en 2+ exigen clave única. Así nunca se marca como error una jugada correcta.
- **Las respuestas del rival en los ejercicios de finales son ilustrativas**: se muestra la línea del motor,
  pero el ejercicio es de una jugada (la clave).
- **`validateFen` ahora rechaza posiciones ilegales** (el bando que no mueve está en jaque), que chess.js
  acepta. Salió de un error propio: tres ejercicios de oposición tenían el rey negro en jaque con las blancas
  a mover y el motor los evaluaba igual.
- **Finales jugables contra el motor**: el rival juega a profundidad 10 y se calcula en el teléfono. Los
  límites de jugadas (25 dama, 29 torre, 40 rey y peón, 30 para salvar tablas) se comprobaron con una
  simulación motor contra motor en los tests. Mate de torre "en menos de 30 jugadas" = 29 jugadas propias.
- **Pistas en finales**: muestran la mejor jugada del motor (profundidad 12) pero la partida deja de contar
  para el progreso (el criterio del diagnóstico usa solo victorias sin pistas).
- **Diagnóstico**: el criterio "mate de torre en < 30 jugadas" de la banda 1100–1400 ahora se mide con el
  mejor resultado sin pistas del final de torre. Lucena/Philidor siguen pendientes hasta H5.
- **Lecciones de lectura sin ejercicios** (apertura, mate de dama/torre) se marcan como terminadas al leerlas.
- **No se implementaron** "Cálculo: jaques, capturas, amenazas" ni "Repertorio mínimo" como lecciones: la
  primera ya está en *Chequeo de seguridad*; el repertorio es H4.
- **La barra de navegación** pasó a: Inicio · Lecciones · Táctica · Partidas · Ajustes. El tablero libre
  se abre desde Inicio.
