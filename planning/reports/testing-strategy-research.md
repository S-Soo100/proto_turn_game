# Use Case 기반 프론트엔드 테스트 전략 리서치 보고서

| 항목 | 값 |
|---|---|
| **작성일** | 2026-03-01 |
| **대상 스택** | React 19 + TypeScript 5.9 + Vite 7 + @emotion/styled + Zustand 5 + Framer Motion |
| **목적** | 프로젝트에 적합한 테스트 전략 및 도구 조합 선정 |

---

## 1. Use Case 기반 테스트 전략

### 1.1 방법론 개요

Use Case에서 테스트를 도출하는 세 가지 주요 접근법이 있다.

#### BDD (Behavior-Driven Development)
- **핵심**: "Three Amigos" (PO, 개발자, QA)가 Gherkin 문법(Given/When/Then)으로 시나리오 정의
- **장점**: 비기술 이해관계자와 공유 가능한 테스트 명세, 살아있는 문서 역할
- **단점**: Gherkin step 정의 유지보수 비용, 프론트엔드에서는 overhead가 큰 편

#### ATDD (Acceptance Test-Driven Development)
- **핵심**: 수락 기준(Acceptance Criteria)을 먼저 테스트로 작성하고, 코드로 충족시킴
- **장점**: 엣지 케이스를 개발 초기에 발견, 구현과 테스트의 정합성 높음
- **단점**: 수락 기준이 불명확하면 테스트도 불명확

#### Use Case Driven Test Generation
- **핵심**: Use Case 문서의 기본/대안/예외 시나리오를 체계적으로 테스트 케이스로 매핑
- **학술 근거**: UMTG(Use case Modeling for Test Generation) 연구에서 Use Case 명세로부터 95%의 스텝을 자동 변환 성공

### 1.2 Gherkin/Cucumber의 프론트엔드 실제 사용 현황

**결론: 프론트엔드 전용으로는 잘 쓰이지 않는다.**

- Cucumber는 주로 E2E 레벨에서 Cypress나 Playwright와 결합하여 사용
  - `cypress-cucumber-preprocessor`로 Cypress + Gherkin 조합 가능
  - `jest-cucumber`로 Jest 위에서 Gherkin 시나리오 실행 가능
- 실제 프론트엔드 팀들은 Gherkin 대신 **Storybook play function** 또는 **Testing Library의 user-centric 테스트**로 BDD 정신을 구현하는 추세
- Gherkin의 장점(비기술자 가독성)이 1~2인 개발팀에서는 overhead만 증가

### 1.3 Use Case 문서에서 테스트 자동 생성 접근법

현재 프로젝트의 Use Case 템플릿 구조:
```
사전 조건 → 기본 시나리오 → 대안 시나리오 → 예외 시나리오 → 검증 방법
```

이 구조에서 테스트를 도출하는 실용적 매핑:

| Use Case 섹션 | 테스트 레벨 | 도구 |
|---|---|---|
| 기본 시나리오 (Happy Path) | E2E 테스트 | Playwright |
| 대안 시나리오 (A1, A2...) | Integration 테스트 | Vitest + RTL 또는 Storybook play |
| 예외 시나리오 (E1, E2...) | Unit / Integration | Vitest |
| 검증 방법 체크리스트 | 수동 → 자동화 후보 | 전부 |

**AI 기반 자동 생성 실용 방법:**
- Claude/Copilot에게 Use Case 마크다운을 입력하면 Vitest/Playwright 테스트 코드 스캐폴딩 생성 가능
- 40% 이상의 QA 팀이 이미 AI 기반 테스트 생성 도입, 최대 85% 정확도
- GitHub Agent HQ (2026.02)에서 Claude/Codex/Copilot 동시 실행으로 테스트 생성 자동화

---

## 2. 프론트엔드 테스트 도구 비교 (2025-2026)

### 2.1 컴포넌트 단위 테스트

#### Vitest + React Testing Library (RTL)

| 항목 | 평가 |
|---|---|
| **React 19 호환** | 완전 호환. RTL이 React 19 공식 지원 |
| **Vite 7 호환** | 네이티브. Vite config를 그대로 재사용 |
| **TypeScript** | ESBuild 기반 네이티브 지원, 별도 설정 불필요 |
| **Emotion 호환** | 문제 없음. JSDOM/Browser Mode 모두 지원 |
| **Zustand 호환** | 공식 테스트 가이드 제공 (vi.mock + __mocks__ 패턴) |
| **설정 난이도** | 매우 낮음 (vite.config.ts 재사용) |
| **실행 속도** | Jest 대비 2~5배 빠름 |
| **Browser Mode** | Vitest 4 (2025.11)에서 stable. 실제 브라우저 환경 테스트 가능 |

**장점:**
- Vite 프로젝트에서 설정 zero에 가까움
- Jest와 거의 동일한 API (마이그레이션 쉬움)
- HMR 지원으로 watch 모드 매우 빠름
- Browser Mode로 JSDOM 한계 극복 가능

**단점:**
- Browser Mode는 아직 생태계 초기 (RTL 호환 레이어 필요)
- Storybook 연동은 별도 설정 필요

#### Storybook + Play Functions / Interaction Testing

| 항목 | 평가 |
|---|---|
| **React 19 호환** | Storybook 9+에서 공식 지원 |
| **Vite 7 호환** | Storybook 10은 Vite 지원하나, Vite 7은 알려진 호환 이슈 존재 (의존성 해소 필요) |
| **Emotion 호환** | 공식 레시피 제공 (@storybook/addon-themes + withThemeFromJSXProvider) |
| **설정 난이도** | 중간 (초기 설정 + 데코레이터 + addon 구성) |
| **시각적 개발** | 컴포넌트를 브라우저에서 직접 확인하며 테스트 |

**장점:**
- 개발 + 테스트 + 문서화를 한 곳에서
- play function으로 사용자 인터랙션 시뮬레이션
- @storybook/test 패키지가 Testing Library + Vitest API 기반
- Vitest addon으로 CI에서 story를 Vitest 테스트로 자동 변환
- 비주얼 리그레션 테스트 (Chromatic)와 자연스러운 연동

**단점:**
- 초기 도입 비용 높음 (설정, story 작성)
- Vite 7 호환성 아직 불안정할 수 있음
- 복잡한 비동기 로직 테스트에는 한계
- Supabase 같은 외부 의존성 모킹이 까다로움

#### Vitest vs Storybook 비교 요약

| 기준 | Vitest + RTL | Storybook + Play |
|---|---|---|
| **실행 환경** | CLI/CI (headless) | 브라우저 UI + CLI |
| **피드백 속도** | 매우 빠름 | 중간 (브라우저 렌더링) |
| **시각적 확인** | 불가 | 가능 (핵심 장점) |
| **테스트 작성 비용** | 낮음 | 중간 (story + play) |
| **CI 통합** | 네이티브 | Vitest addon 통해 가능 |
| **Emotion/Zustand** | 자연스러움 | 데코레이터 설정 필요 |
| **추천 용도** | 로직 중심 컴포넌트, 훅, 스토어 | UI 중심 컴포넌트, 인터랙션 |

**결론: 둘은 대체 관계가 아니라 보완 관계.** Vitest는 로직/훅/스토어, Storybook은 UI 컴포넌트 인터랙션.

### 2.2 E2E 테스트

#### Playwright vs Cypress 비교

| 기준 | Playwright | Cypress |
|---|---|---|
| **브라우저 지원** | Chromium, Firefox, WebKit (Safari) | Chrome 계열, Firefox (제한적) |
| **속도** | 23% 더 빠름 (2026 벤치마크) | 시작 지연 5~7초 |
| **병렬 실행** | 내장 (무료) | 유료 Dashboard 필요 |
| **언어** | JS/TS, Python, C#, Java | JS/TS만 |
| **디버깅** | Trace Viewer, 나쁘지 않음 | Time-travel debugger (최고) |
| **컴포넌트 테스트** | 실험적 (experimental) | 지원하나 축소 추세 |
| **네트워크 모킹** | 강력 (route 기반) | 강력 (intercept 기반) |
| **멀티탭/멀티브라우저** | 지원 | 미지원 |
| **CI 비용** | 낮음 (병렬 무료) | 높음 (병렬 유료) |
| **모바일 에뮬레이션** | 내장 (viewport, touch) | 제한적 |

**Use Case 기반 테스트 적합성:**
- **Playwright 우세**: Use Case의 기본/대안/예외 시나리오를 `test.describe` 블록으로 구조화하기 좋음
- Playwright의 `test.step`으로 Use Case 단계별 매핑 가능
- WebKit 지원으로 모바일 Safari 테스트 (이 프로젝트의 모바일 우선 설계와 맞음)

**이 프로젝트 추천: Playwright**
- PvP 멀티탭 시나리오 테스트 가능 (두 브라우저 컨텍스트)
- 모바일 우선이므로 WebKit/모바일 에뮬레이션 중요
- 무료 병렬 실행으로 CI 비용 절약

### 2.3 비주얼 리그레션 테스트

| 기준 | Chromatic | Percy | Lost Pixel |
|---|---|---|---|
| **연동** | Storybook 전용 | 프레임워크 무관 | Storybook + Playwright + 페이지 |
| **가격** | Free tier 5,000 snapshots/month | 유료 (비쌈) | 오픈소스 코어 무료 + Platform 유료 |
| **강점** | Storybook 생태계 최적화, UI 리뷰 | CI 파이프라인 통합, 크로스브라우저 | 유연성, 비용 효율 |
| **약점** | Storybook 의존 | 비용 | 생태계 초기 |
| **이 프로젝트 추천도** | Storybook 도입 시 최적 | 과도한 비용 | 비용 민감 시 최적 |

**이 프로젝트 추천: Lost Pixel (초기) → Chromatic (Storybook 성숙 후)**
- 1~2인 프로젝트에서 Percy 비용은 비합리적
- Lost Pixel 오픈소스로 무료 시작 가능
- Storybook이 안정적으로 자리잡으면 Chromatic으로 전환 고려

---

## 3. Storybook 깊이 탐색

### 3.1 버전 현황 및 최신 기능

| 버전 | 출시 | 핵심 변경 |
|---|---|---|
| **8.5** | 2025.01 | A11y addon 업그레이드, 코드 커버리지, 포커스 테스트 |
| **9.0** | 2025.07 | 50% 설치 크기 감소, Testing Widget, Vitest 파트너십, Vite 기반 Next.js |
| **10.0** | 2026 | ESM-only (추가 29% 감소), CSF Factories (Preview), 개선된 Module Mocking (sb.mock), RSC 실험적 지원, Vitest 4 + Next 16 지원 |

현재 최신: **Storybook 10.1.x**

### 3.2 Interaction Testing & Play Functions

```typescript
// CSF3 형태의 story + play function 예시
import type { Meta, StoryObj } from '@storybook/react'
import { expect, fn, userEvent, within } from '@storybook/test'
import { GomokuBoard } from './GomokuBoard'

const meta: Meta<typeof GomokuBoard> = {
  component: GomokuBoard,
  title: 'Game/GomokuBoard',
}
export default meta
type Story = StoryObj<typeof GomokuBoard>

// Use Case: UC-GM001 기본 시나리오 - 돌 놓기
export const PlaceStone: Story = {
  args: {
    state: createInitialState(),
    isMyTurn: true,
    onCellClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    // Given: 빈 바둑판이 보임
    // When: 교차점 (7,7)을 클릭
    const cell = canvas.getByTestId('cell-7-7')
    await userEvent.click(cell)
    // Then: onCellClick이 올바른 인덱스로 호출됨
    await expect(args.onCellClick).toHaveBeenCalledWith(7 * 15 + 7)
  },
}
```

**@storybook/test 패키지:**
- 기존 `@storybook/jest` + `@storybook/testing-library`를 통합
- Vitest 기반 API (expect, fn, vi.mock 등)
- 번들 크기 감소 + 통일된 API
- Interactions 패널에서 단계별 디버깅 가능

### 3.3 @emotion/styled 호환성

Storybook은 Emotion 공식 레시피를 제공:

```typescript
// .storybook/preview.tsx
import { withThemeFromJSXProvider } from '@storybook/addon-themes'
import { ThemeProvider } from '@emotion/react'
import { myTheme } from '../src/theme'

export const decorators = [
  withThemeFromJSXProvider({
    themes: { default: myTheme },
    defaultTheme: 'default',
    Provider: ThemeProvider,
  }),
]
```

**주의사항:**
- Vite + Emotion Babel Plugin 사용 시 Storybook의 Vite builder가 동일 설정을 공유하도록 확인 필요
- SWC plugin으로 전환한 경우 Babel plugin과 동작 차이 가능성 있음
- 현재 프로젝트는 `@emotion/babel-plugin`을 사용 중이므로 Storybook Vite builder와 호환 가능

### 3.4 Vite Builder

- Storybook 9+부터 Vite가 기본 빌더 (Webpack 대신)
- `@storybook/react-vite` 프레임워크 패키지 사용
- 프로젝트의 `vite.config.ts`를 자동으로 감지하여 재사용
- **Vite 7 주의**: Storybook 10의 의존성이 `^6.2.5`로 설정되어 있어 Vite 7과 설치 충돌 가능. `--legacy-peer-deps` 또는 pnpm의 `overrides`로 해결 필요

### 3.5 CSF3로 Use Case를 Story로 표현

프로젝트의 Use Case 구조를 CSF3 story로 매핑하는 패턴:

```typescript
// UC-RSG001: 게임 플레이 기본 플로우
export default {
  title: 'UseCase/RSG001-GamePlayFlow',
  component: GameBoard,
} satisfies Meta<typeof GameBoard>

// 기본 시나리오: Happy Path
export const HappyPath: Story = {
  name: '기본: 시작 → 타겟 클릭 → 점수 증가',
  args: { /* 사전 조건에 해당하는 props */ },
  play: async ({ canvasElement }) => {
    // 기본 시나리오 1~9 단계를 순차 실행
  },
}

// 대안 시나리오 A1: 미스
export const AlternativeA1_Miss: Story = {
  name: '대안 A1: 타겟 미스 → 콤보 초기화',
  play: async ({ canvasElement }) => { /* ... */ },
}

// 예외 시나리오 E1
export const ExceptionE1_OutsideClick: Story = {
  name: '예외 E1: 영역 외부 클릭 → 무반응',
  play: async ({ canvasElement }) => { /* ... */ },
}
```

### 3.6 Storybook Test Runner & Vitest Addon

**기존 Test Runner (Jest + Playwright 기반) --> Vitest Addon으로 전환됨**

Storybook 9+에서 Vitest addon이 test-runner를 대체:
- Story 파일을 자동으로 Vitest 테스트로 변환
- CLI/CI에서 Storybook 없이도 실행 가능
- 코드 커버리지 지원 (`--coverage` 플래그)
- Storybook UI 내 Testing Widget에서 결과 확인

```bash
# CI에서 실행
vitest --project storybook
```

### 3.7 Portable Stories로 Vitest에서 Story 재사용

```typescript
// src/components/game/__tests__/GomokuBoard.test.tsx
import { composeStories } from '@storybook/react'
import { render, screen } from '@testing-library/react'
import * as stories from '../GomokuBoard.stories'

const { PlaceStone, WinningState } = composeStories(stories)

test('돌 놓기 인터랙션', async () => {
  const { container } = render(<PlaceStone />)
  await PlaceStone.play({ canvasElement: container })
  // 추가 assertion...
})
```

**Vitest addon 권장:** Portable Stories API를 직접 쓰기보다 Vitest addon이 이 과정을 자동화.

---

## 4. 실제 팀들의 워크플로우 사례

### 4.1 Testing Trophy vs Testing Diamond

#### Testing Trophy (Kent C. Dodds)
```
         E2E        (소량, 핵심 플로우만)
      Integration   (가장 많이, 핵심)
     Unit Tests     (순수 로직만)
   Static Analysis  (TypeScript, ESLint)
```
- **철학**: Integration 테스트가 가장 높은 ROI
- **Frontend에 적합**: 컴포넌트 = UI + 상태 + 이벤트의 통합체
- React Testing Library가 이 철학을 체현

#### Testing Diamond
```
        E2E          (핵심 케이스)
     Integration     (가장 많이)
     Integration     (가장 많이)
      Unit Tests     (최소)
```
- Testing Trophy와 유사하나 Unit을 더 줄이고 Integration에 집중
- 단위 테스트는 순수 함수(게임 로직 등)에만 한정

#### 이 프로젝트에 적합한 전략: **Modified Testing Trophy**

```
Layer             | 비율  | 대상                        | 도구
E2E               | 10%  | PvP 게임 플로우, 인증 플로우     | Playwright
Integration       | 50%  | 컴포넌트 + 상태 + 이벤트        | Vitest + RTL (+ Storybook play)
Unit              | 30%  | 게임 로직 (tictactoe.ts, gomoku.ts) | Vitest
Static Analysis   | 10%  | 타입 체크 + 린팅              | TypeScript + ESLint (이미 있음)
```

**근거:**
- `gomoku.ts`, `tictactoe.ts`의 순수 게임 로직은 Unit 테스트 ROI가 매우 높음
- 보드 컴포넌트의 사용자 인터랙션은 Integration 레벨
- PvP 실시간 동기화 + 인증은 E2E

### 4.2 테스트 레벨별 작성 비율 (업계 평균)

| 레벨 | 테스트 수 | 실행 시간 | 유지보수 비용 |
|---|---|---|---|
| Unit | 수십~수백 | 밀리초 | 낮음 |
| Integration | 수십 | 초 | 중간 |
| E2E | 5~15 | 수십 초 | 높음 |

### 4.3 Ticket/Use Case --> Test --> Code 자동화 흐름

현재 프로젝트의 워크플로우에 통합 가능한 흐름:

```
1. Use Case 작성 (planning/{game}/usecases/UC-XXX.md)
   ↓
2. 티켓 생성 (planning/{game}/tickets/T-XXX.md)
   ↓ Claude가 티켓 읽기
3. 테스트 스캐폴딩 자동 생성
   - Use Case 기본 시나리오 → E2E test skeleton (Playwright)
   - Use Case 대안/예외 → Integration test skeleton (Vitest + RTL)
   - 게임 로직 관련 → Unit test skeleton (Vitest)
   ↓
4. 코드 구현 (테스트 통과시키기)
   ↓
5. 빌드 검증 (pnpm build + pnpm test)
   ↓
6. 커밋 + PR
```

**Claude 기반 자동화 구체 예시:**

사용자가 "T-GM003 구현해줘"를 요청하면:
1. Claude가 티켓 + 상위 Use Case 읽기
2. Use Case의 각 시나리오에서 테스트 파일 생성
3. 테스트 실패 확인 (Red)
4. 구현 (Green)
5. 리팩토링
6. 전체 테스트 통과 확인

### 4.4 AI 기반 테스트 자동 생성 사례

- **GitHub Copilot**: describe 블록과 명확한 테스트명을 포함한 완성된 테스트 파일을 한 번에 생성. 비즈니스 규칙 기반 assertion 정확도 높음
- **Claude Code**: Use Case 마크다운을 컨텍스트로 주면 해당 시나리오를 Vitest/Playwright 테스트로 변환 가능
- **GitHub Agent HQ (2026.02)**: Claude, Codex, Copilot을 동시 실행하여 코드 리뷰, 테스트 생성, 보안 스캔을 병렬 수행

---

## 5. 이 프로젝트에 적합한 추천 조합

### 5.1 최종 추천 도구 조합

| 레벨 | 도구 | 이유 |
|---|---|---|
| **Static** | TypeScript + ESLint | 이미 설정됨 |
| **Unit** | **Vitest** | Vite 7 네이티브, 설정 zero, 게임 로직 테스트에 최적 |
| **Integration** | **Vitest + React Testing Library** | RTL의 user-centric 철학, Zustand 공식 가이드 지원 |
| **Component Visual** | **Storybook 10 + play functions** | UI 컴포넌트 개발 + 인터랙션 테스트 + 문서화 |
| **E2E** | **Playwright** | 멀티탭 PvP, WebKit/모바일, 무료 병렬, Use Case 매핑 용이 |
| **Visual Regression** | **Lost Pixel** (Phase 2+) | 오픈소스 무료, Storybook + Playwright 연동 |

### 5.2 도입 난이도와 ROI 분석

| 도구 | 도입 난이도 | ROI | 우선순위 |
|---|---|---|---|
| Vitest (Unit) | 매우 낮음 (30분) | 높음 | 1순위 |
| Vitest + RTL (Integration) | 낮음 (1시간) | 매우 높음 | 1순위 |
| Playwright (E2E) | 중간 (2~3시간) | 높음 (PvP 버그 방지) | 2순위 |
| Storybook (Component) | 높음 (반나절~1일) | 중간 (UI 개발 품질) | 3순위 |
| Lost Pixel (Visual) | 중간 (2시간) | 중간 | 4순위 |

### 5.3 단계별 도입 계획

#### Phase 1: 기초 테스트 인프라 (1일)

**목표: Vitest + RTL 설정 + 핵심 게임 로직 테스트**

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

설정 파일:
```typescript
// vitest.config.ts (또는 vite.config.ts에 test 블록 추가)
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react({ babel: { plugins: ['@emotion/babel-plugin'] } })],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

즉시 작성할 테스트:
- `src/lib/game-logic/__tests__/tictactoe.test.ts` - 미니맥스 AI, 승리 판정
- `src/lib/game-logic/__tests__/gomoku.test.ts` - 알파베타 AI, 5목 판정, 4방향 스캔
- `src/store/__tests__/gameStore.test.ts` - Zustand 스토어 상태 전이

**ROI가 가장 높은 이유:**
- `gomoku.ts`의 checkResult, getAIMove는 순수 함수 → 테스트 작성이 쉽고 버그 방지 효과 큼
- 과거 troubleshooting에 기록된 TS6133 미사용 변수 같은 문제를 사전 방지

#### Phase 2: E2E 핵심 플로우 (2~3일)

**목표: Playwright로 핵심 Use Case의 Happy Path 자동화**

```bash
pnpm add -D @playwright/test
npx playwright install
```

우선 작성할 E2E 테스트:
1. **인증 플로우**: 회원가입 → 로그인 → 홈 진입
2. **AI 대전 플로우**: 게임 선택 → 난이도 선택 → 게임 플레이 → 결과 확인
3. **PvP 플로우**: 로비 → 방 만들기 → (다른 브라우저) 참여 → 대전 → 결과

```typescript
// e2e/pvp-gomoku.spec.ts
import { test, expect } from '@playwright/test'

test.describe('UC-GM: 오목 PvP 대전', () => {
  test('기본 시나리오: 두 플레이어가 번갈아 돌을 놓음', async ({ browser }) => {
    const playerA = await browser.newContext()
    const playerB = await browser.newContext()
    const pageA = await playerA.newPage()
    const pageB = await playerB.newPage()
    // ... PvP 시나리오
  })
})
```

#### Phase 3: Storybook 도입 (3~5일)

**목표: UI 컴포넌트 카탈로그 + 인터랙션 테스트**

```bash
pnpm dlx storybook@latest init --type react
# Vite 7 호환 이슈 발생 시:
# pnpm add -D storybook@latest --legacy-peer-deps
```

우선 작성할 Story:
1. `GomokuBoard.stories.tsx` - 다양한 보드 상태 (빈 보드, 중간 게임, 승리 상태)
2. `TicTacToeBoard.stories.tsx` - 3x3 보드 상태별
3. `HomePage.stories.tsx` - 게임 카드 + 바텀시트 인터랙션

Emotion 데코레이터 설정 + Vitest addon 연동.

#### Phase 4: 비주얼 리그레션 (선택)

**목표: UI 변경 시 의도치 않은 시각적 깨짐 방지**

Lost Pixel 오픈소스로 시작:
```bash
pnpm add -D lost-pixel
```

CI (GitHub Actions)에서 자동 실행하여 스냅샷 비교.

### 5.4 프로젝트 특성별 Zustand 테스트 전략

```typescript
// src/test/setup.ts
import { afterEach } from 'vitest'

// Zustand 스토어 자동 리셋
afterEach(() => {
  // 각 테스트 후 스토어 초기 상태로 복원
})
```

```typescript
// __mocks__/zustand.ts (Vitest용)
import * as zustand from 'zustand'
const { create: actualCreate, createStore: actualCreateStore } =
  await vi.importActual<typeof zustand>('zustand')

// 각 테스트 후 스토어를 초기 상태로 리셋하는 래퍼
export const storeResetFns = new Set<() => void>()

const createUncurried = <T>(stateCreator: zustand.StateCreator<T>) => {
  const store = actualCreate(stateCreator)
  const initialState = store.getInitialState()
  storeResetFns.add(() => store.setState(initialState, true))
  return store
}

export const create = (<T>(stateCreator: zustand.StateCreator<T>) => {
  return typeof stateCreator === 'function'
    ? createUncurried(stateCreator)
    : createUncurried
}) as typeof zustand.create
```

### 5.5 package.json 스크립트 추가 예시

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

---

## 부록: 핵심 참고 자료

### Use Case & BDD
- [BDD Testing Tools 2026 - ACCELQ](https://www.accelq.com/blog/bdd-testing-tools/)
- [ATDD for Frontend - Applitools](https://applitools.com/blog/acceptance-test-driven-development-for-front-end/)
- [TDD vs BDD vs ATDD - BrowserStack](https://www.browserstack.com/guide/tdd-vs-bdd-vs-atdd)
- [Automatic Test Generation from Use Case - IEEE](https://ieeexplore.ieee.org/document/1610607/)
- [NLP-based Acceptance Test from Use Case - arXiv](https://arxiv.org/abs/1907.08490)

### Vitest & React Testing Library
- [Vitest + RTL Guide - Makers Den](https://makersden.io/blog/guide-to-react-testing-library-vitest)
- [Vitest Browser Mode](https://vitest.dev/guide/browser/)
- [Vitest Component Testing](https://vitest.dev/guide/browser/component-testing)
- [Unit Test React with Vitest (2026)](https://oneuptime.com/blog/post/2026-01-15-unit-test-react-vitest-testing-library/view)
- [Zustand Testing Guide](https://zustand.docs.pmnd.rs/guides/testing)

### Storybook
- [Storybook Interaction Testing Docs](https://storybook.js.org/docs/writing-tests/interaction-testing)
- [Storybook Play Function Docs](https://storybook.js.org/docs/writing-stories/play-function)
- [Storybook Vitest Addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon/index)
- [Portable Stories in Vitest](https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest)
- [Storybook Emotion Recipe](https://storybook.js.org/recipes/@emotion/styled)
- [Storybook 10 Blog](https://storybook.js.org/blog/storybook-10/)
- [CSF3 Announcement](https://storybook.js.org/blog/storybook-csf3-is-here/)
- [Storybook + Vitest Component Test](https://storybook.js.org/blog/component-test-with-storybook-and-vitest/)
- [Vite 7 Compatibility Issue](https://github.com/storybookjs/storybook/issues/31858)

### E2E Testing
- [Playwright vs Cypress 2025 - Katalon](https://katalon.com/resources-center/blog/playwright-vs-cypress)
- [Playwright vs Cypress 500 Tests - Medium](https://medium.com/lets-code-future/cypress-vs-playwright-i-ran-500-e2e-tests-in-both-heres-what-broke-2afc448470ee)
- [Performance Benchmarks 2026 - TestDino](https://testdino.com/blog/performance-benchmarks/)
- [Playwright vs Cypress Enterprise 2026](https://devin-rosario.medium.com/playwright-vs-cypress-the-2026-enterprise-testing-guide-ade8b56d3478)
- [Cypress vs Playwright 2026 - BugBug](https://bugbug.io/blog/test-automation-tools/cypress-vs-playwright/)
- [Playwright Component Testing - BrowserStack](https://www.browserstack.com/guide/component-testing-react-playwright)

### Visual Regression
- [Visual Regression Tools Guide - Lost Pixel](https://www.lost-pixel.com/blog/ultimate-visual-regression-testing-tools-guide)
- [Percy vs Chromatic - Medium](https://medium.com/@crissyjoshua/percy-vs-chromatic-which-visual-regression-testing-tool-to-use-6cdce77238dc)
- [Chromatic vs Lost Pixel](https://www.lost-pixel.com/chromatic-vs-lost-pixel)
- [Lost Pixel GitHub](https://github.com/lost-pixel/lost-pixel)

### Testing Strategy
- [Testing Trophy - Kent C. Dodds](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- [Testing Strategy Shapes - web.dev](https://web.dev/articles/ta-strategies)
- [Test Pyramid 2025 - Qalified](https://qalified.com/blog/test-pyramid-for-engineering-teams/)
- [Frontend Testing Guide 2025 - Netguru](https://www.netguru.com/blog/front-end-testing)

### AI Test Generation
- [AI Test Generation Tools 2025 - DEV](https://dev.to/morrismoses149/best-ai-test-case-generation-tools-2025-guide-35b9)
- [Best AI Coding Agents 2026 - Faros AI](https://www.faros.ai/blog/best-ai-coding-agents-2026)
- [Generative AI Testing Tools 2026 - Virtuoso](https://www.virtuosoqa.com/post/best-generative-ai-testing-tools)
