import type { Lesson } from './lessons'
import { choice, fenAfter, pick, tap } from './lessonKit'

/**
 * Banda 400–800 (primeros pasos) y aperturas desde cero. Mismo criterio que las demás: las casillas de los
 * mini-juegos las calculan funciones con tests (jugadas legales de chess.js), las adivinanzas de jugadas las verifica
 * Stockfish y los hechos sobre una posición (jaque, mate, ahogado) los comprueba un test. Cada lección tiene su
 * versión seria en lessonsSerias.ts.
 */

const READ = (title: string, url: string) => ({ title, url })

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const KING_ALONE = (piece: string) => `k7/8/8/8/3${piece}4/8/8/7K w - - 0 1`

const E4 = fenAfter(['e4'])
const NF3 = fenAfter(['e4', 'e5', 'Nf3'])
const BC4 = fenAfter(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'])
const ITAL = fenAfter(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd3', 'd6', 'O-O'])

export const BEGINNER_LESSONS: Lesson[] = [
  {
    id: 'piezas-mov',
    band: 'b0',
    title: 'El elenco del tablero',
    summary: 'Cómo se mueve cada pieza, una por una.',
    sources: [READ('Reglas del ajedrez: movimientos (Wikipedia)', 'https://es.wikipedia.org/wiki/Ajedrez')],
    steps: [
      {
        title: 'El tablero',
        text: 'El tablero tiene 64 casillas. Las columnas se nombran con letras (de la a a la h) y las filas con números (del 1 al 8). Cada casilla es una letra y un número: la que está en la columna e y la fila 4 se llama e4.\n\nLas blancas empiezan abajo y mueven primero.',
        fen: START,
        challenge: tap('Tocá la casilla e4.', START, 'target', 'both', 'any', 'e4 es la columna e (la quinta desde la izquierda) y la fila 4.', ['e4']),
      },
      {
        title: 'La torre: la corredora',
        text: 'La torre corre en línea recta, por filas y columnas, tantas casillas como quiera. No puede saltar piezas: si hay una pieza propia, se frena antes; si es rival, puede capturarla.',
        fen: KING_ALONE('R'),
        challenge: tap('Tocá una casilla a la que pueda ir la torre.', KING_ALONE('R'), 'moves', 'w', 'any', 'La torre llega a cualquier casilla de su fila y de su columna, mientras no haya piezas en el camino.', undefined, undefined, 'd4'),
      },
      {
        title: 'El alfil: el de las diagonales',
        text: 'El alfil se mueve por las diagonales, también tantas casillas como quiera. Como solo anda por diagonales, siempre queda en casillas del mismo color con el que empezó.',
        fen: KING_ALONE('B'),
        challenge: tap('Tocá una casilla a la que pueda ir el alfil.', KING_ALONE('B'), 'moves', 'w', 'any', 'El alfil recorre las dos diagonales que pasan por su casilla.', undefined, undefined, 'd4'),
      },
      {
        title: 'La dama: la reina del tablero',
        text: 'La dama es la pieza más poderosa: se mueve como una torre y como un alfil a la vez, en línea recta o en diagonal, tantas casillas como quiera.',
        fen: KING_ALONE('Q'),
        challenge: tap('Tocá una casilla a la que pueda ir la dama.', KING_ALONE('Q'), 'moves', 'w', 'any', 'La dama junta las jugadas de la torre y del alfil.', undefined, undefined, 'd4'),
      },
      {
        title: 'El caballo: el saltarín',
        text: 'El caballo es el único que salta por encima de las demás piezas. Se mueve en forma de L: dos casillas en una dirección y una al costado. Desde el centro puede ir a 8 casillas.',
        fen: KING_ALONE('N'),
        challenge: tap('Tocá las 8 casillas a las que puede ir el caballo y apretá "Listo".', KING_ALONE('N'), 'moves', 'w', 'all', 'Dos casillas en una dirección y una al costado: siempre cae en una casilla de otro color.', undefined, undefined, 'd4'),
      },
      {
        title: 'El rey: un paso a la vez',
        text: 'El rey se mueve una sola casilla, en cualquier dirección. Es la pieza más importante: si lo atrapan sin salida, perdés la partida. Por eso no puede ir a una casilla que el rival ataque.',
        fen: 'k7/8/8/8/3K4/8/8/8 w - - 0 1',
        challenge: tap('Tocá las 8 casillas a las que puede ir el rey y apretá "Listo".', 'k7/8/8/8/3K4/8/8/8 w - - 0 1', 'moves', 'w', 'all', 'Una casilla en cualquiera de las ocho direcciones.', undefined, undefined, 'd4'),
      },
      {
        title: 'El peón: el valiente',
        text: 'El peón solo avanza, nunca retrocede. Avanza una casilla; desde su casilla inicial puede avanzar una o dos. Pero captura distinto: en diagonal, una casilla hacia adelante.',
        fen: 'k7/8/8/3p1p2/4P3/8/8/7K w - - 0 1',
        challenge: tap('El peón de e4 puede avanzar o capturar. Tocá las 3 casillas a las que puede ir y apretá "Listo".', 'k7/8/8/3p1p2/4P3/8/8/7K w - - 0 1', 'moves', 'w', 'all', 'Avanza a e5 y captura en diagonal los peones de d5 y f5.', undefined, undefined, 'e4'),
      },
    ],
    exercises: [],
  },
  {
    id: 'reglas-esp',
    band: 'b0',
    title: 'Jugadas especiales',
    summary: 'Enroque, captura al paso y coronación.',
    sources: [READ('Enroque (Wikipedia)', 'https://es.wikipedia.org/wiki/Enroque'), READ('Captura al paso (Wikipedia)', 'https://es.wikipedia.org/wiki/Captura_al_paso')],
    steps: [
      {
        title: 'El enroque',
        text: 'El enroque mueve dos piezas en una sola jugada: el rey avanza dos casillas hacia una torre y la torre salta al otro lado. Sirve para poner al rey a salvo y sacar la torre al juego.\n\nSe hace con el rey y la torre del mismo lado: enroque corto (hacia la torre de h) o largo (hacia la de a).',
        fen: 'r3k2r/8/8/8/8/8/3PPP2/R3K2R w KQkq - 0 1',
        challenge: tap('Tocá las 4 casillas a las que puede ir el rey blanco (incluidas las del enroque) y apretá "Listo".', 'r3k2r/8/8/8/8/8/3PPP2/R3K2R w KQkq - 0 1', 'moves', 'w', 'all', 'El rey puede ir a d1 y f1 (un paso) y, con el enroque, a g1 (corto) y a c1 (largo).', undefined, undefined, 'e1'),
      },
      {
        title: 'Cuándo no se puede enrocar',
        text: 'No se puede enrocar si el rey o esa torre ya se movieron, si hay piezas entre los dos, si el rey está en jaque, o si tiene que pasar por una casilla (o llegar a una) atacada por el rival.',
        challenge: choice(
          '¿Cuándo NO se puede enrocar?',
          ['Si el rey ya se movió o está en jaque', 'Si tenés peones adelante', 'Si la dama ya salió'],
          0,
          'El rey no puede haberse movido, no puede estar en jaque ni pasar por casillas atacadas.',
        ),
      },
      {
        title: 'La captura al paso',
        text: 'Hay una regla rara: si un peón avanza dos casillas y queda al lado de un peón rival, ese peón puede capturarlo "al paso", como si hubiera avanzado solo una. Se puede hacer únicamente en la jugada siguiente.',
        fen: '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1',
        challenge: tap('Las negras acaban de jugar …d5 (dos casillas). Tocá las 2 casillas a las que puede ir el peón blanco de e5 y apretá "Listo".', '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', 'moves', 'w', 'all', 'Puede avanzar a e6 o capturar al paso en d6: el peón negro desaparece aunque esté en d5.', undefined, undefined, 'e5'),
      },
      {
        title: 'La coronación',
        text: 'Cuando un peón llega a la última fila, se convierte en otra pieza a elección: casi siempre una dama (la más fuerte), pero también puede ser torre, alfil o caballo. Por eso un peón que llega lejos vale muchísimo.',
        fen: '1r2k3/P7/8/8/8/8/8/4K3 w - - 0 1',
        challenge: tap('El peón de a7 está a un paso de coronar. Tocá las 2 casillas a las que puede ir y apretá "Listo".', '1r2k3/P7/8/8/8/8/8/4K3 w - - 0 1', 'moves', 'w', 'all', 'Puede avanzar a a8 o capturar la torre en b8: en los dos casos corona.', undefined, undefined, 'a7'),
      },
    ],
    exercises: [],
  },
  {
    id: 'jaque-mate',
    band: 'b0',
    title: 'Jaque, mate y tablas',
    summary: 'Cómo se gana, y las formas de empatar.',
    sources: [READ('Jaque mate (Wikipedia)', 'https://es.wikipedia.org/wiki/Jaque_mate'), READ('Tablas (Wikipedia)', 'https://es.wikipedia.org/wiki/Tablas_(ajedrez)')],
    steps: [
      {
        title: 'Jaque',
        text: 'Hay jaque cuando el rey está atacado. El que está en jaque tiene que salir de inmediato, de una de tres maneras: mover el rey a una casilla segura, capturar la pieza que da jaque, o interponer una pieza en el medio.',
        fen: '4k3/8/8/8/8/8/4R3/4K3 b - - 0 1',
        challenge: choice('Es el turno de las negras. ¿Qué le pasa a su rey?', ['Está en jaque: tiene que salir', 'Está en jaque mate', 'No hay ningún problema'], 0, 'La torre de e2 ataca al rey por la columna e. Puede escapar yéndose a otra columna: es jaque, no mate.', '4k3/8/8/8/8/8/4R3/4K3 b - - 0 1', 'check'),
      },
      {
        title: 'Jaque mate',
        text: 'Hay jaque mate cuando el rey está en jaque y no hay ninguna manera de salir. Ahí termina la partida: gana el que dio el mate. Es el objetivo de todo el juego.',
        fen: '3R2k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1',
        challenge: choice('Es el turno de las negras. ¿Qué pasa?', ['Pueden mover el rey y seguir', 'Están en jaque mate: perdieron', 'Es un empate'], 1, 'El rey no puede moverse (sus propios peones lo encierran), nadie puede capturar la torre ni interponerse: jaque mate.', '3R2k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1', 'checkmate'),
      },
      {
        title: 'Encontrá el mate',
        text: 'Ahora te toca a vos. Tenés que dar jaque mate en una jugada: con cualquier otra jugada, las negras te lo dan a vos.',
        challenge: pick(
          'Jugás con blancas. ¿Cuál es el jaque mate?',
          '3r2k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',
          ['d1d8', 'g2g3', 'h2h3', 'd1d2'],
          'd1d8',
          '♖xd8 es mate: el rey negro no tiene salida. Cualquier otra jugada deja a las blancas a merced de ...♖xd1#, el mismo mate.',
        ),
      },
      {
        title: 'El ahogado',
        text: 'Cuidado con esto: si al que le toca mover no está en jaque pero no tiene ninguna jugada legal, hay ahogado y la partida es tablas (empate), aunque tengas muchísima más ventaja. Es el gran error de quien está ganando.',
        fen: '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1',
        challenge: choice('Mueven las negras. ¿Qué resultado tiene esta posición?', ['Jaque mate: ganan las blancas', 'Ahogado: tablas', 'Las negras pueden mover el rey a h7'], 1, 'El rey negro no está en jaque, pero todas las casillas a las que podría ir están atacadas: ahogado y tablas.', '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1', 'stalemate'),
      },
      {
        title: 'Otras tablas',
        text: 'También hay tablas por: material insuficiente (por ejemplo, rey contra rey, o rey y alfil contra rey: no hay forma de dar mate), repetición de la misma posición tres veces, 50 jugadas sin captura ni movimiento de peón, o acuerdo de los dos jugadores.',
        challenge: choice('¿Cuál de estas NO es una forma de empatar?', ['Acuerdo de los dos jugadores', 'Que un jugador tenga más piezas', 'Repetir la misma posición tres veces'], 1, 'Tener más piezas no empata: hay que dar mate para ganar.'),
      },
    ],
    exercises: [],
  },
  {
    id: 'mi-primera-apertura',
    band: 'b0',
    title: 'Tu primera apertura',
    summary: 'Las primeras jugadas, una por una y entendiendo por qué.',
    repLine: 'w-italiana-c3',
    sources: [
      READ('Los 5 principios de la apertura (blog de Lichess)', 'https://lichess.org/@/Olaffo/blog/the-5-opening-principles-every-club-player-needs-to-master/uD07rPys'),
      READ('Los tres principios de la apertura (Chess.com)', 'https://www.chess.com/blog/Tamara/the-three-opening-principles-every-beginner-should-know'),
    ],
    steps: [
      {
        title: '¿Qué es una apertura?',
        text: 'Una apertura son las primeras jugadas de la partida (más o menos las primeras diez). No hace falta memorizar nada: hay tres objetivos.\n\n1) Ocupar el centro con peones. 2) Sacar los caballos y los alfiles. 3) Enrocar para poner al rey a salvo.\n\nVamos a armarlas con una apertura clásica y simple: la Italiana.',
        fen: START,
        challenge: choice('¿Cuál es el objetivo de las primeras jugadas?', ['Poner las piezas en juego y enrocar', 'Atacar al rey rival cuanto antes', 'Cambiar las damas'], 0, 'Centro, piezas en juego y rey a salvo: eso te deja una posición sana para el resto de la partida.'),
      },
      {
        title: '1.e4: el centro',
        text: 'Con 1.e4 el peón ocupa el centro y abre el camino para dos piezas: el alfil de f1 y la dama.',
        fen: E4,
        arrows: [{ from: 'e2', to: 'e4', kind: 'good' }],
        challenge: choice('¿Por qué es buena la jugada 1.e4?', ['Ocupa el centro y abre camino al alfil y a la dama', 'Protege al rey', 'Captura una pieza'], 0, 'Un peón en el centro controla casillas importantes y libera a las piezas de atrás.'),
      },
      {
        title: '2.♘f3: la primera pieza',
        text: 'Las negras copiaron con 1…e5. Ahora sacás un caballo con 2.♘f3: suma una pieza al juego y, de paso, ataca el peón de e5.',
        fen: NF3,
        arrows: [
          { from: 'g1', to: 'f3', kind: 'good' },
          { from: 'f3', to: 'e5', kind: 'good' },
        ],
        challenge: choice('¿Qué logra 2.♘f3?', ['Saca un caballo y ataca el peón de e5', 'Protege a la dama', 'Enroca al rey'], 0, 'Desarrolla una pieza y de paso crea una amenaza.'),
      },
      {
        title: '3.♗c4: el alfil apunta a f7',
        text: 'Las negras defendieron con …♘c6. Ahora sacás el alfil a c4: desde ahí apunta a f7, el punto más débil de las negras al comienzo (solo lo protege el rey).',
        fen: BC4,
        orientation: 'white',
        arrows: [
          { from: 'f1', to: 'c4', kind: 'good' },
          { from: 'c4', to: 'f7', kind: 'good' },
        ],
        challenge: tap('Ya sacaste un caballo y un alfil. Tocá TODAS las piezas blancas que todavía faltan sacar (caballos y alfiles en su casilla) y apretá "Listo".', BC4, 'undeveloped', 'w', 'all', 'Faltan el caballo de b1 y el alfil de c1: las próximas jugadas son para ellos.'),
      },
      {
        title: 'Después: centro y enroque',
        text: 'Las negras siguen con …♗c5. Tu plan: c3 y d3 para armar el centro, sacar el caballo, y enrocar. Mirá cómo queda la posición después de enrocar.',
        fen: ITAL,
        orientation: 'white',
        challenge: tap('Mirá la posición. ¿Quedó alguna pieza blanca sin sacar? Tocá las que faltan y apretá "Listo".', ITAL, 'undeveloped', 'w', 'all', 'Faltan el caballo de b1 y el alfil de c1. Con eso, las blancas terminan de jugar la apertura.'),
      },
      {
        title: 'Ahora, a practicarla',
        text: 'Lo mejor es jugarla vos. En el repertorio vas a encontrar esta línea para estudiar y practicar, y las posiciones se te van a ir repitiendo hasta que las sepas de memoria sin esfuerzo.',
      },
    ],
    exercises: [],
  },
  {
    id: 'aperturas-negras',
    band: 'b0',
    title: 'Con negras: respondé en el centro',
    summary: 'Qué jugar contra 1.e4 y contra 1.d4.',
    repLine: 'b-giuoco-c3',
    sources: [READ('Los 5 principios de la apertura (blog de Lichess)', 'https://lichess.org/@/Olaffo/blog/the-5-opening-principles-every-club-player-needs-to-master/uD07rPys')],
    steps: [
      {
        title: 'Con negras te toca responder',
        text: 'Las blancas mueven primero, pero eso no es una desventaja: vos podés copiar la idea de ocupar el centro. La regla simple es responder con el peón del centro del mismo tipo.',
      },
      {
        title: 'Contra 1.e4: 1…e5',
        text: 'Si las blancas juegan 1.e4, respondé 1…e5. Ocupa el centro, abre camino para tu alfil de f8 y tu dama, y te deja jugadas naturales como …♘c6 y …♗c5.',
        fen: fenAfter(['e4', 'e5']),
        orientation: 'black',
        arrows: [{ from: 'e7', to: 'e5', kind: 'good' }],
        challenge: choice('Las blancas juegan 1.e4. ¿Qué respondés?', ['1…e5', '1…a6', '1…h5'], 0, 'Ocupás el centro con un peón, igual que las blancas.'),
      },
      {
        title: 'Contra 1.d4: 1…d5',
        text: 'Si las blancas juegan 1.d4, respondé 1…d5: es el mismo plan. Después desarrollás con …♘f6 y …e6, y enrocás.',
        fen: fenAfter(['d4', 'd5']),
        orientation: 'black',
        arrows: [{ from: 'd7', to: 'd5', kind: 'good' }],
        challenge: choice('Las blancas juegan 1.d4. ¿Qué respondés?', ['1…d5', '1…g5', '1…a5'], 0, 'Un peón en el centro, como en la respuesta a 1.e4.'),
      },
      {
        title: 'Y después, a desarrollar',
        text: 'Sea cual sea la apertura, el plan es el mismo: sacar caballos y alfiles, enrocar, y mirar qué amenaza el rival antes de cada jugada.',
        fen: fenAfter(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd3']),
        orientation: 'black',
        challenge: tap('Mirá la posición. Tocá la pieza negra que todavía falta sacar.', fenAfter(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd3']), 'undeveloped', 'b', 'any', 'Falta el alfil de c8. El caballo de g8 ya salió a f6, el de b8 a c6 y el alfil de f8 a c5.', undefined, 'black'),
      },
    ],
    exercises: [],
  },
  {
    id: 'trampas',
    band: 'b0',
    title: 'Trampas de tu nivel',
    summary: 'Tres trampas que se ven todo el tiempo, para usarlas y para no caer.',
    repLine: 'b-giuoco-c3',
    sources: [READ('Mate del pastor (Wikipedia)', 'https://es.wikipedia.org/wiki/Mate_del_pastor'), READ('Mate del loco (Wikipedia)', 'https://es.wikipedia.org/wiki/Mate_del_loco'), READ('Mate de Légal (Wikipedia)', 'https://es.wikipedia.org/wiki/Trampa_de_L%C3%A9gal')],
    steps: [
      {
        title: 'Por qué importan las trampas',
        text: 'A tu nivel muchas partidas se deciden en las primeras jugadas por una trampa: alguien juega un movimiento "natural" que pierde la partida. Conviene conocer las más comunes: para ganar partidas rápido y, sobre todo, para no caer.',
      },
      {
        title: 'El mate del loco',
        text: 'Es el mate más rápido posible: en dos jugadas. Pasa cuando las blancas abren el camino de la diagonal a su propio rey con 1.f3 y 2.g4, y las negras tienen la dama lista en d8.',
        fen: fenAfter(['f3', 'e5', 'g4']),
        orientation: 'black',
        challenge: pick('Jugás con negras. ¿Cuál es la jugada?', fenAfter(['f3', 'e5', 'g4']), ['d8h4', 'g8f6', 'b8c6', 'f8c5'], 'd8h4', '♕h4# es mate: el rey blanco no tiene salida por la diagonal abierta. Moraleja: no abras la diagonal de tu propio rey con f3 y g4.'),
      },
      {
        title: 'El mate del pastor',
        text: 'Muy frecuente: las blancas sacan la dama a h5 y el alfil a c4, y las dos apuntan a f7, que solo defiende el rey. Si las negras no se dan cuenta, ♕xf7 es mate.',
        fen: fenAfter(['e4', 'e5', 'Qh5', 'Nc6', 'Bc4', 'Nf6']),
        challenge: pick('Jugás con blancas. Las negras no vieron la amenaza. ¿Cuál es la jugada?', fenAfter(['e4', 'e5', 'Qh5', 'Nc6', 'Bc4', 'Nf6']), ['h5f7', 'h5f3', 'b1c3', 'd2d3'], 'h5f7', '♕xf7# es mate: la dama está protegida por el alfil y el rey no puede capturarla.'),
      },
      {
        title: 'Cómo no caer en el pastor',
        text: 'Si te hacen esa amenaza con negras, hay una defensa sencilla: protegé f7 con la dama o echá a la dama con …g6. Sacar el caballo a f6 parece natural, pero justamente no defiende f7.',
        challenge: pick('Jugás con negras. Las blancas amenazan ♕xf7 mate. ¿Cómo lo evitás?', 'r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3', ['d8e7', 'g8f6', 'c6d4', 'd7d6'], 'd8e7', 'La dama en e7 protege f7. …♘f6?? no tapa nada y ♕xf7 sigue siendo mate.'),
      },
      {
        title: 'La trampa de Légal',
        text: 'Una trampa más fina: las negras clavan el caballo con …♗g4 creyendo que ganan material. Las blancas responden con una jugada sorprendente. Mirá la posición.',
        fen: fenAfter(['e4', 'e5', 'Nf3', 'd6', 'Bc4', 'Bg4', 'Nc3', 'g6']),
        challenge: pick(
          'Jugás con blancas. ¿Cuál es la jugada?',
          fenAfter(['e4', 'e5', 'Nf3', 'd6', 'Bc4', 'Bg4', 'Nc3', 'g6']),
          ['f3e5', 'c4f7', 'c3d5', 'h2h3'],
          'f3e5',
          '♘xe5 deja la dama en el aire a propósito. Si las negras la capturan (…♗xd1), siguen ♗xf7+ y ♘d5 y es mate. Si capturan el caballo con el peón, ♕xg4 gana el alfil. ♗xf7+ de inmediato, en cambio, pierde.',
        ),
      },
      {
        title: 'La moraleja',
        text: 'Antes de capturar o de mover una pieza "natural", mirá qué deja sin defensa y qué amenaza ya hay sobre tu rey. Esas dos preguntas evitan casi todas las trampas.',
      },
    ],
    exercises: [],
  },
]
