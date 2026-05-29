/* ============================================================
   DrawMe ProMax — stickies.js
   Draggable, resizable, colored sticky notes + emoji stamps
   ============================================================ */

const STICKIES = {
  colors: ['#ffe066', '#ff9ecd', '#a8f0c8', '#a8d8ff', '#ffb347', '#e8a0ff'],
  colorIdx: 0,
  count: 0,
};

function addSticky(text, x, y, color) {
  const container = document.getElementById('stickies-container');
  const canvas = document.getElementById('main-canvas');
  STICKIES.count++;

  const stickyColor = color || STICKIES.colors[STICKIES.colorIdx % STICKIES.colors.length];
  STICKIES.colorIdx++;

  const posX = x || (80 + Math.random() * (canvas.width * 0.6));
  const posY = y || (80 + Math.random() * (canvas.height * 0.4));

  const sticky = document.createElement('div');
  sticky.className = 'sticky-note';
  sticky.id = 'sticky-' + STICKIES.count;
  sticky.style.cssText = `
    left: ${posX}px; top: ${posY}px;
    background: ${stickyColor};
    transform: rotate(${(Math.random() - 0.5) * 4}deg);
  `;

  sticky.innerHTML = `
    <div class="sticky-header">
      <button class="sticky-btn" title="Change color" onclick="changeStickyColor(this.closest('.sticky-note'))">🎨</button>
      <button class="sticky-btn" title="Delete" onclick="this.closest('.sticky-note').remove()">✕</button>
    </div>
    <textarea class="sticky-textarea" placeholder="Type note here...">${text || ''}</textarea>`;

  container.appendChild(sticky);
  makeDraggable(sticky);

  addToHistory(`${APP.user.name} added a sticky note`);
  addToTimeline(`${APP.user.name} added sticky note`);
  return sticky;
}

function changeStickyColor(sticky) {
  STICKIES.colorIdx++;
  sticky.style.background = STICKIES.colors[STICKIES.colorIdx % STICKIES.colors.length];
}

// ──────────── DRAGGABLE ────────────
function makeDraggable(el) {
  let startX, startY, origX, origY, dragging = false;

  el.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON') return;
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    origX = parseInt(el.style.left) || 0;
    origY = parseInt(el.style.top) || 0;
    el.style.zIndex = 999;
    el.style.transition = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    el.style.left = (origX + e.clientX - startX) + 'px';
    el.style.top = (origY + e.clientY - startY) + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (dragging) {
      dragging = false;
      el.style.zIndex = '';
      el.style.transition = '';
    }
  });
}

// ──────────── EMOJI STAMPS ────────────
const EMOJI_LIST = [
  '😀','😂','😍','🤔','😎','🥳','😭','🤯','🔥','⭐',
  '💯','👍','👎','✅','❌','💡','🎯','🚀','🌈','💎',
  '🎨','✏️','📝','🖼️','🎭','🏆','🌟','💫','🎉','🎊',
  '❤️','💛','💚','💙','💜','🖤','🤍','🧡','🔴','🟡',
  '🟢','🔵','🟣','⬛','⬜','🟤','🟠','🟥','🟦','🟩',
];

function addEmoji() {
  document.getElementById('emoji-modal').style.display = 'flex';
  const grid = document.getElementById('emoji-grid');
  grid.innerHTML = '';
  EMOJI_LIST.forEach(em => {
    const div = document.createElement('div');
    div.className = 'emoji-item';
    div.textContent = em;
    div.onclick = () => {
      placeEmoji(em);
      closeEmojiModal();
    };
    grid.appendChild(div);
  });
}

function closeEmojiModal() {
  document.getElementById('emoji-modal').style.display = 'none';
}

function placeEmoji(emoji) {
  const container = document.getElementById('emoji-container');
  const canvas = document.getElementById('main-canvas');

  const el = document.createElement('div');
  el.className = 'emoji-stamp';
  el.textContent = emoji;
  el.style.left = (80 + Math.random() * (canvas.width * 0.7)) + 'px';
  el.style.top = (80 + Math.random() * (canvas.height * 0.6)) + 'px';

  // Double-click to remove
  el.addEventListener('dblclick', () => el.remove());
  container.appendChild(el);
  makeDraggable(el);

  addToTimeline(`${APP.user.name} added ${emoji}`);
}
