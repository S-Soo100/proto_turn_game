import sharp from 'sharp'
import { readdirSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'

const ASSETS_DIR = resolve(import.meta.dirname, '..', 'public', 'assets')
// A pixel is "background" if it's low-saturation and bright enough.
// This catches: pure white, near-white, AND checkerboard gray patterns.
function isBackground(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const saturation = max - min       // color spread (0 = gray)
  const brightness = (r + g + b) / 3 // average brightness

  // Pure white / near-white
  if (r >= 240 && g >= 240 && b >= 240) return true
  // Checkerboard gray: low saturation + fairly bright
  if (saturation < 25 && brightness > 170) return true

  return false
}

async function removeWhiteBg(filePath: string) {
  const image = sharp(filePath)
  const { width, height } = await image.metadata()
  if (!width || !height) return

  const raw = await image.ensureAlpha().raw().toBuffer()

  for (let i = 0; i < raw.length; i += 4) {
    const r = raw[i]
    const g = raw[i + 1]
    const b = raw[i + 2]
    if (isBackground(r, g, b)) {
      raw[i + 3] = 0 // set alpha to 0
    }
  }

  await sharp(raw, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(filePath)
}

function collectPngs(dir: string): string[] {
  const result: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      result.push(...collectPngs(full))
    } else if (entry.endsWith('.png')) {
      result.push(full)
    }
  }
  return result
}

const files = collectPngs(ASSETS_DIR)
console.log(`Processing ${files.length} PNG files...\n`)

for (const file of files) {
  const rel = file.replace(ASSETS_DIR + '/', '')
  try {
    await removeWhiteBg(file)
    console.log(`  OK  ${rel}`)
  } catch (err) {
    console.error(`  FAIL  ${rel}: ${err instanceof Error ? err.message : err}`)
  }
}

console.log('\nDone!')
