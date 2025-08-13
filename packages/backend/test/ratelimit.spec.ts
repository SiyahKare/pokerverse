import { describe, it, expect } from 'vitest'
import { makeBucket, consume, getBucket } from '../src/ratelimit'

describe('ratelimit', () => {
  it('bucket capacity and refill', async () => {
    makeBucket('k', { capacity: 2, refillRatePerSec: 1 })
    expect(consume('k')).toBe(true)
    expect(consume('k')).toBe(true)
    expect(consume('k')).toBe(false)
    await new Promise(r=>setTimeout(r, 1100))
    expect(consume('k')).toBe(true)
    const b = getBucket('k')!
    expect(b.tokens).toBeLessThanOrEqual(2)
  })
})


