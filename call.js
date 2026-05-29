/* ============================================================
   DrawMe ProMax — call.js
   WebRTC-based voice call system
   ============================================================ */

const CALL = {
  active: false,
  muted: false,
  stream: null,
  peerConnections: {},
  participants: [],
  audioContext: null,
  analyser: null,
  speakingInterval: null,
};

async function joinVoiceCall() {
  try {
    CALL.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    CALL.active = true;

    // Set up audio analyser for speaking detection
    CALL.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = CALL.audioContext.createMediaStreamSource(CALL.stream);
    CALL.analyser = CALL.audioContext.createAnalyser();
    CALL.analyser.fftSize = 256;
    source.connect(CALL.analyser);

    // UI updates
    document.getElementById('join-call-btn').style.display = 'none';
    document.getElementById('leave-call-btn').style.display = '';
    document.getElementById('mute-btn').style.display = '';
    document.getElementById('call-status-text').textContent = 'In call';
    document.getElementById('call-icon').textContent = '🟢';

    // Add self to participants
    addCallParticipant(APP.user.name, true);

    // Simulate other users joining for demo
    setTimeout(() => {
      addCallParticipant('DrawBot', false);
      addCallLog('DrawBot joined the call');
    }, 1500);

    // Speaking detection
    CALL.speakingInterval = setInterval(detectSpeaking, 200);

    addCallLog(`${APP.user.name} joined the call`);
    addToTimeline(`${APP.user.name} joined the voice call`);
    showToast('📞 Joined voice call');
  } catch (err) {
    showToast('🎙️ Mic access denied: ' + err.message);
  }
}

function leaveVoiceCall() {
  if (!CALL.active) return;
  CALL.active = false;

  // Stop stream
  if (CALL.stream) CALL.stream.getTracks().forEach(t => t.stop());
  if (CALL.audioContext) CALL.audioContext.close();
  if (CALL.speakingInterval) clearInterval(CALL.speakingInterval);

  // Close peer connections
  Object.values(CALL.peerConnections).forEach(pc => pc.close());
  CALL.peerConnections = {};

  // Reset UI
  document.getElementById('join-call-btn').style.display = '';
  document.getElementById('leave-call-btn').style.display = 'none';
  document.getElementById('mute-btn').style.display = 'none';
  document.getElementById('call-status-text').textContent = 'Not in call';
  document.getElementById('call-icon').textContent = '📞';
  document.getElementById('call-participants').innerHTML = '';
  CALL.participants = [];

  addCallLog(`${APP.user.name} left the call`);
  addToTimeline(`${APP.user.name} left the voice call`);
  showToast('📵 Left voice call');
}

function toggleMute() {
  CALL.muted = !CALL.muted;
  if (CALL.stream) {
    CALL.stream.getAudioTracks().forEach(t => t.enabled = !CALL.muted);
  }
  const btn = document.getElementById('mute-btn');
  if (CALL.muted) {
    btn.textContent = '🔇 Unmute';
    btn.classList.add('muted');
    showToast('🔇 Muted');
  } else {
    btn.textContent = '🎙️ Mute';
    btn.classList.remove('muted');
    showToast('🎙️ Unmuted');
  }
}

function addCallParticipant(name, isSelf) {
  if (CALL.participants.includes(name)) return;
  CALL.participants.push(name);
  const container = document.getElementById('call-participants');
  const div = document.createElement('div');
  div.className = 'call-participant';
  div.id = 'call-p-' + name.replace(/\s/g, '_');
  div.innerHTML = `
    <div class="speak-dot" id="speak-${name.replace(/\s/g,'_')}"></div>
    <span>${name}${isSelf ? ' (You)' : ''}</span>`;
  container.appendChild(div);
}

function detectSpeaking() {
  if (!CALL.analyser || CALL.muted) return;
  const data = new Uint8Array(CALL.analyser.frequencyBinCount);
  CALL.analyser.getByteFrequencyData(data);
  const avg = data.reduce((a, b) => a + b, 0) / data.length;
  const dot = document.getElementById('speak-' + APP.user.name.replace(/\s/g,'_'));
  if (dot) dot.classList.toggle('speaking', avg > 20);
}

function addCallLog(msg) {
  const log = document.getElementById('call-log');
  if (!log) return;
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const entry = document.createElement('div');
  entry.className = 'call-log-entry';
  entry.textContent = `[${time}] ${msg}`;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}
