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

## H17 (piloto): notas más vivas y presentación por jugada — solo la Italiana
- **Pedido**: releer las notas de las líneas buscando frases dudosas y hacerlas más estéticas, dinámicas y atrapantes, en texto y en
  pantalla. Acordado: **piloto con una apertura (Italiana, 6 líneas)** para ajustar el tono antes de seguir con las otras 20; un solo
  tono para los dos estilos (Juego y Serio), sin personajes ni emojis.
- **Guía de voz de las notas**: 1–2 frases cortas; tus jugadas dicen qué hacés y qué consigue (verbo + objetivo + consecuencia); las del
  rival dicen qué quiere o amenaza; solo afirmaciones que se ven en el tablero; nada de adjetivos vacíos ("natural", "sólido") sin motivo.
- **Presentación** (`ui/NoteCard.tsx`): tarjeta con barra de color (verde = tuya, ámbar = rival), número de jugada, etiqueta "Tu jugada" /
  "Rival", etiquetas leídas de la notación (Jaque, Mate, Captura, Enroque, Coronación; `engine/moveTags.ts`, con test), entrada animada
  (se apaga con "reducir movimiento"), flecha de la última jugada en el tablero y una barra de avance por la línea. Se usa en Estudiar,
  Practicar y Jugar contra el rival. No se tocaron las notas de partidas de ejemplo ni los ejercicios.
- **Errores encontrados al releer (Italiana)**: (1) …Ca5 / Ac2: decía "el alfil sigue activo" en c2, pero d3 le tapa la diagonal; ahora dice lo
  que sí pasa (esquiva el cambio y lo protege la dama). (2) …h6: decía que quitaba g5 al alfil y al caballo; con ♘bd2 jugado el alfil de c1 ya
  no ve g5, así que solo afecta al caballo (lo detectó la prueba con chess.js). (3) …a6 explicado como "preparar Aa7": no hace falta …a6 para
  eso; la idea es …b5. (4) 3…d6 decía que dejaba el alfil de c8 "algo encerrado": al revés, lo libera. (5) 5…Ae7 de la Húngara y varias notas
  de "más espacio" afirmaban más de lo que se ve.
- **Verificado con chess.js** (prueba descartable, no commiteada): defensores/atacantes de f7 y f2, la transposición it-c3/it-d3, Ac1 abierto
  tras d3, alfil de c8 libre tras …d6, protecciones de b3/c2/e6, torres conectadas, jugadas de Cd2. Las jugadas no cambiaron, así que los controles
  con Stockfish de las líneas siguen valiendo.
- **No verificado**: que 4.Cg5 sea "filosa y de mucha teoría" (conocimiento general, sin fuente consultada), que cada nota diga lo
  "mejor" posible (es redacción) y la presentación en un teléfono real (probada solo en Chromium a 360 px).

## H17 (2ª tanda): la Escandinava con la voz nueva
- **Alcance**: las 4 líneas de la Escandinava (con negras): notas, ideas y la explicación de una pregunta. Mismas jugadas: los controles con
  Stockfish no cambian. La presentación por jugada es la del piloto. Las ramas nuevas de la Escandinava (pendiente 3) siguen sin hacerse.
- **Errores encontrados al releer**: (1) 7…Cf6 decía "atacás el peón de e4" en una línea donde ese peón ya no existe (lo capturó …Dxd5);
  ahora dice que el caballo controla e4 y d5. (2) La dama en a5 "clava el caballo de c3" solo desde que el peón de d2 se mueve (d4): con d2
  ocupado solo presiona c3; las notas ahora lo dicen en el momento correcto. (3) La pregunta "¿por qué a5?" afirmaba que la dama queda fuera
  del alcance de las piezas menores y de los peones; b2-b4 la ataca, así que se reformuló. (4) La nota de 3.Cf3 llamaba "la ventaja" a los
  peones doblados; ahora "chica, pero real".
- **Verificado con chess.js** (prueba descartable): no hay peón en e4; Cc3 no está clavado con d2 ocupado y sí tras d4; la dama puede ir a c7;
  c6 cubre b5/d5; Ad2 rompe la clavada; …e6 tapa la diagonal del alfil de c4 sobre f7; Cf6 protege d5; Ag4 ataca f3; Cc6 y Ae3/Cf3 sobre d4;
  la dama de f3 ataca d5; peones doblados en f2/f3.
- **No verificado**: que la posición de la Escandinava sea "algo mejor para las blancas" en espacio (es una apreciación), ni nada de lo
  dicho sobre b4 (se dejó sin valorar). No corrí el e2e (solo cambió texto de contenido); sí tsc, eslint, vitest y build.

## H17 (3ª tanda): la Siciliana con la voz nueva
- **Alcance**: las 6 líneas de la Siciliana (con negras): notas e ideas. Mismas jugadas, así que los controles con Stockfish no cambian.
  Siguen pendientes 18 aperturas (entre ellas Francesa y Caro-Kann, que quedaron para la próxima tanda).
- **Errores encontrados al releer**: (1) en la línea Alapin con Ae3, tras …cxd4 cxd4 decía que las blancas "vuelven a tener dos peones en el
  centro"; queda un solo peón central, d4, aislado (sin peones en c ni e). Ahora lo dice, y la idea de la línea apunta a ese peón. (2) Ag2 en la
  Cerrada "apuntaba a tu flanco de dama": el peón de e4 le tapa la diagonal; ahora dice que queda detrás de e4. (3) …Cc6 en 3.Ab5+ "presionaba
  d4" cuando no hay peón en d4 (controla la casilla). (4) …e5 en la Najdorf "te quedás con el centro": omitía el hueco de d5, que ningún peón negro
  cuida. (5) …Ae6 en el Ataque Inglés no mencionaba que mira al caballo de b3.
- **Verificado con chess.js** (prueba descartable): e5 ataca a Cd4; d5 sin guardia de peón; a6 controla b5; las blancas sin peón de e tras exd5; Cf6
  protege d5; Cf3/c3 defienden d4; peón único y aislado en d4; Ag2 no ve c6; Ag7 ve c3; Cc6 controla d4 y b4; e6 controla d5; Ae6 ataca b3 y
  controla d5; f3 sostiene e4; c4 controla d5.
- **No verificado**: las valoraciones ("posición igualada", "juego para las negras"), los planes (…b5 o …d5, enroque largo blanco) y
  que 2.c3 y 3.Ab5+ "esquiven teoría" (conocimiento general, sin fuente consultada). No corrí el e2e (solo texto); sí tsc, eslint, vitest, build.

## H17 (4ª tanda): Francesa y Caro-Kann con la voz nueva
- **Alcance**: las 5 líneas de la Francesa y las 6 de la Caro-Kann (con negras): notas e ideas. Mismas jugadas, así que los controles con
  Stockfish de las líneas no cambian. Siguen pendientes 16 aperturas.
- **Errores encontrados al releer**: (1) …Db6 "atacaba d4 por segunda vez": la dama no ve d4 mientras el peón de c5 le tapa la diagonal; ahora
  dice que amenaza b2 y que mirará d4 cuando c5 capture. (2) …c4 "impedía b4": b4 sigue siendo legal, pero se puede tomar al paso. (3) Cbd2
  "sin bloquear al alfil de c1": lo bloquea (el alfil queda sin casillas). (4) 7…Cf6 del Panov "desarrollás atacando": no ataca nada; suma un
  defensor a d5. (5) …Ah7 "apuntaba a la gran diagonal": mira la b1–h7. (6) 17…Dxd4 en la Francesa con Ad3 decía "ganaste un peón, pero las blancas
  tienen algo de actividad": el motor (profundidad 16) da solo unos −0,44 para las blancas, o sea la ventaja negra es de menos de medio peón.
  (7) Dos notas llevaban asteriscos literales (`*antes*`, en la Caro-Kann y en el Londres): la app no interpreta Markdown y se veían
  los asteriscos; se sacaron (también en el plan de la Caro-Kann clásica).
- **Verificado con chess.js y Stockfish**: casillas atacadas y defendidas en d4, b3, b7, d5, f3, f7, h2; la clavada en f6 y f3; el alfil de c1 sin
  salida tras Cbd2; la captura al paso tras b4; el peón aislado de d4 en el Panov; la evaluación del final de la línea con Ad3.
- **No verificado**: las valoraciones ("igualada", "sólido"), los nombres de variantes (Tarrasch, Panov, Dos Caballos) y que Cd2 evite la
  clavada …Ab4 por "flexibilidad" (conocimiento general, sin fuente). No corrí el e2e (solo texto).

## H17 (5ª tanda): Gambito de Dama, India de Rey y Londres con la voz nueva
- **Alcance**: 7 líneas del Gambito de Dama, 4 de la India de Rey y 5 del Londres: notas, ideas, un plan y una pregunta. Mismas jugadas, así que
  los controles con Stockfish no cambian. Siguen pendientes 13 aperturas.
- **Errores encontrados al releer**: (1) GD rehusado: tras ♘f3 decía "ahora podés enrocar", pero el alfil de f1 sigue en casa. (2) India de Rey
  contra el Londres: …♘bd7 "sin bloquear tu alfil" (también en el plan): el caballo bloquea al alfil de c8. (3) Londres: la pregunta sobre ♘e5
  decía "sin que un peón enemigo pueda echarlo", pero …f6 sí puede; la nota y la explicación ahora lo dicen. (4) Cambridge Springs: ♘d2 "apoyaba
  el caballo de c3"; en realidad ocupa d2 para que …♗b4 no lo clave contra el rey. (5) Eslava: ♘f3 "atacaba d5 indirectamente" (no ataca nada). (6)
  GD aceptado con …a6: ♕e2 "se prepara para la ruptura": lo concreto es que protege al alfil de c4 y libera d1. (7) India de Rey clásica: el
  plan "…Cd7, …Ce8 y …f5" no sale de esta posición; ahora dice solo …f5 y ataque en el flanco de rey. (8) ♘ge2 del GD Cambio "dejaba libres al
  alfil de f4 y a la dama"; lo concreto es que permite recapturar en d4 con el caballo.
- **Verificado con chess.js** (prueba descartable): enroque ilegal con el alfil en f1; clavada absoluta del caballo de c3 con …♗b4 (Eslava) y no
  absoluta tras ♘d2 (Cambridge Springs); Ac4 protegido por ♕e2; alfil de c8 sin casillas con …♘bd7; ♗d3 apunta a h7; ♘e2 y d3; la torre de e8 ataca e2
  y el rey blanco sigue en e1; ♘e5 defendido por d4 y ♗g3 y atacado por ♗d6; el peón de f7 puede jugar …f6.
- **No verificado**: valoraciones ("igualada", "cómoda"), los nombres de variantes (Eslava, Cambridge Springs, Cambio) y los planes típicos de
  la India de Rey (…f5, …e5): son conocimiento general sin fuente. No corrí el e2e (solo texto).

## H17 (6ª tanda): Ruy López, Escocesa y Evans con la voz nueva
- **Alcance**: 6 líneas de la Ruy López, 3 de la Escocesa y 3 del Evans: notas, ideas y una pregunta. Mismas jugadas, así que los controles con
  Stockfish de las líneas no cambian. Las notas de las jugadas comunes (1.e4 e5 2.Cf3 Cc6 ...) se reescribieron en cada línea (las constantes
  `EVANS`/`EVANS_ACC` de `more2-e4e5.ts` ya no existen; las otras líneas de ese archivo siguen usando `C`). Siguen pendientes 10 aperturas.
- **Errores encontrados al releer**: (1) …Ae7 "defiende e5": un alfil en e7 no defiende un peón de su columna; prepara el enroque y protege f6.
  (2) 6.d4 en la Berlinesa "atacaba el caballo de e4": ataca e5 (el caballo no estaba atacado). (3) Ab3 "por la gran diagonal": es la
  a2–g8. (4) Escocesa 4…Ac5: c3 "cerraba la diagonal del alfil": el caballo de d4 ya la cerraba; c3 solo refuerza al caballo (también se corrigió la
  pregunta). (5) Escocesa 4…Cxd4: "las negras no tienen cómo atacar la dama" era falso (…c5 la ataca, a costa de debilitar d5). (6) Evans aceptado:
  tras cxd4 decía "recuperaste el material" y quedás un peón abajo; tras …Cxe4 son dos, y el motor (profundidad 16) ve la posición casi igual
  (+0,13): ahora la nota lo dice así. (7) Evans con …d6: …Dd7 "defiende b7" (no: lo tapa el peón de c7; b7 ya lo cuida el alfil de c8), …Ch6
  "evita Cg5" (no lo hace) y Cbd2 "ya no te queda nada por sacar" (falta el alfil de c1). (8) Evans rehusado: "un peón más" donde el material está parejo,
  y ♗xd5 "apunta a b7" cuando el caballo de c6 se lo tapa. (9) Evans: Aa5 "vigila la diagonal a5–e1" (c3 la tapa).
- **Verificado con chess.js y Stockfish** (prueba descartable): atacantes y defensores de e5, e4, f7, b7, c3, d4, c6, f6; el alfil de c1 sigue en casa;
  material tras cada captura; evaluaciones finales: Berlinesa +0,09, Evans aceptado +0,13, Evans con …d6 +0,39, Evans rehusado +0,24 (todas desde las blancas).
- **No verificado**: valoraciones ("pareja", "cómoda"), nombres de variantes, que la Berlinesa dé "una pequeña ventaja práctica" a las blancas
  (se redujo a lo que ve el motor) y la teoría de la Escocesa (f4 después del enroque, que se quitó). No corrí el e2e (solo texto).

## H17 (7ª tanda): Cuatro Caballos, Alfil, Vienesa, Gambito de Rey y Petroff con la voz nueva
- **Alcance**: 3 líneas de cada una (15 en total): notas, ideas, dos planes y dos preguntas. Mismas jugadas, así que los controles con Stockfish no
  cambian. Las constantes compartidas de `more2-e4e5.ts` y `more2-e4.ts` (`C`, `FOURK`, `BISHOP`, `VIENNA`, `KG`, `PET`…) se borraron: cada
  línea tiene ahora sus notas completas. Siguen pendientes 5 aperturas (Philidor, Alekhine, Pirc/Moderna, Colle, Inglesa).
- **Errores encontrados al releer**: (1) Cuatro Caballos: …Ab4 "clavaba el caballo de c3 contra el rey" y ♗b4 después de enrocar tampoco: con d2
  ocupado y luego con el rey en g1 no hay clavada (el caballo se puede mover); ahora dice "presiona". (2) …Cd8 "para salir de la clavada": va a e6 a
  atacar el alfil de g5. (3) Cuatro Caballos con …Ac5: "Cxe5… el caballo de c6 queda en problemas / ganás tiempo": la línea termina con material
  parejo y el motor ve +0,40 (casi igual); se reescribió la idea, el plan y la pregunta. (4) Línea Rubinstein: se quitó el nombre (sin fuente) y la
  "pareja de alfiles" (los dos bandos conservan los dos). (5) Alfil con …Ac5: c3 "daba una casilla de retirada" y …a6 "preparaba …Aa7"; es …b5.
  (6) Alfil con …Cc6: "Húngara" estaba mal aplicada (la Húngara es …Ae7 en la Italiana con 3…Ae7), y el alfil en c2 "sigue mirando al flanco de rey"
  cuando d3 le tapa la diagonal (también en la pregunta). (7) Vienés: Cf3 "atacando": no ataca nada (apuntala e5); y el caballo que sale a e7 es el de
  rey, no el de dama. (8) Gambito de Rey con …Ae7: el caballo de f6 es el de rey (decía "de dama"). (9) Petroff con 3.Cc3: "quedás con un peón
  de más": el material queda parejo (el motor ve una pequeña ventaja negra, −0,34). (10) Gambito de Rey con …d6: el motor ve la línea algo mejor
  para las negras (−0,41); se dice en la nota. (11) Vienesa con g3: Ag2 "en la gran diagonal" queda detrás de e4.
- **Verificado con chess.js y Stockfish**: ausencia de clavada, material tras cada captura (parejo en 4C-Ac5 y Petroff 3.Cc3), la captura al paso exf6/exd6,
  c2/d3, la trampa de la Petroff (De2 y Cc6+ es jaque), enroque posible en pet-d4, y evaluaciones finales: 4C-Ac5 +0,40, 4C-Cd4 +0,16, Petroff 3.Cc3
  −0,34 y Gambito de Rey …d6 −0,41 (desde las blancas).
- **No verificado**: valoraciones ("igualada", "sólida"), nombres de variantes (Cuatro Caballos «española», Vienés, Petroff clásica) y la teoría. No corrí el e2e.

## H17 (8ª tanda y cierre): Philidor, Alekhine, Pirc, Colle e Inglesa
- **Alcance**: 3 líneas de cada una (15). Con esto las **21 aperturas / 85 líneas** tienen la voz nueva y la tarjeta por jugada. Quedan sin líneas las dos
  entradas genéricas. Se borraron las constantes de notas compartidas que quedaron sin uso.
- **Errores encontrados al releer**: (1) Pirc clásica: …Ag4 "clavaba el caballo de f3 contra la dama", pero el alfil de e2 está en el medio (no hay
  clavada). (2) Alekhine moderna: …Ah5 "manteniendo la clavada": después de Ae2 tampoco. (3) Philidor con Ae2: …Te8 "presiona e4" con el alfil de e7 delante.
  (4) Alekhine, Cuatro Peones: …Cb6 "apoya …d6" (ataca c4) y Ae3 "defiende e5" (refuerza d4). (5) Colle: Cbd2 "sin bloquear al alfil de c1", y
  De2 "apoya e4": el peón de e3 le tapa la columna; la apoyará cuando e4 avance. (6) Inglesa: Ag2 "apunta a d5 y b7" con el caballo de f3 tapando; a3
  "libera el peón de b" (en realidad apoya la casilla b4). (7) Inglesa 1…Cf6: la idea decía "ganás material" y el material queda parejo.
- **Verificado con chess.js** (prueba descartable): quién ataca cada casilla (f3, e4, c4, d4, e5, b4, c6, d5), la pieza que queda detrás del caballo de f3, peones
  doblados tras …Cxc3 y material al final de la línea de la Inglesa.
- **No verificado**: valoraciones, nombres (Ataque de los 150, Ataque Austríaco, Sistema Colle, "Siciliana al revés") y los planes típicos. No corrí DEEP=1 (las
  jugadas no cambiaron: 0 líneas `moves:` modificadas en todo H17).
- **Cierre del hito**: `tsc`, `eslint`, `vitest` (436), build para Pages y el e2e sin conexión pasan. **No probado**: la tarjeta por jugada en un teléfono real
  (solo Chromium a 360 px) ni la voz con las notas nuevas. Versión 1.13.0.

## H18: nueva estética «Bosque y crema»
- **Pedido**: auditar y mejorar la estética. Se hicieron tres maquetas fuera del repo (Bosque y crema, Nogal y ámbar, Verde del ícono) y se eligió la
  **A, Bosque y crema**, con la tarjeta de la primera tarea de Hoy **discreta** (borde verde y una etiqueta «Empezá por acá», no una tarjeta de color).
  Libertad total sobre paleta y tablero.
- **Paleta** (tokens en `index.css`, claro y oscuro): fondo crema `#f5f0e4`, tarjetas `#fffcf5` con borde fino y sombra suave, texto `#23201a`, acento verde
  bosque `#245c37` (en oscuro, verde claro `#7bc08a` sobre marrón casi negro `#16130e`) y un color propio para el rival (`--color-rival`, ámbar). Los títulos
  (`h1`, `h2`) van en serif del sistema (`Georgia, Noto Serif, Times`): no se carga ninguna fuente (CSP y offline) y en Android cae en Noto Serif, que no se
  vio en este entorno. Radios más redondeados (`--radius-xl` 1 rem).
- **Tablero** (`Board.tsx`): casillas crema y verde por variables CSS (`--board-*`, con versión oscura), jugada resaltada en amarillo, selección amarilla y puntos de
  movimiento oscuros. **Las flechas verdes dejaron de verse sobre el tablero verde** (lo atrapó la verificación visual): las flechas de la última jugada son pizarra
  oscura (tuya) y naranja (rival) y la del análisis que sugiere el motor pasó de verde a azul (se actualizaron el texto de la pantalla y dos frases del entrenador).
- **Navegación y pantallas**: barra inferior con íconos propios (`ui/Icon.tsx`, sin dependencias) y estado activo en píldora; Hoy con íconos por tipo de tarea; Aprender
  con tarjetas de ícono y flecha; acordeones como filas con flecha que gira.
- **Toque**: los acordeones (`summary`) pasaron de 20–28 px a ≥ 56 px y los «← Volver» de 17 px a ≥ 48 px (reglas globales en `index.css`, clase `.back-link`).
  Medido de nuevo en 11 pantallas a 360 px: ya no queda ningún botón, enlace ni acordeón por debajo de 44 px, salvo un checkbox de Ajustes (20 px, dentro de una
  etiqueta táctil).
- **Datos**: al arrancar la app pide almacenamiento persistente (`navigator.storage.persist()`) para que el navegador no borre IndexedDB si falta espacio. Si lo
  niega no pasa nada; el backup manual sigue siendo la red de seguridad. No se probó qué responde Chrome en el Xiaomi.
- **Pantalla de carga**: `background_color` del manifest pasó de negro a crema. Color de la barra del navegador y ícono, sin cambios.
- **Probado**: Chromium a 360 y 390 px, claro y oscuro, 13 pantallas con capturas; tsc, eslint, vitest (436), build para Pages y e2e sin conexión. **No probado**: un teléfono
  real (Xiaomi), iOS, la serif en Android y el contraste con una herramienta (se evaluó a ojo). Pantallas que no se revisaron una por una: finales, repaso del repertorio,
  detalle de partida con análisis y las pantallas de táctica con resultados.

## H19: e2e en el CI y bundle partido
- **Bundle**: las pantallas (táctica, lecciones, finales, aperturas, repertorio, partidas, tablero libre y ajustes) se cargan con `React.lazy` y un `Suspense`
  ("Cargando…") dentro del límite de error por pantalla. El JS de arranque pasó de **1.031 KB (312 KB comprimidos) a 407 KB (132 KB)** y desapareció el aviso de
  chunks de más de 500 KB. Hoy y Aprender siguen en el bundle principal (Hoy arrastra el contenido de las lecciones, por eso no baja más). Todos los chunks entran en
  el precaché del service worker: **se probó sin conexión** con el e2e (20 rutas, motor, puzzle, lección, repertorio y backup). Si un chunk no cargara, el límite de error
  muestra el aviso con «Reintentar».
- **CI** (`.github/workflows/deploy.yml`): nuevo job `e2e` que instala Playwright (`npm install --no-save playwright@1.63.0`, no es dependencia del proyecto) y Chromium,
  compila como en Pages, sirve con `vite preview` y corre `scripts/e2e-offline.mjs`; si falla sube las capturas como artefacto. **El deploy ahora espera a `check` y a `e2e`**:
  un e2e roto frena la publicación (decisión a revisar si resulta inestable). Los pasos se reprodujeron localmente y el YAML se validó, pero **la primera corrida real en GitHub
  Actions es la prueba de verdad**.

## H20: ícono nuevo, rey con dos peones sobre verde pastel
- **Pedido**: tres opciones de ícono con la cruz del rey sobre cuatro tableros; ninguna convenció (la cruz sola parecía religiosa). Nuevo modelo: una imagen de referencia con un rey
  flanqueado por dos peones, trazo grueso y dorados, sobre **fondo verde pastel**.
- **Cómo**: `scripts/gen-icons.mjs` dibuja un rey y dos peones **propios** (trazo negro grueso, cuerpo dorado `#FFC21F`, luces `#EDB04E`, bases `#D58E26`) sobre un degradé verde pastel
  (`#E3F3E1` → `#BFDFC4`). **No se usó ni se calcó la imagen de referencia** (parece un ícono de banco de imágenes de licencia propia); solo se tomó la idea de composición y el estilo.
- **Variantes**: normal (esquinas redondeadas), «maskable» y de iOS (sin esquinas, dibujo al 86 %). Se regeneran con `node scripts/gen-icons.mjs`. Color de la barra del navegador
  (`#1F8A3F`) y pantalla de carga (crema) sin cambios.
- **Verificado**: PNG de 192, 512, maskable y iOS generados; se ve legible a 40 px, en máscara circular y sobre fondo oscuro. **No verificado**: cómo lo recorta el Xiaomi en la pantalla de
  inicio y la pantalla de carga con el ícono nuevo; hay que desinstalar y reinstalar la PWA (o esperar a que Chrome actualice el ícono) para verlo.

## H21: inicio inmersivo (puzzle del día y apertura del día)
- **Pedido**: una app más inmersiva y lúdica; el menú de inicio era aburrido y «cómo fue mi semana tipo» no es lo primero que querés ver. Se parte en hitos: este es el
  primero (inicio); después van menús lúdicos (camino con nodos, ilustraciones), comentarios más largos y más partidas de ejemplo.
- **Qué te recibe** («Hoy»): fecha, la mascota **Peón** (dibujo propio, `ui/Mascot.tsx`, con tres ánimos) que te saluda según la hora y el estado del puzzle, la racha,
  el **puzzle del día jugable ahí mismo** y la **apertura del día**. Debajo, «Para seguir hoy» con las tareas sugeridas (las de siempre, en filas compactas). La semana,
  los errores, tu banda y tu semana tipo pasaron a la pantalla **«Tu progreso»** (`/progreso`), a la que se entra con un ícono arriba a la derecha (no sumó pestaña; la
  pestaña «Hoy» queda marcada ahí).
- **Puzzle del día** (`engine/daily.ts`, `data/daily.ts`): depende de la fecha y del rating **redondeado a 100** (no cambia por resolver uno), prefiere puzzles que no
  hiciste y se **guarda** en la tabla de ajustes (`dailyPuzzle`) con el resultado: al volver a abrir la app el mismo día ves cómo te fue y la solución. Cuenta como un puzzle
  normal (rating, racha, repaso si falla). El tema se revela recién al terminar, con una **explicación del motivo táctico** (`content/themeBlurbs.ts`: definiciones
  generales de 25 temas, con test de que cada tema tiene la suya).
- **Apertura del día**: se recorren las 21 aperturas con líneas a fondo, una por día, en un orden fijo mezclado (en 21 días salen todas una vez; test). La tarjeta muestra la
  posición característica, la idea, la trampa si hay, y «Entrenar · 5 min» abre directo la sesión (`/aperturas/:id?modo=sesion`).
- **Detalles**: el tablero chico de la apertura sin coordenadas (`notation` en `Board`); «★ rating» del puzzle en una sola línea; el mensaje de «ya lo viste» solo aparece si
  el puzzle ya estaba terminado al abrir la app.
- **Probado**: Chromium (390 px, claro y oscuro, capturas): el puzzle carga, «Ver solución» muestra la explicación, el resultado sobrevive a una recarga y se registra un solo
  intento; **sin conexión, con el día sin puzzle guardado, el puzzle y la apertura del día aparecen**; «Tu progreso» y el acceso directo a la sesión de 5 min; tsc, eslint, vitest
  (446), build y e2e sin conexión. **No probado**: un teléfono real, un cambio de día con la app abierta (se recalcula al recargar), ni qué tan difícil resulta el puzzle del día
  elegido por rating (el rating de puzzles es provisional al principio y el primer puzzle mueve mucho: un puzzle fallado puede restar más de 100).
- **Límite honesto**: las explicaciones de los temas y los textos del saludo no los verifica ningún programa.

## H22: menús lúdicos (camino de nodos)
- **Pedido**: Aprender, Lecciones y Aperturas eran grillas aburridas; querías un camino con nodos, personajes e ilustraciones propias, en los dos estilos. Decidido con vos: **dos mapas + hub ilustrado**,
  nodos **todos abiertos** con el «siguiente» resaltado (nada de candados: con 2–5 h/semana y nivel de partida a elección frustran más de lo que motivan), **una pieza guía por banda** y dibujo moderado.
- **Lecciones** (`/lecciones`): un camino por banda de Elo (Peón 400–800, Caballo 800–1100, Alfil 1100–1400, Torre 1400–1600, Dama 1600–1800) y un tramo «Finales para jugar» guiado por el Rey.
  Cada nodo lleva un ícono según el tema (`content/pathIcons.ts`; las que no figuran usan el libro). Hecho = círculo verde con ✓ (y estrellas en Juego); empezada = aro verde; el siguiente, aro grande y la guía al lado.
  El «siguiente» es la primera lección sin hacer desde la lección de partida de tu nivel (`engine/learnPath.ts`, con test); **no tiene en cuenta el punto débil** que usa el plan de Hoy, así que pueden diferir.
- **Aperturas** (`/aperturas`, pestaña Biblioteca): un camino por grupo (Peón, Caballo, Dama, Alfil: elección mía, sin relación con las bandas). Progreso de cada apertura = sus líneas a fondo practicadas
  (tabla `replines`); hecha = todas practicadas. El ícono de rayo marca las que tienen trampa. «Tus aperturas» y el acceso al repertorio quedan igual.
- **Aprender**: tarjeta «Seguí por acá» (próxima lección, con la guía de su banda) y cuatro viñetas ilustradas (libro, tablero con flecha, diana con rayo, tablero libre) en vez de la lista.
- **Estilo Serio**: mismo camino con nodos e íconos, **sin guías, estrellas ni viñetas** (el hub vuelve a la lista de tarjetas con ícono). Las rachas siguen ocultas como antes.
- **Dibujos** (todos propios): `ui/Guides.tsx` (Caballo, Alfil, Torre, Dama y Rey en el mismo estilo del Peón: contorno grueso y dorados) sobre un **medallón verde pastel** (el del ícono de la app), porque el contorno casi negro
  no se veía sobre el fondo oscuro; las viñetas usan solo tokens del tema. Los colores de las guías son fijos (como los del ícono y la mascota), no tokens. Íconos nuevos en `ui/Icon.tsx`: corona, escudo, peón, torre, bandera, rayo.
- **Iteración visual**: la primera versión ponía las etiquetas debajo del círculo y el trazo del camino las atravesaba; pasaron al costado (del lado con más lugar). Lo atrapó la captura, no los tests.
- **Probado**: Chromium a 360 y 390 px, claro y oscuro, Juego y Serio, con progreso sembrado (3 lecciones hechas, una empezada, apertura completa y otra a medias); tsc, eslint, vitest (455 + 11 de Stockfish salteados),
  build para Pages y e2e sin conexión (sin desborde horizontal en 20 rutas). **No probado**: un teléfono real, el toque de los nodos con el pulgar, ni cómo se ve el hub con todo el currículo terminado
  (el «siguiente» desaparece y no hay un estado de «terminaste»).
- **Pendiente que apareció**: el JS de arranque volvió a pesar ~669 KB (H19 lo había bajado a 407 KB): ya eran 659 KB antes de H22, desde H21 (Home arrastra el contenido de las lecciones). Este hito sumó ~10 KB.
  El aviso de chunks de más de 500 KB reapareció. No lo toqué.
- **Límite honesto**: la asignación de guías y de íconos por lección es mía y ningún programa la verifica; el Caballo es el dibujo con más riesgo de verse raro (un solo ángulo mirado).

## H23: comentarios más largos («Explicame más»)
- **Pedido**: explicaciones más largas de puzzles, ejercicios y análisis, sin romper la guía H17 (1–2 frases mientras jugás). Decidido con vos: texto corto de siempre + botón **«Explicame más»** que despliega
  **3 a 5 frases** (qué pasa, por qué y qué mirar la próxima vez), en **ejercicios de lecciones, puzzles y análisis de partidas**. Las notas de jugada de las aperturas y los pasos de lección **no se tocaron**.
- **Temas de puzzles** (`THEME_MORE`, 27 textos, uno por tema): generales, sin hablar de ninguna posición. Aparecen tras resolver el puzzle del día (hasta 2 temas) y, **novedad**, en la pantalla de Táctica:
  hasta ahora ahí solo se veía la etiqueta del tema, sin explicación (no se muestran en las tarjetas que vienen de tus partidas, que tienen su propio tipo de error).
- **Ejercicios de lecciones**: 71 en total. Los 57 de Lichess heredan el texto largo de su tema (`mateIn3` usa el de `mateLong`; `advancedPawn` no tiene y no muestra botón). Los **14 escritos a mano** tienen texto propio
  (`content/exerciseMore.ts`) que habla de la posición concreta.
- **Verificación**: `exerciseMore.test.ts` comprueba con chess.js lo que los textos dicen de las posiciones (los mates son mates, quién ataca y defiende f7, que Dg6 es ahogado, el cuadrado de cada peón, las casillas que
  controla cada rey) y que todos tengan de 3 a 5 frases. Que el resultado (ganar o tablas) sea el dicho lo sigue verificando Stockfish en `lessons.test.ts`. **Lo que ningún programa verifica**: que las explicaciones sean
  buena pedagogía y que los consejos generales (los 27 temas) sean correctos; los releí uno por uno.
- **Errores míos que atrapó la relectura**: el `why` de `sq-3` decía que el rey se acerca «por la columna en la que corre» el peón (no es lo que pasa en la línea) y cuatro `why` de finales de peones decían «delante del
  peón» o «oposición» donde el rey queda al costado o en diagonal; se reescribieron (`op-1`, `op-2`, `hd-1`, `hd-2`, `hd-3`, `sq-3`). Y mi helper del test del cuadrado tenía la dirección al revés (falló el test, no pasó a producción).
- **Análisis de partidas**: el coach ya era la versión larga (5 preguntas y «Decímelo de otra forma» desde H9), así que **no alargué esas plantillas**. Lo que faltaba era el «qué hacer ahora»: al abrir «¿Cómo lo evito?» aparece
  **«Para practicarlo»** con el consejo, la lección y los puzzles del tema (o Aperturas), reusando la tabla `FOCUS` del plan semanal.
- **Probado**: Chromium a 360 px, claro y oscuro: botón y texto desplegado en dos lecciones (mate en 1 y oposición), puzzle de Táctica y puzzle del día tras «Ver solución», y el coach con una partida sembrada (error de
  mate permitido); tsc, eslint, vitest, build y e2e sin conexión. **No probado**: un teléfono real, la lectura en voz del texto largo, el estilo Serio con los textos largos (son los mismos en los dos estilos).
- **Costo**: el JS de arranque pasó de ~669 KB a ~681 KB (los textos largos entran en el bundle principal porque Hoy trae las lecciones). Sigue pendiente el recorte que H19 había logrado (407 KB).

## H24: partidas de ejemplo armadas con el motor (1ª entrega: aperturas 1.e4 e5)
- **Pedido**: 2–3 partidas de ejemplo por apertura (hoy hay una), armadas con Stockfish contra sí mismo y comentadas jugada a jugada; que la pantalla diga que **no son partidas reales**. Decidido con vos:
  **3 en total en las 8 aperturas más comunes y 2 en el resto**; notas en **todas tus jugadas y en las del rival que cambian algo**; **cada partida parte de una línea distinta** de la apertura; **dos entregas**
  (H24: grupo 1.e4 e5; H25: el resto). «Las 8 más comunes» las elegí por la cantidad de líneas a fondo: Italiana, Ruy López, Siciliana, Francesa, Caro-Kann, Gambito de Dama, Londres e India de Rey (**a confirmar antes de H25**).
- **Esta entrega**: 12 partidas nuevas (30–38 jugadas en total, o sea 15–19 por bando): Italiana ×2 (húngara y a6), Ruy López ×2 (abierta y Berlinesa), y una de Evans (rehusado), Cuatro Caballos (6.Cxe5), Escocesa,
  Apertura del Alfil, Vienesa, Gambito de Rey, Petroff y Philidor. Con las de siempre, esas aperturas quedan con 2 (3 las de Italiana y Ruy López).
- **Cómo se armaron** (`src/test/author7.test.ts`, `MODELS=1`): cada partida arranca con las primeras jugadas de una línea a fondo (`prefix`) y el motor (profundidad 14) sigue solo hasta ~30–38 jugadas, imprimiendo jugada por jugada
  la evaluación y hechos de chess.js (capturas, jaques, qué ataca la pieza movida, qué queda sin defensa). Con eso escribí las notas. Las notas de **tus** jugadas del tramo inicial se **heredan** de la línea a fondo (ya revisadas en H17);
  el resto son nuevas.
- **Pantalla**: si una apertura tiene más de una partida, el botón dice «Partidas de ejemplo (N)» y arriba aparece un selector «Partida 1/2/3». Las armadas con el motor muestran: «Partida de ejemplo: Stockfish jugó las dos partes desde
  una línea de la apertura. No es una partida real.» (`ModelGame.engine`).
- **Verificación**: (1) `content/__tests__/modelGames.test.ts` comprueba con chess.js que cada partida sea legal, parta de su línea, tenga nota en **todas tus jugadas** y que **cada afirmación de las notas sea cierta en el tablero**
  (quién ataca o protege qué, capturas, jaques, peones doblados, captura al paso, material parejo, etc.; 25 casos); (2) Stockfish (`MODELS_CHECK=1`): **ninguna jugada de las 12 pierde más de 8 puntos de probabilidad de ganar (12 las del rival)**;
  (3) tsc, eslint, vitest, build y e2e sin conexión. El JS de arranque no cambió (681 KB): las partidas están en la pantalla de Aperturas, que se carga aparte.
- **Descartes y errores míos que atrapó la revisión**: en el Gambito de Rey, el motor ve mejor a las negras tanto en el rehusado (…Ac5, −0,5) como en la línea …d6 (−1,2), así que no sirven de modelo para quien juega blancas: usé …d5 contra el centro (+0,5 a +0,8).
  Terminar una partida en medio de una táctica (el Gambito de Rey con un caballo «ganado» sin recapturar; la Vienesa con un peón regalado) daba un final engañoso: las alargué hasta una posición estable y comprobé el material. En las notas corregí:
  «el caballo de e4 protege d5» (es el peón de d5 el que lo protege), «pareja de alfiles» antes de tiempo (las negras también tenían los dos) y una nota que se contradecía con la siguiente («no se pueden salvar los dos» y el alfil se salvaba con …Ad6).
- **Lo que ningún programa verifica**: que las notas sean buena pedagogía y que los **planes** que atribuyo a cada partida («el plan es…», los resúmenes) sean los que de verdad ilustra una partida jugada por el motor. Ese motor no juega con un plan:
  elige la mejor jugada, y a veces no es la más didáctica. Por eso los resúmenes dicen lo que se ve (espacio, cambios, material) y la evaluación, no intenciones. En las partidas de las negras (Petroff, Philidor) el motor las ve con una desventaja chica
  y estable (+0,3 a +0,6 para las blancas): es lo esperable en esas aperturas, pero no son ejemplos de «ganar».
- **Probado en pantalla**: Chromium a 360 px, claro y oscuro, Italiana con 3 partidas (selector, aviso y nota). **No probado**: las otras aperturas en pantalla (el código es el mismo), un teléfono real ni la voz con las notas nuevas.

## H25: partidas de ejemplo armadas con el motor (2ª entrega: el resto de las aperturas)
- **Alcance** (acordado en H24): 3 partidas en total en las 8 aperturas más comunes y 2 en el resto. Esta entrega suma **17 partidas nuevas**: Siciliana ×2, Francesa ×2, Caro-Kann ×2, Gambito de Dama ×2,
  Londres ×2, India de Rey ×2 y una de Escandinava, Pirc, Alekhine, Colle e Inglesa. Con H24 son **29 partidas nuevas (957 jugadas)**; las 21 aperturas con partida quedan con 2 o 3 (3 las de Italiana, Ruy López, Siciliana, Francesa,
  Caro-Kann, Gambito de Dama, Londres e India de Rey). Mismo método y mismas herramientas que H24 (`author7`, `modelGames.ts`, `modelGames.test.ts`).
- **Descartes** (el motor las jugó, yo las miré, no sirven de ejemplo): se pidió que el lado de quien aprende no quedara claramente peor y que la partida no terminara a mitad de una táctica. Se descartaron: Escandinava `d4` (hasta +0,9 para las blancas),
  Pirc austríaco largo y Pirc 150 (hasta +1,0 y +1,75), Alekhine de los cuatro peones (+1,1), la India de Rey con Ag5 (39 jugadas de cambios), la Siciliana Alapin y el Caro-Kann del Avance (terminaban con una dama capturada o atacada sin resolver),
  la Francesa clásica (el motor ve mejor a las negras pero las blancas ganan un peón: confuso) y Londres `…Cf6` (puro vaivén de piezas, 0,00). Se ajustó la herramienta: **sigue jugando mientras la última jugada sea captura o jaque** (máx. 10 más).
  Y se evitó una duplicada: Londres–India de Rey con la misma línea sale idéntica vista desde ambos lados.
- **Notación**: las notas que escribí usaban letras inglesas (`Nxe5`, `Bb5`, `Qxd8+`) y las heredadas de las líneas a fondo usan español (`Cxd4`, `Ab5`). Se unificó todo a **español** (C, A, T, D, R; 110 reemplazos). En la pantalla,
  la lista de jugadas sigue en figuras y las notas en letras: no se cambió.
- **Verificación**: 59 casos de `modelGames.test.ts` (cada afirmación de cada nota comprobada en el tablero, jugada por jugada, de las 29 partidas; todas tus jugadas con nota) y **Stockfish sobre las 29 partidas completas**
  (`MODELS_CHECK=1`, 329 s): **ninguna de las 957 jugadas pierde más de 8 puntos de probabilidad de ganar (12 las del rival)**; vitest (524), tsc, eslint, build y e2e sin conexión. El JS de arranque no cambió (681 KB).
- **Lo que ningún programa verifica**: igual que en H24, la pedagogía de las notas y los resúmenes. Algunas partidas son pobres como ejemplo y se dice en el resumen: la de Londres con `…Cc6` reacomoda piezas sin plan en su segunda mitad; el Caro-Kann del Cambio es
  simétrico (el motor no busca un plan); y las de las negras con desventaja chica y estable (India de Rey fianchetto, Philidor, Petroff) no son «ejemplos de ganar».
- **Errores míos que atrapó el trabajo**: dos finales engañosos (Siciliana Alapin, Francesa clásica) y una línea que el motor evaluaba mal para quien aprende, descubiertas por la evaluación y no por los tests; un título («parejísima») que
  sonaba mal y que vi en la captura; y un helper de mi script que se rompió por una variable (`S`) de otro lenguaje.
- **Probado en pantalla**: Chromium a 360 px, claro y oscuro: Siciliana (partida 3, tablero desde el lado negro) y Londres (partida 3). **No probado**: las otras aperturas en pantalla (el código es el mismo), un teléfono real ni la voz con las notas nuevas.

## H26: ajustes del inicio, Escandinava y revisión del contenido viejo
- **Pedido** (decidido con vos): (1) el puzzle del día no tiene que ser tan difícil mientras el rating de puzzles es provisional; (2) el saludo de la mascota no adelanta el tema; (3) **3 ramas nuevas del rival en la Escandinava**;
  (4) **revisar con chess.js lo que nunca pasó por chess.js**: partidas de ejemplo antiguas, planes y errores del rival, comentarios de ejercicios. Todo en un solo hito.
- **Puzzle del día**: con rating provisional (`isProvisional`: RD > 110) se busca **100 a 300 puntos por debajo** del rating redondeado (en vez de −100/+200) y la ventana se amplía de a poco si no hay nada; con rating confiable, la de siempre. No toca la matemática del rating
  ni los puzzles de Táctica. El saludo ya no nombra el tema («Te dejé un puzzle para hoy»; el tema se explica al terminar). **No probado**: cuántos días tarda en dejar de ser provisional con tu uso real.
- **Escandinava** (88 líneas en total): `esca-c4` (3.c4, el motor ve mejor a las negras: de −0,4 a −0,1), `esca-b4` (4.b4 gambito: de −0,1 a +0,4) y `esca-be2` (3.Cf3 Ag4 4.Ae2: de +0,06 a +0,4). Se desvían por jugadas del **rival** (las líneas de una apertura no
  pueden contradecir una jugada propia). Se descartaron 4.Cf3 (+0,6 a +0,8 para las blancas: mala para quien aprende), 4.c4 después de 3.d4 y 3…Dd6 (contradice tu …Da5). Verificadas: `escandinavaBranches.test.ts` (cada afirmación de las notas en el tablero; en
  el camino atrapó un error mío: en 4.b4 la dama en d6 tapa la diagonal del alfil de f8) y Stockfish (`DEEP=1`: ninguna jugada propia pierde más de 8 puntos ni el rival más de 15).
- **Revisión**: se leyeron las notas de las 21 partidas antiguas (147), las 60 explicaciones de ejercicios de aperturas, las ideas/planes/errores de las 23 aperturas, las 4 trampas, los 69 desafíos de lecciones y las 18 explicaciones genéricas de los ejercicios de Lichess.
  Para cada nota se miró una hoja de hechos de chess.js (qué hay en cada casilla que menciona y quién la ataca). **37 textos corregidos**, de los que unos **20 afirmaban algo que el tablero contradice**: «torres conectadas» con el alfil o la dama en el medio (Escocesa, Gambito de Dama y
  la línea `esc-nxd4`), «el alfil de g5» cuando estaba en h4, «clavás contra la dama» con un alfil blanco en e2 (Pirc), «presionás e4» con el alfil de e7 delante (Philidor), «la dama sale del ataque» de un alfil que no la atacaba (Caro-Kann), «ya solo te falta enrocar» sin haber
  sacado el alfil (Caro-Kann, Escandinava), «una base segura» para un peón de f4 sin defensor (Vienesa), «apunta a d5» con un caballo tapando la diagonal (Inglesa), «apoya e4» con un peón en el medio (Colle), «g3 o f4» con un peón propio en g3 (Vienesa), y el resumen del Evans que decía
  «material parejo» estando las blancas dos peones abajo. El resto eran precisiones o inconsistencias de estilo (letras inglesas, tercera persona).
- **Verificado con Stockfish** (`evalfens`, nuevo): las líneas citadas en dos explicaciones (Ruy López `…d5?` → +2,6 y Italiana `…Ch5?` → +3,7), y la **posición final de las 21 partidas antiguas** para comparar con sus resúmenes: se agregó la evaluación en los de Evans (+2,2), Francesa (+0,7),
  Gambito de Rey (−0,5), Alekhine (+0,8) y Pirc (+0,6), que sonaban más tranquilos de lo que el motor ve.
- **Se quedó**: `noteLint.test.ts` revisa con patrones **2.117 notas** (antiguas, nuevas y las 88 líneas a fondo) y fija cada corrección; no encuentra nada más, pero **no reemplaza leer**: solo cubre las frases que tienen forma de «ataca el X de f3». Las correcciones que no cubre el detector
  tienen su comprobación propia en el mismo archivo (`Colle`, `Inglesa`, `Pirc`, `Philidor`, material del Evans, la Vienesa…).
- **Lo que NO se revisó con este método**: los **132 pasos de lectura** de las lecciones (texto y diagramas), las ideas/planes generales de las aperturas (son consejos, casi sin afirmaciones comprobables: las leí, no las verifiqué), la **pedagogía** de todo lo anterior y las
  explicaciones de temas de H23. Los 57 ejercicios de Lichess comparten una explicación por tema y no se pueden verificar posición por posición.
- **Costo**: el JS de arranque pasó de 681 KB a 685 KB (las 3 líneas nuevas). Sigue pendiente el recorte de H19 (407 KB).
- **Probado en pantalla**: Chromium a 360 px, claro y oscuro: el saludo del inicio (con un puzzle de rating 579 para un nivel de partida de 800) y la lista de 7 líneas de la Escandinava. **No probado**: un teléfono real.

