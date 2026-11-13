import { Link } from 'react-router-dom'
import { Icon, type IconName } from './Icon'
import { Guide, type GuideName } from './Guides'
import { labelSide, NODE_CY, nodeX, ROW, segmentPath } from '../engine/learnPath'

export interface PathNode {
  id: string
  to: string
  title: string
  /** Línea chica bajo el título (resumen, «3/5», etc.). */
  sub?: string
  icon: IconName
  status: 'done' | 'partial' | 'open'
  /** Estrellas ganadas (0–3); solo se muestran en el estilo juego. */
  stars?: number
}

export interface PathSection {
  id: string
  title: string
  subtitle?: string
  /** Quién guía este tramo (solo en el estilo juego). */
  guide?: GuideName
  /** «3/12» */
  progress?: string
  nodes: PathNode[]
}

/**
 * Camino de nodos: cada tramo es una columna que serpentea con un círculo por tema. Todos los nodos están
 * abiertos; el «siguiente» lleva un aro y, en el estilo juego, a la guía del tramo al lado.
 */
export function PathMap({ sections, nextId, juego }: { sections: PathSection[]; nextId: string | null; juego: boolean }) {
  return (
    <div className="flex flex-col gap-6">
      {sections.map((s) => (
        <section key={s.id} aria-label={s.title} className="flex flex-col gap-3">
          <header className="flex items-center gap-3 rounded-2xl bg-surface p-3">
            {juego && s.guide && <Guide name={s.guide} size={56} />}
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold leading-tight">{s.title}</h2>
              {s.subtitle && <p className="text-sm text-muted">{s.subtitle}</p>}
            </div>
            {s.progress && <span className="shrink-0 rounded-full bg-surface-2 px-3 py-1 text-sm font-medium tabular-nums text-accent">{s.progress}</span>}
          </header>
          <ol className="relative m-0 list-none p-0" style={{ height: s.nodes.length * ROW }}>
            <svg
              className="pointer-events-none absolute inset-0 size-full"
              viewBox={`0 0 100 ${s.nodes.length * ROW}`}
              preserveAspectRatio="none"
              aria-hidden="true"
              focusable="false"
            >
              {s.nodes.slice(0, -1).map((n, i) => (
                <path
                  key={n.id}
                  d={segmentPath(i)}
                  fill="none"
                  stroke={n.status === 'done' ? 'var(--color-accent)' : 'var(--color-border)'}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={n.status === 'done' ? undefined : '1 14'}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
            {s.nodes.map((n, i) => (
              <Node key={n.id} n={n} i={i} isNext={n.id === nextId} guide={juego ? s.guide : undefined} juego={juego} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}

function Node({ n, i, isNext, guide, juego }: { n: PathNode; i: number; isNext: boolean; guide?: GuideName; juego: boolean }) {
  const x = nodeX(i)
  const side = labelSide(i)
  const done = n.status === 'done'
  const circle = done
    ? 'bg-accent text-accent-text border-accent'
    : n.status === 'partial'
      ? 'bg-surface text-accent border-accent'
      : 'bg-surface text-accent border-border'
  const stars = juego && done && n.stars ? n.stars : 0
  // Hacia el lado de la etiqueta cabe poco en el centro (x = 50): ahí el texto es más angosto.
  const labelW = side === 'right' && x === 50 ? '7.5rem' : '10.5rem'
  return (
    <li className="absolute" style={{ left: `${x}%`, top: i * ROW, width: 0, height: NODE_CY * 2 }}>
      {isNext && guide && (
        <span
          className="absolute"
          style={{
            top: NODE_CY - 24,
            [side === 'right' ? 'right' : 'left']: 38,
          }}
        >
          <Guide name={guide} size={48} bob />
        </span>
      )}
      <Link
        to={n.to}
        aria-label={`${n.title}${done ? ' (hecho)' : isNext ? ' (siguiente)' : ''}`}
        className="absolute left-0 top-0 block h-16 w-0 active:scale-[0.97]"
      >
        <span
          className={`absolute left-0 top-0 flex size-16 -translate-x-1/2 items-center justify-center rounded-full border-4 ${circle} ${isNext ? 'ring-4 ring-accent/30' : ''}`}
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <Icon name={n.icon} size={26} />
          {done && (
            <span
              aria-hidden="true"
              className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full border-2 border-accent bg-surface text-xs font-bold text-accent"
            >
              ✓
            </span>
          )}
        </span>
        <span
          className={`absolute top-0 flex h-16 flex-col justify-center ${side === 'right' ? 'items-start text-left' : 'items-end text-right'}`}
          style={{ width: labelW, [side === 'right' ? 'left' : 'right']: 40 }}
        >
          <span className="text-sm font-semibold leading-tight">{n.title}</span>
          {stars > 0 ? (
            <span className="text-xs text-accent" aria-label={`${stars} de 3 estrellas`}>
              {'★'.repeat(stars)}
              <span className="text-border">{'★'.repeat(3 - stars)}</span>
            </span>
          ) : isNext ? (
            <span className="text-xs font-semibold text-accent">Siguiente</span>
          ) : n.sub ? (
            <span className="text-xs leading-tight text-muted">{n.sub}</span>
          ) : null}
        </span>
      </Link>
    </li>
  )
}
