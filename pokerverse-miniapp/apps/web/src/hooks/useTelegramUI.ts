import { useEffect } from 'react'
import type { TgAPI } from '../telegram/telegram'

export function useTelegramUI(tg: TgAPI | null, cfg: {
  mainButton?: { text: string; visible?: boolean; onClick?: () => void }
  backButton?: { visible?: boolean; onClick?: () => void }
} = {}) {
  useEffect(() => {
    if (!tg) return
    const mb = tg.mainButton
    const bb = tg.backButton

    // MainButton
    if (cfg.mainButton) {
      mb.setText(cfg.mainButton.text)
      cfg.mainButton.visible === false ? mb.hide() : mb.show()
      const onClick = () => cfg.mainButton?.onClick?.()
      mb.onClick(onClick)
      return () => mb.offClick(onClick)
    } else {
      mb.hide()
    }

    // BackButton
    if (cfg.backButton) {
      cfg.backButton.visible === false ? bb.hide() : bb.show()
      const onBack = () => cfg.backButton?.onClick?.()
      bb.onClick(onBack)
      return () => bb.offClick(onBack)
    } else {
      bb.hide()
    }
  }, [tg, cfg?.mainButton?.text, cfg?.mainButton?.visible, cfg?.backButton?.visible])
}


