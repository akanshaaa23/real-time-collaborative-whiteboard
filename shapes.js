/* ============================================================
   DrawMe ProMax — shapes.js
   Extended Shape Library (20+ shapes)
   Command-Based Drawing + Voice Recognition
   Auto Color + 5 Variations Generator
   ============================================================ */

/* ── COLOR UTILITIES ── */
function randomVibrantColor() {
  const palettes = [
    ['#FF6B6B','#FF8E53'],['#4ECDC4','#2ECC71'],['#6C63FF','#a855f7'],
    ['#FF9A9E','#FAD0C4'],['#00B4D8','#0077B6'],['#F8C471','#E67E22'],
    ['#E91E63','#FF5722'],['#26C6DA','#00ACC1'],['#66BB6A','#43A047'],
    ['#AB47BC','#7B1FA2'],['#FFCA28','#F57F17'],['#EF5350','#C62828'],
  ];
  const pair = palettes[Math.floor(Math.random() * palettes.length)];
  return pair[Math.floor(Math.random() * pair.length)];
}

function createGradient(ctx, x, y, w, h) {
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  const c1 = randomVibrantColor();
  const c2 = randomVibrantColor();
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  return grad;
}

function randomOffset(max) { return (Math.random() - 0.5) * max; }

/* ── SHAPE DRAW FUNCTIONS ── 
   Each returns {type:'custom', points, path, x, y, w, h, color, fillColor, strokeSize}
   They draw directly on ctx and also add to CANVAS.objects
*/

function drawStar(ctx, cx, cy, outerR, innerR, points, color, fillColor, strokeSize) {
  const step = Math.PI / points;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = i * step - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fillColor; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = strokeSize; ctx.stroke();
}

function drawHeart(ctx, cx, cy, size, color, fillColor, strokeSize) {
  const s = size * 0.55;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.8);
  ctx.bezierCurveTo(cx - s * 1.1, cy - s * 0.4, cx - s * 2, cy + s * 0.3, cx, cy - s * 0.5);
  ctx.bezierCurveTo(cx + s * 2, cy + s * 0.3, cx + s * 1.1, cy - s * 0.4, cx, cy + s * 0.8);
  ctx.fillStyle = fillColor; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = strokeSize; ctx.stroke();
}

function drawDiamond(ctx, cx, cy, w, h, color, fillColor, strokeSize) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - h / 2);
  ctx.lineTo(cx + w / 2, cy);
  ctx.lineTo(cx, cy + h / 2);
  ctx.lineTo(cx - w / 2, cy);
  ctx.closePath();
  ctx.fillStyle = fillColor; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = strokeSize; ctx.stroke();
}

function drawPolygon(ctx, cx, cy, r, sides, color, fillColor, strokeSize, rotation = 0) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI / sides) - Math.PI / 2 + rotation;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fillColor; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = strokeSize; ctx.stroke();
}

function drawArrow(ctx, x1, y1, x2, y2, color, strokeSize, headSize) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const hs = headSize || 20;
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.strokeStyle = color; ctx.lineWidth = strokeSize; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - hs * Math.cos(angle - 0.4), y2 - hs * Math.sin(angle - 0.4));
  ctx.lineTo(x2 - hs * Math.cos(angle + 0.4), y2 - hs * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
}

function drawCloud(ctx, cx, cy, w, h, color, fillColor, strokeSize) {
  const circles = [
    { x: cx, y: cy, r: w * 0.22 },
    { x: cx - w * 0.25, y: cy + h * 0.12, r: w * 0.16 },
    { x: cx + w * 0.28, y: cy + h * 0.1, r: w * 0.18 },
    { x: cx - w * 0.1, y: cy + h * 0.22, r: w * 0.2 },
    { x: cx + w * 0.12, y: cy + h * 0.24, r: w * 0.19 },
  ];
  ctx.save();
  ctx.beginPath();
  circles.forEach(c => { ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); });
  ctx.fillStyle = fillColor; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = strokeSize;
  circles.forEach(c => {
    ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.stroke();
  });
  ctx.restore();
}

function drawMoon(ctx, cx, cy, r, color, fillColor, strokeSize) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = fillColor; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = strokeSize; ctx.stroke();
  // Bite out crescent
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(cx + r * 0.45, cy - r * 0.1, r * 0.78, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,1)'; ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  // Re-stroke
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0.2, Math.PI * 1.85);
  ctx.strokeStyle = color; ctx.lineWidth = strokeSize; ctx.stroke();
  ctx.restore();
}

function drawSun(ctx, cx, cy, r, color, fillColor, strokeSize, rays = 12) {
  // Rays
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * r * 1.1, cy + Math.sin(angle) * r * 1.1);
    ctx.lineTo(cx + Math.cos(angle) * r * 1.7, cy + Math.sin(angle) * r * 1.7);
    ctx.strokeStyle = color; ctx.lineWidth = strokeSize; ctx.lineCap = 'round'; ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = fillColor; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = strokeSize; ctx.stroke();
}

function drawFlower(ctx, cx, cy, r, color, fillColor, strokeSize, petals = 6) {
  for (let i = 0; i < petals; i++) {
    const angle = (i / petals) * Math.PI * 2;
    const px = cx + Math.cos(angle) * r * 0.8;
    const py = cy + Math.sin(angle) * r * 0.8;
    ctx.beginPath();
    ctx.ellipse(px, py, r * 0.38, r * 0.55, angle, 0, Math.PI * 2);
    ctx.fillStyle = fillColor; ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = strokeSize; ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
}

function drawLeaf(ctx, cx, cy, w, h, color, fillColor, strokeSize) {
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate(-Math.PI / 6);
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.bezierCurveTo(w * 0.6, h * 0.3, w * 0.6, -h * 0.3, 0, -h / 2);
  ctx.bezierCurveTo(-w * 0.6, -h * 0.3, -w * 0.6, h * 0.3, 0, h / 2);
  ctx.fillStyle = fillColor; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = strokeSize; ctx.stroke();
  // Vein
  ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(0, -h / 2);
  ctx.strokeStyle = color; ctx.lineWidth = strokeSize * 0.7; ctx.stroke();
  ctx.restore();
}

function drawHouse(ctx, cx, cy, w, h, color, fillColor, strokeSize) {
  const bx = cx - w / 2, by = cy, bw = w, bh = h * 0.55;
  // Body
  ctx.beginPath();
  ctx.rect(bx, by, bw, bh);
  ctx.fillStyle = fillColor; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = strokeSize; ctx.stroke();
  // Roof
  ctx.beginPath();
  ctx.moveTo(bx - w * 0.08, by);
  ctx.lineTo(cx, cy - h * 0.52);
  ctx.lineTo(bx + bw + w * 0.08, by);
  ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = strokeSize; ctx.stroke();
  // Door
  ctx.beginPath();
  ctx.rect(cx - w * 0.1, by + bh * 0.45, w * 0.2, bh * 0.55);
  ctx.fillStyle = color; ctx.fill();
  // Window
  ctx.beginPath();
  ctx.rect(bx + bw * 0.18, by + bh * 0.2, w * 0.18, h * 0.16);
  ctx.fillStyle = '#a8d8ea'; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = strokeSize * 0.7; ctx.stroke();
}

function drawTree(ctx, cx, cy, w, h, color, fillColor, strokeSize) {
  const trunkW = w * 0.14, trunkH = h * 0.38;
  // Trunk
  ctx.beginPath();
  ctx.rect(cx - trunkW / 2, cy + h * 0.1, trunkW, trunkH);
  ctx.fillStyle = '#8B6914'; ctx.fill();
  ctx.strokeStyle = '#5C4A00'; ctx.lineWidth = strokeSize; ctx.stroke();
  // Foliage layers
  const layers = [
    { y: cy - h * 0.4, r: w * 0.42 },
    { y: cy - h * 0.18, r: w * 0.36 },
    { y: cy + h * 0.02, r: w * 0.28 },
  ];
  layers.forEach(l => {
    ctx.beginPath();
    ctx.arc(cx, l.y, l.r, 0, Math.PI * 2);
    ctx.fillStyle = fillColor; ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = strokeSize; ctx.stroke();
  });
}

function drawCar(ctx, cx, cy, w, h, color, fillColor, strokeSize) {
  const x = cx - w / 2, y = cy - h / 2;
  // Body
  ctx.beginPath();
  ctx.roundRect(x, y + h * 0.3, w, h * 0.52, 6);
  ctx.fillStyle = fillColor; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = strokeSize; ctx.stroke();
  // Cabin
  ctx.beginPath();
  ctx.moveTo(x + w * 0.18, y + h * 0.3);
  ctx.lineTo(x + w * 0.28, y + h * 0.05);
  ctx.lineTo(x + w * 0.72, y + h * 0.05);
  ctx.lineTo(x + w * 0.82, y + h * 0.3);
  ctx.closePath();
  ctx.fillStyle = fillColor; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = strokeSize; ctx.stroke();
  // Windows
  ctx.beginPath();
  ctx.rect(x + w * 0.31, y + h * 0.09, w * 0.17, h * 0.18);
  ctx.fillStyle = '#a8d8ea'; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = strokeSize * 0.7; ctx.stroke();
  ctx.beginPath();
  ctx.rect(x + w * 0.52, y + h * 0.09, w * 0.17, h * 0.18);
  ctx.fillStyle = '#a8d8ea'; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = strokeSize * 0.7; ctx.stroke();
  // Wheels
  [[x + w * 0.22, y + h * 0.82], [x + w * 0.78, y + h * 0.82]].forEach(([wx, wy]) => {
    ctx.beginPath();
    ctx.arc(wx, wy, h * 0.17, 0, Math.PI * 2);
    ctx.fillStyle = '#333'; ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = strokeSize; ctx.stroke();
    ctx.beginPath();
    ctx.arc(wx, wy, h * 0.09, 0, Math.PI * 2);
    ctx.fillStyle = '#aaa'; ctx.fill();
  });
}

function drawAeroplane(ctx, cx, cy, w, h, color, fillColor, strokeSize) {
  ctx.save();
  ctx.translate(cx, cy);
  // Fuselage
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.45, h * 0.12, 0, 0, Math.PI * 2);
  ctx.fillStyle = fillColor; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = strokeSize; ctx.stroke();
  // Nose cone
  ctx.beginPath();
  ctx.moveTo(w * 0.45, 0);
  ctx.lineTo(w * 0.5, h * 0.04);
  ctx.lineTo(w * 0.58, 0);
  ctx.lineTo(w * 0.5, -h * 0.04);
  ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  // Main wing
  ctx.beginPath();
  ctx.moveTo(-w * 0.05, -h * 0.1);
  ctx.lineTo(-w * 0.15, -h * 0.48);
  ctx.lineTo(w * 0.15, -h * 0.38);
  ctx.lineTo(w * 0.15, -h * 0.1);
  ctx.closePath();
  ctx.fillStyle = fillColor; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = strokeSize; ctx.stroke();
  // Mirror wing
  ctx.beginPath();
  ctx.moveTo(-w * 0.05, h * 0.1);
  ctx.lineTo(-w * 0.15, h * 0.48);
  ctx.lineTo(w * 0.15, h * 0.38);
  ctx.lineTo(w * 0.15, h * 0.1);
  ctx.closePath();
  ctx.fillStyle = fillColor; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = strokeSize; ctx.stroke();
  // Tail fin
  ctx.beginPath();
  ctx.moveTo(-w * 0.38, 0);
  ctx.lineTo(-w * 0.48, -h * 0.28);
  ctx.lineTo(-w * 0.25, -h * 0.1);
  ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.restore();
}

function drawStickFigure(ctx, cx, cy, w, h, color, strokeSize) {
  const lw = strokeSize * 1.2;
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round';
  // Head
  ctx.beginPath(); ctx.arc(cx, cy - h * 0.38, h * 0.12, 0, Math.PI * 2); ctx.stroke();
  // Body
  ctx.beginPath(); ctx.moveTo(cx, cy - h * 0.26); ctx.lineTo(cx, cy + h * 0.1); ctx.stroke();
  // Left arm
  ctx.beginPath(); ctx.moveTo(cx, cy - h * 0.14); ctx.lineTo(cx - w * 0.3, cy + h * 0.02); ctx.stroke();
  // Right arm
  ctx.beginPath(); ctx.moveTo(cx, cy - h * 0.14); ctx.lineTo(cx + w * 0.3, cy + h * 0.02); ctx.stroke();
  // Left leg
  ctx.beginPath(); ctx.moveTo(cx, cy + h * 0.1); ctx.lineTo(cx - w * 0.22, cy + h * 0.45); ctx.stroke();
  // Right leg
  ctx.beginPath(); ctx.moveTo(cx, cy + h * 0.1); ctx.lineTo(cx + w * 0.22, cy + h * 0.45); ctx.stroke();
}

function drawTriangle(ctx, cx, cy, r, color, fillColor, strokeSize) {
  drawPolygon(ctx, cx, cy, r, 3, color, fillColor, strokeSize);
}

function drawOctagon(ctx, cx, cy, r, color, fillColor, strokeSize) {
  drawPolygon(ctx, cx, cy, r, 8, color, fillColor, strokeSize);
}

function drawCross(ctx, cx, cy, w, h, color, fillColor, strokeSize) {
  const tw = w * 0.28, th = h * 0.28;
  ctx.beginPath();
  ctx.rect(cx - tw / 2, cy - h / 2, tw, h);
  ctx.rect(cx - w / 2, cy - th / 2, w, th);
  ctx.fillStyle = fillColor; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = strokeSize; ctx.stroke();
}

function drawZigZag(ctx, x, y, w, h, color, strokeSize, segments = 6) {
  ctx.beginPath();
  ctx.moveTo(x, y + h / 2);
  const segW = w / segments;
  for (let i = 0; i <= segments; i++) {
    ctx.lineTo(x + i * segW, y + (i % 2 === 0 ? h : 0));
  }
  ctx.strokeStyle = color; ctx.lineWidth = strokeSize; ctx.lineCap = 'round'; ctx.stroke();
}

function drawSpiral(ctx, cx, cy, maxR, color, strokeSize, turns = 3) {
  ctx.beginPath();
  const steps = turns * 60;
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * turns * Math.PI * 2;
    const r = (i / steps) * maxR;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.strokeStyle = color; ctx.lineWidth = strokeSize; ctx.stroke();
}

function drawRainbow(ctx, cx, cy, r, strokeSize) {
  const colors = ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db','#9b59b6'];
  colors.forEach((c, i) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r - i * (strokeSize * 1.6), Math.PI, 0, true);
    ctx.strokeStyle = c; ctx.lineWidth = strokeSize * 1.4; ctx.stroke();
  });
}

/* ── SHAPE REGISTRY ── */
const SHAPE_REGISTRY = {
  // Existing shapes (wrappers for drawShapeAtCenter)
  rect:      { label: '▭ Rectangle', icon: '▭' },
  circle:    { label: '◯ Circle',    icon: '◯' },
  line:      { label: '╱ Line',      icon: '╱' },
  // New shapes
  star:      { label: '⭐ Star',      icon: '⭐' },
  heart:     { label: '❤️ Heart',    icon: '❤️' },
  diamond:   { label: '💎 Diamond',  icon: '◇' },
  pentagon:  { label: '⬠ Pentagon',  icon: '⬠' },
  hexagon:   { label: '⬡ Hexagon',   icon: '⬡' },
  arrow:     { label: '➜ Arrow',     icon: '➜' },
  cloud:     { label: '☁️ Cloud',    icon: '☁️' },
  moon:      { label: '🌙 Moon',     icon: '🌙' },
  sun:       { label: '☀️ Sun',      icon: '☀️' },
  flower:    { label: '🌸 Flower',   icon: '🌸' },
  leaf:      { label: '🍃 Leaf',     icon: '🍃' },
  house:     { label: '🏠 House',    icon: '🏠' },
  car:       { label: '🚗 Car',      icon: '🚗' },
  tree:      { label: '🌲 Tree',     icon: '🌲' },
  aeroplane: { label: '✈️ Plane',   icon: '✈️' },
  person:    { label: '🚶 Person',   icon: '🚶' },
  triangle:  { label: '△ Triangle',  icon: '△' },
  octagon:   { label: '⬡ Octagon',  icon: '⯃' },
  cross:     { label: '✚ Cross',     icon: '✚' },
  zigzag:    { label: '〰 ZigZag',   icon: '〰' },
  spiral:    { label: '🌀 Spiral',   icon: '🌀' },
  rainbow:   { label: '🌈 Rainbow',  icon: '🌈' },
};

/* ── MAIN DRAW-SHAPE-ON-CANVAS FUNCTION ── */
function drawCommandShape(shapeName, cx, cy, size, colorOverride) {
  const canvas = CANVAS.canvas;
  const ctx = CANVAS.ctx;
  const color = colorOverride || randomVibrantColor();
  const fillColor = colorOverride ? colorOverride + '55' : randomVibrantColor() + '88';
  const sw = CANVAS.strokeSize || 3;
  const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);

  ctx.save();
  const s = size || Math.min(canvas.width, canvas.height) * 0.18;

  switch (shapeName) {
    case 'star':
      drawStar(ctx, cx, cy, s, s * 0.45, 5, color, fillColor, sw); break;
    case 'heart':
      drawHeart(ctx, cx, cy, s, color, fillColor, sw); break;
    case 'diamond':
      drawDiamond(ctx, cx, cy, s * 1.3, s * 1.6, color, fillColor, sw); break;
    case 'pentagon':
      drawPolygon(ctx, cx, cy, s, 5, color, fillColor, sw); break;
    case 'hexagon':
      drawPolygon(ctx, cx, cy, s, 6, color, fillColor, sw); break;
    case 'arrow':
      drawArrow(ctx, cx - s * 0.8, cy, cx + s * 0.8, cy, color, sw * 1.8, s * 0.28); break;
    case 'cloud':
      drawCloud(ctx, cx, cy, s * 2, s * 1.2, color, fillColor, sw); break;
    case 'moon':
      drawMoon(ctx, cx, cy, s, color, fillColor, sw); break;
    case 'sun':
      drawSun(ctx, cx, cy, s * 0.6, color, fillColor, sw); break;
    case 'flower':
      drawFlower(ctx, cx, cy, s, color, fillColor, sw); break;
    case 'leaf':
      drawLeaf(ctx, cx, cy, s * 0.7, s * 1.3, color, fillColor, sw); break;
    case 'house':
      drawHouse(ctx, cx, cy, s * 1.6, s * 1.5, color, fillColor, sw); break;
    case 'car':
      drawCar(ctx, cx, cy, s * 2.2, s * 1.1, color, fillColor, sw); break;
    case 'tree':
      drawTree(ctx, cx, cy, s * 1.6, s * 2, color, fillColor, sw); break;
    case 'aeroplane':
      drawAeroplane(ctx, cx, cy, s * 2, s * 1.8, color, fillColor, sw); break;
    case 'person':
      drawStickFigure(ctx, cx, cy, s * 0.9, s * 1.8, color, sw); break;
    case 'triangle':
      drawTriangle(ctx, cx, cy, s, color, fillColor, sw); break;
    case 'octagon':
      drawOctagon(ctx, cx, cy, s, color, fillColor, sw); break;
    case 'cross':
      drawCross(ctx, cx, cy, s * 1.3, s * 1.3, color, fillColor, sw); break;
    case 'zigzag':
      drawZigZag(ctx, cx - s, cy, s * 2, s * 0.9, color, sw * 1.5); break;
    case 'spiral':
      drawSpiral(ctx, cx, cy, s, color, sw); break;
    case 'rainbow':
      drawRainbow(ctx, cx, cy + s * 0.5, s, sw); break;
    case 'rect':
      ctx.beginPath();
      ctx.rect(cx - s * 0.7, cy - s * 0.5, s * 1.4, s);
      ctx.fillStyle = fillColor; ctx.fill();
      ctx.strokeStyle = color; ctx.lineWidth = sw; ctx.stroke(); break;
    case 'circle':
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.65, 0, Math.PI * 2);
      ctx.fillStyle = fillColor; ctx.fill();
      ctx.strokeStyle = color; ctx.lineWidth = sw; ctx.stroke(); break;
    default:
      drawPolygon(ctx, cx, cy, s, 5, color, fillColor, sw);
  }

  ctx.restore();

  // Store as imageData object so it can be undone
  const newSnap = ctx.getImageData(0, 0, canvas.width, canvas.height);
  CANVAS.objects.push({ id: CANVAS.nextId++, type: 'imageData', imageData: newSnap, x: 0, y: 0, w: 0, h: 0 });
  return newSnap;
}

/* ── COMMAND-BASED DRAWING SYSTEM ── */
const SHAPE_ALIASES = {
  tree: 'tree', trees: 'tree',
  house: 'house', home: 'house', building: 'house',
  car: 'car', vehicle: 'car', automobile: 'car',
  plane: 'aeroplane', airplane: 'aeroplane', aeroplane: 'aeroplane', aircraft: 'aeroplane', jet: 'aeroplane',
  star: 'star', stars: 'star',
  heart: 'heart', love: 'heart',
  diamond: 'diamond', gem: 'diamond',
  pentagon: 'pentagon',
  hexagon: 'hexagon',
  arrow: 'arrow',
  cloud: 'cloud',
  moon: 'moon', crescent: 'moon',
  sun: 'sun', sunshine: 'sun',
  flower: 'flower', rose: 'flower', bloom: 'flower',
  leaf: 'leaf', leaves: 'leaf',
  person: 'person', human: 'person', man: 'person', woman: 'person', figure: 'person', stick: 'person',
  triangle: 'triangle', pyramid: 'triangle',
  octagon: 'octagon', stop: 'octagon',
  cross: 'cross', plus: 'cross',
  zigzag: 'zigzag', zag: 'zigzag', wave: 'zigzag',
  spiral: 'spiral', swirl: 'spiral',
  rainbow: 'rainbow',
  circle: 'circle', ball: 'circle', sphere: 'circle', oval: 'circle', ellipse: 'circle',
  rect: 'rect', rectangle: 'rect', square: 'rect', box: 'rect',
  line: 'line',
  hexagon: 'hexagon',
};

function parseDrawCommand(input) {
  if (!input) return null;
  const lower = input.toLowerCase().trim();
  // "draw X" or just "X"
  const match = lower.match(/(?:draw\s+)?(.+)/);
  if (!match) return null;
  const word = match[1].trim().split(/\s+/)[0];
  return SHAPE_ALIASES[word] || null;
}

function executeDrawCommand(input) {
  const shapeName = parseDrawCommand(input);
  if (!shapeName) {
    showToast(`❓ Unknown shape: "${input}". Try: star, house, tree, car, plane...`);
    return false;
  }
  generateVariations(shapeName);
  return true;
}

/* ── 5 VARIATIONS GENERATOR — popup picker ── */
function generateVariations(shapeName) {
  // Directly place shape as a MOVABLE image object on canvas — no background overlay
  const canvas = CANVAS.canvas;
  const size = Math.min(canvas.width, canvas.height) * 0.22;

  // Pick a random vibrant color
  const color = randomVibrantColor();
  const fillColor = color + '55';
  const sw = CANVAS.strokeSize || 3;

  // Place at center with slight random offset
  const ox = (Math.random() - 0.5) * canvas.width * 0.25;
  const oy = (Math.random() - 0.5) * canvas.height * 0.25;
  const cx = canvas.width / 2 + ox;
  const cy = canvas.height / 2 + oy;

  // Render shape onto an offscreen canvas, then store as movable 'generatedImage' object
  const offscreen = document.createElement('canvas');
  offscreen.width = Math.ceil(size * 1.4);
  offscreen.height = Math.ceil(size * 1.4);
  const octx = offscreen.getContext('2d');
  octx.clearRect(0, 0, offscreen.width, offscreen.height);

  const origColor = CANVAS.color, origFill = CANVAS.fillColor, origSW = CANVAS.strokeSize;
  CANVAS.color = color; CANVAS.fillColor = fillColor; CANVAS.strokeSize = sw;
  _drawShapeOnCtx(octx, shapeName,
    offscreen.width / 2, offscreen.height / 2,
    size * 0.45, color, fillColor, sw);
  CANVAS.color = origColor; CANVAS.fillColor = origFill; CANVAS.strokeSize = origSW;

  // Convert to Image so it can be drawn and moved
  const imgSrc = offscreen.toDataURL();
  const img = new Image();
  img.onload = () => {
    const objW = offscreen.width;
    const objH = offscreen.height;
    addObject({
      type: 'generatedImage',
      img,
      imgSrc,
      shapeName,
      x: cx - objW / 2,
      y: cy - objH / 2,
      w: objW,
      h: objH,
      color, fillColor, strokeSize: sw
    });
    redrawAll();
    saveToUndoStack();
    showToast(`✨ ${shapeName} placed! Drag to move it.`);
    addToHistory(`${APP.user.name} generated a ${shapeName}`);
    addToTimeline(`${APP.user.name} generated ${shapeName}`);
  };
  img.src = imgSrc;
}

/* ── Draw a shape onto any given 2D context (used for mini previews) ── */
function _drawShapeOnCtx(ctx, shapeName, cx, cy, s, color, fillColor, sw) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = fillColor;
  ctx.lineWidth = sw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (shapeName) {
    case 'star':
      drawStar(ctx, cx, cy, s, s * 0.45, 5, color, fillColor, sw); break;
    case 'heart':
      drawHeart(ctx, cx, cy, s, color, fillColor, sw); break;
    case 'diamond':
      drawDiamond(ctx, cx, cy, s * 1.2, s * 1.5, color, fillColor, sw); break;
    case 'pentagon':
      drawPolygon(ctx, cx, cy, s, 5, color, fillColor, sw); break;
    case 'hexagon':
      drawPolygon(ctx, cx, cy, s, 6, color, fillColor, sw); break;
    case 'octagon':
      drawPolygon(ctx, cx, cy, s, 8, color, fillColor, sw); break;
    case 'arrow':
      drawArrow(ctx, cx - s * 0.8, cy, cx + s * 0.8, cy, color, sw * 1.5, s * 0.3); break;
    case 'cloud':
      drawCloud(ctx, cx, cy, s * 2, s * 1.2, color, fillColor, sw); break;
    case 'moon': case 'crescent':
      drawMoon(ctx, cx, cy, s, color, fillColor, sw); break;
    case 'sun':
      drawSun(ctx, cx, cy, s * 0.55, color, fillColor, sw); break;
    case 'flower':
      drawFlower(ctx, cx, cy, s, color, fillColor, sw); break;
    case 'leaf':
      drawLeaf(ctx, cx, cy, s * 0.7, s * 1.3, color, fillColor, sw); break;
    case 'house':
      drawHouse(ctx, cx, cy, s * 1.5, s * 1.4, color, fillColor, sw); break;
    case 'car':
      drawCar(ctx, cx, cy, s * 2, s, color, fillColor, sw); break;
    case 'tree':
      drawTree(ctx, cx, cy, s * 1.4, s * 1.8, color, fillColor, sw); break;
    case 'aeroplane':
      drawAeroplane(ctx, cx, cy, s * 2, s * 1.6, color, fillColor, sw); break;
    case 'person':
      drawStickFigure(ctx, cx, cy, s * 0.8, s * 1.6, color, sw); break;
    case 'triangle':
      drawTriangle(ctx, cx, cy, s, color, fillColor, sw); break;
    case 'cross':
      drawCross(ctx, cx, cy, s * 1.2, s * 1.2, color, fillColor, sw); break;
    case 'zigzag':
      drawZigZag(ctx, cx - s, cy, s * 2, s * 0.8, color, sw * 1.5); break;
    case 'spiral':
      drawSpiral(ctx, cx, cy, s, color, sw); break;
    case 'rainbow':
      drawRainbow(ctx, cx, cy + s * 0.4, s, sw); break;
    case 'rect': case 'square': {
      const rw = shapeName === 'square' ? s * 1.4 : s * 1.6;
      const rh = s;
      ctx.beginPath(); ctx.rect(cx - rw / 2, cy - rh / 2, rw, rh);
      ctx.fillStyle = fillColor; ctx.fill(); ctx.strokeStyle = color; ctx.stroke(); break;
    }
    case 'circle': {
      ctx.beginPath(); ctx.arc(cx, cy, s * 0.65, 0, Math.PI * 2);
      ctx.fillStyle = fillColor; ctx.fill(); ctx.strokeStyle = color; ctx.stroke(); break;
    }
    case 'line': {
      ctx.beginPath(); ctx.moveTo(cx - s, cy); ctx.lineTo(cx + s, cy);
      ctx.strokeStyle = color; ctx.lineWidth = sw * 1.5; ctx.stroke(); break;
    }
    case 'parallelogram': {
      const pw = s * 1.5, ph = s * 0.8, poff = pw * 0.25;
      ctx.beginPath();
      ctx.moveTo(cx - pw/2 + poff, cy - ph/2); ctx.lineTo(cx + pw/2, cy - ph/2);
      ctx.lineTo(cx + pw/2 - poff, cy + ph/2); ctx.lineTo(cx - pw/2, cy + ph/2);
      ctx.closePath(); ctx.fillStyle = fillColor; ctx.fill(); ctx.strokeStyle = color; ctx.stroke(); break;
    }
    case 'cylinder': {
      const crx = s * 0.7, cry = s * 0.18;
      ctx.beginPath(); ctx.ellipse(cx, cy - s * 0.6, crx, cry, 0, 0, Math.PI * 2);
      ctx.fillStyle = fillColor; ctx.fill(); ctx.strokeStyle = color; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - crx, cy - s * 0.6); ctx.lineTo(cx - crx, cy + s * 0.6);
      ctx.ellipse(cx, cy + s * 0.6, crx, cry, 0, Math.PI, 0); ctx.lineTo(cx + crx, cy - s * 0.6); ctx.closePath();
      ctx.fill(); ctx.stroke(); break;
    }
    case 'cone': {
      const conrx = s * 0.7, conry = s * 0.18;
      ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.7); ctx.lineTo(cx + conrx, cy + s * 0.6);
      ctx.ellipse(cx, cy + s * 0.6, conrx, conry, 0, 0, Math.PI * 2);
      ctx.lineTo(cx - conrx, cy + s * 0.6); ctx.closePath();
      ctx.fillStyle = fillColor; ctx.fill(); ctx.strokeStyle = color; ctx.stroke(); break;
    }
    // Complex object types — use the canvas.js helper functions
    case 'smiley':   _drawSmileyObj(ctx, cx - s, cy - s, s * 2, s * 2, color, sw); break;
    case 'rocket':   _drawRocketObj(ctx, cx, cy, s, color); break;
    case 'heart':    _drawHeartObj(ctx, cx, cy, s, color, fillColor, sw); break;
    case 'cloud':    _drawCloudObj(ctx, cx - s, cy - s * 0.6, s * 2, s * 1.2, color, sw); break;
    case 'snowflake':_drawSnowflakeObj(ctx, cx, cy, s, color, sw); break;
    case 'fish':     _drawFishObj(ctx, cx - s, cy - s * 0.4, s * 2, s * 0.8, color, fillColor, sw); break;
    case 'butterfly':_drawButterflyObj(ctx, cx - s, cy - s, s * 2, s * 2, color, sw); break;
    case 'crown':    _drawCrownObj(ctx, cx - s, cy - s * 0.5, s * 2, s, color, fillColor, sw); break;
    case 'gift':     _drawGiftObj(ctx, cx - s * 0.7, cy - s * 0.7, s * 1.4, s * 1.4, color, sw); break;
    case 'music':    _drawMusicObj(ctx, cx, cy, s, color, sw); break;
    case 'clock':    _drawClockObj(ctx, cx, cy, s, color, sw); break;
    case 'umbrella': _drawUmbrellaObj(ctx, cx - s, cy - s, s * 2, s * 2, color, sw); break;
    case 'mountain': _drawMountainObj(ctx, cx - s, cy - s * 0.7, s * 2, s * 1.4, color, sw); break;
    case 'wave':     _drawWaveObj(ctx, cx - s, cy - s * 0.3, s * 2, s * 0.6, color, sw); break;
    case 'lightning':_drawLightningObj(ctx, cx - s * 0.5, cy - s, s, s * 2, color, fillColor, sw); break;
    case 'leaf':     _drawLeafObj(ctx, cx - s * 0.5, cy - s, s, s * 2, color, sw); break;
    case 'sunflower':_drawSunflowerObj(ctx, cx, cy, s, color, sw); break;
    default:
      drawPolygon(ctx, cx, cy, s, 5, color, fillColor, sw);
  }
  ctx.restore();
}

/* ── INJECT SHAPE TOOLBAR BUTTONS ── */
function initShapeToolbar() {
  // Find or create shape dropdown in toolbar
  const toolbar = document.querySelector('.toolbar');
  if (!toolbar) return;

  // Check if already initialized
  if (document.getElementById('shape-select')) return;

  // Find the shapes tool-group (after circle button)
  const toolDividers = toolbar.querySelectorAll('.tool-divider');

  // Create a new shapes group
  const shapesGroup = document.createElement('div');
  shapesGroup.className = 'tool-group shape-selector-group';
  shapesGroup.innerHTML = `
    <label class="tool-label">Shapes</label>
    <select id="shape-select" title="Pick a shape" onchange="onShapeSelect(this.value)">
      <option value="">-- Pick Shape --</option>
      <optgroup label="Basic">
        <option value="rect">▭ Rectangle</option>
        <option value="circle">◯ Circle</option>
        <option value="line">╱ Line</option>
        <option value="triangle">△ Triangle</option>
      </optgroup>
      <optgroup label="Fun Shapes">
        <option value="star">⭐ Star</option>
        <option value="heart">❤️ Heart</option>
        <option value="diamond">◇ Diamond</option>
        <option value="pentagon">⬠ Pentagon</option>
        <option value="hexagon">⬡ Hexagon</option>
        <option value="octagon">⬡ Octagon</option>
        <option value="cross">✚ Cross</option>
        <option value="arrow">➜ Arrow</option>
      </optgroup>
      <optgroup label="Nature">
        <option value="cloud">☁️ Cloud</option>
        <option value="moon">🌙 Moon</option>
        <option value="sun">☀️ Sun</option>
        <option value="flower">🌸 Flower</option>
        <option value="leaf">🍃 Leaf</option>
        <option value="tree">🌲 Tree</option>
        <option value="rainbow">🌈 Rainbow</option>
      </optgroup>
      <optgroup label="Objects">
        <option value="house">🏠 House</option>
        <option value="car">🚗 Car</option>
        <option value="aeroplane">✈️ Aeroplane</option>
        <option value="person">🚶 Person</option>
      </optgroup>
      <optgroup label="Patterns">
        <option value="zigzag">〰 ZigZag</option>
        <option value="spiral">🌀 Spiral</option>
      </optgroup>
    </select>
  `;

  // Insert after the first divider
  const firstDivider = toolbar.querySelector('.tool-divider');
  if (firstDivider) {
    toolbar.insertBefore(shapesGroup, firstDivider.nextSibling);
    // Insert a divider after
    const div = document.createElement('div');
    div.className = 'tool-divider';
    toolbar.insertBefore(div, shapesGroup.nextSibling);
  } else {
    toolbar.appendChild(shapesGroup);
  }
}

function onShapeSelect(val) {
  if (!val) return;
  const canvas = CANVAS.canvas;
  const cx = canvas.width / 2 + randomOffset(canvas.width * 0.15);
  const cy = canvas.height / 2 + randomOffset(canvas.height * 0.15);
  const size = Math.min(canvas.width, canvas.height) * 0.2;

  // Complex objects that have custom draw routines
  const complexTypes = ['sun','tree','flower','heart','cloud','rocket','rainbow','smiley','house',
    'mountain','wave','lightning','snowflake','leaf','fish','butterfly','crown','gift','music',
    'clock','umbrella','car','sunflower'];

  // Simple geometric shapes stored as typed objects
  const simpleTypes = ['rect','circle','line','triangle','diamond','pentagon','hexagon','octagon',
    'star','arrow','crescent','cross','parallelogram','cylinder','cone','square'];

  if (complexTypes.includes(val)) {
    // Store as named-type object (rendered by drawObject switch)
    addObject({ type: val, x: cx - size/2, y: cy - size/2, w: size, h: size,
      color: CANVAS.color, fillColor: CANVAS.fillColor, strokeSize: CANVAS.strokeSize });
    redrawAll(); saveToUndoStack();
    addToHistory(`${APP.user.name} drew a ${val}`);
    addToTimeline(`${APP.user.name} drew ${val}`);
    showToast(`🎨 Drew a ${val}!`);
  } else if (simpleTypes.includes(val)) {
    // Store as typed geometric object
    addObject({ type: val, x: cx - size/2, y: cy - size/2, w: size, h: size,
      color: CANVAS.color, fillColor: CANVAS.fillColor, strokeSize: CANVAS.strokeSize });
    redrawAll(); saveToUndoStack();
    addToHistory(`${APP.user.name} drew a ${val}`);
    addToTimeline(`${APP.user.name} drew ${val}`);
    showToast(`🎨 Drew a ${val}!`);
  } else {
    // Fallback: use drawCommandShape for anything else
    drawCommandShape(val, cx, cy);
    redrawAll(); saveToUndoStack();
    addToHistory(`${APP.user.name} drew a ${val}`);
    addToTimeline(`${APP.user.name} drew ${val}`);
    showToast(`🎨 Drew a ${val}!`);
  }
  document.getElementById('shape-select').value = '';
}

/* ── INIT: inject toolbar + command bar once whiteboard loads ── */
const _origGoToWhiteboard = window.goToWhiteboard;

// Patch initWhiteboard to also set up shapes
const _origInitWhiteboard = window.initWhiteboard;
window.initWhiteboardShapesReady = function() {
  initShapeToolbar();
  initCommandBar();
};

/* ── COMMAND BAR INIT ── */
function initCommandBar() {
  if (document.getElementById('cmd-bar')) return;

  const canvasArea = document.querySelector('.canvas-area');
  if (!canvasArea) return;

  const bar = document.createElement('div');
  bar.id = 'cmd-bar';
  bar.className = 'cmd-bar';
  bar.innerHTML = `
    <div class="cmd-bar-inner">
      <span class="cmd-bar-icon">🎨</span>
      <input type="text" id="cmd-input" class="cmd-input"
        placeholder='Type "draw tree", "draw house", "draw star"...'
        onkeydown="cmdKeydown(event)" autocomplete="off" />
      <button class="cmd-generate-btn" onclick="onCmdGenerate()" title="Generate 5 Variations">
        <span>Generate</span><span class="cmd-btn-icon">✨</span>
      </button>
      <button class="cmd-voice-btn" id="cmd-voice-btn" onclick="toggleCmdVoice()" title="Voice Input">🎙️</button>
    </div>
    <div class="cmd-suggestions" id="cmd-suggestions"></div>
  `;

  // Insert before canvas wrapper
  const canvasWrapper = canvasArea.querySelector('.canvas-wrapper');
  if (canvasWrapper) {
    canvasArea.insertBefore(bar, canvasWrapper);
  } else {
    canvasArea.appendChild(bar);
  }

  // Setup suggestions on focus
  const input = document.getElementById('cmd-input');
  input.addEventListener('focus', showCmdSuggestions);
  input.addEventListener('input', filterCmdSuggestions);
  input.addEventListener('blur', () => {
    setTimeout(() => {
      const sug = document.getElementById('cmd-suggestions');
      if (sug) sug.style.display = 'none';
    }, 200);
  });
}

function showCmdSuggestions() {
  filterCmdSuggestions();
}

function filterCmdSuggestions() {
  const sug = document.getElementById('cmd-suggestions');
  if (!sug) return;
  const val = (document.getElementById('cmd-input')?.value || '').toLowerCase();

  const all = Object.keys(SHAPE_ALIASES).filter(k => !val || k.includes(val) || SHAPE_ALIASES[k].includes(val));
  const unique = [...new Set(Object.values(SHAPE_ALIASES))].filter(s => !val || s.includes(val));

  if (!unique.length) { sug.style.display = 'none'; return; }

  sug.innerHTML = unique.slice(0, 8).map(s => {
    const reg = SHAPE_REGISTRY[s];
    return `<button class="cmd-sug-btn" onclick="selectCmdSuggestion('${s}')">${reg ? reg.icon : '◇'} ${s}</button>`;
  }).join('');
  sug.style.display = 'flex';
}

function selectCmdSuggestion(shape) {
  const input = document.getElementById('cmd-input');
  if (input) input.value = 'draw ' + shape;
  const sug = document.getElementById('cmd-suggestions');
  if (sug) sug.style.display = 'none';
  onCmdGenerate();
}

function cmdKeydown(e) {
  if (e.key === 'Enter') onCmdGenerate();
  if (e.key === 'Escape') {
    document.getElementById('cmd-suggestions').style.display = 'none';
  }
}

function onCmdGenerate() {
  const input = document.getElementById('cmd-input');
  const val = input?.value?.trim();
  if (!val) { showToast('💬 Type a shape name to generate!'); return; }
  const success = executeDrawCommand(val);
  if (success && input) input.value = '';
}

/* ── VOICE RECOGNITION FOR CMD BAR ── */
let cmdVoiceRecognition = null;
let cmdVoiceActive = false;

function toggleCmdVoice() {
  const btn = document.getElementById('cmd-voice-btn');
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    showToast('⚠️ Voice not supported in this browser');
    return;
  }
  if (cmdVoiceActive) {
    if (cmdVoiceRecognition) cmdVoiceRecognition.stop();
    cmdVoiceActive = false;
    if (btn) { btn.textContent = '🎙️'; btn.classList.remove('voice-active'); }
    return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  cmdVoiceRecognition = new SR();
  cmdVoiceRecognition.continuous = false;
  cmdVoiceRecognition.interimResults = false;
  cmdVoiceRecognition.lang = 'en-US';
  cmdVoiceRecognition.onstart = () => {
    cmdVoiceActive = true;
    if (btn) { btn.textContent = '🔴'; btn.classList.add('voice-active'); }
    showToast('🎙️ Listening... say "draw tree" etc.');
  };
  cmdVoiceRecognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    const input = document.getElementById('cmd-input');
    if (input) input.value = transcript;
    executeDrawCommand(transcript);
  };
  cmdVoiceRecognition.onend = () => {
    cmdVoiceActive = false;
    if (btn) { btn.textContent = '🎙️'; btn.classList.remove('voice-active'); }
  };
  cmdVoiceRecognition.onerror = () => {
    cmdVoiceActive = false;
    if (btn) { btn.textContent = '🎙️'; btn.classList.remove('voice-active'); }
    showToast('⚠️ Voice recognition error');
  };
  cmdVoiceRecognition.start();
}

/* ── ALSO extend voice.js commands ── */
window._extendVoiceCommands = function(transcript) {
  const lower = transcript.toLowerCase();
  const shapeName = parseDrawCommand(lower);
  if (shapeName) {
    const canvas = CANVAS.canvas;
    const cx = canvas.width / 2 + randomOffset(60);
    const cy = canvas.height / 2 + randomOffset(60);
    const size = Math.min(canvas.width, canvas.height) * 0.2;

    const complexTypes = ['sun','tree','flower','heart','cloud','rocket','rainbow','smiley','house',
      'mountain','wave','lightning','snowflake','leaf','fish','butterfly','crown','gift','music',
      'clock','umbrella','car','sunflower'];

    if (complexTypes.includes(shapeName)) {
      addObject({ type: shapeName, x: cx - size/2, y: cy - size/2, w: size, h: size,
        color: CANVAS.color, fillColor: CANVAS.fillColor, strokeSize: CANVAS.strokeSize });
    } else {
      addObject({ type: shapeName, x: cx - size/2, y: cy - size/2, w: size, h: size,
        color: CANVAS.color, fillColor: CANVAS.fillColor, strokeSize: CANVAS.strokeSize });
    }
    redrawAll(); saveToUndoStack();
    addToTimeline(`${APP.user.name} drew ${shapeName} (voice)`);
    return true;
  }
  return false;
};
