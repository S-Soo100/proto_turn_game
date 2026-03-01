import { describe, test, expect, vi } from 'vitest'
import {
  createInitialState,
  isValidMove,
  applyMove,
  checkResult,
  getAIMove,
} from './gomoku'
import type { GomokuState } from './gomoku'

const SIZE = 15

// Helper: place stones at given positions
function placeStones(positions: { index: number; mark: 'B' | 'W' }[]): GomokuState {
  let state = createInitialState()
  for (const { index, mark } of positions) {
    state = { ...state, grid: [...state.grid], currentMark: mark }
    state.grid[index] = mark
    state.lastMove = index
  }
  // Set currentMark to the next player after last stone
  const lastMark = positions[positions.length - 1]?.mark
  state.currentMark = lastMark === 'B' ? 'W' : 'B'
  return state
}

// Helper: row,col → flat index
function idx(row: number, col: number): number {
  return row * SIZE + col
}

// ── createInitialState ──────────────────────────────────────────────────────

describe('createInitialState', () => {
  test('225칸 빈 배열을 생성한다', () => {
    const state = createInitialState()
    expect(state.grid).toHaveLength(225)
    expect(state.grid.every((c) => c === null)).toBe(true)
  })

  test('첫 수는 흑(B)이다', () => {
    expect(createInitialState().currentMark).toBe('B')
  })

  test('lastMove는 null이다', () => {
    expect(createInitialState().lastMove).toBeNull()
  })
})

// ── isValidMove ─────────────────────────────────────────────────────────────

describe('isValidMove', () => {
  test('빈 칸은 유효하다', () => {
    const state = createInitialState()
    expect(isValidMove(state, 0)).toBe(true)
    expect(isValidMove(state, 112)).toBe(true) // center
    expect(isValidMove(state, 224)).toBe(true)
  })

  test('돌이 놓인 칸은 유효하지 않다', () => {
    const state = placeStones([{ index: 112, mark: 'B' }])
    expect(isValidMove(state, 112)).toBe(false)
  })

  test('범위 밖은 유효하지 않다', () => {
    const state = createInitialState()
    expect(isValidMove(state, -1)).toBe(false)
    expect(isValidMove(state, 225)).toBe(false)
  })
})

// ── applyMove ───────────────────────────────────────────────────────────────

describe('applyMove', () => {
  test('돌을 배치하고 마크를 전환한다', () => {
    const state = createInitialState()
    const next = applyMove(state, 112)
    expect(next.grid[112]).toBe('B')
    expect(next.currentMark).toBe('W')
  })

  test('lastMove를 기록한다', () => {
    const next = applyMove(createInitialState(), 50)
    expect(next.lastMove).toBe(50)
  })

  test('원본 상태를 변경하지 않는다', () => {
    const state = createInitialState()
    applyMove(state, 0)
    expect(state.grid[0]).toBeNull()
  })
})

// ── checkResult ─────────────────────────────────────────────────────────────

describe('checkResult', () => {
  test('빈 보드는 진행 중 (null)', () => {
    expect(checkResult(createInitialState())).toBeNull()
  })

  test('가로 5목 승리', () => {
    const stones = [3, 4, 5, 6, 7].map((col) => ({ index: idx(7, col), mark: 'B' as const }))
    const state = placeStones(stones)
    const result = checkResult(state)
    expect(result).not.toBeNull()
    expect(result!.winner).toBe('B')
    expect(result!.winLine).toHaveLength(5)
    expect(result!.winLine).toEqual(stones.map((s) => s.index))
  })

  test('세로 5목 승리', () => {
    const stones = [3, 4, 5, 6, 7].map((row) => ({ index: idx(row, 5), mark: 'W' as const }))
    const state = placeStones(stones)
    const result = checkResult(state)
    expect(result!.winner).toBe('W')
    expect(result!.winLine).toHaveLength(5)
  })

  test('대각선 ↘ 5목 승리', () => {
    const stones = [0, 1, 2, 3, 4].map((i) => ({ index: idx(i, i), mark: 'B' as const }))
    const state = placeStones(stones)
    const result = checkResult(state)
    expect(result!.winner).toBe('B')
    expect(result!.winLine).toHaveLength(5)
  })

  test('대각선 ↙ 5목 승리', () => {
    const stones = [0, 1, 2, 3, 4].map((i) => ({ index: idx(i, 14 - i), mark: 'W' as const }))
    const state = placeStones(stones)
    const result = checkResult(state)
    expect(result!.winner).toBe('W')
    expect(result!.winLine).toHaveLength(5)
  })

  test('4목은 승리가 아니다', () => {
    const stones = [3, 4, 5, 6].map((col) => ({ index: idx(7, col), mark: 'B' as const }))
    const state = placeStones(stones)
    expect(checkResult(state)).toBeNull()
  })

  test('6목 이상도 승리로 인정한다 (5개 부분이 포함되므로)', () => {
    const stones = [2, 3, 4, 5, 6, 7].map((col) => ({ index: idx(7, col), mark: 'B' as const }))
    const state = placeStones(stones)
    const result = checkResult(state)
    expect(result).not.toBeNull()
    expect(result!.winner).toBe('B')
  })

  test('winLine은 정확히 5칸이다', () => {
    const stones = [3, 4, 5, 6, 7].map((col) => ({ index: idx(0, col), mark: 'B' as const }))
    const state = placeStones(stones)
    const result = checkResult(state)
    expect(result!.winLine).toHaveLength(5)
  })

  test('중간에 다른 돌이 끼면 승리가 아니다', () => {
    // B B B W B — 3 + 1 ≠ 5 연속
    const stones = [
      { index: idx(7, 3), mark: 'B' as const },
      { index: idx(7, 4), mark: 'B' as const },
      { index: idx(7, 5), mark: 'B' as const },
      { index: idx(7, 6), mark: 'W' as const },
      { index: idx(7, 7), mark: 'B' as const },
    ]
    const state = placeStones(stones)
    expect(checkResult(state)).toBeNull()
  })
})

// ── getAIMove ───────────────────────────────────────────────────────────────

describe('getAIMove', () => {
  test('빈 보드에서 첫 수를 중앙에 둔다', () => {
    const state = createInitialState()
    const move = getAIMove(state, 'easy')
    expect(move).toBe(112) // center of 15x15
  })

  test('easy: 유효한 수를 반환한다', () => {
    let state = createInitialState()
    state = applyMove(state, 112) // B at center
    const move = getAIMove(state, 'easy')
    expect(move).toBeGreaterThanOrEqual(0)
    expect(move).toBeLessThan(225)
    expect(isValidMove(state, move)).toBe(true)
  })

  test('medium: 4목을 5목으로 완성한다', () => {
    // medium은 30% 확률로 랜덤 → Math.random을 고정
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    // B: (7,3), (7,4), (7,5), (7,6) — 4목 열림
    // AI(B) 차례: (7,2) 또는 (7,7)에 두면 5목 승리
    const stones = [
      { index: idx(7, 3), mark: 'B' as const },
      { index: idx(7, 4), mark: 'B' as const },
      { index: idx(7, 5), mark: 'B' as const },
      { index: idx(7, 6), mark: 'B' as const },
      { index: idx(0, 0), mark: 'W' as const },
      { index: idx(0, 1), mark: 'W' as const },
      { index: idx(0, 2), mark: 'W' as const },
      { index: idx(0, 3), mark: 'W' as const },
    ]
    let state = placeStones(stones)
    state = { ...state, currentMark: 'B' }
    const move = getAIMove(state, 'medium')
    expect(move === idx(7, 2) || move === idx(7, 7)).toBe(true)
    vi.restoreAllMocks()
  })

  test('medium: 유효한 후보 수를 반환한다', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    const stones = [
      { index: idx(7, 7), mark: 'B' as const },
      { index: idx(7, 8), mark: 'W' as const },
    ]
    let state = placeStones(stones)
    state = { ...state, currentMark: 'B' }
    const move = getAIMove(state, 'medium')
    expect(isValidMove(state, move)).toBe(true)
    // Should be within 2 squares of existing stones
    const row = Math.floor(move / SIZE)
    const col = move % SIZE
    expect(row).toBeGreaterThanOrEqual(5)
    expect(row).toBeLessThanOrEqual(10)
    expect(col).toBeGreaterThanOrEqual(5)
    expect(col).toBeLessThanOrEqual(10)
    vi.restoreAllMocks()
  })

  test('유효한 수가 없으면 -1을 반환한다', () => {
    const state = createInitialState()
    // Fill entire board
    const fullGrid = state.grid.map((_, i) => (i % 2 === 0 ? 'B' : 'W')) as ('B' | 'W')[]
    const move = getAIMove({ ...state, grid: fullGrid }, 'easy')
    expect(move).toBe(-1)
  })
})
