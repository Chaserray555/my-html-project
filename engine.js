const ARCADE = (() => {
  const games = [];
  const $ = s => document.querySelector(s);
  let cat = 'all', query = '';
  const cv = $('#cv'), ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const norm = k => { k = k.toLowerCase();
    if (k === 'arrowleft' || k === 'a') return 'left';
    if (k === 'arrowright' || k === 'd') return 'right';
    if (k === 'arrowup' || k === 'w') return 'up';
    if (k === 'arrowdown' || k === 's') return 'down';
    if (k === ' ' || k === 'space' || k === 'enter' || k === 'z') return 'action';
    return k.length === 1 ? k : k;
  };
  let keys = new Set();
  let keyFns = [], anyFns = [], tapFns = [], dragFns = [], swipeFns = [], relFns = [];
  let upFns = [], downFns = [];
  let state = 'idle', cur = null, raf = 0, tLast = 0;
  let score = 0, best = 0, pdown = false, px = 0, py = 0, sx = 0, sy = 0, moved = false;
  let flushKeys = [];

  const hsKey = id => 'ta_' + id;
  const loadHS = id => +(localStorage.getItem(hsKey(id)) || 0);
  const saveHS = (id, v) => { if (v > loadHS(id)) { localStorage.setItem(hsKey(id), v); return true; } return false; };

  function scheduleKey(k) { flushKeys.push(k); }

  function envFor(g) {
    return {
      W, H, ctx, keys,
      rand: n => Math.random() * n, iri: n => Math.floor(Math.random() * n),
      choice: a => a[Math.floor(Math.random() * a.length)],
      saveHS, loadHS, cur,
      score(v) { score = v; }, over(msg) { endGame(msg); },
      needPad(a, b) { $('#padL').hidden = !a; $('#padA').hidden = !b; },
      key(fn) { keyFns.push(fn); }, anyKey(fn) { anyFns.push(fn); },
      tap(fn) { tapFns.push(fn); }, drag(fn) { dragFns.push(fn); },
      swipe(fn) { swipeFns.push(fn); }, release(fn) { relFns.push(fn); },
      down(fn) { downFns.push(fn); }, up(fn) { upFns.push(fn); }
    };
  }

  function startGame(g) {
    cur = g; state = 'ready';
    $('#grid').hidden = true; $('#player').hidden = false;
    $('#ptitle').textContent = g.emoji + ' ' + g.name;
    $('#hs').textContent = 'Best: ' + loadHS(g.id);
    $('#overlay').hidden = false;
    $('#ovtitle').textContent = g.emoji + ' ' + g.name;
    $('#ovmsg').textContent = g.desc || '';
    $('#ovhint').textContent = (g.tags || 'Tap anywhere') + '  •  Tap / Space to start · R restarts · ⌫ back to menu';
    $('#padL').hidden = true; $('#padA').hidden = true;
    stopLoop(); freshState(); drawReady();
    location.hash = g.id;
  }
  function endGame(msg = '') {
    state = 'over'; saveHS(cur.id, Math.floor(score));
    best = loadHS(cur.id);
    $('#hs').textContent = 'Best: ' + best;
    $('#overlay').hidden = false;
    $('#ovtitle').textContent = 'SCORE ' + Math.floor(score);
    $('#ovmsg').textContent = (msg || '') + ((Math.floor(score) >= best && Math.floor(score) > 0) ? '\n🏆 NEW BEST!' : '');
    $('#ovhint').textContent = 'Tap / Space to play again';
  }
  function freshState() {
    keys = new Set(); keyFns = []; anyFns = []; tapFns = []; dragFns = []; swipeFns = [];
    relFns = []; upFns = []; downFns = []; flushKeys = []; score = 0; moved = false;
    const env = envFor(cur);
    env.needPad(false, false);
    inst = cur.create(env) || {};
    inst.env = env;
    if (cur.auto) state = 'play';
  }
  function drawReady() {
    ctx.fillStyle = '#0a0b14'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#333a5e'; ctx.font = '120px serif'; ctx.textAlign = 'center';
    ctx.fillText(cur.emoji, W / 2, H / 2 - 40);
    ctx.fillStyle = '#8a8fa8'; ctx.font = '22px monospace';
    ctx.fillText('Tap or press Space to start', W / 2, H / 2 + 90);
  }
  function loop(t) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (t - tLast) / 1000 || 0); tLast = t;
    if (state === 'play') {
      for (const k of flushKeys) keyFns.forEach(f => f(k, inst.env));
      flushKeys = [];
      const hs = $('#hs');
      hs.textContent = 'Score ' + Math.floor(score) + ' · Best ' + loadHS(cur.id);
      try { inst.update && inst.update(t / 1000, dt, inst.env); inst.draw && inst.draw(ctx, inst.env); } catch (e) { console.error(e); }
    }
  }
  function stopLoop() { cancelAnimationFrame(raf); }

  let inst = {};  function begin() {
    state = 'play'; $('#overlay').hidden = true; tLast = performance.now();
    if (!raf) raf = requestAnimationFrame(loop);
  }
  function restart() { if (!cur) return; stopLoop(); freshState(); if (!cur.auto) { drawReady(); begin(); } else { state = 'ready'; $('#overlay').hidden = false; $('#ovtitle').textContent = cur.emoji + ' ' + cur.name; $('#ovmsg').textContent = cur.desc || ''; $('#ovhint').textContent = 'Tap / Space to start'; drawReady(); } }
  cv.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (state !== 'play') { if (state === 'ready' || state === 'over') { state === 'over' ? restart() : begin(); } return; }
    pdown = true; moved = false;
    const p = pt(e); px = p.x; py = p.y; sx = p.x; sy = p.y;
    downFns.forEach(f => f(p.x, p.y, inst.env));
  });
  cv.addEventListener('pointermove', e => {
    if (!pdown || state !== 'play') return;
    const p = pt(e);
    if (Math.hypot(p.x - sx, p.y - sy) > 18) moved = true;
    dragFns.forEach(f => f(p.x, p.y, p.x - sx, p.y - sy, inst.env));
    px = p.x; py = p.y;
  });
  cv.addEventListener('pointerup', e => {
    if (state !== 'play') return;
    pdown = false;
    const p = pt(e), dx = p.x - sx, dy = p.y - sy;
    if (!moved && tapFns.length) tapFns.forEach(f => f(p.x, p.y, inst.env));
    else if (Math.hypot(dx, dy) > 40) {
      const d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      swipeFns.forEach(f => f(d, inst.env));
    }
    relFns.forEach(f => f(p.x, p.y, inst.env));
    upFns.forEach(f => f(p.x, p.y, inst.env));
  });
  function pt(e) {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
  }
  document.addEventListener('keydown', e => {
    if ($('#player').hidden) {
      if (e.key === '/') { $('#search').focus(); e.preventDefault(); }
      return;
    }
    const k = norm(e.key);
    if (state === 'play' && anyFns.length) {
      if (k === 'backspace') { anyFns.forEach(f => f('bksp', inst.env)); return; }
      if (e.key.length === 1) {
        anyFns.forEach(f => f(e.key.toLowerCase(), inst.env));
        e.preventDefault();
      }
    }
    if (k === 'r' && e.key !== 'ArrowRight' && !anyFns.length) { restart(); return; }
    if (k === 'backspace') { goMenu(); return; }
    if (state === 'ready' || state === 'over') { if (k === 'action') { state === 'over' ? restart() : begin(); } return; }
    if (k === 'left' || k === 'right' || k === 'up' || k === 'down' || k === 'action') {
      if (!keys.has(k)) scheduleKey(k);
      keys.add(k); e.preventDefault();
    }
  });
  document.addEventListener('keyup', e => { const k = norm(e.key); keys.delete(k); });
  window.addEventListener('blur', () => { keys.clear(); });

  function goMenu() { stopLoop(); cur = null; state = 'idle'; $('#player').hidden = true; $('#grid').hidden = false; if (location.hash) history.replaceState(null, '', ' '); render(); }

  $('#back').onclick = goMenu;
  $('#rs').onclick = restart;
  const bindPad = sel => {
    $(sel).querySelectorAll('button').forEach(b => {
      b.addEventListener('pointerdown', e => {
        e.preventDefault();
        const k = b.dataset.k;
        if (state === 'ready' || state === 'over') { state === 'over' ? restart() : begin(); return; }
        if (!keys.has(k)) flushKeys.push(k);
        keys.add(k);
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => b.addEventListener(ev, () => keys.delete(b.dataset.k)));
    });
  };
  bindPad('#padL'); bindPad('#padA');
  $('#search').addEventListener('input', e => { query = e.target.value.toLowerCase(); render(); });
  window.addEventListener('hashchange', () => { const g = games.find(x => x.id === location.hash.slice(1)); if (g) startGame(g); });

  function render() {
    const cats = ['all', ...new Set(games.map(g => g.cat))];
    $('#cats').innerHTML = cats.map(c => `<button data-c="${c}" class="${c === cat ? 'on' : ''}">${c === 'all' ? '🎯 All ' + games.length : c}</button>`).join('');
    $('#cats').querySelectorAll('button').forEach(b => b.onclick = () => { cat = b.dataset.c; render(); });
    const list = games.filter(g => (cat === 'all' || g.cat === cat) && (!query || (g.name + g.cat + (g.tags || '')).toLowerCase().includes(query)));
    $('#grid').innerHTML = list.map(g => `<div class="card" data-id="${g.id}"><span class="em">${g.emoji}</span><span class="nm">${g.name}</span><span class="hs">${loadHS(g.id) ? '🏆 ' + loadHS(g.id) : ''}</span></div>`).join('');
    $('#grid').querySelectorAll('.card').forEach(c => c.onclick = () => startGame(games.find(g => g.id === c.dataset.id)));
  }

  function boot() {
    games.sort((a, b) => a.name.localeCompare(b.name));
    $('#count').textContent = '· ' + games.length + ' games';
    render();
    const h = games.find(g => g.id === location.hash.slice(1));
    if (h) startGame(h);
  }
  return {
    add(g) { games.push(g); },
    games, boot,
    utils: {
      rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); },
      txt(c, s, x, y, size = 20, col = '#fff', align = 'center') { c.fillStyle = col; c.font = size + 'px monospace'; c.textAlign = align; c.fillText(s, x, y); },
      bg(c, col = '#0d0f1a') { c.fillStyle = col; c.fillRect(0, 0, W, H); }
    }
  };
})();
