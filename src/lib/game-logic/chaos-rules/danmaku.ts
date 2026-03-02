import type { ChaosRule } from '../gonggi-chaos'

const GENERAL_COMMENTS = [
  'ㅋㅋㅋ 이것도 못 잡음?',
  '와 진짜 못하네',
  '내 할머니가 더 잘함',
  '포기하면 편해',
  '아직도 하고 있네 ㅋ',
  '이거 5살짜리도 함',
  '나였으면 벌써 끝냈는데',
  '핸드폰 괜찮아? 던지지 마',
]

const FAIL_COMMENTS = [
  'ㅋㅋㅋㅋㅋㅋㅋ',
  '아 ㅋㅋㅋ 진짜 못하네',
  '역시 ㅋㅋ',
  '예상했음',
  '다시 해봐 ㅋ 결과 똑같겠지만',
]

const SUCCESS_COMMENTS = [
  '운 좋았네 ㅋ',
  '겨우 그걸 ㅋ',
  '다음은 못 할 듯',
  '이번엔 봐줄게',
]

export const ALL_COMMENTS = {
  general: GENERAL_COMMENTS,
  fail: FAIL_COMMENTS,
  success: SUCCESS_COMMENTS,
}

export const danmakuRule: ChaosRule = {
  id: 'danmaku',
  name: '관객 야유',
  trigger: 'during-play',
  minRound: 3,
  probability: 0.40,
  canRepeat: true,
  execute: (_state, rng) => {
    // Select 5-8 comments for this round
    const commentCount = 5 + Math.floor(rng() * 4)
    const comments: { text: string; delayMs: number; yPercent: number }[] = []

    for (let i = 0; i < commentCount; i++) {
      const pool = GENERAL_COMMENTS
      const text = pool[Math.floor(rng() * pool.length)]
      comments.push({
        text,
        delayMs: 1000 + i * (2000 + Math.floor(rng() * 2000)),
        yPercent: 20 + Math.floor(rng() * 60),
      })
    }

    return {
      type: 'visual-only',
      ruleId: 'danmaku',
      animation: 'danmaku',
      message: '',
      data: { comments },
    }
  },
}
