import { describe, expect, it } from 'vitest'
import { coachAnswer, explainError, TOPICS } from '../commentary'
import type { MoveError } from '../analysis'

// Blancas: dama d1, rey e1. Negras: peón c6, rey e8. Qd5?? deja la dama a tiro del peón c6, sin defensa.
const HANG: MoveError = {
  ply: 20, san: 'Qd5', bestUci: 'e1e2', bestSan: 'Ke2', severity: 'blunder', kind: 'hanging', winLoss: 45,
  fenBefore: '4k3/8/2p5/8/8/8/8/3QK3 w - - 0 1', prevUci: 'c7c6', fenBeforePrev: '4k3/2p5/8/8/8/8/8/3QK3 b - - 0 1',
}
// Qxd5 captura un peón
const CAPTURE: MoveError = { ...HANG, san: 'Qd2', bestUci: 'd1d5', bestSan: 'Qxd5', fenBefore: '4k3/8/2p5/3p4/8/8/8/3QK3 w - - 0 1', kind: 'missedTactic', severity: 'mistake', winLoss: 15 }

describe('entrenador: comentarios', () => {
  it('detecta la pieza que quedó atacada y sin defensa', () => {
    const t = coachAnswer(HANG, 'what')
    expect(t).toMatch(/dama en d5/)
    expect(t).toMatch(/sin ninguna defensa|sin defensa/)
  })
  it('describe la mejor jugada con hechos de la posición', () => {
    expect(coachAnswer(CAPTURE, 'best')).toMatch(/captura un peón/)
  })
  it('describe la jugada previa del rival', () => {
    expect(coachAnswer(HANG, 'rival')).toMatch(/peón a c6/)
  })
  it('responde las cinco preguntas y cambia la redacción con la semilla', () => {
    for (const t of TOPICS) expect(coachAnswer(HANG, t.key).length).toBeGreaterThan(30)
    const variants = new Set([0, 1, 2, 3, 4, 5, 6, 7].map((s) => coachAnswer(HANG, 'what', s)))
    expect(variants.size).toBeGreaterThanOrEqual(4)
    const whyVariants = new Set([0, 1, 2, 3, 4, 5].map((s) => coachAnswer(HANG, 'why', s)))
    expect(whyVariants.size).toBeGreaterThanOrEqual(2)
  })
  it('es determinístico', () => {
    expect(coachAnswer(HANG, 'what', 3)).toBe(coachAnswer(HANG, 'what', 3))
  })
  it('no se cae con errores guardados sin posición', () => {
    const e = { ...HANG, fenBefore: '', prevUci: null, fenBeforePrev: null }
    for (const t of TOPICS) expect(() => coachAnswer(e, t.key, 2)).not.toThrow()
    expect(explainError(e)).toContain('♕d5')
  })
  it.each(['allowedMate', 'missedMate', 'hanging', 'missedTactic', 'opening', 'endgame', 'positional'] as const)('%s: todas las preguntas', (kind) => {
    for (const t of TOPICS) for (let s = 0; s < 4; s++) expect(coachAnswer({ ...HANG, kind }, t.key, s)).toBeTruthy()
  })
})
