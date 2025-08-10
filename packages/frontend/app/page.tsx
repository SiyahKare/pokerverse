"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits, zeroAddress } from "viem";
import { ConnectButton } from '@rainbow-me/rainbowkit'
import io from 'socket.io-client'
import BetABI from "../abis/Bet.json";
import ERC20 from "../abis/ERC20.json"; // indir: OZ ERC20 ABI (minimal approve)
import ChipBankABI from "../abis/ChipBank.json";
import TableCanvas from "./components/TableCanvas";
import HelpModal from "./components/HelpModal";

const BET = process.env.NEXT_PUBLIC_BET as `0x${string}`;
const USDC = process.env.NEXT_PUBLIC_USDC as `0x${string}`;
const CHIPBANK = process.env.NEXT_PUBLIC_CHIPBANK as `0x${string}`;
const TABLE_ID = 0n; // MVP sabit

const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001')

export function ChipBankPanel() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: txPending, isSuccess: txOk } = useWaitForTransactionReceipt({ hash });

  const { data: chipBal } = useReadContract({
    abi: ChipBankABI as any,
    address: CHIPBANK,
    functionName: "balances",
    args: [TABLE_ID, address ?? zeroAddress],
    query: { enabled: !!address },
  });

  const { data: deposit } = useReadContract({
    abi: ChipBankABI as any,
    address: CHIPBANK,
    functionName: "deposits",
    args: [TABLE_ID, address ?? zeroAddress],
    query: { enabled: !!address },
  });

  const { data: polOnCashoutBps } = useReadContract({
    abi: ChipBankABI as any,
    address: CHIPBANK,
    functionName: "polOnCashoutBps",
  });

  // Winner badge & winner-only cash-out kuralı
  const { data: sessionWinner } = useReadContract({
    abi: ChipBankABI as any,
    address: CHIPBANK,
    functionName: "sessionWinner",
    args: [TABLE_ID],
  });
  const isWinner = !!address && (sessionWinner as string | undefined)?.toLowerCase?.() === address.toLowerCase();

  const [open, setOpen] = useState(false);
  const [profitOnly, setProfitOnly] = useState(false);
  const onlyWinnerMode = true;
  const bal = (chipBal as bigint) ?? 0n;
  const dep = (deposit as bigint) ?? 0n;
  const bps = BigInt(Number(polOnCashoutBps ?? 0));
  const balStr = useMemo(() => formatUnits(bal, 6), [bal]);
  const depStr = useMemo(() => formatUnits(dep, 6), [dep]);

  // Tahmini kesinti & net (UI önizleme)
  const grossCut = (bal * bps) / 10000n;
  const profit = bal > dep ? bal - dep : 0n;
  const profitCut = (profit * bps) / 10000n;
  const lpEst = profitOnly ? profitCut : grossCut;
  const netEst = bal > lpEst ? bal - lpEst : 0n;

  const openSession = async (amountUSDC = "10") => {
    const amt = parseUnits(amountUSDC, 6);
    await writeContract({ abi: (ERC20 as any).abi ?? (ERC20 as any), address: USDC, functionName: "approve", args: [CHIPBANK, amt] });
    await writeContract({ abi: ChipBankABI as any, address: CHIPBANK, functionName: "openSession", args: [TABLE_ID, amt] });
  };

  const cashOut = async () => {
    await writeContract({
      abi: ChipBankABI as any,
      address: CHIPBANK,
      functionName: "cashOutFull",
      args: [TABLE_ID, onlyWinnerMode, profitOnly],
    });
    setOpen(false);
  };

  return (
    <section className="mt-6 border rounded p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">ChipBank</h2>
        {isWinner && <span className="text-xs px-2 py-1 rounded-full bg-emerald-600 text-white">Winner</span>}
      </div>
      {!isConnected ? <div>Cüzdan bağlayın.</div> : (
        <>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Table #{Number(TABLE_ID)}</div>
            <div>Chip Balance: <b>{balStr} USDC</b></div>
            <div>Deposits: {depStr} USDC</div>
            <div>LP on cash-out: {(Number(bps)/100).toFixed(2)}%</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-1 rounded bg-gray-200" disabled={txPending} onClick={() => openSession("10")}>
              Open Session (10 USDC)
            </button>
            <button
              className="px-3 py-1 rounded bg-black text-white disabled:opacity-40"
              disabled={txPending || (onlyWinnerMode && !isWinner) || bal === 0n}
              onClick={() => setOpen(true)}
            >
              Cash Out
            </button>
          </div>
          <label className="mt-1 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={profitOnly} onChange={e=>setProfitOnly(e.target.checked)} />
            Profit-only modu (LP sadece kâr üzerinden)
          </label>

          {open && (
            <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
              <div className="bg-white rounded-2xl p-4 w-full max-w-md shadow-xl">
                <h3 className="text-lg font-semibold mb-2">Cash Out Önizleme</h3>
                <div className="text-sm space-y-1">
                  <div>Balance: <b>{formatUnits(bal,6)} USDC</b></div>
                  <div>Deposits: {formatUnits(dep,6)} USDC</div>
                  <div>LP Cut ({(Number(bps)/100).toFixed(2)}% {profitOnly ? "profit-only" : "gross"}): <b>{formatUnits(lpEst,6)} USDC</b></div>
                  <div>Net Alınacak: <b>{formatUnits(netEst,6)} USDC</b></div>
                  {onlyWinnerMode && !isWinner && (
                    <div className="text-red-600 mt-1">Sadece “Winner” cash-out yapabilir.</div>
                  )}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button className="px-3 py-1 rounded bg-gray-200" onClick={()=>setOpen(false)}>Vazgeç</button>
                  <button
                    className="px-3 py-1 rounded bg-black text-white disabled:opacity-40"
                    disabled={txPending || (onlyWinnerMode && !isWinner) || bal===0n}
                    onClick={cashOut}
                  >
                    Onayla & Cash Out
                  </button>
                </div>
              </div>
            </div>
          )}
          {txPending && <div className="text-xs">İşlem gönderiliyor...</div>}
          {txOk && <div className="text-xs break-all">Tx: {hash}</div>}
        </>
      )}
    </section>
  );
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  const [gid] = useState<bigint>(0n);
  const buyIn = parseUnits("10", 6);
  const [tables, setTables] = useState<any[]>([])
  const [table, setTable] = useState<any>(null)
  const [seat, setSeat] = useState<number | null>(null)

  const approve = () =>
    writeContract({ abi: (ERC20 as any).abi ?? (ERC20 as any), address: USDC, functionName: "approve", args: [BET, buyIn] });

  const join = () =>
    writeContract({ abi: (BetABI as any).abi ?? (BetABI as any), address: BET, functionName: "join", args: [gid] });

  useEffect(() => {
    socket.emit('joinLobby')
    socket.on('tableCreated', (t:any) => setTables(prev => [...prev, t]))
    socket.on('tableState', (t:any) => { setTable(t); setTables(prev => prev.map(x => x.id===t.id? t : x)) })
    socket.on('turn', ({ seat, deadline }) => console.log('turn', seat, deadline))
    socket.on('action:applied', (msg:any) => console.log('applied', msg))
    socket.on('handStart', (msg:any) => console.log('handStart', msg))
    socket.on('street', (msg:any) => console.log('street', msg))
    socket.on('handEnd', (msg:any) => console.log('handEnd', msg))
    return () => { socket.off() }
  }, [])

  const createTable = () => socket.emit('createTable', 2, (res:any)=>{ setTable(res.table) })
  const joinTable = (id:number) => socket.emit('joinTable', id, address, (res:any)=>{ console.log(res); setSeat(res.seat) })
  const send = (kind: "check"|"bet"|"call"|"raise"|"fold", amount?: number) =>
    socket.emit('action', table.id, seat, { kind, amount }, (res:any)=> console.log(res))

  // Canvas props
  const seatsProp = [...Array(9)].map((_,i)=>({
    seat: i,
    name: table?.players?.[i]?.addr ? `P${i+1}` : `Seat ${i+1}`,
    stack: table?.players?.[i]?.stack ?? 0,
    isTurn: table?.turnSeat === i,
    isSitting: !!table?.players?.[i],
  }))
  const myCards: Record<number, string[]> = (seat !== null)
    ? { [seat]: table?.holes?.[seat] ?? [] }
    : {}

  return (
    <main className="p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Pokerverse MVP</h1>
        <ConnectButton />
      </div>
      {!isConnected ? (
        <p>Cüzdan bağlayın (RainbowKit ekleyebiliriz).</p>
      ) : (
        <>
          <div className="mb-2 text-sm text-gray-600">Adres: {address}</div>
          <section className="border rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Lobby</h2>
              <button className="px-3 py-1 rounded bg-gray-200" onClick={createTable}>Create 2-seat</button>
            </div>
            <ul className="space-y-2">
              {tables.map((t:any) => (
                <li key={t.id} className="flex items-center justify-between border rounded p-2">
                  <span>Table #{t.id} • seats {t.players?.length ?? 0}/{t.seats}</span>
                  <button className="px-3 py-1 rounded bg-black text-white" onClick={()=>joinTable(t.id)}>Join</button>
                </li>
              ))}
            </ul>
          </section>
          {table && seat !== null && (
            <div className="flex gap-2 mt-2">
              <button onClick={()=>send("check")} className="px-3 py-1 bg-gray-200 rounded">Check</button>
              <button onClick={()=>send("call")} className="px-3 py-1 bg-gray-200 rounded">Call</button>
              <button onClick={()=>send("bet", 20)} className="px-3 py-1 bg-gray-200 rounded">Bet 20</button>
              <button onClick={()=>send("raise", 20)} className="px-3 py-1 bg-gray-200 rounded">Raise 20</button>
              <button onClick={()=>send("fold")} className="px-3 py-1 bg-red-600 text-white rounded">Fold</button>
            </div>
          )}

          {/* Canvas container center */}
          <div className="w-full flex items-center justify-center">
            <div className="w-full max-w-[1280px]">
              <TableCanvas
                className="mx-auto"
                seats={seatsProp}
                potAmount={Number(table?.pot ?? 0)}
                communityCards={(table?.board ?? []).map((c:string)=>c)}
                playerCards={myCards}
                lastAction={table?.lastAction ?? null}
              />
            </div>
          </div>
          <ChipBankPanel />
          <div className="flex gap-3">
            <button className="px-4 py-2 rounded bg-gray-200" onClick={approve} disabled={isLoading}>
              Approve USDC (10)
            </button>
            <button className="px-4 py-2 rounded bg-black text-white" onClick={join} disabled={isLoading}>
              Join Game #{Number(gid)}
            </button>
          </div>
          {isLoading && <div className="mt-3 text-sm">Tx gönderiliyor...</div>}
          {isSuccess && <div className="mt-3 text-sm break-all">Tx: {hash}</div>}
        </>
      )}
    </main>
      <HelpModal />
  );
}


