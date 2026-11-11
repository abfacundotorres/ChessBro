import { Component, type ErrorInfo, type ReactNode } from 'react'

/** Texto corto y legible de un error cualquiera (lo que se muestra y lo que se copia). */
export function describeError(e: unknown): string {
  if (e instanceof Error) return `${e.name}: ${e.message}`.slice(0, 300)
  try {
    return String(e).slice(0, 300)
  } catch {
    return 'Error desconocido'
  }
}

interface Props {
  children: ReactNode
  /** Qué se estaba mostrando, para el aviso ("esta pantalla", "la app"). */
  scope?: 'pantalla' | 'app'
}

interface State {
  error: unknown
  failed: boolean
}

/**
 * Evita la pantalla en blanco: si una pantalla falla al dibujarse, React desmonta todo el árbol.
 * Acá se atrapa el error y se muestra un aviso con salidas (reintentar, ir a Hoy).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, failed: false }

  static getDerivedStateFromError(error: unknown): State {
    return { error, failed: true }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('ChessBro: error de pantalla', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    const app = this.props.scope === 'app'
    return (
      <div role="alert" className="flex flex-col gap-3 rounded-xl bg-surface p-4">
        <h1 className="text-lg font-bold">{app ? 'La app no pudo arrancar' : 'Esta pantalla falló'}</h1>
        <p>
          Algo salió mal y no se pudo mostrar {app ? 'la app' : 'esta pantalla'}. Tus datos no se tocaron. Probá reintentar; si sigue,
          volvé a Hoy.
        </p>
        <p className="break-words font-mono text-xs text-muted">{describeError(this.state.error)}</p>
        <button type="button" className="btn-primary" onClick={() => this.setState({ error: null, failed: false })}>
          Reintentar
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            window.location.hash = '#/'
            window.location.reload()
          }}
        >
          Volver a Hoy
        </button>
      </div>
    )
  }
}
