import { supabase } from './supabase'

export interface LeaderboardEntry {
  id: string
  game_type: string
  player_id: string
  score: number
  accuracy: number | null
  max_combo: number | null
  played_at: string
  profiles: { username: string } | null
}

/**
 * Fetch top N scores for a game type.
 */
export async function fetchTopScores(
  gameType: string,
  limit = 10,
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*, profiles(username)')
    .eq('game_type', gameType)
    .order('score', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to fetch leaderboard:', error)
    return []
  }

  return (data ?? []) as LeaderboardEntry[]
}

/**
 * Fetch a player's best score for a game type.
 */
export async function fetchMyBest(
  gameType: string,
  playerId: string,
): Promise<LeaderboardEntry | null> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*, profiles(username)')
    .eq('game_type', gameType)
    .eq('player_id', playerId)
    .order('score', { ascending: false })
    .limit(1)
    .single()

  if (error) return null
  return data as LeaderboardEntry
}

/**
 * Save a game result to the leaderboard.
 */
export async function saveScore(
  gameType: string,
  playerId: string,
  score: number,
  accuracy: number,
  maxCombo: number,
): Promise<boolean> {
  const { error } = await supabase.from('leaderboard').insert({
    game_type: gameType,
    player_id: playerId,
    score,
    accuracy,
    max_combo: maxCombo,
  })

  if (error) {
    console.error('Failed to save score:', error)
    return false
  }
  return true
}
