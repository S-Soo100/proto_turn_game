# 게임 보드 UI (HUD + 게임영역 + 상태바)

| 항목 | 값 |
|---|---|
| **ID** | T-RSG003 |
| **에픽** | E-RSG001 |
| **게임** | reaction-speed-game |
| **상태** | review |
| **우선순위** | high |
| **담당** | claude |
| **생성일** | 2026-02-28 |
| **수정일** | 2026-02-28 |
| **브랜치** | feature/T-RSG003-game-board |
| **의존** | T-RSG002 |
| **차단** | T-RSG005 |

---

## 요약

반응속도 게임의 메인 보드 컴포넌트를 구현한다. 상단 HUD(타이머), 중앙 게임 영역(타겟 서클 렌더링), 하단 상태바(점수+콤보)의 3단 레이아웃.

## 상세 설명

### 레이아웃 (3단 구성)
```
┌────────────────────────┐
│     ⏱ 01:45            │  ← 상단 HUD
├────────────────────────┤
│                        │
│  (타겟 서클들이 등장)   │  ← 중앙 게임 영역
│                        │
├────────────────────────┤
│  Score: 1280  x3콤보  │  ← 하단 상태바
└────────────────────────┘
```

### 상단 HUD
- 남은 시간 카운트다운 (MM:SS 형식)
- 타이머 바 (프로그레스 바 — 줄어드는 형태)

### 중앙 게임 영역
- 고정 비율 영역 (스마트폰 화면에 맞춤)
- `position: relative` 컨테이너 안에 타겟 서클들이 `position: absolute`로 배치
- 타겟 스케줄에 따라 시간이 되면 타겟 서클 컴포넌트 마운트
- duration 종료 or 클릭 시 언마운트

### 하단 상태바
- 현재 점수 (숫자 애니메이션으로 증가)
- 현재 콤보 (x2, x3... 배율 표시, 콤보 증가 시 펄스 효과)

### 게임 루프
- `requestAnimationFrame` 또는 `setInterval`로 현재 시각 추적
- 현재 시각 기준으로 스케줄의 spawnTime에 도달한 타겟을 활성화
- 120초 경과 시 게임 종료 → 결과 상태로 전환

## 구현 가이드

### 수정할 파일
| 파일 | 변경 내용 |
|---|---|
| `src/components/game/ReactionSpeedBoard.tsx` | **신규** — 메인 보드 컴포넌트 |

### 참고 패턴
- 기존 `GomokuBoard.tsx`의 Emotion styled 패턴 참고 (구조만, 격자 아닌 자유 배치)
- 타이머: `useRef` + `requestAnimationFrame`으로 정밀 시간 추적
- 게임 상태: `useReducer` 또는 로컬 `useState`로 관리 (전역 스토어 불필요)

### 상태 관리
```typescript
// 보드 내부 상태
const [gamePhase, setGamePhase] = useState<'ready' | 'playing' | 'finished'>('ready')
const [activeTargets, setActiveTargets] = useState<TargetScheduleItem[]>([])
const [gameState, setGameState] = useState<GameState>(createInitialGameState())
const [elapsedMs, setElapsedMs] = useState(0)
```

## 수락 기준

- [ ] 3단 레이아웃(HUD + 게임영역 + 상태바) 정상 렌더링
- [ ] 타이머가 120초에서 0으로 카운트다운
- [ ] 스케줄에 따라 타겟 서클이 시간에 맞춰 등장
- [ ] 클릭/소멸 시 점수 + 콤보 실시간 반영
- [ ] 120초 종료 시 게임 자동 종료
- [ ] 모바일에서 게임 영역이 적절한 크기로 표시
- [ ] `pnpm build` 성공

## 관련 유즈케이스

| ID | 제목 |
|---|---|
| UC-RSG001 | 게임 플레이 기본 플로우 |

## 메모

- 게임 영역 터치 시 스크롤 방지 필요 (`touch-action: none`)
- 타이머 정밀도: `requestAnimationFrame` 권장 (`setInterval`보다 부드러움)
- 게임 중 화면 전환/백그라운드 처리: 일시정지 또는 경과시간 보정 고려
