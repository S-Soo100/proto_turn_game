import { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  stoneX: number
  stoneY: number
  correctIndex: number
  onSelect: (index: number) => void
  onTimeout: () => void
}

const SPLIT_OFFSETS = [
  { x: -60, y: 40 },
  { x: 0, y: 20 },
  { x: 60, y: 40 },
]

export default function SplitEffect({ stoneX, stoneY, correctIndex, onSelect, onTimeout }: Props) {
  const [phase, setPhase] = useState<'split' | 'choose' | 'result'>('split')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('choose'), 800)
    const t2 = setTimeout(() => {
      if (phase === 'choose' && selectedIndex === null) {
        onTimeout()
      }
    }, 3000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [phase, selectedIndex, onTimeout])

  const handleSelect = (index: number) => {
    if (phase !== 'choose' || selectedIndex !== null) return
    setSelectedIndex(index)
    setPhase('result')
    setTimeout(() => onSelect(index), 1000)
  }

  const isCorrect = selectedIndex === correctIndex

  return (
    <Container>
      <AnimatePresence>
        {/* Split animation */}
        {phase === 'split' && (
          <SplitOrigin
            style={{ left: stoneX, top: stoneY }}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.3, 0.8] }}
            transition={{ duration: 0.3 }}
          >
            ✨
          </SplitOrigin>
        )}

        {/* Three stones to choose from */}
        {(phase === 'choose' || phase === 'result') &&
          SPLIT_OFFSETS.map((offset, i) => (
            <SplitStone
              key={i}
              style={{
                left: stoneX + offset.x,
                top: stoneY + offset.y,
              }}
              initial={{ scale: 0 }}
              animate={{
                scale: 1,
                opacity:
                  phase === 'result'
                    ? i === correctIndex
                      ? 1
                      : 0.3
                    : 1,
              }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              onClick={() => handleSelect(i)}
              $clickable={phase === 'choose'}
            >
              🟡
              {phase === 'result' && selectedIndex === i && (
                <ResultBadge $correct={isCorrect}>
                  {isCorrect ? '정답!' : '땡!'}
                </ResultBadge>
              )}
            </SplitStone>
          ))}
      </AnimatePresence>
    </Container>
  )
}

// ── Styled ──

const Container = styled.div`
  position: absolute;
  inset: 0;
  z-index: 50;
`

const SplitOrigin = styled(motion.div)`
  position: absolute;
  font-size: 32px;
  transform: translate(-50%, -50%);
  pointer-events: none;
`

const SplitStone = styled(motion.div)<{ $clickable: boolean }>`
  position: absolute;
  font-size: 28px;
  transform: translate(-50%, -50%);
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  pointer-events: ${({ $clickable }) => ($clickable ? 'auto' : 'none')};
  &:active {
    transform: translate(-50%, -50%) scale(0.9);
  }
`

const ResultBadge = styled.div<{ $correct: boolean }>`
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;
  font-weight: 700;
  color: ${({ $correct }) => ($correct ? '#22c55e' : '#ef4444')};
  white-space: nowrap;
`
