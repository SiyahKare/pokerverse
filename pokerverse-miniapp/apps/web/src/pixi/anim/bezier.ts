import { Container, Sprite as PixiSprite, Texture } from 'pixi.js'
import gsap from 'gsap'

type Pt = { x:number; y:number }
const q = (t:number, p0:Pt, p1:Pt, p2:Pt) => {
  const u = 1 - t
  return { x: u*u*p0.x + 2*u*t*p1.x + t*t*p2.x, y: u*u*p0.y + 2*u*t*p1.y + t*t*p2.y }
}

export function chipMove(container: Container, tex: Texture, from: Pt, to: Pt, ms=250) {
  const ctrl = { x: (from.x + to.x)/2, y: Math.min(from.y, to.y) - 80 }
  const s = new PixiSprite(tex); s.anchor.set(0.5); s.position.set(from.x, from.y); s.alpha = 0
  container.addChild(s)
  gsap.to(s, { alpha: 1, duration: 0.08 })
  const obj = { t: 0 }
  gsap.to(obj, {
    t: 1, duration: ms/1000, ease: 'power2.out',
    onUpdate: () => { const p = q(obj.t, from, ctrl, to); s.position.set(p.x, p.y) },
    onComplete: () => { gsap.to(s, { alpha:0, duration:0.1, onComplete:()=> s.destroy() }) }
  })
}


