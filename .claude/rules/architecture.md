# 아키텍처: 화면 흐름 / 파일 구조 / Realtime

## 화면 흐름
```
/ (홈)
├── 틱택토 클릭 → 바텀시트
│     ├── AI 대전 → 난이도 선택 → /game/:gameId (AI)
│     └── 친구와 대전 → /lobby
│                         ├── 새 게임 만들기 → 대기시트 + 초대URL → /game/:gameId (PvP, waiting)
│                         └── 대기 중 게임 클릭 → /game/:gameId?join=1 → joinGame() → active
/login  /signup
```

## Realtime 구조
```
플레이어 A: makeMove() → games UPDATE (board_state, current_turn)
    → Supabase Realtime → 플레이어 B: subscribeToGame 콜백 → set({ game, boardState })
```
- 로비 목록: `supabase.channel('lobby').on('postgres_changes', { table: 'games' }, fetchRooms)`
- 방장 대기: waiting 게임의 UPDATE 구독 → status=active 되면 navigate

### ⚠️ Supabase Realtime 미작동 시 폴링 폴백 패턴
Supabase postgres_changes Realtime은 테이블에 **Replica Identity** 설정이 필요하며, 미설정 시 이벤트가 발송되지 않는다.
현재 프로젝트는 폴링으로 우회 중:
- **로비 목록**: `setInterval(fetchRooms, 2000)` — 2초 폴링
- **방장 대기 감지**: `setInterval(checkWaiting, 1500)` — 1.5초 폴링
- **게임 상태 동기화**: `subscribeToGame`에서 `setInterval(fetchAndUpdate, 1500)` — 1.5초 폴링

정식 해결 시: SQL Editor에서 `ALTER TABLE games REPLICA IDENTITY FULL;` 실행 + Dashboard Realtime 탭에서 테이블 활성화

## 파일 구조
```
src/
├── App.tsx                          # BrowserRouter + Routes (/, /login, /signup, /lobby, /game/:gameId)
├── main.tsx
├── index.css
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx            # 눈 표시 토글
│   │   ├── SignupForm.tsx           # 눈 표시 + 비밀번호 확인 + 에러 한국어화
│   │   └── ProtectedRoute.tsx
│   └── game/
│       └── TicTacToeBoard.tsx       # props: state, result, isAIThinking, isMyTurn, isPvp, onCellClick
├── hooks/
│   └── useAuth.ts
├── lib/
│   ├── supabase.ts
│   └── game-logic/
│       └── tictactoe.ts             # 순수 게임 로직 + 미니맥스 AI
├── pages/
│   ├── LoginPage.tsx
│   ├── SignupPage.tsx
│   ├── HomePage.tsx                 # 모드 선택(AI/PvP) → 난이도 바텀시트 2단계
│   ├── LobbyPage.tsx                # PvP 로비: 대기방 목록(Realtime+폴링) + 새 게임 + 초대링크
│   └── GamePage.tsx                 # waiting 대기화면 / active 게임화면 / 결과 바텀시트
├── store/
│   ├── authStore.ts
│   └── gameStore.ts                 # startNewGame, createPvpGame, joinGame, makeMove, subscribeToGame, reset
└── types/
    └── database.ts

supabase/migrations/
├── 20260218080941_initial_schema.sql   # profiles, handle_new_user 트리거
├── 20260218081913_add_game_types.sql   # game_types, games, moves
└── 20260218090000_pvp_support.sql      # PvP: CONSTRAINT 수정, RLS 추가 (SQL Editor에서 수동 실행)

.claude/
├── settings.local.json
└── rules/
    ├── stack.md           # 기술 스택 + Supabase 설정
    ├── architecture.md    # 이 파일: 화면 흐름, 파일 구조, Realtime
    ├── progress.md        # 완료 단계 + 다음 단계
    ├── troubleshooting.md # 버그/에러 해결 이력
    └── update-guide.md    # 문서 최신화 규칙
```
