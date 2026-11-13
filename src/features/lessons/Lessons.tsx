import { useLiveQuery } from 'dexie-react-hooks'
import { BANDS } from '../../content/curriculum'
import { ENDGAMES } from '../../content/endgames'
import { LESSONS } from '../../content/lessons'
import { styledLesson } from '../../content/styled'
import { useStyle } from '../../data/style'
import { useLevel } from '../../data/level'
import { endgameStats, getProgress } from '../../data/lessons'
import { levelInfo } from '../../engine/level'
import { countDone, nextInOrder } from '../../engine/learnPath'
import { StreakChip } from '../../ui/StreakChip'
import { PathMap, type PathSection } from '../../ui/PathMap'
import { BAND_GUIDES, lessonIcon } from '../../content/pathIcons'

export function Lessons() {
  const progress = useLiveQuery(() => getProgress(), [])
  const stats = useLiveQuery(() => endgameStats(), [])
  const style = useStyle()
  const level = levelInfo(useLevel())
  const juego = style === 'juego'

  const doneIds = new Set([...(progress?.entries() ?? [])].filter(([, p]) => p.doneAt !== undefined).map(([id]) => id))
  const nextId = progress ? nextInOrder(LESSONS.map((l) => l.id), doneIds, level.startLesson) : null

  const sections: PathSection[] = BANDS.flatMap((band) => {
    const lessons = LESSONS.filter((l) => l.band === band.id)
    if (lessons.length === 0) return []
    return [
      {
        id: band.id,
        title: `Elo ${band.range}`,
        subtitle: band.focus[0],
        guide: BAND_GUIDES[band.id],
        progress: `${countDone(lessons.map((l) => l.id), doneIds)}/${lessons.length}`,
        nodes: lessons.map((base) => {
          const l = styledLesson(base, style)
          const p = progress?.get(l.id)
          const solved = p?.exercises.length ?? 0
          const done = p?.doneAt !== undefined
          return {
            id: l.id,
            to: `/lecciones/${l.id}`,
            title: l.title,
            sub: !done && solved > 0 ? `${solved}/${l.exercises.length} ejercicios` : undefined,
            icon: lessonIcon(l.id),
            status: done ? ('done' as const) : solved > 0 ? ('partial' as const) : ('open' as const),
            stars: p?.stars,
          }
        }),
      },
    ]
  })

  const won = new Set(ENDGAMES.filter((e) => (stats?.get(e.id)?.wins ?? 0) > 0).map((e) => e.id))
  sections.push({
    id: 'finales',
    title: 'Finales para jugar',
    subtitle: 'Contra el motor. Con pista no cuenta para tu progreso.',
    guide: 'rey',
    progress: `${countDone(ENDGAMES.map((e) => e.id), won)}/${ENDGAMES.length}`,
    nodes: ENDGAMES.map((e) => {
      const s = stats?.get(e.id)
      return {
        id: e.id,
        to: `/finales/${e.id}`,
        title: e.title,
        sub: s ? `${s.wins}/${s.attempts} ganadas` : e.summary,
        icon: 'bandera' as const,
        status: won.has(e.id) ? ('done' as const) : s ? ('partial' as const) : ('open' as const),
      }
    }),
  })

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-bold">Lecciones</h1>
        <p className="text-muted">{juego ? 'Seguí el camino: leé, adiviná, practicá y ganá estrellas.' : 'Leé, practicá y avanzá a la siguiente.'}</p>
        <div className="mt-2">
          <StreakChip />
        </div>
      </header>
      <PathMap sections={sections} nextId={nextId} juego={juego} />
    </div>
  )
}
