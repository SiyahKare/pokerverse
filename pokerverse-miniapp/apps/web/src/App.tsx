import { useEffect, useState } from 'react'
import { Stage } from '@pixi/react'
import TableCanvas from './pixi/TableCanvas'
import type { TableState } from './pixi/types'
import './index.css'
import { TextureProvider } from './assets/TextureStore'
import { useTelegramTheme } from './hooks/useTelegramTheme'
import { useTelegramUI } from './hooks/useTelegramUI'
import ActionBar from './ui/ActionBar'
import BetPanel from './ui/BetPanel'

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

  const [state, setState] = useState<TableState>({
    maxSeats: 9,
    seats: Array.from({length:9},(_,i)=>({ seat:i as any, name:`Seat ${i+1}`, stack:3000+i*100, isTurn:i===2 })),
    potAmount: 150,
    community: ['As','Kd','Tc'],
    lastAction: null,
  })

  useTelegramUI(tg, { mainButton: { text: 'Rebuy', visible: false }, backButton: { visible: true, onClick: () => console.log('back') } })
  const haptic = (k:'light'|'medium'|'rigid'|'success'|'warning')=>{ if(!tg) return; if(k==='success'||k==='warning') return tg.haptics.notificationOccurred(k); tg.haptics.impactOccurred(k) }

  useEffect(()=>{
    let alive = true as boolean
    let t: any, hb: any
    const url = (import.meta as any).env.VITE_WS_URL as string | undefined
    if(!url) return
    function connect(){
      const ws = new WebSocket(url)
      ;(window as any).pvSend = (payload:any)=> ws.readyState===1 && ws.send(JSON.stringify({type:'ACTION', payload}))
      ws.onopen = () => { hb = setInterval(()=> ws.readyState===1 && ws.send(JSON.stringify({ type:'PING' })), 15000) }
      ws.onmessage = (ev: MessageEvent) => {
        try {
          const msg = JSON.parse(ev.data as string)
          if (msg.type === 'TABLE_STATE') setState(msg.payload)
          if (msg.type === 'ACTION_REJECTED') console.warn('Rejected:', msg.payload?.reason)
        } catch {}
      }
      ws.onclose = () => { clearInterval(hb); if(!alive) return; t = setTimeout(connect, 1500) }
    }
    connect()
    return ()=> { alive=false; clearTimeout(t); clearInterval(hb) }
  },[])

  const [betOpen,setBetOpen]=useState(false)
  const bb=100, toCall=120, lastAgg=200, stack=5000
  const pot=state.potAmount
  // basit sınırlar (server nihai hakem):
  const minBet=Math.max(bb, toCall+Math.max(lastAgg, bb))
  const maxBet=stack
  const step=Math.max(1, Math.round(bb/4))

  return (
    <TextureProvider>
      <div className="w-full" style={{ height: h, background: 'var(--tg-bg)', color: 'var(--tg-text)' }}>
        <Stage width={w} height={h} options={{ resolution: window.devicePixelRatio, antialias: true, backgroundAlpha: 0 }}>
          <TableCanvas width={w} height={h} state={state}/>
        </Stage>

        <ActionBar
          canCheck={false}
          callAmount={toCall}
          canBetOrRaise={true}
          onFold={()=> haptic('light')}
          onCheckOrCall={()=> { haptic('medium'); (window as any).pvSend?.({ seat:2, kind:'call', amount:toCall }) }}
          onBetOrRaise={()=> setBetOpen(true)}
        />

        <BetPanel
          open={betOpen}
          min={minBet} max={maxBet} step={step}
          pot={pot} call={toCall}
          initial={Math.max(minBet, toCall)}
          onConfirm={(v)=> { haptic('success'); setBetOpen(false); (window as any).pvSend?.({ seat:2, kind:'raise', amount:v }) }}
          onClose={()=> setBetOpen(false)}
          haptic={haptic}
        />
      </div>
    </TextureProvider>
  )
}

// removed Vite scaffold duplicate component/export
