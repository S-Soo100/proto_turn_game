import { useEffect, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'
import { motion } from 'framer-motion'
import type { TargetScheduleItem, Grade } from '@/lib/game-logic/reaction-speed'

interface Props {
  target: TargetScheduleItem
  gameElapsedMs: number
  onHit: (targetId: number, clickTimeMs: number) => { grade: Grade; score: number } | null
  onMiss: (targetId: number) => void
}

const GRADE_COLORS: Record<Grade, string> = {
  perfect: '#f59e0b',
  great: '#22c55e',
  good: '#3b82f6',
  ok: '#9ca3af',
}

const GRADE_LABELS: Record<Grade, string> = {
  perfect: 'PERFECT!',
  great: 'GREAT!',
  good: 'GOOD!',
  ok: 'OK',
}

// Inner circle size (hit target)
const INNER_SIZE = 32
// Outer circle starts at this size and shrinks to INNER_SIZE
const OUTER_START_SIZE = 64

export default function TargetCircle({ target, gameElapsedMs, onHit, onMiss }: Props) {
  const [hit, setHit] = useState<{ grade: Grade; score: number } | null>(null)
  const [missed, setMissed] = useState(false)
  const missedRef = useRef(false)
  const hitRef = useRef(false)

  const elapsed = gameElapsedMs - target.spawnTime
  const expired = elapsed >= target.duration

  // Handle expiry (miss)
  useEffect(() => {
    if (expired && !hitRef.current && !missedRef.current) {
      missedRef.current = true
      setMissed(true)
      onMiss(target.id)
    }
  }, [expired, target.id, onMiss])

  const handleClick = () => {
    if (hitRef.current || missedRef.current || expired) return
    hitRef.current = true
    const result = onHit(target.id, gameElapsedMs)
    if (result) {
      setHit(result)
    }
  }

  const isNormal = target.type === 'normal'
  const baseColor = isNormal ? '#3b82f6' : '#ef4444'
  const bgColor = isNormal ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)'

  // Already hit or missed — show feedback then unmount
  if (hit) {
    return (
      <FeedbackContainer style={{ left: `${target.x}%`, top: `${target.y}%` }}>
        <motion.div
          initial={{ opacity: 1, y: 0, scale: 1 }}
          animate={{ opacity: 0, y: -40, scale: 1.3 }}
          transition={{ duration: 0.7 }}
          style={{
            color: GRADE_COLORS[hit.grade],
            fontSize: 18,
            fontWeight: 800,
            textAlign: 'center',
            whiteSpace: 'nowrap',
            textShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }}
        >
          {GRADE_LABELS[hit.grade]}
          <ScorePopup>+{hit.score}</ScorePopup>
        </motion.div>
      </FeedbackContainer>
    )
  }

  if (missed) {
    return (
      <FeedbackContainer style={{ left: `${target.x}%`, top: `${target.y}%` }}>
        <motion.div
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.5 }}
          style={{
            color: '#ef4444',
            fontSize: 18,
            fontWeight: 800,
            textAlign: 'center',
            textShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }}
        >
          MISS
        </motion.div>
      </FeedbackContainer>
    )
  }

  return (
    <Container
      style={{ left: `${target.x}%`, top: `${target.y}%` }}
      onClick={handleClick}
    >
      {/* Outer shrinking ring — CSS animation, no React re-render needed */}
      <OuterRing
        style={{
          animationDuration: `${target.duration}ms`,
          borderColor: baseColor,
        }}
      />
      {/* Inner target circle */}
      <InnerCircle
        style={{
          width: INNER_SIZE,
          height: INNER_SIZE,
          backgroundColor: bgColor,
          borderColor: baseColor,
        }}
      >
        {target.type === 'speed' && <SpeedLabel>S</SpeedLabel>}
      </InnerCircle>
    </Container>
  )
}

// ── Styled Components ──

const Container = styled.div`
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
`

const shrinkRing = keyframes`
  from { width: ${OUTER_START_SIZE}px; height: ${OUTER_START_SIZE}px; opacity: 0.5; }
  to   { width: ${INNER_SIZE}px; height: ${INNER_SIZE}px; opacity: 1; }
`

const OuterRing = styled.div`
  position: absolute;
  border-radius: 50%;
  border: 3px solid;
  pointer-events: none;
  width: ${OUTER_START_SIZE}px;
  height: ${OUTER_START_SIZE}px;
  animation: ${shrinkRing} linear forwards;
`

const InnerCircle = styled.div`
  position: relative;
  border-radius: 50%;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 11;
`

const SpeedLabel = styled.span`
  font-size: 14px;
  font-weight: 800;
  color: #ef4444;
  user-select: none;
  pointer-events: none;
`

const FeedbackContainer = styled.div`
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 20;
`


const ScorePopup = styled.div`
  font-size: 14px;
  font-weight: 600;
  margin-top: 2px;
`
