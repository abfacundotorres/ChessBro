import type { GuideName } from '../ui/Guides'
import type { IconName } from '../ui/Icon'

/** Quién guía cada banda del currículo (solo en el estilo juego). */
export const BAND_GUIDES: Record<string, GuideName> = { b0: 'peon', b1: 'caballo', b2: 'alfil', b3: 'torre', b4: 'dama' }

/** Ícono de cada lección según de qué trata (las que no están aquí usan el libro). */
export const LESSON_ICONS: Record<string, IconName> = {
  'piezas-mov': 'peon',
  'reglas-esp': 'peon',
  'jaque-mate': 'corona',
  mate1: 'corona',
  'mate-dama': 'corona',
  mate2: 'corona',
  'mate-torre': 'corona',
  seguridad: 'escudo',
  balanza: 'escudo',
  refugio: 'escudo',
  profilaxis: 'escudo',
  carrera: 'rayo',
  horquilla: 'rayo',
  clavada: 'rayo',
  ensartada: 'rayo',
  descubierta: 'rayo',
  desviacion: 'rayo',
  defensor: 'rayo',
  atrapada: 'rayo',
  calculo: 'rayo',
  peones: 'peon',
  cuadrado: 'peon',
  oposicion: 'peon',
  torre: 'torre',
  'torre-final': 'torre',
  lucena: 'torre',
  philidor: 'torre',
  apertura: 'repertorio',
  'mi-primera-apertura': 'repertorio',
  'aperturas-negras': 'repertorio',
  trampas: 'repertorio',
  cerrar: 'bandera',
  transicion: 'bandera',
}
export const lessonIcon = (id: string): IconName => LESSON_ICONS[id] ?? 'libro'
