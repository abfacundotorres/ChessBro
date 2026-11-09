/**
 * Glicko-2 (Glickman, 2012) para una sola partida por período: cada puzzle es un
 * "rival" con su rating y su RD. Escala pública (1500/350), conversión interna ×173.7178.
 */

export interface Rating {
  rating: number
  rd: number
  vol: number
}

export interface Opponent {
  rating: number
  rd: number
  /** 1 = ganó el jugador, 0 = perdió, 0.5 = tablas. */
  score: number
}

const SCALE = 173.7178
const TAU = 0.5
const EPS = 0.000001

export const RD_MIN = 45
export const RD_MAX = 350

function g(phi: number): number {
  return 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI))
}

function E(mu: number, muj: number, phij: number): number {
  return 1 / (1 + Math.exp(-g(phij) * (mu - muj)))
}

/** Actualiza el rating tras un período con los resultados dados. */
export function updateRating(player: Rating, games: readonly Opponent[], tau = TAU): Rating {
  const mu = (player.rating - 1500) / SCALE
  const phi = player.rd / SCALE
  const sigma = player.vol

  if (games.length === 0) {
    const phiStar = Math.sqrt(phi * phi + sigma * sigma)
    return { ...player, rd: Math.min(RD_MAX, phiStar * SCALE) }
  }

  let vInv = 0
  let deltaSum = 0
  for (const o of games) {
    const muj = (o.rating - 1500) / SCALE
    const phij = o.rd / SCALE
    const e = E(mu, muj, phij)
    const gj = g(phij)
    vInv += gj * gj * e * (1 - e)
    deltaSum += gj * (o.score - e)
  }
  const v = 1 / vInv
  const delta = v * deltaSum

  // Paso 5: nueva volatilidad (método de Illinois).
  const a = Math.log(sigma * sigma)
  const f = (x: number) => {
    const ex = Math.exp(x)
    const num = ex * (delta * delta - phi * phi - v - ex)
    const den = 2 * (phi * phi + v + ex) ** 2
    return num / den - (x - a) / (tau * tau)
  }
  let A = a
  let B: number
  if (delta * delta > phi * phi + v) {
    B = Math.log(delta * delta - phi * phi - v)
  } else {
    let k = 1
    while (f(a - k * tau) < 0) k++
    B = a - k * tau
  }
  let fA = f(A)
  let fB = f(B)
  for (let i = 0; i < 100 && Math.abs(B - A) > EPS; i++) {
    const C = A + ((A - B) * fA) / (fB - fA)
    const fC = f(C)
    if (fC * fB <= 0) {
      A = B
      fA = fB
    } else {
      fA = fA / 2
    }
    B = C
    fB = fC
  }
  const sigmaNew = Math.exp(A / 2)

  const phiStar = Math.sqrt(phi * phi + sigmaNew * sigmaNew)
  const phiNew = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v)
  const muNew = mu + phiNew * phiNew * deltaSum

  return {
    rating: muNew * SCALE + 1500,
    rd: phiNew * SCALE,
    vol: sigmaNew,
  }
}

/**
 * Resultado de un puzzle: aplica Glicko-2 y acota el RD a [RD_MIN, RD_MAX] para que
 * el rating siga moviéndose aunque se hayan hecho muchos puzzles.
 */
export function ratePuzzle(player: Rating, puzzle: { rating: number; rd: number }, solved: boolean): Rating {
  const next = updateRating(player, [{ rating: puzzle.rating, rd: puzzle.rd, score: solved ? 1 : 0 }])
  return { ...next, rd: Math.min(RD_MAX, Math.max(RD_MIN, next.rd)) }
}

/** Rating inicial: por debajo de 1200 online, el rating de puzzles suele rondar 1100–1400. */
export const INITIAL_RATING: Rating = { rating: 1300, rd: 300, vol: 0.06 }

/** Con RD alto el rating todavía es poco confiable ("provisional"). */
export function isProvisional(r: Rating): boolean {
  return r.rd > 110
}
