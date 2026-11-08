// Genera los PNG del manifest desde public/icons/icon.svg usando Chromium (Playwright).
// Uso: node scripts/gen-icons.mjs
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const dir = fileURLToPath(new URL('../public/icons/', import.meta.url))
const svg = readFileSync(dir + 'icon.svg', 'utf8')

// maskable: el ícono ocupa la zona segura (80%) sobre fondo lleno.
const targets = [
  { file: 'icon-192.png', size: 192, pad: 0, rounded: true },
  { file: 'icon-512.png', size: 512, pad: 0, rounded: true },
  { file: 'icon-maskable-512.png', size: 512, pad: 0.1, rounded: false },
  { file: 'apple-touch-icon.png', size: 180, pad: 0, rounded: false },
]

const browser = await chromium.launch()
const page = await browser.newPage()
for (const t of targets) {
  const inner = Math.round(t.size * (1 - 2 * t.pad))
  const art = t.rounded ? svg : svg.replace(/rx="112"/, 'rx="0"')
  await page.setViewportSize({ width: t.size, height: t.size })
  await page.setContent(
    `<html><body style="margin:0;background:${t.rounded ? 'transparent' : '#0f1115'};display:grid;place-items:center;width:${t.size}px;height:${t.size}px">` +
      `<div style="width:${inner}px;height:${inner}px">${art.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body></html>`,
  )
  await page.screenshot({ path: dir + t.file, omitBackground: t.rounded })
  console.log('✓', t.file)
}
await browser.close()
