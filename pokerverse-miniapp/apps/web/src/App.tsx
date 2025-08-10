import { useEffect, useState } from 'react'
import TableCanvas from './pixi/TableCanvas'
import type { TableState } from './pixi/TableCanvas'
import './index.css'
import { connectWC, approveUSDC, openSession } from '../../../src/web3'
import Hud from '../../../src/Hud'
import CashOutModal from '../../../src/CashOutModal'
import { HelpOverlay } from '../../../src/HelpOverlay'

function useWindowSize() {
  const [s, set] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const on = () => set({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', on); return () => window.removeEventListener('resize', on)
  }, [])
  return s
}

export default function App() {
  const { w, h } = useWindowSize()
  const [open, setOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  const [state, setState] = useState<TableState>({
    maxSeats: 9,
    seats: Array.from({length:9}, (_,i)=>({ seat:i, name:`Seat ${i+1}`, stack: 3000 + i*100, isTurn: i===2 })),
    potAmount: 150,
    community: ['As','Kd','Tc'],
    lastAction: null,
  })

  // Tekil WS (StrictMode/HMR altında erken close hatasını önlemek için)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (!(window as any)._pv_ws) {
    const envUrl = (import.meta as any).env.VITE_WS_URL as string | undefined
    const url = envUrl || 'ws://localhost:3011'
    ;(window as any)._pv_ws = new WebSocket(url)
  }
  useEffect(() => {
    const ws: WebSocket = (window as any)._pv_ws
    const onMsg = (ev: MessageEvent) => {
      try {
        const msg = JSON.parse(ev.data as string)
        if (msg.type === 'TABLE_STATE') setState(msg.payload)
      } catch {}
    }
    ws.addEventListener('message', onMsg)
    return () => ws.removeEventListener('message', onMsg)
  }, [])

  const refW = 1920, refH = 1080

  return (
    <div className="w-full h-[100dvh] bg-black text-white">
      <TableCanvas
        width={w}
        height={h}
        refWidth={refW}
        refHeight={refH}
        state={state}
        onSeatClick={async (i)=> {
          console.log('seat', i)
          const addr = await connectWC()
          await approveUSDC('10')
          await openSession(0n, '10')
          const ws: WebSocket | undefined = (window as any)._pv_ws
          if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'JOIN', payload: { seat: i, addr, buyIn: 10 } }))
          }
        }}
      />
      <Hud />
      <button style={{position:'absolute', top:12, right:12}} onClick={()=>setOpen(true)}>Cash Out</button>
      <CashOutModal open={open} onClose={()=>setOpen(false)} />
      <button
        onClick={() => setHelpOpen(true)}
        style={{position:'absolute', bottom:16, right:16, padding:'8px 12px', borderRadius:16, background:'#000', color:'#fff', zIndex:998}}
      >
        ?
      </button>
      <HelpOverlay open={helpOpen} onClose={()=>setHelpOpen(false)} />
    </div>
  )
}

// removed Vite scaffold duplicate component/export
