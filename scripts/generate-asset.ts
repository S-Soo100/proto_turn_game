import { generateImage } from './lib/gemini-client.js'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  options: {
    prompt: { type: 'string', short: 'p' },
    output: { type: 'string', short: 'o' },
    model: { type: 'string', short: 'm' },
    aspect: { type: 'string', short: 'a' },
    size: { type: 'string', short: 's' },
    help: { type: 'boolean', short: 'h' },
  },
  strict: true,
  allowPositionals: true,
})

if (values.help || !values.prompt || !values.output) {
  console.log(`
Usage: pnpm asset:gen --prompt "..." --output <path>

Options:
  -p, --prompt   Image generation prompt (required)
  -o, --output   Output file path relative to public/assets/ (required)
  -m, --model    Gemini model (default: gemini-2.5-flash-image)
  -a, --aspect   Aspect ratio: 1:1, 3:4, 4:3, 9:16, 16:9 (default: 1:1)
  -s, --size     Image size in WxH pixels, e.g. 256x256 (auto-selects tier)
  -h, --help     Show this help

Examples:
  pnpm asset:gen --prompt "pixel art sword icon" --output icons/sword.png
  pnpm asset:gen -p "forest background" -o backgrounds/forest.png -a 16:9
  pnpm asset:gen -p "game stone" -o sprites/stone.png -s 256x256
`)
  process.exit(values.help ? 0 : 1)
}

function parseSize(s?: string): { w: number; h: number } | undefined {
  if (!s) return undefined
  const match = s.match(/^(\d+)x(\d+)$/)
  if (!match) {
    console.error(`Invalid size format: "${s}". Use WxH (e.g. 256x256)`)
    process.exit(1)
  }
  return { w: Number(match[1]), h: Number(match[2]) }
}

try {
  const outputPath = await generateImage(values.prompt, {
    fileName: values.output,
    model: values.model,
    aspectRatio: values.aspect as '1:1' | '3:4' | '4:3' | '9:16' | '16:9',
    size: parseSize(values.size),
  })
  console.log(`\nDone! ${outputPath}`)
} catch (error) {
  console.error('\nError:', error instanceof Error ? error.message : error)
  process.exit(1)
}
