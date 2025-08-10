import { Container, Sprite } from '@pixi/react'
import { useMemo } from 'react'
import { useTextures } from '../../assets/TextureStore'
import { getBoardSlots } from '../layout/layout'

export default function CommunityBoard({ cards }: { cards: string[] }) {
  const { cardTexture } = useTextures()
  const slots = useMemo(()=>getBoardSlots(cards.length), [cards.length])
  if (!cardTexture) return null
  return (
    <Container>
      {cards.map((c, i) => (
        <Sprite key={i} texture={cardTexture(c as any)} x={slots[i].x} y={slots[i].y} anchor={0.5} />
      ))}
    </Container>
  )
}


