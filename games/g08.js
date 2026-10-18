(() => {
const U = ARCADE.utils, W = 480, H = 720;

ARCADE.add({
  id: 'reaction', emoji: '⚡', name: 'Reaction Test', cat: 'Skill', tags: 'tap when green!',
  desc: 'Super-fast taps score. Too early = fail.',
  create(env) {
    const s = { phase: 'wait', t: 0, delay: 1 + env.rand(3), best: 9, rounds: 0 };
    env.needPad(false, true);
    env.tap(() => {
      if (s.phase === 'wait') { s.phase = 'fail'; s.failTxt = 'TOO EARLY!' }
      else if (s.phase === 'go') {
        const ms = Math.round(s.t * 1000);
        s.best = Math.min(s.best, ms / 1000);
        env.score(Math.max(1, 400 - ms));
        s.phase = 'after'; s.after = ms + 'ms 🥶 hot';
        s.rounds++;
      } else if (s.phase === 'fail' || s.phase === 'after') {
        s.phase = 'wait'; s.t = 0; s.delay = 1 + env.rand(3);
      }
    });
    return {
      update(t, dt) {
        s.t += dt;
        if (s.phase === 'wait' && s.t > s.delay) { s.phase = 'go'; s.t = 0; }
      },
      draw(c) {
        U.bg(c, s.phase === 'go' ? '#0d3a1a' : s.phase === 'fail' ? '#3a0a0f' : '#0a0b14');
        if (s.phase === 'go') U.txt(c, 'TAP TAP TAP', W/2, H/2, 50, '#4dff88');
        if (s.phase === 'wait') U.txt(c, 'wait for green…', W/2, H/2, 30, '#8a8fa8');
        if (s.phase === 'fail') U.txt(c, s.failTxt, W/2, H/2, 34, '#ff4081');
        if (s.phase === 'after') { U.txt(c, s.after, W/2, H/2, 30, '#fff'); }
        U.txt(c, 'rounds ' + s.rounds, W/2, 60, 20, '#fff');
      }
    };
  }
});

ARCADE.add({
  id: 'aim', emoji: '🎯', name: 'Aim Trainer', cat: 'Skill', tags: 'tap targets fast',
  desc: 'Hit 30 targets! Misses cost sad points.',
  create(env) {
    const s = { tgt: null, hits: 0, miss: 0, sc: 0, spawnT: 0, life: 0 };
    const spawn = () => { s.tgt = { x: 60 + env.rand(W-120), y: 60 + env.rand(H-220), r: 34 - hits() }; s.tgt.r = Math.max(18, s.tgt.r); };
    function hits() { return s.hits; }
    spawn();
    env.needPad(false, false);
    env.tap((x, y) => {
      if (s.hits >= 30) return;
      if (s.tgt && Math.hypot(s.tgt.x - x, s.tgt.y - y) < s.tgt.r + 6) {
        s.hits++; s.sc += Math.max(2, 50 - s.miss); env.score(s.sc);
        s.spawnT = 0;
        if (s.hits >= 30) { env.score(s.sc + Math.max(0, 20 - s.miss) * 10); return env.over('CLEAN SHERIFF 🏹 done'); }
        spawn();
      } else { s.miss++; s.sc = Math.max(0, s.sc - 5); env.score(s.sc); spawn(); }
    });
    return {
      update(t, dt) {
        s.spawnT += dt;
        if (s.spawnT > 1.6) { s.spawnT = 0; s.miss += 0; spawn(); }
      },
      draw(c) {
        U.bg(c, '#0a0b14');
        c.fillStyle = '#2a4d6e';
        if (s.tgt) { c.fillStyle = '#ff4081'; c.beginPath(); c.arc(s.tgt.x, s.tgt.y, s.tgt.r, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(s.tgt.x, s.tgt.y, s.tgt.r/2, 0, 7); c.fill(); }
        U.txt(c, s.hits + '/30 · miss ' + s.miss, W/2, 40, 24, '#fff');
      }
    };
  }
});

ARCADE.add({
  id: 'whack', emoji: '🔨', name: 'Whack-a-Hole', cat: 'Skill', tags: 'tap moles, avoid 👒',
  desc: 'Bop moles for points! Hats are innocent.',
  create(env) {
    const s = { holes: Array.from({length: 9}, (_, i) => ({ i, who: -1, t: 0 })), sc: 0, t: 0 };
    env.needPad(false, false);
    env.tap((x, y) => {
      const col = Math.floor((x - 40)/140), row = Math.floor((y - 180)/180);
      if (col < 0 || col > 2 || row < 0 || row > 2) return;
      const h = s.holes[row*3 + col];
      if (h.who === 0) { s.sc += 10; h.who = -1; env.score(s.sc); }
      else if (h.who === 1) { s.sc = Math.max(0, s.sc - 15); h.who = -1; env.score(s.sc); }
    });
    return {
      update(t, dt) {
        s.t -= dt;
        if (s.t <= 0) {
          s.t = 0.45;
          const h = s.holes[env.iri(9)];
          if (h.who === -1) { h.who = Math.random() < 0.72 ? 0 : 1; h.life = 1.1 - Math.min(0.6, s.sc/300); }
        }
        s.holes.forEach(h => { h.life = (h.life || 0) - dt; if (h.who !== -1 && h.life <= 0) h.who = -1; });
      },
      draw(c) {
        U.bg(c, '#0a0b14');
        U.txt(c, s.sc, W/2, 60, 36, '#fff');
        s.holes.forEach(h => {
          const X = 40 + (h.i%3)*140 + 70, Y = 180 + ((h.i/3)|0)*180 + 90;
          c.fillStyle = '#1d2040'; c.beginPath(); c.arc(X, Y, 56, 0, 7); c.fill();
          if (h.who === 0) { c.font = '48px serif'; c.textAlign = 'center'; c.fillText('🐹', X, Y+14); }
          if (h.who === 1) { c.fillStyle = '#ffd24d'; c.beginPath(); c.arc(X, Y+30, 30, Math.PI, 0); c.fill(); c.fillStyle = '#ff80ab'; c.fillRect(X-8, Y-6, 10, 6); }
        });
      }
    };
  }
});

ARCADE.add({
  id: 'typing', emoji: '⌨️', name: 'Typing Test', cat: 'Words', tags: 'type (hardware or tap-pad)',
  desc: 'Type the sentence word by word. 45 seconds!',
  create(env) {
    const sents = ['the quick brown fox jumps over the lazy dog','pixel dreams and d-pad thumbs keep us sharp','never trust a grid without its glowing dots','tap tap tap till the deadline melts away','small coffees strong thumbs grade a essays'];
    const s = { sent: env.choice(sents), typed: '', t: 45, ok: 0, bad: 0 };
    env.needPad(false, true);
    const feed = k => {
      if (s.t <= 0) return;
      const pos = s.typed.length;
      if (pos >= s.sent.length) return;
      if (s.sent[pos] === k) { s.typed += k; s.ok++; env.score(s.ok); }
      else { s.bad++; s.t = Math.max(0.1, s.t - 1); }
      if (s.typed.length === s.sent.length) { s.typed = ''; s.ok += 10; s.sent = env.choice(sents.filter(x => x !== s.sent)); }
    };
    env.anyKey(feed);
    env.tap((x, y) => {
      if (y < 470 || y > 700) return;
      const row = Math.min(3, Math.floor((y - 470) / 58));
      const i = Math.floor((x - 40) / 48) + row * 7;
      if (i < 0 || i > 26) return;
      feed(i === 26 ? ' ' : 'abcdefghijklmnopqrstuvwxyz'[i]);
    });
    return {
      update(t, dt) {
        s.t -= dt;
        if (s.t <= 0) {
          env.score(s.ok - s.bad*0.5);
          env.over('WPM-ish ' + Math.round(s.ok/5/0.75) + '\ncorrect ' + s.ok + ' · slips ' + s.bad);
        }
      },
      draw(c) {
        U.bg(c, '#0a0b14');
        U.txtwrap(c, s.sent, W/2, 160, 24, '#8a8fa8');
        U.txtwrap(c, s.typed, W/2, 320, 30, '#4dff88');
        U.txt(c, '✓ ' + s.ok + '  ✗ ' + s.bad, W/2, 60, 22, '#fff');
        U.txt(c, Math.ceil(s.t) + 's left', W/2, 100, 30, '#fff');
        for (let i = 0; i < 27; i++) {
          const row = (i / 7) | 0;
          const X = 40 + (i % 7) * 48, Y = 470 + row * 58;
          c.fillStyle = i === 26 ? '#1a5c3a' : '#7c4dff';
          c.fillRect(X, Y, 44, 50);
          U.txt(c, i === 26 ? '⌴' : 'abcdefghijklmnopqrstuvwxyz'[i].toUpperCase(), X + 22, Y + 33, 22, '#fff');
        }
      }
    };
  }
});

U.txtwrap = (c, str, x, y, size, col) => {
  c.fillStyle = col; c.font = size + 'px monospace'; c.textAlign = 'center';
  const words = str.split(' ');
  let line = '', yy = y;
  for (const w of words) {
    if ((line + w).length > 28) { c.fillText(line, x, yy); yy += size + 8; line = ''; }
    line += w + ' ';
  }
  c.fillText(line, x, yy);
};

ARCADE.add({
  id: 'math', emoji: '🔢', name: 'Math Sprint', cat: 'Skill', tags: 'tap answers',
  desc: '30s of rapid arithmetic. Wrong = −s!',
  create(env) {
    const s = { q: '', a: 0, opts: [], sc: 0, t: 30 };
    const gen = () => {
      const ops = [['+', (a, b) => a + b], ['−', (a, b) => a - b], ['×', (a, b) => a * b]];
      const [op, fn] = ops[env.iri(3 - sc_Level())];
      function sc_Level() { return s.sc > 150 ? 1 : 0; }
      let a = 1 + env.iri(12 + sc_Level()*12), b = 1 + env.iri(9);
      s.q = a + ' ' + op + ' ' + b;
      s.a = fn(a, b);
      const opts = new Set([s.a]);
      while (opts.size < 4) opts.add(s.a + (env.iri(19) - 9) * (env.iri(2) ? 1 : 2) || s.a + 3);
      s.opts = [...opts].sort(() => Math.random() - 0.5);
    };
    gen();
    env.needPad(false, false);
    env.tap((x, y) => {
      if (y > 320 && y < 600) {
        const i = (Math.floor((x - 40)/190)) + 2*(Math.floor((y - 320)/100));
        if (i < 0 || i > 3) return;
        env.score(s.sc);
        if (s.opts[i] === s.a) { s.sc += 10; } else { s.sc = Math.max(0, s.sc - 8); s.t = Math.max(0.2, s.t - 1.5); }
        env.score(s.sc);
        if (s.sc >= 200) return env.over('MATH WIZARD 🧮 done at ' + s.sc);
        gen();
      }
    });
    return {
      update(t, dt) {
        s.t -= dt;
        if (s.t <= 0) return env.over('Score ' + s.sc);
      },
      draw(c) {
        U.bg(c, '#0a0b14');
        U.txt(c, s.q + ' = ?', W/2, 170, 48, '#fff');
        s.opts.forEach((v, i) => {
          const X = 40 + (i%2)*190, Y = 340 + Math.floor(i/2)*120;
          c.fillStyle = '#7c4dff'; c.fillRect(X, Y, 170, 80);
          U.txt(c, v, X+85, Y+52, 40, '#fff');
        });
        U.txt(c, Math.ceil(s.t) + 's · ' + s.sc, W/2, 60, 26, '#fff');
      }
    };
  }
});

ARCADE.add({
  id: 'seq', emoji: '🔢', name: 'Sequence Recall', cat: 'Brain', tags: 'watch · repeat on pad',
  desc: 'Memorize the number flash, then type it (via pad taps? or keys).',
  create(env) {
    const s = { show: '', phase: 'show', t: 0, in: '', len: 3, level: 1, sc: 0, flash: '' };
    const gen = () => { s.show = String(1 + env.iri(9)) .repeat(0); let out = ''; for (let i = 0; i < s.len; i++) out += env.iri(10); s.show = out; s.phase = 'show'; s.t = 0.3 + s.len*0.35; };
    gen();
    env.needPad(false, true);
    env.tap((x, y) => {
      if (s.phase !== 'in') return;
      if (y < 400 || y > 500) return;
      const i = Math.floor((x - 40)/40);
      if (i < 0 || i > 9) return;
      s.in += i;
      if (!s.show.startsWith(s.in)) { env.over('Sequence lost at level ' + s.level); return; }
      if (s.in.length === s.show.length) {
        s.sc += s.level * 10; env.score(s.sc); s.level++; s.len = Math.min(8, 2 + s.level); s.in = ''; gen();
      }
    });
    env.key(k => {
      if (s.phase !== 'in') return;
      if (k.length !== 1 || (k < '0' || k > '9')) return;
      s.in += k;
      if (!s.show.startsWith(s.in)) { env.over('Sequence lost at level ' + s.level); return; }
      if (s.in.length === s.show.length) { s.sc += s.level*10; env.score(s.sc); s.level++; s.len = Math.min(8, 2+s.level); s.in=''; gen(); }
    });    env.anyKey(k => {
      if (s.phase !== 'in') return;
      if (k.length === 1 && k >= '0' && k <= '9') {
        s.in += k;
        if (!s.show.startsWith(s.in)) return env.over('Sequence lost at level ' + s.level);
        if (s.in.length === s.show.length) { s.sc += s.level*10; env.score(s.sc); s.level++; s.len = Math.min(8, 2+s.level); s.in=''; gen(); }
      }
    });
    return {
      update(t, dt) {
        if (s.phase === 'show') {
          s.t -= dt;
          if (s.t < 0.05) { s.phase = 'in'; s.in = ''; s.flash = s.show; }
        }
      },
      draw(c) {
        U.bg(c, '#0a0b14');
        if (s.phase === 'show') U.txt(c, s.show, W/2, 260, 64, '#fff');
        else {
          U.txt(c, s.in + ' '.repeat(Math.max(0, s.show.length - s.in.length)).replace(/ /g, '·'), W/2, 260, 54, '#ffd24d');
          for (let i = 0; i < 10; i++) { c.fillStyle = '#1d2040'; c.fillRect(40 + i*40, 420, 34, 60); U.txt(c, i, 57 + i*40, 460, 26, '#fff'); }
          U.txt(c, 'tap digits or type them (hardware)', W/2, 540, 16, '#8a8fa8');
        }
        U.txt(c, 'LVL ' + s.level + ' · ' + s.sc, W/2, 90, 26, '#fff');
      }
    };
  }
});

ARCADE.add({
  id: 'stop5', emoji: '⏱️', name: 'Stop at 5.00', cat: 'Skill', tags: 'tap to stop',
  desc: 'Stop the clock exactly at 5.00s! 8 rounds.',
  create(env) {
    const s = { t: 0, phase: 'go', rounds: 0, sc: 0, best: 9 };
    env.needPad(false, true);
    env.tap(() => {
      if (s.phase === 'go') {
        const err = Math.abs(s.t - 5);
        s.sc += Math.max(0, Math.round((0.5 - Math.min(0.5, err)) * 100));
        s.best = Math.min(s.best, err);
        s.rounds++;
        s.msg = err < 0.05 ? '🔥 ' + s.t.toFixed(2) : s.t.toFixed(2) + 's (' + err.toFixed(2) + ' off)';
        env.score(s.sc);
        if (s.rounds >= 8) return env.over('Precision master!\nBest error ' + s.best.toFixed(2) + 's');
        s.phase = 'show';
      } else if (s.phase === 'show') { s.phase = 'go'; s.t = 0; }
    });
    return {
      update(t, dt) { if (s.phase === 'go') s.t += dt; },
      draw(c) {
        U.bg(c, '#0a0b14');
        U.txt(c, s.t.toFixed(2), W/2, 260, 90, s.phase === 'go' ? '#4dff88' : '#8a8fa8');
        if (s.msg && s.phase === 'show') U.txt(c, s.msg, W/2, 380, 24, '#fff');
        U.txt(c, 'round ' + (s.rounds + 1) + '/8', W/2, 80, 22, '#fff');
        U.txt(c, 'tap / ⏎ to STOP at 5.00', W/2, 500, 20, '#8a8fa8');
      }
    };
  }
});

ARCADE.add({
  id: 'odd', emoji: '🎨', name: 'Odd Color Out', cat: 'Skill', tags: 'tap the different one',
  desc: 'One tile is a hair of a different color. Grind the difficulty!',
  create(env) {
    const s = { n: 2, grid: [], dist: 0.18, base: [60,60,60], lives: 3 };
    const gen = () => {
      const N = Math.min(8, s.n);
      s.grid = [];
      const b = env.choice([[200,40,90],[40,160,200],[90,200,60],[240,200,60],[120,80,220]]);
      s.base = b;
      const odd = env.iri(N*N);
      for (let i = 0; i < N*N; i++) s.grid.push(i === odd ? [nudge(b), true] : [b, false]);
    };
    const nudge = b => b.map(v => Math.max(0, Math.min(255, v + s.dist*255)));
    gen();
    env.needPad(false, false);
    env.tap((x, y) => {
      if (y < 140) { if (y > 40 && y < 120) { s.dist = Math.max(0.008, s.dist*0.75); s.n = Math.min(8, s.n+1); gen(); } return; }
      const N = Math.min(8, s.n);
      const CELL = Math.min(88, Math.floor(500 / N));
      const OX = (W - N*CELL)/2;
      const col = Math.floor((x - OX)/CELL), row = Math.floor((y - 170)/CELL);
      if (row < 0 || row >= N || col < 0 || col >= N) return;
      const tile = s.grid[row*N + col];
      if (tile[1]) { s.sc += Math.floor(s.dist*5000); env.score(s.sc); s.dist = Math.max(0.006, s.dist*0.78); s.n = Math.min(8, s.n+1); gen(); }
      else { s.lives--; if (s.lives <= 0) return env.over('Color blind 🎨 score ' + s.sc); }
    });
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#0a0b14');
        U.txt(c, (s.sc || 0) + ' · ❤ ' + s.lives + ' · tap the odd tile', W/2, 50, 22, '#fff');
        const N = Math.min(8, s.n);
        const CELL = Math.min(88, Math.floor(500 / N));
        const OX = (W - N*CELL)/2;
        s.grid.forEach((t, i) => {
          const [col] = t;
          c.fillStyle = 'rgb(' + col.join(',') + ')';
          c.fillRect(OX + (i%N)*CELL + 2, 170 + Math.floor(i/N)*CELL + 2, CELL-4, CELL-4);
        });
      }
    };
  }
});

ARCADE.add({
  id: 'tug', emoji: '💪', name: 'Tug Mash', cat: 'Skill', tags: 'mash TAP',
  desc: 'Spam TAP harder than the bot for rights to the cookies.',
  create(env) {
    const s = { p: 0, botV: 1.6, sc: 0, done: false };
    env.needPad(false, true);
    env.tap(() => {
      if (s.done) return;
      s.p += 14;
      s.sc += 1;
    });
    env.key(k => { if (k === 'action' && !s.done) { s.p += 14; s.sc++; } });
    return {
      update(t, dt) {
        if (s.done) return;
        s.botV = Math.min(26, 1.4 + s.p*0.03 + 2.4);
        s.p -= s.botV * Math.min(3, 1 + s.p / 300);
        if (s.p < -150) { s.done = true; return env.over('Bot won the cookies 🍪'); }
        if (s.p > 150) { s.done = true; env.score(s.sc); return env.over('COOKIE CHAMPION 🍪'); }
        env.score(s.sc + Math.max(0, Math.round(s.p/3)));
      },
      draw(c) {
        U.bg(c, '#0a0b14');
        c.fillStyle = '#26294a'; c.fillRect(0, 320, W, 110);
        const x = W/2 + Math.max(-170, Math.min(170, s.p));
        c.strokeStyle = '#8a8fa8'; c.lineWidth = 5;
        c.beginPath(); c.moveTo(20, 351); c.lineTo(x-40, 351); c.stroke();
        c.beginPath(); c.moveTo(x+40, 351); c.lineTo(W-20, 351); c.stroke();
        c.fillStyle = '#ffd24d'; c.fillRect(x-40, 305, 80, 60);
        U.txt(c, '🤖', 60, 358, 44);
        U.txt(c, '🧑', W-90, 358, 44);
        U.txt(c, 'MASH THE BUTTON!', W/2, 520, 26, '#fff');
        U.txt(c, 'progress ' + Math.round(s.p), W/2, 580, 20, '#8a8fa8');
      }
    };
  }
});
})();
