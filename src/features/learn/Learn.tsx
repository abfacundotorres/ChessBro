import { Link } from 'react-router-dom'
import { BANDS } from '../../content/curriculum'
import { IconTile, type IconName } from '../../ui/Icon'

const ITEMS: { to: string; title: string; text: string; icon: IconName }[] = [
  { to: '/lecciones', title: 'Lecciones y finales', text: 'El currículo paso a paso, de 400 a 1800.', icon: 'libro' },
  { to: '/aperturas', title: 'Aperturas', text: 'Entrená cada apertura jugando contra el rival.', icon: 'repertorio' },
  { to: '/tactica', title: 'Táctica', text: 'Puzzles por tema, con repaso de los que fallás.', icon: 'tactica' },
  { to: '/tablero', title: 'Tablero libre', text: 'Mové las piezas de los dos bandos y probá ideas.', icon: 'tablero' },
]

export function Learn() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-3xl font-bold">Aprender</h1>
        <p className="text-muted">Elegí qué estudiar. El plan de Hoy te dice por dónde empezar.</p>
      </header>
      <div className="flex flex-col gap-2">
        {ITEMS.map((i) => (
          <Link key={i.to} to={i.to} className="flex items-center gap-3 rounded-2xl bg-surface p-4 active:scale-[0.99]">
            <IconTile name={i.icon} />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{i.title}</span>
              <span className="block text-sm text-muted">{i.text}</span>
            </span>
            <span aria-hidden="true" className="text-2xl leading-none text-muted">
              ›
            </span>
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
