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

/**
 * La versión larga de cada tema («Explicame más»): 3 a 5 frases con cómo se ve en una partida y un hábito concreto.
 * Son generales (no hablan de ninguna posición) y, como las anteriores, no las verifica ningún programa: revisarlas.
 */
export const THEME_MORE: Record<string, string> = {
  mateIn1:
    'No busques piezas sueltas: recorré los jaques de a uno. Para cada jaque preguntate tres cosas: ¿el rey puede capturar a la pieza que lo da?, ¿se puede tapar con otra pieza?, ¿le queda una casilla libre para escapar? Si las tres respuestas son «no», es mate. A tu nivel mucha gente se pasa el mate por mirar solo el material, así que buscalo primero.',
  mateIn2:
    'Empezá por los jaques, aunque no siempre la primera jugada lo es: a veces es una jugada tranquila que deja un mate sin defensa. Después ponete en el lugar del rival y contá todas sus respuestas; si para cada una tenés mate, encontraste la solución. Si el rival tiene muchas respuestas, probá otra primera jugada: la buena suele dejarle muy pocas.',
  mateLong:
    'Cuando el mate está lejos conviene pensar al revés: ¿cuántas casillas le quedan al rey rival? Cada jaque o amenaza que le quita una lo acerca al final. Fijate sobre todo en las jugadas forzadas (jaques y amenazas de mate): el rival no puede elegir, así que son las que podés calcular hasta el fondo. Si te perdés, volvé a contar las casillas de escape.',
  hangingPiece:
    'Sirve para dos cosas: cobrar y cuidar. Para cobrar, antes de cada jugada mirá si el rival dejó alguna pieza sin protección. Para cuidar, antes de soltar tu pieza preguntate qué deja sin defensa y qué está atacando el rival ahora. Una pieza también se pierde si la ataca otra de menos valor (un peón contra un caballo), aunque esté defendida. Este chequeo de dos preguntas es el hábito que más puntos te suma en tu nivel.',
  fork:
    'El caballo es el especialista, porque su ataque no se puede tapar, pero la dama, la torre, el alfil y hasta el peón también hacen horquillas. Para verla, buscá una casilla desde la que una pieza ataque a la vez a dos objetivos: el rey, la dama, una torre o piezas sin protección. Si uno de los objetivos es el rey, el rival tiene que atender el jaque y no puede salvar lo otro. Antes de jugar, mirá también si el rival tiene una horquilla contra vos.',
  pin:
    'Hay dos tipos. En la clavada absoluta la pieza protege al rey y no puede moverse: es ilegal. En la relativa detrás hay otra pieza valiosa; moverla se puede, pero sale caro. Se hacen con alfil, torre y dama, que atacan en línea. Una pieza clavada es un buen blanco: atacala otra vez (con un peón, por ejemplo) porque no puede huir ni defender con libertad.',
  skewer:
    'Es lo contrario de la clavada: la pieza de adelante es la más valiosa. Un alfil, una torre o una dama da jaque al rey (o ataca a la dama) sobre una línea y, cuando la pieza se aparta, cae la que estaba detrás. Fijate cuando el rey y una torre o dama rivales quedan en la misma fila, columna o diagonal. Si te lo hacen a vos, evitá alinear tu rey con piezas valiosas.',
  discoveredAttack:
    'Su fuerza es que la pieza que se mueve queda libre para hacer otra amenaza al mismo tiempo, y el rival enfrenta dos peligros a la vez. Si lo que se descubre es un jaque, el rival tiene que responderlo y la pieza que se movió puede capturar o amenazar lo que quiera. Para verlo, buscá piezas tuyas alineadas, como un alfil o una torre detrás de un caballo, apuntando a algo valioso del rival.',
  doubleCheck:
    'Es de las jugadas más fuertes porque ninguna otra pieza puede capturar o tapar un jaque doble: solo se puede mover el rey (y a veces capturar una de las piezas que lo dan, si no está protegida). Casi siempre sale de un jaque descubierto, cuando la pieza que se mueve también da jaque. Si recibís uno, mirá las casillas libres de tu rey: si no hay ninguna, es mate.',
  backRankMate:
    'Es el mate más común a tu nivel. Se evita con una «ventanita»: mover un peón delante del rey (h3 o h6, por ejemplo) para que tenga una casilla de escape. Si atacás vos, buscá llevar una torre o una dama a la última fila, sobre todo cuando la pieza que defendía esa fila se puede cambiar o desviar. Antes de cada jugada preguntate: ¿qué pasa si el rival me pone una torre en la última fila?',
  smotheredMate:
    'Lo da un caballo, porque su jaque no se puede tapar. Aparece cuando el rey está arrinconado y rodeado por sus propias piezas, y suele prepararse con un jaque o un sacrificio que lo deja ahí. Si ves un rey encerrado en un rincón por sus propias piezas, buscá si un caballo puede llegar con jaque. Y si el rincón es el tuyo, dale al rey una casilla libre.',
  trappedPiece:
    'Las piezas se atrapan sobre todo cuando salen demasiado lejos: un alfil que captura un peón en el otro extremo del tablero o una dama que se aventura. Para cazarla, contá sus casillas de escape y fijate cuáles están atacadas; a veces alcanza con atacarla con un peón. Para no caer vos, antes de mandar una pieza lejos comprobá que tenga una salida.',
  deflection:
    'La idea es «correr» al defensor de su puesto: con un jaque, con una captura que no se puede ignorar o con una amenaza mayor. Preguntate qué pieza rival está defendiendo algo importante (un mate o una pieza) y si podés obligarla a hacer otra cosa. Es parecido a la sobrecarga: una pieza con dos trabajos no los puede cumplir a la vez.',
  attraction:
    'Se «atrae» a una pieza rival, muchas veces al rey, hacia una casilla peor con un sacrificio que casi siempre hay que aceptar. Después se aprovecha con un jaque o un ataque doble. Si ves un sacrificio que el rival acepta con el rey o la dama, pensá qué te permite esa pieza ya instalada en su nueva casilla.',
  capturingDefender:
    'En lugar de atacar el objetivo, se elimina a su protector. Para verlo, hacé una lista de las piezas que defienden lo que querés ganar y fijate cuál se puede capturar o cambiar. Si la captura viene con jaque o con una amenaza, mejor: el rival no tiene tiempo de reparar el daño.',
  clearance:
    'Despejar es liberar una casilla o una línea que ocupan tus propias piezas, normalmente moviéndolas con una amenaza (jaque, captura) para que la jugada no te cueste un tiempo. Se nota cuando tenés una pieza valiosa que «no tiene lugar» para ir a una casilla ganadora. Preguntate qué pieza propia le está estorbando y si podés moverla con una amenaza.',
  interference:
    'Se mete una pieza entre otras dos del rival para cortar la comunicación entre ellas, por ejemplo la defensa mutua de dos torres o de un alfil y una dama. Es difícil de ver porque la pieza que se interpone puede quedar atacada, pero si cortó la defensa, lo que se quedó sin protección cae. Mirá las líneas por las que se cuidan entre sí las piezas rivales.',
  intermezzo:
    'También se llama «zwischenzug». Antes de hacer la captura o la respuesta obvia, se intercala una jugada con una amenaza mayor (un jaque, el ataque a una pieza grande) que el rival tiene que atender; después se hace la captura en mejores condiciones. El hábito: en un cambio no recapturés automáticamente, preguntate primero si hay un jaque o una amenaza que mejore la situación.',
  xRayAttack:
    'Una pieza de largo alcance (alfil, torre o dama) ataca «a través» de otra que se interpone. El ataque se vuelve real cuando la pieza del medio se mueve, se captura o se cambia. Por eso, en los cambios cuentan también las piezas que están detrás: una torre detrás de otra, o de la dama, refuerza la presión sobre una casilla.',
  sacrifice:
    'Entregar material solo vale si calculás lo que recibís a cambio: un mate, un ataque ganador o más material. Hacé siempre dos preguntas: ¿qué gano si el rival acepta? y ¿qué pasa si no acepta? Si cada respuesta del rival es forzada, podés calcularlo hasta el final; si el plan es vago, mejor no sacrificar.',
  quietMove:
    'No da jaque ni captura, pero deja al rival sin buena defensa: prepara una amenaza fuerte, como un mate, o quita la última protección. Para encontrarla, imaginá qué harías si pudieras mover dos veces seguidas y buscá la jugada que lo prepara. Cuando defendés, hacé la pregunta inversa: ¿qué quiere hacer el rival si le dejo mover una vez más?',
  defensiveMove:
    'A veces el puzzle te pide salvar la posición y no ganar. Antes de buscar tu jugada, buscá la amenaza del rival: ¿qué haría si le pasara el turno? Para pararla hay cuatro caminos: capturar a la pieza que amenaza, taparla, mover lo amenazado o contraatacar con algo mayor. Probalos en ese orden.',
  promotion:
    'Coronar casi siempre es en dama, pero hay excepciones. Coronar en caballo (subpromoción) a veces da un jaque o un ataque doble que la dama no tiene; coronar en torre o alfil puede evitar un ahogado. Antes de coronar, comprobá que después de tu jugada el rival tenga al menos una jugada legal o que esté en jaque: si no, la partida termina en tablas.',
  zugzwang:
    'Es más común en finales, sobre todo de peones, donde cada pieza tiene pocas jugadas. Se trata de llevar al rival a una posición en la que cualquier jugada suya suelta algo. Preguntate qué jugadas tiene el rival: si todas son malas, la jugada que gana es la que no cambia nada y le pasa el turno (una jugada de espera).',
  kingsideAttack:
    'Antes de lanzarte contra el rey, contá cuántas de tus piezas pueden llegar al ataque y cuántas defienden. Atacar con una sola pieza casi nunca funciona; con tres o más, y con columnas o diagonales abiertas hacia el rey, sí suele. Si todavía no están todas las piezas en juego, desarrollá primero: el ataque improvisado se vuelve contra uno.',
  pawnEndgame:
    'Cada tiempo cuenta, y el rey es una pieza fuerte: llevalo al centro y hacia los peones. Dos ideas deciden muchas posiciones: la regla del cuadrado (si el rey entra al cuadrado del peón pasado, lo alcanza) y la oposición (reyes enfrentados con una casilla en el medio: quien la tiene obliga al otro a ceder el paso). Contá los tiempos antes de mover.',
  rookEndgame:
    'En los finales de torres la actividad pesa más que el material: una torre activa vale más que un peón. Regla útil: poné la torre detrás de los peones pasados, tuyos o del rival, y mantené al rey activo. Hay dos posiciones que conviene saber de memoria: Lucena (para ganar) y Philidor (para hacer tablas); las tenés en las lecciones de finales.',
}

/** Textos de los temas presentes en una lista de claves, en el mismo orden (`more` = la versión larga). */
export function blurbsFor(keys: readonly string[]): { key: string; text: string; more: string }[] {
  return keys.flatMap((key) => (THEME_BLURBS[key] ? [{ key, text: THEME_BLURBS[key]!, more: THEME_MORE[key] ?? '' }] : []))
}
