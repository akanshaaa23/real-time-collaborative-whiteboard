/* ============================================================
   DrawMe ProMax — canvas.js (ENHANCED)
   + Smart Shape Recognition
   + Object Selection, Movement & Resize
   + Grid Fixed (canvas-drawn)
   + Stable State Management (object model)
   ============================================================ */

const CANVAS = {
  ctx: null, canvas: null,
  tool: 'pencil', color: '#000000', fillColor: '#ffffff',
  strokeSize: 3, brushType: 'round',
  isDrawing: false, startX: 0, startY: 0, lastX: 0, lastY: 0,
  snapshot: null,
  undoStack: [], redoStack: [],
  sprayInterval: null,
  currentPath: [],
  shapeRecognition: true,
  objects: [], nextId: 1,
  selectedId: null, dragOffsetX: 0, dragOffsetY: 0,
  resizeHandle: null, isDragging: false, isResizing: false,
  gridOn: false, gridSize: 30,
};

function initWhiteboard() {
  const canvas = document.getElementById('main-canvas');
  const wrapper = document.getElementById('canvas-wrapper');
  CANVAS.canvas = canvas;
  CANVAS.ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
    redrawAll();
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  CANVAS.ctx.fillStyle = '#ffffff';
  CANVAS.ctx.fillRect(0, 0, canvas.width, canvas.height);
  saveToUndoStack();

  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('mouseleave', onMouseLeave);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); onMouseDown(touchToMouse(e)); }, { passive: false });
  canvas.addEventListener('touchmove',  e => { e.preventDefault(); onMouseMove(touchToMouse(e)); }, { passive: false });
  canvas.addEventListener('touchend',   e => { e.preventDefault(); onMouseUp(); }, { passive: false });
  canvas.addEventListener('dblclick', onDoubleClick);

  // Right-click to delete the hovered/selected shape
  canvas.addEventListener('contextmenu', e => {
    e.preventDefault();
    const { x, y } = getPos(e);
    // First check selected object
    if (CANVAS.selectedId !== null) {
      const obj = CANVAS.objects.find(o => o.id === CANVAS.selectedId);
      if (obj && hitTest(obj, x, y)) { deleteObject(obj.id); return; }
    }
    // Otherwise find top object under cursor
    for (let i = CANVAS.objects.length - 1; i >= 0; i--) {
      if (hitTest(CANVAS.objects[i], x, y)) { deleteObject(CANVAS.objects[i].id); return; }
    }
  });

  // Keyboard: Delete/Backspace removes selected shape
  document.addEventListener('keydown', e => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && CANVAS.selectedId !== null) {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
      deleteObject(CANVAS.selectedId);
    }
  });
  updateCursor();
}

function touchToMouse(e) {
  const t = e.touches[0];
  return { clientX: t.clientX, clientY: t.clientY, buttons: 1 };
}

function getPos(e) {
  const rect = CANVAS.canvas.getBoundingClientRect();
  const scaleX = CANVAS.canvas.width / rect.width;
  const scaleY = CANVAS.canvas.height / rect.height;
  return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
}

/* ── MOUSE HANDLERS ── */
function onMouseDown(e) {
  const { x, y } = getPos(e);
  CANVAS.startX = x; CANVAS.startY = y; CANVAS.lastX = x; CANVAS.lastY = y;

  if (CANVAS.tool === 'select') { handleSelectMouseDown(x, y); return; }

  CANVAS.isDrawing = true;
  CANVAS.currentPath = [{ x, y }];

  if (CANVAS.tool === 'fill') {
    floodFill(Math.round(x), Math.round(y), CANVAS.color);
    addToHistory(`${APP.user.name} used fill tool`);
    addToTimeline(`${APP.user.name} filled area`);
    CANVAS.isDrawing = false;
    return;
  }
  if (['line','rect','circle'].includes(CANVAS.tool)) {
    CANVAS.snapshot = CANVAS.ctx.getImageData(0, 0, CANVAS.canvas.width, CANVAS.canvas.height);
  }
  if (CANVAS.tool === 'pencil' || CANVAS.tool === 'eraser') {
    CANVAS.ctx.beginPath();
    CANVAS.ctx.moveTo(x, y);
    if (CANVAS.brushType === 'spray') sprayPaint(x, y);
  }
}

function onMouseMove(e) {
  const { x, y } = getPos(e);
  if (CANVAS.tool === 'select') { handleSelectMouseMove(x, y); return; }
  if (!CANVAS.isDrawing) return;
  const ctx = CANVAS.ctx;
  CANVAS.currentPath.push({ x, y });

  switch (CANVAS.tool) {
    case 'pencil':
      ctx.lineWidth = CANVAS.strokeSize;
      ctx.strokeStyle = CANVAS.color;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.globalAlpha = CANVAS.brushType === 'marker' ? 0.5 : 1;
      if (CANVAS.brushType === 'square') ctx.lineCap = 'square';
      if (CANVAS.brushType === 'spray') { sprayPaint(x, y); break; }
      ctx.lineTo(x, y); ctx.stroke();
      break;
    case 'eraser':
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = CANVAS.strokeSize * 3; ctx.lineCap = 'round';
      ctx.lineTo(x, y); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      break;
    case 'line': case 'rect': case 'circle':
      ctx.putImageData(CANVAS.snapshot, 0, 0);
      drawShapePreview(CANVAS.tool, CANVAS.startX, CANVAS.startY, x, y);
      break;
  }
  CANVAS.lastX = x; CANVAS.lastY = y;
}

function onMouseUp(e) {
  const pos = e ? getPos(e) : { x: CANVAS.lastX, y: CANVAS.lastY };
  if (CANVAS.tool === 'select') { handleSelectMouseUp(); return; }
  if (!CANVAS.isDrawing) return;
  CANVAS.isDrawing = false;
  CANVAS.ctx.globalAlpha = 1;
  CANVAS.ctx.globalCompositeOperation = 'source-over';
  CANVAS.ctx.beginPath();
  if (CANVAS.sprayInterval) { clearInterval(CANVAS.sprayInterval); CANVAS.sprayInterval = null; }

  const path = CANVAS.currentPath;
  const x = pos.x, y = pos.y;

  if (CANVAS.tool === 'pencil' && path.length > 5 && CANVAS.shapeRecognition) {
    const recognized = recognizeShape(path);
    if (recognized) {
      // Restore to before the stroke
      if (CANVAS.undoStack.length > 0) {
        CANVAS.ctx.putImageData(CANVAS.undoStack[CANVAS.undoStack.length - 1].snap, 0, 0);
      }
      const { type, x1, y1, x2, y2 } = recognized;
      const id = addObject({ type, x: x1, y: y1, w: x2 - x1, h: y2 - y1,
        color: CANVAS.color, fillColor: CANVAS.fillColor, strokeSize: CANVAS.strokeSize });
      animateShapeIn(id);
      saveToUndoStack();
      showToast('✨ Converted to perfect ' + type + '!');
      addToHistory(`${APP.user.name} drew a ${type} (smart)`);
      addToTimeline(`${APP.user.name} drew a ${type}`);
      return;
    }
  }

  if (CANVAS.tool === 'pencil' && path.length > 1) {
    addObject({ type: 'freehand', points: [...path],
      color: CANVAS.color, strokeSize: CANVAS.strokeSize, brushType: CANVAS.brushType,
      x: 0, y: 0, w: 0, h: 0 });
  } else if (['line','rect','circle'].includes(CANVAS.tool)) {
    const x1 = Math.min(CANVAS.startX, x), y1 = Math.min(CANVAS.startY, y);
    const x2 = Math.max(CANVAS.startX, x), y2 = Math.max(CANVAS.startY, y);
    addObject({ type: CANVAS.tool, x: x1, y: y1, w: x2 - x1, h: y2 - y1,
      color: CANVAS.color, fillColor: CANVAS.fillColor, strokeSize: CANVAS.strokeSize });
  } else if (CANVAS.tool === 'eraser') {
    const snap = CANVAS.ctx.getImageData(0, 0, CANVAS.canvas.width, CANVAS.canvas.height);
    CANVAS.objects.push({ id: CANVAS.nextId++, type: 'imageData', imageData: snap, x:0, y:0, w:0, h:0 });
  }

  redrawAll();
  saveToUndoStack();
  const toolNames = { pencil: 'drew', eraser: 'erased', line: 'drew a line', rect: 'drew a rectangle', circle: 'drew a circle' };
  addToHistory(`${APP.user.name} ${toolNames[CANVAS.tool] || 'drew'}`);
}

function onMouseLeave(e) {
  if (CANVAS.isDrawing) onMouseUp(e);
  if (CANVAS.isDragging || CANVAS.isResizing) handleSelectMouseUp();
}

function onDoubleClick(e) {
  const { x, y } = getPos(e);

  // Check if double-clicking a diagram object — open editor
  for (let i = CANVAS.objects.length - 1; i >= 0; i--) {
    const obj = CANVAS.objects[i];
    if (obj.type === 'diagram' && hitTest(obj, x, y)) {
      if (typeof openDiagramEditor === 'function') openDiagramEditor(obj);
      return;
    }
  }

  if (CANVAS.tool !== 'text') return;
  const overlay = document.getElementById('text-input-overlay');
  const rect = CANVAS.canvas.getBoundingClientRect();
  overlay.style.display = 'block';
  overlay.style.left = (e.clientX - rect.left) + 'px';
  overlay.style.top = (e.clientY - rect.top) + 'px';
  overlay.value = '';
  overlay.focus();

  function commit() {
    const text = overlay.value;
    if (text.trim()) {
      addObject({ type: 'text', text, x, y, w: 200, h: 30,
        color: CANVAS.color, strokeSize: CANVAS.strokeSize });
      redrawAll(); saveToUndoStack();
      addToTimeline(`${APP.user.name} added text`);
    }
    overlay.style.display = 'none';
    overlay.removeEventListener('blur', commit);
  }
  overlay.addEventListener('blur', commit);
}

/* ── OBJECT MODEL ── */
function addObject(props) {
  const obj = { id: CANVAS.nextId++, ...props };
  CANVAS.objects.push(obj);
  if (typeof emitDrawObject === 'function') emitDrawObject(obj);
  return obj.id;
}

function redrawAll() {
  const ctx = CANVAS.ctx, canvas = CANVAS.canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (CANVAS.gridOn) drawGridOverlay();
  CANVAS.objects.forEach(obj => drawObject(ctx, obj));
  if (CANVAS.selectedId !== null) {
    const obj = CANVAS.objects.find(o => o.id === CANVAS.selectedId);
    if (obj) drawSelectionBox(obj);
  }
}

function drawObject(ctx, obj, alpha) {
  ctx.save();
  if (alpha !== undefined) ctx.globalAlpha = alpha;
  switch (obj.type) {
    case 'freehand':
      if (!obj.points || obj.points.length < 2) break;
      ctx.beginPath();
      ctx.lineWidth = obj.strokeSize; ctx.strokeStyle = obj.color;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.globalAlpha = obj.brushType === 'marker' ? 0.5 : (alpha || 1);
      ctx.moveTo(obj.points[0].x, obj.points[0].y);
      for (let i = 1; i < obj.points.length; i++) ctx.lineTo(obj.points[i].x, obj.points[i].y);
      ctx.stroke();
      break;
    case 'line':
      ctx.beginPath(); ctx.lineWidth = obj.strokeSize;
      ctx.strokeStyle = obj.color; ctx.lineCap = 'round';
      ctx.moveTo(obj.x, obj.y); ctx.lineTo(obj.x + obj.w, obj.y + obj.h); ctx.stroke();
      break;
    case 'rect':
      ctx.beginPath(); ctx.lineWidth = obj.strokeSize;
      ctx.strokeStyle = obj.color; ctx.fillStyle = obj.fillColor || 'transparent';
      ctx.rect(obj.x, obj.y, obj.w, obj.h);
      if (obj.fillColor && obj.fillColor !== '#ffffff') ctx.fill();
      ctx.stroke();
      break;
    case 'circle':
      ctx.beginPath(); ctx.lineWidth = obj.strokeSize;
      ctx.strokeStyle = obj.color; ctx.fillStyle = obj.fillColor || 'transparent';
      const rx = Math.abs(obj.w)/2||1, ry = Math.abs(obj.h)/2||1;
      ctx.ellipse(obj.x + obj.w/2, obj.y + obj.h/2, rx, ry, 0, 0, Math.PI*2);
      if (obj.fillColor && obj.fillColor !== '#ffffff') ctx.fill();
      ctx.stroke();
      break;
    case 'text':
      ctx.font = `${(obj.strokeSize||3)*5+12}px 'DM Sans', sans-serif`;
      ctx.fillStyle = obj.color;
      ctx.fillText(obj.text, obj.x, obj.y);
      break;
    case 'imageData':
      if (obj.imageData) ctx.putImageData(obj.imageData, 0, 0);
      break;
    case 'generatedImage':
      if (obj.img) ctx.drawImage(obj.img, obj.x, obj.y, obj.w, obj.h);
      break;
    case 'diagram':
      if (typeof drawDiagram === 'function') drawDiagram(ctx, obj);
      break;
    // Complex voice/shape-picker objects drawn via dedicated functions
    case 'sun':      { const r=obj.h/2; _drawSunObj(ctx,obj.x+obj.w/2,obj.y+r,r,obj.color||CANVAS.color,obj.strokeSize||2); break; }
    case 'tree':     { _drawTreeObj(ctx,obj.x+obj.w/2,obj.y+obj.h/2,obj.h/2,obj.color||CANVAS.color); break; }
    case 'flower':   { _drawFlowerObj(ctx,obj.x+obj.w/2,obj.y+obj.h/2,obj.h/2,obj.color||CANVAS.color,obj.strokeSize||2); break; }
    case 'heart':    { _drawHeartObj(ctx,obj.x+obj.w/2,obj.y+obj.h/2,obj.h/2,obj.color||CANVAS.color,obj.fillColor||obj.color||CANVAS.color,obj.strokeSize||2); break; }
    case 'cloud':    { _drawCloudObj(ctx,obj.x,obj.y,obj.w,obj.h,obj.color||CANVAS.color,obj.strokeSize||2); break; }
    case 'rocket':   { _drawRocketObj(ctx,obj.x+obj.w/2,obj.y+obj.h/2,obj.h/2,obj.color||CANVAS.color); break; }
    case 'rainbow':  { _drawRainbowObj(ctx,obj.x+obj.w/2,obj.y+obj.h/2,obj.h/2,obj.strokeSize||3); break; }
    case 'smiley':   { _drawSmileyObj(ctx,obj.x+obj.w/2,obj.y+obj.h/2,obj.h/2,obj.color||CANVAS.color,obj.strokeSize||2); break; }
    case 'house':    { _drawHouseObj(ctx,obj.x,obj.y,obj.w,obj.h,obj.color||CANVAS.color); break; }
    case 'mountain': { _drawMountainObj(ctx,obj.x,obj.y,obj.w,obj.h,obj.color||CANVAS.color,obj.strokeSize||2); break; }
    case 'wave':     { _drawWaveObj(ctx,obj.x,obj.y,obj.w,obj.h,obj.color||CANVAS.color,obj.strokeSize||3); break; }
    case 'lightning':{ _drawLightningObj(ctx,obj.x,obj.y,obj.w,obj.h,obj.color||CANVAS.color,obj.fillColor||'#FFD700',obj.strokeSize||2); break; }
    case 'snowflake':{ _drawSnowflakeObj(ctx,obj.x+obj.w/2,obj.y+obj.h/2,obj.h/2,obj.color||CANVAS.color,obj.strokeSize||2); break; }
    case 'leaf':     { _drawLeafObj(ctx,obj.x,obj.y,obj.w,obj.h,obj.color||CANVAS.color,obj.strokeSize||2); break; }
    case 'fish':     { _drawFishObj(ctx,obj.x,obj.y,obj.w,obj.h,obj.color||CANVAS.color,obj.fillColor||obj.color||CANVAS.color,obj.strokeSize||2); break; }
    case 'butterfly':{ _drawButterflyObj(ctx,obj.x,obj.y,obj.w,obj.h,obj.color||CANVAS.color,obj.strokeSize||2); break; }
    case 'crown':    { _drawCrownObj(ctx,obj.x,obj.y,obj.w,obj.h,obj.color||CANVAS.color,obj.fillColor||'#FFD700',obj.strokeSize||2); break; }
    case 'gift':     { _drawGiftObj(ctx,obj.x,obj.y,obj.w,obj.h,obj.color||CANVAS.color,obj.strokeSize||2); break; }
    case 'music':    { _drawMusicObj(ctx,obj.x+obj.w/2,obj.y+obj.h/2,obj.h/2,obj.color||CANVAS.color,obj.strokeSize||2); break; }
    case 'clock':    { _drawClockObj(ctx,obj.x+obj.w/2,obj.y+obj.h/2,obj.h/2,obj.color||CANVAS.color,obj.strokeSize||2); break; }
    case 'umbrella': { _drawUmbrellaObj(ctx,obj.x,obj.y,obj.w,obj.h,obj.color||CANVAS.color,obj.strokeSize||2); break; }
    case 'car':      { _drawCarObj(ctx,obj.x,obj.y,obj.w,obj.h,obj.color||CANVAS.color,obj.fillColor||obj.color||CANVAS.color,obj.strokeSize||2); break; }
    case 'sunflower':{ _drawSunflowerObj(ctx,obj.x+obj.w/2,obj.y+obj.h/2,obj.h/2,obj.color||CANVAS.color,obj.strokeSize||2); break; }
    case 'triangle': {
      ctx.beginPath();
      ctx.moveTo(obj.x+obj.w/2,obj.y); ctx.lineTo(obj.x+obj.w,obj.y+obj.h); ctx.lineTo(obj.x,obj.y+obj.h);
      ctx.closePath(); ctx.fillStyle=obj.fillColor||'transparent'; ctx.strokeStyle=obj.color||CANVAS.color; ctx.lineWidth=obj.strokeSize||2;
      if(obj.fillColor&&obj.fillColor!=='#ffffff') ctx.fill(); ctx.stroke(); break;
    }
    case 'diamond': {
      ctx.beginPath();
      ctx.moveTo(obj.x+obj.w/2,obj.y); ctx.lineTo(obj.x+obj.w,obj.y+obj.h/2);
      ctx.lineTo(obj.x+obj.w/2,obj.y+obj.h); ctx.lineTo(obj.x,obj.y+obj.h/2);
      ctx.closePath(); ctx.fillStyle=obj.fillColor||'transparent'; ctx.strokeStyle=obj.color||CANVAS.color; ctx.lineWidth=obj.strokeSize||2;
      if(obj.fillColor&&obj.fillColor!=='#ffffff') ctx.fill(); ctx.stroke(); break;
    }
    case 'star': {
      const scx=obj.x+obj.w/2, scy=obj.y+obj.h/2, sr=Math.min(obj.w,obj.h)/2, sir=sr*0.4;
      ctx.beginPath();
      for(let i=0;i<10;i++){const a=(i/10)*Math.PI*2-Math.PI/2,r2=i%2===0?sr:sir;i===0?ctx.moveTo(scx+Math.cos(a)*r2,scy+Math.sin(a)*r2):ctx.lineTo(scx+Math.cos(a)*r2,scy+Math.sin(a)*r2);}
      ctx.closePath(); ctx.fillStyle=obj.fillColor||obj.color||CANVAS.color; ctx.strokeStyle=obj.color||CANVAS.color; ctx.lineWidth=obj.strokeSize||2; ctx.fill(); ctx.stroke(); break;
    }
    case 'hexagon': case 'pentagon': case 'octagon': {
      const sides={'hexagon':6,'pentagon':5,'octagon':8}[obj.type];
      const pcx=obj.x+obj.w/2, pcy=obj.y+obj.h/2, pr=Math.min(obj.w,obj.h)/2;
      ctx.beginPath();
      for(let i=0;i<=sides;i++){const a=(i/sides)*Math.PI*2-Math.PI/2;i===0?ctx.moveTo(pcx+Math.cos(a)*pr,pcy+Math.sin(a)*pr):ctx.lineTo(pcx+Math.cos(a)*pr,pcy+Math.sin(a)*pr);}
      ctx.closePath(); ctx.fillStyle=obj.fillColor||'transparent'; ctx.strokeStyle=obj.color||CANVAS.color; ctx.lineWidth=obj.strokeSize||2;
      if(obj.fillColor&&obj.fillColor!=='#ffffff') ctx.fill(); ctx.stroke(); break;
    }
    case 'arrow': {
      const ax1=obj.x,ay1=obj.y+obj.h/2,ax2=obj.x+obj.w,ay2=obj.y+obj.h/2;
      const aang=Math.atan2(ay2-ay1,ax2-ax1),ahl=Math.max(16,obj.h*0.4);
      ctx.beginPath(); ctx.moveTo(ax1,ay1); ctx.lineTo(ax2,ay2);
      ctx.strokeStyle=obj.color||CANVAS.color; ctx.lineWidth=obj.strokeSize||2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ax2,ay2);
      ctx.lineTo(ax2-ahl*Math.cos(aang-Math.PI/6),ay2-ahl*Math.sin(aang-Math.PI/6));
      ctx.lineTo(ax2-ahl*Math.cos(aang+Math.PI/6),ay2-ahl*Math.sin(aang+Math.PI/6));
      ctx.closePath(); ctx.fillStyle=obj.color||CANVAS.color; ctx.fill(); break;
    }
    case 'cross': {
      const cw2=obj.w*0.3, ch2=obj.h*0.3, ccx=obj.x+obj.w/2, ccy=obj.y+obj.h/2;
      ctx.fillStyle=obj.color||CANVAS.color;
      ctx.fillRect(ccx-cw2/2, obj.y, cw2, obj.h);
      ctx.fillRect(obj.x, ccy-ch2/2, obj.w, ch2); break;
    }
    case 'crescent': {
      const crcx=obj.x+obj.w/2, crcy=obj.y+obj.h/2, crr=Math.min(obj.w,obj.h)/2;
      ctx.beginPath(); ctx.arc(crcx,crcy,crr,0,Math.PI*2);
      ctx.fillStyle=obj.fillColor||obj.color||CANVAS.color; ctx.fill();
      ctx.save(); ctx.globalCompositeOperation='destination-out';
      ctx.beginPath(); ctx.arc(crcx+crr*0.35,crcy-crr*0.1,crr*0.75,0,Math.PI*2);
      ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(crcx,crcy,crr,0,Math.PI*2);
      ctx.strokeStyle=obj.color||CANVAS.color; ctx.lineWidth=obj.strokeSize||2; ctx.stroke(); break;
    }
    case 'parallelogram': {
      const pw=obj.w, ph=obj.h, poff=pw*0.25;
      ctx.beginPath();
      ctx.moveTo(obj.x+poff,obj.y); ctx.lineTo(obj.x+pw,obj.y);
      ctx.lineTo(obj.x+pw-poff,obj.y+ph); ctx.lineTo(obj.x,obj.y+ph);
      ctx.closePath(); ctx.fillStyle=obj.fillColor||'transparent'; ctx.strokeStyle=obj.color||CANVAS.color; ctx.lineWidth=obj.strokeSize||2;
      if(obj.fillColor&&obj.fillColor!=='#ffffff') ctx.fill(); ctx.stroke(); break;
    }
    case 'cylinder': {
      const cylcx=obj.x+obj.w/2, cyltop=obj.y, cylbot=obj.y+obj.h, cylrx=obj.w/2, cylry=Math.min(cylrx/3,obj.h/8);
      ctx.fillStyle=obj.fillColor||'transparent'; ctx.strokeStyle=obj.color||CANVAS.color; ctx.lineWidth=obj.strokeSize||2;
      ctx.beginPath(); ctx.ellipse(cylcx,cyltop+cylry,cylrx,cylry,0,0,Math.PI*2);
      if(obj.fillColor&&obj.fillColor!=='#ffffff') ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(obj.x,cyltop+cylry); ctx.lineTo(obj.x,cylbot-cylry);
      ctx.ellipse(cylcx,cylbot-cylry,cylrx,cylry,0,Math.PI,0); ctx.lineTo(obj.x+obj.w,cyltop+cylry); ctx.closePath();
      if(obj.fillColor&&obj.fillColor!=='#ffffff') ctx.fill(); ctx.stroke(); break;
    }
    case 'cone': {
      const concx=obj.x+obj.w/2, conrx=obj.w/2, conry=conrx/3;
      ctx.fillStyle=obj.fillColor||'transparent'; ctx.strokeStyle=obj.color||CANVAS.color; ctx.lineWidth=obj.strokeSize||2;
      ctx.beginPath(); ctx.moveTo(concx,obj.y); ctx.lineTo(obj.x+obj.w,obj.y+obj.h);
      ctx.ellipse(concx,obj.y+obj.h,conrx,conry,0,0,Math.PI*2); ctx.lineTo(obj.x,obj.y+obj.h); ctx.closePath();
      if(obj.fillColor&&obj.fillColor!=='#ffffff') ctx.fill(); ctx.stroke(); break;
    }
    case 'square': {
      const sq=Math.min(obj.w,obj.h);
      ctx.beginPath(); ctx.rect(obj.x,obj.y,sq,sq);
      ctx.fillStyle=obj.fillColor||'transparent'; ctx.strokeStyle=obj.color||CANVAS.color; ctx.lineWidth=obj.strokeSize||2;
      if(obj.fillColor&&obj.fillColor!=='#ffffff') ctx.fill(); ctx.stroke(); break;
    }
  }
  ctx.restore();
}

/* ── COMPLEX OBJECT DRAW HELPERS ── */
function _drawSunObj(ctx,cx,cy,r,col,sw){
  for(let i=0;i<12;i++){const a=(i/12)*Math.PI*2;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r*1.1,cy+Math.sin(a)*r*1.1);ctx.lineTo(cx+Math.cos(a)*r*1.7,cy+Math.sin(a)*r*1.7);ctx.strokeStyle=col;ctx.lineWidth=sw;ctx.lineCap='round';ctx.stroke();}
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle='#FFD700';ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=sw;ctx.stroke();
}
function _drawTreeObj(ctx,cx,cy,r,col){
  ctx.fillStyle='#8B4513';ctx.fillRect(cx-r*0.15,cy+r*0.2,r*0.3,r*0.8);
  ctx.fillStyle=col;
  [[cx,cy-r*0.3,r*0.6],[cx-r*0.4,cy,r*0.5],[cx+r*0.4,cy,r*0.5]].forEach(([x,y,rad])=>{ctx.beginPath();ctx.arc(x,y,rad,0,Math.PI*2);ctx.fill();});
}
function _drawFlowerObj(ctx,cx,cy,r,col,sw){
  ctx.strokeStyle='#228B22';ctx.lineWidth=sw;ctx.beginPath();ctx.moveTo(cx,cy+r*0.3);ctx.lineTo(cx,cy+r);ctx.stroke();
  ctx.fillStyle=col;
  for(let i=0;i<5;i++){const a=(i/5)*Math.PI*2-Math.PI/2;ctx.beginPath();ctx.arc(cx+Math.cos(a)*r*0.35,cy+Math.sin(a)*r*0.35,r*0.3,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#FFD700';ctx.beginPath();ctx.arc(cx,cy,r*0.2,0,Math.PI*2);ctx.fill();
}
function _drawHeartObj(ctx,cx,cy,r,col,fill,sw){
  ctx.beginPath();ctx.moveTo(cx,cy+r*0.3);ctx.bezierCurveTo(cx-r,cy-r*0.5,cx-r*1.5,cy+r*0.3,cx,cy+r);ctx.bezierCurveTo(cx+r*1.5,cy+r*0.3,cx+r,cy-r*0.5,cx,cy+r*0.3);ctx.closePath();
  ctx.fillStyle=fill||col;ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=sw;ctx.stroke();
}
function _drawCloudObj(ctx,x,y,w,h,col,sw){
  ctx.fillStyle=col;
  [[x+w*0.25,y+h*0.5,h*0.5],[x+w*0.5,y+h*0.35,h*0.6],[x+w*0.75,y+h*0.5,h*0.5]].forEach(([cx,cy,r])=>{ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();});
  ctx.strokeStyle=col;ctx.lineWidth=sw;
  [[x+w*0.25,y+h*0.5,h*0.5],[x+w*0.5,y+h*0.35,h*0.6],[x+w*0.75,y+h*0.5,h*0.5]].forEach(([cx,cy,r])=>{ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();});
}
function _drawRocketObj(ctx,cx,cy,r,col){
  ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(cx,cy-r);ctx.lineTo(cx+r*0.5,cy+r*0.3);ctx.lineTo(cx,cy+r);ctx.lineTo(cx-r*0.5,cy+r*0.3);ctx.closePath();ctx.fill();
  ctx.fillStyle='#87CEEB';ctx.beginPath();ctx.arc(cx,cy-r*0.1,r*0.2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#FF6600';ctx.beginPath();ctx.moveTo(cx,cy+r*0.5);ctx.lineTo(cx+r*0.2,cy+r);ctx.lineTo(cx-r*0.2,cy+r);ctx.closePath();ctx.fill();
}
function _drawRainbowObj(ctx,cx,cy,r,sw){
  ['#FF0000','#FF7F00','#FFFF00','#00FF00','#0000FF','#4B0082','#9400D3'].forEach((c,i)=>{
    ctx.strokeStyle=c;ctx.lineWidth=sw||3;ctx.beginPath();ctx.arc(cx,cy+r*0.5,r*(0.8-i*0.1),Math.PI,0);ctx.stroke();
  });
}
function _drawSmileyObj(ctx,cx,cy,r,col,sw){
  ctx.fillStyle='#FFD700';ctx.strokeStyle=col;ctx.lineWidth=sw;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle=col;[[cx-r*0.3,cy-r*0.2],[cx+r*0.3,cy-r*0.2]].forEach(([ex,ey])=>{ctx.beginPath();ctx.arc(ex,ey,r*0.1,0,Math.PI*2);ctx.fill();});
  ctx.strokeStyle=col;ctx.lineWidth=sw;ctx.beginPath();ctx.arc(cx,cy,r*0.5,0.2*Math.PI,0.8*Math.PI);ctx.stroke();
}
function _drawHouseObj(ctx,x,y,w,h,col){
  ctx.fillStyle=col;ctx.fillRect(x,y+h*0.4,w,h*0.6);
  ctx.beginPath();ctx.moveTo(x-w*0.1,y+h*0.4);ctx.lineTo(x+w*0.5,y);ctx.lineTo(x+w*1.1,y+h*0.4);ctx.closePath();ctx.fill();
  ctx.fillStyle='#8B4513';ctx.fillRect(x+w*0.35,y+h*0.65,w*0.3,h*0.35);
  ctx.fillStyle='#87CEEB';ctx.fillRect(x+w*0.15,y+h*0.5,w*0.2,h*0.2);
}
function _drawMountainObj(ctx,x,y,w,h,col,sw){
  ctx.beginPath();ctx.moveTo(x,y+h);ctx.lineTo(x+w*0.5,y);ctx.lineTo(x+w,y+h);ctx.closePath();
  ctx.fillStyle=col;ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=sw;ctx.stroke();
  ctx.fillStyle='#ffffff';ctx.beginPath();ctx.moveTo(x+w*0.5,y);ctx.lineTo(x+w*0.38,y+h*0.25);ctx.lineTo(x+w*0.62,y+h*0.25);ctx.closePath();ctx.fill();
}
function _drawWaveObj(ctx,x,y,w,h,col,sw){
  ctx.strokeStyle=col;ctx.lineWidth=sw;ctx.beginPath();
  const steps=8;for(let i=0;i<=steps;i++){const wx=x+i*(w/steps),wy=y+h/2+Math.sin(i/steps*Math.PI*2)*h*0.4;i===0?ctx.moveTo(wx,wy):ctx.lineTo(wx,wy);}
  ctx.stroke();
}
function _drawLightningObj(ctx,x,y,w,h,col,fill,sw){
  ctx.beginPath();ctx.moveTo(x+w*0.6,y);ctx.lineTo(x+w*0.2,y+h*0.5);ctx.lineTo(x+w*0.55,y+h*0.5);ctx.lineTo(x+w*0.1,y+h);ctx.lineTo(x+w*0.85,y+h*0.5);ctx.lineTo(x+w*0.5,y+h*0.5);ctx.closePath();
  ctx.fillStyle=fill||'#FFD700';ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=sw;ctx.stroke();
}
function _drawSnowflakeObj(ctx,cx,cy,r,col,sw){
  ctx.strokeStyle=col;ctx.lineWidth=sw;ctx.lineCap='round';
  for(let i=0;i<6;i++){const a=(i/6)*Math.PI*2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);ctx.stroke();
    const bx=cx+Math.cos(a)*r*0.5,by=cy+Math.sin(a)*r*0.5;
    for(let j=-1;j<=1;j+=2){const ba=a+j*Math.PI/3;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx+Math.cos(ba)*r*0.3,by+Math.sin(ba)*r*0.3);ctx.stroke();}
  }
}
function _drawLeafObj(ctx,x,y,w,h,col,sw){
  ctx.beginPath();ctx.moveTo(x+w*0.5,y);ctx.bezierCurveTo(x+w,y,x+w,y+h,x+w*0.5,y+h);ctx.bezierCurveTo(x,y+h,x,y,x+w*0.5,y);ctx.closePath();
  ctx.fillStyle=col;ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=sw;ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+w*0.5,y);ctx.lineTo(x+w*0.5,y+h);ctx.stroke();
}
function _drawFishObj(ctx,x,y,w,h,col,fill,sw){
  ctx.fillStyle=fill;ctx.strokeStyle=col;ctx.lineWidth=sw;
  ctx.beginPath();ctx.ellipse(x+w*0.55,y+h*0.5,w*0.4,h*0.3,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+w*0.15,y+h*0.5);ctx.lineTo(x,y);ctx.lineTo(x,y+h);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=col;ctx.beginPath();ctx.arc(x+w*0.8,y+h*0.4,h*0.06,0,Math.PI*2);ctx.fill();
}
function _drawButterflyObj(ctx,x,y,w,h,col,sw){
  ctx.strokeStyle=col;ctx.lineWidth=sw;
  [[x+w*0.1,y+h*0.2,w*0.35,h*0.4],[x+w*0.1,y+h*0.45,w*0.3,h*0.35],[x+w*0.55,y+h*0.2,w*0.35,h*0.4],[x+w*0.55,y+h*0.45,w*0.3,h*0.35]].forEach(([ex,ey,ew,eh],i)=>{
    ctx.fillStyle=i<2?col:'#FFB6C1';ctx.beginPath();ctx.ellipse(ex+ew/2,ey+eh/2,ew/2,eh/2,i%2===0?-0.3:0.3,0,Math.PI*2);ctx.fill();ctx.stroke();
  });
  ctx.strokeStyle='#666';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+w*0.5,y);ctx.lineTo(x+w*0.5,y+h);ctx.stroke();
}
function _drawCrownObj(ctx,x,y,w,h,col,fill,sw){
  ctx.fillStyle=fill;ctx.strokeStyle=col;ctx.lineWidth=sw;
  ctx.beginPath();ctx.moveTo(x,y+h);ctx.lineTo(x,y+h*0.4);ctx.lineTo(x+w*0.25,y+h*0.7);ctx.lineTo(x+w*0.5,y);ctx.lineTo(x+w*0.75,y+h*0.7);ctx.lineTo(x+w,y+h*0.4);ctx.lineTo(x+w,y+h);ctx.closePath();
  ctx.fill();ctx.stroke();
}
function _drawGiftObj(ctx,x,y,w,h,col,sw){
  ctx.fillStyle='#FF6B6B';ctx.fillRect(x,y+h*0.3,w,h*0.7);
  ctx.fillStyle='#FFD700';ctx.fillRect(x+w*0.4,y+h*0.3,w*0.2,h*0.7);
  ctx.fillStyle='#FF6B6B';ctx.beginPath();ctx.ellipse(x+w*0.25,y+h*0.3,w*0.25,h*0.2,0,0,Math.PI);ctx.fill();
  ctx.beginPath();ctx.ellipse(x+w*0.75,y+h*0.3,w*0.25,h*0.2,0,0,Math.PI);ctx.fill();
  ctx.fillStyle='#FFD700';ctx.fillRect(x,y+h*0.25,w,h*0.1);
  ctx.strokeStyle=col;ctx.lineWidth=sw;ctx.strokeRect(x,y+h*0.3,w,h*0.7);
}
function _drawMusicObj(ctx,cx,cy,r,col,sw){
  ctx.fillStyle=col;ctx.font=`${r*1.6}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('♪',cx,cy);ctx.textAlign='left';ctx.textBaseline='alphabetic';
}
function _drawClockObj(ctx,cx,cy,r,col,sw){
  ctx.strokeStyle=col;ctx.lineWidth=sw;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle=col;ctx.lineWidth=sw*1.5;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx,cy-r*0.6);ctx.stroke();
  ctx.lineWidth=sw;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+r*0.4,cy+r*0.3);ctx.stroke();
  for(let i=0;i<12;i++){const a=(i/12)*Math.PI*2;ctx.fillStyle=col;ctx.beginPath();ctx.arc(cx+Math.cos(a)*r*0.85,cy+Math.sin(a)*r*0.85,sw,0,Math.PI*2);ctx.fill();}
}
function _drawUmbrellaObj(ctx,x,y,w,h,col,sw){
  ctx.fillStyle=col;ctx.strokeStyle=col;ctx.lineWidth=sw;
  ctx.beginPath();ctx.arc(x+w/2,y+h*0.45,w/2,Math.PI,0);ctx.closePath();ctx.fill();
  for(let i=0;i<=4;i++){ctx.beginPath();ctx.moveTo(x+w/2,y+h*0.45);ctx.lineTo(x+i*(w/4),y+h*0.45);ctx.stroke();}
  ctx.beginPath();ctx.moveTo(x+w/2,y+h*0.45);ctx.lineTo(x+w/2,y+h*0.9);ctx.bezierCurveTo(x+w/2,y+h,x+w*0.4,y+h,x+w*0.4,y+h*0.9);ctx.stroke();
}
function _drawCarObj(ctx,x,y,w,h,col,fill,sw){
  ctx.fillStyle=fill;ctx.strokeStyle=col;ctx.lineWidth=sw;
  ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y+h*0.4,w,h*0.45,5):ctx.rect(x,y+h*0.4,w,h*0.45);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+w*0.15,y+h*0.4);ctx.lineTo(x+w*0.25,y+h*0.1);ctx.lineTo(x+w*0.75,y+h*0.1);ctx.lineTo(x+w*0.85,y+h*0.4);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#333';[[x+w*0.2,y+h*0.85],[x+w*0.75,y+h*0.85]].forEach(([wx,wy])=>{ctx.beginPath();ctx.arc(wx,wy,h*0.14,0,Math.PI*2);ctx.fill();});
  ctx.fillStyle='#87CEEB';[[x+w*0.28,y+h*0.15,w*0.2,h*0.2],[x+w*0.52,y+h*0.15,w*0.2,h*0.2]].forEach(([wx,wy,ww,wh])=>{ctx.fillRect(wx,wy,ww,wh);});
}
function _drawSunflowerObj(ctx,cx,cy,r,col,sw){
  ctx.fillStyle='#FFD700';
  for(let i=0;i<12;i++){const a=(i/12)*Math.PI*2;ctx.beginPath();ctx.ellipse(cx+Math.cos(a)*r*0.7,cy+Math.sin(a)*r*0.7,r*0.2,r*0.35,a,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#8B4513';ctx.beginPath();ctx.arc(cx,cy,r*0.35,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#228B22';ctx.lineWidth=sw;ctx.beginPath();ctx.moveTo(cx,cy+r);ctx.lineTo(cx,cy+r*2);ctx.stroke();
}

/* ── GRID (canvas-drawn) ── */
function drawGridOverlay() {
  const ctx = CANVAS.ctx, canvas = CANVAS.canvas, size = CANVAS.gridSize;
  const isDark = !document.body.classList.contains('light-mode');
  ctx.save();
  ctx.strokeStyle = isDark ? 'rgba(0,229,255,0.13)' : 'rgba(0,100,200,0.13)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += size) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += size) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
  ctx.restore();
}

/* ── SELECTION SYSTEM ── */
function getObjectBounds(obj) {
  if (obj.type === 'freehand' && obj.points && obj.points.length > 0) {
    const xs = obj.points.map(p => p.x), ys = obj.points.map(p => p.y);
    return { x: Math.min(...xs), y: Math.min(...ys),
             w: Math.max(...xs) - Math.min(...xs) || 4, h: Math.max(...ys) - Math.min(...ys) || 4 };
  }
  if (obj.type === 'line') {
    return { x: Math.min(obj.x, obj.x + obj.w), y: Math.min(obj.y, obj.y + obj.h),
             w: Math.abs(obj.w) || 4, h: Math.abs(obj.h) || 4 };
  }
  if (obj.type === 'text') {
    // Estimate text bounds
    const fontSize = (obj.strokeSize||3)*5+12;
    const textW = obj.w || (obj.text ? obj.text.length * fontSize * 0.6 : 100);
    return { x: obj.x, y: obj.y - fontSize, w: textW, h: fontSize + 4 };
  }
  return { x: obj.x, y: obj.y, w: obj.w || 40, h: obj.h || 40 };
}

const HANDLE_SIZE = 9;
function getHandles(obj) {
  const b = getObjectBounds(obj);
  return {
    tl: { x: b.x,           y: b.y,           cursor: 'nw-resize' },
    tr: { x: b.x + b.w,     y: b.y,           cursor: 'ne-resize' },
    bl: { x: b.x,           y: b.y + b.h,     cursor: 'sw-resize' },
    br: { x: b.x + b.w,     y: b.y + b.h,     cursor: 'se-resize' },
    t:  { x: b.x + b.w / 2, y: b.y,           cursor: 'n-resize'  },
    b:  { x: b.x + b.w / 2, y: b.y + b.h,     cursor: 's-resize'  },
    l:  { x: b.x,           y: b.y + b.h / 2, cursor: 'w-resize'  },
    r:  { x: b.x + b.w,     y: b.y + b.h / 2, cursor: 'e-resize'  },
  };
}

function hitTest(obj, px, py) {
  const b = getObjectBounds(obj);
  const pad = Math.max(8, (obj.strokeSize || 3) * 2);
  return px >= b.x - pad && px <= b.x + b.w + pad && py >= b.y - pad && py <= b.y + b.h + pad;
}

function hitTestHandle(obj, px, py) {
  const handles = getHandles(obj);
  for (const [key, h] of Object.entries(handles)) {
    if (Math.abs(px - h.x) <= HANDLE_SIZE + 2 && Math.abs(py - h.y) <= HANDLE_SIZE + 2) return key;
  }
  return null;
}

function drawSelectionBox(obj) {
  const ctx = CANVAS.ctx;
  const b = getObjectBounds(obj);
  ctx.save();
  ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(b.x - 6, b.y - 6, b.w + 12, b.h + 12);
  ctx.setLineDash([]);
  const handles = getHandles(obj);
  for (const h of Object.values(handles)) {
    ctx.beginPath(); ctx.arc(h.x, h.y, HANDLE_SIZE / 2 + 1, 0, Math.PI * 2);
    ctx.fillStyle = '#00e5ff'; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  ctx.restore();
}

function handleSelectMouseDown(x, y) {
  if (CANVAS.selectedId !== null) {
    const obj = CANVAS.objects.find(o => o.id === CANVAS.selectedId);
    if (obj) {
      const handle = hitTestHandle(obj, x, y);
      if (handle) {
        CANVAS.isResizing = true; CANVAS.resizeHandle = handle;
        CANVAS.startX = x; CANVAS.startY = y; return;
      }
      // Keep selection and allow drag — delete only via Del key or right-click
      if (hitTest(obj, x, y)) {
        const b = getObjectBounds(obj);
        CANVAS.dragOffsetX = x - b.x; CANVAS.dragOffsetY = y - b.y;
        CANVAS.isDragging = true; CANVAS.startX = x; CANVAS.startY = y;
        return;
      }
    }
  }
  let found = null;
  for (let i = CANVAS.objects.length - 1; i >= 0; i--) {
    if (hitTest(CANVAS.objects[i], x, y)) { found = CANVAS.objects[i]; break; }
  }
  if (found) {
    CANVAS.selectedId = found.id;
    const b = getObjectBounds(found);
    CANVAS.dragOffsetX = x - b.x; CANVAS.dragOffsetY = y - b.y;
    CANVAS.isDragging = true; CANVAS.startX = x; CANVAS.startY = y;
  } else {
    CANVAS.selectedId = null; CANVAS.isDragging = false;
  }
  redrawAll();
}

function handleSelectMouseMove(x, y) {
  if (CANVAS.isResizing && CANVAS.selectedId !== null) {
    const obj = CANVAS.objects.find(o => o.id === CANVAS.selectedId);
    if (obj) { applyResize(obj, CANVAS.resizeHandle, x, y); redrawAll(); }
    return;
  }
  if (CANVAS.isDragging && CANVAS.selectedId !== null) {
    const obj = CANVAS.objects.find(o => o.id === CANVAS.selectedId);
    if (obj) { moveObject(obj, x - CANVAS.startX, y - CANVAS.startY); CANVAS.startX = x; CANVAS.startY = y; redrawAll(); }
    return;
  }
  if (CANVAS.selectedId !== null) {
    const obj = CANVAS.objects.find(o => o.id === CANVAS.selectedId);
    if (obj) {
      const handle = hitTestHandle(obj, x, y);
      if (handle) { CANVAS.canvas.style.cursor = getHandles(obj)[handle]?.cursor || 'pointer'; return; }
    }
  }
  const hovered = CANVAS.objects.slice().reverse().find(o => hitTest(o, x, y));
  CANVAS.canvas.style.cursor = hovered ? 'move' : 'default';
}

function handleSelectMouseUp() {
  if (CANVAS.isDragging || CANVAS.isResizing) saveToUndoStack();
  CANVAS.isDragging = false; CANVAS.isResizing = false; CANVAS.resizeHandle = null;
  redrawAll();
}

function deleteObject(id) {
  CANVAS.objects = CANVAS.objects.filter(o => o.id !== id);
  CANVAS.selectedId = null;
  CANVAS.isDragging = false;
  CANVAS.isResizing = false;
  redrawAll();
  saveToUndoStack();
  showToast('🗑️ Shape deleted');
  addToTimeline(`${APP.user.name} deleted a shape`);
}

function moveObject(obj, dx, dy) {
  if (obj.type === 'freehand' && obj.points) {
    obj.points = obj.points.map(p => ({ x: p.x + dx, y: p.y + dy })); return;
  }
  if (obj.type === 'imageData') return;
  obj.x += dx; obj.y += dy;
}

function applyResize(obj, handle, mx, my) {
  if (obj.type === 'freehand' || obj.type === 'imageData') return;
  const b = getObjectBounds(obj);
  switch (handle) {
    case 'br': obj.w = mx - obj.x; obj.h = my - obj.y; break;
    case 'tr': obj.w = mx - obj.x; obj.y = my; obj.h = b.y + b.h - my; break;
    case 'bl': obj.x = mx; obj.w = b.x + b.w - mx; obj.h = my - b.y; break;
    case 'tl': obj.x = mx; obj.y = my; obj.w = b.x + b.w - mx; obj.h = b.y + b.h - my; break;
    case 'r':  obj.w = mx - obj.x; break;
    case 'l':  obj.x = mx; obj.w = b.x + b.w - mx; break;
    case 'b':  obj.h = my - obj.y; break;
    case 't':  obj.y = my; obj.h = b.y + b.h - my; break;
  }
}

/* ── SMART SHAPE RECOGNITION ── */
function recognizeShape(points) {
  if (points.length < 8) return null;
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const w = maxX - minX, h = maxY - minY;
  if (Math.max(w, h) < 20) return null;

  if (isLine(points, w, h)) return { type: 'line', x1: minX, y1: minY, x2: maxX, y2: maxY };

  const closure = dist(points[0], points[points.length - 1]);
  const isClosed = closure < Math.max(w, h) * 0.4;
  if (isClosed) {
    const circ = computeCircularity(points, minX, minY, w, h);
    if (circ > 0.72) return { type: 'circle', x1: minX, y1: minY, x2: maxX, y2: maxY };
    if (isRectangle(points, minX, minY, maxX, maxY)) return { type: 'rect', x1: minX, y1: minY, x2: maxX, y2: maxY };
  }
  return null;
}

function dist(a, b) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

function isLine(points, w, h) {
  const smaller = Math.min(w, h), larger = Math.max(w, h);
  if (larger < 30) return false;
  if (smaller / larger > 0.22) return false;
  const p0 = points[0], p1 = points[points.length - 1], len = dist(p0, p1) || 1;
  const deviations = points.map(p => {
    const t = ((p.x-p0.x)*(p1.x-p0.x) + (p.y-p0.y)*(p1.y-p0.y)) / (len*len);
    return Math.sqrt((p.x - (p0.x + t*(p1.x-p0.x)))**2 + (p.y - (p0.y + t*(p1.y-p0.y)))**2);
  });
  return Math.sqrt(deviations.reduce((a,b) => a+b*b, 0)/deviations.length) < len * 0.1;
}

function computeCircularity(points, minX, minY, w, h) {
  const cx = minX + w/2, cy = minY + h/2, rx = w/2||1, ry = h/2||1;
  const scores = points.map(p => Math.abs(((p.x-cx)/rx)**2 + ((p.y-cy)/ry)**2 - 1));
  return Math.max(0, 1 - (scores.reduce((a,b)=>a+b,0)/scores.length) * 1.5);
}

function isRectangle(points, minX, minY, maxX, maxY) {
  const w = maxX - minX, h = maxY - minY, threshold = Math.max(w,h)*0.25;
  const corners = [{x:minX,y:minY},{x:maxX,y:minY},{x:maxX,y:maxY},{x:minX,y:maxY}];
  let cornersHit = corners.filter(c => points.some(p => dist(p,c) < threshold)).length;
  const step = Math.max(1, Math.floor(points.length/30));
  let sharpTurns = 0;
  for (let i = step; i < points.length - step; i += step) {
    const a = points[i-step], b = points[i], c = points[i+step];
    const v1x=b.x-a.x, v1y=b.y-a.y, v2x=c.x-b.x, v2y=c.y-b.y;
    const cos = (v1x*v2x+v1y*v2y) / (Math.sqrt((v1x**2+v1y**2)*(v2x**2+v2y**2)) || 1);
    if (Math.abs(cos) < 0.5) sharpTurns++;
  }
  return cornersHit >= 3 && sharpTurns >= 2;
}

function animateShapeIn(objId) {
  const obj = CANVAS.objects.find(o => o.id === objId);
  if (!obj) return;
  const duration = 300, start = performance.now();
  function frame(now) {
    const alpha = Math.min(1, (now - start) / duration);
    redrawAll();
    drawObject(CANVAS.ctx, obj, alpha);
    if (alpha < 1) requestAnimationFrame(frame); else redrawAll();
  }
  requestAnimationFrame(frame);
}

function drawShapePreview(type, x1, y1, x2, y2) {
  const ctx = CANVAS.ctx;
  ctx.lineWidth = CANVAS.strokeSize; ctx.strokeStyle = CANVAS.color; ctx.fillStyle = CANVAS.fillColor; ctx.lineCap = 'round';
  const nx1 = Math.min(x1,x2), ny1 = Math.min(y1,y2), nx2 = Math.max(x1,x2), ny2 = Math.max(y1,y2);
  ctx.beginPath();
  if (type === 'line') { ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); }
  else if (type === 'rect') { ctx.rect(nx1,ny1,nx2-nx1,ny2-ny1); ctx.fill(); ctx.stroke(); }
  else if (type === 'circle') {
    const rx=(nx2-nx1)/2||1, ry=(ny2-ny1)/2||1;
    ctx.ellipse(nx1+rx, ny1+ry, rx, ry, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  }
}

/* ── PROGRAMMATIC SHAPES (voice/gesture) ── */
function drawShapeAtCenter(type) {
  const canvas = CANVAS.canvas;
  const cx = canvas.width/2, cy = canvas.height/2;
  const size = Math.min(canvas.width, canvas.height) * 0.2;
  const jx = (Math.random()-0.5)*size, jy = (Math.random()-0.5)*size;
  // Store as real object so it's movable/deletable
  const id = addObject({ type, x: cx-size+jx, y: cy-size+jy, w: size*2, h: size*2,
    color: CANVAS.color, fillColor: CANVAS.fillColor, strokeSize: CANVAS.strokeSize });
  redrawAll(); saveToUndoStack();
  addToTimeline(`${APP.user.name} drew a ${type}`);
  addToHistory(`${APP.user.name} drew a ${type} (voice/gesture)`);
}

/* ── VOICE OBJECTS (complex drawn objects) ── */
function addVoiceObject(type) {
  const canvas = CANVAS.canvas;
  const w = canvas.width, h = canvas.height;
  const s = Math.min(w, h) * 0.22;
  const rx = s + Math.random() * (w - s * 2);
  const ry = s + Math.random() * (h - s * 2);
  addObject({
    type, x: rx, y: ry, w: s, h: s,
    color: CANVAS.color, fillColor: CANVAS.fillColor, strokeSize: CANVAS.strokeSize
  });
  redrawAll(); saveToUndoStack();
  addToTimeline(`${APP.user.name} drew a ${type}`);
  showToast(`✅ ${type} added!`);
}

/* ── SPRAY ── */
function sprayPaint(x, y) {
  const ctx = CANVAS.ctx, density = 30, radius = CANVAS.strokeSize*5;
  ctx.fillStyle = CANVAS.color;
  for (let i = 0; i < density; i++) {
    const angle = Math.random()*Math.PI*2, r = Math.random()*radius;
    ctx.beginPath(); ctx.arc(x+r*Math.cos(angle), y+r*Math.sin(angle), 0.8, 0, Math.PI*2); ctx.fill();
  }
}

/* ── FLOOD FILL ── */
function floodFill(startX, startY, fillColorHex) {
  const ctx = CANVAS.ctx, canvas = CANVAS.canvas;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const ti = (startY*canvas.width+startX)*4;
  const targetR=data[ti], targetG=data[ti+1], targetB=data[ti+2], targetA=data[ti+3];
  const fill = hexToRgb(fillColorHex);
  if (!fill || (targetR===fill.r && targetG===fill.g && targetB===fill.b)) return;
  const stack = [[startX, startY]], visited = new Uint8Array(canvas.width*canvas.height);
  function matchesTarget(idx) {
    return Math.abs(data[idx]-targetR)<30 && Math.abs(data[idx+1]-targetG)<30 &&
           Math.abs(data[idx+2]-targetB)<30 && Math.abs(data[idx+3]-targetA)<30;
  }
  while (stack.length > 0) {
    const [x, y] = stack.pop();
    if (x<0||x>=canvas.width||y<0||y>=canvas.height) continue;
    const idx = (y*canvas.width+x)*4;
    if (visited[y*canvas.width+x] || !matchesTarget(idx)) continue;
    visited[y*canvas.width+x]=1;
    data[idx]=fill.r; data[idx+1]=fill.g; data[idx+2]=fill.b; data[idx+3]=255;
    stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
  }
  ctx.putImageData(imageData, 0, 0);
  const snap = ctx.getImageData(0,0,canvas.width,canvas.height);
  CANVAS.objects.push({ id:CANVAS.nextId++, type:'imageData', imageData:snap, x:0,y:0,w:0,h:0 });
  saveToUndoStack();
}

function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? { r:parseInt(r[1],16), g:parseInt(r[2],16), b:parseInt(r[3],16) } : null;
}

/* ── UNDO/REDO ── */
function saveToUndoStack() {
  if (!CANVAS.canvas) return;
  const snap = CANVAS.ctx.getImageData(0, 0, CANVAS.canvas.width, CANVAS.canvas.height);
  const objsClone = CANVAS.objects.map(o => o.type==='imageData' ? {...o, imageData:null, _hasID:true} : {...o, points: o.points ? [...o.points] : undefined, img: undefined});
  const imageDataMap = {};
  CANVAS.objects.forEach(o => { if (o.type==='imageData' && o.imageData) imageDataMap[o.id] = o.imageData; });
  CANVAS.undoStack.push({ snap, objsClone, imageDataMap });
  if (CANVAS.undoStack.length > 40) CANVAS.undoStack.shift();
  CANVAS.redoStack = [];
}

function restoreState(state) {
  CANVAS.ctx.putImageData(state.snap, 0, 0);
  const objs = state.objsClone.map(o => {
    if (o._hasID && state.imageDataMap[o.id]) return {...o, imageData: state.imageDataMap[o.id], _hasID:undefined};
    if (o.type === 'generatedImage' && o.imgSrc && !o.img) {
      const img = new Image();
      img.src = o.imgSrc;
      return {...o, img};
    }
    return {...o};
  });
  CANVAS.objects = objs;
  CANVAS.selectedId = null;
  redrawAll();
}

function undoAction() {
  if (CANVAS.undoStack.length <= 1) { showToast('Nothing to undo'); return; }
  CANVAS.redoStack.push(CANVAS.undoStack.pop());
  restoreState(CANVAS.undoStack[CANVAS.undoStack.length-1]);
  addToTimeline(`${APP.user.name} undid action`);
}

function redoAction() {
  if (CANVAS.redoStack.length === 0) { showToast('Nothing to redo'); return; }
  const next = CANVAS.redoStack.pop();
  CANVAS.undoStack.push(next);
  restoreState(next);
  addToTimeline(`${APP.user.name} redid action`);
}

/* ── CLEAR BOARD ── */
function clearBoard() {
  const canvas = CANVAS.canvas;
  CANVAS.ctx.clearRect(0,0,canvas.width,canvas.height);
  CANVAS.ctx.fillStyle='#ffffff'; CANVAS.ctx.fillRect(0,0,canvas.width,canvas.height);
  CANVAS.objects = []; CANVAS.selectedId = null;
  saveToUndoStack();
  addToHistory(`${APP.user.name} cleared the board`);
  addToTimeline(`${APP.user.name} cleared the board`);
  showToast('🗑️ Board cleared');
}

/* ── TOOL SETTERS ── */
function setTool(tool) {
  CANVAS.tool = tool;
  document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.tool-btn[data-tool="${tool}"]`);
  if (btn) btn.classList.add('active');
  if (tool !== 'select') { CANVAS.selectedId = null; redrawAll(); }
  updateCursor();
}
function setColor(val) { CANVAS.color = val; }
function setFillColor(val) { CANVAS.fillColor = val; }
function setStrokeSize(val) { CANVAS.strokeSize = parseInt(val); document.getElementById('size-display').textContent = val+'px'; }
function setBrushType(val) { CANVAS.brushType = val; }
function updateCursor() {
  const wrapper = document.getElementById('canvas-wrapper');
  if (!wrapper) return;
  const cursors = { pencil:'crosshair', eraser:'cell', fill:'copy', text:'text', select:'default', line:'crosshair', rect:'crosshair', circle:'crosshair' };
  wrapper.style.cursor = cursors[CANVAS.tool] || 'crosshair';
}

/* ── TOGGLE GRID (FIXED — canvas-drawn) ── */
function toggleGrid() {
  CANVAS.gridOn = !CANVAS.gridOn;
  APP.gridOn = CANVAS.gridOn;
  // Remove the broken CSS-based approach
  document.getElementById('canvas-wrapper').classList.remove('grid-on');
  redrawAll();
  showToast(CANVAS.gridOn ? '⊞ Grid ON' : '⊞ Grid OFF');
}

/* ── GESTURE DRAWING INTERFACE ── */
function gestureDrawAt(x, y, drawing) {
  const ctx = CANVAS.ctx;
  const cursor = document.getElementById('gesture-cursor');
  cursor.style.display = 'block'; cursor.style.left = x+'px'; cursor.style.top = y+'px';
  if (!drawing) return;
  if (!CANVAS.isDrawing) {
    CANVAS.isDrawing = true; CANVAS.currentPath = [{x,y}];
    ctx.beginPath(); ctx.moveTo(x, y); return;
  }
  CANVAS.currentPath.push({x,y});
  ctx.lineWidth = CANVAS.strokeSize; ctx.strokeStyle = CANVAS.color; ctx.lineCap = 'round';
  ctx.lineTo(x, y); ctx.stroke();
}

function gestureStopDraw() {
  if (CANVAS.isDrawing && CANVAS.currentPath.length > 1) {
    addObject({ type:'freehand', points:[...CANVAS.currentPath],
      color:CANVAS.color, strokeSize:CANVAS.strokeSize, brushType:CANVAS.brushType, x:0,y:0,w:0,h:0 });
  }
  CANVAS.isDrawing = false; CANVAS.ctx.beginPath();
  document.getElementById('gesture-cursor').style.display = 'none';
  saveToUndoStack();
}

// ==================== VOTING SYSTEM ====================
const VOTING = { active: false, question: '', options: [], votes: {}, voterNames: [] };

function addVoteOption() {
  const input = document.getElementById('vote-option');
  const text = input.value.trim();
  if (!text) return;
  VOTING.options.push({ text: text, count: 0 });
  VOTING.votes[text] = 0;
  input.value = '';
  renderVoteOptions();
}

function renderVoteOptions() {
  const list = document.getElementById('vote-options-list');
  if (!list) return;
  list.innerHTML = '';
  VOTING.options.forEach((opt, i) => {
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg-tertiary);border-radius:8px;font-size:13px;';
    div.innerHTML = `<span style="flex:1;">${opt.text}</span><button onclick="removeVoteOption(${i})" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:14px;">✕</button>`;
    list.appendChild(div);
  });
}

function removeVoteOption(index) {
  const text = VOTING.options[index].text;
  delete VOTING.votes[text];
  VOTING.options.splice(index, 1);
  renderVoteOptions();
}

function startVoting() {
  const question = document.getElementById('vote-question').value.trim();
  if (!question) { showToast('⚠️ Enter a question'); return; }
  if (VOTING.options.length < 2) { showToast('⚠️ Add at least 2 options'); return; }
  VOTING.active = true;
  VOTING.question = question;
  VOTING.options.forEach(o => o.count = 0);
  VOTING.voterNames = [];
  renderVotingUI();
  addToTimeline('🗳️ Voting started: ' + question);
  showToast('🗳️ Voting started!');
  addChatMessage('System', '🗳️ **VOTE:** ' + question + '\nOptions: ' + VOTING.options.map(o => o.text).join(', '), false);
}

function castVote(optionText) {
  if (!VOTING.active) { showToast('⚠️ No active vote'); return; }
  if (VOTING.voterNames.includes(APP.user.name)) { showToast('⚠️ You already voted!'); return; }
  VOTING.votes[optionText] = (VOTING.votes[optionText] || 0) + 1;
  VOTING.voterNames.push(APP.user.name);
  const opt = VOTING.options.find(o => o.text === optionText);
  if (opt) opt.count++;
  renderVotingUI();
  addToTimeline(APP.user.name + ' voted: ' + optionText);
}

function endVoting() {
  if (!VOTING.active) return;
  VOTING.active = false;
  let winner = VOTING.options[0];
  VOTING.options.forEach(o => { if (o.count > winner.count) winner = o; });
  addChatMessage('System', '🏆 **VOTE ENDED:** ' + VOTING.question + '\nWinner: ' + winner.text + ' (' + winner.count + ' votes)', false);
  addToTimeline('Voting ended. Winner: ' + winner.text);
  showToast('🏆 Winner: ' + winner.text);
  renderVotingUI();
}

function renderVotingUI() {
  const results = document.getElementById('voting-results');
  if (!results) return;
  const totalVotes = VOTING.voterNames.length;
  results.innerHTML = `<div style="font-weight:700;font-size:14px;margin-bottom:4px;">📊 ${VOTING.question}</div><div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">Total votes: ${totalVotes}</div>`;
  VOTING.options.forEach(opt => {
    const pct = totalVotes > 0 ? Math.round((opt.count / totalVotes) * 100) : 0;
    const bar = document.createElement('div');
    bar.style.cssText = 'margin-bottom:6px;';
    bar.innerHTML = `<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px;"><span>${opt.text}</span><span>${opt.count} (${pct}%)</span></div><div style="height:8px;background:var(--bg-tertiary);border-radius:4px;overflow:hidden;"><div style="height:100%;width:${pct}%;background:var(--accent);border-radius:4px;transition:width 0.5s;"></div></div>`;
    if (VOTING.active) { bar.onclick = () => castVote(opt.text); bar.style.cursor = 'pointer'; bar.title = 'Click to vote'; }
    results.appendChild(bar);
  });
  if (VOTING.active) {
    const endBtn = document.createElement('button');
    endBtn.textContent = '⏹ End Voting';
    endBtn.style.cssText = 'margin-top:8px;padding:8px;border-radius:8px;background:var(--danger);color:#fff;border:none;cursor:pointer;font-weight:700;width:100%;';
    endBtn.onclick = endVoting;
    results.appendChild(endBtn);
  }
}

/* ── IMPORT IMAGE TO CANVAS ── */
function importImageToCanvas(dataUrl) {
  const img = new Image();
  img.onload = () => {
    const canvas = CANVAS.canvas;
    // Scale image to fit within canvas, max 60% of canvas size
    const maxW = canvas.width * 0.6;
    const maxH = canvas.height * 0.6;
    let w = img.width, h = img.height;
    const ratio = Math.min(maxW / w, maxH / h, 1);
    w = Math.round(w * ratio);
    h = Math.round(h * ratio);
    const x = Math.round((canvas.width - w) / 2);
    const y = Math.round((canvas.height - h) / 2);

    addObject({
      type: 'generatedImage',
      img,
      imgSrc: dataUrl,
      shapeName: 'imported',
      x, y, w, h,
    });
    redrawAll();
    saveToUndoStack();
    showToast('🖼️ Image imported! Drag to move it.');
    if (typeof addToTimeline === 'function') addToTimeline(`${APP.user.name} imported an image`);
  };
  img.src = dataUrl;
}
