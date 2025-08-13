export * from './types';
export declare function deterministicShuffle(seedHex: string, deck: string[]): string[];
export type Bet = {
    seat: number;
    contributed: bigint;
    allIn: boolean;
};
export type Pot = {
    amount: bigint;
    eligibleSeats: number[];
};
export declare function computePots(bets: Bet[]): Pot[];
type OddPolicy = "lowestSeat" | "highestSeat" | "randomSeeded";
export declare function distributeWinnings(pots: Pot[], winnersByRank: number[][], rakeBps: number, rakeCap?: bigint, oddChipPolicy?: OddPolicy, rngSeed?: number): {
    perSeat: Record<number, bigint>;
    totalRake: bigint;
};
