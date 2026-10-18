(() => {
const U = ARCADE.utils, W = 480, H = 720;

ARCADE.add({
  id: 'idle', emoji: '🪙', name: 'Idle Tap Tycoon', cat: 'Idle', tags: 'tap coin · buy boosts',
  desc: 'Tap the coin, buy workers who tap for you!\nScore: total coins',
  create(env) {
    const s = { coins: 0, total: 0, click: 1, auto: [0,0,0], fx: [], cost: [20, 90] };
    env.needPad(false, false);
    env.tap((x, y) => {
      if (y < 560) { s.coins += s.click; s.total += s.click; s.fx.push({ x, y, v: s.click, life: 0.8 }); env.score(Math.floor(s.total)); return; }
      if (y > 580 && y < 660) {
        const i = x < W/2 ? 0 : 1;
        const price = Math.round(s.cost[i] * Math.pow(2.4, s.auto[i]));
        if (s.coins >= price) {
          s.coins -= price;
          s.auto[i]++;
          if (i === 0) s.click++;
        }
      }
    });
    return {
      update(t, dt) {
        const income = s.auto[1]*0.9 + s.auto[0]*0.15;
        s.coins += income*dt; s.total += income*dt;
        env.score(Math.floor(s.total));
        s.fx.forEach(f => f.life -= dt, );
        s.fx = s.fx.filter(f => f.life > 0);
      },
      draw(c) {
        U.bg(c, '#0a0914');
        c.fillStyle = '#ffd24d'; c.beginPath(); c.arc(W/2, 280, 92 + Math.sin(Date.now()/300)*2, 0, 7); c.fill();
        U.txt(c, '🪙', W/2, 305, 100);
        s.fx.forEach(f => U.txt(c, '+' + f.v, f.x, f.y - (0.8-f.life)*70, 24, '#4dff88'));
        U.txt(c, Math.floor(s.coins), W/2, 120, 44, '#fff');
        [[0,'adder +' + s.click, 30], [1, 'helper ' + s.auto[1] + ' (+0.9/s)', 250]].forEach(c2 => {});
        for (let i = 0; i < 2; i++) {
          const X = 30 + i*250, price = Math.round(s.cost[i] * Math.pow(2.4, s.auto[i]));
          c.fillStyle = s.coins >= price ? '#4dff88' : '#3a2040'; c.fillRect(X, 580, 200, 80);
          U.txt(c, ['TAPPER', 'HELPER'][i] + ' ' + s.auto[i], X+100, 610, 20, '#111');
          U.txt(c, price + '🪙', X+100, 645, 22, '#111');
        }
      }
    };
  }
});

ARCADE.add({
  id: 'stack', emoji: '🏗️', name: 'Stack Tower', cat: 'Skill', tags: 'tap to drop block',
  desc: 'Perfect drops grow the block back. Miss = shrink!',
  create(env) {
    const s = { blocks: [], cur: { x: 0, y: 620, w: 150, v: 340 }, dir: 1, sc: 0, won: false };
    env.needPad(false, true);
    env.tap(() => {
      if (!s.cur) return;
      const top = s.blocks.length ? s.blocks[s.blocks.length-1] : { x: W/2-90, w: 180 };
      const overlap = Math.min(s.cur.x + s.cur.w, top.x + top.w) - Math.max(s.cur.x, top.x);
      if (overlap <= 0) { s.over = true; env.score(s.sc*3); return env.over('TOWER TOPPLED 🏗️ height ' + s.sc); }
      const perfect = Math.abs(overlap - top.w) < 4;
      s.blocks.push({ x: Math.max(s.cur.x, top.x), y: s.cur.y, w: overlap });
      s.sc++;
      s.cur = { x: env.iri(2) ? 0 : W - s.blocks[s.blocks.length-1].w, y: s.cur.y - 38, w: perfect ? Math.min(220, overlap + 12) : overlap, v: 340 + s.sc*8 };
      s.dir = env.iri(2);
      s.cur.x = s.dir ? 0 : W - Math.max(30, s.cur.w);
      s.cur.w = Math.max(30, s.cur.w);
      s.sc = s.sc;
      env.score(s.sc*3);
      s.blocks.forEach(b => b.y += 38);
      if (s.blocks[0]) {}
      s.cur.y = 640;
    });
    return {
      update(t, dt) {
        if (!s.cur) return;
        s.cur.x += s.dir*s.cur.v*dt;
        if (s.cur.x < 0 || s.cur.x + s.cur.w > W) { s.dir *= -1; s.cur.x = Math.max(0, Math.min(W - s.cur.w, s.cur.x)); }
        if (s.sc >= 40 && !s.won) { s.won = true; env.score(s.sc*3 + 100); env.over('SKYSCRAPER! 🏙️ +100'); }
      },
      draw(c) {
        U.bg(c, '#0a0b16');
        s.blocks.forEach((b, i) => {
          c.fillStyle = ['#7c4dff','#4dd6ff','#4dff88','#ffd24d','#ff4081'][i%5];
          c.fillRect(b.x, b.y, b.w, 34);
        });
        if (s.cur) { c.fillStyle = '#ffffffbb'; c.fillRect(s.cur.x, s.cur.y, s.cur.w, 34); }
        U.txt(c, 'FLOORS ' + s.sc, W/2, 50, 30, '#fff');
      }
    };
  }
});

ARCADE.add({
  id: 'fruit', emoji: '🍉', name: 'Fruit Frenzy', cat: 'Skill', tags: 'swipe through fruit',
  desc: 'Swipe-slice falling fruits. Bombs = boom over.',
  create(env) {
    const s = { items: [], sc: 0, spawn: 0.4, trail: [] };
    env.needPad(false, false);
    env.tap((x, y) => { s.trail.push({ x, y }); });
    env.drag((x, y) => { s.trail.push({ x, y }); });
    env.release(() => { s.trail = []; });
    return {
      update(t, dt) {
        s.spawn -= dt;
        if (s.spawn <= 0) {
          s.spawn = 0.8 - Math.min(0.4, s.sc/120);
          const bomb = Math.random() < 0.14;
          s.items.push({ x: 40 + env.rand(W-80), y: -40, vy: 220 + env.rand(160), kind: bomb ? 1 : 0, e: env.choice(['🍎','🍌','🍉','🍇','🍓','🥝']) });
        }
        for (let i = s.items.length-1; i >= 0; i--) {
          const it = s.items[i];
          it.y += it.vy*dt;
          if (it.y > 740) { s.items.splice(i, 1); if (it.kind === 0) { s.miss++; } continue; }
          for (const tr of s.trail) {
            if (Math.hypot(tr.x - it.x, tr.y - it.y) < 40) {
              if (it.kind === 1) { return env.over('BOOM 💥 score ' + s.sc); }
              s.sc += 5; env.score(s.sc);
              s.items.splice(i, 1);
              break;
            }
          }
        }
      },
      draw(c) {
        U.bg(c, '#0a0b14');
        c.font = '44px serif'; c.textAlign = 'center';
        s.items.forEach(it => c.fillText(it.kind ? '💣' : it.e, it.x, it.y));
        c.strokeStyle = '#ffd24d88'; c.lineWidth = 5;
        for (let i = 1; i < s.trail.length; i++) {
          c.beginPath(); c.moveTo(s.trail[i-1].x, s.trail[i-1].y); c.lineTo(s.trail[i].x, s.trail[i].y); c.stroke();
        }
        U.txt(c, s.sc, W/2, 50, 30, '#fff');
      }
    };
  }
});

ARCADE.add({
  id: 'cascade', emoji: '🧼', name: 'Color Cascade', cat: 'Skill', tags: 'swap neighbors',
  desc: 'Match 3+ colors by swapping neighbors. Chain big combos!',
  create(env) {
    const cols = ['#ff4081','#4dd6ff','#4dff88','#ffd24d','#c04dff'];
    const s = { g: Array.from({length: 7}, () => Array.from({length: 8}, () => env.iri(5))), sel: null, sc: 0 };
    const matches = (g, fx, fy) => {
      const hit = [];
      for (let y = 0; y < 7; y++) for (let x = 0; x < 8; x++) {
        const v0 = g[y][x];
        if (x < 6 && g[y][x+1] === v0 && g[y][x+2] === v0) hit.push([y, x], [y, x+1], [y, x+2]);
        if (y < 5 && g[y+1] && g[y+1][x] === v0 && g[y+2] && g[y+2][x] === v0) hit.push([y, x], [y+1, x], [y+2, x]);
      }
      return hit;
    };
    env.needPad(false, false);
    env.tap((x, y) => {
      const col = Math.floor((x - 30)/52), row = Math.floor((y - 160)/70);
      if (col < 0 || col > 7 || row < 0 || row > 6) return;
      if (!s.sel) { s.sel = { row, col }; return; }
      const dr = Math.abs(s.sel.row - row), dc = Math.abs(s.sel.col - col);
      const ok = dr + dc === 1;
      if (!ok) { s.sel = { row, col }; return; }
      const t = s.g[s.sel.row][s.sel.col];
      s.g[s.sel.row][s.sel.col] = s.g[row][col];
      s.g[row][col] = t;
      const hit = matches(s.g, row, col);
      if (!hit.length) {
        const t2 = s.g[s.sel.row][s.sel.col];
        s.g[s.sel.row][s.sel.col] = s.g[row][col];
        s.g[row][col] = t2;
      } else {
        let clear = hit, combo = 1;
        while (clear.length) {
          clear.forEach(([y2, x2]) => s.g[y2][x2] = -1);
          s.sc += clear.length * 4 * combo; env.score(s.sc);
          combo++;
          for (let yy = 0; yy < 7; yy++) for (let xx = 0; xx < 8; xx++) if (s.g[yy][xx] < 0) s.g[yy][xx] = env.iri(5);
          clear = matches(s.g, 0, 0);
        }
      }
      s.sel = null;
    });
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#0a0b14');
        s.g.forEach((row, y) => row.forEach((v, x) => {
          const X = 30 + x*52, Y = 160 + y*70;
          c.fillStyle = cols[v]; c.fillRect(X+3, Y+3, 46, 64);
          if (s.sel && s.sel.row === y && s.sel.col === x) { c.strokeStyle = '#fff'; c.strokeRect(X, Y, 52, 70); }
        }));
        U.txt(c, '⚡ ' + s.sc, W/2, 60, 30, '#fff');
      }
    };
  }
});

ARCADE.add({
  id: 'orbit', emoji: '🪐', name: 'Orbit Outlaw', cat: 'Skill', tags: 'tap to switch orbit',
  desc: 'Spinning spikes! Hop between orbits to survive.\nSeconds ×10',
  create(env) {
    const s = { a: env.rand(6), r: 100, rv: 2.6, t2: 0, sc: 0, spikes: [0.6, 2.1, 4.2] };
    env.needPad(false, true);
    env.tap(() => { s.r = s.r === 100 ? 190 : 100; });
    env.key(k => { if (k === 'action') s.r = s.r === 100 ? 190 : 100; });
    return {
      update(t, dt) {
        s.a += s.rv*dt; s.rv += 0.02*dt*10;
        s.t2 += dt; s.sc += dt*10; env.score(s.sc);
        const px = W/2 + Math.cos(s.a)*s.r, py = H/2 + Math.sin(s.a)*s.r;
        for (const rr of [100, 190]) {
          for (const sa of s.spikes) {
            const sx = W/2 + Math.cos(sa)*rr, sy = H/2 + Math.sin(sa)*rr;
            if (s.r === rr && Math.hypot(sx - px, sy - py) < 16) return env.over('Skewered! 💀');
          }
        }
        s.spikes = s.spikes.map(sa => sa + 1.4*dt);
      },
      draw(c) {
        U.bg(c, '#0a0b16');
        c.strokeStyle = '#2a2d52';
        [[100], [190]].forEach(([r]) => { c.beginPath(); c.arc(W/2, H/2, r, 0, 7); c.stroke(); });
        c.fillStyle = '#ffd24d'; c.beginPath(); c.arc(W/2, H/2, 24, 0, 7); c.fill();
        for (const rr of [100, 190]) {
          s.spikes.forEach(sa => {
            c.fillStyle = '#ff4081';
            c.beginPath(); c.arc(W/2 + Math.cos(sa)*rr, H/2 + Math.sin(sa)*rr, 13, 0, 7); c.fill();
          });
        }
        c.fillStyle = '#4dff88'; c.beginPath(); c.arc(W/2 + Math.cos(s.a)*s.r, H/2 + Math.sin(s.a)*s.r, 12, 0, 7); c.fill();
        U.txt(c, s.sc.toFixed(0), W/2, 100, 30, '#fff');
      }
    };
  }
});

ARCADE.add({
  id: 'laser', emoji: '🔴', name: 'Laser Grid', cat: 'Skill', tags: 'tap cells to move',
  desc: 'Lasers fire in waves. Stand in NO laser rows. Tap to move!',
  create(env) {
    const s = { px: 1, py: 2, phase: 0, t: 0, sc: 0, lasers: Array.from({length: 5}, () => ({ row: env.iri(6), t: 0 })) };
    env.needPad(false, false);
    env.tap((x, y) => {
      if (y < 180) return;
      const col = Math.floor((x - 20)/88), row = Math.floor((y - 180)/88);
      if (col < 0 || col > 4 || row < 0 || row > 5) return;
      s.px = col; s.py = row;
      s.sc++; env.score(s.sc);
    });
    env.key(k => {
      if (k === 'left') s.px = Math.max(0, s.px-1);
      if (k === 'right') s.px = Math.min(4, s.px+1);
      if (k === 'up') s.py = Math.max(0, s.py-1);
      if (k === 'down') s.py = Math.min(5, s.py+1);
    });
    env.needPad(true, false);
    return {
      update(t, dt) {
        s.t += dt;
        s.lasers.forEach(L => { L.t += dt; if (L.t > 1.6) { L.t = 0; L.row = env.iri(6); } });
        const hitNow = s.lasers.some(L => L.t > 1.2 && L.row === s.py);
        if (hitNow) { s.pv = (s.pv || 0) + 1; if (s.pv >= 3) { env.score(s.sc); return env.over('Frizzled on a laser 🔴'); } }
      },
      draw(c) {
        U.bg(c, '#0a0b14');
        for (let r = 0; r < 6; r++) for (let col = 0; col < 5; col++) {
          c.fillStyle = '#12142a'; c.fillRect(20 + col*88, 180 + r*88, 84, 84);
        }
        s.lasers.forEach(L => {
          const warm = L.t > 0.9, fire = L.t > 1.2;
          c.fillStyle = fire ? '#ff4081' : warm ? '#ff408166' : '#3a0a1866';
          c.fillRect(20, 180 + L.row*88 + 36, 440, 16);
        });
        c.fillStyle = '#fff'; c.fillRect(20 + s.px*88 + 20, 180 + s.py*88 + 20, 44, 44);
        U.txt(c, '❤'.repeat(3 - Math.max(0, (s.pv || 0))) + '  ' + s.sc, W/2, 80, 24, '#fff');
        U.txt(c, 'DODGE THE LASER ROWS!', W/2, 700, 18, '#8a8fa8');
      }
    };
  }
});

ARCADE.add({
  id: 'pegpop', emoji: '🫧', name: 'Peg Pop', cat: 'Skill', tags: 'tap to aim & shoot',
  desc: 'Pop clusters of bubble colors! Clears score.\nFirst tap aims, second fires',
  create(env) {
    const cols = ['#ff4081','#4dd6ff','#4dff88','#ffd24d'];
    const R = 18, colsTop = 110;
    const rowsCap = 8;
    const s = { grid: Array.from({length: rowsCap}, () => Array.from({length: 10}, () => (Math.random() < 0.88 ? env.iri(4) : -1))), shooter: W/2, ang: Math.PI, flying: null, sc: 0, shots: 0 };
    const cellXY = (r, c2) => ({ x: 30 + c2*46 + 20 + (r%2 ? 23 : 0), y: colsTop + r*40 + 20 });
    const snapIdx = (x, y) => {
      let best = null, bd = 1e9;
      for (let r = 0; r < rowsCap; r++) for (let c2 = 0; c2 < 10; c2++) {
        const p = cellXY(r, c2), d = Math.hypot(x - p.x, y - p.y);
        if (d < bd) { bd = d; best = [r, c2]; }
      }
      return best;
    };
    const cluster = (r0, c0, col) => {
      const seen = new Set(), q = [[r0, c0]], out = [];
      while (q.length) {
        const [rr, cc] = q.pop(), key = rr + ',' + cc;
        if (seen.has(key) || rr < 0 || rr >= rowsCap || cc < 0 || cc > 9 || s.grid[rr][cc] !== col) continue;
        seen.add(key); out.push([rr, cc]);
        const adj = rr%2 ? [[0,1],[0,-1],[-1,0],[-1,-1],[1,0],[1,-1]] : [[0,1],[0,-1],[-1,0],[-1,1],[1,0],[1,1]];
        adj.forEach(([dr, dc]) => q.push([rr+dr, cc+dc]));
      }
      return out;
    };
    env.needPad(false, false);
    env.tap((x, y) => {
      if (s.flying) return;
      const dx = x - W/2, dy = y - 655;
      if (dy >= -40) return;
      let a = Math.atan2(dy, dx);
      a = Math.max(-Math.PI + 0.22, Math.min(-0.22, a));
      s.flying = { x: W/2, y: 655, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, col: s.shots % 4 };
    });
    return {
      update(t, dt) {
        if (!s.flying) return;
        const b = s.flying;
        b.x += b.vx*dt; b.y += b.vy*dt;
        if (b.x < 28) { b.x = 28; b.vx *= -1; }
        if (b.x > W-28) { b.x = W-28; b.vx *= -1; }
        const hit = [];
        for (let r = 0; r < rowsCap; r++) for (let c2 = 0; c2 < 10; c2++) if (s.grid[r][c2] >= 0) hit.push([r, c2]);
        if (b.y <= colsTop - 10) {
          const [sr, sc2] = snapIdx(b.x, colsTop + 16);
          s.grid[sr][sc2] = b.col;
          const cl = cluster(sr, sc2, b.col);
          if (cl.length >= 3) {
            cl.forEach(([rr, cc]) => s.grid[rr][cc] = -1);
            s.sc += cl.length * 10;
            const seen = new Set();
            const cq = [];
            for (let c3 = 0; c3 < 10; c3++) if (s.grid[0][c3] >= 0) cq.push([0, c3]);
            cq.forEach(p => seen.add(p.join()));
            while (cq.length) {
              const [rr, cc] = cq.pop();
              const adj = rr%2 ? [[0,1],[0,-1],[-1,0],[-1,-1],[1,0],[1,-1]] : [[0,1],[0,-1],[-1,0],[-1,1],[1,0],[1,1]];
              adj.forEach(([dr, dc]) => { const nr = rr+dr, nc = cc+dc; if (nr >= 0 && nr < rowsCap && nc >= 0 && nc < 10 && s.grid[nr][nc] >= 0 && !seen.has(nr + ',' + nc)) { seen.add(nr + ',' + nc); cq.push([nr, nc]); } });
            }
            let dr = 0;
            for (let r4 = 0; r4 < rowsCap; r4++) for (let c4 = 0; c4 < 10; c4++) {
              if (s.grid[r4][c4] >= 0 && !seen.has(r4 + ',' + c4)) { s.grid[r4][c4] = -1; dr++; }
            }
            if (dr) s.sc += dr * 12;
          }
          env.score(s.sc);
          s.flying = null; s.shots++;
          const bottom = s.grid[rowsCap-1].filter(v => v >= 0).length;
          if (bottom >= 9) { env.score(s.sc); return env.over('Bubble mountain spilled 🫧 score ' + s.sc); }
          const total = s.grid.flat().filter(v => v >= 0).length;
          if (!total) { s.sc += 60; env.score(s.sc); return env.over('BOARD CLEARED! 🫧 +60'); }
        }
      },
      draw(c) {
        U.bg(c, '#0a0b18');
        for (let r = 0; r < rowsCap; r++) for (let c2 = 0; c2 < 10; c2++) {
          const v = s.grid[r][c2];
          if (v >= 0) {
            const p = cellXY(r, c2);
            c.fillStyle = cols[v]; c.beginPath(); c.arc(p.x, p.y, R, 0, 7); c.fill();
          }
        }
        c.fillStyle = '#7c4dff'; c.fillRect(W/2-18, 630, 36, 64);
        if (s.flying) { c.fillStyle = cols[s.flying.col]; c.beginPath(); c.arc(s.flying.x, s.flying.y, 19, 0, 7); c.fill(); }
        else { c.fillStyle = cols[s.shots % 4]; c.beginPath(); c.arc(W/2, 655, 20, 0, 7); c.fill(); }
        U.txt(c, 'tap above the cannon to aim-fire · ' + s.sc, W/2, 700, 15, '#8a8fa8');
      }
    };
  }
});

ARCADE.add({
  id: 'balance', emoji: '⚖️', name: 'Balance Beam', cat: 'Skill', tags: 'tap sides to balance',
  desc: 'The pole tips! Tap left/right to stay upright.\nScore: seconds',
  create(env) {
    const s = { tilt: 0, tv: (Math.random() < 0.5 ? -1 : 1) * 6, t: 0, sc: 0, fail: false };
    env.needPad(true, false);
    env.tap(x => { s.tv += (x < W/2 ? -44 : 44); });
    return {
      update(t, dt) {
        if (s.fail) return;
        s.tv += (Math.random() - 0.5) * 36 * dt;
        s.tv = Math.max(-64, Math.min(64, s.tv));
        s.tilt += s.tv * dt;
        if (Math.abs(s.tilt) > 78) {
          s.fail = true; env.score(s.sc);
          return env.over('Toppled after ' + s.sc + 's ⚖️');
        }
        s.t += dt;
        s.sc = +(s.t.toFixed(1));
        env.score(s.sc);
      },
      draw(c) {
        U.bg(c, '#0a0b14');
        c.save(); c.translate(W/2, 500); c.rotate(s.tilt * Math.PI/180);
        c.fillStyle = '#8a5a2e'; c.fillRect(-160, -8, 320, 16);
        c.restore();
        c.font = '54px serif'; c.textAlign = 'center';
        c.fillText('🧱', W/2 - Math.sin(s.tilt*Math.PI/180)*158, 504);
        U.txt(c, s.t.toFixed(1) + 's', W/2, 120, 40, '#fff');
        U.txt(c, 'tap LEFT / RIGHT to correct', W/2, 700, 18, '#8a8fa8');
      }
    };
  }
});

ARCADE.add({
  id: 'popit', emoji: '氣', name: 'Pop It Fever', cat: 'Idle', tags: 'tap bubbles',
  desc: 'Pop every bubble as fast as you can — 5 puzzles win!',
  create(env) {
    const s = { bu: Array.from({length: 80}, () => Math.random() < 0.85), done: 0, sc: 0, tHold: 0, lastPop: 0 };
    env.needPad(false, false);
    env.tap((x, y) => {
      const col = Math.floor((x - 30)/54), row = Math.floor((y - 120)/54);
      if (col < 0 || col > 9 || row < 0 || row > 7) return;
      const i = row*10 + col;
      if (s.bu[i]) {
        s.bu[i] = false; s.done++;
        s.sc = Math.floor(s.done*1.5); env.score(s.sc);
        if (s.done >= 80*1) {
          const timeBonus = Math.max(0, 100 - Math.floor((Date.now() - (s.start || Date.now()))/100));
          s.done = 0;
          s.bu = Array.from({length: 80}, () => Math.random() < 0.85);
          s.sc += 40; env.score(s.sc);
          s.sets = (s.sets || 0) + 1;
          if (s.sets >= 5) { env.score(s.sc + 100); return env.over('ALL POPPED 🫧' + s.sc); }
        }
      } else { s.sc = Math.max(0, s.sc - 2); env.score(s.sc); }
    });
    return {
      update(t, dt) {
        if (!s.start) s.start = Date.now();
      },
      draw(c) {
        U.bg(c, '#0a0b14');
        s.bu.forEach((up, i) => {
          const X = 30 + (i%10)*54, Y = 120 + ((i/10)|0)*54;
          if (!up) return;
          c.fillStyle = (i%2) ? '#c04dff' : '#9e4dff';
          c.beginPath(); c.arc(X+24, Y+24, 20, 0, 7); c.fill();
          c.fillStyle = '#ffffff44'; c.beginPath(); c.arc(X+17, Y+15, 5, 0, 7); c.fill();
        });
        U.txt(c, s.sets ? s.sets + '/5 sets' : 'pop 80!', W/2, 60, 26, '#fff');
      }
    };
  }
});
})();
