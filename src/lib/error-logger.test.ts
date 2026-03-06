import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logError, logSupabaseError, fingerprint, _resetRateLimit } from './error-logger'

// Mock supabase
const mockInsert = vi.fn().mockReturnValue({ then: (resolve: () => void) => { resolve() } })
vi.mock('./supabase', () => ({
  supabase: {
    from: () => ({ insert: mockInsert }),
  },
}))

describe('error-logger', () => {
  beforeEach(() => {
    _resetRateLimit()
    mockInsert.mockClear()
    // Enable error logging in test (simulating production)
    vi.stubEnv('VITE_ENABLE_ERROR_LOGGING', 'true')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('fingerprint', () => {
    it('returns consistent hash for same input', () => {
      const fp1 = fingerprint('error msg', 'source')
      const fp2 = fingerprint('error msg', 'source')
      expect(fp1).toBe(fp2)
    })

    it('returns different hash for different input', () => {
      const fp1 = fingerprint('error A', 'source')
      const fp2 = fingerprint('error B', 'source')
      expect(fp1).not.toBe(fp2)
    })

    it('returns a string', () => {
      expect(typeof fingerprint('msg', 'src')).toBe('string')
    })
  })

  describe('logError', () => {
    it('never throws even with bad input', () => {
      expect(() => logError({ message: '', source: '' })).not.toThrow()
      expect(() => logError({ message: 'test', source: 'test', extra: { nested: { deep: true } } })).not.toThrow()
    })

    it('calls supabase insert in production-like mode', () => {
      logError({ message: 'test error', source: 'test' })
      expect(mockInsert).toHaveBeenCalledTimes(1)
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'test error',
          source: 'test',
          severity: 'error',
        }),
      )
    })

    it('uses provided severity', () => {
      logError({ message: 'fatal crash', source: 'test', severity: 'fatal' })
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'fatal' }),
      )
    })

    it('rate-limits same error within 10s', () => {
      logError({ message: 'same error', source: 'src' })
      logError({ message: 'same error', source: 'src' })
      logError({ message: 'same error', source: 'src' })
      expect(mockInsert).toHaveBeenCalledTimes(1)
    })

    it('allows different errors', () => {
      logError({ message: 'error A', source: 'src' })
      logError({ message: 'error B', source: 'src' })
      expect(mockInsert).toHaveBeenCalledTimes(2)
    })

    it('truncates long messages', () => {
      const longMsg = 'x'.repeat(3000)
      logError({ message: longMsg, source: 'test' })
      const insertedRow = mockInsert.mock.calls[0][0]
      expect(insertedRow.message.length).toBe(2000)
    })

    it('truncates long stack traces', () => {
      const longStack = 's'.repeat(6000)
      logError({ message: 'err', source: 'test', stack: longStack })
      const insertedRow = mockInsert.mock.calls[0][0]
      expect(insertedRow.stack.length).toBe(5000)
    })

    it('includes fingerprint in the row', () => {
      logError({ message: 'fp test', source: 'fp-src' })
      const insertedRow = mockInsert.mock.calls[0][0]
      expect(insertedRow.fingerprint).toBe(fingerprint('fp test', 'fp-src'))
    })

    it('skips logging when DEV and VITE_ENABLE_ERROR_LOGGING is not set', () => {
      vi.stubEnv('VITE_ENABLE_ERROR_LOGGING', '')
      logError({ message: 'should skip', source: 'test' })
      expect(mockInsert).not.toHaveBeenCalled()
    })
  })

  describe('logSupabaseError', () => {
    it('extracts message from supabase error object', () => {
      logSupabaseError(
        { message: 'Row not found', code: 'PGRST116', details: 'some detail' },
        'test/source',
      )
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Row not found',
          stack: 'some detail',
          source: 'test/source',
        }),
      )
    })

    it('passes extra data through', () => {
      logSupabaseError(
        { message: 'err' },
        'src',
        { gameId: '123' },
      )
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          extra: expect.objectContaining({ gameId: '123' }),
        }),
      )
    })
  })
})
