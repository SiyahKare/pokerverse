"use client";
import * as Slider from '@radix-ui/react-slider'
import { useCallback, useMemo } from 'react'
import { clampBigInt, stepAlignBigInt, parseBigInt, formatChips } from '@/lib/utils/format'

export default function BetSlider({ min, max, step, value, onChange }:{ min: bigint; max: bigint; step: bigint; value: bigint; onChange: (v: bigint)=>void }){
  const norm = useCallback((b: bigint) => Number((b - min) / step), [min, step])
  const denorm = useCallback((n: number) => clampBigInt(min + (BigInt(Math.round(n)) * step), min, max), [min, max, step])
  const minN = 0
  const maxN = useMemo(()=> Number((max - min) / step), [min, max, step])
  const valN = useMemo(()=> norm(value), [value, norm])

  const onKey = (e: React.KeyboardEvent) => {
    let delta = 0n
    const mult = e.shiftKey ? 2n : 1n
    if (e.key === 'ArrowLeft') delta = -step
    if (e.key === 'ArrowRight') delta = step
    if (e.key === 'PageUp') delta = step * 5n
    if (e.key === 'PageDown') delta = -step * 5n
    if (delta !== 0n) {
      e.preventDefault()
      const next = clampBigInt(stepAlignBigInt(value + delta*mult, step), min, max)
      onChange(next)
    }
  }

  const ariaText = useMemo(()=> `Bet ${formatChips(value)} (min ${formatChips(min)}, max ${formatChips(max)})`, [value,min,max])
  return (
    <div className="py-2" onKeyDown={onKey}>
      <div className="flex items-center gap-2 text-xs text-white/70">
        <input
          className="bg-white/10 px-2 py-1 rounded outline-none focus:ring"
          inputMode="numeric"
          aria-label="Bet amount"
          aria-valuemin={Number(min)}
          aria-valuemax={Number(max)}
          aria-valuenow={Number(value)}
          aria-valuetext={ariaText}
          value={formatChips(value)}
          onChange={(e)=>{
            const bi = stepAlignBigInt(clampBigInt(parseBigInt(e.target.value), min, max), step)
            onChange(bi)
          }}
        />
        <span className="ml-auto">min {formatChips(min)}</span>
        <span>max {formatChips(max)}</span>
      </div>
      <Slider.Root className="relative mt-2 flex items-center select-none touch-none h-5" min={minN} max={maxN} step={1} value={[valN]}
        aria-label="Bet slider"
        aria-valuemin={minN}
        aria-valuemax={maxN}
        aria-valuenow={valN}
        aria-valuetext={ariaText}
        onValueChange={(v)=>{ const bn = denorm(v[0]); onChange(bn) }}>
        <Slider.Track className="bg-white/10 relative grow rounded h-1.5">
          <Slider.Range className="absolute h-full rounded bg-[var(--gold)]" />
        </Slider.Track>
        <Slider.Thumb className="block w-4 h-4 rounded-full bg-[var(--gold)] focus:outline-none focus:ring focus:ring-[var(--gold)]" aria-label="Bet" />
      </Slider.Root>
    </div>
  )
}


