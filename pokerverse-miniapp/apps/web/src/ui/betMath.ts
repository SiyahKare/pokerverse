export function betBounds({
  bb, toCall, lastAgg, stack, pot,
}: { bb:number; toCall:number; lastAgg:number; stack:number; pot:number }) {
  const minBet = Math.max(bb, toCall + Math.max(lastAgg, bb))
  const maxBet = stack
  const step   = Math.max(1, Math.round(bb/4))
  const clamp  = (v:number)=> Math.min(maxBet, Math.max(minBet, Math.round(v/step)*step))
  const presets = {
    '1_3': clamp(pot/3 + toCall),
    '1_2': clamp(pot/2 + toCall),
    '2_3': clamp((pot*2)/3 + toCall),
    'pot': clamp(pot + toCall),
    'allin': maxBet,
  } as const
  return { min:minBet, max:maxBet, step, clamp, presets }
}


