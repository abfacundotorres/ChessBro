/**
 * Biblioteca de aperturas (H7): las aperturas más comunes en partidas de 400–1400, con la idea,
 * los planes y los errores típicos. Complementa al repertorio (que son líneas concretas para memorizar):
 * acá se entiende de qué va cada apertura, incluso las que juega el rival.
 * Un test verifica que las jugadas sean legales, que las trampas funcionen y que los enlaces al repertorio existan.
 * Las explicaciones no las verifica ningún programa: revisarlas.
 */

export type OpeningGroup = 'e4-e5' | 'e4-otras' | 'd4' | 'flanco'

export interface OpeningTrap {
  name: string
  /** Jugadas desde la posición inicial. */
  moves: string[]
  text: string
  /** La última jugada da jaque mate (lo comprueba un test). */
  mate?: boolean
}

export interface Opening {
  id: string
  /** Nombre en español. */
  name: string
  group: OpeningGroup
  /** Quién la elige: las blancas la juegan desde la jugada 1; las negras la usan como respuesta. */
  side: 'blancas' | 'negras'
  /** Jugadas características (SAN inglés). */
  moves: string[]
  idea: string
  plans: string[]
  mistakes: string[]
  trap?: OpeningTrap
  /** Ids de líneas del repertorio relacionadas. */
  repLines: string[]
  /**
   * Fragmentos del nombre en inglés (minúsculas, sin apóstrofes ni guiones) con los que Chess.com y Lichess
   * nombran esta familia. Se prueban en el orden de la lista de aperturas.
   */
  match: string[]
}

export const GROUP_LABELS: Record<OpeningGroup, string> = {
  'e4-e5': '1.e4 e5: partidas abiertas',
  'e4-otras': '1.e4 con otra respuesta',
  d4: '1.d4: peón de dama',
  flanco: 'Por los flancos',
}

// Importante: las familias más específicas van antes (Evans antes que Italiana, Gambito de Rey antes que India de Rey).
export const OPENINGS: Opening[] = [
  {
    id: 'evans',
    name: 'Gambito Evans',
    group: 'e4-e5',
    side: 'blancas',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'b4'],
    idea: 'Una variante de la Italiana: sacrificás el peón b para ganar tiempo con c3 y d4 y quedarte con un gran centro.',
    plans: ['Después de …Axb4, jugá c3 y d4 enseguida', 'Enrocá pronto y usá las columnas abiertas', 'Tus piezas se desarrollan más rápido: aprovechalo atacando'],
    mistakes: ['Si te lo aceptan y no seguís con c3 y d4, solo quedaste con un peón menos', 'Tardar en enrocar con el centro abierto'],
    repLines: ['b-evans'],
    match: ['evans'],
  },
  {
    id: 'cuatro-caballos',
    name: 'Cuatro Caballos',
    group: 'e4-e5',
    side: 'blancas',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Nc3', 'Nf6'],
    idea: 'Desarrollo simétrico y sólido: cada bando saca los dos caballos. Es una apertura segura, con pocas sorpresas.',
    plans: ['Seguí con Ab5 (Española en versión simple) o con d4', 'Enrocá corto y conectá las torres'],
    mistakes: ['Repetir jugadas sin plan y quedarte sin iniciativa', 'Moverte con los caballos varias veces en vez de desarrollar el resto'],
    repLines: ['b-4caballos'],
    match: ['four knights'],
  },
  {
    id: 'italiana',
    name: 'Apertura Italiana',
    group: 'e4-e5',
    side: 'blancas',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'],
    idea: 'El alfil apunta a f7, el punto más flojo del campo negro. Desarrollo natural, plan claro y poca teoría: ideal para aprender.',
    plans: ['Enrocá corto rápido', 'Armá el centro con c3 y d3 (o d4 si te lo permiten)', 'Llevá la torre a e1 y los caballos a buenas casas'],
    mistakes: ['Mover la dama temprano para atacar f7: te la persiguen y perdés tiempos', 'Jugar Cg5 antes de enrocar sin ver la defensa …d5', 'Con negras: dejar f7 sin protección y olvidarte de enrocar'],
    repLines: ['w-italiana-c3', 'w-italiana-nf6', 'w-italiana-be7', 'b-giuoco-c3', 'b-giuoco-d3'],
    match: ['italian', 'giuoco', 'two knights'],
  },
  {
    id: 'ruy',
    name: 'Ruy López (Española)',
    group: 'e4-e5',
    side: 'blancas',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O'],
    idea: 'El alfil presiona al caballo que defiende e5. No gana nada de inmediato: es una apertura de presión lenta que se paga con el tiempo.',
    plans: ['Enrocá y armá c3 y d4 para ocupar el centro', 'Mantené el alfil en la diagonal a2–g8 (retirate a b3)', 'Cambiá en c6 solo si te conviene el final'],
    mistakes: ['Capturar Axc6 sin motivo: regalás la pareja de alfiles', 'Con negras: tomar e4 con el caballo demasiado pronto'],
    trap: {
      name: 'El arca de Noé',
      moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'd6', 'd4', 'b5', 'Bb3', 'Nxd4', 'Nxd4', 'exd4', 'Qxd4', 'c5', 'Qd5', 'Be6', 'Qc6+', 'Bd7', 'Qd5', 'c4'],
      text: 'Si las blancas se llevan peones en el centro, las negras atrapan al alfil de b3 con …c5 y …c4. Cuidado si jugás Ruy López con blancas.',
    },
    repLines: ['b-ruy'],
    match: ['ruy lopez', 'spanish'],
  },
  {
    id: 'escocesa',
    name: 'Apertura Escocesa',
    group: 'e4-e5',
    side: 'blancas',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4', 'Nxd4'],
    idea: 'Abrís el centro de entrada. Las piezas ganan espacio y las líneas se abren rápido: partidas dinámicas y fáciles de entender.',
    plans: ['Desarrollá con rapidez: alfil y caballo', 'Si las negras te atacan el caballo de d4, tené claro cómo cambiarlo', 'Enrocá antes de abrir más líneas'],
    mistakes: ['Sacar la dama temprano en un centro abierto', 'Dejar un caballo en d4 sin apoyo'],
    repLines: ['b-escocesa'],
    match: ['scotch'],
  },
  {
    id: 'alfil',
    name: 'Apertura del Alfil',
    group: 'e4-e5',
    side: 'blancas',
    moves: ['e4', 'e5', 'Bc4'],
    idea: 'Sacás el alfil al frente antes que el caballo. Es flexible: podés llegar a la Italiana o armar el centro con d3 y Cf3.',
    plans: ['Desarrollá el caballo de rey y enrocá', 'Armá el centro con d3 y c3'],
    mistakes: ['Pensar que 2.Ac4 ya ataca algo: es solo desarrollo', 'Con negras: caer con …Cf6 y …Cxe4 sin mirar los tacticismos'],
    repLines: ['b-alfil'],
    match: ['bishops opening', 'bishop opening'],
  },
  {
    id: 'viena',
    name: 'Apertura Viena',
    group: 'e4-e5',
    side: 'blancas',
    moves: ['e4', 'e5', 'Nc3', 'Nf6', 'f4'],
    idea: 'Desarrollás el caballo de dama primero y te reservás f4 para un ataque tipo Gambito de Rey, con una base más segura.',
    plans: ['Si te toman en f4, jugá d4 y desarrollá rápido', 'Cuidá la diagonal de tu rey'],
    mistakes: ['Lanzar f4 sin entender el centro', 'Dejar el rey en e1 mientras abrís líneas'],
    repLines: ['b-viena'],
    match: ['vienna'],
  },
  {
    id: 'gambito-rey',
    name: 'Gambito de Rey',
    group: 'e4-e5',
    side: 'blancas',
    moves: ['e4', 'e5', 'f4', 'exf4', 'Nf3'],
    idea: 'Sacrificás un peón para abrir la columna f y ganar el centro. Muy filoso: sirve para atacar, pero deja a tu rey expuesto.',
    plans: ['Desarrollá rápido y dominá el centro con d4', 'Buscá ataques sobre f7 y la columna f'],
    mistakes: ['Atacar sin desarrollar: sin piezas, el sacrificio no se justifica', 'Con negras: guardar el peón de más a toda costa en vez de desarrollar'],
    repLines: ['b-gambito-rey'],
    match: ['kings gambit'],
  },
  {
    id: 'petroff',
    name: 'Defensa Petroff',
    group: 'e4-e5',
    side: 'negras',
    moves: ['e4', 'e5', 'Nf3', 'Nf6'],
    idea: 'En vez de defender e5, contraatacás e4. Es sólida y dura de romper; las partidas suelen ser simétricas y tranquilas.',
    plans: ['Si te toman en e5, jugá …d6 antes de recapturar en e4', 'Desarrollá y enrocá sin apuro'],
    mistakes: ['3…Cxe4? en vez de …d6: cae en una trampa y pierde material', 'Cambiar piezas por cambiar, sin plan'],
    trap: {
      name: 'La dama en la columna e',
      moves: ['e4', 'e5', 'Nf3', 'Nf6', 'Nxe5', 'Nxe4', 'Qe2', 'Nf6', 'Nc6+'],
      text: 'Si tras 3.Cxe5 las negras toman en e4 y después de 4.De2 retroceden con …Cf6??, 5.Cc6+ es jaque descubierto y a la vez ataca la dama negra.',
    },
    repLines: ['w-petroff'],
    match: ['petrov', 'russian'],
  },
  {
    id: 'philidor',
    name: 'Defensa Philidor',
    group: 'e4-e5',
    side: 'negras',
    moves: ['e4', 'e5', 'Nf3', 'd6', 'd4', 'Nf6', 'Nc3', 'Nbd7'],
    idea: 'Defendés e5 con un peón y lo mantenés. Es una posición compacta y algo pasiva, pero difícil de atacar si no te distraés.',
    plans: ['Mantené e5 y desarrollá tus piezas detrás del peón', 'Enrocá corto, y más adelante pensá en …c6 y …Dc7'],
    mistakes: ['Tomar e4 o d4 sin necesidad y quedarte sin espacio', 'Sacar el alfil de c8 a g4 sin ver el Ac4: es la trampa de Légal'],
    trap: {
      name: 'Mate de Légal',
      moves: ['e4', 'e5', 'Nf3', 'd6', 'Bc4', 'Bg4', 'Nc3', 'g6', 'Nxe5', 'Bxd1', 'Bxf7+', 'Ke7', 'Nd5#'],
      text: 'Si las negras clavan el caballo con …Ag4 y toman la dama, las blancas la regalan para dar un mate con dos caballos y un alfil.',
      mate: true,
    },
    repLines: ['w-philidor-nf6', 'w-philidor-exd4'],
    match: ['philidor'],
  },
  {
    id: 'siciliana',
    name: 'Defensa Siciliana',
    group: 'e4-otras',
    side: 'negras',
    moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3'],
    idea: 'La respuesta más popular a 1.e4. Las negras no copian: cambian un peón de ala por uno central y juegan por la victoria, no por tablas. Hay muchísima teoría, pero al principio alcanza con entender los planes.',
    plans: ['Blancas: desarrollá rápido, enrocá y atacá por el centro/rey', 'Negras: contraataque por el flanco de dama con …b5 o …Tc8', 'Con la Alapin (2.c3) evitás gran parte de la teoría'],
    mistakes: ['Con blancas: atacar el rey sin desarrollar', 'Con negras: tardar en enrocar mientras el centro está abierto', 'Con blancas: jugar 2.c3 y olvidarte de d4'],
    repLines: ['w-alapin-d5', 'w-alapin-nf6', 'w-alapin-e6', 'w-alapin-nc6'],
    match: ['sicilian'],
  },
  {
    id: 'francesa',
    name: 'Defensa Francesa',
    group: 'e4-otras',
    side: 'negras',
    moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6'],
    idea: 'Las negras ceden espacio pero arman un muro de peones. Su problema es el alfil de c8, y su plan es atacar la cadena de peones blancos.',
    plans: ['Negras: ataque a la base de la cadena con …c5 y …f6', 'Blancas: ganá espacio con e5 y luego buscá el flanco de rey'],
    mistakes: ['Negras: dejar el alfil de c8 encerrado todo el partido', 'Blancas: abrir el centro demasiado pronto cuando el rival está bien desarrollado'],
    repLines: ['w-francesa'],
    match: ['french'],
  },
  {
    id: 'caro-kann',
    name: 'Defensa Caro-Kann',
    group: 'e4-otras',
    side: 'negras',
    moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5'],
    idea: 'Parecida a la Francesa pero con el alfil de c8 libre. Estructura sólida, errores poco frecuentes: muy buena para quien quiere partidas seguras.',
    plans: ['Sacá el alfil de c8 afuera antes de …e6', 'Después, desarrollá y enrocá; el juego es posicional'],
    mistakes: ['Negras: olvidar sacar el alfil antes de cerrar la cadena', 'Blancas: atacar sin desarrollar'],
    repLines: ['w-caro'],
    match: ['caro kann'],
  },
  {
    id: 'escandinava',
    name: 'Defensa Escandinava',
    group: 'e4-otras',
    side: 'negras',
    moves: ['e4', 'd5', 'exd5', 'Qxd5', 'Nc3', 'Qa5'],
    idea: 'Atacás e4 de entrada. Las negras sacan la dama temprano, pero ganan una estructura sólida y piezas bien ubicadas si la defienden bien.',
    plans: ['Negras: retirá la dama a a5 o d6, desarrollá y enrocá', 'Blancas: ganá tiempo atacando la dama mientras desarrollás'],
    mistakes: ['Negras: quedarse con la dama afuera y que les ganen tiempo', 'Blancas: gastar tiempos persiguiendo la dama sin desarrollar'],
    repLines: ['w-escandinava'],
    match: ['scandinavian', 'center counter'],
  },
  {
    id: 'pirc-moderna',
    name: 'Defensa Pirc y Moderna',
    group: 'e4-otras',
    side: 'negras',
    moves: ['e4', 'd6', 'd4', 'Nf6', 'Nc3', 'g6'],
    idea: 'Dejás que las blancas ocupen el centro y las atacás desde el flanco con el alfil en g7. Más flexible que sólida: exige cuidado.',
    plans: ['Fianchetto del alfil de rey y enroque', 'Después, contraataque con …c5 o …e5'],
    mistakes: ['Dejar que las blancas formen un ataque de peones en el flanco de rey sin reaccionar'],
    repLines: ['w-pirc', 'w-moderna'],
    match: ['pirc', 'modern defense'],
  },
  {
    id: 'alekhine',
    name: 'Defensa Alekhine',
    group: 'e4-otras',
    side: 'negras',
    moves: ['e4', 'Nf6', 'e5', 'Nd5', 'd4', 'd6'],
    idea: 'Provocás que las blancas avancen peones para después atacarlos. Es una defensa hipermoderna: la ventaja de espacio puede volverse un problema.',
    plans: ['Blancas: no te pases de avanzar; desarrollá con calma', 'Negras: atacá los peones adelantados'],
    mistakes: ['Blancas: avanzar peones sin apoyo suficiente'],
    repLines: ['w-alekhine'],
    match: ['alekhine'],
  },
  {
    id: 'gambito-dama',
    name: 'Gambito de Dama',
    group: 'd4',
    side: 'blancas',
    moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7'],
    idea: 'Ofrecés el peón c para desviar al peón de d5 y quedarte con el centro. No es un gambito de verdad: si lo aceptan, lo recuperás.',
    plans: ['Desarrollá rápido y presioná d5', 'Con el peón en e3 y alfil en d3, armá un centro firme'],
    mistakes: ['Defender mal el peón c4 si aceptan el gambito', 'Con negras: dejar el alfil de c8 sin salida'],
    trap: {
      name: 'La trampa del elefante',
      moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Nbd7', 'cxd5', 'exd5', 'Nxd5', 'Nxd5', 'Bxd8', 'Bb4+', 'Qd2', 'Bxd2+', 'Kxd2', 'Kxd8'],
      text: 'Si las blancas toman el peón de d5 con el caballo, tras los cambios las negras ganan una pieza a cambio de un peón: …Cxd5, Axd8 y …Ab4+ recupera la dama.',
    },
    repLines: ['b-qgd', 'b-qgd-nf3'],
    match: ['queens gambit'],
  },
  {
    id: 'london',
    name: 'Sistema Londres',
    group: 'd4',
    side: 'blancas',
    moves: ['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6', 'Nf3', 'Bd6'],
    idea: 'Un esquema: peones en d4, e3 y c3, alfil en f4 y caballos en f3 y bd2. Poca teoría, muy fácil de repetir con cualquier respuesta.',
    plans: ['Sacá el alfil de dama antes de cerrar con e3', 'Enrocá y jugá c3 y Cbd2', 'Pensá en ruptura con c4 o e4'],
    mistakes: ['Dejar sin protección b2 cuando el alfil sale de c1', 'Jugar siempre lo mismo aunque el rival te lo anticipe'],
    repLines: ['b-london', 'b-londres-2'],
    match: ['london'],
  },
  {
    id: 'colle',
    name: 'Sistema Colle',
    group: 'd4',
    side: 'blancas',
    moves: ['d4', 'd5', 'Nf3', 'Nf6', 'e3', 'e6', 'Bd3', 'c5', 'c3', 'Nc6'],
    idea: 'Parecido al Londres, con el alfil en d3 y el plan de romper con e4. Lo típico es un ataque al rey cuando el rival se descuida.',
    plans: ['Cbd2, enroque y luego e4', 'Buscá un ataque al rey con el alfil de d3 y la dama'],
    mistakes: ['Hacer e4 sin tener las piezas listas', 'Olvidarte de la defensa de c3'],
    repLines: ['b-colle'],
    match: ['colle', 'zukertort'],
  },
  {
    id: 'india-rey',
    name: 'Defensa India de Rey',
    group: 'd4',
    side: 'negras',
    moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6'],
    idea: 'Cedés el centro para atacarlo desde afuera y lanzar un ataque en el flanco de rey. Es de piezas, no de peones: más difícil de lo que parece.',
    plans: ['Enrocá y preparé …e5 o …c5 para romper el centro', 'Avanzá los peones del flanco de rey con la ayuda de las piezas'],
    mistakes: ['Demorar la ruptura central y que las blancas se queden con el espacio', 'Atacar sin reservas antes de tiempo'],
    repLines: [],
    match: ['kings indian'],
  },
  {
    id: 'inglesa',
    name: 'Apertura Inglesa',
    group: 'flanco',
    side: 'blancas',
    moves: ['c4', 'e5', 'Nc3', 'Nf6', 'Nf3', 'Nc6'],
    idea: 'Controlás d5 desde el costado en vez de ocupar el centro con peones. Es flexible y puede llevar a posiciones de muchos tipos.',
    plans: ['Fianchetto del alfil de rey con g3 y Ag2', 'Enrocá y empujá d4 cuando esté preparado'],
    mistakes: ['No tener un plan: sin un centro fuerte, tenés que saber qué querés'],
    repLines: ['b-inglesa'],
    match: ['english'],
  },
  {
    id: 'peon-rey',
    name: 'Otras con 1.e4',
    group: 'e4-otras',
    side: 'blancas',
    moves: ['e4'],
    idea: 'Cuando el nombre es solo "Apertura de peón de rey" o similar, la partida no cayó en ninguna apertura conocida o se desvió pronto. Aplicá los principios: centro, desarrollo y enroque.',
    plans: ['Controlá el centro con peones o piezas', 'Sacá un caballo y un alfil antes de repetir piezas', 'Enrocá y conectá las torres'],
    mistakes: ['Sacar la dama temprano', 'Mover la misma pieza dos veces sin necesidad'],
    repLines: [],
    match: ['kings pawn', 'kings knight', 'ponziani', 'danish', 'center game', 'latvian', 'owens', 'nimzowitsch', 'saint george', 'st george'],
  },
  {
    id: 'peon-dama',
    name: 'Otras con 1.d4',
    group: 'd4',
    side: 'blancas',
    moves: ['d4'],
    idea: 'Cuando el nombre es "Apertura de peón de dama" o similares, la partida no cayó en una teoría conocida. Los mismos principios: centro, desarrollo, enroque.',
    plans: ['Desarrollá los caballos antes que los alfiles', 'Enrocá y buscá la ruptura con c4 o e4'],
    mistakes: ['Hacer jugadas de peones de ala sin plan', 'Dejar el alfil de dama encerrado detrás de los peones'],
    repLines: [],
    match: ['queens pawn', 'indian', 'englund', 'trompowsky', 'torre', 'catalan', 'benoni', 'dutch', 'slav', 'nimzo', 'grunfeld', 'budapest'],
  },
]

export const openingById = (id: string): Opening | undefined => OPENINGS.find((o) => o.id === id)

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/[-:,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Familia a la que pertenece una apertura con el nombre que le dan Chess.com o Lichess. */
export function openingFamily(name: string | null): Opening | null {
  if (!name) return null
  const n = normalize(name)
  return OPENINGS.find((o) => o.match.some((m) => n.includes(m))) ?? null
}
