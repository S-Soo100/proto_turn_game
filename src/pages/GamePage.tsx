import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import styled from '@emotion/styled'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { TicTacToeBoard } from '@/components/game/TicTacToeBoard'
import { GomokuBoard } from '@/components/game/GomokuBoard'
import type { TicTacToeState, GameResult as TicTacToeResult } from '@/lib/game-logic/tictactoe'
import type { GomokuState, GomokuResult } from '@/lib/game-logic/gomoku'

const Page = styled.div`
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #f9fafb;
`

const TopBar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #fff;
  border-bottom: 1px solid #f3f4f6;
  padding-top: max(14px, env(safe-area-inset-top));
`

const BackButton = styled.button`
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  line-height: 1;
  color: #374151;
  -webkit-tap-highlight-color: transparent;
  &:active { background: #f3f4f6; }
`

const GameTitle = styled.h1`
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin: 0;
`

const Badge = styled.span`
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  background: #ede9fe;
  color: #7c3aed;
  text-transform: capitalize;
`

const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  gap: 20px;
`

// ─── PvP player bar ──────────────────────────────────────────────────────────

const PlayerBar = styled.div`
  width: 100%;
  max-width: 360px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`

interface PlayerChipProps { active: boolean }
const PlayerChip = styled.div<PlayerChipProps>`
  flex: 1;
  padding: 10px 14px;
  border-radius: 12px;
  background: ${({ active }) => (active ? '#ede9fe' : '#f3f4f6')};
  border: 2px solid ${({ active }) => (active ? '#6366f1' : 'transparent')};
  transition: background 0.2s, border-color 0.2s;
`

const PlayerMark = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  margin-bottom: 2px;
`

const PlayerName = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const VsText = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #9ca3af;
  flex-shrink: 0;
`

// ─── Waiting screen ──────────────────────────────────────────────────────────

const WaitingCard = styled.div`
  width: 100%;
  max-width: 360px;
  background: #fff;
  border-radius: 20px;
  padding: 32px 24px;
  text-align: center;
  border: 1px solid #f3f4f6;
`

const WaitingTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px;
`

const WaitingDesc = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 20px;
`

const LinkBox = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`

const LinkInput = styled.input`
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 12px;
  color: #374151;
  background: #f9fafb;
  outline: none;
  min-width: 0;
`

const CopyButton = styled.button`
  padding: 10px 14px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  &:active { background: #4f46e5; }
`

const Spinner = styled(motion.div)`
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #6366f1;
  border-radius: 50%;
  margin: 0 auto 16px;
`

// ─── Result overlay ──────────────────────────────────────────────────────────

const ResultOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 50;
  padding-bottom: max(24px, env(safe-area-inset-bottom));
`

const ResultCard = styled(motion.div)`
  background: #fff;
  border-radius: 24px 24px 0 0;
  padding: 32px 24px 24px;
  width: 100%;
  max-width: 480px;
  text-align: center;
`

const ResultEmoji = styled.div`font-size: 56px; margin-bottom: 12px;`
const ResultTitle = styled.h2`font-size: 24px; font-weight: 800; color: #111827; margin: 0 0 8px;`
const ResultSub = styled.p`font-size: 15px; color: #6b7280; margin: 0 0 24px;`
const ButtonRow = styled.div`display: flex; gap: 12px;`

const PrimaryButton = styled.button`
  flex: 1; padding: 14px; background: #6366f1; color: #fff;
  border: none; border-radius: 12px; font-size: 16px; font-weight: 700;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  &:active { background: #4f46e5; }
`

const SecondaryButton = styled.button`
  flex: 1; padding: 14px; background: #f3f4f6; color: #374151;
  border: none; border-radius: 12px; font-size: 16px; font-weight: 700;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  &:active { background: #e5e7eb; }
`

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getResultContent(
  winner: string | null,
  winnerId: string | null,
  myId: string,
  isPvp: boolean,
  isGomoku: boolean,
) {
  if (winner === null) return { emoji: '🤝', title: '무승부', sub: '아슬아슬했네요!' }
  if (isPvp) {
    if (!winnerId) return { emoji: '🤝', title: '무승부', sub: '아슬아슬했네요!' }
    const iWon = winnerId === myId
    return iWon
      ? { emoji: '🎉', title: '승리!', sub: '완벽한 플레이입니다.' }
      : { emoji: '😔', title: '패배', sub: '다시 도전해보세요!' }
  }
  // AI game: player is always first mark (X for TicTacToe, B for Gomoku)
  const playerMark = isGomoku ? 'B' : 'X'
  return winner === playerMark
    ? { emoji: '🎉', title: '승리!', sub: '완벽한 플레이입니다.' }
    : { emoji: '😔', title: '패배', sub: '다시 도전해보세요!' }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function GamePage() {
  const { gameId } = useParams<{ gameId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const {
    game, boardState, result, isAIThinking,
    loadGame, joinGame, makeMove, startNewGame, subscribeToGame, reset,
  } = useGameStore()

  const [copied, setCopied] = useState(false)
  const [opponentName, setOpponentName] = useState<string | null>(null)
  const isJoining = searchParams.get('join') === '1'

  useEffect(() => {
    if (!gameId || !profile) return

    async function init() {
      if (isJoining) {
        try {
          await joinGame(gameId!, profile!.id)
        } catch {
          // Already joined or game gone — load instead
          await loadGame(gameId!)
        }
      } else {
        await loadGame(gameId!)
      }
    }
    init()

    // Subscribe for Realtime updates (PvP)
    const unsubscribe = subscribeToGame(gameId)
    return () => {
      unsubscribe()
      reset()
    }
  }, [gameId, profile?.id])

  // Load opponent name for PvP
  useEffect(() => {
    if (!game || game.is_ai_opponent || !profile) return
    const opponentId = game.player_white === profile.id ? game.player_black : game.player_white
    if (!opponentId) return

    supabase
      .from('profiles')
      .select('username')
      .eq('id', opponentId)
      .single()
      .then(({ data }) => { if (data) setOpponentName(data.username) })
  }, [game?.id, profile?.id])

  function handleCopyLink() {
    if (!gameId) return
    navigator.clipboard.writeText(`${window.location.origin}/game/${gameId}?join=1`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handlePlayAgain() {
    if (!profile || !game) return
    if (game.is_ai_opponent) {
      const difficulty = game.ai_difficulty ?? 'medium'
      const gameTypeId = (game.game_type_id ?? 'tictactoe') as 'tictactoe' | 'gomoku'
      const newId = await startNewGame(profile.id, difficulty, gameTypeId)
      navigate(`/game/${newId}`, { replace: true })
    } else {
      navigate('/lobby')
    }
  }

  if (!boardState || !game) {
    return (
      <Page>
        <Content>
          <p style={{ color: '#9ca3af' }}>게임 불러오는 중...</p>
        </Content>
      </Page>
    )
  }

  const myId = profile?.id ?? ''
  const isPvp = !game.is_ai_opponent
  const isMyTurn = game.current_turn === myId
  const isWaiting = game.status === 'waiting'
  const isGomoku = game.game_type_id === 'gomoku'

  // PvP: determine marks (emoji for Gomoku, X/O for TicTacToe)
  const myMark = game.player_white === myId
    ? (isGomoku ? '🐻' : 'X')
    : (isGomoku ? '🐰' : 'O')
  const opponentMark = game.player_white === myId
    ? (isGomoku ? '🐰' : 'O')
    : (isGomoku ? '🐻' : 'X')

  const gameTitle = isGomoku ? '오목' : '틱택토'

  const resultContent = result
    ? getResultContent(result.winner, game.winner, myId, isPvp, isGomoku)
    : null

  const inviteUrl = `${window.location.origin}/game/${gameId}?join=1`

  return (
    <Page>
      <TopBar>
        <BackButton onClick={() => navigate(isPvp ? '/lobby' : '/')} aria-label="뒤로">←</BackButton>
        <GameTitle>{gameTitle}</GameTitle>
        {isPvp
          ? <Badge>PvP</Badge>
          : <Badge>{game.ai_difficulty ?? 'medium'}</Badge>
        }
      </TopBar>

      <Content>
        {/* PvP player bar */}
        {isPvp && !isWaiting && (
          <PlayerBar>
            <PlayerChip active={isMyTurn}>
              <PlayerMark>{myMark} (나)</PlayerMark>
              <PlayerName>{profile?.username ?? '...'}</PlayerName>
            </PlayerChip>
            <VsText>vs</VsText>
            <PlayerChip active={!isMyTurn}>
              <PlayerMark>{opponentMark}</PlayerMark>
              <PlayerName>{opponentName ?? '상대방'}</PlayerName>
            </PlayerChip>
          </PlayerBar>
        )}

        {/* Waiting for opponent */}
        {isWaiting ? (
          <WaitingCard>
            <Spinner
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <WaitingTitle>상대방을 기다리는 중...</WaitingTitle>
            <WaitingDesc>초대 링크를 친구에게 공유하세요</WaitingDesc>
            <LinkBox>
              <LinkInput value={inviteUrl} readOnly />
              <CopyButton onClick={handleCopyLink}>
                {copied ? '✓' : '복사'}
              </CopyButton>
            </LinkBox>
          </WaitingCard>
        ) : isGomoku ? (
          <GomokuBoard
            state={boardState as GomokuState}
            result={result as GomokuResult | null}
            isAIThinking={isAIThinking}
            isMyTurn={isMyTurn}
            isPvp={isPvp}
            onCellClick={(index) => makeMove(index, myId)}
          />
        ) : (
          <TicTacToeBoard
            state={boardState as TicTacToeState}
            result={result as TicTacToeResult | null}
            isAIThinking={isAIThinking}
            isMyTurn={isMyTurn}
            isPvp={isPvp}
            onCellClick={(index) => makeMove(index, myId)}
          />
        )}
      </Content>

      {result && resultContent && (
        <ResultOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <ResultCard
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <ResultEmoji>{resultContent.emoji}</ResultEmoji>
            <ResultTitle>{resultContent.title}</ResultTitle>
            <ResultSub>{resultContent.sub}</ResultSub>
            <ButtonRow>
              <SecondaryButton onClick={() => navigate(isPvp ? '/lobby' : '/')}>
                {isPvp ? '로비' : '홈'}
              </SecondaryButton>
              <PrimaryButton onClick={handlePlayAgain}>다시 플레이</PrimaryButton>
            </ButtonRow>
          </ResultCard>
        </ResultOverlay>
      )}
    </Page>
  )
}
