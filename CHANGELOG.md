# Changelog

Tüm anlamlı değişiklikler bu dosyada listelenir.

## 0.4.0 — Security Hardening (PR-004)
- WS handshake: JWT + nonce (jti) zorunlu, Redis `SETNX` ile replay guard
- Telegram MiniApp `initData` HMAC-SHA256 server-side doğrulama → kısa ömürlü JWT
- Rate-limit (token bucket): join/action/buyin için burst/refill değerleri
- Structured logs: `{type, userId, tableId, handId, action, amount, jti}`
- Unit testler: JWT doğrulama/expiry, replay ve rate-limit; dökümantasyon güncellendi

## 0.3.0 — Provably‑Fair RNG + Side‑Pot Testleri (PR‑002, PR‑003)
- Deterministik dağıtım: `shuffleDeckDeterministic(seed)` (SHA‑512 chain + bias rejection)
- Commit–reveal: `commit = keccak256(seed)` yayın, el sonunda seed reveal; structured log’lar
- Side‑pot modülü: `packages/backend/src/engine/pots.ts` (saf `bigint` hesaplar)
- Rounding politikası: USDC 6d, `floor` + odd chips `lowestSeat`; rake cap desteği
- Property‑based testler (vitest + fast‑check) ve Foundry invariant iskeleti

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


