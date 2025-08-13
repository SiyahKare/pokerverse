import { createHmac } from 'crypto'

export function verifyInitData(initData: string, botToken: string): { ok: boolean; userId?: string; first_name?: string; auth_date?: number } {
  try {
    const urlParams = new URLSearchParams(initData)
    const hash = urlParams.get('hash') || ''
    urlParams.delete('hash')
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([k,v]) => `${k}=${v}`)
      .join('\n')
    const secret = createHmac('sha256', 'WebAppData').update(botToken).digest()
    const hmac = createHmac('sha256', secret).update(dataCheckString).digest('hex')
    if (hmac !== hash) return { ok: false }
    const user = urlParams.get('user')
    const auth_date = Number(urlParams.get('auth_date') || '0')
    if (!user || !auth_date) return { ok: false }
    const parsed = JSON.parse(user)
    return { ok: true, userId: String(parsed.id), first_name: parsed.first_name, auth_date }
  } catch {
    return { ok: false }
  }
}


