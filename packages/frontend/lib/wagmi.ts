import { http } from 'wagmi'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import {
  hardhat,
  sepolia,
  baseSepolia,
  arbitrumSepolia,
  optimismSepolia,
  polygonAmoy,
} from 'viem/chains'

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID! // Reown/WC Project ID zorunlu

// RPC’leri env’den al (yoksa public endpoint’e düş)
const rpc = {
  hardhat: process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545',
  sepolia: process.env.NEXT_PUBLIC_RPC_SEPOLIA || 'https://sepolia.infura.io/v3/' + (process.env.NEXT_PUBLIC_INFURA_KEY || ''),
  baseSepolia: process.env.NEXT_PUBLIC_RPC_BASE_SEPOLIA || 'https://base-sepolia.g.alchemy.com/v2/' + (process.env.NEXT_PUBLIC_ALCHEMY_KEY || ''),
  arbitrumSepolia: process.env.NEXT_PUBLIC_RPC_ARB_SEPOLIA || 'https://arb-sepolia.g.alchemy.com/v2/' + (process.env.NEXT_PUBLIC_ALCHEMY_KEY || ''),
  optimismSepolia: process.env.NEXT_PUBLIC_RPC_OPT_SEPOLIA || 'https://opt-sepolia.g.alchemy.com/v2/' + (process.env.NEXT_PUBLIC_ALCHEMY_KEY || ''),
  polygonAmoy: process.env.NEXT_PUBLIC_RPC_POLYGON_AMOY || 'https://rpc-amoy.polygon.technology',
};

export const wagmiConfig = getDefaultConfig({
  appName: 'Pokerverse',
  projectId,
  // Sıra önemli: ilk zinciri varsayılan kabul eder (initialChain)
  chains: [baseSepolia, hardhat, sepolia, arbitrumSepolia, optimismSepolia, polygonAmoy],
  transports: {
    [baseSepolia.id]: http(rpc.baseSepolia),
    [hardhat.id]: http(rpc.hardhat),
    [sepolia.id]: http(rpc.sepolia),
    [arbitrumSepolia.id]: http(rpc.arbitrumSepolia),
    [optimismSepolia.id]: http(rpc.optimismSepolia),
    [polygonAmoy.id]: http(rpc.polygonAmoy),
  },
  ssr: true,
})
