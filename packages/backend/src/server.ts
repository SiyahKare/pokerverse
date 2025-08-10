import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server as IOServer } from "socket.io";
import { ethers } from "ethers";
import BetABI from "./abis/Bet.json" assert { type: "json" };

const PORT = Number(process.env.PORT || 3001);
const RPC = process.env.RPC_URL!;
const DEALER_PK = process.env.DEALER_PK!;
const BET = process.env.BET_ADDRESS!;

const app = express();
app.use(express.json());
const httpServer = createServer(app);
const io = new IOServer(httpServer, { cors: { origin: "*" } });

// Dealer signer
const provider = new ethers.JsonRpcProvider(RPC);
const dealer = new ethers.Wallet(DEALER_PK, provider);
const bet = new ethers.Contract(BET, BetABI, dealer);

// Socket.IO — odalar (MVP basit)
io.on("connection", (socket) => {
  socket.on("joinLobby", () => socket.join("lobby"));
  socket.on("joinTable", (gid: number) => socket.join(`table:${gid}`));
});

// REST — propose & finalize
app.post("/propose", async (req, res) => {
  try {
    const { gameId, winner }:{gameId:number;winner:string} = req.body;
    const tx = await bet.proposeWinner(gameId, winner);
    await tx.wait();
    io.to(`table:${gameId}`).emit("winnerProposed", { gameId, winner, tx: tx.hash });
    res.json({ ok: true, tx: tx.hash });
  } catch (e:any) { res.status(500).json({ ok:false, error: e.message }); }
});

app.post("/finalize", async (req, res) => {
  try {
    const { gameId }:{gameId:number} = req.body;
    const tx = await bet.finalizeWinner(gameId);
    await tx.wait();
    io.to(`table:${gameId}`).emit("winnerFinalized", { gameId, tx: tx.hash });
    res.json({ ok: true, tx: tx.hash });
  } catch (e:any) { res.status(500).json({ ok:false, error: e.message }); }
});

httpServer.listen(PORT, () => console.log(`Dealer API & Socket.IO listening :${PORT}`));


