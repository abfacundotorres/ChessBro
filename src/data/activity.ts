import { computeStreak, type Streak } from '../engine/streak'
import { db as defaultDb, type ChessBroDB } from './db'

/** Suma una práctica al día dado. Debe llamarse dentro de una transacción que incluya `db.activity`, o sola. */
export async function touchActivity(date: string, db: ChessBroDB = defaultDb): Promise<void> {
  const cur = await db.activity.get(date)
  await db.activity.put({ date, count: (cur?.count ?? 0) + 1 })
}

export async function currentStreak(today: string, db: ChessBroDB = defaultDb): Promise<Streak> {
  return computeStreak(await db.activity.toCollection().primaryKeys(), today)
}
