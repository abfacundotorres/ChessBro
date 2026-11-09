import { describe, expect, it } from 'vitest'
import { toSpeech } from '../speak'
import { explainError } from '../commentary'
import type { MoveError } from '../analysis'

describe('toSpeech', () => {
  it('lee piezas y casillas', () => {
    expect(toSpeech('♘f3')).toBe('caballo f3')
    expect(toSpeech('Jugá Cf3 y Ab5')).toBe('Jugá caballo f3 y alfil b5')
  })
  it('lee capturas, enroques y jaques', () => {
    expect(toSpeech('Axc6')).toBe('alfil captura c6')
    expect(toSpeech('exd5')).toBe('peón e captura d5')
    expect(toSpeech('O-O y O-O-O')).toBe('enroque corto y enroque largo')
    expect(toSpeech('Dh5+ y Dxf7#')).toBe('dama h5 jaque y dama captura f7 mate')
  })
  it('lee la numeración y las marcas de calidad', () => {
    expect(toSpeech('1.e4 e5')).toContain('jugada 1, e4')
    expect(toSpeech('9. g3??')).toContain('error grave')
  })
  it('saca emojis y símbolos', () => {
    const t = toSpeech('¡Muy bien! 🎉 ★★ ·')
    expect(t).not.toMatch(/🎉|★|·/)
    expect(t).toContain('¡Muy bien!')
  })
})

const err = (kind: MoveError['kind'], severity: MoveError['severity'] = 'blunder'): MoveError => ({
  ply: 8, san: 'g3', bestUci: 'b1c3', bestSan: 'Nc1', severity, kind, winLoss: 31.4, fenBefore: '', prevUci: null, fenBeforePrev: null,
})

describe('explainError', () => {
  it.each(['allowedMate', 'missedMate', 'hanging', 'missedTactic', 'opening', 'endgame', 'positional'] as const)('%s nombra tu jugada y la mejor', (k) => {
    const t = explainError(err(k))
    expect(t).toContain('g3')
    expect(t).toContain('♘c1')
  })
  it('cuenta los puntos perdidos solo si no es una imprecisión', () => {
    expect(explainError(err('hanging'))).toContain('31 puntos')
    expect(explainError(err('positional', 'inaccuracy'))).not.toContain('puntos')
  })
})
