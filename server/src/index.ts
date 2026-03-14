import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { z } from 'zod';
import { RoomManager } from './game/roomManager.js';

const PORT = Number(process.env.PORT ?? 3001);

const app = express();
app.use(cors());
app.get('/health', (_, res) => {
  res.json({ ok: true });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

const roomManager = new RoomManager();

const joinSchema = z.object({
  pseudo: z.string().trim().min(1).max(16),
  brawler: z.enum(['tank', 'sniper', 'rusher']),
  roomCode: z.string().trim().min(4).max(8).optional(),
});

const inputSchema = z.object({
  up: z.boolean(),
  down: z.boolean(),
  left: z.boolean(),
  right: z.boolean(),
  seq: z.number(),
});

const vectorSchema = z.object({ x: z.number(), y: z.number() });

io.on('connection', (socket) => {
  socket.on('room:join', (raw) => {
    const parsed = joinSchema.safeParse(raw);
    if (!parsed.success) return;

    const payload = parsed.data;
    const roomCode = roomManager.join(socket.id, payload.pseudo, payload.brawler, payload.roomCode?.toUpperCase());
    socket.join(roomCode);

    const state = roomManager.getState(roomCode);
    if (state) {
      socket.emit('room:joined', state);
      io.to(roomCode).emit('state:update', state);
    }
  });

  socket.on('player:input', (raw) => {
    const parsed = inputSchema.safeParse(raw);
    if (!parsed.success) return;
    roomManager.setInput(socket.id, parsed.data);
  });

  socket.on('player:shoot', (raw) => {
    const parsed = vectorSchema.safeParse(raw?.dir);
    if (!parsed.success) return;
    roomManager.shoot(socket.id, parsed.data, false);
  });

  socket.on('player:super', (raw) => {
    const parsed = vectorSchema.safeParse(raw?.dir);
    if (!parsed.success) return;
    roomManager.shoot(socket.id, parsed.data, true);
  });

  socket.on('disconnect', () => {
    const roomCode = roomManager.getRoomCodeOfPlayer(socket.id);
    roomManager.leave(socket.id);

    if (roomCode) {
      const state = roomManager.getState(roomCode);
      if (state) {
        io.to(roomCode).emit('state:update', state);
      }
    }
  });
});

setInterval(() => {
  roomManager.tick(50);

  for (const roomCode of roomManager.getAllRoomCodes()) {
    const state = roomManager.getState(roomCode);
    if (state) {
      io.to(roomCode).emit('state:update', state);
    }
  }
}, 50);

httpServer.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${PORT}`);
});
