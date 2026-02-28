import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from '@emotion/styled'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { getAccuracy } from '@/lib/game-logic/reaction-speed'
import type { GameState } from '@/lib/game-logic/reaction-speed'
import { fetchTopScores, fetchMyBest, saveScore } from '@/lib/leaderboard'
import type { LeaderboardEntry } from '@/lib/leaderboard'
import ReactionSpeedBoard from '@/components/game/ReactionSpeedBoard'

const GAME_TYPE = 'reaction-speed-game'

type PagePhase = 'lobby' | 'playing' | 'result'

export function ReactionSpeedPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const [phase, setPhase] = useState<PagePhase>('lobby')
  const [topScores, setTopScores] = useState<LeaderboardEntry[]>([])
  const [myBest, setMyBest] = useState<LeaderboardEntry | null>(null)
  const [finalState, setFinalState] = useState<GameState | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newRecord, setNewRecord] = useState(false)

  // Load leaderboard
  const loadLeaderboard = useCallback(async () => {
    const scores = await fetchTopScores(GAME_TYPE)
    setTopScores(scores)
    if (profile) {
      const best = await fetchMyBest(GAME_TYPE, profile.id)
      setMyBest(best)
    }
  }, [profile])

  useEffect(() => {
    loadLeaderboard()
  }, [loadLeaderboard])

  // Start game
  const handleStart = () => {
    setFinalState(null)
    setSaved(false)
    setNewRecord(false)
    setPhase('playing')
  }

  // Game ended
  const handleGameEnd = useCallback((state: GameState) => {
    setFinalState(state)
    setPhase('result')
  }, [])

  // Save result
  const handleSave = async () => {
    if (!profile || !finalState || saving) return
    setSaving(true)
    const accuracy = getAccuracy(finalState)
    const isNew = !myBest || finalState.score > myBest.score
    setNewRecord(isNew)
    await saveScore(GAME_TYPE, profile.id, finalState.score, accuracy, finalState.maxCombo)
    await loadLeaderboard()
    setSaving(false)
    setSaved(true)
  }

  // Play again
  const handlePlayAgain = async () => {
    if (!saved && profile && finalState) {
      const accuracy = getAccuracy(finalState)
      await saveScore(GAME_TYPE, profile.id, finalState.score, accuracy, finalState.maxCombo)
      await loadLeaderboard()
    }
    handleStart()
  }

  // ── Lobby (leaderboard + start) ──
  if (phase === 'lobby') {
    return (
      <Page>
        <TopBar>
          <BackButton onClick={() => navigate('/')}>← 홈</BackButton>
          <Title>Reaction Speed</Title>
          <Spacer />
        </TopBar>

        <Content>
          <LeaderboardSection>
            <SectionTitle>Top 10 랭킹</SectionTitle>
            {topScores.length === 0 ? (
              <EmptyMsg>아직 기록이 없습니다. 첫 번째 도전자가 되어보세요!</EmptyMsg>
            ) : (
              <RankList>
                <RankHeader>
                  <span>#</span>
                  <span>닉네임</span>
                  <span>점수</span>
                  <span>적중률</span>
                </RankHeader>
                {topScores.map((entry, i) => (
                  <RankRow
                    key={entry.id}
                    $highlight={entry.player_id === profile?.id}
                  >
                    <RankNum $top3={i < 3}>{i + 1}</RankNum>
                    <RankName>
                      {entry.profiles?.username ?? '???'}
                      {entry.player_id === profile?.id && <MyBadge>나</MyBadge>}
                    </RankName>
                    <RankScore>{entry.score.toLocaleString()}</RankScore>
                    <RankAccuracy>
                      {entry.accuracy != null ? `${Math.round(entry.accuracy * 100)}%` : '-'}
                    </RankAccuracy>
                  </RankRow>
                ))}
              </RankList>
            )}

            {myBest && (
              <MyBestCard>
                내 최고 기록: <strong>{myBest.score.toLocaleString()}</strong>점
              </MyBestCard>
            )}
          </LeaderboardSection>

          <BigStartButton onClick={handleStart}>게임 시작</BigStartButton>
        </Content>
      </Page>
    )
  }

  // Quit (no save)
  const handleQuit = () => {
    setFinalState(null)
    setSaved(false)
    setNewRecord(false)
    setPhase('lobby')
  }

  // ── Playing ──
  if (phase === 'playing') {
    return (
      <Page>
        <GameWrapper>
          <ReactionSpeedBoard onGameEnd={handleGameEnd} onQuit={handleQuit} />
        </GameWrapper>
      </Page>
    )
  }

  // ── Result ──
  if (phase === 'result' && finalState) {
    const accuracy = getAccuracy(finalState)
    const totalTargets = finalState.clicks + finalState.misses

    return (
      <Page>
        <AnimatePresence>
          <ResultOverlayMotion
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <ResultSheetMotion
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
            >
              <ResultTitle>게임 종료!</ResultTitle>
              {newRecord && saved && <NewRecordBadge>새 최고 기록!</NewRecordBadge>}

              <ScoreBig>{finalState.score.toLocaleString()}</ScoreBig>
              <ScoreLabel>총점</ScoreLabel>

              <StatGrid>
                <StatItem>
                  <StatValue>{finalState.clicks}</StatValue>
                  <StatLabel>클릭</StatLabel>
                </StatItem>
                <StatItem>
                  <StatValue>{finalState.misses}</StatValue>
                  <StatLabel>미스</StatLabel>
                </StatItem>
                <StatItem>
                  <StatValue>{Math.round(accuracy * 100)}%</StatValue>
                  <StatLabel>적중률</StatLabel>
                </StatItem>
                <StatItem>
                  <StatValue>{finalState.maxCombo}</StatValue>
                  <StatLabel>최대 콤보</StatLabel>
                </StatItem>
              </StatGrid>

              {finalState.decoyClicks > 0 && (
                <DecoyPenaltyRow>
                  감점 클릭: <strong>{finalState.decoyClicks}회</strong> (-{finalState.decoyClicks * 50}점)
                </DecoyPenaltyRow>
              )}

              <GradeBar>
                {(['perfect', 'great', 'good', 'ok'] as const).map(g => (
                  <GradeItem key={g}>
                    <GradeCount $grade={g}>{finalState.grades[g]}</GradeCount>
                    <GradeLabel>{g.toUpperCase()}</GradeLabel>
                    <GradePercent>
                      {totalTargets > 0 ? Math.round((finalState.grades[g] / totalTargets) * 100) : 0}%
                    </GradePercent>
                  </GradeItem>
                ))}
              </GradeBar>

              <ResultButtons>
                {!saved ? (
                  <SaveButton onClick={handleSave} disabled={saving}>
                    {saving ? '저장 중...' : '확인 (저장)'}
                  </SaveButton>
                ) : (
                  <SaveButton onClick={() => setPhase('lobby')}>
                    랭킹 보기
                  </SaveButton>
                )}
                <RetryButton onClick={handlePlayAgain}>다시 하기</RetryButton>
              </ResultButtons>
            </ResultSheetMotion>
          </ResultOverlayMotion>
        </AnimatePresence>
      </Page>
    )
  }

  return null
}

// ── Styled Components ──

const Page = styled.div`
  min-height: 100dvh;
  background: #f9fafb;
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

const EmptyMsg = styled.p`
  font-size: 14px;
  color: #9ca3af;
  text-align: center;
  padding: 32px 0;
`

const RankList = styled.div`
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
`

const RankHeader = styled.div`
  display: grid;
  grid-template-columns: 36px 1fr 80px 60px;
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #9ca3af;
  border-bottom: 1px solid #f3f4f6;
`

const RankRow = styled.div<{ $highlight: boolean }>`
  display: grid;
  grid-template-columns: 36px 1fr 80px 60px;
  padding: 10px 14px;
  align-items: center;
  font-size: 14px;
  background: ${p => (p.$highlight ? '#f5f3ff' : 'transparent')};
  border-bottom: 1px solid #f9fafb;
`

const RankNum = styled.span<{ $top3: boolean }>`
  font-weight: 700;
  color: ${p => (p.$top3 ? '#f59e0b' : '#6b7280')};
`

const RankName = styled.span`
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 6px;
`

const MyBadge = styled.span`
  font-size: 10px;
  background: #6366f1;
  color: #fff;
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 700;
`

const RankScore = styled.span`
  font-weight: 700;
  color: #111827;
  text-align: right;
  font-variant-numeric: tabular-nums;
`

const RankAccuracy = styled.span`
  font-size: 13px;
  color: #6b7280;
  text-align: right;
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
  height: 100dvh;
  overflow: hidden;
  padding-top: max(0px, env(safe-area-inset-top));
  padding-bottom: max(0px, env(safe-area-inset-bottom));
`

const ResultOverlayMotion = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 50;
`

const ResultSheetMotion = styled(motion.div)`
  background: #fff;
  border-radius: 20px;
  padding: 28px 24px;
  width: 100%;
  max-width: 400px;
  text-align: center;
`

const ResultTitle = styled.h2`
  font-size: 22px;
  font-weight: 800;
  color: #111827;
  margin: 0 0 4px;
`

const NewRecordBadge = styled.div`
  display: inline-block;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
  margin-bottom: 8px;
`

const ScoreBig = styled.div`
  font-size: 42px;
  font-weight: 800;
  color: #6366f1;
  margin-top: 8px;
  font-variant-numeric: tabular-nums;
`

const ScoreLabel = styled.div`
  font-size: 14px;
  color: #9ca3af;
  margin-bottom: 16px;
`

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 8px;
  margin-bottom: 16px;
`

const StatItem = styled.div`
  text-align: center;
`

const StatValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #111827;
`

const StatLabel = styled.div`
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
`

const GRADE_COLORS: Record<string, string> = {
  perfect: '#f59e0b',
  great: '#22c55e',
  good: '#3b82f6',
  ok: '#9ca3af',
}

const DecoyPenaltyRow = styled.div`
  font-size: 13px;
  color: #ef4444;
  text-align: center;
  margin-bottom: 12px;
`

const GradeBar = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 6px;
  margin-bottom: 20px;
`

const GradeItem = styled.div`
  text-align: center;
`

const GradeCount = styled.div<{ $grade: string }>`
  font-size: 18px;
  font-weight: 700;
  color: ${p => GRADE_COLORS[p.$grade] ?? '#111'};
`

const GradeLabel = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: #6b7280;
`

const GradePercent = styled.div`
  font-size: 11px;
  color: #9ca3af;
`

const ResultButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const SaveButton = styled.button`
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  background: #6366f1;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  &:disabled { opacity: 0.5; }
  &:active:not(:disabled) { background: #4f46e5; }
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
