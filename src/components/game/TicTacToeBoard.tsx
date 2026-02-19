import styled from '@emotion/styled'
import { motion, AnimatePresence } from 'framer-motion'
import type { TicTacToeState, GameResult } from '@/lib/game-logic/tictactoe'

interface Props {
  state: TicTacToeState
  result: GameResult | null
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

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  width: 100%;
  max-width: 360px;
  aspect-ratio: 1 / 1;
`

interface CellProps {
  isWinCell: boolean
  isDisabled: boolean
}

const Cell = styled.button<CellProps>`
  background: ${({ isWinCell }) => (isWinCell ? '#ede9fe' : '#fff')};
  border: 2px solid ${({ isWinCell }) => (isWinCell ? '#7c3aed' : '#e5e7eb')};
  border-radius: 12px;
  font-size: clamp(32px, 10vw, 56px);
  font-weight: 800;
  cursor: ${({ isDisabled }) => (isDisabled ? 'default' : 'pointer')};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, border-color 0.15s, transform 0.1s;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  min-height: 80px;

  &:hover:not(:disabled) {
    background: #f5f3ff;
    border-color: #c4b5fd;
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 1;
  }
`

const StatusBar = styled.div`
  width: 100%;
  max-width: 360px;
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

function getMarkColor(mark: 'X' | 'O' | null): string {
  if (mark === 'X') return '#6366f1'
  if (mark === 'O') return '#f43f5e'
  return 'inherit'
}

function getStatusText(
  state: TicTacToeState,
  result: GameResult | null,
  isAIThinking: boolean,
  isMyTurn: boolean,
  isPvp: boolean,
): React.ReactNode {
  if (isAIThinking) return <>AI가 생각 중입니다<AIThinkingIndicator /></>
  if (result) {
    if (result.winner === null) return '무승부!'
    if (isPvp) return '게임 종료'
    return result.winner === 'X' ? '승리! 🎉' : '패배... 다시 도전해보세요'
  }
  if (isPvp) return isMyTurn ? '내 차례' : '상대방 차례...'
  if (state.currentMark === 'X') return '당신의 차례 (X)'
  return 'AI의 차례 (O)'
}

export function TicTacToeBoard({ state, result, isAIThinking, isMyTurn, isPvp, onCellClick }: Props) {
  const winLine = result?.winLine ?? null
  const isGameOver = result !== null
  const isPlayerTurn = isPvp
    ? isMyTurn && !isGameOver
    : !isAIThinking && !isGameOver && state.currentMark === 'X'

  return (
    <BoardWrapper>
      <StatusBar>
        {getStatusText(state, result, isAIThinking, isMyTurn, isPvp)}
      </StatusBar>

      <Grid>
        {state.grid.map((cell, i) => {
          const isWinCell = winLine?.includes(i) ?? false
          const isEmpty = cell === null
          const isDisabled = !isEmpty || !isPlayerTurn

          return (
            <Cell
              key={i}
              isWinCell={isWinCell}
              isDisabled={isDisabled}
              disabled={isDisabled}
              onClick={() => !isDisabled && onCellClick(i)}
              aria-label={cell ? `${cell} at position ${i + 1}` : `Empty cell ${i + 1}`}
            >
              <AnimatePresence>
                {cell && (
                  <motion.span
                    key={cell + i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    style={{ color: getMarkColor(cell), lineHeight: 1 }}
                  >
                    {cell}
                  </motion.span>
                )}
              </AnimatePresence>
            </Cell>
          )
        })}
      </Grid>
    </BoardWrapper>
  )
}
