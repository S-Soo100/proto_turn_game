import { useCallback, useEffect, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'
import { AnimatePresence, motion } from 'framer-motion'
import type { GonggiState, GonggiResult } from '@/lib/game-logic/gonggi'
import {
  createInitialState,
  scatterStones,
  startToss,
  completeToss,
  pickStones,
  catchStone,
  advanceStage,
  retryStage,
  failSubstep,
  loseStone,
  getResult,
  getRequiredPickCount,
  getSubstepCount,
  mulberry32,
  STONE_COUNT,
} from '@/lib/game-logic/gonggi'
import {
  checkChaos,
  applyChaosToState,
  type ChaosResult,
  type ChaosRule,
} from '@/lib/game-logic/gonggi-chaos'
import { birdTransformRule } from '@/lib/game-logic/chaos-rules/bird-transform'
import { catSwipeRule } from '@/lib/game-logic/chaos-rules/cat-swipe'
import { stoneEyesRule } from '@/lib/game-logic/chaos-rules/stone-eyes'
import { fakeClearRule } from '@/lib/game-logic/chaos-rules/fake-clear'
import { splitRule } from '@/lib/game-logic/chaos-rules/split'
import { danmakuRule } from '@/lib/game-logic/chaos-rules/danmaku'
import { screenFlipRule } from '@/lib/game-logic/chaos-rules/screen-flip'
import {
  createPhysicsWorld,
  updatePhysics,
  getStonePositions,
  applyTossForce,
  applyScatterForce,
  applyCatSwipeForce,
  destroyPhysicsWorld,
  setStonePosition,
  type PhysicsWorld,
  type StonePosition,
} from '@/lib/physics/gonggi-physics'

// ── Constants ──

const BOARD_WIDTH = 360
const BOARD_HEIGHT = 400
const ALL_CHAOS_RULES: ChaosRule[] = [
  birdTransformRule,
  catSwipeRule,
  stoneEyesRule,
  fakeClearRule,
  splitRule,
  danmakuRule,
  screenFlipRule,
]

const STONE_EMOJIS = ['🟡', '🔴', '🔵', '🟢', '🟣']
const STAGE_NAMES = ['', '일단', '이단', '삼단', '사단', '꺾기']

// ── Props ──

interface Props {
  onGameEnd: (result: GonggiResult) => void
  onQuit: () => void
}

// ── Component ──

export default function GonggiBoard({ onGameEnd, onQuit }: Props) {
  const [gameState, setGameState] = useState<GonggiState>(() => createInitialState())
  const [stonePositions, setStonePositions] = useState<StonePosition[]>([])
  const [chaosEffect, setChaosEffect] = useState<ChaosResult | null>(null)
  const [swipePath, setSwipePath] = useState<{ x: number; y: number }[]>([])
  const [selectedStoneIds, setSelectedStoneIds] = useState<Set<number>>(new Set())
  const [message, setMessage] = useState<string>('')
  const [danmakuComments, setDanmakuComments] = useState<{ text: string; yPercent: number; id: number }[]>([])
  const [isPaused, setIsPaused] = useState(false)

  const physicsRef = useRef<PhysicsWorld | null>(null)
  const gameStateRef = useRef(gameState)
  const rafRef = useRef(0)
  const startTimeRef = useRef(0)
  const pausedAtRef = useRef(0)
  const boardRef = useRef<HTMLDivElement>(null)
  const isSwipingRef = useRef(false)
  const chaosTimeoutRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const rngRef = useRef(() => Math.random())
  const danmakuIdRef = useRef(0)

  gameStateRef.current = gameState

  // ── Initialize physics ──
  useEffect(() => {
    const world = createPhysicsWorld(BOARD_WIDTH, BOARD_HEIGHT, STONE_COUNT)
    physicsRef.current = world

    // Position stones from initial state
    const state = gameStateRef.current
    state.stones.forEach((s, i) => {
      setStonePosition(world, i, (s.x / 100) * BOARD_WIDTH, (s.y / 100) * BOARD_HEIGHT)
    })

    rngRef.current = mulberry32(state.seed + Date.now())

    return () => {
      cancelAnimationFrame(rafRef.current)
      chaosTimeoutRef.current.forEach(clearTimeout)
      if (physicsRef.current) {
        destroyPhysicsWorld(physicsRef.current)
      }
    }
  }, [])

  // ── Game loop ──
  useEffect(() => {
    if (isPaused) return
    if (gameState.phase === 'success' || (!startTimeRef.current && gameState.phase === 'scatter')) {
      return
    }

    const tick = () => {
      if (!physicsRef.current) return
      updatePhysics(physicsRef.current)
      const positions = getStonePositions(physicsRef.current)
      setStonePositions(positions)

      // Update elapsed
      if (startTimeRef.current > 0) {
        const elapsed = performance.now() - startTimeRef.current
        gameStateRef.current = { ...gameStateRef.current, elapsedMs: Math.round(elapsed) }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [gameState.phase, isPaused])

  // ── Auto-scatter on phase changes ──
  useEffect(() => {
    if (gameState.phase === 'scatter') {
      handleScatter()
    }
  }, [gameState.phase, gameState.stage, gameState.failCount])

  // ── Handle game completion ──
  useEffect(() => {
    if (gameState.phase === 'success') {
      const result = getResult(gameState)
      if (result) {
        onGameEnd(result)
      }
    }
  }, [gameState.phase])

  // ── Actions ──

  const handleScatter = useCallback(() => {
    const newState = scatterStones(gameStateRef.current)
    setGameState(newState)
    gameStateRef.current = newState

    if (physicsRef.current) {
      newState.stones.forEach((s, i) => {
        setStonePosition(
          physicsRef.current!,
          i,
          (s.x / 100) * BOARD_WIDTH,
          (s.y / 100) * BOARD_HEIGHT,
        )
      })
      applyScatterForce(physicsRef.current, rngRef.current)
    }

    if (!startTimeRef.current) {
      startTimeRef.current = performance.now()
    }
  }, [])

  const handleToss = useCallback(() => {
    let state = gameStateRef.current
    if (state.phase !== 'toss') return

    state = startToss(state)
    state = completeToss(state)
    setGameState(state)
    gameStateRef.current = state

    // Apply toss force to physics
    if (physicsRef.current && state.tossedStoneId !== null) {
      if (state.tossedStoneId === -1) {
        // Stage 5: toss all
        for (let i = 0; i < STONE_COUNT; i++) {
          applyTossForce(physicsRef.current, i, (rngRef.current() - 0.5) * 2, -8)
        }
      } else {
        applyTossForce(physicsRef.current, state.tossedStoneId, 0, -10)
      }
    }

    // Check chaos after toss
    const chaos = checkChaos(state, 'after-toss', ALL_CHAOS_RULES, rngRef.current)
    if (chaos) {
      handleChaosEffect(state, chaos.result, chaos.rule)
      return
    }

    // For stage 5 or when pick phase starts, check before-pick chaos
    if (state.phase === 'pick') {
      const pickChaos = checkChaos(state, 'before-pick', ALL_CHAOS_RULES, rngRef.current)
      if (pickChaos) {
        handleChaosEffect(state, pickChaos.result, pickChaos.rule)
      }
    }

    // Check danmaku
    const danmaku = checkChaos(state, 'during-play', ALL_CHAOS_RULES, rngRef.current)
    if (danmaku && danmaku.result.animation === 'danmaku') {
      triggerDanmaku(danmaku.result, state, danmaku.rule)
    }
  }, [])

  const handleCatch = useCallback(() => {
    const state = gameStateRef.current
    if (state.phase !== 'catch') return

    // Check before-success chaos
    const chaos = checkChaos(state, 'before-success', ALL_CHAOS_RULES, rngRef.current)
    if (chaos) {
      handleChaosEffect(state, chaos.result, chaos.rule)
      return
    }

    const newState = catchStone(state, true)
    setGameState(newState)
    gameStateRef.current = newState

    // Check stage transition chaos
    if (newState.phase === 'stage-clear') {
      const stageChaos = checkChaos(newState, 'stage-transition', ALL_CHAOS_RULES, rngRef.current)
      if (stageChaos) {
        handleChaosEffect(newState, stageChaos.result, stageChaos.rule)
        return
      }
    }
  }, [])

  const handleSwipeStart = useCallback((e: React.PointerEvent) => {
    const state = gameStateRef.current
    if (state.phase !== 'pick') return

    isSwipingRef.current = true
    const rect = boardRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setSwipePath([{ x, y }])
    setSelectedStoneIds(new Set())
  }, [])

  const handleSwipeMove = useCallback((e: React.PointerEvent) => {
    if (!isSwipingRef.current) return
    const rect = boardRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setSwipePath((prev) => [...prev, { x, y }])

    // Check for stones near the swipe path
    const positions = stonePositions
    const PICK_RADIUS = 30
    const state = gameStateRef.current

    positions.forEach((pos) => {
      const stone = state.stones[pos.id]
      if (stone && stone.status === 'floor') {
        const dist = Math.sqrt((pos.x - x) ** 2 + (pos.y - y) ** 2)
        if (dist < PICK_RADIUS) {
          setSelectedStoneIds((prev) => new Set([...prev, pos.id]))
        }
      }
    })
  }, [stonePositions])

  const handleSwipeEnd = useCallback(() => {
    if (!isSwipingRef.current) return
    isSwipingRef.current = false
    setSwipePath([])

    const state = gameStateRef.current
    if (state.phase !== 'pick') return

    const required = getRequiredPickCount(state.stage, state.substep)
    const ids = Array.from(selectedStoneIds)

    if (ids.length === required) {
      const newState = pickStones(state, ids)
      if (newState) {
        setGameState(newState)
        gameStateRef.current = newState
        setSelectedStoneIds(new Set())
      }
    } else {
      // Wrong count — show message
      showMessage(`${required}개를 골라야 해요! (${ids.length}개 선택됨)`)
      setSelectedStoneIds(new Set())
    }
  }, [selectedStoneIds])

  const handleStageAdvance = useCallback(() => {
    const state = gameStateRef.current
    if (state.phase !== 'stage-clear') return

    const newState = advanceStage(state)
    setGameState(newState)
    gameStateRef.current = newState

    // Reposition physics stones
    if (physicsRef.current) {
      newState.stones.forEach((s, i) => {
        setStonePosition(
          physicsRef.current!,
          i,
          (s.x / 100) * BOARD_WIDTH,
          (s.y / 100) * BOARD_HEIGHT,
        )
      })
    }
  }, [])

  const handleRetry = useCallback(() => {
    const state = gameStateRef.current
    if (state.phase !== 'failed') return

    const newState = retryStage(state)
    setGameState(newState)
    gameStateRef.current = newState

    if (physicsRef.current) {
      newState.stones.forEach((s, i) => {
        setStonePosition(
          physicsRef.current!,
          i,
          (s.x / 100) * BOARD_WIDTH,
          (s.y / 100) * BOARD_HEIGHT,
        )
      })
    }
  }, [])

  const handlePause = useCallback(() => {
    pausedAtRef.current = performance.now()
    cancelAnimationFrame(rafRef.current)
    setIsPaused(true)
  }, [])

  const handleResume = useCallback(() => {
    if (startTimeRef.current > 0) {
      const pausedDuration = performance.now() - pausedAtRef.current
      startTimeRef.current += pausedDuration
    }
    setIsPaused(false)
  }, [])

  // ── Chaos Handling ──

  const handleChaosEffect = useCallback(
    (state: GonggiState, result: ChaosResult, rule: ChaosRule) => {
      setChaosEffect(result)
      const updatedState = applyChaosToState(state, result, rule.id)

      // Process based on chaos type
      switch (result.type) {
        case 'stone-lost': {
          const stoneId = (result.data?.stoneId as number) ?? 0
          const afterLoss = loseStone(failSubstep(updatedState), stoneId)
          const tid = setTimeout(() => {
            setChaosEffect(null)
            setGameState(afterLoss)
            gameStateRef.current = afterLoss
          }, 2000)
          chaosTimeoutRef.current.push(tid)
          break
        }
        case 'all-stones-scattered': {
          if (physicsRef.current && result.data?.direction) {
            applyCatSwipeForce(physicsRef.current, result.data.direction as 'left' | 'right' | 'top')
          }
          const afterScatter = failSubstep(updatedState)
          const tid = setTimeout(() => {
            setChaosEffect(null)
            setGameState(afterScatter)
            gameStateRef.current = afterScatter
          }, 2500)
          chaosTimeoutRef.current.push(tid)
          break
        }
        case 'stage-reset': {
          const tid = setTimeout(() => {
            setChaosEffect(null)
            const retried = retryStage(updatedState)
            setGameState(retried)
            gameStateRef.current = retried
          }, 3800)
          chaosTimeoutRef.current.push(tid)
          break
        }
        case 'stones-flee': {
          setChaosEffect(null)
          setGameState(updatedState)
          gameStateRef.current = updatedState
          // Flee forces are applied during pointer events
          break
        }
        case 'stone-split': {
          const tid = setTimeout(() => {
            setChaosEffect(null)
            // For now, treat as failure (player didn't pick correctly in time)
            const afterFail = failSubstep(updatedState)
            setGameState(afterFail)
            gameStateRef.current = afterFail
          }, 3000)
          chaosTimeoutRef.current.push(tid)
          break
        }
        case 'screen-flip': {
          setGameState({ ...updatedState, isFlipped: true })
          gameStateRef.current = { ...updatedState, isFlipped: true }
          const tid = setTimeout(() => {
            setChaosEffect(null)
            const next = advanceStage({ ...updatedState, isFlipped: true, phase: 'stage-clear' as const })
            setGameState(next)
            gameStateRef.current = next
          }, 1500)
          chaosTimeoutRef.current.push(tid)
          break
        }
        default: {
          setGameState(updatedState)
          gameStateRef.current = updatedState
          const tid = setTimeout(() => setChaosEffect(null), 2000)
          chaosTimeoutRef.current.push(tid)
        }
      }
    },
    [],
  )

  const triggerDanmaku = useCallback(
    (result: ChaosResult, state: GonggiState, rule: ChaosRule) => {
      const updatedState = applyChaosToState(state, result, rule.id)
      setGameState(updatedState)
      gameStateRef.current = updatedState

      const comments = (result.data?.comments as { text: string; delayMs: number; yPercent: number }[]) ?? []
      comments.forEach((c) => {
        const tid = setTimeout(() => {
          const id = danmakuIdRef.current++
          setDanmakuComments((prev) => [...prev, { text: c.text, yPercent: c.yPercent, id }])
          setTimeout(() => {
            setDanmakuComments((prev) => prev.filter((d) => d.id !== id))
          }, 4000)
        }, c.delayMs)
        chaosTimeoutRef.current.push(tid)
      })
    },
    [],
  )

  // ── Helpers ──

  const showMessage = useCallback((msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 2000)
  }, [])

  const elapsedSeconds = Math.floor(gameState.elapsedMs / 1000)
  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60

  const phaseText = (() => {
    switch (gameState.phase) {
      case 'scatter': return '준비...'
      case 'toss': return '돌을 던지세요!'
      case 'pick': return `${getRequiredPickCount(gameState.stage, gameState.substep)}개를 스와이프하세요!`
      case 'catch': return '잡으세요!'
      case 'stage-clear': return `${STAGE_NAMES[gameState.stage]} 클리어!`
      case 'failed': return '실패! 다시 도전'
      case 'success': return '🎉 전체 클리어!'
      default: return ''
    }
  })()

  // ── Render ──

  return (
    <Container style={{ transform: gameState.isFlipped ? 'rotate(180deg)' : 'none' }}>
      {/* HUD */}
      <HUD>
        <HUDLeft>
          <StageLabel>{STAGE_NAMES[gameState.stage]} ({gameState.substep + 1}/{getSubstepCount(gameState.stage)})</StageLabel>
          <Timer>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</Timer>
        </HUDLeft>
        <HUDRight>
          <PauseBtn onClick={isPaused ? handleResume : handlePause}>
            {isPaused ? '▶' : '⏸'}
          </PauseBtn>
          <QuitBtn onClick={onQuit}>✕</QuitBtn>
        </HUDRight>
      </HUD>

      {/* Phase instruction */}
      <PhaseBar>{phaseText}</PhaseBar>

      {/* Board */}
      <BoardArea ref={boardRef}>
        <PerspectiveContainer>
          <FloorSurface />
          {stonePositions.map((pos, i) => {
            const stone = gameState.stones[i]
            if (!stone || stone.status === 'lost') return null
            const isSelected = selectedStoneIds.has(i)
            const isAir = stone.status === 'air' || stone.status === 'tossed'
            return (
              <StoneVisual
                key={i}
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  transform: `translate(-50%, -50%) rotate(${pos.angle}rad) scale(${isAir ? 0.8 : 1})`,
                  opacity: stone.status === 'hand' ? 0.5 : 1,
                  zIndex: isAir ? 10 : 1,
                }}
                $selected={isSelected}
              >
                {STONE_EMOJIS[i % STONE_EMOJIS.length]}
              </StoneVisual>
            )
          })}
        </PerspectiveContainer>

        {/* Touch overlay */}
        <TouchOverlay
          onPointerDown={handleSwipeStart}
          onPointerMove={handleSwipeMove}
          onPointerUp={handleSwipeEnd}
          onPointerCancel={handleSwipeEnd}
        >
          {/* Swipe trail */}
          {swipePath.length > 1 && (
            <svg
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            >
              <path
                d={`M ${swipePath.map((p) => `${p.x},${p.y}`).join(' L ')}`}
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          )}
        </TouchOverlay>

        {/* Action buttons */}
        {gameState.phase === 'toss' && !isPaused && (
          <ActionButton onClick={handleToss}>
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              🫴 던지기
            </motion.div>
          </ActionButton>
        )}
        {gameState.phase === 'catch' && !isPaused && (
          <ActionButton onClick={handleCatch}>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 0.6 }}
            >
              ✊ 잡기
            </motion.div>
          </ActionButton>
        )}
        {gameState.phase === 'stage-clear' && !isPaused && (
          <ActionButton onClick={handleStageAdvance}>
            다음 단계 →
          </ActionButton>
        )}
        {gameState.phase === 'failed' && !isPaused && (
          <ActionButton onClick={handleRetry}>
            🔄 다시 도전
          </ActionButton>
        )}
      </BoardArea>

      {/* Chaos effects overlay */}
      <AnimatePresence>
        {chaosEffect && (
          <ChaosOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {chaosEffect.animation === 'bird-transform' && (
              <ChaosMessage>
                <motion.div
                  animate={{ scale: [1, 1.5, 0], rotate: [0, 0, 180], y: [0, -50, -200] }}
                  transition={{ duration: 1.5 }}
                >
                  🐦
                </motion.div>
                <ChaosText>{chaosEffect.message}</ChaosText>
              </ChaosMessage>
            )}
            {chaosEffect.animation === 'cat-swipe' && (
              <ChaosMessage>
                <motion.div
                  initial={{ x: -200 }}
                  animate={{ x: [null, 0, 200] }}
                  transition={{ duration: 1, times: [0, 0.4, 1] }}
                  style={{ fontSize: '48px' }}
                >
                  🐾
                </motion.div>
                <ChaosText>{chaosEffect.message}</ChaosText>
              </ChaosMessage>
            )}
            {chaosEffect.animation === 'fake-clear' && (
              <ChaosMessage>
                <motion.div
                  animate={{ scale: [0, 1.5, 1] }}
                  transition={{ duration: 0.5 }}
                  style={{ fontSize: '24px', color: '#FFD700' }}
                >
                  🎉 축하합니다!
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2 }}
                >
                  <ChaosText>{chaosEffect.message}</ChaosText>
                </motion.div>
              </ChaosMessage>
            )}
            {chaosEffect.animation === 'split' && (
              <ChaosMessage>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: 2, duration: 0.3 }}
                  style={{ fontSize: '36px' }}
                >
                  ✨ × 3
                </motion.div>
                <ChaosText>어느 게 진짜?</ChaosText>
              </ChaosMessage>
            )}
            {chaosEffect.animation === 'stone-eyes' && (
              <ChaosMessage>
                <motion.div style={{ fontSize: '36px' }}>
                  👀 !
                </motion.div>
              </ChaosMessage>
            )}
            {chaosEffect.animation === 'screen-flip' && (
              <ChaosMessage>
                <ChaosText>{chaosEffect.message}</ChaosText>
              </ChaosMessage>
            )}
          </ChaosOverlay>
        )}
      </AnimatePresence>

      {/* Danmaku overlay */}
      {danmakuComments.length > 0 && (
        <DanmakuLayer>
          {danmakuComments.map((c) => (
            <DanmakuComment key={c.id} style={{ top: `${c.yPercent}%` }}>
              {c.text}
            </DanmakuComment>
          ))}
        </DanmakuLayer>
      )}

      {/* Message toast */}
      <AnimatePresence>
        {message && (
          <MessageToast
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {message}
          </MessageToast>
        )}
      </AnimatePresence>

      {/* Status bar */}
      <StatusBar>
        <StatItem>
          <StatLabel>라운드</StatLabel>
          <StatValue>{gameState.round}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>실패</StatLabel>
          <StatValue>{gameState.failCount}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>변칙</StatLabel>
          <StatValue>{gameState.chaosSurvived}</StatValue>
        </StatItem>
      </StatusBar>

      {/* Pause overlay */}
      {isPaused && (
        <PauseOverlay>
          <PauseText>일시정지</PauseText>
          <ResumeBtn onClick={handleResume}>계속하기</ResumeBtn>
        </PauseOverlay>
      )}
    </Container>
  )
}

// ── Styled Components ──

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  position: relative;
  transition: transform 1s ease-in-out;
  user-select: none;
`

const HUD = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
`

const HUDLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const HUDRight = styled.div`
  display: flex;
  gap: 8px;
`

const StageLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
`

const Timer = styled.span`
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  color: #94a3b8;
`

const PauseBtn = styled.button`
  background: none;
  border: 1px solid #475569;
  border-radius: 8px;
  padding: 4px 8px;
  color: #e2e8f0;
  font-size: 16px;
  cursor: pointer;
`

const QuitBtn = styled.button`
  background: none;
  border: 1px solid #ef4444;
  border-radius: 8px;
  padding: 4px 8px;
  color: #ef4444;
  font-size: 14px;
  cursor: pointer;
`

const PhaseBar = styled.div`
  width: 100%;
  text-align: center;
  padding: 6px;
  font-size: 15px;
  font-weight: 500;
  color: #fbbf24;
`

const BoardArea = styled.div`
  position: relative;
  width: ${BOARD_WIDTH}px;
  height: ${BOARD_HEIGHT}px;
  border-radius: 16px;
  overflow: hidden;
  background: #1e293b;
`

const PerspectiveContainer = styled.div`
  position: absolute;
  inset: 0;
  perspective: 800px;
`

const FloorSurface = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #334155 0%, #1e293b 50%, #0f172a 100%);
  transform: rotateX(15deg);
  transform-origin: center 70%;
  border-radius: 16px;
`

const StoneVisual = styled.div<{ $selected: boolean }>`
  position: absolute;
  font-size: 28px;
  transition: opacity 0.2s, filter 0.2s;
  pointer-events: none;
  filter: ${({ $selected }) => $selected ? 'brightness(1.5) drop-shadow(0 0 8px #fbbf24)' : 'none'};
`

const TouchOverlay = styled.div`
  position: absolute;
  inset: 0;
  touch-action: none;
  z-index: 20;
`

const ActionButton = styled.button`
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 30;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  &:active {
    background: #2563eb;
  }
`

const ChaosOverlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  z-index: 50;
  pointer-events: none;
`

const ChaosMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`

const ChaosText = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #fbbf24;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`

const danmakuSlide = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(-100%); }
`

const DanmakuLayer = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 40;
`

const DanmakuComment = styled.div`
  position: absolute;
  white-space: nowrap;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(0, 0, 0, 0.4);
  padding: 2px 8px;
  border-radius: 4px;
  animation: ${danmakuSlide} 4s linear forwards;
`

const MessageToast = styled(motion.div)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  z-index: 60;
  pointer-events: none;
`

const StatusBar = styled.div`
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 12px;
  width: 100%;
`

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const StatLabel = styled.span`
  font-size: 11px;
  color: #94a3b8;
`

const StatValue = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: #e2e8f0;
  font-variant-numeric: tabular-nums;
`

const PauseOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: rgba(0, 0, 0, 0.8);
  z-index: 70;
`

const PauseText = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #e2e8f0;
`

const ResumeBtn = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
`
