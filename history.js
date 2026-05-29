/* ============================================================
   DrawMe ProMax — history.js
   Activity history log and bottom timeline
   ============================================================ */

const HISTORY = {
  entries: [],
  maxTimeline: 20,
};

// ──────────── SESSION LOG (left sidebar) ────────────
function addToHistory(text) {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  HISTORY.entries.push({ text, time });

  const log = document.getElementById('session-log');
  if (!log) return;

  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = `<span class="log-time">${time}</span>${text}`;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;

  // Limit display
  while (log.children.length > 50) log.removeChild(log.firstChild);
}

// ──────────── BOTTOM TIMELINE ────────────
function addToTimeline(text) {
  const track = document.getElementById('timeline-track');
  if (!track) return;

  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const item = document.createElement('div');
  item.className = 'timeline-item';
  item.innerHTML = `${text} <span class="tl-time">${time}</span>`;
  track.appendChild(item);

  // Scroll to latest
  track.scrollLeft = track.scrollWidth;

  // Limit items
  while (track.children.length > HISTORY.maxTimeline) {
    track.removeChild(track.firstChild);
  }
}
