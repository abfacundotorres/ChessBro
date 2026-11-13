import { Mascot, type Mood } from './Mascot'

/**
 * Las seis piezas que guían el camino (dibujos propios, mismo estilo y colores que el Peón de `Mascot`).
 * Solo se usan en el estilo «juego». Son decorativas: el texto de al lado dice todo.
 */
export type GuideName = 'peon' | 'caballo' | 'alfil' | 'torre' | 'dama' | 'rey'

export const GUIDE_LABEL: Record<GuideName, string> = {
  peon: 'Peón',
  caballo: 'Caballo',
  alfil: 'Alfil',
  torre: 'Torre',
  dama: 'Dama',
  rey: 'Rey',
}

const INK = '#14110B'
const GOLD = '#FFC21F'
const TAN = '#EDB04E'
const DEEP = '#D58E26'

function Face({ ex = [50, 70], ey, my, mood }: { ex?: [number, number]; ey: number; my: number; mood: Mood }) {
  const mouth =
    mood === 'sorprendido' ? (
      <ellipse cx="60" cy={my + 3} rx="4.5" ry="5.5" fill={INK} />
    ) : mood === 'pensando' ? (
      <path d={`M53 ${my + 3}h14`} stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
    ) : (
      <path d={`M51 ${my}q9 10 18 0`} stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
    )
  return (
    <>
      <circle cx={ex[0]} cy={ey} r="3.4" fill={INK} />
      <circle cx={ex[1]} cy={ey} r="3.4" fill={INK} />
      <circle cx={ex[0] - 7} cy={ey + 10} r="4.2" fill="#F29B7A" opacity=".55" />
      <circle cx={ex[1] + 7} cy={ey + 10} r="4.2" fill="#F29B7A" opacity=".55" />
      {mouth}
    </>
  )
}

/** Pedestal común: base y cintura. */
function Pedestal() {
  return (
    <>
      <rect x="26" y="102" width="68" height="12" rx="6" fill={DEEP} />
      <path d="M36 102L84 102L78 88L42 88Z" fill={GOLD} />
    </>
  )
}

function Torre({ mood }: { mood: Mood }) {
  return (
    <>
      <g stroke={INK} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
        <Pedestal />
        <path d="M46 88L74 88L71 68L49 68Z" fill={GOLD} />
        <path d="M32 70V22H46V32H54V22H66V32H74V22H88V70Z" fill={GOLD} />
        <rect x="28" y="64" width="64" height="12" rx="6" fill={TAN} />
      </g>
      <Face ey={44} my={52} mood={mood} />
    </>
  )
}

function Alfil({ mood }: { mood: Mood }) {
  return (
    <>
      <g stroke={INK} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
        <Pedestal />
        <path d="M46 88L74 88L71 70L49 70Z" fill={GOLD} />
        <path d="M60 16C86 30 88 54 76 68H44C32 54 34 30 60 16Z" fill={GOLD} />
        <circle cx="60" cy="11" r="6.5" fill={TAN} />
        <rect x="36" y="64" width="48" height="12" rx="6" fill={TAN} />
      </g>
      <path d="M56 26L68 38" stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" />
      <Face ey={46} my={54} mood={mood} />
    </>
  )
}

function Dama({ mood }: { mood: Mood }) {
  return (
    <>
      <g stroke={INK} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
        <Pedestal />
        <path d="M44 88L76 88L72 72L48 72Z" fill={GOLD} />
        <path d="M33 50L26 18L45 32L60 10L75 32L94 18L87 50Z" fill={GOLD} />
        <circle cx="26" cy="15" r="5" fill={TAN} />
        <circle cx="60" cy="7" r="5" fill={TAN} />
        <circle cx="94" cy="15" r="5" fill={TAN} />
        <circle cx="60" cy="52" r="22" fill={GOLD} />
        <rect x="34" y="68" width="52" height="12" rx="6" fill={TAN} />
      </g>
      <Face ey={50} my={58} mood={mood} />
    </>
  )
}

function Rey({ mood }: { mood: Mood }) {
  return (
    <>
      <g stroke={INK} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
        <Pedestal />
        <path d="M44 88L76 88L72 72L48 72Z" fill={GOLD} />
        <path d="M55 26V6a5 5 0 0110 0V26" fill={TAN} />
        <path d="M48 14H72" fill="none" stroke={INK} strokeWidth="13" />
        <path d="M48 14H72" fill="none" stroke={TAN} strokeWidth="4" />
        <circle cx="60" cy="52" r="23" fill={GOLD} />
        <rect x="34" y="68" width="52" height="12" rx="6" fill={TAN} />
      </g>
      <Face ey={50} my={58} mood={mood} />
    </>
  )
}

function Caballo({ mood }: { mood: Mood }) {
  return (
    <>
      <g stroke={INK} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
        <Pedestal />
        <path d="M40 90C38 72 48 64 54 54C46 56 40 62 32 60C26 58 24 52 28 46L44 24L46 10L58 20C72 16 86 26 90 44C94 60 90 76 86 90Z" fill={GOLD} />
        <path d="M70 22C80 30 84 44 82 58" fill="none" stroke={DEEP} strokeWidth="5" />
      </g>
      <circle cx="56" cy="36" r="3.4" fill={INK} />
      <circle cx="37" cy="52" r="2.2" fill={INK} />
      <circle cx="48" cy="50" r="4.2" fill="#F29B7A" opacity=".55" />
      {mood === 'sorprendido' ? (
        <ellipse cx="38" cy="58" rx="3" ry="3.4" fill={INK} />
      ) : mood === 'pensando' ? (
        <path d="M33 59h8" stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none" />
      ) : (
        <path d="M32 57q5 6 11 1" stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none" />
      )}
    </>
  )
}

const DRAW = { torre: Torre, alfil: Alfil, dama: Dama, rey: Rey, caballo: Caballo } as const

/**
 * Una guía sobre su medallón verde pastel (el del ícono de la app): el contorno oscuro de los dibujos
 * no se vería sobre el fondo del tema oscuro.
 */
export function Guide({ name, size = 72, mood = 'contento', bob = false }: { name: GuideName; size?: number; mood?: Mood; bob?: boolean }) {
  const inner = Math.round(size * 0.86)
  const Draw = name === 'peon' ? null : DRAW[name]
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: 'linear-gradient(160deg,#E3F3E1,#BFDFC4)' }}
    >
      {Draw ? (
        <svg className={bob ? 'bob' : undefined} width={inner} height={inner} viewBox="0 0 120 120" focusable="false">
          <Draw mood={mood} />
        </svg>
      ) : (
        <Mascot mood={mood} size={inner} />
      )}
    </span>
  )
}
