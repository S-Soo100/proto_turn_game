import { Component, type ReactNode, type ErrorInfo } from 'react'
import styled from '@emotion/styled'
import { logError } from '@/lib/error-logger'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

const Container = styled.div`
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #f9fafb;
  text-align: center;
`

const Emoji = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`

const Title = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px;
`

const Desc = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 24px;
  line-height: 1.5;
`

const ReloadButton = styled.button`
  padding: 12px 32px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active {
    background: #4f46e5;
  }
`

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logError({
      message: error.message,
      stack: error.stack,
      source: 'ErrorBoundary',
      severity: 'fatal',
      extra: { componentStack: errorInfo.componentStack ?? '' },
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container>
          <Emoji>😵</Emoji>
          <Title>문제가 발생했습니다</Title>
          <Desc>
            예상치 못한 오류가 발생했어요.
            <br />
            페이지를 새로고침해 주세요.
          </Desc>
          <ReloadButton onClick={this.handleReload}>새로고침</ReloadButton>
        </Container>
      )
    }

    return this.props.children
  }
}
