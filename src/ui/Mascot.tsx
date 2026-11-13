/**
 * «Peón»: la mascota de la app (dibujo propio, mismos colores que el ícono). Cambia la cara según el ánimo.
 */
export type Mood = 'contento' | 'sorprendido' | 'pensando'

export function Mascot({ mood = 'contento', size = 88 }: { mood?: Mood; size?: number }) {
  const ink = '#14110B'
  const gold = '#FFC21F'
  const tan = '#EDB04E'
  const deep = '#D58E26'
  const mouth =
    mood === 'sorprendido' ? (
      <ellipse cx="60" cy="53" rx="5" ry="6" fill={ink} />
    ) : mood === 'pensando' ? (
      <path d="M52 54h14" stroke={ink} strokeWidth="3.5" strokeLinecap="round" fill="none" />
    ) : (
      <path d="M50 50q10 11 20 0" stroke={ink} strokeWidth="3.5" strokeLinecap="round" fill="none" />
    )
  return (
    <svg className="bob" width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Peón, la mascota" focusable="false">
      <g stroke={ink} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
        <rect x="26" y="102" width="68" height="12" rx="6" fill={deep} />
        <path d="M36 102L84 102L78 90L42 90Z" fill={gold} />
        <path d="M46 90L74 90L70 70L50 70Z" fill={gold} />
        <rect x="38" y="62" width="44" height="12" rx="6" fill={tan} />
        <circle cx="60" cy="38" r="27" fill={gold} />
      </g>
      <circle cx="50" cy="35" r="3.6" fill={ink} />
      <circle cx="70" cy="35" r="3.6" fill={ink} />
      <circle cx="43" cy="46" r="4.5" fill="#F29B7A" opacity=".55" />
      <circle cx="77" cy="46" r="4.5" fill="#F29B7A" opacity=".55" />
      {mouth}
    </svg>
  )
}
