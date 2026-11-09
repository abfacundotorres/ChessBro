import { z } from 'zod'
import { db as defaultDb, type ChessBroDB, type GameRecord, type ReviewRecord } from './db'

const puzzleSchema = z.object({
  id: z.string(),
  fen: z.string(),
  moves: z.array(z.string()),
  rating: z.number(),
  rd: z.number(),
  themes: z.number().int(),
})

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

const gameSchema = z
  .object({
    id: z.string(),
    createdAt: z.number(),
    me: z.enum(['w', 'b']),
    startFen: z.string(),
    moves: z.array(z.string()),
    importedAt: z.number(),
  })
  .loose()

export const backupSchema = z.object({
  app: z.literal('chessbro'),
  version: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  exportedAt: z.string(),
  profile: z
    .object({
      id: z.literal('me'),
      rating: z.number(),
      rd: z.number(),
      vol: z.number(),
      ratedCount: z.number().int(),
      updatedAt: z.number(),
    })
    .nullable(),
  attempts: z.array(
    z.object({
      id: z.number().int().optional(),
      puzzleId: z.string(),
      date,
      ts: z.number(),
      mode: z.enum(['new', 'review']),
      solved: z.boolean(),
      puzzleRating: z.number(),
      themes: z.number().int(),
      ratingBefore: z.number().optional(),
      ratingAfter: z.number().optional(),
    }),
  ),
  reviews: z.array(
    z.object({
      puzzleId: z.string(),
      box: z.number().int().min(0),
      due: date,
      lapses: z.number().int(),
      puzzle: puzzleSchema,
      origin: z
        .object({ gameId: z.string(), ply: z.number().int(), kind: z.string(), played: z.string(), bestCp: z.number() })
        .optional(),
    }),
  ),
  // v2
  games: z.array(gameSchema).default([]),
  settings: z.array(z.object({ key: z.string(), value: z.string() })).default([]),
  // v3
  lessons: z.array(z.object({ id: z.string(), exercises: z.array(z.string()), doneAt: z.number().optional(), stars: z.number().optional() })).default([]),
  endgames: z
    .array(
      z.object({
        id: z.number().int().optional(),
        endgameId: z.string(),
        ts: z.number(),
        date,
        success: z.boolean(),
        moves: z.number().int(),
        hints: z.number().int(),
      }),
    )
    .default([]),
  // v4
  activity: z.array(z.object({ date, count: z.number().int() })).default([]),
})

export type Backup = z.infer<typeof backupSchema>
export type BackupOut = Omit<Backup, 'games'> & { games: GameRecord[] }

export async function exportBackup(db: ChessBroDB = defaultDb, now = new Date()): Promise<BackupOut> {
  return db.transaction('r', [db.profile, db.attempts, db.reviews, db.games, db.settings, db.lessons, db.endgames, db.activity], async () => ({
    app: 'chessbro' as const,
    version: 4 as const,
    exportedAt: now.toISOString(),
    profile: (await db.profile.get('me')) ?? null,
    attempts: await db.attempts.toArray(),
    reviews: await db.reviews.toArray(),
    games: await db.games.toArray(),
    settings: await db.settings.toArray(),
    lessons: await db.lessons.toArray(),
    endgames: await db.endgames.toArray(),
    activity: await db.activity.toArray(),
  }))
}

/** Valida y reemplaza todos los datos. Lanza con un mensaje legible si el archivo no sirve. */
export async function importBackup(
  json: unknown,
  db: ChessBroDB = defaultDb,
): Promise<{ attempts: number; reviews: number; games: number; lessons: number }> {
  const parsed = backupSchema.safeParse(json)
  if (!parsed.success) throw new Error('El archivo no es un backup válido de ChessBro.')
  const data = parsed.data
  await db.transaction('rw', [db.profile, db.attempts, db.reviews, db.games, db.settings, db.lessons, db.endgames, db.activity], async () => {
    await Promise.all([db.profile.clear(), db.attempts.clear(), db.reviews.clear(), db.games.clear(), db.settings.clear(), db.lessons.clear(), db.endgames.clear(), db.activity.clear()])
    if (data.profile) await db.profile.put(data.profile)
    await db.attempts.bulkAdd(data.attempts)
    await db.reviews.bulkPut(data.reviews as ReviewRecord[])
    await db.games.bulkPut(data.games as unknown as GameRecord[])
    await db.settings.bulkPut(data.settings)
    await db.lessons.bulkPut(data.lessons)
    await db.endgames.bulkAdd(data.endgames)
    await db.activity.bulkPut(data.activity)
  })
  return { attempts: data.attempts.length, reviews: data.reviews.length, games: data.games.length, lessons: data.lessons.length }
}
