export interface AssetPreset {
  id: string
  category: 'icons' | 'backgrounds' | 'sprites' | 'ui' | 'effects'
  fileName: string
  prompt: string
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9'
  /** Recommended generation size in pixels (width x height) */
  size: { w: number; h: number }
}

// ── Style suffixes ──

const CUTE_STYLE =
  'cute cartoon style, chibi proportions, soft rounded shapes, thick bold outlines, cel-shaded with soft highlights, candy-like glossy finish, pastel yet vibrant palette, game asset, transparent background'

const MAGIC_ORB_BASE =
  'Korean gonggi jacks stone shape — slightly irregular and lumpy like a natural pebble (not a perfect sphere), the glass surface has a big glossy specular highlight, thick bold outline, three-quarter top-down view, cute cartoon style, cel-shaded, candy-like finish, transparent background'

function orb(color: string, content: string, glow: string): string {
  return `A single magical translucent ${color} glass orb, ${MAGIC_ORB_BASE.replace(
    'big glossy specular highlight',
    `big glossy specular highlight and ${glow} inner glow`
  )}, inside the orb ${content}`
}

function cute(prompt: string): string {
  return `${prompt}, ${CUTE_STYLE}`
}

// ── Presets ──

export const presets: Record<string, AssetPreset[]> = {
  common: [
    {
      id: 'common-logo',
      category: 'icons',
      fileName: 'icons/game-logo.png',
      prompt: cute('game hub logo with colorful game controller and dice'),
      size: { w: 512, h: 512 },
    },
    {
      id: 'common-home-bg',
      category: 'backgrounds',
      fileName: 'backgrounds/home-bg.png',
      prompt: 'abstract geometric background with soft gradients, pastel blue and purple tones, subtle grid pattern, cute cartoon style, dreamy atmosphere',
      aspectRatio: '9:16',
      size: { w: 1080, h: 1920 },
    },
    {
      id: 'common-lobby-bg',
      category: 'backgrounds',
      fileName: 'backgrounds/lobby-bg.png',
      prompt: 'cozy game room background with warm lighting, board games on shelves, cute cartoon style, pastel warm tones',
      aspectRatio: '9:16',
      size: { w: 1080, h: 1920 },
    },
  ],

  gonggi: [
    // ── A. Magic Orb stones (256x256, object 200x200, 28px padding) ──
    {
      id: 'gonggi-stone-yellow',
      category: 'sprites',
      fileName: 'sprites/gonggi-stone-yellow.png',
      prompt: orb(
        'amber',
        'a tiny glowing golden star slowly rotates surrounded by floating gold dust particles',
        'warm golden'
      ),
      size: { w: 256, h: 256 },
    },
    {
      id: 'gonggi-stone-red',
      category: 'sprites',
      fileName: 'sprites/gonggi-stone-red.png',
      prompt: orb(
        'ruby red',
        'tiny cute pink and red hearts float and drift gently',
        'warm rosy'
      ),
      size: { w: 256, h: 256 },
    },
    {
      id: 'gonggi-stone-blue',
      category: 'sprites',
      fileName: 'sprites/gonggi-stone-blue.png',
      prompt: orb(
        'sapphire blue',
        'delicate snowflake crystals sparkle and shimmer with icy frost particles',
        'cool blue'
      ),
      size: { w: 256, h: 256 },
    },
    {
      id: 'gonggi-stone-green',
      category: 'sprites',
      fileName: 'sprites/gonggi-stone-green.png',
      prompt: orb(
        'emerald green',
        'tiny green leaves and a small sprouting seedling swirl gently with soft pollen particles',
        'fresh green'
      ),
      size: { w: 256, h: 256 },
    },
    {
      id: 'gonggi-stone-purple',
      category: 'sprites',
      fileName: 'sprites/gonggi-stone-purple.png',
      prompt: orb(
        'amethyst purple',
        'a tiny glowing crescent moon floats among soft stardust and tiny twinkling dots',
        'mystical purple'
      ),
      size: { w: 256, h: 256 },
    },

    // ── B. Backgrounds ──
    {
      id: 'gonggi-floor',
      category: 'backgrounds',
      fileName: 'backgrounds/gonggi-floor.png',
      prompt: 'Warm cozy wooden floor seen from above, hand-painted watercolor texture, soft oak wood grain, gentle warm lighting with a subtle golden glow, slightly blurred edges giving dreamy bokeh feel, storybook illustration style, pastel warm tones',
      size: { w: 720, h: 800 },
    },
    {
      id: 'gonggi-lobby-bg',
      category: 'backgrounds',
      fileName: 'backgrounds/gonggi-lobby-bg.png',
      prompt: 'Cozy Korean traditional ondol room interior, cute cartoon style, warm afternoon sunlight streaming through hanji paper sliding doors, soft dust particles floating in light beams, wooden maru floor with a colorful yo (Korean mat) in corner, potted plant, nostalgic and dreamy atmosphere, watercolor pastel tones, Studio Ghibli inspired warmth',
      aspectRatio: '9:16',
      size: { w: 1080, h: 1920 },
    },

    // ── C. UI hand icons (256x256, object 200x200, 28px padding) ──
    {
      id: 'gonggi-hand-open',
      category: 'ui',
      fileName: 'ui/gonggi-hand-open.png',
      prompt: cute(
        'Cute chibi cartoon hand with open palm facing up, chubby round fingers spread wide, ready to catch, soft peach skin tone, tiny motion lines around fingers'
      ),
      size: { w: 256, h: 256 },
    },
    {
      id: 'gonggi-hand-catch',
      category: 'ui',
      fileName: 'ui/gonggi-hand-catch.png',
      prompt: cute(
        'Cute chibi cartoon hand making a tight fist, chubby fingers curled in catching pose, small impact star burst effect around fist, determined expression vibe'
      ),
      size: { w: 256, h: 256 },
    },
    {
      id: 'gonggi-hand-toss',
      category: 'ui',
      fileName: 'ui/gonggi-hand-toss.png',
      prompt: cute(
        'Cute chibi cartoon hand flicking upward with index finger, chubby round fingers, small upward arrow motion lines, playful tossing gesture'
      ),
      size: { w: 256, h: 256 },
    },

    // ── D. Chaos effects ──
    {
      id: 'gonggi-chaos-bird',
      category: 'effects',
      fileName: 'effects/chaos-bird.png',
      prompt: cute(
        'Adorable tiny round bird mid-flight, chubby sparrow body like Flappy Bird, stubby wings flapping, surprised big sparkly eyes, small blush cheeks, one gonggi stone transforming into the bird with magic sparkle trail'
      ),
      size: { w: 256, h: 256 },
    },
    {
      id: 'gonggi-chaos-feather',
      category: 'effects',
      fileName: 'effects/chaos-feather.png',
      prompt: 'Single cute fluffy feather drifting down, soft cream and brown colors, gentle S-curve float, tiny sparkles around it, watercolor soft edges, dreamy, transparent background',
      size: { w: 128, h: 128 },
    },
    {
      id: 'gonggi-chaos-cat-paw',
      category: 'effects',
      fileName: 'effects/chaos-cat-paw.png',
      prompt: cute(
        'Chubby orange tabby cat paw reaching down from above, adorable pink toe beans (paw pads) visible, fluffy fur texture, playful mischievous swipe motion, small claw marks trail effect'
      ),
      aspectRatio: '3:4',
      size: { w: 256, h: 384 },
    },
    {
      id: 'gonggi-chaos-eyes',
      category: 'effects',
      fileName: 'effects/chaos-eyes.png',
      prompt: cute(
        'Pair of huge adorable cartoon googly eyes, round wobbly pupils looking sideways nervously, one eye slightly bigger than the other for comedic effect, small sweat drop'
      ),
      size: { w: 128, h: 128 },
    },
    {
      id: 'gonggi-chaos-confetti',
      category: 'effects',
      fileName: 'effects/chaos-confetti.png',
      prompt: cute(
        'Explosion of colorful confetti and streamers, cute star and heart shaped confetti pieces, party popper with ribbon burst, celebratory and over-the-top joyful, candy colors pink gold blue'
      ),
      size: { w: 256, h: 256 },
    },
    {
      id: 'gonggi-chaos-sparkle',
      category: 'effects',
      fileName: 'effects/chaos-sparkle.png',
      prompt: cute(
        'Magical poof explosion effect, golden star burst with smaller stars orbiting, cute magic wand sparkle trail, mystical purple and gold particles, anime-style speed lines radiating outward'
      ),
      size: { w: 256, h: 256 },
    },
    {
      id: 'gonggi-chaos-star',
      category: 'effects',
      fileName: 'effects/chaos-star.png',
      prompt: 'Single dreamy glowing star, four-pointed celestial star shape, warm golden core fading to soft white glow aura, tiny orbiting sparkle dots, magical and ethereal, watercolor soft edges blending into transparency, anime style, transparent background',
      size: { w: 128, h: 128 },
    },

    // ── E. Icons ──
    {
      id: 'gonggi-game-icon',
      category: 'icons',
      fileName: 'icons/gonggi-game-icon.png',
      prompt: cute(
        'Five adorable colorful gonggi jacks stones bouncing playfully in a circle formation (yellow red blue green purple), each stone has a tiny cute sparkle highlight, squishy candy-like texture, one stone mid-bounce with motion lines, game app icon composition'
      ),
      size: { w: 512, h: 512 },
    },
    {
      id: 'gonggi-trophy',
      category: 'icons',
      fileName: 'icons/gonggi-trophy.png',
      prompt: cute(
        'Cute chibi golden trophy cup overflowing with sparkles and tiny stars, chubby rounded shape, big happy shine on surface, small confetti pieces falling around it, adorable game achievement icon, pastel gold'
      ),
      size: { w: 256, h: 256 },
    },
  ],

  board: [
    {
      id: 'board-x-mark',
      category: 'sprites',
      fileName: 'sprites/x-mark.png',
      prompt: cute('letter X mark for tic-tac-toe game, bold red color, hand-drawn style, playful'),
      size: { w: 256, h: 256 },
    },
    {
      id: 'board-o-mark',
      category: 'sprites',
      fileName: 'sprites/o-mark.png',
      prompt: cute('letter O mark for tic-tac-toe game, bold blue color, hand-drawn style, playful'),
      size: { w: 256, h: 256 },
    },
    {
      id: 'board-black-stone',
      category: 'sprites',
      fileName: 'sprites/gomoku-black-stone.png',
      prompt: cute('single black go stone, glossy, slight reflection, top-down view, circular'),
      size: { w: 256, h: 256 },
    },
    {
      id: 'board-white-stone',
      category: 'sprites',
      fileName: 'sprites/gomoku-white-stone.png',
      prompt: cute('single white go stone, glossy, slight reflection, top-down view, circular'),
      size: { w: 256, h: 256 },
    },
    {
      id: 'board-wood-texture',
      category: 'backgrounds',
      fileName: 'backgrounds/board-wood.png',
      prompt: 'wooden board game surface texture, light bamboo color, grid lines, traditional asian style, hand-painted watercolor feel, warm tones',
      size: { w: 720, h: 720 },
    },
  ],

  reaction: [
    {
      id: 'reaction-target',
      category: 'sprites',
      fileName: 'sprites/reaction-target.png',
      prompt: cute('circular target bullseye icon, red and white concentric rings, arcade game style'),
      size: { w: 256, h: 256 },
    },
    {
      id: 'reaction-bg',
      category: 'backgrounds',
      fileName: 'backgrounds/reaction-bg.png',
      prompt: 'dark arcade game background with subtle neon grid, retro futuristic, deep blue and purple, cute cartoon style',
      aspectRatio: '9:16',
      size: { w: 1080, h: 1920 },
    },
  ],
}

export function getPresets(presetName: string): AssetPreset[] {
  if (presetName === 'all') {
    return Object.values(presets).flat()
  }
  const found = presets[presetName]
  if (!found) {
    throw new Error(
      `Unknown preset: "${presetName}". Available: ${Object.keys(presets).join(', ')}, all`
    )
  }
  return found
}

export function getPresetsByCategory(category: string): AssetPreset[] {
  return Object.values(presets)
    .flat()
    .filter((p) => p.category === category)
}
