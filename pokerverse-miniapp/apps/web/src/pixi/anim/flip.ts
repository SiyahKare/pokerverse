import type { Sprite, Texture } from 'pixi.js'
import gsap from 'gsap'

export function flipTo(sprite: Sprite, next: Texture, ms = 300) {
  const half = ms / 2 / 1000
  const tl = gsap.timeline()
  tl.to(sprite.scale, { x: 0, duration: half, ease: 'power2.in', onComplete: () => { sprite.texture = next } })
    .to(sprite.scale, { x: 1, duration: half, ease: 'power2.out' })
  return tl
}


