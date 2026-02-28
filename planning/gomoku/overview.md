# 오목 (Gomoku) Overview

| 항목 | 값 |
|---|---|
| **ID** | gomoku |
| **상태** | released |

---

## 게임 개요

15x15 바둑판에서 두 플레이어가 번갈아 돌을 놓아 가로/세로/대각선 5연속을 먼저 만드는 전략 보드 게임.

## 핵심 메카닉

- 두 플레이어(흑B, 백W)가 번갈아 교차점에 돌을 놓음
- 가로/세로/대각선 5연속을 먼저 만들면 승리
- 모든 칸이 차면 무승부 (실질적으로 발생하지 않음)

## 보드 구조

| 항목 | 값 |
|---|---|
| 격자 크기 | 15x15 (225칸), `BOARD_SIZE = 15` |
| 셀 표현 | `'B'`(흑) / `'W'`(백) / `null` |
| 데이터 구조 | flat 배열 (`GomokuCell[]`), `grid[row * 15 + col]` |
| 이모지 | 🐻 곰 = 흑(B, player_white), 🐰 토끼 = 백(W, player_black) |
| 마지막 수 추적 | `lastMove: number | null` |

## 승리 조건

- 4방향(수평, 수직, 대각선↘, 대각선↙) 동적 스캔으로 5연속 판정
- 승리 시 5칸의 인덱스 배열(`winLine`)을 반환

## AI 전략

| 난이도 | 알고리즘 | 비고 |
|---|---|---|
| easy | 랜덤 | 기존 돌 주변 2칸 내 후보에서 무작위 선택 |
| medium | 알파베타 깊이 2 + 랜덤 30% | 70% 최적수, 30% 랜덤 |
| hard | 알파베타 깊이 4 | 깊은 탐색으로 강력한 수읽기 |

### 알파베타 가지치기 상세
- **후보 생성**: 기존 돌 주변 2칸 내 빈 칸만 탐색 (탐색 공간 대폭 축소)
- **평가 함수**: 모든 라인(길이 ≥ 5)에서 연속 패턴 점수화
  - 양쪽 열린 4연속: 50,000점
  - 양쪽 열린 3연속: 5,000점
  - 양쪽 열린 2연속: 500점
  - 양쪽 열린 1개: 10점
  - 한쪽 막힌 패턴: 0점
- **승리 점수**: ±1,000,000 + depth

## 기술 구성

| 파일 | 역할 |
|---|---|
| `src/lib/game-logic/gomoku.ts` | 순수 게임 로직 (createInitialState, applyMove, checkResult, getAIMove) |
| `src/components/game/GomokuBoard.tsx` | 보드 UI (15x15 바둑판, 이모지 돌, 교차점 라인) |

### 주요 내보내기 함수
- `createInitialState()` → GomokuState
- `isValidMove(state, index)` → boolean
- `getValidMoves(state)` → number[]
- `applyMove(state, index)` → GomokuState
- `checkResult(state)` → GomokuResult | null
- `getAIMove(state, difficulty)` → number

### UI 특성
- 베이지색 바둑판 배경 (#f5deb3), 갈색 교차선 (#8b6914)
- 셀 크기 28px, 돌 이모지 20px
- 마지막 수: amber outline (#f59e0b)
- 승리 5칸: gold outline (#fbbf24)
- 호버 시 🐻 미리보기 (35% 투명도)
- 모바일: 가로 스크롤 (-webkit-overflow-scrolling touch)

## PvP 지원

| 항목 | 값 |
|---|---|
| 지원 여부 | yes |
| 마크 표시 | 🐻 곰(방장, 흑B) / 🐰 토끼(참가자, 백W) |
| Realtime 방식 | Supabase postgres_changes + 1.5초 폴링 폴백 |

## 에픽 목록

| ID | 제목 | 상태 |
|---|---|---|
| — | 4단계: 오목 게임 추가 | done |
