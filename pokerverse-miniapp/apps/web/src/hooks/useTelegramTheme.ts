import { useEffect, useState } from 'react'
import { initTelegram, type TgAPI } from '../telegram/telegram'

export function useTelegramTheme() {
  const [tg, setTg] = useState<TgAPI | null>(null)
  const [vh, setVh] = useState<number>(typeof window !== 'undefined' ? window.innerHeight : 0)

  useEffect(() => {
    const api = initTelegram()
    setTg(api)
    const off = api.onViewport((h) => setVh(h))
    return () => { off?.() }
  }, [])

  return { tg, viewportHeight: vh }
}


