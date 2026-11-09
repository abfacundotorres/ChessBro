import { useLiveQuery } from 'dexie-react-hooks'
import { db as defaultDb, type ChessBroDB } from './db'
import { getSetting, setSetting } from './games'

/** Estilo de las lecciones: "juego" (personajes, adivinanzas, estrellas y racha) o "serio" (registro técnico). */
export type Style = 'juego' | 'serio'
export const STYLE_KEY = 'style'

export function parseStyle(v: string | null | undefined): Style | null {
  return v === 'juego' || v === 'serio' ? v : null
}

export async function getStyle(db: ChessBroDB = defaultDb): Promise<Style | null> {
  return parseStyle(await getSetting(STYLE_KEY, db))
}

export async function setStyle(style: Style, db: ChessBroDB = defaultDb): Promise<void> {
  await setSetting(STYLE_KEY, style, db)
}

/** Estilo elegido; mientras carga o si todavía no se eligió, "juego". */
export function useStyle(): Style {
  return useLiveQuery(() => getStyle(), []) ?? 'juego'
}

/** undefined = cargando; null = todavía no eligió (hay que mostrar la bienvenida). */
export function useStyleChoice(): Style | null | undefined {
  return useLiveQuery(() => getStyle(), [], undefined)
}
