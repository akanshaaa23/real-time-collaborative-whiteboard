/* ============================================================
   DrawMe ProMax — server.js (MongoDB Edition)
   Saves: Drawings, Chat, Sessions, Users to MongoDB Atlas
   Falls back to in-memory if MongoDB is not connected
   ============================================================ */

require('dotenv').config();

const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const { connectDB, Session, CanvasObject, ChatMessage, UserLog } = require('./db');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

app.use(express.json());
app.use(express.static('./'));

/* ── Connect to MongoDB Atlas ── */
connectDB();

/* ── In-memory fallback ── */
const rooms = new Map();
function getRoom(roomId) {
  if (!rooms.has(roomId)) rooms.set(roomId, { objects: [], users: [], chatHistory: [] });
  return rooms.get(roomId);
}

/* ── Active meetings tracker (only HOST-created codes are valid) ── */
const activeMeetings = new Set();

/* ── Helper: is MongoDB connected? ── */
function isDBConnected() {
  const mongoose = require('mongoose');
  return mongoose.connection.readyState === 1;
}

/* ── Helper: broadcast updated user list to a room ── */
function broadcastUserList(roomId) {
  const room = getRoom(roomId);
  io.to(roomId).emit('user-list-update', room.users);
}

/* ── REST API: Check if meeting code is valid ── */
app.get('/api/meeting/:roomId/exists', async (req, res) => {
  const { roomId } = req.params;
  try {
    // Check in-memory first (host currently active)
    if (activeMeetings.has(roomId)) return res.json({ exists: true });

    // Check MongoDB for persisted sessions
    if (isDBConnected()) {
      const session = await Session.findOne({ roomId }).lean();
      if (session) return res.json({ exists: true });
    }

    res.json({ exists: false });
  } catch (err) {
    res.json({ exists: false });
  }
});

/* ── REST API: Get room history ── */
app.get('/api/room/:roomId', async (req, res) => {
  const { roomId } = req.params;
  try {
    if (!isDBConnected()) {
      const room = getRoom(roomId);
      return res.json({ objects: room.objects, chatHistory: room.chatHistory });
    }
    const objects = await CanvasObject.find({ roomId }).sort({ createdAt: 1 }).lean();
    const chat    = await ChatMessage.find({ roomId }).sort({ time: 1 }).lean();
    res.json({
      objects:     objects.map(o => ({ ...o.data, id: o.objId })),
      chatHistory: chat.map(m => ({ sender: m.sender, text: m.text, time: m.time })),
    });
  } catch (err) {
    const room = getRoom(roomId);
    res.json({ objects: room.objects, chatHistory: room.chatHistory });
  }
});

/* ── REST API: Clear room ── */
app.delete('/api/room/:roomId', async (req, res) => {
  const { roomId } = req.params;
  try {
    if (isDBConnected()) await CanvasObject.deleteMany({ roomId });
    if (rooms.has(roomId)) rooms.get(roomId).objects = [];
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

/* ── REST API: All sessions ── */
app.get('/api/sessions', async (req, res) => {
  try {
    if (!isDBConnected()) return res.json([]);
    const sessions = await Session.find().sort({ lastActive: -1 }).limit(50).lean();
    res.json(sessions);
  } catch (err) { res.json([]); }
});

/* ── Socket.IO ── */
io.on('connection', (socket) => {

  socket.on('join-room', async ({ roomId, userName, role }) => {
    // ── VALIDATION: Only allow join if meeting code is valid ──
    const isHost = role === 'Host';

    if (!isHost) {
      // Participant must join an existing meeting
      const meetingExists = activeMeetings.has(roomId) ||
        (isDBConnected() && await Session.exists({ roomId }).catch(() => false));

      if (!meetingExists) {
        socket.emit('join-error', { message: 'Invalid meeting code. Please check and try again.' });
        return;
      }
    }

    // Host creates the meeting
    if (isHost) {
      activeMeetings.add(roomId);
    }

    socket.join(roomId);
    socket.roomId   = roomId;
    socket.userName = userName || 'Anonymous';
    socket.role     = role || 'Participant';

    const room = getRoom(roomId);

    // Add user if not already present (handles reconnects)
    if (!room.users.find(u => u.id === socket.id)) {
      room.users.push({ id: socket.id, name: socket.userName, role: socket.role, isHost: isHost });
    }

    // Broadcast updated user list to everyone in the room
    broadcastUserList(roomId);

    try {
      if (isDBConnected()) {
        const savedObjects = await CanvasObject.find({ roomId }).sort({ createdAt: 1 }).lean();
        socket.emit('canvas-state', savedObjects.map(o => ({ ...o.data, id: o.objId })));

        const chatHistory = await ChatMessage.find({ roomId }).sort({ time: 1 }).limit(100).lean();
        socket.emit('chat-history', chatHistory.map(m => ({ sender: m.sender, text: m.text, time: m.time })));

        await Session.findOneAndUpdate(
          { roomId },
          { lastActive: new Date(), $inc: { userCount: 1 }, ...(isHost ? { hostName: userName } : {}) },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        await UserLog.create({ roomId, userName: socket.userName, role: socket.role, socketId: socket.id });
      } else {
        socket.emit('canvas-state', room.objects);
        socket.emit('chat-history', room.chatHistory);
      }
    } catch (err) {
      console.error('join-room error:', err.message);
      socket.emit('canvas-state', room.objects);
    }

    socket.to(roomId).emit('user-joined', socket.userName);
    console.log(`[Room:${roomId}] ${socket.userName} (${socket.role}) joined`);
  });

  socket.on('draw-object', async ({ roomId, obj }) => {
    const room = getRoom(roomId);
    if (!room.objects.find(o => o.id === obj.id)) room.objects.push(obj);
    socket.to(roomId).emit('draw-object', obj);

    try {
      if (isDBConnected() && obj.type !== 'imageData') {
        const exists = await CanvasObject.findOne({ roomId, objId: obj.id });
        if (!exists) {
          await CanvasObject.create({ roomId, objId: obj.id, type: obj.type, data: obj, createdBy: socket.userName });
        }
      }
    } catch (err) { console.error('draw-object error:', err.message); }
  });

  socket.on('canvas-clear', async ({ roomId }) => {
    getRoom(roomId).objects = [];
    socket.to(roomId).emit('canvas-clear');
    try {
      if (isDBConnected()) await CanvasObject.deleteMany({ roomId });
    } catch (err) { console.error('canvas-clear error:', err.message); }
  });

  socket.on('chat-message', async ({ roomId, sender, text }) => {
    const msg = { sender, text, time: new Date() };
    getRoom(roomId).chatHistory.push(msg);
    io.to(roomId).emit('chat-message', msg);
    try {
      if (isDBConnected()) await ChatMessage.create({ roomId, sender, text });
    } catch (err) { console.error('chat error:', err.message); }
  });

  socket.on('disconnect', async () => {
    if (!socket.roomId) return;
    const room = getRoom(socket.roomId);
    room.users = room.users.filter(u => u.id !== socket.id);

    // Broadcast updated user list after disconnect
    broadcastUserList(socket.roomId);

    socket.to(socket.roomId).emit('user-left', socket.userName);
    try {
      if (isDBConnected()) {
        await UserLog.findOneAndUpdate({ socketId: socket.id }, { leftAt: new Date() });
        await Session.findOneAndUpdate({ roomId: socket.roomId }, { lastActive: new Date() });
      }
    } catch (err) { /* non-critical */ }

    // If no users left, remove meeting from active set only after some delay
    if (room.users.length === 0) {
      setTimeout(() => {
        const r = rooms.get(socket.roomId);
        if (r && r.users.length === 0) {
          activeMeetings.delete(socket.roomId);
          rooms.delete(socket.roomId);
        }
      }, 30000); // 30 second grace period
    }

    console.log(`[Room:${socket.roomId}] ${socket.userName} left`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 DrawMe ProMax running on http://localhost:${PORT}`);
  console.log(`📦 MongoDB: ${process.env.MONGO_URI ? 'URI loaded from .env' : '⚠️  MONGO_URI not set!'}`);
});
