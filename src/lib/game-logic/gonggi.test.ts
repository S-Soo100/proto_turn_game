import { describe, it, expect } from 'vitest'
import {
  createInitialState,
  scatterStones,
  selectStone,
  holdStone,
  startToss,
  completeToss,
  pickStones,
  catchStone,
  advanceSubstep,
  advanceStage,
  checkStageComplete,
  failSubstep,
  retryStage,
  loseStone,
  getResult,
  updateElapsedMs,
  getFloorStoneCount,
  getHandStoneCount,
  getAvailableStoneCount,
  getSubstepCount,
  getRequiredPickCount,
  getTimeLimit,
  getTossDuration,
  getCatchWindow,
  mulberry32,
  STONE_COUNT,
  MAX_STAGE,
  type GonggiState,
} from './gonggi'

// ── Helpers ──

const SEED = 42

function makeState(overrides: Partial<GonggiState> = {}): GonggiState {
  return { ...createInitialState(SEED), ...overrides }
}

// ── mulberry32 RNG ──

describe('mulberry32', () => {
  it('produces deterministic values from the same seed', () => {
    const rng1 = mulberry32(123)
    const rng2 = mulberry32(123)
    expect(rng1()).toBe(rng2())
    expect(rng1()).toBe(rng2())
    expect(rng1()).toBe(rng2())
  })

  it('produces values in [0, 1)', () => {
    const rng = mulberry32(999)
    for (let i = 0; i < 100; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('different seeds produce different sequences', () => {
    const rng1 = mulberry32(1)
    const rng2 = mulberry32(2)
    // Very unlikely to be equal with different seeds
    expect(rng1()).not.toBe(rng2())
  })
})

// ── Stage Configuration ──

describe('getSubstepCount', () => {
  it('stage 1 has 4 substeps', () => expect(getSubstepCount(1)).toBe(4))
  it('stage 2 has 2 substeps', () => expect(getSubstepCount(2)).toBe(2))
  it('stage 3 has 2 substeps', () => expect(getSubstepCount(3)).toBe(2))
  it('stage 4 has 1 substep', () => expect(getSubstepCount(4)).toBe(1))
  it('stage 5 has 2 substeps', () => expect(getSubstepCount(5)).toBe(2))
  it('invalid stage returns 0', () => expect(getSubstepCount(6)).toBe(0))
})

describe('getRequiredPickCount', () => {
  it('stage 1: always 1', () => {
    expect(getRequiredPickCount(1, 0)).toBe(1)
    expect(getRequiredPickCount(1, 3)).toBe(1)
  })
  it('stage 2: always 2', () => expect(getRequiredPickCount(2, 0)).toBe(2))
  it('stage 3 substep 0: 3', () => expect(getRequiredPickCount(3, 0)).toBe(3))
  it('stage 3 substep 1: 1', () => expect(getRequiredPickCount(3, 1)).toBe(1))
  it('stage 4: 4', () => expect(getRequiredPickCount(4, 0)).toBe(4))
  it('stage 5: 5', () => expect(getRequiredPickCount(5, 0)).toBe(5))
})

describe('getTimeLimit', () => {
  it('stage 1 = 8000ms', () => expect(getTimeLimit(1)).toBe(8000))
  it('stage 5 = 10000ms', () => expect(getTimeLimit(5)).toBe(10000))
  it('invalid stage returns default 8000ms', () => expect(getTimeLimit(99)).toBe(8000))
})

// ── createInitialState ──

describe('createInitialState', () => {
  it('creates 5 stones on the floor', () => {
    const state = createInitialState(SEED)
    expect(state.stones).toHaveLength(STONE_COUNT)
    state.stones.forEach((s) => expect(s.status).toBe('floor'))
  })

  it('starts at stage 1, substep 0, scatter phase', () => {
    const state = createInitialState(SEED)
    expect(state.stage).toBe(1)
    expect(state.substep).toBe(0)
    expect(state.phase).toBe('scatter')
  })

  it('starts with round 1, zero fail count', () => {
    const state = createInitialState(SEED)
    expect(state.round).toBe(1)
    expect(state.failCount).toBe(0)
    expect(state.chaosSurvived).toBe(0)
  })

  it('stores the seed', () => {
    const state = createInitialState(SEED)
    expect(state.seed).toBe(SEED)
  })

  it('all stones start with z=0', () => {
    const state = createInitialState(SEED)
    state.stones.forEach((s) => expect(s.z).toBe(0))
  })

  it('deterministic with same seed', () => {
    const s1 = createInitialState(SEED)
    const s2 = createInitialState(SEED)
    expect(s1.stones).toEqual(s2.stones)
  })

  it('stones are within bounds (15~85)', () => {
    const state = createInitialState(SEED)
    state.stones.forEach((s) => {
      expect(s.x).toBeGreaterThanOrEqual(15)
      expect(s.x).toBeLessThanOrEqual(85)
      expect(s.y).toBeGreaterThanOrEqual(15)
      expect(s.y).toBeLessThanOrEqual(85)
    })
  })
})

// ── scatterStones ──

describe('scatterStones', () => {
  it('sets all stones to floor and transitions to select phase (stages 1-4)', () => {
    const state = makeState({ phase: 'scatter', stage: 1 })
    const next = scatterStones(state)
    expect(next.phase).toBe('select')
    next.stones.forEach((s) => expect(s.status).toBe('floor'))
  })

  it('transitions to toss phase for stage 5', () => {
    const state = makeState({ phase: 'scatter', stage: 5 })
    const next = scatterStones(state)
    expect(next.phase).toBe('toss')
  })

  it('repositions stones randomly', () => {
    const state = makeState()
    const next = scatterStones(state)
    // At least one stone should have moved (probabilistic, but extremely likely)
    const moved = next.stones.some((s, i) => s.x !== state.stones[i].x || s.y !== state.stones[i].y)
    expect(moved).toBe(true)
  })

  it('resets all stones z to 0', () => {
    const state = makeState()
    const next = scatterStones(state)
    next.stones.forEach((s) => expect(s.z).toBe(0))
  })
})

// ── selectStone ──

describe('selectStone', () => {
  it('returns null if phase is not select', () => {
    const state = makeState({ phase: 'toss' })
    expect(selectStone(state, 0)).toBeNull()
  })

  it('returns null if stone is not on floor', () => {
    const stones = createInitialState(SEED).stones.map((s, i) =>
      i === 0 ? { ...s, status: 'hand' as const } : s
    )
    const state = makeState({ phase: 'select', stones })
    expect(selectStone(state, 0)).toBeNull()
  })

  it('selects a floor stone and sets z=0.15', () => {
    const state = makeState({ phase: 'select' })
    const next = selectStone(state, 2)
    expect(next).not.toBeNull()
    expect(next!.selectedStoneId).toBe(2)
    expect(next!.stones[2].z).toBe(0.15)
  })

  it('deselects previous stone when selecting a new one', () => {
    const state = makeState({ phase: 'select', selectedStoneId: 0 })
    const next = selectStone(state, 2)
    expect(next).not.toBeNull()
    expect(next!.stones[0].z).toBe(0)
    expect(next!.stones[2].z).toBe(0.15)
    expect(next!.selectedStoneId).toBe(2)
  })
})

// ── holdStone ──

describe('holdStone', () => {
  it('returns null if phase is not select', () => {
    const state = makeState({ phase: 'toss' })
    expect(holdStone(state)).toBeNull()
  })

  it('returns null if no stone selected', () => {
    const state = makeState({ phase: 'select', selectedStoneId: null })
    expect(holdStone(state)).toBeNull()
  })

  it('moves selected stone to hand with z=0.3', () => {
    const state = makeState({ phase: 'select', selectedStoneId: 1 })
    const next = holdStone(state)
    expect(next).not.toBeNull()
    expect(next!.phase).toBe('hold')
    expect(next!.stones[1].status).toBe('hand')
    expect(next!.stones[1].z).toBe(0.3)
  })
})

// ── startToss (stages 1-4) ──

describe('startToss', () => {
  it('does nothing if phase is not toss or hold', () => {
    const state = makeState({ phase: 'pick' })
    expect(startToss(state)).toBe(state)
  })

  it('works from hold phase and sets phase to pick', () => {
    const stones = createInitialState(SEED).stones.map((s, i) =>
      i === 0 ? { ...s, status: 'hand' as const, z: 0.3 } : s
    )
    const state = makeState({ phase: 'hold', stones, selectedStoneId: 0 })
    const next = startToss(state)
    expect(next.phase).toBe('pick')
    expect(next.tossedStoneId).not.toBeNull()
    const tossed = next.stones.filter((s) => s.status === 'tossed')
    expect(tossed).toHaveLength(1)
  })

  it('works from toss phase (stage 5)', () => {
    const state = makeState({ phase: 'toss' })
    const next = startToss(state)
    expect(next.phase).toBe('pick')
  })

  it('stage 5: tosses all stones, phase = catch', () => {
    const state = makeState({ stage: 5, phase: 'toss' })
    const next = startToss(state)
    expect(next.phase).toBe('catch')
    expect(next.tossedStoneId).toBe(-1)
    next.stones.forEach((s) => expect(s.status).toBe('tossed'))
  })
})

// ── completeToss ──

describe('completeToss', () => {
  it('moves tossed stones to air status', () => {
    const state = makeState({ phase: 'toss' })
    const tossed = startToss(state)
    const completed = completeToss(tossed)
    const airStones = completed.stones.filter((s) => s.status === 'air')
    expect(airStones).toHaveLength(1)
  })
})

// ── pickStones ──

describe('pickStones', () => {
  it('returns null if phase is not pick', () => {
    const state = makeState({ phase: 'toss' })
    expect(pickStones(state, [0])).toBeNull()
  })

  it('returns null if wrong number of stones picked', () => {
    const state = makeState({ phase: 'pick', stage: 1, substep: 0 })
    // Stage 1 requires 1 stone, trying to pick 2
    expect(pickStones(state, [0, 1])).toBeNull()
  })

  it('returns null if picked stone is not on floor', () => {
    const stones = createInitialState(SEED).stones.map((s, i) =>
      i === 0 ? { ...s, status: 'hand' as const } : s
    )
    const state = makeState({ phase: 'pick', stones })
    expect(pickStones(state, [0])).toBeNull()
  })

  it('successfully picks floor stones and transitions to catch', () => {
    // Simulate: one stone is tossed (air), others on floor
    const stones = createInitialState(SEED).stones.map((s, i) =>
      i === 0 ? { ...s, status: 'air' as const } : s
    )
    const state = makeState({ phase: 'pick', stage: 1, substep: 0, stones })
    const next = pickStones(state, [1])
    expect(next).not.toBeNull()
    expect(next!.phase).toBe('catch')
    expect(next!.stones[1].status).toBe('hand')
  })

  it('stage 2: picks 2 stones', () => {
    const stones = createInitialState(SEED).stones.map((s, i) =>
      i === 0 ? { ...s, status: 'air' as const } : s
    )
    const state = makeState({ phase: 'pick', stage: 2, substep: 0, stones })
    const next = pickStones(state, [1, 2])
    expect(next).not.toBeNull()
    expect(next!.stones[1].status).toBe('hand')
    expect(next!.stones[2].status).toBe('hand')
  })
})

// ── catchStone ──

describe('catchStone', () => {
  it('does nothing if phase is not catch', () => {
    const state = makeState({ phase: 'pick' })
    expect(catchStone(state, true)).toBe(state)
  })

  it('on success: moves air stones to hand and advances substep', () => {
    const stones = createInitialState(SEED).stones.map((s, i) =>
      i === 0
        ? { ...s, status: 'air' as const }
        : i === 1
          ? { ...s, status: 'hand' as const }
          : s
    )
    const state = makeState({ phase: 'catch', stage: 1, substep: 0, stones })
    const next = catchStone(state, true)
    expect(next.stones[0].status).toBe('hand')
    // Stage 1 has 4 substeps, substep 0 → 1
    // Both stones 0 and 1 are now 'hand', so next phase = toss
    expect(next.substep).toBe(1)
    expect(next.phase).toBe('toss')
  })

  it('on failure: increments failCount and sets failed phase', () => {
    const state = makeState({ phase: 'catch', failCount: 0 })
    const next = catchStone(state, false)
    expect(next.phase).toBe('failed')
    expect(next.failCount).toBe(1)
  })
})

// ── advanceSubstep ──

describe('advanceSubstep', () => {
  it('advances substep to select if no hand stone', () => {
    const state = makeState({ stage: 1, substep: 0 })
    // All stones on floor → next substep goes to select
    const next = advanceSubstep(state)
    expect(next.substep).toBe(1)
    expect(next.phase).toBe('select')
  })

  it('advances substep to toss if hand stone exists', () => {
    const stones = createInitialState(SEED).stones.map((s, i) =>
      i === 0 ? { ...s, status: 'hand' as const } : s
    )
    const state = makeState({ stage: 1, substep: 0, stones })
    const next = advanceSubstep(state)
    expect(next.substep).toBe(1)
    expect(next.phase).toBe('toss')
  })

  it('advances substep to toss for stage 5', () => {
    const state = makeState({ stage: 5, substep: 0 })
    const next = advanceSubstep(state)
    expect(next.substep).toBe(1)
    expect(next.phase).toBe('toss')
  })

  it('completes stage when all substeps done', () => {
    const state = makeState({ stage: 1, substep: 3 })
    const next = advanceSubstep(state)
    // Stage 1 has 4 substeps (0-3), so after substep 3 → stage-clear
    expect(next.phase).toBe('stage-clear')
  })

  it('triggers round-clear after stage 5', () => {
    const state = makeState({ stage: MAX_STAGE, substep: 1 })
    const next = advanceSubstep(state)
    expect(next.phase).toBe('round-clear')
  })
})

// ── advanceStage ──

describe('advanceStage', () => {
  it('does nothing if phase is not stage-clear or round-clear', () => {
    const state = makeState({ phase: 'toss' })
    expect(advanceStage(state)).toBe(state)
  })

  it('advances to next stage with reset stones on floor', () => {
    const state = makeState({ stage: 1, phase: 'stage-clear' })
    const next = advanceStage(state)
    expect(next.stage).toBe(2)
    expect(next.substep).toBe(0)
    expect(next.phase).toBe('scatter')
    next.stones.forEach((s) => expect(s.status).toBe('floor'))
  })

  it('resets all stones z to 0', () => {
    const state = makeState({ stage: 1, phase: 'stage-clear' })
    const next = advanceStage(state)
    next.stones.forEach((s) => expect(s.z).toBe(0))
  })

  it('clears triggered chaos ids', () => {
    const state = makeState({
      stage: 1,
      phase: 'stage-clear',
      triggeredChaosIds: ['bird-transform'],
    })
    const next = advanceStage(state)
    expect(next.triggeredChaosIds).toEqual([])
  })
})

// ── Round Loop ──

describe('round loop', () => {
  it('checkStageComplete returns round-clear when stage >= MAX_STAGE', () => {
    const state = makeState({ stage: MAX_STAGE })
    const next = checkStageComplete(state)
    expect(next.phase).toBe('round-clear')
  })

  it('checkStageComplete returns stage-clear when stage < MAX_STAGE', () => {
    const state = makeState({ stage: 3 })
    const next = checkStageComplete(state)
    expect(next.phase).toBe('stage-clear')
  })

  it('advanceStage from round-clear resets to stage 1 and increments round', () => {
    const state = makeState({ stage: MAX_STAGE, round: 1, phase: 'round-clear' })
    const next = advanceStage(state)
    expect(next.stage).toBe(1)
    expect(next.round).toBe(2)
    expect(next.substep).toBe(0)
    expect(next.phase).toBe('scatter')
    next.stones.forEach((s) => {
      expect(s.status).toBe('floor')
      expect(s.z).toBe(0)
    })
  })

  it('advanceStage from round-clear resets isFlipped to false', () => {
    const state = makeState({ stage: MAX_STAGE, round: 1, phase: 'round-clear', isFlipped: true })
    const next = advanceStage(state)
    expect(next.isFlipped).toBe(false)
  })

  it('supports continuous round progression R1 → R2 → R3', () => {
    // R1 round-clear
    let state = makeState({ stage: MAX_STAGE, round: 1, phase: 'round-clear' })
    state = advanceStage(state)
    expect(state.stage).toBe(1)
    expect(state.round).toBe(2)

    // Simulate R2 completion
    state = { ...state, stage: MAX_STAGE, phase: 'round-clear' }
    state = advanceStage(state)
    expect(state.stage).toBe(1)
    expect(state.round).toBe(3)

    // Simulate R3 completion
    state = { ...state, stage: MAX_STAGE, phase: 'round-clear' }
    state = advanceStage(state)
    expect(state.stage).toBe(1)
    expect(state.round).toBe(4)
  })
})

// ── failSubstep & retryStage ──

describe('failSubstep', () => {
  it('sets phase to failed and increments fail count', () => {
    const state = makeState({ failCount: 2 })
    const next = failSubstep(state)
    expect(next.phase).toBe('failed')
    expect(next.failCount).toBe(3)
  })
})

describe('retryStage', () => {
  it('resets substep and phase to scatter', () => {
    const state = makeState({ stage: 2, substep: 1, phase: 'failed', failCount: 1 })
    const next = retryStage(state)
    expect(next.substep).toBe(0)
    expect(next.phase).toBe('scatter')
    expect(next.tossedStoneId).toBeNull()
  })

  it('resets all stones to floor with z=0', () => {
    const stones = createInitialState(SEED).stones.map((s) => ({
      ...s,
      status: 'hand' as const,
    }))
    const state = makeState({ stones, phase: 'failed' })
    const next = retryStage(state)
    next.stones.forEach((s) => {
      expect(s.status).toBe('floor')
      expect(s.z).toBe(0)
    })
  })
})

// ── loseStone ──

describe('loseStone', () => {
  it('sets specified stone status to lost', () => {
    const state = makeState()
    const next = loseStone(state, 2)
    expect(next.stones[2].status).toBe('lost')
    expect(next.stones[0].status).toBe('floor')
  })
})

// ── getResult ──

describe('getResult', () => {
  it('returns null if game is not complete', () => {
    const state = makeState({ phase: 'toss' })
    expect(getResult(state)).toBeNull()
  })

  it('returns result on success', () => {
    const state = makeState({
      phase: 'success',
      elapsedMs: 45000,
      failCount: 3,
      chaosSurvived: 2,
    })
    const result = getResult(state)
    expect(result).toEqual({
      clearTimeMs: 45000,
      failCount: 3,
      chaosSurvived: 2,
    })
  })
})

// ── Utility functions ──

describe('updateElapsedMs', () => {
  it('updates elapsed time', () => {
    const state = makeState()
    const next = updateElapsedMs(state, 5000)
    expect(next.elapsedMs).toBe(5000)
  })
})

describe('getFloorStoneCount', () => {
  it('counts floor stones', () => {
    const state = makeState()
    expect(getFloorStoneCount(state)).toBe(5)
  })

  it('excludes non-floor stones', () => {
    const stones = createInitialState(SEED).stones.map((s, i) =>
      i < 2 ? { ...s, status: 'hand' as const } : s
    )
    const state = makeState({ stones })
    expect(getFloorStoneCount(state)).toBe(3)
  })
})

describe('getHandStoneCount', () => {
  it('counts hand stones', () => {
    const stones = createInitialState(SEED).stones.map((s, i) =>
      i < 3 ? { ...s, status: 'hand' as const } : s
    )
    const state = makeState({ stones })
    expect(getHandStoneCount(state)).toBe(3)
  })
})

describe('getAvailableStoneCount', () => {
  it('excludes lost stones', () => {
    const stones = createInitialState(SEED).stones.map((s, i) =>
      i === 0 ? { ...s, status: 'lost' as const } : s
    )
    const state = makeState({ stones })
    expect(getAvailableStoneCount(state)).toBe(4)
  })
})

// ── Full game flow ──

describe('full game flow — stage 1 completion', () => {
  it('completes stage 1 through 4 substeps (select→hold→toss→pick→catch, then toss→pick→catch)', () => {
    let state = createInitialState(SEED)
    state = scatterStones(state)
    expect(state.phase).toBe('select')

    // 4 substeps for stage 1
    for (let sub = 0; sub < 4; sub++) {
      if (sub === 0) {
        // First substep: select → hold → toss
        const floorStoneToToss = state.stones.find((s) => s.status === 'floor')!
        const selected = selectStone(state, floorStoneToToss.id)
        expect(selected).not.toBeNull()
        state = selected!

        const held = holdStone(state)
        expect(held).not.toBeNull()
        state = held!
        expect(state.phase).toBe('hold')
      } else {
        // Subsequent substeps: hand stone exists → directly toss
        expect(state.phase).toBe('toss')
      }

      state = startToss(state)
      expect(state.phase).toBe('pick')
      const tossedId = state.tossedStoneId!

      state = completeToss(state)

      // Pick one floor stone
      const floorStone = state.stones.find(
        (s) => s.status === 'floor' && s.id !== tossedId
      )
      expect(floorStone).toBeDefined()

      const picked = pickStones(state, [floorStone!.id])
      expect(picked).not.toBeNull()
      state = picked!

      // Catch the tossed stone
      state = catchStone(state, true)

      if (sub < 3) {
        // After catch, tossed stone is now hand → next phase is toss
        expect(state.phase).toBe('toss')
        expect(state.substep).toBe(sub + 1)
      }
    }

    // After 4 substeps, stage should be clear
    expect(state.phase).toBe('stage-clear')
  })
})

describe('full game flow — stage progression', () => {
  it('advances from stage 1 to stage 2', () => {
    const state = makeState({ stage: 1, phase: 'stage-clear' })
    const next = advanceStage(state)
    expect(next.stage).toBe(2)
    expect(next.phase).toBe('scatter')
  })
})

describe('immutability', () => {
  it('functions return new state objects', () => {
    const state = makeState({ phase: 'toss' })
    const next = startToss(state)
    expect(next).not.toBe(state)
    expect(next.stones).not.toBe(state.stones)
  })
})

// ── Timing constants ──

describe('getTossDuration', () => {
  it('stage 1 = 2400ms', () => expect(getTossDuration(1)).toBe(2400))
  it('stage 2 = 2200ms', () => expect(getTossDuration(2)).toBe(2200))
  it('stage 3 = 2000ms', () => expect(getTossDuration(3)).toBe(2000))
  it('stage 4 = 1800ms', () => expect(getTossDuration(4)).toBe(1800))
  it('stage 5 = 2400ms', () => expect(getTossDuration(5)).toBe(2400))
  it('invalid stage = 2400ms default', () => expect(getTossDuration(99)).toBe(2400))
})

describe('getCatchWindow', () => {
  it('stage 1 = 500ms', () => expect(getCatchWindow(1)).toBe(500))
  it('stage 4 = 300ms (hardest)', () => expect(getCatchWindow(4)).toBe(300))
  it('stage 5 = 500ms', () => expect(getCatchWindow(5)).toBe(500))
  it('invalid stage = 500ms default', () => expect(getCatchWindow(99)).toBe(500))
})

// ── catchStone with timing ──

describe('catchStone with timing', () => {
  it('early timing causes failure', () => {
    const stones = createInitialState(SEED).stones.map((s, i) =>
      i === 0 ? { ...s, status: 'air' as const } : s
    )
    const state = makeState({ phase: 'catch', stones })
    const next = catchStone(state, false, 'early')
    expect(next.phase).toBe('failed')
    expect(next.failCount).toBe(1)
  })

  it('miss timing causes failure', () => {
    const stones = createInitialState(SEED).stones.map((s, i) =>
      i === 0 ? { ...s, status: 'air' as const } : s
    )
    const state = makeState({ phase: 'catch', stones })
    const next = catchStone(state, false, 'miss')
    expect(next.phase).toBe('failed')
  })

  it('perfect timing succeeds', () => {
    const stones = createInitialState(SEED).stones.map((s, i) =>
      i === 0 ? { ...s, status: 'air' as const } : s
    )
    const state = makeState({ phase: 'catch', stage: 1, substep: 0, stones })
    const next = catchStone(state, true, 'perfect')
    expect(next.phase).not.toBe('failed')
    expect(next.stones[0].status).toBe('hand')
  })
})
