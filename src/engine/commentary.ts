import { Chess, type Move, type PieceSymbol, type Square } from 'chess.js'
import type { MoveError } from './analysis'
import { sanToFigurine } from './game'

/**
 * Comentarios de errores con aspecto de conversación. NO es un modelo de lenguaje: son plantillas con muchas
 * variantes, completadas con hechos que se calculan sobre la posición con chess.js (qué pieza quedó atacada, qué
 * capturaba o enrocaba la mejor jugada, qué amenazaba el rival). Todo es determinístico: el mismo error con la misma
 * "semilla" da siempre el mismo texto; cambiar la semilla da otra redacción.
 */

export type Topic = 'what' | 'why' | 'best' | 'rival' | 'avoid'

export const TOPICS: { key: Topic; label: string }[] = [
  { key: 'what', label: '¿Qué pasó?' },
  { key: 'why', label: '¿Por qué fue malo?' },
  { key: 'best', label: '¿Qué debí jugar?' },
  { key: 'rival', label: '¿Qué quería el rival?' },
  { key: 'avoid', label: '¿Cómo lo evito?' },
]

const VAL: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 }
const NAME: Record<PieceSymbol, { name: string; fem: boolean }> = {
  p: { name: 'peón', fem: false },
  n: { name: 'caballo', fem: false },
  b: { name: 'alfil', fem: false },
  r: { name: 'torre', fem: true },
  q: { name: 'dama', fem: true },
  k: { name: 'rey', fem: false },
}
const the = (t: PieceSymbol) => `${NAME[t].fem ? 'la' : 'el'} ${NAME[t].name}`
const a = (t: PieceSymbol) => `${NAME[t].fem ? 'una' : 'un'} ${NAME[t].name}`
const ado = (t: PieceSymbol, base: string) => `${base}${NAME[t].fem ? 'a' : 'o'}`

interface Threat {
  type: PieceSymbol
  square: Square
  attacker: PieceSymbol
  undefended: boolean
}

interface Facts {
  piece: PieceSymbol
  to: Square
  captured: PieceSymbol | null
  castle: 'corto' | 'largo' | null
  exposed: Threat | null
  ignored: Threat | null
  best: { piece: PieceSymbol; captured: PieceSymbol | null; check: boolean; mate: boolean; castle: 'corto' | 'largo' | null; promotes: boolean; saves: Threat | null; develops: boolean } | null
  rival: { piece: PieceSymbol; to: Square; check: boolean; attacks: { type: PieceSymbol; square: Square } | null } | null
}

function squareOf(uci: string): { from: Square; to: Square; promotion?: string } {
  return { from: uci.slice(0, 2) as Square, to: uci.slice(2, 4) as Square, promotion: uci[4] }
}

/** Piezas de `color` (menos el rey) que el rival puede ganar: atacadas sin defensa, o por una pieza de menos valor. */
function threats(chess: Chess, color: 'w' | 'b'): Threat[] {
  const opp = color === 'w' ? 'b' : 'w'
  const out: Threat[] = []
  for (const row of chess.board()) {
    for (const c of row) {
      if (!c || c.color !== color || c.type === 'k') continue
      const att = chess.attackers(c.square, opp)
      if (att.length === 0) continue
      const defended = chess.attackers(c.square, color).length > 0
      const minAtt = att.map((s) => chess.get(s)).reduce((m, p) => Math.min(m, p ? VAL[p.type] : 99), 99)
      if (!defended || minAtt < VAL[c.type]) {
        const attacker = att.map((s) => chess.get(s)!).sort((x, y) => VAL[x.type] - VAL[y.type])[0]!.type
        out.push({ type: c.type, square: c.square, attacker, undefended: !defended })
      }
    }
  }
  return out.sort((x, y) => VAL[y.type] - VAL[x.type])
}

function castleOf(m: Move): 'corto' | 'largo' | null {
  return m.isKingsideCastle() ? 'corto' : m.isQueensideCastle() ? 'largo' : null
}

function factsOf(e: MoveError): Facts | null {
  try {
    const before = new Chess(e.fenBefore)
    const me = before.turn()
    const threatsBefore = threats(before, me)
    const played = before.move(e.san)
    const after = threats(before, me)
    const beforeSquares = new Set(threatsBefore.map((t) => t.square))
    const exposed = after.find((t) => !beforeSquares.has(t.square) || t.square === played.to) ?? null
    const ignored = after.find((t) => beforeSquares.has(t.square) && t.square !== played.to && t.square !== exposed?.square) ?? null

    let best: Facts['best'] = null
    try {
      const c = new Chess(e.fenBefore)
      const m = c.move(squareOf(e.bestUci))
      const remaining = threats(c, me)
      const saves = threatsBefore.length > 0 && remaining.length < threatsBefore.length ? threatsBefore[0]! : null
      const backRank = me === 'w' ? '1' : '8'
      best = {
        piece: m.piece,
        captured: m.captured ?? null,
        check: m.san.includes('+'),
        mate: m.san.includes('#'),
        castle: castleOf(m),
        promotes: !!m.promotion,
        saves,
        develops: (m.piece === 'n' || m.piece === 'b') && m.from[1] === backRank && e.kind === 'opening',
      }
    } catch {
      /* sin datos de la mejor jugada */
    }

    let rival: Facts['rival'] = null
    if (e.prevUci && e.fenBeforePrev) {
      try {
        const p = new Chess(e.fenBeforePrev)
        const pm = p.move(squareOf(e.prevUci))
        const mine = [...before.board().flat()].filter((c) => c && c.color === me && c.type !== 'k')
        const hit = mine
          .filter((c) => before.attackers(c!.square, me === 'w' ? 'b' : 'w').includes(pm.to))
          .sort((x, y) => VAL[y!.type] - VAL[x!.type])[0]
        rival = { piece: pm.piece, to: pm.to, check: pm.san.includes('+'), attacks: hit ? { type: hit.type, square: hit.square } : null }
      } catch {
        /* sin jugada previa */
      }
    }
    return { piece: played.piece, to: played.to, captured: played.captured ?? null, castle: castleOf(played), exposed, ignored, best, rival }
  } catch {
    return null
  }
}

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

/** Elige una variante de forma determinística: depende del error, de la semilla y del "casillero" de la frase. */
function pick<T>(e: MoveError, seed: number, slot: string, arr: readonly T[]): T {
  return arr[hash(`${e.fenBefore}|${e.san}|${slot}|${seed}`) % arr.length]!
}

const fig = sanToFigurine
const attackedBy = (t: Threat) => (t.undefended ? 'sin ninguna defensa' : `por ${a(t.attacker)}, que vale menos`)

// ───────────── ¿Qué pasó? ─────────────
function what(e: MoveError, f: Facts | null, seed: number): string {
  const san = fig(e.san)
  const opener = {
    blunder: [`Ojo: tu ${san} fue un error grave.`, `Acá se complicó la partida: ${san} fue un error grave.`, `Este fue un momento clave: ${san} es un error grave.`, `Tu ${san} cambió el rumbo de la partida, y no para bien: error grave.`],
    mistake: [`Tu ${san} fue un error.`, `${san} no fue una buena idea: es un error.`, `Con ${san} te equivocaste, y el motor lo nota.`, `${san} es un error: había algo mejor.`],
    inaccuracy: [`${san} no es mala, pero es una imprecisión.`, `Una imprecisión: ${san}.`, `Tu ${san} estuvo cerca, pero no era lo más preciso.`, `${san} es jugable, aunque pierde un poco de ventaja.`],
  }[e.severity]
  const parts = [pick(e, seed, 'op', opener)]

  const fact: string[] = []
  if (e.kind === 'allowedMate') fact.push(`Después de esa jugada el rival tiene mate forzado.`, `${san} le abre al rival un mate que ya no se puede evitar.`, `Con ${san} el rey queda en una red de mate.`)
  else if (e.kind === 'missedMate') fact.push(`Tenías mate forzado en esta posición y no lo jugaste.`, `Había mate y se pasó: les pasa a todos, y se entrena.`, `La posición tenía un mate; ${san} lo dejó escapar.`)
  else if (f?.exposed) {
    const x = f.exposed
    fact.push(
      `Con esa jugada ${the(x.type)} en ${x.square} quedó ${ado(x.type, 'atacad')} ${attackedBy(x)}.`,
      `Después de ${san}, ${the(x.type)} en ${x.square} está ${ado(x.type, 'amenazad')} ${attackedBy(x)}.`,
      `${the(x.type)}`.replace(/^./, (c) => c.toUpperCase()) + ` en ${x.square} quedó en la mira, ${x.undefended ? 'sin ninguna defensa' : 'y el cambio le conviene al rival'}.`,
    )
  } else if (f?.ignored) {
    const x = f.ignored
    fact.push(`Ya tenías ${the(x.type)} en ${x.square} bajo ataque y ${san} no lo resolvió.`, `La amenaza sobre ${the(x.type)} en ${x.square} ya existía antes de tu jugada, y siguió ahí.`)
  } else if (f?.captured) {
    fact.push(`Capturaste ${a(f.captured)} en ${f.to}, pero la captura te costó más de lo que ganaste.`, `La captura en ${f.to} parecía tentadora, pero había algo mejor.`)
  } else if (f?.castle) {
    fact.push(`Enrocar ${f.castle} acá no era lo que pedía la posición.`, `El enroque ${f.castle} quedó fuera de tiempo: había algo más urgente.`)
  } else {
    const by = f ? `${the(f.piece)} a ${f.to}` : san
    const generic: Record<string, string[]> = {
      missedTactic: [`Había una jugada forzada (jaque o captura) que ganaba algo, y no la jugaste.`, `Acá existía una táctica: una captura o un jaque que cambiaba la partida.`],
      opening: [`En la apertura cada jugada tiene que sumar: ${by} no suma lo suficiente.`, `${by} no ayuda a desarrollar ni a controlar el centro.`],
      endgame: [`En los finales un solo tiempo cuenta, y acá se perdió uno.`, `${by} no es lo más preciso en este final.`],
      positional: [`No pierde material de inmediato, pero tu posición queda un poco peor.`, `${by} deja una posición menos cómoda que la que había.`],
      hanging: [`Dejaste material al alcance del rival.`, `Esa jugada regala algo de material.`],
    }
    fact.push(...(generic[e.kind] ?? generic.positional!))
  }
  parts.push(pick(e, seed, 'fact', fact))

  if (e.severity !== 'inaccuracy' && e.kind !== 'allowedMate') {
    const n = Math.round(e.winLoss)
    parts.push(pick(e, seed, 'cost', [`Tu probabilidad de ganar bajó unos ${n} puntos.`, `Según el motor, perdiste cerca de ${n} puntos de probabilidad de ganar.`, `Eso te costó alrededor de ${n} puntos en la evaluación.`]))
  }
  return parts.join(' ')
}

// ───────────── ¿Por qué fue malo? ─────────────
const WHY: Record<MoveError['kind'], string[]> = {
  allowedMate: ['Un mate no se puede arreglar después: por eso lo primero siempre es mirar los jaques del rival.', 'Cuando el rey no tiene casillas libres, un solo jaque alcanza. Revisá las salidas de tu rey antes de mover.', 'Los mates se arman con pocas piezas: dama, torre o un caballo bien ubicados. Contá cuántas del rival apuntan a tu rey.'],
  missedMate: ['Un mate vale más que cualquier ventaja de material: termina la partida.', 'Si hay jaques, probalos todos: a veces el mate está en el menos obvio.', 'Ganar material cuando había mate es ganar una partida larga en lugar de una corta.'],
  hanging: ['Una pieza atacada y sin protección se pierde sin que el rival tenga que pensar nada.', 'En ajedrez el material es la base de todo: cada pieza regalada es una ventaja menos.', 'Entre dos piezas atacadas, el rival siempre se lleva la que quedó sin defensa.'],
  missedTactic: ['Las tácticas aparecen cuando hay jaques, capturas o amenazas; si no las buscás, pasan de largo.', 'Con una táctica una sola jugada cambia la evaluación entera. Es lo que más rendimiento da entrenar.', 'La jugada que ganaba era forzada: el rival no tenía buena respuesta. Eso es lo que hay que aprender a ver.'],
  opening: ['En la apertura el objetivo es desarrollar, ocupar el centro y enrocar. Cada tiempo que perdés lo aprovecha el rival.', 'Mover la misma pieza dos veces o sacar la dama temprano regala tiempo.', 'Una apertura desordenada se paga más adelante con piezas mal ubicadas.'],
  endgame: ['En el final cada tiempo vale oro: una jugada de más o de menos define quién gana la carrera.', 'En los finales el rey es una pieza activa: hay que acercarlo al centro y a los peones.', 'Los peones pasados mandan en el final. Un tiempo perdido puede dejar pasar uno.'],
  positional: ['No se pierde nada a la vista, pero la posición queda con piezas peor ubicadas o un peón débil.', 'Estas jugadas "tranquilas" son las más difíciles de ver: el costo aparece varias jugadas después.', 'Una pieza activa vale más que una pasiva; acá la elegida quedó menos útil.'],
}
function why(e: MoveError, f: Facts | null, seed: number): string {
  const out = [pick(e, seed, 'why', WHY[e.kind])]
  if (f?.exposed && e.kind === 'hanging') out.push(pick(e, seed, 'why2', ['Cuando una pieza queda en la mira, el rival no necesita ningún plan: solo la captura.', 'La pregunta clave es siempre: "¿qué le estoy dejando al rival?".']))
  return out.join(' ')
}

// ───────────── ¿Qué debí jugar? ─────────────
function best(e: MoveError, f: Facts | null, seed: number): string {
  const b = fig(e.bestSan)
  const intro = pick(e, seed, 'bi', [`La mejor era ${b}.`, `Lo que sugiere el motor es ${b}.`, `Tu mejor opción: ${b}.`, `En esa posición convenía ${b}.`])
  const why: string[] = []
  if (f?.best) {
    const x = f.best
    if (x.mate) why.push('da mate')
    else if (x.check) why.push('da jaque')
    if (x.captured) why.push(`captura ${a(x.captured)}`)
    if (x.castle) why.push(`enroca ${x.castle} y pone el rey a salvo`)
    if (x.promotes) why.push('corona un peón')
    if (x.saves) why.push(`pone a salvo ${the(x.saves.type)} en ${x.saves.square}`)
    if (x.develops) why.push('saca una pieza que seguía en casa')
  }
  const detail = why.length > 0 ? ` ${pick(e, seed, 'bd', ['Esa jugada', 'Con ella', 'Fijate que'])} ${why.join(' y ')}.` : ''
  const tail = pick(e, seed, 'bt', ['Mirá la flecha verde en el tablero.', 'Está marcada en verde sobre el tablero.', 'Probá ver por qué es mejor: movela mentalmente antes de seguir.', ''])
  return `${intro}${detail} ${tail}`.replace(/\s+/g, ' ').trim()
}

// ───────────── ¿Qué quería el rival? ─────────────
function rival(e: MoveError, f: Facts | null, seed: number): string {
  const r = f?.rival
  if (!r) return pick(e, seed, 'r0', ['No hay una jugada previa del rival para analizar: es el comienzo de la partida.', 'Acá no había una amenaza previa que mirar.'])
  const base = pick(e, seed, 'r1', [`Justo antes de tu jugada, el rival movió ${the(r.piece)} a ${r.to}`, `El rival venía de jugar ${the(r.piece)} a ${r.to}`, `La última jugada del rival fue ${the(r.piece)} a ${r.to}`])
  const extra = r.check ? ' y te daba jaque.' : r.attacks ? `, que ataca ${the(r.attacks.type)} en ${r.attacks.square}.` : pick(e, seed, 'r2', [', sin amenazar nada concreto.', ', una jugada más bien de posición.', ', sin una amenaza inmediata.'])
  const advice = r.attacks || r.check ? ' ' + pick(e, seed, 'r3', ['Esa era la amenaza que había que resolver.', 'Lo primero es siempre responder a eso.', 'Preguntate cada vez: "¿qué quiere hacer ahora?".']) : ' ' + pick(e, seed, 'r4', ['Aun así, mirá qué cambió en la posición.', 'Siempre conviene preguntarse por qué movió justo esa pieza.'])
  return `${base}${extra}${advice}`
}

// ───────────── ¿Cómo lo evito? ─────────────
const AVOID: Record<MoveError['kind'], string[]> = {
  allowedMate: ['Antes de mover: ¿qué jaques tiene el rival después de mi jugada?', 'Si tu rey está sin casillas, buscá primero una "ventanita" (un peón que se mueva) para darle aire.', 'Contá los atacantes sobre tu rey: con dos o tres piezas apuntando, cuidado.'],
  missedMate: ['Hacé la rutina "jaques primero": mirá todos los jaques propios antes de elegir.', 'Practicá mates en 1 y en 2; son el ejercicio que más rinde.', 'Si el rey rival tiene pocas casillas libres, buscá mate antes de ganar material.'],
  hanging: ['Antes de soltar la pieza, mirá qué ataca el rival y si tus piezas están defendidas.', 'Hacé un chequeo rápido: "¿alguna pieza mía queda sin defensa?".', 'Preguntate "¿qué deja colgado mi jugada?" con cada movimiento.'],
  missedTactic: ['Buscá jaques, capturas y amenazas, en ese orden, en cada jugada.', 'Los puzzles de táctica te entrenan el ojo: unos minutos por día alcanzan.', 'Si el rival dejó algo colgado, asegurate de cobrarlo antes de seguir con tu plan.'],
  opening: ['Seguí los principios: centro, desarrollo y enroque. En el repertorio tenés líneas probadas.', 'Antes de mover otra vez la misma pieza, preguntate qué pieza falta desarrollar.', 'Revisá este tipo de errores en "Aperturas": hay planes y errores típicos para cada una.'],
  endgame: ['Activá el rey y buscá peones pasados; en los finales de torres, practicá Lucena y Philidor.', 'Antes de cada jugada en un final, contá los tiempos: ¿quién llega primero?', 'Los finales se aprenden con unos pocos patrones; las lecciones de finales te los dan.'],
  positional: ['Pensá cuál es tu pieza peor ubicada y buscá mejorarla.', 'Antes de mover, compará dos o tres jugadas candidatas en vez de elegir la primera.', 'Si no hay táctica, elegí la jugada que mejore tu pieza menos activa.'],
}
function avoid(e: MoveError, _f: Facts | null, seed: number): string {
  return `${pick(e, seed, 'a1', AVOID[e.kind])} ${pick(e, seed, 'a2', ['Con práctica esto se vuelve un hábito.', 'No hace falta pensar más tiempo, sino mirar lo correcto.', 'Es un error muy común en este nivel, y se corrige.', 'Lo bueno es que ya lo detectaste: eso es la mitad del trabajo.'])}`
}

/** Respuesta a una pregunta sobre un error. `seed` cambia la redacción. */
export function coachAnswer(e: MoveError, topic: Topic, seed = 0): string {
  const f = factsOf(e)
  switch (topic) {
    case 'what':
      return what(e, f, seed)
    case 'why':
      return why(e, f, seed)
    case 'best':
      return best(e, f, seed)
    case 'rival':
      return rival(e, f, seed)
    case 'avoid':
      return avoid(e, f, seed)
  }
}

/** Explicación corta y completa (qué pasó, por qué y qué jugar). */
export function explainError(e: MoveError, seed = 0): string {
  return [coachAnswer(e, 'what', seed), coachAnswer(e, 'why', seed), coachAnswer(e, 'best', seed)].join(' ')
}
