import type { ChaosRule } from '../gonggi-chaos'

export type CatDirection = 'left' | 'right' | 'top'

export const catSwipeRule: ChaosRule = {
  id: 'cat-swipe',
  name: '고양이 습격',
  trigger: 'before-success',
  minRound: 3,
  probability: 0.35,
  canRepeat: false,
  execute: (_state, rng) => {
    const directions: CatDirection[] = ['left', 'right', 'top']
    const direction = directions[Math.floor(rng() * directions.length)]

    return {
      type: 'all-stones-scattered',
      ruleId: 'cat-swipe',
      animation: 'cat-swipe',
      message: '야옹~',
      data: {
        direction,
        timeline: [
          { at: 0, action: 'fake-success' },
          { at: 200, action: 'paw-slide-in' },
          { at: 400, action: 'hit-stones' },
          { at: 700, action: 'stones-scatter' },
          { at: 1000, action: 'paw-slide-out' },
          { at: 1300, action: 'message' },
        ],
      },
    }
  },
}
