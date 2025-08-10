import { Assets, Texture } from 'pixi.js'
import { manifest, CORE_BUNDLE } from './manifest'

export type CardId = `${'A'|'K'|'Q'|'J'|'T'|'9'|'8'|'7'|'6'|'5'|'4'|'3'|'2'}${'h'|'d'|'c'|'s'}`
export type ChipDenom = 1|5|25|100|500|1000

let assetsInitialized = false

export async function loadCoreAssets(targetRes: 1 | 2 = 2) {
  if (!assetsInitialized) {
    try { await Assets.init({ manifest }) } catch {}
    assetsInitialized = true
  }
  try {
    await Assets.loadBundle(CORE_BUNDLE)
  } catch (err) {
    // atlas bulunamazsa sessizce devam et (dev ortamında uyarı spam'ini engelle)
    // console.warn('Assets.loadBundle failed', err)
  }

  const cardsKey = targetRes === 2 ? 'cards@2x' : 'cards@1x'
  const chipsKey = targetRes === 2 ? 'chips@2x' : 'chips@1x'

  const cardsSheet: any = Assets.get(cardsKey)
  const chipsSheet: any = Assets.get(chipsKey)
  let tableTex: Texture | undefined
  try { tableTex = await Assets.load<Texture>('table') } catch { tableTex = undefined as any }

  return {
    table: tableTex as any,
    cardTexture: (id: CardId) => cardsSheet && cardsSheet.textures ? cardsSheet.textures[`card_${id}`] : undefined,
    cardBack: () => (cardsSheet && cardsSheet.textures ? cardsSheet.textures['card_back'] : undefined),
    chipTexture: (v: ChipDenom) => chipsSheet && chipsSheet.textures ? chipsSheet.textures[`chip_${v}`] : undefined,
  }
}


