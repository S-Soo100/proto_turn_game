# 틱택토 (Tic-Tac-Toe) Overview

| 항목 | 값 |
|---|---|
| **ID** | tictactoe |
| **상태** | released |

---

## 게임 개요

3x3 격자에서 두 플레이어가 번갈아 마크를 놓아 가로/세로/대각선 3연속을 먼저 만드는 고전 보드 게임.

## 핵심 메카닉

- 두 플레이어(X, O)가 번갈아 빈 칸에 마크를 놓음
- 가로/세로/대각선 3연속을 먼저 만들면 승리
- 모든 칸이 차면 무승부

## 보드 구조

| 항목 | 값 |
|---|---|
| 격자 크기 | 3x3 (9칸) |
| 셀 표현 | `'X'` / `'O'` / `null` |
| 데이터 구조 | 고정 길이 9 튜플 (`Grid`) |
| 승리 라인 | 8개 (가로 3 + 세로 3 + 대각선 2) |

## 승리 조건

- 가로, 세로, 대각선 중 하나에서 같은 마크 3개 연속

## AI 전략

| 난이도 | 알고리즘 | 비고 |
|---|---|---|
| easy | 랜덤 | 유효한 빈 칸 중 무작위 선택 |
| medium | 미니맥스 50% + 랜덤 50% | 절반 확률로 최적수, 절반 랜덤 |
| hard | 미니맥스 (완전 탐색) | 완벽한 플레이 — 절대 지지 않음 |

**미니맥스 평가**: +10(AI 승), -10(상대 승), 0(진행중/무승부)

## 기술 구성

| 파일 | 역할 |
|---|---|
| `src/lib/game-logic/tictactoe.ts` | 순수 게임 로직 (createInitialState, applyMove, checkResult, getAIMove) |
| `src/components/game/TicTacToeBoard.tsx` | 보드 UI (3x3 그리드, 마크 색상 X=인디고/O=로즈, 승리 셀 보라 강조) |

### 주요 내보내기 함수
- `createInitialState()` → TicTacToeState
- `getValidMoves(state)` → number[]
- `applyMove(state, index)` → TicTacToeState
- `checkResult(state)` → GameResult | null
- `getAIMove(state, difficulty)` → number

### UI 특성
- 최대 너비 360px, 정사각형 비율
- 마크 등장 시 스프링 애니메이션 (scale 0→1)
- AI 사고 중 점 3개 바운스 애니메이션

## PvP 지원

| 항목 | 값 |
|---|---|
| 지원 여부 | yes |
| 마크 표시 | X(방장) / O(참가자) |
| Realtime 방식 | Supabase postgres_changes + 1.5초 폴링 폴백 |

## 에픽 목록

| ID | 제목 | 상태 |
|---|---|---|
| — | 초기 구현 (0~3단계) | done |
