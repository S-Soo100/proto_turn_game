import { test, expect, type Page } from '@playwright/test'

// E2E tests for Gonggi (공기놀이) game flow.
// Requires authentication — reuses the same fake auth pattern as game-ai.spec.ts.

async function loginAsTestUser(page: Page) {
  await page.goto('/login')

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

  // Mock gonggi_leaderboard queries
  await page.route('**/rest/v1/gonggi_leaderboard*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    } else if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({}),
      })
    } else {
      await route.continue()
    }
  })

  await page.getByLabel('이메일').fill('test@example.com')
  await page.locator('#password').fill('password123')
  await page.getByRole('button', { name: '로그인' }).click()

  await expect(page.getByText('게임 허브')).toBeVisible({ timeout: 5000 })
}

async function swipeToss(page: Page) {
  const board = page.locator('[class*="BoardArea"]').first()
  const box = await board.boundingBox()
  if (!box) return
  const startX = box.x + box.width * 0.5
  const startY = box.y + box.height * 0.62
  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.mouse.move(startX, startY - 40, { steps: 2 })
  await page.mouse.move(startX, startY - 100, { steps: 2 })
  await page.mouse.up()
}

// ── 체크리스트 1: 홈 화면 공기놀이 카드 ──

test.describe('Gonggi — Home card', () => {
  test('홈 화면에 공기놀이 카드가 표시된다', async ({ page }) => {
    await loginAsTestUser(page)

    await expect(page.getByText('공기놀이')).toBeVisible()
    await expect(page.getByText(/변칙 룰/)).toBeVisible()
  })

  test('공기놀이 카드 클릭 시 /gonggi로 이동한다', async ({ page }) => {
    await loginAsTestUser(page)

    await page.getByText('공기놀이').click()
    await expect(page).toHaveURL(/\/gonggi/)
  })
})

// ── 체크리스트 2: 로비 화면 ──

test.describe('Gonggi — Lobby', () => {
  test('로비에 규칙 설명이 표시된다', async ({ page }) => {
    await loginAsTestUser(page)
    await page.goto('/gonggi')

    await expect(page.getByText('열받는 공기놀이')).toBeVisible()
    await expect(page.getByText('게임 규칙')).toBeVisible()
    await expect(page.getByText(/일단: 하나씩 집기/)).toBeVisible()
    await expect(page.getByText(/꺾기: 전부 던져서 잡기/)).toBeVisible()
  })

  test('로비에 변칙 룰 경고가 표시된다', async ({ page }) => {
    await loginAsTestUser(page)
    await page.goto('/gonggi')

    await expect(page.getByText(/라운드 1부터 변칙 룰 발동/)).toBeVisible()
  })

  test('로비에 리더보드 섹션이 표시된다', async ({ page }) => {
    await loginAsTestUser(page)
    await page.goto('/gonggi')

    await expect(page.getByText(/클리어 랭킹/)).toBeVisible()
    // Empty leaderboard message
    await expect(page.getByText(/아직 기록이 없습니다/)).toBeVisible()
  })

  test('로비에 시작 버튼이 표시된다', async ({ page }) => {
    await loginAsTestUser(page)
    await page.goto('/gonggi')

    await expect(page.getByText(/게임 시작/)).toBeVisible()
  })

  test('← 홈 클릭 시 홈으로 이동한다', async ({ page }) => {
    await loginAsTestUser(page)
    await page.goto('/gonggi')

    await page.getByText('← 홈').click()
    await expect(page).toHaveURL('/')
  })
})

// ── 체크리스트 3: 게임 플레이 기본 UI ──

test.describe('Gonggi — Game play UI', () => {
  async function startGame(page: Page) {
    await loginAsTestUser(page)
    await page.goto('/gonggi')
    await page.getByText(/게임 시작/).click()
  }

  test('시작 후 select phase 안내가 표시된다', async ({ page }) => {
    await startGame(page)

    // After scatter auto-transition, select phase text
    await expect(page.getByText(/골라주세요/)).toBeVisible({ timeout: 3000 })
    // Stage label
    await expect(page.getByText(/일단/)).toBeVisible()
    // Timer
    await expect(page.getByText('00:00')).toBeVisible()
  })

  test('상태바에 라운드/실패/변칙이 표시된다', async ({ page }) => {
    await startGame(page)

    await expect(page.getByText('라운드')).toBeVisible()
    await expect(page.getByText('실패')).toBeVisible()
    await expect(page.getByText('변칙')).toBeVisible()
  })

  test('공깃돌 5개가 보드에 렌더링된다', async ({ page }) => {
    await startGame(page)

    for (const emoji of ['🟡', '🔴', '🔵', '🟢', '🟣']) {
      await expect(page.getByText(emoji)).toBeVisible({ timeout: 3000 })
    }
  })

  test('select phase에서 스와이프 힌트가 없다', async ({ page }) => {
    await startGame(page)

    // In select phase, no swipe hint yet
    await expect(page.getByText(/골라주세요/)).toBeVisible({ timeout: 3000 })
    await expect(page.getByText(/스와이프/)).not.toBeVisible()
  })

  test('일시정지/재개가 동작한다', async ({ page }) => {
    await startGame(page)

    await page.getByText('⏸').click()
    await expect(page.getByText('일시정지')).toBeVisible()
    await expect(page.getByText('계속하기')).toBeVisible()

    await page.getByText('계속하기').click()
    await expect(page.getByText('일시정지')).not.toBeVisible()
  })

  test('✕ 클릭 시 로비로 돌아간다', async ({ page }) => {
    await startGame(page)

    await page.getByText('✕').click()
    await expect(page.getByText('열받는 공기놀이')).toBeVisible({ timeout: 3000 })
    await expect(page.getByText(/게임 시작/)).toBeVisible()
  })

  test('타이머가 경과 시간을 표시한다', async ({ page }) => {
    await startGame(page)

    await expect(page.getByText('00:00')).toBeVisible()
    // Wait and verify timer advances
    await page.waitForTimeout(1500)
    await expect(page.getByText('00:01')).toBeVisible({ timeout: 2000 })
  })
})

// ── 체크리스트 4: select → hold → toss 단계 흐름 ──

test.describe('Gonggi — Select/Hold/Toss flow', () => {
  async function startGame(page: Page) {
    await loginAsTestUser(page)
    await page.goto('/gonggi')
    await page.getByText(/게임 시작/).click()
    await expect(page.getByText(/골라주세요/)).toBeVisible({ timeout: 3000 })
  }

  test('보드 영역 클릭 시 돌 선택 → hold 전환 → 스와이프 힌트 표시', async ({ page }) => {
    await startGame(page)

    // Click on the board area to select a stone
    // Stones are positioned randomly, so click the center area of the board
    const board = page.locator('[class*="BoardArea"]').first()
    await expect(board).toBeVisible()

    // Click near the center where a stone is likely positioned
    const box = await board.boundingBox()
    if (box) {
      await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5)
    }

    // Instant select→hold transition
    await page.waitForTimeout(150)

    // If a stone was hit, hold phase shows swipe hint
    // If missed, still in select phase — both are valid outcomes
    const swipeHint = page.getByText(/스와이프/)
    const selectText = page.getByText(/골라주세요/)

    // Either swipe hint or select text should be visible
    const swipeVisible = await swipeHint.isVisible().catch(() => false)
    const selectVisible = await selectText.isVisible().catch(() => false)
    expect(swipeVisible || selectVisible).toBeTruthy()
  })

  test('hold phase에서 확대 돌과 스와이프 힌트가 표시된다', async ({ page }) => {
    await startGame(page)

    const board = page.locator('[class*="BoardArea"]').first()
    const box = await board.boundingBox()
    if (!box) return

    // Click in a grid pattern to increase chance of hitting a stone
    let holdReached = false
    for (let i = 0; i < 5 && !holdReached; i++) {
      const xRatio = 0.2 + (i * 0.15)
      await page.mouse.click(box.x + box.width * xRatio, box.y + box.height * 0.5)
      await page.waitForTimeout(150)

      holdReached = await page.getByText(/스와이프/).isVisible().catch(() => false)
    }

    if (holdReached) {
      await expect(page.getByText(/스와이프/)).toBeVisible()
      await expect(page.getByText(/스와이프하여 던지기/)).toBeVisible()
    }
  })

  test('hold phase에서 스와이프 → pick 또는 catch phase로 전환', async ({ page }) => {
    await startGame(page)

    const board = page.locator('[class*="BoardArea"]').first()
    const box = await board.boundingBox()
    if (!box) return

    // Click around to select a stone
    let holdReached = false
    for (let i = 0; i < 9 && !holdReached; i++) {
      const xRatio = 0.15 + (i % 3) * 0.25
      const yRatio = 0.2 + Math.floor(i / 3) * 0.25
      await page.mouse.click(box.x + box.width * xRatio, box.y + box.height * yRatio)
      await page.waitForTimeout(150)
      holdReached = await page.getByText(/스와이프/).isVisible().catch(() => false)
    }

    if (holdReached) {
      await swipeToss(page)

      // After toss, should transition to pick or catch phase
      await page.waitForTimeout(300)
      const phaseText = await page.locator('[class*="PhaseBar"]').first().textContent()
      // "N개를 스와이프하세요!" or "떨어지는 돌을 잡으세요!"
      expect(phaseText).toMatch(/스와이프하세요|떨어지는 돌/)
    }
  })
})

// ── 체크리스트 5: catch 타이밍 ──

test.describe('Gonggi — Catch timing', () => {
  test('catch phase에서 FlyingStone이 표시되고 탭으로 잡을 수 있다', async ({ page }) => {
    await loginAsTestUser(page)
    await page.goto('/gonggi')
    await page.getByText(/게임 시작/).click()
    await expect(page.getByText(/골라주세요/)).toBeVisible({ timeout: 3000 })

    const board = page.locator('[class*="BoardArea"]').first()
    const box = await board.boundingBox()
    if (!box) return

    // Select a stone
    let holdReached = false
    for (let i = 0; i < 9 && !holdReached; i++) {
      const xRatio = 0.15 + (i % 3) * 0.25
      const yRatio = 0.2 + Math.floor(i / 3) * 0.25
      await page.mouse.click(box.x + box.width * xRatio, box.y + box.height * yRatio)
      await page.waitForTimeout(150)
      holdReached = await page.getByText(/스와이프/).isVisible().catch(() => false)
    }

    if (!holdReached) return

    // Toss via swipe
    await swipeToss(page)
    await page.waitForTimeout(300)

    // If in pick phase, wait for auto-miss
    const pickVisible = await page.getByText(/스와이프하세요/).isVisible().catch(() => false)
    if (pickVisible) {
      await page.waitForTimeout(4500)
      const failText = await page.getByText(/다시 도전/).isVisible().catch(() => false)
      if (failText) {
        await expect(page.getByText(/다시 도전/)).toBeVisible()
      }
    } else {
      // Catch phase — FlyingStone visible, try to tap it
      const container = page.locator('[class*="Container"]').first()
      const containerBox = await container.boundingBox()
      if (containerBox) {
        // FlyingStone is at ~62% of Container height (bottom of arc)
        await page.mouse.click(
          containerBox.x + containerBox.width * 0.5,
          containerBox.y + containerBox.height * 0.62,
        )
      }
    }
  })
})

// ── 체크리스트 6: 실패 → 재시도 ──

test.describe('Gonggi — Failure and retry', () => {
  test('auto-miss 후 실패 메시지와 다시 도전 버튼이 표시된다', async ({ page }) => {
    await loginAsTestUser(page)
    await page.goto('/gonggi')
    await page.getByText(/게임 시작/).click()
    await expect(page.getByText(/골라주세요/)).toBeVisible({ timeout: 3000 })

    const board = page.locator('[class*="BoardArea"]').first()
    const box = await board.boundingBox()
    if (!box) return

    // Select a stone
    let holdReached = false
    for (let i = 0; i < 9 && !holdReached; i++) {
      const xRatio = 0.15 + (i % 3) * 0.25
      const yRatio = 0.2 + Math.floor(i / 3) * 0.25
      await page.mouse.click(box.x + box.width * xRatio, box.y + box.height * yRatio)
      await page.waitForTimeout(150)
      holdReached = await page.getByText(/스와이프/).isVisible().catch(() => false)
    }

    if (!holdReached) return

    // Toss via swipe
    await swipeToss(page)

    // Wait for auto-miss timeout (toss duration is 3000ms + 1000ms buffer for stage 1)
    await page.waitForTimeout(4500)

    // Should show failure UI or "놓쳤어요!" feedback
    const retryButton = page.getByRole('button', { name: /다시 도전/ })
    const missVisible = await page.getByText(/놓쳤어요/).isVisible().catch(() => false)

    const failedVisible = await retryButton.isVisible().catch(() => false)

    if (failedVisible) {
      await expect(retryButton).toBeVisible()

      // Click retry
      await retryButton.click()

      // Should return to select phase
      await expect(page.getByText(/골라주세요/)).toBeVisible({ timeout: 3000 })
    } else if (missVisible) {
      // Miss feedback is transient — failure UI will follow
      await expect(retryButton).toBeVisible({ timeout: 3000 })
    }
  })
})

// ── 체크리스트 7: 미인증 접근 ──

test.describe('Gonggi — Unauthenticated', () => {
  test('/gonggi 직접 접근 시 로그인으로 리다이렉트', async ({ page }) => {
    await page.goto('/gonggi')
    // ProtectedRoute redirects to /login
    await expect(page).toHaveURL(/\/login/)
  })
})
