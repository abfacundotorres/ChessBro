/**
 * Viñetas del hub «Aprender» (dibujos propios). Usan solo los tokens de color del tema, así que se adaptan al modo oscuro.
 */
export type SceneName = 'lecciones' | 'aperturas' | 'tactica' | 'tablero'

const A = 'var(--color-accent)'
const B = 'var(--color-border)'
const S = 'var(--color-surface)'
const R = 'var(--color-rival)'
const T = 'var(--color-text)'

function Lecciones() {
  return (
    <>
      <path d="M60 18C50 12 34 12 22 16v38c12-4 28-4 38 2z" fill={S} stroke={T} strokeWidth="3" strokeLinejoin="round" />
      <path d="M60 18c10-6 26-6 38-2v38c-12-4-28-4-38 2z" fill={S} stroke={T} strokeWidth="3" strokeLinejoin="round" />
      <path d="M30 26h22M30 34h22M30 42h16M68 26h22M68 34h22" stroke={B} strokeWidth="3" strokeLinecap="round" />
      <path d="M86 4l3 7 7 .6-5.4 4.6 1.6 7.4-6.2-3.8-6.2 3.8 1.6-7.4L76 11.6l7-.6z" fill={R} stroke={T} strokeWidth="2" strokeLinejoin="round" />
    </>
  )
}

function Aperturas() {
  const sq = []
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) sq.push(<rect key={`${r}${c}`} x={18 + c * 14} y={8 + r * 14} width="14" height="14" fill={(r + c) % 2 ? A : S} />)
  return (
    <>
      <g stroke={T} strokeWidth="2.5">{sq}</g>
      <path d="M46 50V36" stroke={R} strokeWidth="5" strokeLinecap="round" />
      <path d="M38 40l8-10 8 10z" fill={R} stroke={R} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="46" cy="50" r="5" fill={T} />
      <circle cx="74" cy="22" r="5" fill={S} stroke={T} strokeWidth="2.5" />
    </>
  )
}

function Tactica() {
  return (
    <>
      <circle cx="46" cy="32" r="24" fill={S} stroke={T} strokeWidth="3" />
      <circle cx="46" cy="32" r="15" fill="none" stroke={A} strokeWidth="5" />
      <circle cx="46" cy="32" r="6" fill={R} />
      <path d="M92 6L72 36h14l-6 22 22-34H88z" fill={R} stroke={T} strokeWidth="3" strokeLinejoin="round" />
    </>
  )
}

function Tablero() {
  const sq = []
  for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) sq.push(<rect key={`${r}${c}`} x={12 + c * 12} y={8 + r * 12} width="12" height="12" fill={(r + c) % 2 ? A : S} />)
  return (
    <>
      <g stroke={T} strokeWidth="2">{sq}</g>
      <circle cx="42" cy="26" r="7" fill={S} stroke={T} strokeWidth="3" />
      <circle cx="78" cy="38" r="7" fill={T} stroke={T} strokeWidth="3" />
      <path d="M50 30l20 6" stroke={R} strokeWidth="3" strokeLinecap="round" strokeDasharray="1 7" />
    </>
  )
}

const DRAW = { lecciones: Lecciones, aperturas: Aperturas, tactica: Tactica, tablero: Tablero } as const

export function Scene({ name }: { name: SceneName }) {
  const Draw = DRAW[name]
  return (
    <svg className="h-20 w-full bg-surface-2" viewBox="0 0 120 64" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <Draw />
    </svg>
  )
}
