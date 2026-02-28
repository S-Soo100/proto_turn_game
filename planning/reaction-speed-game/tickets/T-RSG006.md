# QA 피드백 반영: 원 크기 축소 + 축소 애니메이션 수정 + 모바일 레이아웃 개선

| 항목 | 값 |
|---|---|
| **ID** | T-RSG006 |
| **에픽** | E-RSG001 |
| **게임** | reaction-speed-game |
| **상태** | ready |
| **우선순위** | high |
| **담당** | claude |
| **생성일** | 2026-02-28 |
| **수정일** | 2026-02-28 |
| **브랜치** | feature/T-RSG006-qa-fixes |
| **의존** | T-RSG005 |
| **차단** | — |

---

## 요약

QA 테스트 결과 발견된 3가지 이슈를 수정한다.

## 이슈 목록

### 이슈 1: 원 크기 20% 축소

**현상**: 타겟 서클이 스마트폰 화면에서 너무 크다.

**현재 값**:
| 항목 | 현재 | 수정 후 |
|---|---|---|
| 내부 원 (INNER_SIZE) | 48px | 32px |
| 외부 원 시작 (OUTER_START_SIZE) | 120px | 64px |

**수정 파일**: `src/components/game/TargetCircle.tsx` (L28-30)

---

### 이슈 2: 외부 원 축소 애니메이션 미작동

**현상**: 게임 플레이 시 외부 링이 줄어들지 않고 고정 크기로 표시된다.

**원인 분석**:
현재 외부 원 크기를 JS로 계산하여 React state 기반 리렌더링에 의존한다:
```tsx
// TargetCircle.tsx L38-39
const elapsed = gameElapsedMs - target.spawnTime
const progress = Math.min(1, elapsed / target.duration)
// L61
const outerSize = OUTER_START_SIZE - progress * (OUTER_START_SIZE - INNER_SIZE)
```
`gameElapsedMs`는 부모 컴포넌트(ReactionSpeedBoard)의 RAF 루프에서 `setElapsedMs()`로 매 프레임 업데이트된다. 그러나 React 19의 자동 배칭으로 인해 실제 리렌더링 빈도가 RAF(~60fps)보다 낮아져, 외부 링 크기가 제대로 갱신되지 않는다.

**수정 방향**: JS 계산 → **CSS `@keyframes` 애니메이션**으로 전환
- 외부 링의 축소를 CSS `animation`으로 처리하면 React 리렌더링과 무관하게 GPU에서 부드럽게 동작
- 타겟이 마운트되는 순간 CSS 애니메이션이 시작되어 `duration` 동안 OUTER → INNER로 축소
- `animation-duration`은 타겟별 `target.duration`을 inline style로 전달

**수정 전 (JS 기반)**:
```tsx
// TargetCircle.tsx
const outerSize = OUTER_START_SIZE - progress * (OUTER_START_SIZE - INNER_SIZE)
<OuterRing style={{ width: outerSize, height: outerSize, ... }} />
```

**수정 후 (CSS 애니메이션)**:
```tsx
// TargetCircle.tsx
// progress/outerSize 계산 제거
// OuterRing에 CSS keyframes 적용
<OuterRing style={{
  animationDuration: `${target.duration}ms`,
  borderColor: baseColor,
  opacity: ...,
}} />
```
```css
@keyframes shrink {
  from { width: 96px; height: 96px; }
  to   { width: 38px; height: 38px; }
}
/* OuterRing에 animation 속성 추가, transition 제거 */
```

**수정 파일**: `src/components/game/TargetCircle.tsx`

---

### 이슈 3: 모바일 세로 레이아웃 최적화

**현상**: 게임 영역이 스마트폰에서 세로로 충분히 길지 않다. 정사각형에 가까운 비율이라 모바일 세로 화면에 적합하지 않다.

**현재 레이아웃**:
```
┌──────────────────┐
│ HUD (타이머)      │  고정
├──────────────────┤
│                  │
│   GameArea       │  flex: 1, min-height: 300px
│   (정사각형 비율)  │  max-width: 480px
│                  │
├──────────────────┤
│ StatusBar        │  고정
└──────────────────┘
```

**수정 후 레이아웃**:
```
┌──────────────────┐
│ HUD (타이머)      │  고정, 패딩 축소
├──────────────────┤
│                  │
│                  │
│   GameArea       │  flex: 1, 100dvh 기준 최대한 확보
│   (세로로 길게)   │  좌우 마진 최소화
│                  │
│                  │
│                  │
├──────────────────┤
│ StatusBar        │  고정, 패딩 축소
└──────────────────┘
```

**수정 사항**:
| 항목 | 현재 | 수정 후 |
|---|---|---|
| Wrapper max-width | 480px | 제거 (전체 너비 사용) |
| Wrapper height | 100% | 100dvh (뷰포트 기준) |
| GameArea min-height | 300px | 제거 (flex: 1로 자동 확장) |
| GameArea margin | 0 8px | 0 4px |
| GameArea border-radius | 12px | 8px |
| HUD padding | 12px 16px 8px | 8px 12px 4px |
| StatusBar padding | 10px 16px | 8px 12px |
| GameWrapper (Page) | padding-top: safe-area | height: 100dvh + overflow: hidden |

**수정 파일**: `src/components/game/ReactionSpeedBoard.tsx`, `src/pages/ReactionSpeedPage.tsx`

---

## 수정할 파일 목록

| 파일 | 변경 내용 |
|---|---|
| `src/components/game/TargetCircle.tsx` | 이슈 1 (원 크기 축소) + 이슈 2 (CSS 애니메이션 전환) |
| `src/components/game/ReactionSpeedBoard.tsx` | 이슈 3 (모바일 레이아웃 개선) |
| `src/pages/ReactionSpeedPage.tsx` | 이슈 3 (GameWrapper 높이 조정) |

## 수락 기준

- [ ] 내부 원 32px, 외부 원 시작 63px로 표시
- [ ] 외부 원이 타겟 duration 동안 부드럽게 축소 (CSS 애니메이션)
- [ ] 게임 영역이 스마트폰 세로 화면을 최대한 활용
- [ ] HUD, StatusBar는 최소 높이로 고정
- [ ] 기존 히트 판정, 콤보, 점수 계산에 영향 없음
- [ ] `pnpm build` 성공
