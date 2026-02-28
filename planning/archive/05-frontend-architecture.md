# 프론트엔드 아키텍처

## 개요

이 문서는 턴제 전략 게임의 React 기반 프론트엔드 아키텍처를 정리합니다. 프로젝트 구조, 컴포넌트 구성, 상태 관리, 핵심 구현 패턴을 포함합니다.

## 프로젝트 구조

```
src/
├── main.tsx                 # Application entry point
├── App.tsx                  # Root component with routing
├── vite-env.d.ts           # Vite type definitions
│
├── assets/                  # Static assets
│   ├── images/
│   ├── sounds/
│   └── fonts/
│
├── components/              # Reusable UI components
│   ├── ui/                 # Base UI components (buttons, inputs, etc.)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Card.tsx
│   │   ├── Avatar.tsx
│   │   └── index.ts
│   │
│   ├── layout/             # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── MainLayout.tsx
│   │
│   ├── game/               # Game-specific components
│   │   ├── GameBoard.tsx
│   │   ├── GamePiece.tsx
│   │   ├── GameCell.tsx
│   │   ├── MoveHistory.tsx
│   │   ├── GameInfo.tsx
│   │   └── TurnIndicator.tsx
│   │
│   └── features/           # Feature-specific components
│       ├── auth/
│       │   ├── LoginForm.tsx
│       │   ├── SignupForm.tsx
│       │   └── ProtectedRoute.tsx
│       │
│       ├── matchmaking/
│       │   ├── MatchmakingQueue.tsx
│       │   ├── GameInvite.tsx
│       │   └── OpponentSearch.tsx
│       │
│       └── profile/
│           ├── ProfileCard.tsx
│           ├── Statistics.tsx
│           └── AchievementsList.tsx
│
├── pages/                   # Page components (route-level)
│   ├── Home.tsx
│   ├── Game.tsx
│   ├── Profile.tsx
│   ├── Leaderboard.tsx
│   ├── GameHistory.tsx
│   ├── Settings.tsx
│   └── NotFound.tsx
│
├── hooks/                   # Custom React hooks
│   ├── useAuth.ts
│   ├── useGame.ts
│   ├── useRealtime.ts
│   ├── useSupabase.ts
│   ├── useNotifications.ts
│   ├── useMatchmaking.ts
│   └── useAI.ts
│
├── store/                   # State management (Zustand)
│   ├── authStore.ts
│   ├── gameStore.ts
│   ├── uiStore.ts
│   └── notificationStore.ts
│
├── lib/                     # Utility libraries
│   ├── supabase.ts         # Supabase client configuration
│   ├── game-logic/         # Game logic (separate from UI)
│   │   ├── board.ts
│   │   ├── pieces.ts
│   │   ├── moves.ts
│   │   ├── validation.ts
│   │   ├── ai/
│   │   │   ├── easy.ts
│   │   │   ├── medium.ts
│   │   │   └── hard.ts
│   │   └── win-conditions.ts
│   │
│   └── utils/              # General utilities
│       ├── formatters.ts
│       ├── validators.ts
│       └── constants.ts
│
├── types/                   # TypeScript type definitions
│   ├── game.ts
│   ├── player.ts
│   ├── database.ts
│   └── index.ts
│
├── styles/                  # Global styles
│   ├── globals.css
│   ├── animations.css
│   └── themes.css
│
└── config/                  # Configuration files
    ├── routes.ts
    └── environment.ts
```

## Zustand를 이용한 상태 관리

### 인증 스토어
```typescript
// src/store/authStore.ts
import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { Profile } from '@/types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setProfile: (profile) => set({ profile }),
  setSession: (session) => set({ session }),

  signOut: async () => {
    const { supabase } = await import('@/lib/supabase');
    await supabase.auth.signOut();
    set({ user: null, profile: null, session: null, isAuthenticated: false });
  },

  updateProfile: async (updates) => {
    const { supabase } = await import('@/lib/supabase');
    const { profile } = get();
    if (!profile) return;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id)
      .select()
      .single();

    if (data) set({ profile: data });
  }
}));
```

### 게임 스토어
```typescript
// src/store/gameStore.ts
import { create } from 'zustand';
import { Game, Move, BoardState } from '@/types';

interface GameState {
  currentGame: Game | null;
  boardState: BoardState | null;
  moves: Move[];
  isMyTurn: boolean;
  selectedCell: Position | null;
  validMoves: Position[];
  isLoading: boolean;

  // Actions
  setGame: (game: Game) => void;
  setBoardState: (boardState: BoardState) => void;
  addMove: (move: Move) => void;
  setSelectedCell: (cell: Position | null) => void;
  calculateValidMoves: (from: Position) => void;
  makeMove: (move: Move) => Promise<void>;
  reset: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentGame: null,
  boardState: null,
  moves: [],
  isMyTurn: false,
  selectedCell: null,
  validMoves: [],
  isLoading: false,

  setGame: (game) => {
    const { user } = useAuthStore.getState();
    const isMyTurn = game.current_turn === user?.id;
    set({ currentGame: game, isMyTurn });
  },

  setBoardState: (boardState) => set({ boardState }),

  addMove: (move) => set((state) => ({ moves: [...state.moves, move] })),

  setSelectedCell: (cell) => {
    set({ selectedCell: cell });
    if (cell) {
      get().calculateValidMoves(cell);
    } else {
      set({ validMoves: [] });
    }
  },

  calculateValidMoves: (from) => {
    const { boardState } = get();
    if (!boardState) return;

    // Import game logic
    import('@/lib/game-logic/moves').then(({ getValidMoves }) => {
      const validMoves = getValidMoves(boardState, from);
      set({ validMoves });
    });
  },

  makeMove: async (move) => {
    set({ isLoading: true });

    try {
      const { supabase } = await import('@/lib/supabase');
      const { currentGame, boardState } = get();
      if (!currentGame || !boardState) return;

      // Validate move
      const { validateMove, applyMove } = await import('@/lib/game-logic/validation');
      if (!validateMove(boardState, move)) {
        throw new Error('Invalid move');
      }

      // Apply move locally (optimistic update)
      const newBoardState = applyMove(boardState, move);
      set({ boardState: newBoardState, selectedCell: null, validMoves: [] });

      // Send to server
      const { error } = await supabase.from('moves').insert({
        game_id: currentGame.id,
        player_id: useAuthStore.getState().user?.id,
        turn_number: currentGame.turn_number + 1,
        move_data: move,
        board_state_after: newBoardState
      });

      if (error) throw error;

      // Update game state
      await supabase
        .from('games')
        .update({
          board_state: newBoardState,
          turn_number: currentGame.turn_number + 1,
          current_turn: currentGame.current_turn === currentGame.player_white
            ? currentGame.player_black
            : currentGame.player_white,
          last_move_at: new Date().toISOString()
        })
        .eq('id', currentGame.id);

    } catch (error) {
      console.error('Error making move:', error);
      // Rollback optimistic update
      const { currentGame } = get();
      if (currentGame) {
        set({ boardState: currentGame.board_state });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  reset: () => set({
    currentGame: null,
    boardState: null,
    moves: [],
    isMyTurn: false,
    selectedCell: null,
    validMoves: [],
    isLoading: false
  })
}));
```

### UI 스토어
```typescript
// src/store/uiStore.ts
import { create } from 'zustand';

interface UIState {
  isSidebarOpen: boolean;
  theme: 'light' | 'dark';
  soundEnabled: boolean;
  animationsEnabled: boolean;
  notificationBadgeCount: number;

  // Actions
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSound: () => void;
  toggleAnimations: () => void;
  setNotificationBadgeCount: (count: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  theme: 'light',
  soundEnabled: true,
  animationsEnabled: true,
  notificationBadgeCount: 0,

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setTheme: (theme) => set({ theme }),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  toggleAnimations: () => set((state) => ({ animationsEnabled: !state.animationsEnabled })),
  setNotificationBadgeCount: (count) => set({ notificationBadgeCount: count })
}));
```

## 커스텀 훅

### useAuth 훅
```typescript
// src/hooks/useAuth.ts
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { user, profile, setUser, setProfile, setSession, signOut } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Fetch profile
        fetchProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) setProfile(data);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    if (data.user) {
      // Create profile
      await supabase.from('profiles').insert({
        id: data.user.id,
        username
      });
    }
  }

  function requireAuth() {
    if (!user) {
      navigate('/login');
      return false;
    }
    return true;
  }

  return {
    user,
    profile,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    requireAuth
  };
}
```

### useGame 훅
```typescript
// src/hooks/useGame.ts
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';

export function useGame() {
  const { gameId } = useParams<{ gameId: string }>();
  const { currentGame, setGame, setBoardState, addMove, makeMove, reset } = useGameStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!gameId) return;

    // Fetch initial game state
    fetchGame(gameId);

    // Subscribe to game updates
    const gameSubscription = supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`
        },
        (payload) => {
          setGame(payload.new as Game);
          setBoardState(payload.new.board_state);
        }
      )
      .subscribe();

    // Subscribe to new moves
    const movesSubscription = supabase
      .channel(`moves:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'moves',
          filter: `game_id=eq.${gameId}`
        },
        (payload) => {
          addMove(payload.new as Move);
          // Animate move
          animateMove(payload.new as Move);
        }
      )
      .subscribe();

    return () => {
      gameSubscription.unsubscribe();
      movesSubscription.unsubscribe();
      reset();
    };
  }, [gameId]);

  async function fetchGame(id: string) {
    const { data: game, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single();

    if (game) {
      setGame(game);
      setBoardState(game.board_state);

      // Fetch move history
      const { data: moves } = await supabase
        .from('moves')
        .select('*')
        .eq('game_id', id)
        .order('turn_number', { ascending: true });

      if (moves) {
        moves.forEach(addMove);
      }
    }
  }

  function animateMove(move: Move) {
    // Implement move animation logic
    // This is game-specific
  }

  async function resignGame() {
    if (!currentGame || !user) return;

    const winner = currentGame.current_turn === currentGame.player_white
      ? currentGame.player_black
      : currentGame.player_white;

    await supabase
      .from('games')
      .update({
        status: 'completed',
        winner,
        win_reason: 'resignation',
        completed_at: new Date().toISOString()
      })
      .eq('id', currentGame.id);
  }

  return {
    game: currentGame,
    makeMove,
    resignGame,
    isLoading: useGameStore((s) => s.isLoading)
  };
}
```

### useRealtime 훅
```typescript
// src/hooks/useRealtime.ts
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

export function useRealtime() {
  const { user } = useAuthStore();
  const { setNotificationBadgeCount } = useUIStore();

  useEffect(() => {
    if (!user) return;

    // Subscribe to notifications
    const notificationSubscription = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `player_id=eq.${user.id}`
        },
        (payload) => {
          // Show toast notification
          showNotificationToast(payload.new);

          // Update badge count
          updateBadgeCount();
        }
      )
      .subscribe();

    // Subscribe to turn updates
    const turnSubscription = supabase
      .channel(`turns:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `current_turn=eq.${user.id}`
        },
        (payload) => {
          // Notify user it's their turn
          showTurnNotification(payload.new);
        }
      )
      .subscribe();

    // Initial badge count
    updateBadgeCount();

    return () => {
      notificationSubscription.unsubscribe();
      turnSubscription.unsubscribe();
    };
  }, [user]);

  async function updateBadgeCount() {
    if (!user) return;

    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('player_id', user.id)
      .eq('is_read', false);

    setNotificationBadgeCount(count || 0);
  }

  function showNotificationToast(notification: any) {
    // Implement toast notification
    // Use a library like react-hot-toast or sonner
  }

  function showTurnNotification(game: any) {
    // Show "Your turn!" notification
  }
}
```

## 컴포넌트 패턴

### 게임 보드 컴포넌트
```typescript
// src/components/game/GameBoard.tsx
import { useGameStore } from '@/store/gameStore';
import { GameCell } from './GameCell';
import { GamePiece } from './GamePiece';

export function GameBoard() {
  const { boardState, selectedCell, validMoves, setSelectedCell } = useGameStore();

  if (!boardState) return <div>Loading...</div>;

  function handleCellClick(position: Position) {
    // If a cell is selected and this is a valid move, make the move
    if (selectedCell && validMoves.some(m => m.x === position.x && m.y === position.y)) {
      useGameStore.getState().makeMove({
        from: selectedCell,
        to: position
      });
    } else {
      // Select this cell
      setSelectedCell(position);
    }
  }

  return (
    <div className="game-board grid grid-cols-8 gap-1 p-4 bg-gray-800 rounded-lg">
      {boardState.cells.map((row, y) =>
        row.map((cell, x) => (
          <GameCell
            key={`${x}-${y}`}
            position={{ x, y }}
            cell={cell}
            isSelected={selectedCell?.x === x && selectedCell?.y === y}
            isValidMove={validMoves.some(m => m.x === x && m.y === y)}
            onClick={() => handleCellClick({ x, y })}
          >
            {cell.piece && <GamePiece piece={cell.piece} />}
          </GameCell>
        ))
      )}
    </div>
  );
}
```

### 보호된 라우트 컴포넌트
```typescript
// src/components/features/auth/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

## 라우팅 구성

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/features/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';

// Pages
import Home from '@/pages/Home';
import Game from '@/pages/Game';
import Profile from '@/pages/Profile';
import Leaderboard from '@/pages/Leaderboard';
import GameHistory from '@/pages/GameHistory';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="/leaderboard" element={<Leaderboard />} />

          {/* Protected routes */}
          <Route path="/game/:gameId" element={
            <ProtectedRoute>
              <Game />
            </ProtectedRoute>
          } />
          <Route path="/profile/:userId?" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute>
              <GameHistory />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

## 성능 최적화

### 코드 분할
```typescript
// Lazy load pages
const Game = lazy(() => import('@/pages/Game'));
const Profile = lazy(() => import('@/pages/Profile'));

// Wrap in Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Game />
</Suspense>
```

### 메모이제이션
```typescript
// Memoize expensive calculations
const validMoves = useMemo(() => {
  return calculateValidMoves(boardState, selectedPiece);
}, [boardState, selectedPiece]);

// Memoize components
const GameCell = memo(({ cell, onClick }: GameCellProps) => {
  // ... component code
});
```

### 가상 스크롤
```typescript
// For long lists (game history, leaderboard)
import { useVirtualizer } from '@tanstack/react-virtual';

function GameHistoryList({ games }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: games.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60
  });

  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`
            }}
          >
            <GameHistoryItem game={games[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 애니메이션 전략

### Framer Motion 활용
```typescript
// src/components/game/GamePiece.tsx
import { motion } from 'framer-motion';

export function GamePiece({ piece, position }: GamePieceProps) {
  return (
    <motion.div
      layout
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      whileHover={{ scale: 1.1 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="game-piece"
    >
      {/* Piece rendering */}
    </motion.div>
  );
}
```

### CSS 애니메이션
```css
/* src/styles/animations.css */
@keyframes slideIn {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.notification-enter {
  animation: slideIn 0.3s ease-out;
}
```

## 오류 처리

### 오류 경계
```typescript
// src/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error tracking service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 테스팅 전략

### 컴포넌트 테스팅
```typescript
// src/components/game/GameBoard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameBoard } from './GameBoard';

describe('GameBoard', () => {
  it('renders board cells', () => {
    render(<GameBoard />);
    expect(screen.getAllByRole('button')).toHaveLength(64); // 8x8 board
  });

  it('highlights valid moves when piece selected', () => {
    render(<GameBoard />);
    const piece = screen.getByTestId('piece-0-0');
    fireEvent.click(piece);

    const validMoves = screen.getAllByTestId(/valid-move/);
    expect(validMoves.length).toBeGreaterThan(0);
  });
});
```

### 훅 테스팅
```typescript
// src/hooks/useGame.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useGame } from './useGame';

describe('useGame', () => {
  it('fetches game data on mount', async () => {
    const { result } = renderHook(() => useGame());

    await waitFor(() => {
      expect(result.current.game).not.toBeNull();
    });
  });
});
```

## 접근성

### 키보드 탐색
```typescript
// Make game playable with keyboard
function GameBoard() {
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        moveCursor('up');
        break;
      case 'ArrowDown':
        moveCursor('down');
        break;
      case 'Enter':
        selectCell();
        break;
      case 'Escape':
        cancelSelection();
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
```

### ARIA 레이블
```typescript
<button
  aria-label={`Cell at row ${y}, column ${x}`}
  aria-pressed={isSelected}
  role="gridcell"
>
  {/* Cell content */}
</button>
```

## 빌드 및 배포

### 환경 변수
```typescript
// .env.local
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 빌드 구성
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'ui-vendor': ['framer-motion', 'zustand']
        }
      }
    }
  }
});
```

## 다음 단계

1. Vite로 React 프로젝트 초기화
2. 폴더 구조 설정
3. 의존성 설치
4. Supabase 클라이언트 구성
5. 인증 플로우 구현
6. 핵심 게임 컴포넌트 제작
7. 상태 관리 설정
8. 게임 로직 구현
9. 실시간 구독 추가
10. 테스트 및 최적화
