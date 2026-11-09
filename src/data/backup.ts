import { z } from 'zod'
import { db as defaultDb, type ChessBroDB } from './db'

const puzzleSchema = z.object({
  id: z.string(),
  fen: z.string(),
  moves: z.array(z.string()),
  rating: z.number(),
  rd: z.number(),
  themes: z.number().int(),
})

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const backupSchema = z.object({
  app: z.literal('chessbro'),
  version: z.literal(1),
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
    }),
  ),
})

export type Backup = z.infer<typeof backupSchema>

export async function exportBackup(db: ChessBroDB = defaultDb, now = new Date()): Promise<Backup> {
  return db.transaction('r', db.profile, db.attempts, db.reviews, async () => ({
    app: 'chessbro' as const,
    version: 1 as const,
    exportedAt: now.toISOString(),
    profile: (await db.profile.get('me')) ?? null,
    attempts: await db.attempts.toArray(),
    reviews: await db.reviews.toArray(),
  }))
}

/** Valida y reemplaza todos los datos. Lanza con un mensaje legible si el archivo no sirve. */
export async function importBackup(json: unknown, db: ChessBroDB = defaultDb): Promise<{ attempts: number; reviews: number }> {
  const parsed = backupSchema.safeParse(json)
  if (!parsed.success) throw new Error('El archivo no es un backup válido de ChessBro.')
  const data = parsed.data
  await db.transaction('rw', db.profile, db.attempts, db.reviews, async () => {
    await Promise.all([db.profile.clear(), db.attempts.clear(), db.reviews.clear()])
    if (data.profile) await db.profile.put(data.profile)
    await db.attempts.bulkAdd(data.attempts)
    await db.reviews.bulkPut(data.reviews)
  })
  return { attempts: data.attempts.length, reviews: data.reviews.length }
}
