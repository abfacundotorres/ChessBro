import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { BANDS } from '../../content/curriculum'
import { currentBand, type CheckState } from '../../engine/diagnosis'
import { isProvisional } from '../../engine/glicko2'
import { db } from '../../data/db'
import { getProfile } from '../../data/tactics'
import { summarize } from '../../data/games'
import { useLevel } from '../../data/level'
import { levelInfo } from '../../engine/level'
import { endgameStats } from '../../data/lessons'

const ICON: Record<CheckState, string> = { ok: '✓', todo: '○', nodata: '…', pending: '·' }
const TONE: Record<CheckState, string> = { ok: 'text-accent', todo: '', nodata: 'text-muted', pending: 'text-muted' }

export function Diagnosis() {
  const level = useLevel()
  const data = useLiveQuery(async () => {
    const [profile, games, eg] = await Promise.all([getProfile(), db.games.toArray(), endgameStats()])
    return { profile, summary: summarize(games), endgameBest: Object.fromEntries([...eg].map(([k, v]) => [k, v.bestClean])) }
  }, [])
  if (!data) return null
  const { profile, summary, endgameBest } = data
  const { index, checks } = currentBand(BANDS, {
    puzzleRating: profile.rating,
    puzzleProvisional: isProvisional(profile),
    blundersPerGame: summary?.blundersPerGame ?? null,
    analyzedGames: summary?.analyzed ?? 0,
    endgameBest,
  }, levelInfo(level).startBand)
  const band = BANDS[index]!

  return (
    <section className="flex flex-col gap-2 rounded-xl border border-accent bg-surface p-4">
      <p className="text-sm text-muted">Tu banda actual</p>
      <p className="text-xl font-bold">Elo {band.range}</p>
      <p className="text-sm">Foco: {band.focus.slice(0, 2).join(' · ')}</p>
      <ul className="mt-1 flex flex-col gap-1 text-sm">
        {checks.map((c) => (
          <li key={c.label} className="flex gap-2">
            <span className={`w-4 shrink-0 text-center ${TONE[c.state]}`}>{ICON[c.state]}</span>
            <span>
              {c.label} <span className="text-muted">({c.detail})</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-1 grid grid-cols-2 gap-2">
        <Link to="/tactica" className="btn-primary flex items-center justify-center">
          Táctica
        </Link>
        <Link to="/partidas" className="btn flex items-center justify-center">
          Partidas
        </Link>
      </div>
    </section>
  )
}
