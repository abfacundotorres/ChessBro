import type { Puzzle } from '../engine/puzzle'
import { chunksFor } from '../engine/selection'

export interface PuzzleChunk {
  file: string
  min: number
  max: number
  count: number
}

export interface PuzzleIndex {
  version: number
  themes: string[]
  chunks: PuzzleChunk[]
}

type RawPuzzle = [string, string, string, number, number, number]

const base = () => import.meta.env.BASE_URL
let indexPromise: Promise<PuzzleIndex> | null = null
const chunkCache = new Map<string, Promise<Puzzle[]>>()

export function parseChunk(raw: unknown): Puzzle[] {
  if (!Array.isArray(raw)) throw new Error('Chunk de puzzles inválido')
  return (raw as RawPuzzle[]).map(([id, fen, moves, rating, rd, themes]) => ({
    id,
    fen,
    moves: moves.split(' '),
    rating,
    rd,
    themes,
  }))
}

export function loadIndex(): Promise<PuzzleIndex> {
  indexPromise ??= fetch(`${base()}puzzles/index.json`).then((r) => {
    if (!r.ok) throw new Error(`No se pudo cargar el índice de puzzles (${r.status})`)
    return r.json() as Promise<PuzzleIndex>
  })
  return indexPromise
}

function loadChunk(c: PuzzleChunk): Promise<Puzzle[]> {
  let p = chunkCache.get(c.file)
  if (!p) {
    p = fetch(`${base()}puzzles/${c.file}`)
      .then((r) => {
        if (!r.ok) throw new Error(`No se pudo cargar ${c.file} (${r.status})`)
        return r.json()
      })
      .then(parseChunk)
    p.catch(() => chunkCache.delete(c.file))
    chunkCache.set(c.file, p)
  }
  return p
}

/** Puzzles de los archivos cercanos al rating dado. */
export async function loadPoolFor(rating: number): Promise<Puzzle[]> {
  const index = await loadIndex()
  const lists = await Promise.all(chunksFor(index.chunks, rating).map(loadChunk))
  return lists.flat()
}
