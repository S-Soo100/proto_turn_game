import { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  onComplete: () => void
}

type Phase = 'celebrate' | 'confetti' | 'rewind' | 'message' | 'done'

const CONFETTI_EMOJIS = ['🎊', '🎉', '✨', '🌟', '💫']

export default function FakeClearEffect({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('celebrate')

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('confetti'), 500),
      setTimeout(() => setPhase('rewind'), 2000),
      setTimeout(() => setPhase('message'), 2800),
      setTimeout(() => {
        setPhase('done')
        onComplete()
      }, 3800),
    ]
    return () => timers.forEach(clearTimeout)
  }, [onComplete])

  return (
    <Container>
      <AnimatePresence>
        {/* Celebration text */}
        {(phase === 'celebrate' || phase === 'confetti') && (
          <CelebrationText
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1.2, rotate: 0 }}
            transition={{ type: 'spring', damping: 8 }}
          >
            🎉 축하합니다! 🎉
          </CelebrationText>
        )}

        {/* Confetti particles */}
        {phase === 'confetti' &&
          Array.from({ length: 12 }, (_, i) => (
            <ConfettiPiece
              key={i}
              initial={{
                x: 180,
                y: 200,
                opacity: 1,
              }}
              animate={{
                x: 180 + (Math.cos((i / 12) * Math.PI * 2) * 150),
                y: 200 + (Math.sin((i / 12) * Math.PI * 2) * 150) - 50,
                opacity: 0,
                rotate: i * 60,
              }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            >
              {CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length]}
            </ConfettiPiece>
          ))}

        {/* VHS Rewind effect */}
        {phase === 'rewind' && <VHSOverlay />}

        {/* Troll message */}
        {phase === 'message' && (
          <TrollMessage
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            아 잠깐, 아직이요 ㅋ
          </TrollMessage>
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
  display: flex;
  align-items: center;
  justify-content: center;
`

const CelebrationText = styled(motion.div)`
  position: absolute;
  font-size: 24px;
  font-weight: 800;
  color: #ffd700;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
`

const ConfettiPiece = styled(motion.div)`
  position: absolute;
  font-size: 20px;
`

const vhsScanline = keyframes`
  0% { background-position: 0 0; }
  100% { background-position: 0 100%; }
`

const vhsShake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  50% { transform: translateX(3px); }
  75% { transform: translateX(-2px); }
`

const VHSOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.15) 2px,
    rgba(0, 0, 0, 0.15) 4px
  );
  animation: ${vhsScanline} 0.3s linear infinite, ${vhsShake} 0.1s linear infinite;
  mix-blend-mode: overlay;
`

const TrollMessage = styled(motion.div)`
  position: absolute;
  font-size: 22px;
  font-weight: 700;
  color: #fbbf24;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
`
