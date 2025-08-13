"use client";
import { useState } from 'react'
import BetSlider from './BetSlider'

export default function ActionBar(){
  const [amt, setAmt] = useState<bigint>(0n)
  return (
    <div className="fixed left-0 right-0 bottom-0 p-3 backdrop-blur bg-black/30 border-t border-white/10">
      <div className="max-w-3xl mx-auto grid grid-cols-3 gap-2">
        <button className="px-3 py-2 rounded-md bg-white/10">Fold</button>
        <button className="px-3 py-2 rounded-md bg-white/20">Check / Call</button>
        <button className="px-3 py-2 rounded-md bg-[var(--gold)] text-black">Raise</button>
        <div className="col-span-3">
          <BetSlider min={0n} max={1000000n} step={1000n} value={amt} onChange={setAmt} />
        </div>
      </div>
    </div>
  )
}


