import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { GonggiPage } from './GonggiPage'

// ── Mocks ──

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('@/store/authStore', () => ({
  useAuthStore: () => ({
    profile: { id: 'user-1', username: 'TestPlayer' },
  }),
}))

vi.mock('@/lib/gonggi-leaderboard', () => ({
  fetchGonggiTopScores: vi.fn().mockResolvedValue([]),
  fetchGonggiMyBest: vi.fn().mockResolvedValue(null),
  saveGonggiScore: vi.fn().mockResolvedValue(true),
}))

// Mock matter-js for GonggiBoard
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

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/gonggi']}>
      <GonggiPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── 체크리스트 1: 로비 화면 ──

describe('GonggiPage lobby', () => {
  test('로비에 게임 제목이 표시된다', () => {
    renderPage()
    expect(screen.getByText('공기놀이')).toBeInTheDocument()
    expect(screen.getByText('열받는 공기놀이')).toBeInTheDocument()
  })

  test('로비에 게임 규칙이 표시된다', () => {
    renderPage()
    expect(screen.getByText('게임 규칙')).toBeInTheDocument()
    expect(screen.getByText(/일단: 하나씩 집기/)).toBeInTheDocument()
    expect(screen.getByText(/이단: 두 개씩 집기/)).toBeInTheDocument()
    expect(screen.getByText(/삼단: 세 개 \+ 한 개/)).toBeInTheDocument()
    expect(screen.getByText(/사단: 네 개 한번에/)).toBeInTheDocument()
    expect(screen.getByText(/꺾기: 전부 던져서 잡기/)).toBeInTheDocument()
  })

  test('로비에 변칙 룰 경고가 표시된다', () => {
    renderPage()
    expect(screen.getByText(/라운드 3부터 변칙 룰 발동/)).toBeInTheDocument()
  })

  test('로비에 리더보드 섹션이 표시된다', () => {
    renderPage()
    expect(screen.getByText(/클리어 랭킹/)).toBeInTheDocument()
  })

  test('로비에 시작 버튼이 표시된다', () => {
    renderPage()
    expect(screen.getByText(/게임 시작/)).toBeInTheDocument()
  })

  test('← 홈 클릭 시 홈으로 이동한다', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('← 홈'))
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  test('리더보드가 비어있으면 안내 메시지를 표시한다', () => {
    renderPage()
    expect(screen.getByText(/아직 기록이 없습니다/)).toBeInTheDocument()
  })
})

// ── 체크리스트 2: 로비→플레이 전환 ──

describe('GonggiPage lobby → playing transition', () => {
  test('시작 버튼 클릭 시 게임 화면으로 전환된다', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText(/게임 시작/))

    // 로비 요소가 사라지고 게임 보드가 나타남
    expect(screen.queryByText('게임 규칙')).not.toBeInTheDocument()
    // 보드 UI 요소 확인
    expect(screen.getByText(/일단/)).toBeInTheDocument()
    expect(screen.getByText(/던지세요/)).toBeInTheDocument()
  })
})

// ── 체크리스트 3: 플레이 화면 ──

describe('GonggiPage playing', () => {
  async function startGame() {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText(/게임 시작/))
    return user
  }

  test('게임 보드에 단계 정보가 표시된다', async () => {
    await startGame()
    expect(screen.getByText(/일단/)).toBeInTheDocument()
    expect(screen.getByText('00:00')).toBeInTheDocument()
  })

  test('게임 보드에 상태바가 표시된다 (라운드/실패/변칙)', async () => {
    await startGame()
    expect(screen.getByText('라운드')).toBeInTheDocument()
    expect(screen.getByText('실패')).toBeInTheDocument()
    expect(screen.getByText('변칙')).toBeInTheDocument()
  })

  test('일시정지 버튼이 있다', async () => {
    await startGame()
    expect(screen.getByText('⏸')).toBeInTheDocument()
  })

  test('종료 버튼이 있다', async () => {
    await startGame()
    expect(screen.getByText('✕')).toBeInTheDocument()
  })

  test('종료 버튼 클릭 시 로비로 돌아간다', async () => {
    const user = await startGame()
    await user.click(screen.getByText('✕'))

    // 로비 화면으로 복귀
    expect(screen.getByText('열받는 공기놀이')).toBeInTheDocument()
    expect(screen.getByText(/게임 시작/)).toBeInTheDocument()
  })

  test('일시정지 → 재개 동작한다', async () => {
    const user = await startGame()
    await user.click(screen.getByText('⏸'))
    expect(screen.getByText('일시정지')).toBeInTheDocument()

    await user.click(screen.getByText('계속하기'))
    expect(screen.queryByText('일시정지')).not.toBeInTheDocument()
  })

  test('던지기 버튼 클릭 후 스와이프 안내로 전환된다', async () => {
    const user = await startGame()
    await user.click(screen.getByText(/던지기/))
    expect(screen.getByText(/스와이프하세요/)).toBeInTheDocument()
  })
})
