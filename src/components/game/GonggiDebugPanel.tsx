import { useState } from 'react'
import styled from '@emotion/styled'
import type { GonggiState } from '@/lib/game-logic/gonggi'

const CHAOS_RULES = [
  { id: 'bird-transform', label: 'bird-transform' },
  { id: 'cat-swipe', label: 'cat-swipe' },
  { id: 'stone-eyes', label: 'stone-eyes' },
  { id: 'fake-clear', label: 'fake-clear' },
  { id: 'split', label: 'split' },
  { id: 'screen-flip', label: 'screen-flip' },
  { id: 'constellation', label: 'constellation' },
]

interface Props {
  gameState: GonggiState
  onForceRule: (ruleId: string) => void
  onSetChanceOverride: (chance: number | null) => void
  chanceOverride: number | null
}

export default function GonggiDebugPanel({
  gameState,
  onForceRule,
  onSetChanceOverride,
  chanceOverride,
}: Props) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <ToggleBtn onClick={() => setOpen(true)} data-testid="debug-toggle">
        D
      </ToggleBtn>
    )
  }

  return (
    <Panel data-testid="debug-panel">
      <PanelHeader>
        <span>Debug</span>
        <CloseBtn onClick={() => setOpen(false)}>X</CloseBtn>
      </PanelHeader>

      <Section>
        <SectionTitle>Force Rule</SectionTitle>
        <RuleGrid>
          {CHAOS_RULES.map((r) => (
            <RuleBtn key={r.id} onClick={() => onForceRule(r.id)}>
              {r.label}
            </RuleBtn>
          ))}
        </RuleGrid>
      </Section>

      <Section>
        <SectionTitle>
          Chance: {chanceOverride == null ? 'auto' : `${Math.round(chanceOverride * 100)}%`}
        </SectionTitle>
        <SliderRow>
          <label>
            <input
              type="checkbox"
              checked={chanceOverride != null}
              onChange={(e) =>
                onSetChanceOverride(e.target.checked ? 1.0 : null)
              }
            />
            override
          </label>
          {chanceOverride != null && (
            <Slider
              type="range"
              min={0}
              max={100}
              value={Math.round(chanceOverride * 100)}
              onChange={(e) =>
                onSetChanceOverride(Number(e.target.value) / 100)
              }
            />
          )}
        </SliderRow>
      </Section>

      <Section>
        <SectionTitle>State</SectionTitle>
        <StateGrid>
          <StateRow>
            <StateKey>round</StateKey>
            <StateVal>{gameState.round}</StateVal>
          </StateRow>
          <StateRow>
            <StateKey>stage</StateKey>
            <StateVal>{gameState.stage}</StateVal>
          </StateRow>
          <StateRow>
            <StateKey>substep</StateKey>
            <StateVal>{gameState.substep}</StateVal>
          </StateRow>
          <StateRow>
            <StateKey>phase</StateKey>
            <StateVal>{gameState.phase}</StateVal>
          </StateRow>
          <StateRow>
            <StateKey>chaos</StateKey>
            <StateVal>{gameState.triggeredChaosIds.join(', ') || '-'}</StateVal>
          </StateRow>
        </StateGrid>
      </Section>
    </Panel>
  )
}

// ── Styled ──

const ToggleBtn = styled.button`
  position: absolute;
  bottom: 8px;
  left: 8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(0, 0, 0, 0.6);
  color: #4ade80;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  z-index: 100;
`

const Panel = styled.div`
  position: absolute;
  bottom: 8px;
  left: 8px;
  width: 220px;
  max-height: 360px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 8px;
  z-index: 100;
  font-size: 11px;
  color: #e2e8f0;
`

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 12px;
  margin-bottom: 6px;
  color: #4ade80;
`

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 12px;
`

const Section = styled.div`
  margin-bottom: 8px;
`

const SectionTitle = styled.div`
  font-size: 10px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
`

const RuleGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
`

const RuleBtn = styled.button`
  padding: 2px 6px;
  font-size: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #e2e8f0;
  cursor: pointer;

  &:active {
    background: rgba(74, 222, 128, 0.3);
  }
`

const SliderRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
  }
`

const Slider = styled.input`
  width: 100%;
  height: 4px;
  accent-color: #4ade80;
`

const StateGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const StateRow = styled.div`
  display: flex;
  justify-content: space-between;
`

const StateKey = styled.span`
  color: #94a3b8;
`

const StateVal = styled.span`
  color: #fbbf24;
  font-family: monospace;
`
