/** Estrellas de una lección según los errores cometidos. */
export function stars(mistakes: number, items: number): 1 | 2 | 3 {
  if (mistakes === 0) return 3
  // Hasta un error cada cuatro desafíos (mínimo uno) sigue siendo una muy buena pasada.
  return mistakes <= Math.max(1, Math.floor(items / 4)) ? 2 : 1
}

export function bestStars(prev: number | undefined, next: number): number {
  return Math.max(prev ?? 0, next)
}
