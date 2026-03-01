import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { HomePage } from './HomePage'
import type { Profile } from '@/types/database'

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()
const mockLogout = vi.fn()
const mockStartNewGame = vi.fn()
const mockUpdateProfile = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ logout: mockLogout }),
}))

const mockProfile: Profile = {
  id: 'user-1',
  username: 'TestPlayer',
  avatar_url: null,
  created_at: '',
  updated_at: '',
  total_games: 42,
  games_won: 20,
  games_lost: 15,
  games_drawn: 7,
  elo_rating: 1500,
  peak_rating: 1600,
  preferred_pace: 'standard',
  notifications_enabled: true,
  email_notifications: true,
  last_seen_at: '',
  is_banned: false,
  ban_reason: null,
}

vi.mock('@/store/authStore', () => ({
  useAuthStore: () => ({
    profile: mockProfile,
    updateProfile: mockUpdateProfile,
  }),
}))

vi.mock('@/store/gameStore', () => ({
  useGameStore: () => ({
    startNewGame: mockStartNewGame,
  }),
}))

function renderHomePage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockProfile.username = 'TestPlayer'
  mockProfile.elo_rating = 1500
  mockProfile.total_games = 42
})

// ── Profile display ────────────────────────────────────────────────────────

describe('HomePage profile display', () => {
  test('프로필 카드에 닉네임과 ELO를 표시한다', () => {
    renderHomePage()
    expect(screen.getByText('TestPlayer')).toBeInTheDocument()
    expect(screen.getByText(/ELO 1500/)).toBeInTheDocument()
    expect(screen.getByText(/42게임/)).toBeInTheDocument()
  })

  test('아바타에 닉네임 첫 글자를 표시한다', () => {
    renderHomePage()
    expect(screen.getByText('T')).toBeInTheDocument()
  })
})

// ── Game list ──────────────────────────────────────────────────────────────

describe('HomePage game list', () => {
  test('활성 게임 카드들을 표시한다', () => {
    renderHomePage()
    expect(screen.getByText('틱택토')).toBeInTheDocument()
    expect(screen.getByText('오목')).toBeInTheDocument()
    expect(screen.getByText('반응속도 게임')).toBeInTheDocument()
  })

  test('미래 게임에 "준비 중" 배지를 표시한다', () => {
    renderHomePage()
    expect(screen.getByText('체스')).toBeInTheDocument()
    expect(screen.getByText('준비 중')).toBeInTheDocument()
  })

  test('반응속도 게임 클릭 시 해당 페이지로 이동한다', async () => {
    const user = userEvent.setup()
    renderHomePage()
    await user.click(screen.getByText('반응속도 게임'))
    expect(mockNavigate).toHaveBeenCalledWith('/reaction-speed')
  })
})

// ── Game mode selection flow ───────────────────────────────────────────────

describe('HomePage game mode selection', () => {
  test('게임 카드 클릭 → 모드 선택 시트 열림', async () => {
    const user = userEvent.setup()
    renderHomePage()
    await user.click(screen.getByText('틱택토'))

    expect(screen.getByText('게임 모드를 선택하세요')).toBeInTheDocument()
    expect(screen.getByText('AI 대전')).toBeInTheDocument()
    expect(screen.getByText(/친구와 대전/)).toBeInTheDocument()
  })

  test('PvP 선택 시 로비로 이동한다', async () => {
    const user = userEvent.setup()
    renderHomePage()
    await user.click(screen.getByText('틱택토'))
    await user.click(screen.getByText(/친구와 대전/))

    expect(mockNavigate).toHaveBeenCalledWith('/lobby')
  })

  test('AI 대전 선택 → 난이도 선택 → 게임 시작', async () => {
    mockStartNewGame.mockResolvedValue('game-123')
    const user = userEvent.setup()
    renderHomePage()

    // Step 1: 게임 선택
    await user.click(screen.getByText('오목'))

    // Step 2: AI 대전 선택
    await user.click(screen.getByText('AI 대전'))
    expect(screen.getByText('AI 난이도')).toBeInTheDocument()

    // Step 3: 난이도 선택 + 시작
    await user.click(screen.getByText('쉬움'))
    await user.click(screen.getByText('게임 시작'))

    await waitFor(() => {
      expect(mockStartNewGame).toHaveBeenCalledWith('user-1', 'easy', 'gomoku')
      expect(mockNavigate).toHaveBeenCalledWith('/game/game-123')
    })
  })

  test('기본 난이도는 보통이다', async () => {
    const user = userEvent.setup()
    renderHomePage()
    await user.click(screen.getByText('틱택토'))
    await user.click(screen.getByText('AI 대전'))

    // 보통 옆에 ✓ 체크마크가 있어야 함
    const mediumButton = screen.getByText('보통').closest('button')
    expect(mediumButton).toHaveTextContent('✓')
  })
})

// ── Profile edit ───────────────────────────────────────────────────────────

describe('HomePage profile edit', () => {
  test('프로필 카드 클릭 → 수정 시트 열림', async () => {
    const user = userEvent.setup()
    renderHomePage()
    await user.click(screen.getByText('TestPlayer'))

    expect(screen.getByText('프로필 수정')).toBeInTheDocument()
    expect(screen.getByDisplayValue('TestPlayer')).toBeInTheDocument()
  })

  test('닉네임 수정 후 저장', async () => {
    mockUpdateProfile.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderHomePage()
    await user.click(screen.getByText('TestPlayer'))

    const input = screen.getByDisplayValue('TestPlayer')
    await user.clear(input)
    await user.type(input, 'NewName')
    await user.click(screen.getByText('저장'))

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({ username: 'NewName' })
    })
  })

  test('취소 클릭 시 저장하지 않고 닫힌다', async () => {
    const user = userEvent.setup()
    renderHomePage()
    await user.click(screen.getByText('TestPlayer'))
    await user.click(screen.getByText('취소'))

    expect(mockUpdateProfile).not.toHaveBeenCalled()
  })

  test('3자 미만 닉네임은 에러', async () => {
    const user = userEvent.setup()
    renderHomePage()
    await user.click(screen.getByText('TestPlayer'))

    const input = screen.getByDisplayValue('TestPlayer')
    await user.clear(input)
    await user.type(input, 'ab')
    await user.click(screen.getByText('저장'))

    expect(screen.getByText('닉네임은 3~20자여야 합니다')).toBeInTheDocument()
    expect(mockUpdateProfile).not.toHaveBeenCalled()
  })

  test('중복 닉네임 에러를 표시한다', async () => {
    mockUpdateProfile.mockRejectedValue(new Error('duplicate key value violates unique constraint'))
    const user = userEvent.setup()
    renderHomePage()
    await user.click(screen.getByText('TestPlayer'))

    const input = screen.getByDisplayValue('TestPlayer')
    await user.clear(input)
    await user.type(input, 'TakenName')
    await user.click(screen.getByText('저장'))

    await waitFor(() => {
      expect(screen.getByText('이미 사용 중인 닉네임입니다')).toBeInTheDocument()
    })
  })

  test('동일 닉네임으로 저장 시 API 호출 없이 닫힌다', async () => {
    const user = userEvent.setup()
    renderHomePage()
    await user.click(screen.getByText('TestPlayer'))
    // 닉네임을 변경하지 않고 저장
    await user.click(screen.getByText('저장'))

    expect(mockUpdateProfile).not.toHaveBeenCalled()
  })
})

// ── Logout ─────────────────────────────────────────────────────────────────

describe('HomePage logout', () => {
  test('로그아웃 버튼 클릭 시 logout이 호출된다', async () => {
    const user = userEvent.setup()
    renderHomePage()
    await user.click(screen.getByText('로그아웃'))
    expect(mockLogout).toHaveBeenCalled()
  })
})
