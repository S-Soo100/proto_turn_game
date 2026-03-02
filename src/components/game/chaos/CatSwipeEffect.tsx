import { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { motion, AnimatePresence } from 'framer-motion'
import type { CatDirection } from '@/lib/game-logic/chaos-rules/cat-swipe'

interface Props {
  direction: CatDirection
  onComplete: () => void
}

type Phase = 'fake-success' | 'paw-in' | 'hit' | 'paw-out' | 'message' | 'done'

const PAW_VARIANTS = {
  left: { initial: { x: -120 }, hit: { x: 180 }, exit: { x: -120 } },
  right: { initial: { x: 400 }, hit: { x: 100 }, exit: { x: 400 } },
  top: { initial: { y: -120 }, hit: { y: 200 }, exit: { y: -120 } },
}

export default function CatSwipeEffect({ direction, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('fake-success')

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('paw-in'), 400),
      setTimeout(() => setPhase('hit'), 600),
      setTimeout(() => setPhase('paw-out'), 1000),
      setTimeout(() => setPhase('message'), 1300),
      setTimeout(() => {
        setPhase('done')
        onComplete()
      }, 2500),
    ]
    return () => timers.forEach(clearTimeout)
  }, [onComplete])

  const variant = PAW_VARIANTS[direction]

  return (
    <Container>
      <AnimatePresence>
        {/* Fake "Success!" text */}
        {phase === 'fake-success' && (
          <FakeSuccess
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0.7, 1], scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            성공!
          </FakeSuccess>
        )}

        {/* Cat paw */}
        {(phase === 'paw-in' || phase === 'hit') && (
          <Paw
            initial={variant.initial}
            animate={phase === 'hit' ? variant.hit : variant.hit}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <PawEmoji>🐾</PawEmoji>
            <PawArm $direction={direction} />
          </Paw>
        )}

        {phase === 'paw-out' && (
          <Paw
            initial={variant.hit}
            animate={variant.exit}
            transition={{ duration: 0.3, ease: 'easeIn' }}
          >
            <PawEmoji>🐾</PawEmoji>
            <PawArm $direction={direction} />
          </Paw>
        )}

        {/* Message */}
        {phase === 'message' && (
          <CatMessage
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            야옹~
          </CatMessage>
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
  overflow: hidden;
`

const FakeSuccess = styled(motion.div)`
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 32px;
  font-weight: 800;
  color: #22c55e;
  text-shadow: 0 0 20px rgba(34, 197, 94, 0.5);
`

const Paw = styled(motion.div)`
  position: absolute;
  top: 40%;
  display: flex;
  align-items: center;
`

const PawEmoji = styled.div`
  font-size: 48px;
`

const PawArm = styled.div<{ $direction: CatDirection }>`
  width: 80px;
  height: 24px;
  background: #8b6914;
  border-radius: 12px;
  position: absolute;
  ${({ $direction }) =>
    $direction === 'left'
      ? 'right: 40px;'
      : $direction === 'right'
        ? 'left: 40px;'
        : 'bottom: 40px; width: 24px; height: 80px;'}
`

const CatMessage = styled(motion.div)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 28px;
  font-weight: 700;
  color: #fbbf24;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
`
