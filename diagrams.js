/* ============================================================
   DrawMe ProMax — diagrams.js
   Flowchart, Mind Map, SWOT Analysis, Timeline
   All diagrams are placed as movable/editable objects on canvas
   ============================================================ */

/* ══════════════════════════════════════════════
   DIAGRAM LAUNCHER — opens the picker modal
   ══════════════════════════════════════════════ */
function openDiagramPicker() {
  const old = document.getElementById('diagram-picker');
  if (old) old.remove();

  const modal = document.createElement('div');
  modal.id = 'diagram-picker';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.6);
    display:flex;align-items:center;justify-content:center;
    z-index:9999;backdrop-filter:blur(6px);
  `;

  const box = document.createElement('div');
  box.style.cssText = `
    background:var(--bg-panel);border:1.5px solid var(--border);
    border-radius:18px;padding:24px;width:480px;max-width:94vw;
    box-shadow:0 24px 64px rgba(0,0,0,0.5);
  `;

  box.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
      <span style="font-size:17px;font-weight:800;color:var(--text-primary);">📊 Insert Diagram</span>
      <button onclick="document.getElementById('diagram-picker').remove()"
        style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--text-muted);">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      ${diagramCard('🔷','Flowchart','Plan processes & decisions','insertFlowchart')}
      ${diagramCard('🧠','Mind Map','Brainstorm ideas visually','insertMindMap')}
      ${diagramCard('📋','SWOT Analysis','Strengths, Weaknesses, Opportunities, Threats','insertSWOT')}
      ${diagramCard('📅','Timeline','Events in chronological order','insertTimeline')}
    </div>
  `;

  modal.appendChild(box);
  document.body.appendChild(modal);
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
}

function diagramCard(icon, title, desc, fn) {
  return `
    <div onclick="${fn}();document.getElementById('diagram-picker').remove();"
      style="border:1.5px solid var(--border);border-radius:12px;padding:14px;cursor:pointer;
             transition:all 0.18s;background:var(--bg-card);"
      onmouseover="this.style.borderColor='var(--accent)';this.style.transform='scale(1.03)'"
      onmouseout="this.style.borderColor='var(--border)';this.style.transform='scale(1)'">
      <div style="font-size:26px;margin-bottom:6px;">${icon}</div>
      <div style="font-weight:700;font-size:14px;color:var(--text-primary);margin-bottom:4px;">${title}</div>
      <div style="font-size:11px;color:var(--text-muted);">${desc}</div>
    </div>`;
}

/* ══════════════════════════════════════════════
   FLOWCHART
   ══════════════════════════════════════════════ */
function insertFlowchart() {
  const cx = CANVAS.canvas.width / 2;
  const cy = CANVAS.canvas.height / 2 - 120;

  const nodes = [
    { shape: 'rounded', text: 'Start', x: cx - 60, y: cy,       w: 120, h: 44, fill: '#4CAF5033', stroke: '#4CAF50' },
    { shape: 'rect',    text: 'Process', x: cx - 70, y: cy+90,  w: 140, h: 44, fill: '#2196F333', stroke: '#2196F3' },
    { shape: 'diamond', text: 'Decision?', x: cx - 70, y: cy+190, w: 140, h: 60, fill: '#FF980033', stroke: '#FF9800' },
    { shape: 'rect',    text: 'Action A', x: cx - 160, y: cy+310, w: 120, h: 44, fill: '#9C27B033', stroke: '#9C27B0' },
    { shape: 'rect',    text: 'Action B', x: cx + 40,  y: cy+310, w: 120, h: 44, fill: '#9C27B033', stroke: '#9C27B0' },
    { shape: 'rounded', text: 'End', x: cx - 60, y: cy+420,    w: 120, h: 44, fill: '#F4433633', stroke: '#F44336' },
  ];

  const arrows = [
    { from: 0, to: 1, label: '' },
    { from: 1, to: 2, label: '' },
    { from: 2, to: 3, label: 'Yes' },
    { from: 2, to: 4, label: 'No' },
    { from: 3, to: 5, label: '' },
    { from: 4, to: 5, label: '' },
  ];

  addObject({
    type: 'diagram',
    diagramType: 'flowchart',
    nodes, arrows,
    x: cx - 200, y: cy - 20,
    w: 400, h: 500,
    _dirty: true,
  });
  redrawAll();
  saveToUndoStack();
  showToast('🔷 Flowchart added! Double-click nodes to edit.');
}

/* ══════════════════════════════════════════════
   MIND MAP
   ══════════════════════════════════════════════ */
function insertMindMap() {
  const cx = CANVAS.canvas.width / 2;
  const cy = CANVAS.canvas.height / 2;

  const branches = [
    { text: 'Idea 1', color: '#E91E63', angle: -120 },
    { text: 'Idea 2', color: '#2196F3', angle: -60 },
    { text: 'Idea 3', color: '#4CAF50', angle: 0 },
    { text: 'Idea 4', color: '#FF9800', angle: 60 },
    { text: 'Idea 5', color: '#9C27B0', angle: 120 },
    { text: 'Idea 6', color: '#00BCD4', angle: 180 },
  ];

  addObject({
    type: 'diagram',
    diagramType: 'mindmap',
    centerText: 'Main Topic',
    branches,
    x: cx - 220, y: cy - 180,
    w: 440, h: 360,
    _dirty: true,
  });
  redrawAll();
  saveToUndoStack();
  showToast('🧠 Mind Map added! Double-click to edit text.');
}

/* ══════════════════════════════════════════════
   SWOT ANALYSIS
   ══════════════════════════════════════════════ */
function insertSWOT() {
  const cx = CANVAS.canvas.width / 2;
  const cy = CANVAS.canvas.height / 2;
  const w = 360, h = 300;

  addObject({
    type: 'diagram',
    diagramType: 'swot',
    cells: {
      S: ['Strength 1', 'Strength 2'],
      W: ['Weakness 1', 'Weakness 2'],
      O: ['Opportunity 1', 'Opportunity 2'],
      T: ['Threat 1', 'Threat 2'],
    },
    x: cx - w / 2, y: cy - h / 2,
    w, h,
    _dirty: true,
  });
  redrawAll();
  saveToUndoStack();
  showToast('📋 SWOT Analysis added! Double-click to edit.');
}

/* ══════════════════════════════════════════════
   TIMELINE
   ══════════════════════════════════════════════ */
function insertTimeline() {
  const cx = CANVAS.canvas.width / 2;
  const cy = CANVAS.canvas.height / 2;

  const events = [
    { date: '2020', text: 'Event One',   color: '#E91E63' },
    { date: '2021', text: 'Event Two',   color: '#2196F3' },
    { date: '2022', text: 'Event Three', color: '#4CAF50' },
    { date: '2023', text: 'Event Four',  color: '#FF9800' },
    { date: '2024', text: 'Event Five',  color: '#9C27B0' },
  ];

  addObject({
    type: 'diagram',
    diagramType: 'timeline',
    events,
    x: cx - 340, y: cy - 100,
    w: 680, h: 200,
    _dirty: true,
  });
  redrawAll();
  saveToUndoStack();
  showToast('📅 Timeline added! Double-click to edit events.');
}

/* ══════════════════════════════════════════════
   DRAW DIAGRAM  (called from canvas.js drawObject)
   ══════════════════════════════════════════════ */
function drawDiagram(ctx, obj) {
  switch (obj.diagramType) {
    case 'flowchart': drawFlowchartDiagram(ctx, obj); break;
    case 'mindmap':   drawMindMapDiagram(ctx, obj);   break;
    case 'swot':      drawSWOTDiagram(ctx, obj);       break;
    case 'timeline':  drawTimelineDiagram(ctx, obj);   break;
  }
}

/* ── FLOWCHART DRAW ── */
function drawFlowchartDiagram(ctx, obj) {
  const nodes = obj.nodes;
  const arrows = obj.arrows;

  // Draw arrows first
  arrows.forEach(a => {
    const from = nodes[a.from], to = nodes[a.to];
    const fx = from.x + from.w / 2, fy = from.y + from.h;
    let tx = to.x + to.w / 2, ty = to.y;

    // Side exits for diamond
    if (from.shape === 'diamond') {
      if (a.label === 'Yes') { /* left exit */
        const fx2 = from.x; const fy2 = from.y + from.h / 2;
        drawArrowLine(ctx, fx2, fy2, to.x + to.w / 2, to.y, a.label, '#888');
        return;
      } else if (a.label === 'No') { /* right exit */
        const fx2 = from.x + from.w; const fy2 = from.y + from.h / 2;
        drawArrowLine(ctx, fx2, fy2, to.x + to.w / 2, to.y, a.label, '#888');
        return;
      }
    }
    drawArrowLine(ctx, fx, fy, tx, ty, a.label, '#888');
  });

  // Draw nodes
  nodes.forEach(n => {
    ctx.save();
    ctx.fillStyle = n.fill || 'rgba(33,150,243,0.2)';
    ctx.strokeStyle = n.stroke || '#2196F3';
    ctx.lineWidth = 2;

    if (n.shape === 'rounded') {
      roundRect(ctx, n.x, n.y, n.w, n.h, 22);
      ctx.fill(); ctx.stroke();
    } else if (n.shape === 'diamond') {
      ctx.beginPath();
      ctx.moveTo(n.x + n.w / 2, n.y);
      ctx.lineTo(n.x + n.w, n.y + n.h / 2);
      ctx.lineTo(n.x + n.w / 2, n.y + n.h);
      ctx.lineTo(n.x, n.y + n.h / 2);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else {
      roundRect(ctx, n.x, n.y, n.w, n.h, 8);
      ctx.fill(); ctx.stroke();
    }

    ctx.fillStyle = '#111';
    ctx.font = 'bold 12px DM Sans, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(n.text, n.x + n.w / 2, n.y + n.h / 2);
    ctx.restore();
  });
}

function drawArrowLine(ctx, x1, y1, x2, y2, label, color) {
  ctx.save();
  ctx.strokeStyle = color || '#888';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.stroke();

  // Arrowhead
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 10;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle - 0.4), y2 - headLen * Math.sin(angle - 0.4));
  ctx.lineTo(x2 - headLen * Math.cos(angle + 0.4), y2 - headLen * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fillStyle = color || '#888';
  ctx.fill();

  if (label) {
    ctx.fillStyle = '#555';
    ctx.font = '11px DM Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, (x1 + x2) / 2 + 8, (y1 + y2) / 2 - 6);
  }
  ctx.restore();
}

/* ── MIND MAP DRAW ── */
function drawMindMapDiagram(ctx, obj) {
  const cx = obj.x + obj.w / 2;
  const cy = obj.y + obj.h / 2;
  const r = Math.min(obj.w, obj.h) * 0.28;

  obj.branches.forEach(b => {
    const rad = (b.angle * Math.PI) / 180;
    const bx = cx + Math.cos(rad) * r;
    const by = cy + Math.sin(rad) * r;

    // Connection line
    ctx.save();
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(bx, by); ctx.stroke();

    // Branch node
    ctx.fillStyle = b.color + '33';
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 2;
    roundRect(ctx, bx - 45, by - 16, 90, 32, 16);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#111';
    ctx.font = 'bold 12px DM Sans, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(b.text, bx, by);
    ctx.restore();
  });

  // Center node
  ctx.save();
  ctx.fillStyle = 'var(--accent, #00e5ff)';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.shadowColor = 'var(--accent, #00e5ff)';
  ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.arc(cx, cy, 46, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#000';
  ctx.font = 'bold 13px DM Sans, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  wrapText(ctx, obj.centerText || 'Topic', cx, cy, 78, 16);
  ctx.restore();
}

/* ── SWOT DRAW ── */
function drawSWOTDiagram(ctx, obj) {
  const { x, y, w, h, cells } = obj;
  const hw = w / 2, hh = h / 2;
  const quadrants = [
    { key: 'S', label: '💪 Strengths',     color: '#4CAF5033', border: '#4CAF50', tx: x,      ty: y },
    { key: 'W', label: '⚠️ Weaknesses',    color: '#F4433633', border: '#F44336', tx: x + hw, ty: y },
    { key: 'O', label: '🚀 Opportunities', color: '#2196F333', border: '#2196F3', tx: x,      ty: y + hh },
    { key: 'T', label: '🛡️ Threats',       color: '#FF980033', border: '#FF9800', tx: x + hw, ty: y + hh },
  ];

  quadrants.forEach(q => {
    ctx.save();
    ctx.fillStyle = q.color;
    ctx.strokeStyle = q.border;
    ctx.lineWidth = 2;
    roundRect(ctx, q.tx + 3, q.ty + 3, hw - 6, hh - 6, 10);
    ctx.fill(); ctx.stroke();

    // Header
    ctx.fillStyle = q.border;
    ctx.font = 'bold 12px DM Sans, sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(q.label, q.tx + 12, q.ty + 12);

    // Items
    ctx.fillStyle = '#333';
    ctx.font = '11px DM Sans, sans-serif';
    const items = cells[q.key] || [];
    items.forEach((item, i) => {
      ctx.fillText('• ' + item, q.tx + 12, q.ty + 32 + i * 18);
    });
    ctx.restore();
  });

  // Center cross
  ctx.save();
  ctx.strokeStyle = 'var(--border, #333)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(x + hw, y + 3); ctx.lineTo(x + hw, y + h - 3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 3, y + hh); ctx.lineTo(x + w - 3, y + hh); ctx.stroke();
  ctx.restore();
}

/* ── TIMELINE DRAW ── */
function drawTimelineDiagram(ctx, obj) {
  const { x, y, w, h, events } = obj;
  const lineY = y + h / 2;
  const step = w / (events.length + 1);

  // Horizontal line
  ctx.save();
  ctx.strokeStyle = 'var(--accent, #00e5ff)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x + 20, lineY); ctx.lineTo(x + w - 20, lineY); ctx.stroke();

  events.forEach((ev, i) => {
    const ex = x + step * (i + 1);
    const above = i % 2 === 0;
    const labelY = above ? lineY - 60 : lineY + 20;

    // Dot
    ctx.fillStyle = ev.color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(ex, lineY, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Stem
    ctx.strokeStyle = ev.color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(ex, lineY + (above ? -9 : 9));
    ctx.lineTo(ex, lineY + (above ? -40 : 40));
    ctx.stroke();
    ctx.setLineDash([]);

    // Label box
    const bw = 90, bh = 36;
    ctx.fillStyle = ev.color + '33';
    ctx.strokeStyle = ev.color;
    ctx.lineWidth = 1.5;
    roundRect(ctx, ex - bw / 2, labelY, bw, bh, 8);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#111';
    ctx.font = 'bold 11px DM Sans, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(ev.date, ex, labelY + 10);
    ctx.font = '10px DM Sans, sans-serif';
    ctx.fillText(ev.text, ex, labelY + 26);
  });
  ctx.restore();
}

/* ══════════════════════════════════════════════
   DIAGRAM EDITOR — double-click to edit
   ══════════════════════════════════════════════ */
function openDiagramEditor(obj) {
  const old = document.getElementById('diagram-editor');
  if (old) old.remove();

  const modal = document.createElement('div');
  modal.id = 'diagram-editor';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.65);
    display:flex;align-items:center;justify-content:center;
    z-index:9999;backdrop-filter:blur(6px);
  `;

  const box = document.createElement('div');
  box.style.cssText = `
    background:var(--bg-panel);border:1.5px solid var(--border);
    border-radius:18px;padding:24px;width:520px;max-width:94vw;max-height:82vh;
    overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,0.5);
  `;

  const close = () => modal.remove();
  box.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
    <span style="font-size:16px;font-weight:800;color:var(--text-primary);">✏️ Edit ${obj.diagramType}</span>
    <button onclick="document.getElementById('diagram-editor').remove()"
      style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--text-muted);">✕</button>
  </div>`;

  const form = document.createElement('div');
  form.style.cssText = 'display:flex;flex-direction:column;gap:10px;';

  if (obj.diagramType === 'flowchart') buildFlowchartEditor(form, obj, close);
  else if (obj.diagramType === 'mindmap') buildMindMapEditor(form, obj, close);
  else if (obj.diagramType === 'swot') buildSWOTEditor(form, obj, close);
  else if (obj.diagramType === 'timeline') buildTimelineEditor(form, obj, close);

  box.appendChild(form);
  modal.appendChild(box);
  document.body.appendChild(modal);
  modal.onclick = e => { if (e.target === modal) close(); };
}

function inputStyle() {
  return 'width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);background:var(--bg-tertiary,#1a1a2e);color:var(--text-primary);font-size:13px;font-family:inherit;outline:none;';
}

function saveBtn(label, fn) {
  const b = document.createElement('button');
  b.textContent = label;
  b.style.cssText = 'padding:10px;border-radius:10px;background:var(--accent);border:none;color:#000;font-weight:800;cursor:pointer;font-size:14px;margin-top:6px;';
  b.onclick = fn;
  return b;
}

/* ── FLOWCHART EDITOR ── */
function buildFlowchartEditor(form, obj, close) {
  const label = document.createElement('p');
  label.style.cssText = 'color:var(--text-muted);font-size:12px;margin:0;';
  label.textContent = 'Edit node labels:';
  form.appendChild(label);

  obj.nodes.forEach((node, i) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;align-items:center;';
    const badge = document.createElement('span');
    badge.textContent = node.shape === 'rounded' ? '🔵' : node.shape === 'diamond' ? '🔶' : '🟦';
    badge.style.fontSize = '16px';
    const inp = document.createElement('input');
    inp.style.cssText = inputStyle();
    inp.value = node.text;
    inp.oninput = () => { node.text = inp.value; redrawAll(); };
    row.appendChild(badge); row.appendChild(inp);
    form.appendChild(row);
  });

  form.appendChild(saveBtn('✅ Done', () => { saveToUndoStack(); close(); }));
}

/* ── MINDMAP EDITOR ── */
function buildMindMapEditor(form, obj, close) {
  // Center
  const cLabel = document.createElement('label');
  cLabel.textContent = 'Center Topic:';
  cLabel.style.cssText = 'font-size:12px;color:var(--text-muted);';
  const cInp = document.createElement('input');
  cInp.style.cssText = inputStyle();
  cInp.value = obj.centerText;
  cInp.oninput = () => { obj.centerText = cInp.value; redrawAll(); };
  form.appendChild(cLabel); form.appendChild(cInp);

  const bLabel = document.createElement('p');
  bLabel.style.cssText = 'color:var(--text-muted);font-size:12px;margin:6px 0 2px;';
  bLabel.textContent = 'Branch labels:';
  form.appendChild(bLabel);

  obj.branches.forEach((b, i) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;align-items:center;';
    const dot = document.createElement('span');
    dot.style.cssText = `width:12px;height:12px;border-radius:50%;background:${b.color};display:inline-block;flex-shrink:0;`;
    const inp = document.createElement('input');
    inp.style.cssText = inputStyle();
    inp.value = b.text;
    inp.oninput = () => { b.text = inp.value; redrawAll(); };
    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑';
    delBtn.style.cssText = 'background:none;border:none;cursor:pointer;font-size:15px;';
    delBtn.onclick = () => { obj.branches.splice(i, 1); redrawAll(); form.innerHTML = ''; buildMindMapEditor(form, obj, close); };
    row.appendChild(dot); row.appendChild(inp); row.appendChild(delBtn);
    form.appendChild(row);
  });

  // Add branch
  const addRow = document.createElement('div');
  addRow.style.cssText = 'display:flex;gap:8px;margin-top:4px;';
  const addInp = document.createElement('input');
  addInp.style.cssText = inputStyle();
  addInp.placeholder = 'New branch...';
  const addB = document.createElement('button');
  addB.textContent = '+ Add';
  addB.style.cssText = 'padding:8px 12px;border-radius:8px;background:var(--accent);border:none;color:#000;font-weight:700;cursor:pointer;white-space:nowrap;';
  addB.onclick = () => {
    if (!addInp.value.trim()) return;
    const colors = ['#E91E63','#2196F3','#4CAF50','#FF9800','#9C27B0','#00BCD4','#FF5722','#607D8B'];
    const angle = (obj.branches.length * 60) % 360;
    obj.branches.push({ text: addInp.value.trim(), color: colors[obj.branches.length % colors.length], angle });
    redrawAll(); addInp.value = '';
    form.innerHTML = ''; buildMindMapEditor(form, obj, close);
  };
  addRow.appendChild(addInp); addRow.appendChild(addB);
  form.appendChild(addRow);
  form.appendChild(saveBtn('✅ Done', () => { saveToUndoStack(); close(); }));
}

/* ── SWOT EDITOR ── */
function buildSWOTEditor(form, obj, close) {
  ['S','W','O','T'].forEach(key => {
    const names = { S:'💪 Strengths', W:'⚠️ Weaknesses', O:'🚀 Opportunities', T:'🛡️ Threats' };
    const sec = document.createElement('div');
    sec.innerHTML = `<p style="font-size:12px;font-weight:700;color:var(--text-muted);margin:6px 0 4px;">${names[key]}</p>`;

    (obj.cells[key] || []).forEach((item, i) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:6px;margin-bottom:4px;';
      const inp = document.createElement('input');
      inp.style.cssText = inputStyle();
      inp.value = item;
      inp.oninput = () => { obj.cells[key][i] = inp.value; redrawAll(); };
      const del = document.createElement('button');
      del.textContent = '×';
      del.style.cssText = 'background:none;border:none;cursor:pointer;font-size:18px;color:var(--danger,#f44336);';
      del.onclick = () => { obj.cells[key].splice(i, 1); redrawAll(); form.innerHTML = ''; buildSWOTEditor(form, obj, close); };
      row.appendChild(inp); row.appendChild(del);
      sec.appendChild(row);
    });

    const addRow = document.createElement('div');
    addRow.style.cssText = 'display:flex;gap:6px;';
    const addInp = document.createElement('input');
    addInp.style.cssText = inputStyle();
    addInp.placeholder = `Add to ${names[key]}...`;
    const addB = document.createElement('button');
    addB.textContent = '+';
    addB.style.cssText = 'padding:6px 12px;border-radius:8px;background:var(--accent);border:none;color:#000;font-weight:700;cursor:pointer;';
    addB.onclick = () => {
      if (!addInp.value.trim()) return;
      obj.cells[key].push(addInp.value.trim()); redrawAll(); addInp.value = '';
      form.innerHTML = ''; buildSWOTEditor(form, obj, close);
    };
    addRow.appendChild(addInp); addRow.appendChild(addB);
    sec.appendChild(addRow);
    form.appendChild(sec);
  });
  form.appendChild(saveBtn('✅ Done', () => { saveToUndoStack(); close(); }));
}

/* ── TIMELINE EDITOR ── */
function buildTimelineEditor(form, obj, close) {
  const label = document.createElement('p');
  label.style.cssText = 'color:var(--text-muted);font-size:12px;margin:0 0 6px;';
  label.textContent = 'Edit timeline events:';
  form.appendChild(label);

  obj.events.forEach((ev, i) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:6px;align-items:center;margin-bottom:6px;';
    const dot = document.createElement('span');
    dot.style.cssText = `width:12px;height:12px;border-radius:50%;background:${ev.color};flex-shrink:0;`;
    const dateInp = document.createElement('input');
    dateInp.style.cssText = inputStyle() + 'width:80px;flex-shrink:0;';
    dateInp.value = ev.date;
    dateInp.oninput = () => { ev.date = dateInp.value; redrawAll(); };
    const textInp = document.createElement('input');
    textInp.style.cssText = inputStyle();
    textInp.value = ev.text;
    textInp.oninput = () => { ev.text = textInp.value; redrawAll(); };
    const del = document.createElement('button');
    del.textContent = '×';
    del.style.cssText = 'background:none;border:none;cursor:pointer;font-size:18px;color:var(--danger,#f44336);';
    del.onclick = () => { obj.events.splice(i, 1); redrawAll(); form.innerHTML = ''; buildTimelineEditor(form, obj, close); };
    row.appendChild(dot); row.appendChild(dateInp); row.appendChild(textInp); row.appendChild(del);
    form.appendChild(row);
  });

  // Add event
  const addRow = document.createElement('div');
  addRow.style.cssText = 'display:flex;gap:6px;margin-top:4px;';
  const dateI = document.createElement('input');
  dateI.style.cssText = inputStyle() + 'width:80px;flex-shrink:0;';
  dateI.placeholder = 'Year';
  const textI = document.createElement('input');
  textI.style.cssText = inputStyle();
  textI.placeholder = 'Event description';
  const addB = document.createElement('button');
  addB.textContent = '+ Add';
  addB.style.cssText = 'padding:8px 12px;border-radius:8px;background:var(--accent);border:none;color:#000;font-weight:700;cursor:pointer;white-space:nowrap;';
  addB.onclick = () => {
    if (!textI.value.trim()) return;
    const colors = ['#E91E63','#2196F3','#4CAF50','#FF9800','#9C27B0','#00BCD4'];
    obj.events.push({ date: dateI.value || '—', text: textI.value.trim(), color: colors[obj.events.length % colors.length] });
    redrawAll(); dateI.value = ''; textI.value = '';
    form.innerHTML = ''; buildTimelineEditor(form, obj, close);
  };
  addRow.appendChild(dateI); addRow.appendChild(textI); addRow.appendChild(addB);
  form.appendChild(addRow);
  form.appendChild(saveBtn('✅ Done', () => { saveToUndoStack(); close(); }));
}

/* ══════════════════════════════════════════════
   UTILS
   ══════════════════════════════════════════════ */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(' ');
  let line = '';
  const lines = [];
  words.forEach(w => {
    const test = line + w + ' ';
    if (ctx.measureText(test).width > maxW && line) { lines.push(line.trim()); line = w + ' '; }
    else line = test;
  });
  lines.push(line.trim());
  const startY = y - ((lines.length - 1) * lineH) / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineH));
}
