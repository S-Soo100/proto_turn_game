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

## 다음 단계 (미구현)
- 오목 게임 추가
- ELO 레이팅 시스템 실제 반영 (게임 종료 시 점수 계산)
- 게임 히스토리 페이지
- 방 나가기 시 상대방에게 알림
- Supabase Realtime 정식 활성화 (`ALTER TABLE games REPLICA IDENTITY FULL;` + Dashboard Realtime 탭)
