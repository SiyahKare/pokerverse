import "dotenv/config";
import express, { type Request, type Response } from "express";
import { createServer } from "http";
import { Server as IOServer } from "socket.io";
import { ethers } from "ethers";
import { verify as verifyJwt, sign as signJwt } from './auth/jwt';
import { verifyInitData } from './auth/telegram';
import { makeBucket, consume } from './ratelimit';
import { logEvent } from './logger';
import { createClient } from 'redis';
import BetABI from "./abis/Bet.json" assert { type: "json" };
import {
  initTable, sitDown, handleAction, publicTable, setHooks, type Table, type Action, startHand, maybeStartWithSeed
} from "./engine/poker";
import { randomBytes, createHash } from "crypto";
import ChipBankABI from "./abis/ChipBank.json" assert { type: "json" };

const PORT = Number(process.env.PORT || 3001);
const RPC = process.env.RPC_URL || "http://127.0.0.1:8545";
const DEALER_PK = process.env.DEALER_PK || "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"; // hardhat ilk hesap
const BET = process.env.BET_ADDRESS; // opsiyonel, yoksa endpoints 400 döner

const app = express();
app.use(express.json());
const httpServer = createServer(app);
const io = new IOServer(httpServer, { cors: { origin: "*" } });

// Redis (replay guard); fallback yoksa local memory yerine bağlanma hatası yansır
const REDIS_URL = process.env.REDIS_URL;
let redis: ReturnType<typeof createClient> | null = null;
if (REDIS_URL) {
  redis = createClient({ url: REDIS_URL });
  redis.on('error', (e)=>console.error('redis err', e.message));
  redis.connect().catch(()=>{});
}

// Socket auth middleware: JWT + nonce (jti)
io.use(async (socket, next) => {
  try {
    const auth = socket.handshake.headers['authorization'] as string | undefined;
    const nonce = (socket.handshake.headers['x-client-nonce'] as string | undefined) || '';
    if (!auth || !auth.startsWith('Bearer ') || !nonce) {
      logEvent({ type: 'conn_denied', reason: 'missing_auth_or_nonce' });
      return next(new Error('unauthorized'));
    }
    const token = auth.substring(7);
    const claims = verifyJwt(token);
    socket.data.userId = claims.sub;
    socket.data.jti = claims.jti;
    // replay guard: jti
    const key = `jti:${claims.jti}`;
    if (redis) {
      const set = await redis.set(key, '1', { NX: true, EX: 900 });
      if (set !== 'OK') {
        logEvent({ type: 'conn_denied', userId: claims.sub, reason: 'replay_jti' });
        return next(new Error('replay'));
      }
    }
    // token buckets init
    makeBucket(`room:join:${claims.sub}`, { capacity: 10, refillRatePerSec: 5 });
    makeBucket(`action:${claims.sub}`, { capacity: 20, refillRatePerSec: 10 });
    makeBucket(`buyin:${claims.sub}`, { capacity: 4, refillRatePerSec: 2 });
    logEvent({ type: 'conn_ok', userId: claims.sub, jti: claims.jti });
    next();
  } catch (e:any) {
    logEvent({ type: 'conn_denied', reason: e.message });
    next(new Error('unauthorized'));
  }
});

// Dealer signer
const provider = new ethers.JsonRpcProvider(RPC);
const dealer = new ethers.Wallet(DEALER_PK, provider);
const bet = BET ? new ethers.Contract(BET, (BetABI as any), dealer) : null as any;
const CHIPBANK = process.env.CHIPBANK_ADDRESS;
const RAKE_BPS = Number(process.env.RAKE_BPS || 100);
const chip = CHIPBANK ? new ethers.Contract(CHIPBANK, (ChipBankABI as any), dealer) : null as any;

const tables = new Map<number, Table>();
let nextTableId = 0;

// basit per-socket rate limit (kaynak koruma)
const actionWindowMs = 5_000;
const actionMaxPerWindow = 30; // 30/5s
const actionCounters = new Map<string, { windowStart: number; count: number }>();

function withinRateLimit(socketId: string): boolean {
  const now = Date.now();
  const rec = actionCounters.get(socketId) || { windowStart: now, count: 0 };
  if (now - rec.windowStart > actionWindowMs) {
    rec.windowStart = now;
    rec.count = 0;
  }
  rec.count += 1;
  actionCounters.set(socketId, rec);
  return rec.count <= actionMaxPerWindow;
}

function listTables() {
  return Array.from(tables.values()).map((t) => publicTable(t));
}

// Socket.IO — odalar + masa akışı
io.on("connection", (socket) => {
  socket.on("joinLobby", () => {
    socket.join("lobby");
    // ilk girişte mevcut tabloları gönder
    socket.emit("tableList", listTables());
  });

  socket.on("listTables", (cb?: Function) => {
    cb && cb({ ok: true, tables: listTables() });
  });

  socket.on("createTable", (arg: any = 2, cb?: Function) => {
    const seats: number = typeof arg === 'number' ? arg : Number(arg?.seats ?? 2);
    if (!Number.isFinite(seats) || seats < 2 || seats > 9) {
      return cb && cb({ ok: false, error: "invalid seats" });
    }
    const t = initTable(nextTableId++, seats, 5, 10, 1000);
    tables.set(t.id, t);
    io.to("lobby").emit("tableCreated", publicTable(t));
    cb && cb({ ok: true, table: publicTable(t) });
  });

  socket.on("joinTable", (tableId: number, addr: string, cb?: Function) => {
    const userId = socket.data.userId as string;
    if (!consume(`room:join:${userId}`, 1)) { logEvent({ type:'rate_limited', userId, action:'join', tableId }); return cb && cb({ ok:false, error:'rate_limited' }); }
    const t = tables.get(tableId);
    if (!t) return cb && cb({ ok: false, error: "no table" });
    try {
      // aynı adres zaten oturmuş mu?
      if (t.players.some((p) => p.addr.toLowerCase() === (addr || "").toLowerCase())) {
        return cb && cb({ ok: false, error: "already seated" });
      }
      const seat = sitDown(t, socket.id, addr as any);
      socket.join(`table:${tableId}`);
      io.to(`table:${tableId}`).emit("tableState", publicTable(t));
      // Provably-fair: seed -> commit -> startHand
      if (!t.started && t.players.length === t.seats) {
        const seed = randomBytes(32);
        const commit = createHash('sha256').update(seed).digest('hex');
        const seedHex = '0x' + seed.toString('hex');
        const commitHex = '0x' + commit;
        const deckPermutation = createHash('sha256').update(Buffer.from(seed)).digest('hex');
        const handId = startHand(io, t, seedHex);
        console.log(JSON.stringify({ level: "info", msg: "commit_published", tableId, handId, commit: commitHex }));
        console.log(JSON.stringify({ level: "info", msg: "seed_revealed", tableId, handId, seedHex, deckPermutationHash: '0x'+deckPermutation }));
        io.to(`table:${tableId}`).emit("rng:commit", { tableId, handId, commit: commitHex });
        io.to(`table:${tableId}`).emit("rng:reveal", { tableId, handId, seed: seedHex });
      }
      logEvent({ type:'join_ok', userId, tableId, seat });
      cb && cb({ ok: true, seat });
    } catch (e:any) { cb && cb({ ok:false, error: e.message }); }
  });

  // reconnect: aynı addr ile masaya geri bağlanma
  socket.on("reconnectSeat", (tableId: number, addr: string, cb?: Function) => {
    const t = tables.get(tableId);
    if (!t) return cb && cb({ ok: false, error: "no table" });
    const p = t.players.find((pl) => pl.addr.toLowerCase() === (addr||"").toLowerCase());
    if (!p) return cb && cb({ ok: false, error: "not found" });
    p.socketId = socket.id;
    socket.join(`table:${tableId}`);
    io.to(`table:${tableId}`).emit("tableState", publicTable(t));
    cb && cb({ ok: true, seat: p.seat });
  });

  socket.on("action", (tableId: number, seat: number, a: Action, cb?: Function) => {
    const userId = socket.data.userId as string;
    if (!consume(`action:${userId}`, 1)) { logEvent({ type:'rate_limited', userId, action:'action', tableId }); return cb && cb({ ok:false, error:'rate_limited' }); }
    const t = tables.get(tableId);
    if (!t) return cb && cb({ ok: false, error: "no table" });
    if (!withinRateLimit(socket.id)) return cb && cb({ ok: false, error: "rate_limited" });
    const res = handleAction(io, t, seat, a);
    if (!res.ok) return cb && cb(res);
    io.to(`table:${tableId}`).emit("tableState", publicTable(t));
    logEvent({ type:'action_ok', userId, tableId, handId: t?.handId, action: a.kind, amount: a.amount });
    cb && cb({ ok: true });
  });
});

// REST — propose & finalize
app.post("/propose", async (req: Request, res: Response) => {
  try {
    if (!bet) return res.status(400).json({ ok:false, error: "BET_ADDRESS not set" });
    const { gameId, winner }:{gameId:number;winner:string} = req.body;
    const tx = await bet.proposeWinner(gameId, winner);
    await tx.wait();
    io.to(`table:${gameId}`).emit("winnerProposed", { gameId, winner, tx: tx.hash });
    res.json({ ok: true, tx: tx.hash });
  } catch (e:any) { res.status(500).json({ ok:false, error: e.message }); }
});

app.post("/finalize", async (req: Request, res: Response) => {
  try {
    if (!bet) return res.status(400).json({ ok:false, error: "BET_ADDRESS not set" });
    const { gameId }:{gameId:number} = req.body;
    const tx = await bet.finalizeWinner(gameId);
    await tx.wait();
    io.to(`table:${gameId}`).emit("winnerFinalized", { gameId, tx: tx.hash });
    res.json({ ok: true, tx: tx.hash });
  } catch (e:any) { res.status(500).json({ ok:false, error: e.message }); }
});

httpServer.listen(PORT, () => console.log(`Dealer API & Socket.IO listening :${PORT}`));

// REST: tablo listesi (gözlem/sağlık için)
app.get("/tables", (_req: Request, res: Response) => {
  res.json({ ok: true, tables: listTables() });
});

// Telegram initData verify -> short-lived JWT issue
app.post('/api/telegram/verify', async (req: Request, res: Response) => {
  try {
    const initData = String(req.body?.initData || '')
    const botToken = process.env.TELEGRAM_BOT_TOKEN || ''
    if (!initData || !botToken) return res.status(400).json({ ok:false, error:'bad_request' })
    const out = verifyInitData(initData, botToken)
    if (!out.ok) return res.status(401).json({ ok:false, error:'invalid_initdata' })
    const now = Math.floor(Date.now()/1000)
    if (Math.abs(now - (out.auth_date || 0)) > 300) return res.status(401).json({ ok:false, error:'expired' })
    const token = signJwt(out.userId!)
    return res.json({ ok: true, token })
  } catch (e:any) {
    return res.status(500).json({ ok:false, error: e.message })
  }
})

// Auto finalize hook (MVP): tableId == gameId mapping varsayımı
setHooks({
  onHandEnd: async (tableId, winnerAddr) => {
    try {
      if (!bet) return;
      const tx = await bet.proposeWinner(tableId, winnerAddr);
      await tx.wait();
      setTimeout(async () => {
        try { const tx2 = await bet.finalizeWinner(tableId); await tx2.wait(); }
        catch (e:any) { console.error("finalize err:", e.message); }
      }, 16_000);
    } catch (e:any) {
      console.error("propose err:", e.message);
    }
  }
  ,
  onShowdown: async (tableId, winnersBySeat, losers, amounts) => {
    try {
      if (!chip) return;
      const t = tables.get(tableId);
      if (!t) return;
      const SCALE = 1_000_000n; // 1 chip == 1 USDC (6d)
      const loserAddrs = losers.map(seat => t.players.find(p=>p.seat===seat)!.addr);
      const loserAmts  = amounts.map(a => BigInt(a) * SCALE);
      const winnerSeats = Array.from(winnersBySeat.keys());
      const winnerAddrs = winnerSeats.map(seat => t.players.find(p=>p.seat===seat)!.addr);
      const winnerCreds = winnerSeats.map(seat => BigInt(winnersBySeat.get(seat)!) * SCALE);
      const tx = await chip.settleSplit(tableId, loserAddrs, loserAmts, winnerAddrs, winnerCreds, RAKE_BPS);
      await tx.wait();
      io.to(`table:${tableId}`).emit("onchain:settled", { tableId, tx: tx.hash });
    } catch (e:any) {
      console.error("settleSplit err:", e.message);
    }
  }
});

// On-chain event relay → Socket.IO (finalize summary & LP)
if (bet) {
  bet.on("WinnerFinalized", (gid: bigint, winner: string, pot: bigint, fee: bigint, payout: bigint) => {
    const gameId = Number(gid);
    io.to(`table:${gameId}`).emit("finalizeSummary", {
      gid: gameId,
      winner,
      pot: pot.toString(),
      fee: fee.toString(),
      payoutNet: payout.toString()
    });
  });
  bet.on("LiquidityContribution", (gid: bigint, to: string, amount: bigint) => {
    const gameId = Number(gid);
    io.to(`table:${gameId}`).emit("lpContribution", {
      gid: gameId,
      to,
      lpCut: amount.toString()
    });
  });
}


