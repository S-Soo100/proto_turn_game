import { useCallback, useEffect, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'
import { AnimatePresence, motion } from 'framer-motion'
import type { GonggiState, GonggiResult } from '@/lib/game-logic/gonggi'
import {
  createInitialState,
  scatterStones,
  selectStone,
  holdStone,
  startToss,
  completeToss,
  pickStones,
  catchStone,
  advanceStage,
  retryStage,
  retrySubstep,
  failSubstep,
  loseStone,
  getResult,
  getRequiredPickCount,
  getSubstepCount,
  getTossDuration,
  mulberry32,
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
import { screenFlipRule } from '@/lib/game-logic/chaos-rules/screen-flip'
import { constellationRule } from '@/lib/game-logic/chaos-rules/constellation'
import CatSwipeEffect from './chaos/CatSwipeEffect'
import ConstellationEffect from './chaos/ConstellationEffect'
import { getStoneStyle } from '@/lib/gonggi-z-axis'

// ── Constants ──

const ALL_CHAOS_RULES: ChaosRule[] = [
  birdTransformRule,
  catSwipeRule,
  stoneEyesRule,
  fakeClearRule,
  splitRule,
  screenFlipRule,
  constellationRule,
]

const STONE_EMOJIS = ['🟡', '🔴', '🔵', '🟢', '🟣']
const STAGE_NAMES = ['', '일단', '이단', '삼단', '사단', '꺾기']
const PICK_RADIUS = 10 // % of board
const HOLD_STONE_REST_TOP_PCT = 62  // bottom-center of board (%)
const TOSS_VELOCITY_THRESHOLD = -0.5  // px/ms (negative = upward)

// ── Props ──

interface Props {
  onGameEnd: (result: GonggiResult) => void
  onQuit: () => void
}

// ── Component ──

export default function GonggiBoard({ onGameEnd, onQuit }: Props) {
  const [gameState, setGameState] = useState<GonggiState>(() => createInitialState())
  const [chaosEffect, setChaosEffect] = useState<ChaosResult | null>(null)
  const [selectedStoneIds, setSelectedStoneIds] = useState<Set<number>>(new Set())
  const [message, setMessage] = useState<string>('')
  const [isPaused, setIsPaused] = useState(false)
  const [swipePath, setSwipePath] = useState<{ x: number; y: number }[]>([])
  const [tossAnimating, setTossAnimating] = useState(false)
  const [catchMessage, setCatchMessage] = useState<string>('')
  const [pickTimerProgress, setPickTimerProgress] = useState(1) // 1=full, 0=empty
  const [holdDragY, setHoldDragY] = useState(0)
  const [isDraggingHold, setIsDraggingHold] = useState(false)

  const gameStateRef = useRef(gameState)
  const startTimeRef = useRef(0)
  const pausedAtRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const isSwipingRef = useRef(false)
  const chaosTimeoutRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const rngRef = useRef(() => Math.random())
  const tossTimerRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const pickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const holdDragStartRef = useRef<{ y: number; time: number } | null>(null)
  const lastDragPointsRef = useRef<{ y: number; time: number }[]>([])

  gameStateRef.current = gameState

  // ── Initialize ──
  useEffect(() => {
    rngRef.current = mulberry32(gameStateRef.current.seed + Date.now())

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      chaosTimeoutRef.current.forEach(clearTimeout)
      tossTimerRef.current.forEach(clearTimeout)
      if (pickTimerRef.current) clearInterval(pickTimerRef.current)
    }
  }, [])

  // ── Elapsed timer (replaces RAF game loop) ──
  useEffect(() => {
    if (isPaused) return
    if (gameState.phase === 'success' || (!startTimeRef.current && gameState.phase === 'scatter')) {
      return
    }

    timerRef.current = setInterval(() => {
      if (startTimeRef.current > 0) {
        const elapsed = performance.now() - startTimeRef.current
        gameStateRef.current = { ...gameStateRef.current, elapsedMs: Math.round(elapsed) }
        setGameState((prev) => ({ ...prev, elapsedMs: Math.round(elapsed) }))
      }
    }, 200)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
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

    if (!startTimeRef.current) {
      startTimeRef.current = performance.now()
    }
  }, [])

  const handleSelectStone = useCallback((stoneId: number) => {
    const state = gameStateRef.current
    if (state.phase !== 'select') return

    const selected = selectStone(state, stoneId)
    if (!selected) return

    // Instant select→hold transition
    const held = holdStone(selected)
    if (held) {
      setGameState(held)
      gameStateRef.current = held
    } else {
      setGameState(selected)
      gameStateRef.current = selected
    }
  }, [])

  const clearTossTimers = useCallback(() => {
    tossTimerRef.current.forEach(clearTimeout)
    tossTimerRef.current = []
    setTossAnimating(false)
    setCatchMessage('')
  }, [])

  const handleToss = useCallback(() => {
    let state = gameStateRef.current
    if (state.phase !== 'toss' && state.phase !== 'hold') return

    state = startToss(state)
    state = completeToss(state)
    setGameState(state)
    gameStateRef.current = state

    // Check chaos after toss
    const chaos = checkChaos(state, 'after-toss', ALL_CHAOS_RULES, rngRef.current)
    if (chaos) {
      handleChaosEffect(state, chaos.result, chaos.rule)
      return
    }

    // Start toss arc animation for catch phase (stage 5: all tossed → catch)
    if (state.phase === 'catch') {
      startTossAnimation(state)
    }

    // For when pick phase starts, check before-pick chaos + start pick timer
    if (state.phase === 'pick') {
      const pickChaos = checkChaos(state, 'before-pick', ALL_CHAOS_RULES, rngRef.current)
      if (pickChaos) {
        handleChaosEffect(state, pickChaos.result, pickChaos.rule)
      } else {
        startPickTimer(state)
        startTossAnimation(state)
      }
    }

  }, [])

  const handleHoldDragStart = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    holdDragStartRef.current = { y: e.clientY, time: performance.now() }
    lastDragPointsRef.current = [{ y: e.clientY, time: performance.now() }]
    setIsDraggingHold(true)
  }, [])

  const handleHoldDragMove = useCallback((e: React.PointerEvent) => {
    if (!holdDragStartRef.current) return
    const dy = e.clientY - holdDragStartRef.current.y
    setHoldDragY(Math.max(-120, Math.min(40, dy)))

    const now = performance.now()
    lastDragPointsRef.current.push({ y: e.clientY, time: now })
    lastDragPointsRef.current = lastDragPointsRef.current.filter(p => now - p.time < 80)
  }, [])

  const handleHoldDragEnd = useCallback(() => {
    if (!holdDragStartRef.current) return

    const points = lastDragPointsRef.current
    let velocity = 0
    if (points.length >= 2) {
      const first = points[0]
      const last = points[points.length - 1]
      const dt = last.time - first.time
      if (dt > 0) velocity = (last.y - first.y) / dt
    }

    holdDragStartRef.current = null
    lastDragPointsRef.current = []
    setIsDraggingHold(false)
    setHoldDragY(0)

    if (velocity < TOSS_VELOCITY_THRESHOLD) {
      handleToss()
    }
  }, [handleToss])

  const startTossAnimation = useCallback((state: GonggiState) => {
    const duration = getTossDuration(state.stage)

    setTossAnimating(true)
    setCatchMessage('')

    // Auto-miss if player doesn't catch in time
    const autoMiss = setTimeout(() => {
      const current = gameStateRef.current
      if (current.phase === 'catch' || current.phase === 'pick') {
        setTossAnimating(false)
        setCatchMessage('놓쳤어요!')
        const missState = catchStone(current.phase === 'pick'
          ? { ...current, phase: 'catch' as const }
          : current, false, 'miss')
        setGameState(missState)
        gameStateRef.current = missState
        setTimeout(() => setCatchMessage(''), 1500)
      }
    }, duration + 1000)
    tossTimerRef.current.push(autoMiss)
  }, [])

  const startPickTimer = useCallback((state: GonggiState) => {
    const duration = getTossDuration(state.stage)
    const startTime = performance.now()
    setPickTimerProgress(1)

    if (pickTimerRef.current) clearInterval(pickTimerRef.current)
    pickTimerRef.current = setInterval(() => {
      const elapsed = performance.now() - startTime
      const progress = Math.max(0, 1 - elapsed / duration)
      setPickTimerProgress(progress)
      if (progress <= 0) {
        if (pickTimerRef.current) clearInterval(pickTimerRef.current)
      }
    }, 50)
  }, [])

  const handleCatch = useCallback(() => {
    const state = gameStateRef.current
    if (state.phase !== 'catch') return

    // Catch is always allowed during catch phase (no early penalty)
    clearTossTimers()
    if (pickTimerRef.current) clearInterval(pickTimerRef.current)

    // Check before-success chaos
    const chaos = checkChaos(state, 'before-success', ALL_CHAOS_RULES, rngRef.current)
    if (chaos) {
      handleChaosEffect(state, chaos.result, chaos.rule)
      return
    }

    const newState = catchStone(state, true, 'perfect')
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
    const rect = boardRef.current?.getBoundingClientRect()
    if (!rect) return

    const xPct = ((e.clientX - rect.left) / rect.width) * 100
    const yPct = ((e.clientY - rect.top) / rect.height) * 100

    // Select phase: tap to select a stone
    if (state.phase === 'select') {
      const hitStone = state.stones.find((stone) => {
        if (stone.status !== 'floor') return false
        const dx = stone.x - xPct
        const dy = stone.y - yPct
        return Math.sqrt(dx * dx + dy * dy) < PICK_RADIUS
      })
      if (hitStone) {
        handleSelectStone(hitStone.id)
      }
      return
    }

    // Hold phase: tap a different stone to change selection
    if (state.phase === 'hold') {
      const hitStone = state.stones.find((stone) => {
        if (stone.status !== 'floor') return false
        const dx = stone.x - xPct
        const dy = stone.y - yPct
        return Math.sqrt(dx * dx + dy * dy) < PICK_RADIUS
      })
      if (hitStone) {
        // Reset to select, then select the new stone
        const resetState: typeof state = {
          ...state,
          phase: 'select',
          selectedStoneId: null,
          stones: state.stones.map((s) =>
            s.id === state.selectedStoneId
              ? { ...s, status: 'floor' as const, z: 0 }
              : s
          ),
        }
        setGameState(resetState)
        gameStateRef.current = resetState
        setTimeout(() => handleSelectStone(hitStone.id), 50)
      }
      return
    }

    // Pick phase: swipe to pick stones
    if (state.phase !== 'pick') return

    isSwipingRef.current = true
    setSwipePath([{ x: xPct, y: yPct }])
    setSelectedStoneIds(new Set())
    checkStoneHit(xPct, yPct, state)
  }, [])

  const handleSwipeMove = useCallback((e: React.PointerEvent) => {
    if (!isSwipingRef.current) return
    const rect = boardRef.current?.getBoundingClientRect()
    if (!rect) return

    const xPct = ((e.clientX - rect.left) / rect.width) * 100
    const yPct = ((e.clientY - rect.top) / rect.height) * 100
    setSwipePath((prev) => [...prev, { x: xPct, y: yPct }])

    checkStoneHit(xPct, yPct, gameStateRef.current)
  }, [])

  const checkStoneHit = useCallback((xPct: number, yPct: number, state: GonggiState) => {
    state.stones.forEach((stone) => {
      if (stone.status === 'floor') {
        const dx = stone.x - xPct
        const dy = stone.y - yPct
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < PICK_RADIUS) {
          setSelectedStoneIds((prev) => new Set([...prev, stone.id]))
        }
      }
    })
  }, [])

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
        if (pickTimerRef.current) clearInterval(pickTimerRef.current)
        setGameState(newState)
        gameStateRef.current = newState
        setSelectedStoneIds(new Set())
      }
    } else {
      showMessage(`${required}개를 골라야 해요! (${ids.length}개 선택됨)`)
      setSelectedStoneIds(new Set())
    }
  }, [selectedStoneIds])

  const handleStageAdvance = useCallback(() => {
    const state = gameStateRef.current
    if (state.phase !== 'stage-clear' && state.phase !== 'round-clear') return

    const newState = advanceStage(state)
    setGameState(newState)
    gameStateRef.current = newState
  }, [])

  const handleRetry = useCallback(() => {
    const state = gameStateRef.current
    if (state.phase !== 'failed') return

    const newState = retrySubstep(state)
    setGameState(newState)
    gameStateRef.current = newState
  }, [])

  const handlePause = useCallback(() => {
    pausedAtRef.current = performance.now()
    if (timerRef.current) clearInterval(timerRef.current)
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
      // Pause toss animation during chaos
      clearTossTimers()
      if (pickTimerRef.current) clearInterval(pickTimerRef.current)

      setChaosEffect(result)
      const updatedState = applyChaosToState(state, result, rule.id)

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
        case 'all-stones-lost': {
          // Lose all stones then fail — CatSwipeEffect handles visual
          let afterLoss = updatedState
          afterLoss.stones.forEach((s) => {
            if (s.status !== 'lost') {
              afterLoss = loseStone(afterLoss, s.id)
            }
          })
          const afterFail = failSubstep(afterLoss)
          const tid = setTimeout(() => {
            setChaosEffect(null)
            setGameState(afterFail)
            gameStateRef.current = afterFail
          }, 2800)
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
          break
        }
        case 'stone-split': {
          const tid = setTimeout(() => {
            setChaosEffect(null)
            const afterFail = failSubstep(updatedState)
            setGameState(afterFail)
            gameStateRef.current = afterFail
          }, 3000)
          chaosTimeoutRef.current.push(tid)
          break
        }
        case 'constellation': {
          setGameState(updatedState)
          gameStateRef.current = updatedState
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

  // ── Constellation callbacks ──

  const handleConstellationWish = useCallback(
    (choice: 'return' | 'more') => {
      const state = gameStateRef.current
      setChaosEffect(null)
      if (choice === 'return') {
        const after = failSubstep(state)
        setGameState(after)
        gameStateRef.current = after
      } else {
        const stoneId = (chaosEffect?.data?.stoneId as number) ?? 0
        const after = loseStone(failSubstep(state), stoneId)
        setGameState(after)
        gameStateRef.current = after
      }
    },
    [chaosEffect],
  )

  const handleConstellationTimeout = useCallback(() => {
    const state = gameStateRef.current
    setChaosEffect(null)
    const stoneId = (chaosEffect?.data?.stoneId as number) ?? 0
    const after = loseStone(failSubstep(state), stoneId)
    setGameState(after)
    gameStateRef.current = after
  }, [chaosEffect])

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
      case 'select': return '던질 돌을 골라주세요'
      case 'hold': return '위로 스와이프하여 던지기!'
      case 'toss': return '위로 스와이프하여 던지기!'
      case 'pick': return `${getRequiredPickCount(gameState.stage, gameState.substep)}개를 스와이프하세요!`
      case 'catch': return '떨어지는 돌을 잡으세요!'
      case 'stage-clear': return `${STAGE_NAMES[gameState.stage]} 클리어!`
      case 'round-clear': return `🎉 라운드 ${gameState.round} 클리어!`
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
          {gameState.stones.map((stone) => {
            if (stone.status === 'lost') return null
            // FlyingStone renders air/tossed stones at Container level
            const isAir = stone.status === 'air' || stone.status === 'tossed'
            if (isAir && tossAnimating) return null
            // HandArea renders hand stones during pick/catch/toss phases
            if (stone.status === 'hand' && (gameState.phase === 'pick' || gameState.phase === 'catch' || gameState.phase === 'toss')) return null

            const isSelected = selectedStoneIds.has(stone.id)
            const zStyle = getStoneStyle(stone.z)
            return (
              <StoneVisual
                key={stone.id}
                style={{
                  left: `${stone.x}%`,
                  top: `${stone.y}%`,
                  ...zStyle,
                  opacity: stone.status === 'hand' ? 0.5 : 1,
                  zIndex: isAir ? 10 : 1,
                }}
                $selected={isSelected}
              >
                {STONE_EMOJIS[stone.id % STONE_EMOJIS.length]}
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
                d={`M ${swipePath.map((p) => `${p.x}%,${p.y}%`).join(' L ')}`}
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          )}
        </TouchOverlay>

        {/* Pick timer bar */}
        {gameState.phase === 'pick' && tossAnimating && !isPaused && (
          <PickTimerBar>
            <PickTimerFill style={{ width: `${pickTimerProgress * 100}%` }} />
          </PickTimerBar>
        )}

        {/* Hold stone overlay — enlarged stone with swipe gesture */}
        {((gameState.phase === 'hold' && gameState.selectedStoneId !== null) ||
          gameState.phase === 'toss') && !isPaused && (
          <HoldStoneOverlay
            onPointerDown={handleHoldDragStart}
            onPointerMove={handleHoldDragMove}
            onPointerUp={handleHoldDragEnd}
            onPointerCancel={handleHoldDragEnd}
            style={{
              top: `calc(${HOLD_STONE_REST_TOP_PCT}% + ${holdDragY}px)`,
              transform: `translateX(-50%) rotate(${holdDragY * -0.15}deg)`,
              transition: isDraggingHold
                ? 'none'
                : 'top 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {gameState.stage === 5 ? (
              <HoldStoneGroup>
                {gameState.stones.map((stone) => (
                  <HoldStoneGroupItem key={stone.id}>
                    {STONE_EMOJIS[stone.id % STONE_EMOJIS.length]}
                  </HoldStoneGroupItem>
                ))}
              </HoldStoneGroup>
            ) : (
              <HoldStoneLarge>
                {(() => {
                  const stoneId = gameState.selectedStoneId
                    ?? gameState.stones.find(s => s.status === 'hand')?.id
                  return stoneId != null ? STONE_EMOJIS[stoneId % STONE_EMOJIS.length] : ''
                })()}
              </HoldStoneLarge>
            )}
            {!isDraggingHold && (
              <>
                <TossButton onClick={(e) => { e.stopPropagation(); handleToss(); }}>
                  던지기 🫴
                </TossButton>
                <SwipeHint>또는 ↑ 위로 스와이프</SwipeHint>
              </>
            )}
          </HoldStoneOverlay>
        )}
        {/* Hand area — shows picked/collected stones (exclude toss candidate during toss phase) */}
        {(() => {
          const tossCandidateId = gameState.phase === 'toss'
            ? (gameState.selectedStoneId ?? gameState.stones.find(s => s.status === 'hand')?.id ?? -1)
            : -1
          const handStones = gameState.stones.filter(s =>
            s.status === 'hand' && s.id !== tossCandidateId
          )
          const showPhase = gameState.phase === 'pick' || gameState.phase === 'catch' || gameState.phase === 'toss'
          if (handStones.length === 0 || !showPhase || isPaused) return null
          return (
            <HandArea>
              <HandIcon>🤚</HandIcon>
              {handStones.map(s => (
                <HandStone key={s.id}>{STONE_EMOJIS[s.id % STONE_EMOJIS.length]}</HandStone>
              ))}
            </HandArea>
          )
        })()}

        {gameState.phase === 'stage-clear' && !isPaused && (
          <ActionButton onClick={handleStageAdvance}>
            다음 단계 →
          </ActionButton>
        )}
        {gameState.phase === 'round-clear' && !isPaused && (
          <ActionButton onClick={handleStageAdvance}>
            라운드 {gameState.round + 1} 시작 →
          </ActionButton>
        )}
        {gameState.phase === 'failed' && !isPaused && (
          <ActionButton onClick={handleRetry}>
            🔄 다시 도전
          </ActionButton>
        )}
      </BoardArea>

      {/* FlyingStone — parabolic flight at Container level */}
      {tossAnimating && !isPaused && (
        <FlyingStone
          className={gameState.phase === 'catch' ? 'catch-zone' : ''}
          style={{
            animationDuration: `${getTossDuration(gameState.stage)}ms`,
            animationPlayState: isPaused ? 'paused' : 'running',
            pointerEvents: gameState.phase === 'catch' ? 'auto' : 'none',
          }}
          onPointerDown={gameState.phase === 'catch' ? handleCatch : undefined}
        >
          {gameState.stage === 5 ? (
            <FlyingStoneGroup>
              {gameState.stones.filter(s => s.status === 'air' || s.status === 'tossed').map(s => (
                <span key={s.id}>{STONE_EMOJIS[s.id % STONE_EMOJIS.length]}</span>
              ))}
            </FlyingStoneGroup>
          ) : (
            (() => {
              const airStone = gameState.stones.find(s => s.status === 'air' || s.status === 'tossed')
              const id = airStone?.id ?? gameState.selectedStoneId ?? 0
              return STONE_EMOJIS[id % STONE_EMOJIS.length]
            })()
          )}
        </FlyingStone>
      )}

      {/* Catch feedback */}
      {catchMessage && (
        <CatchFeedback>{catchMessage}</CatchFeedback>
      )}

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
              <CatSwipeEffect onComplete={() => {}} />
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
            {chaosEffect.animation === 'constellation' && (
              <ConstellationEffect
                constellationIndex={(chaosEffect.data?.constellationIndex as number) ?? 0}
                constellationName={(chaosEffect.data?.constellationName as string) ?? ''}
                constellationDesc={(chaosEffect.data?.constellationDesc as string) ?? ''}
                onWish={handleConstellationWish}
                onTimeout={handleConstellationTimeout}
              />
            )}
          </ChaosOverlay>
        )}
      </AnimatePresence>

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
  width: 100%;
  aspect-ratio: 9 / 10;
  max-width: 360px;
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

const flightArc = keyframes`
  0%   { top: 62%; transform: translateX(-50%) scale(1.0) rotate(0deg); }
  35%  { top: -4%; transform: translateX(-50%) scale(0.65) rotate(-15deg); }
  40%  { top: -4%; transform: translateX(-50%) scale(0.65) rotate(-10deg); }
  60%  { top: 28%; transform: translateX(-48%) scale(0.78) rotate(20deg); }
  80%  { top: 48%; transform: translateX(-52%) scale(0.88) rotate(-10deg); }
  100% { top: 62%; transform: translateX(-50%) scale(1.0) rotate(0deg); }
`

const popIn = keyframes`
  0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
  60%  { transform: scale(1.3) rotate(5deg); opacity: 1; }
  100% { transform: scale(1) rotate(0); opacity: 1; }
`

const StoneVisual = styled.div<{ $selected: boolean }>`
  position: absolute;
  font-size: 28px;
  transition: left 0.3s ease, top 0.3s ease, transform 0.3s ease, opacity 0.2s, filter 0.2s;
  pointer-events: none;
  transform-origin: center bottom;
  ${({ $selected }) => $selected && `
    filter: brightness(1.5) drop-shadow(0 0 8px #fbbf24) !important;
  `}
`

const TouchOverlay = styled.div`
  position: absolute;
  inset: 0;
  touch-action: none;
  z-index: 20;
`

const HoldStoneOverlay = styled.div`
  position: absolute;
  left: 50%;
  z-index: 25;
  touch-action: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: grab;
  &:active {
    cursor: grabbing;
  }
`

const HoldStoneLarge = styled.div`
  font-size: 56px;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
  pointer-events: none;
`

const HoldStoneGroup = styled.div`
  display: flex;
  gap: 4px;
  pointer-events: none;
`

const HoldStoneGroupItem = styled.div`
  font-size: 40px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
`

const TossButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 20px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  pointer-events: auto;
  margin-bottom: 4px;
  &:active {
    transform: scale(0.95);
    background: #2563eb;
  }
`

const SwipeHint = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  white-space: nowrap;
  pointer-events: none;
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

const FlyingStone = styled.div`
  position: absolute;
  left: 50%;
  top: 62%;
  transform: translateX(-50%);
  z-index: 100;
  font-size: 36px;
  pointer-events: none;
  animation-name: ${flightArc};
  animation-timing-function: ease-in-out;
  animation-fill-mode: forwards;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
  &.catch-zone {
    filter: drop-shadow(0 0 12px #22c55e) drop-shadow(0 0 4px #22c55e);
    cursor: pointer;
  }
`

const FlyingStoneGroup = styled.div`
  display: flex;
  gap: 2px;
  font-size: 28px;
`

const HandArea = styled.div`
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 28;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.4);
  border-radius: 12px;
  padding: 6px 12px;
`

const HandIcon = styled.span`
  font-size: 24px;
`

const HandStone = styled.span`
  font-size: 24px;
  animation: ${popIn} 0.3s ease-out forwards;
`

const CatchFeedback = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 110;
  background: rgba(0, 0, 0, 0.85);
  color: #fbbf24;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
  white-space: nowrap;
  pointer-events: none;
`

const PickTimerBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  z-index: 25;
`

const PickTimerFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #ef4444, #fbbf24);
  transition: width 0.05s linear;
  border-radius: 0 2px 2px 0;
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
