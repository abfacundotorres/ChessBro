import { describe, expect, it } from 'vitest'
import { LESSONS } from '../lessons'
import { SERIO } from '../lessonsSerias'
import { styledLesson } from '../styled'

// Palabras del estilo lúdico que no deben aparecer en el estilo serio.
const PLAYFUL = ['Solitario', 'Gemelos', 'Corredor', 'Rezagado', 'mercado', 'relevos', 'Miedoso', 'balcón', 'cazador', 'Bienvenido', 'duermen', 'dormid', 'Pegajosos', 'pesadilla']

describe('estilo serio', () => {
  const ids = Object.keys(SERIO)

  it('cada lección lúdica tiene su versión seria, con un texto por paso', () => {
    expect(ids.sort()).toEqual(['balanza', 'carrera', 'cerrar', 'peones', 'piezas', 'refugio', 'torre'])
    for (const id of ids) {
      const lesson = LESSONS.find((l) => l.id === id)!
      expect(Object.keys(SERIO[id]!.steps).map(Number).sort(), id).toEqual(lesson.steps.map((_, i) => i))
    }
  })

  it('no queda ningún personaje ni metáfora lúdica en el estilo serio', () => {
    for (const id of ids) {
      const l = styledLesson(LESSONS.find((x) => x.id === id)!, 'serio')
      const texts = [l.title, l.summary, ...l.steps.flatMap((s) => [s.title ?? '', s.text, ...(s.challenge ? [s.challenge.why, 'question' in s.challenge ? s.challenge.question : s.challenge.prompt] : [])])]
      for (const t of texts) for (const w of PLAYFUL) expect(t.includes(w), `${id}: "${w}" en "${t.slice(0, 60)}"`).toBe(false)
    }
  })

  it('cambia los textos pero no las posiciones ni las respuestas', () => {
    for (const id of ids) {
      const base = LESSONS.find((l) => l.id === id)!
      const serio = styledLesson(base, 'serio')
      expect(serio.exercises).toEqual(base.exercises)
      base.steps.forEach((s, i) => {
        const t = serio.steps[i]!
        expect(t.fen).toBe(s.fen)
        if (s.challenge && t.challenge) {
          expect(t.challenge.kind).toBe(s.challenge.kind)
          if (s.challenge.kind === 'choice' && t.challenge.kind === 'choice') {
            expect(t.challenge.options).toEqual(s.challenge.options)
            expect(t.challenge.answer).toBe(s.challenge.answer)
          }
          if (s.challenge.kind === 'tap' && t.challenge.kind === 'tap') expect(t.challenge.answer).toEqual(s.challenge.answer)
          if (s.challenge.kind === 'move' && t.challenge.kind === 'move') expect(t.challenge.answer).toBe(s.challenge.answer)
        }
      })
    }
  })

  it('el estilo juego devuelve la lección original, y las lecciones sin versión seria no cambian', () => {
    const l = LESSONS.find((x) => x.id === 'peones')!
    expect(styledLesson(l, 'juego')).toBe(l)
    const plain = LESSONS.find((x) => x.id === 'mate1')!
    expect(styledLesson(plain, 'serio')).toBe(plain)
  })

  it('los textos serios son sustanciales', () => {
    for (const s of Object.values(SERIO)) for (const st of Object.values(s.steps)) expect(st.text.length).toBeGreaterThan(40)
  })
})
