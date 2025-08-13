"use client";
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTableHotkeys } from '@/lib/hotkeys/useTableHotkeys'
import BetSlider from './BetSlider'
import { useTableStore } from '@/lib/store/useTableStore'

export default function ActionBar(){
  const validActions = useTableStore(s=>s.validActions||[])
  const betBounds = useTableStore(s=>s.betBounds||{min:0n,max:0n,step:1n})
  const set = useTableStore(s=>s.set)
  const sendAction = useTableStore(s=>s.sendAction)
  const inflight = useTableStore(s=>s.inflight)
  const [amt, setAmt] = useState<bigint>(betBounds.min)
  useEffect(()=>{ setAmt(betBounds.min) }, [betBounds.min])
  const lastClickRef = useRef<number>(0)
  const debounceOk = () => { const now = Date.now(); if (now - lastClickRef.current < 140) return false; lastClickRef.current = now; return true }

  const send = (kind: 'fold'|'check'|'call'|'raise') => {
    if (!debounceOk()) return
    sendAction?.(kind, kind==='raise'?amt:undefined)
  }

  const can = (a: 'fold'|'check'|'call'|'raise') => validActions.includes(a) && !inflight

  useTableHotkeys(()=> amt)

  return (
    <div className="fixed left-0 right-0 bottom-0 p-3 backdrop-blur bg-black/30 border-t border-white/10">
      <div className="max-w-3xl mx-auto grid grid-cols-3 gap-2">
        <button role="button" aria-disabled={!can('fold')} disabled={!can('fold')} className="px-3 py-2 rounded-md bg-white/10 focus:outline-none focus:ring focus:ring-[var(--gold)]" onClick={()=>send('fold')}>Fold</button>
        <button role="button" aria-disabled={!can('check') && !can('call')} disabled={!can('check') && !can('call')} className="px-3 py-2 rounded-md bg-white/20 focus:outline-none focus:ring focus:ring-[var(--gold)]" onClick={()=>send(can('check')?'check':'call')}>{can('check')?'Check':'Call'}</button>
        <button role="button" aria-disabled={!can('raise')} disabled={!can('raise')} className="px-3 py-2 rounded-md bg-[var(--gold)] text-black focus:outline-none focus:ring focus:ring-[var(--gold)]" onClick={()=>send('raise')}>Raise</button>
        <div className="col-span-3">
          <BetSlider min={betBounds.min} max={betBounds.max} step={betBounds.step} value={amt} onChange={setAmt} />
        </div>
      </div>
    </div>
  )
}


