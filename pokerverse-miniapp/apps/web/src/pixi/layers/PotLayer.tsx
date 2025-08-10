import { Container, Text } from '@pixi/react'
import { getPotPosition } from '../layout/layout'

export default function PotLayer({ amount }: { amount: number }) {
  const pos = getPotPosition()
  return (
    <Container x={pos.x} y={pos.y}>
      <Text text={`Pot ${amount.toFixed(0)}`} x={-60} y={-70} style={{ fill: 0xffffff, fontSize: 22 }}/>
    </Container>
  )
}


