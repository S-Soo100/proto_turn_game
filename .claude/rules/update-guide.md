# 문서 최신화 규칙

사용자가 "claude 학습", "문서 최신화", "서류 최신화" 등을 요청하면 아래 규칙에 따라 해당 파일만 수정한다.

## 어떤 파일을 언제 수정하는가

| 변경 내용 | 수정 파일 |
|---|---|
| 새 기능 단계 완료 | `.claude/rules/progress.md` |
| 새 파일/컴포넌트/페이지 추가 | `.claude/rules/architecture.md` |
| 버그 수정 / 에러 해결 | `.claude/rules/troubleshooting.md` |
| 기술 스택 변경 / Supabase 설정 변경 | `.claude/rules/stack.md` |
| 화면 흐름 변경 / 라우트 추가 | `.claude/rules/architecture.md` |
| 문서 관리 규칙 변경 | `.claude/rules/update-guide.md` (이 파일) |
| 티켓 구현 시작/완료 | 해당 티켓 파일 status 변경 |
| 에픽 내 모든 티켓 완료 | 에픽 파일 status: done |
| 새 게임 추가 | `planning/{game}/` 폴더 생성 + `planning/README.md` 스코프 코드 등록 |
| 새 게임 로직 추가 | `src/lib/game-logic/{game}.test.ts` Unit 테스트 필수 작성 |
| 새 게임 컴포넌트 추가 | `src/components/game/{Board}.test.tsx` Integration 테스트 필수 작성 |

## 최신화 시 체크리스트

1. **progress.md**: 완료된 단계 업데이트, 다음 단계 목록 갱신
2. **architecture.md**: 파일 구조 트리, 화면 흐름 다이어그램 갱신
3. **troubleshooting.md**: 새로 발생/해결된 버그 이력 추가
4. **stack.md**: 새 라이브러리 추가 or 설정 변경 시에만 수정

## 규칙

- CLAUDE.md는 인덱스 역할만 함 — 세부 내용을 직접 추가하지 말 것
- 각 rules 파일은 해당 도메인의 내용만 포함
- 모든 문서는 **한국어**로 작성, 코드(변수명/함수명/주석)는 **영어**

## 테스트 필수 규칙

새 게임을 추가할 때 반드시 함께 작성해야 하는 테스트:

1. **게임 로직 Unit 테스트** (`src/lib/game-logic/{game}.test.ts`)
   - `createInitialState`, `isValidMove`, `applyMove`, `checkResult`, `getAIMove` 등 순수 함수 테스트
   - 승리/패배/무승부/진행 중 모든 케이스 커버
   - AI 난이도별 기본 동작 검증

2. **보드 컴포넌트 Integration 테스트** (`src/components/game/{Board}.test.tsx`)
   - 렌더링 (셀 개수, 마크 표시)
   - 상태 텍스트 (차례, AI 생각 중, 승리/패배/무승부, PvP 모드)
   - 클릭 인터랙션 (빈 셀 클릭, 점유 셀 비활성, 게임 종료 후 비활성)

3. **검증**: `pnpm test:run` 전체 통과 + `pnpm build` 정상 확인
