import type { ChaosRule } from '../gonggi-chaos'

export const splitRule: ChaosRule = {
  id: 'split',
  name: '무한 증식',
  trigger: 'after-toss',
  minRound: 4,
  probability: 0.25,
  canRepeat: false,
  execute: (state, rng) => {
    const tossedStone = state.stones.find(
      (s) => s.status === 'tossed' || s.status === 'air'
    )
    const correctIndex = Math.floor(rng() * 3)

    return {
      type: 'stone-split',
      ruleId: 'split',
      animation: 'split',
      message: correctIndex === 0 ? '정답!' : '땡!',
      data: {
        stoneId: tossedStone?.id ?? 0,
        splitCount: 3,
        correctIndex,
        timeline: [
          { at: 0, action: 'split-start' },
          { at: 300, action: 'split-complete' },
          { at: 500, action: 'fall-start' },
          { at: 1500, action: 'pick-prompt' },
        ],
      },
    }
  },
}
