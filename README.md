# Pokerverse — Web3 Texas Hold’em (MVP)

Web’den oynanabilen **Texas Hold’em** poker: **USDC buy-in**, **oyun-bazlı pot**, **rake → ERC-4626 kasası** (sPOKER).  
Amaç: rug’suz, gerçek gelirle (rake) **tokenize edilmiş kasa** modeli.

> Stack: **Next.js/React/TS + wagmi/viem**, **Node.js/Socket.IO**, **Hardhat + OpenZeppelin** (ERC-4626).

---

## ✨ Özellikler

- **Masa tabanlı** (2/4/6/9 oyuncu) No-Limit Texas Hold’em akışı
- **USDC buy-in** (ERC20 `approve` + `transferFrom`)
- **Pot izolasyonu** (her oyun kendi pot’unu tutar)
- **Rake (bps) → TreasuryVault (ERC-4626)**  
  Pay basmadan kasaya değer eklenir → **sPOKER NAV↑**
- **Dealer/Oracle finalize** (MVP) — prod’da multisig + imzalı oracle
- **Monorepo** (contracts + backend + frontend)

---

## 📦 Monorepo Yapısı

```

pokerverse/
packages/
contracts/        # Hardhat: Bet.sol, TreasuryVault.sol, MockUSDC.sol
backend/          # Node TS + Express + Socket.IO + ethers
frontend/         # Next.js + Tailwind + wagmi + viem

````

---

## 🧱 Kontratlar

- **Bet.sol**  
  - `createGame(limit, buyIn, feeBps)`  
  - `join(gameId)` → USDC escrow + `pot += buyIn`  
  - `proposeWinner(gameId, winner)` (dealer/oracle)  
  - `finalizeWinner(gameId)` → **payout** kazanana, **fee** → `TreasuryVault`
- **TreasuryVault.sol (ERC-4626 sPOKER)**  
  - Varlık: USDC (6 decimals)  
  - `donate(amount)` veya Bet’ten **transfer** ile kasa büyür (pay basılmadan NAV artar)
- **MockUSDC.sol** (lokal/test)

> **Güvenlik şeritleri:** `MAX_FEE_BPS = %2` (immutable), owner para çekemez (emergency sweep hariç), prod’da **Gnosis Safe + Timelock** önerilir.

---

## 🖥️ Backend

- **Node.js + Express + Socket.IO + ethers**
- Basit uçlar:
  - `POST /propose { gameId, winner }`
  - `POST /finalize { gameId }`
- Oda yayını: `table:{gameId}` → `winnerProposed`, `winnerFinalized`

---

## 🎛️ Frontend

- **Next.js + Tailwind + wagmi/viem**
- Lobby & masa ekranı (MVP)
- **Approve + Join** akışı (USDC → Bet.join)

---

## ⚙️ Kurulum (Hızlı Başlangıç)

1) **Klon + env**
```bash
cp .env.example .env
# RPC_URL, PRIVATE_KEY (deployer), DEALER_PK (backend) doldur
````

2. **Bağımlılıklar**

```bash
npm i
```

3. **Kontratları derle + deploy (Sepolia veya Hardhat)**

```bash
npm run contracts:build
npm run contracts:deploy
# çıktılardaki adresleri .env ve frontend env'e yaz
```

4. **Backend**

```bash
npm run backend:dev
```

5. **Frontend**

```bash
npm run frontend:dev
```

---

## 🔑 Ortam Değişkenleri

`.env` (örnek):

```
# Ortak
RPC_URL=https://sepolia.infura.io/v3/XXXX
PRIVATE_KEY=0xabc...        # deployer
DEALER_PK=0xabc...          # backend dealer/oracle

# Deploy sonrası
USDC_ADDRESS=0x...
VAULT_ADDRESS=0x...
BET_ADDRESS=0x...

# Backend
PORT=3001

# Frontend
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/XXXX
NEXT_PUBLIC_USDC=0x...
NEXT_PUBLIC_BET=0x...
```

---

## 🧪 Test & Lokal Zincir

* Hardhat local node:

```bash
npx hardhat node
# yeni terminal
npx hardhat run packages/contracts/scripts/deploy.js --network localhost
```

* Unit testler `packages/contracts/test/` altında (eklenecek).

---

## 🧭 Mimarî (Özet Akış)

```
Oyuncu ──(approve+join)──> Bet (pot↑) ──(finalize)──> payout→Winner
                                   └── fee(bps) ───> TreasuryVault (NAV↑)
```

* **Swap/MEV yok** (buy-in USDC) ⇒ sadelik ve güvenlik
* **Gerçek gelir** (rake) kasaya akar ⇒ **sPOKER sahipleri** değer kazanır

---

## 🛡️ Prod Notları

* Dealer/oracle → imzalı mesaj veya multisig’e taşı
* Parametre değişiklikleri → **Timelock + Gnosis Safe**
* RPC ve keeper (varsa) için rate-limit/gas izleme
* Log/monitoring: Sentry + Tenderly/Blockscout uyarıları

---

## 🗺️ Yol Haritası

* [ ] Socket.IO tur/side-pot motoru
* [ ] Split pot/showdown evaluatörü
* [ ] RainbowKit + tam cüzdan akışı
* [ ] Fuzz & invariants (Foundry) + kapsamlı testler
* [ ] DAO parametreleri + sPOKER görüntüleme UI

---

## ⚠️ Uyum

Bu repo **teknik MVP** içindir. Kumar & oyun mevzuatı her ülkeye göre farklıdır.
Dağıtım/işletim öncesi **yerel regülasyonlar** için hukuk kontrolü yapınız.

---

## 📄 Lisans

MIT

```
```
