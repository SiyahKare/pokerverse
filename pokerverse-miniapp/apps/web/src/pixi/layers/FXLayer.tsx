import { Container, Graphics } from '@pixi/react'
import gsap from 'gsap'
import { useEffect, useRef } from 'react'

export default function FXLayer({ trigger }: { trigger?: { x:number; y:number } }) {
  const layer = useRef<any>(null)
  useEffect(()=>{
    if (!trigger || !layer.current) return
    const g = new Graphics()
    g.circle(trigger.x, trigger.y, 12).fill(0xffcc00).stroke({ color: 0x8b6f00, width: 2 })
    g.alpha = 0
    layer.current.addChild(g)
    gsap.to(g, { alpha:1, duration:0.1 })
    gsap.to(g, { alpha:0, duration:0.15, delay:0.35, onComplete:()=> g.destroy() })
  }, [trigger])

  return <Container ref={layer} />
}


