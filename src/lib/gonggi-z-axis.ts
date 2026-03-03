import type { CSSProperties } from 'react'

/**
 * Convert stone z value (0~1) to CSS transform styles.
 *
 * z=0.0  → floor (100%, 0px offset)
 * z=0.15 → selected highlight (95%, -12px)
 * z=0.3  → held in hand (90%, -24px)
 * z=1.0  → toss peak (65%, -80px)
 */
export function getStoneStyle(z: number): CSSProperties {
  const scale = 1 - z * 0.35           // 1.0 → 0.65
  const yOffset = -z * 80              // 0 → -80px
  const shadow = z > 0.05 ? `0 ${Math.round(z * 12)}px ${Math.round(z * 16)}px rgba(0,0,0,${(0.15 + z * 0.2).toFixed(2)})` : 'none'

  return {
    transform: `translateY(${yOffset}px) scale(${scale.toFixed(3)})`,
    filter: z > 0.1 ? `brightness(${(1 + z * 0.2).toFixed(2)})` : 'none',
    boxShadow: shadow,
  }
}
