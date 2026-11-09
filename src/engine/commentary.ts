import type { MoveError } from './analysis'
import { sanToFigurine } from './game'

const SEVERITY: Record<MoveError['severity'], string> = { blunder: 'un error grave', mistake: 'un error', inaccuracy: 'una imprecisión' }

/**
 * Explicación en español de un error de tu partida, armada con lo que dijo el motor (tipo de error, jugada
 * mejor, cuánto bajó tu probabilidad de ganar). No inventa variantes: solo explica con plantillas.
 */
export function explainError(e: MoveError): string {
  const played = `Tu ${sanToFigurine(e.san)}`
  const best = sanToFigurine(e.bestSan)
  const loss = Math.round(e.winLoss)
  const cost = e.severity === 'inaccuracy' ? '' : ` Tu probabilidad de ganar bajó unos ${loss} puntos.`
  const head = `${played} fue ${SEVERITY[e.severity]}.`
  switch (e.kind) {
    case 'allowedMate':
      return `${head} Después de esa jugada el rival tiene mate forzado. Antes de mover, mirá todos los jaques del rival. Lo mejor era ${best}.`
    case 'missedMate':
      return `${head} Tenías mate forzado y se pasó. Jugando ${best} lo ganabas. Antes de mover, buscá primero todos los jaques propios.`
    case 'hanging':
      return `${head} Dejaste material sin defender y el rival se lo lleva enseguida.${cost} Antes de mover, preguntate: ¿qué ataca el rival ahora? Lo mejor era ${best}.`
    case 'missedTactic':
      return `${head} Había una táctica: ${best} ganaba material o ventaja.${cost} Revisá jaques, capturas y amenazas antes de elegir.`
    case 'opening':
      return `${head} En la apertura conviene: ocupar el centro, desarrollar piezas y enrocar. El motor prefería ${best}.`
    case 'endgame':
      return `${head} En los finales cada tiempo cuenta: activá el rey y empujá los peones libres.${cost} Lo más preciso era ${best}.`
    case 'positional':
      return `${head} No pierde material de inmediato, pero empeora tu posición.${cost} El motor prefería ${best}.`
  }
}
