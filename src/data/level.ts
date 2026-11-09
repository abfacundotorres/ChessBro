import { useLiveQuery } from 'dexie-react-hooks'
import { DEFAULT_LEVEL, parseLevel, type Level } from '../engine/level'
import { db as defaultDb, type ChessBroDB } from './db'
import { getSetting, setSetting } from './games'

export const LEVEL_KEY = 'level'

/** Nivel elegido, o null si todavía no eligió. */
export async function getLevel(db: ChessBroDB = defaultDb): Promise<Level | null> {
  return parseLevel(await getSetting(LEVEL_KEY, db))
}

export async function setLevel(level: Level, db: ChessBroDB = defaultDb): Promise<void> {
  await setSetting(LEVEL_KEY, level, db)
}

/** Nivel elegido; mientras carga o si no eligió, el nivel por defecto. */
export function useLevel(): Level {
  return useLiveQuery(() => getLevel(), []) ?? DEFAULT_LEVEL
}

/** undefined = cargando; null = todavía no eligió. */
export function useLevelChoice(): Level | null | undefined {
  return useLiveQuery(() => getLevel(), [], undefined)
}
