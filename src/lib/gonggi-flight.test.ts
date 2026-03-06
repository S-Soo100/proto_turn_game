import { describe, it, expect } from 'vitest'
import {
  getFlightFrame,
  flightFrameToCSS,
  FLIGHT_START_Y,
  FLIGHT_PEAK_Y,
} from './gonggi-flight'

describe('getFlightFrame', () => {
  it('t=0: at bottom, scale=1, rotation=0', () => {
    const frame = getFlightFrame(0)
    expect(frame.y).toBeCloseTo(FLIGHT_START_Y)
    expect(frame.scale).toBeCloseTo(1.0)
    expect(frame.rotation).toBeCloseTo(0)
  })

  it('t=0.5: at peak, scale=0.65', () => {
    const frame = getFlightFrame(0.5)
    expect(frame.y).toBeCloseTo(FLIGHT_PEAK_Y)
    expect(frame.scale).toBeCloseTo(0.65)
  })

  it('t=1: back at bottom, scale=1, rotation=0', () => {
    const frame = getFlightFrame(1)
    expect(frame.y).toBeCloseTo(FLIGHT_START_Y)
    expect(frame.scale).toBeCloseTo(1.0)
    expect(frame.rotation).toBeCloseTo(0, 0)
  })

  it('parabola is symmetric: t=0.25 and t=0.75 have same y', () => {
    const f25 = getFlightFrame(0.25)
    const f75 = getFlightFrame(0.75)
    expect(f25.y).toBeCloseTo(f75.y)
    expect(f25.scale).toBeCloseTo(f75.scale)
  })

  it('y is monotonically decreasing from t=0 to t=0.5', () => {
    const y0 = getFlightFrame(0).y
    const y25 = getFlightFrame(0.25).y
    const y50 = getFlightFrame(0.5).y
    expect(y25).toBeLessThan(y0)
    expect(y50).toBeLessThan(y25)
  })

  it('clamps out-of-range t values', () => {
    const fNeg = getFlightFrame(-0.5)
    expect(fNeg.y).toBeCloseTo(FLIGHT_START_Y)
    const fOver = getFlightFrame(1.5)
    expect(fOver.y).toBeCloseTo(FLIGHT_START_Y)
  })
})

describe('flightFrameToCSS', () => {
  it('returns correct top and transform strings', () => {
    const frame = getFlightFrame(0.5)
    const css = flightFrameToCSS(frame)
    expect(css.top).toBe(`${frame.y}%`)
    expect(css.transform).toContain('translateX(-50%)')
    expect(css.transform).toContain('scale(')
    expect(css.transform).toContain('rotate(')
  })

  it('t=0 produces scale(1.000)', () => {
    const css = flightFrameToCSS(getFlightFrame(0))
    expect(css.transform).toContain('scale(1.000)')
  })
})
