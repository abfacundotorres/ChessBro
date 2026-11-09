import type { Lesson } from './lessons'
import { choice, lichess, pick, tap } from './lessonKit'

/**
 * Lecciones lúdicas hasta 1400: historias con personajes, adivinanzas y mini-juegos de tocar el
 * tablero. Los conceptos coinciden en varias fuentes de divulgación (ver `sources`); el texto es
 * propio. Lo que se puede verificar por código se verifica: las casillas de los mini-juegos salen
 * de funciones con tests (engine/structure.ts) y las adivinanzas de jugadas, de Stockfish.
 */

const READ_MORE = (title: string, url: string) => ({ title, url })

export const NEW_LESSONS: Lesson[] = [
  // ───────────── Banda 800–1100 ─────────────
  {
    id: 'balanza',
    band: 'b0',
    title: 'La balanza de las piezas',
    summary: 'El mercado del tablero: cuánto vale cada pieza y cómo no salir perdiendo.',
    practice: 'hangingPiece',
    sources: [
      READ_MORE('Value your pawns and pieces (Dummies)', 'https://www.dummies.com/games/chess/examining-the-material-element-in-chess/'),
      READ_MORE('Trade or Not? (ChessKid)', 'https://chesskid.com/learn/articles/trade-or-not-how-to-win-a-won-game'),
    ],
    steps: [
      {
        title: 'Bienvenido al mercado',
        text: 'Imaginá que el tablero es un mercado y cada pieza tiene un precio.\n\nEl peón vale 1 moneda. El caballo y el alfil, 3. La torre, 5. La dama, 9. Al rey no se lo vende: si lo perdés, se acabó la partida.\n\nSon precios de referencia, no leyes: una pieza muy activa puede valer más que su precio, y una encerrada, menos.',
        challenge: choice('Una torre vale, más o menos, como…', ['1 peón', '3 peones', '5 peones', '9 peones'], 2, 'Cinco monedas. Y la dama, nueve: casi dos torres.'),
      },
      {
        title: 'La regla del buen comerciante',
        text: 'Cambiar 3 por 3 es un trato justo. Entregar 5 por 3 es mal negocio, aunque parezca que recibís "más cosas".\n\nAntes de capturar (o de dejar que te capturen), sumá lo que da cada lado.',
        challenge: choice(
          'Cambiás tu torre (5) por un alfil y un peón (3 + 1). ¿Ganaste o perdiste?',
          ['Gané: recibí dos piezas', 'Perdí: di 5 y recibí 4', 'Quedó igual'],
          1,
          'Das 5 y recibís 4: perdés una moneda. Cuenta el valor, no la cantidad de piezas.',
        ),
      },
      {
        title: 'El truco del cazador',
        text: 'Cuando podés capturar con varias piezas, capturá con la más barata.\n\nUn peón que captura un caballo gana 2 monedas aunque el rival recapture. Una dama que captura una pieza defendida suele perderse a sí misma.',
        challenge: pick(
          'El caballo negro de d5 está protegido por el peón de e6. Podés capturarlo de varias maneras: ¿cuál conviene?',
          'rnbqkb1r/pppp1ppp/4p3/3n4/4P3/2N5/PPPP1PPP/R1BQKBNR w KQkq - 0 1',
          ['e4d5', 'c3d5', 'a2a3', 'f1c4'],
          'e4d5',
          'El peón (1) captura un caballo (3): aunque el rival recapture el peón, ganás 2 monedas. Con el caballo solo cambiás caballo por caballo.',
        ),
      },
      {
        title: 'Cacería de piezas colgadas',
        text: 'Una pieza está colgada cuando la atacan y nadie la defiende, o cuando la ataca una pieza más barata.\n\nEsto vale para los dos bandos: mirá primero lo tuyo y después lo del rival.',
        challenge: tap(
          'Tocá TODAS las piezas en peligro (de los dos bandos) y apretá "Listo".',
          '6k1/1b3ppp/5n2/3Q4/8/5N2/5PPP/6K1 w - - 0 1',
          'hanging',
          'both',
          'all',
          'El alfil de b7 está atacado por la dama y sin defensa. Pero ¡cuidado!: la dama blanca de d5 también cuelga, porque la ataca el caballo de f6.',
          ['b7', 'd5'],
        ),
      },
      {
        title: 'Resumen del mercado',
        text: '1 · 3 · 3 · 5 · 9.\n\nSumá antes de cambiar. Capturá con la pieza más barata. Y antes de cada jugada mirá qué piezas tuyas quedaron colgadas: ahora vas a practicar con posiciones reales.',
      },
    ],
    exercises: lichess('hangingPiece', 'Una pieza quedó atacada sin defensa. Mirá primero qué piezas están sin protección.', 4, 4),
  },
  {
    id: 'carrera',
    band: 'b0',
    title: 'La carrera del desarrollo',
    summary: 'Cada jugada es un paso: ganá el que llega con más piezas.',
    sources: [
      READ_MORE('Los 5 principios de la apertura (blog de Lichess)', 'https://lichess.org/@/Olaffo/blog/the-5-opening-principles-every-club-player-needs-to-master/uD07rPys'),
      READ_MORE('Los tres principios de la apertura (Chess.com)', 'https://www.chess.com/blog/Tamara/the-three-opening-principles-every-beginner-should-know'),
    ],
    steps: [
      {
        title: 'Una carrera de relevos',
        text: 'Las primeras jugadas son una carrera de relevos. Cada jugada es un paso, y se gana el paso (el "tempo") cuando sumás un corredor nuevo a la pista.\n\nLos corredores son los caballos y los alfiles. Mientras duerman en su casilla inicial, no corren.',
        challenge: tap(
          'Tocá TODOS los caballos y alfiles que todavía duermen en su casilla inicial (de los dos bandos).',
          'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
          'undeveloped',
          'both',
          'all',
          'Al blanco le quedan dormidos el caballo de b1 y el alfil de c1; al negro, el alfil de c8 y el de f8.',
          ['b1', 'c1', 'c8', 'f8'],
        ),
      },
      {
        title: 'Las reglas de la carrera',
        text: '1) Sacá caballos y alfiles antes que torres y dama.\n2) No muevas dos veces la misma pieza si no hace falta: cada vez regalás un paso.\n3) Enrocá pronto para esconder al rey y conectar las torres.\n\nExcepciones: si te atacan la pieza, o si ganás material, vale mover otra vez.',
        challenge: choice(
          'Tu rival mueve tres veces seguidas el mismo caballo y deja el resto dormido. ¿Qué ganaste vos?',
          ['Tiempo: voy a tener más piezas en juego que él', 'Nada: la cantidad de jugadas no importa', 'Material: ya tengo más piezas'],
          0,
          'Ganaste tiempo: mientras él se la pasó paseando un caballo, vos pusiste piezas nuevas en juego.',
        ),
      },
      {
        title: 'La dama, la peor corredora del comienzo',
        text: 'La dama es la pieza más fuerte, pero la peor para salir temprano: cualquier peón o caballo rival la puede perseguir, y cada vez que escapa le regala un paso al otro bando.',
        challenge: pick(
          'Jugás con blancas. ¿Cuál es la jugada de desarrollo sana?',
          'rnbqkb1r/pppp1ppp/5n2/4p3/4P3/2N5/PPPP1PPP/R1BQKBNR w KQkq - 2 3',
          ['g1f3', 'd1h5', 'd1g4'],
          'g1f3',
          'Con la dama afuera, el caballo de f6 la captura (en h5 o en g4). Sacá un caballo: suma una pieza y no regala nada.',
        ),
      },
      {
        title: 'Y entonces…',
        text: 'Caballos y alfiles afuera, el centro con peones y el rey enrocado. Eso es todo lo que necesitás para llegar a la mitad de la partida con una posición sana.\n\nCuando juegues, contá tus piezas dormidas antes de cada jugada: es la mejor brújula.',
      },
    ],
    exercises: [],
  },

  // ───────────── Banda 1100–1400 ─────────────
  {
    id: 'peones',
    band: 'b2',
    title: 'Los peones: un pueblo con carácter',
    summary: 'El Solitario, los Gemelos, el Rezagado y el Corredor.',
    sources: [
      READ_MORE('Pawn structure (ChessKid)', 'https://chesskid.com/learn/terms/pawn-structure-chess'),
      READ_MORE('Understanding Pawns (Chess.com)', 'https://www.chess.com/blog/MonkeyMoves/understanding-pawns'),
    ],
    steps: [
      {
        title: 'Un pueblo sin marcha atrás',
        text: 'Los peones no pueden volver: cada avance es para siempre. Por eso la "estructura" (cómo quedan colocados) marca el plan de toda la partida.\n\nVas a conocer a cuatro vecinos del pueblo: el Solitario, los Gemelos, el Rezagado y el Corredor.',
      },
      {
        title: 'El Peón Solitario (aislado)',
        text: 'No tiene peones amigos en las columnas de al lado. Nadie lo puede defender con otro peón, así que lo tienen que cuidar las piezas, y la casilla de adelante se convierte en un blanco.',
        challenge: tap(
          'Tocá a los dos Solitarios (hay uno de cada bando) y apretá "Listo".',
          '4k3/ppp4p/8/8/3P4/8/PP3PP1/4K3 w - - 0 1',
          'isolated',
          'both',
          'all',
          'El peón blanco de d4 y el negro de h7: ninguno tiene amigos en las columnas vecinas.',
          ['d4', 'h7'],
        ),
      },
      {
        title: 'Los Gemelos Pegajosos (doblados)',
        text: 'Dos peones del mismo color en la misma columna. Se estorban y no se protegen entre sí.\n\nA veces valen la pena (abren una columna para tus torres), pero suelen ser una debilidad, sobre todo en los finales.',
        challenge: tap(
          'Tocá los cuatro Gemelos (dos parejas) y apretá "Listo".',
          '4k3/pp3p1p/5p2/8/8/2P5/PPP3PP/4K3 w - - 0 1',
          'doubled',
          'both',
          'all',
          'Las blancas tienen los gemelos en la columna c (c2 y c3) y las negras en la f (f6 y f7).',
          ['c2', 'c3', 'f6', 'f7'],
        ),
      },
      {
        title: 'El Rezagado (atrasado)',
        text: 'Es un peón que quedó atrás de sus vecinos y ya no puede ser protegido por otro peón. La casilla justo delante de él es un "agujero": una pieza rival puede instalarse ahí sin que nadie la eche.',
        challenge: choice(
          '¿Qué hace que un peón atrasado sea un problema?',
          ['Que vale menos de una moneda', 'Que la casilla de adelante no se puede defender con peones', 'Que no puede capturar'],
          1,
          'Ese agujero delante del peón es un puesto ideal para una pieza rival (por ejemplo, un caballo).',
        ),
      },
      {
        title: 'El Corredor (pasado)',
        text: 'Nadie puede frenarlo con peones: no hay peones rivales delante, ni en su columna ni en las vecinas. Cuanto más avanza, más vale, y el rival tiene que dedicar piezas a vigilarlo.',
        challenge: tap(
          'Tocá a los dos Corredores (uno de cada bando) y apretá "Listo".',
          '4k3/pp5p/8/3P4/8/8/PP6/4K3 w - - 0 1',
          'passed',
          'both',
          'all',
          'El d5 blanco y el h7 negro no tienen peones rivales que los puedan frenar. En cambio a2/b2 y a7/b7 se bloquean entre sí.',
          ['d5', 'h7'],
        ),
      },
      {
        title: 'Detective final',
        text: 'Una más, ahora con peones de ambos bandos mezclados. Mirá bien quién tiene el camino libre.',
        challenge: tap(
          '¿Cuál de los peones blancos es pasado? Tocalo.',
          '8/5pk1/6p1/1P6/8/6K1/5PP1/8 w - - 0 1',
          'passed',
          'w',
          'any',
          'El peón de b5 no tiene peones negros delante ni en las columnas vecinas. Los de f2 y g2 están frenados por f7 y g6.',
          ['b5'],
        ),
      },
    ],
    exercises: [],
  },
  {
    id: 'piezas',
    band: 'b2',
    title: 'El alfil, el caballo y su balcón',
    summary: 'Alfil bueno, alfil malo y el puesto soñado del caballo.',
    sources: [
      READ_MORE('Make the most of your pieces (Chess.com)', 'https://www.chess.com/article/view/make-the-most-of-your-pieces'),
      READ_MORE('Estrategia (ChessKid)', 'https://chesskid.com/learn/articles/video-series-strategy'),
    ],
    steps: [
      {
        title: 'Mismo precio, distinto estilo',
        text: 'El alfil y el caballo valen lo mismo (3), pero juegan distinto.\n\nEl alfil corre por diagonales y necesita espacio libre. El caballo salta, así que se las arregla en posiciones cerradas, pero necesita buenos puestos.',
      },
      {
        title: 'Alfil bueno, alfil malo',
        text: 'Un alfil es "malo" cuando sus propios peones están en casillas de su color y le tapan el camino. Es "bueno" cuando sus peones están del otro color y él juega por fuera de la cadena.\n\nEn esta lección usamos una regla práctica: malo = 4 o más peones propios en el color de su casilla y pocas jugadas.',
        challenge: tap(
          'Las blancas tienen dos alfiles. Tocá el alfil MALO.',
          '6k1/pp4p1/8/4P3/3P4/2P5/PP4P1/2B2BK1 w - - 0 1',
          'badBishop',
          'w',
          'any',
          'El alfil de c1 tiene cuatro peones propios (b2, c3, d4 y e5) en casillas oscuras, como la suya, y casi no puede moverse. El de f1 juega libre.',
          ['c1'],
        ),
      },
      {
        title: 'El balcón del caballo',
        text: 'Una avanzada (en inglés, "outpost") es una casilla en terreno rival que defiende uno de tus peones y que ningún peón rival puede atacar jamás.\n\nUn caballo ahí es un dolor de cabeza: no lo podés echar con peones y desde ahí domina el centro.',
        challenge: tap(
          'Las blancas quieren instalar un caballo. Tocá la casilla del balcón.',
          '4k3/pp3ppp/3p4/8/2P1P3/8/PP3PPP/4K3 w - - 0 1',
          'outpost',
          'w',
          'any',
          'En d5 el caballo está protegido por los peones de c4 y e4, y las negras no tienen peones en c ni en e para echarlo.',
          ['d5'],
        ),
      },
      {
        title: 'Cómo liberar a un alfil encerrado',
        text: 'Si tu alfil está atrapado detrás de tus peones, hay dos remedios: cambiarlo por una pieza activa del rival, o abrir la posición con una ruptura de peón para que respire.',
        challenge: choice(
          'Tu alfil está encerrado por tus propios peones. ¿Qué plan es más sensato?',
          ['Dejarlo ahí para siempre', 'Cambiarlo o abrir el juego para que respire', 'Poner más peones en su color'],
          1,
          'Cambiarlo por una pieza activa o abrir la posición con una ruptura son las salidas típicas. Más peones en su color solo lo encierran más.',
        ),
      },
    ],
    exercises: [],
  },
  {
    id: 'torre',
    band: 'b2',
    title: 'La torre pide columnas abiertas',
    summary: 'Columnas abiertas, semiabiertas y la séptima fila.',
    sources: [
      READ_MORE('Estrategia para principiantes (House of Staunton)', 'https://www.houseofstaunton.com/chess-blog/the-best-chess-strategy-for-beginners/'),
      READ_MORE('Estrategia (ChessKid)', 'https://chesskid.com/learn/articles/video-series-strategy'),
    ],
    steps: [
      {
        title: 'Una torre encerrada no hace nada',
        text: 'La torre es de largo alcance y detesta los peones propios: encerrada detrás de ellos, es una pieza dormida.\n\nSu casa ideal es una columna abierta: una columna sin ningún peón.',
        challenge: tap(
          'Tocá una casilla de una columna abierta donde una torre estaría cómoda.',
          'r5kr/ppp2ppp/8/8/8/8/PPP2PPP/R5KR w - - 0 1',
          'openFile',
          'both',
          'any',
          'Las columnas d y e no tienen ningún peón: ahí una torre llega de punta a punta.',
        ),
      },
      {
        title: 'Abierta, semiabierta, cerrada',
        text: 'Abierta: sin peones de nadie. Semiabierta: sin peones tuyos, pero con uno del rival (la torre lo presiona). Cerrada: con peones de los dos.',
        challenge: choice(
          'Una columna no tiene peones tuyos, pero sí uno rival. ¿Cómo se llama?',
          ['Abierta', 'Semiabierta', 'Cerrada'],
          1,
          'Semiabierta: tu torre queda apuntando a ese peón rival.',
        ),
      },
      {
        title: 'La séptima fila',
        text: 'Una torre en la séptima fila (la segunda, para las negras) es una pesadilla: ataca los peones que todavía no se movieron y encierra al rey rival contra la última fila.',
        challenge: choice(
          '¿Por qué es tan fuerte una torre en la séptima?',
          ['Porque ahí vale más', 'Ataca peones sin mover y aprieta al rey', 'Porque nadie la puede capturar'],
          1,
          'Desde la séptima ataca los peones de atrás y aprieta al rey rival.',
        ),
      },
      {
        title: 'Duplicar',
        text: 'Dos torres en la misma columna se protegen y se potencian: se llama "duplicar". Cuando consigas una columna abierta, llevá las dos.',
      },
    ],
    exercises: [],
  },
  {
    id: 'refugio',
    band: 'b2',
    title: 'El refugio del rey',
    summary: 'El Rey Miedoso: cómo esconderlo y cómo no regalar el refugio.',
    sources: [
      READ_MORE('King Safety (Chess Programming Wiki)', 'https://www.chessprogramming.org/King_Safety'),
      READ_MORE('Pensá siempre en el rey (blog de Lichess)', 'https://lichess.org/@/loristavernier/blog/always-think-about-the-king/OoHJt9Tt'),
    ],
    steps: [
      {
        title: 'El Rey Miedoso',
        text: 'Al comienzo el rey está en el centro, y ahí las columnas abiertas y las piezas rivales lo alcanzan rápido.\n\nPor eso se enroca: lo escondés detrás de peones y de paso conectás las torres.',
      },
      {
        title: 'El escudo de peones',
        text: 'Los peones delante del rey enrocado (f, g y h) son su refugio. Cada peón que movés de ahí deja huecos que ya no se pueden tapar, porque los peones no vuelven.',
        challenge: choice(
          'Enrocaste corto y avanzás el peón de g. ¿Qué pasó con el refugio?',
          ['Quedó más fuerte', 'Se debilitó: dejaste huecos que ningún peón puede tapar', 'Nada: es lo mismo'],
          1,
          'Esos huecos delante del rey son un blanco permanente. Antes de empujar un peón de tu escudo, preguntate qué casillas dejás de proteger.',
        ),
      },
      {
        title: 'El punto flojo: f7 (y f2)',
        text: 'Al comienzo, el punto más débil de cada bando es f7 (para las negras) y f2 (para las blancas): solo los protege el rey.\n\nPor eso existe el famoso mate del pastor. Ahora te toca defenderte.',
        challenge: pick(
          'Jugás con negras. Las blancas amenazan ♕xf7 mate. ¿Cómo lo evitás?',
          'r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3',
          ['d8e7', 'g8f6', 'c6d4', 'd7d6'],
          'd8e7',
          'La dama de e7 protege f7. Ojo con ...♘f6, la jugada que parece natural: no tapa nada y ♕xf7 sigue siendo mate.',
        ),
      },
      {
        title: 'Cuándo está en peligro un rey enrocado',
        text: 'Mirá si hay una columna abierta cerca del rey y piezas rivales apuntándola, o si los peones enemigos se acercan para abrirla.',
        challenge: choice(
          '¿Qué señal te avisa que un rey enrocado está en peligro?',
          ['Que tiene muchos peones alrededor', 'Una columna abierta cerca y piezas rivales apuntando', 'Que las torres están conectadas'],
          1,
          'Una columna abierta junto al rey es una autopista para las piezas rivales.',
        ),
      },
    ],
    exercises: [],
  },
  {
    id: 'cerrar',
    band: 'b2',
    title: 'Cómo cerrar una partida ganada',
    summary: 'Cobrar la ventaja: simplificar, vigilar y empujar el peón pasado.',
    practice: 'promotion',
    sources: [
      READ_MORE('Trade or Not? How to Win a Won Game (ChessKid)', 'https://chesskid.com/learn/articles/trade-or-not-how-to-win-a-won-game'),
      READ_MORE('Simplify the Position', 'https://exploringchess.substack.com/p/simplification'),
    ],
    steps: [
      {
        title: 'La victoria hay que cobrarla',
        text: 'Ganar una partida cuando ya estás mejor es otro oficio. Un plan en tres pasos:\n\n1) Mirá qué quiere hacer tu rival (sus amenazas y su contrajuego).\n2) Simplificá: cambiá piezas.\n3) Avanzá con un plan claro, por ejemplo empujando un peón pasado.',
      },
      {
        title: 'Cambiá piezas, no peones',
        text: 'Cuando tenés más material, cada cambio de piezas hace que tu ventaja pese más y le deja menos piezas al rival para armar contrajuego. Los peones, en cambio, cuidalos: son los que van a coronar.',
        challenge: choice(
          'Vas ganando una pieza. ¿Qué conviene en general?',
          ['Cambiar piezas para simplificar', 'Cambiar tus peones para abrir el juego', 'Atacar con todo aunque quede el rey solo'],
          0,
          'Con ventaja de material, simplificar es el camino. Y a los peones, cuidarlos.',
        ),
      },
      {
        title: 'Pero no a ciegas',
        text: 'Cambiar piezas no es una receta automática: antes de simplificar, preguntate si el final que queda se puede ganar de verdad. Un cambio "porque sí" puede dejarte en un final tablas.',
        challenge: choice(
          '¿Cuándo hay que pensarlo dos veces antes de cambiar?',
          ['Si el final que resulta no se puede ganar', 'Nunca: siempre hay que cambiar', 'Solo si cambiás damas'],
          0,
          'Antes de simplificar, comprobá que el final que queda es realmente ganado.',
        ),
      },
      {
        title: 'Buscá el Corredor',
        text: 'El peón pasado es tu candidato a coronar: el rival va a tener que dedicarle piezas, y eso te libera el resto del tablero.',
        challenge: tap(
          'Jugás con negras. ¿Cuál de tus peones es el pasado? Tocalo.',
          '6k1/1p6/8/7p/8/8/PPP5/6K1 b - - 0 1',
          'passed',
          'b',
          'any',
          'El de h5: no hay peones blancos en las columnas g ni h. El de b7 está frenado por los peones de a2, b2 y c2.',
          ['h5'],
          'black',
        ),
      },
    ],
    exercises: lichess('advancedPawn', 'Un peón pasado y avanzado obliga al rival a reaccionar: aprovechalo.', 3),
  },
]
