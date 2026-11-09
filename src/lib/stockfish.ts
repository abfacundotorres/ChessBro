import { parseInfo, type PositionEval, type Score } from '../engine/analysis'

/**
 * Stockfish 19 lite single-thread (WASM) en un Web Worker. Los pedidos se serializan:
 * un solo análisis a la vez. Archivos en public/engine/ (GPL-3, ver COPYING.txt).
 */
export class Engine {
  private worker: Worker
  private listeners = new Set<(line: string) => void>()
  private queue: Promise<unknown> = Promise.resolve()
  private ready: Promise<void>

  constructor(url = `${import.meta.env.BASE_URL}engine/stockfish-19-lite-single.js`) {
    this.worker = new Worker(url)
    this.worker.onmessage = (e: MessageEvent) => {
      if (typeof e.data !== 'string') return
      for (const l of this.listeners) l(e.data)
    }
    this.ready = (async () => {
      await this.sendAndWait('uci', (l) => l === 'uciok')
      this.post('setoption name Hash value 32')
      await this.sendAndWait('isready', (l) => l === 'readyok')
    })()
  }

  private post(cmd: string) {
    this.worker.postMessage(cmd)
  }

  private sendAndWait(cmd: string, done: (line: string) => boolean): Promise<void> {
    return new Promise((resolve) => {
      const l = (line: string) => {
        if (done(line)) {
          this.listeners.delete(l)
          resolve()
        }
      }
      this.listeners.add(l)
      this.post(cmd)
    })
  }

  /** Avisa que empieza una partida nueva (limpia la tabla de transposición). */
  newGame(): Promise<void> {
    return this.enqueue(async () => {
      await this.ready
      this.post('ucinewgame')
      await this.sendAndWait('isready', (l) => l === 'readyok')
    })
  }

  evaluate(fen: string, depth: number, signal?: AbortSignal): Promise<PositionEval> {
    return this.enqueue(async () => {
      await this.ready
      if (signal?.aborted) throw new DOMException('Cancelado', 'AbortError')
      return new Promise<PositionEval>((resolve, reject) => {
        let last: { score: Score; pv: string[] } | null = null
        const onAbort = () => this.post('stop')
        signal?.addEventListener('abort', onAbort, { once: true })
        const l = (line: string) => {
          if (line.startsWith('info ') && !/\bmultipv [2-9]/.test(line)) {
            const info = parseInfo(line)
            if (info) last = { score: info.score, pv: info.pv }
            return
          }
          if (!line.startsWith('bestmove')) return
          this.listeners.delete(l)
          signal?.removeEventListener('abort', onAbort)
          if (signal?.aborted) {
            reject(new DOMException('Cancelado', 'AbortError'))
            return
          }
          const best = line.split(/\s+/)[1] ?? '(none)'
          resolve({
            score: last?.score ?? { cp: 0 },
            best: best === '(none)' ? null : best,
            pv: last?.pv.length ? last.pv : best === '(none)' ? [] : [best],
          })
        }
        this.listeners.add(l)
        this.post(`position fen ${fen}`)
        this.post(`go depth ${depth}`)
      })
    })
  }

  private enqueue<T>(job: () => Promise<T>): Promise<T> {
    const run = this.queue.then(job, job)
    this.queue = run.catch(() => undefined)
    return run
  }

  terminate() {
    this.worker.terminate()
  }
}

let shared: Engine | null = null

/** Motor compartido, creado a demanda (el WASM pesa ~1,8 MB). */
export function getEngine(): Engine {
  shared ??= new Engine()
  return shared
}
