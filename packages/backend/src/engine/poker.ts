// Minimal Texas Hold'em betting FSM (no evaluator/side-pot yet)
import { Server } from "socket.io";
import { evalHand } from 'poker-evaluator';

export type Addr = `0x${string}`;
export type ActionKind = "check" | "bet" | "call" | "raise" | "fold";
export type Street = "preflop" | "flop" | "turn" | "river";

export interface Player {
  socketId: string;
  addr: Addr;
  seat: number;
  stack: number;         // chips (server-side, start = buy-in)
  inHand: boolean;       // folded or not
  committed: number;     // chips committed this hand (for pot calc)
  actedThisRound: boolean;
}

export interface Table {
  id: number;
  seats: number;
  smallBlind: number;
  bigBlind: number;
  sbPos: number; // seat index of SB
  bbPos: number; // seat index of BB
  players: Player[];
  started: boolean;

  // Hand state
  street: Street;
  pot: number;
  currentBet: number;     // amount to match in this betting round
  minRaise: number;       // min raise size
  turnSeat: number;       // whose turn (seat index)
  lastAggressorSeat: number | null;
  turnTimer?: NodeJS.Timeout;
  turnDeadline?: number;  // epoch ms
  // cards
  deck: string[];
  board: string[];
  holes: Record<number, string[]>;
}

export interface Action {
  kind: ActionKind;
  amount?: number; // for bet/raise
}

export const PER_TURN_MS = 15_000;

// Cards & deck helpers
type Suit = 'c'|'d'|'h'|'s';
const RANKS = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'] as const;
const SUITS: Suit[] = ['c','d','h','s'];
function makeDeck(): string[] {
  const d: string[] = [];
  for (const r of RANKS) for (const s of SUITS) d.push(r+s);
  for (let i=d.length-1;i>0;i--) { const j = Math.floor(Math.random()*(i+1)); [d[i],d[j]] = [d[j],d[i]]; }
  return d;
}
function deal(deck: string[], n: number): string[] { return deck.splice(0, n); }

// Hooks (server callbacks)
export interface Hooks {
  onHandEnd?: (tableId: number, winnerAddr: string) => void;
  onShowdown?: (tableId: number, winnersBySeat: Map<number, number>, losers: number[], amounts: number[]) => void;
}
let hooks: Hooks = {};
export function setHooks(h: Hooks) { hooks = h; }

function nextSeat(t: Table, from: number): number {
  const n = t.players.length;
  for (let i = 1; i <= n; i++) {
    const idx = (from + i) % n;
    if (t.players[idx]?.inHand && t.players[idx].stack >= 0) return idx;
  }
  return from;
}

function aliveCount(t: Table): number {
  return t.players.filter(p => p.inHand).length;
}

function moveToNextStreet(t: Table) {
  t.players.forEach(p => { p.actedThisRound = false; p.committed = p.committed; });
  t.currentBet = 0;
  t.minRaise = t.bigBlind;

  if (t.street === "preflop") t.street = "flop";
  else if (t.street === "flop") t.street = "turn";
  else if (t.street === "turn") t.street = "river";
  else t.street = "river"; // cap
  // board dealing
  if (t.street === "flop") { t.board = deal(t.deck, 3); }
  else if (t.street === "turn" || t.street === "river") { t.board.push(...deal(t.deck,1)); }
}

function everyoneMatched(t: Table): boolean {
  const need = t.currentBet;
  return t.players
    .filter(p => p.inHand)
    .every(p => p.actedThisRound && (p.committed === need || p.stack === 0));
}

function resetTurnTimer(io: Server, t: Table) {
  if (t.turnTimer) clearTimeout(t.turnTimer);
  t.turnDeadline = Date.now() + PER_TURN_MS;
  const seat = t.turnSeat;
  t.turnTimer = setTimeout(() => {
    // auto-fold on timeout
    const p = t.players[seat];
    if (p && p.inHand) {
      p.inHand = false;
      io.to(`table:${t.id}`).emit("action:applied", { seat, kind: "fold", timeout: true });
      onPostAction(io, t);
    }
  }, PER_TURN_MS);
}

function startTurn(io: Server, t: Table) {
  // skip folded/all-in players
  if (!t.players[t.turnSeat]?.inHand || t.players[t.turnSeat].stack === 0) {
    t.turnSeat = nextSeat(t, t.turnSeat);
    return startTurn(io, t);
  }
  resetTurnTimer(io, t);
  io.to(`table:${t.id}`).emit("turn", { seat: t.turnSeat, deadline: t.turnDeadline });
}

function startHand(io: Server, t: Table) {
  t.started = true;
  t.street = "preflop";
  t.pot = 0;
  t.currentBet = t.bigBlind;
  t.minRaise = t.bigBlind;

  // all players enter the hand
  t.players.forEach(p => { p.inHand = true; p.committed = 0; p.actedThisRound = false; });

  // blinds
  const sb = t.players[t.sbPos];
  const bb = t.players[t.bbPos];
  const postSB = Math.min(sb.stack, t.smallBlind);
  const postBB = Math.min(bb.stack, t.bigBlind);
  sb.stack -= postSB; sb.committed = postSB; t.pot += postSB;
  bb.stack -= postBB; bb.committed = postBB; t.pot += postBB;

  // first to act preflop = UTG (after BB)
  t.turnSeat = nextSeat(t, t.bbPos);
  t.lastAggressorSeat = t.bbPos;

  io.to(`table:${t.id}`).emit("handStart", {
    tableId: t.id, sbPos: t.sbPos, bbPos: t.bbPos, street: t.street,
    pot: t.pot, currentBet: t.currentBet
  });
  // init deck & deal holes
  t.deck = makeDeck();
  t.board = [];
  t.holes = {} as Record<number, string[]>;
  for (const p of t.players) { t.holes[p.seat] = deal(t.deck, 2); }
  io.to(`table:${t.id}`).emit("deal", { holes: Object.fromEntries(t.players.map(p=>[p.seat, t.holes[p.seat]])) });
  startTurn(io, t);
}

function endHandWithWinner(io: Server, t: Table, winnerSeat: number) {
  if (t.turnTimer) clearTimeout(t.turnTimer);
  const winner = t.players[winnerSeat];
  winner.stack += t.pot; // simple: whole pot to last player (no side-pot yet)
  io.to(`table:${t.id}`).emit("handEnd", {
    winnerSeat, winner: winner.addr, amount: t.pot,
    table: publicTable(t)
  });
  // notify server to optionally finalize on-chain
  try { hooks.onHandEnd?.(t.id, winner.addr as any); } catch {}
  // rotate blinds
  t.sbPos = (t.sbPos + 1) % t.players.length;
  t.bbPos = (t.bbPos + 1) % t.players.length;
  // auto start next hand after small delay
  setTimeout(() => startHand(io, t), 1500);
}

function onPostAction(io: Server, t: Table) {
  // if only one player remains -> hand ends
  if (aliveCount(t) === 1) {
    const seat = t.players.findIndex(p => p.inHand);
    return endHandWithWinner(io, t, seat);
  }

  // if everyone matched -> move street or showdown (no evaluator yet)
  if (everyoneMatched(t)) {
    if (t.street !== "river") {
      moveToNextStreet(t);
      io.to(`table:${t.id}`).emit("street", { street: t.street, pot: t.pot, board: t.board });
      // first to act on next streets is SB (if alive), else next alive
      t.turnSeat = nextSeat(t, t.sbPos - 1);
      return startTurn(io, t);
    } else {
      // showdown with evaluator & side-pots
      return showdown(io, t);
    }
  }

  // else continue to next player
  t.turnSeat = nextSeat(t, t.turnSeat);
  startTurn(io, t);
}

export type Contribution = number;
export interface SidePot { amount: number; eligible: number[]; }
export function computeSidePots(committed: number[], inHand: boolean[]): SidePot[] {
  const seats = committed.map((amt, seat) => ({ seat, amt, inHand: inHand[seat] }));
  const active = seats.filter(x => x.amt > 0 && x.inHand);
  if (active.length === 0) return [];
  const caps = Array.from(new Set(active.map(x => x.amt))).sort((a,b)=>a-b);
  const pots: SidePot[] = [];
  let prev = 0;
  for (const cap of caps) {
    const layer = seats
      .filter(x => x.amt > prev)
      .map(x => Math.min(x.amt, cap) - prev)
      .reduce((a,b)=>a+b, 0);
    const eligible = seats.filter(x => x.inHand && x.amt >= cap).map(x => x.seat);
    if (layer > 0 && eligible.length > 0) pots.push({ amount: layer, eligible });
    prev = cap;
  }
  return pots;
}

function rank7(holes: string[], board: string[]) {
  const cards = [...holes, ...board];
  return evalHand(cards);
}

function showdown(io: Server, t: Table) {
  const inHand = t.players.map(p => p.inHand);
  const committed = t.players.map(p => p.committed);
  const pots = computeSidePots(committed, inHand);

  const winnersBySeat = new Map<number, number>();

  for (const sp of pots) {
    let bestVal = -1;
    let winners: number[] = [];
    for (const seat of sp.eligible) {
      const p = t.players[seat];
      if (!p.inHand) continue;
      const r = rank7(t.holes[seat], t.board);
      if ((r as any).value > bestVal) { bestVal = (r as any).value; winners = [seat]; }
      else if ((r as any).value === bestVal) winners.push(seat);
    }
    const share = Math.floor(sp.amount / winners.length);
    let remainder = sp.amount - share * winners.length;
    for (const seat of winners) {
      winnersBySeat.set(seat, (winnersBySeat.get(seat) || 0) + share);
    }
    winners.sort((a,b)=>a-b);
    for (let i=0; i<remainder; i++) {
      const seat = winners[i % winners.length];
      winnersBySeat.set(seat, (winnersBySeat.get(seat) || 0) + 1);
    }
  }

  let losers: number[] = [];
  let amounts: number[] = [];
  t.players.forEach((p, seat) => {
    const won = winnersBySeat.get(seat) || 0;
    const paid = p.committed;
    p.stack += (won - paid);
    if (paid > won) { losers.push(seat); amounts.push(paid - won); }
  });

  io.to(`table:${t.id}`).emit("showdown", {
    board: t.board, winners: Array.from(winnersBySeat.entries()).map(([seat, amt])=>({seat, amt}))
  });

  // signal server via hook
  try { hooks.onShowdown?.(t.id, winnersBySeat, losers, amounts); } catch {}

  // conclude hand
  const alive = t.players.filter(p => p.inHand).map((p)=>p.seat);
  const seat = alive.length ? alive[0] : 0;
  endHandWithWinner(io, t, seat);
}

export function handleAction(io: Server, t: Table, seat: number, a: Action) {
  const p = t.players[seat];
  if (!p || !p.inHand) return { ok: false, error: "not in hand" };
  if (seat !== t.turnSeat) return { ok: false, error: "not your turn" };

  const toCall = Math.max(0, t.currentBet - p.committed);

  switch (a.kind) {
    case "fold": {
      p.inHand = false;
      p.actedThisRound = true;
      io.to(`table:${t.id}`).emit("action:applied", { seat, kind: "fold" });
      onPostAction(io, t);
      return { ok: true };
    }
    case "check": {
      if (toCall !== 0) return { ok: false, error: "cannot check" };
      p.actedThisRound = true;
      io.to(`table:${t.id}`).emit("action:applied", { seat, kind: "check" });
      onPostAction(io, t);
      return { ok: true };
    }
    case "call": {
      if (toCall === 0) return { ok: false, error: "nothing to call" };
      const pay = Math.min(p.stack, toCall);
      p.stack -= pay;
      p.committed += pay;
      p.actedThisRound = true;
      t.pot += pay;
      io.to(`table:${t.id}`).emit("action:applied", { seat, kind: "call", amount: pay });
      onPostAction(io, t);
      return { ok: true };
    }
    case "bet": {
      const amt = a.amount ?? 0;
      if (t.currentBet !== 0) return { ok: false, error: "use raise" };
      if (amt <= 0 || amt > p.stack) return { ok: false, error: "bad bet" };
      p.stack -= amt; p.committed += amt; t.pot += amt;
      t.currentBet = p.committed;
      t.minRaise = Math.max(t.bigBlind, amt); // simple rule
      t.lastAggressorSeat = seat;
      // reset acted flags except bettor
      t.players.forEach(pl => (pl.actedThisRound = (pl === p)));
      io.to(`table:${t.id}`).emit("action:applied", { seat, kind: "bet", amount: amt });
      onPostAction(io, t);
      return { ok: true };
    }
    case "raise": {
      const inc = a.amount ?? 0;
      if (t.currentBet === 0) return { ok: false, error: "nothing to raise" };
      if (inc < t.minRaise) return { ok: false, error: "min raise" };
      const newBet = t.currentBet + inc;
      const need = newBet - p.committed;
      if (need > p.stack) return { ok: false, error: "insufficient stack" };
      p.stack -= need; p.committed += need; t.pot += need;
      t.currentBet = newBet; t.minRaise = inc; t.lastAggressorSeat = seat;
      t.players.forEach(pl => (pl.actedThisRound = (pl === p)));
      io.to(`table:${t.id}`).emit("action:applied", { seat, kind: "raise", amount: inc });
      onPostAction(io, t);
      return { ok: true };
    }
    default:
      return { ok: false, error: "unknown action" };
  }
}

export function publicTable(t: Table) {
  // sanitize for clients
  return {
    id: t.id, seats: t.seats, smallBlind: t.smallBlind, bigBlind: t.bigBlind,
    players: t.players.map(p => ({ seat: p.seat, addr: p.addr, stack: p.stack, inHand: p.inHand })),
    street: t.street, pot: t.pot, currentBet: t.currentBet, minRaise: t.minRaise,
    turnSeat: t.turnSeat, deadline: t.turnDeadline
  };
}

export function initTable(id: number, seats = 2, sb = 5, bb = 10, buyIn = 1000): Table {
  return {
    id, seats, smallBlind: sb, bigBlind: bb, sbPos: 0, bbPos: 1,
    players: [], started: false, street: "preflop", pot: 0,
    currentBet: 0, minRaise: bb, turnSeat: 0, lastAggressorSeat: null
  };
}

export function sitDown(t: Table, socketId: string, addr: Addr) {
  if (t.players.length >= t.seats) throw new Error("full");
  const seat = t.players.length;
  t.players.push({ socketId, addr, seat, stack: 1000, inHand: false, committed: 0, actedThisRound: false });
  return seat;
}

export function maybeStart(io: Server, t: Table) {
  if (!t.started && t.players.length === t.seats) startHand(io, t);
}


