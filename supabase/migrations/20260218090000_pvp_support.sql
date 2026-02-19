-- Drop the constraint that required player_black when is_ai_opponent = false
-- PvP games start with status='waiting' and player_black=null until opponent joins
ALTER TABLE games DROP CONSTRAINT IF EXISTS valid_players;

-- Allow waiting games (player_black can be null while waiting for opponent)
ALTER TABLE games ADD CONSTRAINT valid_players CHECK (
  (is_ai_opponent = TRUE AND player_black IS NULL) OR
  (is_ai_opponent = FALSE AND (status = 'waiting' OR player_black IS NOT NULL))
);

-- RLS: Anyone can view waiting games for the lobby
DROP POLICY IF EXISTS "Players can view their games" ON games;
CREATE POLICY "Players can view their games"
  ON games FOR SELECT
  USING (
    status = 'waiting' OR
    auth.uid() = player_white OR
    auth.uid() = player_black OR
    status = 'completed'
  );

-- RLS: Allow joining a waiting game (setting player_black)
DROP POLICY IF EXISTS "Players can update their games" ON games;
CREATE POLICY "Players can update their games"
  ON games FOR UPDATE
  USING (
    auth.uid() = player_white OR
    auth.uid() = player_black OR
    (status = 'waiting' AND player_black IS NULL AND auth.uid() != player_white)
  );

-- Index for lobby query
CREATE INDEX IF NOT EXISTS idx_games_waiting ON games(status, created_at DESC) WHERE status = 'waiting';
