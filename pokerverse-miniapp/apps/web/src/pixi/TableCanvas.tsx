import { useEffect, useMemo, useRef } from 'react'
import { REF_W, REF_H } from './layout/layout'
import { getPotPosition, getSeatPositions } from './layout/layout'
import TableBackground from './layers/TableBackground'
import CommunityBoard from './layers/CommunityBoard'
import SeatsLayer from './layers/SeatsLayer'
import PotLayer from './layers/PotLayer'
import ActionBanner from './layers/ActionBanner'
import FXLayer from './layers/FXLayer'
import type { FXHandle } from './layers/FXLayer'
import type { TableState } from './types'
import { useTextures } from '../assets/TextureStore'

export default function TableCanvas({ width, height, state }:{width:number;height:number;state:TableState}) {
  const scale = useMemo(()=> Math.min(width/REF_W, height/REF_H), [width,height])
  const fxRef = useRef<FXHandle>(null)
  const { chipTexture } = useTextures()

  useEffect(() => {
    const a = state.lastAction
    if (!a || !chipTexture) return
    if (!['bet','call','raise','allin'].includes(a.kind)) return
    const from = getSeatPositions(state.maxSeats)[a.seat]
    const to = getPotPosition()
    const tex = chipTexture(100)
    fxRef.current?.chip(tex, from, to, 280)
  }, [state.lastAction, chipTexture, state.maxSeats])

  return (
    <container scale={{x:scale,y:scale}} x={(width-REF_W*scale)/2} y={(height-REF_H*scale)/2}>
      <TableBackground />
      <PotLayer amount={state.potAmount} />
      <CommunityBoard cards={state.community} />
      <SeatsLayer state={state} />
      <ActionBanner last={state.lastAction ?? null} />
      <FXLayer ref={fxRef} />
    </container>
  )
}


