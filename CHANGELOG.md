# Changelog

Tüm anlamlı değişiklikler bu dosyada listelenir.

## 0.2.0 — V2: ChipBank + Side‑Pot + RainbowKit
- ChipBank.sol eklendi: `openSession`, `settle`/`settleSplit`, `cashOutFull`, `sessionWinner`
- Cash‑out’ta LP kesintisi (vars. %10) — `polOnCashoutBps`
- Backend: showdown sonrası `settleSplit` on-chain çağrısı; Socket.IO event’leri (`onchain:settled`)
- Poker motoru: kart dağıtımı, board yönetimi, side‑pot hesaplama, showdown evaluatörü
- Frontend: ChipBankPanel (Winner badge, profit-only toggle, Cash‑Out modal), RainbowKit Connect
- ABI export script’i kök yollara göre düzeltildi; ChipBank ABIs frontend/backend’e kopyalanıyor
- Hardhat optimizer `viaIR: true` (ChipBank “stack too deep” fix)

## 0.1.1 — LP (POL) entegrasyonu
- Bet.sol dağıtım ve event’ler güncellendi; POL kesintisi alanı eklendi (dev senaryosu)
- LiquidityManager.sol demo sözleşmesi eklendi

## 0.1.0 — MVP
- Monorepo: `contracts`, `backend`, `frontend`
- Kontratlar: `Bet.sol`, `TreasuryVault.sol` (ERC-4626), `MockUSDC.sol`
- Hardhat yapılandırması: PRIVATE_KEY opsiyonel; `localhost`/`sepolia`
- Backend: Express + Socket.IO, propose/finalize uçları
- Frontend: Approve + Join (wagmi/viem), basit sayfa
- ABI export script: `packages/contracts/scripts/export-abis.mjs`
- Seed script: oyunculara USDC + `game#0`


