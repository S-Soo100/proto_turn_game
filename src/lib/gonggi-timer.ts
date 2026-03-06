/**
 * TimerManager — centralized timer management for GonggiBoard.
 * Manages timeouts, intervals, and RAF loops with pause/resume support.
 */

interface ManagedTimer {
  type: 'timeout' | 'interval' | 'raf'
  handle: number
  callback: () => void
  // For timeout pause/resume
  durationMs?: number
  startedAt?: number
  // For interval
  intervalMs?: number
  // For RAF
  rafCallback?: (elapsed: number) => boolean
  rafStartedAt?: number
  rafPausedElapsed?: number
}

export class TimerManager {
  private timers = new Map<string, ManagedTimer>()
  private _isPaused = false
  private _pausedAt = 0

  addTimeout(id: string, callback: () => void, durationMs: number): void {
    this.cancel(id)
    const handle = window.setTimeout(() => {
      this.timers.delete(id)
      callback()
    }, durationMs)
    this.timers.set(id, {
      type: 'timeout',
      handle,
      callback,
      durationMs,
      startedAt: performance.now(),
    })
  }

  addInterval(id: string, callback: () => void, intervalMs: number): void {
    this.cancel(id)
    const handle = window.setInterval(callback, intervalMs)
    this.timers.set(id, {
      type: 'interval',
      handle,
      callback,
      intervalMs,
    })
  }

  addRAF(id: string, callback: (elapsed: number) => boolean): void {
    this.cancel(id)
    const startedAt = performance.now()
    const tick = () => {
      const timer = this.timers.get(id)
      if (!timer) return
      const elapsed = performance.now() - startedAt
      const cont = callback(elapsed)
      if (cont) {
        timer.handle = requestAnimationFrame(tick)
      } else {
        this.timers.delete(id)
      }
    }
    const handle = requestAnimationFrame(tick)
    this.timers.set(id, {
      type: 'raf',
      handle,
      callback: () => {},
      rafCallback: callback,
      rafStartedAt: startedAt,
      rafPausedElapsed: 0,
    })
  }

  cancel(id: string): void {
    const timer = this.timers.get(id)
    if (!timer) return
    this._clearTimer(timer)
    this.timers.delete(id)
  }

  cancelAll(): void {
    for (const timer of this.timers.values()) {
      this._clearTimer(timer)
    }
    this.timers.clear()
  }

  cancelByPrefix(prefix: string): void {
    for (const [id, timer] of this.timers.entries()) {
      if (id.startsWith(prefix)) {
        this._clearTimer(timer)
        this.timers.delete(id)
      }
    }
  }

  pause(): void {
    if (this._isPaused) return
    this._isPaused = true
    this._pausedAt = performance.now()

    for (const timer of this.timers.values()) {
      this._clearTimer(timer)
      if (timer.type === 'timeout') {
        // Save remaining time
        const elapsed = this._pausedAt - (timer.startedAt ?? this._pausedAt)
        timer.durationMs = Math.max(0, (timer.durationMs ?? 0) - elapsed)
      } else if (timer.type === 'raf') {
        timer.rafPausedElapsed = this._pausedAt - (timer.rafStartedAt ?? this._pausedAt)
      }
    }
  }

  resume(): void {
    if (!this._isPaused) return
    this._isPaused = false

    for (const [id, timer] of this.timers.entries()) {
      if (timer.type === 'timeout') {
        const remaining = timer.durationMs ?? 0
        const cb = timer.callback
        timer.startedAt = performance.now()
        timer.handle = window.setTimeout(() => {
          this.timers.delete(id)
          cb()
        }, remaining)
      } else if (timer.type === 'interval') {
        timer.handle = window.setInterval(timer.callback, timer.intervalMs ?? 0)
      } else if (timer.type === 'raf') {
        const rafCb = timer.rafCallback
        if (!rafCb) continue
        const pausedElapsed = timer.rafPausedElapsed ?? 0
        const resumeStartedAt = performance.now() - pausedElapsed
        timer.rafStartedAt = resumeStartedAt
        timer.rafPausedElapsed = 0
        const tick = () => {
          const t = this.timers.get(id)
          if (!t) return
          const elapsed = performance.now() - resumeStartedAt
          const cont = rafCb(elapsed)
          if (cont) {
            t.handle = requestAnimationFrame(tick)
          } else {
            this.timers.delete(id)
          }
        }
        timer.handle = requestAnimationFrame(tick)
      }
    }
  }

  isPaused(): boolean {
    return this._isPaused
  }

  has(id: string): boolean {
    return this.timers.has(id)
  }

  destroy(): void {
    this.cancelAll()
  }

  private _clearTimer(timer: ManagedTimer): void {
    switch (timer.type) {
      case 'timeout':
        clearTimeout(timer.handle)
        break
      case 'interval':
        clearInterval(timer.handle)
        break
      case 'raf':
        cancelAnimationFrame(timer.handle)
        break
    }
  }
}
