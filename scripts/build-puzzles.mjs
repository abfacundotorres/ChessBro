// Genera el subset de puzzles empaquetado en public/puzzles/ a partir de la base de Lichess (CC0).
//
// 1. Descargar https://database.lichess.org/lichess_db_puzzle.csv.zst a data-raw/
// 2. Descomprimir: zstd -d --long=31 data-raw/lichess_db_puzzle.csv.zst
// 3. node scripts/build-puzzles.mjs [data-raw/lichess_db_puzzle.csv]
//
// Criterio: puzzles confiables (RD bajo, populares, muy jugados) y, para cada franja de
// 100 puntos de rating, los más jugados en general más los más jugados de cada tema.
// Cada solución se verifica con chess.js. La salida es determinística.
import { createReadStream, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { Chess } from 'chess.js'

const SRC = process.argv[2] ?? 'data-raw/lichess_db_puzzle.csv'
const OUT = new URL('../public/puzzles/', import.meta.url)
const THEMES = JSON.parse(readFileSync(new URL('../src/content/themes.json', import.meta.url), 'utf8'))

const MIN_RATING = 400
const MAX_RATING = 2400 // exclusivo
const BUCKET = 100
const CHUNK = 200
const PER_BUCKET = 450
const PER_THEME_BUCKET = 50
const MAX_RD = 80
const MIN_POPULARITY = 80
const MIN_PLAYS = 300

if (THEMES.length > 31) throw new Error('Más de 31 temas: no entran en la máscara de bits')
const lichessToBit = new Map()
THEMES.forEach((t, i) => t.lichess.forEach((k) => lichessToBit.set(k, 1 << i)))

/** Mantiene los K mejores por clave (más jugadas; desempate por id) con poda amortizada. */
class TopK {
  constructor(k) { this.k = k; this.map = new Map() }
  add(key, item) {
    let arr = this.map.get(key)
    if (!arr) this.map.set(key, (arr = []))
    arr.push(item)
    if (arr.length > this.k * 4) this.map.set(key, top(arr, this.k))
  }
  all() { return [...this.map.values()].flatMap((a) => top(a, this.k)) }
}
const cmp = (a, b) => b.plays - a.plays || (a.id < b.id ? -1 : 1)
const top = (arr, k) => arr.sort(cmp).slice(0, k)

const general = new TopK(PER_BUCKET)
const byTheme = new TopK(PER_THEME_BUCKET)
let rows = 0
let kept = 0

const rl = createInterface({ input: createReadStream(SRC), crlfDelay: Infinity })
for await (const line of rl) {
  if (rows++ === 0) continue
  const c = line.split(',')
  const rating = Number(c[3])
  const rd = Number(c[4])
  const popularity = Number(c[5])
  const plays = Number(c[6])
  if (rating < MIN_RATING || rating >= MAX_RATING || rd > MAX_RD || popularity < MIN_POPULARITY || plays < MIN_PLAYS) continue
  let bits = 0
  for (const t of c[7].split(' ')) bits |= lichessToBit.get(t) ?? 0
  const item = { id: c[0], fen: c[1], moves: c[2], rating, rd, bits, plays }
  const bucket = Math.floor(rating / BUCKET)
  general.add(bucket, item)
  for (let i = 0; i < THEMES.length; i++) if (bits & (1 << i)) byTheme.add(`${i}:${bucket}`, item)
  kept++
}

const selected = new Map()
for (const p of [...general.all(), ...byTheme.all()]) selected.set(p.id, p)

// Verificación: todas las jugadas legales.
let invalid = 0
for (const [id, p] of selected) {
  try {
    const chess = new Chess(p.fen)
    for (const uci of p.moves.split(' ')) chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
  } catch {
    selected.delete(id)
    invalid++
  }
}

const list = [...selected.values()].sort((a, b) => a.rating - b.rating || (a.id < b.id ? -1 : 1))
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })
const chunks = []
for (let lo = MIN_RATING; lo < MAX_RATING; lo += CHUNK) {
  const items = list.filter((p) => p.rating >= lo && p.rating < lo + CHUNK)
  if (items.length === 0) continue
  const file = `p${String(lo).padStart(4, '0')}.json`
  // Formato compacto: [id, fen, jugadas UCI, rating, rd, máscara de temas]
  writeFileSync(new URL(file, OUT), JSON.stringify(items.map((p) => [p.id, p.fen, p.moves, p.rating, p.rd, p.bits])))
  chunks.push({ file, min: lo, max: lo + CHUNK, count: items.length })
}
const themeCounts = THEMES.map((t, i) => ({ key: t.key, count: list.filter((p) => p.bits & (1 << i)).length }))
writeFileSync(
  new URL('index.json', OUT),
  JSON.stringify({ version: 1, source: 'Lichess puzzle database (CC0)', themes: THEMES.map((t) => t.key), chunks }, null, 1),
)
console.log(`filas: ${rows - 1}, pasan el filtro: ${kept}, elegidos: ${list.length}, inválidos: ${invalid}`)
console.log(chunks.map((c) => `${c.file}:${c.count}`).join(' '))
console.log(themeCounts.map((t) => `${t.key}:${t.count}`).join(' '))
