"use client";
import { Stage, Container, Sprite } from '@pixi/react'
import SeatsLayer from './layers/SeatsLayer'
import BoardLayer from './layers/BoardLayer'
import PotLayer from './layers/PotLayer'
import EffectsLayer from './layers/EffectsLayer'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ensureAtlasLoaded, getTexture } from '@/lib/pixi/atlas'
import { useTableStore } from '@/lib/store/useTableStore'

export default function TableCanvas({ tableId }: { tableId: number }) {
  const [ready, setReady] = useState(false)
  const DPR = useMemo(()=> (typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1), [])
  useEffect(()=>{ ensureAtlasLoaded({ quality: 'auto' }).then(()=> setReady(true)) }, [])

  const pot = useTableStore(s=>s.pot)
  const boxRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 800, h: 450 })
  useEffect(()=>{
    if (!boxRef.current) return
    const ro = new ResizeObserver(entries => {
      const r = entries[0].contentRect
      const ratio = 16/9
      let w = r.width
      let h = w/ratio
      if (h > r.height) { h = r.height; w = h*ratio }
      setSize({ w: Math.round(w), h: Math.round(h) })
    })
    ro.observe(boxRef.current)
    return ()=> ro.disconnect()
  }, [])
  return (
    <div ref={boxRef} className="relative w-full aspect-[16/9] card-premium">
      <Stage width={size.w} height={size.h} options={{
        backgroundAlpha: 1,
        antialias: false,
        powerPreference: 'high-performance' as any,
        preserveDrawingBuffer: false,
        autoDensity: true,
        resolution: DPR,
      }}>
        <Container x={0} y={0}>
          {/* table felt background via atlas sprite (no filters) */}
          {ready && getTexture('table-felt') && (
            <Sprite texture={getTexture('table-felt')!} x={0} y={0} width={size.w} height={size.h} />
          )}
          {ready && (
            <>
              <SeatsLayer />
              <BoardLayer />
              <PotLayer />
              <EffectsLayer />
            </>
          )}
        </Container>
      </Stage>
      {/* DOM overlay for dynamic pot text to avoid Pixi Text cost */}
      <div className="pointer-events-none absolute left-1/2 top-[12%] -translate-x-1/2 text-xs md:text-sm font-medium text-[var(--text)]">
        Pot: { (pot ?? 0n).toString() }
      </div>
    </div>
  )
}


