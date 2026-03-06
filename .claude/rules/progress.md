# 완료된 단계 & 다음 단계

## 완료된 단계

### 0단계: 프로젝트 설정 ✅
- Vite + React 19 + TypeScript 초기화
- pnpm, @emotion/styled, zustand, framer-motion, react-router-dom 설치
- `@/` alias 설정 (vite.config.ts + tsconfig)
- `src/lib/supabase.ts` — Supabase 클라이언트 초기화

### 1단계: 인증 ✅
- **DB**: `profiles` 테이블, `handle_new_user` 트리거, RLS 정책, avatars 스토리지 버킷
  - 마이그레이션: `supabase/migrations/20260218080941_initial_schema.sql`
- **Store**: `src/store/authStore.ts` (Zustand)
- **Hook**: `src/hooks/useAuth.ts` (login, signup, logout, fetchProfile)
- **Components**: LoginForm (눈 표시 토글), SignupForm (눈 표시 + 비밀번호 확인 + 에러 한국어화), ProtectedRoute
- **Pages**: LoginPage, SignupPage

### 2단계: 틱택토 AI 게임 ✅
- **DB**: `game_types`, `games`, `moves` 테이블, RLS 정책
  - 마이그레이션: `supabase/migrations/20260218081913_add_game_types.sql`
- **Game Logic**: `src/lib/game-logic/tictactoe.ts`
  - 미니맥스 AI (easy / medium / hard)
  - `createInitialState`, `applyMove`, `checkResult`, `getAIMove`
- **Store**: `src/store/gameStore.ts`
- **Component**: `src/components/game/TicTacToeBoard.tsx` (모바일 우선, Framer Motion)
- **Pages**: HomePage (게임 카드 + 모드/난이도 바텀시트), GamePage (게임 화면 + 결과 바텀시트)

### 3단계: PvP 실시간 대전 ✅
- **DB**: `games` CONSTRAINT 수정 (waiting 상태에서 player_black NULL 허용), RLS 정책 추가
  - 마이그레이션: `supabase/migrations/20260218090000_pvp_support.sql`
  - **⚠️ 이 마이그레이션은 Supabase SQL Editor에서 수동 실행 필요** (CLI IPv6 연결 불가)
- **gameStore 추가 메서드**:
  - `createPvpGame(playerId)` — waiting 상태 게임 생성
  - `joinGame(gameId, playerId)` — player_black 채우고 active로 전환
  - `makeMove(index, myId)` — AI/PvP 분기 처리, PvP는 Realtime으로 상대 동기화
  - `subscribeToGame(gameId)` — Realtime 구독 + 1.5초 폴링 폴백, 반환값은 unsubscribe 함수
- **Pages**:
  - `LobbyPage` (`/lobby`) — 대기 중인 게임 목록 (Realtime + 2초 폴링) + 새 게임 만들기 + 초대 링크 복사
  - `GamePage` — waiting/active 상태 분기, PvP 플레이어 바 (내 차례 강조), 결과 화면

### 4단계: 오목 게임 추가 ✅
- **DB**: `game_types`에 `gomoku` 행 추가
  - **⚠️ Supabase SQL Editor에서 수동 실행 필요**
- **Game Logic**: `src/lib/game-logic/gomoku.ts`
  - `GomokuState` (15x15 flat grid, lastMove), `GomokuResult` (5개 winLine)
  - `checkResult` — 4방향 동적 스캔 (수평/수직/대각선↘↙)
  - `getAIMove` — 난이도별 알파베타 가지치기 AI
    - easy: 기존 돌 주변 2칸 내 랜덤
    - medium: 알파베타 깊이 2 + 30% 랜덤
    - hard: 알파베타 깊이 4
- **Component**: `src/components/game/GomokuBoard.tsx`
  - 바둑판 스타일 15x15, 돌 렌더링 (🐻 곰 = 흑(B), 🐰 토끼 = 백(W))
  - 마지막 수 amber outline 강조 (`lastMove`), 승리 5칸 gold outline 강조
  - 호버 시 🐻 미리보기, 상태바에 이모지 포함
- **Store 확장** (`gameStore.ts`):
  - `GameTypeId = 'tictactoe' | 'gomoku'` 타입 추가
  - `startNewGame(playerId, difficulty, gameTypeId?)`, `createPvpGame(playerId, gameTypeId?)` 파라미터 추가
  - `parseBoardState`, `checkAnyResult` 헬퍼로 게임 타입별 분기
- **GamePage 수정**: `game.game_type_id` 기준 `<GomokuBoard>` vs `<TicTacToeBoard>` 조건부 렌더링
- **HomePage 수정**: 오목 카드 활성화 (`ACTIVE_GAMES` 배열로 분리), 게임별 바텀시트 타이틀 동적 표시
- **PvP 마크 표시**: 오목 PvP에서 플레이어 바에 🐻/🐰 이모지로 마크 표시

### 5단계: 기획 문서 체계화 + 개발 워크플로우 ✅
- **문서 구조 재편**: `planning/` 하위를 게임별 폴더로 분리 (shared, tictactoe, gomoku, block-puzzle)
  - 기존 00~07 문서 → `planning/archive/`로 이동
  - 리서치 문서 → `planning/block-puzzle/research/`로 이동
- **템플릿 4종 생성**: `planning/templates/`
  - `epic-template.md`, `ticket-template.md`, `usecase-template.md`, `game-overview-template.md`
- **게임별 overview 3개**: tictactoe, gomoku (released), block-puzzle (research)
- **티켓 기반 워크플로우**: `.claude/rules/workflow.md`
  - ID 컨벤션 (E-/T-/UC- + 스코프 코드), 상태 워크플로우 (draft→ready→in-progress→review→done)
  - Claude 자동 구현 파이프라인 (티켓 분석→브랜치→구현→빌드→PR→문서 최신화)
  - 커밋 컨벤션: `feat(T-{ID}): {설명}`
- **샘플 에픽/티켓 생성**:
  - `E-S001` ELO 레이팅 (T-S001, T-S002)
  - `E-S002` Realtime 활성화 (T-S003)
  - `E-BP001` 블록 퍼즐 MVP (T-BP001, T-BP002, T-BP003)
- **기존 규칙 업데이트**: CLAUDE.md 인덱스에 workflow.md 추가, update-guide.md에 티켓 규칙 추가

### 6단계: 반응속도 게임 (솔로) ✅
- **DB**: `game_types`에 `reaction-speed-game` 행 추가, `leaderboard` 테이블 생성
  - **⚠️ Supabase SQL Editor에서 수동 실행 완료**
- **Game Logic**: `src/lib/game-logic/reaction-speed.ts`
  - seeded RNG로 100개 타겟 스케줄 생성 (Normal 70 + Speed 30)
  - 시간 비례 점수 계산, 콤보 배율 (x2/x3/x4/x5), 등급 (Perfect/Great/Good/OK)
- **Components**:
  - `TargetCircle.tsx` — osu! 스타일 축소 원 (CSS `@keyframes` 애니메이션)
  - `ReactionSpeedBoard.tsx` — HUD(타이머 CSS 애니메이션) + GameArea + StatusBar
- **Leaderboard**: `src/lib/leaderboard.ts` — fetchTopScores, fetchMyBest, saveScore
- **Page**: `src/pages/ReactionSpeedPage.tsx` — lobby(랭킹)/playing/result 3단계 흐름
- **HomePage 수정**: `SOLO_GAMES` 배열로 반응속도 게임 카드 추가 (바텀시트 없이 직접 이동)
- **라우트**: `/reaction-speed` 추가
- **QA 수정 (T-RSG006)**: 원 크기 축소 (Inner 32px, Outer 64px), CSS 축소 애니메이션 전환, 모바일 세로 레이아웃 최적화
- **QA 수정 (T-RSG007)**: leaderboard `.maybeSingle()` 406 에러 수정, 타이머 바 CSS 애니메이션 전환, max-width 480px 복원
- **기능 추가 (T-RSG008)**: 디코이(아군) 타겟 추가 (초록 💚, -50점 감점, 콤보 리셋), 스피드 이모지 🚨 변경, 일시정지/재개 기능, 점수 미저장 종료
  - 타겟 구성 변경: Normal 55 + Speed 30 + Decoy 15 (총 100개)

### 7단계: 프로필 수정 + Vercel SPA 라우팅 ✅
- **프로필 수정 (T-S004)**:
  - `authStore.ts`에 `updateProfile()` 메서드 추가 (Supabase UPDATE + 로컬 상태 갱신)
  - `HomePage.tsx`에 프로필 수정 바텀시트 추가 (ProfileCard 탭 → 닉네임 수정)
  - 유효성 검증 (3~20자), 중복 닉네임 에러 처리
  - DB 변경 없음 (기존 RLS 활용)
- **Vercel SPA 라우팅 수정**: `vercel.json` 추가 — 직접 URL 접근 시 404 방지 (rewrites → `/index.html`)

### 8단계: 테스트 인프라 도입 (Phase 1~3) ✅
- **Phase 1 — Unit 테스트 (Vitest)**:
  - `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` 설치
  - `vite.config.ts`에 `vitest/config` 설정 (jsdom, globals, setupFiles)
  - `src/test/setup.ts` — 테스트 셋업 파일
  - 틱택토 Unit 테스트 25개 (`tictactoe.test.ts`)
  - 오목 Unit 테스트 23개 (`gomoku.test.ts`)
  - 반응속도 게임 Unit 테스트 40개 (`reaction-speed.test.ts`)
- **Phase 2 — Integration 테스트 (RTL)**:
  - TicTacToeBoard 컴포넌트 테스트 17개 (렌더링, 상태 텍스트, 클릭 인터랙션)
  - GomokuBoard 컴포넌트 테스트 16개
  - LoginForm 테스트 6개 (렌더링, 비밀번호 토글, 로그인 플로우)
  - SignupForm 테스트 9개 (유효성 검증, API 에러 한국어화, 성공 플로우)
  - HomePage 테스트 16개 (게임 선택 플로우, 프로필 수정, 로그아웃)
- **Phase 3 — E2E 테스트 (Playwright)**:
  - `@playwright/test` + Chromium 설치
  - `playwright.config.ts` — Vite dev server 자동 실행
  - 로그인/회원가입 페이지 E2E 6개
  - 네비게이션 E2E 2개 (미인증 리다이렉트, SPA 라우팅)
  - AI 게임 플로우 E2E 4개 (모드/난이도 선택, 프로필 수정, 비활성 게임)
- **총 테스트**: Unit 88개 + Integration 64개 + E2E 12개 = **164개**
- **규칙**: 새 게임 추가 시 반드시 Unit 테스트 + Integration 테스트 함께 작성

### 9단계: 공기놀이 게임 (솔로, 변칙 룰) ✅
- **Game Logic**: `src/lib/game-logic/gonggi.ts`
  - `GonggiState` (5 stones, stage 1~5, substep, phase, round, failCount)
  - 단계별 로직: 일단(1개×4), 이단(2개×2), 삼단(3+1), 사단(4개), 꺾기(전체)
  - 순수 함수: createInitialState, scatterStones, startToss, pickStones, catchStone 등
  - seeded RNG (mulberry32)
- **Chaos Engine**: `src/lib/game-logic/gonggi-chaos.ts`
  - 라운드별 발동 확률: R1: 15%, R2: 25%, R3: 40%, R4: 60%, R5+: 70~90%
  - 7개 변칙 룰: bird-transform, cat-swipe, stone-eyes, fake-clear, split, constellation, screen-flip
  - 각 룰 별도 파일: `src/lib/game-logic/chaos-rules/*.ts`
- **Component**: `src/components/game/GonggiBoard.tsx`
  - CSS 2.5D 렌더링 (x,y% 바닥좌표 + z축 높이 → translateY + scale)
  - select→hold→toss→pick→catch 단계 흐름
  - CSS @keyframes 포물선 toss 애니메이션 (단계별 duration)
  - 타이밍 기반 catch (catchWindow, perfect/early/miss)
  - 변칙 룰 이펙트 오버레이 (AnimatePresence)
  - 일시정지/재개, 화면 뒤집기 CSS
- **z축 유틸**: `src/lib/gonggi-z-axis.ts` — z값(0~1) → CSS transform/filter/shadow
- **Chaos Effects**: `src/components/game/chaos/`
  - BirdTransformEffect, CatSwipeEffect, StoneEyesEffect
  - FakeClearEffect, SplitEffect, ConstellationEffect
- **Page**: `src/pages/GonggiPage.tsx` — lobby/playing/result 3단계 흐름
- **Leaderboard**: `src/lib/gonggi-leaderboard.ts` + `GonggiLeaderboard.tsx`
  - 클리어 시간 ASC 정렬, 실패 횟수, 변칙 생존 횟수 표시
- **라우트**: `/gonggi` 추가, HomePage SOLO_GAMES에 공기놀이 카드 추가
- **DB**: `game_types`에 gonggi 행 INSERT + `gonggi_leaderboard` 테이블 생성 필요 (SQL Editor)
- **테스트**: gonggi.test.ts 58개 + gonggi-chaos.test.ts 36개 + GonggiBoard.test.tsx 11개 = **105개**
- **총 테스트**: 기존 164개 → **258개** (신규 94개)

### 10단계: 공기놀이 UX 대개편 (E-GG002) ✅
- **matter.js 완전 제거** (T-GG009):
  - `src/lib/physics/gonggi-physics.ts` 삭제
  - `matter-js`, `@types/matter-js` 의존성 제거
  - GonggiBoard.tsx에서 물리 엔진 코드 전면 제거
  - CSS 2.5D 렌더링으로 대체: stone.x/y(%) → `left/top` + `getStoneStyle(stone.z)` → translateY/scale
  - StoneEyesEffect.tsx: StonePosition → 인라인 `{id, x, y}` 타입 교체
- **select + hold 단계 추가** (T-GG010):
  - `GamePhase += 'select' | 'hold'`, `GonggiState += selectedStoneId`
  - `selectStone()`: floor 돌 선택 → z=0.15 하이라이트
  - `holdStone()`: 선택 돌 → z=0.3, status='hand', phase='hold'
  - `scatterStones()`: stages 1-4 → 'select', stage 5 → 'toss'
  - `advanceSubstep()`: hand stone 있으면 → 'toss' 직행, 없으면 → 'select'
  - GonggiBoard.tsx: HoldArea UI (🤚+돌), select 탭 인터랙션, "던지기 🫴" 버튼
- **z축 포물선 + 타이밍 catch** (T-GG011):
  - 단계별 포물선 시간: 1단 2400ms ~ 4단 1800ms, 5단 2400ms
  - 단계별 catch 윈도우: 1단 500ms ~ 4단 300ms, 5단 500ms
  - `CatchTiming = 'perfect' | 'early' | 'miss'`
  - CSS `@keyframes toss-arc` 애니메이션 (z=0.3→1.0→0)
  - catch 버튼: 윈도우 활성 시 "✊ 지금!" / 비활성 시 "✊ 잡기"
  - pick 타이머 바 (CSS drain)
- **테스트**: gonggi.test.ts 85개 + GonggiBoard.test.tsx 14개 + GonggiPage.test.tsx 12개
- **총 테스트**: 기존 258개 → **315개** (신규 57개)

### 11단계: 공기놀이 FlyingStone + HandArea + 탭캐치 (T-GG012) ✅
- **FlyingStone 포물선 비행** (CatchButton 제거):
  - `tossArc` keyframe → `flightArc` 교체: Container 기준 top 62%→-4%→62% 비행
  - catch zone 진입 시 초록 글로우 + pointer-events 활성화
  - FlyingStone 직접 탭 = catch (버튼 클릭 → 돌 탭으로 동작 일관성 확보)
- **HandArea 손바닥 컴포넌트**:
  - pick/catch/toss phase에서 수집된 돌을 🤚 + 이모지로 표시
  - `popIn` keyframe: scale(0)→scale(1.3)→scale(1) 등장 애니메이션
  - toss phase에서 toss 후보 돌은 HandArea에서 제외 (HoldStoneOverlay에서 표시)
- **toss phase 막힘 버그 수정**:
  - HoldStoneOverlay 조건: `toss && stage===5` → `toss` (모든 stage)
  - `selectedStoneId` null일 때 첫 번째 hand 돌로 폴백
  - phaseText: "돌을 던지세요!" → "위로 스와이프하여 던지기!" (모든 stage 통일)
- **FlyingStone 이모지 오류 수정**:
  - `selectedStoneId` null 폴백 → air/tossed 돌의 실제 ID 기반 이모지
- **돌 렌더링 분기 개선**:
  - air/tossed 돌: tossAnimating 시 보드 숨김 → FlyingStone이 렌더링
  - hand 돌: pick/catch/toss phase에서 보드 숨김 → HandArea가 렌더링
- **E2E 테스트**: catch 버튼→FlyingStone 탭, phase text assertion 수정
- **총 테스트**: 315 unit/integration + 32 E2E 유지 (전체 통과)

### 12단계: catch 즉시 허용 + 낙하 시각 효과 (T-GG013) ✅
- **catch 즉시 허용**:
  - `catchWindowActive` 상태 완전 제거 (useState, 타이머, 조건 분기 모두 삭제)
  - `handleCatch`: catch phase이기만 하면 언제든 탭 = perfect 성공
  - `startTossAnimation`: catchWindow 타이머 제거, auto-miss 타이머만 유지
  - FlyingStone catch-zone 클래스: catch phase 시작부터 초록 글로우 표시
  - "너무 빨라요!" 메시지 제거 — `CatchTiming` 타입은 순수 로직에서 하위 호환 유지
- **낙하 시각 효과 강화**:
  - `flightArc` keyframe에 `rotate()` + `translateX` 미세 흔들림 추가
  - 상승(0→40%): 반시계 회전 (-15deg → -10deg)
  - 하강(40→100%): 시계↔반시계 교차 회전 (20deg → -10deg → 0deg) + 좌우 흔들림 (±2%)
- **총 테스트**: 315 unit/integration + 32 E2E 유지 (전체 통과)

### 13단계: 공기놀이 라운드 무한 루프 ✅
- **라운드 루프 구현**: 꺾기(5단계) 클리어 → `round-clear` → 일단(1단계)부터 재시작하는 무한 루프
  - `GamePhase`에 `'round-clear'` 추가
  - `checkStageComplete()`: stage 5 완료 시 `'round-clear'` 반환 (기존 `'success'` 대신)
  - `advanceStage()`: `'round-clear'` 처리 — stage=1, round++, isFlipped=false 리셋
  - GonggiBoard.tsx: `🎉 라운드 N 클리어!` phaseText + `라운드 N+1 시작 →` 버튼
- **목적**: 변칙 룰이 R3+부터 발동하도록 설계되어 있으나, 기존에는 R1 한 바퀴만 가능해서 변칙 룰 미발동 → 이제 R3+ 도달 가능
- **게임 종료 제거**: `checkGameComplete()` 미사용 (무한 라운드), `'success'` phase는 타입에만 유지
- **테스트**: gonggi.test.ts 90개 (+5), GonggiBoard.test.tsx 15개 (+1) = **321개** (기존 315개 + 6개)

### 14단계: 공기놀이 난이도 하향 + 변칙 조기 발동 + 조작 간소화 ✅
- **변칙 확률 조기화 (Strategy A)**:
  - `getChaosChance()`: R1: 15%, R2: 25%, R3: 40%, R4: 60%, R5+: 70~90% (기존 R1-2: 0%)
  - 7개 변칙 룰 minRound 하향: 6개 3→1, 2개(split/screen-flip) 4→2
  - 로비 텍스트: "라운드 3부터" → "라운드 1부터"
- **난이도 하향 (Strategy E)**:
  - STAGE_TIME_LIMITS 완화 (8/7/6/5/10 → 12/10/9/8/15초)
  - TOSS_DURATIONS 완화 (2400~1800 → 3000~2200ms)
  - CATCH_WINDOWS 완화 (500~300 → 600~400ms)
  - auto-miss +1000ms 여유
  - `retrySubstep()`: substep 단위 재시도 (기존 retryStage → substep 복원)
  - `substepSnapshot: Stone[] | null` 필드 추가
- **조작 간소화 (Strategy C)**:
  - select→hold 즉시 전환 (기존 300ms 딜레이 제거)
  - "던지기 🫴" 탭 버튼 추가 (스와이프 대안)
- **테스트**: gonggi.test.ts 95개, gonggi-chaos.test.ts 39개 = **333개** (기존 321개 + 12개)

### 15단계: danmaku 제거 + cat-swipe 개편 (T-GG014, T-GG015) ✅
- **danmaku 제거 (T-GG014)**:
  - `chaos-rules/danmaku.ts` 삭제, `chaos/DanmakuOverlay.tsx` 삭제
  - GonggiBoard.tsx에서 danmaku 관련 코드 전면 제거 (state, ref, render, styled)
  - 테스트에서 danmaku import/assertion 제거
- **cat-swipe 개편 (T-GG015)**:
  - CatSwipeEffect.tsx 전면 개편: 위→아래 직사각형 등장 + 좌→우 스와이프 + 퇴장
  - result type: `all-stones-scattered` → `all-stones-lost`
  - 모든 돌 lost 처리 → failSubstep() → 다시 도전 버튼
- **테스트**: 331 unit/integration + 32 E2E (전체 통과)

### 16단계: 공기놀이 디버그 모드 (T-GG016) ✅
- **gonggi-chaos.ts 확장**:
  - `shouldTriggerChaos`에 `overrideChance` 파라미터 추가
  - `checkChaos`에 `forceRuleId` + `overrideChance` 파라미터 추가
- **GonggiDebugPanel.tsx** (DEV 전용 신규 컴포넌트):
  - 7개 변칙 룰 강제 발동 버튼
  - 확률 슬라이더 0~100% (auto/override)
  - 상태 모니터: round/stage/substep/phase/triggeredChaosIds
- **GonggiBoard.tsx 디버그 통합**:
  - `debugForceRule`, `debugChanceOverride` state
  - checkChaos 4곳에 debug 파라미터 전달, 사용 후 자동 초기화
  - chaos 발동 시 `[CHAOS]` 콘솔 로그 (DEV only)
  - `import.meta.env.DEV` 가드 → 프로덕션 빌드에서 완전 tree-shake 확인
- **테스트**: 336 unit/integration + 32 E2E (전체 통과)

### 17단계: 공기놀이 이미지 에셋 시스템 (T-GG026, T-GG027) ✅
- **에셋 생성 파이프라인**: Gemini API 기반 이미지 생성 자동화
  - `scripts/generate-asset.ts` — 단일 에셋 생성 CLI
  - `scripts/generate-batch.ts` — 배치 생성 (프리셋/카테고리)
  - `scripts/lib/presets.ts` — 19+1개 에셋 프리셋 (Magic Orb 컨셉)
  - `scripts/lib/gemini-client.ts` — Gemini API 래퍼
  - `scripts/remove-bg.ts` — sharp 기반 흰색/체커보드 배경 투명화
- **이모지 → 이미지 전면 교체** (T-GG026):
  - 돌 5종: Magic Orb 컨셉 (노랑/별, 빨강/하트, 파랑/눈꽃, 초록/새싹, 보라/달)
  - 손 아이콘 3종: open, catch, toss
  - 변칙 이펙트 7종: bird, feather, cat-paw, eyes, sparkle, confetti, star
  - 배경 2종: 나무 마루 바닥, 한옥방 로비
  - 아이콘 2종: 게임 아이콘, 트로피
  - GonggiBoard: `StoneImg` 컴포넌트 + styled `img` sizing
  - chaos/ 이펙트 5개: 이모지 → `<img>` 교체
  - GonggiPage: 로비 히어로, 결과 이모지 교체
- **배경 에셋 적용 + 새 비행 연출** (T-GG027):
  - 게임 보드 바닥: CSS 그라데이션 → `gonggi-floor.png` 텍스처 (`brightness(0.55)`)
  - 로비 히어로: CSS 단색 → `gonggi-lobby-bg.png` + 반투명 오버레이
  - `BirdTransformEffect` 전면 리팩토링: morph(반짝 파티클) → fly(포물선 + 날갯짓 + sparkle 잔상) → feather → message
  - `chaos-bird-fly.png` 신규 생성 (날개 편 비행 자세 참새)
  - 모든 게임 요소 크기 20%+ 증가 (돌 28→34, fly 36→44, hold 56→68 등)
- **테스트**: 366 unit/integration (전체 통과)

## 다음 단계 (미구현 → 티켓으로 관리)

기존 백로그는 `planning/` 하위의 에픽/티켓으로 관리된다:

| 에픽 | 내용 | 티켓 |
|---|---|---|
| E-S001 | ELO 레이팅 시스템 | T-S001, T-S002 |
| E-S002 | Supabase Realtime 정식 활성화 | T-S003 |
| E-RSG001 | 반응속도 게임 MVP | T-RSG001~T-RSG008 (완료) |
| — | 프로필 수정 기능 | T-S004 (완료) |
| E-GG001 | 공기놀이 MVP (Chaos-only) | T-GG001~T-GG008 (완료) |
| E-GG002 | 공기놀이 UX 대개편 | T-GG009~T-GG012 (완료) |
| — | catch 즉시 허용 + 낙하 시각 효과 | T-GG013 (완료) |
| — | danmaku 제거 | T-GG014 (완료) |
| — | cat-swipe 개편 | T-GG015 (완료) |
| — | 디버그 모드 | T-GG016 (완료) |
| — | 이미지 에셋 생성 + 적용 | T-GG026 (완료) |
| — | 배경 적용 + 새 비행 연출 + 크기 증가 | T-GG027 (완료) |
| E-BP001 | 블록 퍼즐 MVP | T-BP001, T-BP002, T-BP003 |

### 아직 에픽/티켓화되지 않은 항목
- 게임 히스토리 페이지
- 방 나가기 시 상대방에게 알림
- 오목 PvP 로비에서 게임 타입 구분 표시
