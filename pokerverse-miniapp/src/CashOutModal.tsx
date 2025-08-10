import { useEffect, useMemo, useState } from 'react'
import { getAccount, publicClient, cashOutFull } from './web3'
import ChipBank from './abis/ChipBank.json'

const CHIP = import.meta.env.VITE_CHIPBANK as `0x${string}`
const TID = 0n
const toNum6 = (x: bigint) => Number(x) / 1e6

export default function CashOutModal({ open, onClose }:{ open:boolean; onClose:()=>void }) {
  const [addr, setAddr] = useState<`0x${string}` | null>(null)
  const [bal, setBal] = useState<bigint>(0n)
  const [dep, setDep] = useState<bigint>(0n)
  const [bps, setBps] = useState<number>(1000)
  const [profitOnly, setProfitOnly] = useState(false)
  const onlyWinnerMode = true

  useEffect(() => {
    if (!open) return
    const a = getAccount(); setAddr(a || null)
    ;(async () => {
      if (!a) return
      const [b, d, p] = await Promise.all([
        publicClient.readContract({ abi: ChipBank as any, address: CHIP, functionName:'balances', args:[TID, a] }) as Promise<bigint>,
        publicClient.readContract({ abi: ChipBank as any, address: CHIP, functionName:'deposits', args:[TID, a] }) as Promise<bigint>,
        publicClient.readContract({ abi: ChipBank as any, address: CHIP, functionName:'polOnCashoutBps' }) as Promise<number>,
      ])
      setBal(b); setDep(d); setBps(Number(p))
    })()
  }, [open])

  const grossCut  = useMemo(() => (bal * BigInt(bps)) / 10000n, [bal, bps])
  const profit    = useMemo(() => (bal > dep ? bal - dep : 0n), [bal, dep])
  const profitCut = useMemo(() => (profit * BigInt(bps)) / 10000n, [profit, bps])
  const lp        = profitOnly ? profitCut : grossCut
  const net       = bal > lp ? bal - lp : 0n

  async function confirm() {
    await cashOutFull(TID, onlyWinnerMode, profitOnly)
    onClose()
  }

  if (!open) return null
  return (
    <div style={{position:'absolute', inset:0, background:'rgba(0,0,0,.5)'}}>
      <div style={{maxWidth:360, margin:'10% auto', background:'#fff', borderRadius:12, padding:16}}>
        <h3 style={{margin:'0 0 8px'}}>Cash Out Önizleme</h3>
        <div style={{fontSize:13}}>
          <div>Balance: <b>{toNum6(bal).toFixed(6)} USDC</b></div>
          <div>Deposits: {toNum6(dep).toFixed(6)} USDC</div>
          <div>LP Cut ({(bps/100).toFixed(2)}% {profitOnly?'profit-only':'gross'}): <b>{toNum6(lp).toFixed(6)} USDC</b></div>
          <div>Net: <b>{toNum6(net).toFixed(6)} USDC</b></div>
          <label style={{display:'flex', gap:8, marginTop:8}}>
            <input type="checkbox" checked={profitOnly} onChange={e=>setProfitOnly(e.target.checked)} />
            Profit-only
          </label>
        </div>
        <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:12}}>
          <button onClick={onClose}>Vazgeç</button>
          <button onClick={confirm} style={{background:'#000', color:'#fff', padding:'6px 10px', borderRadius:8}}>
            Onayla & Cash Out
          </button>
        </div>
      </div>
    </div>
  )
}


