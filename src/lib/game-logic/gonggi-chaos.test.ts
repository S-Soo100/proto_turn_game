import { describe, it, expect } from 'vitest'
import {
  getChaosChance,
  shouldTriggerChaos,
  selectRule,
  applyChaosToState,
  checkChaos,
  type ChaosRule,
} from './gonggi-chaos'
import { createInitialState } from './gonggi'
import { birdTransformRule } from './chaos-rules/bird-transform'
import { catSwipeRule } from './chaos-rules/cat-swipe'
import { stoneEyesRule } from './chaos-rules/stone-eyes'
import { fakeClearRule } from './chaos-rules/fake-clear'
import { splitRule } from './chaos-rules/split'
import { danmakuRule } from './chaos-rules/danmaku'
import { screenFlipRule } from './chaos-rules/screen-flip'

// ── Helpers ──

const SEED = 42

function makeRng(value: number): () => number {
  return () => value
}

function makeSequenceRng(values: number[]): () => number {
  let i = 0
  return () => values[i++ % values.length]
}

const ALL_RULES: ChaosRule[] = [
  birdTransformRule,
  catSwipeRule,
  stoneEyesRule,
  fakeClearRule,
  splitRule,
  danmakuRule,
  screenFlipRule,
]

// ── getChaosChance ──

describe('getChaosChance', () => {
  it('rounds 1-2: 0%', () => {
    expect(getChaosChance(1)).toBe(0)
    expect(getChaosChance(2)).toBe(0)
  })

  it('round 3: 30%', () => {
    expect(getChaosChance(3)).toBe(0.3)
  })

  it('round 4: 50%', () => {
    expect(getChaosChance(4)).toBe(0.5)
  })

  it('round 5: 70%', () => {
    expect(getChaosChance(5)).toBe(0.7)
  })

  it('round 6: 75%', () => {
    expect(getChaosChance(6)).toBe(0.75)
  })

  it('caps at 90%', () => {
    expect(getChaosChance(10)).toBe(0.9)
    expect(getChaosChance(20)).toBe(0.9)
  })
})

// ── shouldTriggerChaos ──

describe('shouldTriggerChaos', () => {
  it('never triggers in rounds 1-2', () => {
    expect(shouldTriggerChaos(1, makeRng(0))).toBe(false)
    expect(shouldTriggerChaos(2, makeRng(0))).toBe(false)
  })

  it('triggers when rng < chance', () => {
    // Round 3: 30% chance. rng = 0.2 < 0.3 → true
    expect(shouldTriggerChaos(3, makeRng(0.2))).toBe(true)
  })

  it('does not trigger when rng >= chance', () => {
    // Round 3: 30% chance. rng = 0.5 >= 0.3 → false
    expect(shouldTriggerChaos(3, makeRng(0.5))).toBe(false)
  })

  it('high round: almost always triggers', () => {
    expect(shouldTriggerChaos(10, makeRng(0.89))).toBe(true)
    expect(shouldTriggerChaos(10, makeRng(0.91))).toBe(false)
  })
})

// ── selectRule ──

describe('selectRule', () => {
  it('returns null if no rules match trigger', () => {
    const result = selectRule(ALL_RULES, 'before-pick', 3, [], makeRng(0.5))
    // stone-eyes has trigger 'before-pick' and minRound 3 → should match
    expect(result).not.toBeNull()
  })

  it('filters by trigger type', () => {
    const result = selectRule(ALL_RULES, 'after-toss', 3, [], makeRng(0.1))
    expect(result).not.toBeNull()
    expect(result!.trigger).toBe('after-toss')
  })

  it('filters by minRound', () => {
    // split requires minRound 4, round 3 should not include it
    const result = selectRule(
      [splitRule],
      'after-toss',
      3,
      [],
      makeRng(0.1),
    )
    expect(result).toBeNull()
  })

  it('filters already-triggered non-repeatable rules', () => {
    const result = selectRule(
      [birdTransformRule],
      'after-toss',
      3,
      ['bird-transform'],
      makeRng(0.1),
    )
    expect(result).toBeNull()
  })

  it('allows repeatable rules even if already triggered', () => {
    const result = selectRule(
      [stoneEyesRule],
      'before-pick',
      3,
      ['stone-eyes'],
      makeRng(0.1),
    )
    expect(result).not.toBeNull()
    expect(result!.id).toBe('stone-eyes')
  })

  it('returns null when no eligible rules exist', () => {
    const result = selectRule([], 'after-toss', 5, [], makeRng(0.1))
    expect(result).toBeNull()
  })
})

// ── applyChaosToState ──

describe('applyChaosToState', () => {
  it('increments chaosSurvived', () => {
    const state = createInitialState(SEED)
    const result = applyChaosToState(
      state,
      { type: 'test', ruleId: 'test', animation: '', message: '' },
      'test',
    )
    expect(result.chaosSurvived).toBe(1)
  })

  it('appends ruleId to triggeredChaosIds', () => {
    const state = createInitialState(SEED)
    const result = applyChaosToState(
      state,
      { type: 'test', ruleId: 'bird-transform', animation: '', message: '' },
      'bird-transform',
    )
    expect(result.triggeredChaosIds).toContain('bird-transform')
  })

  it('preserves existing triggeredChaosIds', () => {
    const state = {
      ...createInitialState(SEED),
      triggeredChaosIds: ['stone-eyes'],
    }
    const result = applyChaosToState(
      state,
      { type: 'test', ruleId: 'bird-transform', animation: '', message: '' },
      'bird-transform',
    )
    expect(result.triggeredChaosIds).toEqual(['stone-eyes', 'bird-transform'])
  })
})

// ── checkChaos ──

describe('checkChaos', () => {
  it('returns null for rounds 1-2', () => {
    const state = { ...createInitialState(SEED), round: 1 }
    const result = checkChaos(state, 'after-toss', ALL_RULES, makeRng(0))
    expect(result).toBeNull()
  })

  it('returns null if rng exceeds chance', () => {
    const state = { ...createInitialState(SEED), round: 3 }
    // Round 3: 30% chance, rng = 0.5 → no trigger
    const result = checkChaos(state, 'after-toss', ALL_RULES, makeRng(0.5))
    expect(result).toBeNull()
  })

  it('returns rule and result when chaos triggers', () => {
    const state = { ...createInitialState(SEED), round: 3 }
    // rng sequence: first call (0.1 < 0.3 = trigger), second for rule selection
    const rng = makeSequenceRng([0.1, 0.1])
    const result = checkChaos(state, 'after-toss', ALL_RULES, rng)
    expect(result).not.toBeNull()
    expect(result!.rule.trigger).toBe('after-toss')
    expect(result!.result.ruleId).toBe(result!.rule.id)
  })
})

// ── Individual Rule Definitions ──

describe('rule definitions', () => {
  it('bird-transform: after-toss, minRound 3, not repeatable', () => {
    expect(birdTransformRule.trigger).toBe('after-toss')
    expect(birdTransformRule.minRound).toBe(3)
    expect(birdTransformRule.canRepeat).toBe(false)
  })

  it('cat-swipe: before-success, minRound 3, not repeatable', () => {
    expect(catSwipeRule.trigger).toBe('before-success')
    expect(catSwipeRule.minRound).toBe(3)
    expect(catSwipeRule.canRepeat).toBe(false)
  })

  it('stone-eyes: before-pick, minRound 3, repeatable', () => {
    expect(stoneEyesRule.trigger).toBe('before-pick')
    expect(stoneEyesRule.minRound).toBe(3)
    expect(stoneEyesRule.canRepeat).toBe(true)
  })

  it('fake-clear: stage-transition, minRound 3, not repeatable', () => {
    expect(fakeClearRule.trigger).toBe('stage-transition')
    expect(fakeClearRule.minRound).toBe(3)
    expect(fakeClearRule.canRepeat).toBe(false)
  })

  it('split: after-toss, minRound 4, not repeatable', () => {
    expect(splitRule.trigger).toBe('after-toss')
    expect(splitRule.minRound).toBe(4)
    expect(splitRule.canRepeat).toBe(false)
  })

  it('danmaku: during-play, minRound 3, repeatable', () => {
    expect(danmakuRule.trigger).toBe('during-play')
    expect(danmakuRule.minRound).toBe(3)
    expect(danmakuRule.canRepeat).toBe(true)
  })

  it('screen-flip: stage-transition, minRound 4, not repeatable', () => {
    expect(screenFlipRule.trigger).toBe('stage-transition')
    expect(screenFlipRule.minRound).toBe(4)
    expect(screenFlipRule.canRepeat).toBe(false)
  })
})

// ── Rule Execution ──

describe('rule execution', () => {
  const state = createInitialState(SEED)
  const rng = makeRng(0.5)

  it('bird-transform returns stone-lost type', () => {
    const result = birdTransformRule.execute(state, rng)
    expect(result.type).toBe('stone-lost')
    expect(result.animation).toBe('bird-transform')
  })

  it('cat-swipe returns all-stones-scattered type with direction', () => {
    const result = catSwipeRule.execute(state, rng)
    expect(result.type).toBe('all-stones-scattered')
    expect(result.data?.direction).toBeDefined()
  })

  it('stone-eyes returns stones-flee type with affected ids', () => {
    const result = stoneEyesRule.execute(state, rng)
    expect(result.type).toBe('stones-flee')
    expect(result.data?.affectedStoneIds).toBeDefined()
  })

  it('fake-clear returns stage-reset type', () => {
    const result = fakeClearRule.execute(state, rng)
    expect(result.type).toBe('stage-reset')
    expect(result.message).toBe('아 잠깐, 아직이요 ㅋ')
  })

  it('split returns stone-split type with correctIndex 0-2', () => {
    const result = splitRule.execute(state, rng)
    expect(result.type).toBe('stone-split')
    const idx = result.data?.correctIndex as number
    expect(idx).toBeGreaterThanOrEqual(0)
    expect(idx).toBeLessThan(3)
  })

  it('danmaku returns visual-only type with comments array', () => {
    const result = danmakuRule.execute(state, rng)
    expect(result.type).toBe('visual-only')
    const comments = result.data?.comments as unknown[]
    expect(Array.isArray(comments)).toBe(true)
    expect(comments.length).toBeGreaterThanOrEqual(5)
  })

  it('screen-flip returns screen-flip type', () => {
    const result = screenFlipRule.execute(state, rng)
    expect(result.type).toBe('screen-flip')
    expect(result.data?.rotation).toBe(180)
  })
})
