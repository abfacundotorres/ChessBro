import { setStyle, type Style } from '../../data/style'

const OPTIONS: { style: Style; title: string; icon: string; points: string[] }[] = [
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

/** Primera pantalla: elegir el estilo de las lecciones. Se puede cambiar en Ajustes. */
export function Welcome() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-5 px-4 py-8">
      <header>
        <h1 className="text-3xl font-bold">ChessBro</h1>
        <p className="mt-2 text-muted">Antes de empezar: ¿cómo preferís estudiar?</p>
      </header>
      <div className="flex flex-col gap-3" role="radiogroup" aria-label="Estilo de estudio">
        {OPTIONS.map((o) => (
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
    </div>
  )
}
