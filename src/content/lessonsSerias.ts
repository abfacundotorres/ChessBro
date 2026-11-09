/**
 * Versión "seria" de las siete lecciones lúdicas: mismo contenido y mismos desafíos, en registro técnico,
 * sin personajes ni metáforas. `steps[i]` reemplaza el texto del paso i; `prompt` y `why` (opcionales)
 * reemplazan el enunciado y la explicación del desafío de ese paso.
 */
export interface SerioStep {
  title?: string
  text: string
  prompt?: string
  why?: string
}

export interface SerioLesson {
  title: string
  summary: string
  steps: Record<number, SerioStep>
}

export const SERIO: Record<string, SerioLesson> = {
  balanza: {
    title: 'Valor de las piezas y cambios',
    summary: 'Valores relativos, evaluación de un cambio y piezas en peligro.',
    steps: {
      0: {
        title: 'Valores relativos',
        text: 'Se usa esta escala orientativa: peón 1, caballo 3, alfil 3, torre 5 y dama 9. El rey no tiene valor de cambio.\n\nSon referencias: la actividad de las piezas, la estructura y la seguridad del rey pueden alterarlas.',
      },
      1: {
        title: 'Evaluación de un cambio',
        text: 'Antes de capturar, o de permitir una captura, sumá el material que entrega y el que recibe cada bando. Cambiar piezas de igual valor es neutro; entregar 5 por 3 es perder material, aunque se reciban dos piezas.',
        why: 'Se entregan 5 y se reciben 4: se pierde un punto. Cuenta el valor, no la cantidad de piezas.',
      },
      2: {
        title: 'Capturar con la pieza de menor valor',
        text: 'Si varias piezas pueden capturar, conviene hacerlo con la de menor valor. Un peón que captura un caballo gana dos puntos aunque el rival recapture; una dama que captura una pieza defendida suele perderse.',
        prompt: 'El caballo negro de d5 está defendido por el peón de e6. ¿Con qué pieza lo capturás?',
      },
      3: {
        title: 'Piezas en peligro',
        text: 'Una pieza está en peligro si está atacada y sin defensa, o atacada por una pieza de menor valor. Evaluá primero las piezas propias y después las del rival.',
        prompt: 'Marcá todas las piezas en peligro (de ambos bandos) y confirmá.',
        why: 'El alfil de b7 está atacado por la dama y sin defensa. La dama blanca de d5 también está en peligro: la ataca el caballo de f6.',
      },
      4: {
        title: 'Síntesis',
        text: 'Valores 1-3-3-5-9. Sumá antes de cambiar, capturá con la pieza de menor valor y, tras cada jugada, revisá qué piezas propias quedan en peligro.',
      },
    },
  },
  carrera: {
    title: 'Desarrollo y tempo',
    summary: 'Principios de desarrollo y valor de cada jugada de la apertura.',
    steps: {
      0: {
        title: 'Desarrollo',
        text: 'Desarrollar es sacar los caballos y los alfiles de su casilla inicial para ponerlos en juego. Cada jugada que incorpora una pieza activa gana un tiempo (tempo) respecto del rival.',
        prompt: 'Marcá todos los caballos y alfiles que siguen en su casilla inicial (de ambos bandos) y confirmá.',
        why: 'Al blanco le quedan sin desarrollar el caballo de b1 y el alfil de c1; al negro, los alfiles de c8 y f8.',
      },
      1: {
        title: 'Principios',
        text: '1) Desarrollá caballos y alfiles antes que torres y dama.\n2) No muevas dos veces la misma pieza sin motivo: cada vez se cede un tiempo.\n3) Enrocá pronto.\n\nExcepciones: una pieza atacada, o una ganancia de material.',
        prompt: 'El rival mueve tres veces el mismo caballo y deja el resto de las piezas sin desarrollar. ¿Qué ventaja tenés?',
        why: 'Ventaja de tiempo: ponés más piezas en juego mientras él repite jugadas con la misma pieza.',
      },
      2: {
        title: 'La dama en la apertura',
        text: 'Sacar la dama temprano suele costar tiempos: las piezas menores rivales la atacan ganando desarrollo y, en algunas posiciones, se pierde directamente.',
        prompt: 'Jugás con blancas. ¿Cuál es la jugada de desarrollo correcta?',
        why: 'Con la dama fuera, el caballo de f6 la captura (en h5 o en g4). Un caballo suma una pieza al juego sin ceder nada.',
      },
      3: {
        title: 'Resumen',
        text: 'Piezas menores desarrolladas, centro ocupado por peones y rey enrocado. Antes de cada jugada, contá las piezas que todavía no se desarrollaron.',
      },
    },
  },
  peones: {
    title: 'Estructura de peones',
    summary: 'Peones aislados, doblados, atrasados y pasados.',
    steps: {
      0: {
        title: 'Importancia de la estructura',
        text: 'Los peones no retroceden: cada avance es permanente, por lo que la estructura condiciona el plan de toda la partida. Los cuatro conceptos básicos son: peón aislado, doblado, atrasado y pasado.',
      },
      1: {
        title: 'Peón aislado',
        text: 'No tiene peones propios en las columnas adyacentes, por lo que ningún peón puede defenderlo. Debe protegerlo una pieza, y la casilla de enfrente se convierte en un blanco.',
        prompt: 'Marcá los dos peones aislados (uno por bando) y confirmá.',
        why: 'El peón blanco de d4 y el negro de h7 no tienen peones propios en las columnas vecinas.',
      },
      2: {
        title: 'Peones doblados',
        text: 'Dos peones del mismo color en la misma columna. Se estorban y no se defienden entre sí. A veces compensan por la columna que se abre, pero suelen ser una debilidad, sobre todo en los finales.',
        prompt: 'Marcá los cuatro peones doblados (dos parejas) y confirmá.',
      },
      3: {
        title: 'Peón atrasado',
        text: 'Es un peón que quedó detrás de los peones vecinos y ya no puede ser defendido por ellos. La casilla de enfrente es un punto débil: una pieza rival puede instalarse allí sin que un peón la desaloje.',
      },
      4: {
        title: 'Peón pasado',
        text: 'No tiene peones rivales delante, ni en su columna ni en las adyacentes. Su valor crece al avanzar y obliga al rival a dedicar piezas a detenerlo.',
        prompt: 'Marcá los dos peones pasados (uno por bando) y confirmá.',
        why: 'El d5 blanco y el h7 negro no tienen peones rivales que puedan detenerlos. A2/b2 y a7/b7 se bloquean entre sí.',
      },
      5: {
        title: 'Ejercicio final',
        text: 'Identificá el peón pasado en una posición con peones de ambos bandos mezclados.',
        prompt: '¿Cuál de los peones blancos es pasado?',
      },
    },
  },
  piezas: {
    title: 'Alfil y caballo: calidad y puestos',
    summary: 'Alfil bueno y malo, y avanzadas (outposts) para el caballo.',
    steps: {
      0: {
        title: 'Alfil y caballo',
        text: 'Ambos valen 3, pero funcionan de manera distinta: el alfil necesita diagonales abiertas; el caballo rinde bien en posiciones cerradas y necesita puestos estables.',
      },
      1: {
        title: 'Alfil bueno y alfil malo',
        text: 'Un alfil es malo cuando los peones propios ocupan casillas de su color y limitan su movilidad; es bueno cuando sus peones están en el color opuesto. Criterio usado aquí: 4 o más peones propios en el color de su casilla y movilidad reducida.',
        prompt: 'Marcá el alfil malo de las blancas.',
      },
      2: {
        title: 'Avanzadas (outposts)',
        text: 'Una avanzada es una casilla del campo rival, defendida por un peón propio y que ningún peón rival puede atacar. Un caballo allí es difícil de desalojar y controla el centro.',
        prompt: 'Marcá la casilla de avanzada para un caballo blanco.',
        why: 'En d5 el caballo queda defendido por los peones de c4 y e4, y las negras no tienen peones en c ni en e para desalojarlo.',
      },
      3: {
        title: 'Mejorar un alfil limitado',
        text: 'Las soluciones habituales son cambiarlo por una pieza activa del rival o abrir la posición con una ruptura de peones que le devuelva movilidad.',
      },
    },
  },
  torre: {
    title: 'Columnas abiertas y séptima fila',
    summary: 'Columnas abiertas y semiabiertas; la torre en la séptima.',
    steps: {
      0: {
        title: 'Actividad de la torre',
        text: 'La torre necesita líneas abiertas; detrás de sus propios peones es una pieza pasiva. La ubicación ideal es una columna abierta: sin peones de ningún bando.',
        prompt: 'Marcá una casilla de una columna abierta donde ubicarías una torre.',
        why: 'Las columnas d y e no tienen ningún peón: la torre domina toda la columna.',
      },
      1: {
        title: 'Columnas abiertas, semiabiertas y cerradas',
        text: 'Abierta: sin peones. Semiabierta: sin peones propios y con un peón rival, al que la torre puede presionar. Cerrada: con peones de ambos bandos.',
      },
      2: {
        title: 'La séptima fila',
        text: 'Una torre en la séptima fila (la segunda, para las negras) ataca los peones que no se han movido y restringe al rey rival a la última fila.',
      },
      3: {
        title: 'Duplicar torres',
        text: 'Dos torres en la misma columna o fila se protegen y se refuerzan. Ante una columna abierta, es habitual duplicarlas.',
      },
    },
  },
  refugio: {
    title: 'Seguridad del rey',
    summary: 'Enroque, escudo de peones y las debilidades de f7 y f2.',
    steps: {
      0: {
        title: 'Por qué enrocar',
        text: 'En el centro, el rey queda expuesto a las columnas abiertas y a las piezas rivales. El enroque lo traslada a un flanco protegido por peones y conecta las torres.',
      },
      1: {
        title: 'Escudo de peones',
        text: 'Los peones f, g y h delante del rey enrocado forman su refugio. Cada peón que se adelanta deja casillas débiles permanentes, porque los peones no retroceden.',
      },
      2: {
        title: 'La debilidad de f7 y f2',
        text: 'Al comienzo, f7 (negras) y f2 (blancas) están defendidos solo por el rey. Son el objetivo del mate del pastor.',
        prompt: 'Jugás con negras y las blancas amenazan ♕xf7 mate. ¿Cómo lo evitás?',
        why: 'La dama en e7 protege f7. ...♘f6, la jugada que parece natural, no la protege: ♕xf7 sigue siendo mate.',
      },
      3: {
        title: 'Señales de peligro',
        text: 'Un rey enrocado está en peligro cuando hay una columna abierta cerca y piezas rivales que la ocupan, o cuando los peones enemigos avanzan para abrirla.',
      },
    },
  },
  cerrar: {
    title: 'Convertir una ventaja',
    summary: 'Simplificar, limitar el contrajuego y avanzar un peón pasado.',
    steps: {
      0: {
        title: 'Método',
        text: 'Con ventaja: 1) identificá el contrajuego del rival; 2) simplificá cambiando piezas; 3) avanzá con un plan concreto, por ejemplo un peón pasado.',
      },
      1: {
        title: 'Cambiar piezas, no peones',
        text: 'Con ventaja de material, cada cambio de piezas aumenta el peso relativo de la ventaja y reduce el contrajuego. Los peones se conservan: son los que pueden coronar.',
      },
      2: {
        title: 'Salvedades',
        text: 'No es una regla automática: antes de simplificar, comprobá que el final resultante sea realmente ganador. Un cambio innecesario puede llevar a un final de tablas.',
      },
      3: {
        title: 'Peón pasado',
        text: 'El peón pasado es el candidato a coronar y obliga al rival a destinarle piezas, lo que libera el resto del tablero.',
        prompt: 'Jugás con negras. ¿Cuál de tus peones es pasado?',
        why: 'El de h5: no hay peones blancos en las columnas g ni h. El de b7 está frenado por los peones de a2, b2 y c2.',
      },
    },
  },
  // ───────────── Bandas 1400–1600 y 1600–1800 ─────────────
  lucena: {
    title: 'Posición de Lucena',
    summary: 'Técnica del puente para coronar en finales de torre.',
    steps: {
      0: {
        title: 'Planteo',
        text: 'Peón en la séptima fila con el rey propio delante, y el rey rival cortado por la torre. A pesar de la ventaja, el peón no puede coronar: el propio rey ocupa la casilla de coronación y la torre rival molesta con jaques laterales.',
        prompt: '¿Qué le impide avanzar al peón de d7?',
      },
      1: {
        title: 'El puente',
        text: 'Se lleva la torre a la cuarta fila. Más adelante, cuando el rey salga de la columna del peón, esa torre se interpone ante los jaques de la torre rival.',
        prompt: '¿En qué fila conviene ubicar la torre para armar el puente?',
      },
      2: {
        title: 'Salida del rey',
        text: 'Con la torre en la cuarta fila, el rey sale de la columna del peón por el lado opuesto al rey rival. Cada jaque de la torre rival se bloquea interponiendo la torre de la cuarta fila, y el rey sigue avanzando hasta quedar a salvo. Entonces el peón corona.',
        prompt: 'La torre rival da jaque a distancia y tu rey ya está fuera de la columna. ¿Qué hacés?',
      },
      3: {
        title: 'Práctica',
        text: 'Contra el motor, desde esta posición y con blancas: coroná el peón en 25 jugadas como máximo y conservá la dama. Hay pista disponible, pero no cuenta para el progreso.',
      },
    },
  },
  philidor: {
    title: 'Defensa Philidor',
    summary: 'Defensa de la sexta fila y jaques desde atrás.',
    steps: {
      0: {
        title: 'Defensa de la tercera fila',
        text: 'Torre y rey contra torre, rey y peón: si el rey rival se acerca al peón, la posición se pierde. La defensa Philidor consiste en ubicar la torre en la sexta fila (la tercera, contando desde el bando que defiende), de modo que el rey rival no pueda avanzar.',
        prompt: '¿Dónde ubica la torre el bando que defiende?',
      },
      1: {
        title: 'Cuando el peón avanza',
        text: 'Cuando el peón rival avanza a la sexta fila, la torre defensora pasa a la primera fila y da jaques desde atrás y a distancia. Sin refugio frente a los jaques, el rey no puede apoyar al peón y la posición es de tablas.',
        prompt: 'El peón rival llegó a la sexta fila. ¿Qué hace la defensa?',
      },
      2: {
        title: 'Mientras tanto',
        text: 'Mientras el peón no pase de la quinta fila, la torre permanece en la sexta fila y el rey cerca de la casilla de coronación. No conviene mover la torre sin motivo.',
      },
      3: {
        title: 'Práctica',
        text: 'Contra el motor, desde esta posición y con negras: aguantá 30 jugadas o lográ tablas antes. Si el rival da mate o corona, la defensa fracasó.',
      },
    },
  },
  'torre-final': {
    title: 'Finales de torres: actividad',
    summary: 'Regla de Tarrasch y actividad de la torre.',
    steps: {
      0: {
        title: 'Regla de Tarrasch',
        text: 'Los finales de torres son los más frecuentes. La regla de Tarrasch indica que las torres deben ubicarse detrás de los peones pasados, tanto propios (para empujarlos) como rivales (para detenerlos). Es una guía con excepciones.',
        prompt: 'Tenés un peón pasado. ¿Dónde conviene la torre?',
      },
      1: {
        title: 'Actividad',
        text: 'Una torre pasiva, atada a la defensa de peones, rinde poco. En los finales de torres la actividad suele pesar más que un peón de diferencia: una torre activa ataca y limita al rey rival.',
        prompt: 'En un final de torres, ¿qué principio suele ayudar?',
      },
      2: {
        title: 'Corte del rey',
        text: 'Una torre ubicada en una fila o columna que el rey rival no puede cruzar lo "corta". Es la base de la posición de Lucena.',
      },
      3: {
        title: 'Práctica',
        text: 'Ejercicios con posiciones reales: buscá cómo se activa la torre y qué jugada la deja detrás del peón o cortando al rey.',
      },
    },
  },
  calculo: {
    title: 'Método de cálculo',
    summary: 'Jugadas candidatas, líneas forzadas y revisión final.',
    steps: {
      0: {
        title: 'Método',
        text: '1) Determiná qué quiere hacer el rival.\n2) Elaborá una lista de jugadas candidatas, empezando por las forzadas (jaques, capturas y amenazas).\n3) Calculá cada línea forzada hasta el final.\n4) Evaluá la posición resultante.',
        prompt: '¿Con qué jugadas conviene empezar a calcular?',
      },
      1: {
        title: 'Variantes, no una línea',
        text: 'El error más común es calcular una sola línea (la favorable) y omitir otras respuestas del rival. En cada paso, buscá la mejor respuesta rival.',
        prompt: '¿Qué error es habitual al calcular?',
      },
      2: {
        title: 'Más allá de la primera captura',
        text: 'Muchas jugadas ganan material en el primer paso y lo pierden en el tercero. Hay que calcular al menos un paso más: ¿qué ocurre después de la recaptura?',
        prompt: 'Jugás con blancas y buscás mate. Hay varios jaques y capturas atractivos. ¿Cuál es la jugada correcta?',
        why: '♕e3+, después ♕xc5+ y ♕b6#: mate en tres jugadas. Los otros jaques y capturas con el alfil deshacen la ventaja.',
      },
      3: {
        title: 'Otro ejemplo',
        text: 'Una captura con jaque que decide la partida, frente a otras capturas que parecen válidas pero no lo son.',
        prompt: 'Jugás con blancas. ¿Qué captura lleva a mate en tres?',
        why: '♕xc8+ ♖xc8 ♖xc8+ ♕d8 ♖xd8#: mate en tres jugadas. Las otras capturas pierden el ataque.',
      },
      4: {
        title: 'Revisión final',
        text: 'Antes de ejecutar la jugada elegida, revisá qué deja sin defensa y qué amenaza nueva le concede al rival.',
      },
    },
  },
  profilaxis: {
    title: 'Profilaxis',
    summary: 'Prevenir el plan del rival antes de que sea peligroso.',
    steps: {
      0: {
        title: 'Concepto',
        text: 'Antes de ejecutar el propio plan, hay que preguntarse qué quiere hacer el rival y cuál sería su mejor jugada si pudiera mover. La profilaxis (término de Nimzowitsch) consiste en impedir esa idea antes de que se vuelva peligrosa. No es pasividad: es jugar contra el plan rival.',
      },
      1: {
        title: 'Costo de la jugada',
        text: 'Una jugada profiláctica cuesta un tiempo que no se usa para el propio plan. Conviene cuando el rival tiene una idea fuerte y se la puede impedir sin perjudicar la posición, preferentemente con una jugada que además mejore el juego propio.',
        prompt: '¿Cuándo es conveniente una jugada profiláctica?',
      },
      2: {
        title: 'Jugadas tranquilas',
        text: 'A veces la mejor jugada es una tranquila que elimina el contrajuego. En esta posición, coronar con jaque es una trampa; la jugada correcta no da jaque.',
        prompt: 'Jugás con blancas. El peón de d7 está por coronar. ¿Cuál es la jugada correcta?',
        why: '♗d5 es un desvío: si la torre captura el alfil, exd5 y nadie frena al peón de d7. Coronar de inmediato con jaque pierde el peón por ...♖xd8.',
      },
      3: {
        title: 'Jugadas defensivas',
        text: 'Cuando el rival ya tiene una amenaza concreta, la jugada defensiva correcta la anula con precisión. Antes de mover, determiná con exactitud qué quiere hacer.',
      },
    },
  },
  transicion: {
    title: 'Transición al final',
    summary: 'Actividad del rey, peón pasado exterior y cuándo simplificar.',
    steps: {
      0: {
        title: 'Cambio de fase',
        text: 'Al cambiarse las damas y varias piezas, la partida entra en el final. El rey, que en el medio juego debía ponerse a salvo, pasa a ser una pieza activa. Antes de simplificar, evaluá si el rey y los peones propios están mejor en el final resultante.',
        prompt: '¿Qué cambia en el final respecto del medio juego?',
      },
      1: {
        title: 'Peón pasado exterior',
        text: 'Un peón pasado alejado de los demás peones (exterior) obliga al rey rival a alejarse para detenerlo; al hacerlo, deja sin defensa el resto de sus peones.',
        prompt: '¿Cuál de los peones blancos es el pasado exterior?',
        why: 'El peón de a4 no tiene peones negros en las columnas a ni b y está lejos del resto: distrae al rey rival.',
      },
      2: {
        title: 'Aplicación',
        text: 'La maniobra típica es avanzar el peón exterior: el rey rival debe ir a detenerlo y el propio rey entra por el otro flanco a capturar peones.',
        prompt: '¿Para qué sirve un peón pasado exterior?',
      },
      3: {
        title: 'Cálculo y oposición',
        text: 'En los finales de peones se calcula: se cuentan las jugadas de cada peón y de cada rey. La oposición y la regla del cuadrado indican si un rey llega a tiempo.',
      },
    },
  },
}
