import type { Challenge } from '../engine/challenge'
import type { Exercise } from '../engine/lesson'
import { lichess, mate1, pos } from './lessonKit'
import { NEW_LESSONS } from './lessonsNuevas'
import { ADVANCED_LESSONS } from './lessonsAvanzadas'
import { BEGINNER_LESSONS } from './lessonsPrincipiantes'
import { HAND_MORE } from './exerciseMore'

/**
 * Lecciones del currículo (bandas 800–1400). Cada lección tiene pasos de lectura con un
 * diagrama opcional, y ejercicios. Los ejercicios son de dos orígenes:
 * - `engine`: escritos a mano; un test los verifica con Stockfish (todas las jugadas buenas).
 * - `lichess`: puzzles de la base de Lichess (CC0), elegidos por `scripts/build-lesson-puzzles.mjs`.
 */

export interface Arrow {
  from: string
  to: string
  kind: 'good' | 'bad'
}

export interface LessonStep {
  title?: string
  text: string
  /** Posición de ejemplo (FEN). */
  fen?: string
  orientation?: 'white' | 'black'
  arrows?: Arrow[]
  highlights?: string[]
  /** Desafío para responder antes de seguir (adivinanza o mini-juego). */
  challenge?: Challenge
}

export interface Source {
  title: string
  url: string
}

export interface Lesson {
  id: string
  band: 'b0' | 'b1' | 'b2' | 'b3' | 'b4'
  title: string
  summary: string
  steps: LessonStep[]
  exercises: Exercise[]
  /** Tema de táctica para seguir practicando (clave de themes.json). */
  practice?: string
  /** Final jugable asociado (id de content/endgames.ts). */
  endgame?: string
  /** Línea de repertorio para practicar al terminar (id de content/repertoire.ts). */
  repLine?: string
  /** Lecturas relacionadas (de donde salieron las ideas; el texto es propio). */
  sources?: Source[]
}

const BASE_LESSONS: Lesson[] = [
  // ───────────── Banda 800–1100 ─────────────
  {
    id: 'seguridad',
    band: 'b0',
    title: 'Chequeo de seguridad',
    summary: 'El hábito que más puntos te da: mirar antes de mover.',
    practice: 'hangingPiece',
    steps: [
      {
        title: 'Por qué',
        text: 'Hasta 1400 casi todas las partidas se deciden por piezas que se regalan, no por estrategia. Un chequeo de 5 segundos antes de cada jugada evita la mayoría.',
      },
      {
        title: 'Las tres preguntas',
        text: 'Antes de mover, preguntate: 1) ¿Qué quiere hacer mi rival con su última jugada? 2) ¿Hay piezas mías sin defender o atacadas más veces de las que se defienden? 3) Después de mi jugada, ¿qué puede capturar o amenazar?',
      },
      {
        title: 'Jaques, capturas, amenazas',
        text: 'Mirá siempre en ese orden las jugadas del rival: primero los jaques, después las capturas, después las amenazas. Son las únicas jugadas que cambian la partida de golpe.',
      },
      {
        title: 'Ejemplo',
        text: 'Las negras acaban de jugar ♞f6 y atacan el peón de e4. Si las blancas juegan ♕h5?? sin mirar, el caballo de f6 captura la dama. Una dama que se mueve a una casilla atacada por un peón o una pieza menor casi siempre es un error.',
        fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
        arrows: [{ from: 'f6', to: 'e4', kind: 'bad' }],
      },
      {
        title: 'Ahora, del otro lado',
        text: 'También sirve para ganar: cada vez que el rival mueve, buscá si dejó algo colgado. En los ejercicios, tu rival acaba de equivocarse: encontrá cómo aprovecharlo.',
      },
    ],
    exercises: lichess('hangingPiece', 'El rival dejó una pieza sin defender. Siempre mirá primero qué piezas quedaron sin protección.'),
  },
  {
    id: 'mate1',
    band: 'b0',
    title: 'Mate en 1: cinco patrones',
    summary: 'Reconocerlos al instante es la base de todo ataque.',
    steps: [
      {
        title: 'Cómo buscarlo',
        text: 'Revisá todos los jaques que tengas. Con cada uno preguntate: ¿el rey puede capturar, tapar o escapar? Si la respuesta es no a las tres, es mate.',
      },
      {
        title: 'Mate del pasillo',
        text: 'El rey está encerrado por sus propios peones en la última fila. Una torre o dama que llega a esa fila da mate.',
        fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',
        arrows: [{ from: 'd1', to: 'd8', kind: 'good' }],
      },
      {
        title: 'Escalera',
        text: 'Dos torres (o dama y torre) se turnan: una corta una fila al rey y la otra da el jaque en la fila de al lado.',
        fen: 'k7/7R/8/8/8/8/8/6RK w - - 0 1',
        arrows: [{ from: 'g1', to: 'g8', kind: 'good' }],
      },
      {
        title: 'Mate de la coz',
        text: 'Un caballo da el jaque a un rey rodeado por sus propias piezas. El caballo no se puede bloquear ni capturar con el rey.',
        fen: '6rk/6pp/8/6N1/8/8/8/K7 w - - 0 1',
        arrows: [{ from: 'g5', to: 'f7', kind: 'good' }],
      },
    ],
    exercises: [
      mate1('m1-pasillo', '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1', 'd1d8', ['d1d8'], 'Mate del pasillo: el rey no puede salir porque sus peones le tapan las casillas.'),
      mate1(
        'm1-pastor',
        'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
        'h5f7',
        ['h5f7'],
        'Mate del pastor: la dama en f7 está protegida por el alfil de c4 y el rey no puede capturarla.',
      ),
      mate1('m1-escalera', 'k7/7R/8/8/8/8/8/6RK w - - 0 1', 'g1g8', ['g1g8'], 'Escalera: la torre de h7 corta la fila 7 y la de g8 da el jaque.'),
      mate1(
        'm1-dama',
        '7k/5K2/8/8/8/8/8/6Q1 w - - 0 1',
        'g1g7',
        ['g1g7', 'g1g8', 'g1h1', 'g1h2'],
        'La dama y el rey cierran todas las casillas. Cuando el rey propio protege a la dama, el rival no puede capturarla.',
      ),
      mate1('m1-coz', '6rk/6pp/8/6N1/8/8/8/K7 w - - 0 1', 'g5f7', ['g5f7'], 'Mate de la coz: el rey está rodeado de sus propias piezas.'),
    ],
  },
  {
    id: 'mate2',
    band: 'b1',
    title: 'Mate en 2',
    summary: 'Pensar un paso más: el jaque, la respuesta forzada y el mate.',
    practice: 'mateIn2',
    steps: [
      {
        title: 'La idea',
        text: 'En un mate en 2 la primera jugada casi siempre es un jaque que deja al rival con una sola respuesta, o una amenaza de mate que no se puede parar. No hace falta calcular todo: buscá primero los jaques.',
      },
      {
        title: 'Método',
        text: 'Para cada jaque posible: 1) ¿qué responde el rival? Si tiene una sola respuesta, seguí. 2) ¿hay mate después de esa respuesta? Si sí, ya lo tenés.',
      },
    ],
    exercises: lichess('mateIn2', 'Buscá primero los jaques: la jugada que deja una sola respuesta suele llevar al mate.'),
  },
  {
    id: 'horquilla',
    band: 'b1',
    title: 'Horquilla',
    summary: 'Una pieza ataca dos a la vez y el rival solo salva una.',
    practice: 'fork',
    steps: [
      {
        title: 'La idea',
        text: 'Una horquilla es un ataque doble: una sola pieza amenaza a dos o más piezas rivales. El rival solo puede salvar una, y vos te llevás la otra.',
      },
      {
        title: 'El caballo es el rey de la horquilla',
        text: 'Un caballo ataca en forma de L y no se puede bloquear. Si da jaque al rey y además ataca otra pieza (horquilla real), ganás esa pieza sí o sí.',
        fen: 'r3k3/pp3ppp/8/3N4/8/8/PPP2PPP/4K3 w - - 0 1',
        arrows: [
          { from: 'd5', to: 'c7', kind: 'good' },
          { from: 'c7', to: 'a8', kind: 'good' },
          { from: 'c7', to: 'e8', kind: 'good' },
        ],
      },
      {
        title: 'Cómo verlas',
        text: 'Buscá piezas del rival que estén a un salto de caballo de la misma casilla (rey y torre, dama y torre). También la dama, el alfil y hasta un peón pueden dar horquillas.',
      },
    ],
    exercises: lichess('fork', 'Una sola pieza ataca dos cosas a la vez: el rival solo puede salvar una.'),
  },
  {
    id: 'clavada',
    band: 'b1',
    title: 'Clavada',
    summary: 'Una pieza no puede moverse porque protege algo más valioso detrás.',
    practice: 'pin',
    steps: [
      {
        title: 'La idea',
        text: 'Una pieza está clavada cuando, si se mueve, deja a la vista una pieza más valiosa que estaba detrás (clavada relativa) o al rey (clavada absoluta: movimiento ilegal).',
      },
      {
        title: 'Cómo aprovecharla',
        text: 'Una pieza clavada es débil: no puede huir ni capturar. Atacala con un peón u otra pieza y la ganás. Y cuidado con tus propias piezas: no dejes caballos delante del rey o la dama donde el alfil rival los clave.',
      },
    ],
    exercises: lichess('pin', 'La pieza clavada no puede moverse (o no le conviene), así que se la puede atacar sin que escape.'),
  },
  {
    id: 'ensartada',
    band: 'b1',
    title: 'Ensartada',
    summary: 'Como la clavada, pero al revés: la pieza valiosa está adelante.',
    practice: 'skewer',
    steps: [
      {
        title: 'La idea',
        text: 'Una ensartada ataca una pieza valiosa con otra detrás. Cuando la de adelante se mueve (por ejemplo un rey que tiene que salir del jaque), te llevás la de atrás.',
      },
      {
        title: 'Dónde aparece',
        text: 'Casi siempre con torres, alfiles o la dama en líneas largas. Buscá el rey (o la dama) y otra pieza alineados con una de tus piezas de largo alcance.',
      },
    ],
    exercises: lichess('skewer', 'El rey o la pieza valiosa tiene que moverse y deja a la de atrás sin protección.', 3),
  },
  {
    id: 'apertura',
    band: 'b0',
    title: 'Principios de apertura',
    summary: 'Qué hacer en las primeras 10 jugadas sin memorizar teoría.',
    steps: [
      {
        title: '1. El centro',
        text: 'Ocupá el centro con peones (e4, d4 o e5, d5). Desde el centro tus piezas llegan rápido a cualquier lado.',
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
      },
      {
        title: '2. Desarrollá las piezas',
        text: 'Sacá los caballos y los alfiles hacia el centro antes que torres y dama. Cada jugada de apertura tiene que sumar una pieza al juego.',
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
      },
      {
        title: '3. Enrocá pronto',
        text: 'El enroque pone al rey a salvo y conecta las torres. Idealmente antes de la jugada 10.',
        fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 6',
      },
      {
        title: 'Lo que no hay que hacer',
        text: 'No muevas la dama temprano (la corretean), no muevas la misma pieza dos veces sin motivo, no captures a lo loco ni dejes piezas sin defender. Y mirá siempre qué amenaza tu rival con su última jugada.',
      },
      {
        title: 'Un repertorio mínimo',
        text: 'Con blancas: 1.e4 y desarrollo natural. Con negras contra 1.e4: 1...e5; contra 1.d4: 1...d5. En H4 de esta app vas a armar y repasar tu repertorio.',
      },
    ],
    exercises: [],
  },
  {
    id: 'mate-dama',
    band: 'b0',
    title: 'Mate de dama y rey',
    summary: 'El primer final que hay que dominar: cuidado con el ahogado.',
    endgame: 'kqk',
    steps: [
      {
        title: 'El método',
        text: 'Con dama y rey contra rey: 1) Con la dama, encerrá al rey rival en una zona cada vez más chica, siempre a un salto de caballo de distancia. 2) Acercá tu rey. 3) Cuando los dos reyes se miran de cerca, dama a la casilla que da mate.',
        fen: '8/8/8/3k4/8/8/8/4KQ2 w - - 0 1',
      },
      {
        title: 'El peligro',
        text: 'Si dejás al rival sin jugadas legales y sin estar en jaque, es ahogado: tablas. Antes de cada jugada, contá las casillas del rey rival.',
        fen: 'k7/8/1K6/8/8/8/8/2Q5 w - - 0 1',
        arrows: [{ from: 'c1', to: 'c7', kind: 'bad' }],
      },
    ],
    exercises: [],
  },
  {
    id: 'mate-torre',
    band: 'b1',
    title: 'Mate de torre y rey',
    summary: 'Más lento que con dama, pero siempre sale. Se mide en la banda siguiente.',
    endgame: 'krk',
    steps: [
      {
        title: 'La idea',
        text: 'Con la torre cortás al rey en una fila o columna y con tu rey te acercás para llevarlo al borde. La torre solo da el mate final.',
      },
      {
        title: 'El método de la caja',
        text: 'Hacé la "caja" más chica de a poco: cada vez que el rey rival se acerca a tu torre, alejala por la misma fila. Cuando tus reyes se enfrentan en oposición, la torre da un jaque y el rey retrocede.',
        fen: '8/8/8/3k4/8/8/8/R3K3 w - - 0 1',
      },
    ],
    exercises: [],
  },

  // ───────────── Banda 1100–1400 ─────────────
  {
    id: 'descubierta',
    band: 'b2',
    title: 'Ataque descubierto y jaque doble',
    summary: 'Mové una pieza y dejá que otra ataque desde atrás.',
    practice: 'discoveredAttack',
    steps: [
      {
        title: 'La idea',
        text: 'Una pieza (un alfil, una torre, la dama) estaba tapada por otra tuya. Al mover la de adelante, la de atrás ataca. Y la que se movió puede hacer su propia amenaza a la vez: dos amenazas con una sola jugada.',
      },
      {
        title: 'Jaque doble',
        text: 'Si la pieza que se descubre da jaque y la que se mueve también, es jaque doble: el rey no puede capturar ni bloquear dos cosas a la vez, tiene que moverse.',
      },
    ],
    exercises: [...lichess('discoveredAttack', 'Al mover la pieza de adelante se descubre un ataque, y la pieza que se movió hace otra amenaza.'), ...lichess('doubleCheck', 'Jaque doble: el rey tiene que moverse.', 2)],
  },
  {
    id: 'desviacion',
    band: 'b2',
    title: 'Desviación y atracción',
    summary: 'Sacar a una pieza clave de su puesto, o llevarla a donde te conviene.',
    practice: 'deflection',
    steps: [
      {
        title: 'Desviación',
        text: 'Forzás a una pieza defensora a irse de su casilla, normalmente con un sacrificio o un jaque, para que lo que defendía quede libre.',
      },
      {
        title: 'Atracción',
        text: 'Sacrificás una pieza para que el rey o la dama rival capture y quede en una casilla donde recibe un jaque, una horquilla o un mate.',
      },
      {
        title: 'Cómo pensar',
        text: 'Preguntate: ¿qué pieza rival defiende lo que quiero atacar? ¿Puedo obligarla a moverse? ¿Puedo ofrecer algo que ella no pueda rechazar?',
      },
    ],
    exercises: [...lichess('deflection', 'Se fuerza a la defensora a abandonar su puesto.', 3), ...lichess('attraction', 'Se obliga al rey o a la dama a ir a una casilla donde es atacada.', 3)],
  },
  {
    id: 'defensor',
    band: 'b2',
    title: 'Eliminar al defensor',
    summary: 'Si algo está bien protegido, quitá a quien lo protege.',
    practice: 'capturingDefender',
    steps: [
      {
        title: 'La idea',
        text: 'Una pieza o un jaque mate están protegidos por una sola pieza. Si capturás o eliminás a ese defensor, lo que protegía cae.',
      },
      {
        title: 'Contá atacantes y defensores',
        text: 'Una pieza está bien defendida si los defensores igualan a los atacantes. Cuando atacás más veces de las que defienden, cambiar piezas gana material.',
      },
    ],
    exercises: lichess('capturingDefender', 'Capturar al defensor deja indefenso lo que protegía.', 3),
  },
  {
    id: 'atrapada',
    band: 'b2',
    title: 'Pieza atrapada',
    summary: 'A veces una pieza no tiene a dónde ir.',
    practice: 'trappedPiece',
    steps: [
      {
        title: 'La idea',
        text: 'Una pieza atacada y sin casillas seguras está perdida. Las más propensas: la dama que se aventuró, un alfil capturando un peón en el borde y un caballo en el borde.',
      },
      {
        title: 'Cómo evitarlo',
        text: 'Antes de mandar una pieza lejos, preguntate: ¿tiene camino de vuelta si me la atacan? "Los caballos en el borde, la desgracia del dueño."',
      },
    ],
    exercises: lichess('trappedPiece', 'La pieza no tiene casillas seguras, así que se pierde.', 3),
  },
  {
    id: 'cuadrado',
    band: 'b2',
    title: 'Regla del cuadrado',
    summary: '¿Llega el rey a atrapar al peón que corre?',
    steps: [
      {
        title: 'La regla',
        text: 'Para saber si un rey alcanza a un peón pasado, imaginá un cuadrado que va desde el peón hasta la fila de coronación. Si el rey (cuando le toca mover) puede entrar en ese cuadrado, atrapa al peón.',
        fen: '7k/8/8/8/p7/8/8/4K3 w - - 0 1',
        highlights: ['a4', 'b4', 'c4', 'd4', 'a3', 'b3', 'c3', 'd3', 'a2', 'b2', 'c2', 'd2', 'a1', 'b1', 'c1', 'd1'],
      },
      {
        title: 'En este ejemplo',
        text: 'El peón negro está en a4 y necesita 3 jugadas para coronar. El cuadrado va de a4 a d1. El rey en e1 está afuera, pero con ♔d1 o ♔d2 entra y llega a tiempo. Si va a otra casilla, el peón corona.',
        fen: '7k/8/8/8/p7/8/8/4K3 w - - 0 1',
        arrows: [
          { from: 'e1', to: 'd2', kind: 'good' },
          { from: 'e1', to: 'f2', kind: 'bad' },
        ],
      },
      {
        title: 'Un detalle',
        text: 'Si el peón todavía está en su fila inicial puede avanzar dos casillas: contá el cuadrado desde la tercera fila.',
      },
      {
        title: 'Los ejercicios',
        text: 'Es tu turno y el peón negro corre. Encontrá la jugada del rey que lo alcanza (o que lo mantiene dentro del cuadrado).',
      },
    ],
    exercises: [
      pos('sq-1', '7k/8/8/8/p7/8/8/4K3 w - - 0 1', 'hold', ['e1d1', 'a4a3'], ['e1d1', 'e1d2'], 'El rey entra al cuadrado del peón (a4–d1). Desde ahí lo alcanza antes de que corone.'),
      pos('sq-3', '7k/8/8/8/8/p7/8/3K4 w - - 0 1', 'hold', ['d1c2', 'a3a2'], ['d1c1', 'd1c2'], 'El rey entra al cuadrado del peón (a3–c1): desde c2 pasa a b2 y vigila la casilla de coronación, a1.'),
      pos('sq-7', 'k7/8/8/8/8/6p1/8/4K3 w - - 0 1', 'hold', ['e1f1', 'g3g2'], ['e1e2', 'e1f1'], 'El rey ya estaba en el borde del cuadrado: tiene que acercarse, no alejarse.'),
    ],
  },
  {
    id: 'oposicion',
    band: 'b2',
    title: 'Oposición',
    summary: 'El concepto clave de los finales de rey y peón.',
    endgame: 'kpk-win',
    steps: [
      {
        title: 'La idea',
        text: 'Dos reyes están en oposición cuando quedan enfrentados en la misma columna con una casilla en el medio. Quien tiene que mover ahí pierde terreno. El que mueve, cede.',
        fen: '8/8/4k3/8/4K3/8/8/8 w - - 0 1',
      },
      {
        title: 'Con el peón adelante',
        text: 'El rey del bando que tiene el peón tiene que ir delante del peón: desde ahí empuja al rey rival hacia atrás y le abre el camino de coronación. El rey rival, en cambio, tiene que ir también delante del peón y mantenerse en oposición.',
        fen: '8/5k2/8/2K1P3/8/8/8/8 w - - 0 1',
        arrows: [{ from: 'c5', to: 'd6', kind: 'good' }],
      },
      {
        title: 'Ganar',
        text: 'Cuando el rey de tu bando llega delante del peón, a la altura de la sexta fila o más, el final está ganado. Con el rey en la sexta fila y el peón en la quinta, las blancas ganan.',
      },
      {
        title: 'Defender',
        text: 'Si defendés, tenés que ponerte delante del peón (idealmente en oposición) y no dejar entrar al rey rival. Las tablas dependen de unas pocas casillas clave.',
        fen: '8/8/8/6k1/4P3/3K4/8/8 b - - 0 1',
        arrows: [{ from: 'g5', to: 'f6', kind: 'good' }],
      },
    ],
    exercises: [
      pos('op-1', '8/5k2/8/2K1P3/8/8/8/8 w - - 0 1', 'win', ['c5d6', 'f7e8'], ['c5d6'], 'El rey blanco pasa a la sexta fila, junto al peón: ahí empuja al rey negro y gana.'),
      pos('op-2', '8/6K1/8/3kP3/8/8/8/8 w - - 0 1', 'win', ['g7f6', 'd5c5'], ['g7f6'], 'El rey blanco protege al peón y toma las casillas de adelante (e6 y e7).'),
      pos('op-3', '8/8/5k2/8/2K1P3/8/8/8 w - - 0 1', 'win', ['c4d5', 'f6e7'], ['c4d5'], 'El rey avanza protegiendo al peón y le gana el espacio al rey negro.'),
      pos('hd-1', '8/8/8/6k1/4P3/3K4/8/8 b - - 0 1', 'hold', ['g5f6', 'd3d4'], ['g5f6'], 'El rey defensor tiene que adelantarse al peón. Desde f6 controla e5 y e6.'),
      pos('hd-2', '8/8/6k1/4P3/3K4/8/8/8 b - - 0 1', 'hold', ['g6f7', 'd4d5'], ['g6f7'], 'Con el peón en la quinta, el rey negro se retira a f7 y queda frente al peón.'),
      pos('hd-3', '8/8/2k5/4P3/6K1/8/8/8 b - - 0 1', 'hold', ['c6d7', 'g4f5'], ['c6d7'], 'El rey negro se adelanta al peón: desde d7 alcanza para tablas aunque el rey blanco esté cerca.'),
    ],
  },
]

/** Orden de las lecciones en pantalla (dentro de cada banda). */
const ORDER = [
  'piezas-mov', 'reglas-esp', 'jaque-mate', 'seguridad', 'balanza', 'mate1', 'mate-dama', 'apertura', 'carrera', 'mi-primera-apertura', 'aperturas-negras', 'trampas',
  'mate2', 'horquilla', 'clavada', 'ensartada', 'mate-torre',
  'peones', 'piezas', 'torre', 'refugio', 'descubierta', 'desviacion', 'defensor', 'atrapada', 'cuadrado', 'oposicion', 'cerrar',
  'lucena', 'philidor', 'torre-final', 'calculo', 'profilaxis', 'transicion',
]

export const LESSONS: Lesson[] = [...BEGINNER_LESSONS, ...BASE_LESSONS, ...NEW_LESSONS, ...ADVANCED_LESSONS]
  .sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id))
  .map((l) => ({ ...l, exercises: l.exercises.map((e) => (HAND_MORE[e.id] && !e.more ? { ...e, more: HAND_MORE[e.id] } : e)) }))

export function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id)
}

export function exerciseCount(l: Lesson): number {
  return l.exercises.length
}
