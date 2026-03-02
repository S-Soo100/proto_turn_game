import type { ChaosRule } from '../gonggi-chaos'

export const birdTransformRule: ChaosRule = {
  id: 'bird-transform',
  name: '새가 된 공기',
  trigger: 'after-toss',
  minRound: 3,
  probability: 0.25,
  canRepeat: false,
  execute: (state, _rng) => {
    const tossedStone = state.stones.find(
      (s) => s.status === 'tossed' || s.status === 'air'
    )
    return {
      type: 'stone-lost',
      ruleId: 'bird-transform',
      animation: 'bird-transform',
      message: '...?',
      data: {
        stoneId: tossedStone?.id ?? 0,
        timeline: [
          { at: 0, action: 'morph-start' },
          { at: 300, action: 'bird-appear' },
          { at: 800, action: 'fly-away' },
          { at: 1300, action: 'feather-fall' },
          { at: 1800, action: 'message' },
        ],
      },
    }
  },
}
