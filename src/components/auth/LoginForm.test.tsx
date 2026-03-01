import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LoginForm } from './LoginForm'

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockLogin = vi.fn()
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    signup: vi.fn(),
    logout: vi.fn(),
    user: null,
    session: null,
    profile: null,
    isLoading: false,
  }),
}))

function renderLoginForm() {
  return render(
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Rendering ──────────────────────────────────────────────────────────────

describe('LoginForm rendering', () => {
  test('제목, 이메일/비밀번호 입력, 로그인 버튼을 렌더링한다', () => {
    renderLoginForm()
    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument()
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument()
  })

  test('회원가입 링크가 있다', () => {
    renderLoginForm()
    expect(screen.getByRole('link', { name: '회원가입' })).toBeInTheDocument()
  })
})

// ── Password toggle ────────────────────────────────────────────────────────

describe('LoginForm password toggle', () => {
  test('비밀번호 보기 토글이 동작한다', async () => {
    const user = userEvent.setup()
    renderLoginForm()

    const passwordInput = screen.getByLabelText('비밀번호')
    expect(passwordInput).toHaveAttribute('type', 'password')

    await user.click(screen.getByLabelText('비밀번호 보기'))
    expect(passwordInput).toHaveAttribute('type', 'text')

    await user.click(screen.getByLabelText('비밀번호 숨기기'))
    expect(passwordInput).toHaveAttribute('type', 'password')
  })
})

// ── Login flow ─────────────────────────────────────────────────────────────

describe('LoginForm login flow', () => {
  test('로그인 성공 시 홈으로 이동한다', async () => {
    mockLogin.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    renderLoginForm()

    await user.type(screen.getByLabelText('이메일'), 'test@example.com')
    await user.type(screen.getByLabelText('비밀번호'), 'password123')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  test('로그인 실패 시 에러 메시지를 표시한다', async () => {
    mockLogin.mockResolvedValue({ error: { message: 'Invalid credentials' } })
    const user = userEvent.setup()
    renderLoginForm()

    await user.type(screen.getByLabelText('이메일'), 'test@example.com')
    await user.type(screen.getByLabelText('비밀번호'), 'wrong')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  test('제출 중에는 버튼이 비활성화된다', async () => {
    let resolveLogin: (value: { error: null }) => void
    mockLogin.mockReturnValue(new Promise((resolve) => { resolveLogin = resolve }))
    const user = userEvent.setup()
    renderLoginForm()

    await user.type(screen.getByLabelText('이메일'), 'test@example.com')
    await user.type(screen.getByLabelText('비밀번호'), 'password123')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(screen.getByRole('button', { name: '로그인 중...' })).toBeDisabled()

    resolveLogin!({ error: null })
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })
})
