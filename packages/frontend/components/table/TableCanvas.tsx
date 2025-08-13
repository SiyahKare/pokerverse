"use client";
import { Stage, Container, Graphics, Text } from '@pixi/react'
import { useMemo } from 'react'

export default function TableCanvas({ tableId }: { tableId: number }) {
  const seats = useMemo(()=> Array.from({length:6}, (_,i)=>({ x: 300 + Math.cos((i/6)*Math.PI*2)*200, y: 200 + Math.sin((i/6)*Math.PI*2)*120 })), [])
  return (
    <div className="w-full aspect-[16/9] card-premium">
      <Stage width={800} height={450} options={{ backgroundAlpha: 0 }}>
        <Container x={0} y={0}>
          <Graphics draw={g=>{ g.clear(); g.beginFill(0x0E0E13); g.drawRoundedRect(50, 50, 700, 350, 180); g.endFill(); g.lineStyle(2, 0xC6A15B, 0.6); g.drawRoundedRect(50, 50, 700, 350, 180) }} />
          {seats.map((s,idx)=> (
            <Graphics key={idx} draw={g=>{ g.clear(); g.beginFill(0x191922); g.drawCircle(s.x, s.y, 24); g.endFill(); g.lineStyle(1,0xC6A15B,0.5); g.drawCircle(s.x, s.y, 24) }} />
          ))}
          <Text text={`Table #${tableId}`} x={60} y={60} style={{ fill: 0xEAEAF0, fontSize: 16 }} />
        </Container>
      </Stage>
    </div>
  )
}


