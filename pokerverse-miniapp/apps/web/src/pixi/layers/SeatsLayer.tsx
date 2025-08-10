import { Container, Graphics, Text } from '@pixi/react'
import { getSeatPositions } from '../layout/layout'
import { memo } from 'react'
import type { TableState } from '../types'

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
  return (
    <Container>
      {Array.from({length: state.maxSeats}, (_,i)=> (
        <SeatNode key={i} i={i} seat={state.seats[i]} max={state.maxSeats} />
      ))}
    </Container>
  )
})


