import type { Lesson } from './lessons'
import { choice, lichess, pick, tap } from './lessonKit'

/**
 * Lecciones de las bandas 1400–1600 y 1600–1800 (H5). Mismo criterio que lessonsNuevas.ts: las adivinanzas de
 * jugadas las verifica Stockfish, las casillas de los mini-juegos salen de funciones con tests, y los
 * conceptos coinciden en varias fuentes. Cada lección tiene su versión seria en lessonsSerias.ts.
 */

const READ = (title: string, url: string) => ({ title, url })

const LUCENA = '3K4/3P1k2/8/8/8/8/r7/4R3 w - - 0 1'
const PHILIDOR = '4k3/8/r7/3KP3/8/8/8/3R4 b - - 0 1'

export const ADVANCED_LESSONS: Lesson[] = [
  // ───────────── Banda 1400–1600 ─────────────
  {
    id: 'lucena',
    band: 'b3',
    title: 'La posición de Lucena',
    summary: 'El peón que no puede entrar a su casa, y el puente que lo deja pasar.',
    endgame: 'lucena',
    sources: [READ('Lucena position (Wikipedia)', 'https://en.wikipedia.org/wiki/Lucena_position'), READ('The Two Rook Endings You Must Know (Chess.com)', 'https://www.chess.com/article/view/the-two-rook-endings-you-must-know')],
    steps: [
      {
        title: 'El peón que no puede entrar',
        text: 'Tenés un peón en la séptima fila y tu rey delante de él, pero el rey rival está cortado por tu torre. Parece ganado… y sin embargo no coronás.\n\nEs como estar parado en la puerta de tu casa: tu propio rey tapa la casilla de coronación y el peón no puede avanzar. Encima, la torre rival te molesta con jaques desde lejos.',
        fen: LUCENA,
        challenge: choice(
          '¿Qué le impide avanzar al peón de d7?',
          ['Su propio rey está en la casilla de coronación', 'El rey negro lo captura', 'La torre negra lo clava'],
          0,
          'El rey blanco ocupa d8, la casilla de coronación: el peón no puede avanzar hasta que el rey salga de ahí.',
        ),
      },
      {
        title: 'El puente',
        text: 'La técnica se llama "el puente": llevás tu torre a la cuarta fila. Más tarde, cuando tu rey salga de la columna del peón, esa torre se interpone ante los jaques de la torre rival.\n\nTu rey cruza, y la torre de la cuarta fila es el puente por el que pasa.',
        fen: LUCENA,
        arrows: [{ from: 'e1', to: 'e4', kind: 'good' }],
        challenge: choice('¿En qué fila conviene poner la torre para armar el puente?', ['En la cuarta', 'En la primera', 'En la séptima'], 0, 'La cuarta fila: desde ahí se interpone ante los jaques cuando el rey sale por el costado.'),
      },
      {
        title: 'Sacar al rey',
        text: 'Con la torre en la cuarta fila, el rey sale de la columna del peón por el lado opuesto al rey rival. Cuando la torre rival da jaque, tu torre se interpone, y tu rey sigue avanzando.\n\nCuando ya está a salvo del jaque, el peón corona.',
        challenge: choice(
          'La torre rival te da jaque desde lejos y tu rey ya está fuera de la columna. ¿Qué hacés?',
          ['Interponés tu torre de la cuarta fila', 'Corrés con el rey hacia el rey rival', 'Cambiás las torres sin pensar'],
          0,
          'Interponer la torre es justamente el puente: tapa el jaque y deja al rey avanzar.',
        ),
      },
      {
        title: 'A jugarlo',
        text: 'Ahora te toca contra el motor, desde esta posición, con blancas: coroná el peón en 25 jugadas o menos y conservá la dama. Si te trabás, pedí pista.\n\nNo hay una sola forma de ganar: lo que importa es entender por qué funciona el puente.',
      },
    ],
    exercises: [],
  },
  {
    id: 'philidor',
    band: 'b3',
    title: 'La defensa Philidor',
    summary: 'La muralla de la sexta fila, y los jaques desde atrás.',
    endgame: 'philidor',
    sources: [READ('Philidor position (Wikipedia)', 'https://en.wikipedia.org/wiki/Philidor_position'), READ('The Two Rook Endings You Must Know (Chess.com)', 'https://www.chess.com/article/view/the-two-rook-endings-you-must-know')],
    steps: [
      {
        title: 'La muralla en la sexta',
        text: 'Ahora del otro lado: tenés torre y rey contra torre, rey y un peón. Si el rey rival se acerca al peón, perdés. La defensa se llama Philidor: tu torre vigila toda la sexta fila, como una muralla que el rey rival no puede cruzar.',
        fen: PHILIDOR,
        orientation: 'black',
        arrows: [{ from: 'a6', to: 'h6', kind: 'good' }],
        challenge: choice(
          '¿Dónde pone la torre el bando que defiende?',
          ['En la sexta fila (la tercera, contando desde su lado)', 'Delante del peón', 'Detrás del peón enemigo desde el principio'],
          0,
          'La torre en esa fila impide que el rey rival avance con el peón: es la defensa Philidor.',
        ),
      },
      {
        title: 'Cuando el peón avanza',
        text: 'Cuando el peón rival avanza a la sexta fila, la muralla ya no hace falta: tu torre pasa a la primera fila, detrás del rey rival, y empieza a dar jaques desde lejos.\n\nSin dónde esconderse de esos jaques, el rey no puede ayudar al peón: son tablas.',
        challenge: choice(
          'El peón rival llegó a la sexta fila. ¿Qué hace la defensa?',
          ['Pasa la torre atrás y da jaques desde lejos', 'Mantiene la torre en la sexta', 'Captura el peón con el rey'],
          0,
          'Los jaques desde lejos y por detrás son la segunda mitad de la defensa Philidor.',
        ),
      },
      {
        title: 'Mientras tanto',
        text: 'Mientras el peón no pase de la quinta fila, mantené la torre en la sexta y el rey cerca de la casilla de coronación. No muevas la torre de ahí sin motivo: es lo que sostiene la defensa.',
      },
      {
        title: 'A jugarlo',
        text: 'Contra el motor, desde esta posición, con negras: aguantá 30 jugadas (o lográ tablas antes). Si el rival consigue el mate o corona, perdiste.',
      },
    ],
    exercises: [],
  },
  {
    id: 'torre-final',
    band: 'b3',
    title: 'Torres activas',
    summary: 'Detrás de los peones pasados, y siempre en movimiento.',
    practice: 'rookEndgame',
    sources: [READ('Tarrasch rule (Wikipedia)', 'https://en.wikipedia.org/wiki/Tarrasch_rule'), READ('Rooks belong behind passed pawns (ChessBase)', 'https://en.chessbase.com/post/rooks-belong-behind-paed-pawns')],
    steps: [
      {
        title: 'La regla de Tarrasch',
        text: 'Los finales de torres son los más comunes. Una regla muy antigua dice que las torres pertenecen detrás de los peones pasados: tanto los tuyos (para empujarlos) como los del rival (para frenarlos).\n\nEs una guía con excepciones, no una ley: pero acertás casi siempre si la seguís.',
        challenge: choice('Tenés un peón pasado. ¿Dónde conviene la torre?', ['Detrás del peón, en su columna', 'Delante del peón', 'Al lado de tu rey'], 0, 'Desde atrás, la torre empuja al peón y gana alcance a medida que avanza.'),
      },
      {
        title: 'Activa antes que pasiva',
        text: 'Una torre que se queda defendiendo peones sin moverse es una torre perdida. En los finales de torres la actividad suele importar más que un peón de más: una torre activa ataca y limita al rey rival.',
        challenge: choice('Un final de torres. ¿Qué principio suele ayudar?', ['Preferir una torre activa, aun con riesgos menores', 'Defender todo con la torre quieta', 'Cambiar las torres siempre'], 0, 'La actividad de la torre pesa mucho: una torre pasiva se queda sin juego.'),
      },
      {
        title: 'Cortar al rey',
        text: 'Una torre colocada en una fila o columna que el rey rival no puede cruzar "lo corta". Es lo que preparaba la posición de Lucena: el rey rival no podía acercarse al peón.',
      },
      {
        title: 'Practicá con posiciones reales',
        text: 'Ahora, con posiciones de partidas reales: buscá cómo se activa la torre y qué jugada la deja detrás del peón o cortando al rey.',
      },
    ],
    exercises: lichess('rookEndgame', 'Mirá dónde queda tu torre respecto del peón y del rey rival: la jugada ganadora suele activarla.', 3),
  },

  // ───────────── Banda 1600–1800 ─────────────
  {
    id: 'calculo',
    band: 'b4',
    title: 'Calcular con método',
    summary: 'Jaques, capturas y amenazas primero; después, hasta el final de la variante.',
    practice: 'mateLong',
    sources: [
      READ('Looking for Options and Prophylactic Thinking in Calculation (Modern Chess)', 'https://www.modern-chess.com/course/looking-for-options-and-prophylactic-thinking-in-calculation/38587/'),
      READ('Candidate Moves (Exeter Chess Club, PDF)', 'https://mail.exeterchessclub.org.uk/sites/exeterchessclub.org.uk/files/CandidateMoves.pdf'),
    ],
    steps: [
      {
        title: 'El explorador',
        text: 'Calcular bien no es ver más rápido: es explorar con orden, como un explorador que marca el camino.\n\n1) Preguntate qué quiere hacer el rival.\n2) Armá la lista de jugadas candidatas: primero las forzadas (jaques, capturas y amenazas).\n3) Seguí cada línea forzada hasta el final.\n4) Evaluá cómo queda la posición.',
        challenge: choice('¿Con qué jugadas conviene empezar a calcular?', ['Jaques, capturas y amenazas', 'Las jugadas tranquilas', 'Cualquiera, al azar'], 0, 'Las jugadas forzadas limitan las respuestas del rival y son las más fáciles de calcular a fondo.'),
      },
      {
        title: 'El árbol, no la rama',
        text: 'El error más común al calcular es seguir una sola línea (la que te conviene) y olvidar las otras respuestas del rival. En cada paso preguntate: ¿cuál es la mejor respuesta del rival?',
        challenge: choice(
          '¿Qué error es muy común al calcular?',
          ['Calcular solo la respuesta rival que me conviene', 'Revisar todas las respuestas del rival', 'Mirar cómo termina la variante'],
          0,
          'Calcular solo lo que te conviene es esperar que el rival se equivoque. Buscá siempre su mejor respuesta.',
        ),
      },
      {
        title: 'No te quedes en la primera captura',
        text: 'Muchas jugadas "ganan" material en el primer paso y pierden en el tercero. La disciplina es mirar un paso más: ¿qué pasa después de la recaptura?',
        challenge: pick(
          'Jugás con blancas y buscás mate. Tenés varios jaques y capturas muy tentadores. ¿Cuál es la jugada correcta?',
          'rnb1q2r/k1B3p1/p2b1n1p/1p3p2/4p3/1Q6/PP3PPP/RN2KB1R w KQ - 0 18',
          ['b3e3', 'c7b8', 'c7b6', 'b3b5'],
          'b3e3',
          '♕e3+, después ♕xc5+ y ♕b6#: mate en tres jugadas. Los otros jaques y capturas con el alfil parecen fuertes, pero deshacen la ventaja.',
        ),
      },
      {
        title: 'Otro: la captura que cobra',
        text: 'Un cálculo ordenado te ahorra el susto. Acá hay una captura con jaque que gana la partida, y varias más que parecen buenas y no lo son.',
        challenge: pick(
          'Jugás con blancas. ¿Qué captura lleva a mate en tres?',
          '2r3k1/1Q3ppp/p3p3/3qP3/1P6/P1rp4/5PPP/2R3K1 w - - 0 28',
          ['b7c8', 'b7f7', 'b7d5', 'b7a6'],
          'b7c8',
          '♕xc8+ ♖xc8 ♖xc8+ ♕d8 ♖xd8#: mate en tres jugadas. Las otras capturas pierden el ataque.',
        ),
      },
      {
        title: 'El chequeo final',
        text: 'Antes de jugar la jugada elegida, una última mirada: ¿qué deja colgado? ¿qué amenaza nueva le abre al rival? Un minuto de chequeo evita la mayoría de los desastres.',
      },
    ],
    exercises: lichess('mateIn3', 'Seguí las jugadas forzadas hasta el final: son tres pasos, y cada una deja una sola respuesta.', 2, 2),
  },
  {
    id: 'profilaxis',
    band: 'b4',
    title: 'Profilaxis: ¿qué quiere mi rival?',
    summary: 'Parar su mejor idea antes de que se vuelva peligrosa.',
    practice: 'defensiveMove',
    sources: [
      READ('The Most Important Concept In Chess (Chess.com)', 'https://www.chess.com/article/view/prophylaxis-in-chess'),
      READ('Understanding before Moving: Prophylaxis (ChessBase)', 'https://en.chessbase.com/post/understanding-before-moving-65-prophylaxis'),
    ],
    steps: [
      {
        title: 'El detective',
        text: 'Antes de ejecutar tu plan, interrogá a tu rival: ¿qué quiere hacer? ¿cuál sería su mejor jugada si pudiera mover ahora?\n\nLa profilaxis (palabra de Nimzowitsch) es impedir esa idea antes de que se vuelva peligrosa. No es pasividad: es jugar contra el plan del rival.',
        challenge: choice(
          '¿Qué es la profilaxis?',
          ['Impedir el plan del rival antes de que se vuelva peligroso', 'Atacar siempre primero', 'Cambiar las damas'],
          0,
          'Se trata de anticipar y frenar la mejor idea del rival.',
        ),
      },
      {
        title: 'El costo de la jugada',
        text: 'Una jugada profiláctica no es gratis: gasta un tiempo que no usás para tu plan. Valen la pena cuando el rival tiene una idea fuerte y la podés impedir sin dañar tu posición, y mejor si además la jugada mejora tu juego.',
        challenge: choice(
          '¿Cuándo vale la pena una jugada profiláctica?',
          ['Cuando el rival tiene una idea fuerte y podés evitarla sin dañar tu posición', 'En cada jugada', 'Nunca: hay que atacar'],
          0,
          'Se elige cuando la idea rival es fuerte y el costo es bajo. No se juega siempre.',
        ),
      },
      {
        title: 'La tentación del jaque',
        text: 'A veces la jugada más fuerte es una tranquila que impide el contrajuego. Acá hay una posición donde coronar con jaque es una trampa: la jugada correcta no da jaque, pero te deja con todo bajo control.',
        challenge: pick(
          'Jugás con blancas. El peón de d7 está a punto de coronar. ¿Cuál es la jugada correcta?',
          '7k/3P3p/1p2B1p1/2p1p3/3rP3/p3K2P/8/8 w - - 0 44',
          ['e6d5', 'd7d8q', 'd7d8r'],
          'e6d5',
          '♗d5 es un desvío: si la torre captura el alfil, exd5 y nadie frena al peón de d7. En cambio, coronar de inmediato con jaque pierde el peón por ...♖xd8.',
        ),
      },
      {
        title: 'Al revés: las jugadas que defienden',
        text: 'A veces el rival ya tiene una amenaza concreta: la jugada defensiva es la que anula esa amenaza con precisión. Mirá bien qué quiere hacer antes de mover.',
      },
    ],
    exercises: [
      ...lichess('defensiveMove', 'La jugada defensiva correcta anula la amenaza del rival con precisión.', 3),
      ...lichess('quietMove', 'Una jugada tranquila que cambia el rumbo de la posición.', 2, 1),
    ],
  },
  {
    id: 'transicion',
    band: 'b4',
    title: 'Del medio juego al final',
    summary: 'El rey se activa, el peón pasado exterior y cuándo conviene simplificar.',
    practice: 'pawnEndgame',
    sources: [
      READ('Trade or Not? How to Win a Won Game (ChessKid)', 'https://chesskid.com/learn/articles/trade-or-not-how-to-win-a-won-game'),
      READ('Rook endings (U.S. Chess Federation guide)', 'https://www.uchess.com/chess-guide/rook-endings'),
    ],
    steps: [
      {
        title: 'Cambio de escenario',
        text: 'Cuando se cambian las damas y varias piezas, la partida entra en otro escenario: el final. Y ahí el rey, que en el medio juego se escondía, pasa a ser una pieza activa.\n\nAntes de simplificar, preguntate: ¿mi rey y mis peones están mejor en ese final?',
        challenge: choice('¿Qué cambia en el final respecto del medio juego?', ['El rey pasa a ser una pieza activa', 'El rey debe esconderse siempre', 'Los peones valen menos'], 0, 'Sin damas, el rey es seguro y muy útil: conviene llevarlo al centro.'),
      },
      {
        title: 'El peón pasado exterior',
        text: 'Un peón pasado lejos de los demás peones (exterior) obliga al rey rival a alejarse para frenarlo. Y cuando ese rey se va, el resto de tus peones queda sin defensa.',
        fen: '8/5ppp/4k3/8/P7/4K3/5PPP/8 w - - 0 1',
        challenge: tap('¿Cuál de los peones blancos es el pasado exterior? Tocalo.', '8/5ppp/4k3/8/P7/4K3/5PPP/8 w - - 0 1', 'passed', 'w', 'any', 'El peón de a4 no tiene peones negros en las columnas a ni b: está lejos de los demás y desvía al rey rival.', ['a4']),
      },
      {
        title: '¿Para qué sirve?',
        text: 'La jugada típica es avanzar el peón exterior: el rey rival tiene que ir a detenerlo, y tu rey entra por el otro flanco a comerse los peones.',
        challenge: choice('¿Para qué sirve un peón pasado exterior?', ['Para alejar al rey rival del resto de los peones', 'Para defender a tu rey', 'No sirve de nada'], 0, 'Distrae al rey rival: tu rey aprovecha el otro flanco.'),
      },
      {
        title: 'Contar, y oposición',
        text: 'En los finales de peones se calcula: contá las jugadas de cada peón y de cada rey. La oposición y la regla del cuadrado (ya las practicaste) te dicen si un rey llega a tiempo.',
      },
    ],
    exercises: lichess('pawnEndgame', 'Contá los tiempos: lo que parece una carrera suele decidirse por una jugada de rey.', 3),
  },
]
