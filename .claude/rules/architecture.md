# 아키텍처: 화면 흐름 / 파일 구조 / Realtime

## 화면 흐름
```
/ (홈)
├── 프로필 카드 탭 → 프로필 수정 바텀시트 (닉네임 변경)
├── 틱택토 / 오목 클릭 → 바텀시트 (게임 타입 저장)
│     ├── AI 대전 → 난이도 선택 → /game/:gameId (AI, game_type_id 포함)
│     └── 친구와 대전 → /lobby
│                         ├── 새 게임 만들기 → 대기시트 + 초대URL → /game/:gameId (PvP, waiting)
│                         └── 대기 중 게임 클릭 → /game/:gameId?join=1 → joinGame() → active
├── 반응속도 게임 클릭 → /reaction-speed (솔로 게임, 바텀시트 없음)
│     ├── 로비 (Top 10 랭킹 + 시작 버튼)
│     ├── 플레이 (120초 타겟 클릭)
│     └── 결과 (통계 + 저장 + 다시하기)
├── 공기놀이 클릭 → /gonggi (솔로, 변칙 룰 항상 적용)
│     ├── 로비 (규칙 설명 + 클리어 랭킹 + 시작 버튼)
│     ├── 플레이 (일단~꺾기 5단계, CSS 2.5D 렌더링, select→hold→toss→pick→catch, R1+ 변칙 룰, DEV 디버그 패널)
│     └── 결과 (클리어 시간 + 실패/변칙 통계 + 자동 저장)
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
├── App.tsx                          # BrowserRouter + Routes (/, /login, /signup, /lobby, /game/:gameId, /reaction-speed, /gonggi)
├── main.tsx
├── index.css
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx            # 눈 표시 토글
│   │   ├── SignupForm.tsx           # 눈 표시 + 비밀번호 확인 + 에러 한국어화
│   │   └── ProtectedRoute.tsx
│   └── game/
│       ├── TicTacToeBoard.tsx       # props: state, result, isAIThinking, isMyTurn, isPvp, onCellClick
│       ├── GomokuBoard.tsx          # 15x15 바둑판, 🐻(흑B)/🐰(백W) 이모지 돌, lastMove amber/승리 gold outline 강조
│       ├── ReactionSpeedBoard.tsx   # 반응속도 게임 보드: HUD(타이머) + GameArea(타겟) + StatusBar(점수/콤보)
│       ├── TargetCircle.tsx         # osu! 스타일 축소 원 타겟 (CSS @keyframes 애니메이션)
│       ├── GonggiBoard.tsx          # 공기놀이 보드: CSS 2.5D(x,y% + z축), select/hold/toss/catch 단계, 포물선 애니메이션, 이미지 에셋 렌더링, 변칙 이펙트, DEV 디버그 패널
│       ├── GonggiDebugPanel.tsx     # 공기놀이 디버그 패널 (DEV 전용): 변칙 룰 강제 발동, 확률 오버라이드, 상태 모니터
│       ├── GonggiLeaderboard.tsx    # 공기놀이 리더보드 테이블 (시간 ASC 정렬)
│       └── chaos/                   # 공기놀이 변칙 룰 이펙트 컴포넌트 (이미지 에셋 기반)
│           ├── BirdTransformEffect.tsx   # 돌→새 모핑 + 포물선 비행 + 날갯짓 + sparkle 잔상
│           ├── CatSwipeEffect.tsx        # 위→아래 등장 + 좌→우 스와이프 고양이 발, 전 돌 lost
│           ├── StoneEyesEffect.tsx       # 눈알 이미지 돌 도망
│           ├── FakeClearEffect.tsx       # 가짜 클리어 + VHS 되감기
│           ├── SplitEffect.tsx           # 야바위 셸게임 (컵 셔플 + 선택)
│           └── ConstellationEffect.tsx   # 별자리 승천 + 소원 선택지
├── hooks/
│   └── useAuth.ts
├── lib/
│   ├── supabase.ts
│   ├── leaderboard.ts               # 솔로 게임 랭킹: fetchTopScores, fetchMyBest, saveScore
│   ├── gonggi-leaderboard.ts       # 공기놀이 전용 리더보드: fetchGonggiTopScores, fetchGonggiMyBest, saveGonggiScore
│   ├── gonggi-z-axis.ts            # z축 CSS 유틸리티: getStoneStyle(z) → translateY + scale + shadow
│   ├── gonggi-timer.ts             # 공기놀이 타이머 매니저 (setTimeout 래퍼, pause/resume)
│   ├── gonggi-flight.ts            # 공기놀이 포물선 비행 프레임 계산
│   └── game-logic/
│       ├── tictactoe.ts             # 순수 게임 로직 + 미니맥스 AI
│       ├── gomoku.ts                # GomokuState/Result + 알파베타 AI (깊이 2/4)
│       ├── reaction-speed.ts        # 타겟 스케줄 생성 (Normal 55 + Speed 30 + Decoy 15) + 점수/콤보/등급 계산 (seeded RNG)
│       ├── gonggi.ts                # 공기놀이: GonggiState, select/hold/toss/pick/catch 단계, 타이밍 catch, seeded RNG
│       ├── gonggi-chaos.ts          # 변칙 룰 엔진: ChaosRule, 확률 계산, 룰 선택/적용, forceRuleId/overrideChance 디버그 지원
│       └── chaos-rules/             # 7개 변칙 룰 정의
│           ├── bird-transform.ts    # CR-GG001: 돌→새 변신 (minRound 1)
│           ├── cat-swipe.ts         # CR-GG002: 고양이 습격 — all-stones-lost (minRound 1)
│           ├── stone-eyes.ts        # CR-GG003: 돌 도망 (minRound 1, repeatable)
│           ├── fake-clear.ts        # CR-GG004: 가짜 클리어 (minRound 1)
│           ├── split.ts             # CR-GG005: 무한 증식 (minRound 2)
│           ├── constellation.ts     # CR-GG006: 별자리 승천 + 소원 선택 (minRound 1)
│           └── screen-flip.ts       # CR-GG008: 화면 뒤집기 (minRound 2)
├── pages/
│   ├── LoginPage.tsx
│   ├── SignupPage.tsx
│   ├── HomePage.tsx                 # 게임 카드(틱택토/오목/반응속도) → 모드/난이도 바텀시트, SOLO_GAMES 배열, 프로필 수정 바텀시트
│   ├── LobbyPage.tsx                # PvP 로비: 대기방 목록(Realtime+폴링) + 새 게임 + 초대링크
│   ├── GamePage.tsx                 # game.game_type_id 기준 보드 조건부 렌더링
│   ├── ReactionSpeedPage.tsx        # 반응속도 게임 페이지: lobby/playing/result 3단계 흐름
│   └── GonggiPage.tsx               # 공기놀이 페이지: lobby(규칙+랭킹)/playing/result 3단계 흐름
├── store/
│   ├── authStore.ts                 # updateProfile() — 닉네임 수정 (Supabase UPDATE + 로컬 갱신)
│   └── gameStore.ts                 # GameTypeId 타입, startNewGame/createPvpGame에 gameTypeId 파라미터
└── types/
    └── database.ts

supabase/migrations/
├── 20260218080941_initial_schema.sql   # profiles, handle_new_user 트리거
├── 20260218081913_add_game_types.sql   # game_types, games, moves
└── 20260218090000_pvp_support.sql      # PvP: CONSTRAINT 수정, RLS 추가 (SQL Editor에서 수동 실행)

# gomoku, reaction-speed-game, gonggi game_types 행은 SQL Editor에서 수동 INSERT (마이그레이션 파일 없음)
# leaderboard 테이블도 SQL Editor에서 수동 생성 (솔로 게임 랭킹용)
# gonggi_leaderboard 테이블도 SQL Editor에서 수동 생성 (공기놀이 전용 랭킹)

src/test/
└── setup.ts                           # @testing-library/jest-dom import (테스트 셋업)

# 테스트 파일 (*.test.ts, *.test.tsx)은 대상 파일 옆에 co-locate
# src/lib/game-logic/tictactoe.test.ts, gomoku.test.ts, reaction-speed.test.ts
# src/lib/game-logic/gonggi.test.ts, gonggi-chaos.test.ts
# src/components/game/TicTacToeBoard.test.tsx, GomokuBoard.test.tsx, GonggiBoard.test.tsx
# src/components/auth/LoginForm.test.tsx, SignupForm.test.tsx
# src/pages/HomePage.test.tsx

e2e/                                   # Playwright E2E 테스트
├── home.spec.ts                       # 로그인/회원가입/네비게이션 E2E
└── game-ai.spec.ts                    # AI 게임 플로우 E2E (Supabase API 인터셉트)

vercel.json                            # SPA 라우팅: 모든 경로 → /index.html rewrites
playwright.config.ts                   # Playwright 설정 (Chromium, Vite webServer)

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
├── reaction-speed-game/   # 반응속도 게임 (에픽: E-RSG001 MVP)
│   ├── overview.md
│   ├── epics/
│   ├── tickets/           # T-RSG001~T-RSG007
│   └── usecases/
├── block-puzzle/          # 블록 퍼즐 (에픽: E-BP001 MVP)
│   ├── overview.md
│   ├── research/          # 리서치 문서 (타입 분석, 트렌드)
│   ├── epics/
│   ├── tickets/
│   └── usecases/
└── archive/               # 기존 00~07 기획 문서 보관

scripts/                              # 빌드/유틸리티 스크립트
├── generate-asset.ts                 # Gemini API 단일 이미지 생성 CLI
├── generate-batch.ts                 # 프리셋/카테고리별 배치 생성
├── remove-bg.ts                      # sharp 기반 흰색/체커보드 배경 투명화
└── lib/
    ├── gemini-client.ts              # Gemini API 래퍼 (generateImage)
    └── presets.ts                    # 에셋 프리셋 정의 (20개, Magic Orb 컨셉)

public/assets/                        # 게임 이미지 에셋 (Gemini 생성 + 배경 제거)
├── sprites/                          # 돌 5종 (gonggi-stone-{color}.png)
├── backgrounds/                      # 바닥 텍스처, 로비 배경
├── ui/                               # 손 아이콘 3종 (open/catch/toss)
├── effects/                          # 변칙 이펙트 8종 (bird, bird-fly, feather 등)
└── icons/                            # 게임 아이콘, 트로피
```
