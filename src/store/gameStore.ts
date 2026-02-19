import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import {
  createInitialState as createTicTacToeState,
  applyMove as applyTicTacToeMove,
  checkResult as checkTicTacToeResult,
  getAIMove as getTicTacToeAIMove,
  type TicTacToeState,
  type GameResult as TicTacToeResult,
} from '@/lib/game-logic/tictactoe'
import {
  createInitialState as createGomokuState,
  applyMove as applyGomokuMove,
  checkResult as checkGomokuResult,
  getAIMove as getGomokuAIMove,
  type GomokuState,
  type GomokuResult,
} from '@/lib/game-logic/gomoku'
import type { Game, AIDifficulty } from '@/types/database'

export type GameTypeId = 'tictactoe' | 'gomoku'
export type BoardState = TicTacToeState | GomokuState
export type AnyResult = TicTacToeResult | GomokuResult

function parseBoardState(game: Game): BoardState {
  const raw = game.board_state as unknown
  if (game.game_type_id === 'gomoku') return raw as GomokuState
  return raw as TicTacToeState
}

function checkAnyResult(game: Game, boardState: BoardState): AnyResult | null {
  if (game.game_type_id === 'gomoku') return checkGomokuResult(boardState as GomokuState)
  return checkTicTacToeResult(boardState as TicTacToeState)
}

interface GameStore {
  game: Game | null
  boardState: BoardState | null
  result: AnyResult | null
  isAIThinking: boolean
  opponentProfile: { id: string; username: string } | null

  startNewGame: (playerId: string, difficulty: AIDifficulty, gameTypeId?: GameTypeId) => Promise<string>
  createPvpGame: (playerId: string, gameTypeId?: GameTypeId) => Promise<string>
  joinGame: (gameId: string, playerId: string) => Promise<void>
  loadGame: (gameId: string) => Promise<void>
  makeMove: (index: number, myId: string) => Promise<void>
  subscribeToGame: (gameId: string) => () => void
  reset: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: null,
  boardState: null,
  result: null,
  isAIThinking: false,
  opponentProfile: null,

  startNewGame: async (playerId, difficulty, gameTypeId = 'tictactoe') => {
    const initial = gameTypeId === 'gomoku' ? createGomokuState() : createTicTacToeState()

    const { data, error } = await supabase
      .from('games')
      .insert({
        game_type_id: gameTypeId,
        player_white: playerId,
        is_ai_opponent: true,
        ai_difficulty: difficulty,
        mode: 'single_player',
        status: 'active',
        current_turn: playerId,
        board_state: initial,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    set({ game: data as Game, boardState: initial, result: null, opponentProfile: null })
    return data.id as string
  },

  createPvpGame: async (playerId, gameTypeId = 'tictactoe') => {
    const initial = gameTypeId === 'gomoku' ? createGomokuState() : createTicTacToeState()

    const { data, error } = await supabase
      .from('games')
      .insert({
        game_type_id: gameTypeId,
        player_white: playerId,
        player_black: null,
        is_ai_opponent: false,
        mode: 'pvp',
        status: 'waiting',
        current_turn: playerId,
        board_state: initial,
      })
      .select()
      .single()

    if (error) throw error

    set({ game: data as Game, boardState: initial, result: null, opponentProfile: null })
    return data.id as string
  },

  joinGame: async (gameId, playerId) => {
    const { data, error } = await supabase
      .from('games')
      .update({
        player_black: playerId,
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .eq('id', gameId)
      .eq('status', 'waiting')
      .select()
      .single()

    if (error) throw error

    const game = data as Game
    const boardState = parseBoardState(game)

    const { data: opponentData } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', game.player_white)
      .single()

    set({ game, boardState, result: null, opponentProfile: opponentData ?? null })
  },

  loadGame: async (gameId) => {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single()

    if (error) throw error

    const game = data as Game
    const boardState = parseBoardState(game)
    const result = game.status === 'completed' ? checkAnyResult(game, boardState) : null

    set({ game, boardState, result })
  },

  makeMove: async (index, myId) => {
    const { game, boardState } = get()
    if (!game || !boardState || get().result) return
    if (game.current_turn !== myId) return

    const isGomoku = game.game_type_id === 'gomoku'

    const afterPlayer = isGomoku
      ? applyGomokuMove(boardState as GomokuState, index)
      : applyTicTacToeMove(boardState as TicTacToeState, index)

    const playerResult = isGomoku
      ? checkGomokuResult(afterPlayer as GomokuState)
      : checkTicTacToeResult(afterPlayer as TicTacToeState)

    const turnNumber = game.turn_number + 1

    await supabase.from('moves').insert({
      game_id: game.id,
      player_id: myId,
      turn_number: turnNumber,
      move_data: { index },
      board_state_after: afterPlayer,
    })

    if (playerResult !== null) {
      const winner = (() => {
        if (!playerResult.winner) return null
        if (isGomoku) {
          // B = player_white (흑), W = player_black (백)
          return playerResult.winner === 'B' ? game.player_white : (game.player_black ?? null)
        }
        // TicTacToe: X = player_white
        return playerResult.winner === 'X' ? game.player_white : (game.is_ai_opponent ? null : (game.player_black ?? null))
      })()

      await supabase
        .from('games')
        .update({
          board_state: afterPlayer,
          turn_number: turnNumber,
          status: 'completed',
          winner,
          win_reason: playerResult.winner ? 'normal' : 'draw',
          completed_at: new Date().toISOString(),
          last_move_at: new Date().toISOString(),
        })
        .eq('id', game.id)

      set({
        boardState: afterPlayer,
        result: playerResult,
        game: { ...game, status: 'completed', turn_number: turnNumber },
      })
      return
    }

    // AI game: trigger AI move locally
    if (game.is_ai_opponent) {
      set({ boardState: afterPlayer, isAIThinking: true })

      await supabase
        .from('games')
        .update({
          board_state: afterPlayer,
          turn_number: turnNumber,
          last_move_at: new Date().toISOString(),
        })
        .eq('id', game.id)

      await new Promise((r) => setTimeout(r, 400))

      const difficulty = (game.ai_difficulty ?? 'medium') as AIDifficulty
      const aiIndex = isGomoku
        ? getGomokuAIMove(afterPlayer as GomokuState, difficulty)
        : getTicTacToeAIMove(afterPlayer as TicTacToeState, difficulty)

      const afterAI = isGomoku
        ? applyGomokuMove(afterPlayer as GomokuState, aiIndex)
        : applyTicTacToeMove(afterPlayer as TicTacToeState, aiIndex)

      const aiResult = isGomoku
        ? checkGomokuResult(afterAI as GomokuState)
        : checkTicTacToeResult(afterAI as TicTacToeState)

      const aiTurnNumber = turnNumber + 1

      await supabase.from('moves').insert({
        game_id: game.id,
        player_id: null,
        turn_number: aiTurnNumber,
        move_data: { index: aiIndex },
        board_state_after: afterAI,
      })

      if (aiResult !== null) {
        // AI is the opponent: AI win = second mark (O for TicTacToe, W for Gomoku)
        const aiWon = isGomoku
          ? aiResult.winner === 'W'
          : aiResult.winner === 'O'

        await supabase
          .from('games')
          .update({
            board_state: afterAI,
            turn_number: aiTurnNumber,
            status: 'completed',
            winner: aiWon ? null : game.player_white,
            win_reason: aiResult.winner ? 'normal' : 'draw',
            completed_at: new Date().toISOString(),
            last_move_at: new Date().toISOString(),
          })
          .eq('id', game.id)

        set({
          boardState: afterAI,
          result: aiResult,
          isAIThinking: false,
          game: { ...game, status: 'completed', turn_number: aiTurnNumber },
        })
        return
      }

      await supabase
        .from('games')
        .update({
          board_state: afterAI,
          turn_number: aiTurnNumber,
          current_turn: game.player_white,
          last_move_at: new Date().toISOString(),
        })
        .eq('id', game.id)

      set({
        boardState: afterAI,
        isAIThinking: false,
        game: { ...game, turn_number: aiTurnNumber },
      })
      return
    }

    // PvP: update board and switch turn — Realtime will sync the opponent
    const nextTurn = myId === game.player_white ? game.player_black! : game.player_white
    await supabase
      .from('games')
      .update({
        board_state: afterPlayer,
        turn_number: turnNumber,
        current_turn: nextTurn,
        last_move_at: new Date().toISOString(),
      })
      .eq('id', game.id)

    set({
      boardState: afterPlayer,
      game: { ...game, turn_number: turnNumber, current_turn: nextTurn },
    })
  },

  subscribeToGame: (gameId) => {
    async function fetchAndUpdate() {
      const { data } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single()
      if (!data) return
      const updatedGame = data as Game
      const boardState = parseBoardState(updatedGame)
      const result = updatedGame.status === 'completed' ? checkAnyResult(updatedGame, boardState) : null
      set({ game: updatedGame, boardState, result })
    }

    // Realtime subscription
    const channel = supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
        () => fetchAndUpdate(),
      )
      .subscribe()

    // Polling fallback (1.5s interval) in case Realtime is not enabled on table
    const pollInterval = setInterval(fetchAndUpdate, 1500)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(pollInterval)
    }
  },

  reset: () =>
    set({ game: null, boardState: null, result: null, isAIThinking: false, opponentProfile: null }),
}))
