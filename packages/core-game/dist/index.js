export * from './types';
// Lightweight deterministic PRNG (xorshift32) for browser-safe sync use
function djb2Hex(seedHex) {
    const s = seedHex.replace(/^0x/, '');
    let hash = 5381;
    for (let i = 0; i < s.length; i++)
        hash = ((hash << 5) + hash) ^ s.charCodeAt(i);
    return hash >>> 0;
}
function* xs32(seedHex) {
    let x = djb2Hex(seedHex) || 123456789;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        yield (x >>> 0);
    }
}
export function deterministicShuffle(seedHex, deck) {
    const g = xs32(seedHex);
    const d = deck.slice();
    for (let i = d.length - 1; i > 0; i--) {
        const j = Number(g.next().value % (i + 1));
        const tmp = d[i];
        d[i] = d[j];
        d[j] = tmp;
    }
    return d;
}
export function computePots(bets) {
    const active = bets.filter(b => b.contributed > 0n);
    if (active.length === 0)
        return [];
    const caps = Array.from(new Set(active.map(b => b.contributed))).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    const pots = [];
    let prev = 0n;
    for (const cap of caps) {
        const eligible = active.filter(b => b.contributed >= cap).map(b => b.seat).sort((a, b) => a - b);
        if (eligible.length < 2)
            continue;
        let layer = 0n;
        for (const b of active) {
            if (b.contributed > prev) {
                const add = (b.contributed < cap ? b.contributed : cap) - prev;
                if (add > 0n)
                    layer += add;
            }
        }
        if (layer > 0n)
            pots.push({ amount: layer, eligibleSeats: eligible });
        prev = cap;
    }
    return pots;
}
export function distributeWinnings(pots, winnersByRank, rakeBps, rakeCap, oddChipPolicy = "lowestSeat", rngSeed) {
    const perSeat = Object.create(null);
    let totalRake = 0n;
    const orderSeats = (arr) => {
        if (oddChipPolicy === "lowestSeat")
            return [...arr].sort((a, b) => a - b);
        if (oddChipPolicy === "highestSeat")
            return [...arr].sort((a, b) => b - a);
        const seed = (rngSeed ?? 1) | 0;
        return [...arr].sort((a, b) => ((a * 1103515245 + seed) >>> 0) % 97 - ((b * 1103515245 + seed) >>> 0) % 97);
    };
    for (const pot of pots) {
        let amount = pot.amount;
        let rake = (amount * BigInt(rakeBps)) / 10000n;
        if (rakeCap !== undefined && rake > rakeCap)
            rake = rakeCap;
        if (rake > 0n) {
            totalRake += rake;
            amount -= rake;
        }
        const eligibleSet = new Set(pot.eligibleSeats);
        let winners = [];
        for (const group of winnersByRank) {
            const inter = group.filter(seat => eligibleSet.has(seat));
            if (inter.length > 0) {
                winners = inter;
                break;
            }
        }
        if (winners.length === 0)
            continue;
        const share = amount / BigInt(winners.length);
        let rem = amount - share * BigInt(winners.length);
        for (const seat of winners)
            perSeat[seat] = (perSeat[seat] ?? 0n) + share;
        for (const seat of orderSeats(winners)) {
            if (rem === 0n)
                break;
            perSeat[seat] = (perSeat[seat] ?? 0n) + 1n;
            rem -= 1n;
        }
    }
    return { perSeat, totalRake };
}
