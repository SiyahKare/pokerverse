import { useMemo } from 'react'
import { REF_W, REF_H } from './layout/layout'
import TableBackground from './layers/TableBackground'
import CommunityBoard from './layers/CommunityBoard'
import SeatsLayer from './layers/SeatsLayer'
import PotLayer from './layers/PotLayer'
import ActionBanner from './layers/ActionBanner'
import FXLayer from './layers/FXLayer'
import type { TableState } from './types'

export default function TableCanvas({ width, height, state }:{width:number;height:number;state:TableState}) {
  const scale = useMemo(()=> Math.min(width/REF_W, height/REF_H), [width,height])
  return (
    <div>
      <Container scale={{x:scale,y:scale}} x={(width-REF_W*scale)/2} y={(height-REF_H*scale)/2}>
        <TableBackground />
        <PotLayer amount={state.potAmount} />
        <CommunityBoard cards={state.community} />
        <SeatsLayer state={state} />
        <ActionBanner last={state.lastAction ?? null} />
        <FXLayer />
      </Container>
    </div>
  )
}


