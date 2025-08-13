export type Bet = { seat: number; contributed: bigint; allIn: boolean };
export type Pot = { amount: bigint; eligibleSeats: number[] };

function uniqueSortedCaps(bets: Bet[]): bigint[] {
  const caps = Array.from(new Set(bets.filter(b => b.contributed > 0n).map(b => b.contributed))).sort((a,b)=> (a<b?-1:a>b?1:0));
  return caps;
}

export function computePots(bets: Bet[]): Pot[] {
  const active = bets.filter(b => b.contributed > 0n);
  if (active.length === 0) return [];
  const caps = uniqueSortedCaps(active);
  const pots: Pot[] = [];
  let prev = 0n;
  for (const cap of caps) {
    const eligible = active.filter(b => b.contributed >= cap).map(b => b.seat).sort((a,b)=>a-b);
    if (eligible.length < 2) continue; // tek kişi eligible ise o seviyeden pot oluşmaz
    let layer = 0n;
    for (const b of active) {
      if (b.contributed > prev) {
        const add = (b.contributed < cap ? b.contributed : cap) - prev;
        if (add > 0n) layer += add;
      }
    }
    if (layer > 0n) pots.push({ amount: layer, eligibleSeats: eligible });
    prev = cap;
  }
  // Conservation: Eğer son seviyede eligible<2 nedeniyle katkılar hariç kaldıysa, prev en büyük iki katkı eşit olmalı ki kayıp olmasın.
  return pots;
}

type OddPolicy = "lowestSeat"|"highestSeat"|"randomSeeded";

export function distributeWinnings(
  pots: Pot[],
  winnersByRank: number[][],
  rakeBps: number,
  rakeCap?: bigint,
  oddChipPolicy: OddPolicy = "lowestSeat",
  rngSeed?: number
) {
  const perSeat: Record<number, bigint> = Object.create(null);
  let totalRake = 0n;

  const orderSeats = (arr: number[]) => {
    if (oddChipPolicy === "lowestSeat") return [...arr].sort((a,b)=>a-b);
    if (oddChipPolicy === "highestSeat") return [...arr].sort((a,b)=>b-a);
    // randomSeeded deterministik: linear-congruential basit sıralama anahtarı
    const seed = (rngSeed ?? 1) | 0;
    return [...arr].sort((a,b)=>((a*1103515245+seed)>>>0)%97 - ((b*1103515245+seed)>>>0)%97);
  };

  for (const pot of pots) {
    let amount = pot.amount;
    // rake
    let rake = (amount * BigInt(rakeBps)) / 10_000n;
    if (rakeCap !== undefined && rake > rakeCap) rake = rakeCap;
    if (rake > 0n) { totalRake += rake; amount -= rake; }

    // bu pottan pay alabilecek en yüksek sıradaki kazanan grubu bul
    const eligibleSet = new Set(pot.eligibleSeats);
    let winners: number[] = [];
    for (const group of winnersByRank) {
      const inter = group.filter(seat => eligibleSet.has(seat));
      if (inter.length > 0) { winners = inter; break; }
    }
    if (winners.length === 0) continue; // kimse kalmadı

    const share = amount / BigInt(winners.length);
    let rem = amount - share * BigInt(winners.length);
    for (const seat of winners) perSeat[seat] = (perSeat[seat] ?? 0n) + share;
    for (const seat of orderSeats(winners)) {
      if (rem === 0n) break;
      perSeat[seat] = (perSeat[seat] ?? 0n) + 1n;
      rem -= 1n;
    }
  }

  return { perSeat, totalRake };
}


