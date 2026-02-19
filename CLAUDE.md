# 프로젝트: 턴제 전략 게임 허브

## 문서 구조
세부 내용은 `.claude/rules/` 하위 파일로 분리 관리된다.

| 파일 | 내용 |
|---|---|
| [`.claude/rules/stack.md`](.claude/rules/stack.md) | 기술 스택, Supabase 프로젝트 정보, 주요 제약사항 |
| [`.claude/rules/architecture.md`](.claude/rules/architecture.md) | 화면 흐름, 파일 구조, Realtime 구조 |
| [`.claude/rules/progress.md`](.claude/rules/progress.md) | 완료된 단계, 다음 단계 |
| [`.claude/rules/troubleshooting.md`](.claude/rules/troubleshooting.md) | 버그/에러 해결 이력 |
| [`.claude/rules/update-guide.md`](.claude/rules/update-guide.md) | 문서 최신화 규칙 (언제 어떤 파일을 수정하는가) |

## 필수 규칙
- 모든 문서는 **한국어**, 코드(변수명/함수명/주석)는 **영어**
- DB 스키마 변경은 **Supabase SQL Editor**에서 직접 실행 (CLI IPv6 불가)
- `claude 학습` / `문서 최신화` 요청 시 → [`.claude/rules/update-guide.md`](.claude/rules/update-guide.md) 규칙 참고
- 새 규칙 파일이 필요하면 `.claude/rules/` 하위에 추가하고 이 인덱스 테이블에도 등록
