/* ============================================================
   DrawMe ProMax — app.js (ENHANCED)
   Core state, routing, auth, UI controls
   ============================================================ */

const APP = {
  user: { name: '', role: '', meetingId: '' },
  users: [],
  darkMode: false,
  gridOn: false,
  zoomLevel: 1,
};

/* ── PAGE ROUTING ── */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
}

/* ── AUTH ── */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  document.getElementById('generated-code').textContent = code;
  return code;
}
generateCode();

function copyMeetingCode(elemId) {
  const text = document.getElementById(elemId).textContent.trim();
  navigator.clipboard.writeText(text).catch(() => {});
  showToast('📋 Meeting code copied!');
}

function hostMeeting() {
  const name = document.getElementById('host-name').value.trim();
  if (!name) { showToast('⚠️ Please enter your name'); return; }
  const code = document.getElementById('generated-code').textContent.trim();
  APP.user = { name, role: 'Host', meetingId: code };
  startSession();
}

async function joinMeeting() {
  const name = document.getElementById('join-name').value.trim();
  const code = document.getElementById('join-code').value.trim().toUpperCase();
  if (!name) { showToast('⚠️ Please enter your name'); return; }
  if (!code || code.length < 4) { showToast('⚠️ Please enter a valid meeting code'); return; }

  // Validate meeting code with server before joining
  try {
    showToast('🔍 Checking meeting code...');
    const res = await fetch(`/api/meeting/${code}/exists`);
    const data = await res.json();
    if (!data.exists) {
      showToast('❌ Invalid meeting code. Ask the host for the correct code.');
      return;
    }
  } catch (err) {
    // If API fails (offline etc), allow join — server will double-check via socket
    console.warn('Could not validate meeting code via API, proceeding anyway.');
  }

  APP.user = { name, role: 'Participant', meetingId: code };
  startSession();
}

function startSession() {
  document.getElementById('welcome-name').textContent = APP.user.name;
  document.getElementById('landing-meeting-id').textContent = APP.user.meetingId;
  document.getElementById('landing-role').textContent = APP.user.role;
  initLandingCanvas();
  showPage('landing');
}

function goToWhiteboard() {
  document.getElementById('wb-meeting-id').textContent = APP.user.meetingId;
  showPage('whiteboard');
  initWhiteboard();
  if (typeof initRealtime === 'function') initRealtime(APP.user.meetingId, APP.user.name);
  addUser(APP.user.name, APP.user.role === 'Host');
  addToHistory(`${APP.user.name} joined the meeting`);
  addToTimeline(`${APP.user.name} joined`);
  setTimeout(() => {
    addUser('DrawBot', false);
    addToHistory('DrawBot joined the meeting');
    addToTimeline('DrawBot joined');
    addChatMessage('DrawBot', '👋 Hello! Smart shapes, selection, and grid are all enhanced!', false);
  }, 3000);
}

function logoutUser() {
  if (confirm('Leave this meeting?')) location.reload();
}

/* ── LANDING CANVAS ANIMATION ── */
function initLandingCanvas() {
  const canvas = document.getElementById('landing-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const particles = Array.from({ length: 60 }, () => ({
    x: Math.random()*canvas.width, y: Math.random()*canvas.height,
    vx: (Math.random()-0.5)*0.5, vy: (Math.random()-0.5)*0.5,
    r: Math.random()*2+0.5, alpha: Math.random()*0.5+0.1,
  }));
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p => {
      p.x+=p.vx; p.y+=p.vy;
      if (p.x<0||p.x>canvas.width) p.vx*=-1;
      if (p.y<0||p.y>canvas.height) p.vy*=-1;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(0,229,255,${p.alpha})`; ctx.fill();
    });
    particles.forEach((a,i) => particles.slice(i+1).forEach(b => {
      const d = Math.hypot(a.x-b.x,a.y-b.y);
      if (d<120) {
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
        ctx.strokeStyle=`rgba(0,229,255,${0.1*(1-d/120)})`; ctx.lineWidth=0.5; ctx.stroke();
      }
    }));
    requestAnimationFrame(draw);
  }
  draw();
}

/* ── USERS LIST ── */
function addUser(name, isHost) {
  if (APP.users.find(u => u.name === name)) return;
  APP.users.push({ name, isHost });
  renderUsers();
}
function removeUser(name) { APP.users = APP.users.filter(u => u.name !== name); renderUsers(); }
function renderUsers() {
  const list = document.getElementById('users-list');
  const count = document.getElementById('user-count');
  list.innerHTML = ''; count.textContent = APP.users.length;
  APP.users.forEach(u => {
    const div = document.createElement('div');
    div.className = 'user-item';
    div.innerHTML = `<div class="user-dot ${u.isHost?'host':''}"></div>
      <span class="user-name">${u.name}</span>
      <span class="user-role">${u.isHost?'👑':'👤'}</span>`;
    list.appendChild(div);
  });
}

/* ── DARK MODE ── */
function toggleDarkMode() {
  APP.darkMode = !APP.darkMode;
  document.body.classList.toggle('light-mode', APP.darkMode);
  document.getElementById('dark-toggle').textContent = APP.darkMode ? '☀️' : '🌙';
  // Re-draw grid in new color if on
  if (typeof redrawAll === 'function') redrawAll();
}

/* ── GRID (fixed — delegates to canvas.js toggleGrid) ── */
// toggleGrid() is now fully handled in canvas.js with canvas-drawn grid

/* ── ZOOM ── */
function zoomIn() { APP.zoomLevel = Math.min(APP.zoomLevel+0.1, 3); applyZoom(); }
function zoomOut() { APP.zoomLevel = Math.max(APP.zoomLevel-0.1, 0.3); applyZoom(); }
function applyZoom() {
  document.getElementById('zoom-display').textContent = Math.round(APP.zoomLevel*100)+'%';
  document.getElementById('main-canvas').style.transform = `scale(${APP.zoomLevel})`;
  document.getElementById('main-canvas').style.transformOrigin = 'top left';
}

/* ── RIGHT PANEL ── */
function switchPanel(name) {
  document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`.panel-tab[data-panel="${name}"]`).classList.add('active');
  document.getElementById('panel-'+name).classList.add('active');
}

/* ── TOAST ── */
function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast'; toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2600);
}

/* ── IMPORT IMAGE (fixed to use new canvas model) ── */
document.getElementById('import-btn')?.addEventListener('click', () => {
  document.getElementById('import-file').click();
});

function importImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('⚠️ Please select an image file (PNG, JPG, SVG, etc.)');
    e.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    if (typeof importImageToCanvas === 'function') {
      importImageToCanvas(ev.target.result);
    }
  };
  reader.onerror = () => showToast('❌ Could not read file. Try again.');
  reader.readAsDataURL(file);
  e.target.value = '';
}

/* ── EXPORT PNG ── */
function exportPNG() {
  const canvas = document.getElementById('main-canvas');
  const link = document.createElement('a');
  link.download = `drawme-${APP.user.meetingId}-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('📥 Board exported as PNG!');
  addToTimeline(`${APP.user.name} exported the board`);
}

/* ── SMART SHAPE RECOGNITION TOGGLE ── */
function toggleShapeRecognition() {
  if (typeof CANVAS !== 'undefined') {
    CANVAS.shapeRecognition = !CANVAS.shapeRecognition;
    showToast(CANVAS.shapeRecognition ? '✨ Smart shapes ON' : '✏️ Smart shapes OFF');
  }
}
ENDOFFILE