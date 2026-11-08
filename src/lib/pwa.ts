import { useSyncExternalStore } from 'react'

/** Estado del service worker, expuesto como store mínimo para React. */
let needRefresh = false
let offlineReady = false
let update: ((reload?: boolean) => Promise<void>) | null = null
const listeners = new Set<() => void>()
let snapshot = { needRefresh, offlineReady }

function emit() {
  snapshot = { needRefresh, offlineReady }
  for (const l of listeners) l()
}

export function registerPwa(): void {
  // En dev no hay service worker (ver vite.config.ts).
  if (import.meta.env.DEV || !('serviceWorker' in navigator)) return
  void import('virtual:pwa-register').then(({ registerSW }) => {
    update = registerSW({
      onNeedRefresh() {
        needRefresh = true
        emit()
      },
      onOfflineReady() {
        offlineReady = true
        emit()
      },
    })
  })
}

export function applyUpdate(): void {
  void update?.(true)
}

export function dismissOfflineReady(): void {
  offlineReady = false
  emit()
}

export function usePwaState() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => snapshot,
  )
}
