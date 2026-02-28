import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from '@emotion/styled'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useGameStore } from '@/store/gameStore'
import { useAuthStore } from '@/store/authStore'
import type { AIDifficulty } from '@/types/database'
import type { GameTypeId } from '@/store/gameStore'

type SheetStep = 'mode' | 'difficulty'

// ─── Layout ────────────────────────────────────────────────────────────────

const Page = styled.div`
  min-height: 100dvh;
  background: #f9fafb;
  display: flex;
  flex-direction: column;
`

const TopBar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  padding-top: max(16px, env(safe-area-inset-top));
  background: #fff;
  border-bottom: 1px solid #f3f4f6;
`

const AppName = styled.h1`
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  margin: 0;
`

const LogoutButton = styled.button`
  background: none;
  border: none;
  font-size: 14px;
  color: #9ca3af;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 8px;
  -webkit-tap-highlight-color: transparent;

  &:active { background: #f3f4f6; }
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
  gap: 20px;
`

// ─── Profile section ───────────────────────────────────────────────────────

const ProfileCard = styled.div`
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 16px;
  padding: 20px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 16px;
`

const Avatar = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 800;
  flex-shrink: 0;
`

const ProfileInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const Username = styled.div`
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const EloRow = styled.div`
  font-size: 13px;
  opacity: 0.85;
  margin-top: 2px;
`

// ─── Game list ─────────────────────────────────────────────────────────────

const SectionTitle = styled.h2`
  font-size: 14px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
`

const GameCard = styled.button`
  width: 100%;
  background: #fff;
  border: 1.5px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  text-align: left;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:active {
    border-color: #a5b4fc;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
  }
`

const GameEmoji = styled.div`
  font-size: 36px;
  flex-shrink: 0;
  width: 52px;
  text-align: center;
`

const GameInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const GameName = styled.div`
  font-size: 17px;
  font-weight: 700;
  color: #111827;
`

const GameDesc = styled.div`
  font-size: 13px;
  color: #6b7280;
  margin-top: 2px;
`

const ComingSoon = styled.span`
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  background: #f3f4f6;
  color: #9ca3af;
  margin-top: 6px;
  display: inline-block;
`

const PlayIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #ede9fe;
  color: #7c3aed;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
`

// ─── Difficulty bottom sheet ────────────────────────────────────────────────

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 40;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: max(0px, env(safe-area-inset-bottom));
`

const Sheet = styled(motion.div)`
  background: #fff;
  border-radius: 24px 24px 0 0;
  padding: 8px 20px 28px;
  width: 100%;
  max-width: 480px;
`

const SheetHandle = styled.div`
  width: 40px;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  margin: 12px auto 20px;
`

const SheetTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px;
`

const SheetSub = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 20px;
`

const DifficultyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

interface DiffBtnProps { selected: boolean }
const DifficultyButton = styled.button<DiffBtnProps>`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 2px solid ${({ selected }) => (selected ? '#6366f1' : '#e5e7eb')};
  background: ${({ selected }) => (selected ? '#f5f3ff' : '#fff')};
  cursor: pointer;
  text-align: left;
  -webkit-tap-highlight-color: transparent;
  width: 100%;
`

const DiffEmoji = styled.span`font-size: 24px;`

const DiffText = styled.div`flex: 1;`
const DiffName = styled.div`font-size: 15px; font-weight: 700; color: #111827;`
const DiffDesc = styled.div`font-size: 12px; color: #6b7280; margin-top: 1px;`

const StartButton = styled.button`
  width: 100%;
  margin-top: 20px;
  padding: 15px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  &:disabled { opacity: 0.5; }
  &:active:not(:disabled) { background: #4f46e5; }
`

const ModeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

interface ModeBtnProps { selected: boolean }
const ModeButton = styled.button<ModeBtnProps>`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 12px;
  border: 2px solid ${({ selected }) => (selected ? '#6366f1' : '#e5e7eb')};
  background: ${({ selected }) => (selected ? '#f5f3ff' : '#fff')};
  cursor: pointer;
  text-align: left;
  width: 100%;
  -webkit-tap-highlight-color: transparent;
`

const ModeEmoji = styled.span`font-size: 26px;`
const ModeText = styled.div`flex: 1;`
const ModeName = styled.div`font-size: 15px; font-weight: 700; color: #111827;`
const ModeDesc = styled.div`font-size: 12px; color: #6b7280; margin-top: 2px;`

const DIFFICULTIES: { value: AIDifficulty; emoji: string; name: string; desc: string }[] = [
  { value: 'easy', emoji: '😊', name: '쉬움', desc: '무작위로 둡니다' },
  { value: 'medium', emoji: '🤔', name: '보통', desc: '가끔 최선의 수를 둡니다' },
  { value: 'hard', emoji: '🤖', name: '어려움', desc: '알파베타 가지치기 AI' },
]

const ACTIVE_GAMES: { gameTypeId: GameTypeId; emoji: string; name: string; desc: string }[] = [
  { gameTypeId: 'tictactoe', emoji: '✕⊙', name: '틱택토', desc: '3x3 보드에서 3개 연속으로 이기세요' },
  { gameTypeId: 'gomoku', emoji: '⚫', name: '오목', desc: '15x15 보드에서 5개 연속으로 이기세요' },
]

const SOLO_GAMES: { path: string; emoji: string; name: string; desc: string }[] = [
  { path: '/reaction-speed', emoji: '🎯', name: '반응속도 게임', desc: '120초 동안 타겟 서클을 클릭하여 최고 점수 달성' },
]

const FUTURE_GAMES = [
  { emoji: '♟️', name: '체스', desc: '클래식 2인 전략 게임' },
]

// ─── Component ─────────────────────────────────────────────────────────────

export function HomePage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { profile } = useAuthStore()
  const { startNewGame } = useGameStore()

  const [showSheet, setShowSheet] = useState(false)
  const [sheetStep, setSheetStep] = useState<SheetStep>('mode')
  const [selectedDiff, setSelectedDiff] = useState<AIDifficulty>('medium')
  const [selectedGameType, setSelectedGameType] = useState<GameTypeId>('tictactoe')
  const [isStarting, setIsStarting] = useState(false)

  function handleOpenSheet(gameTypeId: GameTypeId) {
    setSelectedGameType(gameTypeId)
    setSheetStep('mode')
    setShowSheet(true)
  }

  function handleSelectMode(mode: 'ai' | 'pvp') {
    if (mode === 'pvp') {
      setShowSheet(false)
      navigate('/lobby')
    } else {
      setSheetStep('difficulty')
    }
  }

  async function handleStart() {
    if (!profile) return
    setIsStarting(true)
    try {
      const gameId = await startNewGame(profile.id, selectedDiff, selectedGameType)
      navigate(`/game/${gameId}`)
    } finally {
      setIsStarting(false)
    }
  }

  const selectedGame = ACTIVE_GAMES.find((g) => g.gameTypeId === selectedGameType)

  const initial = profile?.username?.charAt(0).toUpperCase() ?? '?'

  return (
    <Page>
      <TopBar>
        <AppName>게임 허브</AppName>
        <LogoutButton onClick={logout}>로그아웃</LogoutButton>
      </TopBar>

      <ScrollArea>
        {/* Profile */}
        <ProfileCard>
          <Avatar>{initial}</Avatar>
          <ProfileInfo>
            <Username>{profile?.username ?? '...'}</Username>
            <EloRow>ELO {profile?.elo_rating ?? 1200} · {profile?.total_games ?? 0}게임</EloRow>
          </ProfileInfo>
        </ProfileCard>

        {/* Game list */}
        <SectionTitle>게임 선택</SectionTitle>

        {ACTIVE_GAMES.map((g) => (
          <GameCard key={g.gameTypeId} onClick={() => handleOpenSheet(g.gameTypeId)}>
            <GameEmoji>{g.emoji}</GameEmoji>
            <GameInfo>
              <GameName>{g.name}</GameName>
              <GameDesc>{g.desc}</GameDesc>
            </GameInfo>
            <PlayIcon>▶</PlayIcon>
          </GameCard>
        ))}

        {SOLO_GAMES.map((g) => (
          <GameCard key={g.path} onClick={() => navigate(g.path)}>
            <GameEmoji>{g.emoji}</GameEmoji>
            <GameInfo>
              <GameName>{g.name}</GameName>
              <GameDesc>{g.desc}</GameDesc>
            </GameInfo>
            <PlayIcon>▶</PlayIcon>
          </GameCard>
        ))}

        {FUTURE_GAMES.map((g) => (
          <GameCard key={g.name} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            <GameEmoji>{g.emoji}</GameEmoji>
            <GameInfo>
              <GameName>{g.name}</GameName>
              <GameDesc>{g.desc}</GameDesc>
              <ComingSoon>준비 중</ComingSoon>
            </GameInfo>
          </GameCard>
        ))}
      </ScrollArea>

      {/* Difficulty bottom sheet */}
      <AnimatePresence>
        {showSheet && (
          <Overlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSheet(false)}
          >
            <Sheet
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              onClick={(e) => e.stopPropagation()}
            >
              <SheetHandle />

              {sheetStep === 'mode' ? (
                <>
                  <SheetTitle>{selectedGame?.name ?? '게임'}</SheetTitle>
                  <SheetSub>게임 모드를 선택하세요</SheetSub>
                  <ModeList>
                    <ModeButton selected={false} onClick={() => handleSelectMode('ai')}>
                      <ModeEmoji>🤖</ModeEmoji>
                      <ModeText>
                        <ModeName>AI 대전</ModeName>
                        <ModeDesc>혼자서 AI와 대결합니다</ModeDesc>
                      </ModeText>
                    </ModeButton>
                    <ModeButton selected={false} onClick={() => handleSelectMode('pvp')}>
                      <ModeEmoji>👥</ModeEmoji>
                      <ModeText>
                        <ModeName>친구와 대전 (PvP)</ModeName>
                        <ModeDesc>로비에서 매칭하거나 초대 링크를 공유하세요</ModeDesc>
                      </ModeText>
                    </ModeButton>
                  </ModeList>
                </>
              ) : (
                <>
                  <SheetTitle>AI 난이도</SheetTitle>
                  <SheetSub>난이도를 선택하세요</SheetSub>
                  <DifficultyList>
                    {DIFFICULTIES.map((d) => (
                      <DifficultyButton
                        key={d.value}
                        selected={selectedDiff === d.value}
                        onClick={() => setSelectedDiff(d.value)}
                      >
                        <DiffEmoji>{d.emoji}</DiffEmoji>
                        <DiffText>
                          <DiffName>{d.name}</DiffName>
                          <DiffDesc>{d.desc}</DiffDesc>
                        </DiffText>
                        {selectedDiff === d.value && <span style={{ color: '#6366f1' }}>✓</span>}
                      </DifficultyButton>
                    ))}
                  </DifficultyList>
                  <StartButton onClick={handleStart} disabled={isStarting}>
                    {isStarting ? '게임 시작 중...' : '게임 시작'}
                  </StartButton>
                </>
              )}
            </Sheet>
          </Overlay>
        )}
      </AnimatePresence>
    </Page>
  )
}
