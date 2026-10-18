(() => {
const U = ARCADE.utils, W = 480, H = 720;

ARCADE.add({
  id: 'snake', emoji: '🐍', name: 'Snake', cat: 'Retro', tags: 'arrows / d-pad',
  desc: 'Eat, grow, survive. Don’t bite yourself!\nScore: fruits eaten',
  create(env) {
    const C = 24, GX = W / C, GY = H / C;
    const s = { body: [{x:10,y:15},{x:9,y:15},{x:8,y:15}], dir:{x:1,y:0}, q:[], food:{x:15,y:10}, t:0, iv:0.12 };
    env.needPad(true, true);
    env.key(k => {
      const d = {left:{x:-1,y:0},right:{x:1,y:0},up:{x:0,y:-1},down:{x:0,y:1}}[k];
      if (d && (d.x !== -s.dir.x || d.y !== -s.dir.y)) s.q.push(d);
    });
    return {
      update(t, dt) {
        while (s.q.length) { const d = s.q.shift(); if (d.x !== -s.dir.x || d.y !== -s.dir.y) s.dir = d; }
        s.t += dt;
        if (s.t < s.iv) return;
        s.t = 0;
        const h = { x: s.body[0].x + s.dir.x, y: s.body[0].y + s.dir.y };
        if (h.x < 0 || h.y < 0 || h.x >= GX || h.y >= GY || s.body.some(b => b.x === h.x && b.y === h.y)) return env.over('Wall or self bite!');
        s.body.unshift(h);
        if (h.x === s.food.x && h.y === s.food.y) {
          env.score(s.body.length - 3);
          do { s.food = { x: env.iri(GX), y: env.iri(GY) }; } while (s.body.some(b => b.x === s.food.x && b.y === s.food.y));
          s.iv = Math.max(0.055, s.iv - 0.002);
        } else s.body.pop();
      },
      draw(c) {
        U.bg(c, '#0a0b14');
        for (let y = 0; y < GY; y++) for (let x = 0; x < GX; x++) if ((x + y) % 2) { c.fillStyle = '#10122a'; c.fillRect(x*C, y*C, C, C); }
        c.font = (C - 4) + 'px serif'; c.textAlign = 'center';
        c.fillText('🍒', s.food.x*C + C/2, s.food.y*C + C - 2);
        s.body.forEach((b, i) => { c.fillStyle = i ? '#38e07b' : '#b9ff6e'; c.fillRect(b.x*C+1, b.y*C+1, C-2, C-2); });
        U.txt(c, 'LEN ' + s.body.length, 12, 24, 16, '#fff', 'left');
      }
    };
  }
});

ARCADE.add({
  id: 'tetris', emoji: '🧱', name: 'Tetris', cat: 'Retro', tags: 'arrows ·⬇ hard drop',
  desc: 'Clear lines before the stack reaches the top.\n100 × lines cleared',
  create(env) {
    const C = 30, GX = 10, GY = 20, OX = 90, OY = 60;
    const shapes = [[[1,1,1,1]], [[1,1],[1,1]], [[0,1,0],[1,1,1]], [[1,0,0],[1,1,1]], [[0,0,1],[1,1,1]], [[1,1,0],[0,1,1]], [[0,1,1],[1,1,0]]];
    const cols = ['#4dd6ff','#ffd24d','#c04dff','#4dff88','#ff6e4d','#4d6eff','#ff4dd2'];
    const grid = Array.from({length: GY}, () => Array(GX).fill(-1));
    const s = { p: null, pi: 0, x: 4, y: 0, t: 0, iv: 0.6, lines: 0 };
    const hit = (px, py, sh) => sh.some((r, ry) => r.some((v, rx) => v && (px+rx < 0 || px+rx >= GX || py+ry >= GY || (py+ry >= 0 && grid[py+ry][px+rx] !== -1))));
    const spawn = () => { s.pi = env.iri(shapes.length); s.p = shapes[s.pi].map(r => [...r]); s.x = 3; s.y = -1; if (hit(s.x, s.y, s.p)) env.over('Stack overflow!'); };
    env.needPad(true, true);
    env.key(k => {
      if (!s.p) return;
      if (k === 'left' && !hit(s.x-1, s.y, s.p)) s.x--;
      if (k === 'right' && !hit(s.x+1, s.y, s.p)) s.x++;
      if (k === 'up') { const r = s.p.map((_, i) => s.p.map(row => row[i]).reverse()); if (!hit(s.x, s.y, r)) s.p = r; }
      if (k === 'down' || k === 'action') { while (!hit(s.x, s.y+1, s.p)) s.y++; lock(); }
    });
    function lock() {
      s.p.forEach((r, ry) => r.forEach((v, rx) => { if (v && s.y+ry >= 0) grid[s.y+ry][s.x+rx] = s.pi; }));
      let lines = 0;
      for (let y = GY-1; y >= 0; y--) if (grid[y].every(v => v !== -1)) { grid.splice(y, 1); grid.unshift(Array(GX).fill(-1)); lines++; y++; }
      s.lines += lines;
      env.score(s.lines * 100);
      s.iv = Math.max(0.1, 0.6 - s.lines * 0.02);
      spawn();
    }
    spawn();
    return {
      update(t, dt) {
        if (!s.p) return;
        s.t += env.keys.has('down') ? dt * 8 : dt;
        if (s.t >= s.iv) { s.t = 0; if (!hit(s.x, s.y+1, s.p)) s.y++; else lock(); }
      },
      draw(c) {
        U.bg(c, '#0a0b14');
        c.strokeStyle = '#1d2040'; c.strokeRect(OX-1, OY-1, GX*C+2, GY*C+2);
        for (let y = 0; y < GY; y++) for (let x = 0; x < GX; x++) if (grid[y][x] !== -1) { c.fillStyle = cols[grid[y][x]]; c.fillRect(OX+x*C, OY+y*C, C-2, C-2); }
        if (s.p) s.p.forEach((r, ry) => r.forEach((v, rx) => { if (v && s.y+ry >= 0) { c.fillStyle = cols[s.pi]; c.fillRect(OX+(s.x+rx)*C, OY+(s.y+ry)*C, C-2, C-2); } }));
        U.txt(c, 'LINES ' + s.lines, 45, OY+20, 15, '#8a8fa8', 'left');
      }
    };
  }
});

ARCADE.add({
  id: 'breakout', emoji: '🧨', name: 'Breakout', cat: 'Retro', tags: 'drag / arrows · tap to launch',
  desc: 'Smash every brick. 3 lives.\n10 per brick + 50 clear bonus',
  create(env) {
    const bw = 44, bh = 20;
    const s = { px: W/2, bx: W/2, by: 650, vx: 180, vy: -240, lives: 3, stuck: true, sc: 0, bricks: [] };
    for (let r = 0; r < 6; r++) for (let i = 0; i < 10; i++) s.bricks.push({ x: 9 + i*(bw+1), y: 90 + r*(bh+6), r, dead: false });
    env.needPad(true, false);
    env.key(k => { if (k === 'left') s.px -= 40; if (k === 'right') s.px += 40; });
    env.drag(x => s.px = x);
    env.tap(() => s.stuck = false);
    return {
      update(t, dt) {
        if (env.keys.has('left')) s.px -= 320 * dt;
        if (env.keys.has('right')) s.px += 320 * dt;
        s.px = Math.max(30, Math.min(W-30, s.px));
        if (s.stuck) { s.bx = s.px; s.by = 650; return; }
        s.bx += s.vx * dt; s.by += s.vy * dt;
        if (s.bx < 8 || s.bx > W-8) { s.vx *= -1; s.bx = Math.max(8, Math.min(W-8, s.bx)); }
        if (s.by < 8) s.vy = Math.abs(s.vy);
        if (s.by > 700) {
          s.lives--;
          if (s.lives <= 0) return env.over('All lives lost');
          s.stuck = true; s.by = 650; s.vx = 180 * (s.vx > 0 ? 1 : -1); s.vy = -240;
        }
        if (s.by > 650 && s.by < 676 && Math.abs(s.bx - s.px) < 42 && s.vy > 0) {
          s.vy = -Math.abs(s.vy) * 1.02; s.vx += (s.bx - s.px) * 6;
        }
        for (const b of s.bricks) {
          if (b.dead) continue;
          if (s.bx > b.x-4 && s.bx < b.x+bw+4 && s.by > b.y-4 && s.by < b.y+bh+4) {
            b.dead = true; s.sc += 10; env.score(s.sc);
            if (s.bx < b.x || s.bx > b.x + bw) s.vx *= -1; else s.vy *= -1;
            break;
          }
        }
        if (s.bricks.every(b => b.dead)) { s.stuck = true; s.sc += 50; env.score(s.sc); return env.over('CLEARED! 💥 +50'); }
      },
      draw(c) {
        U.bg(c, '#0a0b14');
        s.bricks.forEach(b => { if (!b.dead) { c.fillStyle = ['#ff4081','#ff80ab','#7c4dff','#b388ff','#4dd6ff','#4dff88'][b.r]; c.fillRect(b.x, b.y, bw, bh); } });
        c.fillStyle = '#fff'; c.fillRect(s.px-42, 655, 84, 10);
        c.beginPath(); c.arc(s.bx, s.by, 7, 0, 7); c.fillStyle = '#ffd24d'; c.fill();
        U.txt(c, '♥'.repeat(Math.max(0, s.lives)) + '  ' + s.sc, 12, 30, 18, '#fff', 'left');
      }
    };
  }
});

ARCADE.add({
  id: 'asteroids', emoji: '☄️', name: 'Asteroids', cat: 'Retro', tags: '←→ turn · ↑ thrust · space shoot',
  desc: 'Thrust, turn, shoot. Screen wraps around.\n10 points per split',
  create(env) {
    const s = { x: W/2, y: H/2, a: -Math.PI/2, vx: 0, vy: 0, inv: 2, rocks: [], shots: [], cd: 0, wait: 0, sc: 0, lives: 3 };
    let sc = 0;
    const mk = (x, y, sz) => ({ x, y, sz, r: [0, 12, 26, 44][sz], a: env.rand(7), vx: (env.rand(2)-1)*70*(4-sz)/2, vy: (env.rand(2)-1)*70*(4-sz)/2, rot: env.rand(3)-1.5 });
    for (let i = 0; i < 4; i++) { let x, y; do { x = env.rand(W); y = env.rand(H); } while (Math.hypot(x-W/2, y-H/2) < 130); s.rocks.push(mk(x, y, 3)); }
    env.needPad(true, true);
    env.key(k => {
      if (k === 'action' && s.cd <= 0 && !s.dead) {
        s.shots.push({ x: s.x + Math.cos(s.a)*14, y: s.y + Math.sin(s.a)*14, vx: s.vx + Math.cos(s.a)*480, vy: s.vy + Math.sin(s.a)*480, life: 1.1 });
        s.cd = 0.25;
      }
    });
    return {
      update(t, dt) {
        if (s.dead) {
          s.wait += dt;
          if (s.wait > 1.2) { s.wait = 0; s.dead = false; s.x = W/2; s.y = H/2; s.vx = s.vy = 0; s.inv = 2.5; }
          return;
        }
        s.cd -= dt; s.inv -= dt;
        if (env.keys.has('left')) s.a -= 4.2 * dt;
        if (env.keys.has('right')) s.a += 4.2 * dt;
        if (env.keys.has('up')) { s.vx += Math.cos(s.a) * 230 * dt; s.vy += Math.sin(s.a) * 230 * dt; }
        s.vx *= 1 - 0.35*dt; s.vy *= 1 - 0.35*dt;
        s.x = (s.x + s.vx*dt + W) % W; s.y = (s.y + s.vy*dt + H) % H;
        for (const sh of s.shots) { sh.x += sh.vx*dt; sh.y += sh.vy*dt; sh.life -= dt; }
        s.shots = s.shots.filter(sh => sh.life > 0);
        for (let i = s.rocks.length-1; i >= 0; i--) {
          const r = s.rocks[i];
          r.x = (r.x + r.vx*dt + W) % W; r.y = (r.y + r.vy*dt + H) % H; r.a += r.rot*dt;
          const si = s.shots.findIndex(sh => Math.hypot(sh.x-r.x, sh.y-r.y) < r.r);
          if (si >= 0) {
            s.shots.splice(si, 1); s.rocks.splice(i, 1);
            sc += (4 - r.sz) * 10; env.score(sc);
            if (r.sz > 1) { s.rocks.push(mk(r.x, r.y, r.sz-1), mk(r.x, r.y, r.sz-1)); }
            continue;
          }
          if (s.inv <= 0 && Math.hypot(s.x-r.x, s.y-r.y) < r.r + 10) {
            s.dead = true; s.lives--;
            if (s.lives <= 0) return env.over('Ship destroyed');
          }
        }
        if (!s.rocks.length && !s.dead) return env.over('SECTOR CLEAR!\nWait… that’s it? 🎉');
      },
      draw(c) {
        U.bg(c, '#05060e');
        c.strokeStyle = '#e8eaf6'; c.lineWidth = 2;
        if (!s.dead) {
          c.save(); c.translate(s.x, s.y); c.rotate(s.a);
          c.beginPath(); c.moveTo(15, 0); c.lineTo(-11, 9); c.lineTo(-6, 0); c.lineTo(-11, -9); c.closePath();
          if (s.inv <= 0) { c.fillStyle = '#101425'; c.fill(); c.stroke(); }
          if (env.keys.has('up')) { c.fillStyle = '#ff80ab'; c.fillRect(-15, -3, 7, 6); }
          c.restore();
        }
        s.rocks.forEach(r => { c.save(); c.translate(r.x, r.y); c.rotate(r.a); c.strokeStyle = '#8a8fa8'; c.beginPath();
          for (let i = 0; i <= 9; i++) { const a = i/9*Math.PI*2, rr = r.r * (0.75 + 0.25*Math.sin(i*2.7 + r.sz*3)); i ? c.lineTo(Math.cos(a)*rr, Math.sin(a)*rr) : c.moveTo(Math.cos(a)*rr, Math.sin(a)*rr); }
          c.stroke(); c.restore(); });
        s.shots.forEach(sh => { c.fillStyle = '#b9ff6e'; c.fillRect(sh.x-2, sh.y-2, 4, 4); });
        U.txt(c, '♥'.repeat(s.lives) + '   ' + sc, 12, 28, 17, '#fff', 'left');
      }
    };
  }
});

ARCADE.add({
  id: 'missiles', emoji: '🚀', name: 'Missile Dodge', cat: 'Retro', tags: 'arrows / drag',
  desc: 'Homing rockets rain from above. Survive!\nScore: time × 10',
  create(env) {
    const s = { x: W/2, t: 0, fire: 0.6, m: [], sc: 0 };
    env.needPad(true, false);
    env.drag(x => s.x = x);
    return {
      update(t, dt) {
        if (env.keys.has('left')) s.x -= 300*dt;
        if (env.keys.has('right')) s.x += 300*dt;
        s.x = Math.max(16, Math.min(W-16, s.x));
        s.t += dt; s.fire -= dt; s.sc += dt * 10; env.score(s.sc);
        if (s.fire <= 0) {
          s.fire = Math.max(0.09, 0.55 - s.t * 0.012);
          const tx = env.rand(W), sp = 170 + s.t*4;
          s.m.push({ x: tx, y: -20, vy: sp, vx: (s.x - tx) * sp / H });
        }
        for (let i = s.m.length-1; i >= 0; i--) {
          const m = s.m[i]; m.x += m.vx*dt; m.y += m.vy*dt;
          if (m.y > H+30) { s.m.splice(i, 1); continue; }
          if (Math.hypot(m.x-s.x, m.y-688) < 20) return env.over('BOOM! 💥');
        }
      },
      draw(c) {
        U.bg(c, '#05060e');
        c.save(); c.translate(s.x, 688);
        c.fillStyle = '#4dd6ff'; c.beginPath(); c.moveTo(0, -16); c.lineTo(13, 10); c.lineTo(-13, 10); c.closePath(); c.fill();
        c.restore();
        s.m.forEach(m => { c.save(); c.translate(m.x, m.y); c.rotate(Math.atan2(m.vy, m.vx));
          c.fillStyle = '#ff6e4d'; c.fillRect(-14, -3, 26, 6); c.fillStyle = '#ffd24d'; c.fillRect(12, -2, 5, 4); c.restore(); });
        U.txt(c, s.sc.toFixed(0), W/2, 42, 34, '#fff');
      }
    };
  }
});

ARCADE.add({
  id: 'lander', emoji: '🌙', name: 'Lunar Lander', cat: 'Retro', tags: '↑ thrust · ←→ steer',
  desc: 'Touch down GENTLY (speed ≤ 30) on the glowing pad.\nScore: 100 + fuel bonus',
  create(env) {
    let x = 60, y = 50, vx = 30, vy = 0, fuel = 100, done = false;
    const pts = []; for (let i = 0; i <= 12; i++) pts.push({ x: i*40, y: (i === 5 || i === 6) ? 640 : 560 + env.rand(120) });
    const ground = gx => { const i = Math.max(0, Math.min(11, Math.floor(gx / 40))), f = (gx - i*40) / 40; return pts[i].y + (pts[i+1].y - pts[i].y) * f; };
    env.needPad(true, true);
    return {
      update(t, dt) {
        if (done) return;
        if (env.keys.has('up') && fuel > 0) { vy -= 170*dt; fuel = Math.max(0, fuel - 22*dt); }
        if (env.keys.has('left') && fuel > 0) { vx -= 110*dt; fuel = Math.max(0, fuel - 9*dt); }
        if (env.keys.has('right') && fuel > 0) { vx += 110*dt; fuel = Math.max(0, fuel - 9*dt); }
        vy += 55*dt; x += vx*dt; y += vy*dt;
        if (x < 12 || x > W-12) { done = true; return env.over('Drifted out of range!'); }
        if (y + 8 >= ground(x)) {
          done = true;
          if (x > 205 && x < 279 && vy <= 32 && Math.abs(vx) <= 26) {
            env.score(Math.round(100 + fuel));
            return env.over('THE EAGLE HAS LANDED! 🦅\nSpeed ' + Math.round(vy) + ' · Fuel +' + Math.round(fuel));
          }
          return env.over(vy > 32 ? 'Too fast on touchdown (' + Math.round(vy) + ')' : 'Not the landing pad! 🪨');
        }
      },
      draw(c) {
        U.bg(c, '#05060e');
        c.beginPath(); c.moveTo(0, pts[0].y); pts.forEach(p => c.lineTo(p.x, p.y)); c.lineTo(W, H); c.lineTo(0, H); c.closePath();
        c.fillStyle = '#26294a'; c.fill();
        c.fillStyle = '#4dff88'; c.fillRect(205, 634, 74, 5);
        if (!done) {
          c.save(); c.translate(x, y);
          if (env.keys.has('up') && fuel > 0) { c.fillStyle = '#ff80ab'; c.beginPath(); c.moveTo(-4, 12); c.lineTo(4, 12); c.lineTo(0, 24); c.closePath(); c.fill(); }
          c.fillStyle = '#e8eaf6'; c.beginPath(); c.moveTo(0, -13); c.lineTo(11, 8); c.lineTo(-11, 8); c.closePath(); c.fill();
          c.restore();
        }
        U.txt(c, 'FUEL', 12, 24, 13, '#8a8fa8', 'left');
        c.fillStyle = fuel > 30 ? '#4dff88' : '#ff6e4d'; c.fillRect(58, 14, fuel*1.3, 12);
        c.fillStyle = '#fff'; c.font = '15px monospace'; c.textAlign = 'left';
        c.fillText('SPD ' + Math.round(Math.hypot(vx, vy)), 12, 46);
      }
    };
  }
});
})();
