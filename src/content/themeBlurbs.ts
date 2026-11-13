/**
 * Qué es cada motivo táctico, en un par de frases y sin hablar de ninguna posición concreta (son definiciones generales,
 * así que valen para cualquier puzzle de ese tema). Las explicaciones no las verifica ningún programa: revisarlas.
 */
export const THEME_BLURBS: Record<string, string> = {
  mateIn1: 'Una sola jugada da jaque mate. Antes de pensar en algo raro, recorré todos los jaques que tenés: uno de ellos puede terminar la partida.',
  mateIn2: 'Hay un mate forzado en dos jugadas. La primera suele ser un jaque o una amenaza que no se puede parar, y la segunda da el mate.',
  mateLong: 'El mate llega en tres jugadas o más. Se calcula siguiendo los jaques y las jugadas forzadas: si cada respuesta del rival es obligada, podés llegar hasta el final.',
  hangingPiece: 'Una pieza está «colgada» cuando nadie la defiende (o la ataca algo de menos valor). Antes de cada jugada preguntate: ¿qué piezas mías y suyas están sin protección?',
  fork: 'La horquilla es un ataque doble: una pieza (muchas veces un caballo o un peón) ataca dos objetivos a la vez y el rival solo puede salvar uno.',
  pin: 'Una clavada inmoviliza una pieza porque, si se mueve, deja expuesta otra más valiosa (o el rey) detrás de ella. La pieza clavada no puede moverse con libertad.',
  skewer: 'La ensartada es una clavada al revés: se ataca una pieza valiosa y, cuando se aparta, cae la que estaba detrás.',
  discoveredAttack: 'Al mover una pieza se destapa el ataque de otra que estaba detrás. Lo fuerte es que la pieza que se movió puede, además, amenazar algo propio.',
  doubleCheck: 'Dos piezas dan jaque a la vez. No se pueden parar los dos con una sola jugada, así que el rival solo puede mover el rey.',
  backRankMate: 'El rey no puede escapar de la última fila porque sus propios peones le tapan las casillas, y una torre o una dama que llega a esa fila da mate. Por eso conviene hacerle una «ventanita» al rey.',
  smotheredMate: 'El rey está rodeado por sus propias piezas y un caballo le da jaque: nadie puede capturar al caballo y el rey no tiene adónde ir.',
  trappedPiece: 'Una pieza queda atrapada cuando todas sus casillas están atacadas o bloqueadas, y termina perdiéndose.',
  deflection: 'Se obliga a una pieza defensora a abandonar su puesto (con un jaque o una captura), y lo que defendía queda sin protección.',
  attraction: 'Se atrae una pieza rival (a menudo el rey) hacia una casilla donde queda expuesta a un golpe, generalmente con un sacrificio.',
  capturingDefender: 'Se elimina la pieza que protege un objetivo. Una vez que el defensor cae, el objetivo queda a merced.',
  clearance: 'Se despeja una casilla o una línea moviendo una pieza propia, para que otra pieza pueda usarla.',
  interference: 'Se interpone una pieza entre otras dos del rival para cortar la comunicación entre ellas (por ejemplo, la defensa de una pieza).',
  intermezzo: 'Una jugada intermedia: antes de hacer la captura o la respuesta esperada, se mete una jugada con amenaza (un jaque, por ejemplo) que cambia el resultado.',
  xRayAttack: 'Una pieza de largo alcance «ve» a través de otra. La amenaza se hace efectiva cuando la pieza del medio se mueve o se cambia.',
  sacrifice: 'Se entrega material a propósito para conseguir algo más valioso: un mate, un ataque ganador o más material después.',
  quietMove: 'Una jugada tranquila, sin jaque ni captura, que prepara una amenaza difícil de parar. Suelen ser las más difíciles de ver.',
  defensiveMove: 'Acá el tema es defender: hay una jugada precisa que evita el golpe del rival, a veces poco natural.',
  promotion: 'Un peón llega a la última fila y se corona. A veces conviene coronar en caballo (subpromoción) en lugar de dama.',
  zugzwang: 'Todas las jugadas del rival empeoran su posición: le convendría pasar el turno, pero no se puede.',
  kingsideAttack: 'Se ataca el flanco del rey enemigo con piezas y a veces con peones. Contá atacantes y defensores antes de lanzarte.',
  pawnEndgame: 'Final de peones: cada tiempo cuenta. La oposición de los reyes y la regla del cuadrado suelen decidir.',
  rookEndgame: 'Final de torres: la actividad de la torre y la posición de los reyes pesan más que un peón de menos.',
}

/** Textos de los temas presentes en una lista de claves, en el mismo orden. */
export function blurbsFor(keys: readonly string[]): { key: string; text: string }[] {
  return keys.flatMap((key) => (THEME_BLURBS[key] ? [{ key, text: THEME_BLURBS[key]! }] : []))
}
