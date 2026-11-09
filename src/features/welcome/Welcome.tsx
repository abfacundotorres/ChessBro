import { setStyle, useStyleChoice, type Style } from '../../data/style'
import { setLevel, useLevelChoice } from '../../data/level'
import { LEVELS } from '../../engine/level'

const STYLES: { style: Style; title: string; icon: string; points: string[] }[] = [
  {
    style: 'juego',
    title: 'Juego',
    icon: '🎲',
    points: ['Lecciones con historias y personajes', 'Adivinanzas y mini-juegos en el tablero', 'Estrellas por lección y racha de días'],
  },
  {
    style: 'serio',
    title: 'Serio',
    icon: '📖',
    points: ['Lecciones directas, en registro técnico', 'Mismos ejercicios, sin personajes', 'Sin estrellas ni rachas: solo el avance'],
  },
]

/** Primera pantalla: dos pasos (estilo de estudio y nivel). Los dos se pueden cambiar en Ajustes. */
export function Welcome() {
  const style = useStyleChoice()
  const level = useLevelChoice()
  if (style === undefined || level === undefined) return null
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-5 px-4 py-8">
      <header>
        <div className="flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" className="size-14 rounded-2xl" width={56} height={56} />
          <h1 className="text-3xl font-bold">ChessBro</h1>
        </div>
        <p className="mt-2 text-sm text-muted">Paso {style === null ? 1 : 2} de 2</p>
      </header>
      {style === null ? <StyleStep /> : level === null ? <LevelStep /> : null}
    </div>
  )
}

function StyleStep() {
  return (
    <>
      <p className="text-lg">¿Cómo preferís estudiar?</p>
      <div className="flex flex-col gap-3" role="radiogroup" aria-label="Estilo de estudio">
        {STYLES.map((o) => (
          <button
            key={o.style}
            type="button"
            role="radio"
            aria-checked={false}
            onClick={() => void setStyle(o.style)}
            className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5 text-left active:scale-[0.99]"
          >
            <span className="flex items-center gap-3 text-xl font-bold">
              <span aria-hidden="true">{o.icon}</span>
              {o.title}
            </span>
            <ul className="list-disc pl-6 text-sm text-muted">
              {o.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-muted">El contenido es el mismo. Podés cambiarlo cuando quieras en Ajustes.</p>
    </>
  )
}

function LevelStep() {
  return (
    <>
      <p className="text-lg">¿Desde dónde empezamos?</p>
      <div className="flex flex-col gap-3" role="radiogroup" aria-label="Nivel de partida">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            type="button"
            role="radio"
            aria-checked={false}
            onClick={() => void setLevel(l.id)}
            className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-4 text-left active:scale-[0.99]"
          >
            <span className="text-lg font-bold">{l.label}</span>
            <span className="text-sm text-muted">{l.detail}</span>
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-muted">Es solo un punto de partida: se ajusta solo con lo que vayas resolviendo. Lo podés cambiar en Ajustes.</p>
    </>
  )
}
