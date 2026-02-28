import { useCallback, useEffect, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'
import {
  generateSchedule,
  createInitialGameState,
  applyClick,
  applyDecoyClick,
  applyMiss,
  getAccuracy,
  GAME_DURATION_MS,
} from '@/lib/game-logic/reaction-speed'
import type {
  TargetScheduleItem,
  GameState,
  Grade,
} from '@/lib/game-logic/reaction-speed'
import TargetCircle from './TargetCircle'

interface Props {
  onGameEnd: (state: GameState) => void
  onQuit: () => void
}

type GamePhase = 'ready' | 'playing' | 'paused' | 'finished'

export default function ReactionSpeedBoard({ onGameEnd, onQuit }: Props) {
  const [phase, setPhase] = useState<GamePhase>('ready')
  const [elapsedMs, setElapsedMs] = useState(0)
  const [gameState, setGameState] = useState<GameState>(createInitialGameState())
  const [schedule, setSchedule] = useState<TargetScheduleItem[]>([])
  const [activeTargetIds, setActiveTargetIds] = useState<Set<number>>(new Set())
  const [feedbackTargetIds, setFeedbackTargetIds] = useState<Set<number>>(new Set())

  const startTimeRef = useRef(0)
  const rafRef = useRef(0)
  const pausedAtRef = useRef(0)
  const gameStateRef = useRef(gameState)
  gameStateRef.current = gameState

  // Start game
  const startGame = useCallback(() => {
    const newSchedule = generateSchedule()
    setSchedule(newSchedule)
    setGameState(createInitialGameState())
    setActiveTargetIds(new Set())
    setFeedbackTargetIds(new Set())
    setElapsedMs(0)
    startTimeRef.current = performance.now()
    setPhase('playing')
  }, [])

  // Pause / Resume
  const handlePause = useCallback(() => {
    pausedAtRef.current = performance.now()
    cancelAnimationFrame(rafRef.current)
    setPhase('paused')
  }, [])

  const handleResume = useCallback(() => {
    const pausedDuration = performance.now() - pausedAtRef.current
    startTimeRef.current += pausedDuration
    setPhase('playing')
  }, [])

  // Game loop
  useEffect(() => {
    if (phase !== 'playing') return

    const tick = () => {
      const now = performance.now()
      const elapsed = now - startTimeRef.current

      if (elapsed >= GAME_DURATION_MS) {
        setElapsedMs(GAME_DURATION_MS)
        setPhase('finished')
        onGameEnd(gameStateRef.current)
        return
      }

      setElapsedMs(elapsed)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [phase, onGameEnd])

  // Activate targets based on elapsed time
  useEffect(() => {
    if (phase !== 'playing') return

    const newActive = new Set<number>()
    for (const t of schedule) {
      const age = elapsedMs - t.spawnTime
      // Target is active if spawned and not yet expired (+ 700ms for feedback)
      if (age >= 0 && age < t.duration + 700) {
        newActive.add(t.id)
      }
    }
    setActiveTargetIds(newActive)
  }, [elapsedMs, schedule, phase])

  // Handle hit (normal / speed)
  const handleHit = useCallback((targetId: number, clickTimeMs: number): { grade: Grade; score: number } | null => {
    const target = schedule.find(t => t.id === targetId)
    if (!target) return null
    if (feedbackTargetIds.has(targetId)) return null

    setFeedbackTargetIds(prev => new Set(prev).add(targetId))

    const { state: newState, result } = applyClick(
      gameStateRef.current,
      target.type,
      clickTimeMs,
      target.spawnTime,
      target.duration,
    )
    setGameState(newState)
    return { grade: result.grade, score: result.score }
  }, [schedule, feedbackTargetIds])

  // Handle decoy hit
  const handleDecoyHit = useCallback((targetId: number) => {
    if (feedbackTargetIds.has(targetId)) return
    setFeedbackTargetIds(prev => new Set(prev).add(targetId))
    setGameState(prev => applyDecoyClick(prev))
  }, [feedbackTargetIds])

  // Handle miss
  const handleMiss = useCallback((targetId: number) => {
    if (feedbackTargetIds.has(targetId)) return
    setFeedbackTargetIds(prev => new Set(prev).add(targetId))
    setGameState(prev => applyMiss(prev))
  }, [feedbackTargetIds])

  const remainingSec = Math.max(0, (GAME_DURATION_MS - elapsedMs) / 1000)
  const minutes = Math.floor(remainingSec / 60)
  const seconds = Math.floor(remainingSec % 60)
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  const accuracy = getAccuracy(gameState)
  const isActive = phase === 'playing'

  if (phase === 'ready') {
    return (
      <Wrapper>
        <ReadyScreen>
          <ReadyTitle>Reaction Speed</ReadyTitle>
          <ReadyDesc>120초 동안 타겟 서클을 클릭하여 최고 점수를 달성하세요!</ReadyDesc>
          <ReadyDesc style={{ fontSize: 13, color: '#9ca3af' }}>
            🔵 일반 · 🚨 스피드(고득점) · 💚 아군(누르면 감점!)
          </ReadyDesc>
          <StartButton onClick={startGame}>시작</StartButton>
        </ReadyScreen>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      {/* HUD */}
      <HUD>
        <TimerRow>
          <TimerText>{timeStr}</TimerText>
          <PauseButton onClick={handlePause}>⏸</PauseButton>
        </TimerRow>
        <TimerBar>
          <TimerFill $active={isActive} />
        </TimerBar>
      </HUD>

      {/* Game Area */}
      <GameArea>
        {schedule
          .filter(t => activeTargetIds.has(t.id))
          .map(t => (
            <TargetCircle
              key={t.id}
              target={t}
              gameElapsedMs={elapsedMs}
              paused={phase === 'paused'}
              onHit={handleHit}
              onDecoyHit={handleDecoyHit}
              onMiss={handleMiss}
            />
          ))
        }
      </GameArea>

      {/* Status Bar */}
      <StatusBar>
        <ScoreDisplay>Score: {gameState.score.toLocaleString()}</ScoreDisplay>
        <ComboDisplay $active={gameState.combo >= 5}>
          {gameState.combo >= 5
            ? `x${gameState.combo >= 30 ? 5 : gameState.combo >= 20 ? 4 : gameState.combo >= 10 ? 3 : 2} 콤보`
            : `${gameState.combo} 연속`
          }
        </ComboDisplay>
        <AccuracyDisplay>{Math.round(accuracy * 100)}%</AccuracyDisplay>
      </StatusBar>

      {/* Pause Overlay */}
      {phase === 'paused' && (
        <PauseOverlay>
          <PauseCard>
            <PauseTitle>일시정지</PauseTitle>
            <PauseButtons>
              <ResumeButton onClick={handleResume}>계속하기</ResumeButton>
              <QuitButton onClick={onQuit}>종료하기</QuitButton>
            </PauseButtons>
          </PauseCard>
        </PauseOverlay>
      )}
    </Wrapper>
  )
}

// ── Styled Components ──

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  height: 100%;
  min-height: 0;
  position: relative;
`

const HUD = styled.div`
  padding: 8px 12px 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
`

const TimerRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`

const TimerText = styled.div`
  font-size: 28px;
  font-weight: 700;
  text-align: center;
  color: #1f2937;
  font-variant-numeric: tabular-nums;
`

const PauseButton = styled.button`
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 18px;
  padding: 4px 8px;
  cursor: pointer;
  color: #6b7280;
  line-height: 1;
  &:active { background: #f3f4f6; }
`

const TimerBar = styled.div`
  width: 100%;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
`

const timerDrain = keyframes`
  from { width: 100%; }
  to   { width: 0%; }
`

const TimerFill = styled.div<{ $active: boolean }>`
  height: 100%;
  background: linear-gradient(90deg, #ef4444, #f59e0b, #22c55e);
  border-radius: 3px;
  width: 100%;
  animation: ${timerDrain} ${GAME_DURATION_MS}ms linear forwards;
  animation-play-state: ${p => (p.$active ? 'running' : 'paused')};
`

const GameArea = styled.div`
  position: relative;
  flex: 1;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  margin: 0 4px;
  overflow: hidden;
  touch-action: none;
  user-select: none;
`

const StatusBar = styled.div`
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
`

const ScoreDisplay = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  font-variant-numeric: tabular-nums;
`

const ComboDisplay = styled.div<{ $active: boolean }>`
  font-size: 16px;
  font-weight: 700;
  color: ${p => (p.$active ? '#f59e0b' : '#9ca3af')};
  transition: color 0.2s;
`

const AccuracyDisplay = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
`

const ReadyScreen = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 32px;
`

const ReadyTitle = styled.h1`
  font-size: 32px;
  font-weight: 800;
  color: #1f2937;
`

const ReadyDesc = styled.p`
  font-size: 16px;
  color: #6b7280;
  text-align: center;
  line-height: 1.5;
  margin: 0;
`

const StartButton = styled.button`
  padding: 14px 48px;
  font-size: 18px;
  font-weight: 700;
  color: white;
  background: #3b82f6;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.2s;
  &:hover { background: #2563eb; }
  &:active { background: #1d4ed8; }
`

// ── Pause Overlay ──

const PauseOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  border-radius: 8px;
`

const PauseCard = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 28px 24px;
  width: 80%;
  max-width: 280px;
  text-align: center;
`

const PauseTitle = styled.h2`
  font-size: 22px;
  font-weight: 800;
  color: #111827;
  margin: 0 0 20px;
`

const PauseButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const ResumeButton = styled.button`
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  background: #3b82f6;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  &:active { background: #2563eb; }
`

const QuitButton = styled.button`
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: 700;
  color: #ef4444;
  background: #fef2f2;
  border: 1.5px solid #fecaca;
  border-radius: 12px;
  cursor: pointer;
  &:active { background: #fee2e2; }
`
