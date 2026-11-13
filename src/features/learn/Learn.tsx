import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { BANDS } from '../../content/curriculum'
import { LESSONS } from '../../content/lessons'
import { styledLesson } from '../../content/styled'
import { getProgress } from '../../data/lessons'
import { useLevel } from '../../data/level'
import { useStyle } from '../../data/style'
import { levelInfo } from '../../engine/level'
import { nextInOrder } from '../../engine/learnPath'
import { BAND_GUIDES } from '../../content/pathIcons'
import { Guide } from '../../ui/Guides'
import { IconTile, type IconName } from '../../ui/Icon'
import { Scene, type SceneName } from '../../ui/Scenes'

const ITEMS: { to: string; title: string; text: string; icon: IconName; scene: SceneName }[] = [
  { to: '/lecciones', title: 'Lecciones y finales', text: 'El camino de 400 a 1800.', icon: 'libro', scene: 'lecciones' },
  { to: '/aperturas', title: 'Aperturas', text: 'Entrenalas contra el rival.', icon: 'repertorio', scene: 'aperturas' },
  { to: '/tactica', title: 'Táctica', text: 'Puzzles por tema, con repaso.', icon: 'tactica', scene: 'tactica' },
  { to: '/tablero', title: 'Tablero libre', text: 'Probá ideas con los dos bandos.', icon: 'tablero', scene: 'tablero' },
]

export function Learn() {
  const juego = useStyle() === 'juego'
  const level = levelInfo(useLevel())
  const progress = useLiveQuery(() => getProgress(), [])
  const done = new Set([...(progress?.entries() ?? [])].filter(([, p]) => p.doneAt !== undefined).map(([id]) => id))
  const nextId = progress ? nextInOrder(LESSONS.map((l) => l.id), done, level.startLesson) : null
  const next = LESSONS.find((l) => l.id === nextId)
  const style = juego ? 'juego' : 'serio'

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-3xl font-bold">Aprender</h1>
        <p className="text-muted">Elegí qué estudiar. El plan de Hoy te dice por dónde empezar.</p>
      </header>

      {next && (
        <Link to={`/lecciones/${next.id}`} className="flex items-center gap-3 rounded-2xl border-2 border-accent bg-surface p-3 active:scale-[0.99]">
          {juego && <Guide name={BAND_GUIDES[next.band] ?? 'peon'} size={72} bob />}
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold uppercase tracking-wide text-accent">Seguí por acá</span>
            <span className="block font-semibold leading-tight">{styledLesson(next, style).title}</span>
            <span className="block text-sm text-muted">Elo {BANDS.find((b) => b.id === next.band)?.range}</span>
          </span>
          <span aria-hidden="true" className="text-2xl leading-none text-accent">
            ›
          </span>
        </Link>
      )}

      {juego ? (
        <div className="grid grid-cols-2 gap-3">
          {ITEMS.map((i) => (
            <Link key={i.to} to={i.to} className="flex flex-col overflow-hidden rounded-2xl bg-surface active:scale-[0.99]">
              <Scene name={i.scene} />
              <span className="p-3">
                <span className="block font-semibold leading-tight">{i.title}</span>
                <span className="block text-sm text-muted">{i.text}</span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
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
      )}

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
