# Supabase 아키텍처

## 개요

이 문서는 턴제 전략 게임의 완전한 Supabase 백엔드 아키텍처를 정리합니다. 데이터베이스 스키마, 보안 정책, 실시간 구독, 서버리스 함수를 포함합니다.

## 데이터베이스 스키마

### 핵심 테이블

#### 1. `profiles` 테이블
게임 특화 사용자 데이터로 Supabase Auth를 확장합니다.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Statistics
  total_games INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  games_lost INTEGER DEFAULT 0,
  games_drawn INTEGER DEFAULT 0,

  -- Rating
  elo_rating INTEGER DEFAULT 1200,
  peak_rating INTEGER DEFAULT 1200,

  -- Preferences
  preferred_pace TEXT DEFAULT 'standard' CHECK (preferred_pace IN ('quick', 'standard', 'slow')),
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,

  -- Status
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,

  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 20)
);

-- Indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_elo_rating ON profiles(elo_rating DESC);
CREATE INDEX idx_profiles_last_seen ON profiles(last_seen_at);

-- Auto-update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### 2. `games` 테이블
게임 인스턴스와 메타데이터를 저장합니다.

```sql
CREATE TYPE game_status AS ENUM ('waiting', 'active', 'completed', 'abandoned');
CREATE TYPE game_mode AS ENUM ('single_player', 'pvp');
CREATE TYPE game_pace AS ENUM ('quick', 'standard', 'slow');

CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Players
  player_white UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player_black UUID REFERENCES profiles(id) ON DELETE CASCADE, -- NULL for AI
  is_ai_opponent BOOLEAN DEFAULT FALSE,
  ai_difficulty TEXT CHECK (ai_difficulty IN ('easy', 'medium', 'hard')),

  -- Game Configuration
  mode game_mode NOT NULL DEFAULT 'pvp',
  pace game_pace DEFAULT 'standard',
  turn_time_limit INTEGER, -- seconds per turn (NULL = no limit)

  -- Current State
  status game_status DEFAULT 'waiting',
  current_turn UUID REFERENCES profiles(id), -- NULL when waiting
  turn_number INTEGER DEFAULT 0,

  -- Game State (stored as JSONB for flexibility)
  board_state JSONB NOT NULL DEFAULT '{}',

  -- Result
  winner UUID REFERENCES profiles(id),
  win_reason TEXT, -- 'elimination', 'resignation', 'timeout', 'stalemate', etc.

  -- Timing
  white_time_remaining INTEGER, -- seconds (for time bank mode)
  black_time_remaining INTEGER,
  last_move_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT valid_players CHECK (
    (is_ai_opponent = TRUE AND player_black IS NULL) OR
    (is_ai_opponent = FALSE AND player_black IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_player_white ON games(player_white);
CREATE INDEX idx_games_player_black ON games(player_black) WHERE player_black IS NOT NULL;
CREATE INDEX idx_games_current_turn ON games(current_turn) WHERE status = 'active';
CREATE INDEX idx_games_updated_at ON games(updated_at DESC);
CREATE INDEX idx_games_active_timeout ON games(last_move_at)
  WHERE status = 'active' AND last_move_at IS NOT NULL;

-- Trigger to update updated_at
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### 3. `moves` Table
Records all moves made in games (for history and replay).

```sql
CREATE TABLE moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Move Details
  turn_number INTEGER NOT NULL,
  move_data JSONB NOT NULL, -- Specific move details (from, to, action, etc.)

  -- State After Move
  board_state_after JSONB NOT NULL, -- Complete board state after this move

  -- Timing
  time_taken INTEGER, -- milliseconds taken to make this move
  time_remaining INTEGER, -- time remaining after this move (if using time bank)

  -- Validation
  is_valid BOOLEAN DEFAULT TRUE,
  validation_errors TEXT[]
);

-- Indexes
CREATE INDEX idx_moves_game_id ON moves(game_id, turn_number);
CREATE INDEX idx_moves_player_id ON moves(player_id);
CREATE INDEX idx_moves_created_at ON moves(created_at DESC);

-- Ensure moves are sequential
CREATE UNIQUE INDEX idx_moves_game_turn ON moves(game_id, turn_number);
```

#### 4. `matchmaking_queue` 테이블
PvP 매치메이킹을 관리합니다.

```sql
CREATE TABLE matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Matchmaking Criteria
  elo_rating INTEGER NOT NULL,
  preferred_pace game_pace DEFAULT 'standard',

  -- Search Parameters
  min_elo INTEGER, -- Minimum opponent rating (widens over time)
  max_elo INTEGER, -- Maximum opponent rating (widens over time)

  -- Status
  is_searching BOOLEAN DEFAULT TRUE
);

-- Indexes
CREATE INDEX idx_matchmaking_active ON matchmaking_queue(queued_at) WHERE is_searching = TRUE;
CREATE INDEX idx_matchmaking_elo ON matchmaking_queue(elo_rating) WHERE is_searching = TRUE;
```

#### 5. `game_invitations` 테이블
플레이어 간 직접 도전을 관리합니다.

```sql
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');

CREATE TABLE game_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),

  -- Players
  from_player UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_player UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Invitation Details
  status invitation_status DEFAULT 'pending',
  game_pace game_pace DEFAULT 'standard',
  message TEXT,

  -- Result
  game_id UUID REFERENCES games(id),
  responded_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT different_players CHECK (from_player != to_player)
);

-- Indexes
CREATE INDEX idx_invitations_to_player ON game_invitations(to_player, status);
CREATE INDEX idx_invitations_from_player ON game_invitations(from_player);
CREATE INDEX idx_invitations_expires ON game_invitations(expires_at) WHERE status = 'pending';
```

#### 6. `achievements` 테이블
사용 가능한 업적을 정의합니다.

```sql
CREATE TABLE achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT,
  category TEXT, -- 'gameplay', 'social', 'skill', etc.
  points INTEGER DEFAULT 0,

  -- Unlock Criteria (stored as JSONB for flexibility)
  criteria JSONB NOT NULL,

  -- Metadata
  is_secret BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 7. `player_achievements` 테이블
플레이어 업적 잠금 해제를 추적합니다.

```sql
CREATE TABLE player_achievements (
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Progress tracking
  progress JSONB,

  PRIMARY KEY (player_id, achievement_id)
);

-- Indexes
CREATE INDEX idx_player_achievements_player ON player_achievements(player_id, unlocked_at DESC);
CREATE INDEX idx_player_achievements_achievement ON player_achievements(achievement_id);
```

#### 8. `notifications` 테이블
앱 내 알림 시스템입니다.

```sql
CREATE TYPE notification_type AS ENUM (
  'game_invite',
  'turn_ready',
  'game_completed',
  'achievement_unlocked',
  'system'
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Notification Details
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT,

  -- Related Entities
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  related_player_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,

  -- Action
  action_url TEXT -- Link to navigate to (e.g., /game/123)
);

-- Indexes
CREATE INDEX idx_notifications_player_unread ON notifications(player_id, created_at DESC)
  WHERE is_read = FALSE;
CREATE INDEX idx_notifications_player_all ON notifications(player_id, created_at DESC);
```

### 헬퍼 함수

#### 타임스탬프 자동 업데이트 함수
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### ELO 레이팅 계산
```sql
CREATE OR REPLACE FUNCTION calculate_elo_change(
  player_rating INTEGER,
  opponent_rating INTEGER,
  result FLOAT, -- 1.0 for win, 0.5 for draw, 0.0 for loss
  k_factor INTEGER DEFAULT 32
)
RETURNS INTEGER AS $$
DECLARE
  expected_score FLOAT;
  rating_change INTEGER;
BEGIN
  -- Calculate expected score
  expected_score := 1.0 / (1.0 + POWER(10, (opponent_rating - player_rating) / 400.0));

  -- Calculate rating change
  rating_change := ROUND(k_factor * (result - expected_score));

  RETURN rating_change;
END;
$$ LANGUAGE plpgsql;
```

#### Update Player Statistics After Game
```sql
CREATE OR REPLACE FUNCTION update_player_stats_after_game()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when game is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update player_white stats
    UPDATE profiles
    SET
      total_games = total_games + 1,
      games_won = games_won + CASE WHEN NEW.winner = NEW.player_white THEN 1 ELSE 0 END,
      games_lost = games_lost + CASE WHEN NEW.winner = NEW.player_black THEN 1 ELSE 0 END,
      games_drawn = games_drawn + CASE WHEN NEW.winner IS NULL THEN 1 ELSE 0 END
    WHERE id = NEW.player_white;

    -- Update player_black stats (if not AI)
    IF NEW.player_black IS NOT NULL THEN
      UPDATE profiles
      SET
        total_games = total_games + 1,
        games_won = games_won + CASE WHEN NEW.winner = NEW.player_black THEN 1 ELSE 0 END,
        games_lost = games_lost + CASE WHEN NEW.winner = NEW.player_white THEN 1 ELSE 0 END,
        games_drawn = games_drawn + CASE WHEN NEW.winner IS NULL THEN 1 ELSE 0 END
      WHERE id = NEW.player_black;

      -- Update ELO ratings for PvP
      IF NEW.mode = 'pvp' THEN
        -- Calculate ELO changes
        DECLARE
          white_result FLOAT;
          black_result FLOAT;
          white_rating INTEGER;
          black_rating INTEGER;
          white_change INTEGER;
          black_change INTEGER;
        BEGIN
          -- Determine results
          white_result := CASE
            WHEN NEW.winner = NEW.player_white THEN 1.0
            WHEN NEW.winner = NEW.player_black THEN 0.0
            ELSE 0.5
          END;
          black_result := 1.0 - white_result;

          -- Get current ratings
          SELECT elo_rating INTO white_rating FROM profiles WHERE id = NEW.player_white;
          SELECT elo_rating INTO black_rating FROM profiles WHERE id = NEW.player_black;

          -- Calculate changes
          white_change := calculate_elo_change(white_rating, black_rating, white_result);
          black_change := calculate_elo_change(black_rating, white_rating, black_result);

          -- Update ratings
          UPDATE profiles
          SET
            elo_rating = GREATEST(100, elo_rating + white_change),
            peak_rating = GREATEST(peak_rating, elo_rating + white_change)
          WHERE id = NEW.player_white;

          UPDATE profiles
          SET
            elo_rating = GREATEST(100, elo_rating + black_change),
            peak_rating = GREATEST(peak_rating, elo_rating + black_change)
          WHERE id = NEW.player_black;
        END;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stats_on_game_complete
  AFTER UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_player_stats_after_game();
```

## 행 수준 보안 (RLS) 정책

### 모든 테이블에 RLS 활성화
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchmaking_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

### 프로필 정책
```sql
-- Users can view all profiles (public info)
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (TRUE);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

### 게임 정책
```sql
-- Players can view games they're part of
CREATE POLICY "Players can view their games"
  ON games FOR SELECT
  USING (
    auth.uid() = player_white OR
    auth.uid() = player_black OR
    status = 'completed' -- Completed games are public
  );

-- Players can create games
CREATE POLICY "Players can create games"
  ON games FOR INSERT
  WITH CHECK (auth.uid() = player_white);

-- Players can update games they're part of (for making moves)
CREATE POLICY "Players can update their games"
  ON games FOR UPDATE
  USING (
    auth.uid() = player_white OR
    auth.uid() = player_black
  );
```

### 수(이동) 정책
```sql
-- Players can view moves from their games
CREATE POLICY "Players can view moves from their games"
  ON moves FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM games
      WHERE games.id = moves.game_id
      AND (games.player_white = auth.uid() OR games.player_black = auth.uid() OR games.status = 'completed')
    )
  );

-- Players can insert moves in their games
CREATE POLICY "Players can insert moves in their games"
  ON moves FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games
      WHERE games.id = moves.game_id
      AND games.current_turn = auth.uid()
      AND games.status = 'active'
    )
  );
```

### Matchmaking Queue Policies
```sql
-- Players can view their own queue entry
CREATE POLICY "Players can view own queue entry"
  ON matchmaking_queue FOR SELECT
  USING (auth.uid() = player_id);

-- Players can insert own queue entry
CREATE POLICY "Players can insert own queue entry"
  ON matchmaking_queue FOR INSERT
  WITH CHECK (auth.uid() = player_id);

-- Players can update own queue entry
CREATE POLICY "Players can update own queue entry"
  ON matchmaking_queue FOR UPDATE
  USING (auth.uid() = player_id);

-- Players can delete own queue entry
CREATE POLICY "Players can delete own queue entry"
  ON matchmaking_queue FOR DELETE
  USING (auth.uid() = player_id);
```

### 알림 정책
```sql
-- Players can view their own notifications
CREATE POLICY "Players can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = player_id);

-- Players can update their own notifications (mark as read)
CREATE POLICY "Players can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = player_id);
```

## 실시간 구독

### 클라이언트 사이드 구독 예시

#### 게임 업데이트 구독
```typescript
// Subscribe to changes in a specific game
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
      console.log('Game updated:', payload.new);
      // Update local game state
      updateGameState(payload.new);
    }
  )
  .subscribe();

// Unsubscribe when component unmounts
gameSubscription.unsubscribe();
```

#### 새 수(이동) 구독
```typescript
// Subscribe to new moves in a game
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
      console.log('New move:', payload.new);
      // Animate the move, update board
      applyMove(payload.new);
    }
  )
  .subscribe();
```

#### 알림 구독
```typescript
// Subscribe to player's notifications
const notificationSubscription = supabase
  .channel(`notifications:${userId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `player_id=eq.${userId}`
    },
    (payload) => {
      console.log('New notification:', payload.new);
      // Show toast/alert
      showNotification(payload.new);
    }
  )
  .subscribe();
```

#### Subscribe to Turn Updates (Your Turn)
```typescript
// Subscribe to games where it becomes your turn
const turnSubscription = supabase
  .channel(`turns:${userId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'games',
      filter: `current_turn=eq.${userId}`
    },
    (payload) => {
      console.log('Your turn in game:', payload.new.id);
      // Notify user it's their turn
      notifyPlayerTurn(payload.new);
    }
  )
  .subscribe();
```

## Supabase Edge Functions

### 1. 매치메이킹 함수
```typescript
// supabase/functions/matchmaking/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // Find waiting players
    const { data: queue, error } = await supabase
      .from('matchmaking_queue')
      .select('*')
      .eq('is_searching', true)
      .order('queued_at', { ascending: true });

    if (error) throw error;

    const matches = [];

    // Simple matchmaking: pair players with similar ELO
    for (let i = 0; i < queue.length - 1; i += 2) {
      const player1 = queue[i];
      const player2 = queue[i + 1];

      // Check ELO difference (within 200 points)
      if (Math.abs(player1.elo_rating - player2.elo_rating) <= 200) {
        // Create game
        const { data: game, error: gameError } = await supabase
          .from('games')
          .insert({
            player_white: player1.player_id,
            player_black: player2.player_id,
            mode: 'pvp',
            pace: player1.preferred_pace,
            status: 'active',
            current_turn: player1.player_id, // White starts
            board_state: initializeBoard() // Function to create starting board
          })
          .select()
          .single();

        if (!gameError) {
          // Remove from queue
          await supabase
            .from('matchmaking_queue')
            .delete()
            .in('player_id', [player1.player_id, player2.player_id]);

          // Create notifications
          await supabase.from('notifications').insert([
            {
              player_id: player1.player_id,
              type: 'turn_ready',
              title: 'Match Found!',
              message: 'Your game has started. It\'s your turn!',
              game_id: game.id,
              action_url: `/game/${game.id}`
            },
            {
              player_id: player2.player_id,
              type: 'turn_ready',
              title: 'Match Found!',
              message: 'Your game has started. Waiting for opponent.',
              game_id: game.id,
              action_url: `/game/${game.id}`
            }
          ]);

          matches.push(game.id);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, matches_created: matches.length }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

function initializeBoard() {
  // Return initial game board state
  // This will be game-specific
  return {
    // ... board configuration
  };
}
```

### 2. AI 수(이동) 함수
```typescript
// supabase/functions/ai-move/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { gameId } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // Get game state
    const { data: game, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (error) throw error;
    if (!game.is_ai_opponent) {
      throw new Error('Not an AI game');
    }

    // Calculate AI move based on difficulty
    const move = calculateAIMove(game.board_state, game.ai_difficulty);

    // Apply move to board
    const newBoardState = applyMove(game.board_state, move);

    // Check win condition
    const gameResult = checkWinCondition(newBoardState);

    // Update game state
    const updates: any = {
      board_state: newBoardState,
      turn_number: game.turn_number + 1,
      current_turn: game.player_white, // Back to player
      last_move_at: new Date().toISOString()
    };

    if (gameResult.isGameOver) {
      updates.status = 'completed';
      updates.winner = gameResult.winner;
      updates.win_reason = gameResult.reason;
      updates.completed_at = new Date().toISOString();
    }

    await supabase
      .from('games')
      .update(updates)
      .eq('id', gameId);

    // Record move
    await supabase.from('moves').insert({
      game_id: gameId,
      player_id: game.player_black, // AI player ID (null in this case, may need special handling)
      turn_number: game.turn_number + 1,
      move_data: move,
      board_state_after: newBoardState
    });

    // Notify player
    if (!gameResult.isGameOver) {
      await supabase.from('notifications').insert({
        player_id: game.player_white,
        type: 'turn_ready',
        title: 'Your Turn!',
        message: 'The AI has made its move.',
        game_id: gameId,
        action_url: `/game/${gameId}`
      });
    }

    return new Response(
      JSON.stringify({ success: true, move, gameResult }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// AI logic functions (game-specific)
function calculateAIMove(boardState: any, difficulty: string) {
  // Implement AI algorithm
  // This is highly game-specific
  return {};
}

function applyMove(boardState: any, move: any) {
  // Apply move to board state
  return boardState;
}

function checkWinCondition(boardState: any) {
  // Check if game is over
  return { isGameOver: false, winner: null, reason: null };
}
```

### 3. 타임아웃 처리 함수
```typescript
// supabase/functions/handle-timeouts/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // Find games that have timed out (24 hours since last move)
    const timeout = new Date();
    timeout.setHours(timeout.getHours() - 24);

    const { data: timedOutGames, error } = await supabase
      .from('games')
      .select('*')
      .eq('status', 'active')
      .lt('last_move_at', timeout.toISOString());

    if (error) throw error;

    const processed = [];

    for (const game of timedOutGames || []) {
      // Determine winner (opponent of current_turn)
      const winner = game.current_turn === game.player_white
        ? game.player_black
        : game.player_white;

      // Update game
      await supabase
        .from('games')
        .update({
          status: 'completed',
          winner: winner,
          win_reason: 'timeout',
          completed_at: new Date().toISOString()
        })
        .eq('id', game.id);

      // Notify players
      await supabase.from('notifications').insert([
        {
          player_id: game.player_white,
          type: 'game_completed',
          title: 'Game Ended',
          message: winner === game.player_white ? 'You won by timeout!' : 'You lost by timeout.',
          game_id: game.id,
          action_url: `/game/${game.id}`
        },
        {
          player_id: game.player_black,
          type: 'game_completed',
          title: 'Game Ended',
          message: winner === game.player_black ? 'You won by timeout!' : 'You lost by timeout.',
          game_id: game.id,
          action_url: `/game/${game.id}`
        }
      ]);

      processed.push(game.id);
    }

    return new Response(
      JSON.stringify({ success: true, games_processed: processed.length }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

## 예약 작업 (크론 작업)

Set up cron jobs to call edge functions:

```bash
# Run matchmaking every minute
supabase functions schedule matchmaking --cron "* * * * *"

# Check for timeouts every hour
supabase functions schedule handle-timeouts --cron "0 * * * *"

# Cleanup expired invitations daily
supabase functions schedule cleanup-invitations --cron "0 0 * * *"
```

## 스토리지 버킷

```sql
-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', TRUE);

-- RLS policy for avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

## 마이그레이션 전략

### 초기 마이그레이션
```bash
# Create migration file
supabase migration new initial_schema

# Add all table definitions to migration file

# Apply migration
supabase db push
```

### 버전 관리
- 모든 스키마 변경 사항을 마이그레이션 파일에 유지
- 배포 전 로컬에서 마이그레이션 테스트
- 배포에 Supabase CLI 사용
- 주요 마이그레이션 전 데이터베이스 백업

## 모니터링 및 유지보수

### 데이터베이스 성능
- `pg_stat_statements`로 쿼리 성능 모니터링
- 느린 쿼리에 대한 알림 설정
- 정기적인 VACUUM 및 ANALYZE
- 커넥션 풀 사용량 모니터링

### 백업 전략
- 자동 일일 백업 (Supabase Pro)
- 주간 중요 데이터 내보내기
- 복원 절차 테스트

### 보안 감사
- 정기적인 RLS 정책 검토
- 의심스러운 활동 모니터링
- 정기적인 의존성 업데이트
- Edge Function 로그 검토

## 다음 단계

1. Supabase 프로젝트 설정
2. 초기 마이그레이션 실행
3. 인증 제공자 구성
4. Edge Functions 배포
5. 크론 작업 설정
6. RLS 정책 테스트
7. 모니터링 구성
