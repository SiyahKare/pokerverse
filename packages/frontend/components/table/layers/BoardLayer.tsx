"use client";
import { Container, Sprite, Text } from '@pixi/react'
import { useTableStore } from '@/lib/store/useTableStore'
import { getTexture } from '@/lib/pixi/atlas'

export default function BoardLayer(){
  const board = useTableStore(s=>s.board)
  return (
    <Container>
      {board.map((c, i)=> (
        <Sprite key={i} texture={getTexture(c)!} x={260 + i*60} y={180} width={54} height={74} />
      ))}
    </Container>
  )
}


