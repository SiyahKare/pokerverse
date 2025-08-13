import { describe, it, expect } from 'vitest'
import { sign, verify } from '../src/auth/jwt'

describe('jwt', () => {
  it('valid token verifies', () => {
    const t = sign('u1', { expiresInSec: 60 })
    const c = verify(t)
    expect(c.sub).toBe('u1')
    expect(c.aud).toBe('miniapp')
  })
  it('expired token fails', () => {
    const t = sign('u1', { expiresInSec: 1 })
    // simulate expiry by verifying with exp in past
    const sleep = (ms:number)=>new Promise(r=>setTimeout(r,ms))
    return sleep(1100).then(()=>{
      expect(()=>verify(t)).toThrow()
    })
  })
})


