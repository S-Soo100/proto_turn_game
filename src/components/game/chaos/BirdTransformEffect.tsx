import { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  stoneX: number
  stoneY: number
  onComplete: () => void
}

type Phase = 'morph' | 'fly' | 'feather' | 'message' | 'done'

// Sparkle trail positions along the flight path
const TRAIL_POINTS = [
  { x: 15, y: -20, delay: 0 },
  { x: 30, y: -55, delay: 0.1 },
  { x: 48, y: -70, delay: 0.2 },
  { x: 65, y: -60, delay: 0.3 },
]

export default function BirdTransformEffect({ stoneX, stoneY, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('morph')

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('fly'), 500),
      setTimeout(() => setPhase('feather'), 1600),
      setTimeout(() => setPhase('message'), 2100),
      setTimeout(() => {
        setPhase('done')
        onComplete()
      }, 3100),
    ]
    return () => timers.forEach(clearTimeout)
  }, [onComplete])

  return (
    <Container>
      <AnimatePresence>
        {/* Stone -> Bird morph */}
        {phase === 'morph' && (
          <MorphWrapper
            style={{ left: stoneX, top: stoneY }}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.1, 0.9, 1.15, 1] }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            {/* Shake stone then crossfade to bird */}
            <MorphBird
              initial={{ opacity: 0, scale: 0.3, rotate: -30 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <img src="/assets/effects/chaos-bird.png" alt="bird" style={{ width: 48, height: 48 }} draggable={false} />
            </MorphBird>
            {/* Sparkle burst on morph */}
            {[0, 1, 2, 3].map((i) => (
              <MorphSparkle
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.2, 0.5],
                  x: (i % 2 === 0 ? 1 : -1) * (15 + i * 8),
                  y: (i < 2 ? -1 : 1) * (12 + i * 6),
                }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
              >
                <img src="/assets/effects/chaos-sparkle.png" alt="" style={{ width: 14, height: 14 }} draggable={false} />
              </MorphSparkle>
            ))}
          </MorphWrapper>
        )}

        {/* Bird flight along arc */}
        {phase === 'fly' && (
          <>
            <FlyingBird
              style={{ left: stoneX, top: stoneY }}
            >
              <img src="/assets/effects/chaos-bird-fly.png" alt="bird" style={{ width: 58, height: 58 }} draggable={false} />
            </FlyingBird>

            {/* Sparkle trail along flight path */}
            {TRAIL_POINTS.map((pt, i) => (
              <TrailSparkle
                key={i}
                style={{ left: stoneX + pt.x, top: stoneY + pt.y }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 0.9, 0], scale: [0, 1, 0.3] }}
                transition={{ duration: 0.6, delay: 0.3 + pt.delay }}
              >
                <img src="/assets/effects/chaos-sparkle.png" alt="" style={{ width: 12, height: 12 }} draggable={false} />
              </TrailSparkle>
            ))}
          </>
        )}

        {/* Feather particles */}
        {(phase === 'feather' || phase === 'message') && (
          <>
            {[0, 1, 2].map((i) => (
              <Feather
                key={i}
                initial={{
                  x: stoneX + (i - 1) * 30,
                  y: stoneY - 80,
                  opacity: 1,
                  rotate: i * 45,
                }}
                animate={{
                  y: stoneY + 60,
                  opacity: 0,
                  rotate: i * 45 + 180,
                  x: stoneX + (i - 1) * 50,
                }}
                transition={{ duration: 1, ease: 'easeIn' }}
              >
                <img src="/assets/effects/chaos-feather.png" alt="feather" style={{ width: 18, height: 18 }} draggable={false} />
              </Feather>
            ))}
          </>
        )}

        {/* Message */}
        {phase === 'message' && (
          <Message
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            ...?
          </Message>
        )}
      </AnimatePresence>
    </Container>
  )
}

// ── Animations ──

const birdFlight = keyframes`
  0%   { transform: translate(-50%, -50%) scale(1) scaleX(1); opacity: 1; }
  10%  { transform: translate(-50%, -50%) scale(1.1) scaleX(-1); }
  15%  { transform: translate(-30%, -100%) scale(1.15) scaleX(1); }
  25%  { transform: translate(-10%, -200%) scale(1.2) scaleX(-1); }
  40%  { transform: translate(20%, -280%) scale(1.0) scaleX(1); }
  55%  { transform: translate(50%, -260%) scale(0.85) scaleX(-1); }
  70%  { transform: translate(80%, -200%) scale(0.7) scaleX(1); }
  85%  { transform: translate(110%, -250%) scale(0.5) scaleX(-1); opacity: 0.7; }
  100% { transform: translate(140%, -320%) scale(0.3) scaleX(1); opacity: 0; }
`

const wingFlap = keyframes`
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(0.85); }
`

// ── Styled ──

const Container = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 50;
`

const MorphWrapper = styled(motion.div)`
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
`

const MorphBird = styled(motion.div)`
  transform-origin: center;
`

const MorphSparkle = styled(motion.div)`
  position: absolute;
`

const FlyingBird = styled.div`
  position: absolute;
  z-index: 55;
  animation: ${birdFlight} 1.0s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
  img {
    animation: ${wingFlap} 0.15s ease-in-out infinite;
  }
`

const TrailSparkle = styled(motion.div)`
  position: absolute;
  z-index: 54;
  transform: translate(-50%, -50%);
`

const Feather = styled(motion.div)`
  position: absolute;
  font-size: 18px;
`

const Message = styled(motion.div)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 28px;
  font-weight: 700;
  color: #fbbf24;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
`
