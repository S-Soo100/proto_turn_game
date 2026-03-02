import { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  stoneX: number
  stoneY: number
  onComplete: () => void
}

type Phase = 'morph' | 'fly' | 'feather' | 'message' | 'done'

export default function BirdTransformEffect({ stoneX, stoneY, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('morph')

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('fly'), 300),
      setTimeout(() => setPhase('feather'), 800),
      setTimeout(() => setPhase('message'), 1300),
      setTimeout(() => {
        setPhase('done')
        onComplete()
      }, 2300),
    ]
    return () => timers.forEach(clearTimeout)
  }, [onComplete])

  return (
    <Container>
      <AnimatePresence>
        {/* Stone → Bird morph */}
        {(phase === 'morph' || phase === 'fly') && (
          <Bird
            style={{ left: stoneX, top: stoneY }}
            initial={{ scale: 0.5, rotate: 0 }}
            animate={
              phase === 'fly'
                ? { scale: 1.5, rotate: 30, y: -300, x: 100, opacity: 0 }
                : { scale: 1.2, rotate: 15 }
            }
            transition={{ duration: phase === 'fly' ? 0.8 : 0.3, ease: 'easeOut' }}
            exit={{ opacity: 0 }}
          >
            🐦
          </Bird>
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
                🪶
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

// ── Styled ──

const Container = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 50;
`

const Bird = styled(motion.div)`
  position: absolute;
  font-size: 36px;
  transform-origin: center;
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
