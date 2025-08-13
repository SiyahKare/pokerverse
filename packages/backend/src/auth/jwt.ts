import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'

export type JwtClaims = {
  sub: string // userId
  aud: 'miniapp'
  exp: number
  iat: number
  jti: string
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

export function sign(userId: string, opts?: { expiresInSec?: number; jti?: string }): string {
  const expSec = opts?.expiresInSec ?? 15 * 60
  const jti = opts?.jti ?? randomUUID()
  const token = jwt.sign({ sub: userId, aud: 'miniapp', jti }, JWT_SECRET, { expiresIn: expSec })
  return token
}

export function verify(token: string): JwtClaims {
  const decoded = jwt.verify(token, JWT_SECRET, { audience: 'miniapp' }) as any
  // basic shape
  if (!decoded?.sub || !decoded?.jti) throw new Error('bad token')
  return decoded as JwtClaims
}


