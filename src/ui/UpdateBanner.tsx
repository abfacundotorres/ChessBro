import { applyUpdate, dismissOfflineReady, usePwaState } from '../lib/pwa'

export function UpdateBanner() {
  const { needRefresh, offlineReady } = usePwaState()
  if (needRefresh) {
    return (
      <div className="flex items-center justify-between gap-3 bg-accent px-4 py-2 text-sm text-accent-text">
        <span>Hay una versión nueva.</span>
        <button type="button" className="rounded-lg bg-black/15 px-3 py-1 font-semibold" onClick={applyUpdate}>
          Actualizar
        </button>
      </div>
    )
  }
  if (offlineReady) {
    return (
      <div className="flex items-center justify-between gap-3 bg-surface-2 px-4 py-2 text-sm">
        <span>Lista para usar sin conexión.</span>
        <button type="button" className="px-2 py-1 text-muted" onClick={dismissOfflineReady}>
          OK
        </button>
      </div>
    )
  }
  return null
}
