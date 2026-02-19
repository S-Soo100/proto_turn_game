# 주요 해결 이력 (버그 & 에러)

## PvP 버그 1: 로비 대기방 목록 안 보임
- **원인**: Supabase Realtime이 `games` 테이블에 비활성화 상태 (Replica Identity 미설정)
- **해결**: LobbyPage에 2초 폴링 추가
  ```typescript
  const pollInterval = setInterval(fetchRooms, 2000)
  ```

## PvP 버그 2: 수를 두면 상대 화면이 새로고침해야 동기화
- **원인**: 동일 — Realtime 미작동
- **해결**: `subscribeToGame`에 1.5초 폴링 폴백 추가
  ```typescript
  const pollInterval = setInterval(fetchAndUpdate, 1500)
  return () => { supabase.removeChannel(channel); clearInterval(pollInterval) }
  ```

## PvP 버그 3: 양쪽 모두 '패배' 표시
- **원인**: `getResultContent`에서 `isMyTurn`으로 승패 판단 — 게임 종료 시 마지막 수를 둔 플레이어의 턴이 상대로 넘어가므로, 양쪽 다 어느 시점에 `isMyTurn=true`가 되어 패배로 표시됨
- **해결**: `game.winner`(UUID)와 `myId` 직접 비교
  ```typescript
  function getResultContent(winner: 'X' | 'O' | null, winnerId: string | null, myId: string, isPvp: boolean) {
    if (winner === null) return { emoji: '🤝', title: '무승부', sub: '아슬아슬했네요!' }
    if (isPvp) {
      if (!winnerId) return { emoji: '🤝', title: '무승부', sub: '아슬아슬했네요!' }
      const iWon = winnerId === myId  // UUID 직접 비교
      return iWon
        ? { emoji: '🎉', title: '승리!', sub: '완벽한 플레이입니다.' }
        : { emoji: '😔', title: '패배', sub: '다시 도전해보세요!' }
    }
    return winner === 'X'
      ? { emoji: '🎉', title: '승리!', sub: '완벽한 플레이입니다.' }
      : { emoji: '😔', title: '패배', sub: '다시 도전해보세요!' }
  }
  ```

## 회원가입 500 에러 (`Database error saving new user`)
- **원인**: `handle_new_user` 트리거가 RLS INSERT 정책(`auth.uid() = id`)에 막힘 — 트리거는 `auth.uid()`가 없는 컨텍스트에서 실행
- **해결**: SQL Editor에서 실행
  ```sql
  DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
  CREATE OR REPLACE FUNCTION handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO profiles (id, username)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8))
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
  ```

## anon key 형식 주의
- Supabase 신규 프로젝트는 `sb_publishable_...` 형식 키를 발급하지만 실제 API 호출에는 `eyJ...` JWT 형식 키 사용
- Dashboard → Settings → API → "Project API keys" → `anon public` (`eyJ...` 형식)
- `.env.local`에 같은 변수명 두 줄 있으면 파싱 오류 — 한 줄만 유지할 것

## SQL 파일 인코딩 주의
- Supabase CLI로 push할 때 SQL 파일에 한국어 주석이 있으면 UTF-8 인코딩 오류 발생
- SQL 파일의 주석은 항상 영어로 작성

## Supabase CLI IPv6 연결 불가
- `supabase db push --db-url` 실행 시 `no route to host` (IPv6 문제)
- DB 스키마 변경은 **Supabase SQL Editor**에서 직접 실행

## ERR_QUIC_PROTOCOL_ERROR
- **원인**: 브라우저의 QUIC(HTTP/3) 프로토콜 오류
- **해결**: `chrome://flags/#enable-quic` → Disabled

## TypeScript TS6133: 미사용 변수 `winner` (gameStore.ts)
- **증상**: `pnpm build` 시 `error TS6133: 'winner' is declared but its value is never read`
- **원인**: 오목 4단계 구현 중 AI 결과 처리 블록에서 `const winner = ...` 선언했으나 실제로는 `aiWon` 기반으로만 업데이트 로직 작성, 변수가 사용되지 않음
- **해결**: 미사용 `winner` 변수 제거, `aiWon` 기반 코드로 정리
  ```typescript
  // 수정 전 (에러)
  const winner = aiResult.winner === null ? null : game.player_white  // 미사용 변수
  const aiWon = isGomoku ? aiResult.winner === 'W' : aiResult.winner === 'O'

  // 수정 후
  const aiWon = isGomoku ? aiResult.winner === 'W' : aiResult.winner === 'O'
  ```
