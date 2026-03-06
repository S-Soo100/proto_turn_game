import { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  onComplete: () => void
}

type Phase = 'fake-success' | 'descend' | 'swipe' | 'exit' | 'message' | 'done'

export default function CatSwipeEffect({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('fake-success')

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('descend'), 400),
      setTimeout(() => setPhase('swipe'), 800),
      setTimeout(() => setPhase('exit'), 1400),
      setTimeout(() => setPhase('message'), 1600),
      setTimeout(() => {
        setPhase('done')
        onComplete()
      }, 2800),
    ]
    return () => timers.forEach(clearTimeout)
  }, [onComplete])

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

        {/* Cat paw — descend from top */}
        {phase === 'descend' && (
          <PawBar
            initial={{ y: '-100%' }}
            animate={{ y: '40%' }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <PawPads>
              <Pad><img src="/assets/effects/chaos-cat-paw.png" alt="paw" style={{ width: 28, height: 28 }} draggable={false} /></Pad>
              <Pad><img src="/assets/effects/chaos-cat-paw.png" alt="paw" style={{ width: 28, height: 28 }} draggable={false} /></Pad>
              <Pad><img src="/assets/effects/chaos-cat-paw.png" alt="paw" style={{ width: 28, height: 28 }} draggable={false} /></Pad>
              <Pad><img src="/assets/effects/chaos-cat-paw.png" alt="paw" style={{ width: 28, height: 28 }} draggable={false} /></Pad>
            </PawPads>
          </PawBar>
        )}

        {/* Cat paw — swipe left to right */}
        {phase === 'swipe' && (
          <PawBar
            style={{ top: '40%' }}
            initial={{ x: '-120%' }}
            animate={{ x: '120%' }}
            transition={{ duration: 0.55, ease: 'easeInOut' }}
          >
            <PawPads>
              <Pad><img src="/assets/effects/chaos-cat-paw.png" alt="paw" style={{ width: 28, height: 28 }} draggable={false} /></Pad>
              <Pad><img src="/assets/effects/chaos-cat-paw.png" alt="paw" style={{ width: 28, height: 28 }} draggable={false} /></Pad>
              <Pad><img src="/assets/effects/chaos-cat-paw.png" alt="paw" style={{ width: 28, height: 28 }} draggable={false} /></Pad>
              <Pad><img src="/assets/effects/chaos-cat-paw.png" alt="paw" style={{ width: 28, height: 28 }} draggable={false} /></Pad>
            </PawPads>
          </PawBar>
        )}

        {/* Cat paw — exit right */}
        {phase === 'exit' && (
          <PawBar
            style={{ top: '40%' }}
            initial={{ x: '50%' }}
            animate={{ x: '150%' }}
            transition={{ duration: 0.25, ease: 'easeIn' }}
          >
            <PawPads>
              <Pad><img src="/assets/effects/chaos-cat-paw.png" alt="paw" style={{ width: 28, height: 28 }} draggable={false} /></Pad>
              <Pad><img src="/assets/effects/chaos-cat-paw.png" alt="paw" style={{ width: 28, height: 28 }} draggable={false} /></Pad>
              <Pad><img src="/assets/effects/chaos-cat-paw.png" alt="paw" style={{ width: 28, height: 28 }} draggable={false} /></Pad>
              <Pad><img src="/assets/effects/chaos-cat-paw.png" alt="paw" style={{ width: 28, height: 28 }} draggable={false} /></Pad>
            </PawPads>
          </PawBar>
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

const pawShake = keyframes`
  0%, 100% { transform: translateY(0); }
  25% { transform: translateY(-2px); }
  75% { transform: translateY(2px); }
`

const PawBar = styled(motion.div)`
  position: absolute;
  left: 0;
  width: 120%;
  height: 64px;
  background: linear-gradient(180deg, #a0744e 0%, #8b6914 40%, #7a5c12 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
  animation: ${pawShake} 0.15s ease-in-out infinite;
`

const PawPads = styled.div`
  display: flex;
  gap: 16px;
  padding: 0 24px;
`

const Pad = styled.span`
  font-size: 28px;
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
