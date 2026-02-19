import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from '@emotion/styled'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useGameStore } from '@/store/gameStore'

interface WaitingGame {
  id: string
  created_at: string
  player_white: string
  profiles: { username: string }
}

// ─── Layout ─────────────────────────────────────────────────────────────────

const Page = styled.div`
  min-height: 100dvh;
  background: #f9fafb;
  display: flex;
  flex-direction: column;
`

const TopBar = styled.header`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  padding-top: max(14px, env(safe-area-inset-top));
  background: #fff;
  border-bottom: 1px solid #f3f4f6;
`

const BackButton = styled.button`
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  color: #374151;
  line-height: 1;
  -webkit-tap-highlight-color: transparent;
  &:active { background: #f3f4f6; }
`

const TopTitle = styled.h1`
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  flex: 1;
`

const ScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 16px;
  max-width: 480px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

// ─── Create button ────────────────────────────────────────────────────────────

const CreateButton = styled.button`
  width: 100%;
  padding: 16px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  &:active:not(:disabled) { background: #4f46e5; }
  &:disabled { opacity: 0.6; }
`

// ─── Section ─────────────────────────────────────────────────────────────────

const SectionTitle = styled.h2`
  font-size: 13px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
`

const EmptyText = styled.p`
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  padding: 32px 0;
  margin: 0;
`

// ─── Room card ───────────────────────────────────────────────────────────────

const RoomCard = styled(motion.button)`
  width: 100%;
  background: #fff;
  border: 1.5px solid #e5e7eb;
  border-radius: 16px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  text-align: left;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  &:active { border-color: #a5b4fc; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12); }
`

const RoomEmoji = styled.div`
  font-size: 32px;
  flex-shrink: 0;
  width: 44px;
  text-align: center;
`

const RoomInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const RoomTitle = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #111827;
`

const RoomSub = styled.div`
  font-size: 13px;
  color: #6b7280;
  margin-top: 2px;
`

const JoinBadge = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
  background: #ede9fe;
  padding: 4px 12px;
  border-radius: 20px;
  flex-shrink: 0;
`

// ─── Waiting overlay ─────────────────────────────────────────────────────────

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 50;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: max(0px, env(safe-area-inset-bottom));
`

const Sheet = styled(motion.div)`
  background: #fff;
  border-radius: 24px 24px 0 0;
  padding: 32px 24px 28px;
  width: 100%;
  max-width: 480px;
  text-align: center;
`

const SheetHandle = styled.div`
  width: 40px;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  margin: 0 auto 24px;
`

const WaitingTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px;
`

const WaitingDesc = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 24px;
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
  font-size: 13px;
  color: #374151;
  background: #f9fafb;
  outline: none;
  min-width: 0;
`

const CopyButton = styled.button`
  padding: 10px 16px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  &:active { background: #4f46e5; }
`

const CancelButton = styled.button`
  width: 100%;
  padding: 13px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { background: #e5e7eb; }
`

const Spinner = styled(motion.div)`
  width: 36px;
  height: 36px;
  border: 3px solid #e5e7eb;
  border-top-color: #6366f1;
  border-radius: 50%;
  margin: 0 auto 20px;
`

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return '방금'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  return `${Math.floor(diff / 3600)}시간 전`
}

// ─── Component ───────────────────────────────────────────────────────────────

export function LobbyPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { createPvpGame, reset } = useGameStore()

  const [rooms, setRooms] = useState<WaitingGame[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [waitingGameId, setWaitingGameId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Fetch waiting games
  async function fetchRooms() {
    const { data } = await supabase
      .from('games')
      .select('id, created_at, player_white, profiles!games_player_white_fkey(username)')
      .eq('status', 'waiting')
      .eq('game_type_id', 'tictactoe')
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) setRooms(data as unknown as WaitingGame[])
  }

  useEffect(() => {
    fetchRooms()

    // Realtime subscription
    const channel = supabase
      .channel('lobby')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games' },
        () => fetchRooms(),
      )
      .subscribe()

    // Polling fallback: refresh lobby list every 2s
    const pollInterval = setInterval(fetchRooms, 2000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(pollInterval)
    }
  }, [])

  // Subscribe to waiting game to detect when opponent joins
  useEffect(() => {
    if (!waitingGameId) return

    async function checkWaiting() {
      const { data } = await supabase
        .from('games')
        .select('status')
        .eq('id', waitingGameId!)
        .single()
      if (data?.status === 'active') {
        navigate(`/game/${waitingGameId}`)
      }
    }

    // Realtime subscription
    const channel = supabase
      .channel(`waiting:${waitingGameId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${waitingGameId}` },
        checkWaiting,
      )
      .subscribe()

    // Polling fallback: check every 1.5s
    const pollInterval = setInterval(checkWaiting, 1500)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(pollInterval)
    }
  }, [waitingGameId, navigate])

  async function handleCreate() {
    if (!profile) return
    setIsCreating(true)
    try {
      const gameId = await createPvpGame(profile.id)
      setWaitingGameId(gameId)
    } finally {
      setIsCreating(false)
    }
  }

  async function handleJoin(gameId: string) {
    if (!profile) return
    navigate(`/game/${gameId}?join=1`)
  }

  async function handleCancelWaiting() {
    if (!waitingGameId) return
    await supabase
      .from('games')
      .update({ status: 'abandoned' })
      .eq('id', waitingGameId)
    reset()
    setWaitingGameId(null)
  }

  function handleCopyLink() {
    if (!waitingGameId) return
    navigator.clipboard.writeText(`${window.location.origin}/game/${waitingGameId}?join=1`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inviteUrl = waitingGameId
    ? `${window.location.origin}/game/${waitingGameId}?join=1`
    : ''

  return (
    <Page>
      <TopBar>
        <BackButton onClick={() => navigate('/')} aria-label="뒤로">←</BackButton>
        <TopTitle>틱택토 — PvP 대전</TopTitle>
      </TopBar>

      <ScrollArea>
        <CreateButton onClick={handleCreate} disabled={isCreating || !!waitingGameId}>
          {isCreating ? '방 만드는 중...' : '+ 새 게임 만들기'}
        </CreateButton>

        <SectionTitle>대기 중인 게임</SectionTitle>

        {rooms.length === 0 ? (
          <EmptyText>대기 중인 게임이 없습니다</EmptyText>
        ) : (
          rooms
            .filter((r) => r.player_white !== profile?.id)
            .map((room) => (
              <RoomCard
                key={room.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                onClick={() => handleJoin(room.id)}
              >
                <RoomEmoji>✕⊙</RoomEmoji>
                <RoomInfo>
                  <RoomTitle>{room.profiles?.username ?? '알 수 없음'}의 게임</RoomTitle>
                  <RoomSub>틱택토 · {timeAgo(room.created_at)}</RoomSub>
                </RoomInfo>
                <JoinBadge>참가</JoinBadge>
              </RoomCard>
            ))
        )}
      </ScrollArea>

      {/* Waiting for opponent sheet */}
      <AnimatePresence>
        {waitingGameId && (
          <Overlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Sheet
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            >
              <SheetHandle />
              <Spinner
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <WaitingTitle>상대방을 기다리는 중...</WaitingTitle>
              <WaitingDesc>아래 링크를 친구에게 공유하거나<br />로비에서 상대방이 참가하길 기다리세요</WaitingDesc>
              <LinkBox>
                <LinkInput value={inviteUrl} readOnly />
                <CopyButton onClick={handleCopyLink}>
                  {copied ? '복사됨 ✓' : '복사'}
                </CopyButton>
              </LinkBox>
              <CancelButton onClick={handleCancelWaiting}>방 나가기</CancelButton>
            </Sheet>
          </Overlay>
        )}
      </AnimatePresence>
    </Page>
  )
}
