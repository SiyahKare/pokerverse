import { useEffect, useMemo, useRef } from 'react'
import * as PIXI from 'pixi.js'
import { gsap } from 'gsap'
import { getSeatPositions, getPotPosition, getBoardSlots, REF_W, REF_H } from './layout/layout'

type ActionType = 'check'|'bet'|'call'|'raise'|'fold'
type PlayerSeat = { seat: number; name?: string; stack?: number; isSitting?: boolean; isTurn?: boolean }
export type TableState = {
  maxSeats: 6|9
  seats: PlayerSeat[]
  potAmount: number
  community: string[]
  lastAction?: { seat: number; kind: ActionType; amount?: number } | null
}
type AnimConfig = { cardFlipMs?: number; chipMoveMs?: number }

export default function TableCanvas(props: {
  width: number; height: number; refWidth: number; refHeight: number;
  state: TableState; anim?: AnimConfig; onSeatClick?:(i:number)=>void
}) {
  const { width, height, refWidth, refHeight, state, anim, onSeatClick } = props
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const rootRef = useRef<PIXI.Container | null>(null)
  const boardRef = useRef<PIXI.Container | null>(null)
  const seatsRef = useRef<PIXI.Container | null>(null)
  const fxRef = useRef<PIXI.Container | null>(null)
  const potTextRef = useRef<PIXI.Text | null>(null)
  const scale = useMemo(() => Math.min(width/refWidth, height/refHeight), [width, height, refWidth, refHeight])
  const cardFlipMs = anim?.cardFlipMs ?? 300
  const chipMoveMs = anim?.chipMoveMs ?? 250

  // Init PIXI app once
  useEffect(() => {
    if (!wrapRef.current || appRef.current) return
    let destroyed = false
    const boot = async () => {
      const app = new PIXI.Application()
      await app.init({
        width: REF_W,
        height: REF_H,
        backgroundAlpha: 0,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
      })
      if (destroyed) { app.destroy(true); return }
      appRef.current = app
      if (wrapRef.current) wrapRef.current.appendChild(app.canvas as unknown as Node)

    const root = new PIXI.Container()
    rootRef.current = root
    app.stage.addChild(root)

    const bg = new PIXI.Graphics()
    bg.rect(0, 0, REF_W, REF_H).fill(0x0b1620)
    bg.roundRect(REF_W*0.10, REF_H*0.18, REF_W*0.80, REF_H*0.64, 60).fill(0x114d2c)
    root.addChild(bg)

    const pot = new PIXI.Text({ text: '', style: { fill: 0xffffff, fontSize: 28, fontWeight: '600' } })
    pot.x = Math.round(REF_W*0.50) - 60
    pot.y = Math.round(REF_H*0.42)
    potTextRef.current = pot
    root.addChild(pot)

    const board = new PIXI.Container(); boardRef.current = board; root.addChild(board)
    const seats = new PIXI.Container(); seatsRef.current = seats; root.addChild(seats)
    const fx = new PIXI.Container(); fxRef.current = fx; root.addChild(fx)

    }
    boot()
    return () => {
      destroyed = true
      const app = appRef.current
      const root = rootRef.current
      try { if (app && root) app.stage.removeChild(root) } catch {}
      if (root) root.destroy({ children: true })
      if (app) app.destroy(true)
      appRef.current = null
      rootRef.current = null; boardRef.current = null; seatsRef.current = null; fxRef.current = null; potTextRef.current = null
    }
  }, [])

  // Responsive transform
  useEffect(() => {
    const root = rootRef.current; if (!root) return
    root.scale.set(scale)
    root.x = (width - REF_W*scale)/2
    root.y = (height - REF_H*scale)/2
  }, [scale, width, height])

  useEffect(() => {
    if (potTextRef.current) {
      potTextRef.current.text = `Pot: ${state.potAmount.toFixed(2)}`
    }
    const board = boardRef.current; if (!board) return
    board.removeChildren()
    const slots = getBoardSlots(state.community.length, REF_W, REF_H)
    state.community.forEach((code, i) => {
      const slot = slots[i]
      const card = new PIXI.Container()
      card.x = slot.x; card.y = slot.y; card.pivot.set(slot.w/2, slot.h/2)
      const body = new PIXI.Graphics().roundRect(0,0,slot.w,slot.h,12).fill(0xffffff).stroke({color:0x222,width:2})
      const label = new PIXI.Text({ text: code, style: { fill: 0x111111, fontSize: 28, fontWeight: 'bold' }})
      label.x = 12; label.y = 10
      card.addChild(body, label)
      card.scale.x = 0; card.scale.y = 1
      board.addChild(card)
      gsap.to(card.scale, { x:1, duration: cardFlipMs/1000, ease:'power2.out', delay: i*0.05 })
    })
  }, [state.community, cardFlipMs])

  useEffect(() => {
    const layer = seatsRef.current; if (!layer) return
    layer.removeChildren()
    const pos = getSeatPositions(state.maxSeats, REF_W, REF_H)
    for (let i=0; i<state.maxSeats; i++) {
      const s = state.seats[i]
      const c = new PIXI.Container()
      c.x = pos[i].x; c.y = pos[i].y; c.eventMode='static'; c.cursor='pointer'
      c.on('pointertap', () => onSeatClick?.(i))
      const av = new PIXI.Graphics().circle(0,0,36).fill(0x333a45)
      c.addChild(av)
      if (s?.isTurn) {
        const ring = new PIXI.Graphics().circle(0,0,42).stroke({ color:0x39ff88, width:3 })
        c.addChild(ring)
      }
      const nameTxt = new PIXI.Text({ text: s?.name ?? `Seat ${i+1}`, style:{ fill:0xffffff, fontSize:16 }})
      nameTxt.x = -Math.round(nameTxt.width/2); nameTxt.y = 46; c.addChild(nameTxt)
      const stackTxt = new PIXI.Text({ text: s?.stack!=null ? `${s.stack.toFixed(2)}` : '', style:{ fill:0xbadfff, fontSize:14 }})
      stackTxt.x = -Math.round(stackTxt.width/2); stackTxt.y = 66; c.addChild(stackTxt)
      c.alpha = s?.isSitting === false ? 0.25 : 1
      layer.addChild(c)
    }
  }, [state.seats, state.maxSeats, onSeatClick])

  useEffect(() => {
    const root = rootRef.current; if (!root || !state.lastAction) return
    const { seat, kind, amount } = state.lastAction
    const banner = new PIXI.Container()
    const bg = new PIXI.Graphics().roundRect(0,0,320,60,10).fill(0x202833).stroke({ color:0x4b5563, width:2 })
    const txt = new PIXI.Text({ text:`Seat ${seat+1}: ${kind.toUpperCase()} ${amount ?? ''}`, style:{ fill:0xffffff, fontSize:18 }})
    txt.x = 12; txt.y = 18; banner.addChild(bg, txt)
    banner.x = REF_W/2 - 160; banner.y = REF_H*0.14; banner.alpha = 0; root.addChild(banner)
    gsap.to(banner, { alpha:1, y: banner.y+10, duration:0.25, ease:'power2.out' })
    gsap.to(banner, { alpha:0, y: banner.y-10, delay:1.8, duration:0.25, ease:'power1.in', onComplete:()=>root.removeChild(banner) })

    if ((kind==='bet'||kind==='call'||kind==='raise') && amount && amount>0) {
      const fx = fxRef.current; if (!fx) return
      const seatPos = getSeatPositions(state.maxSeats, REF_W, REF_H)[seat]
      const potPos = getPotPosition(REF_W, REF_H)
      const chip = new PIXI.Graphics().circle(0,0,12).fill(0xffcc00).stroke({ color:0x8b6f00, width:2 })
      chip.x = seatPos.x; chip.y = seatPos.y; chip.alpha = 0; fx.addChild(chip)
      gsap.to(chip, { alpha:1, duration:0.1 })
      gsap.to(chip, { x: potPos.x, y: potPos.y, duration: chipMoveMs/1000, ease:'power2.out' })
      gsap.to(chip, { alpha:0, delay: chipMoveMs/1000, duration:0.1, onComplete:()=>fx.removeChild(chip) })
    }
  }, [state.lastAction, state.maxSeats, chipMoveMs])

  useMemo(() => state.potAmount, [state.potAmount])

  return <div ref={wrapRef} style={{ width: '100%', height: '100%' }} />
}


