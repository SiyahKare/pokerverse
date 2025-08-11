import React, { useEffect, useState } from 'react'

export default function TurnOverlay({ deadline }:{ deadline: number }){
  const [now, setNow] = useState(Date.now())
  useEffect(()=>{
    const t = setInterval(()=> setNow(Date.now()), 200)
    return ()=> clearInterval(t)
  }, [])
  const remain = Math.max(0, deadline - now)
  const secs = Math.ceil(remain/1000)
  return (
    <div style={{ position:'absolute', top:12, left:12, background:'rgba(0,0,0,0.5)', color:'#fff', padding:'4px 8px', borderRadius:8, fontSize:12 }}>
      Turn: {secs}s
    </div>
  )
}


