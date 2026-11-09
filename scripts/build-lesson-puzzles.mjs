// Elige los ejercicios tácticos de las lecciones (src/content/lessonPuzzles.json) entre los
// puzzles más populares y fáciles de cada tema de la base de Lichess (CC0).
// Uso: node scripts/build-lesson-puzzles.mjs [data-raw/lichess_db_puzzle.csv]
// Criterio: RD bajo, mucha popularidad y partidas jugadas, 1 o 2 jugadas del usuario, y rating
// dentro del rango del tema. Salida determinística. Cada puzzle se verifica con chess.js.
import { createReadStream, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { Chess } from 'chess.js'

const SRC = process.argv[2] ?? 'data-raw/lichess_db_puzzle.csv'
const OUT = new URL('../src/content/lessonPuzzles.json', import.meta.url)

// tema de Lichess → [rating mínimo, máximo, cantidad]
const WANT = {
  hangingPiece: [500, 900, 8],
  fork: [500, 900, 4],
  pin: [600, 1000, 4],
  skewer: [600, 1000, 3],
  discoveredAttack: [800, 1200, 4],
  deflection: [900, 1300, 3],
  capturingDefender: [900, 1300, 3],
  attraction: [900, 1300, 3],
  trappedPiece: [800, 1200, 3],
  mateIn2: [500, 900, 4],
  doubleCheck: [900, 1300, 2],
  advancedPawn: [500, 1100, 3],
}

const best = Object.fromEntries(Object.keys(WANT).map((k) => [k, []]))
const rl = createInterface({ input: createReadStream(SRC), crlfDelay: Infinity })
let n = 0
for await (const line of rl) {
  if (n++ === 0) continue
  const c = line.split(',')
  const rating = Number(c[3])
  const rd = Number(c[4])
  const pop = Number(c[5])
  const plays = Number(c[6])
  if (rd > 80 || pop < 85 || plays < 1000) continue
  const moves = c[2].split(' ')
  if (moves.length !== 2 && moves.length !== 4) continue
  const themes = c[7].split(' ')
  for (const [t, [lo, hi]] of Object.entries(WANT)) {
    if (!themes.includes(t) || rating < lo || rating > hi) continue
    // Un solo motivo por puzzle: evita ejemplos mezclados que confunden la lección.
    const motifs = themes.filter((x) => Object.hasOwn(WANT, x) && x !== 'mateIn2')
    if (motifs.length > 1 && t !== 'mateIn2') continue
    best[t].push({ id: c[0], fen: c[1], moves, rating, pop, plays })
  }
}

const out = {}
// Un puzzle no puede aparecer en dos temas (las lecciones no deben repetir ejercicios).
const taken = new Set()
for (const [t, [, , count]] of Object.entries(WANT)) {
  const list = best[t].filter((p) => !taken.has(p.id)).sort((a, b) => b.pop - a.pop || b.plays - a.plays || (a.id < b.id ? -1 : 1))
  const picked = []
  for (const p of list) {
    const chess = new Chess(p.fen)
    try {
      chess.move({ from: p.moves[0].slice(0, 2), to: p.moves[0].slice(2, 4), promotion: p.moves[0][4] })
      const start = chess.fen()
      for (const u of p.moves.slice(1)) chess.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] })
      picked.push({ id: p.id, fen: start, line: p.moves.slice(1), rating: p.rating })
    } catch {
      continue
    }
    taken.add(p.id)
    if (picked.length === count) break
  }
  picked.sort((a, b) => a.rating - b.rating)
  out[t] = picked
}
writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n')
console.log(Object.entries(out).map(([k, v]) => `${k}:${v.length}(${v.map((p) => p.rating).join(',')})`).join(' '))
