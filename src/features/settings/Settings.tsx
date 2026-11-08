export function Settings() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Ajustes</h1>
      <section className="rounded-xl bg-surface p-4 text-sm">
        <p className="font-semibold">Cuenta de Lichess</p>
        <p className="text-muted">Opcional. Llega en H2, para importar y analizar tus partidas.</p>
      </section>
      <section className="rounded-xl bg-surface p-4 text-sm text-muted">
        <p>ChessBro v{__APP_VERSION__}</p>
        <p>Funciona sin conexión. Software libre (GPL-3.0).</p>
      </section>
    </div>
  )
}
