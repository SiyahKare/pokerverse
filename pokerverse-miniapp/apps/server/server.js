const { WebSocketServer } = require('ws');
const { nanoid } = require('nanoid');

const PORT = process.env.PORT || 3011;
const wss = new WebSocketServer({ port: PORT });

let table = {
  maxSeats: 9,
  seats: Array.from({ length: 9 }, (_, i) => ({ seat: i, name: `Seat ${i + 1}`, stack: 0, isTurn: false })),
  potAmount: 150,
  community: ['As', 'Kd', 'Tc'],
  lastAction: null,
};

function broadcast(msg) {
  const data = JSON.stringify(msg);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(data);
  }
}

wss.on('connection', (ws) => {
  const id = nanoid(6);
  console.log(`[WS] client ${id} connected`);

  ws.send(JSON.stringify({ type: 'TABLE_STATE', payload: table }));

  ws.on('message', (buf) => {
    try {
      const msg = JSON.parse(buf.toString());
      if (msg.type === 'ACTION') {
        const { seat = 0, kind = 'bet', amount = 0 } = msg.payload || {};
        // basit min bet/raise doğrulaması
        if ((kind === 'bet' || kind === 'raise') && amount < 50) {
          ws.send(JSON.stringify({ type: 'ACTION_REJECTED', payload: { reason: 'Min bet 50', min: 50 } }));
          return;
        }
        table = {
          ...table,
          potAmount: (table.potAmount || 0) + (amount || 0),
          lastAction: { seat, kind, amount },
        };
        ws.send(JSON.stringify({ type: 'ACTION_ACK', payload: { ok: true } }));
        broadcast({ type: 'TABLE_STATE', payload: table });
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
        };
        broadcast({ type: 'TABLE_STATE', payload: table });
        ws.send(JSON.stringify({ type: 'JOIN_ACK', payload: { ok: true } }));
      }
    } catch (e) {}
  });

  ws.on('close', () => console.log(`[WS] client ${id} closed`));
});

console.log(`[WS] listening on ws://localhost:${PORT}`);


