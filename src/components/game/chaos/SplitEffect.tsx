import { useEffect, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'
import { motion } from 'framer-motion'

const STONE_IMAGES = [
  '/assets/sprites/gonggi-stone-yellow.png',
  '/assets/sprites/gonggi-stone-red.png',
  '/assets/sprites/gonggi-stone-blue.png',
  '/assets/sprites/gonggi-stone-green.png',
  '/assets/sprites/gonggi-stone-purple.png',
]

interface Props {
  stoneId: number
  onSelect: (index: number) => void
  onTimeout: () => void
}

const CUP_IMG = '/assets/effects/chaos-shell-cup.png'
const CUP_POSITIONS = [
  { x: 20, y: 55 },  // left
  { x: 50, y: 45 },  // center
  { x: 80, y: 55 },  // right
]

// Shuffle sequence: pairs of [fromIdx, toIdx] to swap
const SHUFFLE_PAIRS: [number, number][] = [
  [0, 2], [1, 0], [2, 1], [0, 1], [2, 0], [1, 2],
]
const SHUFFLE_STEP_MS = 350

type Phase = 'show' | 'cover' | 'shuffle' | 'choose' | 'reveal'

export default function SplitEffect({ stoneId, onSelect, onTimeout }: Props) {
  const stoneImg = STONE_IMAGES[stoneId % STONE_IMAGES.length]
  const [phase, setPhase] = useState<Phase>('show')
  const [cupPositions, setCupPositions] = useState([0, 1, 2]) // which cup is at which position
  const [shuffleStep, setShuffleStep] = useState(-1)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [revealIdx, setRevealIdx] = useState(1) // stone is always revealed under a non-selected cup
  const timeoutsRef = useRef<number[]>([])

  useEffect(() => {
    const t = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms)
      timeoutsRef.current.push(id)
      return id
    }

    // Phase 1: show stone under center cup (1s)
    // Phase 2: cover with cup (0.8s)
    t(() => setPhase('cover'), 1000)
    // Phase 3: start shuffling (after cover)
    t(() => {
      setPhase('shuffle')
      setShuffleStep(0)
    }, 1800)

    return () => {
      timeoutsRef.current.forEach(clearTimeout)
    }
  }, [])

  // Shuffle animation steps
  useEffect(() => {
    if (phase !== 'shuffle' || shuffleStep < 0) return
    if (shuffleStep >= SHUFFLE_PAIRS.length) {
      setPhase('choose')
      return
    }

    const timer = window.setTimeout(() => {
      const [a, b] = SHUFFLE_PAIRS[shuffleStep]
      setCupPositions(prev => {
        const next = [...prev]
        const tmp = next[a]
        next[a] = next[b]
        next[b] = tmp
        return next
      })
      setShuffleStep(s => s + 1)
    }, SHUFFLE_STEP_MS)

    return () => clearTimeout(timer)
  }, [phase, shuffleStep])

  // Choose timeout (5s)
  useEffect(() => {
    if (phase !== 'choose') return
    const timer = window.setTimeout(() => {
      if (selectedIdx === null) onTimeout()
    }, 5000)
    return () => clearTimeout(timer)
  }, [phase, selectedIdx, onTimeout])

  const handleSelect = (posIdx: number) => {
    if (phase !== 'choose' || selectedIdx !== null) return
    setSelectedIdx(posIdx)

    // Rig the result: stone is always under a cup the player didn't pick
    const otherPositions = [0, 1, 2].filter(i => i !== posIdx)
    const rigged = otherPositions[Math.floor(Math.random() * otherPositions.length)]
    setRevealIdx(rigged)

    setPhase('reveal')
    window.setTimeout(() => onSelect(posIdx), 2000)
  }

  // Map cupPositions to actual render positions
  const getCupRenderPos = (cupIdx: number) => {
    const posIdx = cupPositions.indexOf(cupIdx)
    return CUP_POSITIONS[posIdx >= 0 ? posIdx : 0]
  }

  return (
    <Container>
      <Title>
        {phase === 'show' && '잘 보세요...'}
        {phase === 'cover' && '잘 보세요...'}
        {phase === 'shuffle' && '섞는 중...'}
        {phase === 'choose' && '어디에 있을까요?'}
        {phase === 'reveal' && '땡! 🫢'}
      </Title>

      {/* Stone (visible in show phase, then under cup in reveal for rigged position) */}
      {phase === 'show' && (
        <Stone style={{ left: `${CUP_POSITIONS[1].x}%`, top: `${CUP_POSITIONS[1].y + 5}%` }}>
          <img src={stoneImg} alt="stone" style={{ width: 28, height: 28 }} draggable={false} />
        </Stone>
      )}

      {/* Reveal: stone appears under the rigged cup */}
      {phase === 'reveal' && (
        <Stone style={{ left: `${CUP_POSITIONS[revealIdx].x}%`, top: `${CUP_POSITIONS[revealIdx].y + 5}%` }}>
          <img src={stoneImg} alt="stone" style={{ width: 28, height: 28 }} draggable={false} />
        </Stone>
      )}

      {/* Three cups */}
      {[0, 1, 2].map((cupIdx) => {
        const pos = getCupRenderPos(cupIdx)
        const posIdx = cupPositions.indexOf(cupIdx)
        const isSelected = selectedIdx === posIdx
        const isRevealed = phase === 'reveal' && posIdx === revealIdx
        const showCup = phase !== 'show' // cups appear after show phase

        if (!showCup) return null

        return (
          <Cup
            key={cupIdx}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            animate={
              isRevealed
                ? { y: -40, opacity: 0.5 }
                : isSelected && phase === 'reveal'
                  ? { y: -30 }
                  : {}
            }
            transition={{ duration: 0.4, ease: 'easeOut' }}
            onClick={() => handleSelect(posIdx)}
            $clickable={phase === 'choose'}
            $highlighted={phase === 'choose'}
          >
            <CupImage src={CUP_IMG} alt="cup" draggable={false} />
            {isSelected && phase === 'reveal' && (
              <Badge>선택!</Badge>
            )}
          </Cup>
        )
      })}

      {/* Prompt during choose */}
      {phase === 'choose' && (
        <Prompt>컵을 터치하세요!</Prompt>
      )}
    </Container>
  )
}

// ── Styled ──

const fadeIn = keyframes`
  from { opacity: 0; transform: translate(-50%, -60%) scale(0.8); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
`

const pulse = keyframes`
  0%, 100% { filter: drop-shadow(0 0 0 transparent); }
  50% { filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.6)); }
`

const Container = styled.div`
  position: absolute;
  inset: 0;
  z-index: 50;
`

const Title = styled.div`
  position: absolute;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 18px;
  font-weight: 700;
  color: #fbbf24;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  z-index: 55;
`

const Stone = styled.div`
  position: absolute;
  transform: translate(-50%, -50%);
  font-size: 28px;
  z-index: 49;
  animation: ${fadeIn} 0.3s ease-out forwards;
`

const Cup = styled(motion.div)<{ $clickable: boolean; $highlighted: boolean }>`
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 51;
  cursor: ${({ $clickable }) => $clickable ? 'pointer' : 'default'};
  pointer-events: ${({ $clickable }) => $clickable ? 'auto' : 'none'};
  transition: left 0.3s ease, top 0.3s ease;
  ${({ $highlighted }) => $highlighted && `animation: ${pulse} 1.2s ease-in-out infinite;`}

  &:active {
    transform: translate(-50%, -50%) scale(0.92);
  }
`

const CupImage = styled.img`
  width: 72px;
  height: 72px;
  object-fit: contain;
`

const Badge = styled.div`
  position: absolute;
  bottom: -22px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 13px;
  font-weight: 700;
  color: #60a5fa;
  white-space: nowrap;
`

const Prompt = styled.div`
  position: absolute;
  bottom: 15%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
`
