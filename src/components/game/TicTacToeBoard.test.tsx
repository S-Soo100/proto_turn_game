import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TicTacToeBoard } from './TicTacToeBoard'
import type { TicTacToeState, GameResult, Grid } from '@/lib/game-logic/tictactoe'

function emptyState(currentMark: 'X' | 'O' = 'X'): TicTacToeState {
  return { grid: Array(9).fill(null) as Grid, currentMark }
}

function makeState(marks: string, currentMark: 'X' | 'O' = 'X'): TicTacToeState {
  const grid = marks.split('').map((c) => (c === '.' ? null : c)) as Grid
  return { grid, currentMark }
}

const defaultProps = {
  state: emptyState(),
  result: null,
  isAIThinking: false,
  isMyTurn: true,
  isPvp: false,
  onCellClick: vi.fn(),
}

// ── Rendering ──────────────────────────────────────────────────────────────

describe('TicTacToeBoard rendering', () => {
  test('빈 보드에서 9개 셀을 렌더링한다', () => {
    render(<TicTacToeBoard {...defaultProps} />)
    for (let i = 1; i <= 9; i++) {
      expect(screen.getByLabelText(`Empty cell ${i}`)).toBeInTheDocument()
    }
  })

  test('X 마크가 있는 셀을 표시한다', () => {
    const state = makeState('X........')
    render(<TicTacToeBoard {...defaultProps} state={state} />)
    expect(screen.getByLabelText('X at position 1')).toBeInTheDocument()
  })

  test('O 마크가 있는 셀을 표시한다', () => {
    const state = makeState('.O.......', 'X')
    render(<TicTacToeBoard {...defaultProps} state={state} />)
    expect(screen.getByLabelText('O at position 2')).toBeInTheDocument()
  })
})

// ── Status text ────────────────────────────────────────────────────────────

describe('TicTacToeBoard status text', () => {
  test('AI 모드 — 플레이어 차례', () => {
    render(<TicTacToeBoard {...defaultProps} />)
    expect(screen.getByText('당신의 차례 (X)')).toBeInTheDocument()
  })

  test('AI 모드 — AI 차례', () => {
    const state = emptyState('O')
    render(<TicTacToeBoard {...defaultProps} state={state} />)
    expect(screen.getByText('AI의 차례 (O)')).toBeInTheDocument()
  })

  test('AI 생각 중', () => {
    render(<TicTacToeBoard {...defaultProps} isAIThinking={true} />)
    expect(screen.getByText(/AI가 생각 중입니다/)).toBeInTheDocument()
  })

  test('승리', () => {
    const result: GameResult = { winner: 'X', winLine: [0, 1, 2] }
    render(<TicTacToeBoard {...defaultProps} result={result} />)
    expect(screen.getByText(/승리/)).toBeInTheDocument()
  })

  test('패배', () => {
    const result: GameResult = { winner: 'O', winLine: [0, 1, 2] }
    render(<TicTacToeBoard {...defaultProps} result={result} />)
    expect(screen.getByText(/패배/)).toBeInTheDocument()
  })

  test('무승부', () => {
    const result: GameResult = { winner: null, winLine: null }
    render(<TicTacToeBoard {...defaultProps} result={result} />)
    expect(screen.getByText('무승부!')).toBeInTheDocument()
  })

  test('PvP — 내 차례', () => {
    render(<TicTacToeBoard {...defaultProps} isPvp={true} isMyTurn={true} />)
    expect(screen.getByText('내 차례')).toBeInTheDocument()
  })

  test('PvP — 상대방 차례', () => {
    render(<TicTacToeBoard {...defaultProps} isPvp={true} isMyTurn={false} />)
    expect(screen.getByText('상대방 차례...')).toBeInTheDocument()
  })

  test('PvP — 게임 종료', () => {
    const result: GameResult = { winner: 'X', winLine: [0, 1, 2] }
    render(<TicTacToeBoard {...defaultProps} isPvp={true} result={result} />)
    expect(screen.getByText('게임 종료')).toBeInTheDocument()
  })
})

// ── Click interaction ──────────────────────────────────────────────────────

describe('TicTacToeBoard click interaction', () => {
  test('빈 셀 클릭 시 onCellClick이 호출된다', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<TicTacToeBoard {...defaultProps} onCellClick={onClick} />)

    await user.click(screen.getByLabelText('Empty cell 5'))
    expect(onClick).toHaveBeenCalledWith(4) // 0-indexed
  })

  test('채워진 셀은 클릭할 수 없다 (disabled)', () => {
    const state = makeState('X........')
    const onClick = vi.fn()
    render(<TicTacToeBoard {...defaultProps} state={state} onCellClick={onClick} />)

    const cell = screen.getByLabelText('X at position 1')
    expect(cell).toBeDisabled()
  })

  test('AI 생각 중에는 모든 셀이 disabled', () => {
    const onClick = vi.fn()
    render(<TicTacToeBoard {...defaultProps} isAIThinking={true} onCellClick={onClick} />)

    const cell = screen.getByLabelText('Empty cell 1')
    expect(cell).toBeDisabled()
  })

  test('게임 종료 후 모든 셀이 disabled', () => {
    const result: GameResult = { winner: 'X', winLine: [0, 1, 2] }
    render(<TicTacToeBoard {...defaultProps} result={result} />)

    const cell = screen.getByLabelText('Empty cell 5')
    expect(cell).toBeDisabled()
  })

  test('PvP — 상대방 차례에는 셀이 disabled', () => {
    render(<TicTacToeBoard {...defaultProps} isPvp={true} isMyTurn={false} />)
    const cell = screen.getByLabelText('Empty cell 1')
    expect(cell).toBeDisabled()
  })
})
