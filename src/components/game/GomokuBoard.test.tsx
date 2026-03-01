import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GomokuBoard } from './GomokuBoard'
import type { GomokuState, GomokuResult } from '@/lib/game-logic/gomoku'

function emptyState(currentMark: 'B' | 'W' = 'B'): GomokuState {
  return { grid: Array(225).fill(null), currentMark, lastMove: null }
}

function stateWithStone(index: number, mark: 'B' | 'W'): GomokuState {
  const state = emptyState(mark === 'B' ? 'W' : 'B')
  state.grid[index] = mark
  state.lastMove = index
  return state
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

describe('GomokuBoard rendering', () => {
  test('225개 셀을 렌더링한다', () => {
    render(<GomokuBoard {...defaultProps} />)
    // Check a few representative cells
    expect(screen.getByLabelText('Empty 0')).toBeInTheDocument()
    expect(screen.getByLabelText('Empty 112')).toBeInTheDocument() // center
    expect(screen.getByLabelText('Empty 224')).toBeInTheDocument()
  })

  test('흑돌(B)은 🐻로 표시된다', () => {
    const state = stateWithStone(112, 'B')
    render(<GomokuBoard {...defaultProps} state={state} />)
    const cell = screen.getByLabelText('B at 112')
    expect(cell).toBeInTheDocument()
    expect(cell).toHaveTextContent('🐻')
  })

  test('백돌(W)은 🐰로 표시된다', () => {
    const state = stateWithStone(112, 'W')
    render(<GomokuBoard {...defaultProps} state={state} />)
    const cell = screen.getByLabelText('W at 112')
    expect(cell).toBeInTheDocument()
    expect(cell).toHaveTextContent('🐰')
  })
})

// ── Status text ────────────────────────────────────────────────────────────

describe('GomokuBoard status text', () => {
  test('AI 모드 — 플레이어 차례', () => {
    render(<GomokuBoard {...defaultProps} />)
    expect(screen.getByText(/당신의 차례.*🐻 곰/)).toBeInTheDocument()
  })

  test('AI 모드 — AI 차례', () => {
    const state = emptyState('W')
    render(<GomokuBoard {...defaultProps} state={state} />)
    expect(screen.getByText(/AI의 차례.*🐰 토끼/)).toBeInTheDocument()
  })

  test('AI 생각 중', () => {
    render(<GomokuBoard {...defaultProps} isAIThinking={true} />)
    expect(screen.getByText(/AI가 생각 중입니다/)).toBeInTheDocument()
  })

  test('승리 (B)', () => {
    const result: GomokuResult = { winner: 'B', winLine: [0, 1, 2, 3, 4] }
    render(<GomokuBoard {...defaultProps} result={result} />)
    expect(screen.getByText(/승리/)).toBeInTheDocument()
  })

  test('패배 (W wins)', () => {
    const result: GomokuResult = { winner: 'W', winLine: [0, 1, 2, 3, 4] }
    render(<GomokuBoard {...defaultProps} result={result} />)
    expect(screen.getByText(/패배/)).toBeInTheDocument()
  })

  test('무승부', () => {
    const result: GomokuResult = { winner: null, winLine: [] }
    render(<GomokuBoard {...defaultProps} result={result} />)
    expect(screen.getByText('무승부!')).toBeInTheDocument()
  })

  test('PvP — 내 차례', () => {
    render(<GomokuBoard {...defaultProps} isPvp={true} isMyTurn={true} />)
    expect(screen.getByText(/내 차례 🐻/)).toBeInTheDocument()
  })

  test('PvP — 상대방 차례', () => {
    render(<GomokuBoard {...defaultProps} isPvp={true} isMyTurn={false} />)
    expect(screen.getByText('상대방 차례...')).toBeInTheDocument()
  })

  test('PvP — 게임 종료', () => {
    const result: GomokuResult = { winner: 'B', winLine: [0, 1, 2, 3, 4] }
    render(<GomokuBoard {...defaultProps} isPvp={true} result={result} />)
    expect(screen.getByText('게임 종료')).toBeInTheDocument()
  })
})

// ── Click interaction ──────────────────────────────────────────────────────

describe('GomokuBoard click interaction', () => {
  test('빈 셀 클릭 시 onCellClick이 호출된다', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<GomokuBoard {...defaultProps} onCellClick={onClick} />)

    await user.click(screen.getByLabelText('Empty 112'))
    expect(onClick).toHaveBeenCalledWith(112)
  })

  test('돌이 놓인 셀은 onCellClick이 호출되지 않는다', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const state = stateWithStone(112, 'B')
    render(<GomokuBoard {...defaultProps} state={state} onCellClick={onClick} />)

    await user.click(screen.getByLabelText('B at 112'))
    expect(onClick).not.toHaveBeenCalled()
  })

  test('AI 생각 중에는 클릭할 수 없다', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<GomokuBoard {...defaultProps} isAIThinking={true} onCellClick={onClick} />)

    await user.click(screen.getByLabelText('Empty 112'))
    expect(onClick).not.toHaveBeenCalled()
  })

  test('게임 종료 후 클릭할 수 없다', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const result: GomokuResult = { winner: 'B', winLine: [0, 1, 2, 3, 4] }
    render(<GomokuBoard {...defaultProps} result={result} onCellClick={onClick} />)

    await user.click(screen.getByLabelText('Empty 112'))
    expect(onClick).not.toHaveBeenCalled()
  })
})
