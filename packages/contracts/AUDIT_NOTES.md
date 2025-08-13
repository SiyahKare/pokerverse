# Audit Notes (PR-001)

Kapsam: Bet.sol, ChipBank.sol, TreasuryVault.sol, LiquidityManager.sol

Özet Güçlendirmeler:
- ReentrancyGuard: Tüm external state-mutating fonksiyonlara eklendi (set* konfig fonksiyonları dahil kritiklerde).
- CEI: Transfer ve router etkileşimleri öncesi state güncellemeleri yapıldı; allowance reset uygulandı.
- Event kapsamı genişletildi: setDealer/setPol*, liquidity events; kritik state değişimleri izlenebilir.
- Idempotency guard:
  - Bet: `finalized[gid]` ile double-finalize engellendi.
  - ChipBank: `cashedOut[tid][player]` ile double-cashout engellendi.
- USDC 6 decimals: Bütün kesintiler floor (solidity division) ile hesaplanır; kalan toz sistemde kalır. Büyük miktarlarda ihmal edilebilir. Gerekirse ileride kalanları Vault’a bağışlama fonksiyonu eklenebilir.
- Game/Session FSM:
  - Bet: Waiting → InProgress → UnderInvestigation → Ended; propose/finalize require’larla korundu.
  - ChipBank: openSession → settle/settleSplit (balance aktarımı) → cashOutFull; double cash-out engeli.
- ERC-4626 decimals: TreasuryVault.decimals override edilerek OZ v5 uyumu teyit edildi.

Kalan Riskler / Varsayımlar:
- Dealer güvenliği: Bet.onlyDealer yetkisi multisig/role tabanlı olarak iyileştirilebilir (AccessControl).
- Investigation süreleri sabit; zincir tıkanıklığında opsiyon tanımlanabilir.
- ChipBank `settledOnce` sadece örnek amaçlı eklendi, aktif kullanılmıyor; çoklu el senaryoları için elde/handId bazlı guard ileride eklenebilir.
- Rounding: Kesinti ve dağıtım floor ile yapılır; net toplamdan sapma toz seviyesinde kalır.
- LiquidityManager: Router güvenliği dış protokol varsayımına dayanır; timelock/multisig ile `addLiquidity` çağrılarının güvenceye alınması önerilir.

Testler:
- `packages/contracts/test/security.audit.spec.ts`
  - Bet: double finalize revert, WinnerFinalized event assert.
  - ChipBank: double cashout revert, CashOut event assert.

Çalıştırma:
```
npm -w packages/contracts run build
npm -w packages/contracts run test
```


