(() => {
const U = ARCADE.utils, W = 480, H = 720;

ARCADE.add({
  id: 'pong', emoji: '🏓', name: 'Pong', cat: 'Retro', tags: '↑↓ / drag',
  desc: 'Rally against the bot. Every player hit = 1 point.\nMiss 5 balls and it’s over',
  create(env) {
    const s = { py: H/2, ai: H/2, bx: W/2, by: H/2, vx: 240, vy: 160, sc: 0, miss: 0 };
    env.needPad(true, false);
    env.drag((x, y) => s.py = y);
    return {
      update(t, dt) {
        if (env.keys.has('up')) s.py -= 360*dt;
        if (env.keys.has('down')) s.py += 360*dt;
        s.py = Math.max(45, Math.min(H-45, s.py));
        s.ai = Math.max(45, Math.min(H-45, s.ai + Math.max(-230*dt, Math.min(230*dt, (s.by - s.ai) * 4 * dt))));
        s.bx += s.vx*dt; s.by += s.vy*dt;
        if (s.by < 10 || s.by > H-10) { s.vy *= -1; s.by = Math.max(10, Math.min(H-10, s.by)); }
        if (s.bx < 14 && s.vx < 0 && Math.abs(s.by - s.py) < 55) { s.vx = Math.abs(s.vx)*1.09; s.vy += (s.by - s.py) * 3; s.sc++; env.score(s.sc); }
        if (s.bx > W-14 && s.vx > 0 && Math.abs(s.by - s.ai) < 55) s.vx = -Math.abs(s.vx);
        if (s.bx < -10 || s.bx > W+10) {
          s.miss++; if (s.miss >= 5) return env.over('Bot wins the match 😵');
          s.bx = W/2; s.by = H/2; s.vx = (s.bx > 0 ? -1 : 1) * 240; s.vy = 0;
        }
      },
      draw(c) {
        U.bg(c, '#05060e');
        for (let y = 16; y < H; y += 40) { c.fillStyle = '#2a2d4a'; c.fillRect(W/2-2, y, 4, 20); }
        c.fillStyle = '#4dff88'; c.fillRect(10, s.py-45, 8, 90);
        c.fillStyle = '#ff4081'; c.fillRect(W-18, s.ai-45, 8, 90);
        c.fillStyle = '#ffd24d'; c.beginPath(); c.arc(s.bx, s.by, 8, 0, 7); c.fill();
        U.txt(c, s.sc + ' pts  ·  misses ' + s.miss + '/5', W/2, H-18, 15, '#8a8fa8');
      }
    };
  }
});

ARCADE.add({
  id: 'invaders', emoji: '👾', name: 'Space Invaders', cat: 'Retro', tags: '←→ move · space shoot',
  desc: 'Stop the alien invasion. The grid marches faster as it thins.',
  create(env) {
    const s = { x: W/2, inv: [], dir: 1, t: 0, shots: [], bom: [], cd: 0, lives: 3, sc: 0 };
    for (let r = 0; r < 4; r++) for (let i = 0; i < 8; i++) s.inv.push({ x: 62 + i*48, y: 76 + r*44, dead: false });
    env.needPad(true, true);
    env.key(k => { if (k === 'action' && s.cd <= 0) { s.shots.push({ x: s.x, y: 630 }); s.cd = 0.32; } });
    return {
      update(t, dt) {
        s.cd -= dt;
        if (env.keys.has('left')) s.x -= 300*dt;
        if (env.keys.has('right')) s.x += 300*dt;
        s.x = Math.max(20, Math.min(W-20, s.x));
        const alive = s.inv.filter(i => !i.dead);
        if (!alive.length) return env.over('DEFENDED! 🛡️ Planet safe');
        if (alive.some(i => i.y > 610)) return env.over('They landed! 👾');
        for (const i of s.inv) if (!i.dead) { i.x += s.dir * (26 + (32 - alive.length) * 2) * dt; i.dx = i.dx || 0; }
        const left = Math.min(...alive.map(i => i.x)), right = Math.max(...alive.map(i => i.x));
        if (left < 26 || right > W-26) { s.dir *= -1; for (const i of alive) { i.y += 16; i.x += s.dir * 4; } }
        s.t -= dt;
        if (s.t <= 0) {
          s.t = Math.max(0.25, 1.4 - alive.length * 0.05);
          const a = alive[env.iri(alive.length)];
          if (a) s.bom.push({ x: a.x, y: a.y + 12, vy: 190 + s.sc });
        }
        for (const sh of s.shots) sh.y -= 520*dt;
        s.shots = s.shots.filter(sh => sh.y > -10);
        for (const i of alive) for (const sh of s.shots) if (Math.abs(sh.x - i.x) < 20 && Math.abs(sh.y - i.y) < 16) {
          i.dead = true; sh.y = -99; s.sc += 10; env.score(s.sc);
        }
        for (const b of s.bom) b.y += b.vy * dt;
        s.bom = s.bom.filter(b => {
          if (b.y > 700) return false;
          if (Math.abs(b.x - s.x) < 18 && b.y > 628) {
            s.lives--;
            if (s.lives <= 0) return false;
          }
          return true;
        });
        if (s.lives <= 0) return env.over('Ship destroyed. Earth invaded 😵');
      },
      draw(c) {
        U.bg(c, '#05060e');
        s.inv.forEach(i => { if (!i.dead) { c.fillStyle = ['#ff4081','#7c4dff','#4dd6ff','#4dff88'][Math.floor(i.y/44) % 4]; c.fillRect(i.x-16, i.y-11, 32, 12); c.fillRect(i.x-11, i.y+1, 4, 7); c.fillRect(i.x+7, i.y+1, 4, 7); c.fillRect(i.x-16, i.y-16, 12, 5); c.fillRect(i.x+4, i.y-16, 12, 5); } });
        s.shots.forEach(sh => { c.fillStyle = '#b9ff6e'; c.fillRect(sh.x-2, sh.y-8, 4, 12); });
        s.bom.forEach(b => { c.fillStyle = '#ff6e4d'; c.fillRect(b.x-2, b.y, 4, 11); });
        c.fillStyle = '#4dff88'; c.fillRect(s.x-18, 644, 36, 10); c.fillRect(s.x-3, 634, 6, 12);
        U.txt(c, '♥'.repeat(s.lives) + '  ' + s.sc, 12, 28, 17, '#fff', 'left');
      }
    };
  }
});

ARCADE.add({
  id: 'frogger', emoji: '🐸', name: 'Road & River', cat: 'Retro', tags: 'arrows / d-pad',
  desc: 'Cross traffic, surf logs, reach the lilies.\n1 point per row · 20 per pad',
  create(env) {
    const ROWS = [60, 140, 210, 280, 350, 420, 490, 560, 630];
    const s = { fx: W/2, fy: 630, sc: 0, home: false, cars: [], logs: [] };
    const lanes = [140, 210, 280, 350];
    lanes.forEach((y, li) => { const n = 2 + (li % 2); for (let i = 0; i < n; i++) s.cars.push({ y, x: (i * (W / n) + li * 40) % W, v: (li % 2 ? -1 : 1) * (70 + li * 22), w: 60 }); });
    const rl = [420, 490, 560];
    rl.forEach((y, li) => { for (let i = 0; i < 3; i++) s.logs.push({ y, x: i * (W/3) + li * 30, v: (li % 2 ? 1 : -1) * (45 + li * 12), w: 150 - li * 20 }); });
    env.needPad(true, true);
    env.key(k => {
      if (s.home || s.dead) return;
      const row = y => ROWS.findIndex(r => r === y);
      if (k === 'up') s.fy = Math.max(60, s.fy - 70);
      if (k === 'down') s.fy = Math.min(630, s.fy + 70);
      if (k === 'left') s.fx = Math.max(24, s.fx - 60);
      if (k === 'right') s.fx = Math.min(W-24, s.fx + 60);
      s.sc0 = (s.sc0 || 0);
      if (k === 'up') { s.sc += 1; env.score(s.sc + s.pads); }
      if (s.fy === ROWS[0]) { s.pads = (s.pads || 0) + 20; s.sc += 20; env.score(s.sc); s.home = true; setTimeout(() => { s.fy = 630; s.fx = W/2; s.home = false; }, 700); }
    });
    return {
      update(t, dt) {
        if (s.home) return;
        for (const cr of s.cars) { cr.x += cr.v * dt; if (cr.v < 0 && cr.x < -cr.w) cr.x = W; if (cr.v > 0 && cr.x > W) cr.x = -cr.w; }
        for (const lg of s.logs) { lg.x += lg.v * dt; if (lg.v < 0 && lg.x < -lg.w) lg.x = W; if (lg.v > 0 && lg.x > W) lg.x = -lg.w; }
        if (s.fy >= 400 && s.fy < 620) {
          const lg = s.logs.find(l => l.y === s.fy && s.fx > l.x - 20 && s.fx < l.x + l.w + 20);
          if (!lg) return env.over('Glub. Ribbit… 🌊');
          s.fx += lg.v * dt;
          if (s.fx < 10 || s.fx > W-10) return env.over('Washed off the log!');
        }
        if (s.fy > 100 && s.fy < 400 && s.cars.some(cr => cr.y === s.fy && Math.abs(cr.x - s.fx) < cr.w/2 + 18)) return env.over('Splat! 🚙');
      },
      draw(c) {
        U.bg(c, '#0a0b14');
        c.fillStyle = '#123a5a'; c.fillRect(0, 380, W, 260);
        c.fillStyle = '#2a1030'; c.fillRect(0, 100, W, 300);
        c.fillStyle = '#1a4d2a'; c.fillRect(0, 24, W, 90); c.fillRect(0, 632, W, 90);
        for (let i = 0; i < 7; i++) { c.fillStyle = '#2d7a3a'; c.beginPath(); c.ellipse(40 + i*68, 66, 26, 16, 0, 0, 7); c.fill(); }
        c.font = '40px serif'; c.textAlign = 'center';
        s.cars.forEach(cr => { c.fillStyle = ['#ff4081','#ffd24d','#4dd6ff','#ff6e4d'][(cr.y/70)%4|0]; c.fillRect(cr.x, cr.y-22, cr.w, 44); c.fillStyle = '#111'; c.fillRect(cr.x+12, cr.y-30, 22, 10); c.fillRect(cr.x+12, cr.y+18, 22, 10); });
        s.logs.forEach(lg => { c.fillStyle = '#7a4a22'; c.fillRect(lg.x, lg.y-14, lg.w, 28); c.fillStyle = '#a06a32'; c.fillRect(lg.x, lg.y-14, lg.w, 8); });
        c.fillText('🐸', s.fx, s.fy + 14);
        U.txt(c, s.sc, W/2, 716, 20, '#fff');
      }
    };
  }
});

ARCADE.add({
  id: 'tron', emoji: '🏍️', name: 'Light Cycles', cat: 'Retro', tags: 'arrows / d-pad',
  desc: 'Race leaving deadly walls behind. Outlast the bot!\nSurvive: time ×10',
  create(env) {
    const C = 20, GX = 24, GY = 36;
    const key2 = (x, y) => x + ',' + y;
    const p = { x: 5, y: 30, d: 'up' }, e = { x: 18, y: 6, d: 'down' };
    const walls = new Set([key2(p.x, p.y), key2(e.x, e.y)]);
    const metas = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
    const opp = { left: 'right', right: 'left', up: 'down', down: 'up' };
    let score = 0;
    const free = (o, d) => { const [dx, dy] = metas[d]; const nx = o.x + dx, ny = o.y + dy; return d !== opp[o.d] && nx >= 0 && ny >= 0 && nx < GX && ny < GY && !walls.has(key2(nx, ny)); };
    env.needPad(true, false);
    env.key(k => metas[k] && free(p, k) && (p.d = k));
    return {
      update(t, dt) {
        score += dt * 10; env.score(score);
        const [pdx, pdy] = metas[p.d], [edx, edy] = metas[e.d];
        p.x += pdx; p.y += pdy; e.x += edx; e.y += edy;
        const pk = key2(p.x, p.y), ek = key2(e.x, e.y);
        if (pk === ek || walls.has(pk) || walls.has(ek)) return env.over('Crash! ⚡');
        walls.add(pk); walls.add(ek);
        const eOpts = ['up','down','left','right'].filter(d => free(e, d));
        if (!eOpts.length) { score += 50; env.score(score); return env.over('Bot crashed! 🔥 +50'); }
        const room = d => { let n = 0; const [dx, dy] = metas[d]; let x = e.x, y = e.y; while (n < 99) { x += dx; y += dy; if (x < 0 || y < 0 || x >= GX || y >= GY || walls.has(key2(x, y))) break; n++; } return n; };
        if (room(e.d) < 5 || Math.random() < 0.02) {
          e.d = eOpts.sort((a, b) => room(b) - room(a))[0];
        }
      },
      draw(c) {
        U.bg(c, '#060813');
        const arr = Array.from(walls).map(k => k.split(',').map(Number));
        arr.forEach(([x, y]) => { c.fillStyle = '#7c4dff'; c.fillRect(x*C, y*C, C, C); });
        c.fillStyle = '#4dff88'; c.fillRect(p.x*C, p.y*C, C, C);
        c.fillStyle = '#ff4081'; c.fillRect(e.x*C, e.y*C, C, C);
        U.txt(c, score.toFixed(0), W/2, 24, 18, '#fff');
      }
    };
  }
});

ARCADE.add({
  id: 'tank', emoji: '⚙️', name: 'Tank Duel', cat: 'Retro', tags: 'arrows move · space shoot',
  desc: 'Bots hide behind walls. Shell them!\nHits taken: 3 = scrap',
  create(env) {
    const C = 48, GX = 10, GY = 15;
    const wall = [];
    for (let i = 0; i < GY; i++) for (let j = 0; j < GX; j++) if (i === 0 || j === 0 || i === GY-1 || j === GX-1 || (i % 2 === 0 && j % 2 === 0)) wall.push([j, i]);
    const s = { t: { x: 1, y: 1, d: 2, cd: 0 }, e: { x: 8, y: 13, cd: 1.6, d: 1 }, shots: [], hp: 3, sc: 0 };
    const isW = (x, y) => wall.some(([a, b]) => a === x && b === y);
    const dirs = { 1: [0, -1], 2: [0, 1], 3: [-1, 0], 4: [1, 0] };
    const fire = (o, dx, dy, mine) => s.shots.push({ x: o.x + 0.5, y: o.y + 0.5, dx, dy, mine });
    env.needPad(true, true);
    env.key(k => {
      if (s.dead) return;
      const d = { up: 1, down: 2, left: 3, right: 4 }[k];
      if (d) { const [dx, dy] = dirs[d]; s.t.d = d; if (!isW(s.t.x + dx, s.t.y + dy)) { s.t.x += dx; s.t.y += dy; } }
      if (k === 'action' && s.t.cd <= 0) { s.t.cd = 0.45; const [dx, dy] = dirs[s.t.d]; fire(s.t, dx, dy, true); }
    });
    return {
      update(t, dt) {
        s.t.cd -= dt; s.e.cd -= dt;
        for (const sh of s.shots) {
          sh.x += sh.dx * 7.2 * dt; sh.y += sh.dy * 7.2 * dt;
          const gx = Math.floor(sh.x), gy = Math.floor(sh.y);
          if (gx < 0 || gy < 0 || gx >= GX || gy >= GY || isW(gx, gy)) { sh.dead = true; continue; }
          if (sh.mine && Math.hypot(sh.x - s.e.x - 0.5, sh.y - s.e.y - 0.5) < 0.45) { sh.dead = true; env.score(s.sc = s.sc + 100); return env.over('BOT BLASTED 💥 +100'); }
          if (!sh.mine && Math.hypot(sh.x - s.t.x - 0.5, sh.y - s.t.y - 0.5) < 0.45) { sh.dead = true; s.hp--; if (s.hp <= 0) return env.over('Your tank is scrap metal 🔧'); }
        }
        s.shots = s.shots.filter(sh => !sh.dead);
        const dx = s.t.x - s.e.x, dy = s.t.y - s.e.y;
        if (s.e.cd <= 0 && (dx === 0 || dy === 0)) {
          const d = dx > 0 ? 4 : dx < 0 ? 3 : dy > 0 ? 2 : 1;
          const [fx, fy] = dirs[d];
          let cx = s.e.x + 0.5, cy = s.e.y + 0.5, blocked = false;
          for (let i = 0; i < 14; i++) { cx += fx * 0.5; cy += fy * 0.5; if (isW(Math.floor(cx), Math.floor(cy))) { blocked = true; break; } if (Math.floor(cx) === s.t.x && Math.floor(cy) === s.t.y) break; }
          if (!blocked) { fire(s.e, fx, fy, false); s.e.cd = 1.3; } else s.e.cd = 0.5;
        } else if (s.e.cd <= 0.6) {
          const opts = [1, 2, 3, 4].filter(d => { const [fx, fy] = dirs[d]; return !isW(s.e.x + fx, s.e.y + fy); });
          const d = Math.abs(dx) > Math.abs(dy)
            ? (dx > 0 && opts.includes(4) ? 4 : dx < 0 && opts.includes(3) ? 3 : opts[env.iri(opts.length)])
            : (dy > 0 && opts.includes(2) ? 2 : dy < 0 && opts.includes(1) ? 1 : opts[env.iri(opts.length)]);
          const [fx, fy] = dirs[d]; s.e.d = d;
          if (!isW(s.e.x + fx, s.e.y + fy)) { s.e.x += fx; s.e.y += fy; }
          s.e.cd = 0.75;
        }
      },
      draw(c) {
        U.bg(c, '#0d0f1a');
        wall.forEach(([j, i]) => { c.fillStyle = '#3a3f6e'; c.fillRect(j*C, i*C, C-1, C-1); });
        const rot = (o, col, dark) => { c.save(); c.translate(o.x*C + C/2, o.y*C + C/2); c.rotate([0, -Math.PI/2, Math.PI/2, Math.PI, 0][o.d]); c.fillStyle = dark; c.fillRect(C/2-4, -5, C/2, 10); c.fillStyle = col; c.fillRect(-C/2+6, -C/2+6, C-12, C-12); c.restore(); };
        rot(s.t, '#4dff88', '#b9ff6e'); rot(s.e, '#ff4081', '#ff6e4d');
        s.shots.forEach(sh => { c.fillStyle = sh.mine ? '#ffd24d' : '#ff6e4d'; c.beginPath(); c.arc(sh.x*C, sh.y*C, 5, 0, 7); c.fill(); });
        U.txt(c, '🛡'.repeat(s.hp) + '  ' + s.sc, 12, 26, 16, '#fff', 'left');
      }
    };
  }
});

ARCADE.add({
  id: 'muncher', emoji: '🟡', name: 'Muncher Maze', cat: 'Retro', tags: 'arrows / d-pad',
  desc: 'Clear every dot. The ghosts hunt you down.\n1 per dot · 50 clear bonus',
  create(env) {
    const map = [
      '####################',
      '#........##........#',
      '####.###.##.###.####',
      '#..................#',
      '#.##.#.######.#.##.#',
      '#....#...##...#....#',
      '####.###.##.###.####',
      '#......#....#......#',
      '#.####.####.#.####.#',
      '#.#..............#.#',
      '#.#.###.####.###.#.#',
      '#...#.......#...#.#.',
      '#.###.##..##.###.#.#',
      '#.....#....#.....#.#',
      '#.#####....#####.#.#',
      '#.......T..........#',
      '#........#.........#',
      '####################'];
    const C = 27, CW = 20, CH = 18;
    const dots = new Set(), walls = new Set();
    const P = { x: 10, y: 15, d: [0, 0], q: null, mp: 0 };
    const G = [{ x: 3, y: 8, mp: 0 }, { x: 16, y: 8, mp: 0 }, { x: 9, y: 3, mp: 0 }];
    map.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') walls.add(x + ',' + y); else if (ch === '.') dots.add(x + ',' + y); }));
    const free = (x, y) => x >= 0 && y >= 0 && x < CW && y < CH && !walls.has(x + ',' + y);
    let eaten = 0;
    env.needPad(true, true);
    env.key(k => { const d = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[k]; if (d) P.q = d; });
    return {
      update(t, dt) {
        P.mp += dt;
        if (P.mp > 0.13) {
          P.mp = 0;
          if (P.q && free(P.x + P.q[0], P.y + P.q[1])) { P.d = P.q; P.q = null; }
          if (free(P.x + P.d[0], P.y + P.d[1])) {
            P.x += P.d[0]; P.y += P.d[1];
            const k = P.x + ',' + P.y;
            if (dots.has(k)) { dots.delete(k); eaten++; env.score(eaten); }
          }
        }
        G.forEach((g, gi) => {
          g.mp += dt;
          if (g.mp > 0.17 + gi * 0.02) {
            g.mp = 0;
            const opts = [[1,0],[-1,0],[0,1],[0,-1]].filter(([dx, dy]) => free(g.x + dx, g.y + dy));
            opts.sort((a, b) => (Math.abs(a[0]+g.x-P.x) + Math.abs(a[1]+g.y-P.y)) - (Math.abs(b[0]+g.x-P.x) + Math.abs(b[1]+g.y-P.y)));
            const pick = (Math.random() < 0.25 && opts.length > 1) ? opts[env.iri(opts.length)] : opts[0];
            if (pick) { g.x += pick[0]; g.y += pick[1]; }
          }
        });
        if (!dots.size) { env.score(eaten + 50); return env.over('MAZE CLEARED! 🎉 +50'); }
        if (G.some(g => g.x === P.x && g.y === P.y)) return env.over('Tagged by a ghost 👻');
      },
      draw(c) {
        U.bg(c, '#05060e');
        walls.forEach(k => { const [x, y] = k.split(',').map(Number); c.fillStyle = '#28306e'; c.fillRect(x*C, y*C, C-1, C-1); });
        dots.forEach(k => { const [x, y] = k.split(',').map(Number); c.fillStyle = '#ffd24d'; c.fillRect(x*C+10, y*C+10, 6, 6); });
        c.fillStyle = '#ffd24d'; c.beginPath(); c.arc(P.x*C+13, P.y*C+13, 10, 0.5, 5.7); c.lineTo(P.x*C+13, P.y*C+13); c.fill();
        G.forEach((g, i) => { c.fillStyle = ['#ff4081','#4dd6ff','#ff6e4d'][i]; c.beginPath(); c.arc(g.x*C+13, g.y*C+11, 9, Math.PI, 0); c.lineTo(g.x*C+22, g.y*C+20); c.lineTo(g.x*C+13, g.y*C+16); c.lineTo(g.x*C+4, g.y*C+20); c.closePath(); c.fill(); });
        U.txt(c, dots.size + ' dots left · ' + eaten, 12, 20, 14, '#fff', 'left');
      }
    };
  }
});

ARCADE.add({
  id: 'caveflyer', emoji: '🕳️', name: 'Cave Flyer', cat: 'Retro', tags: 'hold ↑ / TAP to rise',
  desc: 'Hold to rise, release to dive. Thread every gap!',
  create(env) {
    const s = { y: H/2, vy: 0, gap: 220, sc: 0, obs: [],	push: () => {} };
    const spawn = x => s.obs.push({ x, top: env.rand(H - s.gap - 160) + 80, scored: false });
    [0, 1, 2].forEach(i => spawn(W + i * 180));
    env.needPad(false, true);
    return {
      update(t, dt) {
        s.vy += (env.keys.has('action') || env.keys.has('up') ? -520 : 500) * dt;
        s.y += s.vy * dt;
        if (s.y < 8 || s.y > H-8) return env.over('Hit the cave wall 🪨');
        s.obs.forEach(o => o.x -= 165*dt);
        if (s.obs[0].x < -50) { s.obs.shift(); spawn(W + 120); }
        for (const o of s.obs) {
          if (!o.scored && o.x < 96) { o.scored = true; s.sc++; env.score(s.sc); }
          if (80 > o.x && 80 < o.x + 40 && (s.y < o.top || s.y > o.top + s.gap)) return env.over('Crushed on stalactites');
        }
      },
      draw(c) {
        U.bg(c, '#071018');
        s.obs.forEach(o => { c.fillStyle = '#2a6a4a'; c.fillRect(o.x, 0, 40, o.top); c.fillRect(o.x, o.top + s.gap, 40, H); });
        c.save(); c.translate(100, s.y); c.rotate(Math.max(-0.5, Math.min(0.5, s.vy / 500)));
        c.fillStyle = '#ffd24d'; c.beginPath(); c.moveTo(13, 0); c.lineTo(-9, 8); c.lineTo(-9, -8); c.closePath(); c.fill(); c.restore();
        U.txt(c, s.sc, W/2, 42, 32, '#fff');
      }
    };
  }
});
})();
