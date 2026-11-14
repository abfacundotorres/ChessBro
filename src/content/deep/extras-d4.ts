import type { OpeningExtras } from './kit'

const L = (s: string) => s.split(' ')

/** Planes del medio juego, errores del rival y partida de ejemplo: Gambito de Dama, Londres e India de Rey. */
export const EXTRAS_D4: Record<string, OpeningExtras> = {
  'gambito-dama': {
    items: [
      {
        id: 'gd-plan-cxd5',
        kind: 'plan',
        title: 'Definí el centro',
        prompt: '¿Qué hacés con la tensión en d5?',
        moves: L('d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 h6 Bh4 b6'),
        answer: 'cxd5',
        alt: ['Rc1', 'Be2', 'Bxf6'],
        why: 'cxd5 aclara la estructura: después de …exd5 sabés dónde van tus piezas (Ad3, Dc2, Tc1) y tu plan apunta al flanco de rey. Tc1 o Axf6 también son jugables, pero conviene definir el centro.',
      },
      {
        id: 'gd-pun-b5',
        kind: 'punish',
        title: 'Las negras quisieron conservar el peón',
        prompt: 'El rival se equivocó: ¿qué capturás?',
        moves: L('d4 d5 c4 dxc4 Nf3 Nf6 e3 e6 Bxc4 c5 O-O b5'),
        answer: 'Bxb5+',
        why: '…b5? quiere echar al alfil, pero deja el peón sin defensa: Axb5+ gana un peón con jaque (después de …Ad7, Ae2 y el alfil vuelve a casa). El alfil de c4 recupera el peón del gambito y además cobra este.',
      },
      {
        id: 'gd-pun-nfd7',
        kind: 'punish',
        title: 'Las negras retiraron el caballo a d7',
        prompt: 'El rival se equivocó: ¿qué cambiás primero?',
        moves: L('d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 Nfd7'),
        answer: 'Bxe7',
        why: '…Cfd7 ya no defiende d5, pero ojo: si tomás cxd5 de entrada, tu alfil de g5 queda atacado por el de e7. Primero Axe7 (Dxe7) y recién entonces cxd5: ganás el peón de d5 sin riesgos.',
      },
    ],
    model: {
      title: 'Gambito de Dama rehusado: centro y piezas',
      color: 'w',
      moves: L('d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 h6 Bh4 b6 Rc1 Bb7 Bxf6 Bxf6 cxd5 exd5 g3 c5 Bg2 Nc6 O-O cxd4 exd4 Re8 h4 Qd6 Re1 a6'),
      notes: {
        14: 'Torre a la columna c: te prepara para cxd5 y la ruptura en el flanco de dama.',
        16: 'Cambiás el alfil de h4 por el caballo de f6: ese caballo defendía d5.',
        18: 'cxd5: abrís la columna c y aclarás el centro.',
        20: 'g3 prepara el fianchetto: el alfil en g2 va a apuntar a d5 y b7.',
        24: 'Enrocás: el rey queda a salvo.',
        28: 'h4: empezás a ganar espacio en el flanco de rey.',
      },
      summary: 'El Gambito de Dama rehusado es una apertura de piezas y de peones centrales: nadie gana nada rápido, pero tu posición se mantiene cómoda y con planes claros.',
    },
  },
  london: {
    items: [
      {
        id: 'lon-plan-bd3',
        kind: 'plan',
        title: 'Completá el esquema',
        prompt: '¿Qué pieza falta ubicar?',
        moves: L('d4 d5 Bf4 Nf6 e3 e6 Nf3 Bd6 Bg3 O-O Nbd2 c5 c3 Nc6'),
        answer: 'Bd3',
        alt: ['Ne5'],
        why: 'Ad3 completa el esquema: apunta al flanco de rey y deja lista la casilla e5 para el caballo. Ce5 también vale: es el golpe típico del Londres.',
      },
      {
        id: 'lon-pun-b5',
        kind: 'punish',
        title: 'Las negras avanzaron …b5',
        prompt: 'El rival se equivocó: ¿qué capturás?',
        moves: L('d4 d5 Bf4 Nf6 e3 e6 Nf3 b5'),
        answer: 'Bxb5+',
        why: '…b5? descuida que el alfil de f1 quedó libre al jugar e3: Axb5+ gana un peón con jaque. Es el beneficio de sacar primero el alfil de c1: el otro alfil se activa solo.',
      },
    ],
    model: {
      title: 'Londres: esquema completo y ruptura e4',
      color: 'w',
      moves: L('d4 d5 Bf4 Nf6 e3 e6 Nf3 Bd6 Bg3 O-O Nbd2 c5 c3 Nc6 Bd3 cxd4 cxd4 Qc7 Rc1 Bd7 a3 Rfc8 e4 Nxe4 Nxe4 dxe4 Bxe4 f5 Bxd6 Qxd6 Bxc6 Bxc6'),
      notes: {
        14: 'Alfil a d3: apunta al flanco de rey y completa el esquema.',
        16: 'Recapturás con el peón de c: mantenés d4 y e3 y abrís la columna c.',
        18: 'Torre a la columna c: la abrió el cambio de peones.',
        22: 'e4: la ruptura del Londres. Abrís el juego cuando tus piezas están listas.',
        28: 'Cambiás tu alfil de g3 por el de d6.',
      },
      summary: 'El Londres es un esquema: con piezas bien colocadas, la ruptura e4 llega sola. El resultado fue una partida pareja, pero con tu plan cumplido.',
    },
  },
  'india-rey': {
    items: [
      {
        id: 'ir-plan-ne7',
        kind: 'plan',
        title: 'Después de d5',
        prompt: '¿Adónde va el caballo de c6?',
        moves: L('d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5'),
        answer: 'Ne7',
        why: 'Después de d5 el caballo se retira a e7: desde ahí apoya …f5 y vigila el centro. El ataque en el flanco de rey con …f5 es el plan de toda la India de Rey.',
      },
      {
        id: 'ir-plan-nd7',
        kind: 'plan',
        title: 'Prepará el ataque con …f5',
        prompt: '¿Qué hacés con el caballo de f6?',
        moves: L('d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7 Ne1'),
        answer: 'Nd7',
        alt: ['Ne8'],
        why: 'Cd7 (o Ce8) prepara …f5: el caballo sale de f6 para que el peón de f pueda avanzar. El ataque en el flanco de rey es tu plan principal.',
      },
      {
        id: 'ir-pun-nd5',
        kind: 'punish',
        title: 'Las blancas movieron el caballo a d5',
        prompt: 'El rival se equivocó: ¿qué peón queda sin defensa?',
        moves: L('d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nd5'),
        answer: 'Nxe4',
        why: 'Cd5? deja e4 sin defensa: el caballo de c3 era quien la protegía. Cxe4 gana un peón (y si Cxf6+ Axf6 quedás un peón arriba). Un caballo avanzado a d5 solo es fuerte si no deja piezas sin protección.',
      },
    ],
    model: {
      title: 'India de Rey: el ataque en el flanco de rey',
      color: 'b',
      moves: L('d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7 Qc2 b6 Rb1 a5 a3 Nh5 Re1 f5 b4 axb4 axb4 h6 h3 Nf6 Bd3 Kh7'),
      notes: {
        11: '…e5: la ruptura clásica: atacás el centro blanco.',
        13: 'Presionás d4 con el caballo de c6.',
        15: 'Después de d5 el caballo va a e7: apoya …f5 y vigila el centro.',
        21: 'Ch5 prepara …f5: sacás el caballo de f6 para que avance el peón.',
        23: '…f5: empieza el ataque en el flanco de rey, el plan de toda la apertura.',
        25: 'Abrís la columna a: tu torre queda activa.',
        31: 'Rh7: el rey queda detrás de tus peones de f5 y g6.',
      },
      summary: 'La India de Rey es una apertura de ataque: cedés el centro al principio, pero después te lanzás contra el enroque rival con …e5 y …f5. Exige precisión, pero tenés un plan claro.',
    },
  },
}
