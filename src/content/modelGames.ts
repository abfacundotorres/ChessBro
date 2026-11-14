import type { Color } from '../engine/game'
import type { ModelGame } from './deep/kit'
import { deepLinesOf } from './openingLines'

/**
 * Partidas de ejemplo adicionales por apertura (H24 en adelante). Cada una parte de una línea distinta de la apertura
 * (`prefix` jugadas de una línea a fondo) y Stockfish sigue solo contra sí mismo (herramienta: `src/test/author7.test.ts`).
 * Las notas de TUS jugadas del tramo inicial se heredan de la línea a fondo (ya revisadas en H17); el resto las escribí a
 * mano mirando lo que pasa en el tablero, y `__tests__/modelGames.test.ts` comprueba con chess.js lo que afirman.
 * Cada jugada tuya lleva nota, más las del rival que cambian algo. No son partidas reales.
 */
interface EngineGame {
  opening: string
  /** Id de la línea a fondo de la que parte, y cuántas jugadas (plies) comparte con ella. */
  line: string
  prefix: number
  title: string
  color: Color
  /** La partida completa en SAN, separada por espacios. */
  moves: string
  /** Notas por índice de jugada (0 = primera jugada de las blancas). Se suman a las heredadas. */
  notes: Record<number, string>
  summary: string
}

const mine = (i: number, color: Color) => (i % 2 === 0) === (color === 'w')

function engineGame(g: EngineGame): ModelGame {
  const base = deepLinesOf(g.opening).find((l) => l.id === g.line)
  if (!base) throw new Error(`${g.opening}: no existe la línea ${g.line}`)
  const moves = g.moves.split(' ')
  const inherited: Record<number, string> = {}
  for (let i = 0; i < g.prefix; i++) if (mine(i, g.color) && base.notes?.[i]) inherited[i] = base.notes[i]!
  return { title: g.title, engine: true, color: g.color, moves, notes: { ...inherited, ...g.notes }, summary: g.summary }
}

/** Para los tests: de dónde parte cada partida. */
export const ENGINE_GAME_SOURCES: Record<string, { line: string; prefix: number }[]> = {}

function register(list: EngineGame[]): Record<string, ModelGame[]> {
  const out: Record<string, ModelGame[]> = {}
  for (const g of list) {
    ;(out[g.opening] ??= []).push(engineGame(g))
    ;(ENGINE_GAME_SOURCES[g.opening] ??= []).push({ line: g.line, prefix: g.prefix })
  }
  return out
}

const GAMES: EngineGame[] = [
  {
    opening: 'evans',
    line: 'evans-rech',
    prefix: 14,
    title: 'Evans rehusado: espacio con b4 y a5',
    color: 'w',
    moves: 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bb6 a4 a6 Nc3 Nf6 d3 d6 a5 Ba7 Rb1 O-O h3 h6 O-O Be6 Be3 Qd7 Bxa7 Rxa7 Qd2 Raa8 Bb3 Bxb3 Rxb3 Rfe8',
    notes: {
      14: 'a5 ataca al alfil de b6 y le quita esa casilla: ganás espacio en el flanco de dama.',
      15: 'El alfil retrocede a a7 y sigue apuntando a f2, pero ya no puede volver a b6.',
      16: 'Rb1 protege el peón de b4, al que atacaba el caballo de c6.',
      18: 'h3 le quita g4 a las negras: ni su caballo ni su alfil pueden clavar o molestar desde ahí.',
      20: 'Enrocás: el rey queda a salvo y la torre de f1 queda lista para el centro.',
      21: 'El alfil negro ataca al tuyo de c4 y ofrece el cambio.',
      22: 'Be3 ataca el alfil de a7: querés cambiar el alfil que apunta a tu rey.',
      24: 'Bxa7 cambia alfiles: desaparece la pieza negra que apuntaba a f2.',
      26: 'Qd2 apunta a h6 y deja las torres conectadas en la primera fila.',
      28: 'Bb3 mantiene el alfil frente a su colega de e6: si lo cambian en b3, recapturás con la torre de b1.',
      30: 'Recapturás con la torre de b1, que sigue protegiendo el peón de b4.',
    },
    summary:
      'Un Evans rehusado: con b4 y a5 las blancas ganan espacio en el flanco de dama, cambian el alfil que apuntaba a su rey y quedan con una posición cómoda. No hay ataque ni combinación: es una partida de maniobras, y Stockfish la ve igualada (de +0,0 a +0,2).',
  },
  {
    opening: 'cuatro-caballos',
    line: '4c-bc5',
    prefix: 11,
    title: 'Cuatro Caballos: 6.Cxe5 y el doble ataque de d4',
    color: 'w',
    moves: 'e4 e5 Nf3 Nc6 Nc3 Nf6 Bb5 Bc5 O-O O-O Nxe5 Nxe5 d4 Bd6 f4 Nc6 e5 Be7 d5 Nxd5 Nxd5 d6 f5 dxe5 f6 Bxf6 Nxf6+ gxf6 Bh6 Qd4+',
    notes: {
      10: 'Nxe5 gana un peón y ofrece el caballo: si lo toman, d4 ataca a la vez al alfil de c5 y al caballo de e5.',
      11: 'Las negras toman el caballo: por un momento van una pieza arriba.',
      12: 'd4 es la idea: el peón ataca al alfil de c5 y al caballo de e5 a la vez, y las negras tienen que salvar las dos piezas.',
      13: 'El alfil retrocede a d6 y protege al caballo de e5.',
      14: 'f4 ataca el caballo de e5 con un peón: tiene que moverse.',
      15: 'El caballo vuelve a c6 y ataca el peón de d4.',
      16: 'e5 ataca al alfil de d6 y al caballo de f6 a la vez: ganás espacio y tiempo.',
      18: 'd5 ataca el caballo de c6 y le quita las mejores casillas.',
      19: 'Las negras toman en d5: ese caballo ataca f4 y c3.',
      20: 'Nxd5 recaptura: el caballo llega al centro y apunta a c7 y e7.',
      21: 'd6 ataca el peón de e5, que ya no tiene tanto apoyo.',
      22: 'f5 abre líneas contra el rey, pero deja el peón de e5 sin protección.',
      24: 'f6 ataca a la vez al alfil de e7 y al peón de g7: querés romper el enroque negro.',
      26: 'Nxf6+ gana el alfil con jaque y rompe los peones del enroque negro.',
      28: 'Bh6 ataca la torre de f8 y se mete entre las casillas oscuras del rey negro.',
      29: 'Qd4+ da jaque y ataca b2: las negras contraatacan, pero el rey sigue expuesto.',
    },
    summary:
      'Una partida abierta y filosa: 6.Cxe5 Cxe5 7.d4 gana tiempo con el doble ataque, las blancas toman espacio con f4-e5-d5 y terminan rompiendo el enroque negro con f6. Stockfish la ve a favor de las blancas (cerca de +0,6), pero el rey blanco tampoco está tranquilo: es una línea para calcular, no para jugar de memoria.',
  },
  {
    opening: 'italiana',
    line: 'it-hungara',
    prefix: 13,
    title: 'Italiana húngara: romper en el centro con d4',
    color: 'w',
    moves: 'e4 e5 Nf3 Nc6 Bc4 Be7 d3 Nf6 O-O O-O Re1 d6 c3 Na5 Bb5 a6 Ba4 c5 d4 cxd4 cxd4 b5 Bc2 Bg4 d5 Qc7 Bd3 Nb7 b4 a5 Bd2 axb4',
    notes: {
      13: 'El caballo negro ataca tu alfil de c4: quiere cambiarlo por el caballo.',
      14: 'Bb5 esquiva el ataque del caballo, que queda en el borde del tablero.',
      16: 'Ba4 mantiene el alfil activo en la diagonal a4–e8, y el caballo de a5 sigue lejos del juego.',
      18: 'd4 abre el centro: el peón ataca a la vez a c5 y a e5. Es la ruptura que preparaste con c3.',
      20: 'cxd4 recaptura y deja un centro de peones en e4 y d4, que apunta a e5.',
      21: 'El peón negro ataca tu alfil de a4: hay que moverlo.',
      22: 'Bc2 sale del ataque y sigue protegiendo el peón de e4 por la diagonal.',
      23: 'El alfil negro clava el caballo de f3 contra tu dama.',
      24: 'd5 cierra el centro y le quita las casillas c6 y e6 a las piezas negras.',
      26: 'Bd3 ataca el peón de b5, aunque lo protege el de a6: mantenés la presión en el flanco de dama.',
      28: 'b4 gana espacio en el flanco de dama y vigila las casillas a5 y c5.',
      29: 'a5 ataca tu peón de b4, que no tiene protección.',
      30: 'Bd2 protege el peón de b4 y desarrolla el alfil de c1.',
    },
    summary:
      'Una Italiana que se abre con d4: las blancas rompen en el centro, el centro se cierra con d5 y la lucha pasa al flanco de dama con b4. Stockfish la ve igualada (de 0,0 a +0,3): ganar espacio no da ventaja por sí solo, hay que seguir con un plan.',
  },
  {
    opening: 'italiana',
    line: 'it-a6',
    prefix: 18,
    title: 'Italiana lenta: cambios y paciencia',
    color: 'w',
    moves: 'e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3 a6 O-O d6 Bb3 Ba7 Re1 O-O Nbd2 h6 Nf1 Be6 Be3 Bxe3 Nxe3 Bxb3 Qxb3 Qd7 a4 Rfe8 a5 Rab8 h3 Nh5 Red1 Nf6',
    notes: {
      18: 'Nf1 reubica el caballo hacia e3 o g3, desde donde apoya el centro.',
      19: 'El alfil negro ataca el tuyo de b3 y ofrece el cambio.',
      20: 'Be3 ataca el alfil de a7: querés cambiar la pieza que apunta a tu rey.',
      21: 'Las negras aceptan el cambio de alfiles oscuros.',
      22: 'Nxe3 recaptura y el caballo llega por fin a e3, una buena casilla en el centro.',
      23: 'Cambian también los alfiles de casillas blancas.',
      24: 'Qxb3 recaptura con la dama: ahora apunta al peón de b7, que no tiene protección.',
      26: 'a4 prepara a5 para ganar espacio y dejar sin b6 a las piezas negras.',
      28: 'a5 le quita b6 a las negras y fija su flanco de dama.',
      30: 'h3 le da una salida al rey y evita que las piezas negras se claven en g4.',
      31: 'El caballo negro va a h5 desde donde apunta a f4 y a g3.',
      32: 'Red1 pone la torre detrás del peón de d3, lista para avanzarlo con d4.',
    },
    summary:
      'Una Italiana de maniobras: cambian los alfiles y las blancas ganan espacio en el flanco de dama con a4-a5 mientras preparan d4. Stockfish la ve igualada (de +0,1 a +0,2): son partidas donde la paciencia y las pequeñas mejoras de posición cuentan más que las tácticas.',
  },
  {
    opening: 'ruy',
    line: 'ruy-abierta',
    prefix: 16,
    title: 'Ruy López abierta: peón de más y dama cambiada',
    color: 'w',
    moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Nxe4 d4 b5 Bb3 d5 dxe5 Be6 c3 Be7 Nbd2 Nc5 Bc2 d4 Nxd4 Nxd4 cxd4 Qxd4 Nf3 Qxd1 Rxd1 O-O Ng5 Bxg5 Bxg5 Na4',
    notes: {
      16: 'c3 apoya d4 y deja al alfil la salida a c2 si lo atacan.',
      18: 'Nbd2 desarrolla el caballo y ataca al de e4, que está protegido por el peón de d5.',
      19: 'El caballo negro ataca tu alfil de b3.',
      20: 'Bc2 sale del ataque y apunta a h7 por la diagonal abierta.',
      21: 'El peón negro avanza a d4 y ataca el de c3.',
      22: 'Nxd4 captura el peón y ataca al caballo de c6, que quedó sin protección.',
      24: 'cxd4 recaptura con el peón y ataca al caballo de c5.',
      25: 'La dama negra captura el peón de d4 y ataca el de e5, sin protección.',
      26: 'Nf3 ataca la dama de d4 y protege el peón de e5.',
      27: 'Las negras cambian las damas.',
      28: 'Rxd1 recaptura: ya no hay damas y tu torre queda en la columna d.',
      30: 'Ng5 ataca el alfil de e6 y apunta a f7 y a h7.',
      32: 'Bxg5 recaptura: cambiaste un caballo por un alfil y conservás los dos alfiles.',
    },
    summary:
      'La Ruy López abierta lleva a una posición activa: las negras toman en e4 y las blancas se quedan con espacio y la pareja de alfiles en el final sin damas. Stockfish la ve algo mejor para las blancas (de +0,2 a +0,5): no es mucho, pero la pareja de alfiles es una ventaja real y duradera.',
  },
  {
    opening: 'ruy',
    line: 'ruy-berlinesa',
    prefix: 16,
    title: 'Berlinesa: el final sin damas',
    color: 'w',
    moves: 'e4 e5 Nf3 Nc6 Bb5 Nf6 O-O Nxe4 d4 Nd6 Bxc6 dxc6 dxe5 Nf5 Qxd8+ Kxd8 Nc3 h6 a4 a5 Rd1+ Ke8 h3 Be6 g4 Ne7 Nd4 Bd7 Re1 Rd8 Nb3 h5 f3 b6',
    notes: {
      15: 'Las negras recapturan con el rey: ya no pueden enrocar, pero sin damas el rey está bastante seguro.',
      16: 'Nc3 desarrolla el caballo: sin damas, las piezas se activan rápido.',
      18: 'a4 gana espacio en el flanco de dama y vigila la casilla b5.',
      20: 'Rd1+ ocupa la columna d, que quedó abierta, con jaque.',
      22: 'h3 prepara g4: tenés cuatro peones contra tres de las negras en ese flanco y querés usarlos.',
      24: 'g4 ataca el caballo de f5 y avanza tu mayoría de peones del flanco de rey.',
      26: 'Nd4 centraliza el caballo y ataca c6 y e6.',
      28: 'Re1 apoya el peón de e5 con la otra torre.',
      30: 'Nb3 ataca el peón de a5, que no tiene protección.',
      32: 'f3 protege el peón de g4, que el peón de h5 acababa de atacar.',
    },
    summary:
      'La Berlinesa es un final sin damas desde la jugada 8: las negras tienen los peones de c doblados y las blancas una mayoría de peones en el flanco de rey. Stockfish la ve algo mejor para las blancas al principio (hasta +0,6) y casi igualada al final: es una partida lenta, de ventajas chicas que hay que convertir con paciencia.',
  },
  {
    opening: 'escocesa',
    line: 'esc-bc5',
    prefix: 15,
    title: 'Escocesa: el peón de e4 por actividad',
    color: 'w',
    moves: 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Bc5 Be3 Qf6 c3 Nge7 Bc4 Ne5 Be2 Qg6 O-O d5 Bh5 Qxe4 Nd2 Qd3 N4f3 Bd6 Nxe5 Bxe5 Bc5 Bd6 Bxd6 cxd6 Re1 g6',
    notes: {
      15: 'La dama negra ataca a la vez tu peón de e4 y el de g2.',
      16: 'Enrocás: el rey protege g2 y dejás e4 a cambio de actividad.',
      17: 'El peón de d5 ataca otra vez e4, que ya tenía a la dama encima.',
      18: 'Bh5 ataca la dama y gana tiempo.',
      19: 'La dama negra captura en e4 y se centraliza: ataca el caballo de d4 y el alfil de e3.',
      20: 'Nd2 desarrolla el caballo y ataca la dama de e4.',
      22: 'N4f3 ataca el caballo de e5, que ya no tiene protección.',
      24: 'Nxe5 captura el caballo y ataca la dama de d3, que quedó sin protección.',
      26: 'Bc5 ataca el caballo de e7 y el peón de a7.',
      28: 'Bxd6 cambia los alfiles oscuros y deja dos peones negros en la columna d.',
      30: 'Re1 ocupa la columna e abierta y apunta al caballo de e7.',
    },
    summary:
      'Una Escocesa con un peón entregado: las blancas dejan caer el peón de e4 a cambio de desarrollo y actividad, y con N4f3 y Cxe5 recuperan la iniciativa. Stockfish la ve a favor de las blancas (cerca de +0,9): es la partida que mejor enseña que un peón, a veces, se cambia por tiempo.',
  },
  {
    opening: 'alfil',
    line: 'alfil-nf6',
    prefix: 12,
    title: 'Apertura del Alfil: exd5 y el choque táctico',
    color: 'w',
    moves: 'e4 e5 Bc4 Nf6 d3 c6 Nf3 d5 Bb3 Bd6 O-O O-O exd5 Nxd5 Re1 Re8 Bg5 f6 c4 fxg5 cxd5 g4 dxc6+ Kh8 cxb7 Bxb7 Nfd2 Bc5 Qxg4 Rf8',
    notes: {
      12: 'exd5 captura un peón y ataca el de c6.',
      13: 'Las negras recapturan con el caballo, que se centraliza en d5.',
      14: 'Re1 ataca el peón de e5, que protege el alfil de d6.',
      16: 'Bg5 ataca la dama de d8: es una jugada con tempo.',
      17: 'El peón de f6 ataca tu alfil de g5.',
      18: 'c4 ataca el caballo de d5: si capturan tu alfil, cxd5 recupera la pieza.',
      19: 'Las negras ganan el alfil, pero tu peón de c4 sigue atacando el caballo de d5.',
      20: 'cxd5 recupera la pieza y ataca el peón de c6.',
      21: 'El peón de g4 ataca tu caballo de f3.',
      22: 'dxc6+ captura un peón y da jaque descubierto con el alfil de b3.',
      24: 'cxb7 ataca la torre de a8, que no tiene protección.',
      26: 'Nfd2 saca el caballo del ataque del peón de g4.',
      28: 'Qxg4 captura el peón de g4 y apunta a g7.',
    },
    summary:
      'Una partida táctica: Bg5 provoca un intercambio de golpes en el que las blancas dan un alfil pero ganan un caballo y dos peones, con un jaque descubierto en el medio. Stockfish la ve algo mejor para las blancas (de +0,3 a +0,7); es una línea con muchas jugadas forzadas, pensada para calcular, no para repetir de memoria.',
  },
  {
    opening: 'viena',
    line: 'vie-nc6',
    prefix: 14,
    title: 'Vienesa con g3: avance de peones en el flanco de rey',
    color: 'w',
    moves: 'e4 e5 Nc3 Nc6 g3 Bc5 Bg2 d6 Nge2 Nf6 d3 O-O O-O Be6 Na4 Bb6 Nxb6 axb6 f4 Bg4 h3 Bxe2 Qxe2 b5 Qf2 b4 g4 Nd7 f5 b3 cxb3 Nb4 Qe2 Rxa2 Rxa2 Nxa2 Be3 Nb4',
    notes: {
      14: 'Na4 ataca el alfil de c5: querés cambiar la pieza que apunta a f2.',
      15: 'El alfil se retira a b6 y sigue apuntando a f2.',
      16: 'Nxb6 cambia tu caballo de a4 por ese alfil.',
      17: 'axb6 deja a las negras con peones doblados en la columna b y sin peón en la columna a.',
      18: 'f4 ataca el peón de e5 y prepara avanzar tus peones del flanco de rey.',
      19: 'El alfil negro ataca tu caballo de e2.',
      20: 'h3 ataca el alfil de g4 y lo obliga a decidirse.',
      21: 'Las negras cambian su alfil por tu caballo.',
      22: 'Qxe2 recaptura y deja la dama en el centro, protegiendo el peón de d3.',
      24: 'Qf2 protege el peón de f4 y apunta a la diagonal de a7.',
      26: 'g4 apoya f5: querés avanzar los peones del flanco de rey.',
      28: 'f5 gana espacio y les quita e6 y g6 a las piezas negras.',
      29: 'Las negras ofrecen el peón de b3 para abrir líneas en el flanco de dama.',
      30: 'cxb3 acepta el peón: el peón negro atacaba a2 y c2.',
      31: 'El caballo negro ataca el peón de d3, que no tiene protección.',
      32: 'Qe2 protege el peón de d3.',
      33: 'La torre negra captura en a2 y ataca tu torre de a1.',
      34: 'Rxa2 captura la torre.',
      36: 'Be3 desarrolla el último alfil y apunta a b6.',
    },
    summary:
      'Una Vienesa tranquila con g3 y Ag2: las blancas cambian el alfil que apuntaba a f2 y avanzan con f4, g4 y f5 en el flanco de rey, mientras las negras contraatacan con b5-b4-b3 en el de dama. Stockfish la ve algo mejor para las blancas al principio (+0,5) e igualada al final (+0,1): ninguno de los dos planes se impone.',
  },
  {
    opening: 'gambito-rey',
    line: 'gr-be7',
    prefix: 13,
    title: 'Gambito de Rey: …d5 y una serie de golpes',
    color: 'w',
    moves: 'e4 e5 f4 exf4 Nf3 Be7 Bc4 Nf6 e5 Ng4 O-O Nc6 d4 d5 exd6 Qxd6 Nc3 O-O Nd5 g5 h3 Nh6 Nxe7+ Qxe7 h4 Bg4 hxg5 Nf5 c3 Ne5 dxe5 Qc5+ Rf2 Qxc4 Nd2 Bxd1 Nxc4 Ng7',
    notes: {
      13: 'El peón de d5 ataca tu alfil de c4, que no tiene protección.',
      14: 'exd6 es una captura al paso: ganás el peón, el alfil deja de estar atacado y tu peón ataca c7 y e7.',
      16: 'Nc3 desarrolla el caballo de dama.',
      18: 'Nd5 centraliza el caballo: ataca el alfil de e7 y el peón de c7.',
      20: 'h3 ataca el caballo de g4 y lo obliga a moverse.',
      22: 'Nxe7+ cambia el caballo por el alfil con jaque.',
      24: 'h4 ataca el peón de g5 para abrir líneas contra el rey negro.',
      25: 'El alfil negro ataca tu caballo de f3.',
      26: 'hxg5 captura el peón y ataca el caballo de h6, que no tiene protección.',
      28: 'c3 apuntala el peón de d4.',
      29: 'El caballo negro ataca tu alfil de c4, sin protección, y el caballo de f3.',
      30: 'dxe5 captura el caballo que atacaba tu alfil.',
      31: 'La dama negra da jaque y vuelve a atacar tu alfil de c4.',
      32: 'Rf2 tapa el jaque con la torre, pero deja el alfil de c4 sin protección.',
      33: 'La dama negra captura el alfil: se igualan las piezas.',
      34: 'Nd2 ataca la dama de c4, que no tiene protección, mientras tu dama de d1 está atacada por el alfil de g4.',
      36: 'Nxc4 captura la dama negra: se cambian las damas y el material queda igual.',
    },
    summary:
      'Un Gambito de Rey con …d5: las blancas ganan el peón al paso, cambian el alfil de e7 con Cxe7+ y después una cadena de golpes (dxe5, Dc5+, cambio de damas) deja el material igual. Stockfish las ve algo mejor (de +0,5 a +0,8). Es la partida más táctica de la apertura: la ventaja es chica y exige jugar con precisión.',
  },
  {
    opening: 'petroff',
    line: 'pet-d4',
    prefix: 16,
    title: 'Petroff con d4: recuperar el peón y la columna b',
    color: 'b',
    moves: 'e4 e5 Nf3 Nf6 d4 Nxe4 Bd3 d5 Nxe5 Nd7 Nxd7 Bxd7 O-O Bd6 c4 c6 cxd5 cxd5 Nc3 O-O Nxd5 Re8 g3 Bc6 Nc3 Nxc3 bxc3 b5 a4 bxa4 c4 Rb8',
    notes: {
      17: 'cxd5 recaptura: el peón vuelve a d5 y protege tu caballo de e4.',
      18: 'Nc3 ataca tu caballo de e4 y el peón de d5, que no tiene protección.',
      19: 'Enrocás: el rey queda a salvo, aunque el peón de d5 se queda sin protección.',
      20: 'Las blancas toman el peón de d5.',
      21: 'Te8 pone la torre en la columna e, donde protege tu caballo de e4.',
      23: 'Ac6 ataca el caballo de d5, que no tiene protección.',
      24: 'Nc3 retrocede y ataca tu caballo de e4.',
      25: 'Cxc3 cambia tu caballo de e4 por el de las blancas.',
      27: 'b5 vigila a4 y c4: si las blancas avanzan por ahí, las capturás.',
      29: 'bxa4 captura el peón de a4 y recupera el peón que cediste en d5.',
      31: 'Tb8 ocupa la columna b, que quedó abierta.',
    },
    summary:
      'Una Petroff con d4: las negras ceden el peón de d5 por un momento, lo recuperan con …bxa4 y quedan activas con la torre en la columna b. Stockfish la ve algo mejor para las blancas (de +0,3 a +0,6): la Petroff es una defensa sólida, pero igualar del todo lleva paciencia.',
  },
  {
    opening: 'philidor',
    line: 'phi-bc4',
    prefix: 14,
    title: 'Philidor con …Cd7: cambios y estructura sólida',
    color: 'b',
    moves: 'e4 e5 Nf3 d6 Bc4 Be7 d4 exd4 Nxd4 Nf6 Nc3 O-O O-O Nc6 Bf4 Nd7 Nd5 Nxd4 Qxd4 Bh4 Rad1 Re8 Rfe1 Nb6 g3 Nxc4 Qxc4 c6 Ne3 Be7 h4 Be6',
    notes: {
      14: 'Bf4 ataca el peón de d6, que lo protegen la dama y el alfil.',
      15: 'Cd7 saca el caballo de f6 y apunta a c5 y e5, desde donde molesta.',
      16: 'Nd5 ataca el alfil de e7 y el peón de c7.',
      17: 'Cxd4 cambia los caballos: el de d4 estaba muy activo.',
      19: 'Ah4 apunta a f2, aunque deja el alfil adelantado.',
      21: 'Te8 pone la torre frente al peón de e4.',
      23: 'Cb6 ataca a la vez al caballo de d5 y al alfil de c4.',
      24: 'g3 ataca tu alfil de h4.',
      25: 'Cxc4 cambia tu caballo por el alfil de c4.',
      26: 'Dxc4 recaptura y ataca el peón de c7.',
      27: 'c6 ataca el caballo de d5 y le quita la casilla.',
      29: 'Ae7 retira el alfil de h4: el peón de g3 lo atacaba.',
      31: 'Ae6 ataca la dama de c4 y desarrolla el alfil de c8.',
    },
    summary:
      'Un Philidor de cambios: las negras cambian caballos y el alfil blanco y quedan con una estructura sólida y todas las piezas desarrolladas. Stockfish las ve con una desventaja chica y estable (cerca de +0,4): es lo que se acepta a cambio de una posición con pocas debilidades.',
  },
]

export const MORE_MODELS: Record<string, ModelGame[]> = register(GAMES)
