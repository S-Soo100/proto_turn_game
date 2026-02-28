# {티켓 제목}

| 항목 | 값 |
|---|---|
| **ID** | T-{SCOPE}{NNN} |
| **에픽** | E-{SCOPE}{NNN} |
| **게임** | shared / tictactoe / gomoku / block-puzzle |
| **상태** | draft / ready / in-progress / review / done |
| **우선순위** | critical / high / medium / low |
| **담당** | claude / human |
| **생성일** | YYYY-MM-DD |
| **수정일** | YYYY-MM-DD |
| **브랜치** | feature/T-{SCOPE}{NNN}-{설명} |
| **의존** | (이 티켓이 시작하려면 완료돼야 하는 티켓) |
| **차단** | (이 티켓이 완료돼야 시작 가능한 티켓) |

---

## 요약

> 이 티켓이 무엇을 구현하는지 1-2문장으로 요약

## 상세 설명

구현해야 할 내용을 구체적으로 기술

## 구현 가이드

### 수정할 파일
| 파일 | 변경 내용 |
|---|---|
| `src/...` | |

### DB 변경 (해당 시)
```sql
-- Supabase SQL Editor에서 실행
```

### 참고 패턴
기존 코드에서 참고할 수 있는 유사 구현 패턴 설명

## 수락 기준

- [ ] 기준 1
- [ ] 기준 2
- [ ] `pnpm build` 성공
- [ ] 관련 유즈케이스 시나리오 통과

## 관련 유즈케이스

| ID | 제목 |
|---|---|
| UC-{SCOPE}{NNN} | |

## 메모

추가 참고 사항, 논의 필요 사항 등
