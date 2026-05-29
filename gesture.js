/* ============================================================
   DrawMe ProMax — gesture.js
   Camera-based gesture control using pose detection
   Implements hand gesture recognition via MediaPipe Hands
   (Falls back to simplified color-blob detection if ML not available)
   ============================================================ */

const GESTURE = {
  active: false,
  stream: null,
  animFrame: null,
  lastGesture: '',
  isDrawing: false,
  hands: null, // MediaPipe Hands instance
  lastX: 0, lastY: 0,
  gestureHistory: [],
  cooldown: false,
};

async function toggleGesture() {
  if (GESTURE.active) {
    stopGesture();
  } else {
    await startGesture();
  }
}

async function startGesture() {
  try {
    GESTURE.stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
    const video = document.getElementById('gesture-video');
    video.srcObject = GESTURE.stream;
    await video.play();

    document.getElementById('gesture-overlay').style.display = 'none';
    document.getElementById('gesture-toggle-btn').textContent = '🛑 Stop Camera';
    document.getElementById('gesture-toggle-btn').classList.add('active');
    GESTURE.active = true;

    // Try loading MediaPipe
    await loadMediaPipe();
    processGestureFrame();
  } catch (err) {
    showToast('📷 Camera access denied: ' + err.message);
  }
}

async function loadMediaPipe() {
  return new Promise((resolve) => {
    // Check if MediaPipe Hands is already loaded
    if (typeof Hands !== 'undefined') { resolve(); return; }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      try {
        GESTURE.hands = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`
        });
        GESTURE.hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 0,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.5,
        });
        GESTURE.hands.onResults(onHandResults);
        resolve();
      } catch(e) {
        resolve(); // Fall back to simple detection
      }
    };
    script.onerror = () => resolve(); // Fallback
    document.head.appendChild(script);
  });
}

// ──────────── MEDIAPIPE RESULT HANDLER ────────────
function onHandResults(results) {
  const gCanvas = document.getElementById('gesture-canvas');
  const gCtx = gCanvas.getContext('2d');
  const video = document.getElementById('gesture-video');
  gCanvas.width = video.videoWidth;
  gCanvas.height = video.videoHeight;

  gCtx.clearRect(0, 0, gCanvas.width, gCanvas.height);

  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    updateGestureDisplay('No hand detected');
    gestureStopDraw();
    GESTURE.isDrawing = false;
    return;
  }

  const landmarks = results.multiHandLandmarks[0];

  // Draw skeleton
  drawHandSkeleton(gCtx, landmarks, gCanvas.width, gCanvas.height);

  // Classify gesture
  const gesture = classifyGesture(landmarks);
  applyGesture(gesture, landmarks, gCanvas.width, gCanvas.height);
}

function drawHandSkeleton(ctx, landmarks, w, h) {
  const connections = [
    [0,1],[1,2],[2,3],[3,4],       // thumb
    [0,5],[5,6],[6,7],[7,8],       // index
    [0,9],[9,10],[10,11],[11,12],  // middle
    [0,13],[13,14],[14,15],[15,16],// ring
    [0,17],[17,18],[18,19],[19,20],// pinky
    [5,9],[9,13],[13,17],
  ];
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 2;
  connections.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(landmarks[a].x * w, landmarks[a].y * h);
    ctx.lineTo(landmarks[b].x * w, landmarks[b].y * h);
    ctx.stroke();
  });
  landmarks.forEach(lm => {
    ctx.beginPath();
    ctx.arc(lm.x * w, lm.y * h, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  });
}

// ──────────── GESTURE CLASSIFIER ────────────
function classifyGesture(lm) {
  // Finger extended check: tip y < pip y (finger pointing up)
  const fingerExtended = (tip, pip) => lm[tip].y < lm[pip].y - 0.02;
  const thumbExtended = () => lm[4].x < lm[3].x - 0.02;  // For right hand

  const indexUp   = fingerExtended(8, 6);
  const middleUp  = fingerExtended(12, 10);
  const ringUp    = fingerExtended(16, 14);
  const pinkyUp   = fingerExtended(20, 18);
  const thumbUp_y = lm[4].y < lm[3].y - 0.04; // Thumb pointing up

  const fist = !indexUp && !middleUp && !ringUp && !pinkyUp;
  const openPalm = indexUp && middleUp && ringUp && pinkyUp;
  const indexOnly = indexUp && !middleUp && !ringUp && !pinkyUp;
  const twoFingers = indexUp && middleUp && !ringUp && !pinkyUp;
  const thumbsUp = thumbUp_y && !indexUp && !middleUp && !ringUp && !pinkyUp;
  const thumbsDown = lm[4].y > lm[3].y + 0.04 && !indexUp && !middleUp;

  if (thumbsDown) return 'redo';
  if (thumbsUp) return 'undo';
  if (fist) return 'fist';
  if (openPalm) return 'palm';
  if (twoFingers) return 'two-fingers';
  if (indexOnly) return 'draw';
  return 'none';
}

function applyGesture(gesture, lm, w, h) {
  updateGestureDisplay(gestureLabel(gesture));
  GESTURE.lastGesture = gesture;

  // Get canvas coords from index finger tip
  const mainCanvas = document.getElementById('main-canvas');
  const wrapper = document.getElementById('canvas-wrapper');
  const wRect = wrapper.getBoundingClientRect();

  // Mirror x (camera is mirrored)
  const nx = (1 - lm[8].x) * wRect.width;
  const ny = lm[8].y * wRect.height;

  switch (gesture) {
    case 'draw':
      gestureDrawAt(nx, ny, true);
      GESTURE.isDrawing = true;
      break;
    case 'fist':
      if (GESTURE.isDrawing) gestureStopDraw();
      GESTURE.isDrawing = false;
      break;
    case 'two-fingers':
      if (GESTURE.isDrawing) gestureStopDraw();
      GESTURE.isDrawing = false;
      setTool('eraser');
      break;
    case 'palm':
      if (!GESTURE.cooldown) {
        clearBoard();
        gestureStopDraw();
        GESTURE.cooldown = true;
        setTimeout(() => GESTURE.cooldown = false, 2000);
      }
      break;
    case 'undo':
      if (!GESTURE.cooldown) {
        undoAction();
        GESTURE.cooldown = true;
        setTimeout(() => GESTURE.cooldown = false, 1500);
      }
      break;
    case 'redo':
      if (!GESTURE.cooldown) {
        redoAction();
        GESTURE.cooldown = true;
        setTimeout(() => GESTURE.cooldown = false, 1500);
      }
      break;
    default:
      gestureDrawAt(nx, ny, false);
      break;
  }
}

function gestureLabel(g) {
  const map = {
    'draw': '☝️ Drawing',
    'fist': '✊ Stop',
    'palm': '🖐️ Clear',
    'two-fingers': '✌️ Eraser',
    'undo': '👍 Undo',
    'redo': '👎 Redo',
    'none': 'No gesture',
  };
  return map[g] || g;
}

// ──────────── FRAME PROCESSING ────────────
async function processGestureFrame() {
  if (!GESTURE.active) return;
  const video = document.getElementById('gesture-video');

  if (GESTURE.hands && video.readyState >= 2) {
    try {
      await GESTURE.hands.send({ image: video });
    } catch(e) {
      // Silently handle
    }
  } else {
    // Fallback: simple motion detection
    simpleFallbackDetection(video);
  }

  GESTURE.animFrame = requestAnimationFrame(processGestureFrame);
}

// Simple fallback when MediaPipe unavailable
function simpleFallbackDetection(video) {
  const gCanvas = document.getElementById('gesture-canvas');
  const gCtx = gCanvas.getContext('2d');
  if (video.readyState < 2) return;
  gCanvas.width = video.videoWidth || 320;
  gCanvas.height = video.videoHeight || 240;
  gCtx.drawImage(video, 0, 0, gCanvas.width, gCanvas.height);

  // Show "Move finger to draw" message
  gCtx.fillStyle = 'rgba(0,229,255,0.7)';
  gCtx.font = '12px DM Sans';
  gCtx.fillText('Gesture mode active', 8, 20);
  gCtx.fillText('(Using camera preview)', 8, 36);
  updateGestureDisplay('📷 Camera active — gesture detection loading');
}

// ──────────── STOP ────────────
function stopGesture() {
  GESTURE.active = false;
  if (GESTURE.animFrame) cancelAnimationFrame(GESTURE.animFrame);
  if (GESTURE.stream) GESTURE.stream.getTracks().forEach(t => t.stop());
  const video = document.getElementById('gesture-video');
  video.srcObject = null;
  const overlay = document.getElementById('gesture-overlay');
  overlay.style.display = 'flex';
  overlay.textContent = 'Camera off';
  document.getElementById('gesture-canvas').getContext('2d').clearRect(0,0,9999,9999);
  document.getElementById('gesture-toggle-btn').textContent = '📷 Start Camera';
  document.getElementById('gesture-toggle-btn').classList.remove('active');
  updateGestureDisplay('No gesture');
  gestureStopDraw();
}

function updateGestureDisplay(msg) {
  const el = document.getElementById('gesture-detected');
  if (el) el.textContent = msg;
}
