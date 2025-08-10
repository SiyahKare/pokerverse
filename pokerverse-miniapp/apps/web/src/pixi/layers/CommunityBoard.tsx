import { Container, Sprite } from '@pixi/react'
import { useMemo } from 'react'
import { useTextures } from '../../assets/TextureStore'
import { getBoardSlots } from '../layout/layout'
import type { CardId } from '../../assets/atlas-loader'

export default function CommunityBoard({ cards }: { cards: string[] }) {
  const { cardTexture } = useTextures()
  const slots = useMemo(()=>getBoardSlots(cards.length), [cards.length])
  if (!cardTexture) return null
  return (
    <Container>
      {cards.map((c, i) => (
        <Sprite key={i} texture={cardTexture(c as CardId)} x={slots[i].x} y={slots[i].y} anchor={0.5} />
      ))}
    </Container>
  )
}


