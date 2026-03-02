import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'

interface DanmakuComment {
  id: number
  text: string
  yPercent: number
}

interface Props {
  comments: DanmakuComment[]
}

export default function DanmakuOverlay({ comments }: Props) {
  if (comments.length === 0) return null

  return (
    <Container>
      {comments.map((c) => (
        <Comment key={c.id} style={{ top: `${c.yPercent}%` }}>
          {c.text}
        </Comment>
      ))}
    </Container>
  )
}

// ── Styled ──

const slide = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(-100%); }
`

const Container = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 40;
`

const Comment = styled.div`
  position: absolute;
  right: 0;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(0, 0, 0, 0.4);
  padding: 2px 10px;
  border-radius: 4px;
  animation: ${slide} 4s linear forwards;
`
