import { supabase } from './supabase'

export interface GonggiLeaderboardEntry {
  id: string
  user_id: string
  clear_time_ms: number
  fail_count: number
  chaos_survived: number
  created_at: string
  profiles: { username: string } | null
}

/**
 * Fetch top N gonggi scores (sorted by clear time ASC = fastest first).
 */
export async function fetchGonggiTopScores(
  limit = 20,
): Promise<GonggiLeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('gonggi_leaderboard')
    .select('*, profiles(username)')
    .order('clear_time_ms', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Failed to fetch gonggi leaderboard:', error)
    return []
  }

  return (data ?? []) as GonggiLeaderboardEntry[]
}

/**
 * Fetch a player's best gonggi score.
 */
export async function fetchGonggiMyBest(
  playerId: string,
): Promise<GonggiLeaderboardEntry | null> {
  const { data, error } = await supabase
    .from('gonggi_leaderboard')
    .select('*, profiles(username)')
    .eq('user_id', playerId)
    .order('clear_time_ms', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) return null
  return data as GonggiLeaderboardEntry
}

/**
 * Save a gonggi game result to the leaderboard.
 */
export async function saveGonggiScore(
  playerId: string,
  clearTimeMs: number,
  failCount: number,
  chaosSurvived: number,
): Promise<boolean> {
  const { error } = await supabase.from('gonggi_leaderboard').insert({
    user_id: playerId,
    clear_time_ms: clearTimeMs,
    fail_count: failCount,
    chaos_survived: chaosSurvived,
  })

  if (error) {
    console.error('Failed to save gonggi score:', error)
    return false
  }
  return true
}
