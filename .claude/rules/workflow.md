# 티켓 기반 개발 워크플로우

## 문서 위치

모든 에픽/티켓/유즈케이스는 `planning/` 하위에 게임별로 관리된다.
```
planning/
├── shared/          # 게임 공통 기능 (인증, ELO, 로비 등)
├── tictactoe/       # 틱택토
├── gomoku/          # 오목
├── block-puzzle/    # 블록 퍼즐
└── templates/       # 문서 템플릿
```

## ID 네이밍 컨벤션

| 문서 타입 | 패턴 | 예시 |
|---|---|---|
| Epic | `E-{SCOPE}{NNN}` | `E-S001`, `E-BP001` |
| Ticket | `T-{SCOPE}{NNN}` | `T-S001`, `T-BP003` |
| Use Case | `UC-{SCOPE}{NNN}` | `UC-GM002` |

**스코프 코드**: `S`=shared, `TT`=tictactoe, `GM`=gomoku, `BP`=block-puzzle

## 상태 워크플로우

```
draft → ready → in-progress → review → done
```

### 상태 전환 권한

| 전환 | 누가 |
|---|---|
| draft → ready | 사용자 |
| ready → in-progress | Claude (구현 시작 시) |
| in-progress → review | Claude (구현 완료 + PR 생성 시) |
| review → done | 사용자 (PR 검증 + 머지 후) |

## 티켓 찾기

### 사용자가 직접 지정
```
"T-BP001 구현해줘"
```
→ Claude가 해당 티켓 파일을 읽고 구현 시작

### 스캔 요청
```
"ready 티켓 보여줘"
```
→ Claude가 `planning/` 하위의 모든 ticket 파일을 스캔하여 status: ready인 것을 목록으로 보여줌

## 구현 워크플로우

사용자가 티켓 구현을 요청하면 Claude는 아래 순서를 따른다:

### 1. 티켓 분석
1. 해당 티켓 파일 읽기 (`planning/{game}/tickets/T-{ID}.md`)
2. 상위 에픽 파일 읽기 (컨텍스트 파악)
3. 관련 유즈케이스 읽기 (수락 기준 확인)
4. `depends-on` 확인 — 의존 티켓이 done이 아니면 사용자에게 알림

### 2. 브랜치 생성 + 상태 변경
```bash
git checkout -b feature/T-{ID}-{설명}
```
- 티켓 파일의 status를 `in-progress`로 변경
- 티켓 파일의 branch 필드에 브랜치명 기록

### 3. 코드 구현
- 티켓의 구현 가이드 + 수락 기준에 따라 구현
- DB 변경이 포함된 경우 → SQL을 티켓 메모에 기록하고 사용자에게 SQL Editor 실행 안내

### 4. 검증
```bash
pnpm build
```
- 빌드 성공 확인
- 수락 기준 체크리스트 확인

### 5. 커밋 + PR 생성
```bash
git commit -m "feat(T-{ID}): {설명}"
gh pr create --title "feat(T-{ID}): {설명}" --body "..."
```

### 6. 마무리
- 티켓 status를 `review`로 변경
- `.claude/rules/` 관련 문서 최신화 (update-guide.md 규칙 참고)
- `blocks` 필드에 있는 티켓들에 대해 사용자에게 알림

## 의존성 처리

- `depends-on`: 이 티켓 시작 전에 완료돼야 하는 티켓
  - 의존 티켓이 done이 아니면 구현을 시작하지 않고 사용자에게 알림
- `blocks`: 이 티켓이 완료돼야 시작 가능한 티켓
  - 티켓 완료 시 차단 해제된 티켓 목록을 사용자에게 알림

## DB 변경 티켓

Supabase CLI IPv6 연결 불가로 DB 변경은 SQL Editor에서 수동 실행해야 한다:

1. Claude가 SQL 작성 → 티켓 메모 또는 PR에 포함
2. 사용자에게 SQL Editor 실행 안내
3. 사용자 확인 후 프론트엔드 코드 구현 진행

## 커밋 메시지 컨벤션

```
{type}(T-{ID}): {설명}
```

| type | 용도 |
|---|---|
| feat | 새 기능 |
| fix | 버그 수정 |
| refactor | 리팩토링 |
| docs | 문서만 변경 |
| chore | 빌드/설정 변경 |

## 완료 처리

사용자가 "완료 처리해줘"를 요청하면:
1. 티켓 status를 `done`으로 변경
2. `blocks` 필드에 있는 티켓 목록 알림
3. 에픽 내 모든 티켓이 done이면 에픽 status도 `done`으로 변경
