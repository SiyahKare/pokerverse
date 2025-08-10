import { useMemo } from 'react'
import type { TgAPI } from '../telegram/telegram'

export function useHaptics(tg: TgAPI | null) {
  const vib = (pattern: number | number[]) => { try { (navigator as any).vibrate?.(pattern as any) } catch {} }
  return useMemo(() => {
    const supported = !!tg?.supports.haptics
    return {
      impact: (k: 'light'|'medium'|'rigid' = 'light') => supported
        ? (tg as any).haptics.impactOccurred(k)
        : vib(k === 'rigid' ? [8, 10, 8] : 10),
      notify: (t: 'success'|'warning'|'error' = 'success') => supported
        ? (tg as any).haptics.notificationOccurred(t)
        : vib([5, 20, 5]),
      supported,
    }
  }, [tg])
}
