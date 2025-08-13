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

export async function ensureAtlasLoaded(opts?: { quality?: 'auto'|'low' }) {
  if (loaded) return
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
  const want2x = opts?.quality === 'auto' ? (dpr >= 1.5) : false
  // Placeholder paths; ensure public/atlases exists or adjust during asset integration
  const url = want2x ? '/assets/atlases/cards@2x.json' : '/assets/atlases/cards@1x.json'
  await loadAtlas(url)
}

export function getTexture(name: string): Texture | undefined {
  return cache.get(name)
}


