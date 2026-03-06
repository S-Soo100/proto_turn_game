import { generateImage } from './lib/gemini-client.js'
import { getPresets, getPresetsByCategory, presets } from './lib/presets.js'
import type { AssetPreset } from './lib/presets.js'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  options: {
    preset: { type: 'string', short: 'p' },
    category: { type: 'string', short: 'c' },
    model: { type: 'string', short: 'm' },
    list: { type: 'boolean', short: 'l' },
    help: { type: 'boolean', short: 'h' },
  },
  strict: true,
  allowPositionals: true,
})

if (values.help) {
  console.log(`
Usage: pnpm asset:batch --preset <name> | --category <name>

Options:
  -p, --preset    Preset group: ${Object.keys(presets).join(', ')}, all
  -c, --category  Filter by category: icons, backgrounds, sprites, ui, effects
  -m, --model     Gemini model (default: imagen-3.0-generate-002)
  -l, --list      List presets without generating
  -h, --help      Show this help

Examples:
  pnpm asset:batch --preset gonggi        # Generate all gonggi assets
  pnpm asset:batch --preset all           # Generate everything
  pnpm asset:batch --category icons       # Generate icons only
  pnpm asset:batch --preset common --list # List common presets
`)
  process.exit(0)
}

let assets: AssetPreset[]

if (values.preset) {
  assets = getPresets(values.preset)
} else if (values.category) {
  assets = getPresetsByCategory(values.category)
} else {
  console.error('Error: specify --preset or --category. Use --help for usage.')
  process.exit(1)
}

if (assets.length === 0) {
  console.error('No assets found for the given filter.')
  process.exit(1)
}

if (values.list) {
  console.log(`\nFound ${assets.length} asset(s):\n`)
  for (const asset of assets) {
    const sizeStr = `${asset.size.w}x${asset.size.h}`
    const ratio = asset.aspectRatio ?? '1:1'
    console.log(`  [${asset.category}] ${asset.fileName}  (${sizeStr}, ${ratio})`)
    console.log(`    ${asset.prompt.slice(0, 70)}...`)
  }
  process.exit(0)
}

console.log(`\nGenerating ${assets.length} asset(s)...\n`)

let success = 0
let failed = 0

for (const asset of assets) {
  try {
    console.log(`[${success + failed + 1}/${assets.length}] ${asset.id}`)
    await generateImage(asset.prompt, {
      fileName: asset.fileName,
      model: values.model,
      aspectRatio: asset.aspectRatio,
      size: asset.size,
    })
    success++
    console.log('')
  } catch (error) {
    failed++
    console.error(`  FAILED: ${error instanceof Error ? error.message : error}\n`)
  }
}

console.log(`\nDone! ${success} succeeded, ${failed} failed out of ${assets.length} total.`)
if (failed > 0) process.exit(1)
