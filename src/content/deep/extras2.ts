import type { MoveItem, OpeningExtras } from './kit'
import { PLANS2 } from './extras2-plans'

const L = (s: string) => s.split(' ')
const pun = (id: string, title: string, moves: string, answer: string, why: string, prompt = 'El rival se equivocó: ¿cómo lo castigás?'): MoveItem => ({ id, kind: 'punish', title, prompt, moves: L(moves), answer, why })

const PUNISH: Record<string, MoveItem[]> = {
  evans: [
    pun('evans-pun-na5', 'Las negras atacaron tu alfil con …Ca5', 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Na5', 'Bxf7+', '…Ca5? ataca tu alfil, pero deja colgado el alfil de b4. Axf7+ Rxf7 cxb4: cambiás tu alfil por un peón, capturás el alfil negro y el rey queda expuesto. Antes de responder a una amenaza, mirá qué dejó sin defensa el rival.'),
    pun('evans-pun-d5', 'Las negras intentaron …d5', 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Ba5 d4 d5', 'exd5', '…d5? abre el centro cuando las blancas están mejor desarrolladas. exd5 gana un peón y ataca el caballo de c6. En el Evans, el rival que abre el juego sin estar listo lo paga.'),
  ],
  'cuatro-caballos': [
    pun('4c-pun-nxe4', 'Las negras capturaron el peón de e4', 'e4 e5 Nf3 Nc6 Nc3 Nf6 Bb5 Nxe4', 'Nxe4', '…Cxe4? cuesta una pieza: Cxe4 y las negras no pueden recuperarla, porque el alfil de b5 ya presionaba al caballo de c6. Un peón no compensa una pieza.', 'El rival se equivocó: ¿qué recapturás?'),
  ],
  alfil: [
    pun('alfil-pun-c5', 'Las negras jugaron …c5', 'e4 e5 Bc4 Nf6 d3 c6 Nf3 c5', 'Nxe5', '…c5? descuida e5: Cxe5 gana un peón y el caballo queda centralizado. Cuando un rival hace una jugada de peón en el ala, buscá qué peón del centro dejó sin defensa.'),
    pun('alfil-pun-b5', 'Las negras avanzaron …b5', 'e4 e5 Bc4 Nf6 d3 b5', 'Bxb5', '…b5? ofrece un peón que el alfil de c4 captura sin riesgo. Ojo: no desarrolles con Cf3?? porque pierde material; primero capturá.'),
  ],
  viena: [
    pun('vie-pun-be7', 'Las negras jugaron …Ae7', 'e4 e5 Nc3 Nf6 f4 Be7', 'fxe5', '…Ae7? ignora el peón de e5: fxe5 ataca el caballo de f6 y gana un peón. En la Vienesa, el peón de f4 está para eso: capturar en e5 y ganar tiempo.', 'El rival se equivocó: ¿qué capturás?'),
  ],
  'gambito-rey': [
    pun('gr-pun-qf6', 'Las negras sacaron la dama a f6', 'e4 e5 f4 Bc5 Nf3 Qf6', 'fxe5', '…Df6? se expone al ataque de peón: fxe5 ataca la dama y gana tiempo y un peón. No saques la dama temprano si un peón rival puede atacarla.', 'El rival se equivocó: ¿qué capturás?'),
  ],
  petroff: [
    pun('pet-pun-g4', 'Las blancas avanzaron el peón de g', 'e4 e5 Nf3 Nf6 Nxe5 d6 Nf3 Nxe4 g4', 'Bxg4', 'g4? deja el peón sin defensa: Axg4 gana un peón y clava el caballo de f3. Antes de avanzar un peón del flanco de rey, hay que ver si queda protegido.', 'El rival se equivocó: ¿qué capturás?'),
  ],
  philidor: [
    pun('phi-pun-d5', 'Las blancas avanzaron d5', 'e4 e5 Nf3 d6 d4 Nf6 d5', 'Nxe4', '4.d5? no ataca nada y deja el peón de e4 sin defensa: Cxe4 gana un peón. En la Philidor, no te asustes de d4: si el rival no defiende e4, lo capturás.', 'El rival se equivocó: ¿qué capturás?'),
  ],
  alekhine: [
    pun('ale-pun-nf3', 'Las blancas desarrollaron el caballo', 'e4 Nf6 Nf3', 'Nxe4', '2.Cf3? deja el peón de e4 sin defensa: Cxe4 gana un peón. Contra la Alekhine, la jugada natural es e5 o Cc3; si no defienden e4, tu caballo lo captura.', 'El rival se equivocó: ¿qué capturás?'),
  ],
  'pirc-moderna': [
    pun('pirc-pun-na3', 'Las blancas jugaron Ca3', 'e4 d6 d4 Nf6 Na3', 'Nxe4', '4.Ca3? no defiende e4: Cxe4 gana un peón. Un caballo en el borde del tablero casi nunca protege el centro.', 'El rival se equivocó: ¿qué capturás?'),
  ],
  colle: [
    pun('colle-pun-ne4', 'Las negras saltaron a e4', 'd4 d5 Nf3 Nf6 e3 e6 Bd3 c5 c3 Nc6 Nbd2 Ne4', 'Nxe4', '…Ce4? cae por Cxe4 dxe4 Axe4: ganás un peón porque tu alfil de d3 recaptura. En el Colle, el alfil de d3 y el caballo de d2 vigilan e4 siempre.', 'El rival se equivocó: ¿qué capturás?'),
  ],
  inglesa: [
    pun('ing-pun-b5', 'Las negras avanzaron …b5', 'c4 e5 Nc3 Nf6 Nf3 Nc6 g3 b5', 'cxb5', '…b5? ofrece un peón que no está protegido: cxb5 lo captura. Los peones de ala que avanzan sin apoyo se pierden.', 'El rival se equivocó: ¿qué capturás?'),
  ],
}

export const EXTRAS2: Record<string, OpeningExtras> = {
  evans: {
    items: [...PLANS2.evans!, ...PUNISH.evans!],
    model: {
      title: 'Evans: la iniciativa del gambito',
      color: 'w',
      moves: L('e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Ba5 d4 exd4 O-O Nf6 cxd4 Nxe4 d5 Ne7 Qd4 Nf6 Bg5 d6 Nbd2 Nf5 Rae1+ Kf8 Qb2 h6'),
      notes: {
        6: 'El gambito: ofrecés el peón de b para ganar tiempo con c3 y d4.',
        10: 'd4: el golpe central que justifica el sacrificio.',
        12: 'Enrocás en vez de recuperar el peón: primero desarrollo.',
        14: 'Recuperás el peón de d4: tenés el centro.',
        16: 'd5 ataca el caballo de c6 y gana tiempo.',
        18: 'La dama se centraliza y ataca el caballo de e4.',
        24: 'La torre da jaque en la columna e: el rey negro sigue en el centro.',
      },
      summary: 'El Evans es una apertura de iniciativa: el peón sacrificado compra tiempo y un centro fuerte. Las blancas terminan dos peones abajo, pero con todas las piezas en juego y el rey negro incómodo en el centro: Stockfish las ve mejor (+2,2).',
    },
  },
  'cuatro-caballos': {
    items: [...PLANS2['cuatro-caballos']!, ...PUNISH['cuatro-caballos']!],
    model: {
      title: 'Cuatro Caballos: simetría y paciencia',
      color: 'w',
      moves: L('e4 e5 Nf3 Nc6 Nc3 Nf6 Bb5 Bb4 O-O O-O d3 d6 Bg5 Bxc3 bxc3 Qe7 Re1 Nd8 d4 Ne6 Bc1 Nd7 a4 a6 Bxd7 Bxd7 dxe5 dxe5 Nxe5 Rfd8'),
      notes: {
        6: 'Presionás el caballo de c6, que defiende e5.',
        8: 'Enrocás: sacás al rey de la clavada.',
        12: 'Ag5 clava el caballo de f6 contra la dama.',
        14: 'Recapturás con el peón de b: peones doblados, pero con piezas activas.',
        18: 'Abrís el centro con d4: tu ventaja de espacio.',
        20: 'El caballo negro atacaba tu alfil de g5: lo retirás a c1.',
        24: 'Cambiás tu alfil por el caballo de d7; las negras recapturan con el alfil de c8.',
        28: 'Cxe5 gana un peón: el peón de e5 quedó sin defensa suficiente.',
      },
      summary: 'Una Cuatro Caballos típica: simétrica y tranquila. La ventaja aparece de a poco: abrís el centro cuando las piezas están listas y las negras no pueden defender todos los peones.',
    },
  },
  alfil: {
    items: [...PLANS2.alfil!, ...PUNISH.alfil!],
    model: {
      title: 'Apertura del Alfil: el esquema italiano',
      color: 'w',
      moves: L('e4 e5 Bc4 Nc6 Nf3 Nf6 d3 Be7 O-O d6 c3 O-O Re1 a6 Bb3 Na5 Bc2 c5 h3 Nc6 d4 exd4 cxd4 d5 e5 Ne4 Nc3 Bf5 Nxe4 Bxe4'),
      notes: {
        14: 'Retirás el alfil a b3 antes de que lo ataquen con …b5.',
        16: 'El alfil se retira a c2 y sigue activo.',
        18: 'h3: evitás …Ag4 antes de abrir el centro.',
        20: 'd4: con todas las piezas listas, abrís el centro.',
        22: 'Recapturás con el peón de c y mantenés el centro.',
        24: 'e5 ataca el caballo de f6 y gana espacio.',
        26: 'Cc3 ataca el caballo de e4 y suma una pieza al juego.',
        28: 'Cambiás caballos: simplificás y tus piezas quedan bien.',
      },
      summary: 'La Apertura del Alfil se transforma en una Italiana tranquila: desarrollo, enroque y recién entonces d4. Es un esquema que se repite en muchas partidas.',
    },
  },
  viena: {
    items: [...PLANS2.viena!, ...PUNISH.viena!],
    model: {
      title: 'Gambito Vienés: ataque con f4',
      color: 'w',
      moves: L('e4 e5 Nc3 Nf6 f4 d5 fxe5 Nxe4 Nf3 Be7 d4 O-O Bd3 f5 exf6 Bxf6 O-O Nc6 Nxe4 dxe4 Bxe4 Nxd4 Be3 Bg4 Bxb7 Rb8 Be4 Re8'),
      notes: {
        4: 'f4: el Gambito Vienés. Atacás el peón de e5 con un peón.',
        6: 'Capturás el peón de e5 con el peón de f.',
        12: 'Ad3 ataca el caballo de e4 y apunta al flanco de rey.',
        14: 'Capturás al paso con el peón de e5.',
        16: 'Enrocás: rey a salvo y torre lista para el centro.',
        18: 'Cambiás caballos: simplificás con ventaja de actividad.',
        20: 'Axe4 captura el peón de e4: el alfil queda activo.',
        24: 'El alfil captura el peón de b7: se lleva material.',
      },
      summary: 'La Vienesa permite jugar con iniciativa: f4, captura en e5 y piezas activas. El rival puede defenderse, pero tenés más opciones que él.',
    },
  },
  'gambito-rey': {
    items: [...PLANS2['gambito-rey']!, ...PUNISH['gambito-rey']!],
    model: {
      title: 'Gambito de Rey: recuperar el peón con ritmo',
      color: 'w',
      moves: L('e4 e5 f4 exf4 Nf3 Be7 Bc4 Nf6 e5 Ng4 O-O Nc6 d4 d6 exd6 Bxd6 Qe2+ Qe7 Nc3 Qxe2 Nxe2 Nb4 Bxf4 Nxc2 Rac1 Nce3 Rfe1 Nxc4'),
      notes: {
        2: 'Gambito: ofrecés el peón de f para abrir la columna f y ganar el centro.',
        8: 'e5 ataca el caballo de f6 y gana tiempo.',
        10: 'Enrocás: rey a salvo y torre lista para el centro.',
        12: 'd4: ocupás el centro con peones y abrís líneas.',
        14: 'Cambiás peones y abrís la columna e.',
        16: 'Dama con jaque en la columna e: el rey negro todavía en el centro.',
        22: 'Recuperás el peón de f4 con el alfil: lo que ofreciste vuelve.',
      },
      summary: 'El Gambito de Rey es una apertura filosa: el peón de f4 se recupera pronto y el juego se abre. Cada bando tiene que mirar los jaques. Al final Stockfish ve a las negras algo mejor (−0,5): es una apertura que exige precisión.',
    },
  },
  petroff: {
    items: [...PLANS2.petroff!, ...PUNISH.petroff!],
    model: {
      title: 'Petroff: sólido y activo',
      color: 'b',
      moves: L('e4 e5 Nf3 Nf6 Nxe5 d6 Nf3 Nxe4 d4 d5 Bd3 Be7 O-O Nc6 Re1 Bg4 c4 Nf6 Nc3 O-O cxd5 Nxd4 Bxh7+ Nxh7 Qxd4 Bxf3 gxf3 Bf6'),
      notes: {
        5: 'Atacás el caballo de e5 y lo obligás a retirarse.',
        7: 'Ahora sí capturás el peón de e4 y recuperás el material.',
        9: 'Apuntalás el caballo de e4 con …d5.',
        15: 'Clavás el caballo de f3 contra la dama.',
        17: 'El caballo vuelve al centro: sale con tiempo.',
        21: 'Capturás el peón de d4 con el caballo.',
        23: 'Recapturás con el caballo: el sacrificio del alfil blanco no funcionó.',
        25: 'Cambiás alfil por caballo: sacás una pieza activa.',
      },
      summary: 'La Petroff es una defensa de equilibrio: después de superar la apertura, tu posición es firme y tenés buenas casillas para tus piezas.',
    },
  },
  philidor: {
    items: [...PLANS2.philidor!, ...PUNISH.philidor!],
    model: {
      title: 'Philidor: abrir el centro a tiempo',
      color: 'b',
      moves: L('e4 e5 Nf3 d6 d4 Nf6 Nc3 Nbd7 Bc4 Be7 O-O O-O Qe2 c6 a4 exd4 Nxd4 Re8 Ba2 d5 exd5 Nb6 Qd3 Nbxd5 Nxd5 Nxd5 Bd2 Bg4'),
      notes: {
        15: 'Cambiás en d4 cuando tus piezas están listas.',
        17: 'Te8 pone la torre en la columna e, detrás del alfil de e7, lista para presionar el peón de e4.',
        19: 'La ruptura …d5: libera tu juego y activa tus piezas.',
        21: 'El caballo ataca el peón de d5 y el de a4.',
        23: 'Recapturás el peón de d5: igualaste la posición.',
        27: 'Tu alfil de c8 finalmente sale a una casilla activa.',
      },
      summary: 'La Philidor es compacta y paciente: esperás a estar listo, rompés con …d5 y tus piezas salen todas juntas.',
    },
  },
  alekhine: {
    items: [...PLANS2.alekhine!, ...PUNISH.alekhine!],
    model: {
      title: 'Alekhine: atacar la cadena de peones',
      color: 'b',
      moves: L('e4 Nf6 e5 Nd5 d4 d6 Nf3 Bg4 Be2 e6 O-O Be7 h3 Bh5 c4 Nb6 Nc3 O-O exd6 cxd6 d5 e5 c5 dxc5 g4 Bg6 Nxe5 Na6'),
      notes: {
        5: 'Atacás el peón de e5 y presionás la cadena.',
        7: 'Sacás el alfil de c8 afuera clavando el caballo de f3.',
        15: 'El caballo se retira a b6 cuando el rival ataca con c4.',
        17: 'Enrocás: rey a salvo y torre lista para el centro.',
        19: 'Recapturás con el peón de c y abrís la columna c.',
        21: '…e5: la ruptura que ataca el centro blanco.',
        25: 'El alfil se retira a g6 conservando la diagonal.',
        27: 'El caballo se reubica atacando c5.',
      },
      summary: 'La Alekhine te hace jugar al contraataque: el rival avanza y vos atacás los peones avanzados con piezas. Es una apertura de reacción. Al final Stockfish ve una ligera ventaja blanca (+0,8).',
    },
  },
  'pirc-moderna': {
    items: [...PLANS2['pirc-moderna']!, ...PUNISH['pirc-moderna']!],
    model: {
      title: 'Pirc: contrajuego desde afuera',
      color: 'b',
      moves: L('e4 d6 d4 Nf6 Nc3 g6 Nf3 Bg7 Be2 O-O O-O Bg4 Be3 Nc6 d5 Bxf3 Bxf3 Ne5 Be2 c6 f4 Ned7 dxc6 bxc6 g4 Rb8 Rb1 Ne8'),
      notes: {
        7: 'Tu alfil apunta al centro desde lejos.',
        11: 'Ag4 presiona el caballo de f3, que protege el alfil de e2.',
        15: 'Cambiás alfil por caballo: sacás una pieza activa.',
        17: 'El caballo salta a e5, una casilla central.',
        19: '…c6 ataca el peón de d5 y abre la columna c.',
        23: 'Recapturás con el peón de b y abrís la columna b.',
        25: 'La torre ocupa la columna b abierta.',
      },
      summary: 'La Pirc es una defensa flexible: aceptás un centro rival para contraatacarlo con piezas. Los cambios te ayudan a aliviar la posición. Al final Stockfish ve una ligera ventaja blanca (+0,6).',
    },
  },
  colle: {
    items: [...PLANS2.colle!, ...PUNISH.colle!],
    model: {
      title: 'Colle: la ruptura e4',
      color: 'w',
      moves: L('d4 d5 Nf3 Nf6 e3 e6 Bd3 c5 c3 Nc6 Nbd2 Bd6 O-O O-O dxc5 Bxc5 b4 Bd6 b5 Na5 e4 Qc7 Rb1 h6 Re1 dxe4 Nxe4 Nxe4'),
      notes: {
        12: 'Enrocás: rey a salvo y todo listo para abrir el juego.',
        14: 'Cambiás peones cuando tus piezas están listas.',
        16: 'b4 gana espacio y ataca el alfil.',
        18: 'b5 gana otro tiempo atacando el caballo de c6.',
        20: 'e4: la ruptura del Colle. Abrís el centro con tus piezas activas.',
        22: 'La torre apoya el avance de los peones.',
        26: 'Recapturás con el caballo: tus piezas quedan activas.',
      },
      summary: 'El Colle es un esquema: preparás las piezas y rompés con e4. Cuando las negras defienden bien, ganás espacio en el flanco de dama y mantenés la iniciativa.',
    },
  },
  inglesa: {
    items: [...PLANS2.inglesa!, ...PUNISH.inglesa!],
    model: {
      title: 'Inglesa: espacio en el flanco de dama',
      color: 'w',
      moves: L('c4 e5 Nc3 Nf6 Nf3 Nc6 g3 d5 cxd5 Nxd5 Bg2 Nb6 O-O Be7 d3 Be6 a3 O-O Be3 Qd7 b4 a6 d4 exd4 Nxd4 Nxd4 Qxd4 Bf6'),
      notes: {
        10: 'El alfil se ubica en la gran diagonal.',
        12: 'Enrocás: rey a salvo y torre lista para el centro.',
        14: 'Apuntalás el centro con d3 y abrís el alfil de c1.',
        16: 'a3 prepara b4 para ganar espacio en el flanco de dama.',
        20: 'b4: ganás espacio en el flanco de dama.',
        22: 'd4: abrís el centro cuando tus piezas están listas.',
        26: 'La dama recaptura y queda centralizada y activa.',
      },
      summary: 'La Inglesa ofrece una partida estratégica: fianchetto, espacio en el flanco de dama y un centro que se abre cuando vos querés.',
    },
  },
}
