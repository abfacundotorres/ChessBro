import { Link } from 'react-router-dom'
import { BANDS, MODULES } from '../../content/curriculum'

export function Home() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">ChessBro</h1>
        <p className="text-muted">De lo básico a 1800, a tu ritmo.</p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Módulos</h2>
        {MODULES.map((m) =>
          m.to ? (
            <Link key={m.name} to={m.to} className="rounded-xl border border-accent bg-surface p-4 active:scale-[0.99]">
              <p className="font-semibold">{m.name}</p>
              <p className="text-sm text-muted">{m.description}</p>
            </Link>
          ) : (
            <div key={m.name} className="rounded-xl border border-border bg-surface p-4 opacity-70">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{m.name}</p>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">Próximamente · {m.milestone}</span>
              </div>
              <p className="text-sm text-muted">{m.description}</p>
            </div>
          ),
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">El camino</h2>
        {BANDS.map((b) => (
          <details key={b.id} className="rounded-xl bg-surface p-4">
            <summary className="cursor-pointer font-semibold">Elo {b.range}</summary>
            <ul className="mt-2 list-disc pl-5 text-sm">
              {b.focus.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-muted">Para avanzar: {b.exit}.</p>
          </details>
        ))}
      </section>
    </div>
  )
}
