// JSX intrinsic kullanım: container/sprite
import { Sprite as PixiSprite } from 'pixi.js'
import { useEffect, useMemo, useRef } from 'react'
import { useTextures } from '../../assets/TextureStore'
import { getBoardSlots } from '../layout/layout'
import type { CardId } from '../../assets/atlas-loader'
import { flipTo } from '../anim/flip'

export default function CommunityBoard({ cards }: { cards: string[] }) {
  const { cardTexture, cardBack } = useTextures()
  const slots = useMemo(()=>getBoardSlots(cards.length), [cards.length])
  const refs = useRef<Array<PixiSprite | null>>([])
  const prev = useRef<string[]>([])

  useEffect(() => {
    if (!cardTexture) return
    cards.forEach((code, i) => {
      const sprite = refs.current[i]
      if (!sprite) return
      const nowTex = cardTexture(code as CardId)
      const was = prev.current[i]
      if (typeof was === 'undefined' && cardBack) {
        sprite.scale.x = 1
        sprite.texture = cardBack()
        flipTo(sprite, nowTex, 300)
      }
      if (typeof was !== 'undefined' && was !== code) {
        flipTo(sprite, nowTex, 300)
      }
    })
    prev.current = [...cards]
  }, [cards, cardTexture, cardBack])
  if (!cardTexture) return null
  return (
    <container>
      {cards.map((c, i) => (
        <sprite
          key={i}
          ref={(el)=> (refs.current[i] = el as any)}
          texture={cardTexture(c as CardId)}
          x={slots[i].x}
          y={slots[i].y}
          anchor={0.5}
        />
      ))}
    </container>
  )
}


