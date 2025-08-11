const { WebSocketServer } = require('ws');
const { nanoid } = require('nanoid');
const { Hand } = require('pokersolver');

const PORT = process.env.PORT || 3011;
const wss = new WebSocketServer({ port: PORT });

// basit deste/dağıtım yardımcıları
const RANKS = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
const SUITS = ['h','d','c','s'];
function newDeck(){
  const d = [];
  for (const r of RANKS) for (const s of SUITS) d.push(`${r}${s}`);
  for (let i=d.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [d[i],d[j]]=[d[j],d[i]] }
  return d;
}

let deck = newDeck();
let actionCount = 0;
let currentSeat = 0; // index
let wsToSeat = new Map();
let dealerIndex = -1;
const SMALL_BLIND = 50;
const BIG_BLIND = 100;
let currentBet = 0; // o streetteki en yüksek bet
let lastRaiseSize = BIG_BLIND; // min-raise takibi
let turnTimer = null; // per-turn timer handle
let raiseCountInStreet = 0; // cap için raise sayacı (bet dahil)

let table = {
  maxSeats: 9,
  seats: Array.from({ length: 9 }, (_, i) => ({ seat: i, name: `Seat ${i + 1}` , stack: 2000, isTurn: false, isSitting: false, inHand: false, invested: 0 })),
  potAmount: 0,
  community: [],
  lastAction: null,
  street: 'prehand', // prehand|preflop|flop|turn|river|showdown
  sidePots: [],
  turnDeadline: null,
  button: -1,
  currentBet: 0,
  lastRaiseSize: BIG_BLIND,
  bigBlind: BIG_BLIND,
};

function seatedPlayers(){ return table.seats.filter(s=>s && s.isSitting) }
function activePlayers(){ return table.seats.filter(s=>s && s.isSitting && s.inHand) }

function broadcast(msg) {
  // sync meta before broadcast
  table.currentBet = currentBet;
  table.lastRaiseSize = lastRaiseSize;
  table.bigBlind = BIG_BLIND;
  const data = JSON.stringify(msg);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(data);
  }
}

function markTurn(seatIndex){
  table.seats.forEach(s=> s && (s.isTurn=false))
  const s = table.seats[seatIndex];
  if (s && s.isSitting && s.inHand) s.isTurn = true;
}

function dealNewHand(){
  deck = newDeck();
  table.potAmount = 0;
  table.community = [];
  table.lastAction = null;
  table.street = 'preflop';
  table.sidePots = [];
  // herkese 2 kart
  table.seats.forEach(s=>{
    if (!s || !s.isSitting) { if (s) { s.inHand=false; s.hole=undefined } return }
    s.inHand = true;
    s.hasFolded = false;
    s.bet = 0;
    s.invested = 0;
    s.hole = [deck.pop(), deck.pop()];
  })
  actionCount = 0;
  // dealer bir sonraki oturana kaydır
  const N = table.seats.length;
  for (let k=1;k<=N;k++){
    const idx = (dealerIndex + k + N) % N;
    const s = table.seats[idx];
    if (s && s.isSitting) { dealerIndex = idx; break }
  }
  table.button = dealerIndex;
  // blinds post
  currentBet = 0;
  lastRaiseSize = BIG_BLIND;
  raiseCountInStreet = 0;
  const order = [];
  for (let k=1;k<=N;k++) order.push((dealerIndex + k) % N);
  const sbIdx = order.find(i=> table.seats[i] && table.seats[i].isSitting);
  const bbIdx = order.slice(order.indexOf(sbIdx)+1).find(i=> table.seats[i] && table.seats[i].isSitting);
  if (typeof sbIdx === 'number') {
    const sb = table.seats[sbIdx]; const amt = Math.min(SMALL_BLIND, sb.stack||0);
    sb.stack = Math.max(0, (sb.stack||0) - amt); sb.bet = amt; sb.invested = (sb.invested||0) + amt; table.potAmount += amt;
  }
  if (typeof bbIdx === 'number') {
    const bb = table.seats[bbIdx]; const amt = Math.min(BIG_BLIND, bb.stack||0);
    bb.stack = Math.max(0, (bb.stack||0) - amt); bb.bet = amt; bb.invested = (bb.invested||0) + amt; table.potAmount += amt; currentBet = amt;
  }
  // konuşma: BB'nin solundan başla
  const startOrder = order.slice(order.indexOf(bbIdx)+1).concat(order.slice(0, order.indexOf(bbIdx)+1));
  currentSeat = startOrder.find(i=> { const s=table.seats[i]; return s && s.isSitting && s.inHand && !s.hasFolded }) ?? 0;
  markTurn(currentSeat);
  scheduleTurnTimer();
}

function advanceStreetIfNeeded(){
  const players = activePlayers();
  if (players.length <= 1) { // tek kişi kaldı → potu ver ve yeni el
    const w = players[0];
    if (w) w.stack = (w.stack || 0) + table.potAmount;
    dealNewHand();
    broadcast({ type: 'TABLE_STATE', payload: table });
    return;
  }
  const openCalls = activePlayers().filter(p=> (p.bet||0) < currentBet && !p.hasFolded).length;
  if (openCalls === 0) {
    actionCount = 0;
    // street reset
    table.seats.forEach(s=> { if (s) s.bet = 0 })
    currentBet = 0; lastRaiseSize = BIG_BLIND; raiseCountInStreet = 0;
    if (table.community.length === 0) {
      // flop
      table.community.push(deck.pop(), deck.pop(), deck.pop());
      table.street = 'flop';
      // postflop ilk konuşan: button'un solu (SB) ve aktif ilk oyuncu
      const N = table.seats.length;
      for (let k=1;k<=N;k++){
        const i = (dealerIndex + k) % N;
        const s = table.seats[i];
        if (s && s.isSitting && s.inHand && !s.hasFolded) { currentSeat = i; break }
      }
      markTurn(currentSeat); scheduleTurnTimer();
    } else if (table.community.length === 3) {
      table.community.push(deck.pop());
      table.street = 'turn';
      const N = table.seats.length; for (let k=1;k<=N;k++){ const i=(dealerIndex+k)%N; const s=table.seats[i]; if (s&&s.isSitting&&s.inHand&&!s.hasFolded){ currentSeat=i; break } }
      markTurn(currentSeat); scheduleTurnTimer();
    } else if (table.community.length === 4) {
      table.community.push(deck.pop());
      table.street = 'river';
      const N = table.seats.length; for (let k=1;k<=N;k++){ const i=(dealerIndex+k)%N; const s=table.seats[i]; if (s&&s.isSitting&&s.inHand&&!s.hasFolded){ currentSeat=i; break } }
      markTurn(currentSeat); scheduleTurnTimer();
    } else if (table.community.length === 5) {
      // showdown: en iyi eli belirle ve potu dağıt (basit: side-pot yok, eşitlikte böl)
      const alive = activePlayers().filter(p=> !p.hasFolded);
      const scored = alive.map(p => {
        const cards = [ ...(p.hole||[]), ...table.community ];
        try {
          const h = Hand.solve(cards.map(c=> c.toUpperCase()));
          return { seat: p.seat, player: p, score: h.rank, handType: h.name, hand: h };
        } catch {
          return { seat: p.seat, player: p, score: -1, handType: 'invalid' };
        }
      });
      // Side-pot inşası
      const pots = buildSidePots();
      for (const pot of pots) {
        const elig = scored.filter(s=> pot.eligible.has(s.seat));
        if (elig.length === 0 || pot.size <= 0) continue;
        const winners = Hand.winners(elig.map(e=> e.hand)).map(w=> elig.find(e=> e.hand === w)).filter(Boolean);
        const share = Math.floor(pot.size / winners.length);
        let rem = pot.size - share * winners.length;
        for (const w of winners) { w.player.stack = (w.player.stack||0) + share + (rem>0?1:0); if (rem>0) rem--; }
      }
      dealNewHand();
    }
    broadcast({ type: 'TABLE_STATE', payload: table });
  }
}

function buildSidePots(){
  // Invested bazlı katmanlama
  const players = table.seats.filter(p=> p && p.isSitting && p.inHand && !p.hasFolded);
  const invested = new Map();
  for (const p of players) invested.set(p.seat, p.invested||0);
  const aliveSet = new Set(players.map(p=> p.seat));
  const pots = [];
  while (aliveSet.size > 0) {
    let min = Infinity; for (const seat of aliveSet) { const v = invested.get(seat)||0; if (v < min) min = v; }
    if (!isFinite(min) || min <= 0) break;
    // pota dahil olabilecekler: aliveSet üyeleri
    const elig = Array.from(aliveSet);
    const layerAmt = min * elig.length;
    pots.push({ size: layerAmt, eligible: new Set(elig) });
    // düş
    for (const seat of elig) {
      invested.set(seat, (invested.get(seat)||0) - min);
      if ((invested.get(seat)||0) === 0) { /* kalabilir, sonraki layer’a da dahil olur eğer daha yüksek all-in yoksa */ }
    }
    // Eğer bazı oyuncuların invested'i 0 ve başka oyuncularda >0 varsa, sonraki layer sadece >0 olanlarla devam eder
    const stillAlive = new Set(Array.from(aliveSet).filter(seat => (invested.get(seat)||0) > 0));
    if (stillAlive.size === 0) break; else aliveSet.clear(), stillAlive.forEach(s=> aliveSet.add(s));
  }
  table.sidePots = pots.map(p=> ({ size: p.size, eligible: Array.from(p.eligible) }));
  return pots;
}

function nextSeat(){
  const N = table.seats.length;
  for (let k=1;k<=N;k++){
    const i = (currentSeat + k) % N;
    const s = table.seats[i];
    if (s && s.isSitting && s.inHand && !s.hasFolded) { currentSeat = i; markTurn(currentSeat); break }
  }
  scheduleTurnTimer();
}

function scheduleTurnTimer(){
  if (turnTimer) { clearTimeout(turnTimer); turnTimer = null }
  // 12s tur süresi
  const deadline = Date.now() + 12000;
  table.turnDeadline = deadline;
  broadcast({ type: 'TABLE_STATE', payload: table });
  turnTimer = setTimeout(()=> {
    const actor = table.seats[currentSeat];
    if (!actor || !actor.isTurn) return;
    const toCall = Math.max(0, currentBet - (actor.bet||0));
    if (toCall === 0) {
      table.lastAction = { seat: currentSeat, kind: 'check', amount: 0 };
    } else {
      actor.hasFolded = true;
      table.lastAction = { seat: currentSeat, kind: 'fold', amount: 0 };
    }
    broadcast({ type: 'TABLE_STATE', payload: table });
    nextSeat();
    advanceStreetIfNeeded();
  }, 12000);
}

wss.on('connection', (ws) => {
  const id = nanoid(6);
  console.log(`[WS] client ${id} connected`);

  // auto-seat ilk boş yere
  let seatIndex = table.seats.findIndex(s=> !s.isSitting);
  if (seatIndex === -1) seatIndex = 0;
  const name = `P${id}`;
  table.seats[seatIndex] = { ...table.seats[seatIndex], seat: seatIndex, addr: name, name, stack: 2000, isSitting: true, inHand: false, isTurn: false };
  wsToSeat.set(ws, seatIndex);
  ws.send(JSON.stringify({ type: 'SEAT', payload: { seat: seatIndex } }));
  if (table.street === 'prehand') {
    dealNewHand();
  }
  ws.send(JSON.stringify({ type: 'TABLE_STATE', payload: table }));

  ws.on('message', (buf) => {
    try {
      const msg = JSON.parse(buf.toString());
      if (msg.type === 'ACTION') {
        const assignedSeat = wsToSeat.get(ws);
        const { kind = 'bet', amount = 0 } = msg.payload || {};
        const seat = assignedSeat ?? 0;
        const actor = table.seats[seat];
        if (!actor || !actor.inHand || seat !== currentSeat) return;
        const toCall = Math.max(0, currentBet - (actor.bet||0));
        const minOpen = BIG_BLIND;
        const reject = (reason, extra={}) => { ws.send(JSON.stringify({ type:'ACTION_REJECTED', payload:{ reason, ...extra } })) }

        if (kind === 'fold') {
          actor.hasFolded = true;
        } else if (kind === 'check') {
          if (toCall !== 0) return reject('Cannot check, need to call', { toCall })
        } else if (kind === 'call') {
          const amt = Math.min(actor.stack||0, toCall)
          actor.stack = Math.max(0, (actor.stack||0) - amt)
          actor.bet = (actor.bet||0) + amt
          actor.invested = (actor.invested||0) + amt
          table.potAmount += amt
        } else if (kind === 'bet') {
          if (currentBet !== 0) return reject('Bet not allowed, there is already a bet', { currentBet })
          if (amount < minOpen) return reject('Min open bet', { min: minOpen })
          const useAmt = Math.min(amount, actor.stack||0)
          const delta = useAmt
          actor.stack = Math.max(0, (actor.stack||0) - delta)
          actor.bet = (actor.bet||0) + delta
          actor.invested = (actor.invested||0) + delta
          table.potAmount += delta
          currentBet = actor.bet||0
          lastRaiseSize = currentBet
          raiseCountInStreet += 1
        } else if (kind === 'raise') {
          if (currentBet === 0) return reject('No bet to raise')
          if (raiseCountInStreet >= 4) return reject('Betting capped this street')
          const targetBet = amount
          const minRaiseTo = currentBet + Math.max(lastRaiseSize, BIG_BLIND)
          if (targetBet < minRaiseTo) return reject('Min raise not met', { minRaiseTo })
          const need = Math.max(0, targetBet - (actor.bet||0))
          const pay = Math.min(need, actor.stack||0)
          actor.stack = Math.max(0, (actor.stack||0) - pay)
          actor.bet = (actor.bet||0) + pay
          actor.invested = (actor.invested||0) + pay
          table.potAmount += pay
          lastRaiseSize = targetBet - currentBet
          currentBet = targetBet
          raiseCountInStreet += 1
        } else if (kind === 'allin') {
          const pay = actor.stack||0
          actor.stack = 0
          actor.bet = (actor.bet||0) + pay
          actor.invested = (actor.invested||0) + pay
          table.potAmount += pay
          if (currentBet === 0 && pay > 0) { currentBet = actor.bet||0; lastRaiseSize = currentBet }
        }
        table.lastAction = { seat, kind, amount };
        actionCount += 1;
        nextSeat();
        ws.send(JSON.stringify({ type: 'ACTION_ACK', payload: { ok: true } }));
        broadcast({ type: 'TABLE_STATE', payload: table });
        advanceStreetIfNeeded();
      } else if (msg.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG' }));
      } else if (msg.type === 'JOIN') {
        const { seat, addr = 'player', buyIn = 10 } = msg.payload || {};
        if (seat == null || seat < 0 || seat >= table.maxSeats) {
          ws.send(JSON.stringify({ type: 'JOIN_ACK', payload: { ok: false, error: 'invalid seat' } }));
          return;
        }
        const s = table.seats[seat];
        if (s && s.addr) {
          ws.send(JSON.stringify({ type: 'JOIN_ACK', payload: { ok: false, error: 'seat taken' } }));
          return;
        }
        table.seats[seat] = {
          seat,
          addr,
          name: `${addr.slice(0, 6)}…${addr.slice(-4)}`,
          stack: Number(buyIn) || 10,
          isTurn: false,
          isSitting: true,
          inHand: false,
        };
        broadcast({ type: 'TABLE_STATE', payload: table });
        ws.send(JSON.stringify({ type: 'JOIN_ACK', payload: { ok: true } }));
      }
    } catch (e) {}
  });

  ws.on('close', () => {
    const si = wsToSeat.get(ws);
    wsToSeat.delete(ws);
    if (typeof si === 'number') {
      const s = table.seats[si];
      if (s) { s.isSitting=false; s.inHand=false; s.isTurn=false; s.addr=undefined; s.name=`Seat ${si+1}`; s.hole=undefined }
      broadcast({ type: 'TABLE_STATE', payload: table });
    }
    console.log(`[WS] client ${id} closed`)
  });
});

console.log(`[WS] listening on ws://localhost:${PORT}`);


