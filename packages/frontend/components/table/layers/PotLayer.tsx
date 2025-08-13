"use client";
import { Container, Graphics, Text } from '@pixi/react'
import { useTableStore } from '@/lib/store/useTableStore'

export default function PotLayer(){
  const pot = useTableStore(s=>s.pot)
  return (
    <Container>
      <Graphics draw={g=>{ g.clear(); g.beginFill(0xC6A15B, 0.08); g.drawCircle(400,120,30); g.endFill() }} />
      <Text text={`Pot: ${(pot??0n).toString()}`} x={360} y={110} style={{ fill: 0xEAEAF0, fontSize: 12 }} />
    </Container>
  )
}


