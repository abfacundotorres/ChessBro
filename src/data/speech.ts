import { useLiveQuery } from 'dexie-react-hooks'
import { getSetting, setSetting } from './games'

export const AUTO_SPEAK = 'autoSpeak'

/** ¿Leer solo cada explicación? (Ajustes). */
export function useAutoSpeak(): boolean {
  return useLiveQuery(() => getSetting(AUTO_SPEAK), [], null) === '1'
}

export function setAutoSpeak(on: boolean): Promise<void> {
  return setSetting(AUTO_SPEAK, on ? '1' : null)
}
