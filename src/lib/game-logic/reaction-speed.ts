// ── Types ──

export type TargetType = 'normal' | 'speed'
export type Grade = 'perfect' | 'great' | 'good' | 'ok'

export interface TargetScheduleItem {
  id: number
  type: TargetType
  spawnTime: number   // ms from game start (0~120000)
  duration: number    // ms — normal=4000, speed=2000
  x: number           // 0~100 (% of game area width)
  y: number           // 0~100 (% of game area height)
}

export interface GameState {
  score: number
  combo: number
  maxCombo: number
  clicks: number
  misses: number
  grades: Record<Grade, number>
}

export interface ClickResult {
  score: number          // points earned (with combo multiplier)
  baseScore: number      // points before combo
  grade: Grade
  combo: number          // new combo count
  comboMultiplier: number
}

// ── Constants ──

export const GAME_DURATION_MS = 120_000
export const TOTAL_TARGETS = 100
export const NORMAL_COUNT = 70
export const SPEED_COUNT = 30
export const NORMAL_DURATION_MS = 4_000
export const SPEED_DURATION_MS = 2_000

const NORMAL_SCORE_MIN = 10
const NORMAL_SCORE_MAX = 100
const SPEED_SCORE_MULTIPLIER = 1.5

// Target circle size padding (% from edges) to keep circles fully visible
const PADDING_PCT = 8

// Grade thresholds (seconds remaining before expiry)
const GRADE_PERFECT_THRESHOLD = 0.3
const GRADE_GREAT_THRESHOLD = 1.0
const GRADE_GOOD_THRESHOLD = 2.0

// Combo milestones → multiplier
const COMBO_TIERS: [number, number][] = [
  [30, 5],
  [20, 4],
  [10, 3],
  [5, 2],
]

// ── Seeded Random (mulberry32) ──

function mulberry32(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Schedule Generation ──

export function generateSchedule(seed?: number): TargetScheduleItem[] {
  const rng = mulberry32(seed ?? Date.now())

  // Build type list: 70 normal + 30 speed, then shuffle
  const types: TargetType[] = [
    ...Array<TargetType>(NORMAL_COUNT).fill('normal'),
    ...Array<TargetType>(SPEED_COUNT).fill('speed'),
  ]
  // Fisher-Yates shuffle
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[types[i], types[j]] = [types[j], types[i]]
  }

  // Distribute spawn times across 120s with some variance
  // Average interval = 120000 / 100 = 1200ms
  // Add jitter ±400ms for natural feel, but keep ordered
  const avgInterval = GAME_DURATION_MS / TOTAL_TARGETS
  const jitter = 400
  const spawnTimes: number[] = []
  for (let i = 0; i < TOTAL_TARGETS; i++) {
    const base = i * avgInterval
    const offset = (rng() - 0.5) * 2 * jitter
    const t = Math.max(0, Math.min(GAME_DURATION_MS - 500, base + offset))
    spawnTimes.push(t)
  }
  // Sort to ensure chronological order
  spawnTimes.sort((a, b) => a - b)

  // Ensure last targets have time to fully play out
  // Cap latest spawn so duration fits within game
  const schedule: TargetScheduleItem[] = types.map((type, i) => {
    const duration = type === 'normal' ? NORMAL_DURATION_MS : SPEED_DURATION_MS
    const maxSpawn = GAME_DURATION_MS - duration
    const spawnTime = Math.min(spawnTimes[i], maxSpawn)

    return {
      id: i,
      type,
      spawnTime: Math.round(spawnTime),
      duration,
      x: PADDING_PCT + rng() * (100 - 2 * PADDING_PCT),
      y: PADDING_PCT + rng() * (100 - 2 * PADDING_PCT),
    }
  })

  return schedule
}

// ── Score Calculation ──

/**
 * Calculate base score for a click.
 * @param targetType - 'normal' or 'speed'
 * @param remainingRatio - 0.0 (just appeared) to 1.0 (about to expire)
 *   Higher ratio = clicked closer to expiry = higher score
 */
export function calculateScore(targetType: TargetType, remainingRatio: number): number {
  // remainingRatio: 0 = just spawned, 1 = about to die
  // Score scales linearly: min at ratio=0, max at ratio=1
  const clamped = Math.max(0, Math.min(1, remainingRatio))
  const base = NORMAL_SCORE_MIN + clamped * (NORMAL_SCORE_MAX - NORMAL_SCORE_MIN)
  const multiplier = targetType === 'speed' ? SPEED_SCORE_MULTIPLIER : 1
  return Math.round(base * multiplier)
}

/**
 * Convert remaining time (seconds before expiry) to a 0-1 ratio
 * where 0 = just spawned, 1 = about to expire.
 */
export function getRemainingRatio(clickTimeMs: number, spawnTimeMs: number, durationMs: number): number {
  const elapsed = clickTimeMs - spawnTimeMs
  return Math.max(0, Math.min(1, elapsed / durationMs))
}

// ── Grade ──

/**
 * Determine grade based on remaining time before expiry (in seconds).
 */
export function getGrade(remainingTimeSec: number): Grade {
  if (remainingTimeSec <= GRADE_PERFECT_THRESHOLD) return 'perfect'
  if (remainingTimeSec <= GRADE_GREAT_THRESHOLD) return 'great'
  if (remainingTimeSec <= GRADE_GOOD_THRESHOLD) return 'good'
  return 'ok'
}

// ── Combo ──

export function getComboMultiplier(comboCount: number): number {
  for (const [threshold, mult] of COMBO_TIERS) {
    if (comboCount >= threshold) return mult
  }
  return 1
}

// ── Game State ──

export function createInitialGameState(): GameState {
  return {
    score: 0,
    combo: 0,
    maxCombo: 0,
    clicks: 0,
    misses: 0,
    grades: { perfect: 0, great: 0, good: 0, ok: 0 },
  }
}

/**
 * Process a successful click on a target.
 * @param state - current game state
 * @param targetType - type of target clicked
 * @param clickTimeMs - game elapsed time when clicked (ms)
 * @param spawnTimeMs - when the target appeared (ms)
 * @param durationMs - target's total lifetime (ms)
 * @returns updated state and click result details
 */
export function applyClick(
  state: GameState,
  targetType: TargetType,
  clickTimeMs: number,
  spawnTimeMs: number,
  durationMs: number,
): { state: GameState; result: ClickResult } {
  const ratio = getRemainingRatio(clickTimeMs, spawnTimeMs, durationMs)
  const remainingTimeSec = (durationMs - (clickTimeMs - spawnTimeMs)) / 1000
  const grade = getGrade(remainingTimeSec)
  const baseScore = calculateScore(targetType, ratio)
  const newCombo = state.combo + 1
  const comboMultiplier = getComboMultiplier(newCombo)
  const score = Math.round(baseScore * comboMultiplier)

  const newState: GameState = {
    score: state.score + score,
    combo: newCombo,
    maxCombo: Math.max(state.maxCombo, newCombo),
    clicks: state.clicks + 1,
    misses: state.misses,
    grades: { ...state.grades, [grade]: state.grades[grade] + 1 },
  }

  return {
    state: newState,
    result: { score, baseScore, grade, combo: newCombo, comboMultiplier },
  }
}

/**
 * Process a missed target (expired without click).
 */
export function applyMiss(state: GameState): GameState {
  return {
    ...state,
    combo: 0,
    misses: state.misses + 1,
  }
}

/**
 * Calculate accuracy as a ratio (0-1).
 */
export function getAccuracy(state: GameState): number {
  const total = state.clicks + state.misses
  if (total === 0) return 0
  return state.clicks / total
}
