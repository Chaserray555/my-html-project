(() => {
const U = ARCADE.utils, W = 480, H = 720;
const PAL = ['#ff4081','#4dd6ff','#4dff88','#ffd24d','#c04dff','#ff6e4d'];

ARCADE.add({
  id: 'mastermind', emoji: '🎨', name: 'Mastermind', cat: 'Brain', tags: 'tap colors',
  desc: 'Crack the 4-color code. ●=right spot ○=right color.\n10 tries',
  create(env) {
    const code = Array.from({length: 4}, () => env.iri(6));
    const s = { code, guess: [], rows: [], round: 0 };
    env.needPad(false, false);
    env.tap((x, y) => {
      if (y > 560 && y < 620) {
        const idx = Math.floor((x - 30) / 56);
        if (idx >= 0 && idx < 6 && s.guess.length < 4) s.guess.push(idx);
        return;
      }
      if (y > 640 && y < 700 && s.guess.length === 4) {
        let black = 0, white = 0;
        const g = s.guess.slice(), c = s.code.slice();
        for (let i = 0; i < 4; i++) if (g[i] === c[i]) { black++; g[i] = c[i] = -9; }
        for (let i = 0; i < 4; i++) if (g[i] > 0) { const j = c.indexOf(g[i]); if (j >= 0) { white++; c[j] = -9; g[i] = -9; } }
        s.rows.push({ g: s.guess.slice(), b: black, w: white });
        s.round++;
        s.guess = [];
        if (black === 4) { env.score(Math.max(10, 70 - (s.round - 1) * 10)); return env.over('CRACKED in ' + s.round + '! 🥳'); }
        env.score(Math.max(0, 70 - (s.round - 1) * 10));
        if (s.round >= 10) return env.over('Out of tries! Code was ' + code.map(i => PAL[i]).join(' '));
      }
    });
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#0a0b14');
        U.txt(c, 'Tries used: ' + s.round + '/10', W/2, 40, 20, '#8a8fa8');
        s.rows.forEach((r, i) => {
          const Y = 60 + i * 46;
          r.g.forEach((ci, j) => { c.fillStyle = PAL[ci]; c.beginPath(); c.arc(60 + j*56, Y, 20, 0, 7); c.fill(); });
          let bx = 300;
          for (let k = 0; k < r.b; k++) { c.fillStyle = '#fff'; c.beginPath(); c.arc(bx, Y, 8, 0, 7); c.fill(); bx += 22; }
          for (let k = 0; k < r.w; k++) { c.fillStyle = '#777'; c.beginPath(); c.arc(bx, Y, 8, 0, 7); c.fill(); bx += 22; }
        });
        s.guess.forEach((ci, j) => { c.fillStyle = PAL[ci]; c.beginPath(); c.arc(60 + j*56, 640, 20, 0, 7); c.fill(); });
        for (let j = s.guess.length; j < 4; j++) { c.strokeStyle = '#2a2d52'; c.beginPath(); c.arc(60 + j*56, 640, 20, 0, 7); c.stroke(); }
        U.txt(c, 'GO!', 380, 675, 30, '#4dff88');
        PAL.forEach((p, i) => { c.fillStyle = p; c.beginPath(); c.arc(58 + i*56, 590, 22, 0, 7); c.fill(); });
      }
    };
  }
});

ARCADE.add({
  id: 'simon', emoji: '🎵', name: 'Simon Says', cat: 'Brain', tags: 'tap pads in order',
  desc: 'Watch the pattern, repeat it. One more pad each round.\n+round×10',
  create(env) {
    const cols = ['#4dff88','#ffd24d','#4dd6ff','#ff4081'];
    const s = { seq: [env.iri(4)], step: 0, phase: 'show', idx: 0, t: 0, lit: -1, round: 0 };
    env.needPad(true, false);
    function padTap(n) {
      if (s.phase !== 'in' || n < 0) return;
      s.lit = n;
      setTimeout(() => { if (s.lit === n) s.lit = -1; }, 180);
      if (n === s.seq[s.step]) {
        s.step++;
        if (s.step === s.seq.length) {
          s.round++;
          env.score(s.round * 10);
          s.phase = 'show'; s.idx = 0; s.step = 0; s.t = 0;
          s.seq.push(env.iri(4));
        }
      } else env.over('Wrong pad! You lost at round ' + (s.round + 1));
    }
    env.tap((x, y) => {
      const n = x < W/2 ? (y < H/2 ? 0 : 2) : (y < H/2 ? 1 : 3);
      if (y < 545) padTap(n);
    });
    env.key(k => { const n = { up: 0, down: 1, left: 2, right: 3 }[k]; if (n !== undefined) padTap(n); });
    return {
      update(t, dt) {
        if (s.phase !== 'show') return;
        s.t += dt;
        const idx = Math.floor(s.t / 0.62);
        if (idx !== s.idx) {
          s.idx = idx;
          if (idx % 2 === 0) s.lit = s.seq[idx / 2];
          else s.lit = -1;
          if (idx / 2 >= s.seq.length) { s.phase = 'in'; s.step = 0; s.lit = -1; }
        }
      },
      draw(c) {
        U.bg(c, '#0a0b14');
        const pads = [[0,0],[W/2,0],[0,H/2],[W/2,H/2]];
        pads.forEach((p, i) => {
          c.fillStyle = (s.lit === i) ? cols[i] : '#12142a';
          c.fillRect(p[0]+8, p[1]+8, W/2-16, H/2-16);
          c.strokeStyle = '#2a2d52'; c.strokeRect(p[0]+8, p[1]+8, W/2-16, H/2-16);
        });
        U.txt(c, 'Round ' + (s.round + 1) + ' · ' + (s.phase === 'show' ? '👀 WATCH' : '🎧 REPEAT on d-pad or taps'), W/2 - 0, 545, 22, '#fff');
      }
    };
  }
});

ARCADE.add({
  id: 'water', emoji: '🧪', name: 'Water Sort', cat: 'Brain', tags: 'tap tube → tap tube',
  desc: 'Sort every color into its own tube.\nWin: 120 - moves',
  create(env) {
    const tokens = [0,0,0,1,1,1,2,2,2].sort(() => Math.random() - 0.5);
    const s = { tubes: [[], [], [], [], []], sel: -1, moves: 0, sc: 0 };
    for (let i = 0; i < 9; i++) s.tubes[i % 3].push(tokens[i]);
    env.needPad(false, false);
    env.tap((x, y) => {
      const i = Math.floor((x - 15) / 90);
      if (i < 0 || i > 4) { s.sel = -1; return; }
      if (s.sel === -1) { if (s.tubes[i].length) s.sel = i; return; }
      if (s.sel === i) { s.sel = -1; return; }
      const a = s.tubes[s.sel], b = s.tubes[i];
      if (a.length && b.length < 4 && (!b.length || b[b.length-1] === a[a.length-1])) {
        const col = a[a.length-1];
        while (a.length && a[a.length-1] === col && b.length < 4) { b.push(a.pop()); }
        s.moves++;
        const done = s.tubes.every(t => t.length === 0 || (t.length === 3 && t.every(v => v === t[0])));
        if (done) { env.score(Math.max(20, 120 - s.moves * 3)); return env.over('SORTED! 🧪✨ ' + s.moves + ' pours'); }
        env.score(Math.max(0, 60 - s.moves * 2));
      }
      s.sel = -1;
    });
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#0a0b14');
        U.txt(c, s.moves + ' pours', W/2, 50, 24, '#8a8fa8');
        s.tubes.forEach((t, i) => {
          const X = 20 + i * 90;
          c.fillStyle = '#181b2e'; c.fillRect(X, 140, 60, 400);
          c.strokeStyle = '#3a3f6e'; c.lineWidth = 3; c.strokeRect(X, 140, 60, 400);
          t.forEach((ci, j) => { c.fillStyle = PAL[ci]; c.fillRect(X + 5, 140 + 400 - 34*(j+1) + 2, 50, 30); });
          if (s.sel === i) { c.strokeStyle = '#ffd24d'; c.strokeRect(X - 3, 137, 66, 406); }
        });
      }
    };
  }
});

ARCADE.add({
  id: 'sokoban', emoji: '📦', name: 'Crate Panic', cat: 'Brain', tags: 'arrows / d-pad',
  desc: 'Push every crate ● onto a target ○.\nWin: 100 - pushes×2',
  create(env) {
    const level = [
      '#########',
      '#p..#...#',
      '#.o.##.o#',
      '#...B.o.#',
      '#.#B..###',
      '#...o.#.#',
      '#B..o...#',
      '#########'];
    const H2 = level.length;
    const s = { p: {x: 1, y: 1}, walls: new Set(), crates: [], targets: [], pushes: 0, sc: 0 };
    level.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch === '#') s.walls.add(x + ',' + y);
      if (ch === 'p') s.p = { x, y };
      if (ch === 'B') s.crates.push({ x, y });
      if (ch === 'o') s.targets.push({ x, y });
    }));
    const wall = (x, y) => s.walls.has(x + ',' + y);
    const crateAt = (x, y) => s.crates.find(c => c.x === x && c.y === y);
    env.needPad(true, false);
    env.key(k => {
      const d = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] }[k];
      if (!d) return;
      const nx = s.p.x + d[0], ny = s.p.y + d[1];
      if (wall(nx, ny)) return;
      const cr = crateAt(nx, ny);
      if (cr) {
        const bx = nx + d[0], by = ny + d[1];
        if (wall(bx, by) || crateAt(bx, by)) return;
        cr.x = bx; cr.y = by; s.pushes++; env.score(Math.max(0, 100 - s.pushes*2));
        if (s.crates.every(c => s.targets.some(t => t.x === c.x && t.y === c.y))) { env.score(Math.max(10, 100 - s.pushes*2)); return env.over('ALL ON TARGET! 📦 +bonus'); }
      }
      s.p = { x: nx, y: ny };
    });
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#0a0b14');
        for (let y = 0; y < H2; y++) for (let x = 0; x < 9; x++) {
          c.fillStyle = wall(x, y) ? '#3a3f6e' : '#12142a';
          c.fillRect(70 + x*38, 130 + y*44, 37, 43);
          if (s.targets.some(t => t.x === x && t.y === y)) { c.strokeStyle = '#ffd24d'; c.beginPath(); c.arc(89 + x*38, 152 + y*44, 12, 0, 7); c.stroke(); }
        }
        s.crates.forEach(cr => { c.fillStyle = '#b9763e'; c.fillRect(70 + cr.x*38 + 4, 130 + cr.y*44 + 4, 29, 35); });
        c.font = '28px serif'; c.textAlign = 'center';
        s.crates.forEach(cr => c.fillText('📦', 89 + cr.x*38, 158 + cr.y*44));
        c.fillStyle = '#4dff88'; c.fillText('🧑', 89 + s.p.x*38, 158 + s.p.y*44);
        U.txt(c, 'pushes: ' + s.pushes, W/2, 80, 20, '#8a8fa8');
      }
    };
  }
});

ARCADE.add({
  id: 'flood', emoji: '🌊', name: 'Flood It', cat: 'Brain', tags: 'tap colors',
  desc: 'Uniform the whole board in ≤ 22 taps.\nScore: moves left × 20',
  create(env) {
    const N = 10, M = 42, OX = 30, OY = 150;
    const s = { g: Array.from({length: N}, () => Array.from({length: N}, () => env.iri(6))), moves: 22 };
    const flood = col => {
      const target = s.g[0][0];
      if (target === col) return false;
      const seen = new Set(), qr = [[0,0]];
      seen.add('0,0');
      while (qr.length) {
        const [x, y] = qr.pop();
        s.g[y][x] = col;
        [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx, dy]) => {
          const nx = x+dx, ny = y+dy;
          if (nx >= 0 && ny >= 0 && nx < N && ny < N && !seen.has(nx + ',' + ny) && s.g[ny][nx] === target) { seen.add(nx + ',' + ny); qr.push([nx, ny]); }
        });
      }
      return true;
    };
    env.needPad(false, false);
    env.tap((x, y) => {
      if (y > 640 && y < 700) {
        const i = Math.floor((x - 30) / 72);
        if (i < 0 || i > 5 || s.moves <= 0) return;
        if (flood(i)) {
          s.moves--;
          const done = s.g.every(row => row.every(v => v === s.g[0][0]));
          if (done) { env.score(s.moves * 20 + 50); return env.over('FLOODED! 🌊 ' + s.moves + ' moves left'); }
          env.score(Math.max(0, (22 - s.moves) * 2));
          if (s.moves <= 0) return env.over('Out of moves — board not uniform');
        }
      }
    });
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#0a0b14');
        U.txt(c, s.moves + ' taps left', W/2, 60, 24, '#8a8fa8');
        s.g.forEach((row, yy) => row.forEach((v, xx) => {
          c.fillStyle = PAL[v]; c.fillRect(OX + xx*M, OY + yy*M, M-2, M-2);
        }));
        PAL.forEach((p, i) => { c.fillStyle = p; c.fillRect(30 + i*72, 640, 60, 60); });
      }
    };
  }
});

ARCADE.add({
  id: 'hanoi', emoji: '🗼', name: 'Tower of Hanoi', cat: 'Brain', tags: 'tap pegs',
  desc: 'Move the 5-disc tower across (small on top!).\nScore: 120 − moves',
  create(env) {
    const s = { pegs: [[5,4,3,2,1], [], []], sel: -1, moves: 0 };
    env.needPad(false, false);
    env.tap((x, y) => {
      const i = Math.min(2, Math.max(0, Math.floor((x - 30) / 140)));
      if (y < 160) return;
      const top = s.pegs[i][s.pegs[i].length-1];
      if (s.sel === -1) { if (s.pegs[i].length) s.sel = i; return; }
      if (s.sel === i) { s.sel = -1; return; }
      if (top === undefined || top > s.pegs[s.sel][s.pegs[s.sel].length-1]) {
        s.pegs[i].push(s.pegs[s.sel].pop());
        s.moves++;
        s.sel = -1;
        if (s.pegs[2].length === 5) { env.score(Math.max(10, 120 - s.moves)); return env.over('TOWER MOVED! 🗼 ' + s.moves + ' moves'); }
        env.score(Math.max(0, 60 - s.moves));
      } else s.sel = -1;
    });
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#0a0b14');
        U.txt(c, s.moves + ' moves', W/2, 50, 22, '#8a8fa8');
        s.pegs.forEach((peg, i) => {
          const X = 100 + i*140;
          c.fillStyle = '#3a3f6e'; c.fillRect(X - 5, 180, 10, 400);
          peg.forEach((d, j) => {
            const w = 30 + (d-1)*24;
            c.fillStyle = PAL[(d-1) % 6];
            c.fillRect(X - w/2, 180 + 400 - 34*(j+1), w, 30);
          });
          if (s.sel === i) { c.strokeStyle = '#ffd24d'; c.lineWidth = 3; c.strokeRect(X - 70, 170, 140, 420); }
        });
      }
    };
  }
});

ARCADE.add({
  id: 'chain9', emoji: '🔗', name: 'Chain Sum 9', cat: 'Brain', tags: 'tap adjacent chain',
  desc: 'Tap adjacent numbers that sum to exactly 9 to clear!\n+9 per clear',
  create(env) {
    const N = 5, M = 88, OX = 20, OY = 160;
    const s = { g: Array.from({length: 5}, () => Array.from({length: 5}, () => 1 + env.iri(9))), chain: [], sc: 0 };
    env.needPad(false, false);
    const gravity = () => {
      for (let x = 0; x < N; x++) {
        const col = [];
        for (let y = 0; y < N; y++) if (s.g[y][x]) col.push(s.g[y][x]);
        while (col.length < N) col.unshift(1 + env.iri(9));
        for (let y = 0; y < N; y++) s.g[y][x] = col[y];
      }
    };
    const anyMove = () => {
      if (s.g.flat().some(v => v === 9)) return true;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        if (x+1 < N && s.g[y][x] + s.g[y][x+1] === 9) return true;
        if (y+1 < N && s.g[y][x] + s.g[y+1][x] === 9) return true;
        if (x+2 < N && s.g[y][x] + s.g[y][x+1] + s.g[y][x+2] === 9) return true;
        if (y+2 < N && s.g[y][x] + s.g[y+1][x] + s.g[y+2][x] === 9) return true;
        if (x+1<N && y+1<N && s.g[y][x] + s.g[y][x+1] + s.g[y+1][x+1] === 9) return true;
        if (x+1<N && y+1<N && s.g[y][x] + s.g[y+1][x] + s.g[y+1][x+1] === 9) return true;
      }
      return false;
    };
    env.tap((x, y) => {
      const xp = Math.floor((x-OX)/M), yp = Math.floor((y-OY)/M);
      if (xp < 0 || xp >= N || yp < 0 || yp >= N) return;
      const last = s.chain[s.chain.length-1];
      if (s.chain.includes(yp*N + xp)) { s.chain = [yp*N + xp]; return; }
      const adj = last === undefined ? false : Math.abs(Math.floor(last/N) - yp) + Math.abs(last % N - xp) === 1;
      if (s.chain.length && !adj) { s.chain = [yp*N + xp]; return; }
      s.chain.push(yp*N + xp);
      const total = s.chain.reduce((a, i) => a + s.g[(i/N)|0][i%N], 0);
      if (total > 9) { s.chain = [yp*N + xp]; }
      if (total === 9) {
        s.chain.forEach(i => s.g[(i/N)|0][i%N] = 0);
        s.sc += 9; env.score(s.sc);
        s.chain = [];
        gravity();
        if (!anyMove()) { env.score(s.sc); return env.over('Grid locked at ' + s.sc); }
      }
    });
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#0a0b14');
        const total = s.chain.reduce((a, i) => a + s.g[(i/N)|0][i%N], 0);
        U.txt(c, 'SUM ' + (total || 0) + '/9', W/2, 70, 28, total > 6 ? '#ff4081' : '#4dff88');
        s.g.forEach((row, yy) => row.forEach((v, xx) => {
          const X = OX + xx*M, Y = OY + yy*M;
          c.fillStyle = s.chain.includes(yy*N+xx) ? '#4dd6ff' : '#1d2040'; c.fillRect(X+3, Y+3, M-6, M-6);
          if (v) U.txt(c, v, X+M/2, Y+M/2+12, 32, '#fff');
        }));
      }
    };
  }
});

ARCADE.add({
  id: 'fleet', emoji: '🚢', name: 'Fleet Hunt', cat: 'Brain', tags: 'tap sea · sonar hints',
  desc: 'Sink the hidden 10-ship-cell fleet using edges & sonar!\nWin with fewest taps',
  create(env) {
    const N = 8, M = 44, OX = 66, OY = 130;
    const ships = [];
    const sizes = [4, 3, 2];
    sizes.forEach(L => {
      let ok = false;
      while (!ok) {
        const horiz = Math.random() < 0.5;
        const x = env.iri(N - (horiz ? L : 0)), y = env.iri(N - (horiz ? 0 : L));
        const cells = [];
        for (let i = 0; i < L; i++) cells.push(horiz ? [x+i, y] : [x, y+i]);
        if (!ships.some(sh => sh.some(([sx, sy]) => cells.some(([cx, cy]) => Math.abs(sx-cx) <= 1 && Math.abs(sy-cy) <= 1)))) { ships.push(cells); ok = true; }
      }
    });
    const s = { shots: new Set(), taps: 0, sunk: 0, all: ships.flat() };
    env.needPad(false, false);
    env.tap((x, y) => {
      const xp = Math.floor((x-OX)/M), yp = Math.floor((y-OY)/M);
      if (xp < 0 || xp >= N || yp < 0 || yp >= N) return;
      if (s.shots.has(xp + ',' + yp)) return;
      s.shots.add(xp + ',' + yp); s.taps++;
      if (s.all.some(([cx, cy]) => cx === xp && cy === yp)) {
        const rem = s.all.filter(([cx, cy]) => !s.shots.has(cx + ',' + cy)).length;
        env.score(s.sunk * 30 + (10 - rem) * 8);
        if (rem === 0) {
          s.sunk = 3;
          env.score(200 - s.taps * 2);
          return env.over('FLEET SUNK! 🚢💥 ' + s.taps + ' shots');
        }
      } else {
        const near = s.all.filter(([cx, cy]) => Math.abs(cx - xp) + Math.abs(cy - yp) <= 1).length;
        s.sonar = near;
      }
      env.score(s.sunk * 30);
    });
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#0a0b14');
        const rowCnt = [], colCnt = [];
        for (let r = 0; r < N; r++) rowCnt.push(s.all.filter(([, cy]) => cy === r).length);
        for (let c = 0; c < N; c++) colCnt.push(s.all.filter(([cx]) => cx === c).length);
        for (let r = 0; r < N; r++) U.txt(c, rowCnt[r], OX - 20, OY + r*M + M/2 + 7, 17, '#8a8fa8');
        for (let k = 0; k < N; k++) U.txt(c, colCnt[k], OX + k*M + M/2, OY - 20, 17, '#8a8fa8');
        c.fillStyle = '#12142a'; c.fillRect(OX, OY, N*M, N*M);
        c.strokeStyle = '#2a2d52';
        for (let i = 0; i <= N; i++) {
          c.beginPath(); c.moveTo(OX + i*M, OY); c.lineTo(OX + i*M, OY + N*M); c.stroke();
          c.beginPath(); c.moveTo(OX, OY + i*M); c.lineTo(OX + N*M, OY + i*M); c.stroke();
        }
        s.shots.forEach(k => {
          const [x, y] = k.split(',').map(Number);
          const X = OX + x*M, Y = OY + y*M;
          if (s.all.some(([cx, cy]) => cx === x && cy === y)) { c.fillStyle = '#ff4081'; c.fillRect(X+4, Y+4, M-8, M-8); U.txt(c, '💥', X+M/2, Y+M/2+8, 20); }
          else { c.fillStyle = '#1d3a5a'; c.fillRect(X+4, Y+4, M-8, M-8); }
        });
        U.txt(c, s.taps + ' shots' + (s.sonar !== undefined ? ' · sonar: ' + (s.sonar ? 'warm! 🔥' : 'cold ❄️') : ''), W/2, 600, 18, '#8a8fa8');
      }
    };
  }
});
})();
