/** Íconos propios (rellenos, 24×24) para la barra de pestañas y las tarjetas. Sin dependencias. */
const PATHS = {
  hoy: 'M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3z',
  aprender: 'M4 5h7a3 3 0 013 3v12a2 2 0 00-2-2H4zM20 5h-7a3 3 0 00-3 3v12a2 2 0 012-2h8z',
  partidas: 'M5 4h14v3H5zM7 9h10v2H7zM7 13h10l1 7H6z',
  ajustes:
    'M12 8a4 4 0 100 8 4 4 0 000-8zm9 4l-2-.6a7 7 0 00-.6-1.4l1-1.8-2-2-1.8 1a7 7 0 00-1.4-.6L13 3h-2l-.6 2.6a7 7 0 00-1.4.6l-1.8-1-2 2 1 1.8a7 7 0 00-.6 1.4L3 11v2l2.6.6a7 7 0 00.6 1.4l-1 1.8 2 2 1.8-1a7 7 0 001.4.6L11 21h2l.6-2.6a7 7 0 001.4-.6l1.8 1 2-2-1-1.8a7 7 0 00.6-1.4z',
  tactica: 'M12 2l3 7 7 .6-5.4 4.6L18.2 22 12 18.2 5.8 22l1.6-7.8L2 9.6 9 9z',
  libro: 'M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3zM8 8h8v2H8z',
  tablero: 'M3 3h6v6H3zm12 0h6v6h-6zM9 9h6v6H9zM3 15h6v6H3zm12 0h6v6h-6z',
  repertorio: 'M6 3h12v18l-6-4-6 4z',
  progreso: 'M4 20V11h4v9zm6 0V4h4v16zm6 0v-6h4v6z',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} />
    </svg>
  )
}

/** Ícono en un cuadrito redondeado, para las filas y tarjetas. */
export function IconTile({ name }: { name: IconName }) {
  return (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-accent">
      <Icon name={name} />
    </span>
  )
}

/** Ícono según a dónde lleva una tarea o un acceso. */
export function iconForRoute(to: string): IconName {
  if (to.startsWith('/tactica')) return 'tactica'
  if (to.startsWith('/lecciones') || to.startsWith('/finales')) return 'libro'
  if (to.startsWith('/partidas')) return 'partidas'
  if (to.startsWith('/repertorio')) return 'repertorio'
  if (to.startsWith('/tablero')) return 'tablero'
  return 'aprender'
}
