import { useLiveQuery } from 'dexie-react-hooks'
import { getSetting, setSetting } from './games'
import { DEFAULT_PREFS, type VoicePrefs } from '../lib/speech'

export const AUTO_SPEAK = 'autoSpeak'

/** ¿Leer solo cada explicación? (Ajustes). */
export function useAutoSpeak(): boolean {
  return useLiveQuery(() => getSetting(AUTO_SPEAK), [], null) === '1'
}

export function setAutoSpeak(on: boolean): Promise<void> {
  return setSetting(AUTO_SPEAK, on ? '1' : null)
}

export const VOICE_NAME = 'voiceName'
export const VOICE_RATE = 'voiceRate'

/** Voz y velocidad elegidas en Ajustes. */
export function useVoicePrefs(): VoicePrefs {
  const name = useLiveQuery(() => getSetting(VOICE_NAME), [], null)
  const rate = useLiveQuery(() => getSetting(VOICE_RATE), [], null)
  const r = rate ? Number.parseFloat(rate) : NaN
  return { voiceName: name, rate: Number.isFinite(r) && r >= 0.5 && r <= 1.6 ? r : DEFAULT_PREFS.rate }
}

export function setVoiceName(name: string | null): Promise<void> {
  return setSetting(VOICE_NAME, name)
}

export function setVoiceRate(rate: number): Promise<void> {
  return setSetting(VOICE_RATE, String(rate))
}
