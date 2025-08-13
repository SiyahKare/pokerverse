"use client";
import { Container, Graphics } from '@pixi/react'
import { useEffect, useRef, useState } from 'react'

export default function EffectsLayer(){
  const reqRef = useRef<number | null>(null)
  const [t, setT] = useState(0)
  useEffect(()=>{
    let start = performance.now()
    const loop = () => { setT(performance.now()-start); reqRef.current = requestAnimationFrame(loop) }
    const startLoop = () => { if (reqRef.current) cancelAnimationFrame(reqRef.current); reqRef.current = requestAnimationFrame(loop) }
    const stopLoop = () => { if (reqRef.current) { cancelAnimationFrame(reqRef.current); reqRef.current = null } }
    const onVis = () => { if (document.hidden) stopLoop(); else { start = performance.now(); startLoop() } }
    document.addEventListener('visibilitychange', onVis)
    startLoop()
    return ()=>{ document.removeEventListener('visibilitychange', onVis); if(reqRef.current) cancelAnimationFrame(reqRef.current) }
  }, [])
  const progress = Math.min((t % 15000) / 15000, 1) // 15s turn timer
  return (
    <Container>
      <Graphics draw={g=>{ g.clear(); g.lineStyle(3, 0xE0B054, 0.8); g.arc(400, 300, 36, -Math.PI/2, -Math.PI/2 + progress*2*Math.PI) }} />
    </Container>
  )
}


