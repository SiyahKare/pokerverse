// JSX intrinsic kullanım: container/graphics/text
import gsap from 'gsap'
import { useEffect, useRef } from 'react'
import type { TableState } from '../types'
import { REF_H, REF_W } from '../layout/layout'

export default function ActionBanner({ last }: { last: TableState['lastAction'] }) {
  const ref = useRef<any>(null)
  useEffect(()=>{
    if (!ref.current || !last) return
    const node = ref.current
    node.alpha = 0; node.y = REF_H*0.14
    const tl = gsap.timeline()
    tl.to(node, { alpha:1, y: node.y+10, duration:0.25, ease:'power2.out' })
      .to(node, { alpha:0, y: node.y-10, duration:0.25, ease:'power1.in' }, '+=1.5')
    return ()=> tl.kill()
  }, [last])

  if (!last) return null
  return (
    <container ref={ref as any} x={REF_W/2 - 160}>
      <graphics draw={g=> g.clear().roundRect(0,0,320,60,10).fill(0x202833).stroke({ color:0x4b5563, width:2 })}/>
      <text text={`Seat ${last.seat+1}: ${last.kind.toUpperCase()} ${last.amount ?? ''}`} x={12} y={18} style={{fill:0xffffff, fontSize:18}}/>
    </container>
  )
}


