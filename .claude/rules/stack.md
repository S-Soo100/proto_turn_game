# 기술 스택 & Supabase 프로젝트 정보

## 스택
- **Frontend**: React 19 + TypeScript + Vite 7
- **Styling**: @emotion/styled (CSS-in-JS, Tailwind 없음)
- **State**: Zustand
- **Animation**: Framer Motion
- **Routing**: React Router v7
- **Backend**: Supabase (Auth + DB + Realtime + Storage)
- **Package manager**: pnpm

## Supabase 프로젝트
- **Project ID**: mizztmfzukofxiyrgall
- **URL**: https://mizztmfzukofxiyrgall.supabase.co
- **Dashboard**: https://supabase.com/dashboard/project/mizztmfzukofxiyrgall
- **SQL Editor**: https://supabase.com/dashboard/project/mizztmfzukofxiyrgall/sql/new

## 주요 제약사항
- DB 스키마 변경은 **Supabase SQL Editor**에서 직접 실행 (CLI IPv6 연결 불가 — `no route to host`)
- Supabase anon key: `sb_publishable_...` 형식 아님 → Dashboard → Settings → API → `eyJ...` JWT 형식 사용
- `.env.local`에 같은 변수명 중복 시 파싱 오류 → 한 줄만 유지
- SQL 파일 주석은 영어로 작성 (한국어 주석 → UTF-8 인코딩 오류 발생 가능)
