# Roadmap

Kısa/orta/uzun vadeli hedefler.

## Kısa Vadede
- Frontend
  - ChipBankPanel iyileştirmeleri: anlık socket refresh, allowance kontrolü, hata banner’ları
  - Winner badge’in masa UI’da da görünmesi; showdown özetleri
  - Cash‑out modalında imza/tx durum göstergesi
- Backend
  - `/health`, `/addr` uçları; yapılandırma introspection
  - WS auth rollout: JWT refresh endpoint, Redis cluster, nonce rotation
  - Showdown → settleSplit akışında retry/backoff ve metrikler
  - Event relay geliştirmeleri (finalize summary, LP cut)
- Contracts
  - `ChipBank` unit testleri: open→settle→cashOutFull, onlyWinner/profitOnly varyasyonları, bps tavanları
  - `Bet` testleri: feeBps/polBps sınırları, dağıtım (korunum), multi-game izolasyon, yuvarlama/dust
- DX/CI
  - ABI sync otomasyonu: `contracts:build` → `export-abis` zinciri
  - Husky + lint-staged; solhint/ts/markdown lint
  - CI: contracts build+test, frontend build, backend lint+test; Security CI (Semgrep/CodeQL)

## Orta Vadede
- Foundry fuzz/invariants; property-based testler
- Oracle/Dealer imza akışı (EIP-712), çok‑imzalı finalize
- Tenderly/Blockscout: event izleme, simülasyon; Sentry/logging entegrasyonu
- sPOKER Analytics: NAV grafikleri, fee gelirleri, LP akışı
 - MiniApp: Provably‑Fair doğrulama UI (seed/commit görüntüleme ve yerel doğrulama)

## Uzun Vadede
- Çoklu masa yönetimi, turnuva modu (SNG/MTT)
- Treasury stratejileri (opsiyonel getiri)
- Mobil UX iyileştirmeleri ve PWA
 - L2 dağıtımları ve çok‑zincir destek (Base/OP/Arb)


