import { useState } from 'react'
import styled from '@emotion/styled'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 400px;
`

const Title = styled.h2`
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  margin: 0 0 8px;
`

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`

const Input = styled.input`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;

  &:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  }
`

const PasswordInput = styled(Input)`
  padding-right: 44px;
`

const EyeButton = styled.button`
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #9ca3af;
  font-size: 16px;
  display: flex;
  align-items: center;
  -webkit-tap-highlight-color: transparent;

  &:hover { color: #6b7280; }
`

const Button = styled.button`
  padding: 11px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;

  &:hover:not(:disabled) {
    background: #4f46e5;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const ErrorMessage = styled.p`
  color: #dc2626;
  font-size: 13px;
  margin: 0;
  padding: 8px 12px;
  background: #fef2f2;
  border-radius: 6px;
`

const SuccessMessage = styled.p`
  color: #16a34a;
  font-size: 13px;
  margin: 0;
  padding: 8px 12px;
  background: #f0fdf4;
  border-radius: 6px;
`

const Hint = styled.span`
  font-size: 12px;
  color: #9ca3af;
`

const FooterText = styled.p`
  text-align: center;
  font-size: 14px;
  color: #6b7280;
  margin: 0;

  a {
    color: #6366f1;
    font-weight: 500;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
`

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function getErrorMessage(message: string): string {
  if (message.includes('500') || message.includes('unexpected_failure') || message.includes('email') && message.includes('send')) {
    return 'SMTP 설정 오류: Supabase 대시보드에서 이메일 인증을 끄거나 SMTP 설정을 확인해주세요.'
  }
  if (message.includes('already registered') || message.includes('already been registered')) {
    return '이미 가입된 이메일입니다.'
  }
  if (message.includes('Password should be at least')) {
    return '비밀번호는 6자 이상이어야 합니다.'
  }
  if (message.includes('Invalid email')) {
    return '올바른 이메일 형식이 아닙니다.'
  }
  return message
}

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { signup } = useAuth()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (username.length < 3 || username.length > 20) {
      setError('닉네임은 3~20자 사이여야 합니다.')
      return
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setIsSubmitting(true)
    const { error } = await signup(email, password, username)

    if (error) {
      setError(getErrorMessage(error.message))
      setIsSubmitting(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <Wrapper>
        <Title>회원가입 완료</Title>
        <SuccessMessage>
          가입 확인 이메일을 발송했습니다. 받은 편지함을 확인해주세요.
        </SuccessMessage>
        <FooterText>
          <Link to="/login">로그인 페이지로</Link>
        </FooterText>
      </Wrapper>
    )
  }

  return (
    <Wrapper as="form" onSubmit={handleSubmit}>
      <Title>회원가입</Title>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <Field>
        <Label htmlFor="username">
          닉네임 <Hint>(3~20자)</Hint>
        </Label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="게임에서 사용할 닉네임"
          required
          minLength={3}
          maxLength={20}
          autoComplete="username"
        />
      </Field>

      <Field>
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
      </Field>

      <Field>
        <Label htmlFor="password">
          비밀번호 <Hint>(6자 이상)</Hint>
        </Label>
        <InputWrapper>
          <PasswordInput
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            autoComplete="new-password"
          />
          <EyeButton
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
          >
            <EyeIcon visible={showPassword} />
          </EyeButton>
        </InputWrapper>
      </Field>

      <Field>
        <Label htmlFor="confirm-password">비밀번호 확인</Label>
        <InputWrapper>
          <PasswordInput
            id="confirm-password"
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            autoComplete="new-password"
          />
          <EyeButton
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={showConfirm ? '비밀번호 숨기기' : '비밀번호 보기'}
          >
            <EyeIcon visible={showConfirm} />
          </EyeButton>
        </InputWrapper>
      </Field>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '가입 중...' : '회원가입'}
      </Button>

      <FooterText>
        이미 계정이 있으신가요? <Link to="/login">로그인</Link>
      </FooterText>
    </Wrapper>
  )
}
