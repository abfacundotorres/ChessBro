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

## Clases lúdicas (entre H3 y H4)
- **Pedido**: lecciones nuevas hasta 1400 que sean lúdicas y pedagógicas, usando información de internet.
  Se eligió: historias y personajes, mini-juegos en el tablero, desafíos con estrellas y rachas, y
  adivinanzas; fuentes cualesquiera, reescritas.
- **Cómo se usó internet**: se hicieron búsquedas web para contrastar los conceptos (estructura de
  peones, alfil bueno/malo y avanzadas, columnas abiertas y séptima fila, desarrollo y tempo, cambios
  cuando se va ganando, seguridad del rey). Solo se leyeron los resúmenes de la búsqueda, no las páginas
  completas. Se tomaron las ideas en las que coinciden varias fuentes y **se descartaron las cifras sueltas**
  (por ejemplo, "el par de alfiles vale cinco peones"), que son reglas empíricas. **Todo el texto es propio**;
  los enlaces de "Para seguir leyendo" son lecturas relacionadas, no material copiado.
- **Siete lecciones nuevas**: La balanza de las piezas, La carrera del desarrollo (banda 800–1100); Los
  peones, El alfil/el caballo y su balcón, La torre pide columnas abiertas, El refugio del rey, Cómo cerrar
  una partida ganada (banda 1100–1400). Cada una trae historia con personajes y 3 a 5 desafíos.
- **Tres tipos de desafío, todos verificables**:
  - *Tocar casillas* (mini-juego): la respuesta sale de funciones puras con tests
    (`engine/structure.ts`: aislados, doblados, pasados, piezas colgadas, avanzadas, columnas abiertas,
    alfil malo, piezas sin desarrollar). El test exige que la respuesta que escribí coincida con la calculada.
  - *Elegir jugada*: Stockfish verifica que la respuesta es buena y que cada distractor es claramente peor
    (≥ 12 puntos de probabilidad de ganar). Solo se usa donde la diferencia es objetiva (regalar material,
    dejarse mate): **no se pueden "verificar" preguntas de estilo** como "¿cuál desarrolla mejor?".
  - *Opción múltiple*: para conceptos que no se pueden calcular (valores aproximados, planes). Las
    respuestas vienen de lo que coincide en varias fuentes y se redactaron con las salvedades del caso
    (por ejemplo, que cambiar piezas cuando se va ganando solo sirve si el final resultante se gana).
- **El verificador encontró un error mío**: en la defensa contra el mate del pastor yo había puesto ...♘f6
  como respuesta correcta; es justo la jugada que permite ♕xf7 mate. Las buenas son ...♕e7 y ...g6.
- **Definiciones simplificadas, dichas como tales en la lección**: "alfil malo" = 4 o más peones propios en
  el color de su casilla y ≤ 5 jugadas posibles; "pieza colgada" = atacada y sin defensa, o atacada por una
  pieza de menor valor (no considera clavadas ni rayos X); "avanzada" = casilla vacía en la 4.ª–6.ª fila
  (desde cada bando), defendida por un peón y que ningún peón rival puede atacar.
- **Estrellas**: 3 sin errores; 2 si los errores no pasan de uno cada cuatro desafíos (mínimo uno); 1 si hay
  más. Cada intento equivocado y cada "ver solución" cuenta. Se guarda la mejor marca. Las lecciones de pura
  lectura (apertura, mates de dama y torre) no tienen puntaje.
- **Racha**: días seguidos con alguna práctica (puzzle, ejercicio o desafío de lección, final). Sigue viva si
  practicaste hoy o ayer. Se guarda por día en Dexie v4 (`activity`), entra en el backup v4.
- **Bug del tablero encontrado probando**: al terminar de mover una pieza del rival en un final, mi script
  leyó el tablero a mitad de la animación; no era un error de la app, pero confirmó que el tablero necesita
  ~150 ms para estabilizarse tras cada jugada.

## H4
- **Repertorio elegido (mi recomendación, aceptada)**: con blancas 1.e4; con negras 1…e5 contra 1.e4,
  1…d5 contra 1.d4 y 1…e5 contra 1.c4. Criterio: pocas ideas, poca teoría, estructuras repetidas (Italiana
  tranquila, Alapin, Avance francés, Londres/Colle) y buen rendimiento a nivel 800–1600. 24 líneas: 13 con
  blancas y 11 con negras, de 5 a 9 jugadas propias cada una.
- **Qué NO cubre**: el Gambito de Rey, 1.d4 con ideas raras (Blackmar, Trompowsky…), 1.Cf3 que no transponga
  y la Siciliana con 2.c3 evitada por las negras con …e6 o …Cc6. Esas partidas se juegan con los principios
  de la apertura; si aparecen seguido en tus partidas importadas, se agregan líneas.
- **Verificación**: un test juega cada línea con Stockfish: ninguna jugada propia puede perder más de 8
  puntos de probabilidad de ganar respecto de la mejor, ninguna respuesta del rival puede regalar más de 15
  (si no, la línea enseña a ganarle a un rival que no existe) y la posición final tiene que ser sana
  (≥ −60 cp para quien la juega). Otro test comprueba que el repertorio no se contradiga (una sola jugada por
  posición y color). **El motor verifica las jugadas, no las explicaciones**: las ideas, planes y notas son
  texto mío, sin consulta a fuentes externas en esta etapa; conviene que los revises. Un error mío que
  salió en la revisión: había escrito que las negras "recapturan con el peón h" en el Londres (eso lo hacen
  las blancas).
- **Tarjetas de repaso**: una por cada posición en la que te toca mover. Dos líneas que llegan a la misma
  posición (transposición) comparten la tarjeta. Se crean al practicar una línea completa y vencen al día
  siguiente. Cajas de 1, 3, 7, 16 y 35 días como los puzzles, pero **nunca se "gradúan"**: una tarjeta
  dominada vuelve cada 35 días para no olvidar la línea.
- **El resultado de una tarjeta cuenta en el primer intento**: si fallás o pedís la respuesta, vuelve mañana
  desde la primera caja, aunque después encuentres la jugada. (Bug encontrado probando: antes de arreglarlo,
  una tarjeta fallada quedaba como vencida y sin fallo anotado.)
- **Practicar vs. estudiar**: *Estudiar* recorre la línea con la idea, el plan y las notas; *Practicar* te
  hace jugar tus jugadas contra las respuestas del rival de la línea. Una jugada legal pero distinta de la
  línea cuenta como error, aunque sea buena: el repertorio entrena una respuesta concreta.
- **Plan semanal**: las horas por semana (2 a 5, por defecto 3) fijan las metas: 12 puzzles por hora, 1–2
  lecciones, 1–2 líneas nuevas y 1–3 partidas lentas analizadas (30 min cada una). La semana va de lunes a
  domingo. Es una **guía**: nada se bloquea ni se penaliza si no se cumple.
- **"Para hoy"**: primero lo que vence (repertorio y puzzles fallados), después puzzles, lección, línea
  nueva y partidas. Se recorta al tiempo de una sesión (se tolera pasarse un 25 %); el resto queda en "si te
  queda tiempo". La próxima línea alterna de color según cuál tengas menos practicado.
- **Dexie v5** (`repcards`, `replines`) y backup v5, compatible con los anteriores.
- **Navegación**: el repertorio y el plan se abren desde Inicio (tarjeta "Para hoy" y módulos); la barra
  inferior sigue con cinco pestañas.

## Estilo de estudio: Juego o Serio
- **Pedido**: elegir al inicio entre "juego" y "serio". Se pregunta en la primera apertura (pantalla de
  bienvenida) y se puede cambiar en Ajustes. Se guarda en la tabla de ajustes y entra en el backup.
- **Juego** es lo que ya había: historias y personajes, adivinanzas, mini-juegos, estrellas y racha.
- **Serio** usa el mismo contenido (mismas posiciones, mismos ejercicios, mismas respuestas) con otro registro:
  - Las siete lecciones lúdicas tienen una versión técnica (`src/content/lessonsSerias.ts`): sin personajes
    ni metáforas, con títulos como "Estructura de peones" o "Convertir una ventaja".
  - Los desafíos pasan a llamarse "Ejercicio" y la devolución es "Correcto." / "Incorrecto.".
  - No se muestran estrellas, rachas ni emojis. **Se siguen registrando por debajo**: si cambiás a Juego, las
    estrellas y la racha ya están. El plan semanal y el avance de las lecciones se muestran igual.
- **Lo que no cambia con el estilo**: las lecciones de la banda 800–1400 anteriores a las lúdicas (mates,
  horquilla, clavada, finales…) ya estaban escritas en un registro neutro y se muestran igual en ambos
  estilos. Los puzzles, los finales, el repertorio y el análisis de partidas tampoco cambian.
- **Un test** exige que cada versión seria tenga un texto por cada paso, que no queden personajes ni metáforas
  lúdicas, y que las posiciones y respuestas sean idénticas a las de la versión juego.
- **Regla para el contenido nuevo (H5)**: toda lección con tono lúdico debe traer también su versión seria.
