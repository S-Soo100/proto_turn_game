export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  created_at: string
  updated_at: string

  total_games: number
  games_won: number
  games_lost: number
  games_drawn: number

  elo_rating: number
  peak_rating: number

  preferred_pace: 'quick' | 'standard' | 'slow'
  notifications_enabled: boolean
  email_notifications: boolean

  last_seen_at: string
  is_banned: boolean
  ban_reason: string | null
}

export interface GameType {
  id: string
  name: string
  description: string | null
  board_config: { width: number; height: number; type: string }
  initial_board_state: Record<string, unknown>
  max_players: number
  active: boolean
  created_at: string
}

export type GameStatus = 'waiting' | 'active' | 'completed' | 'abandoned'
export type GameMode = 'single_player' | 'pvp'
export type AIDifficulty = 'easy' | 'medium' | 'hard'

export interface Game {
  id: string
  game_type_id: string
  created_at: string
  updated_at: string
  started_at: string | null
  completed_at: string | null

  player_white: string
  player_black: string | null
  is_ai_opponent: boolean
  ai_difficulty: AIDifficulty | null

  mode: GameMode
  status: GameStatus
  current_turn: string | null
  turn_number: number
  board_state: Record<string, unknown>

  winner: string | null
  win_reason: string | null
  last_move_at: string | null
}
