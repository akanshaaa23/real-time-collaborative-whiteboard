/* ============================================================
   DrawMe ProMax — pages.js
   Multi-page system: add, switch, delete, rename pages
   Each page stores its own objects + snapshot
   ============================================================ */

const PAGES = {
  pages: [],       // [{ id, name, objects, snapshot, nextId }]
  currentIndex: 0,
};

function initPages() {
  // Create first page from current canvas state
  PAGES.pages = [{
    id: 1,
    name: 'Page 1',
    objects: [],
    snapshot: null,
    nextId: 1,
  }];
  PAGES.currentIndex = 0;
  renderPageTabs();
}

/* Save current canvas state into pages array */
function saveCurrentPage() {
  const page = PAGES.pages[PAGES.currentIndex];
  if (!page) return;
  page.objects = CANVAS.objects.map(o => {
    if (o.type === 'generatedImage' && o.img) return { ...o, img: undefined };
    if (o.type === 'imageData') return { ...o, imageData: null, _hasID: true };
    return { ...o, points: o.points ? [...o.points] : undefined };
  });
  page.nextId = CANVAS.nextId;
  // Save pixel snapshot
  if (CANVAS.canvas) {
    try { page.snapshot = CANVAS.ctx.getImageData(0, 0, CANVAS.canvas.width, CANVAS.canvas.height); } catch(e) {}
  }
}

/* Load a page into canvas */
function loadPage(index) {
  saveCurrentPage();
  PAGES.currentIndex = index;
  const page = PAGES.pages[index];
  if (!page) return;

  CANVAS.objects = page.objects.map(o => {
    if (o.type === 'generatedImage' && o.imgSrc && !o.img) {
      const img = new Image(); img.src = o.imgSrc;
      return { ...o, img };
    }
    return { ...o };
  });
  CANVAS.nextId = page.nextId || 1;
  CANVAS.selectedId = null;

  if (page.snapshot && CANVAS.canvas) {
    CANVAS.ctx.putImageData(page.snapshot, 0, 0);
  } else {
    CANVAS.ctx.fillStyle = '#ffffff';
    CANVAS.ctx.fillRect(0, 0, CANVAS.canvas.width, CANVAS.canvas.height);
  }
  redrawAll();
  renderPageTabs();
  showToast(`📄 ${page.name}`);
}

function addPage() {
  saveCurrentPage();
  const id = Date.now();
  const num = PAGES.pages.length + 1;
  PAGES.pages.push({ id, name: 'Page ' + num, objects: [], snapshot: null, nextId: 1 });
  loadPage(PAGES.pages.length - 1);
}

function deletePage(index) {
  if (PAGES.pages.length <= 1) { showToast('⚠️ At least one page required!'); return; }
  PAGES.pages.splice(index, 1);
  const newIndex = Math.min(index, PAGES.pages.length - 1);
  PAGES.currentIndex = newIndex;
  loadPage(newIndex);
}

function renamePage(index) {
  const page = PAGES.pages[index];
  const name = prompt('Rename page:', page.name);
  if (name && name.trim()) {
    page.name = name.trim();
    renderPageTabs();
  }
}

function duplicatePage(index) {
  saveCurrentPage();
  const src = PAGES.pages[index];
  const copy = {
    id: Date.now(),
    name: src.name + ' (copy)',
    objects: JSON.parse(JSON.stringify(src.objects.map(o => ({ ...o, imageData: undefined, img: undefined })))),
    snapshot: src.snapshot ? cloneImageData(src.snapshot) : null,
    nextId: src.nextId,
  };
  PAGES.pages.splice(index + 1, 0, copy);
  loadPage(index + 1);
}

function cloneImageData(id) {
  try {
    const c = document.createElement('canvas');
    c.width = id.width; c.height = id.height;
    c.getContext('2d').putImageData(id, 0, 0);
    return c.getContext('2d').getImageData(0, 0, c.width, c.height);
  } catch(e) { return null; }
}

/* Render the page tab bar */
function renderPageTabs() {
  const bar = document.getElementById('page-tab-bar');
  if (!bar) return;
  bar.innerHTML = '';

  PAGES.pages.forEach((page, i) => {
    const tab = document.createElement('div');
    tab.className = 'page-tab' + (i === PAGES.currentIndex ? ' active' : '');
    tab.title = 'Double-click to rename';

    const label = document.createElement('span');
    label.className = 'page-tab-label';
    label.textContent = page.name;
    label.ondblclick = (e) => { e.stopPropagation(); renamePage(i); };

    const del = document.createElement('button');
    del.className = 'page-tab-del';
    del.textContent = '×';
    del.title = 'Delete page';
    del.onclick = (e) => { e.stopPropagation(); deletePage(i); };

    tab.appendChild(label);
    if (PAGES.pages.length > 1) tab.appendChild(del);
    tab.onclick = () => { if (i !== PAGES.currentIndex) loadPage(i); };

    // Right-click context menu
    tab.oncontextmenu = (e) => {
      e.preventDefault();
      showPageContextMenu(e, i);
    };

    bar.appendChild(tab);
  });

  // Page counter
  const counter = document.getElementById('page-counter');
  if (counter) counter.textContent = `${PAGES.currentIndex + 1} / ${PAGES.pages.length}`;
}

function showPageContextMenu(e, index) {
  const existing = document.getElementById('page-ctx-menu');
  if (existing) existing.remove();

  const menu = document.createElement('div');
  menu.id = 'page-ctx-menu';
  menu.style.cssText = `
    position:fixed; left:${e.clientX}px; top:${e.clientY}px;
    background:var(--bg-panel); border:1px solid var(--border);
    border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,0.4);
    z-index:9999; min-width:160px; padding:4px 0; font-size:13px;
  `;
  const items = [
    { label: '✏️ Rename', fn: () => renamePage(index) },
    { label: '📋 Duplicate', fn: () => duplicatePage(index) },
    { label: '🗑️ Delete', fn: () => deletePage(index) },
  ];
  items.forEach(item => {
    const el = document.createElement('div');
    el.textContent = item.label;
    el.style.cssText = 'padding:8px 14px;cursor:pointer;color:var(--text-primary);';
    el.onmouseover = () => el.style.background = 'var(--bg-hover)';
    el.onmouseout = () => el.style.background = '';
    el.onclick = () => { item.fn(); menu.remove(); };
    menu.appendChild(el);
  });
  document.body.appendChild(menu);
  setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 10);
}
