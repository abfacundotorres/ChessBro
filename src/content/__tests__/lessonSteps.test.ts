// H27: lo que los pasos de lectura de las lecciones afirman sobre sus diagramas, comprobado con chess.js.
// Las evaluaciones de finales (única jugada que gana o que salva) las dio Stockfish con `src/test/evalfens.test.ts`
// y quedan anotadas en docs/DECISIONES.md; acá se fija lo que chess.js puede comprobar solo.
import { describe, expect, it } from 'vitest'
import { Chess, type Square } from 'chess.js'
import { LESSONS, type LessonStep } from '../lessons'
import { SERIO } from '../lessonsSerias'

function step(id: string, n: number): LessonStep {
  const s = LESSONS.find((l) => l.id === id)?.steps[n - 1]
  if (!s) throw new Error(`no existe ${id}#${n}`)
  return s
}
function board(id: string, n: number): Chess {
  const s = step(id, n)
  if (!s.fen) throw new Error(`${id}#${n} no tiene diagrama`)
  return new Chess(s.fen)
}
/** La misma posición, pero con el otro bando al turno (para preguntar qué podría hacer). */
function flipped(fen: string): Chess {
  const p = fen.split(' ')
  p[1] = p[1] === 'w' ? 'b' : 'w'
  p[3] = '-'
  return new Chess(p.join(' '))
}
const sans = (c: Chess) => c.moves()
const after = (c: Chess, san: string) => {
  const d = new Chess(c.fen())
  d.move(san)
  return d
}

describe('pasos de lectura: flechas y casillas', () => {
  it('cada flecha es una jugada posible, una jugada recién hecha o la continuación de otra flecha', () => {
    for (const l of LESSONS) {
      l.steps.forEach((s, i) => {
        if (!s.fen || !s.arrows) return
        const c = new Chess(s.fen)
        const other = flipped(s.fen)
        const seen = new Set<string>()
        for (const a of s.arrows) {
          const has = (x: Chess) => x.moves({ verbose: true }).some((m) => m.from === a.from && m.to === a.to)
          const justPlayed = !c.get(a.from as Square) && !!c.get(a.to as Square)
          const ok = has(c) || has(other) || justPlayed || seen.has(a.from)
          expect(ok, `${l.id}#${i + 1}: flecha ${a.from}→${a.to}`).toBe(true)
          seen.add(a.to)
        }
      })
    }
  })

  it('las jugadas con figura que nombra el texto existen en el diagrama (para alguno de los dos bandos)', () => {
    const LETTER: Record<string, string> = { '♔': 'K', '♕': 'Q', '♖': 'R', '♗': 'B', '♘': 'N', '♚': 'K', '♛': 'Q', '♜': 'R', '♝': 'B', '♞': 'N' }
    // Jugadas que el texto cuenta como ya hechas o como plan para más adelante (no salen de la posición del diagrama).
    const SKIP = new Set(['seguridad#4:Nf6', 'mi-primera-apertura#3:Nf3', 'mi-primera-apertura#4:Bc4', 'mi-primera-apertura#4:Nc6', 'mi-primera-apertura#5:Bc5', 'aperturas-negras#2:Bc5', 'trampas#5:Bg4'])
    for (const l of LESSONS) {
      l.steps.forEach((s, i) => {
        if (!s.fen) return
        const texts = [s.text, SERIO[l.id]?.steps[i]?.text ?? ''].join(' ')
        const legal = new Set([...sans(new Chess(s.fen)), ...sans(flipped(s.fen))].map((m) => m.replace(/[+#]/g, '')))
        for (const m of texts.matchAll(/([♔♕♖♗♘♚♛♜♝♞])(x?[a-h][1-8])/g)) {
          const san = LETTER[m[1]!]! + m[2]!
          if (SKIP.has(`${l.id}#${i + 1}:${san}`)) continue
          expect(legal.has(san), `${l.id}#${i + 1}: ${m[0]} no es posible en el diagrama`).toBe(true)
        }
      })
    }
  })
})

describe('pasos de lectura: afirmaciones concretas', () => {
  it('reglas: al paso, jaque, mate y ahogado son lo que dice el texto', () => {
    expect(sans(board('reglas-esp', 3))).toContain('exd6')
    expect(board('jaque-mate', 1).isCheck()).toBe(true)
    expect(board('jaque-mate', 1).isCheckmate()).toBe(false)
    expect(board('jaque-mate', 2).isCheckmate()).toBe(true)
    expect(board('jaque-mate', 4).isStalemate()).toBe(true)
  })

  it('seguridad: ♕h5 es posible, el caballo de f6 la captura y ataca e4', () => {
    const c = board('seguridad', 4)
    expect(c.attackers('e4', 'b')).toEqual(['f6'])
    expect(sans(c)).toContain('Qh5')
    expect(sans(after(c, 'Qh5'))).toContain('Nxh5')
  })

  it('mate en 1: las tres flechas son mate', () => {
    expect(after(board('mate1', 2), 'Rd8#').isCheckmate()).toBe(true)
    expect(after(board('mate1', 3), 'Rg8#').isCheckmate()).toBe(true)
    expect(after(board('mate1', 4), 'Nf7#').isCheckmate()).toBe(true)
  })

  it('mate de dama: ♕c7 ahoga', () => {
    expect(after(board('mate-dama', 2), 'Qc7').isStalemate()).toBe(true)
  })

  it('primera apertura y trampas: f7 solo lo protege el rey; los mates son mates; la clavada de Légal existe', () => {
    for (const [id, n] of [['mi-primera-apertura', 4], ['trampas', 3]] as const) {
      expect(board(id, n).attackers('f7', 'b'), `${id}#${n}`).toEqual(['e8'])
    }
    expect(board('mi-primera-apertura', 4).attackers('f7', 'w')).toEqual(['c4'])
    expect(board('mi-primera-apertura', 3).attackers('e5', 'w')).toEqual(['f3'])
    expect(after(board('trampas', 2), 'Qh4#').isCheckmate()).toBe(true)
    expect(board('trampas', 3).attackers('f7', 'w').sort()).toEqual(['c4', 'h5'])
    expect(after(board('trampas', 3), 'Qxf7#').isCheckmate()).toBe(true)
    // Légal: el alfil de g4 ataca al caballo de f3 y, detrás, e2 está vacía y la dama en d1.
    const legal = board('trampas', 5)
    expect(legal.attackers('f3', 'b')).toContain('g4')
    expect(legal.get('e2')).toBeFalsy()
    expect(legal.get('d1')).toMatchObject({ type: 'q', color: 'w' })
  })

  it('apertura#3: el diagrama del enroque no tiene las torres conectadas (el texto ya no lo dice)', () => {
    const c = board('apertura', 3)
    expect(c.get('c1')).toMatchObject({ type: 'b' })
    for (const l of LESSONS) for (const s of l.steps) expect(s.text, l.id).not.toMatch(/conect(a|ás|ar) las torres/)
  })

  it('horquilla: ♘c7+ da jaque, ataca la torre de a8 y nadie captura el caballo', () => {
    const c = after(board('horquilla', 2), 'Nc7+')
    expect(c.isCheck()).toBe(true)
    expect(c.attackers('a8', 'w')).toEqual(['c7'])
    expect(c.attackers('c7', 'b')).toEqual([])
  })

  it('cuadrado: el peón corona en 3 y solo ♔d1 y ♔d2 entran al cuadrado', () => {
    const s = step('cuadrado', 2)
    const square = step('cuadrado', 1).highlights!
    expect(square).toHaveLength(16)
    const c = new Chess(s.fen!)
    expect(c.get('a4')).toMatchObject({ type: 'p', color: 'b' })
    const entering = c.moves({ verbose: true }).filter((m) => square.includes(m.to)).map((m) => m.to).sort()
    expect(entering).toEqual(['d1', 'd2'])
  })

  it('oposición: reyes enfrentados con una casilla en el medio; ♔d6 queda en la sexta, una fila por delante del peón', () => {
    const c = board('oposicion', 1)
    expect(c.get('e4')).toMatchObject({ type: 'k', color: 'w' })
    expect(c.get('e6')).toMatchObject({ type: 'k', color: 'b' })
    const d = board('oposicion', 2)
    expect(d.get('e5')).toMatchObject({ type: 'p', color: 'w' })
    expect(sans(d)).toContain('Kd6')
    expect(step('oposicion', 2).arrows).toEqual([{ from: 'c5', to: 'd6', kind: 'good' }])
    expect(step('oposicion', 4).arrows).toEqual([{ from: 'g5', to: 'f6', kind: 'good' }])
  })

  it('Lucena y Philidor: el corte de la torre y la muralla de la sexta', () => {
    const l = flipped(step('lucena', 1).fen!)
    // El rey negro (f7) no puede pasar a la columna e: la corta la torre de e1.
    expect(l.moves({ verbose: true }).filter((m) => m.piece === 'k').every((m) => m.to[0] !== 'e')).toBe(true)
    expect(board('lucena', 1).get('d8')).toMatchObject({ type: 'k', color: 'w' })
    expect(sans(board('lucena', 2))).toContain('Re4')
    // Philidor: la torre de a6 controla toda la sexta fila; el rey blanco (d5) no puede pisarla.
    const p = flipped(step('philidor', 1).fen!)
    for (const f of 'bcdefgh') expect(board('philidor', 1).attackers(`${f}6` as Square, 'b'), `${f}6`).toContain('a6')
    expect(p.moves({ verbose: true }).filter((m) => m.piece === 'k').every((m) => m.to[1] !== '6')).toBe(true)
  })

  it('transición: el peón de a4 es pasado y está lejos de los demás', () => {
    const c = board('transicion', 2)
    expect(c.get('a4')).toMatchObject({ type: 'p', color: 'w' })
    for (const sq of ['a5', 'a6', 'a7', 'b5', 'b6', 'b7'] as Square[]) expect(c.get(sq), sq).toBeFalsy()
    expect(step('transicion', 2).text).toContain('el resto de sus peones')
  })
})
