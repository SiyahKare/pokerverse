"use client";
import { Container, Graphics, Text } from '@pixi/react'
import { memo, useMemo } from 'react'
import { useTableStore } from '@/lib/store/useTableStore'

export default memo(function SeatsLayer(){
  const seats = useTableStore(s=>s.seats)
  const layout = useMemo(()=> seats.map((_,i)=>({ x: 400 + Math.cos((i/seats.length)*Math.PI*2)*260, y: 225 + Math.sin((i/seats.length)*Math.PI*2)*150 })), [seats.length])
  return (
    <Container>
      {seats.map((p, idx)=> (
        <Container key={p.seat} x={layout[idx].x} y={layout[idx].y}>
          <Graphics draw={g=>{ g.clear(); g.beginFill(0x191922); g.drawCircle(0,0,24); g.endFill(); g.lineStyle(1,0xC6A15B,0.5); g.drawCircle(0,0,24) }} />
          <Text text={p.addr ? `${p.addr.slice(0,6)}…` : `Seat ${p.seat+1}`} x={-40} y={30} style={{ fill: 0xEAEAF0, fontSize: 10 }} />
        </Container>
      ))}
    </Container>
  )
})


