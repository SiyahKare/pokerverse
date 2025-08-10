// JSX intrinsic kullanım: container/sprite/text
import { getPotPosition } from '../layout/layout'
import { useTextures } from '../../assets/TextureStore'

export default function PotLayer({ amount }: { amount: number }) {
  const pos = getPotPosition()
  const { ready, chipTexture } = useTextures() as any
  if (!ready) return null
  return (
    <container x={pos.x} y={pos.y}>
      {chipTexture ? (
        <>
          <sprite texture={chipTexture(100)} x={-20} y={-10} anchor={0.5}/>
          <sprite texture={chipTexture(25)}  x={+20} y={+10}  anchor={0.5}/>
        </>
      ) : null}
      <text text={`Pot ${amount.toFixed(0)}`} x={-60} y={-70} style={{ fill: 0xffffff, fontSize: 22 }}/>
    </container>
  )
}


