type Bucket = { capacity: number; tokens: number; refillRatePerSec: number; last: number }
const mem: Record<string, Bucket> = Object.create(null)

export function makeBucket(key: string, cfg: { capacity: number; refillRatePerSec: number }) {
  mem[key] = { capacity: cfg.capacity, tokens: cfg.capacity, refillRatePerSec: cfg.refillRatePerSec, last: Date.now() }
}

export function consume(key: string, n = 1): boolean {
  const b = mem[key]
  if (!b) return false
  const now = Date.now()
  const delta = Math.max(0, now - b.last) / 1000
  b.tokens = Math.min(b.capacity, b.tokens + delta * b.refillRatePerSec)
  b.last = now
  if (b.tokens >= n) { b.tokens -= n; return true }
  return false
}

export function getBucket(key: string): Bucket | undefined { return mem[key] }


