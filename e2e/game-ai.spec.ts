import { test, expect, type Page } from '@playwright/test'

// E2E tests for AI game flow.
// Since these tests require authentication, we mock the auth state
// by intercepting Supabase API calls and injecting a fake session.

// Helper: bypass auth by injecting a fake profile into localStorage/store
async function loginAsTestUser(page: Page) {
  // Navigate to login page first
  await page.goto('/login')

  // Intercept Supabase auth session check to return a fake session
  await page.route('**/auth/v1/token*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'fake-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'fake-refresh',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          role: 'authenticated',
        },
      }),
    })
  })

  // Intercept profile fetch
  await page.route('**/rest/v1/profiles*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-user-id',
          username: 'E2EPlayer',
          avatar_url: null,
          elo_rating: 1200,
          total_games: 0,
          games_won: 0,
          games_lost: 0,
          games_drawn: 0,
          peak_rating: 1200,
          preferred_pace: 'standard',
          notifications_enabled: true,
          email_notifications: true,
          is_banned: false,
          ban_reason: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
        }),
      })
    } else {
      await route.continue()
    }
  })

  // Fill in and submit login form
  await page.getByLabel('이메일').fill('test@example.com')
  await page.locator('#password').fill('password123')
  await page.getByRole('button', { name: '로그인' }).click()

  // Wait for navigation to home page
  await expect(page.getByText('게임 허브')).toBeVisible({ timeout: 5000 })
}

test.describe('AI Game Flow (requires auth)', () => {
  test('홈 → 틱택토 → AI 대전 → 난이도 선택 플로우', async ({ page }) => {
    await loginAsTestUser(page)

    // Click 틱택토 game card
    await page.getByText('틱택토').click()

    // Mode selection sheet
    await expect(page.getByText('게임 모드를 선택하세요')).toBeVisible()

    // Select AI mode
    await page.getByText('AI 대전').click()

    // Difficulty selection
    await expect(page.getByText('AI 난이도')).toBeVisible()
    await expect(page.getByText('쉬움')).toBeVisible()
    await expect(page.getByText('보통')).toBeVisible()
    await expect(page.getByText('어려움')).toBeVisible()
  })

  test('홈 → 오목 → AI 대전 → 난이도 선택 플로우', async ({ page }) => {
    await loginAsTestUser(page)

    await page.getByText('오목').click()
    await expect(page.getByText('게임 모드를 선택하세요')).toBeVisible()
    await page.getByText('AI 대전').click()
    await expect(page.getByText('AI 난이도')).toBeVisible()
  })

  test('프로필 수정 시트를 열고 닫을 수 있다', async ({ page }) => {
    await loginAsTestUser(page)

    // Click profile card
    await page.getByText('E2EPlayer').click()
    await expect(page.getByText('프로필 수정')).toBeVisible()
    await expect(page.getByPlaceholder('닉네임 입력')).toHaveValue('E2EPlayer')

    // Cancel
    await page.getByText('취소').click()
    await expect(page.getByText('프로필 수정')).not.toBeVisible()
  })

  test('체스 카드는 비활성화되어 있다', async ({ page }) => {
    await loginAsTestUser(page)

    await expect(page.getByText('준비 중')).toBeVisible()
    const chessCard = page.getByText('체스').locator('..')
    await expect(chessCard).toBeVisible()
  })
})
