"use client";
import * as Slider from '@radix-ui/react-slider'
import { useMemo, useState } from 'react'

export default function BetSlider({ min, max, step, value, onChange }:{ min: bigint; max: bigint; step: bigint; value: bigint; onChange: (v: bigint)=>void }){
  const [local, setLocal] = useState<number>(0)
  const scale = 1_000_000n
  const toNum = (b: bigint) => Number((b * 100n) / step) // normalized to steps
  const fromNum = (n: number) => (BigInt(Math.round(n)) * step) / 100n
  const minN = toNum(min), maxN = toNum(max)
  const valN = toNum(value)
  return (
    <div className="py-2">
      <Slider.Root className="relative flex items-center select-none touch-none h-5" min={minN} max={maxN} step={1} value={[valN]}
        onValueChange={(v)=>{ const bn = fromNum(v[0]); onChange(bn) }}>
        <Slider.Track className="bg-white/10 relative grow rounded h-1.5">
          <Slider.Range className="absolute h-full rounded bg-[var(--gold)]" />
        </Slider.Track>
        <Slider.Thumb className="block w-4 h-4 rounded-full bg-[var(--gold)]" aria-label="Bet" />
      </Slider.Root>
    </div>
  )
}


