import { describe, test, expect } from 'vitest'
import {
  createInitialState,
  getValidMoves,
  isValidMove,
  applyMove,
  checkResult,
  getAIMove,
} from './tictactoe'
import type { TicTacToeState, Grid } from './tictactoe'

// Helper: build state from string grid
// 'X.O / ... / ...' → Grid
function makeState(marks: string, currentMark: 'X' | 'O' = 'X'): TicTacToeState {
  const cells = marks.replace(/\s/g, '').split('')
  const grid = cells.map((c) => (c === '.' ? null : c)) as Grid
  return { grid, currentMark }
}

// ── createInitialState ──────────────────────────────────────────────────────

describe('createInitialState', () => {
  test('9칸 빈 배열을 생성한다', () => {
    const state = createInitialState()
    expect(state.grid).toHaveLength(9)
    expect(state.grid.every((c) => c === null)).toBe(true)
  })

  test('첫 수는 X이다', () => {
    const state = createInitialState()
    expect(state.currentMark).toBe('X')
  })
})

// ── getValidMoves ───────────────────────────────────────────────────────────

describe('getValidMoves', () => {
  test('빈 보드에서 9칸 모두 유효하다', () => {
    const moves = getValidMoves(createInitialState())
    expect(moves).toHaveLength(9)
    expect(moves).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
  })

  test('일부 채운 보드에서 빈 칸만 반환한다', () => {
    const state = makeState('X.O......')
    const moves = getValidMoves(state)
    expect(moves).toEqual([1, 3, 4, 5, 6, 7, 8])
  })

  test('가득 찬 보드에서 빈 배열을 반환한다', () => {
    const state = makeState('XOXOOXXXO')
    const moves = getValidMoves(state)
    expect(moves).toEqual([])
  })
})

// ── isValidMove ─────────────────────────────────────────────────────────────

describe('isValidMove', () => {
  test('빈 칸은 유효하다', () => {
    const state = createInitialState()
    expect(isValidMove(state, 0)).toBe(true)
    expect(isValidMove(state, 4)).toBe(true)
  })

  test('이미 놓인 칸은 유효하지 않다', () => {
    const state = makeState('X........')
    expect(isValidMove(state, 0)).toBe(false)
  })

  test('범위 밖은 유효하지 않다', () => {
    const state = createInitialState()
    expect(isValidMove(state, -1)).toBe(false)
    expect(isValidMove(state, 9)).toBe(false)
  })
})

// ── applyMove ───────────────────────────────────────────────────────────────

describe('applyMove', () => {
  test('마크를 배치하고 턴을 전환한다', () => {
    const state = createInitialState()
    const next = applyMove(state, 4)
    expect(next.grid[4]).toBe('X')
    expect(next.currentMark).toBe('O')
  })

  test('원본 상태를 변경하지 않는다 (불변)', () => {
    const state = createInitialState()
    applyMove(state, 0)
    expect(state.grid[0]).toBeNull()
    expect(state.currentMark).toBe('X')
  })

  test('O 턴에서 O를 배치한다', () => {
    const state = makeState('X........', 'O')
    const next = applyMove(state, 1)
    expect(next.grid[1]).toBe('O')
    expect(next.currentMark).toBe('X')
  })
})

// ── checkResult ─────────────────────────────────────────────────────────────

describe('checkResult', () => {
  test('진행 중이면 null을 반환한다', () => {
    expect(checkResult(createInitialState())).toBeNull()
    expect(checkResult(makeState('X........'))).toBeNull()
  })

  test('가로 첫 줄 승리', () => {
    const state = makeState('XXX......')
    const result = checkResult(state)
    expect(result?.winner).toBe('X')
    expect(result?.winLine).toEqual([0, 1, 2])
  })

  test('가로 둘째 줄 승리', () => {
    const state = makeState('...OOO...')
    const result = checkResult(state)
    expect(result?.winner).toBe('O')
    expect(result?.winLine).toEqual([3, 4, 5])
  })

  test('가로 셋째 줄 승리', () => {
    const state = makeState('......XXX')
    const result = checkResult(state)
    expect(result?.winner).toBe('X')
    expect(result?.winLine).toEqual([6, 7, 8])
  })

  test('세로 첫 열 승리', () => {
    const state = makeState('X..X..X..')
    const result = checkResult(state)
    expect(result?.winner).toBe('X')
    expect(result?.winLine).toEqual([0, 3, 6])
  })

  test('세로 둘째 열 승리', () => {
    const state = makeState('.O..O..O.')
    const result = checkResult(state)
    expect(result?.winner).toBe('O')
    expect(result?.winLine).toEqual([1, 4, 7])
  })

  test('세로 셋째 열 승리', () => {
    const state = makeState('..X..X..X')
    const result = checkResult(state)
    expect(result?.winner).toBe('X')
    expect(result?.winLine).toEqual([2, 5, 8])
  })

  test('대각선 ↘ 승리', () => {
    const state = makeState('X...X...X', 'O')
    const result = checkResult(state)
    expect(result?.winner).toBe('X')
    expect(result?.winLine).toEqual([0, 4, 8])
  })

  test('대각선 ↙ 승리', () => {
    const state = makeState('..O.O.O..', 'X')
    const result = checkResult(state)
    expect(result?.winner).toBe('O')
    expect(result?.winLine).toEqual([2, 4, 6])
  })

  test('무승부', () => {
    const state = makeState('XOXXOXOXO')
    const result = checkResult(state)
    expect(result).not.toBeNull()
    expect(result?.winner).toBeNull()
    expect(result?.winLine).toBeNull()
  })
})

// ── getAIMove ───────────────────────────────────────────────────────────────

describe('getAIMove', () => {
  test('easy: 유효한 수를 반환한다', () => {
    const state = createInitialState()
    const move = getAIMove(state, 'easy')
    expect(move).toBeGreaterThanOrEqual(0)
    expect(move).toBeLessThanOrEqual(8)
    expect(isValidMove(state, move)).toBe(true)
  })

  test('hard: 이길 수 있으면 이기는 수를 둔다', () => {
    // O가 [3,4]를 가짐, X가 [6,7]를 가짐 → O 차례: [5]에 두면 OOO 승리
    const state = makeState('...OO.XX.', 'O')
    const move = getAIMove(state, 'hard')
    expect(move).toBe(5) // completes row OOO
  })

  test('hard: 상대 승리를 방어한다', () => {
    // X가 [0,1]을 가짐 → [2]에 놓으면 승리
    // O 차례: [2]를 막아야 함
    const state = makeState('XX.......', 'O')
    const move = getAIMove(state, 'hard')
    expect(move).toBe(2)
  })

  test('유효한 수가 없으면 -1을 반환한다', () => {
    const state = makeState('XOXXOXOXO')
    const move = getAIMove(state, 'easy')
    expect(move).toBe(-1)
  })
})
