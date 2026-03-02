import type { ChaosRule } from '../gonggi-chaos'

export const fakeClearRule: ChaosRule = {
  id: 'fake-clear',
  name: '가짜 클리어',
  trigger: 'stage-transition',
  minRound: 3,
  probability: 0.20,
  canRepeat: false,
  execute: (_state, _rng) => {
    return {
      type: 'stage-reset',
      ruleId: 'fake-clear',
      animation: 'fake-clear',
      message: '아 잠깐, 아직이요 ㅋ',
      data: {
        timeline: [
          { at: 0, action: 'celebration-start' },
          { at: 500, action: 'confetti' },
          { at: 2000, action: 'vhs-rewind' },
          { at: 2800, action: 'message' },
          { at: 3800, action: 'reset' },
        ],
      },
    }
  },
}
