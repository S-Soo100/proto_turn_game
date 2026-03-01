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

## 다음 단계 (미구현 → 티켓으로 관리)

기존 백로그는 `planning/` 하위의 에픽/티켓으로 관리된다:

| 에픽 | 내용 | 티켓 |
|---|---|---|
| E-S001 | ELO 레이팅 시스템 | T-S001, T-S002 |
| E-S002 | Supabase Realtime 정식 활성화 | T-S003 |
| E-RSG001 | 반응속도 게임 MVP | T-RSG001~T-RSG008 (완료) |
| — | 프로필 수정 기능 | T-S004 (완료) |
| E-BP001 | 블록 퍼즐 MVP | T-BP001, T-BP002, T-BP003 |

### 아직 에픽/티켓화되지 않은 항목
- 게임 히스토리 페이지
- 방 나가기 시 상대방에게 알림
- 오목 PvP 로비에서 게임 타입 구분 표시
