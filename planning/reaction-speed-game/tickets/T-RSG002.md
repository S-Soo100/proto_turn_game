# 타겟 서클 컴포넌트 + 축소 원 애니메이션

| 항목 | 값 |
|---|---|
| **ID** | T-RSG002 |
| **에픽** | E-RSG001 |
| **게임** | reaction-speed-game |
| **상태** | ready |
| **우선순위** | high |
| **담당** | claude |
| **생성일** | 2026-02-28 |
| **수정일** | 2026-02-28 |
| **브랜치** | feature/T-RSG002-target-circle |
| **의존** | T-RSG001 |
| **차단** | T-RSG003 |

---

## 요약

osu! 스타일의 축소 원 타겟 서클 컴포넌트를 구현한다. 바깥 원이 안쪽 원으로 줄어드는 애니메이션, 클릭 시 등급 피드백, Normal/Speed 시각적 구분을 포함.

## 상세 설명

### 타겟 서클 비주얼
- **안쪽 원 (히트 영역)**: 고정 크기, 클릭 가능한 실제 타겟
- **바깥 원 (접근 링)**: 안쪽 원보다 크게 시작, duration 동안 안쪽 원 크기로 축소
- 두 원이 겹치는 순간 = Perfect 타이밍
- Normal: 파란 계열 (#3b82f6), Speed: 빨간 계열 (#ef4444)

### 클릭 피드백
- 클릭 성공 시: 등급 텍스트 표시 (Perfect!, Great!, Good!, OK!) + 점수 팝업 (+85)
- 등급별 색상: Perfect=금색, Great=초록, Good=파랑, OK=회색
- 소멸 시 (미스): "MISS" 텍스트 + 빨간 페이드아웃

### 애니메이션
- 바깥 원 축소: CSS animation 또는 Framer Motion (duration에 맞춤)
- 클릭 성공: 원 터지는 효과 (scale up + fade out)
- 소멸: 페이드아웃
- 등급/점수 텍스트: 위로 떠오르며 사라지는 효과

## 구현 가이드

### 수정할 파일
| 파일 | 변경 내용 |
|---|---|
| `src/components/game/TargetCircle.tsx` | **신규** — 타겟 서클 컴포넌트 |

### 참고 패턴
- Framer Motion의 `motion.div` + `animate` prop으로 축소 애니메이션
- `onAnimationComplete`로 소멸 이벤트 감지
- 클릭 히트 판정: 컴포넌트 자체 onClick (원형 영역은 `border-radius: 50%`로 처리)

### Props 설계
```typescript
interface TargetCircleProps {
  target: TargetScheduleItem
  onHit: (targetId: number, remainingTime: number) => void
  onMiss: (targetId: number) => void
}
```

## 수락 기준

- [ ] 바깥 원이 안쪽 원으로 축소되는 애니메이션 동작
- [ ] Normal(파랑) / Speed(빨강) 시각적 구분
- [ ] 클릭 시 등급 텍스트 + 점수 팝업 표시
- [ ] 소멸 시 MISS 표시 + 페이드아웃
- [ ] 클릭 성공 시 원 터지는 효과
- [ ] 모바일 터치에서 정상 동작
- [ ] `pnpm build` 성공

## 관련 유즈케이스

| ID | 제목 |
|---|---|
| UC-RSG001 | 게임 플레이 기본 플로우 |

## 메모

- 동시 렌더링 최대 5~6개 → 성능 고려 필요
- 타겟 크기는 모바일에서 터치하기 쉬운 최소 44px 이상 권장
- `pointer-events` 제어: 소멸/히트 후에는 클릭 불가 처리
