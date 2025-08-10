import { createPublicClient, createWalletClient, custom, http, parseUnits, formatUnits } from 'viem'
import { hardhat, sepolia } from 'viem/chains'
import ChipBank from './abis/ChipBank.json'
import ERC20 from './abis/ERC20.json'
import addresses from './addresses.json'
import EthereumProvider from '@walletconnect/ethereum-provider'

const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 31337)
const RPC_URL = import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545'
const WC_PROJECT_ID = import.meta.env.VITE_WC_PROJECT_ID || ''

const chain = CHAIN_ID === 11155111 ? sepolia : hardhat
const ADDR: any = (addresses as any)[CHAIN_ID] || {}
const USDC = (import.meta.env.VITE_USDC as `0x${string}`) || (ADDR.USDC as `0x${string}`)
const CHIP = (import.meta.env.VITE_CHIPBANK as `0x${string}`) || (ADDR.CHIPBANK as `0x${string}`)

export const publicClient = createPublicClient({ chain, transport: http(RPC_URL) })

let provider: any
let walletClient: any
let account: `0x${string}` | undefined

export async function connectWC() {
  if (walletClient && account) return account
  provider = await EthereumProvider.init({
    projectId: WC_PROJECT_ID,
    chains: [CHAIN_ID],
    showQrModal: true,
    rpcMap: { [CHAIN_ID]: RPC_URL },
  })
  await provider.enable()
  walletClient = createWalletClient({ chain, transport: custom(provider as any) })
  const [addr] = await walletClient.getAddresses()
  account = addr
  return addr as `0x${string}`
}

export function getAccount() { return account }

export async function getChipBalance(tableId: bigint) {
  const who = account ?? ('0x0000000000000000000000000000000000000000' as const)
  const bal = await publicClient.readContract({
    abi: ChipBank as any,
    address: CHIP,
    functionName: 'balances',
    args: [tableId, who],
  })
  return formatUnits(bal as bigint, 6)
}

export async function approveUSDC(amount: string) {
  if (!account) await connectWC()
  const amt = parseUnits(amount, 6)
  return walletClient.writeContract({
    abi: ERC20 as any,
    address: USDC,
    functionName: 'approve',
    args: [CHIP, amt],
    account,
  })
}

export async function openSession(tableId: bigint, amount: string) {
  if (!account) await connectWC()
  const amt = parseUnits(amount, 6)
  return walletClient.writeContract({
    abi: ChipBank as any,
    address: CHIP,
    functionName: 'openSession',
    args: [tableId, amt],
    account,
  })
}

export async function cashOutFull(tableId: bigint, onlyWinner = true, profitOnly = false) {
  if (!account) await connectWC()
  return walletClient.writeContract({
    abi: ChipBank as any,
    address: CHIP,
    functionName: 'cashOutFull',
    args: [tableId, onlyWinner, profitOnly],
    account,
  })
}


