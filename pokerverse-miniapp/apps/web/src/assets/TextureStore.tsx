import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { loadCoreAssets } from './atlas-loader'
import type { Texture } from 'pixi.js'

type AtlasAPI = {
  ready: boolean
  table?: Texture
  cardTexture?: (id: any) => Texture | undefined
  cardBack?: () => Texture | undefined
  chipTexture?: (v: any) => Texture | undefined
}

const TextureCtx = createContext<AtlasAPI>({ ready: false })

export function TextureProvider({ children }: { children: React.ReactNode }) {
  const [api, setApi] = useState<AtlasAPI>({ ready: false })

  useEffect(() => {
    const res = window.devicePixelRatio >= 1.5 ? 2 : 1
    loadCoreAssets(res as 1|2).then((loaded) => {
      const ready = Boolean(
        loaded.table &&
        typeof loaded.cardTexture === 'function' && loaded.cardTexture('Ah' as any) &&
        typeof loaded.cardBack === 'function' && loaded.cardBack() &&
        typeof loaded.chipTexture === 'function' && loaded.chipTexture(100 as any)
      )
      setApi({ ready, ...loaded })
    })
  }, [])

  const value = useMemo(() => api, [api])
  return <TextureCtx.Provider value={value}>{children}</TextureCtx.Provider>
}

export function useTextures() { return useContext(TextureCtx) }


