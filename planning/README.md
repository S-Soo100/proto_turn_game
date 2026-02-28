# Planning 문서 구조 가이드

## 개요

이 폴더는 턴제 전략 게임 허브의 기획 문서를 체계적으로 관리한다. 게임별로 에픽/티켓/유즈케이스를 분리하고, Claude가 티켓 기반으로 자동 구현할 수 있는 워크플로우를 지원한다.

## 폴더 구조

```
planning/
├── README.md                    # 이 파일
├── templates/                   # 문서 템플릿
│   ├── epic-template.md
│   ├── ticket-template.md
│   ├── usecase-template.md
│   └── game-overview-template.md
├── shared/                      # 게임 공통 기능
│   ├── epics/
│   ├── tickets/
│   └── usecases/
├── tictactoe/                   # 틱택토
│   ├── overview.md
│   ├── epics/
│   ├── tickets/
│   └── usecases/
├── gomoku/                      # 오목
│   ├── overview.md
│   ├── epics/
│   ├── tickets/
│   └── usecases/
├── block-puzzle/                # 블록 퍼즐
│   ├── overview.md
│   ├── research/
│   ├── epics/
│   ├── tickets/
│   └── usecases/
└── archive/                     # 기존 문서 보관
```

## 스코프 코드 테이블

| 코드 | 게임/영역 | 폴더 |
|---|---|---|
| `S` | Shared (공통) | `planning/shared/` |
| `TT` | Tic-Tac-Toe (틱택토) | `planning/tictactoe/` |
| `GM` | Gomoku (오목) | `planning/gomoku/` |
| `BP` | Block Puzzle (블록 퍼즐) | `planning/block-puzzle/` |

새 게임 추가 시 스코프 코드를 이 테이블에 등록한다.

## ID 네이밍 컨벤션

| 문서 타입 | 패턴 | 예시 |
|---|---|---|
| Epic | `E-{SCOPE}{NNN}` | `E-S001`, `E-BP001` |
| Ticket | `T-{SCOPE}{NNN}` | `T-S001`, `T-BP003` |
| Use Case | `UC-{SCOPE}{NNN}` | `UC-GM002` |

## 상태 워크플로우

```
draft → ready → in-progress → review → done
```

- **draft**: 초안 작성 중
- **ready**: 구현 가능 (요구사항 확정)
- **in-progress**: 구현 진행 중
- **review**: PR 생성됨, 검토 대기
- **done**: 완료 + 머지됨

## 사용법

### 새 에픽 작성
1. `planning/templates/epic-template.md`를 복사
2. `planning/{game}/epics/E-{SCOPE}{NNN}.md`로 저장
3. 메타데이터와 내용 작성

### 새 티켓 작성
1. `planning/templates/ticket-template.md`를 복사
2. `planning/{game}/tickets/T-{SCOPE}{NNN}.md`로 저장
3. 에픽과 연결, 구현 가이드 + 수락 기준 작성

### Claude에게 구현 요청
```
"T-BP001 구현해줘"          # 특정 티켓 구현
"ready 티켓 보여줘"         # 구현 가능한 티켓 목록
"완료 처리해줘"              # 현재 티켓 done 처리
```

자세한 워크플로우는 `.claude/rules/workflow.md` 참고.

## 템플릿 목록

| 파일 | 용도 |
|---|---|
| `epic-template.md` | 에픽 (기능 묶음) 문서 |
| `ticket-template.md` | 티켓 (단위 작업) 문서 |
| `usecase-template.md` | 유즈케이스 (사용 시나리오) 문서 |
| `game-overview-template.md` | 게임별 개요 문서 |
