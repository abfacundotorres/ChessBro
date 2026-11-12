// Genera el ícono de la app (SVG y PNG del manifest). El dibujo vive acá, en `art()`.
// Uso: node scripts/gen-icons.mjs   (necesita Playwright con Chromium para rasterizar)
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const dir = fileURLToPath(new URL('../public/icons/', import.meta.url))

/**
 * Un rey con dos peones, de trazo grueso y colores planos dorados, sobre verde pastel (dibujo propio, inspirado en el estilo de línea).
 * @param {{ rounded: boolean, scale: number }} o  rounded: esquinas redondeadas (íconos normales);
 *   scale: tamaño del dibujo (las variantes "maskable" lo achican para quedar en la zona segura).
 */
function art({ rounded, scale }) {
  const ink = '#14110B'
  const gold = '#FFC21F' // cuerpo
  const tan = '#EDB04E' // partes de luz (cuerpo del rey, collares)
  const deep = '#D58E26' // sombras (bases)
  const sw = 14
  const st = `stroke="${ink}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"`
  /** Un peón centrado en cx, con la base apoyada en y=452. */
  const pawn = (cx) => `
    <g ${st}>
      <path d="M${cx - 20} 276L${cx + 20} 276L${cx + 40} 392L${cx - 40} 392Z" fill="${gold}"/>
      <path d="M${cx - 40} 392L${cx + 40} 392L${cx + 66} 420L${cx - 66} 420Z" fill="${gold}"/>
      <rect x="${cx - 82}" y="420" width="164" height="30" rx="15" fill="${deep}"/>
      <rect x="${cx - 38}" y="246" width="76" height="32" rx="16" fill="${tan}"/>
      <circle cx="${cx}" cy="204" r="44" fill="${gold}"/>
    </g>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="#E3F3E1"/><stop offset="1" stop-color="#BFDFC4"/></radialGradient>
    <clipPath id="clip"><rect width="512" height="512" rx="${rounded ? 112 : 0}"/></clipPath>
  </defs>
  <g clip-path="url(#clip)">
    <rect width="512" height="512" fill="url(#bg)"/>
    <g transform="translate(256 262) scale(${scale}) translate(-256 -262)">
      ${pawn(120)}
      ${pawn(392)}
      <g ${st}>
        <rect x="214" y="132" width="84" height="32" rx="16" fill="${tan}"/>
        <path d="M242 134L242 100L222 100L222 74L242 74L242 50L270 50L270 74L290 74L290 100L270 100L270 134Z" fill="${gold}"/>
        <path d="M196 168L316 168L302 244L210 244Z" fill="${tan}"/>
        <rect x="200" y="244" width="112" height="24" rx="6" fill="${gold}"/>
        <path d="M222 268L290 268L306 350L356 420L156 420L206 350Z" fill="${tan}"/>
        <rect x="146" y="420" width="220" height="34" rx="17" fill="${deep}"/>
        <rect x="128" y="448" width="256" height="34" rx="17" fill="${tan}"/>
      </g>
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
