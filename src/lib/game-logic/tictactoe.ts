export type Mark = 'X' | 'O'
export type Cell = Mark | null
export type Grid = [Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell]

export interface TicTacToeState {
  grid: Grid
  currentMark: Mark
}

export interface TicTacToeMove {
  index: number // 0-8
}

export interface GameResult {
  winner: Mark | null // null = draw
  winLine: [number, number, number] | null
}

const WIN_LINES: [number, number, number][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],            // diagonals
]

export function createInitialState(): TicTacToeState {
  return {
    grid: [null, null, null, null, null, null, null, null, null],
    currentMark: 'X',
  }
}

export function getValidMoves(state: TicTacToeState): number[] {
  return state.grid.reduce<number[]>((acc, cell, i) => {
    if (cell === null) acc.push(i)
    return acc
  }, [])
}

export function isValidMove(state: TicTacToeState, index: number): boolean {
  return index >= 0 && index <= 8 && state.grid[index] === null
}

export function applyMove(state: TicTacToeState, index: number): TicTacToeState {
  const newGrid = [...state.grid] as Grid
  newGrid[index] = state.currentMark
  return {
    grid: newGrid,
    currentMark: state.currentMark === 'X' ? 'O' : 'X',
  }
}

export function checkResult(state: TicTacToeState): GameResult | null {
  for (const [a, b, c] of WIN_LINES) {
    const cell = state.grid[a]
    if (cell && cell === state.grid[b] && cell === state.grid[c]) {
      return { winner: cell, winLine: [a, b, c] }
    }
  }
  if (state.grid.every((c) => c !== null)) {
    return { winner: null, winLine: null } // draw
  }
  return null // game ongoing
}

// Minimax AI — perfect play
function minimax(grid: Grid, isMaximizing: boolean, mark: Mark): number {
  const oppMark: Mark = mark === 'X' ? 'O' : 'X'
  const tempState: TicTacToeState = { grid, currentMark: isMaximizing ? mark : oppMark }
  const result = checkResult(tempState)

  if (result !== null) {
    if (result.winner === mark) return 10
    if (result.winner === oppMark) return -10
    return 0
  }

  const moves = grid.reduce<number[]>((acc, c, i) => (c === null ? [...acc, i] : acc), [])

  if (isMaximizing) {
    let best = -Infinity
    for (const i of moves) {
      const next = [...grid] as Grid
      next[i] = mark
      best = Math.max(best, minimax(next, false, mark))
    }
    return best
  } else {
    let best = Infinity
    for (const i of moves) {
      const next = [...grid] as Grid
      next[i] = oppMark
      best = Math.min(best, minimax(next, true, mark))
    }
    return best
  }
}

export function getAIMove(state: TicTacToeState, difficulty: 'easy' | 'medium' | 'hard'): number {
  const valid = getValidMoves(state)
  if (valid.length === 0) return -1

  if (difficulty === 'easy') {
    // Random move
    return valid[Math.floor(Math.random() * valid.length)]
  }

  if (difficulty === 'medium') {
    // 50% chance of best move, else random
    if (Math.random() < 0.5) return valid[Math.floor(Math.random() * valid.length)]
  }

  // hard (and medium fallthrough): minimax best move
  let bestScore = -Infinity
  let bestIndex = valid[0]

  for (const i of valid) {
    const next = [...state.grid] as Grid
    next[i] = state.currentMark
    const score = minimax(next, false, state.currentMark)
    if (score > bestScore) {
      bestScore = score
      bestIndex = i
    }
  }

  return bestIndex
}
