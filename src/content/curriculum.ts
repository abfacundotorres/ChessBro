/** Bandas del currículo (ver docs/DISEÑO.md). Contenido estático, sin lógica. */
export interface Band {
  id: string
  range: string
  focus: string[]
  exit: string
}

export const BANDS: Band[] = [
  {
    id: 'b1',
    range: '800–1100',
    focus: ['No colgar piezas (chequeo de seguridad)', 'Mate en 1 y en 2', 'Horquilla, clavada, ataque doble', 'Principios de apertura', 'Mates básicos: D+R, T+R'],
    exit: 'Puzzles ≥ 1200 y menos de 1 error grave por partida',
  },
  {
    id: 'b2',
    range: '1100–1400',
    focus: ['Descubierta, desviación, sobrecarga, eliminación del defensor', 'Finales de peones: oposición y regla del cuadrado', 'Repertorio mínimo de aperturas', 'Cálculo de jugadas forzadas: jaques, capturas, amenazas'],
    exit: 'Puzzles ≥ 1450 y mate T+R en menos de 30 jugadas',
  },
  {
    id: 'b3',
    range: '1400–1600',
    focus: ['Estructuras de peones', 'Piezas buenas y malas, planes', 'Convertir ventajas', 'Finales de torre: Lucena y Philidor'],
    exit: 'Ganar y defender Lucena/Philidor contra el motor',
  },
  {
    id: 'b4',
    range: '1600–1800',
    focus: ['Cálculo profundo', 'Profilaxis', 'Transición a finales', 'Repertorio ampliado'],
    exit: 'Puzzles ≥ 1900 y rating real en subida',
  },
]

export interface Module {
  name: string
  description: string
  /** Ruta si ya está disponible; si no, el hito en que llega. */
  to?: string
  milestone?: string
}

export const MODULES: Module[] = [
  { name: 'Táctica', description: 'Puzzles por tema y nivel, con repaso de los que fallás.', to: '/tactica' },
  { name: 'Tablero libre', description: 'Mové piezas, probá ideas, deshacé.', to: '/tablero' },
  { name: 'Tus partidas', description: 'Importá de Lichess; tus errores se vuelven ejercicios.', milestone: 'H2' },
  { name: 'Lecciones y finales', description: 'Currículo guiado y finales jugables contra el motor.', milestone: 'H3' },
  { name: 'Repertorio', description: 'Aperturas con repaso espaciado.', milestone: 'H4' },
]
