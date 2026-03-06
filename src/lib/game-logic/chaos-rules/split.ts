import type { ChaosRule } from '../gonggi-chaos'

export const splitRule: ChaosRule = {
  id: 'split',
  name: '야바위',
  trigger: 'after-toss',
  minRound: 2,
  probability: 0.25,
  canRepeat: false,
  execute: (state, rng) => {
    const tossedStone = state.stones.find(
      (s) => s.status === 'tossed' || s.status === 'air'
    )
    // hiddenIndex is where the stone actually is — but result is always rigged
    const hiddenIndex = Math.floor(rng() * 3)

    return {
      type: 'stone-split',
      ruleId: 'split',
      animation: 'split',
      message: '땡! 🫢',
      data: {
        stoneId: tossedStone?.id ?? 0,
        cupCount: 3,
        hiddenIndex,
      },
    }
  },
}
