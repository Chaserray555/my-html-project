(() => {
const U = ARCADE.utils, W = 480, H = 720;

ARCADE.add({
  id: '2048', emoji: '🔢', name: '2048', cat: 'Puzzle', tags: 'swipe / arrows',
  desc: 'Merge tiles to reach 2048!\nScore: sum of merges',
  create(env) {
    const s = { g: Array.from({length: 4}, () => Array(4).fill(0)), sc: 0 };
    const add = () => {
      const free = [];
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (!s.g[y][x]) free.push([x, y]);
      if (!free.length) return;
      const [fx, fy] = free[env.iri(free.length)];
      s.g[fy][fx] = Math.random() < 0.9 ? 2 : 4;
    };
    const compress = arr => {
      let l = arr.filter(v => v), out = [], i = 0, gain = 0;
      while (i < l.length) {
        if (i + 1 < l.length && l[i] === l[i+1]) { out.push(l[i]*2); gain += l[i]*2; i += 2; }
        else { out.push(l[i]); i++; }
      }
      while (out.length < 4) out.push(0);
      s.sc += gain;
      return { out, changedGain: gain > 0 };
    };
    const slide = dir => {
      let moved = false, won = false;
      for (let k = 0; k < 4; k++) {
        let arr;
        if (dir === 2 || dir === 3) {
          arr = [s.g[0][k], s.g[1][k], s.g[2][k], s.g[3][k]];
          if (dir === 3) arr.reverse();
          const r = arr.filter(v => v), out = [];
          let i = 0, gain = 0;
          while (i < r.length) {
            if (i + 1 < r.length && r[i] === r[i+1]) { out.push(r[i]*2); gain += r[i]*2; i += 2; }
            else { out.push(r[i]); i++; }
          }
          while (out.length < 4) out.push(0);
          if (dir === 3) out.reverse();
          [s.g[0][k], s.g[1][k], s.g[2][k], s.g[3][k]] = out;
          s.sc += gain;
        } else {
          arr = s.g[k].slice();
          if (dir === 1) arr.reverse();
          const r = arr.filter(v => v), out = [];
          let i = 0, gain = 0;
          while (i < r.length) {
            if (i + 1 < r.length && r[i] === r[i+1]) { out.push(r[i]*2); gain += r[i]*2; i += 2; }
            else { out.push(r[i]); i++; }
          }
          while (out.length < 4) out.push(0);
          if (dir === 1) out.reverse();
          s.g[k] = out;
          s.sc += gain;
        }
      }
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (s.g[y][x] === 2048) won = true;
      add();
      if (won) { env.score(s.sc + 1000); return env.over('2048 ACHIEVED! 🎉 +1000'); }
      env.score(s.sc);
      let any = false;
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
        if (!s.g[y][x]) any = true;
        if (x < 3 && s.g[y][x] === s.g[y][x+1]) any = true;
        if (y < 3 && s.g[y][x] === s.g[y+1][x]) any = true;
      }
      if (!any) env.over('Board jammed at ' + s.sc);
    };
    add(); add();
    env.needPad(true, false);
    env.key(k => { const d = { left: 0, right: 1, up: 2, down: 3 }[k]; if (d !== undefined) slide(d); });
    env.swipe(d => { const m = { left: 0, right: 1, up: 2, down: 3 }[d]; if (m !== undefined) slide(m); });
    const cols = { 0:'#1d2040', 2:'#2d2f55', 4:'#3a3768', 8:'#6a4d9e', 16:'#7c4dff', 32:'#9e6dff', 64:'#b388ff', 128:'#4dd6ff', 256:'#4dff88', 512:'#ffd24d', 1024:'#ff80ab', 2048:'#ff4081' };
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#0a0b14');
        for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
          const v = s.g[y][x];
          c.fillStyle = cols[v] || '#ff4081'; c.fillRect(x*110+13, y*110+64, 100, 100);
          if (v) U.txt(c, v, x*110+63, y*110+126, v > 512 ? 26 : 36, v > 64 ? '#fff' : '#a8adcc');
        }
        U.txt(c, 'SCORE ' + s.sc, W/2, 36, 26, '#fff');
      }
    };
  }
});

ARCADE.add({
  id: 'mines', emoji: '💣', name: 'Minesweeper', cat: 'Puzzle', tags: 'tap reveal · TAP btn = 🚩 mode',
  desc: 'Reveal all safe squares. Numbers count nearby mines.\nWin: +100',
  create(env) {
    const N = 9, M = 40, OX = 60, OY = 140, MINES = 12;
    const s = { cells: [], flag: false, opened: 0, sc: 0, over: false };
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) s.cells.push({ x, y, m: false, o: false, f: false, n: 0 });
    const at = (x, y) => (x < 0 || y < 0 || x >= N || y >= N) ? null : s.cells[y*N + x];
    let minesPut = false;
    const place = sx => {
      while (s.cells.filter(c => c.m).length < MINES) {
        const c = at(env.iri(N), env.iri(N));
        if (c && !c.m && !(c.x === sx.x && c.y === sx.y)) c.m = true;
      }
      s.cells.forEach(c => { let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const q = at(c.x+dx, c.y+dy); if (q && q.m) n++; } c.n = n; });
      minesPut = true;
    };
    const open = c0 => {
      const st = [c0];
      while (st.length) {
        const c = st.pop();
        if (!c || c.o || c.f) continue;
        c.o = true; s.opened++;
        if (c.n === 0 && !c.m) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const q = at(c.x+dx, c.y+dy); if (q && !q.o) st.push(q); }
      }
    };
    env.needPad(false, true);
    env.key(k => { if (k === 'action' && !s.over) s.flag = !s.flag; });
    env.tap((x, y) => {
      if (s.over) return;
      const xp = Math.floor((x-OX)/M), yp = Math.floor((y-OY)/M);
      const cell = at(xp, yp);
      if (!cell) return;
      if (!minesPut) place(cell);
      if (s.flag) { if (!cell.o) cell.f = !cell.f; return; }
      if (cell.f || cell.o) return;
      open(cell);
      if (cell.m) {
        s.over = true;
        s.cells.forEach(q => { if (q.m) q.o = true; });
        return env.over('Boom! 💣 Revealed ' + s.opened);
      }
      env.score(s.opened);
      if (s.opened === N*N - MINES) { env.score(s.opened + 100); return env.over('SWEEPED! 🚩 +100'); }
    });
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#0a0b14');
        U.txt(c, (N*N - MINES - s.opened) + ' left', W/2, 60, 22, '#8a8fa8');
        c.fillStyle = s.flag ? '#ff4081' : '#4dd6ff'; c.fillRect(12, 24, 60, 46);
        c.font = '30px serif'; c.textAlign = 'center'; c.fillText(s.flag ? '🚩' : '⛏️', 42, 58);
        s.cells.forEach(cc => {
          const X = OX + cc.x*M, Y = OY + cc.y*M;
          c.fillStyle = cc.o ? (cc.m ? '#ff4081' : '#151a30') : '#2a2d52';
          c.fillRect(X+1, Y+1, M-2, M-2);
          if (cc.o && cc.n && !cc.m) U.txt(c, cc.n, X+M/2, Y+M/2+7, 20, '#ffd24d');
          if (!cc.o && cc.f) { c.font = '20px serif'; c.fillText('🚩', X+M/2, Y+M-10); }
          if (cc.o && cc.m) { c.font = '20px serif'; c.fillText('💥', X+M/2, Y+M-10); }
        });
      }
    };
  }
});

ARCADE.add({
  id: 'slide15', emoji: '🀄', name: 'Slide Puzzle', cat: 'Puzzle', tags: 'tap tiles / arrows',
  desc: 'Reorder 1→15. Tap a tile beside the hole.\nFinish = 1000 − moves!',
  create(env) {
    const s = { t: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0], moves: 0 };
    const M = 102, OX = 36, OY = 130;
    const hole = () => s.t.indexOf(0);
    let hx = hole(), mix = 0;
    while (mix < 400) {
      const hxp = hx % 4, hyp = (hx/4)|0, opts = [];
      if (hxp) opts.push(hx-1); if (hxp < 3) opts.push(hx+1);
      if (hyp) opts.push(hx-4); if (hyp < 3) opts.push(hx+4);
      const to = opts[env.iri(opts.length)];
      [s.t[hx], s.t[to]] = [s.t[to], s.t[hx]];
      hx = to; mix++;
    }
    env.needPad(true, false);
    const trySlide = idx => {
      const h = hole();
      const hxp = h % 4, hyp = (h/4)|0, xp = idx % 4, yp = (idx/4)|0;
      if (Math.abs(hxp - xp) + Math.abs(hyp - yp) !== 1) return;
      [s.t[h], s.t[idx]] = [s.t[idx], s.t[h]];
      s.moves++;
      env.score(Math.max(0, 500 - s.moves));
      if (s.t.slice(0, 15).every((v, i) => v === i + 1)) {
        env.score(Math.max(10, 1000 - s.moves));
        return env.over('SOLVED! ⭐ 1000 − ' + s.moves);
      }
    };
    env.tap((x, y) => {
      const xp = Math.floor((x-OX)/M), yp = Math.floor((y-OY)/M);
      if (xp >= 0 && xp < 4 && yp >= 0 && yp < 4) trySlide(yp*4 + xp);
    });
    env.key(k => {
      const d = { left: [1, 0], right: [-1, 0], up: [0, 1], down: [0, -1] }[k];
      if (!d) return;
      const h = hole(), hxp = h % 4, hyp = (h/4)|0;
      const x = hxp + d[0], y = hyp + d[1];
      if (x >= 0 && x < 4 && y >= 0 && y < 4) trySlide(y*4 + x);
    });
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#0a0b14');
        U.txt(c, 'Moves: ' + s.moves, W/2, 50, 24, '#8a8fa8');
        s.t.forEach((v, i) => {
          if (!v) return;
          const X = OX + (i%4)*M, Y = OY + ((i/4)|0)*M;
          c.fillStyle = '#7c4dff'; c.fillRect(X+3, Y+3, M-6, M-6);
          U.txt(c, v, X+M/2, Y+M/2+12, 34, '#fff');
        });
      }
    };
  }
});

ARCADE.add({
  id: 'lightsout', emoji: '💡', name: 'Lights Out', cat: 'Puzzle', tags: 'tap lights',
  desc: 'Turn every light off. A tap flips a plus-shape.\nWin: 40 − taps',
  create(env) {
    const M = 88, OX = 20, OY = 150;
    const s = { g: Array.from({length: 5}, () => Array(5).fill(false)), moves: 0 };
    const flip = (x, y) => [[0,0],[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx, dy]) => { const X = x+dx, Y = y+dy; if (X >= 0 && X < 5 && Y >= 0 && Y < 5) s.g[Y][X] = !s.g[Y][X]; });
    do { for (let i = 0; i < 8; i++) flip(env.iri(5), env.iri(5)); } while (!s.g.flat().some(v => v));
    env.needPad(false, false);
    env.tap((x, y) => {
      const xp = Math.floor((x-OX)/M), yp = Math.floor((y-OY)/M);
      if (xp < 0 || xp > 4 || yp < 0 || yp > 4) return;
      flip(xp, yp);
      s.moves++;
      const on = s.g.flat().filter(Boolean).length;
      if (!on) { env.score(Math.max(5, 40 - s.moves)); return env.over('DARKNESS 🌚 ' + s.moves + ' taps'); }
      env.score(Math.max(0, 25 - on));
    });
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#0a0b14');
        U.txt(c, 'taps ' + s.moves + ' · lights on ' + s.g.flat().filter(Boolean).length, W/2, 70, 20, '#8a8fa8');
        s.g.forEach((row, yy) => row.forEach((v, xx) => {
          c.fillStyle = v ? '#ffd24d' : '#1d2040';
          const X = OX + xx*M, Y = OY + yy*M;
          c.fillRect(X+4, Y+4, M-8, M-8);
          if (v) { c.fillStyle = '#fff2cc'; c.beginPath(); c.arc(X+M/2, Y+M/2, 10, 0, 7); c.fill(); }
        }));
      }
    };
  }
});

ARCADE.add({
  id: 'sudoku6', emoji: '🧮', name: 'Sudoku 6', cat: 'Puzzle', tags: 'tap empty · cycles 1-6',
  desc: 'Every row, column & 2×3 box needs 1-6 once.\nWin: 200',
  create(env) {
    const N = 6, M = 68, OX = 36, OY = 150;
    const ok = (g, x, y, v) => {
      for (let i = 0; i < N; i++) if (g[y][i] === v || g[i][x] === v) return false;
      const bx = ((x/2)|0)*2, by = ((y/3)|0)*3;
      for (let yy = by; yy < by+3; yy++) for (let xx = bx; xx < bx+2; xx++) if (g[yy][xx] === v) return false;
      return true;
    };
    const gSol = Array.from({length: N}, () => Array(N).fill(0));
    const rec = i => {
      if (i === N*N) return true;
      const x = i % N, y = (i/N)|0;
      for (let v = 1; v <= N; v++) if (ok(gSol, x, y, v)) {
        gSol[y][x] = v;
        if (rec(i+1)) return true;
        gSol[y][x] = 0;
      }
      return false;
    };
    rec(0);
    const holes = new Set();
    while (holes.size < 26) holes.add(env.iri(N*N));
    const s = { g: Array.from({length: N}, (_, y) => Array.from({length: N}, (_, x) => holes.has(y*N+x) ? 0 : gSol[y][x])), holes, sc: 0 };
    env.needPad(false, false);
    env.tap((x, y) => {
      const xp = Math.floor((x-OX)/M), yp = Math.floor((y-OY)/M);
      const idx = yp*N + xp;
      if (xp < 0 || xp >= N || yp < 0 || yp >= N || !s.holes.has(idx)) return;
      s.g[yp][xp] = (s.g[yp][xp] + 1) % (N + 1);
      if (s.g.flat().every((v, i) => v === gSol[(i/N)|0][i%N])) { env.score(200); return env.over('COMPLETE! 🧮 +200'); }
      env.score(s.g.flat().filter(v => v).length * 3);
    });
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#0a0b14');
        U.txt(c, 'Tap empty cells to cycle 1-6', W/2, 70, 17, '#8a8fa8');
        s.g.forEach((row, yy) => row.forEach((v, xx) => {
          const X = OX + xx*M, Y = OY + yy*M;
          c.strokeStyle = '#2a2d52'; c.strokeRect(X+2, Y+2, M-4, M-4);
          if (xx % 2 === 0) c.strokeRect(X, Y, M, M);
          if (v) U.txt(c, v, X+M/2, Y+M/2+10, 26, s.holes.has(yy*N+xx) ? '#ffd24d' : '#8a8fa8');
        }));
      }
    };
  }
});

ARCADE.add({
  id: 'picross', emoji: '⬛', name: 'Pixel Cross', cat: 'Puzzle', tags: 'tap = fill · again = ✗',
  desc: 'Oh no, a hidden picture! Row/col numbers = runs of filled cells.\nWin: 80',
  create(env) {
    const N = 6, M = 60, OX = 112, OY = 130;
    const pat = Array.from({length: N}, () => Array.from({length: N}, () => Math.random() < 0.5));
    const s = { g: Array.from({length: N}, () => Array(N).fill(0)), moves: 0 };
    const hints = arr => { const out = []; let c = 0; for (const v of arr) { if (v) c++; else if (c) { out.push(c); c = 0; } } if (c) out.push(c); return out.length ? out : [0]; };
    env.needPad(false, false);
    env.tap((x, y) => {
      const xp = Math.floor((x-OX)/M), yp = Math.floor((y-OY)/M);
      if (xp < 0 || xp >= N || yp < 0 || yp >= N) return;
      s.g[yp][xp] = (s.g[yp][xp] + 1) % 3;
      s.moves++;
      const fit = s.g.every((row, yy) => row.every((v, xx) => (v === 1) === pat[yy][xx]));
      if (fit) { env.score(Math.max(20, 80 - s.moves*2)); return env.over('Picasso! 🖼️ ' + s.moves + ' taps'); }
      const filled = s.g.flat().filter(v => v === 1).length;
      env.score(filled);
    });
    const rowHint = r => hints(pat[r]).join(' ');
    const colHint = i => hints(pat.map(row => row[i])).join(' ');
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#0a0b14');
        for (let r = 0; r < N; r++) U.txt(c, rowHint(r), OX - 8, OY + r*M + M/2 + 6, 15, '#8a8fa8', 'right');
        for (let i = 0; i < N; i++) {
          const parts = colHint(i).split(' ');
          parts.forEach((p, j) => U.txt(c, p, OX + i*M + M/2, OY - 22 - (parts.length - 1 - j)*15, 14, '#8a8fa8'));
        }
        s.g.forEach((row, yy) => row.forEach((v, xx) => {
          const X = OX + xx*M, Y = OY + yy*M;
          c.fillStyle = v === 1 ? '#4dd6ff' : '#161830'; c.fillRect(X+2, Y+2, M-4, M-4);
          if (v === 2) U.txt(c, '✗', X+M/2, Y+M/2+8, 20, '#ff4081');
        }));
      }
    };
  }
});

ARCADE.add({
  id: 'pegjump', emoji: '🎯', name: 'Peg Jump', cat: 'Puzzle', tags: 'tap peg → tap hole',
  desc: 'Hop pegs over pegs. Leave just ONE peg for the trophy!\nScore: jumps',
  create(env) {
    const rows = [];
    for (let r = 0; r < 5; r++) { const row = []; for (let i = 0; i <= r; i++) row.push({ f: true, x: W/2 + (i - r/2)*66, y: 170 + r*62 }); rows.push(row); }
    rows[2][1].f = false;
    const s = { rows, sel: null, jumps: 0 };
    const get = (r, i) => (r >= 0 && r < 5 && i >= 0 && i < rows[r].length) ? rows[r][i] : null;
    const dirs = [[0,2,0,1],[0,-2,0,-1],[2,0,1,0],[2,2,1,1],[-2,0,-1,0],[-2,-2,-1,-1]];
    env.needPad(false, false);
    env.tap((x, y) => {
      let hit = null, hr = 0, hi = 0;
      rows.forEach((row, r) => row.forEach((p, i) => { if (Math.hypot(p.x - x, p.y - y) < 32) { hit = p; hr = r; hi = i; } }));
      if (!hit) { s.sel = null; return; }
      if (s.sel && !hit.f) {
        const from = s.sel;
        for (const [dr, di, drM, diM] of dirs) {
          if (hr === from.r + dr && hi === from.i + di) {
            const m = get(from.r + drM, from.i + diM);
            if (m && m.f) {
              m.f = false; from.f = false; hit.f = true;
              s.jumps++;
              env.score(s.jumps);
              const pegs = rows.flat().filter(p => p.f).length;
              if (pegs === 1) { env.score(s.jumps + 50); return env.over('ONE PEG LEFT! 🏆 +50'); }
              const any = rows.some((row, r) => row.some((p, i) => p.f && moveFrom(r, i)));
              if (!any) return env.over('Stuck with ' + pegs + ' pegs');
            }
            break;
          }
        }
        s.sel = null;
        return;
      }
      if (hit.f) { s.sel = { r: hr, i: hi, ...hit }; }
      else s.sel = null;
    });
    const moveFrom = (r, i) => dirs.some(([dr, di, drM, diM]) => {
      const from = get(r, i), m = get(r+drM, i+diM), to = get(r+dr, i+di);
      return from && from.f && m && m.f && to && !to.f;
    });
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#0a0b14');
        rows.forEach(row => row.forEach(p => {
          c.fillStyle = p.f ? '#7c4dff' : '#1d2040';
          c.beginPath(); c.arc(p.x, p.y, 24, 0, 7); c.fill();
          if (s.sel && p.x === s.sel.x && p.y === s.sel.y && p.f) { c.strokeStyle = '#ffd24d'; c.lineWidth = 4; c.stroke(); }
        }));
        U.txt(c, rows.flat().filter(p => p.f).length + ' pegs · jumps ' + s.jumps, W/2, 48, 20, '#8a8fa8');
      }
    };
  }
});

ARCADE.add({
  id: 'memo', emoji: '🧠', name: 'Memory Match', cat: 'Puzzle', tags: 'tap cards',
  desc: 'Pair all 8 emoji. Fewer flips = higher score.\nScore: 100 − flips',
  create(env) {
    const em = ['🐦','🌵','🎲','🍩','🚗','🕹️','🐧','🍕'];
    const cards = [...em, ...em].sort(() => Math.random() - 0.5).map(e => ({ e, up: false, gone: false }));
    const M = 106, GX = 4, OX = 23, OY = 150;
    const s = { cards, a: -1, b: -1, flips: 0, found: 0, lock: 0 };
    env.needPad(false, false);
    env.tap((x, y) => {
      if (s.lock > 0 || s.found === 8) return;
      const idx = Math.floor((y-OY)/M)*GX + Math.floor((x-OX)/M);
      if (idx < 0 || idx >= 16 || cards[idx].gone || cards[idx].up) return;
      cards[idx].up = true;
      if (s.a === -1) { s.a = idx; return; }
      s.flips++;
      s.b = idx;
      if (cards[s.a].e === cards[idx].e) {
        cards[s.a].gone = true; cards[idx].gone = true;
        s.found++; s.a = -1;
        env.score(s.found * 8);
        if (s.found === 8) { env.score(Math.max(10, 100 - s.flips)); env.over('BRAIN WINNER 🧠 ' + s.flips + ' flips'); }
      } else { s.lock = 0.75; }
    });
    return {
      update(t, dt) {
        if (s.lock > 0) {
          s.lock -= dt;
          if (s.lock <= 0) { cards[s.a].up = false; cards[s.b].up = false; s.a = s.b = -1; s.lock = 0; }
        }
      },
      draw(c) {
        U.bg(c, '#0a0b14');
        U.txt(c, 'flips ' + s.flips + ' · pairs ' + s.found + '/8', W/2, 70, 20, '#8a8fa8');
        cards.forEach((cd, i) => {
          const X = OX + (i%GX)*M, Y = OY + ((i/GX)|0)*M;
          if (!cd.gone) {
            c.fillStyle = cd.up ? '#2a2d52' : '#7c4dff';
            c.fillRect(X+4, Y+4, M-8, M-8);
            c.font = '40px serif'; c.textAlign = 'center';
            if (cd.up) c.fillText(cd.e, X+M/2, Y+M/2+14);
            else { c.fillStyle = '#4d3aa8'; c.fillText('?', X+M/2, Y+M/2+11); }
          }
        });
      }
    };
  }
});
})();
