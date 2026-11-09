import { z } from 'zod'
import { sanLineToUci, START_FEN, type Color } from '../engine/game'
import type { GamePlayer, ImportedGame } from './lichess'

const player = z
  .object({ username: z.string(), rating: z.number().optional(), result: z.string() })
  .loose()

export const chesscomGameSchema = z
  .object({
    url: z.string(),
    pgn: z.string().optional(),
    time_class: z.string(),
    rules: z.string(),
    rated: z.boolean().optional(),
    end_time: z.number(),
    initial_setup: z.string().optional(),
    eco: z.string().optional(),
    white: player,
    black: player,
  })
  .loose()

/** Chess.com acepta 3–25 caracteres: letras, números, guion y guion bajo. */
export const CHESSCOM_USERNAME_RE = /^[a-zA-Z0-9_-]{3,25}$/

/** Jugadas en SAN a partir del PGN de Chess.com (sin comentarios, relojes ni numeración). */
export function pgnMoves(pgn: string): string[] {
  const body = pgn.replace(/^(\[[^\]]*\]\s*)+/, '')
  return body
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\$\d+/g, ' ')
    .replace(/\d+\.(\.\.)?/g, ' ')
    .split(/\s+/)
    .filter((t) => t && !['1-0', '0-1', '1/2-1/2', '*'].includes(t))
}

/** Nombre de la apertura desde la URL de ECO ("Italian-Game-Two-Knights-4.Ng5" → "Italian Game Two Knights"). */
export function openingFromEco(url: string | undefined): string | null {
  if (!url) return null
  const slug = url.split('/openings/')[1]
  if (!slug) return null
  const words = decodeURIComponent(slug).split('-')
  const cut = words.findIndex((w) => /^\d+\./.test(w))
  const name = (cut === -1 ? words : words.slice(0, cut)).join(' ').trim()
  return name || null
}

function statusOf(white: string, black: string): string {
  const loser = white === 'win' ? black : black === 'win' ? white : null
  if (!loser) return white === 'stalemate' || black === 'stalemate' ? 'stalemate' : 'draw'
  switch (loser) {
    case 'checkmated':
      return 'mate'
    case 'resigned':
      return 'resign'
    case 'timeout':
      return 'outoftime'
    default:
      return loser
  }
}

/** Convierte una partida de la API de Chess.com. Null si no sirve (variante, sin jugadas, ajena). */
export function parseChesscomGame(raw: unknown, username: string): ImportedGame | null {
  const r = chesscomGameSchema.safeParse(raw)
  if (!r.success) return null
  const g = r.data
  if (g.rules !== 'chess' || !g.pgn) return null
  const u = username.toLowerCase()
  const me: Color | null = g.white.username.toLowerCase() === u ? 'w' : g.black.username.toLowerCase() === u ? 'b' : null
  if (!me) return null
  const sans = pgnMoves(g.pgn)
  if (sans.length < 4) return null
  const startFen = g.initial_setup && g.initial_setup.length > 0 ? g.initial_setup : START_FEN
  const moves = sanLineToUci(startFen, sans)
  if (!moves) return null
  const toPlayer = (p: z.infer<typeof player>): GamePlayer => ({ name: p.username, rating: p.rating ?? null })
  return {
    id: `cc-${g.url.split('/').pop()}`,
    source: 'chesscom',
    createdAt: g.end_time * 1000,
    speed: g.time_class,
    rated: g.rated ?? false,
    status: statusOf(g.white.result, g.black.result),
    white: toPlayer(g.white),
    black: toPlayer(g.black),
    winner: g.white.result === 'win' ? 'white' : g.black.result === 'win' ? 'black' : null,
    me,
    startFen,
    moves,
    opening: openingFromEco(g.eco),
  }
}

/** Partidas de un mes ya descargado (`{games: [...]}`), de la más nueva a la más vieja. */
export function parseMonth(json: unknown, username: string): ImportedGame[] {
  const list = (json as { games?: unknown[] } | null)?.games
  if (!Array.isArray(list)) return []
  return list
    .map((g) => parseChesscomGame(g, username))
    .filter((g): g is ImportedGame => g !== null && g.speed !== 'bullet')
    .sort((a, b) => b.createdAt - a.createdAt)
}

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(url, { signal })
  if (res.status === 404) throw new Error('No encontré ese usuario en Chess.com.')
  if (res.status === 429 || res.status === 403) throw new Error('Chess.com pidió esperar un rato. Probá de nuevo en unos minutos.')
  if (!res.ok) throw new Error(`Chess.com respondió ${res.status}.`)
  return res.json()
}

/**
 * Descarga las últimas partidas (sin bullet) recorriendo los meses de atrás para adelante.
 * Pide de a un mes por vez para no pasarse del límite de la API.
 */
export async function fetchChesscomGames(username: string, max = 20, signal?: AbortSignal): Promise<ImportedGame[]> {
  if (!CHESSCOM_USERNAME_RE.test(username)) throw new Error('Usuario de Chess.com inválido.')
  const idx = (await getJson(`https://api.chess.com/pub/player/${encodeURIComponent(username.toLowerCase())}/games/archives`, signal)) as {
    archives?: string[]
  }
  const months = [...(idx.archives ?? [])].reverse().slice(0, 4)
  const out: ImportedGame[] = []
  for (const url of months) {
    out.push(...parseMonth(await getJson(url, signal), username))
    if (out.length >= max) break
  }
  return out.sort((a, b) => b.createdAt - a.createdAt).slice(0, max)
}
