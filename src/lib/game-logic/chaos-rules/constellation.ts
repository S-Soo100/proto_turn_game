import type { ChaosRule } from '../gonggi-chaos'

// ── Constellation Pool (6 types) ──

export interface ConstellationInfo {
  name: string
  desc: string
}

export const CONSTELLATIONS: ConstellationInfo[] = [
  { name: '외로운 공기자리', desc: '혼자 빛나는 공기돌의 별자리' },
  { name: '열받는곰자리', desc: '화난 곰이 공기돌을 노려보고 있다' },
  { name: '손가락자리', desc: '하늘에 떠오른 거대한 손가락' },
  { name: '떡밥자리', desc: '무언가를 암시하지만 아무 의미 없다' },
  { name: '꽝별자리', desc: '아무것도 내려오지 않을 것 같은 별' },
  { name: '고양이발자리', desc: '어디선가 본 듯한 익숙한 발자국...' },
]

// Star coordinates per constellation (SVG viewBox 0~100)
export const CONSTELLATION_STARS: { x: number; y: number }[][] = [
  // 0: 외로운 공기자리 — single star with scattered companions
  [{ x: 50, y: 30 }, { x: 35, y: 55 }, { x: 65, y: 55 }, { x: 50, y: 75 }, { x: 42, y: 42 }],
  // 1: 열받는곰자리 — bear face
  [{ x: 35, y: 25 }, { x: 65, y: 25 }, { x: 30, y: 50 }, { x: 70, y: 50 }, { x: 50, y: 70 }],
  // 2: 손가락자리 — pointing finger
  [{ x: 50, y: 20 }, { x: 50, y: 40 }, { x: 50, y: 55 }, { x: 40, y: 70 }, { x: 60, y: 70 }],
  // 3: 떡밥자리 — question mark
  [{ x: 45, y: 25 }, { x: 55, y: 25 }, { x: 55, y: 45 }, { x: 50, y: 60 }, { x: 50, y: 75 }],
  // 4: 꽝별자리 — X shape
  [{ x: 30, y: 25 }, { x: 70, y: 25 }, { x: 50, y: 50 }, { x: 30, y: 75 }, { x: 70, y: 75 }],
  // 5: 고양이발자리 — paw print
  [{ x: 50, y: 30 }, { x: 35, y: 50 }, { x: 65, y: 50 }, { x: 40, y: 70 }, { x: 60, y: 70 }],
]

// Line connections per constellation (pairs of star indices)
export const CONSTELLATION_LINES: [number, number][][] = [
  // 0: 외로운 공기자리
  [[0, 4], [4, 1], [1, 2], [2, 3], [3, 4]],
  // 1: 열받는곰자리
  [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4]],
  // 2: 손가락자리
  [[0, 1], [1, 2], [2, 3], [2, 4]],
  // 3: 떡밥자리
  [[0, 1], [1, 2], [2, 3]],
  // 4: 꽝별자리
  [[0, 2], [1, 2], [2, 3], [2, 4]],
  // 5: 고양이발자리
  [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4]],
]

export const constellationRule: ChaosRule = {
  id: 'constellation',
  name: '별자리 승천',
  trigger: 'after-toss',
  minRound: 1,
  probability: 0.20,
  canRepeat: false,
  execute: (state, rng) => {
    const tossedStone = state.stones.find(
      (s) => s.status === 'tossed' || s.status === 'air'
    )

    const constellationIndex = Math.floor(rng() * CONSTELLATIONS.length)
    const constellation = CONSTELLATIONS[constellationIndex]

    return {
      type: 'constellation',
      ruleId: 'constellation',
      animation: 'constellation',
      message: '별이 되었다...',
      data: {
        stoneId: tossedStone?.id ?? 0,
        constellationName: constellation.name,
        constellationDesc: constellation.desc,
        constellationIndex,
        timeline: [
          { at: 0, action: 'ascend-start' },
          { at: 500, action: 'break-through' },
          { at: 1000, action: 'night-sky' },
          { at: 1500, action: 'star-appear' },
          { at: 2000, action: 'others-ascend' },
          { at: 3000, action: 'lines-draw' },
          { at: 3500, action: 'name-show' },
          { at: 4000, action: 'wish-prompt' },
        ],
      },
    }
  },
}
