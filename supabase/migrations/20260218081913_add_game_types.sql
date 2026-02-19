-- game_types table

CREATE TABLE game_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  board_config JSONB NOT NULL,
  initial_board_state JSONB NOT NULL,
  max_players INTEGER DEFAULT 2,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed: tictactoe
INSERT INTO game_types (id, name, description, board_config, initial_board_state) VALUES (
  'tictactoe',
  'Tic Tac Toe',
  'Classic 3x3 grid game. Get three in a row to win.',
  '{"width": 3, "height": 3, "type": "square"}',
  '{"grid": [null, null, null, null, null, null, null, null, null], "currentMark": "X"}'
);

-- games table

CREATE TYPE game_status AS ENUM ('waiting', 'active', 'completed', 'abandoned');
CREATE TYPE game_mode AS ENUM ('single_player', 'pvp');
CREATE TYPE game_pace AS ENUM ('quick', 'standard', 'slow');

CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type_id TEXT NOT NULL REFERENCES game_types(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Players
  player_white UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player_black UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_ai_opponent BOOLEAN DEFAULT FALSE,
  ai_difficulty TEXT CHECK (ai_difficulty IN ('easy', 'medium', 'hard')),

  -- Configuration
  mode game_mode NOT NULL DEFAULT 'single_player',
  pace game_pace DEFAULT 'standard',

  -- State
  status game_status DEFAULT 'active',
  current_turn UUID REFERENCES profiles(id),
  turn_number INTEGER DEFAULT 0,
  board_state JSONB NOT NULL DEFAULT '{}',

  -- Result
  winner UUID REFERENCES profiles(id),
  win_reason TEXT,
  last_move_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT valid_players CHECK (
    (is_ai_opponent = TRUE AND player_black IS NULL) OR
    (is_ai_opponent = FALSE AND player_black IS NOT NULL)
  )
);

CREATE INDEX idx_games_game_type ON games(game_type_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_player_white ON games(player_white);
CREATE INDEX idx_games_updated_at ON games(updated_at DESC);

CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- moves table

CREATE TABLE moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  turn_number INTEGER NOT NULL,
  move_data JSONB NOT NULL,
  board_state_after JSONB NOT NULL,

  CONSTRAINT unique_game_turn UNIQUE (game_id, turn_number)
);

CREATE INDEX idx_moves_game_id ON moves(game_id, turn_number);

-- RLS

ALTER TABLE game_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Game types are viewable by everyone"
  ON game_types FOR SELECT
  USING (active = TRUE);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players can view their games"
  ON games FOR SELECT
  USING (auth.uid() = player_white OR auth.uid() = player_black OR status = 'completed');
CREATE POLICY "Players can create games"
  ON games FOR INSERT
  WITH CHECK (auth.uid() = player_white);
CREATE POLICY "Players can update their games"
  ON games FOR UPDATE
  USING (auth.uid() = player_white OR auth.uid() = player_black);

ALTER TABLE moves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players can view moves from their games"
  ON moves FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM games
      WHERE games.id = moves.game_id
      AND (games.player_white = auth.uid() OR games.player_black = auth.uid() OR games.status = 'completed')
    )
  );
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
