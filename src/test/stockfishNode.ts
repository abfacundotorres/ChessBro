// Stockfish en Node para tests de contenido. Copia el motor a un .cjs temporal porque el
// paquete es "type": "module" y el build de Emscripten espera CommonJS.
import { copyFileSync, mkdtempSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseInfo, type PositionEval, type Score } from '../engine/analysis'

interface SfModule {
  listener: (line: string) => void
  processCommand: (cmd: string) => void
}

let engine: Promise<NodeEngine> | null = null

class NodeEngine {
  private lines: ((l: string) => void) | null = null
  private sf: SfModule
  private queue: Promise<unknown> = Promise.resolve()

  constructor(sf: SfModule) {
    this.sf = sf
    sf.listener = (l) => this.lines?.(l)
  }

  private send(cmd: string) {
    // Diferido: el motor no tolera comandos reentrantes desde su propio callback.
    setTimeout(() => this.sf.processCommand(cmd), 0)
  }

  init(): Promise<void> {
    return new Promise((resolve) => {
      this.lines = (l) => {
        if (l.includes('uciok')) resolve()
      }
      this.send('uci')
    })
  }

  evaluate(fen: string, depth: number): Promise<PositionEval> {
    const run = this.queue.then(
      () =>
        new Promise<PositionEval>((resolve) => {
          let last: { score: Score; pv: string[] } | null = null
          this.lines = (l) => {
            const info = parseInfo(l)
            if (info) last = info
            if (l.startsWith('bestmove')) {
              const best = l.split(/\s+/)[1] ?? '(none)'
              resolve({ score: last?.score ?? { cp: 0 }, best: best === '(none)' ? null : best, pv: last?.pv ?? [] })
            }
          }
          this.send('ucinewgame')
          this.send(`position fen ${fen}`)
          this.send(`go depth ${depth}`)
        }),
    )
    this.queue = run.catch(() => undefined)
    return run
  }
}

export function nodeEngine(): Promise<NodeEngine> {
  engine ??= (async () => {
    const dir = mkdtempSync(join(tmpdir(), 'sf-'))
    const pub = new URL('../../public/engine/', import.meta.url)
    copyFileSync(new URL('stockfish-19-lite-single.js', pub), join(dir, 'stockfish.cjs'))
    copyFileSync(new URL('stockfish-19-lite-single.wasm', pub), join(dir, 'stockfish.wasm'))
    const require = createRequire(import.meta.url)
    const factory = require(join(dir, 'stockfish.cjs')) as () => SfModule
    const e = new NodeEngine(factory())
    await e.init()
    return e
  })()
  return engine
}
