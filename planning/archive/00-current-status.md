# 현재 진행 상황 및 다음 단계

이 문서는 Claude에게 현재 프로젝트 상태를 빠르게 전달하기 위한 컨텍스트 문서입니다.
새 대화를 시작할 때 이 파일을 먼저 읽어달라고 요청하세요.

---

## 프로젝트 기본 정보

- **프로젝트명**: 턴제 전략 게임 (퍼즐/보드게임 스타일)
- **스택**: React 18 + TypeScript + Vite / Supabase / Zustand / Tailwind CSS
- **모드**: 싱글플레이어 (vs AI) + 비동기 PvP
- **Supabase 프로젝트**: `my-game-hub` (Region: Tokyo)
- **Reference ID**: `mizztmfzukofxiyrgall`
- **로컬 경로**: `/Users/baek/myGameProject/supa_proto_turn_game_01`

---

## 완료된 작업 ✅

### 기획 문서
- [x] `planning/01-project-overview.md` — 프로젝트 개요
- [x] `planning/02-technical-stack.md` — 기술 스택
- [x] `planning/03-game-design-considerations.md` — 게임 설계 고려사항
- [x] `planning/04-supabase-architecture.md` — Supabase DB 스키마 및 RLS 설계
- [x] `planning/05-frontend-architecture.md` — 프론트엔드 아키텍처
- [x] `planning/06-development-roadmap.md` — 개발 로드맵
- [x] `planning/07-checklist.md` — 개발 체크리스트

### Supabase 설정
- [x] Supabase 계정 생성
- [x] 프로젝트 생성 (`my-game-hub`, Tokyo)
- [x] `supabase init` 완료 → `supabase/config.toml` 생성됨
- [x] `supabase link --project-ref mizztmfzukofxiyrgall` 완료
- [x] `.env.local` 환경변수 설정 완료

### 환경 설정
- [x] `.claude/settings.local.json` — 한국어 문서 작성 규칙 설정

---

## 0단계 완료 ✅

### 완료된 설정
- [x] Vite 7 + React 19 + TypeScript 프로젝트 생성
- [x] 핵심 의존성 설치 (react-router-dom 7, @supabase/supabase-js 2, zustand 5, framer-motion 12)
- [x] CSS 솔루션: **Emotion** (`@emotion/react`, `@emotion/styled`) — Tailwind 대신 선택
  - 이유: 게임 보드 상태에 따른 런타임 동적 스타일링 필요
- [x] `vite.config.ts` — Emotion babel 플러그인 + `@/` 경로 alias 설정
- [x] `tsconfig.app.json` — paths 설정 (`@/*` → `src/*`)
- [x] `src/lib/supabase.ts` — Supabase 클라이언트 싱글톤 생성
- [x] `.gitignore` 생성 (`.env.local` 포함)
- [x] `.env.example` 생성
- [x] `src/` 폴더 구조: `lib/`, `components/`, `store/`, `hooks/`, `pages/`, `types/`, `styles/`
- [x] 빌드 검증 완료 (`pnpm build` 성공)

---

### 1단계: 인증 (다음 주요 단계)

#### DB 마이그레이션
- [ ] `supabase migration new initial_schema` 실행
- [ ] `profiles` 테이블 마이그레이션 작성 (`planning/04-supabase-architecture.md` 참고)
- [ ] RLS 정책 작성
- [ ] `supabase db push` 로 원격 적용

#### 프론트엔드 인증
- [ ] `src/store/authStore.ts` — Zustand 인증 스토어
- [ ] `src/hooks/useAuth.ts` — 인증 훅
- [ ] `LoginForm`, `SignupForm` 컴포넌트
- [ ] `ProtectedRoute` 컴포넌트
- [ ] 로그인/회원가입 페이지

---

## 결정이 필요한 사항 🤔

1. **React 프로젝트 위치**: 현재 폴더(`supa_proto_turn_game_01/`)에 바로 생성? vs `app/` 하위 폴더?
   - 권장: **현재 폴더에 바로** (`pnpm create vite . --template react-ts`)
   - 이유: `supabase/` 폴더와 같은 레벨에서 관리하기 편함

2. **게임 종류 미확정**: 아직 구체적인 게임 룰이 없음. 1단계(인증) 완료 후 2단계에서 확정 필요.

3. **패키지 매니저**: `pnpm` 사용 권장 (설치되어 있는지 확인 필요)
   ```bash
   which pnpm || npm install -g pnpm
   ```

---

## 현재 폴더 구조

```
supa_proto_turn_game_01/
├── .claude/
│   └── settings.local.json    # Claude 규칙 (한국어 문서)
├── .env.local                 # Supabase 환경변수 (gitignore 필요!)
├── Readme.md
├── planning/
│   ├── 00-current-status.md  # 이 파일
│   ├── 01-project-overview.md
│   ├── 02-technical-stack.md
│   ├── 03-game-design-considerations.md
│   ├── 04-supabase-architecture.md
│   ├── 05-frontend-architecture.md
│   ├── 06-development-roadmap.md
│   └── 07-checklist.md
└── supabase/
    ├── config.toml            # Supabase 로컬 설정
    └── .temp/
        └── cli-latest
```

---

## Claude에게 전달할 컨텍스트

새 대화 시작 시 다음과 같이 요청하세요:

> "planning/00-current-status.md 파일을 읽고 현재 상태를 파악한 후 [원하는 작업]을 도와줘"

---

## 다음 대화에서 할 작업 제안

**즉시 시작 가능:**
```
"React 프로젝트를 현재 폴더에 생성하고, 의존성 설치, Tailwind 설정,
경로 alias 설정, Supabase 클라이언트 연결까지 0단계를 완료해줘"
```

**그 다음:**
```
"1단계 인증을 시작해줘. profiles 테이블 마이그레이션 파일을 만들고
Supabase에 적용한 후, 로그인/회원가입 UI까지 구현해줘"
```
