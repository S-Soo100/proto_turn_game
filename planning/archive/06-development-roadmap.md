# 개발 로드맵

## 개요

이 로드맵은 턴제 전략 게임 개발을 단계별로 나누어 각 단계마다 구체적인 산출물과 마일스톤을 정의합니다.

## 0단계: 프로젝트 설정 및 기반

### 목표
- 개발 환경 설정
- 프로젝트 구조 초기화
- 필수 도구 구성
- 배포 파이프라인 구축

### 작업

#### 1. 환경 설정
- [ ] Node.js 설치 (v18+)
- [ ] pnpm 또는 npm 설치
- [ ] 코드 에디터 설정 (VS Code 권장)
- [ ] Git 설치 및 구성

#### 2. 프로젝트 초기화
- [ ] Create Vite + React + TypeScript project
  ```bash
  pnpm create vite supa-turn-game --template react-ts
  ```
- [ ] Set up folder structure (see Frontend Architecture doc)
- [ ] Configure path aliases in tsconfig.json
- [ ] Initialize Git repository
- [ ] Create .gitignore file

#### 3. 핵심 의존성 설치
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@supabase/supabase-js": "^2.38.0",
    "zustand": "^4.4.7",
    "framer-motion": "^10.16.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.1.0"
  }
}
```

#### 4. Tailwind CSS 설정
- [ ] Tailwind 및 의존성 설치
- [ ] tailwind.config.js 생성
- [ ] PostCSS 설정
- [ ] CSS에 Tailwind 디렉티브 추가

#### 5. Supabase 설정
- [ ] Supabase 계정 생성
- [ ] 새 Supabase 프로젝트 생성
- [ ] 프로젝트 URL 및 anon key 저장
- [ ] Supabase CLI 설치
- [ ] Supabase 로컬 초기화
  ```bash
  supabase init
  supabase login
  supabase link --project-ref your-project-ref
  ```

#### 6. 환경 변수 설정
- [ ] .env.local 파일 생성
- [ ] Supabase 자격증명 추가
- [ ] .env.example 템플릿 생성
- [ ] .env.local을 .gitignore에 추가

#### 7. 코드 품질 도구 설정
- [ ] ESLint 구성
- [ ] Prettier 구성
- [ ] 커밋 전 훅을 위한 Husky 설정
- [ ] lint-staged 구성

#### 8. CI/CD 설정
- [ ] GitHub 저장소 생성
- [ ] GitHub Actions 워크플로우 설정
- [ ] 자동화된 테스팅 구성
- [ ] Vercel/Netlify 배포 설정
- [ ] 배포를 Git에 연결

### 산출물
- ✅ 실행 가능한 개발 환경
- ✅ 프로젝트 구조 완비
- ✅ Supabase 프로젝트 연결됨
- ✅ CI/CD 파이프라인 작동
- ✅ 기본 랜딩 페이지 배포됨

---

## 1단계: 인증 및 사용자 관리

### 목표
- 사용자 인증 구현
- 사용자 프로필 생성
- 인증 UI 컴포넌트 제작

### Tasks

#### 1. Database Schema
- [ ] Create profiles table migration
- [ ] Set up RLS policies for profiles
- [ ] Create database trigger for profile creation
- [ ] Apply migration to Supabase

#### 2. Supabase Client Configuration
- [ ] Create Supabase client singleton
- [ ] Set up auth event listeners
- [ ] Configure auth persistence

#### 3. Auth Store (Zustand)
- [ ] Create auth store
- [ ] Implement sign-in action
- [ ] Implement sign-up action
- [ ] Implement sign-out action
- [ ] Add profile management actions

#### 4. Auth Components
- [ ] Create LoginForm component
- [ ] Create SignupForm component
- [ ] Create ProtectedRoute component
- [ ] Create Auth layout/page

#### 5. Auth Hook
- [ ] Create useAuth hook
- [ ] Implement session management
- [ ] Add profile fetching
- [ ] Add auth state synchronization

#### 6. Profile Management
- [ ] Create Profile page
- [ ] Add profile editing UI
- [ ] Implement username validation
- [ ] Add avatar upload (optional)

#### 7. Testing
- [ ] Test sign-up flow
- [ ] Test sign-in flow
- [ ] Test sign-out flow
- [ ] Test protected routes
- [ ] Test profile updates

### Deliverables
- ✅ Working authentication system
- ✅ User profile creation and editing
- ✅ Protected routes
- ✅ Auth UI components

### Estimated Completion
**3-5 days**

---

## 2단계: 핵심 게임 메커니즘

### 목표
- 게임 규칙 설계 및 구현
- 게임 로직 제작 (UI와 분리)
- 기본 게임 상태 관리 구축

### Tasks

#### 1. Game Design
- [ ] Finalize game rules (board, pieces, win conditions)
- [ ] Document game mechanics
- [ ] Create diagrams/flowcharts
- [ ] Define data structures

#### 2. Game Logic Implementation
- [ ] Create board initialization logic
- [ ] Implement piece movement rules
- [ ] Implement move validation
- [ ] Create win condition checker
- [ ] Write comprehensive tests for game logic

#### 3. Game Types & Interfaces
- [ ] Define TypeScript types for game state
- [ ] Define move types
- [ ] Define piece types
- [ ] Define board types

#### 4. Database Schema
- [ ] Create games table migration
- [ ] Create moves table migration
- [ ] Set up RLS policies
- [ ] Create game-related database functions
- [ ] Apply migrations

#### 5. Game Store (Zustand)
- [ ] Create game store
- [ ] Implement game state management
- [ ] Add move validation
- [ ] Add optimistic updates
- [ ] Implement error handling

#### 6. Testing
- [ ] Unit tests for all game logic
- [ ] Test edge cases
- [ ] Test invalid moves
- [ ] Test win conditions
- [ ] Performance testing

### Deliverables
- ✅ Complete game logic implementation
- ✅ Comprehensive test coverage
- ✅ Game state management
- ✅ Database schema for games

### Estimated Completion
**5-7 days**

---

## 3단계: 게임 UI 및 싱글플레이어

### 목표
- 게임 보드 UI 제작
- 게임 렌더링 구현
- 기본 AI와 싱글플레이어 추가

### Tasks

#### 1. Game UI Components
- [ ] Create GameBoard component
- [ ] Create GameCell component
- [ ] Create GamePiece component
- [ ] Create TurnIndicator component
- [ ] Create GameInfo component
- [ ] Create MoveHistory component

#### 2. Game Page
- [ ] Create Game page layout
- [ ] Add game board rendering
- [ ] Implement click handlers
- [ ] Add move selection UI
- [ ] Show valid moves highlight

#### 3. Game Interactions
- [ ] Implement piece selection
- [ ] Show valid moves
- [ ] Execute moves on click
- [ ] Add move animations
- [ ] Add sound effects (optional)

#### 4. Game Flow
- [ ] Create new game flow
- [ ] Implement game start
- [ ] Handle turn progression
- [ ] Detect game end
- [ ] Show game result

#### 5. Basic AI (Easy Difficulty)
- [ ] Implement random valid move AI
- [ ] Create AI service/hook
- [ ] Integrate AI with game flow
- [ ] Add AI turn indicator

#### 6. Game Controls
- [ ] Add resign button
- [ ] Add move undo (if applicable)
- [ ] Add game options menu
- [ ] Add return to menu

#### 7. Responsive Design
- [ ] Desktop layout
- [ ] Tablet layout
- [ ] Mobile layout
- [ ] Test on multiple devices

#### 8. Testing
- [ ] Test all user interactions
- [ ] Test AI moves
- [ ] Test game completion
- [ ] Visual regression testing

### Deliverables
- ✅ Fully functional game UI
- ✅ Playable single-player vs AI
- ✅ Responsive design
- ✅ Smooth animations

### Estimated Completion
**7-10 days**

---

## 4단계: 고급 AI

### 목표
- 보통 및 어려운 AI 난이도 구현
- AI 성능 최적화

### Tasks

#### 1. AI Architecture
- [ ] Refactor AI into modular system
- [ ] Create AI difficulty levels
- [ ] Implement strategy pattern

#### 2. Medium AI
- [ ] Implement minimax algorithm (depth 2-3)
- [ ] Create position evaluation function
- [ ] Add simple heuristics
- [ ] Test and balance

#### 3. Hard AI
- [ ] Implement alpha-beta pruning
- [ ] Increase search depth (4-5)
- [ ] Add advanced heuristics
- [ ] Implement transposition table (optional)
- [ ] Test and balance

#### 4. Performance Optimization
- [ ] Profile AI performance
- [ ] Optimize evaluation function
- [ ] Add move ordering
- [ ] Use web workers (if needed)

#### 5. AI Tuning
- [ ] Playtest all difficulty levels
- [ ] Adjust AI strength
- [ ] Ensure fun factor
- [ ] Balance difficulty curve

#### 6. UI Updates
- [ ] Add AI difficulty selector
- [ ] Show AI "thinking" indicator
- [ ] Add AI move delay for realism
- [ ] Display AI evaluation (dev mode)

### Deliverables
- ✅ Three AI difficulty levels
- ✅ Challenging hard AI
- ✅ Optimized performance
- ✅ Balanced gameplay

### Estimated Completion
**5-7 days**

---

## 5단계: 비동기 PvP

### 목표
- 매치메이킹 구현
- 비동기 멀티플레이어 활성화
- 실시간 게임 업데이트 추가

### Tasks

#### 1. Database Schema
- [ ] Create matchmaking_queue table
- [ ] Create game_invitations table
- [ ] Create notifications table
- [ ] Set up RLS policies
- [ ] Apply migrations

#### 2. Matchmaking System
- [ ] Create matchmaking queue UI
- [ ] Implement queue join/leave
- [ ] Create matchmaking Edge Function
- [ ] Set up matchmaking cron job
- [ ] Test matchmaking flow

#### 3. Real-time Subscriptions
- [ ] Create useRealtime hook
- [ ] Subscribe to game updates
- [ ] Subscribe to move updates
- [ ] Subscribe to notifications
- [ ] Handle connection states

#### 4. Game Invitations
- [ ] Create invite UI
- [ ] Send invitation
- [ ] Accept/decline invitation
- [ ] Create game from invitation
- [ ] Notification on invite

#### 5. Turn Notifications
- [ ] Implement in-app notifications
- [ ] Add email notifications (optional)
- [ ] Create notification center
- [ ] Mark notifications as read
- [ ] Notification badges

#### 6. Active Games List
- [ ] Create "My Games" page
- [ ] Show active games
- [ ] Show games waiting for player
- [ ] Show completed games
- [ ] Filter and sort games

#### 7. Turn Timer
- [ ] Implement turn time tracking
- [ ] Show time remaining
- [ ] Create timeout handler Edge Function
- [ ] Auto-forfeit on timeout
- [ ] Set up timeout cron job

#### 8. Game History
- [ ] Create game history page
- [ ] Show move-by-move replay
- [ ] Add game statistics
- [ ] Implement pagination

#### 9. Testing
- [ ] Test matchmaking
- [ ] Test real-time updates
- [ ] Test notifications
- [ ] Test timeout handling
- [ ] Test with multiple concurrent games

### Deliverables
- ✅ Working matchmaking system
- ✅ Real-time game updates
- ✅ Notification system
- ✅ Turn timer and timeout handling
- ✅ Game history

### Estimated Completion
**10-14 days**

---

## 6단계: 진행 시스템 및 참여도

### 목표
- 랭킹/ELO 시스템 추가
- 업적 구현
- 리더보드 생성
- 플레이어 통계 추가

### Tasks

#### 1. ELO Rating System
- [ ] Implement ELO calculation function
- [ ] Update ratings after games
- [ ] Create rating history
- [ ] Display rating on profile

#### 2. Leaderboard
- [ ] Create leaderboard page
- [ ] Show top players by rating
- [ ] Add filters (weekly, monthly, all-time)
- [ ] Implement pagination
- [ ] Show player rank

#### 3. Achievements
- [ ] Design achievement system
- [ ] Create achievements table
- [ ] Define achievement criteria
- [ ] Implement achievement checker
- [ ] Create achievement UI

#### 4. Player Statistics
- [ ] Track detailed stats
- [ ] Create statistics page
- [ ] Show win/loss ratio
- [ ] Display favorite strategies
- [ ] Add charts and graphs

#### 5. Profile Enhancements
- [ ] Show achievements on profile
- [ ] Display statistics
- [ ] Add rating graph
- [ ] Show recent games

#### 6. Notifications
- [ ] Achievement unlock notifications
- [ ] Rank change notifications
- [ ] Milestone notifications

### Deliverables
- ✅ ELO ranking system
- ✅ Leaderboards
- ✅ Achievement system
- ✅ Detailed statistics

### Estimated Completion
**5-7 days**

---

## 7단계: 완성도 및 최적화

### 목표
- UX/UI 개선
- 성능 최적화
- 버그 수정
- 편의 기능 추가

### Tasks

#### 1. UI/UX Polish
- [ ] Consistent styling across app
- [ ] Smooth transitions
- [ ] Better loading states
- [ ] Error state handling
- [ ] Empty state designs

#### 2. Animations
- [ ] Polish move animations
- [ ] Add page transitions
- [ ] Notification animations
- [ ] Micro-interactions

#### 3. Performance Optimization
- [ ] Audit bundle size
- [ ] Implement code splitting
- [ ] Optimize images
- [ ] Add lazy loading
- [ ] Implement caching strategies

#### 4. Accessibility
- [ ] Keyboard navigation
- [ ] ARIA labels
- [ ] Screen reader testing
- [ ] Color contrast fixes
- [ ] Focus management

#### 5. Mobile Optimization
- [ ] Touch-friendly controls
- [ ] Mobile-specific UI
- [ ] Performance on mobile
- [ ] PWA setup (optional)

#### 6. Quality of Life
- [ ] Tutorial/onboarding
- [ ] Help documentation
- [ ] Settings page
- [ ] Theme switching (light/dark)
- [ ] Sound toggle

#### 7. Bug Fixing
- [ ] Review and fix reported bugs
- [ ] Cross-browser testing
- [ ] Edge case handling
- [ ] Error boundary improvements

#### 8. Testing
- [ ] E2E testing with Playwright
- [ ] Cross-browser testing
- [ ] Performance testing
- [ ] Load testing

### Deliverables
- ✅ Polished UI/UX
- ✅ Optimized performance
- ✅ Accessibility compliant
- ✅ Bug-free experience

### Estimated Completion
**7-10 days**

---

## 8단계: 출시 준비

### 목표
- 공개 출시 준비
- 모니터링 설정
- 마케팅 자료 제작
- 최종 테스팅

### Tasks

#### 1. Monitoring & Analytics
- [ ] Set up error tracking (Sentry)
- [ ] Configure analytics (PostHog/Plausible)
- [ ] Set up performance monitoring
- [ ] Create dashboards

#### 2. Documentation
- [ ] Write user guide
- [ ] Create FAQ
- [ ] Document game rules
- [ ] Write API documentation (if needed)

#### 3. Marketing Materials
- [ ] Create landing page
- [ ] Write game description
- [ ] Create screenshots
- [ ] Record demo video
- [ ] Prepare press kit

#### 4. Legal & Privacy
- [ ] Create privacy policy
- [ ] Create terms of service
- [ ] Add cookie consent (if needed)
- [ ] GDPR compliance check

#### 5. Final Testing
- [ ] Comprehensive QA testing
- [ ] Beta testing with users
- [ ] Security audit
- [ ] Performance testing under load

#### 6. Launch Checklist
- [ ] Domain setup
- [ ] SSL certificate
- [ ] Production environment configured
- [ ] Database backups enabled
- [ ] Monitoring alerts configured
- [ ] Support email set up

### Deliverables
- ✅ Production-ready application
- ✅ Monitoring and analytics
- ✅ Documentation complete
- ✅ Ready for public launch

### Estimated Completion
**3-5 days**

---

## 출시 이후: 반복 및 성장

### 지속적인 작업
- [ ] Monitor user feedback
- [ ] Fix bugs and issues
- [ ] Balance gameplay based on data
- [ ] Add new features based on requests
- [ ] Regular content updates
- [ ] Community engagement

### 고려할 미래 기능
- [ ] Tournament mode
- [ ] Custom game modes
- [ ] Social features (friends, chat)
- [ ] Replay system
- [ ] Spectator mode
- [ ] Mobile native apps
- [ ] Additional game variants
- [ ] Cosmetic customization

---

## 전체 예상 일정

| 단계 | 소요 기간 | 누적 |
|------|----------|------|
| 0단계: 설정 | 1-2일 | 1-2일 |
| 1단계: 인증 | 3-5일 | 4-7일 |
| 2단계: 게임 로직 | 5-7일 | 9-14일 |
| 3단계: 게임 UI | 7-10일 | 16-24일 |
| 4단계: AI | 5-7일 | 21-31일 |
| 5단계: PvP | 10-14일 | 31-45일 |
| 6단계: 진행 시스템 | 5-7일 | 36-52일 |
| 7단계: 완성도 | 7-10일 | 43-62일 |
| 8단계: 출시 준비 | 3-5일 | 46-67일 |

**총 6-9주** (풀타임 기준)

**Note**: Timeline assumes dedicated full-time work. Adjust based on:
- Available development time per day
- Team size (solo vs team)
- Prior experience with tech stack
- Scope adjustments
- Unexpected challenges

---

## 마일스톤 체크포인트

### 마일스톤 1: 플레이 가능한 프로토타입
- ✅ 기본 게임이 로컬에서 작동
- ✅ 간단한 AI와 싱글플레이어
- ✅ 핵심 게임 루프 기능
- **목표**: 3단계 말

### 마일스톤 2: 멀티플레이어 알파
- ✅ PvP 매치메이킹 작동
- ✅ 실시간 게임 업데이트
- ✅ 턴 알림
- **목표**: 5단계 말

### 마일스톤 3: 기능 완성
- ✅ 모든 핵심 기능 구현
- ✅ 랭킹 및 업적
- ✅ 완성도 및 최적화 완료
- **목표**: 7단계 말

### 마일스톤 4: 출시 준비 완료
- ✅ 모든 테스팅 완료
- ✅ 모니터링 구축
- ✅ 문서화 완료
- **목표**: 8단계 말

---

## 리스크 관리

### 기술적 리스크
- **AI가 너무 어렵거나 쉬움**: 충분한 플레이테스팅으로 완화
- **실시간 동기화 문제**: Supabase Realtime 활용, 철저한 테스팅
- **성능 문제**: 조기 프로파일링, 지속적인 최적화

### 범위 리스크
- **기능 범위 확장**: 로드맵 준수, 좋은 기능은 나중으로 연기
- **일정 지연**: 정기적 검토, 필요 시 범위 조정
- **번아웃**: 휴식 취하기, 서두르지 않기

### 품질 리스크
- **불충분한 테스팅**: 적절한 테스팅 시간 확보
- **나쁜 UX**: 빠른 사용자 피드백 수집
- **기술 부채**: 진행하면서 리팩터링, 미루지 않기

---

## 성공 지표

진행 상황을 측정하기 위한 지표:

### 개발 지표
- [ ] 코드 커버리지 >80%
- [ ] 빌드 시간 <30초
- [ ] 모든 TypeScript 오류 해결
- [ ] 프로덕션에서 콘솔 오류 없음

### 성능 지표
- [ ] Lighthouse 점수 >90
- [ ] 첫 번째 콘텐츠 페인트 <1.5초
- [ ] 상호작용 가능 시간 <3초
- [ ] 번들 크기 <500KB

### 품질 지표
- [ ] 치명적 버그 없음
- [ ] 알려진 사소한 버그 <5개
- [ ] 접근성 점수 >95
- [ ] 크로스 브라우저 호환성

---

## 유연성 및 적응

이 로드맵은 엄격한 계획이 아닌 가이드입니다:

- **학습에 따라 조정**: 작동하지 않으면 방향 전환
- **사용자 가치 우선**: 가장 중요한 기능에 집중
- **민첩성 유지**: 정기적인 검토와 조정
- **속도를 위해 품질을 희생하지 않기**: 버그가 있는 조기 출시보다 품질 있는 지연 출시가 낫다

개발에 행운을!
