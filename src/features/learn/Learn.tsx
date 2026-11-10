import { Link } from 'react-router-dom'
import { BANDS } from '../../content/curriculum'

const ITEMS = [
  { to: '/lecciones', title: 'Lecciones y finales', text: 'El currículo paso a paso, de 400 a 1800.' },
  { to: '/aperturas', title: 'Aperturas', text: 'Entrená cada apertura jugando contra el rival.' },
  { to: '/tactica', title: 'Táctica', text: 'Puzzles por tema, con repaso de los que fallás.' },
  { to: '/tablero', title: 'Tablero libre', text: 'Mové las piezas de los dos bandos y probá ideas.' },
]

export function Learn() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold">Aprender</h1>
        <p className="text-muted">Elegí qué estudiar. El plan de Hoy te dice por dónde empezar.</p>
      </header>
      <div className="flex flex-col gap-2">
        {ITEMS.map((i) => (
          <Link key={i.to} to={i.to} className="rounded-xl border border-accent bg-surface p-4 active:scale-[0.99]">
            <p className="font-semibold">{i.title}</p>
            <p className="text-sm text-muted">{i.text}</p>
          </Link>
        ))}
      </div>
      <details className="rounded-xl bg-surface p-4 text-sm">
        <summary className="cursor-pointer font-semibold">El camino: 400 → 1800</summary>
        <div className="mt-2 flex flex-col gap-3">
          {BANDS.map((b) => (
            <div key={b.id}>
              <p className="font-semibold">Elo {b.range}</p>
              <ul className="list-disc pl-5">
                {b.focus.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <p className="mt-1 text-muted">Para avanzar: {b.exit}.</p>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}
