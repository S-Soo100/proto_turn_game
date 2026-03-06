// ── Types ──

export type StoneStatus = 'floor' | 'hand' | 'tossed' | 'air' | 'lost'
export type GamePhase =
  | 'scatter'
  | 'select'
  | 'hold'
  | 'toss'
  | 'pick'
  | 'catch'
  | 'stage-clear'
  | 'round-clear'
  | 'success'
  | 'failed'

export interface Stone {
  id: number
  status: StoneStatus
  x: number // 0~100 (% of board)
  y: number // 0~100 (% of board)
  z: number // 0=floor, 0.15=selected, 0.3=hold, 1.0=peak
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
  selectedStoneId: number | null
  seed: number
  triggeredChaosIds: string[]
  substepSnapshot: Stone[] | null  // snapshot for substep-only retry
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
  1: 12_000,
  2: 10_000,
  3: 9_000,
  4: 8_000,
  5: 15_000,
}

// Toss arc duration (ms) — how long the stone is in the air
const TOSS_DURATIONS: Record<number, number> = {
  1: 3000,
  2: 2800,
  3: 2600,
  4: 2200,
  5: 3000,
}

// Catch window (ms) — how long the player has to press catch
const CATCH_WINDOWS: Record<number, number> = {
  1: 600,
  2: 500,
  3: 450,
  4: 400,
  5: 600,
}

export type CatchTiming = 'perfect' | 'early' | 'miss'

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
  return STAGE_TIME_LIMITS[stage] ?? 12_000
}

/**
 * Toss arc duration for a stage (ms).
 */
export function getTossDuration(stage: number): number {
  return TOSS_DURATIONS[stage] ?? 3000
}

/**
 * Catch window duration for a stage (ms).
 */
export function getCatchWindow(stage: number): number {
  return CATCH_WINDOWS[stage] ?? 600
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
    z: 0,
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
    selectedStoneId: null,
    seed: s,
    triggeredChaosIds: [],

    substepSnapshot: null,
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
    z: 0,
  }))
  // Stage 5 skips select/hold → goes directly to toss
  const nextPhase: GamePhase = state.stage === 5 ? 'toss' : 'select'
  return { ...state, stones, phase: nextPhase, selectedStoneId: null, substepSnapshot: stones.map(s => ({ ...s })) }
}

/**
 * Select a floor stone to toss (stages 1-4 only).
 * Sets the stone z=0.15 for visual highlight, phase stays 'select'.
 */
export function selectStone(state: GonggiState, stoneId: number): GonggiState | null {
  if (state.phase !== 'select') return null

  const stone = state.stones.find((s) => s.id === stoneId)
  if (!stone || stone.status !== 'floor') return null

  // Reset previous selection and set new one
  const stones = state.stones.map((s) => ({
    ...s,
    z: s.id === stoneId ? 0.15 : 0,
  }))

  return { ...state, stones, selectedStoneId: stoneId }
}

/**
 * Move selected stone to hand (hold position), transition to 'hold' phase.
 * Sets stone z=0.3, status='hand'.
 */
export function holdStone(state: GonggiState): GonggiState | null {
  if (state.phase !== 'select' || state.selectedStoneId === null) return null

  const stones = state.stones.map((s) =>
    s.id === state.selectedStoneId
      ? { ...s, status: 'hand' as StoneStatus, z: 0.3 }
      : s
  )

  return { ...state, stones, phase: 'hold' }
}

/**
 * Pick up a stone from the floor to toss.
 * For stages 1-4: uses held stone (from hold phase). For stage 5: toss all.
 */
export function startToss(state: GonggiState): GonggiState {
  if (state.phase !== 'toss' && state.phase !== 'hold') return state

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
 * Success: tossed stone goes to hand. Failure (early/miss): stage fails.
 */
export function catchStone(state: GonggiState, success: boolean, timing?: CatchTiming): GonggiState {
  if (state.phase !== 'catch') return state

  if (!success || timing === 'early' || timing === 'miss') {
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

  // More substeps to go
  // Stage 5 → toss directly. Stages 1-4: if hand stone exists → toss, else → select
  const hasHandStone = state.stones.some((s) => s.status === 'hand')
  const nextPhase: GamePhase = state.stage === 5 ? 'toss' : (hasHandStone ? 'toss' : 'select')
  return {
    ...state,
    substep: nextSubstep,
    phase: nextPhase,
    selectedStoneId: null,
    substepSnapshot: state.stones.map(s => ({ ...s })),
  }
}

/**
 * Handle stage completion.
 */
export function checkStageComplete(state: GonggiState): GonggiState {
  if (state.stage >= MAX_STAGE) {
    return { ...state, phase: 'round-clear' }
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
  if (state.phase !== 'stage-clear' && state.phase !== 'round-clear') return state

  const isRoundClear = state.phase === 'round-clear'
  const nextStage = isRoundClear ? 1 : state.stage + 1
  const nextRound = isRoundClear ? state.round + 1 : state.round
  const rng = mulberry32(state.seed + nextStage * 1000 + nextRound * 10000)

  // Reset all stones to floor with new positions
  const stones = state.stones.map((s) => ({
    ...s,
    status: 'floor' as StoneStatus,
    x: 15 + rng() * 70,
    y: 15 + rng() * 70,
    z: 0,
  }))

  return {
    ...state,
    stones,
    stage: nextStage,
    round: nextRound,
    substep: 0,
    phase: 'scatter',
    tossedStoneId: null,
    selectedStoneId: null,
    triggeredChaosIds: [],

    substepSnapshot: null,
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
    z: 0,
  }))

  return {
    ...state,
    stones,
    substep: 0,
    phase: 'scatter',
    tossedStoneId: null,
    selectedStoneId: null,
    substepSnapshot: null,
  }
}

/**
 * Retry from the current substep using snapshot (preserves hand stones from previous substeps).
 * Falls back to retryStage if no snapshot exists.
 */
export function retrySubstep(state: GonggiState): GonggiState {
  if (!state.substepSnapshot) {
    return retryStage(state)
  }

  // Restore stones from snapshot
  const stones = state.substepSnapshot.map(s => ({ ...s }))

  // Determine next phase based on state
  const hasHandStone = stones.some(s => s.status === 'hand')
  const nextPhase: GamePhase = state.stage === 5 ? 'toss' : (hasHandStone ? 'toss' : 'select')

  return {
    ...state,
    stones,
    phase: nextPhase,
    tossedStoneId: null,
    selectedStoneId: null,
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
