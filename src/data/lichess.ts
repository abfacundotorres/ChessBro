import { z } from 'zod'
import { sanLineToUci, START_FEN, type Color } from '../engine/game'

const player = z
  .object({
    user: z.object({ name: z.string(), id: z.string() }).optional(),
    rating: z.number().optional(),
    aiLevel: z.number().optional(),
  })
  .loose()

export const lichessGameSchema = z
  .object({
    id: z.string(),
    rated: z.boolean().optional(),
    variant: z.string(),
    speed: z.string(),
    createdAt: z.number(),
    status: z.string(),
    players: z.object({ white: player, black: player }),
    winner: z.enum(['white', 'black']).optional(),
    initialFen: z.string().optional(),
    moves: z.string().optional(),
    opening: z.object({ eco: z.string(), name: z.string() }).loose().optional(),
  })
  .loose()

export interface GamePlayer {
  name: string
  rating: number | null
}

/** Partida importada y normalizada (jugadas en UCI). */
export interface ImportedGame {
  id: string
  /** De dónde vino (las partidas viejas no lo traen: son de Lichess). */
  source?: 'lichess' | 'chesscom'
  createdAt: number
  speed: string
  rated: boolean
  status: string
  white: GamePlayer
  black: GamePlayer
  winner: 'white' | 'black' | null
  me: Color
  startFen: string
  moves: string[]
  opening: string | null
}

function playerOf(p: z.infer<typeof player>): GamePlayer {
  return { name: p.user?.name ?? (p.aiLevel ? `Stockfish nivel ${p.aiLevel}` : 'Anónimo'), rating: p.rating ?? null }
}

/**
 * Convierte una línea ndjson de la API de Lichess en una partida importable.
 * Devuelve null si no sirve para analizar (variante, abortada, sin jugadas, no es del usuario).
 */
export function parseLichessGame(raw: unknown, username: string): ImportedGame | null {
  const r = lichessGameSchema.safeParse(raw)
  if (!r.success) return null
  const g = r.data
  if (g.variant !== 'standard' && g.variant !== 'fromPosition') return null
  if (['created', 'started', 'aborted', 'noStart'].includes(g.status)) return null
  const sans = (g.moves ?? '').trim().split(/\s+/).filter(Boolean)
  if (sans.length < 4) return null
  const u = username.toLowerCase()
  const me: Color | null = g.players.white.user?.id === u ? 'w' : g.players.black.user?.id === u ? 'b' : null
  if (!me) return null
  const startFen = g.initialFen && g.initialFen !== 'startpos' ? g.initialFen : START_FEN
  const moves = sanLineToUci(startFen, sans)
  if (!moves) return null
  return {
    id: g.id,
    source: 'lichess',
    createdAt: g.createdAt,
    speed: g.speed,
    rated: g.rated ?? false,
    status: g.status,
    white: playerOf(g.players.white),
    black: playerOf(g.players.black),
    winner: g.winner ?? null,
    me,
    startFen,
    moves,
    opening: g.opening?.name ?? null,
  }
}

export function parseNdjson(text: string, username: string): ImportedGame[] {
  const out: ImportedGame[] = []
  for (const line of text.split('\n')) {
    if (!line.trim()) continue
    try {
      const g = parseLichessGame(JSON.parse(line), username)
      if (g) out.push(g)
    } catch {
      /* línea inválida: se ignora */
    }
  }
  return out
}

export const USERNAME_RE = /^[a-zA-Z0-9_-]{2,30}$/

/** Descarga las últimas partidas (sin bullet ni ultrabullet: muy rápidas para aprender). */
export async function fetchLichessGames(username: string, max = 20, signal?: AbortSignal): Promise<ImportedGame[]> {
  if (!USERNAME_RE.test(username)) throw new Error('Usuario de Lichess inválido.')
  const params = new URLSearchParams({
    max: String(max),
    moves: 'true',
    opening: 'true',
    perfType: 'blitz,rapid,classical,correspondence',
    finished: 'true',
  })
  const res = await fetch(`https://lichess.org/api/games/user/${encodeURIComponent(username)}?${params}`, {
    headers: { Accept: 'application/x-ndjson' },
    signal,
  })
  if (res.status === 404) throw new Error('No encontré ese usuario en Lichess.')
  if (res.status === 429) throw new Error('Lichess pidió esperar un minuto. Probá de nuevo en un rato.')
  if (!res.ok) throw new Error(`Lichess respondió ${res.status}.`)
  return parseNdjson(await res.text(), username)
}
