import { DEEP_LINES } from '../openingLines'
import type { MoveItem } from './kit'

/**
 * Ejercicio de plan sacado de una línea: la posición es la de la línea antes de tu jugada número `k` (0 = primera jugada
 * de la línea) y la respuesta es esa jugada. Así ya está verificada por el control de las líneas y la explicación va junto.
 */
export function planFrom(lineId: string, k: number, p: { id: string; title: string; prompt: string; why: string; alt?: string[] }): MoveItem {
  const line = DEEP_LINES.find((l) => l.id === lineId)
  if (!line) throw new Error(`línea inexistente: ${lineId}`)
  return { id: p.id, kind: 'plan', title: p.title, prompt: p.prompt, moves: line.moves.slice(0, k), answer: line.moves[k]!, alt: p.alt, why: p.why }
}

export const PLANS2: Record<string, MoveItem[]> = {
  evans: [
    planFrom('evans-d6', 20, { id: 'evans-plan-bb5', title: 'La dama negra está en d7', prompt: '¿Cómo ganás un tiempo?', why: 'Ab5 clava el caballo de c6 contra la dama de d7: el caballo no puede moverse sin dejar la dama expuesta. Es una forma simple de ganar tiempo y mantener la iniciativa que te dio el gambito.' }),
    planFrom('evans-acc', 12, { id: 'evans-plan-oo', title: 'Después de d4 y …exd4', prompt: '¿Recuperás el peón o desarrollás?', why: 'O-O: preferís desarrollar a recuperar el peón de inmediato. El rey queda a salvo y la torre pasa a f1; el peón de d4 lo recuperás después, con el centro y las piezas activas a tu favor.' }),
  ],
  'cuatro-caballos': [
    planFrom('4c-espanola', 12, { id: '4c-plan-bg5', title: 'Después de d3 y …d6', prompt: '¿Cómo aumentás la presión?', why: 'Ag5 clava el caballo de f6 contra la dama: aumentás la presión sobre el centro negro. Si cambian alfil por caballo, doblan tus peones, pero tus piezas ganan actividad.' }),
    planFrom('4c-bc5', 10, { id: '4c-plan-nxe5', title: 'Las negras desarrollaron el alfil a c5', prompt: '¿Qué peón queda débil?', why: 'Cxe5 aprovecha que el caballo de c6, que defendía e5, está presionado por el alfil de b5. Después del cambio de caballos ganás un tiempo y quedás con una posición igualada y cómoda.' }),
  ],
  alfil: [
    planFrom('alfil-nc6', 16, { id: 'alfil-plan-bc2', title: 'Te atacan el alfil con …Ca5', prompt: '¿Dónde lo retirás?', why: 'Ac2: el alfil se mantiene activo en la diagonal b1–h7 y no se cambia por un caballo. Después, d4 con todas las piezas listas.' }),
    planFrom('alfil-nf6', 8, { id: 'alfil-plan-bb3', title: 'Las negras ocuparon d5', prompt: '¿Qué hacés con el alfil atacado?', why: 'Ab3: el peón de d5 atacaba el alfil de c4; en b3 sigue en la misma diagonal y se mantiene a salvo.' }),
  ],
  viena: [
    planFrom('vie-d5', 12, { id: 'vie-plan-bd3', title: 'Las negras enrocaron', prompt: '¿Cómo seguís desarrollando con presión?', why: 'Ad3 ataca el caballo de e4 y apunta al flanco de rey: es la pieza clave del ataque en la Vienesa.' }),
    planFrom('vie-nc6', 8, { id: 'vie-plan-nge2', title: 'Vienesa tranquila', prompt: '¿Adónde va el caballo de rey?', why: 'Cge2: el caballo sale por e2 para dejar libre el peón de f y el alfil de g2, y queda listo para ir a d4 o f4.' }),
  ],
  'gambito-rey': [
    planFrom('gr-be7', 8, { id: 'gr-plan-e5', title: 'Las negras desarrollaron el caballo', prompt: '¿Cómo ganás tiempo?', why: 'e5 ataca el caballo de f6 y gana tiempo: el caballo tiene que moverse. Además ocupás más espacio en el centro.' }),
    planFrom('gr-d6', 8, { id: 'gr-plan-d4', title: 'El centro del gambito', prompt: '¿Qué peón avanzás?', why: 'd4: ocupás el centro con peones en e4 y d4, que es la razón de ser del Gambito de Rey. Después de …g5 tus piezas ganan casillas.' }),
  ],
  petroff: [
    planFrom('pet-principal', 9, { id: 'pet-plan-d5', title: 'Recuperaste el peón de e4', prompt: '¿Cómo consolidás el caballo?', why: '…d5 apuntala el caballo de e4 y ocupa el centro: es la jugada que consolida la Petroff y te deja con una posición muy firme.' }),
    planFrom('pet-d4', 9, { id: 'pet-plan-nd7', title: 'El rival capturó en e5', prompt: '¿Cómo lo enfrentás?', why: '…Cd7 ofrece cambiar el caballo de e5 y mantiene tu estructura. Es la forma simple de igualar la posición.' }),
  ],
  philidor: [
    planFrom('phi-nf6', 13, { id: 'phi-plan-c6', title: 'Philidor: ya enrocaste', prompt: '¿Qué peón avanzás?', why: '…c6 prepara …Dc7 y evita Cb5 y Cd5. Es una jugada de espera sólida que refuerza el centro.' }),
    planFrom('phi-bc4', 15, { id: 'phi-plan-ne5', title: 'El alfil blanco está en c4', prompt: '¿Cómo ganás un tiempo?', why: '…Ce5 ataca el alfil de c4 y centraliza el caballo: ganás tiempo para seguir desarrollando.' }),
  ],
  alekhine: [
    planFrom('ale-moderna', 7, { id: 'ale-plan-bg4', title: 'Después de Cf3', prompt: '¿Cómo desarrollás el alfil de c8?', why: '…Ag4 saca el alfil afuera con una clavada antes de cerrar con …e6. Es la regla de oro: sacá el alfil malo antes de cerrar la cadena.' }),
    planFrom('ale-cuatro-peones', 11, { id: 'ale-plan-nc6', title: 'Cuatro Peones', prompt: '¿Cómo atacás el peón de e5?', why: '…Cc6 ataca el peón de e5 con una pieza: el rival avanzó mucho y ahora tiene que defenderlo.' }),
  ],
  'pirc-moderna': [
    planFrom('pirc-austriaco', 13, { id: 'pirc-plan-c5', title: 'Contra el Ataque Austríaco', prompt: '¿Cuál es tu ruptura?', why: '…c5 ataca el centro del rival, que avanzó mucho con f4 y dejó debilidades. Es la ruptura clave de la Pirc.' }),
    planFrom('pirc-150', 13, { id: 'pirc-plan-b5', title: 'El rival prepara g4', prompt: '¿Cómo contraatacás?', why: '…b5 gana espacio en el flanco de dama y contraataca antes de que el rival llegue con sus peones. Contra un ataque, la mejor defensa es otro ataque.' }),
  ],
  colle: [
    planFrom('colle-be7', 14, { id: 'colle-plan-qe2', title: 'Esquema casi completo', prompt: '¿Dónde va la dama?', why: 'Qe2 prepara la ruptura e4 y deja libre la columna d para la torre. Es el paso previo a abrir el juego.' }),
    planFrom('colle-bd6', 10, { id: 'colle-plan-nbd2', title: 'Colle: falta el caballo de dama', prompt: '¿Cómo desarrollás el caballo de b1?', why: 'Cbd2: el caballo sale por d2 y se prepara para apoyar e4, la ruptura típica del Colle.' }),
  ],
  inglesa: [
    planFrom('ing-nc6', 10, { id: 'ing-plan-rb1', title: 'Fianchetto completo', prompt: '¿Cómo preparás b4?', why: 'Tb1 prepara b4: ganás espacio en el flanco de dama mientras las negras atacan por el otro. Es el plan típico de la Inglesa.' }),
    planFrom('ing-nf6', 10, { id: 'ing-plan-bg2', title: 'Después de cambiar en d5', prompt: '¿Dónde ubicás el alfil?', why: 'Ag2 coloca el alfil en la gran diagonal y deja libre el enroque.' }),
  ],
}
