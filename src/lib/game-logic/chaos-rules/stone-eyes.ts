import type { ChaosRule } from '../gonggi-chaos'

export const stoneEyesRule: ChaosRule = {
  id: 'stone-eyes',
  name: '돌멩이의 자아',
  trigger: 'before-pick',
  minRound: 3,
  probability: 0.30,
  canRepeat: true,
  execute: (state, _rng) => {
    const floorStoneIds = state.stones
      .filter((s) => s.status === 'floor')
      .map((s) => s.id)

    return {
      type: 'stones-flee',
      ruleId: 'stone-eyes',
      animation: 'stone-eyes',
      message: '!',
      data: {
        affectedStoneIds: floorStoneIds,
        timeline: [
          { at: 0, action: 'eyes-popup' },
          { at: 200, action: 'exclamation' },
          { at: 300, action: 'flee-start' },
        ],
      },
    }
  },
}
