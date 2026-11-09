/** Fechas locales como 'YYYY-MM-DD'. Sin zona horaria: se opera en UTC sobre la fecha civil. */

const RE = /^(\d{4})-(\d{2})-(\d{2})$/

export function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(date: string, days: number): string {
  const m = RE.exec(date)
  if (!m) throw new Error(`Fecha inválida: ${date}`)
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) + days * 86_400_000
  return new Date(t).toISOString().slice(0, 10)
}

export function daysBetween(from: string, to: string): number {
  const a = RE.exec(from)
  const b = RE.exec(to)
  if (!a || !b) throw new Error(`Fecha inválida: ${from} / ${to}`)
  const ta = Date.UTC(Number(a[1]), Number(a[2]) - 1, Number(a[3]))
  const tb = Date.UTC(Number(b[1]), Number(b[2]) - 1, Number(b[3]))
  return Math.round((tb - ta) / 86_400_000)
}

/** 'YYYY-MM-DD' → 'dd/mm' */
export function formatDayMonth(date: string): string {
  const m = RE.exec(date)
  return m ? `${m[3]}/${m[2]}` : date
}
