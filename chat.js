/* ============================================================
   DrawMe ProMax — chat.js
   Real-time chat (simulated for local; WebSocket-ready)
   ============================================================ */

const CHAT = {
  messages: [],
};

function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  addChatMessage(APP.user.name, text, true);
  addToTimeline(`${APP.user.name} sent a message`);

  // Emit to server (saved to MongoDB + broadcast to others)
  if (typeof socket !== 'undefined' && socket && socket.connected) {
    socket.emit('chat-message', {
      roomId: APP.user.meetingId,
      sender: APP.user.name,
      text: text,
    });
  }

  // DrawBot reply (demo)
  if (Math.random() < 0.3) {
    setTimeout(() => {
      const replies = [
        '👍 Nice!', '😊 Cool drawing!', 'Love it!',
        'Great work! Keep going!', '🔥 That looks amazing!',
        'Can you draw a circle next?', '✏️ I love collaborating!'
      ];
      addChatMessage('DrawBot', replies[Math.floor(Math.random() * replies.length)], false);
    }, 1000 + Math.random() * 2000);
  }
}

function chatKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage();
  }
}

function addChatMessage(sender, text, isSelf) {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  CHAT.messages.push({ sender, text, time, isSelf });

  const container = document.getElementById('chat-messages');
  if (!container) return;

  const msg = document.createElement('div');
  msg.className = 'chat-msg' + (isSelf ? ' self' : '');
  msg.innerHTML = `
    <div class="chat-msg-header">
      <span class="chat-sender">${escapeHtml(sender)}</span>
      <span class="chat-time">${time}</span>
    </div>
    <div class="chat-bubble">${escapeHtml(text)}</div>`;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
