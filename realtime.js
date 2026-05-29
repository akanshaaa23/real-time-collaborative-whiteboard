/* ============================================================
   DrawMe ProMax — realtime.js
   Socket.IO drawing sync between users
   ============================================================ */

let socket = null;

function initRealtime(roomId, userName) {
  // Connect to socket server
  socket = io();

  // Join the room with role info
  socket.emit('join-room', { roomId, userName, role: APP.user.role });

  // ── Handle join error (invalid meeting code) ──
  socket.on('join-error', ({ message }) => {
    showToast('❌ ' + message);
    // Go back to landing/login page
    setTimeout(() => {
      showPage('auth'); // or 'home' — adjust to your page ID
    }, 1500);
  });

  // ── Receive updated user list (real-time, from server) ──
  socket.on('user-list-update', (users) => {
    // Reset and re-render the user list from server data
    APP.users = [];
    const list = document.getElementById('users-list');
    const count = document.getElementById('user-count');
    if (list) list.innerHTML = '';
    if (count) count.textContent = users.length;

    users.forEach(u => {
      const isHost = u.role === 'Host' || u.isHost;
      APP.users.push({ name: u.name, isHost });

      if (list) {
        const div = document.createElement('div');
        div.className = 'user-item';
        div.innerHTML = `<div class="user-dot ${isHost ? 'host' : ''}"></div>
          <span class="user-name">${u.name}</span>
          <span class="user-role">${isHost ? '👑' : '👤'}</span>`;
        list.appendChild(div);
      }
    });
  });

  // Receive drawing objects from others
  socket.on('draw-object', (obj) => {
    // Add to local canvas without re-emitting
    if (!CANVAS.objects.find(o => o.id === obj.id)) {
      CANVAS.objects.push(obj);
      redrawAll();
    }
  });

  // Receive full canvas state on join
  socket.on('canvas-state', (objects) => {
    if (objects && objects.length > 0) {
      CANVAS.objects = objects;
      redrawAll();
    }
  });

  // Receive clear event
  socket.on('canvas-clear', () => {
    CANVAS.objects = [];
    redrawAll();
  });

  // User joined/left notifications
  socket.on('user-joined', (name) => {
    showToast('👋 ' + name + ' joined!');
    addToHistory(name + ' joined the room');
  });

  socket.on('user-left', (name) => {
    showToast('👋 ' + name + ' left');
    addToHistory(name + ' left the room');
  });

  // Receive chat history from MongoDB on join
  socket.on('chat-history', (messages) => {
    if (!messages || !messages.length) return;
    messages.forEach(m => {
      const isSelf = m.sender === APP.user.name;
      addChatMessage(m.sender, m.text, isSelf);
    });
  });

  // Receive real-time chat from other users
  socket.on('chat-message', (msg) => {
    if (msg.sender !== APP.user.name) {
      addChatMessage(msg.sender, msg.text, false);
    }
  });

  console.log('[Realtime] Connected to room:', roomId);
}

// Call this after adding an object to canvas
function emitDrawObject(obj) {
  if (socket && socket.connected) {
    socket.emit('draw-object', {
      roomId: APP.user.meetingId,
      obj: obj
    });
  }
}

// Call this when canvas is cleared
function emitClear() {
  if (socket && socket.connected) {
    socket.emit('canvas-clear', { roomId: APP.user.meetingId });
  }
}
