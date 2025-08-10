"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import BetABI from "../abis/Bet.json";
import ERC20 from "../abis/ERC20.json"; // indir: OZ ERC20 ABI (minimal approve)

const BET = process.env.NEXT_PUBLIC_BET as `0x${string}`;
const USDC = process.env.NEXT_PUBLIC_USDC as `0x${string}`;

export default function Home() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  const [gid] = useState<bigint>(0n);
  const buyIn = parseUnits("10", 6);

  const approve = () =>
    writeContract({ abi: ERC20 as any, address: USDC, functionName: "approve", args: [BET, buyIn] });

  const join = () =>
    writeContract({ abi: BetABI as any, address: BET, functionName: "join", args: [gid] });

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Pokerverse MVP</h1>
      {!isConnected ? (
        <p>Cüzdan bağlayın (RainbowKit ekleyebiliriz).</p>
      ) : (
        <>
          <div className="mb-2 text-sm text-gray-600">Adres: {address}</div>
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
  );
}


