import { Assets, Texture } from 'pixi.js'
import { manifest, CORE_BUNDLE } from './manifest'

export type CardId = `${'A'|'K'|'Q'|'J'|'T'|'9'|'8'|'7'|'6'|'5'|'4'|'3'|'2'}${'h'|'d'|'c'|'s'}`
export type ChipDenom = 1|5|25|100|500|1000

export async function loadCoreAssets(targetRes: 1 | 2 = 2) {
  await Assets.init({ manifest })
  await Assets.loadBundle(CORE_BUNDLE)

  const cardsKey = targetRes === 2 ? 'cards@2x' : 'cards@1x'
  const chipsKey = targetRes === 2 ? 'chips@2x' : 'chips@1x'

  const cardsSheet: any = Assets.get(cardsKey)
  const chipsSheet: any = Assets.get(chipsKey)
  const tableTex = await Assets.load<Texture>('table')

  return {
    table: tableTex,
    cardTexture: (id: CardId) => cardsSheet?.textures?.[`card_${id}`],
    cardBack: () => cardsSheet?.textures?.['card_back'],
    chipTexture: (v: ChipDenom) => chipsSheet?.textures?.[`chip_${v}`],
  }
}


