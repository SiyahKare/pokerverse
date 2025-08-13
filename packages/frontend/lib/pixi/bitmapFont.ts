import { BitmapFont } from 'pixi.js'

let registered = false
export function ensureBitmapDigits(){
  if (registered) return
  // Placeholder: in a follow-up PR, load real bitmap font. Here, register a minimal system font fallback.
  try {
    BitmapFont.from('ChipsDigits', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 14,
      fill: 0xEAEAF0,
    }, { chars: BitmapFont.ASCII })
    registered = true
  } catch {}
}


