import { describe, test, expect } from 'vitest'
import {
  generateSchedule,
  calculateScore,
  getRemainingRatio,
  getGrade,
  getComboMultiplier,
  createInitialGameState,
  applyClick,
  applyDecoyClick,
  applyMiss,
  getAccuracy,
  GAME_DURATION_MS,
  TOTAL_TARGETS,
  NORMAL_COUNT,
  SPEED_COUNT,
  DECOY_COUNT,
  NORMAL_DURATION_MS,
  SPEED_DURATION_MS,
  DECOY_DURATION_MS,
  DECOY_PENALTY,
} from './reaction-speed'

// ── generateSchedule ────────────────────────────────────────────────────────

describe('generateSchedule', () => {
  test('정확히 100개 타겟을 생성한다', () => {
    const schedule = generateSchedule(42)
    expect(schedule).toHaveLength(TOTAL_TARGETS)
  })

  test('타겟 타입 비율이 정확하다 (55 normal + 30 speed + 15 decoy)', () => {
    const schedule = generateSchedule(42)
    const counts = { normal: 0, speed: 0, decoy: 0 }
    for (const t of schedule) counts[t.type]++
    expect(counts.normal).toBe(NORMAL_COUNT)
    expect(counts.speed).toBe(SPEED_COUNT)
    expect(counts.decoy).toBe(DECOY_COUNT)
  })

  test('spawnTime이 대체로 시간순으로 정렬되어 있다', () => {
    const schedule = generateSchedule(42)
    // spawnTime은 정렬 후 타입별 duration cap이 적용되므로
    // 일부 역전이 있을 수 있지만 대부분 순서대로
    let outOfOrder = 0
    for (let i = 1; i < schedule.length; i++) {
      if (schedule[i].spawnTime < schedule[i - 1].spawnTime) outOfOrder++
    }
    // 역전이 전체의 10% 미만이어야 함
    expect(outOfOrder).toBeLessThan(TOTAL_TARGETS * 0.1)
  })

  test('spawnTime이 0 이상이다', () => {
    const schedule = generateSchedule(42)
    for (const t of schedule) {
      expect(t.spawnTime).toBeGreaterThanOrEqual(0)
    }
  })

  test('좌표가 패딩 범위 내에 있다 (8~92%)', () => {
    const schedule = generateSchedule(42)
    for (const t of schedule) {
      expect(t.x).toBeGreaterThanOrEqual(8)
      expect(t.x).toBeLessThanOrEqual(92)
      expect(t.y).toBeGreaterThanOrEqual(8)
      expect(t.y).toBeLessThanOrEqual(92)
    }
  })

  test('같은 seed는 같은 결과를 반환한다', () => {
    const a = generateSchedule(12345)
    const b = generateSchedule(12345)
    expect(a).toEqual(b)
  })

  test('다른 seed는 다른 결과를 반환한다', () => {
    const a = generateSchedule(111)
    const b = generateSchedule(222)
    // At least positions should differ
    const samePositions = a.filter((t, i) => t.x === b[i].x && t.y === b[i].y)
    expect(samePositions.length).toBeLessThan(TOTAL_TARGETS)
  })

  test('타겟 duration이 타입에 맞다', () => {
    const schedule = generateSchedule(42)
    for (const t of schedule) {
      if (t.type === 'normal') expect(t.duration).toBe(NORMAL_DURATION_MS)
      if (t.type === 'speed') expect(t.duration).toBe(SPEED_DURATION_MS)
      if (t.type === 'decoy') expect(t.duration).toBe(DECOY_DURATION_MS)
    }
  })

  test('마지막 타겟도 게임 시간 내에 완료될 수 있다', () => {
    const schedule = generateSchedule(42)
    for (const t of schedule) {
      expect(t.spawnTime + t.duration).toBeLessThanOrEqual(GAME_DURATION_MS + t.duration)
      expect(t.spawnTime).toBeLessThanOrEqual(GAME_DURATION_MS - t.duration)
    }
  })
})

// ── calculateScore ──────────────────────────────────────────────────────────

describe('calculateScore', () => {
  test('ratio=0 (방금 스폰) → 최소 10점', () => {
    expect(calculateScore('normal', 0)).toBe(10)
  })

  test('ratio=1 (만료 직전) → 최대 100점', () => {
    expect(calculateScore('normal', 1)).toBe(100)
  })

  test('speed 타겟은 1.5배', () => {
    expect(calculateScore('speed', 0)).toBe(15) // 10 * 1.5
    expect(calculateScore('speed', 1)).toBe(150) // 100 * 1.5
  })

  test('ratio가 0~1 사이에서 선형 보간된다', () => {
    const mid = calculateScore('normal', 0.5)
    expect(mid).toBe(55) // 10 + 0.5 * 90 = 55
  })

  test('ratio가 범위 밖이면 클램핑된다', () => {
    expect(calculateScore('normal', -0.5)).toBe(10) // clamped to 0
    expect(calculateScore('normal', 1.5)).toBe(100) // clamped to 1
  })
})

// ── getRemainingRatio ───────────────────────────────────────────────────────

describe('getRemainingRatio', () => {
  test('방금 스폰 → 0', () => {
    expect(getRemainingRatio(1000, 1000, 4000)).toBe(0)
  })

  test('절반 경과 → 0.5', () => {
    expect(getRemainingRatio(3000, 1000, 4000)).toBe(0.5)
  })

  test('만료 직전 → 1', () => {
    expect(getRemainingRatio(5000, 1000, 4000)).toBe(1)
  })

  test('범위 밖은 클램핑된다', () => {
    expect(getRemainingRatio(500, 1000, 4000)).toBe(0) // before spawn
    expect(getRemainingRatio(6000, 1000, 4000)).toBe(1) // after expiry
  })
})

// ── getGrade ────────────────────────────────────────────────────────────────

describe('getGrade', () => {
  test('0.3초 이하 → perfect', () => {
    expect(getGrade(0)).toBe('perfect')
    expect(getGrade(0.3)).toBe('perfect')
  })

  test('0.31~1.0초 → great', () => {
    expect(getGrade(0.31)).toBe('great')
    expect(getGrade(1.0)).toBe('great')
  })

  test('1.01~2.0초 → good', () => {
    expect(getGrade(1.01)).toBe('good')
    expect(getGrade(2.0)).toBe('good')
  })

  test('2.0초 초과 → ok', () => {
    expect(getGrade(2.01)).toBe('ok')
    expect(getGrade(5.0)).toBe('ok')
  })
})

// ── getComboMultiplier ──────────────────────────────────────────────────────

describe('getComboMultiplier', () => {
  test('4 이하 → 1x', () => {
    expect(getComboMultiplier(0)).toBe(1)
    expect(getComboMultiplier(4)).toBe(1)
  })

  test('5~9 → 2x', () => {
    expect(getComboMultiplier(5)).toBe(2)
    expect(getComboMultiplier(9)).toBe(2)
  })

  test('10~19 → 3x', () => {
    expect(getComboMultiplier(10)).toBe(3)
    expect(getComboMultiplier(19)).toBe(3)
  })

  test('20~29 → 4x', () => {
    expect(getComboMultiplier(20)).toBe(4)
    expect(getComboMultiplier(29)).toBe(4)
  })

  test('30 이상 → 5x', () => {
    expect(getComboMultiplier(30)).toBe(5)
    expect(getComboMultiplier(100)).toBe(5)
  })
})

// ── createInitialGameState ──────────────────────────────────────────────────

describe('createInitialGameState', () => {
  test('모든 필드가 0이다', () => {
    const state = createInitialGameState()
    expect(state.score).toBe(0)
    expect(state.combo).toBe(0)
    expect(state.maxCombo).toBe(0)
    expect(state.clicks).toBe(0)
    expect(state.misses).toBe(0)
    expect(state.decoyClicks).toBe(0)
    expect(state.grades).toEqual({ perfect: 0, great: 0, good: 0, ok: 0 })
  })
})

// ── applyClick ──────────────────────────────────────────────────────────────

describe('applyClick', () => {
  test('점수, 클릭 수, 콤보가 증가한다', () => {
    const state = createInitialGameState()
    // Click a normal target at spawn (ratio ≈ 0, remaining time = 4s → ok grade)
    const { state: next, result } = applyClick(state, 'normal', 1000, 1000, NORMAL_DURATION_MS)
    expect(next.clicks).toBe(1)
    expect(next.combo).toBe(1)
    expect(next.maxCombo).toBe(1)
    expect(next.score).toBeGreaterThan(0)
    expect(result.combo).toBe(1)
  })

  test('연속 클릭 시 콤보가 누적된다', () => {
    let state = createInitialGameState()
    for (let i = 0; i < 5; i++) {
      const { state: next } = applyClick(state, 'normal', 1000, 1000, NORMAL_DURATION_MS)
      state = next
    }
    expect(state.combo).toBe(5)
    expect(state.maxCombo).toBe(5)
    expect(state.clicks).toBe(5)
  })

  test('콤보 배율이 점수에 적용된다', () => {
    let state = createInitialGameState()
    // Build combo to 5 (2x multiplier)
    for (let i = 0; i < 4; i++) {
      const { state: next } = applyClick(state, 'normal', 1000, 1000, NORMAL_DURATION_MS)
      state = next
    }
    // 5th click: combo=5, multiplier=2x
    const { result } = applyClick(state, 'normal', 1000, 1000, NORMAL_DURATION_MS)
    expect(result.comboMultiplier).toBe(2)
    expect(result.score).toBe(result.baseScore * 2)
  })

  test('등급이 정확히 기록된다', () => {
    const state = createInitialGameState()
    // Click very close to expiry (remaining 0.1s → perfect)
    const { state: next } = applyClick(state, 'normal', 4900, 1000, NORMAL_DURATION_MS)
    expect(next.grades.perfect).toBe(1)
  })
})

// ── applyDecoyClick ─────────────────────────────────────────────────────────

describe('applyDecoyClick', () => {
  test('50점을 감점하고 콤보를 리셋한다', () => {
    let state = createInitialGameState()
    // Build enough score (click near expiry for max points)
    for (let i = 0; i < 10; i++) {
      const { state: next } = applyClick(state, 'normal', 4500, 1000, NORMAL_DURATION_MS)
      state = next
    }
    expect(state.combo).toBe(10)
    expect(state.score).toBeGreaterThan(DECOY_PENALTY) // enough to subtract
    const scoreBefore = state.score

    const next = applyDecoyClick(state)
    expect(next.combo).toBe(0)
    expect(next.score).toBe(scoreBefore - DECOY_PENALTY)
    expect(next.decoyClicks).toBe(1)
  })

  test('점수가 0 미만으로 내려가지 않는다', () => {
    const state = createInitialGameState() // score = 0
    const next = applyDecoyClick(state)
    expect(next.score).toBe(0)
  })

  test('maxCombo는 유지된다', () => {
    let state = createInitialGameState()
    for (let i = 0; i < 5; i++) {
      const { state: next } = applyClick(state, 'normal', 1000, 1000, NORMAL_DURATION_MS)
      state = next
    }
    expect(state.maxCombo).toBe(5)
    const next = applyDecoyClick(state)
    expect(next.maxCombo).toBe(5) // preserved
  })
})

// ── applyMiss ───────────────────────────────────────────────────────────────

describe('applyMiss', () => {
  test('콤보를 리셋하고 misses를 증가시킨다', () => {
    let state = createInitialGameState()
    for (let i = 0; i < 3; i++) {
      const { state: next } = applyClick(state, 'normal', 1000, 1000, NORMAL_DURATION_MS)
      state = next
    }
    expect(state.combo).toBe(3)

    const next = applyMiss(state)
    expect(next.combo).toBe(0)
    expect(next.misses).toBe(1)
    expect(next.score).toBe(state.score) // score unchanged
  })

  test('maxCombo는 유지된다', () => {
    let state = createInitialGameState()
    for (let i = 0; i < 10; i++) {
      const { state: next } = applyClick(state, 'normal', 1000, 1000, NORMAL_DURATION_MS)
      state = next
    }
    const maxBefore = state.maxCombo
    const next = applyMiss(state)
    expect(next.maxCombo).toBe(maxBefore)
  })
})

// ── getAccuracy ─────────────────────────────────────────────────────────────

describe('getAccuracy', () => {
  test('total=0이면 0을 반환한다', () => {
    expect(getAccuracy(createInitialGameState())).toBe(0)
  })

  test('모두 클릭 → 1.0', () => {
    let state = createInitialGameState()
    for (let i = 0; i < 10; i++) {
      const { state: next } = applyClick(state, 'normal', 1000, 1000, NORMAL_DURATION_MS)
      state = next
    }
    expect(getAccuracy(state)).toBe(1)
  })

  test('클릭 3, 미스 1 → 0.75', () => {
    let state = createInitialGameState()
    for (let i = 0; i < 3; i++) {
      const { state: next } = applyClick(state, 'normal', 1000, 1000, NORMAL_DURATION_MS)
      state = next
    }
    state = applyMiss(state)
    expect(getAccuracy(state)).toBe(0.75)
  })
})
