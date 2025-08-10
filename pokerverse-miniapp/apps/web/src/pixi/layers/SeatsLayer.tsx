import { getSeatPositions } from '../layout/layout'
import { memo } from 'react'
import type { TableState } from '../types'
import { useTextures } from '../../assets/TextureStore'
import type { CardId } from '../../assets/atlas-loader'

function SeatNode({ i, seat, max }: any) {
  const pos = getSeatPositions(max)[i]
  return (
    <Container x={pos.x} y={pos.y} eventMode="static" cursor="pointer">
      <Graphics draw={g=> g.clear().circle(0,0,36).fill(0x333a45)} />
      {seat?.isTurn && (
        <Graphics draw={g=> g.clear().circle(0,0,42).stroke({color:0x39ff88,width:3})}/>
      )}
      <Text text={seat?.name ?? `Seat ${i+1}`} x={-40} y={46} style={{fill:0xffffff, fontSize:16}}/>
      <Text text={seat?.stack != null ? `${seat.stack}` : ''} x={-30} y={66} style={{fill:0xbadfff, fontSize:14}}/>
    </Container>
  )
}

export default memo(function SeatsLayer({ state }: { state: TableState }) {
  const { cardTexture } = useTextures()
  const pos = getSeatPositions(state.maxSeats)
  return (
    <container>
      {state.seats.map((s, i) => {
        const p = pos[i]
        return (
          <container key={i} x={p.x} y={p.y}>
            <graphics key={`g-base-${i}`} draw={g=> g.clear().circle(0,0,36).fill(0x333a45)} />
            <graphics key={`g-ring-${i}`} draw={g=> g.clear().circle(0,0,42).stroke({color:0x39ff88,width:3})} visible={!!s?.isTurn} />
            <text key={`t-name-${i}`} text={s?.name ?? `Seat ${i+1}`} x={-40} y={46} style={{fill:0xffffff, fontSize:16}}/>
            <text key={`t-stack-${i}`} text={s?.stack != null ? `${s.stack}` : ''} x={-30} y={66} style={{fill:0xbadfff, fontSize:14}}/>
            {s?.hole && cardTexture && (
              <>
                <sprite key={`c0-${i}`} texture={cardTexture((s.hole[0] as CardId) ?? 'Ah' as CardId)} x={-30} y={-70} anchor={0.5} />
                <sprite key={`c1-${i}`} texture={cardTexture((s.hole[1] as CardId) ?? 'Kd' as CardId)} x={+30} y={-70} anchor={0.5} />
              </>
            )}
          </container>
        )
      })}
    </container>
  )
})


