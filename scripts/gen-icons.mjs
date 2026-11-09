// Genera el ícono de la app (SVG y PNG del manifest). El dibujo vive acá, en `art()`.
// Uso: node scripts/gen-icons.mjs   (necesita Playwright con Chromium para rasterizar)
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const dir = fileURLToPath(new URL('../public/icons/', import.meta.url))

/**
 * Un peón sonriente sobre un degradé violeta–rosa, con destellos y un toque de tablero.
 * @param {{ rounded: boolean, scale: number }} o  rounded: esquinas redondeadas (íconos normales);
 *   scale: tamaño del personaje (las variantes "maskable" lo achican para quedar en la zona segura).
 */
function art({ rounded, scale }) {
  const star = (x, y, s, o = 0.95) =>
    `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="#fff" opacity="${o}"/>`
  // Casillas de tablero, apenas insinuadas, en la franja de abajo.
  let checker = ''
  for (let r = 0; r < 2; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2 === 0) checker += `<rect x="${c * 64}" y="${384 + r * 64}" width="64" height="64"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7B5CFA"/><stop offset="1" stop-color="#FF7EB3"/></linearGradient>
    <linearGradient id="pawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#FFE3BD"/></linearGradient>
    <clipPath id="clip"><rect width="512" height="512" rx="${rounded ? 112 : 0}"/></clipPath>
  </defs>
  <g clip-path="url(#clip)">
    <rect width="512" height="512" fill="url(#bg)"/>
    <g fill="#fff" opacity=".16">${checker}</g>
    ${star(96, 112, 26)}${star(420, 150, 18)}${star(408, 340, 14, 0.8)}${star(120, 330, 12, 0.7)}
    <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
      <ellipse cx="256" cy="426" rx="132" ry="18" fill="#3B1E8F" opacity=".28"/>
      <rect x="148" y="368" width="216" height="50" rx="25" fill="url(#pawn)"/>
      <path d="M198 372C212 322 224 292 230 262L282 262C288 292 300 322 314 372Z" fill="url(#pawn)"/>
      <ellipse cx="256" cy="262" rx="72" ry="21" fill="url(#pawn)"/>
      <circle cx="256" cy="176" r="86" fill="url(#pawn)"/>
      <circle cx="226" cy="176" r="12" fill="#3B2A6B"/><circle cx="286" cy="176" r="12" fill="#3B2A6B"/>
      <circle cx="230" cy="171" r="4.5" fill="#fff"/><circle cx="290" cy="171" r="4.5" fill="#fff"/>
      <circle cx="202" cy="208" r="14" fill="#FF8FB1" opacity=".85"/><circle cx="310" cy="208" r="14" fill="#FF8FB1" opacity=".85"/>
      <path d="M234 206Q256 234 278 206" stroke="#3B2A6B" stroke-width="9" stroke-linecap="round" fill="none"/>
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
