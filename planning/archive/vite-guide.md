# Vite 사용 가이드

## Vite란?

Vite는 프론트엔드 개발 도구로, 두 가지 역할을 한다.

1. **개발 서버**: 파일을 수정하면 브라우저에 즉시 반영 (HMR, Hot Module Replacement)
2. **빌드 도구**: 배포용 최적화 파일 생성 (내부적으로 Rollup 사용)

기존 webpack 기반 도구(CRA 등)보다 훨씬 빠른 이유는, 개발 중에는 파일을 번들링하지 않고 브라우저가 직접 ES 모듈을 읽게 하기 때문이다.

---

## 기본 명령어

```bash
pnpm dev        # 개발 서버 시작 (기본 포트: 5173)
pnpm build      # 프로덕션 빌드 → dist/ 폴더에 생성
pnpm preview    # 빌드 결과물을 로컬에서 미리보기
```

---

## 개발 서버 사용법

```bash
pnpm dev
```

실행하면 터미널에 다음과 같이 출력된다:

```
  VITE v7.x.x  ready in 300 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

브라우저에서 `http://localhost:5173` 접속 → 앱이 열린다.

**파일 수정 → 저장하면 브라우저가 자동으로 업데이트된다.** (새로고침 불필요)

개발 서버 종료: 터미널에서 `Ctrl + C`

---

## 환경 변수

`.env.local` 파일에 작성한 변수를 코드에서 사용하려면 **반드시 `VITE_` 접두사**가 필요하다.

```env
# .env.local
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

코드에서는 `import.meta.env`로 접근한다:

```ts
const url = import.meta.env.VITE_SUPABASE_URL
```

> ⚠️ `VITE_` 없이 작성한 변수는 보안상 클라이언트 코드에 노출되지 않는다.
> 서버 비밀번호(`SUPABASEDBPW`) 같은 값은 `VITE_` 없이 작성하면 안전하다.

---

## 프로덕션 빌드

```bash
pnpm build
```

`dist/` 폴더에 배포용 파일이 생성된다:

```
dist/
├── index.html
└── assets/
    ├── index-abc123.js   (JS 번들, 압축됨)
    └── index-def456.css  (CSS 번들)
```

파일명에 해시값이 붙는 이유는 브라우저 캐시 무효화를 위해서다.

---

## 이 프로젝트의 vite.config.ts

```ts
export default defineConfig({
  plugins: [
    react({
      babel: { plugins: ['@emotion/babel-plugin'] }  // Emotion CSS-in-JS 지원
    })
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }  // @/ 로 src/ 접근 가능
  }
})
```

### `@/` 경로 alias 사용법

```ts
// 이것을
import { supabase } from '../../lib/supabase'

// 이렇게 쓸 수 있다
import { supabase } from '@/lib/supabase'
```

폴더 구조가 깊어져도 상대 경로 지옥에 빠지지 않는다.

---

## 개발 흐름 요약

```
pnpm dev 실행
    ↓
브라우저에서 localhost:5173 열기
    ↓
src/ 파일 수정 → 저장
    ↓
브라우저 자동 반영 (HMR)
    ↓
배포 시: pnpm build → dist/ 폴더를 서버에 올리기
```
