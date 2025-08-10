import { useEffect, useState } from 'react'
import { getAccount, publicClient } from './web3'
import ChipBank from './abis/ChipBank.json'

const CHIP = import.meta.env.VITE_CHIPBANK as `0x${string}`
const TID = 0n

export default function Hud() {
  const [addr, setAddr] = useState<`0x${string}` | null>(null)
  const [bal, setBal] = useState<string>('0.000000')
  const chain = String(import.meta.env.VITE_CHAIN_ID || '')

  useEffect(() => {
    const a = getAccount()
    setAddr(a || null)
    let timer: any
    const refresh = async () => {
      try {
        const who = a as `0x${string}`
        if (!who) return
        const b = await publicClient.readContract({
          abi: ChipBank as any, address: CHIP, functionName: 'balances', args: [TID, who]
        }) as bigint
        setBal((Number(b) / 1e6).toFixed(6))
      } catch {}
    }
    refresh()
    timer = setInterval(refresh, 2000)
    return () => clearInterval(timer)
  }, [])

  const short = addr ? `${addr.slice(0,6)}…${addr.slice(-4)}` : 'Not connected'

  return (
    <div style={{ position:'absolute', top:12, left:12, background:'rgba(0,0,0,.6)', color:'#fff', padding:'8px 10px', borderRadius:12, fontSize:12 }}>
      <div><b>Chain:</b> {chain}</div>
      <div><b>Account:</b> {short}</div>
      <div><b>Chip Balance:</b> {bal} USDC</div>
    </div>
  )
}


