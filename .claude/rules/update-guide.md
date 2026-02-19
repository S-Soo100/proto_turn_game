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

## 최신화 시 체크리스트

1. **progress.md**: 완료된 단계 업데이트, 다음 단계 목록 갱신
2. **architecture.md**: 파일 구조 트리, 화면 흐름 다이어그램 갱신
3. **troubleshooting.md**: 새로 발생/해결된 버그 이력 추가
4. **stack.md**: 새 라이브러리 추가 or 설정 변경 시에만 수정

## 규칙

- CLAUDE.md는 인덱스 역할만 함 — 세부 내용을 직접 추가하지 말 것
- 각 rules 파일은 해당 도메인의 내용만 포함
- 모든 문서는 **한국어**로 작성, 코드(변수명/함수명/주석)는 **영어**
