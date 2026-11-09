import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseChunk, type PuzzleIndex } from '../puzzles'
import { revealSolution, startPuzzle } from '../../engine/puzzle'
import THEMES from '../../content/themes.json'

const dir = new URL('../../../public/puzzles/', import.meta.url)
const index = JSON.parse(readFileSync(new URL('index.json', dir), 'utf8')) as PuzzleIndex

describe('puzzles empaquetados', () => {
  it('el índice usa los mismos temas, en el mismo orden, que themes.json', () => {
    expect(index.themes).toEqual(THEMES.map((t) => t.key))
  })

  it('cada chunk entra en el precache del service worker (< 2 MB)', () => {
    for (const c of index.chunks) expect(readFileSync(new URL(c.file, dir)).length).toBeLessThan(2 * 1024 * 1024)
  })

  it('todas las soluciones son jugables de punta a punta', () => {
    let total = 0
    const ids = new Set<string>()
    for (const c of index.chunks) {
      const puzzles = parseChunk(JSON.parse(readFileSync(new URL(c.file, dir), 'utf8')))
      expect(puzzles).toHaveLength(c.count)
      for (const p of puzzles) {
        expect(p.rating >= c.min && p.rating < c.max).toBe(true)
        expect(ids.has(p.id)).toBe(false)
        ids.add(p.id)
        const done = revealSolution(startPuzzle(p))
        expect(done.played).toHaveLength(p.moves.length)
        total++
      }
    }
    expect(total).toBeGreaterThan(15000)
  }, 60_000)
})
