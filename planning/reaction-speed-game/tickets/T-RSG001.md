# 게임 로직 구현 (타겟 스케줄 + 점수 + 콤보)

| 항목 | 값 |
|---|---|
| **ID** | T-RSG001 |
| **에픽** | E-RSG001 |
| **게임** | reaction-speed-game |
| **상태** | review |
| **우선순위** | high |
| **담당** | claude |
| **생성일** | 2026-02-28 |
| **수정일** | 2026-02-28 |
| **브랜치** | feature/T-RSG001-game-logic |
| **의존** | — |
| **차단** | T-RSG002 |

---

## 요약

반응속도 게임의 순수 로직을 구현한다. 타겟 스케줄 생성, 점수 계산(시간 비례), 콤보 시스템(배율), 등급 판정(Perfect/Great/Good/OK)을 포함.

## 상세 설명

`src/lib/game-logic/reaction-speed.ts` 파일을 생성하여, 기존 tictactoe.ts / gomoku.ts와 유사한 순수 함수 패턴으로 구현.

### 타겟 스케줄 생성
- 120초 동안 총 100개 타겟 (Normal 70, Speed 30)
- 각 타겟의 등장 시각(ms), 타입(Normal/Speed), 위치(x, y %) 를 사전 생성
- 위치는 게임 영역 내 패딩을 고려한 랜덤 좌표 (% 단위)
- 동시 등장은 자연스럽게 발생 (이전 타겟이 아직 살아있을 때 다음 타겟 등장)

### 점수 계산
- Normal 클릭: 10~100점 (소멸까지 남은 비율에 반비례, 소멸 직전이 최고점)
- Speed 클릭: 15~150점 (1.5배 보정)
- 콤보 배율 적용: `점수 = 기본점수 × 콤보배율`
- 콤보 단계: 5연속=x2, 10연속=x3, 20연속=x4, 30연속=x5 (최대)
- 미스(소멸) 시 콤보 카운트 0으로 초기화

### 등급 판정 (소멸까지 남은 시간 기준)
- Perfect: 0.3초 이내
- Great: 0.3~1초
- Good: 1~2초
- OK: 2초 이상

## 구현 가이드

### 수정할 파일
| 파일 | 변경 내용 |
|---|---|
| `src/lib/game-logic/reaction-speed.ts` | **신규** — 전체 게임 로직 |

### 참고 패턴
- `tictactoe.ts`의 구조: 타입 정의 → 상수 → 순수 함수 → 내보내기
- 이 게임은 실시간이지만, 로직 자체는 순수 함수로 분리 가능
  - `generateSchedule(seed?)` → 타겟 스케줄 배열
  - `calculateScore(targetType, remainingRatio)` → 기본 점수
  - `getGrade(remainingTime)` → 등급
  - `getComboMultiplier(comboCount)` → 배율
  - `applyClick(state, targetId, clickTime)` → 새 상태

### 타입 정의 예시
```typescript
type TargetType = 'normal' | 'speed'
type Grade = 'perfect' | 'great' | 'good' | 'ok'

interface TargetScheduleItem {
  id: number
  type: TargetType
  spawnTime: number    // ms (0~120000)
  duration: number     // ms (normal=4000, speed=2000)
  x: number            // 0~100 (%)
  y: number            // 0~100 (%)
}

interface GameState {
  score: number
  combo: number
  maxCombo: number
  clicks: number
  misses: number
  grades: Record<Grade, number>  // { perfect: 0, great: 0, good: 0, ok: 0 }
}
```

## 수락 기준

- [ ] `generateSchedule`이 100개 타겟 (Normal 70, Speed 30) 생성
- [ ] 타겟 위치가 게임 영역 내 유효 범위
- [ ] `calculateScore`가 소멸 직전 클릭 시 최고점, 등장 직후 최저점 반환
- [ ] Speed 타겟이 Normal의 1.5배 점수
- [ ] 콤보 배율이 5/10/20/30연속에서 정확히 x2/x3/x4/x5
- [ ] 미스 시 콤보가 0으로 초기화
- [ ] 등급 판정이 시간 기준에 맞게 동작
- [ ] `pnpm build` 성공

## 관련 유즈케이스

| ID | 제목 |
|---|---|
| UC-RSG001 | 게임 플레이 기본 플로우 |

## 메모

- 시드 기반 스케줄 생성 시 추후 "일일 도전" 확장 가능
- 실시간 게임이지만 로직은 순수 함수로 유지 — 상태 관리는 컴포넌트/스토어에서
