import { toSpeech } from '../engine/speak'

/** Voz del navegador (speechSynthesis): sin conexión y sin dependencias. La calidad depende de las voces instaladas. */
export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'
}

const PREFERRED = ['es-AR', 'es-419', 'es-US', 'es-MX', 'es-ES']

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
export function speak(text: string, onEnd?: () => void, onStart?: () => void): () => void {
  if (!speechSupported()) return () => undefined
  speechSynthesis.cancel()
  const mine = ++token
  const u = new SpeechSynthesisUtterance(toSpeech(text))
  const voice = spanishVoice()
  if (voice) u.voice = voice
  u.lang = voice?.lang ?? 'es-AR'
  u.rate = 0.95
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
