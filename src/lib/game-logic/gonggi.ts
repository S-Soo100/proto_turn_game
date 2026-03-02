// ── Types ──

export type StoneStatus = 'floor' | 'hand' | 'tossed' | 'air' | 'lost'
export type GamePhase =
  | 'scatter'
  | 'toss'
  | 'pick'
  | 'catch'
  | 'stage-clear'
  | 'success'
  | 'failed'

export interface Stone {
  id: number
  status: StoneStatus
  x: number // 0~100 (% of board)
  y: number // 0~100 (% of board)
}

export interface GonggiState {
  stones: Stone[]
  stage: number            // 1~5
  substep: number          // 0-indexed within stage
  phase: GamePhase
  round: number            // increments on full 1-5 cycle restart
  failCount: number
  chaosSurvived: number
  elapsedMs: number
  tossedStoneId: number | null
  seed: number
  triggeredChaosIds: string[]
  isFlipped: boolean       // screen-flip chaos
}

export interface GonggiResult {
  clearTimeMs: number
  failCount: number
  chaosSurvived: number
}

// ── Constants ──

export const STONE_COUNT = 5
export const MAX_STAGE = 5

// Time limits per stage (ms)
const STAGE_TIME_LIMITS: Record<number, number> = {
  1: 8_000,
  2: 7_000,
  3: 6_000,
  4: 5_000,
  5: 10_000,
}

// ── Seeded Random (mulberry32) ──

export function mulberry32(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Stage Configuration ──

/**
 * Number of substeps for each stage.
 * Stage 1: pick 1 stone x4
 * Stage 2: pick 2 stones x2
 * Stage 3: pick 3, then pick 1
 * Stage 4: pick 4 at once
 * Stage 5: toss all, catch with back of hand, toss+catch
 */
export function getSubstepCount(stage: number): number {
  switch (stage) {
    case 1: return 4
    case 2: return 2
    case 3: return 2
    case 4: return 1
    case 5: return 2
    default: return 0
  }
}

/**
 * How many stones must be picked in the given substep.
 * Stage 3 substep 0 = pick 3, substep 1 = pick 1
 */
export function getRequiredPickCount(stage: number, substep: number): number {
  switch (stage) {
    case 1: return 1
    case 2: return 2
    case 3: return substep === 0 ? 3 : 1
    case 4: return 4
    case 5: return substep === 0 ? 5 : 5 // toss all, catch all
    default: return 0
  }
}

/**
 * Time limit for a stage action (ms).
 */
export function getTimeLimit(stage: number): number {
  return STAGE_TIME_LIMITS[stage] ?? 8_000
}

// ── State Functions ──

export function createInitialState(seed?: number): GonggiState {
  const s = seed ?? Date.now()
  const rng = mulberry32(s)
  const stones: Stone[] = Array.from({ length: STONE_COUNT }, (_, i) => ({
    id: i,
    status: 'floor' as StoneStatus,
    x: 20 + rng() * 60,
    y: 20 + rng() * 60,
  }))

  return {
    stones,
    stage: 1,
    substep: 0,
    phase: 'scatter',
    round: 1,
    failCount: 0,
    chaosSurvived: 0,
    elapsedMs: 0,
    tossedStoneId: null,
    seed: s,
    triggeredChaosIds: [],
    isFlipped: false,
  }
}

/**
 * Scatter stones randomly on the floor.
 */
export function scatterStones(state: GonggiState): GonggiState {
  const rng = mulberry32(state.seed + state.stage * 100 + state.substep * 10 + state.round * 1000)
  const stones = state.stones.map((s) => ({
    ...s,
    status: 'floor' as StoneStatus,
    x: 15 + rng() * 70,
    y: 15 + rng() * 70,
  }))
  return { ...state, stones, phase: 'toss' }
}

/**
 * Pick up a stone from the floor to toss.
 * For stages 1-4: first available floor stone is tossed.
 * For stage 5: all stones are tossed.
 */
export function startToss(state: GonggiState): GonggiState {
  if (state.phase !== 'toss') return state

  if (state.stage === 5) {
    // Stage 5: toss all stones
    const stones = state.stones.map((s) =>
      s.status === 'floor' || s.status === 'hand'
        ? { ...s, status: 'tossed' as StoneStatus }
        : s
    )
    return { ...state, stones, phase: 'catch', tossedStoneId: -1 }
  }

  // Stages 1-4: toss one stone (prefer hand stone, fallback to floor)
  const handStone = state.stones.find((s) => s.status === 'hand')
  const tossCandidate = handStone ?? state.stones.find((s) => s.status === 'floor')
  if (!tossCandidate) return state

  const stones = state.stones.map((s) =>
    s.id === tossCandidate.id ? { ...s, status: 'tossed' as StoneStatus } : s
  )
  return { ...state, stones, phase: 'pick', tossedStoneId: tossCandidate.id }
}

/**
 * Complete the toss — stone is now in the air.
 */
export function completeToss(state: GonggiState): GonggiState {
  const stones = state.stones.map((s) =>
    s.status === 'tossed' ? { ...s, status: 'air' as StoneStatus } : s
  )
  return { ...state, stones }
}

/**
 * Pick stones from the floor while tossed stone is in the air.
 * Returns null if invalid pick count.
 */
export function pickStones(state: GonggiState, pickedIds: number[]): GonggiState | null {
  if (state.phase !== 'pick') return null

  const requiredCount = getRequiredPickCount(state.stage, state.substep)
  if (pickedIds.length !== requiredCount) return null

  // Validate all picked stones are on the floor
  const validPick = pickedIds.every((id) => {
    const stone = state.stones.find((s) => s.id === id)
    return stone && stone.status === 'floor'
  })
  if (!validPick) return null

  const stones = state.stones.map((s) =>
    pickedIds.includes(s.id) ? { ...s, status: 'hand' as StoneStatus } : s
  )
  return { ...state, stones, phase: 'catch' }
}

/**
 * Catch the tossed stone (player catches it).
 * Success: tossed stone goes to hand. Failure: stage fails.
 */
export function catchStone(state: GonggiState, success: boolean): GonggiState {
  if (state.phase !== 'catch') return state

  if (!success) {
    return failSubstep(state)
  }

  // Move air/tossed stones to hand
  const stones = state.stones.map((s) =>
    s.status === 'air' || s.status === 'tossed'
      ? { ...s, status: 'hand' as StoneStatus }
      : s
  )

  return advanceSubstep({ ...state, stones })
}

/**
 * Advance to next substep or stage.
 */
export function advanceSubstep(state: GonggiState): GonggiState {
  const nextSubstep = state.substep + 1
  const totalSubsteps = getSubstepCount(state.stage)

  if (nextSubstep >= totalSubsteps) {
    return checkStageComplete(state)
  }

  // More substeps to go — scatter remaining floor stones and start next toss
  return {
    ...state,
    substep: nextSubstep,
    phase: 'toss',
  }
}

/**
 * Handle stage completion.
 */
export function checkStageComplete(state: GonggiState): GonggiState {
  if (state.stage >= MAX_STAGE) {
    return checkGameComplete(state)
  }

  return {
    ...state,
    phase: 'stage-clear',
  }
}

/**
 * Advance to the next stage after stage-clear.
 */
export function advanceStage(state: GonggiState): GonggiState {
  if (state.phase !== 'stage-clear') return state

  const nextStage = state.stage + 1
  const rng = mulberry32(state.seed + nextStage * 1000 + state.round * 10000)

  // Reset all stones to floor with new positions
  const stones = state.stones.map((s) => ({
    ...s,
    status: 'floor' as StoneStatus,
    x: 15 + rng() * 70,
    y: 15 + rng() * 70,
  }))

  return {
    ...state,
    stones,
    stage: nextStage,
    substep: 0,
    phase: 'scatter',
    tossedStoneId: null,
    triggeredChaosIds: [],
  }
}

/**
 * Check if the full game is complete (all 5 stages cleared).
 */
export function checkGameComplete(state: GonggiState): GonggiState {
  return {
    ...state,
    phase: 'success',
  }
}

/**
 * Fail the current substep — increment fail counter, reset stage.
 */
export function failSubstep(state: GonggiState): GonggiState {
  return {
    ...state,
    phase: 'failed',
    failCount: state.failCount + 1,
  }
}

/**
 * Retry after a failure — reset current stage.
 */
export function retryStage(state: GonggiState): GonggiState {
  const rng = mulberry32(state.seed + state.stage * 100 + state.failCount * 50 + state.round * 1000)

  const stones = state.stones.map((s) => ({
    ...s,
    status: 'floor' as StoneStatus,
    x: 15 + rng() * 70,
    y: 15 + rng() * 70,
  }))

  return {
    ...state,
    stones,
    substep: 0,
    phase: 'scatter',
    tossedStoneId: null,
  }
}

/**
 * Mark a stone as lost (e.g., bird-transform chaos).
 */
export function loseStone(state: GonggiState, stoneId: number): GonggiState {
  const stones = state.stones.map((s) =>
    s.id === stoneId ? { ...s, status: 'lost' as StoneStatus } : s
  )
  return { ...state, stones }
}

/**
 * Get the game result (only valid when phase === 'success').
 */
export function getResult(state: GonggiState): GonggiResult | null {
  if (state.phase !== 'success') return null
  return {
    clearTimeMs: state.elapsedMs,
    failCount: state.failCount,
    chaosSurvived: state.chaosSurvived,
  }
}

/**
 * Update elapsed time.
 */
export function updateElapsedMs(state: GonggiState, ms: number): GonggiState {
  return { ...state, elapsedMs: ms }
}

/**
 * Get count of stones on the floor.
 */
export function getFloorStoneCount(state: GonggiState): number {
  return state.stones.filter((s) => s.status === 'floor').length
}

/**
 * Get count of stones in hand.
 */
export function getHandStoneCount(state: GonggiState): number {
  return state.stones.filter((s) => s.status === 'hand').length
}

/**
 * Get count of available stones (not lost).
 */
export function getAvailableStoneCount(state: GonggiState): number {
  return state.stones.filter((s) => s.status !== 'lost').length
}
