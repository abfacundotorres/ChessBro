import type { EndgameDef } from '../engine/endgame'

/** Finales jugables contra el motor. Un test verifica con Stockfish que cada uno es ganable/salvable. */
export const ENDGAMES: EndgameDef[] = [
  {
    id: 'kqk',
    title: 'Dama y rey contra rey',
    summary: 'Dar mate sin ahogar.',
    fen: '8/8/8/3k4/8/8/8/4KQ2 w - - 0 1',
    user: 'w',
    goal: 'mate',
    maxMoves: 25,
    tips: [
      'Con la dama, encerrá al rey a un salto de caballo de distancia.',
      'Antes de cada jugada contá las casillas del rey rival: si queda con cero y no está en jaque, es ahogado.',
      'Acercá tu rey cuando el rival esté contra el borde.',
    ],
  },
  {
    id: 'krk',
    title: 'Torre y rey contra rey',
    summary: 'Mate en menos de 30 jugadas.',
    fen: '8/8/8/3k4/8/8/8/R3K3 w - - 0 1',
    user: 'w',
    goal: 'mate',
    maxMoves: 29,
    tips: [
      'Usá la torre para cortar al rey por una fila o columna y achicá la caja de a poco.',
      'Si el rey rival se acerca a tu torre, alejala por la misma fila (nunca la dejes sin protección).',
      'Cuando los reyes quedan enfrentados, la torre da jaque y el rival retrocede.',
    ],
  },
  {
    id: 'kpk-win',
    title: 'Rey y peón: ganar',
    summary: 'Coronar y dar mate con la oposición a favor.',
    fen: '8/5k2/8/2K1P3/8/8/8/8 w - - 0 1',
    user: 'w',
    goal: 'mate',
    maxMoves: 40,
    tips: [
      'Llevá el rey delante del peón, no atrás.',
      'Cuando el rey llegue a la sexta fila delante del peón, el final está ganado.',
      'Después de coronar, el mate de dama y rey (ojo con el ahogado).',
    ],
  },
  {
    id: 'kpk-hold',
    title: 'Rey y peón: salvar las tablas',
    summary: 'Defendé contra el peón con la oposición.',
    fen: '8/8/8/6k1/4P3/3K4/8/8 b - - 0 1',
    user: 'b',
    goal: 'hold',
    maxMoves: 30,
    tips: [
      'Ponete delante del peón y no te dejes sacar de ahí.',
      'Si el rey blanco pierde al peón o hay ahogado, son tablas.',
      'Mantené la oposición: cuando los reyes quedan enfrentados, el que mueve cede.',
    ],
  },
  {
    id: 'lucena',
    title: 'Torres: la posición de Lucena',
    summary: 'Coronar con el puente.',
    fen: '3K4/3P1k2/8/8/8/8/r7/4R3 w - - 0 1',
    user: 'w',
    goal: 'promote',
    maxMoves: 25,
    tips: [
      'Tu peón está en la séptima y tu rey delante de él, pero tu propio rey tapa la casilla de coronación: hay que sacarlo de ahí.',
      'Tu torre corta al rey rival en la columna e; la torre negra te va a dar jaques desde lejos.',
      'La técnica clásica es el "puente": llevar tu torre a la cuarta fila para poder interponerla ante los jaques.',
    ],
  },
  {
    id: 'philidor',
    title: 'Torres: la defensa Philidor',
    summary: 'Salvar las tablas con la torre en la sexta.',
    fen: '4k3/8/r7/3KP3/8/8/8/3R4 b - - 0 1',
    user: 'b',
    goal: 'hold',
    maxMoves: 30,
    tips: [
      'Mantené la torre en la sexta fila (la tercera desde el peón) para impedir que el rey blanco avance.',
      'Cuando el peón avance a la sexta, pasá la torre a la columna de abajo y dá jaques desde atrás.',
      'El rey blanco no tiene dónde esconderse de los jaques: las tablas están aseguradas.',
    ],
  },
]

export function endgameById(id: string): EndgameDef | undefined {
  return ENDGAMES.find((e) => e.id === id)
}
