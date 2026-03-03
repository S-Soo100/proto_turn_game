import { useEffect, useState, useRef, useCallback } from 'react'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CONSTELLATION_STARS,
  CONSTELLATION_LINES,
} from '@/lib/game-logic/chaos-rules/constellation'

// ── Props ──

interface Props {
  constellationIndex: number
  constellationName: string
  constellationDesc: string
  onWish: (choice: 'return' | 'more') => void
  onTimeout: () => void
}

type Phase = 'ascend' | 'constellation' | 'wish' | 'result'

const WISH_TIMEOUT_MS = 3000

export default function ConstellationEffect({
  constellationIndex,
  constellationName,
  constellationDesc,
  onWish,
  onTimeout,
}: Props) {
  const [phase, setPhase] = useState<Phase>('ascend')
  const [choice, setChoice] = useState<'return' | 'more' | 'timeout' | null>(null)
  const [resultMessage, setResultMessage] = useState('')
  const wishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasResolvedRef = useRef(false)

  const stars = CONSTELLATION_STARS[constellationIndex] ?? CONSTELLATION_STARS[0]
  const lines = CONSTELLATION_LINES[constellationIndex] ?? CONSTELLATION_LINES[0]

  // Phase transitions
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('constellation'), 2000)
    const t2 = setTimeout(() => setPhase('wish'), 4000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  // Wish timeout
  useEffect(() => {
    if (phase !== 'wish') return
    wishTimerRef.current = setTimeout(() => {
      if (hasResolvedRef.current) return
      hasResolvedRef.current = true
      setChoice('timeout')
      setResultMessage('소원을 빌지 않았습니다...')
      setPhase('result')
      setTimeout(() => onTimeout(), 1500)
    }, WISH_TIMEOUT_MS)
    return () => {
      if (wishTimerRef.current) clearTimeout(wishTimerRef.current)
    }
  }, [phase, onTimeout])

  const handleWish = useCallback(
    (c: 'return' | 'more') => {
      if (hasResolvedRef.current) return
      hasResolvedRef.current = true
      if (wishTimerRef.current) clearTimeout(wishTimerRef.current)
      setChoice(c)
      setPhase('result')

      if (c === 'return') {
        setResultMessage('돌들이 유성이 되어 돌아옵니다!')
      } else {
        setResultMessage('욕심이 과하셨어요...')
      }
      setTimeout(() => onWish(c), 1500)
    },
    [onWish],
  )

  return (
    <Container>
      {/* Night sky background */}
      <NightSky
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'ascend' ? 0.5 : 1 }}
        transition={{ duration: 1 }}
      >
        {/* Ambient stars */}
        {Array.from({ length: 30 }).map((_, i) => (
          <AmbientStar
            key={i}
            style={{
              left: `${(i * 37 + 13) % 100}%`,
              top: `${(i * 53 + 7) % 100}%`,
              animationDelay: `${(i * 0.3) % 2}s`,
            }}
          />
        ))}
      </NightSky>

      {/* Ascending stone effect */}
      <AnimatePresence>
        {phase === 'ascend' && (
          <AscendingStone
            initial={{ y: 200, opacity: 1, scale: 1 }}
            animate={{ y: -100, opacity: 0, scale: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeIn' }}
          >
            ✦
          </AscendingStone>
        )}
      </AnimatePresence>

      {/* Gold breakthrough flash */}
      <AnimatePresence>
        {phase === 'ascend' && (
          <BreakthroughFlash
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{ duration: 0.5, delay: 0.5 }}
          />
        )}
      </AnimatePresence>

      {/* Constellation SVG */}
      <AnimatePresence>
        {(phase === 'constellation' || phase === 'wish' || phase === 'result') && (
          <ConstellationContainer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <svg viewBox="0 0 100 100" width="240" height="240">
              {/* Lines */}
              {lines.map(([a, b], i) => (
                <ConstellationLine
                  key={`line-${i}`}
                  x1={stars[a].x}
                  y1={stars[a].y}
                  x2={stars[b].x}
                  y2={stars[b].y}
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
              {/* Stars */}
              {stars.map((star, i) => (
                <PulsingStar
                  key={`star-${i}`}
                  cx={star.x}
                  cy={star.y}
                  r="3"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </svg>

            {/* Constellation name */}
            <ConstellationName
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {constellationName}
            </ConstellationName>
            <ConstellationDesc
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {constellationDesc}
            </ConstellationDesc>
          </ConstellationContainer>
        )}
      </AnimatePresence>

      {/* Wish prompt */}
      <AnimatePresence>
        {phase === 'wish' && (
          <WishContainer
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <WishTitle>소원을 비세요</WishTitle>
            <WishButtons>
              <WishButton onClick={() => handleWish('return')} $variant="return">
                돌 돌려줘
              </WishButton>
              <WishButton onClick={() => handleWish('more')} $variant="more">
                더 보여줘
              </WishButton>
            </WishButtons>
            <WishTimerBar />
          </WishContainer>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {phase === 'result' && (
          <ResultContainer
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            {choice === 'return' && (
              <MeteorContainer>
                {[0, 1, 2, 3, 4].map((i) => (
                  <Meteor
                    key={i}
                    initial={{ x: (i - 2) * 40, y: -100, opacity: 0 }}
                    animate={{ x: 0, y: 100, opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  >
                    ☄️
                  </Meteor>
                ))}
              </MeteorContainer>
            )}
            {(choice === 'more' || choice === 'timeout') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ fontSize: '40px' }}
              >
                💫
              </motion.div>
            )}
            <ResultText>{resultMessage}</ResultText>
          </ResultContainer>
        )}
      </AnimatePresence>
    </Container>
  )
}

// ── Animations ──

const twinkle = keyframes`
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
`

const pulse = keyframes`
  0%, 100% { r: 2.5; opacity: 0.8; }
  50% { r: 4; opacity: 1; }
`

const drawLine = keyframes`
  from { stroke-dashoffset: 200; }
  to { stroke-dashoffset: 0; }
`

const drainTimer = keyframes`
  from { width: 100%; }
  to { width: 0%; }
`

// ── Styled Components ──

const Container = styled.div`
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
`

const NightSky = styled(motion.div)`
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 30%, #1a1a4e 0%, #0a0a2e 60%, #050520 100%);
`

const AmbientStar = styled.div`
  position: absolute;
  width: 2px;
  height: 2px;
  background: white;
  border-radius: 50%;
  animation: ${twinkle} 2s ease-in-out infinite;
`

const AscendingStone = styled(motion.div)`
  position: absolute;
  font-size: 36px;
  color: #ffd700;
  z-index: 5;
  text-shadow: 0 0 20px #ffd700, 0 0 40px #ffd700;
`

const BreakthroughFlash = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(180deg, #ffd700 0%, transparent 100%);
  z-index: 4;
`

const ConstellationContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 10;
`

const ConstellationLine = styled.line`
  stroke: rgba(255, 255, 255, 0.6);
  stroke-width: 0.5;
  stroke-dasharray: 200;
  animation: ${drawLine} 0.8s ease-out forwards;
`

const PulsingStar = styled.circle`
  fill: #ffd700;
  animation: ${pulse} 1.5s ease-in-out infinite;
`

const ConstellationName = styled(motion.div)`
  font-size: 20px;
  font-weight: 700;
  color: #ffd700;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
  margin-top: 8px;
`

const ConstellationDesc = styled(motion.div)`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
`

const WishContainer = styled(motion.div)`
  position: absolute;
  bottom: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  z-index: 20;
`

const WishTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #e2e8f0;
`

const WishButtons = styled.div`
  display: flex;
  gap: 12px;
`

const WishButton = styled.button<{ $variant: 'return' | 'more' }>`
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  background: ${({ $variant }) =>
    $variant === 'return'
      ? 'linear-gradient(135deg, #3b82f6, #60a5fa)'
      : 'linear-gradient(135deg, #a855f7, #c084fc)'};
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

  &:active {
    transform: scale(0.95);
  }
`

const WishTimerBar = styled.div`
  width: 160px;
  height: 3px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  overflow: hidden;

  &::after {
    content: '';
    display: block;
    height: 100%;
    background: #fbbf24;
    border-radius: 2px;
    animation: ${drainTimer} ${WISH_TIMEOUT_MS}ms linear forwards;
  }
`

const ResultContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  z-index: 20;
`

const MeteorContainer = styled.div`
  position: relative;
  width: 200px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const Meteor = styled(motion.div)`
  position: absolute;
  font-size: 24px;
`

const ResultText = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #e2e8f0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`
