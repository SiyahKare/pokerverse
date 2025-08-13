import React, { useEffect, useState } from 'react'
import TableCanvas from './components/TableCanvas'
import { HandBadge } from './components/HandBadge'

type V = 'pending'|'ok'|'mismatch'|'idle'

export default function Simple2DApp(){
  const [handId,setHandId]=useState<string|undefined>()
  const [commit,setCommit]=useState<string|undefined>()
  const [verified,setVerified]=useState<V>('idle')
  useEffect(()=>{
    (window as any).__PV_DEV__ = {
      emit: (type: string, payload: any) => {
        if (type==='rng:commit') { setHandId(payload?.handId); setCommit(payload?.commit); setVerified('pending') }
        if (type==='rng:reveal' && commit) { setVerified('ok') }
      }
    }
  }, [commit])
  return (
    <div className="w-screen h-screen">
      <TableCanvas />
      <HandBadge handId={handId} status={verified}/>
    </div>
  )
}


