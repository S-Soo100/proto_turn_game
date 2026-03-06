# 이미지 에셋 생성 규칙

## 트리거
사용자가 이미지/에셋/아이콘/배경/스프라이트 생성을 요청하면 이 규칙을 따른다.

## 워크플로우

### 1. 요구사항 확인
사용자에게 아래 정보를 확인한다 (명시되지 않은 항목만 질문):

- **이미지 내용**: 무엇을 그릴지 (예: "공기돌", "배경", "버튼 아이콘")
- **카테고리**: icons / backgrounds / sprites / ui / effects
- **비율**: 1:1 (기본) / 3:4 / 4:3 / 9:16 / 16:9
- **아트 스타일**: 기본값은 "flat illustration, clean vector art, minimalist, vibrant colors" — 사용자가 다른 스타일을 원하면 반영

### 2. 프롬프트 작성
- 영어로 작성 (Gemini API는 영어 프롬프트가 품질 최상)
- 게임 에셋에 적합하도록 구체적으로 작성
- 기본 스타일 접미사: `flat illustration style, clean vector art, minimalist, vibrant colors, game asset, transparent background`
- 사용자가 다른 스타일을 요청하면 접미사를 교체

### 3. 파일명 결정
- 카테고리에 맞는 폴더에 저장: `public/assets/{category}/{fileName}.png`
- 파일명은 kebab-case 영어: `gonggi-stone-red.png`, `home-bg.png`

### 4. 생성 실행
```bash
pnpm asset:gen --prompt "{프롬프트}" --output {category}/{fileName}.png
```
- 비율이 1:1이 아닌 경우: `--aspect {ratio}` 추가
- 에러 발생 시 사용자에게 원인 안내 (API key 미설정, 안전 필터링 등)

### 5. 결과 확인
- 생성된 파일 경로를 사용자에게 알려준다
- 이미지를 Read 도구로 열어서 결과를 보여준다
- 만족스럽지 않으면 프롬프트를 조정하여 재생성

## 배치 생성
여러 에셋을 한번에 요청하면:
```bash
pnpm asset:batch --preset {preset}    # common / gonggi / board / reaction / all
pnpm asset:batch --category {cat}     # icons / backgrounds / sprites / ui / effects
```

## 프리셋 목록 확인
```bash
pnpm asset:batch --preset all --list
```

## 주의사항
- `GEMINI_API_KEY`가 `.env.local`에 설정되어 있어야 함
- 생성된 이미지는 `public/assets/` 하위에 저장 → 프로젝트에서 `/assets/...`로 접근 가능
- 안전 필터에 걸리면 프롬프트를 수정하여 재시도
