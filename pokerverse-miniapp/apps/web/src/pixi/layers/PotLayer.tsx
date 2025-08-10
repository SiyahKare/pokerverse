import { Container, Sprite, Text } from '@pixi/react'
import { getPotPosition } from '../layout/layout'
import { useTextures } from '../../assets/TextureStore'

export default function PotLayer({ amount }: { amount: number }) {
  const pos = getPotPosition()
  const { chipTexture } = useTextures()
  return (
    <Container x={pos.x} y={pos.y}>
      {chipTexture && (
        <>
          <Sprite texture={chipTexture(100)} x={-20} y={-10} anchor={0.5}/>
          <Sprite texture={chipTexture(25)}  x={+20} y={+10}  anchor={0.5}/>
        </>
      )}
      <Text text={`Pot ${amount.toFixed(0)}`} x={-60} y={-70} style={{ fill: 0xffffff, fontSize: 22 }}/>
    </Container>
  )
}


