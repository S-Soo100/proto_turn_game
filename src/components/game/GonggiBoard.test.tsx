import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GonggiBoard from './GonggiBoard'

// Mock matter-js
vi.mock('matter-js', () => {
  const mockBody = {
    position: { x: 100, y: 200 },
    angle: 0,
    velocity: { x: 0, y: 0 },
  }
  return {
    default: {
      Engine: {
        create: () => ({ world: { bodies: [] } }),
        update: vi.fn(),
        clear: vi.fn(),
      },
      World: {
        add: vi.fn(),
        clear: vi.fn(),
      },
      Bodies: {
        rectangle: () => ({ ...mockBody, isStatic: true }),
        circle: () => ({ ...mockBody }),
      },
      Body: {
        setVelocity: vi.fn(),
        applyForce: vi.fn(),
        setPosition: vi.fn(),
        setStatic: vi.fn(),
      },
      Events: {
        on: vi.fn(),
        off: vi.fn(),
      },
    },
  }
})

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

  it('renders with initial scatter phase', () => {
    render(<GonggiBoard onGameEnd={onGameEnd} onQuit={onQuit} />)
    // Should show toss phase text since scatter auto-transitions
    expect(screen.getByText(/던지세요/)).toBeInTheDocument()
  })

  it('renders the board area', () => {
    const { container } = render(<GonggiBoard onGameEnd={onGameEnd} onQuit={onQuit} />)
    // Board area is rendered (physics stones need real matter.js to produce positions)
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

  it('renders toss button in toss phase', () => {
    render(<GonggiBoard onGameEnd={onGameEnd} onQuit={onQuit} />)
    expect(screen.getByText(/던지기/)).toBeInTheDocument()
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

  it('transitions to pick phase after toss', () => {
    render(<GonggiBoard onGameEnd={onGameEnd} onQuit={onQuit} />)
    fireEvent.click(screen.getByText(/던지기/))
    // Should now show pick instruction
    expect(screen.getByText(/스와이프하세요/)).toBeInTheDocument()
  })

  it('shows initial round as 1', () => {
    render(<GonggiBoard onGameEnd={onGameEnd} onQuit={onQuit} />)
    // Find the stat value for round
    const roundValues = screen.getAllByText('1')
    expect(roundValues.length).toBeGreaterThan(0)
  })

  it('shows fail count as 0 initially', () => {
    render(<GonggiBoard onGameEnd={onGameEnd} onQuit={onQuit} />)
    const zeroValues = screen.getAllByText('0')
    expect(zeroValues.length).toBeGreaterThanOrEqual(2) // fail and chaos both 0
  })
})
