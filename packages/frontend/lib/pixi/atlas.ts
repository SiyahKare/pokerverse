import { Assets, Texture } from 'pixi.js'

let loaded = false
const cache = new Map<string, Texture>()

export async function loadAtlas(jsonUrl: string) {
  if (loaded) return
  try {
    const bundle = { name: 'atlas', assets: { atlas: { src: jsonUrl } } }
    // @ts-ignore
    await Assets.init({ manifest: { bundles: [bundle] } })
    const res = await Assets.load('atlas') as any
    if (res && res.textures) {
      Object.entries(res.textures).forEach(([k, tex]: any)=> cache.set(String(k), tex as Texture))
    }
    loaded = true
  } catch (e) {
    console.warn('atlas load failed', e)
  }
}

export function getTexture(name: string): Texture | undefined {
  return cache.get(name)
}


