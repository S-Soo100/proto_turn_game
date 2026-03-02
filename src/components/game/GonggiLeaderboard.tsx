import styled from '@emotion/styled'
import type { GonggiLeaderboardEntry } from '@/lib/gonggi-leaderboard'

interface Props {
  entries: GonggiLeaderboardEntry[]
  myId?: string
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  const millis = ms % 1000
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function GonggiLeaderboard({ entries, myId }: Props) {
  if (entries.length === 0) {
    return <EmptyMsg>아직 기록이 없습니다. 첫 번째 클리어에 도전하세요!</EmptyMsg>
  }

  return (
    <Table>
      <Header>
        <HeaderCell $w="36px">#</HeaderCell>
        <HeaderCell $w="1fr">닉네임</HeaderCell>
        <HeaderCell $w="90px">시간</HeaderCell>
        <HeaderCell $w="40px">실패</HeaderCell>
        <HeaderCell $w="40px">변칙</HeaderCell>
        <HeaderCell $w="48px">날짜</HeaderCell>
      </Header>
      {entries.map((entry, i) => {
        const isMe = entry.user_id === myId
        return (
          <Row key={entry.id} $highlight={isMe}>
            <Cell $w="36px">
              <RankNum $top3={i < 3}>{i + 1}</RankNum>
            </Cell>
            <Cell $w="1fr">
              <Name>
                {entry.profiles?.username ?? '???'}
                {isMe && <MyBadge>나</MyBadge>}
              </Name>
            </Cell>
            <Cell $w="90px">
              <Time>{formatTime(entry.clear_time_ms)}</Time>
            </Cell>
            <Cell $w="40px">{entry.fail_count}</Cell>
            <Cell $w="40px">{entry.chaos_survived}</Cell>
            <Cell $w="48px">
              <DateText>{formatDate(entry.created_at)}</DateText>
            </Cell>
          </Row>
        )
      })}
    </Table>
  )
}

// ── Styled ──

const EmptyMsg = styled.p`
  font-size: 14px;
  color: #9ca3af;
  text-align: center;
  padding: 32px 0;
`

const Table = styled.div`
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
`

const Header = styled.div`
  display: grid;
  grid-template-columns: 36px 1fr 90px 40px 40px 48px;
  padding: 10px 12px;
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  border-bottom: 1px solid #f3f4f6;
`

const HeaderCell = styled.span<{ $w: string }>`
  text-align: center;
  &:nth-of-type(2) {
    text-align: left;
  }
`

const Row = styled.div<{ $highlight: boolean }>`
  display: grid;
  grid-template-columns: 36px 1fr 90px 40px 40px 48px;
  padding: 9px 12px;
  align-items: center;
  font-size: 13px;
  background: ${({ $highlight }) => ($highlight ? '#f5f3ff' : 'transparent')};
  border-bottom: 1px solid #f9fafb;
`

const Cell = styled.span<{ $w: string }>`
  text-align: center;
  &:nth-of-type(2) {
    text-align: left;
  }
`

const RankNum = styled.span<{ $top3: boolean }>`
  font-weight: 700;
  color: ${({ $top3 }) => ($top3 ? '#f59e0b' : '#6b7280')};
`

const Name = styled.span`
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 4px;
`

const MyBadge = styled.span`
  font-size: 10px;
  background: #6366f1;
  color: #fff;
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 700;
`

const Time = styled.span`
  font-weight: 700;
  color: #111827;
  font-variant-numeric: tabular-nums;
  font-size: 12px;
`

const DateText = styled.span`
  font-size: 11px;
  color: #9ca3af;
`
