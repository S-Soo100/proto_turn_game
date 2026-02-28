# QA 피드백 #2: 리더보드 404 에러 + 타이머 바 애니메이션 미작동

| 항목 | 값 |
|---|---|
| **ID** | T-RSG007 |
| **에픽** | E-RSG001 |
| **게임** | reaction-speed-game |
| **상태** | ready |
| **우선순위** | critical |
| **담당** | claude + human |
| **생성일** | 2026-02-28 |
| **수정일** | 2026-02-28 |
| **브랜치** | feature/T-RSG007-qa-fixes-2 |
| **의존** | T-RSG006 |
| **차단** | — |

---

## 이슈 목록

### 이슈 1: 리더보드 404 에러 (DB 테이블 미생성)

**현상**: 콘솔에 `leaderboard` 엔드포인트 404 에러 다수 발생
```
GET mizztmfzukofxiyrgall.supabase.co/rest/v1/leaderboard?select=...  → 404
Failed to fetch leaderboard: Object
```

**원인**: Supabase에 `leaderboard` 테이블이 아직 생성되지 않았다. T-RSG004에서 SQL을 작성했지만, 실제 SQL Editor 실행은 사용자가 수동으로 해야 하며 아직 미실행 상태.

**해결 (사용자 액션 필요)**:
Supabase SQL Editor에서 아래 SQL 실행:

```sql
-- leaderboard table
CREATE TABLE leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_type TEXT NOT NULL REFERENCES game_types(id),
  player_id UUID NOT NULL REFERENCES profiles(id),
  score INTEGER NOT NULL DEFAULT 0,
  accuracy REAL,
  max_combo INTEGER,
  played_at TIMESTAMPTZ DEFAULT now()
);

-- indexes
CREATE INDEX idx_leaderboard_game_score ON leaderboard(game_type, score DESC);
CREATE INDEX idx_leaderboard_player ON leaderboard(player_id);

-- RLS
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaderboard is publicly readable"
  ON leaderboard FOR SELECT USING (true);

CREATE POLICY "Users can insert own scores"
  ON leaderboard FOR INSERT
  WITH CHECK (auth.uid() = player_id);

-- game_types insert
INSERT INTO game_types (id, name, description)
VALUES ('reaction-speed-game', 'Reaction Speed Game', 'Click shrinking target circles for points in 120 seconds');
```

**프론트엔드 보강 (Claude)**:
- `fetchTopScores`/`fetchMyBest` 에러 시 콘솔 로그가 반복 출력되지 않도록 에러 핸들링 개선
- 테이블 미존재 시 사용자에게 안내 메시지 표시 (선택사항)

**수정 파일**: 없음 (DB 테이블 생성만으로 해결)

---

### 이슈 2: 타이머 그라데이션 바 애니메이션 미작동

**현상**: 게임 플레이 중 남은 시간을 표시하는 그라데이션 바(`TimerFill`)가 부드럽게 줄어들지 않는다.

**원인 분석**:
타이머 바의 너비를 JS state(`elapsedMs`) 기반 리렌더링으로 제어한다:
```tsx
// ReactionSpeedBoard.tsx L117
const progressPct = ((GAME_DURATION_MS - elapsedMs) / GAME_DURATION_MS) * 100
// L138
<TimerFill style={{ width: `${progressPct}%` }} />
```
`setElapsedMs()`가 매 RAF 프레임(~60fps)마다 호출되지만, React 19 자동 배칭에 의해 실제 리렌더링 빈도가 저하되어 바 너비 업데이트가 매끄럽지 않다. T-RSG006에서 타겟 축소에 동일 문제가 있어 CSS 애니메이션으로 해결한 것과 같은 근본 원인.

**수정 방향**: JS state 기반 → **CSS animation**으로 전환
- `TimerFill`에 CSS `@keyframes` 적용: `width: 100%` → `width: 0%`
- `animation-duration: ${GAME_DURATION_MS}ms` (120초)
- `animation-timing-function: linear`
- `animation-play-state`로 시작/중지 제어
- 게임 시작 시 애니메이션 시작, 종료 시 정지

**수정 전**:
```tsx
const progressPct = ((GAME_DURATION_MS - elapsedMs) / GAME_DURATION_MS) * 100
<TimerFill style={{ width: `${progressPct}%` }} />
```
```css
/* TimerFill */
transition: width 100ms linear;
```

**수정 후**:
```tsx
<TimerFill $playing={phase === 'playing'} />
```
```css
@keyframes timerDrain {
  from { width: 100%; }
  to   { width: 0%; }
}
/* TimerFill */
width: 100%;
animation: timerDrain ${GAME_DURATION_MS}ms linear forwards;
animation-play-state: ${p => p.$playing ? 'running' : 'paused'};
```

**수정 파일**: `src/components/game/ReactionSpeedBoard.tsx`

---

## 수정할 파일 목록

| 파일 | 담당 | 변경 내용 |
|---|---|---|
| Supabase SQL Editor | **사용자** | 이슈 1: leaderboard 테이블 + RLS + game_types INSERT |
| `src/components/game/ReactionSpeedBoard.tsx` | Claude | 이슈 2: TimerFill CSS 애니메이션 전환 |

## 수락 기준

- [ ] Supabase에 `leaderboard` 테이블 생성 완료 (사용자)
- [ ] 리더보드 조회/저장 시 404 에러 없음
- [ ] 타이머 바가 120초 동안 부드럽게 줄어듦 (CSS 애니메이션)
- [ ] `pnpm build` 성공
