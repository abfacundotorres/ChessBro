// Prueba de punta a punta SIN CONEXIÓN. Uso:
//   BASE=/ChessBro/ npm run build && npx vite preview --base /ChessBro/ --port 4173 &
//   node scripts/e2e-offline.mjs [http://localhost:4173/ChessBro/] [carpeta-para-capturas]
// Necesita Playwright con Chromium (no es dependencia del proyecto: `npx playwright install chromium`).
// Pasos: abre la app con red, espera al service worker, corta la red y recorre todas las pantallas a 360 px
// buscando desbordes horizontales; después prueba el motor (Stockfish WASM), el repertorio, una lección,
// un puzzle y el backup, todo desconectado. Termina con código 1 si algo falla.
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'

const require = createRequire(import.meta.url)
let chromium
let devices
try {
  ;({ chromium, devices } = require('playwright'))
} catch {
  console.error('Falta Playwright: npm i -D playwright && npx playwright install chromium')
  process.exit(2)
}

const BASE = process.argv[2] ?? 'http://localhost:4173/ChessBro/'
const OUT = process.argv[3] ?? '.'
mkdirSync(OUT, { recursive: true })

const failures = []
const check = (ok, what) => {
  console.log(`${ok ? '✓' : '✗'} ${what}`)
  if (!ok) failures.push(what)
}

const ROUTES = [
  '/', '/aprender', '/lecciones', '/lecciones/peones', '/lecciones/piezas-mov', '/lecciones/trampas', '/lecciones/lucena', '/lecciones/calculo', '/tactica', '/partidas', '/aperturas', '/aperturas/ruy', '/ajustes',
  '/repertorio', '/repertorio/w-italiana-c3', '/repertorio/repaso', '/plan', '/finales/lucena', '/finales/philidor', '/tablero',
]

const browser = await chromium.launch()
const errors = []
const ctx = await browser.newContext({ ...devices['Pixel 7'], viewport: { width: 360, height: 740 } })
const page = await ctx.newPage()
page.on('console', (m) => {
  if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errors.push(m.text())
})
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
const sq = (s) => page.locator(`[data-square="${s}"]`)
const go = (route) => page.goto(`${BASE}#${route}`)

// 1) Con red: elegir estilo y esperar a que el service worker lo deje todo en caché.
await page.goto(BASE)
await page.waitForSelector('text=¿Cómo preferís estudiar?')
await page.click('[role=radio]:has-text("Juego")')
await page.waitForSelector('text=¿Desde dónde empezamos?')
await page.screenshot({ path: `${OUT}/e2e-welcome-nivel.png` })
await page.click('[role=radio]:has-text("Hasta 800 de Elo")')
await page.waitForSelector('text=Para hoy')
await page.waitForFunction(async () => (await navigator.serviceWorker.getRegistration())?.active?.state === 'activated', null, { timeout: 30000 })
await page.waitForSelector('text=Lista para usar sin conexión', { timeout: 30000 })
check(true, 'service worker activo y app lista para usar sin conexión')
// Precargar los archivos de puzzles que el SW tiene en caché (se piden al abrir Táctica).
await go('/tactica')
await page.waitForSelector('text=encontrá la mejor jugada', { timeout: 20000 })

// 2) Sin red.
await ctx.setOffline(true)
await page.reload() // recarga estando en Táctica: la app y los puzzles salen del caché
await page.waitForSelector('text=encontrá la mejor jugada', { timeout: 20000 })
check(true, 'recarga sin conexión (en Táctica, con puzzles)')

for (const route of ROUTES) {
  await go(route)
  await page.waitForSelector('h1', { timeout: 15000 })
  await page.waitForTimeout(250)
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }))
  check(sw <= iw + 1, `sin desborde horizontal en ${route} (ancho ${sw} de ${iw})`)
}

// 3) Motor Stockfish sin conexión: jugar una jugada y esperar la respuesta.
await go('/finales/lucena')
await page.waitForSelector('text=Tu turno.')
await sq('e1').click()
await sq('e4').click()
await page.waitForSelector('text=El motor piensa…', { timeout: 5000 }).catch(() => {})
await page.waitForSelector('text=Tu turno.', { timeout: 30000 })
const list = (await page.locator('ol').innerText()).replace(/\s+/g, ' ')
check(/♖e4 \S+/.test(list), `el motor respondió sin conexión (${list})`)

// 4) Puzzle: ver la solución y que quede registrado.
await go('/tactica')
await page.waitForSelector('text=encontrá la mejor jugada', { timeout: 20000 })
await page.waitForTimeout(900)
await page.click('text=Ver solución')
await page.waitForSelector('text=Siguiente')
check(true, 'puzzle sin conexión: solución mostrada y registrada')

// 5) Lección con mini-juego.
await go('/lecciones/peones')
await page.click('text=Siguiente')
await sq('d4').click()
await sq('h7').click()
await page.click('text=Listo (2)')
await page.waitForSelector('text=¡Eso!')
check(true, 'lección: mini-juego de tocar el tablero sin conexión')

// 5b) Primeros pasos: el caballo (tocar sus 8 casillas) y la torre (cualquier casilla válida).
await go('/lecciones/piezas-mov')
await sq('e4').click() // coordenadas
await page.waitForSelector('text=¡Eso!')
await page.click('text=Siguiente')
await sq('d8').click() // torre
await page.waitForSelector('text=¡Eso!')
await page.click('text=Siguiente')
await sq('e5').click() // alfil
await page.waitForSelector('text=¡Eso!')
await page.click('text=Siguiente')
await sq('d5').click() // dama
await page.waitForSelector('text=¡Eso!')
await page.click('text=Siguiente')
for (const s of ['b3', 'b5', 'c2', 'c6', 'e2', 'e6', 'f3', 'f5']) await sq(s).click() // caballo: sus 8 casillas
await page.click('text=Listo (8)')
await page.waitForSelector('text=¡Eso!')
check(true, 'primeros pasos: el caballo y sus 8 casillas')

// 6) Repertorio: practicar las dos primeras jugadas.
await go('/repertorio/w-italiana-c3')
await page.click('[role=tab]:has-text("Practicar")')
await page.waitForSelector('text=Tu turno.')
await sq('e2').click()
await sq('e4').click()
await page.waitForSelector('text=Tu turno.', { timeout: 8000 })
await page.waitForTimeout(450)
await sq('g1').click()
await sq('f3').click()
check(true, 'repertorio: practicar una línea sin conexión')

// 7) Backup.
await go('/ajustes')
const [dl] = await Promise.all([page.waitForEvent('download'), page.click('text=Exportar')])
check(dl.suggestedFilename().startsWith('chessbro-'), `backup descargable sin conexión (${dl.suggestedFilename()})`)

// 8) Modo oscuro.
await ctx.close()
const dark = await browser.newContext({ ...devices['Pixel 7'], viewport: { width: 360, height: 740 }, colorScheme: 'dark' })
const dpage = await dark.newPage()
await dpage.goto(BASE)
await dpage.click('[role=radio]:has-text("Serio")')
await dpage.click('[role=radio]:has-text("Recién empiezo")')
await dpage.waitForSelector('text=Para hoy')
await dpage.screenshot({ path: `${OUT}/e2e-dark-home.png` })
await dpage.goto(`${BASE}#/lecciones/piezas-mov`)
await dpage.waitForSelector('h1')
await dpage.screenshot({ path: `${OUT}/e2e-dark-lesson.png` })
const bg = await dpage.evaluate(() => getComputedStyle(document.body).backgroundColor)
check(bg !== 'rgb(244, 245, 247)', `el modo oscuro cambia el fondo (${bg})`)

check(errors.length === 0, `sin errores de consola${errors.length ? `: ${errors.slice(0, 3).join(' | ')}` : ''}`)
await browser.close()
console.log(failures.length ? `\n${failures.length} fallo(s)` : '\nTodo en orden.')
process.exit(failures.length ? 1 : 0)
