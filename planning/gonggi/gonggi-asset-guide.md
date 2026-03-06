# 공기놀이 이미지 에셋 가이드

> API 키 활성화 전까지, Gemini 웹에서 직접 생성할 때 참고하는 문서.
> 생성 후 `public/assets/{category}/` 에 저장하면 코드에서 `/assets/...` 로 접근 가능.

---

## 아트 스타일 컨셉

**"귀여운 모바일 캐주얼 게임"** 느낌. 아래 스타일 접미사를 모든 프롬프트에 공통 적용:

```
cute cartoon style, chibi proportions, soft rounded shapes, thick bold outlines,
cel-shaded with soft highlights, candy-like glossy finish, pastel yet vibrant palette,
Kirby / Animal Crossing aesthetic, game asset, transparent background
```

> 기존 `flat illustration, clean vector, minimalist` → **폐기**.
> 둥글둥글한 형태 + 두꺼운 아웃라인 + 광택 하이라이트 + 캔디 질감이 핵심.

---

## 현재 상태

- 모든 비주얼이 **이모지 기반** — 실제 이미지 0개
- `scripts/lib/presets.ts`에 gonggi 프리셋 7개 정의 (스타일 교체 필요)

---

## 에셋 목록

### A. 게임 돌 — "마법 구슬" (Magic Orbs) — 5개

현재 이모지: `['🟡', '🔴', '🔵', '🟢', '🟣']`

**컨셉**: 투명/반투명 유리 구슬 안에 각각 다른 마법 내용물이 들어있는 공기돌.
구슬 자체는 울퉁불퉁한 천연석 느낌(매끈한 완전 구가 아님)이되, 표면이 유리처럼 투명하게 빛남.

#### 프롬프트 (개별 복사용)

**A1 — 별 구슬 (노랑)**
`sprites/gonggi-stone-yellow.png`
```
A single magical translucent amber glass orb, Korean gonggi jacks stone shape — slightly irregular and lumpy like a natural pebble (not a perfect sphere), inside the orb a tiny glowing golden star slowly rotates surrounded by floating gold dust particles, the glass surface has a big glossy specular highlight and warm inner glow, thick bold outline, three-quarter top-down view, cute cartoon style, cel-shaded, candy-like finish, transparent background
```

**A2 — 하트 구슬 (빨강)**
`sprites/gonggi-stone-red.png`
```
A single magical translucent ruby red glass orb, Korean gonggi jacks stone shape — slightly irregular and lumpy like a natural pebble (not a perfect sphere), inside the orb tiny cute pink and red hearts float and drift gently, the glass surface has a big glossy specular highlight and warm rosy inner glow, thick bold outline, three-quarter top-down view, cute cartoon style, cel-shaded, candy-like finish, transparent background
```

**A3 — 눈꽃 구슬 (파랑)**
`sprites/gonggi-stone-blue.png`
```
A single magical translucent sapphire blue glass orb, Korean gonggi jacks stone shape — slightly irregular and lumpy like a natural pebble (not a perfect sphere), inside the orb delicate snowflake crystals sparkle and shimmer with icy frost particles, the glass surface has a big glossy specular highlight and cool blue inner glow, thick bold outline, three-quarter top-down view, cute cartoon style, cel-shaded, candy-like finish, transparent background
```

**A4 — 새싹 구슬 (초록)**
`sprites/gonggi-stone-green.png`
```
A single magical translucent emerald green glass orb, Korean gonggi jacks stone shape — slightly irregular and lumpy like a natural pebble (not a perfect sphere), inside the orb tiny green leaves and a small sprouting seedling swirl gently with soft pollen particles, the glass surface has a big glossy specular highlight and fresh green inner glow, thick bold outline, three-quarter top-down view, cute cartoon style, cel-shaded, candy-like finish, transparent background
```

**A5 — 달 구슬 (보라)**
`sprites/gonggi-stone-purple.png`
```
A single magical translucent amethyst purple glass orb, Korean gonggi jacks stone shape — slightly irregular and lumpy like a natural pebble (not a perfect sphere), inside the orb a tiny glowing crescent moon floats among soft stardust and tiny twinkling dots, the glass surface has a big glossy specular highlight and mystical purple inner glow, thick bold outline, three-quarter top-down view, cute cartoon style, cel-shaded, candy-like finish, transparent background
```

#### 핵심 요구사항
- **공통 구슬 형태**: 완전한 구가 아닌, 자연석처럼 살짝 울퉁불퉁한 형태 (공기돌 원형 유지)
- **투명 유리 질감**: 표면에 큰 하이라이트 반사 + 내부가 비쳐 보이는 느낌
- **내용물 차이로 구분**: 색상 + 안에 든 물체(별/하트/눈꽃/새싹/달)로 한눈에 식별
- 투명 배경 필수
- 128px 이상으로 생성 (코드에서 40~64px로 축소)
- **같은 세션에서 연속 생성** — 색상/내용물만 교체하여 구슬 질감 통일
- 결과가 너무 매끈한 구슬이면 `lumpy bumpy irregular pebble shape` 강조 추가

---

### B. 배경 — 2개

| # | 파일명 | 프롬프트 | 비율 |
|---|--------|----------|------|
| B1 | `backgrounds/gonggi-floor.png` | Warm cozy wooden floor seen from above, hand-painted watercolor texture, soft oak wood grain, gentle warm lighting with a subtle golden glow, slightly blurred edges giving dreamy bokeh feel, storybook illustration style, pastel warm tones | 1:1 |
| B2 | `backgrounds/gonggi-lobby-bg.png` | Cozy Korean traditional ondol room interior, cute cartoon style, warm afternoon sunlight streaming through hanji paper sliding doors, soft dust particles floating in light beams, wooden maru floor with a colorful yo (Korean mat) in corner, potted plant, nostalgic and dreamy atmosphere, watercolor pastel tones, Studio Ghibli inspired warmth | 9:16 |

---

### C. UI 요소 — 3개

| # | 파일명 | 프롬프트 |
|---|--------|----------|
| C1 | `ui/gonggi-hand-open.png` | Cute chibi cartoon hand with open palm facing up, chubby round fingers spread wide, ready to catch, soft peach skin tone, thick bold outline, tiny motion lines around fingers, cel-shaded with soft highlight, candy-like, transparent background |
| C2 | `ui/gonggi-hand-catch.png` | Cute chibi cartoon hand making a tight fist, chubby fingers curled in catching pose, small impact star burst effect around fist, determined expression vibe, thick bold outline, cel-shaded, transparent background |
| C3 | `ui/gonggi-hand-toss.png` | Cute chibi cartoon hand flicking upward with index finger, chubby round fingers, small upward arrow motion lines, playful tossing gesture, thick bold outline, cel-shaded, transparent background |

---

### D. 변칙 룰 이펙트 — 7개

| # | 룰 | 파일명 | 프롬프트 |
|---|-----|--------|----------|
| D1 | bird-transform | `effects/chaos-bird.png` | Adorable tiny round bird mid-flight, chubby sparrow body like Flappy Bird, stubby wings flapping, surprised big sparkly eyes, small blush cheeks, one gonggi stone transforming into the bird with magic sparkle trail, thick outline, chibi cartoon, cel-shaded, transparent background |
| D2 | bird-transform | `effects/chaos-feather.png` | Single cute fluffy feather drifting down, soft cream and brown colors, gentle S-curve float, tiny sparkles around it, watercolor soft edges, dreamy, transparent background |
| D3 | cat-swipe | `effects/chaos-cat-paw.png` | Chubby orange tabby cat paw reaching down from above, adorable pink toe beans (paw pads) visible, fluffy fur texture, playful mischievous swipe motion, small claw marks trail effect, thick outline, chibi cartoon style, cel-shaded, transparent background |
| D4 | stone-eyes | `effects/chaos-eyes.png` | Pair of huge adorable cartoon googly eyes, round wobbly pupils looking sideways nervously, thick black outlines, one eye slightly bigger than the other for comedic effect, small sweat drop, chibi style, transparent background |
| D5 | fake-clear | `effects/chaos-confetti.png` | Explosion of colorful confetti and streamers, cute star and heart shaped confetti pieces, party popper with ribbon burst, celebratory and over-the-top joyful, candy colors pink gold blue, thick outlines, chibi cartoon, transparent background |
| D6 | split | `effects/chaos-sparkle.png` | Magical poof explosion effect, golden star burst with smaller stars orbiting, cute magic wand sparkle trail, mystical purple and gold particles, anime-style speed lines radiating outward, chibi cartoon, transparent background |
| D7 | constellation | `effects/chaos-star.png` | Single dreamy glowing star, four-pointed celestial star shape, warm golden core fading to soft white glow aura, tiny orbiting sparkle dots, magical and ethereal, watercolor soft edges blending into transparency, anime style, transparent background |

---

### E. 로비/결과 아이콘 — 2개

| # | 파일명 | 프롬프트 |
|---|--------|----------|
| E1 | `icons/gonggi-game-icon.png` | Five adorable colorful gonggi jacks stones bouncing playfully in a circle formation (yellow red blue green purple), each stone has a tiny cute sparkle highlight, squishy candy-like texture, thick outlines, one stone mid-bounce with motion lines, chibi cartoon style, game app icon composition, transparent background |
| E2 | `icons/gonggi-trophy.png` | Cute chibi golden trophy cup overflowing with sparkles and tiny stars, chubby rounded shape, big happy shine on surface, small confetti pieces falling around it, adorable game achievement icon, thick outline, cel-shaded, pastel gold, transparent background |

---

## 생성 순서 (우선순위)

### Phase 1 — 핵심 (게임이 돌아가려면 필요)
1. **A1~A5**: 돌 5개 (한 세션에서 색상만 바꿔가며 연속 생성)
2. **B1**: 바닥 텍스처

### Phase 2 — UX 개선
3. **C1~C3**: 손 아이콘 3종 (한 세션에서 포즈만 변경)
4. **E1**: 게임 아이콘

### Phase 3 — 변칙 이펙트 비주얼 업그레이드
5. **D1~D7**: 변칙 룰 이펙트 이미지 7개

### Phase 4 — 폴리싱
6. **B2**: 로비 배경
7. **E2**: 트로피 아이콘

---

## 이미지 크기/여백 상세 스펙

코드에서의 실제 렌더링 크기를 기반으로 역산한 권장 생성 크기.
**2x 레티나 대응** 기준 — 렌더링 px의 2배 이상으로 생성.

### A. 게임 돌 (sprites)

```
[코드 렌더링 크기 — 상황별]
  바닥 돌 (StoneVisual):     font-size 28px  = 약 28x28
  손 위 돌 (HandStone):      font-size 24px  = 약 24x24
  비행 돌 (FlyingStone):     font-size 36px  = 약 36x36
  비행 묶음 (FlyingGroup):   font-size 28px  = 약 28x28 (per stone)
  홀드 큰 돌 (HoldLarge):    font-size 56px  = 약 56x56  <-- 최대
  홀드 묶음 (HoldGroup):     font-size 40px  = 약 40x40

[z축 스케일링 — 바닥 돌에만 적용]
  z=0.00 (바닥):  scale(1.00), 28px 그대로
  z=0.15 (선택):  scale(0.95) + brightness(1.03)
  z=0.30 (홀드):  scale(0.90) + brightness(1.06)
  z=1.00 (정점):  scale(0.65) + brightness(1.20)
```

| 항목 | 값 |
|------|-----|
| **생성 크기** | **256 x 256 px** (정사각형) |
| **오브젝트 영역** | 중앙 200 x 200 px (전체의 약 78%) |
| **여백 (패딩)** | 사방 28px |
| **오브젝트 위치** | 정중앙 배치 |
| **배경** | 투명 (PNG alpha) |
| **최소 허용** | 128 x 128 px |

```
  256px
  +---------------------------+
  |  28px 여백 (투명)          |
  |  +---------------------+  |
  |  |                     |  |
  |  |    200 x 200 px     |  |  256px
  |  |    오브젝트 영역     |  |
  |  |                     |  |
  |  +---------------------+  |
  |  28px 여백 (투명)          |
  +---------------------------+
```

> **여백이 필요한 이유:**
> - 선택 시 `drop-shadow(0 0 8px)` 글로우가 가장자리에서 잘리지 않도록
> - z축 `brightness` 필터로 빛 번짐 → edge 여유 필요
> - 구슬 내부 발광(inner glow)이 가장자리까지 퍼지므로 여유 공간 확보

---

### B. 배경 (backgrounds)

| 에셋 | 렌더링 컨테이너 | 생성 크기 | 비율 | 여백 |
|------|-----------------|----------|------|------|
| B1 바닥 | BoardArea: max-width 360px, aspect 9:10 | **720 x 800 px** | 9:10 | 없음 (가장자리까지 빈틈없이) |
| B2 로비 | Page 전체 화면 (모바일 세로) | **1080 x 1920 px** | 9:16 | 없음 (가장자리까지 빈틈없이) |

```
B1 - 게임 바닥 (720x800)        B2 - 로비 배경 (1080x1920)
+----------------+              +----------------+
|                |              |  [TopBar 60px]  |
|  가장자리까지   | 800px        |                |
|  빈틈없이      |              |                | 1920px
|  채울 것       |              |                |
|                |              |  [Button 80px]  |
+----------------+              +----------------+
     720px                           1080px
```

> - CSS `background-size: cover`로 적용 → **타일링 불필요**
> - B1: `perspectiveX(15deg)` 변환 적용됨 → 가장자리 10%는 왜곡되므로 핵심 디테일은 중앙에
> - B2: 상단 60px(TopBar) + 하단 80px(StartButton)에 UI 올라옴 → 세이프 영역은 가운데

---

### C. UI 손 아이콘 (ui)

```
[코드 렌더링 크기]
  HandIcon (open):   font-size 24px  (HandArea 컴포넌트)
  HandCatch (fist):  HoldStoneLarge 영역 56px과 겹쳐 표시
  HandToss (flick):  TossButton 내 텍스트 옆 인라인, font-size 16px
```

| 항목 | 값 |
|------|-----|
| **생성 크기** | **256 x 256 px** (정사각형) |
| **오브젝트 영역** | 중앙 200 x 200 px |
| **여백** | 사방 28px |
| **배경** | 투명 |

> 돌(A)과 동일한 스펙. 같은 컨테이너에서 나란히 표시되므로 크기 통일 중요.

---

### D. 변칙 이펙트 (effects)

```
[코드 렌더링 크기 - 이펙트별]
  D1 새:       font-size 36px, 비행 중 scale(1.5) = 최대 54px
  D2 깃털:     font-size 18px (파티클 3개 흩뿌림)
  D3 고양이발:  font-size 28px x4, PawBar 높이 64px / 너비 120%
  D4 눈:       font-size 16px (돌 위 오버레이, 18x18 느낌표 배지)
  D5 컨페티:    font-size 24px (ChaosMessage 내 인라인)
  D6 스파클:    font-size 32~36px (SplitOrigin + 분열 돌 28px)
  D7 별:       font-size 36px (AscendingStone) + SVG 240x240 (별자리)
```

| 에셋 | 생성 크기 | 오브젝트 영역 | 여백 | 비고 |
|------|----------|-------------|------|------|
| D1 새 | **256 x 256** | 중앙 180 x 180 | 사방 38px | scale 1.5 확대 대응. 날개 끝 잘림 방지 |
| D2 깃털 | **128 x 128** | 중앙 80 x 100 | 좌우 24, 상하 14 | S자 커브 = 세로 약간 길어도 OK |
| D3 고양이발 | **256 x 384** | 중앙 200 x 320 | 좌우 28, 상하 32 | **세로로 긴 형태** (2:3). 발바닥+앞발 전체 |
| D4 눈 | **128 x 128** | 중앙 96 x 96 | 사방 16px | 돌 위 오버레이. 작아야 함 |
| D5 컨페티 | **256 x 256** | 중앙 200 x 200 | 사방 28px | 폭발형 = 중앙 집중 방사 |
| D6 스파클 | **256 x 256** | 중앙 200 x 200 | 사방 28px | 방사형 파티클 |
| D7 별 | **128 x 128** | 중앙 96 x 96 | 사방 16px | SVG 별자리 위의 개별 점 |

```
D1 새 (256x256)         D3 고양이발 (256x384)     D2,D4,D7 소형 (128x128)
+---------------+       +---------------+         +-----------+
| 38            |       | 32            |         | 16        |
| +----------+  |       | +-----------+ |         | +-------+ |
| | 180x180  |  | 256   | | 200x320   | | 384    | | 96x96 | | 128
| |          |  |       | |           | |         | |       | |
| +----------+  |       | |           | |         | +-------+ |
| 38            |       | +-----------+ |         | 16        |
+---------------+       | 32            |         +-----------+
     256                +---------------+              128
                             256
```

---

### E. 아이콘 (icons)

| 에셋 | 생성 크기 | 오브젝트 영역 | 여백 | 비고 |
|------|----------|-------------|------|------|
| E1 게임 아이콘 | **512 x 512** | 중앙 420 x 420 | 사방 46px | 홈 카드에서 크게 표시 |
| E2 트로피 | **256 x 256** | 중앙 200 x 200 | 사방 28px | 리더보드 옆 작게 표시 |

---

### 전체 요약 치트시트

| ID | 에셋 | 생성 크기 (px) | 비율 | 여백 | 배경 |
|----|------|---------------|------|------|------|
| A1~A5 | 돌 5종 | 256 x 256 | 1:1 | 사방 28px (11%) | 투명 |
| B1 | 바닥 | 720 x 800 | 9:10 | 없음 | 불투명 |
| B2 | 로비배경 | 1080 x 1920 | 9:16 | 없음 | 불투명 |
| C1~C3 | 손 3종 | 256 x 256 | 1:1 | 사방 28px (11%) | 투명 |
| D1 | 새 | 256 x 256 | 1:1 | 사방 38px (15%) | 투명 |
| D2 | 깃털 | 128 x 128 | 1:1 | 사방 ~20px (16%) | 투명 |
| D3 | 고양이발 | 256 x 384 | 2:3 | 사방 ~30px (11%) | 투명 |
| D4 | 눈 | 128 x 128 | 1:1 | 사방 16px (12%) | 투명 |
| D5 | 컨페티 | 256 x 256 | 1:1 | 사방 28px (11%) | 투명 |
| D6 | 스파클 | 256 x 256 | 1:1 | 사방 28px (11%) | 투명 |
| D7 | 별 | 128 x 128 | 1:1 | 사방 16px (12%) | 투명 |
| E1 | 게임아이콘 | 512 x 512 | 1:1 | 사방 46px (9%) | 투명 |
| E2 | 트로피 | 256 x 256 | 1:1 | 사방 28px (11%) | 투명 |

---

## 생성 팁

### Gemini 웹에서 생성 시
1. 프롬프트를 영어로 입력
2. 생성된 이미지를 PNG로 다운로드
3. `public/assets/{category}/` 폴더에 위 파일명으로 저장
4. 투명 배경이 안 나오면 프롬프트 끝에 `on a pure white background` 추가 후 배경 제거 도구 사용
5. 크기가 맞지 않으면 다운 후 리사이즈 (축소 OK, 확대 비추)

### 여백 확인 체크리스트
- [ ] 오브젝트가 이미지 가장자리에 닿지 않는가?
- [ ] 그림자/글로우/모션라인이 잘리지 않는가?
- [ ] 오브젝트가 이미지 중앙에 배치되어 있는가?
- [ ] 배경이 완전 투명(체크무늬)인가? (B1, B2 제외)

### 일관성 유지
- **돌 5개는 같은 세션에서 연속 생성** (색상/내용물만 교체)
- **손 아이콘 3개도 같은 세션** (포즈 설명만 교체)
- 결과가 너무 복잡하면 `simple composition, single object centered` 추가
- 결과가 너무 밋밋하면 `detailed, highly polished, premium mobile game quality` 추가

### 스타일 조절 키워드
| 더 귀엽게 | 더 선명하게 | 더 부드럽게 |
|-----------|------------|------------|
| `kawaii` | `high contrast` | `watercolor wash` |
| `baby-like proportions` | `bold saturated colors` | `dreamy soft focus` |
| `tiny blush cheeks` | `sharp cel-shading` | `pastel muted palette` |
| `sparkly eyes` | `crisp edges` | `gentle gradient` |

---

## 생성 스크립트 (복사-붙여넣기용)

API 키 활성화 후 터미널에서 바로 실행 가능. 활성화 전에는 프롬프트만 복사해서 Gemini 웹에서 사용.

### Phase 1 — 돌 5개 + 바닥

```bash
# A1: 별 구슬 (노랑) — 256x256
pnpm asset:gen \
  -o sprites/gonggi-stone-yellow.png \
  -s 256x256 \
  -p "A single magical translucent amber glass orb, Korean gonggi jacks stone shape — slightly irregular and lumpy like a natural pebble (not a perfect sphere), inside the orb a tiny glowing golden star slowly rotates surrounded by floating gold dust particles, the glass surface has a big glossy specular highlight and warm golden inner glow, thick bold outline, three-quarter top-down view, cute cartoon style, cel-shaded, candy-like finish, transparent background"

# A2: 하트 구슬 (빨강) — 256x256
pnpm asset:gen \
  -o sprites/gonggi-stone-red.png \
  -s 256x256 \
  -p "A single magical translucent ruby red glass orb, Korean gonggi jacks stone shape — slightly irregular and lumpy like a natural pebble (not a perfect sphere), inside the orb tiny cute pink and red hearts float and drift gently, the glass surface has a big glossy specular highlight and warm rosy inner glow, thick bold outline, three-quarter top-down view, cute cartoon style, cel-shaded, candy-like finish, transparent background"

# A3: 눈꽃 구슬 (파랑) — 256x256
pnpm asset:gen \
  -o sprites/gonggi-stone-blue.png \
  -s 256x256 \
  -p "A single magical translucent sapphire blue glass orb, Korean gonggi jacks stone shape — slightly irregular and lumpy like a natural pebble (not a perfect sphere), inside the orb delicate snowflake crystals sparkle and shimmer with icy frost particles, the glass surface has a big glossy specular highlight and cool blue inner glow, thick bold outline, three-quarter top-down view, cute cartoon style, cel-shaded, candy-like finish, transparent background"

# A4: 새싹 구슬 (초록) — 256x256
pnpm asset:gen \
  -o sprites/gonggi-stone-green.png \
  -s 256x256 \
  -p "A single magical translucent emerald green glass orb, Korean gonggi jacks stone shape — slightly irregular and lumpy like a natural pebble (not a perfect sphere), inside the orb tiny green leaves and a small sprouting seedling swirl gently with soft pollen particles, the glass surface has a big glossy specular highlight and fresh green inner glow, thick bold outline, three-quarter top-down view, cute cartoon style, cel-shaded, candy-like finish, transparent background"

# A5: 달 구슬 (보라) — 256x256
pnpm asset:gen \
  -o sprites/gonggi-stone-purple.png \
  -s 256x256 \
  -p "A single magical translucent amethyst purple glass orb, Korean gonggi jacks stone shape — slightly irregular and lumpy like a natural pebble (not a perfect sphere), inside the orb a tiny glowing crescent moon floats among soft stardust and tiny twinkling dots, the glass surface has a big glossy specular highlight and mystical purple inner glow, thick bold outline, three-quarter top-down view, cute cartoon style, cel-shaded, candy-like finish, transparent background"

# B1: 바닥 텍스처 — 720x800
pnpm asset:gen \
  -o backgrounds/gonggi-floor.png \
  -s 720x800 \
  -p "Warm cozy wooden floor seen from above, hand-painted watercolor texture, soft oak wood grain, gentle warm lighting with a subtle golden glow, slightly blurred edges giving dreamy bokeh feel, storybook illustration style, pastel warm tones"
```

### Phase 2 — 손 아이콘 + 게임 아이콘

```bash
# C1: 손 펼침 — 256x256
pnpm asset:gen \
  -o ui/gonggi-hand-open.png \
  -s 256x256 \
  -p "Cute chibi cartoon hand with open palm facing up, chubby round fingers spread wide, ready to catch, soft peach skin tone, thick bold outline, tiny motion lines around fingers, cel-shaded with soft highlight, candy-like, cute cartoon style, chibi proportions, soft rounded shapes, game asset, transparent background"

# C2: 손 잡기 — 256x256
pnpm asset:gen \
  -o ui/gonggi-hand-catch.png \
  -s 256x256 \
  -p "Cute chibi cartoon hand making a tight fist, chubby fingers curled in catching pose, small impact star burst effect around fist, determined expression vibe, thick bold outline, cel-shaded, cute cartoon style, chibi proportions, soft rounded shapes, game asset, transparent background"

# C3: 손 던지기 — 256x256
pnpm asset:gen \
  -o ui/gonggi-hand-toss.png \
  -s 256x256 \
  -p "Cute chibi cartoon hand flicking upward with index finger, chubby round fingers, small upward arrow motion lines, playful tossing gesture, thick bold outline, cel-shaded, cute cartoon style, chibi proportions, soft rounded shapes, game asset, transparent background"

# E1: 게임 아이콘 — 512x512
pnpm asset:gen \
  -o icons/gonggi-game-icon.png \
  -s 512x512 \
  -p "Five adorable colorful gonggi jacks stones bouncing playfully in a circle formation (yellow red blue green purple), each stone has a tiny cute sparkle highlight, squishy candy-like texture, thick outlines, one stone mid-bounce with motion lines, chibi cartoon style, game app icon composition, cute cartoon style, chibi proportions, soft rounded shapes, game asset, transparent background"
```

### Phase 3 — 변칙 이펙트 7개

```bash
# D1: 새 — 256x256
pnpm asset:gen \
  -o effects/chaos-bird.png \
  -s 256x256 \
  -p "Adorable tiny round bird mid-flight, chubby sparrow body like Flappy Bird, stubby wings flapping, surprised big sparkly eyes, small blush cheeks, one gonggi stone transforming into the bird with magic sparkle trail, thick outline, chibi cartoon, cel-shaded, cute cartoon style, chibi proportions, soft rounded shapes, game asset, transparent background"

# D2: 깃털 — 128x128
pnpm asset:gen \
  -o effects/chaos-feather.png \
  -s 128x128 \
  -p "Single cute fluffy feather drifting down, soft cream and brown colors, gentle S-curve float, tiny sparkles around it, watercolor soft edges, dreamy, transparent background"

# D3: 고양이발 — 256x384 (3:4)
pnpm asset:gen \
  -o effects/chaos-cat-paw.png \
  -s 256x384 \
  -a 3:4 \
  -p "Chubby orange tabby cat paw reaching down from above, adorable pink toe beans (paw pads) visible, fluffy fur texture, playful mischievous swipe motion, small claw marks trail effect, thick outline, chibi cartoon style, cel-shaded, cute cartoon style, chibi proportions, soft rounded shapes, game asset, transparent background"

# D4: 눈 — 128x128
pnpm asset:gen \
  -o effects/chaos-eyes.png \
  -s 128x128 \
  -p "Pair of huge adorable cartoon googly eyes, round wobbly pupils looking sideways nervously, thick black outlines, one eye slightly bigger than the other for comedic effect, small sweat drop, chibi style, cute cartoon style, chibi proportions, soft rounded shapes, game asset, transparent background"

# D5: 컨페티 — 256x256
pnpm asset:gen \
  -o effects/chaos-confetti.png \
  -s 256x256 \
  -p "Explosion of colorful confetti and streamers, cute star and heart shaped confetti pieces, party popper with ribbon burst, celebratory and over-the-top joyful, candy colors pink gold blue, thick outlines, chibi cartoon, cute cartoon style, chibi proportions, soft rounded shapes, game asset, transparent background"

# D6: 스파클 — 256x256
pnpm asset:gen \
  -o effects/chaos-sparkle.png \
  -s 256x256 \
  -p "Magical poof explosion effect, golden star burst with smaller stars orbiting, cute magic wand sparkle trail, mystical purple and gold particles, anime-style speed lines radiating outward, chibi cartoon, cute cartoon style, chibi proportions, soft rounded shapes, game asset, transparent background"

# D7: 별 — 128x128
pnpm asset:gen \
  -o effects/chaos-star.png \
  -s 128x128 \
  -p "Single dreamy glowing star, four-pointed celestial star shape, warm golden core fading to soft white glow aura, tiny orbiting sparkle dots, magical and ethereal, watercolor soft edges blending into transparency, anime style, transparent background"
```

### Phase 4 — 폴리싱

```bash
# B2: 로비 배경 — 1080x1920 (9:16)
pnpm asset:gen \
  -o backgrounds/gonggi-lobby-bg.png \
  -s 1080x1920 \
  -a 9:16 \
  -p "Cozy Korean traditional ondol room interior, cute cartoon style, warm afternoon sunlight streaming through hanji paper sliding doors, soft dust particles floating in light beams, wooden maru floor with a colorful yo (Korean mat) in corner, potted plant, nostalgic and dreamy atmosphere, watercolor pastel tones, Studio Ghibli inspired warmth"

# E2: 트로피 — 256x256
pnpm asset:gen \
  -o icons/gonggi-trophy.png \
  -s 256x256 \
  -p "Cute chibi golden trophy cup overflowing with sparkles and tiny stars, chubby rounded shape, big happy shine on surface, small confetti pieces falling around it, adorable game achievement icon, thick outline, cel-shaded, pastel gold, cute cartoon style, chibi proportions, soft rounded shapes, game asset, transparent background"
```

### 한번에 전체 생성 (API 키 활성화 후)

```bash
pnpm asset:batch --preset gonggi
```

---

## 코드 적용 (에셋 생성 후)

에셋이 준비되면 GonggiBoard.tsx에서 이모지 -> 이미지로 교체하는 작업이 필요합니다.
주요 변경 포인트:

1. `STONE_EMOJIS` 배열 -> `STONE_IMAGES` 배열 (이미지 경로)
2. 텍스트 노드 -> `<img>` 태그 교체
3. 변칙 이펙트 컴포넌트 내 이모지 -> 이미지 교체
4. GonggiPage 로비의 이모지 아이콘 교체

이 작업은 별도 티켓으로 관리 예정입니다.

---

## 총 에셋 수: 19개

| 카테고리 | 수량 |
|----------|------|
| sprites (돌) | 5 |
| backgrounds | 2 |
| ui (손) | 3 |
| effects (변칙) | 7 |
| icons | 2 |
| **합계** | **19** |
