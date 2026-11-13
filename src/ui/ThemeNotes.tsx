import { THEME_LIST } from '../content/themes'
import { blurbsFor } from '../content/themeBlurbs'
import { More } from './More'

const GENERIC = new Set(['endgame', 'middlegame', 'opening', 'mate'])

/** Claves de los temas de un puzzle (sin los genéricos de fase). */
export function themeKeys(mask: number): string[] {
  return THEME_LIST.filter((t) => (mask & t.bit) !== 0 && !GENERIC.has(t.key)).map((t) => t.key)
}

/** Qué es cada tema del puzzle, con «Explicame más». `max` limita cuántos temas se explican. */
export function ThemeNotes({ mask, max = 3 }: { mask: number; max?: number }) {
  return (
    <>
      {blurbsFor(themeKeys(mask))
        .slice(0, max)
        .map((b) => (
          <div key={b.key} className="flex flex-col gap-2 rounded-xl bg-surface-2 p-3">
            <p className="font-semibold">{THEME_LIST.find((t) => t.key === b.key)?.label ?? b.key}</p>
            <p>{b.text}</p>
            <More text={b.more} />
          </div>
        ))}
    </>
  )
}
