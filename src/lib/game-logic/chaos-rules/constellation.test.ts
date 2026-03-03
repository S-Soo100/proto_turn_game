import { describe, it, expect } from 'vitest'
import { constellationRule, CONSTELLATIONS, CONSTELLATION_STARS, CONSTELLATION_LINES } from './constellation'
import { createInitialState, startToss, completeToss } from '../gonggi'

// ── Helpers ──

function makeRng(value: number): () => number {
  return () => value
}

function stateWithTossedStone() {
  const state = createInitialState(42)
  const afterToss = completeToss(startToss(state))
  return afterToss
}

// ── Rule Definition ──

describe('constellationRule definition', () => {
  it('has correct id and metadata', () => {
    expect(constellationRule.id).toBe('constellation')
    expect(constellationRule.name).toBe('별자리 승천')
    expect(constellationRule.trigger).toBe('after-toss')
    expect(constellationRule.minRound).toBe(3)
    expect(constellationRule.canRepeat).toBe(false)
    expect(constellationRule.probability).toBe(0.20)
  })
})

// ── Execute ──

describe('constellationRule.execute', () => {
  it('returns constellation type result', () => {
    const state = stateWithTossedStone()
    const rng = makeRng(0)
    const result = constellationRule.execute(state, rng)

    expect(result.type).toBe('constellation')
    expect(result.ruleId).toBe('constellation')
    expect(result.animation).toBe('constellation')
    expect(result.message).toBe('별이 되었다...')
  })

  it('includes constellation data fields', () => {
    const state = stateWithTossedStone()
    const rng = makeRng(0.5)
    const result = constellationRule.execute(state, rng)

    expect(result.data).toBeDefined()
    expect(typeof result.data!.stoneId).toBe('number')
    expect(typeof result.data!.constellationName).toBe('string')
    expect(typeof result.data!.constellationDesc).toBe('string')
    expect(typeof result.data!.constellationIndex).toBe('number')
    expect(Array.isArray(result.data!.timeline)).toBe(true)
  })

  it('selects constellation from pool based on rng', () => {
    const state = stateWithTossedStone()

    // rng returns 0 → floor(0 * 6) = 0 → first constellation
    const result0 = constellationRule.execute(state, makeRng(0))
    expect(result0.data!.constellationIndex).toBe(0)
    expect(result0.data!.constellationName).toBe(CONSTELLATIONS[0].name)

    // rng returns 0.5 → floor(0.5 * 6) = 3 → fourth constellation
    const result3 = constellationRule.execute(state, makeRng(0.5))
    expect(result3.data!.constellationIndex).toBe(3)
    expect(result3.data!.constellationName).toBe(CONSTELLATIONS[3].name)
  })

  it('finds tossed stone id from state', () => {
    const state = stateWithTossedStone()
    const tossed = state.stones.find((s) => s.status === 'tossed' || s.status === 'air')
    const result = constellationRule.execute(state, makeRng(0))
    expect(result.data!.stoneId).toBe(tossed?.id ?? 0)
  })

  it('defaults stoneId to 0 when no tossed stone', () => {
    const state = createInitialState(42)
    const result = constellationRule.execute(state, makeRng(0))
    expect(result.data!.stoneId).toBe(0)
  })

  it('timeline has expected actions', () => {
    const state = stateWithTossedStone()
    const result = constellationRule.execute(state, makeRng(0))
    const timeline = result.data!.timeline as { at: number; action: string }[]

    expect(timeline.length).toBe(8)
    expect(timeline[0].action).toBe('ascend-start')
    expect(timeline[timeline.length - 1].action).toBe('wish-prompt')
  })
})

// ── Constellation Pool ──

describe('constellation pool', () => {
  it('has 6 constellations', () => {
    expect(CONSTELLATIONS).toHaveLength(6)
  })

  it('each constellation has name and desc', () => {
    for (const c of CONSTELLATIONS) {
      expect(c.name).toBeTruthy()
      expect(c.desc).toBeTruthy()
    }
  })

  it('has matching star coordinates for each constellation', () => {
    expect(CONSTELLATION_STARS).toHaveLength(6)
    for (const starSet of CONSTELLATION_STARS) {
      expect(starSet.length).toBeGreaterThanOrEqual(4)
      for (const star of starSet) {
        expect(star.x).toBeGreaterThanOrEqual(0)
        expect(star.x).toBeLessThanOrEqual(100)
        expect(star.y).toBeGreaterThanOrEqual(0)
        expect(star.y).toBeLessThanOrEqual(100)
      }
    }
  })

  it('has matching line connections for each constellation', () => {
    expect(CONSTELLATION_LINES).toHaveLength(6)
    CONSTELLATION_LINES.forEach((lineSet, i) => {
      expect(lineSet.length).toBeGreaterThanOrEqual(2)
      for (const [a, b] of lineSet) {
        expect(a).toBeGreaterThanOrEqual(0)
        expect(a).toBeLessThan(CONSTELLATION_STARS[i].length)
        expect(b).toBeGreaterThanOrEqual(0)
        expect(b).toBeLessThan(CONSTELLATION_STARS[i].length)
      }
    })
  })
})
