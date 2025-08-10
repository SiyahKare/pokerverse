import { forwardRef, useImperativeHandle, useRef } from 'react'
import type { Container as PixiContainer, Texture } from 'pixi.js'
import { chipMove } from '../anim/bezier'

export type FXHandle = {
  chip: (tex: Texture, from:{x:number;y:number}, to:{x:number;y:number}, ms?:number) => void
}

export default forwardRef<FXHandle, {}>(function FXLayer(_, ref) {
  const layer = useRef<PixiContainer>(null as any)
  useImperativeHandle(ref, () => ({
    chip: (tex, from, to, ms=250) => {
      const c = layer.current as unknown as PixiContainer | null
      if (!c || !c.parent) return
      chipMove(c as any, tex, from, to, ms)
    }
  }), [])
  return <container ref={layer as any} />
})


