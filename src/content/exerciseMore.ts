/**
 * La versión larga (`more`) de los ejercicios escritos a mano, por id. Los de Lichess usan la del tema (`THEME_MORE`).
 * Cada afirmación sobre casillas y piezas la comprueba `__tests__/exerciseMore.test.ts` con chess.js; el resultado
 * (ganar, tablas) lo verifica Stockfish en `lessons.test.ts`. Las explicaciones en sí no las verifica ningún programa: revisarlas.
 */
export const HAND_MORE: Record<string, string> = {
  'm1-pasillo':
    'El rey negro está en g8 y sus propios peones (f7, g7 y h7) le tapan la fila de adelante: no tiene ninguna casilla libre. La torre llega por la columna d, que está vacía, y da jaque desde d8; no hay ninguna pieza negra que la capture o la tape. Para que no te pase a vos, hacele una «ventanita» a tu rey (un movimiento de peón como h3) o dejá una pieza cuidando la última fila.',
  'm1-pastor':
    'Las blancas atacan f7 con dos piezas, la dama y el alfil de c4, y ahí solo lo defiende el rey. Por eso la dama puede capturar con jaque: el rey no puede recapturarla porque el alfil la protege, y no le queda ninguna casilla libre alrededor. f7 (y f2 para las blancas) es la casilla más débil al principio de la partida, porque solo la cuida el rey. Antes de mover, mirá siempre cuántas piezas atacan esa casilla y cuántas la defienden.',
  'm1-escalera':
    'Es la técnica de la escalera: una torre corta una fila entera y la otra da jaque en la siguiente. Acá la de h7 cubre toda la fila 7 y la de g8 da jaque en la fila 8, así que el rey negro de a8 no puede ir a a7, b7 ni b8. Con dos torres se empuja al rey hasta el borde, fila por fila, alternando los jaques. Sirve para cualquier final con dos torres contra el rey solo.',
  'm1-dama':
    'Con la dama y el rey contra el rey solo, el mate sale cuando tu rey ayuda a cubrir casillas y protege a la dama, como acá, con el rey en f7. Por eso el rey negro no puede capturarla. Ojo con el ahogado: si jugás Dg6, el rey negro no está en jaque pero tampoco tiene ninguna jugada legal, y la partida es tablas. Antes de mover, comprobá que le des jaque o que le quede al menos una jugada.',
  'm1-coz':
    'El rey negro está en h8, con su torre en g8 y sus peones en g7 y h7: él mismo se tapó todas las salidas. El caballo salta a f7 y da jaque; como el jaque de un caballo no se puede tapar y ninguna pieza negra puede capturarlo, es mate. Se llama «mate de la coz» (o mate ahogado). Cuidá que tu rey no quede encerrado en el rincón por tus propias piezas, y vigilá los caballos rivales.',
  'sq-1':
    'La regla del cuadrado: imaginá un cuadrado cuyo lado es la cantidad de casillas que le faltan al peón para coronar, a partir de la casilla del peón. Acá al peón de a4 le faltan tres jugadas, así que el cuadrado va de a4 a d1. Si el rey entra en el cuadrado cuando le toca mover, alcanza al peón; si queda afuera, el peón corona. El rey de e1 está justo afuera, pero como te toca a vos, Rd1 o Rd2 lo meten adentro.',
  'sq-3':
    'Al peón de a3 le faltan dos jugadas, así que el cuadrado va de a3 a c1. El rey de d1 está afuera, pero te toca mover y con Rc1 o Rc2 entrás en el cuadrado. Desde ahí llegás a b2 a tiempo: aunque el peón corone en a1, el rey lo captura. Antes de mover, contá cuántas jugadas le faltan al peón y trazá el cuadrado.',
  'sq-7':
    'Al peón de g3 le faltan dos jugadas, así que el cuadrado va de e3 a g1. El rey de e1 está en el borde del cuadrado, pero eso solo alcanza si te acercás: con Re2 o Rf1 llegás a tiempo, mientras que alejarte (por ejemplo a d2) lo deja afuera. Con el rey en el borde del cuadrado no podés perder tiempo: cada jugada tiene que acercarlo al peón.',
  'op-1':
    'Desde d6 el rey blanco controla e6 y e7, así que el rey negro no puede acercarse al peón de e5 por esas casillas. En los finales de rey y peón la idea es siempre la misma: el rey va primero y el peón lo sigue, cubierto por el rey. Lo mismo vale al revés: cuando defendés, buscá impedir que el rey rival llegue primero a esas casillas.',
  'op-2':
    'El rey negro de d5 ataca al peón de e5. Con Rf6 el rey blanco lo protege y, además, controla e6 y e7, por donde el negro intentaría pasar. Primero asegurá el peón con tu rey y recién después pensá en empujarlo: un peón sin protección en un final suele perderse.',
  'op-3':
    'Desde d5 el rey blanco protege el peón de e4 y controla e5 y e6, así que el rey negro de f6 no puede acercarse al peón por delante. La idea es siempre la misma: el rey va primero y el peón lo sigue, cubierto por el rey. Antes de empujar el peón, preguntate quién controla las casillas de adelante.',
  'hd-1':
    'El que defiende tiene que poner su rey frente al peón, no al costado. Desde f6 el rey negro controla e5 y e6, las dos casillas que siguen al peón de e4; mientras las controle, al peón le cuesta avanzar. Para defender un final de rey y peón, buscá siempre ocupar o controlar las casillas de adelante del peón.',
  'hd-2':
    'Desde f7 el rey negro controla e6, e7 y e8: toda la columna por donde el peón de e5 tiene que avanzar. Quedarse de costado, en g6, lo deja lejos de esas casillas. Defender es cuestión de ubicar el rey frente al peón y no perderlo de vista.',
  'hd-3':
    'Desde d7 el rey negro controla e6, e7 y e8, la columna del peón de e5, aunque el rey blanco esté cerca en g4. Esa es la jugada que salva la partida: adelantarse al peón alcanza para hacer tablas. Antes de mover el rey, preguntate qué casillas de la columna del peón vas a controlar desde la nueva casilla.',
}
