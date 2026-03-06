import { GoogleGenAI } from '@google/genai'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..', '..')

function loadApiKey(): string {
  const envPath = join(ROOT, '.env.local')
  try {
    const content = readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const match = line.match(/^GEMINI_API_KEY=(.+)$/)
      if (match) return match[1].trim()
    }
  } catch {
    // file not found
  }
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY
  throw new Error('GEMINI_API_KEY not found in .env.local or environment variables')
}

export interface GenerateImageOptions {
  model?: string
  outputDir?: string
  fileName: string
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9'
  /** Desired output size in pixels */
  size?: { w: number; h: number }
}

type ImageSizeTier = '512' | '1K' | '2K' | '4K'

/** Pick the smallest imageSize tier that covers the requested dimensions */
function pickImageSizeTier(size?: { w: number; h: number }): ImageSizeTier {
  if (!size) return '1K'
  const maxDim = Math.max(size.w, size.h)
  if (maxDim <= 512) return '512'
  if (maxDim <= 1024) return '1K'
  if (maxDim <= 2048) return '2K'
  return '4K'
}

export async function generateImage(
  prompt: string,
  options: GenerateImageOptions
): Promise<string> {
  const {
    model = 'gemini-2.5-flash-image',
    outputDir = 'public/assets',
    fileName,
  } = options

  const imageSizeTier = pickImageSizeTier(options.size)
  const aspectRatio = options.aspectRatio ?? '1:1'

  const apiKey = loadApiKey()
  const client = new GoogleGenAI({ apiKey })

  console.log(`  Generating: ${fileName}`)
  console.log(`  Prompt: ${prompt.slice(0, 80)}${prompt.length > 80 ? '...' : ''}`)
  console.log(`  Model: ${model}  |  Size: ${imageSizeTier}  |  Aspect: ${aspectRatio}`)

  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseModalities: ['IMAGE', 'TEXT'],
      imageConfig: {
        imageSize: imageSizeTier,
        aspectRatio: aspectRatio,
      },
    },
  })

  const parts = response.candidates?.[0]?.content?.parts
  if (!parts) {
    throw new Error('No response parts returned')
  }

  const imagePart = parts.find(
    (p) => 'inlineData' in p && p.inlineData && typeof p.inlineData === 'object'
  )

  if (!imagePart || !('inlineData' in imagePart) || !imagePart.inlineData) {
    const textPart = parts.find(
      (p) => 'text' in p && typeof p.text === 'string'
    )
    throw new Error(
      textPart && typeof textPart.text === 'string'
        ? `No image generated. Model said: ${textPart.text}`
        : 'No image data in response'
    )
  }

  const { data, mimeType } = imagePart.inlineData as {
    data: string
    mimeType: string
  }

  const ext = mimeType === 'image/jpeg' ? '.jpg' : '.png'
  const finalFileName = fileName.endsWith(ext)
    ? fileName
    : fileName.replace(/\.[^.]+$/, ext)

  const outputPath = resolve(ROOT, outputDir, finalFileName)
  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, Buffer.from(data, 'base64'))

  console.log(`  Saved: ${outputPath}`)
  return outputPath
}
