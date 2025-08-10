# TODO

Güncel kısa liste; geniş kapsam için `ROADMAP.md`.

## Frontend
- [ ] ChipBankPanel: socket `onchain:settled` ile otomatik refresh
- [ ] Allowance kontrolü; approve miktarını dinamik belirleme
- [ ] Winner badge’in masa listesinde görünmesi
- [ ] Cash‑out modal: tx state (pending/success/error) ve hata banner’ı
- [ ] Board/Deal/Showdown event’lerini UI’da göstermek

## Backend
- [ ] `/health` ve `/addr` (Bet/ChipBank adresleri, RAKE_BPS)
- [ ] Showdown → settleSplit retry/backoff, log seviyeleri
- [ ] Event relay: finalize summary + LP kesinti özetleri

## Contracts
- [ ] `ChipBank` unit testleri: open→settle→cashOutFull, onlyWinner/profitOnly, bps tavanı, auth
- [ ] `Bet` testleri: feeBps=0/polBps=0 sınırları, setPolBps ceiling revert, dağıtım korunumu, multi-game izolasyon, rounding/dust

## DX/CI
- [ ] `contracts:build` sonrası otomatik `export-abis`
- [ ] Husky + lint-staged (solhint/eslint/markdownlint)
- [ ] CI: contracts build+test; frontend build; backend lint/test (ops.)


