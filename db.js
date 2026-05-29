/* ============================================================
   DrawMe ProMax — db.js
   MongoDB Atlas connection + Schemas for:
   - Sessions (rooms)
   - Canvas Objects (drawings)
   - Chat Messages
   - Users (session participants)
   ============================================================ */

const mongoose = require('mongoose');

/* ── Connect to MongoDB Atlas ── */
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Atlas connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('⚠️  Running in memory-only mode (data will not persist)');
  }
}

/* ── Schema: Session (Room) ── */
const sessionSchema = new mongoose.Schema({
  roomId:    { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  lastActive:{ type: Date, default: Date.now },
  hostName:  { type: String, default: 'Unknown' },
  userCount: { type: Number, default: 0 },
});

/* ── Schema: Canvas Object (Drawing) ── */
const canvasObjectSchema = new mongoose.Schema({
  roomId:    { type: String, required: true, index: true },
  objId:     { type: Number, required: true },   // CANVAS object id
  type:      { type: String, required: true },   // rect, circle, freehand, star, etc.
  data:      { type: mongoose.Schema.Types.Mixed }, // full object data
  createdBy: { type: String, default: 'Unknown' },
  createdAt: { type: Date, default: Date.now },
});

/* ── Schema: Chat Message ── */
const chatMessageSchema = new mongoose.Schema({
  roomId:    { type: String, required: true, index: true },
  sender:    { type: String, required: true },
  text:      { type: String, required: true },
  time:      { type: Date, default: Date.now },
  isSelf:    { type: Boolean, default: false },
});

/* ── Schema: User Session Log ── */
const userLogSchema = new mongoose.Schema({
  roomId:    { type: String, required: true, index: true },
  userName:  { type: String, required: true },
  role:      { type: String, default: 'Participant' },
  joinedAt:  { type: Date, default: Date.now },
  leftAt:    { type: Date },
  socketId:  { type: String },
});

/* ── Models ── */
const Session      = mongoose.model('Session',      sessionSchema);
const CanvasObject = mongoose.model('CanvasObject', canvasObjectSchema);
const ChatMessage  = mongoose.model('ChatMessage',  chatMessageSchema);
const UserLog      = mongoose.model('UserLog',      userLogSchema);

module.exports = { connectDB, Session, CanvasObject, ChatMessage, UserLog };
