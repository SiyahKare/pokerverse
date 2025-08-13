# Pokerverse — Web3 Texas Hold’em (MVP → V2)

USDC bazlı Texas Hold’em. Oyun sonu rake `TreasuryVault`’a, oturum bakiyesi `ChipBank`’te tutulur; masadan çıkışta (cash‑out) LP kesintisi uygulanır. Showdown/side‑pot motoru ve RainbowKit cüzdan akışıyla uçtan uca lokal demo hazır.

- Stack: Next.js/React/TS + wagmi/viem + RainbowKit, Node.js/Express/Socket.IO, Hardhat + OpenZeppelin
- Monorepo: `contracts` + `backend` + `frontend`

---

## ✨ Özellikler

- Socket.IO masa/lobi, 2 koltuk demo; turn timer + aksiyon FSM (check/bet/call/raise/fold)
- Oyun-bazlı pot, rake(bps) → ERC‑4626 `TreasuryVault` (NAV↑)
- V2 oturum ekonomisi: `ChipBank` ile oyuncu bakiyesi; cash‑out’ta LP kesintisi (%10 varsayılan)
- Side‑pot hesaplama + showdown evaluatörü (poker-evaluator) ile çoklu kazanan dağıtımı
- Dealer (oracle) ile `proposeWinner/finalizeWinner` (MVP); prod’da çok‑imzalı + imzalı mesaj akışı
- RainbowKit cüzdan modali; ChipBankPanel: Open Session, Winner rozeti, Profit‑Only toggle, Cash‑Out modal (önizlemeli)

---

## 📦 Monorepo Yapısı

```
pokerverse/
├─ README.md
├─ CHANGELOG.md
├─ ROADMAP.md
├─ TODO.md
├─ packages/
│  ├─ contracts/          # Hardhat: Bet.sol, TreasuryVault.sol, ChipBank.sol, LiquidityManager.sol, MockUSDC.sol
│  ├─ backend/            # Node TS + Express + Socket.IO + ethers + poker-evaluator
│  └─ frontend/           # Next.js + Tailwind + wagmi + viem + RainbowKit
```

---

## 🧱 Kontratlar (Özet)

- `Bet.sol`: oyun oluşturma/katılım, dealer ile `proposeWinner` → `finalizeWinner`; rake → `TreasuryVault`
- `TreasuryVault.sol`: ERC‑4626 sPOKER kasası (USDC 6d) — rake ile NAV↑
- `ChipBank.sol`: oturum bakiyeleri, `openSession`, `settle`/`settleSplit` (dealer), `cashOutFull` (oyuncu)
  - Parametreler: `polOnHandBps` (genelde 0), `polOnCashoutBps` (örn. 1000 = %10)
  - Olaylar: `SessionOpened`, `Settled`, `CashOut`, `SessionWinner`
- `LiquidityManager.sol`: POL toplayıcı (demo)
- `MockUSDC.sol`: 6 decimals test token

Derleme notu: `ChipBank` için IR optimizasyonu aktiftir (`viaIR: true`).

---

## ⚙️ Komutlar

- Kontratlar
  - `npm run contracts:build`
  - `npm -w packages/contracts run deploy:localhost`
  - `npm -w packages/contracts run export-abis` (Bet/TreasuryVault/ChipBank → backend & frontend)
  - (ops.) `npm -w packages/contracts run deploy:sepolia`
- Backend: `npm run backend:dev`
- Frontend: `npm run frontend:dev`
- Toplu CI (öneri): `npm -w packages/contracts run build && npm -w packages/contracts run test`

---

## 🚀 Lokal E2E (V2: Side‑Pot + ChipBank + Cash‑Out)

1) Local chain (1. terminal):
```bash
npm -w packages/contracts exec -- hardhat node
```
2) Build + Deploy + ABI export (2. terminal):
```bash
npm -w packages/contracts run build
npm -w packages/contracts run deploy:localhost
npm -w packages/contracts run export-abis
# konsoldan USDC / Vault / Bet / ChipBank adreslerini not et
```
3) Backend (dealer = Hardhat Account #1) (3. terminal):
```bash
PORT=3001 \
RPC_URL=http://127.0.0.1:8545 \
DEALER_PK=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d \
BET_ADDRESS=0x<BET> \
CHIPBANK_ADDRESS=0x<ChipBank> \
RAKE_BPS=100 \
npm run backend:dev
```
4) Frontend (4. terminal):
```bash
export NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
export NEXT_PUBLIC_USDC=0x<USDC>
export NEXT_PUBLIC_BET=0x<BET>
export NEXT_PUBLIC_CHIPBANK=0x<ChipBank>
export NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
export NEXT_PUBLIC_WC_PROJECT_ID=<WalletConnect_Project_ID>
npm run frontend:dev
# http://localhost:3000
```
5) UI akışı:
- Sağ üstten Connect → Lobby’den 2 koltuklu masa oluştur → iki cüzdanla Join
- ChipBankPanel → Open Session (10 USDC) (approve + openSession)
- Aksiyonlarla river’a gel → showdown; backend log’unda `onchain:settled` ve tx hash çıkar
- Winner için Cash Out → modalda LP kesinti (varsayılan %10) ve net önizleme → onayla

Notlar:
- SCALE = 1_000_000 (1 chip = 1 USDC, 6 decimals)
- Kart formatı: `As`, `Kd`, `Qc`, `Th` (rank uppercase + suit)

---

## 🔑 Ortam Değişkenleri (Özet)

Backend `.env`:
```
RPC_URL=...
PRIVATE_KEY=0x...
DEALER_PK=0x...
USDC_ADDRESS=0x...
VAULT_ADDRESS=0x...
BET_ADDRESS=0x...
CHIPBANK_ADDRESS=0x...
RAKE_BPS=100
PORT=3001
```

Frontend `.env.local`:
```
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_USDC=0x...
NEXT_PUBLIC_BET=0x...
NEXT_PUBLIC_CHIPBANK=0x...
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_WC_PROJECT_ID=<walletconnect_project_id>
```

---

## 🧭 Akış (Kısa)

```
Oyun (pot, rake) → Vault (NAV↑)
Oturum bakiyesi (ChipBank) → Cash‑Out (%LP kesinti) → Oyuncu & POL
```

## 🩺 Troubleshooting
## 🔐 Provably-Fair (Commit–Reveal RNG)
### Doğrulama & Rounding Politikası
- Side-pot ve dağıtım conservation: perSeat ödemeleri + totalRake toplamı, pot toplamına eşittir.
- Rake hesabı: `floor(pot * bps / 10_000)`; `rakeCap` varsa min alınır.
- Split artıkları (odd chips): default policy `lowestSeat` (küçük seat id’den başlayarak artan 1’ler dağıtılır).
- Tüm hesaplar USDC 6d varsayımıyla `bigint` olarak yapılır; modulo-bias engellenir.

Poker dağıtımı deterministiktir. Her el başlangıcında sunucu 32 bayt `seed` üretir ve `commit = keccak256(seed)` değerini yayınlar. El bitiminde `seed` açıklanır. İstemci, aşağıdaki adımlarla dağıtımı doğrulayabilir:

1) `seedHex` ile `shuffleDeck(seedHex)` (engine’deki Fisher–Yates + SHA-512 zinciri) çalıştır.
2) Üretilen 52 kartlık permütasyondan preflop/board dağıtımı tekrar kurulabilir.
3) Log doğrulama: structured log
```
{ "tableId": <id>, "handId": <hid>, "commit": "0x...", "seedHex": "0x...", "deckPermutationHash": "0x..." }
```

Örnek doğrulama komutu (Node REPL):
```
// seed ve commit
// commit == keccak256(seed) kontrolü
// shuffleDeckDeterministic(seed) ile ilk 5 kart/flop karşılaştırması
```


- Port çakışması (EADDRINUSE): eski süreçleri kapatın
  - `pkill -f "hardhat node"; pkill -f "tsx watch packages/backend/src/server.ts"; pkill -f "next dev"`
- ABI senkronizasyonu: deploy’dan sonra mutlaka `export-abis` ve backend restart
- `unknown fragment / event` hataları: eski ABI kullanımı → export + restart
- `ERR_MODULE_NOT_FOUND: .../ChipBank.json`: export-abis çalıştırılmamış ya da yanlış yol; script düzeltilmiştir
- `Stack too deep`: `viaIR: true` derleyici ayarı aktif

## 📄 Lisans

MIT
