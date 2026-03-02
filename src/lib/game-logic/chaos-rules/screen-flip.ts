import type { ChaosRule } from '../gonggi-chaos'

export const screenFlipRule: ChaosRule = {
  id: 'screen-flip',
  name: '화면 뒤집기',
  trigger: 'stage-transition',
  minRound: 4,
  probability: 0.15,
  canRepeat: false,
  execute: (_state, _rng) => {
    return {
      type: 'screen-flip',
      ruleId: 'screen-flip',
      animation: 'screen-flip',
      message: '다음 단계...',
      data: {
        rotation: 180,
        timeline: [
          { at: 0, action: 'message' },
          { at: 500, action: 'flip-start' },
          { at: 1500, action: 'flip-complete' },
        ],
      },
    }
  },
}
