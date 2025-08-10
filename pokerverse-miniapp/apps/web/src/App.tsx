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
    const url = (import.meta as any).env.VITE_WS_URL as string | undefined
    if(!url) return
    const ws = new WebSocket(url)
    ws.onmessage = ev => { try { const msg = JSON.parse(ev.data as string); if(msg.type==='TABLE_STATE') setState(msg.payload) } catch{} }
    ;(window as any).pvSend = (payload:any)=>ws.send(JSON.stringify({type:'ACTION', payload}))
    return ()=> ws.close()
  },[])

  const [betOpen,setBetOpen]=useState(false)
  const callAmount=120, minBet=200, maxBet=5000, step=20

  return (
    <TextureProvider>
      <div className="w-full" style={{ height: h, background: 'var(--tg-bg)', color: 'var(--tg-text)' }}>
        <Stage width={w} height={h} options={{ resolution: window.devicePixelRatio, antialias: true, backgroundAlpha: 0 }}>
          <TableCanvas width={w} height={h} state={state}/>
        </Stage>

        <ActionBar
          canCheck={false}
          callAmount={callAmount}
          canBetOrRaise={true}
          onFold={()=> haptic('light')}
          onCheckOrCall={()=> { haptic('medium'); (window as any).pvSend?.({ seat:2, kind:'call', amount:callAmount }) }}
          onBetOrRaise={()=> setBetOpen(true)}
        />

        <BetPanel
          open={betOpen}
          min={minBet} max={maxBet} step={step}
          pot={state.potAmount} call={callAmount}
          initial={Math.max(minBet, callAmount)}
          onConfirm={(v)=> { haptic('success'); setBetOpen(false); (window as any).pvSend?.({ seat:2, kind:'raise', amount:v }) }}
          onClose={()=> setBetOpen(false)}
          haptic={haptic}
        />
      </div>
    </TextureProvider>
  )
}

// removed Vite scaffold duplicate component/export
