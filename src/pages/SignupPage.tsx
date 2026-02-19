import styled from '@emotion/styled'
import { SignupForm } from '@/components/auth/SignupForm'

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  padding: 24px;
`

const Card = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 40px 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.06);
  width: 100%;
  max-width: 400px;
`

export function SignupPage() {
  return (
    <Page>
      <Card>
        <SignupForm />
      </Card>
    </Page>
  )
}
