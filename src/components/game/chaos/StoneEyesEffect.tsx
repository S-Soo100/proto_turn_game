import { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { motion, AnimatePresence } from 'framer-motion'
import type { StonePosition } from '@/lib/physics/gonggi-physics'

interface Props {
  stonePositions: StonePosition[]
  affectedStoneIds: number[]
  onComplete: () => void
}

export default function StoneEyesEffect({ stonePositions, affectedStoneIds, onComplete }: Props) {
  const [showExclamation, setShowExclamation] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setShowExclamation(true), 200)
    const t2 = setTimeout(() => onComplete(), 1500)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [onComplete])

  return (
    <Container>
      <AnimatePresence>
        {affectedStoneIds.map((id) => {
          const pos = stonePositions.find((p) => p.id === id)
          if (!pos) return null
          return (
            <EyesWrapper
              key={id}
              style={{ left: pos.x, top: pos.y - 20 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2, delay: id * 0.05 }}
            >
              <Eyes>👀</Eyes>
              {showExclamation && (
                <Exclamation
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  !
                </Exclamation>
              )}
            </EyesWrapper>
          )
        })}
      </AnimatePresence>
    </Container>
  )
}

const Container = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 45;
`

const EyesWrapper = styled(motion.div)`
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
`

const Eyes = styled.div`
  font-size: 16px;
`

const Exclamation = styled(motion.div)`
  font-size: 14px;
  font-weight: 800;
  color: #ef4444;
  background: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
`
