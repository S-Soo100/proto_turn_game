import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GonggiBoard from './GonggiBoard'
import * as gonggiModule from '@/lib/game-logic/gonggi'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('GonggiBoard', () => {
  const onGameEnd = vi.fn()
  const onQuit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with initial select phase', () => {
    render(<GonggiBoard onGameEnd={onGameEnd} onQuit={onQuit} />)
    // Should show select phase text since scatter auto-transitions to select
    expect(screen.getByText(/골라주세요/)).toBeInTheDocument()
  })

  it('renders the board area', () => {
    const { container } = render(<GonggiBoard onGameEnd={onGameEnd} onQuit={onQuit} />)
    const board = container.querySelector('[class*="BoardArea"]') ?? container.querySelector('div')
    expect(board).toBeInTheDocument()
  })

  it('renders stage label', () => {
    render(<GonggiBoard onGameEnd={onGameEnd} onQuit={onQuit} />)
    expect(screen.getByText(/일단/)).toBeInTheDocument()
  })

  it('renders timer at 00:00', () => {
    render(<GonggiBoard onGameEnd={onGameEnd} onQuit={onQuit} />)
    expect(screen.getByText('00:00')).toBeInTheDocument()
  })

  it('shows select phase text (no toss button yet)', () => {
    render(<GonggiBoard onGameEnd={onGameEnd} onQuit={onQuit} />)
    // In select phase, no toss button — player must select a stone first
    expect(screen.getByText(/골라주세요/)).toBeInTheDocument()
    expect(screen.queryByText(/던지기/)).not.toBeInTheDocument()
  })

  it('renders stone emojis on the board', () => {
    render(<GonggiBoard onGameEnd={onGameEnd} onQuit={onQuit} />)
    // Stones should be rendered as CSS-positioned elements
    expect(screen.getByText('🟡')).toBeInTheDocument()
    expect(screen.getByText('🔴')).toBeInTheDocument()
    expect(screen.getByText('🔵')).toBeInTheDocument()
    expect(screen.getByText('🟢')).toBeInTheDocument()
    expect(screen.getByText('🟣')).toBeInTheDocument()
  })

  it('renders status bar with round, fail, chaos stats', () => {
    render(<GonggiBoard onGameEnd={onGameEnd} onQuit={onQuit} />)
    expect(screen.getByText('라운드')).toBeInTheDocument()
    expect(screen.getByText('실패')).toBeInTheDocument()
    expect(screen.getByText('변칙')).toBeInTheDocument()
  })

  it('shows pause overlay when pause clicked', () => {
    render(<GonggiBoard onGameEnd={onGameEnd} onQuit={onQuit} />)
    const pauseBtn = screen.getByText('⏸')
    fireEvent.click(pauseBtn)
    expect(screen.getByText('일시정지')).toBeInTheDocument()
    expect(screen.getByText('계속하기')).toBeInTheDocument()
  })

  it('resumes from pause', () => {
    render(<GonggiBoard onGameEnd={onGameEnd} onQuit={onQuit} />)
    fireEvent.click(screen.getByText('⏸'))
    expect(screen.getByText('일시정지')).toBeInTheDocument()
    fireEvent.click(screen.getByText('계속하기'))
    expect(screen.queryByText('일시정지')).not.toBeInTheDocument()
  })

  it('calls onQuit when quit button clicked', () => {
    render(<GonggiBoard onGameEnd={onGameEnd} onQuit={onQuit} />)
    fireEvent.click(screen.getByText('✕'))
    expect(onQuit).toHaveBeenCalled()
  })

  it('starts in select phase after scatter', () => {
    render(<GonggiBoard onGameEnd={onGameEnd} onQuit={onQuit} />)
    // After auto-scatter, stage 1 enters select phase
    expect(screen.getByText(/골라주세요/)).toBeInTheDocument()
  })

  it('shows initial round as 1', () => {
    render(<GonggiBoard onGameEnd={onGameEnd} onQuit={onQuit} />)
    const roundValues = screen.getAllByText('1')
    expect(roundValues.length).toBeGreaterThan(0)
  })

  it('shows fail count as 0 initially', () => {
    render(<GonggiBoard onGameEnd={onGameEnd} onQuit={onQuit} />)
    const zeroValues = screen.getAllByText('0')
    expect(zeroValues.length).toBeGreaterThanOrEqual(2) // fail and chaos both 0
  })

  it('renders all 5 stone emojis', () => {
    render(<GonggiBoard onGameEnd={onGameEnd} onQuit={onQuit} />)
    const emojis = ['🟡', '🔴', '🔵', '🟢', '🟣']
    emojis.forEach((emoji) => {
      expect(screen.getByText(emoji)).toBeInTheDocument()
    })
  })

  it('shows round-clear phase text and next round button', () => {
    const roundClearState: gonggiModule.GonggiState = {
      ...gonggiModule.createInitialState(42),
      stage: 5,
      round: 2,
      phase: 'round-clear' as gonggiModule.GamePhase,
    }
    vi.spyOn(gonggiModule, 'createInitialState').mockReturnValue(roundClearState)
    vi.spyOn(gonggiModule, 'scatterStones').mockReturnValue(roundClearState)

    render(<GonggiBoard onGameEnd={onGameEnd} onQuit={onQuit} />)
    expect(screen.getByText(/라운드 2 클리어/)).toBeInTheDocument()
    expect(screen.getByText(/라운드 3 시작/)).toBeInTheDocument()

    vi.restoreAllMocks()
  })
})
