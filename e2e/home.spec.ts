import { test, expect } from '@playwright/test'

// E2E tests for unauthenticated pages (login, signup, navigation)

test.describe('Login page', () => {
  test('로그인 페이지가 렌더링된다', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible()
    await expect(page.getByLabel('이메일')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible()
  })

  test('회원가입 링크로 이동할 수 있다', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: '회원가입' }).click()
    await expect(page).toHaveURL('/signup')
    await expect(page.getByRole('heading', { name: '회원가입' })).toBeVisible()
  })

  test('비밀번호 보기 토글이 동작한다', async ({ page }) => {
    await page.goto('/login')
    const passwordInput = page.locator('#password')
    await expect(passwordInput).toHaveAttribute('type', 'password')

    await page.getByLabel('비밀번호 보기').click()
    await expect(passwordInput).toHaveAttribute('type', 'text')

    await page.getByLabel('비밀번호 숨기기').click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })
})

test.describe('Signup page', () => {
  test('회원가입 페이지가 렌더링된다', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.getByRole('heading', { name: '회원가입' })).toBeVisible()
    await expect(page.locator('#username')).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.locator('#confirm-password')).toBeVisible()
  })

  test('로그인 링크로 이동할 수 있다', async ({ page }) => {
    await page.goto('/signup')
    await page.getByRole('link', { name: '로그인' }).click()
    await expect(page).toHaveURL('/login')
  })

  test('비밀번호 불일치 검증이 동작한다', async ({ page }) => {
    await page.goto('/signup')
    await page.locator('#username').fill('testuser')
    await page.locator('#email').fill('test@example.com')
    await page.locator('#password').fill('password123')
    await page.locator('#confirm-password').fill('different456')
    await page.getByRole('button', { name: '회원가입' }).click()

    await expect(page.getByText('비밀번호가 일치하지 않습니다.')).toBeVisible()
  })
})

test.describe('Navigation', () => {
  test('인증되지 않은 사용자가 홈에 접근하면 로그인으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible()
  })

  test('존재하지 않는 경로에서 SPA가 정상 동작한다', async ({ page }) => {
    await page.goto('/nonexistent')
    await expect(page.locator('body')).not.toHaveText('Cannot GET')
  })
})
