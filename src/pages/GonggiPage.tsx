import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from '@emotion/styled'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import type { GonggiResult } from '@/lib/game-logic/gonggi'
import { fetchGonggiTopScores, fetchGonggiMyBest, saveGonggiScore } from '@/lib/gonggi-leaderboard'
import type { GonggiLeaderboardEntry } from '@/lib/gonggi-leaderboard'
import GonggiBoard from '@/components/game/GonggiBoard'
import GonggiLeaderboard from '@/components/game/GonggiLeaderboard'

type PagePhase = 'lobby' | 'playing' | 'result'

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  const millis = ms % 1000
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}

export function GonggiPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const [phase, setPhase] = useState<PagePhase>('lobby')
  const [result, setResult] = useState<GonggiResult | null>(null)
  const [topScores, setTopScores] = useState<GonggiLeaderboardEntry[]>([])
  const [myBest, setMyBest] = useState<GonggiLeaderboardEntry | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const loadLeaderboard = useCallback(async () => {
    const scores = await fetchGonggiTopScores()
    setTopScores(scores)
    if (profile) {
      const best = await fetchGonggiMyBest(profile.id)
      setMyBest(best)
    }
  }, [profile])

  useEffect(() => {
    loadLeaderboard()
  }, [loadLeaderboard])

  const handleStart = () => {
    setResult(null)
    setSaved(false)
    setPhase('playing')
  }

  const handleGameEnd = useCallback(async (gameResult: GonggiResult) => {
    setResult(gameResult)
    setPhase('result')
    // Auto-save
    if (profile) {
      setSaving(true)
      await saveGonggiScore(
        profile.id,
        gameResult.clearTimeMs,
        gameResult.failCount,
        gameResult.chaosSurvived,
      )
      await loadLeaderboard()
      setSaving(false)
      setSaved(true)
    }
  }, [profile, loadLeaderboard])

  const handleQuit = () => {
    setResult(null)
    setPhase('lobby')
  }

  const handlePlayAgain = () => {
    handleStart()
  }

  // ── Lobby ──
  if (phase === 'lobby') {
    return (
      <Page>
        <TopBar>
          <BackButton onClick={() => navigate('/')}>← 홈</BackButton>
          <Title>공기놀이</Title>
          <Spacer />
        </TopBar>

        <Content>
          <HeroSection>
            <HeroEmoji>🫴</HeroEmoji>
            <HeroTitle>열받는 공기놀이</HeroTitle>
            <HeroDesc>
              5개의 공깃돌로 일단~꺾기까지 클리어하세요.
              <br />
              3라운드부터 변칙 룰이 발동됩니다... 😈
            </HeroDesc>
          </HeroSection>

          <RulesSection>
            <RuleTitle>게임 규칙</RuleTitle>
            <RuleList>
              <RuleItem>
                <RuleEmoji>1️⃣</RuleEmoji>
                <RuleText>일단: 하나씩 집기 (×4)</RuleText>
              </RuleItem>
              <RuleItem>
                <RuleEmoji>2️⃣</RuleEmoji>
                <RuleText>이단: 두 개씩 집기 (×2)</RuleText>
              </RuleItem>
              <RuleItem>
                <RuleEmoji>3️⃣</RuleEmoji>
                <RuleText>삼단: 세 개 + 한 개</RuleText>
              </RuleItem>
              <RuleItem>
                <RuleEmoji>4️⃣</RuleEmoji>
                <RuleText>사단: 네 개 한번에</RuleText>
              </RuleItem>
              <RuleItem>
                <RuleEmoji>5️⃣</RuleEmoji>
                <RuleText>꺾기: 전부 던져서 잡기</RuleText>
              </RuleItem>
            </RuleList>
          </RulesSection>

          <ChaosWarning>
            ⚠️ 라운드 3부터 변칙 룰 발동!
            <br />
            <small>새가 된 공기, 고양이 습격, 가짜 클리어 등...</small>
          </ChaosWarning>

          <LeaderboardSection>
            <SectionTitle>클리어 랭킹 (빠른 순)</SectionTitle>
            <GonggiLeaderboard entries={topScores} myId={profile?.id} />
            {myBest && (
              <MyBestCard>
                내 최고 기록: <strong>{formatTime(myBest.clear_time_ms)}</strong>
              </MyBestCard>
            )}
          </LeaderboardSection>

          <BigStartButton onClick={handleStart}>게임 시작 🫴</BigStartButton>
        </Content>
      </Page>
    )
  }

  // ── Playing ──
  if (phase === 'playing') {
    return (
      <Page $dark>
        <GameWrapper>
          <GonggiBoard onGameEnd={handleGameEnd} onQuit={handleQuit} />
        </GameWrapper>
      </Page>
    )
  }

  // ── Result ──
  if (phase === 'result' && result) {
    return (
      <Page>
        <AnimatePresence>
          <ResultOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <ResultSheet
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
            >
              <ResultEmoji>🎉</ResultEmoji>
              <ResultTitle>전체 클리어!</ResultTitle>

              <ClearTime>{formatTime(result.clearTimeMs)}</ClearTime>
              <ClearLabel>클리어 시간</ClearLabel>

              <StatGrid>
                <StatItem>
                  <StatValue>{result.failCount}</StatValue>
                  <StatLabel>실패 횟수</StatLabel>
                </StatItem>
                <StatItem>
                  <StatValue>{result.chaosSurvived}</StatValue>
                  <StatLabel>변칙 생존</StatLabel>
                </StatItem>
              </StatGrid>

              {saving && <SavingText>저장 중...</SavingText>}
              {saved && <SavedText>기록 저장 완료!</SavedText>}

              <ResultButtons>
                <LobbyButton onClick={() => setPhase('lobby')}>
                  랭킹 보기
                </LobbyButton>
                <RetryButton onClick={handlePlayAgain}>다시 하기</RetryButton>
              </ResultButtons>
            </ResultSheet>
          </ResultOverlay>
        </AnimatePresence>
      </Page>
    )
  }

  return null
}

// ── Styled Components ──

const Page = styled.div<{ $dark?: boolean }>`
  min-height: 100dvh;
  background: ${({ $dark }) => ($dark ? '#0f172a' : '#f9fafb')};
  display: flex;
  flex-direction: column;
`

const TopBar = styled.header`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  padding-top: max(12px, env(safe-area-inset-top));
  background: #fff;
  border-bottom: 1px solid #f3f4f6;
`

const BackButton = styled.button`
  background: none;
  border: none;
  font-size: 15px;
  color: #6366f1;
  cursor: pointer;
  padding: 6px 8px;
  font-weight: 600;
`

const Title = styled.h1`
  flex: 1;
  text-align: center;
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  margin: 0;
`

const Spacer = styled.div`width: 50px;`

const Content = styled.div`
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

const HeroSection = styled.div`
  text-align: center;
  padding: 24px 0 8px;
`

const HeroEmoji = styled.div`
  font-size: 56px;
  margin-bottom: 8px;
`

const HeroTitle = styled.h2`
  font-size: 22px;
  font-weight: 800;
  color: #111827;
  margin: 0 0 8px;
`

const HeroDesc = styled.p`
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0;
`

const RulesSection = styled.div`
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 16px;
`

const RuleTitle = styled.h3`
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 12px;
`

const RuleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const RuleItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`

const RuleEmoji = styled.span`
  font-size: 18px;
`

const RuleText = styled.span`
  font-size: 14px;
  color: #374151;
`

const ChaosWarning = styled.div`
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #92400e;
  text-align: center;
  line-height: 1.6;

  small {
    font-weight: 400;
    font-size: 12px;
    color: #a16207;
  }
`

const BigStartButton = styled.button`
  width: 100%;
  padding: 16px;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  background: #3b82f6;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  &:hover { background: #2563eb; }
  &:active { background: #1d4ed8; }
`

const GameWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100dvh;
  overflow: hidden;
  padding: max(8px, env(safe-area-inset-top)) 0 max(8px, env(safe-area-inset-bottom));
`

const ResultOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 50;
`

const ResultSheet = styled(motion.div)`
  background: #fff;
  border-radius: 20px;
  padding: 28px 24px;
  width: 100%;
  max-width: 400px;
  text-align: center;
`

const ResultEmoji = styled.div`
  font-size: 48px;
  margin-bottom: 4px;
`

const ResultTitle = styled.h2`
  font-size: 22px;
  font-weight: 800;
  color: #111827;
  margin: 0 0 16px;
`

const ClearTime = styled.div`
  font-size: 42px;
  font-weight: 800;
  color: #6366f1;
  font-variant-numeric: tabular-nums;
`

const ClearLabel = styled.div`
  font-size: 14px;
  color: #9ca3af;
  margin-bottom: 20px;
`

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
`

const StatItem = styled.div`
  text-align: center;
`

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #111827;
`

const StatLabel = styled.div`
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
`

const ResultButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const LobbyButton = styled.button`
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  background: #6366f1;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  &:active { background: #4f46e5; }
`

const RetryButton = styled.button`
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: 700;
  color: #6366f1;
  background: #f5f3ff;
  border: 1.5px solid #e0e7ff;
  border-radius: 12px;
  cursor: pointer;
  &:active { background: #ede9fe; }
`

const LeaderboardSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin: 0;
`

const MyBestCard = styled.div`
  background: #f5f3ff;
  border: 1px solid #e0e7ff;
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 14px;
  color: #4338ca;
  text-align: center;
`

const SavingText = styled.div`
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 8px;
`

const SavedText = styled.div`
  font-size: 13px;
  color: #22c55e;
  font-weight: 600;
  margin-bottom: 8px;
`
