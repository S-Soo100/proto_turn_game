# 아키텍처: 화면 흐름 / 파일 구조 / Realtime

## 화면 흐름
```
/ (홈)
├── 틱택토 / 오목 클릭 → 바텀시트 (게임 타입 저장)
│     ├── AI 대전 → 난이도 선택 → /game/:gameId (AI, game_type_id 포함)
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
│       ├── TicTacToeBoard.tsx       # props: state, result, isAIThinking, isMyTurn, isPvp, onCellClick
│       └── GomokuBoard.tsx          # 15x15 바둑판, 🐻(흑B)/🐰(백W) 이모지 돌, lastMove amber/승리 gold outline 강조
├── hooks/
│   └── useAuth.ts
├── lib/
│   ├── supabase.ts
│   └── game-logic/
│       ├── tictactoe.ts             # 순수 게임 로직 + 미니맥스 AI
│       └── gomoku.ts                # GomokuState/Result + 알파베타 AI (깊이 2/4)
├── pages/
│   ├── LoginPage.tsx
│   ├── SignupPage.tsx
│   ├── HomePage.tsx                 # 게임 카드(틱택토/오목) → 모드/난이도 바텀시트
│   ├── LobbyPage.tsx                # PvP 로비: 대기방 목록(Realtime+폴링) + 새 게임 + 초대링크
│   └── GamePage.tsx                 # game.game_type_id 기준 보드 조건부 렌더링
├── store/
│   ├── authStore.ts
│   └── gameStore.ts                 # GameTypeId 타입, startNewGame/createPvpGame에 gameTypeId 파라미터
└── types/
    └── database.ts

supabase/migrations/
├── 20260218080941_initial_schema.sql   # profiles, handle_new_user 트리거
├── 20260218081913_add_game_types.sql   # game_types, games, moves
└── 20260218090000_pvp_support.sql      # PvP: CONSTRAINT 수정, RLS 추가 (SQL Editor에서 수동 실행)

# gomoku game_types 행은 SQL Editor에서 수동 INSERT (마이그레이션 파일 없음)

.claude/
├── settings.local.json
└── rules/
    ├── stack.md           # 기술 스택 + Supabase 설정
    ├── architecture.md    # 이 파일: 화면 흐름, 파일 구조, Realtime
    ├── progress.md        # 완료 단계 + 다음 단계
    ├── troubleshooting.md # 버그/에러 해결 이력
    ├── update-guide.md    # 문서 최신화 규칙
    └── workflow.md        # 티켓 기반 개발 워크플로우

planning/
├── README.md              # 사용 가이드 + 스코프 코드 테이블
├── templates/             # 문서 템플릿 (epic, ticket, usecase, game-overview)
├── shared/                # 게임 공통 기능 (에픽: E-S001 ELO, E-S002 Realtime)
│   ├── epics/
│   ├── tickets/
│   └── usecases/
├── tictactoe/             # 틱택토 (overview + 에픽/티켓/유즈케이스)
├── gomoku/                # 오목
├── block-puzzle/          # 블록 퍼즐 (에픽: E-BP001 MVP)
│   ├── overview.md
│   ├── research/          # 리서치 문서 (타입 분석, 트렌드)
│   ├── epics/
│   ├── tickets/
│   └── usecases/
└── archive/               # 기존 00~07 기획 문서 보관
```
