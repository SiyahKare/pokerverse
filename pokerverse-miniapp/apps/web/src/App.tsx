import { useEffect, useState } from 'react'
import { Application, extend } from '@pixi/react'
import { Container as PixiContainer, Sprite as PixiSprite, Graphics as PixiGraphics, Text as PixiText } from 'pixi.js'

// Pixi bileşenlerini @pixi/react kataloğuna kaydet
extend({ Container: PixiContainer, Sprite: PixiSprite, Text: PixiText as any, Graphics: PixiGraphics })
import TableCanvas from './pixi/TableCanvas'
import type { TableState } from './pixi/types'
import './index.css'
import { TextureProvider } from './assets/TextureStore'
import { useTelegramTheme } from './hooks/useTelegramTheme'
import { useTelegramUI } from './hooks/useTelegramUI'
import { useHaptics } from './hooks/useHaptics'
import ActionBar from './ui/ActionBar'
import BetPanel from './ui/BetPanel'
import Toast from './ui/Toast'
import Hud from '@miniapp/Hud'
import CashOutModal from '@miniapp/CashOutModal'
import { connectWC, getAccount } from '@miniapp/web3'
import { getChipBalance } from '@miniapp/web3'

function useWindowSize() {
  const [s, set] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const on = () => set({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', on); return () => window.removeEventListener('resize', on)
  }, [])
  return s
}

export default function App() {
  const { tg, viewportHeight } = useTelegramTheme()
  const { w } = useWindowSize()
  const h = viewportHeight || window.innerHeight
  const hfx = useHaptics(tg)

  const [state, setState] = useState<TableState>({
    maxSeats: 9,
    seats: Array.from({length:9},(_,i)=>({ seat:i as any, name:`Seat ${i+1}`, stack:3000+i*100, isTurn:i===2 })),
    potAmount: 150,
    community: ['As','Kd','Tc'],
    lastAction: null,
  })

  useTelegramUI(tg, { mainButton: { text: 'Rebuy', visible: false }, backButton: { visible: true, onClick: () => console.log('back') } })

  useEffect(()=>{
    let alive = true as boolean
    let t: any, hb: any
    const url = (() => {
      const envUrl = ((import.meta as any).env.VITE_WS_URL as string | undefined)?.trim()
      const forceLocal = ((import.meta as any).env.VITE_FORCE_LOCAL_WS ?? '').toString().toLowerCase()
      const force = forceLocal === '1' || forceLocal === 'true'
      const host = window.location.hostname
      const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1'
      if (force || isLocal) return 'ws://127.0.0.1:3011'
      if (!envUrl) return null
      let v = envUrl
      if (/^https?:\/\//i.test(v)) {
        try { const u = new URL(v); v = 'wss://' + u.host } catch { v = null as any }
      } else if (!/^wss?:\/\//i.test(v)) {
        v = 'wss://' + v
      }
      try {
        if (v) {
          const u = new URL(v)
          if (!u.host) return null
          return u.toString()
        }
      } catch { return null }
      return null
    })()
    if(!url) { console.warn('WS URL invalid; skipping connect'); return }
    function connect(){
      const ws = new WebSocket(url!)
      ;(window as any).pvSend = (payload:any)=> ws.readyState===1 && ws.send(JSON.stringify({type:'ACTION', payload}))
      ws.onopen = () => { hb = setInterval(()=> ws.readyState===1 && ws.send(JSON.stringify({ type:'PING' })), 15000) }
      ws.onmessage = (ev: MessageEvent) => {
        try {
          const msg = JSON.parse(ev.data as string)
          if (msg.type === 'TABLE_STATE') setState(msg.payload)
          if (msg.type === 'ACTION_REJECTED') setToast(msg.payload?.reason || 'Action rejected')
        } catch {}
      }
      ws.onclose = () => { clearInterval(hb); if(!alive) return; t = setTimeout(connect, 1500) }
    }
    connect()
    return ()=> { alive=false; clearTimeout(t); clearInterval(hb) }
  },[])

  const [betOpen,setBetOpen]=useState(false)
  const [cashOpen,setCashOpen]=useState(false)
  const [toast, setToast] = useState('')
  const [addr, setAddr] = useState<string | null>(null)
  const [chipBal, setChipBal] = useState<number>(0)
  useEffect(()=>{ setAddr(getAccount() || null) }, [])
  useEffect(()=>{
    let cancelled = false
    async function load(){
      try {
        // CashOutModal ile aynı tableId kullan
        const tid = 0n
        const balStr = await getChipBalance(tid)
        if (!cancelled) setChipBal(parseFloat(balStr || '0'))
      } catch { if (!cancelled) setChipBal(0) }
    }
    if (addr) load(); else setChipBal(0)
    return ()=>{ cancelled = true }
  }, [addr])

  const bb=100, toCall=120, lastAgg=200, stack=5000
  const pot=state.potAmount
  // basit sınırlar (server nihai hakem):
  const minBet=Math.max(bb, toCall+Math.max(lastAgg, bb))
  const maxBet=stack
  const step=Math.max(1, Math.round(bb/4))

  return (
    <>
      <TextureProvider>
        <div className="w-full" style={{ height: h, background: 'var(--tg-bg)', color: 'var(--tg-text)' }}>
          <Application width={w} height={h} resolution={window.devicePixelRatio} antialias backgroundAlpha={0}>
            <TableCanvas width={w} height={h} state={state} />
          </Application>

          {/* Overlay HUD */}
          <Hud />

          {/* Connect / CashOut buttons */}
          <div style={{ position:'absolute', top:12, right:12, display:'flex', gap:8 }}>
            {!addr && (
              <button
                onClick={async ()=> { try { const a = await connectWC(); setAddr(a) } catch {} }}
                className="btn-tap"
                style={{ background: 'var(--tg-btn)', color: 'var(--tg-btn-text)', padding:'8px 12px', borderRadius:12 }}
              >Connect</button>
            )}
            {addr && chipBal > 0 && (
              <button
                onClick={()=> setCashOpen(true)}
                className="btn-tap"
                style={{ background: '#2b3440', color: 'var(--tg-text)', padding:'8px 12px', borderRadius:12 }}
              >Cash Out</button>
            )}
          </div>

          <ActionBar
            canCheck={false}
            callAmount={toCall}
            canBetOrRaise={true}
            onFold={()=> hfx.impact('light')}
            onCheckOrCall={()=> { hfx.impact('medium'); (window as any).pvSend?.({ seat:2, kind:'call', amount:toCall }) }}
            onBetOrRaise={()=> { hfx.impact('light'); setBetOpen(true) }}
          />

          <BetPanel
            open={betOpen}
            min={minBet} max={maxBet} step={step}
            pot={pot} call={toCall}
            initial={Math.max(minBet, toCall)}
            onConfirm={(v)=> { hfx.notify('success'); setBetOpen(false); (window as any).pvSend?.({ seat:2, kind:'raise', amount:v }) }}
            onClose={()=> setBetOpen(false)}
            haptic={(k)=> (k==='success'||k==='warning') ? hfx.notify(k as any) : hfx.impact(k as any)}
          />
          <CashOutModal open={cashOpen} onClose={()=> setCashOpen(false)} />
        </div>
      </TextureProvider>
      <Toast text={toast} onClose={()=> setToast('')} />
    </>
  )
}

// removed Vite scaffold duplicate component/export
