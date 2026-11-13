/**
 * Lógica pura de los mapas de camino (Lecciones y Aperturas): dónde cae cada nodo y cuál es «el siguiente».
 * Los nodos están todos abiertos; «siguiente» solo es una sugerencia.
 */

/** Alto de una fila del camino, en px. */
export const ROW = 96
/** Altura del centro del círculo dentro de su fila, en px (el círculo mide 64). */
export const NODE_CY = 32

/** Posición horizontal (0–100, en % del ancho) del nodo i: serpentea entre izquierda, centro y derecha. */
const XS = [50, 74, 50, 26] as const
export function nodeX(i: number): number {
  return XS[((i % XS.length) + XS.length) % XS.length]!
}

/** De qué lado del círculo va la etiqueta: hacia donde hay más lugar (en el centro, a la derecha). */
export function labelSide(i: number): 'left' | 'right' {
  return nodeX(i) > 50 ? 'left' : 'right'
}

/**
 * Primer id sin hacer, empezando en `startId` (el nivel de partida elegido) y, si no queda nada de ahí en adelante,
 * desde el principio. Devuelve null si está todo hecho.
 */
export function nextInOrder(ids: readonly string[], done: ReadonlySet<string>, startId?: string): string | null {
  const from = Math.max(0, startId ? ids.indexOf(startId) : 0)
  return ids.slice(from).find((id) => !done.has(id)) ?? ids.find((id) => !done.has(id)) ?? null
}

/** Cuántos nodos de una lista están hechos, para el «3/12» del encabezado de cada tramo. */
export function countDone(ids: readonly string[], done: ReadonlySet<string>): number {
  return ids.filter((id) => done.has(id)).length
}

/** Trazo S entre el nodo i y el i+1 (coordenadas del viewBox 0 0 100 · alto de la sección). */
export function segmentPath(i: number): string {
  const x0 = nodeX(i)
  const x1 = nodeX(i + 1)
  const y0 = i * ROW + NODE_CY
  const y1 = (i + 1) * ROW + NODE_CY
  const h = ROW / 2
  return `M${x0} ${y0}C${x0} ${y0 + h} ${x1} ${y1 - h} ${x1} ${y1}`
}
