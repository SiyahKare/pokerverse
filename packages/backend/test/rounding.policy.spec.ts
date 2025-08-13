import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { distributeWinnings, type Pot } from '../src/engine/pots'

describe('rounding policy (USDC 6d) + rake', () => {
  it('3-way split: floor + lowestSeat for odd chips', () => {
    const pots: Pot[] = [{ amount: 100n, eligibleSeats: [1,2,3] }]
    const res = distributeWinnings(pots, [[1,2,3]], 0)
    // 100 // 3 = 33, remainder 1 → lowestSeat policy: seat 1 gets +1
    expect(res.perSeat[1]).toBe(34n)
    expect(res.perSeat[2]).toBe(33n)
    expect(res.perSeat[3]).toBe(33n)
    expect(res.totalRake).toBe(0n)
  })

  it('rake cap is applied', () => {
    const pots: Pot[] = [{ amount: 10_000n, eligibleSeats: [0,1] }]
    const res = distributeWinnings(pots, [[0,1]], 5000, 100n) // 50% rake but cap 100
    expect(res.totalRake).toBe(100n)
    const totalPaid = (res.perSeat[0]??0n) + (res.perSeat[1]??0n) + res.totalRake
    expect(totalPaid).toBe(10_000n)
  })

  it('conservation over random scenarios', () => {
    return fc.assert(fc.property(
      fc.array(fc.record({ amount: fc.bigInt({ min: 1n, max: 1_000_000n }), eligibleSeats: fc.array(fc.integer({min:0, max:8}), {minLength:2, maxLength:9}).map(a=>Array.from(new Set(a)).sort((x,y)=>x-y)) }), {minLength:1, maxLength:4}),
      fc.integer({ min: 0, max: 1000 }),
      (potsRaw, rakeBps) => {
        const pots = potsRaw.filter(p=>p.eligibleSeats.length>=2)
        const tot = pots.reduce((a,p)=>a+p.amount, 0n)
        const winners = [[0,1,2,3,4,5,6,7,8]]
        const res = distributeWinnings(pots, winners, rakeBps)
        const sumSeats = Object.values(res.perSeat).reduce((a,b)=>a+b, 0n)
        expect(sumSeats + res.totalRake).toBe(tot)
      }
    ))
  })
})


