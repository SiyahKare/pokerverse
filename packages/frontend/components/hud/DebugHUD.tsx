"use client";
import { useEffect, useState } from 'react'

export default function DebugHUD(){
  if (process.env.NODE_ENV === 'production') return null
  const [fps, setFps] = useState(0)
  useEffect(()=>{
    let last = performance.now(); let frames = 0
    let raf = 0
    const loop = () => { frames++; const now = performance.now(); if (now-last >= 1000){ setFps(frames); frames=0; last=now } raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return ()=> cancelAnimationFrame(raf)
  }, [])
  return (
    <div className="fixed top-2 right-2 text-[10px] px-2 py-1 rounded bg-black/50 text-white/80">{fps} fps</div>
  )
}


