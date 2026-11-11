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

## H5
- **Contenido de las bandas 1400–1600 y 1600–1800**: seis lecciones nuevas, cada una en estilo Juego y Serio.
  1400–1600: la posición de Lucena, la defensa Philidor y torres activas (regla de Tarrasch).
  1600–1800: calcular con método, profilaxis y transición del medio juego al final.
  Los conceptos se contrastaron con fuentes (Wikipedia, Chess.com, ChessBase, Chess Programming y artículos sobre
  cálculo y profilaxis), que figuran en "Para seguir leyendo". El texto es propio; **la explicación de cada
  lección no la verifica ningún test**, solo las posiciones, los ejercicios y las adivinanzas de jugadas.
- **Lucena y Philidor son finales jugables, no ejercicios de una jugada.** Probé posiciones con el motor y en las dos
  hay muchas jugadas que mantienen el resultado, así que no existe "la jugada clave" única que enseñan estas
  técnicas (son varias jugadas de técnica). Para practicarlas hay finales contra Stockfish y las lecciones explican
  el método (el puente; la muralla en la sexta y los jaques desde atrás).
- **Objetivo nuevo "coronar"** (`promote`): se gana al coronar y conservar la dama después de la respuesta del rival,
  en 25 jugadas como máximo; se pierde si capturan el peón o se acaban las jugadas. No exige usar el "puente": el
  motor, jugando de blancas, corona por otro camino (cambio de torres). Lo que se verifica es la coronación, no la
  técnica; la técnica la explica la lección.
- **Error propio con el motor como juez**: mi primera posición de Lucena tenía el rey negro en d8, demasiado cerca;
  no es la de Lucena y el motor no la ganaba con 18 de profundidad. La posición canónica (rey negro en f7, cortado
  por la torre de e1) sí se gana. La prueba de motor contra motor lo detectó.
- **Explicaciones de las adivinanzas de cálculo, comprobadas contra la línea real**: escribí las explicaciones antes
  de mirar las variantes; al verificarlas corregí la de ♗d5 (no ataca la torre: es un desvío, ♗d5 ♖xd5 exd5).
- **Diagnóstico**: los criterios de la banda 1400–1600 ("ganar y defender Lucena/Philidor contra el motor") ya se miden:
  hace falta una victoria sin pistas en cada final. Dejan de ser "pendientes".
- **Repertorio ampliado a 31 líneas** (16 con blancas, 15 con negras): Pirc, Alapin contra …e6 y …Cc6, Gambito de Rey
  rehusado, Gambito Evans, Londres con 2.Af4 y Gambito de Dama con 2.Cf3. **Se descartó Dos Caballos (3…Cf6)**:
  contradecía la decisión del repertorio de responder 3.Ac4 con …Ac5, y el test de consistencia lo detectó. Esto es
  una decisión de repertorio, no un error del motor: si querés jugar Dos Caballos, hay que cambiar las líneas del
  Giuoco, no sumar otra.
- **Prueba de punta a punta sin conexión** (`scripts/e2e-offline.mjs`, con Playwright): abre la app con red, espera
  al service worker, corta la red y recorre 15 pantallas a 360 px sin desborde horizontal, juega contra Stockfish
  desconectado, resuelve un puzzle, un mini-juego, practica una línea del repertorio, exporta un backup y verifica el
  modo oscuro y la ausencia de errores de consola. **No corre en el CI** (necesita Chromium); se corre a mano.
- **Pulido**: título agregado al tablero libre (era la única pantalla sin encabezado); el plan semanal ya no usa
  palabras del estilo Juego en el estilo Serio; el diagnóstico ya no muestra paréntesis anidados.
- **Lo que no se probó**: la importación real desde Lichess (el entorno de desarrollo no puede llegar a la exportación
  de partidas), el rendimiento del análisis en un teléfono real y la instalación como app en iOS/Android.

## Primeros pasos, aperturas desde cero e ícono nuevo
- **Pedido**: (1) empezar desde más atrás (500–600 de Elo en Chess.com), (2) enseñar aperturas, (3) un ícono menos
  negro, más divertido y lindo.
- **Punto de partida a elegir** (segundo paso de la bienvenida, cambiable en Ajustes): *Recién empiezo*, *Hasta 800*,
  *800–1200*, *Más de 1200*. Define el rating inicial de puzzles (600, 800, 1100, 1400), desde qué banda se evalúa
  el diagnóstico y con qué lección arranca el plan. **Los Elo son orientativos**: Chess.com, Lichess y los puzzles
  miden en escalas distintas; el rating de puzzles se ajusta solo con los primeros 20–30 resultados.
  Quien ya conoce las reglas ("Hasta 800") arranca en "No regalar piezas"; las lecciones de reglas siguen en la lista.
- **Banda nueva 400–800** (primeros pasos), con criterios de salida: puzzles ≥ 950, menos de 2,5 errores graves por
  partida y mate de dama y rey en 25 jugadas. Se reubicaron en ella las lecciones que más suben a ese nivel:
  chequeo de seguridad, la balanza de las piezas, mate en 1, desarrollo, principios de apertura y mate de dama.
- **Seis lecciones nuevas**, cada una en Juego y Serio: el movimiento de cada pieza, jugadas especiales (enroque, al
  paso, coronación), jaque / mate / tablas, tu primera apertura (la Italiana, paso a paso con el porqué de cada
  jugada), aperturas con negras y trampas frecuentes (mate del loco, mate del pastor y su defensa, trampa de Légal).
- **Todo lo verificable se verifica por código**: las casillas de "a dónde puede ir esta pieza" salen de las jugadas
  legales de chess.js (incluidos el enroque y la captura al paso); un test comprueba con chess.js que una posición es
  de jaque, mate o ahogado cuando una pregunta lo afirma; las adivinanzas de jugadas (mate del loco, del pastor,
  Légal y el mate del pasillo) las verifica Stockfish. Las dos variantes de la trampa de Légal que cité en la
  explicación se comprobaron una por una con chess.js (la mía decía otra cosa sobre una de ellas).
- **Repertorio "para empezar"**: 8 líneas marcadas (4 por color: Italiana ×2, Escandinava y Moderna con blancas;
  Giuoco ×2, Colle y Londres con negras). Aparecen primero y el plan las sugiere antes que el resto.
- **Bug mío, atrapado por un test**: al hacer que el rating inicial dependa del nivel, `recordAttempt` pasó a leer la
  tabla de ajustes dentro de su transacción sin incluirla, y el primer puzzle de un usuario nuevo habría fallado.
  Quedó arreglado y con un test.
- **Otro defecto real, atrapado por la prueba sin conexión**: varias lecciones nuevas mostraban dos tableros iguales
  (el diagrama del paso y el del desafío). Ahora solo se ve el del desafío cuando comparten posición.
- **Ícono nuevo** (`scripts/gen-icons.mjs`, que dibuja el SVG y genera los PNG): un peón sonriente con mejillas rosas
  sobre un degradé violeta–rosa, con destellos y un toque de tablero. La variante "maskable" (para Android) y la de iOS
  van sin esquinas y con el personaje más chico para que el sistema las recorte sin cortarlo. El color de la barra del
  navegador y de la pantalla de carga pasó de negro a violeta (#7B5CFA) y lavanda (#F4EEFF).

## H7: ícono verde, Chess.com y aperturas
- **Ícono**: tablero verde y negro (8×8) con un rey blanco-crema al frente (`scripts/gen-icons.mjs`). La variante
  maskable y la de iOS van sin esquinas y con el dibujo más chico. Colores de la app: verde #1F8A3F de barra y negro
  #101311 de pantalla de carga. Los colores de la interfaz (acento violeta) no cambiaron.
- **Chess.com** (`src/data/chesscom.ts`): API pública (`api.chess.com`, CORS abierto), sin clave. Se pide la lista de
  meses y se baja de a un mes por vez (de atrás para adelante, hasta 4) para no pasarse del límite. Las partidas
  vienen en PGN: se limpian comentarios, relojes y numeración y se convierten a UCI como las de Lichess. Se ignoran
  variantes (`rules ≠ chess`), el bullet y las de menos de 4 jugadas. El id es `cc-<número de partida>` y los registros
  nuevos llevan `source` (las anteriores, sin `source`, son de Lichess). `https://api.chess.com` se agregó al CSP.
  Probado contra la API real (62 de 62 partidas de un mes se convirtieron) y con un fixture de partidas reales.
  Un navegador no puede poner `User-Agent`; la API lo pide solo en ráfagas, y la app no hace ráfagas.
- **Análisis en lote**: "Analizar pendientes" corre Stockfish sobre hasta 5 partidas sin analizar, con progreso y
  cancelación; cada error grave sigue convirtiéndose en ejercicio de repaso.
- **Aperturas** (`content/openings.ts`): 23 familias con idea, planes, errores típicos, trampa verificada (tests con
  chess.js, incluido el mate de Légal) y enlace a las líneas del repertorio. Las explicaciones no las verifica ningún
  programa. "Tus aperturas" agrupa tus partidas por familia (reconocida por el nombre en inglés que ponen Chess.com y
  Lichess) y bando, con ganadas/tablas/perdidas y errores graves en las primeras 10 jugadas de las analizadas. Lo que no
  cae en ninguna familia se agrupa por el nombre original.

## H8: análisis más exigente y explicaciones con voz
- **Análisis (cambio de reglas)**: el usuario vio un solo error y precisiones de 90 % o más. Se calibró contra la
  precisión que Chess.com informa por partida (6 lados de 3 partidas reales, Stockfish a profundidad 12): el promedio
  simple de la precisión por jugada daba en promedio +11 puntos de más (RMSE 13,5); la media armónica queda sin
  sesgo (+0,6; RMSE 7,8). Ahora la precisión es la media armónica, y los umbrales de error pasaron de 10/20/30 a
  **5/10/20** puntos de probabilidad de ganar (imprecisión / error / error grave), parecidos a las bandas de Chess.com.
  Limitación: son pocas partidas (Chess.com solo informa la precisión de las que se revisan), así que es un ajuste
  razonable, no una réplica de su fórmula. La app no iguala el número de Chess.com.
- **Recálculo**: las partidas ya analizadas se recalculan una vez al abrir la app con las evaluaciones guardadas
  (`refreshAnalyses`, setting `analysisRules`), sin volver a correr Stockfish; si aparecen errores tácticos nuevos,
  se agregan al repaso.
- **Comentarios de errores** (`engine/commentary.ts`): plantillas en español por tipo de error con tu jugada, la que
  prefería el motor y los puntos perdidos. No son un modelo de lenguaje: no inventan variantes.
- **Voz** (`lib/speech.ts`, `ui/Speak.tsx`): `speechSynthesis` del navegador, sin conexión ni dependencias. `engine/speak.ts`
  traduce la notación para que se lea bien ("Cf3" → "caballo f3", "O-O" → "enroque corto", emojis fuera). Botón
  "Escuchar" en comentarios de partidas, pasos de lecciones, explicaciones de desafíos y ejercicios, notas del
  repertorio, aperturas y resultado de táctica. En Ajustes: "Leer las explicaciones solo" (apagado por defecto) y
  prueba de voz. La calidad depende de las voces del teléfono; si no hay voz en español se avisa.

## H9: comentarios de entrenador y elección de voz
- **Comentarios** (`engine/commentary.ts`, `features/games/Coach.tsx`): cada error abre una conversación: arranca con
  "¿Qué pasó?" y podés preguntar "¿Por qué fue malo?", "¿Qué debí jugar?", "¿Qué quería el rival?" y "¿Cómo lo
  evito?", o pedir "Decímelo de otra forma" (cambia la redacción). **No es un modelo de lenguaje**: son plantillas con
  muchas variantes, completadas con hechos calculados con chess.js sobre la posición (qué pieza quedó atacada y sin
  defensa, si la mejor jugada captura, da jaque, enroca o pone a salvo algo, qué atacaba la última jugada del rival).
  Es determinístico (mismo error y semilla → mismo texto). Un LLM de verdad requeriría red y una clave de API, y rompería
  el "sin conexión"; por eso no se usa. Límite honesto: los hechos son simples (no ve clavadas, tenedores ni planes), y
  si el error no encaja en ninguno, usa una frase genérica del tipo de error.
- **Voces**: en Ajustes se elige la voz entre las del sistema (por defecto solo las de español; hay un check para ver
  todas), la velocidad (lenta a muy rápida) y la lectura automática. Se guardan en la tabla de ajustes
  (`voiceName`, `voiceRate`). Si la voz guardada desaparece, vuelve a "Automática". Las voces marcadas "necesita
  conexión" son de red: sin internet no suenan.

## H10: plan según tus errores
- **Patrones** (`engine/patterns.ts`): se agrupan por tipo los errores y errores graves (no las imprecisiones) de las
  últimas 10 partidas analizadas. Con menos de 3 partidas no se recomienda nada. El "punto débil" es el tipo más
  frecuente con al menos 0,3 por partida; lo posicional se muestra pero no se elige (no hay ejercicio que lo entrene).
- **Qué cambia en el plan**: aparece la tarea "Tu punto débil: …" (puzzles del tema que corresponde, o Aperturas para
  los errores de apertura) y se le descuentan 5 puzzles a la táctica común. Si hay una lección que lo trabaja y no está
  hecha, pasa a ser la lección sugerida ("Para tu punto débil"), salvo que sea de una banda más de una por encima del
  nivel de partida (por ejemplo, Oposición para quien arranca). En Plan hay una sección "Tus errores" con el reparto.
- **Correspondencia tipo de error → entrenamiento** (`FOCUS`): colgada → hangingPiece + Chequeo de seguridad; mate
  permitido → mateIn2 + Refugio del rey; mate no visto → mateIn2 + Mate en 2; táctica no vista → fork + Horquilla;
  apertura → principios + Aperturas; final → endgame + Oposición; posicional → Profilaxis. Un test comprueba que todas
  las lecciones y temas existen.
- **Límite**: la clasificación "Final" cuenta posiciones con poco material (≤ 26 de piezas no peón entre los dos), que
  incluye medios juegos simplificados; con pocas partidas, un tipo puede salir primero por azar.

## H11: aperturas a fondo
- **Alcance** (a pedido): las 10 aperturas principales (Italiana, Ruy López, Escocesa, Siciliana, Francesa, Caro-Kann,
  Escandinava, Gambito de Dama, Londres e India de Rey) con **3 líneas cada una**, 30 en total, y **una explicación
  por cada jugada** (también las del rival). El resto de la biblioteca queda como estaba (resumen, planes, errores,
  trampa). Las líneas son de 12 a 20 jugadas, hasta donde la teoría es estable para un nivel de 500–1200.
- **Estructura**: `content/deep/*.ts` (definiciones con notas por jugada y preguntas) → `content/openingLines.ts`. Cada
  línea es un `RepLine`, así que se estudia y se practica con la misma pantalla del repertorio y entra en el mismo
  **repaso espaciado**. Dentro de una apertura las líneas solo se separan por jugadas del rival (las del usuario no se
  contradicen); las tarjetas llevan el id de la apertura como prefijo para no chocar con las del repertorio. Un test
  comprueba legalidad, una nota por jugada, bando, ausencia de conflictos y que las tarjetas existan.
- **Verificación**: `DEEP=1 npx vitest run src/test/author5.test.ts` evalúa con Stockfish (profundidad 14) todas las
  líneas: ninguna jugada propia pierde ≥ 8 puntos de probabilidad de ganar ni ninguna del rival ≥ 15. Las 30 pasan.
  Antes de escribir las notas se probaron candidatas y se descartó una línea de la Escandinava (…Dd7 perdía 14).
  **Las explicaciones no las verifica ningún programa**; al releerlas encontré y corregí varias afirmaciones
  imprecisas (qué atacaba cada pieza, para qué servía c3 en la Italiana). Conviene que las lea alguien que sepa.
- **Ejercicios** por apertura (pestaña Ejercicios): "¿Qué jugás acá?" (10 posiciones al azar de tus líneas; lo que
  fallás vuelve al repaso si esa posición ya estaba), preguntas de concepto (opción múltiple, 1–2 por línea, con
  explicación) y ejercicios de trampa (Petroff, Légal, Noé y el Elefante: encontrá el golpe).
- **Pantalla**: la apertura se organiza en pestañas (Resumen, Líneas, Ejercicios) para que entre bien en el celular, y se
  reforzó el margen inferior (`env(safe-area-inset-bottom)`) por un corte que se vio en el teléfono. No pude reproducirlo
  en pantallas simuladas de 360 y 393 px, así que ese arreglo es preventivo.

## H12: app más simple y aperturas "vivas"
- **Menos pantallas** (a pedido: "menos pero más profundo"): la barra inferior pasó de 5 a **4 pestañas: Hoy, Aprender,
  Partidas y Ajustes**. *Hoy* es el plan (antes Plan + Inicio): arriba "Para hoy" con las tareas y plegado lo demás
  (esta semana, tus errores, tu banda, horas por semana). *Aprender* agrupa Lecciones y finales, Aperturas, Táctica y
  Tablero libre, con el camino 400 → 1800 plegado. Las rutas viejas siguen funcionando (`/plan` redirige a Hoy) y la
  pestaña correcta se marca activa en cada pantalla. Se eliminó la pantalla de módulos de Inicio.
- **Aperturas vivas** (`features/openings/`, `engine/sparring.ts`): cada apertura ofrece
  - **Entrenar · 5 min**: una partida contra el rival, 4 posiciones, 2 preguntas y una trampa, paso a paso;
  - **Jugar contra el rival**: las 3 líneas de la apertura forman un árbol; el rival sortea entre sus ramas (evita repetir
    la anterior en el mismo punto), a veces se desvía y se avisa ("El rival eligió otra variante: …"); en tu turno hay una sola
    jugada del libro (lo comprueba un test para las 10 aperturas). Al terminar, la línea queda practicada y sus
    posiciones entran en el repaso;
  - posiciones sueltas, preguntas y trampa, por separado.
  Límite: el rival solo se desvía entre las ramas escritas (3 por apertura); no improvisa jugadas nuevas, y si juegás algo
  fuera del libro se te dice que no es la jugada de la línea.
- **Menos texto, más tablero**: una nota corta aparece bajo el tablero con cada jugada (tuya y del rival), con voz si la
  activaste; la idea, los planes y los errores típicos quedan plegados.

## H13: aperturas a fondo, primera entrega (de varias)
- **Alcance acordado**: "las dos cosas, de a tandas": profundizar las 10 aperturas principales (más ramas, más largas) y
  después llevar las 13 restantes al mismo nivel. Contenido pedido: planes del medio juego, errores del rival y cómo
  castigarlos, y partidas de ejemplo. **Esta entrega** cubre las 10 principales; las otras 13 quedan para la siguiente.
- **Líneas**: de 30 a **39** (una más por apertura, salvo la Escocesa, cuyas candidatas no pasaron el control de
  Stockfish). Las nuevas se separan de las anteriores solo por jugadas del rival, para que el árbol de variantes siga
  teniendo una sola jugada tuya por posición (un test lo exige; ya atrapó una transposición en la Alapin).
- **Planes del medio juego** (`MoveItem` con `kind: 'plan'`): posiciones al final de las líneas donde elegís la jugada que
  sigue el plan; se aceptan alternativas que el motor también aprueba (`alt`). Verificado: respuesta con pérdida ≤ 2,5
  puntos de probabilidad de ganar y alternativas ≤ 3,5.
- **Errores del rival** (`kind: 'punish'`): 24 posiciones donde el rival cometió un error plausible de nivel 500–1200 y vos
  tenés que castigarlo. Las candidatas se buscaron probando con Stockfish **todas** las jugadas del rival en cada punto
  de las líneas (`src/test/explore2.test.ts`) y se descartaron los regalos de dama; después se fijó que el error del rival
  pierda al menos 4 puntos y que tu respuesta sea la mejor o casi.
- **Partidas de ejemplo**: 10, una por apertura, **armadas con Stockfish jugando contra sí mismo** (profundidad 12) a partir
  del final de una línea, y comentadas jugada a jugada en los momentos clave. **No son partidas reales** y la pantalla lo
  dice; así evito atribuir partidas a jugadores que no las jugaron. Los comentarios se limitan a lo que se ve en el tablero.
- **Dónde aparecen**: botones "Planes del medio juego", "Errores del rival" y "Partida de ejemplo" en cada apertura, y un
  plan y un error del rival dentro de la sesión de 5 minutos.
- **Herramientas de autoría nuevas** (se activan por variable de entorno): `explore.test.ts` (EXPLORE=1: evalúa posiciones y
  jugadas), `explore2.test.ts` (EXPLORE2=1: busca errores del rival), `linecheck.test.ts` (LINECHECK=1: valida líneas
  candidatas), `selfplay.test.ts` (SELFPLAY=1: continúa una línea con el motor) y `author6.test.ts` (EXTRAS=1: verifica los
  ejercicios y partidas ya escritos).
- **Pendiente**: las 13 aperturas restantes, más ramas en las 10 principales y partidas de ejemplo con más variedad.

## H14: aperturas a fondo, segunda entrega (las 11 que faltaban)
- **Alcance**: Evans, Cuatro Caballos, Apertura del Alfil, Vienesa, Gambito de Rey, Petroff, Philidor, Alekhine, Pirc/Moderna,
  Colle e Inglesa, al mismo nivel que las 10 anteriores. Quedan **sin líneas propias** las dos entradas genéricas ("Otras con
  1.e4" y "Otras con 1.d4"): no son aperturas sino un cajón para partidas que se salieron de la teoría.
- **Contenido**: 33 líneas nuevas (3 por apertura, **72 en total**), con una explicación por jugada, una pregunta cada una,
  22 ejercicios de plan, 14 de errores del rival y una partida de ejemplo por apertura (21 en total, todas armadas con el
  motor). Cada apertura ya tiene "Entrenar · 5 min", "Jugar contra el rival", posiciones, preguntas, planes, errores del
  rival y partida de ejemplo.
- **Cómo se eligieron las líneas**: se probaron 49 candidatas con Stockfish; las que tenían jugadas flojas se descartaron o
  se reemplazaron por continuaciones del propio motor. Un error mío que atrapó el test del árbol: dos líneas de la Cuatro
  Caballos, y dos de la Philidor, elegían jugadas *propias* distintas en la misma posición; se reemplazaron por ramas que
  se separan solo por jugadas del rival.
- **Planes**: salen de jugadas de las propias líneas (`planFrom`), así que la respuesta y su explicación ya estaban
  verificadas; el control de `EXTRAS=1` exige pérdida ≤ 2,5 puntos de probabilidad de ganar.
- **Errores del rival**: se buscaron con Stockfish probando todas las jugadas del rival en cada punto de las líneas
  (`ONLY=…` limita a ciertas aperturas) y se dejaron los más naturales (un peón que queda sin defensa, una pieza que
  abandona su función). Se descartaron dos con respuesta imprecisa (Inglesa …e4 y un plan del Evans).
- **Partidas de ejemplo**: siguen siendo del motor jugando contra sí mismo (no reales). En la del Gambito de Rey el control
  marca la propia jugada f4 (el motor la ve ~7 puntos peor que lo mejor); es coherente con la teoría del gambito, así que el
  umbral para jugadas propias en las partidas de ejemplo pasó de 6 a 8, igual que el de las líneas. La del Evans se recortó
  antes de una jugada floja.
- **Pendiente**: más ramas en cada apertura (hoy el rival se desvía entre 3 o 4 variantes) y partidas de ejemplo con más
  variedad. Las explicaciones siguen sin verificarlas ningún programa.

## H15: más ramas del rival
- **Qué**: 13 líneas nuevas (**85 en total**) en las 8 aperturas más comunes, para que al practicar contra el rival se
  desvíe más y no se repita tan seguido: Italiana (3…d6; Dos Caballos con …Ae7), Ruy López (5…Ac5; Cozio), Siciliana (3.Ab5+;
  Ataque Inglés), Caro-Kann (Panov; Dos Caballos), Londres (2…Cc6), Francesa (Tarrasch) y Gambito de Dama (3…a6; …Ag4;
  Cambridge Springs). Las ramas se separan de las anteriores **solo por jugadas del rival** (con negras, "del rival" son las de
  las blancas), así que el árbol sigue teniendo una sola jugada propia por posición; un test lo exige y atrapó dos
  intentos míos que no cumplían (la Siciliana con 2…Cc6 y la Francesa con 3…c5 elegían otra jugada propia).
- **Herencia de notas** (`content/deep/branches.ts`): cada rama solo escribe las notas de sus jugadas nuevas; las del
  comienzo compartido se heredan de otra línea de la misma apertura. Un error de cuenta lanza una excepción al cargar.
- **Verificación**: 18 candidatas probadas con Stockfish; pasaron 14 (la del Escandinava con …Dd6 y dos de Londres/Francesa
  se descartaron por jugadas flojas o ilegales). Las 85 líneas pasan el control `DEEP=1`.
- **Límite**: la Escandinava y las aperturas "de peón de rey/dama" genéricas no recibieron ramas nuevas. Las explicaciones
  siguen sin verificarlas ningún programa.

## H16: robustez (aviso de error en vez de pantalla en blanco)
- **Qué pasaba**: en React, si una pantalla lanza un error al dibujarse y nadie lo atrapa, se desmonta todo el árbol y queda la
  pantalla en blanco. Esa es la causa más probable de la pantalla en blanco vista una vez al analizar una partida, **pero no la
  pude reproducir ni confirmar**: lo que hice es cerrar los caminos que sí detecté.
- **`ui/ErrorBoundary.tsx`**: un límite de error por pantalla (se reinicia al cambiar de ruta, y la barra de pestañas queda
  fuera, así que siempre se puede salir) y otro alrededor de toda la app. Muestra qué falló, el texto del error y dos botones:
  Reintentar y Volver a Hoy. También `console.error` con la pila.
- **Motor** (`lib/stockfish.ts`): si el worker no carga o falla, antes el análisis se quedaba esperando para siempre ("Analizando
  0/N" sin salida). Ahora se rechaza con "No se pudo cargar el motor", se muestra en la partida y el reintento crea un worker
  nuevo. Es un camino real para una pantalla "muerta" en un celular (por ejemplo, un WASM que no se pudo descargar).
- **Detalle de partida**: una partida con jugadas ilegales ya no rompe la pantalla; avisa que no se puede reproducir. Mientras
  carga, muestra "Cargando…" en vez de nada (la app entera también, antes devolvía `null`).
- **Probado en el navegador** (Chromium, 360 px, sin service worker, datos sembrados en IndexedDB): partida con jugadas ilegales,
  registro sin jugadores (el límite de error lo atrapa, la barra sigue y cambiar de pestaña se recupera), motor bloqueado
  (aviso y reintento posible) y motor que vuelve (el reintento analiza). El e2e sin conexión completo pasa.
- **Sin cubrir**: no hay test automático del límite de error (el entorno de Vitest es Node, sin DOM; el script de prueba quedó
  fuera del repo). Tampoco se atacó la instalación en el Xiaomi ("No se pudo abrir la app") ni el corte inferior: no hay forma de
  probarlos acá.
