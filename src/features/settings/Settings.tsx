import { useRef, useState } from 'react'
import { exportBackup, importBackup } from '../../data/backup'
import { toDateStr } from '../../engine/dates'

export function Settings() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<string | null>(null)

  async function onExport() {
    const data = await exportBackup()
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chessbro-${toDateStr(new Date())}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMsg(`Backup exportado: ${data.attempts.length} intentos, ${data.reviews.length} en repaso.`)
  }

  async function onImport(file: File) {
    try {
      const json: unknown = JSON.parse(await file.text())
      if (!window.confirm('Esto reemplaza todos tus datos actuales por los del archivo. ¿Seguimos?')) return
      const r = await importBackup(json)
      setMsg(`Importado: ${r.attempts} intentos, ${r.reviews} en repaso.`)
    } catch (e) {
      setMsg(e instanceof Error && e.message.includes('backup') ? e.message : 'No se pudo leer el archivo.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Ajustes</h1>

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

      <section className="rounded-xl bg-surface p-4 text-sm">
        <p className="font-semibold">Cuenta de Lichess</p>
        <p className="text-muted">Opcional. Llega en H2, para importar y analizar tus partidas.</p>
      </section>

      <section className="rounded-xl bg-surface p-4 text-sm text-muted">
        <p>ChessBro v{__APP_VERSION__}</p>
        <p>Funciona sin conexión. Software libre (GPL-3.0).</p>
        <p>Puzzles: base de datos de Lichess (CC0).</p>
      </section>
    </div>
  )
}
