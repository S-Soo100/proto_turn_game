export type GomokuMark = 'B' | 'W' // Black / White
export type GomokuCell = GomokuMark | null

export interface GomokuState {
  grid: GomokuCell[] // flat array, length 225 (15 * 15)
  currentMark: GomokuMark
  lastMove: number | null // index of last placed stone
}

export interface GomokuResult {
  winner: GomokuMark | null // null = draw
  winLine: number[] | null  // 5 winning indices
}

const BOARD_SIZE = 15
const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE

export function createInitialState(): GomokuState {
  return {
    grid: Array(TOTAL_CELLS).fill(null),
    currentMark: 'B',
    lastMove: null,
  }
}

export function isValidMove(state: GomokuState, index: number): boolean {
  return index >= 0 && index < TOTAL_CELLS && state.grid[index] === null
}

export function getValidMoves(state: GomokuState): number[] {
  return state.grid.reduce<number[]>((acc, cell, i) => {
    if (cell === null) acc.push(i)
    return acc
  }, [])
}

export function applyMove(state: GomokuState, index: number): GomokuState {
  const newGrid = [...state.grid]
  newGrid[index] = state.currentMark
  return {
    grid: newGrid,
    currentMark: state.currentMark === 'B' ? 'W' : 'B',
    lastMove: index,
  }
}

// Check 5-in-a-row starting from (row, col) in a given direction
function checkDirection(
  grid: GomokuCell[],
  row: number,
  col: number,
  dr: number,
  dc: number,
  mark: GomokuMark
): number[] | null {
  const line: number[] = []
  for (let i = 0; i < 5; i++) {
    const r = row + dr * i
    const c = col + dc * i
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return null
    const idx = r * BOARD_SIZE + c
    if (grid[idx] !== mark) return null
    line.push(idx)
  }
  return line
}

export function checkResult(state: GomokuState): GomokuResult | null {
  const { grid } = state
  const directions: [number, number][] = [
    [0, 1],  // horizontal
    [1, 0],  // vertical
    [1, 1],  // diagonal ↘
    [1, -1], // diagonal ↙
  ]

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const idx = row * BOARD_SIZE + col
      const mark = grid[idx]
      if (!mark) continue

      for (const [dr, dc] of directions) {
        const line = checkDirection(grid, row, col, dr, dc, mark)
        if (line) {
          return { winner: mark, winLine: line }
        }
      }
    }
  }

  // Draw: all cells filled with no winner
  if (grid.every((c) => c !== null)) {
    return { winner: null, winLine: null }
  }

  return null // game ongoing
}

// ── AI ─────────────────────────────────────────────────────────────────────

// Returns candidate moves: empty cells within 2 squares of any existing stone
function getCandidateMoves(grid: GomokuCell[]): number[] {
  const hasStone = grid.some((c) => c !== null)
  if (!hasStone) {
    // First move: center
    return [Math.floor(TOTAL_CELLS / 2)]
  }

  const candidates = new Set<number>()
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (!grid[i]) continue
    const row = Math.floor(i / BOARD_SIZE)
    const col = i % BOARD_SIZE
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        if (dr === 0 && dc === 0) continue
        const r = row + dr
        const c = col + dc
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          const idx = r * BOARD_SIZE + c
          if (grid[idx] === null) candidates.add(idx)
        }
      }
    }
  }
  return Array.from(candidates)
}

// Evaluate a line of cells for a given mark (returns score contribution)
function evaluateLine(cells: GomokuCell[], mark: GomokuMark): number {
  const opp: GomokuMark = mark === 'B' ? 'W' : 'B'
  let score = 0
  let count = 0
  let openEnds = 0

  for (let i = 0; i < cells.length; i++) {
    if (cells[i] === mark) {
      count++
    } else if (cells[i] === null) {
      if (count > 0) {
        // Count open end after the sequence
        openEnds++
        score += scoreSequence(count, openEnds)
        count = 0
        openEnds = 1 // open end before next sequence
      } else {
        openEnds = 1
      }
    } else if (cells[i] === opp) {
      if (count > 0) {
        score += scoreSequence(count, openEnds)
      }
      count = 0
      openEnds = 0
    }
  }
  if (count > 0) score += scoreSequence(count, openEnds)
  return score
}

function scoreSequence(count: number, openEnds: number): number {
  if (count >= 5) return 1_000_000
  if (openEnds === 0) return 0
  switch (count) {
    case 4: return openEnds === 2 ? 50_000 : 10_000
    case 3: return openEnds === 2 ? 5_000 : 1_000
    case 2: return openEnds === 2 ? 500 : 100
    case 1: return openEnds === 2 ? 10 : 1
    default: return 0
  }
}

// Extract all lines of length >= 5 from the board
function extractAllLines(grid: GomokuCell[]): GomokuCell[][] {
  const lines: GomokuCell[][] = []
  const directions: [number, number][] = [[0, 1], [1, 0], [1, 1], [1, -1]]

  for (const [dr, dc] of directions) {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const line: GomokuCell[] = []
        let r = row
        let c = col
        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          line.push(grid[r * BOARD_SIZE + c])
          r += dr
          c += dc
        }
        if (line.length >= 5) lines.push(line)
      }
    }
  }
  return lines
}

function evaluateBoard(grid: GomokuCell[], mark: GomokuMark): number {
  const opp: GomokuMark = mark === 'B' ? 'W' : 'B'
  const lines = extractAllLines(grid)
  let score = 0
  for (const line of lines) {
    score += evaluateLine(line, mark)
    score -= evaluateLine(line, opp)
  }
  return score
}

// Alpha-beta minimax with depth limit
function alphabeta(
  grid: GomokuCell[],
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiMark: GomokuMark
): number {
  const tempState: GomokuState = {
    grid,
    currentMark: isMaximizing ? aiMark : (aiMark === 'B' ? 'W' : 'B'),
    lastMove: null,
  }
  const result = checkResult(tempState)
  if (result !== null) {
    if (result.winner === aiMark) return 1_000_000 + depth
    if (result.winner !== null) return -(1_000_000 + depth)
    return 0
  }
  if (depth === 0) return evaluateBoard(grid, aiMark)

  const candidates = getCandidateMoves(grid)
  const oppMark: GomokuMark = aiMark === 'B' ? 'W' : 'B'

  if (isMaximizing) {
    let best = -Infinity
    for (const idx of candidates) {
      const next = [...grid]
      next[idx] = aiMark
      best = Math.max(best, alphabeta(next, depth - 1, alpha, beta, false, aiMark))
      alpha = Math.max(alpha, best)
      if (beta <= alpha) break
    }
    return best
  } else {
    let best = Infinity
    for (const idx of candidates) {
      const next = [...grid]
      next[idx] = oppMark
      best = Math.min(best, alphabeta(next, depth - 1, alpha, beta, true, aiMark))
      beta = Math.min(beta, best)
      if (beta <= alpha) break
    }
    return best
  }
}

export function getAIMove(state: GomokuState, difficulty: 'easy' | 'medium' | 'hard'): number {
  const candidates = getCandidateMoves(state.grid)
  if (candidates.length === 0) return -1

  if (difficulty === 'easy') {
    return candidates[Math.floor(Math.random() * candidates.length)]
  }

  const depth = difficulty === 'medium' ? 2 : 4
  const aiMark = state.currentMark

  // medium: 30% chance of random to add imperfection
  if (difficulty === 'medium' && Math.random() < 0.3) {
    return candidates[Math.floor(Math.random() * candidates.length)]
  }

  let bestScore = -Infinity
  let bestIndex = candidates[0]

  for (const idx of candidates) {
    const next = [...state.grid]
    next[idx] = aiMark
    const score = alphabeta(next, depth - 1, -Infinity, Infinity, false, aiMark)
    if (score > bestScore) {
      bestScore = score
      bestIndex = idx
    }
  }

  return bestIndex
}
