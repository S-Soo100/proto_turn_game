import type { ChaosRule } from '../gonggi-chaos'

export const catSwipeRule: ChaosRule = {
  id: 'cat-swipe',
  name: '고양이 습격',
  trigger: 'before-success',
  minRound: 1,
  probability: 0.35,
  canRepeat: false,
  execute: (_state, _rng) => ({
    type: 'all-stones-lost',
    ruleId: 'cat-swipe',
    animation: 'cat-swipe',
    message: '야옹~',
    data: {
      timeline: [
        { at: 0, action: 'fake-success' },
        { at: 400, action: 'paw-descend' },
        { at: 800, action: 'paw-swipe' },
        { at: 1400, action: 'stones-lost' },
        { at: 1600, action: 'paw-exit' },
        { at: 2000, action: 'message' },
      ],
    },
  }),
}
