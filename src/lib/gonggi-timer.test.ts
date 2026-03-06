import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TimerManager } from './gonggi-timer'

describe('TimerManager', () => {
  let mgr: TimerManager

  beforeEach(() => {
    vi.useFakeTimers()
    mgr = new TimerManager()
  })

  afterEach(() => {
    mgr.destroy()
    vi.useRealTimers()
  })

  // ── Timeout ──

  describe('addTimeout', () => {
    it('fires callback after duration', () => {
      const cb = vi.fn()
      mgr.addTimeout('t1', cb, 1000)
      expect(cb).not.toHaveBeenCalled()
      vi.advanceTimersByTime(1000)
      expect(cb).toHaveBeenCalledOnce()
    })

    it('replaces existing timer with same ID', () => {
      const cb1 = vi.fn()
      const cb2 = vi.fn()
      mgr.addTimeout('t1', cb1, 500)
      mgr.addTimeout('t1', cb2, 500)
      vi.advanceTimersByTime(500)
      expect(cb1).not.toHaveBeenCalled()
      expect(cb2).toHaveBeenCalledOnce()
    })

    it('can be cancelled', () => {
      const cb = vi.fn()
      mgr.addTimeout('t1', cb, 500)
      mgr.cancel('t1')
      vi.advanceTimersByTime(500)
      expect(cb).not.toHaveBeenCalled()
    })
  })

  // ── Interval ──

  describe('addInterval', () => {
    it('fires callback repeatedly', () => {
      const cb = vi.fn()
      mgr.addInterval('i1', cb, 100)
      vi.advanceTimersByTime(350)
      expect(cb).toHaveBeenCalledTimes(3)
    })

    it('can be cancelled', () => {
      const cb = vi.fn()
      mgr.addInterval('i1', cb, 100)
      vi.advanceTimersByTime(150)
      mgr.cancel('i1')
      vi.advanceTimersByTime(200)
      expect(cb).toHaveBeenCalledTimes(1)
    })
  })

  // ── cancelAll / cancelByPrefix ──

  describe('cancelAll', () => {
    it('cancels all timers', () => {
      const cb1 = vi.fn()
      const cb2 = vi.fn()
      mgr.addTimeout('t1', cb1, 500)
      mgr.addInterval('i1', cb2, 100)
      mgr.cancelAll()
      vi.advanceTimersByTime(1000)
      expect(cb1).not.toHaveBeenCalled()
      expect(cb2).not.toHaveBeenCalled()
    })
  })

  describe('cancelByPrefix', () => {
    it('cancels timers matching prefix', () => {
      const cb1 = vi.fn()
      const cb2 = vi.fn()
      const cb3 = vi.fn()
      mgr.addTimeout('chaos-1', cb1, 500)
      mgr.addTimeout('chaos-2', cb2, 500)
      mgr.addTimeout('toss-1', cb3, 500)
      mgr.cancelByPrefix('chaos-')
      vi.advanceTimersByTime(500)
      expect(cb1).not.toHaveBeenCalled()
      expect(cb2).not.toHaveBeenCalled()
      expect(cb3).toHaveBeenCalledOnce()
    })
  })

  // ── has ──

  describe('has', () => {
    it('returns true for existing timer', () => {
      mgr.addTimeout('t1', () => {}, 500)
      expect(mgr.has('t1')).toBe(true)
    })

    it('returns false after cancel', () => {
      mgr.addTimeout('t1', () => {}, 500)
      mgr.cancel('t1')
      expect(mgr.has('t1')).toBe(false)
    })

    it('returns false after timeout fires', () => {
      mgr.addTimeout('t1', () => {}, 500)
      vi.advanceTimersByTime(500)
      expect(mgr.has('t1')).toBe(false)
    })
  })

  // ── Pause / Resume (timeout) ──

  describe('pause/resume timeout', () => {
    it('pauses and resumes a timeout with remaining time', () => {
      const cb = vi.fn()
      mgr.addTimeout('t1', cb, 1000)

      vi.advanceTimersByTime(400)
      expect(cb).not.toHaveBeenCalled()

      mgr.pause()
      expect(mgr.isPaused()).toBe(true)

      // Time passes while paused — should not fire
      vi.advanceTimersByTime(2000)
      expect(cb).not.toHaveBeenCalled()

      mgr.resume()
      expect(mgr.isPaused()).toBe(false)

      // Should fire after remaining ~600ms
      vi.advanceTimersByTime(600)
      expect(cb).toHaveBeenCalledOnce()
    })
  })

  // ── Pause / Resume (interval) ──

  describe('pause/resume interval', () => {
    it('pauses and resumes an interval', () => {
      const cb = vi.fn()
      mgr.addInterval('i1', cb, 100)

      vi.advanceTimersByTime(250)
      expect(cb).toHaveBeenCalledTimes(2)

      mgr.pause()
      vi.advanceTimersByTime(500)
      expect(cb).toHaveBeenCalledTimes(2)

      mgr.resume()
      vi.advanceTimersByTime(250)
      expect(cb.mock.calls.length).toBeGreaterThanOrEqual(4)
    })
  })

  // ── destroy ──

  describe('destroy', () => {
    it('clears all timers', () => {
      const cb = vi.fn()
      mgr.addTimeout('t1', cb, 500)
      mgr.addInterval('i1', cb, 100)
      mgr.destroy()
      vi.advanceTimersByTime(1000)
      expect(cb).not.toHaveBeenCalled()
    })
  })
})
