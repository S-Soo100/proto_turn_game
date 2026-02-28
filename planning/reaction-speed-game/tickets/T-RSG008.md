# 아군 서클 추가 + 스피드 이모지 변경 + 일시정지 기능

| 항목 | 값 |
|---|---|
| **ID** | T-RSG008 |
| **에픽** | E-RSG001 |
| **게임** | reaction-speed-game |
| **상태** | ready |
| **우선순위** | high |
| **담당** | claude |
| **생성일** | 2026-02-28 |
| **수정일** | 2026-02-28 |
| **브랜치** | feature/T-RSG008-decoy-pause |
| **의존** | T-RSG007 |
| **차단** | — |

---

## 요약

게임 기획 수정(아군 서클 타입 추가, 스피드 서클 이모지 변경)과 UI 편의성 개선(일시정지 기능)을 구현한다.

---

## 이슈 목록

### 1.1. 아군(친구) 서클 추가 — 타입 3: `decoy`

**기획**: 누르면 **안 되는** 타겟 서클. 다른 서클과 동일하게 나타났다가 사라지지만, 클릭하면 감점.

**게임 로직 변경** (`reaction-speed.ts`):
- `TargetType`에 `'decoy'` 추가: `'normal' | 'speed' | 'decoy'`
- 상수 추가:
  - `DECOY_COUNT = 15` (총 100개 중 15개)
  - `NORMAL_COUNT = 55` (70 → 55로 감소)
  - `DECOY_DURATION_MS = 3_000` (normal과 speed 사이)
  - `DECOY_PENALTY = -50` (클릭 시 감점)
- `GameState`에 `decoyClicks: number` 필드 추가 — 감점 클릭 횟수 추적
- `generateSchedule()`: decoy 타겟 15개 추가, 셔플에 포함
- 새 함수 `applyDecoyClick(state)`:
  - `score -= DECOY_PENALTY` (50점 감점, 최소 0점)
  - `combo = 0` (콤보 리셋)
  - `decoyClicks += 1`
- decoy를 클릭하지 않고 사라지면: miss로 **카운트하지 않음** (무시)

**UI 변경** (`TargetCircle.tsx`):
- decoy 서클 색상: **녹색** (`#22c55e`) — normal(파랑), speed(빨강)과 구분
- 내부에 친구/아군을 나타내는 이모지 표시 (예: 하트 `💚` 또는 방패 모양)
- 클릭 시 피드백: 빨간색 `-50` 텍스트 + 흔들림 효과

**결과 화면 변경** (`ReactionSpeedPage.tsx`):
- StatGrid에 `감점 클릭` 항목 추가 (decoyClicks 표시)

---

### 1.2. 스피드 서클 이모지 변경

**현재**: `S` 텍스트
**변경**: 비상벨 이모지 `🚨`

**수정**: `TargetCircle.tsx`의 `SpeedLabel` 내용만 변경
```tsx
// 수정 전
{target.type === 'speed' && <SpeedLabel>S</SpeedLabel>}
// 수정 후
{target.type === 'speed' && <SpeedLabel>🚨</SpeedLabel>}
```

---

### 2.1. 일시정지 버튼

**위치**: HUD 영역 상단, 타이머 텍스트 오른쪽에 일시정지 아이콘 버튼 (`⏸`)

**동작**:
- 클릭 시 게임 일시정지
- 시간 진행 멈춤 (RAF 루프 중단)
- 타겟 출현/소멸 멈춤
- CSS 애니메이션 멈춤 (`animation-play-state: paused`)
  - TimerFill 바
  - TargetCircle의 OuterRing 축소 애니메이션

**구현** (`ReactionSpeedBoard.tsx`):
- `GamePhase`에 `'paused'` 추가: `'ready' | 'playing' | 'paused' | 'finished'`
- 일시정지 시:
  1. `pausedAtRef.current = performance.now()` 저장
  2. RAF 루프 중단 (`cancelAnimationFrame`)
  3. `setPhase('paused')`
- 재개 시:
  1. `startTimeRef.current += (now - pausedAtRef.current)` (정지한 시간만큼 보정)
  2. RAF 루프 재시작
  3. `setPhase('playing')`
- TimerFill에 `animation-play-state` prop 전달: `paused` phase면 `'paused'`
- TargetCircle에 `paused` prop 전달 → OuterRing `animation-play-state` 제어

---

### 2.2. 일시정지 오버레이

**디자인**:
```
┌─────────────────────────┐
│                         │
│   ░░░░░░░░░░░░░░░░░░░░ │  ← 불투명 회색 배경
│   ░░░░░░░░░░░░░░░░░░░░ │
│   ░░┌──────────────┐░░ │
│   ░░│  일시정지      │░░ │  ← 흰색 팝업 카드
│   ░░│              │░░ │
│   ░░│ [계속하기]    │░░ │
│   ░░│ [종료하기]    │░░ │
│   ░░└──────────────┘░░ │
│   ░░░░░░░░░░░░░░░░░░░░ │
│                         │
└─────────────────────────┘
```

- 배경: `rgba(0, 0, 0, 0.6)` 반투명 검정
- 팝업 카드: 흰색, 둥근 모서리
- **계속하기** 버튼: 기본 색상 (파랑), 클릭 시 게임 재개
- **종료하기** 버튼: 위험 색상 (빨강 또는 회색), 클릭 시 메인 복귀

---

### 2.3. 종료하기 동작

- 점수 **저장하지 않음**
- `navigate('/')` 또는 `setPhase('lobby')` — 홈/로비로 복귀
- 게임 상태 초기화

**구현**:
- `ReactionSpeedBoard`에 `onQuit` prop 추가
- `ReactionSpeedPage`에서 `onQuit` 핸들러: `setPhase('lobby')` (저장 없이 로비 복귀)

---

## 수정할 파일 목록

| 파일 | 변경 내용 |
|---|---|
| `src/lib/game-logic/reaction-speed.ts` | 1.1: `decoy` 타입 + 감점 로직 + 스케줄 수정 |
| `src/components/game/TargetCircle.tsx` | 1.1: decoy 서클 UI + 1.2: 스피드 이모지 🚨 + 2.1: paused prop |
| `src/components/game/ReactionSpeedBoard.tsx` | 2.1: 일시정지 버튼 + phase + 2.2: 오버레이 + 2.3: onQuit prop |
| `src/pages/ReactionSpeedPage.tsx` | 1.1: 결과에 decoyClicks 표시 + 2.3: onQuit 핸들러 |

## 수락 기준

- [ ] decoy 서클이 녹색으로 표시되며 클릭 시 -50점 + 콤보 리셋
- [ ] decoy를 클릭하지 않고 사라지면 miss 카운트에 포함되지 않음
- [ ] 스피드 서클에 🚨 이모지 표시
- [ ] 일시정지 버튼(⏸) 클릭 시 시간/타겟/애니메이션 모두 멈춤
- [ ] 일시정지 오버레이에 계속하기/종료하기 버튼 표시
- [ ] 계속하기 클릭 시 정지 시간만큼 보정하여 정확히 이어서 진행
- [ ] 종료하기 클릭 시 점수 미저장 + 로비 복귀
- [ ] 결과 화면에 감점 클릭 횟수 표시
- [ ] `pnpm build` 성공
