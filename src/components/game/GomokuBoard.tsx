import styled from '@emotion/styled'
import { motion } from 'framer-motion'
import type { GomokuState, GomokuResult } from '@/lib/game-logic/gomoku'

interface Props {
  state: GomokuState
  result: GomokuResult | null
  isAIThinking: boolean
  isMyTurn: boolean
  isPvp: boolean
  onCellClick: (index: number) => void
}

const BoardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
`

const BoardScroller = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  justify-content: center;
`

// 15x15 grid with intersection-style lines
const BoardSurface = styled.div`
  position: relative;
  background: #f5deb3;
  border-radius: 4px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(15, 28px);
  grid-template-rows: repeat(15, 28px);
  position: relative;
`

// Board lines drawn via pseudo-elements
const LineLayer = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
`

interface CellProps {
  isWinCell: boolean
  isLastMove: boolean
  isDisabled: boolean
}

const Cell = styled.button<CellProps>`
  width: 28px;
  height: 28px;
  position: relative;
  background: transparent;
  border: none;
  padding: 0;
  cursor: ${({ isDisabled }) => (isDisabled ? 'default' : 'pointer')};
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;

  /* Intersection lines */
  &::before,
  &::after {
    content: '';
    position: absolute;
    background: #8b6914;
    pointer-events: none;
  }

  /* Horizontal line */
  &::before {
    height: 1px;
    width: 100%;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
  }

  /* Vertical line */
  &::after {
    width: 1px;
    height: 100%;
    left: 50%;
    top: 0;
    transform: translateX(-50%);
  }

  &:hover:not(:disabled) .stone-hover {
    opacity: 0.35;
  }

  &:active {
    transform: scale(0.9);
  }
`

interface StoneProps {
  isWinCell: boolean
  isLastMove: boolean
}

const Stone = styled.div<StoneProps>`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  line-height: 1;
  position: relative;
  z-index: 1;
  outline: ${({ isWinCell, isLastMove }) =>
    isWinCell
      ? '3px solid #fbbf24'
      : isLastMove
      ? '2px solid #f59e0b'
      : 'none'};
  outline-offset: 1px;
  border-radius: 50%;
`

const HoverStone = styled.div`
  font-size: 20px;
  line-height: 1;
  opacity: 0;
  position: relative;
  z-index: 1;
  transition: opacity 0.1s;
`

const StatusBar = styled.div`
  width: 100%;
  max-width: 452px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  background: #f3f4f6;
  color: #374151;
`

const AIThinkingDot = styled(motion.span)`
  display: inline-block;
  width: 6px;
  height: 6px;
  background: #6366f1;
  border-radius: 50%;
  margin: 0 2px;
`

function AIThinkingIndicator() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, marginLeft: 8 }}>
      {[0, 1, 2].map((i) => (
        <AIThinkingDot
          key={i}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  )
}

function getStatusText(
  state: GomokuState,
  result: GomokuResult | null,
  isAIThinking: boolean,
  isMyTurn: boolean,
  isPvp: boolean,
): React.ReactNode {
  if (isAIThinking) return <>AI가 생각 중입니다<AIThinkingIndicator /></>
  if (result) {
    if (result.winner === null) return '무승부!'
    if (isPvp) return '게임 종료'
    return result.winner === 'B' ? '승리! 🎉' : '패배... 다시 도전해보세요'
  }
  if (isPvp) return isMyTurn ? '내 차례 🐻' : '상대방 차례...'
  if (state.currentMark === 'B') return '당신의 차례 (🐻 곰)'
  return 'AI의 차례 (🐰 토끼)'
}

export function GomokuBoard({ state, result, isAIThinking, isMyTurn, isPvp, onCellClick }: Props) {
  const winLine = result?.winLine ?? null
  const isGameOver = result !== null
  const isPlayerTurn = isPvp
    ? isMyTurn && !isGameOver
    : !isAIThinking && !isGameOver && state.currentMark === 'B'

  return (
    <BoardWrapper>
      <StatusBar>
        {getStatusText(state, result, isAIThinking, isMyTurn, isPvp)}
      </StatusBar>

      <BoardScroller>
        <BoardSurface>
          <LineLayer />
          <Grid>
            {state.grid.map((cell, i) => {
              const isWinCell = winLine?.includes(i) ?? false
              const isLastMove = state.lastMove === i
              const isEmpty = cell === null
              const isDisabled = !isEmpty || !isPlayerTurn

              return (
                <Cell
                  key={i}
                  isWinCell={isWinCell}
                  isLastMove={isLastMove}
                  isDisabled={isDisabled}
                  onClick={() => !isDisabled && onCellClick(i)}
                  aria-label={cell ? `${cell} at ${i}` : `Empty ${i}`}
                >
                  {cell ? (
                    <Stone
                      isWinCell={isWinCell}
                      isLastMove={isLastMove}
                    >
                      {cell === 'B' ? '🐻' : '🐰'}
                    </Stone>
                  ) : isPlayerTurn ? (
                    <HoverStone className="stone-hover">🐻</HoverStone>
                  ) : null}
                </Cell>
              )
            })}
          </Grid>
        </BoardSurface>
      </BoardScroller>
    </BoardWrapper>
  )
}
