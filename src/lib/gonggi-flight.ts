/**
 * Flight physics for GonggiBoard toss animation.
 * Pure functions — no side effects, no DOM access.
 */

export const FLIGHT_START_Y = 62  // bottom of board (%)
export const FLIGHT_PEAK_Y = 5    // top of screen (%)

export interface FlightFrame {
  y: number
  scale: number
  rotation: number
}

/**
 * Calculate flight frame at normalized time t (0→1).
 * t=0: bottom, t=0.5: peak, t=1: bottom
 */
export function getFlightFrame(t: number): FlightFrame {
  const clamped = Math.max(0, Math.min(1, t))
  const parabola = 4 * clamped * (1 - clamped)  // 0→1→0

  const y = FLIGHT_START_Y + (FLIGHT_PEAK_Y - FLIGHT_START_Y) * parabola
  const scale = 1.0 + (0.65 - 1.0) * parabola
  const rotation = clamped < 0.5
    ? -15 * Math.sin(clamped * Math.PI)
    : 10 * Math.sin((clamped - 0.5) * 2 * Math.PI)

  return { y, scale, rotation }
}

/**
 * Convert FlightFrame to inline CSS properties for DOM element.
 */
export function flightFrameToCSS(frame: FlightFrame): { top: string; transform: string } {
  return {
    top: `${frame.y}%`,
    transform: `translateX(-50%) scale(${frame.scale.toFixed(3)}) rotate(${frame.rotation.toFixed(1)}deg)`,
  }
}
