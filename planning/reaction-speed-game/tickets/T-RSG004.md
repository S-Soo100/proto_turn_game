# Leaderboard DB + 랭킹 조회/저장

| 항목 | 값 |
|---|---|
| **ID** | T-RSG004 |
| **에픽** | E-RSG001 |
| **게임** | reaction-speed-game |
| **상태** | ready |
| **우선순위** | high |
| **담당** | claude + human |
| **생성일** | 2026-02-28 |
| **수정일** | 2026-02-28 |
| **브랜치** | feature/T-RSG004-leaderboard |
| **의존** | — |
| **차단** | T-RSG005 |

---

## 요약

Supabase에 leaderboard 테이블을 생성하고, 점수 저장 및 Top 10 조회 기능을 구현한다.

## 상세 설명

### DB 테이블 설계
- `leaderboard` 테이블: 다른 게임에서도 재사용 가능하도록 `game_type` 컬럼 포함
- 한 유저가 여러 번 플레이 가능 → 최고 점수만 랭킹에 반영하거나, 모든 기록 저장 후 조회 시 최고점만 추출

### 조회 함수
- `fetchTopScores(gameType, limit=10)` — Top N 조회 (점수 내림차순, 닉네임/적중률 JOIN)
- `fetchMyBest(gameType, playerId)` — 내 최고 점수 조회

### 저장 함수
- `saveScore(gameType, playerId, score, accuracy, maxCombo)` — 결과 저장

## 구현 가이드

### 수정할 파일
| 파일 | 변경 내용 |
|---|---|
| `src/lib/leaderboard.ts` | **신규** — 랭킹 조회/저장 함수 |

### DB 변경
```sql
-- Supabase SQL Editor에서 실행

-- leaderboard table
CREATE TABLE leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_type TEXT NOT NULL REFERENCES game_types(id),
  player_id UUID NOT NULL REFERENCES profiles(id),
  score INTEGER NOT NULL DEFAULT 0,
  accuracy REAL,          -- 적중률 (0.0 ~ 1.0)
  max_combo INTEGER,
  played_at TIMESTAMPTZ DEFAULT now()
);

-- indexes
CREATE INDEX idx_leaderboard_game_score ON leaderboard(game_type, score DESC);
CREATE INDEX idx_leaderboard_player ON leaderboard(player_id);

-- RLS
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- anyone can read leaderboard
CREATE POLICY "Leaderboard is publicly readable"
  ON leaderboard FOR SELECT USING (true);

-- authenticated users can insert their own scores
CREATE POLICY "Users can insert own scores"
  ON leaderboard FOR INSERT
  WITH CHECK (auth.uid() = player_id);

-- game_types insert
INSERT INTO game_types (id, name, description)
VALUES ('reaction-speed-game', 'Reaction Speed Game', 'Click shrinking target circles for points in 120 seconds');
```

### 참고 패턴
- `supabase.from('leaderboard').select('*, profiles(username)')` — JOIN으로 닉네임 가져오기
- `order('score', { ascending: false }).limit(10)` — Top 10

## 수락 기준

- [ ] leaderboard 테이블 SQL이 작성되어 있음
- [ ] `fetchTopScores`가 Top 10을 점수 내림차순으로 반환 (닉네임, 적중률 포함)
- [ ] `saveScore`가 게임 결과를 정상 저장
- [ ] RLS 정책: 누구나 읽기 가능, 본인만 쓰기 가능
- [ ] `pnpm build` 성공

## 관련 유즈케이스

| ID | 제목 |
|---|---|
| UC-RSG002 | 결과 저장 + 랭킹 갱신 |
| UC-RSG003 | 랭킹 조회 |

## 메모

- SQL은 사용자에게 SQL Editor 실행을 안내해야 함
- leaderboard 테이블은 game_type으로 구분 → 블록 퍼즐 등 다른 게임에서도 재사용 가능
- 추후 "개인 최고 기록 갱신 시 알림" 기능 확장 가능
