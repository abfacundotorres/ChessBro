import { useRef, useState } from 'react'
import { exportBackup, importBackup } from '../../data/backup'
import { toDateStr } from '../../engine/dates'
import { useLiveQuery } from 'dexie-react-hooks'
import { LICHESS_USER, getSetting, setSetting } from '../../data/games'
import { setStyle, useStyle, type Style } from '../../data/style'
import { setLevel, useLevel } from '../../data/level'
import { LEVELS } from '../../engine/level'
import { USERNAME_RE } from '../../data/lichess'

export function Settings() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const user = useLiveQuery(() => getSetting(LICHESS_USER), [])
  const [draft, setDraft] = useState<string | null>(null)
  const value = draft ?? user ?? ''
  const style = useStyle()
  const level = useLevel()

  async function onExport() {
    const data = await exportBackup()
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chessbro-${toDateStr(new Date())}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMsg(`Backup exportado: ${data.attempts.length} intentos, ${data.reviews.length} en repaso, ${data.games.length} partidas.`)
  }

  async function onImport(file: File) {
    try {
      const json: unknown = JSON.parse(await file.text())
      if (!window.confirm('Esto reemplaza todos tus datos actuales por los del archivo. ¿Seguimos?')) return
      const r = await importBackup(json)
      setMsg(`Importado: ${r.attempts} intentos, ${r.reviews} en repaso, ${r.games} partidas.`)
    } catch (e) {
      setMsg(e instanceof Error && e.message.includes('backup') ? e.message : 'No se pudo leer el archivo.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Ajustes</h1>

      <section className="flex flex-col gap-2 rounded-xl bg-surface p-4 text-sm">
        <p className="font-semibold">Estilo de estudio</p>
        <p className="text-muted">Cambia el tono de las lecciones. Los ejercicios y tu progreso son los mismos.</p>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Estilo de estudio">
          {(['juego', 'serio'] as Style[]).map((s) => (
            <button key={s} type="button" role="radio" aria-checked={style === s} className={style === s ? 'btn-primary' : 'btn'} onClick={() => void setStyle(s)}>
              {s === 'juego' ? '🎲 Juego' : '📖 Serio'}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2 rounded-xl bg-surface p-4 text-sm">
        <p className="font-semibold">Tu nivel de partida</p>
        <p className="text-muted">Define con qué rating empezás en los puzzles y desde qué banda se evalúa tu avance.</p>
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Nivel de partida">
          {LEVELS.map((l) => (
            <button key={l.id} type="button" role="radio" aria-checked={level === l.id} className={`${level === l.id ? 'btn-primary' : 'btn'} text-left`} onClick={() => void setLevel(l.id)}>
              {l.label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2 rounded-xl bg-surface p-4 text-sm">
        <p className="font-semibold">Tus datos</p>
        <p className="text-muted">
          Se guardan solo en este dispositivo. Exportá un backup de vez en cuando: si el navegador borra los datos, se pierden.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn" onClick={() => void onExport()}>
            Exportar
          </button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            Importar
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) void onImport(f)
          }}
        />
        {msg && <p aria-live="polite">{msg}</p>}
      </section>

      <section className="flex flex-col gap-2 rounded-xl bg-surface p-4 text-sm">
        <label className="font-semibold" htmlFor="settings-lichess">
          Usuario de Lichess
        </label>
        <p className="text-muted">Opcional. Solo se usa para bajar tus partidas públicas.</p>
        <form
          className="grid grid-cols-[1fr_auto] gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const v = value.trim()
            if (v && !USERNAME_RE.test(v)) {
              setMsg('Ese usuario no parece válido.')
              return
            }
            void setSetting(LICHESS_USER, v || null).then(() => {
              setDraft(null)
              setMsg(v ? 'Usuario guardado.' : 'Usuario borrado.')
            })
          }}
        >
          <input
            id="settings-lichess"
            className="min-h-12 min-w-0 rounded-xl border border-border bg-bg px-3"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={value}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className="btn">
            Guardar
          </button>
        </form>
      </section>

      <section className="rounded-xl bg-surface p-4 text-sm text-muted">
        <p>ChessBro v{__APP_VERSION__}</p>
        <p>Funciona sin conexión. Software libre (GPL-3.0).</p>
        <p>Puzzles: base de datos de Lichess (CC0).</p>
      </section>
    </div>
  )
}
