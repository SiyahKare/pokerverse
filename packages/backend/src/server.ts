import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server as IOServer } from "socket.io";
import { ethers } from "ethers";
import BetABI from "./abis/Bet.json" assert { type: "json" };
import {
  initTable, sitDown, maybeStart, handleAction, publicTable, setHooks, type Table, type Action
} from "./engine/poker";
import ChipBankABI from "./abis/ChipBank.json" assert { type: "json" };

const PORT = Number(process.env.PORT || 3001);
const RPC = process.env.RPC_URL || "http://127.0.0.1:8545";
const DEALER_PK = process.env.DEALER_PK || "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"; // hardhat ilk hesap
const BET = process.env.BET_ADDRESS; // opsiyonel, yoksa endpoints 400 döner

const app = express();
app.use(express.json());
const httpServer = createServer(app);
const io = new IOServer(httpServer, { cors: { origin: "*" } });

// Dealer signer
const provider = new ethers.JsonRpcProvider(RPC);
const dealer = new ethers.Wallet(DEALER_PK, provider);
const bet = BET ? new ethers.Contract(BET, (BetABI as any), dealer) : null as any;
const CHIPBANK = process.env.CHIPBANK_ADDRESS;
const RAKE_BPS = Number(process.env.RAKE_BPS || 100);
const chip = CHIPBANK ? new ethers.Contract(CHIPBANK, (ChipBankABI as any), dealer) : null as any;

const tables = new Map<number, Table>();
let nextTableId = 0;

// Socket.IO — odalar + masa akışı
io.on("connection", (socket) => {
  socket.on("joinLobby", () => socket.join("lobby"));

  socket.on("createTable", (seats: number = 2, cb?: Function) => {
    const t = initTable(nextTableId++, seats, 5, 10, 1000);
    tables.set(t.id, t);
    io.to("lobby").emit("tableCreated", publicTable(t));
    cb && cb({ ok: true, table: publicTable(t) });
  });

  socket.on("joinTable", (tableId: number, addr: string, cb?: Function) => {
    const t = tables.get(tableId);
    if (!t) return cb && cb({ ok: false, error: "no table" });
    try {
      const seat = sitDown(t, socket.id, addr as any);
      socket.join(`table:${tableId}`);
      io.to(`table:${tableId}`).emit("tableState", publicTable(t));
      maybeStart(io, t);
      cb && cb({ ok: true, seat });
    } catch (e:any) { cb && cb({ ok:false, error: e.message }); }
  });

  socket.on("action", (tableId: number, seat: number, a: Action, cb?: Function) => {
    const t = tables.get(tableId);
    if (!t) return cb && cb({ ok: false, error: "no table" });
    const res = handleAction(io, t, seat, a);
    if (!res.ok) return cb && cb(res);
    io.to(`table:${tableId}`).emit("tableState", publicTable(t));
    cb && cb({ ok: true });
  });
});

// REST — propose & finalize
app.post("/propose", async (req, res) => {
  try {
    if (!bet) return res.status(400).json({ ok:false, error: "BET_ADDRESS not set" });
    const { gameId, winner }:{gameId:number;winner:string} = req.body;
    const tx = await bet.proposeWinner(gameId, winner);
    await tx.wait();
    io.to(`table:${gameId}`).emit("winnerProposed", { gameId, winner, tx: tx.hash });
    res.json({ ok: true, tx: tx.hash });
  } catch (e:any) { res.status(500).json({ ok:false, error: e.message }); }
});

app.post("/finalize", async (req, res) => {
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


