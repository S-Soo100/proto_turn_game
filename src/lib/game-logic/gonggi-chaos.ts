import type { GonggiState } from './gonggi'

// ── Types ──

export type ChaosTrigger =
  | 'after-toss'
  | 'before-pick'
  | 'before-success'
  | 'stage-transition'
  | 'during-play'

export interface ChaosResult {
  type: string
  ruleId: string
  animation: string
  message: string
  data?: Record<string, unknown>
}

export interface ChaosRule {
  id: string
  name: string
  trigger: ChaosTrigger
  minRound: number
  probability: number // weight for selection among eligible rules
  canRepeat: boolean
  execute: (state: GonggiState, rng: () => number) => ChaosResult
}

// ── Probability ──

/**
 * Get chaos trigger chance based on current round.
 * R1: 15%, R2: 25%, R3: 40%, R4: 60%, R5+: 70-90%
 */
export function getChaosChance(round: number): number {
  if (round === 1) return 0.15
  if (round === 2) return 0.25
  if (round === 3) return 0.4
  if (round === 4) return 0.6
  // Round 5+: 0.7 + (round - 5) * 0.05, max 0.9
  return Math.min(0.9, 0.7 + (round - 5) * 0.05)
}

/**
 * Determine if chaos should trigger this action.
 * overrideChance: if provided, use this value instead of the round-based chance.
 */
export function shouldTriggerChaos(
  round: number,
  rng: () => number,
  overrideChance?: number | null,
): boolean {
  const chance = overrideChance != null ? overrideChance : getChaosChance(round)
  if (chance <= 0) return false
  return rng() < chance
}

/**
 * Select a rule from eligible candidates.
 * Filters by trigger, minRound, and already-triggered (for non-repeatable).
 * Uses weighted random selection based on probability.
 */
export function selectRule(
  rules: ChaosRule[],
  trigger: ChaosTrigger,
  round: number,
  triggeredIds: string[],
  rng: () => number,
): ChaosRule | null {
  const eligible = rules.filter((r) => {
    if (r.trigger !== trigger) return false
    if (round < r.minRound) return false
    if (!r.canRepeat && triggeredIds.includes(r.id)) return false
    return true
  })

  if (eligible.length === 0) return null

  // Weighted random selection
  const totalWeight = eligible.reduce((sum, r) => sum + r.probability, 0)
  let roll = rng() * totalWeight
  for (const rule of eligible) {
    roll -= rule.probability
    if (roll <= 0) return rule
  }

  return eligible[eligible.length - 1]
}

/**
 * Apply chaos result to game state.
 * Returns new state with chaos tracking updated.
 */
export function applyChaosToState(
  state: GonggiState,
  _result: ChaosResult,
  ruleId: string,
): GonggiState {
  return {
    ...state,
    chaosSurvived: state.chaosSurvived + 1,
    triggeredChaosIds: [...state.triggeredChaosIds, ruleId],
  }
}

/**
 * Full chaos check: determine if chaos triggers, select a rule, execute it.
 * Returns null if no chaos triggers.
 * forceRuleId: if provided, skip probability and force this specific rule.
 * overrideChance: if provided, override the round-based chance value.
 */
export function checkChaos(
  state: GonggiState,
  trigger: ChaosTrigger,
  rules: ChaosRule[],
  rng: () => number,
  forceRuleId?: string | null,
  overrideChance?: number | null,
): { result: ChaosResult; rule: ChaosRule } | null {
  // Force mode: skip probability, find and execute the specified rule directly
  if (forceRuleId) {
    const rule = rules.find(r => r.id === forceRuleId)
    if (!rule) return null
    const result = rule.execute(state, rng)
    return { result, rule }
  }

  if (!shouldTriggerChaos(state.round, rng, overrideChance)) return null

  const rule = selectRule(rules, trigger, state.round, state.triggeredChaosIds, rng)
  if (!rule) return null

  const result = rule.execute(state, rng)
  return { result, rule }
}
