import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { SignupForm } from './SignupForm'

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockSignup = vi.fn()

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    login: vi.fn(),
    signup: mockSignup,
    logout: vi.fn(),
    user: null,
    session: null,
    profile: null,
    isLoading: false,
  }),
}))

function renderSignupForm() {
  return render(
    <MemoryRouter>
      <SignupForm />
    </MemoryRouter>,
  )
}

// Label text: "비밀번호 (6자 이상)" vs "비밀번호 확인"
const PASSWORD_LABEL = /비밀번호 \(6자 이상\)/

async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  { username = 'testuser', email = 'test@example.com', password = 'pass123', confirm = 'pass123' } = {},
) {
  await user.type(screen.getByLabelText(/닉네임/), username)
  await user.type(screen.getByLabelText('이메일'), email)
  await user.type(screen.getByLabelText(PASSWORD_LABEL), password)
  await user.type(screen.getByLabelText('비밀번호 확인'), confirm)
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Rendering ──────────────────────────────────────────────────────────────

describe('SignupForm rendering', () => {
  test('제목, 4개 입력, 가입 버튼, 로그인 링크를 렌더링한다', () => {
    renderSignupForm()
    expect(screen.getByRole('heading', { name: '회원가입' })).toBeInTheDocument()
    expect(screen.getByLabelText(/닉네임/)).toBeInTheDocument()
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByLabelText(PASSWORD_LABEL)).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호 확인')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '회원가입' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '로그인' })).toBeInTheDocument()
  })
})

// ── Client-side validation ─────────────────────────────────────────────────

describe('SignupForm client validation', () => {
  test('닉네임이 3자 미만이면 에러', async () => {
    const user = userEvent.setup()
    renderSignupForm()
    await fillForm(user, { username: 'ab' })
    await user.click(screen.getByRole('button', { name: '회원가입' }))

    expect(screen.getByText('닉네임은 3~20자 사이여야 합니다.')).toBeInTheDocument()
    expect(mockSignup).not.toHaveBeenCalled()
  })

  test('비밀번호가 일치하지 않으면 에러', async () => {
    const user = userEvent.setup()
    renderSignupForm()
    await fillForm(user, { password: 'pass123', confirm: 'pass456' })
    await user.click(screen.getByRole('button', { name: '회원가입' }))

    expect(screen.getByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument()
    expect(mockSignup).not.toHaveBeenCalled()
  })
})

// ── API error localization ─────────────────────────────────────────────────

describe('SignupForm API error localization', () => {
  test('이미 가입된 이메일 에러를 한국어로 표시한다', async () => {
    mockSignup.mockResolvedValue({ error: { message: 'User already registered' } })
    const user = userEvent.setup()
    renderSignupForm()
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: '회원가입' }))

    await waitFor(() => {
      expect(screen.getByText('이미 가입된 이메일입니다.')).toBeInTheDocument()
    })
  })

  test('비밀번호 길이 에러를 한국어로 표시한다', async () => {
    mockSignup.mockResolvedValue({ error: { message: 'Password should be at least 6 characters' } })
    const user = userEvent.setup()
    renderSignupForm()
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: '회원가입' }))

    await waitFor(() => {
      expect(screen.getByText('비밀번호는 6자 이상이어야 합니다.')).toBeInTheDocument()
    })
  })

  test('이메일 형식 에러를 한국어로 표시한다', async () => {
    mockSignup.mockResolvedValue({ error: { message: 'Invalid email' } })
    const user = userEvent.setup()
    renderSignupForm()
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: '회원가입' }))

    await waitFor(() => {
      expect(screen.getByText('올바른 이메일 형식이 아닙니다.')).toBeInTheDocument()
    })
  })
})

// ── Success flow ───────────────────────────────────────────────────────────

describe('SignupForm success', () => {
  test('가입 성공 시 완료 화면을 표시한다', async () => {
    mockSignup.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    renderSignupForm()
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: '회원가입' }))

    await waitFor(() => {
      expect(screen.getByText('회원가입 완료')).toBeInTheDocument()
      expect(screen.getByText(/이메일을 발송했습니다/)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: '로그인 페이지로' })).toBeInTheDocument()
    })
  })

  test('제출 중에는 버튼이 비활성화된다', async () => {
    let resolveSignup: (value: { error: null }) => void
    mockSignup.mockReturnValue(new Promise((resolve) => { resolveSignup = resolve }))
    const user = userEvent.setup()
    renderSignupForm()
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: '회원가입' }))

    expect(screen.getByRole('button', { name: '가입 중...' })).toBeDisabled()

    resolveSignup!({ error: null })
    await waitFor(() => {
      expect(screen.getByText('회원가입 완료')).toBeInTheDocument()
    })
  })
})

// ── Password toggle ────────────────────────────────────────────────────────

describe('SignupForm password toggle', () => {
  test('비밀번호 보기 토글이 동작한다', async () => {
    const user = userEvent.setup()
    renderSignupForm()

    const passwordInput = screen.getByLabelText(PASSWORD_LABEL)
    expect(passwordInput).toHaveAttribute('type', 'password')

    const toggleButtons = screen.getAllByLabelText('비밀번호 보기')
    await user.click(toggleButtons[0])
    expect(passwordInput).toHaveAttribute('type', 'text')
  })
})
