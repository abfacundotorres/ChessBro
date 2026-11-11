import { describe, expect, it } from 'vitest'
import { moveTags } from '../moveTags'

describe('moveTags', () => {
  it('lee las etiquetas de la notación', () => {
    expect(moveTags('e4')).toEqual([])
    expect(moveTags('Nxe5')).toEqual(['Captura'])
    expect(moveTags('Qxf7#')).toEqual(['Captura', 'Mate'])
    expect(moveTags('Bb5+')).toEqual(['Jaque'])
    expect(moveTags('O-O')).toEqual(['Enroque'])
    expect(moveTags('O-O-O+')).toEqual(['Enroque', 'Jaque'])
    expect(moveTags('exd8=Q+')).toEqual(['Captura', 'Coronación', 'Jaque'])
  })
})
