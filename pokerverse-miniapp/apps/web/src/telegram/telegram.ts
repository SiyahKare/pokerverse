import WebApp from '@twa-dev/sdk'

export type TgAPI = ReturnType<typeof initTelegram>

function semverGte(a: string, b: string) {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0, y = pb[i] || 0
    if (x > y) return true
    if (x < y) return false
  }
  return true
}

export function initTelegram() {
  try {
    WebApp.ready()
    try { WebApp.expand() } catch {}
    try { WebApp.setHeaderColor('secondary_bg_color') } catch {}
    try { WebApp.disableVerticalSwipes() } catch {}
  } catch {}

  const applyTheme = () => {
    const tp: any = WebApp.themeParams || {}
    const root = document.documentElement.style
    root.setProperty('--tg-bg', tp.bg_color ?? '#0b0b0b')
    root.setProperty('--tg-text', tp.text_color ?? '#ffffff')
    root.setProperty('--tg-hint', tp.hint_color ?? '#9aa4b2')
    root.setProperty('--tg-link', tp.link_color ?? '#2ea6ff')
    root.setProperty('--tg-btn', tp.button_color ?? '#2ea6ff')
    root.setProperty('--tg-btn-text', tp.button_text_color ?? '#ffffff')
    root.setProperty('--tg-sec-bg', tp.secondary_bg_color ?? '#111418')
  }

  applyTheme()
  WebApp.onEvent('themeChanged', applyTheme)

  const version = WebApp.version || '0.0'
  const isAtLeast = (v: string) => (WebApp as any).isVersionAtLeast ? (WebApp as any).isVersionAtLeast(v) : semverGte(version, v)
  const supportsHaptics = !!(WebApp as any).HapticFeedback && isAtLeast('6.1')

  return {
    version,
    isAtLeast,
    supports: { haptics: supportsHaptics },
    themeParams: WebApp.themeParams,
    viewportHeight: WebApp.viewportHeight,
    onViewport(cb: (h: number) => void) {
      const fn = () => cb(WebApp.viewportHeight)
      WebApp.onEvent('viewportChanged', fn)
      return () => WebApp.offEvent('viewportChanged', fn)
    },
    mainButton: WebApp.MainButton,
    backButton: WebApp.BackButton,
    haptics: (WebApp as any).HapticFeedback,
    initData: WebApp.initData,
  }
}


