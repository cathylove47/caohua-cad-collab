import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { getOrCreateRoom, removeSocket, upsertUser, removeUser, upsertCursor, applyOperation, updateRoomState } from './room-manager';
import { listVersions, loadPersistedRoomState, restoreVersion, saveRoomState } from './storage';
import { ClientMessage, RoomState, RoomUser, ServerMessage } from './types';

const app = express();
const server = createServer(app);
const port = Number(process.env.PORT ?? 3001);
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((item) => item.trim());
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
  }),
);
app.use(express.json({ limit: '2mb' }));

function send(socket: WebSocket, message: ServerMessage) {
  socket.send(JSON.stringify(message));
}

function broadcast(roomId: string, message: ServerMessage, except?: WebSocket) {
  getOrCreateRoom(roomId).then((room) => {
    room.sockets.forEach((socket) => {
      const ws = socket as WebSocket;
      if (ws !== except && ws.readyState === WebSocket.OPEN) {
        send(ws, message);
      }
    });
  });
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'cad-collab-backend' });
});

app.get('/api/rooms/:roomId/state', async (req, res) => {
  const room = await getOrCreateRoom(req.params.roomId);
  res.json(room.state);
});

app.get('/api/rooms/:roomId/persisted', async (req, res) => {
  const persisted = await loadPersistedRoomState(req.params.roomId);
  if (persisted) {
    res.json(persisted);
    return;
  }

  const room = await getOrCreateRoom(req.params.roomId);
  res.json(room.state);
});

app.post('/api/rooms/:roomId/save', async (req, res) => {
  const room = await getOrCreateRoom(req.params.roomId);
  const incoming = req.body as RoomState | undefined;
  const nextState = incoming ? { ...incoming, users: room.state.users, cursors: room.state.cursors } : room.state;
  updateRoomState(room, nextState);
  const saved = await saveRoomState(room.state);
  room.state = saved;
  res.json(saved);
});

app.get('/api/rooms/:roomId/versions', async (req, res) => {
  const versions = await listVersions(req.params.roomId);
  res.json({ versions });
});

app.post('/api/rooms/:roomId/restore/:versionId', async (req, res) => {
  const room = await getOrCreateRoom(req.params.roomId);
  const restored = await restoreVersion(req.params.roomId, req.params.versionId);
  updateRoomState(room, restored);
  broadcast(req.params.roomId, { type: 'room-state', payload: room.state });
  res.json(restored);
});

wss.on('connection', (socket) => {
  let currentRoomId = '';
  let currentUserId = '';

  socket.on('message', async (raw) => {
    try {
      const message = JSON.parse(raw.toString()) as ClientMessage;

      if (message.type === 'join') {
        const { roomId, userId, username, color } = message.payload;
        currentRoomId = roomId;
        currentUserId = userId;
        const room = await getOrCreateRoom(roomId);
        room.sockets.add(socket);
        const user: RoomUser = {
          userId,
          username,
          color,
          joinedAt: new Date().toISOString(),
        };
        upsertUser(room, user);
        send(socket, { type: 'joined', payload: { roomId, userId } });
        send(socket, { type: 'room-state', payload: room.state });
        broadcast(roomId, { type: 'presence', payload: { roomId, users: room.state.users } });
        broadcast(roomId, { type: 'room-state', payload: room.state });
        return;
      }

      if (!currentRoomId) {
        send(socket, { type: 'error', payload: { message: 'Join a room first.' } });
        return;
      }

      const room = await getOrCreateRoom(currentRoomId);

      if (message.type === 'operation') {
        // MVP conflict resolution is intentionally simple: the newest received operation wins.
        applyOperation(room, message.payload);
        broadcast(currentRoomId, { type: 'operation', payload: message.payload }, socket);
        return;
      }

      if (message.type === 'cursor') {
        const cursor = {
          ...message.payload,
          updatedAt: new Date().toISOString(),
        };
        upsertCursor(room, cursor);
        broadcast(currentRoomId, { type: 'cursor', payload: cursor }, socket);
      }
    } catch (error) {
      send(socket, { type: 'error', payload: { message: 'Invalid WebSocket message.' } });
    }
  });

  socket.on('close', async () => {
    if (!currentRoomId || !currentUserId) {
      return;
    }

    const room = await getOrCreateRoom(currentRoomId);
    removeSocket(currentRoomId, socket);
    removeUser(room, currentUserId);
    broadcast(currentRoomId, {
      type: 'presence',
      payload: { roomId: currentRoomId, users: room.state.users },
    });
    broadcast(currentRoomId, { type: 'room-state', payload: room.state });
  });
});

server.listen(port, () => {
  console.log(`cad-collab backend listening on http://localhost:${port}`);
});
