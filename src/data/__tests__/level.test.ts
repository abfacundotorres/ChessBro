import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { ChessBroDB } from '../db'
import { getLevel, setLevel } from '../level'
import { getProfile, recordAttempt } from '../tactics'
import { planSnapshot } from '../plan'
import { markLessonDone } from '../lessons'
import { markLinePracticed } from '../repertoire'
import { REPERTOIRE } from '../../content/repertoire'
import { REP_CARDS } from '../../content/repertoireCards'
import { LESSONS } from '../../content/lessons'
import { BANDS } from '../../content/curriculum'

let n = 0
let db: ChessBroDB
beforeEach(() => {
  db = new ChessBroDB(`level-${n++}`)
})

describe('nivel de partida', () => {
  it('sin elegir no hay nivel; el rating inicial de puzzles sale del nivel', async () => {
    expect(await getLevel(db)).toBeNull()
    expect((await getProfile(db)).rating).toBe(800) // nivel por defecto: hasta 800
    await setLevel('cero', db)
    expect((await getProfile(db)).rating).toBe(600)
    await setLevel('alto', db)
    expect(await getLevel(db)).toBe('alto')
    expect((await getProfile(db)).rating).toBe(1400)
  })

  it('una vez que hay un perfil guardado, el nivel ya no lo cambia', async () => {
    await setLevel('cero', db)
    const puzzle = { id: 'p', fen: '8/8/8/8/8/8/8/8 w - - 0 1', moves: ['a1a2'], rating: 700, rd: 75, themes: 0 }
    await recordAttempt({ puzzle, solved: true, mode: 'new', today: '2026-11-09' }, db)
    const after = (await getProfile(db)).rating
    await setLevel('alto', db)
    expect((await getProfile(db)).rating).toBe(after)
  })
})

describe('plan según el nivel', () => {
  it('la primera lección sugerida es de la banda de partida', async () => {
    await setLevel('cero', db)
    expect((await planSnapshot('2026-11-09', db)).input.nextLesson?.id).toBe('piezas-mov')
    await setLevel('bajo', db)
    // A quien ya conoce las reglas no se le sugieren primero los movimientos de las piezas (siguen disponibles).
    expect((await planSnapshot('2026-11-09', db)).input.nextLesson?.id).toBe('seguridad')
    await setLevel('medio', db)
    const next = (await planSnapshot('2026-11-09', db)).input.nextLesson
    const bandOf = (id: string) => BANDS.findIndex((b) => b.id === LESSONS.find((l) => l.id === id)!.band)
    expect(bandOf(next!.id)).toBeGreaterThanOrEqual(1)
  })

  it('avanza por las lecciones en orden a medida que se terminan', async () => {
    await setLevel('cero', db)
    await markLessonDone('piezas-mov', 1, db)
    expect((await planSnapshot('2026-11-09', db)).input.nextLesson?.id).toBe('reglas-esp')
  })

  it('las líneas del repertorio inicial se sugieren primero', async () => {
    const first = (await planSnapshot('2026-11-09', db)).input.nextLine
    expect(REPERTOIRE.find((l) => l.id === first!.id)?.starter).toBe(true)
    // Hasta practicar las 8 iniciales, nunca se sugiere una que no lo sea.
    for (const l of REPERTOIRE.filter((x) => x.starter)) await markLinePracticed(l, REP_CARDS, '2026-11-09', db)
    const next = (await planSnapshot('2026-11-09', db)).input.nextLine
    expect(REPERTOIRE.find((l) => l.id === next!.id)?.starter).toBeFalsy()
  })
})
