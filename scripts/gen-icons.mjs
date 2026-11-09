// Genera el ícono de la app (SVG y PNG del manifest). El dibujo vive acá, en `art()`.
// Uso: node scripts/gen-icons.mjs   (necesita Playwright con Chromium para rasterizar)
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const dir = fileURLToPath(new URL('../public/icons/', import.meta.url))

/**
 * Un rey de ajedrez sobre un tablero verde y negro (los casilleros llenan todo el ícono).
 * @param {{ rounded: boolean, scale: number }} o  rounded: esquinas redondeadas (íconos normales);
 *   scale: tamaño del rey (las variantes "maskable" lo achican para quedar en la zona segura).
 */
function art({ rounded, scale }) {
  // Tablero de 8×8: casilleros negros y verdes alternados.
  let board = ''
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) board += `<rect x="${c * 64}" y="${r * 64}" width="64" height="64" fill="${(r + c) % 2 === 0 ? '#2FA84F' : '#101311'}"/>`
  const ink = '#0B0D0C'
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="king" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFF4D6"/><stop offset=".55" stop-color="#FFFFFF"/><stop offset="1" stop-color="#F1D9A0"/></linearGradient>
    <radialGradient id="glow" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#000" stop-opacity=".0"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></radialGradient>
    <clipPath id="clip"><rect width="512" height="512" rx="${rounded ? 112 : 0}"/></clipPath>
  </defs>
  <g clip-path="url(#clip)">
    ${board}
    <rect width="512" height="512" fill="url(#glow)"/>
    <g transform="translate(256 256) scale(${scale}) translate(-256 -256)" stroke="${ink}" stroke-width="10" stroke-linejoin="round" stroke-linecap="round">
      <ellipse cx="256" cy="452" rx="150" ry="18" fill="#000" opacity=".4" stroke="none"/>
      <rect x="132" y="408" width="248" height="46" rx="23" fill="url(#king)"/>
      <rect x="150" y="372" width="212" height="42" rx="21" fill="url(#king)"/>
      <path d="M204 372C196 318 214 282 214 240L298 240C298 282 316 318 308 372Z" fill="url(#king)"/>
      <rect x="186" y="214" width="140" height="34" rx="17" fill="url(#king)"/>
      <path d="M200 214C176 170 196 124 256 124C316 124 336 170 312 214Z" fill="url(#king)"/>
      <path d="M256 124L256 70M232 92L280 92" stroke-width="22" fill="none"/>
      <path d="M256 124L256 70M232 92L280 92" stroke="#FFF4D6" stroke-width="10" fill="none"/>
    </g>
  </g>
</svg>`
}

const normal = art({ rounded: true, scale: 1 })
const full = art({ rounded: false, scale: 0.86 }) // sin esquinas: lo recorta el sistema (maskable / iOS)
writeFileSync(dir + 'icon.svg', normal)
writeFileSync(dir + 'icon-maskable.svg', full)

const targets = [
  { file: 'icon-192.png', size: 192, svg: normal },
  { file: 'icon-512.png', size: 512, svg: normal },
  { file: 'icon-maskable-512.png', size: 512, svg: full },
  { file: 'apple-touch-icon.png', size: 180, svg: full },
]

const browser = await chromium.launch()
const page = await browser.newPage()
for (const t of targets) {
  await page.setViewportSize({ width: t.size, height: t.size })
  await page.setContent(`<html><body style="margin:0;background:transparent">${t.svg.replace('<svg ', `<svg width="${t.size}" height="${t.size}" `)}</body></html>`)
  await page.screenshot({ path: dir + t.file, omitBackground: true })
  console.log('✓', t.file)
}
await browser.close()
