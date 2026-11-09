import { useEffect, useRef, useState } from 'react'
import { speak, speechSupported, stopSpeaking } from '../lib/speech'
import { useAutoSpeak } from '../data/speech'

/**
 * Botón "Escuchar" para un texto. Con `auto`, y si en Ajustes está activada la lectura automática,
 * lo lee solo cada vez que cambia el texto. Si el navegador no tiene voz, no se muestra nada.
 */
export function Speak({ text, auto = false, className = '' }: { text: string; auto?: boolean; className?: string }) {
  const [playing, setPlaying] = useState(false)
  const stop = useRef<(() => void) | null>(null)
  const autoOn = useAutoSpeak()

  function start() {
    stop.current?.()
    setPlaying(true)
    stop.current = speak(text, () => setPlaying(false))
  }

  useEffect(() => {
    if (auto && autoOn && speechSupported()) {
      stop.current?.()
      stop.current = speak(text, () => setPlaying(false), () => setPlaying(true))
    }
    return () => {
      stop.current?.()
      stop.current = null
    }
  }, [text, auto, autoOn])

  if (!speechSupported()) return null
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center gap-1 self-start rounded-full bg-surface-2 px-3 text-sm ${className}`}
      aria-label={playing ? 'Parar la lectura' : 'Escuchar'}
      aria-pressed={playing}
      onClick={() => {
        if (playing) {
          stopSpeaking()
          stop.current = null
          setPlaying(false)
        } else start()
      }}
    >
      <span aria-hidden="true">{playing ? '⏹' : '🔊'}</span>
      {playing ? 'Parar' : 'Escuchar'}
    </button>
  )
}
