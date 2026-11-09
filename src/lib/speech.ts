import { useEffect, useState } from 'react'
import { toSpeech } from '../engine/speak'

/** Voz del navegador (speechSynthesis): sin conexión y sin dependencias. La calidad depende de las voces instaladas. */
export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'
}

const PREFERRED = ['es-AR', 'es-419', 'es-US', 'es-MX', 'es-ES']

export interface VoicePrefs {
  /** Nombre de la voz elegida; null = automática (la mejor en español). */
  voiceName: string | null
  rate: number
}

export const DEFAULT_PREFS: VoicePrefs = { voiceName: null, rate: 0.95 }

/** Voces del sistema; se actualiza cuando el navegador termina de cargarlas. */
export function useVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => (speechSupported() ? speechSynthesis.getVoices() : []))
  useEffect(() => {
    if (!speechSupported()) return
    const update = () => setVoices(speechSynthesis.getVoices())
    speechSynthesis.addEventListener('voiceschanged', update)
    return () => speechSynthesis.removeEventListener('voiceschanged', update)
  }, [])
  return voices
}

/** La mejor voz en español disponible, o null si no hay ninguna. */
export function spanishVoice(): SpeechSynthesisVoice | null {
  if (!speechSupported()) return null
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('es'))
  for (const lang of PREFERRED) {
    const v = voices.find((x) => x.lang.replace('_', '-').toLowerCase() === lang.toLowerCase())
    if (v) return v
  }
  return voices[0] ?? null
}

let token = 0

/** Lee el texto en voz alta (corta lo que estuviera sonando). Devuelve una función que lo detiene. */
export function speak(text: string, prefs: VoicePrefs = DEFAULT_PREFS, onEnd?: () => void, onStart?: () => void): () => void {
  if (!speechSupported()) return () => undefined
  speechSynthesis.cancel()
  const mine = ++token
  const u = new SpeechSynthesisUtterance(toSpeech(text))
  const chosen = prefs.voiceName ? speechSynthesis.getVoices().find((v) => v.name === prefs.voiceName) : undefined
  const voice = chosen ?? spanishVoice()
  if (voice) u.voice = voice
  u.lang = voice?.lang ?? 'es-AR'
  u.rate = prefs.rate
  const done = () => {
    if (token === mine) onEnd?.()
  }
  u.onstart = () => {
    if (token === mine) onStart?.()
  }
  u.onend = done
  u.onerror = done
  speechSynthesis.speak(u)
  return () => {
    if (token === mine) {
      token++
      speechSynthesis.cancel()
    }
  }
}

export function stopSpeaking(): void {
  if (!speechSupported()) return
  token++
  speechSynthesis.cancel()
}
