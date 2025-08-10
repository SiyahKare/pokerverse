import WebApp from '@twa-dev/sdk'

export type TgAPI = ReturnType<typeof initTelegram>

export function initTelegram() {
  try {
    WebApp.ready()
    WebApp.expand()
    WebApp.setHeaderColor('secondary_bg_color')
    WebApp.disableVerticalSwipes()
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

  return {
    themeParams: WebApp.themeParams,
    viewportHeight: WebApp.viewportHeight,
    onViewport(cb: (h: number) => void) {
      const fn = () => cb(WebApp.viewportHeight)
      WebApp.onEvent('viewportChanged', fn)
      return () => WebApp.offEvent('viewportChanged', fn)
    },
    mainButton: WebApp.MainButton,
    backButton: WebApp.BackButton,
    haptics: WebApp.HapticFeedback,
    initData: WebApp.initData,
  }
}


