(() => {
const U = ARCADE.utils, W = 480, H = 720;

ARCADE.add({
  id: 'ttt', emoji: '⭕', name: 'Noughts & Crosses', cat: 'Board', tags: 'tap',
  desc: 'Beat the hard bot! Win +100, draw +25.',
  create(env) {
    const s = { b: Array(9).fill(0), turn: true, over: false };
    const L = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    const winner = b => {
      for (const [a, c, d] of L) if (b[a] && b[a] === b[c] && b[c] === b[d]) return b[a];
      return b.every(v => v) ? 3 : 0;
    };
    const best = (b, pl) => {
      const w = winner(b);
      if (w === 2) return { v: 1 };
      if (w === 1) return { v: -1 };
      if (w === 3) return { v: 0 };
      let bv = pl === 2 ? -2 : 2, bi = -1;
      for (let i = 0; i < 9; i++) if (!b[i]) {
        b[i] = pl;
        const r = best(b, pl === 2 ? 1 : 2).v;
        b[i] = 0;
        if ((pl === 2 && r > bv) || (pl === 1 && r < bv)) { bv = r; bi = i; }
      }
      return { v: bv, i: bi };
    };
    env.needPad(false, false);
    env.tap((x, y) => {
      if (s.over) return;
      const i = Math.floor((y - 140) / 140) * 3 + Math.floor((x - 90) / 100);
      if (i < 0 || i > 8 || s.b[i]) return;
      s.b[i] = 1;
      const w1 = winner(s.b);
      if (w1 === 1) { s.over = true; return env.over('WINNER! 🔥 +100'); }
      if (!s.b.includes(0)) { s.over = true; return env.over('DRAW 😐 +25'); }
      const mv = best(s.b.slice(), 2).i;
      s.b[mv] = 2;
      const w2 = winner(s.b);
      if (w2 === 2) { s.over = true; env.over('BOT WINS 🤖'); }
      if (!s.b.includes(0)) { s.over = true; env.over('DRAW 😐 +25'); }
    });
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#0a0b14');
        for (let i = 1; i < 3; i++) { c.fillStyle = '#2a2d52'; c.fillRect(90, 140 + i*140, 300, 4); c.fillRect(90 + i*100, 140, 4, 420); }
        s.b.forEach((v, i) => {
          const X = 140 + (i%3)*100, Y = 210 + ((i/3)|0)*140;
          if (v === 1) { c.strokeStyle = '#4dff88'; c.lineWidth = 8; c.beginPath(); c.arc(X, Y, 32, 0, 7); c.stroke(); }
          if (v === 2) { c.strokeStyle = '#ff4081'; c.beginPath(); c.moveTo(X-28, Y-28); c.lineTo(X+28, Y+28); c.moveTo(X+28, Y-28); c.lineTo(X-28, Y+28); c.stroke(); }
        });
      }
    };
  }
});

ARCADE.add({
  id: 'connect4', emoji: '🔵', name: 'Connect 4', cat: 'Board', tags: 'tap columns',
  desc: 'Drop and align 4. Bot fights back.\nWin: 100',
  create(env) {
    const s = { b: Array.from({length: 6}, () => [0,0,0,0,0,0,0]), turn: true, over: false };
    const place = (b, col, p) => { for (let y = 5; y >= 0; y--) if (!b[y][col]) { b[y][col] = p; return y; } return -1; };
    const win = (b, p) => {
      for (let y = 0; y < 6; y++) for (let x = 0; x < 7; x++) {
        if (!b[y][x] && 0) return false;
        for (const [dx, dy] of [[0,1],[1,0],[1,1],[1,-1]]) {
          if (b[y] && b[y][x] === p && b[y+dy] && b[y+dy][x+dx] === p && b[y+2*dy] && b[y+2*dy][x+2*dx] === p && b[y+3*dy] && b[y+3*dy][x+3*dx] === p) return true;
        }
      }
      return false;
    };
    const h = b => {
      let v = 0;
      for (let y = 0; y < 6; y++) for (let x = 0; x < 7; x++) { if (!b[y][x] && 0) v++; }
      for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) if (b[y][x] === 2 && b[y][x+1] === 2) v += 3;
      for (let x = 0; x < 7; x++) if (b[5][x] === 2) v += 2;
      return v;
    };
    const botMove = () => {
      let bestC = -1, bestV = -1e9;
      for (let col = 0; col < 7; col++) {
        const b2 = s.b.map(r => r.slice());
        if (place(b2, col, 2) < 0) continue;
        let v = h(b2);
        if (win(b2, 2)) v = 1000;
        b2.forEach(r => r.forEach((_, i) => { if (0) return; }));
        for (let col2 = 0; col2 < 7; col2++) {
          const b3 = b2.map(r => r.slice());
          if (place(b3, col2, 1) < 0) continue;
          if (win(b3, 1)) v = -1000;
        }
        v += env.rand(3); (b2[0] !== undefined && col === 3) && (v += 2);
        if (v > bestV) { bestV = v; bestC = col; }
      }
      return bestC;
    };
    env.needPad(false, false);
    env.tap((x, y) => {
      if (s.over) return;
      if (y > 140) return;
      const col = Math.floor((x - 21) / 64);
      if (col < 0 || col > 6) return;
      const row = place(s.b, col, 1);
      if (row < 0) return;
      if (win(s.b, 1)) { s.over = true; return env.over('CONNECT 4! 🔵 +100'); }
      if (s.b.every(r => r.every(v => v))) { s.over = true; return env.over('FULL — draw'); }
      const bc = botMove();
      if (bc >= 0) place(s.b, bc, 2);
      if (win(s.b, 2)) { s.over = true; return env.over('BOT WON 🤖'); }
      if (s.b.every(r => r.every(v => v))) { s.over = true; env.over('FULL — draw'); }
      s.phase = 'bot' ;
    });
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#0a0b14');
        U.txt(c, s.over ? '' : 'your turn — tap a column', W/2, 90, 20, '#8a8fa8');
        for (let x = 0; x < 7; x++) {
          c.fillStyle = '#ff4081'; c.fillRect(20 + x*64, 130, 56, 12);
          for (let y = 0; y < 6; y++) {
            const v = s.b[y][x];
            c.fillStyle = v === 1 ? '#4dd6ff' : v === 2 ? '#ff4081' : '#1d2040';
            c.beginPath(); c.arc(48 + x*64, 190 + y*64, 26, 0, 7); c.fill();
          }
        }
      }
    };
  }
});

ARCADE.add({
  id: 'reversi', emoji: '⚫', name: 'Reversi', cat: 'Board', tags: 'tap legal squares',
  desc: 'Flip as many discs as possible. Corners are gold!\nWin: own discs',
  create(env) {
    const s = { b: Array.from({length: 8}, () => Array(8).fill(0)), turn: 1 };
    s.b[3][3] = s.b[4][4] = 2; s.b[3][4] = s.b[4][3] = 1;
    const inB = (x, y) => x >= 0 && x < 8 && y >= 0 && y < 8;
    const legal = (x, y, p) => {
      if (s.b[y][x]) return null;
      const dirs = [[0,1],[1,0],[0,-1],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
      const flips = [];
      for (const [dx, dy] of dirs) {
        let fx = x+dx, fy = y+dy, chain = [];
        while (inB(fx, fy) && s.b[fy][fx] === (p === 1 ? 2 : 1)) { chain.push([fx, fy]); fx += dx; fy += dy; }
        if (chain.length && inB(fx, fy) && s.b[fy][fx] === p) flips.push(...chain);
      }
      return flips.length ? flips : null;
    };
    const hasAny = p => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (legal(x, y, p)) return true; return false; };
    const count = p => s.b.flat().filter(v => v === p).length;
    env.needPad(false, false);
    env.tap((x, y) => {
      const xp = Math.floor((x - 40)/50), yp = Math.floor((y - 110)/50);
      if (xp < 0 || xp > 7 || yp < 0 || yp > 7) return;
      const flips = legal(xp, yp, 1);
      if (!flips) return;
      s.b[yp][xp] = 1;
      flips.forEach(([fx, fy]) => s.b[fy][fx] = 1);
      let p = 2;
      if (!hasAny(2)) p = 1;
      s.turn = p;
      let moved = false;
      if (p === 2 && hasAny(2)) {
        let best = null, bestN = -1;
        for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
          const fl = legal(x, y, 2);
          if (fl && fl.length > bestN) { bestN = fl.length; best = [x, y, fl]; }
        }
        if (best) { s.b[best[1]][best[0]] = 2; best[2].forEach(([fx, fy]) => s.b[fy][fx] = 2); moved = true; }
      }
      if (!hasAny(2) && !hasAny(1)) {
        const mine = count(1), bot = count(2);
        env.score(mine > bot ? mine : 0);
        return env.over(mine > bot ? 'WIN ' + mine + ':' + bot + ' 👑' : 'Lose ' + mine + ':' + bot);
      }
    });
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#0a0b14');
        c.fillStyle = '#123a2a'; c.fillRect(40, 110, 400, 400);
        c.strokeStyle = '#0a3a24';
        for (let i = 0; i <= 8; i++) {
          c.beginPath(); c.moveTo(40 + i*50, 110); c.lineTo(40 + i*50, 510); c.stroke();
          c.beginPath(); c.moveTo(40, 110 + i*50); c.lineTo(440, 110 + i*50); c.stroke();
        }
        s.b.forEach((row, y) => row.forEach((v, x) => {
          if (!v) return;
          c.fillStyle = v === 1 ? '#1a1a1e' : '#e8eaf6';
          c.beginPath(); c.arc(65 + x*50, 135 + y*50, 21, 0, 7); c.fill();
          if (v === 1) { c.strokeStyle = '#4dff88'; c.stroke(); }
        }));
        const mine = count(1), bot = count(2);
        U.txt(c, 'you ' + mine + ' · bot ' + bot, W/2, 80, 22, '#8a8fa8');
      }
    };
  }
});

ARCADE.add({
  id: 'nim', emoji: '🕯️', name: 'Nim', cat: 'Board', tags: 'tap stacks #1→#3',
  desc: 'Nim with bot: whoever takes the LAST stick LOSES.\nControl XOR to win!',
  create(env) {
    const s = { rows: [1, 3, 5, 7], yours: [] };
    let avail = new Set();
    env.needPad(false, false);
    env.tap((x, y) => {
      if (!s.rows.some(n => n > 0)) return;
      const row = Math.min(3, Math.max(0, Math.floor((y - 140) / 120)));
      if (!s.rows[row]) return;
      const n = Math.floor((x - 60) / 60);
      if (n === s.rows[row]) {
        s.rows[row]--;
        avail = new Set();
        if (!s.rows.some(nn => nn)) { env.over('You took the last stick 😵'); return; }
        botTurn();
      }
    });
    const botTurn = () => {
      const big = s.rows.findIndex(n => n > 1);
      if (big >= 0) {
        const singles = s.rows.filter(n => n === 1).length;
        s.rows[big] -= singles % 2 ? s.rows[big] - 1 : s.rows[big];
      } else if (Math.random() < 0.75) {
        const xorT = s.rows.slice(), x0 = xorT[0]^xorT[1]^xorT[2]^xorT[3];
        if (x0) {
          const b2 = Math.floor(Math.log2(x0));
          const r = xorT.findIndex(n => (n >> b2) & 1);
          s.rows[r] -= (x0 & s.rows[r]) || 1;
          if (s.rows[r] < 0) s.rows[r] = 0;
        } else {
          const r2 = s.rows.findIndex(n => n);
          s.rows[r2]--;
        }
      } else {
        const r3 = s.rows.findIndex(n => n);
        s.rows[r3]--;
      }
      if (!s.rows.some(n => n)) return env.over('Bot took the last stick — YOU WIN! 🏆');
    };
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#0a0b14');
        U.txt(c, 'Tap a stick to cut its row down to it. Don\'t take the LAST one!', W/2, 80, 15, '#8a8fa8');
        s.rows.forEach((n, r) => {
          for (let i = 0; i < n; i++) {
            const X = 60 + i*60, Y = 200 + r*120;
            c.fillStyle = '#ffd24d'; c.fillRect(X, Y-40, 12, 80);
            c.fillStyle = '#ffb24d'; c.beginPath(); c.arc(X+6, Y-44, 7, 0, 7); c.fill();
          }
          if (n) U.txt(c, n + ' left', 440, 200 + r*120 + 16, 14, '#3a3f6e', 'right');
        });
        U.txt(c, '⚠ lose = taking the last one', W/2, 700, 16, '#ff4081');
      }
    };
  }
});

ARCADE.add({
  id: 'hangman', emoji: '🪢', name: 'Hangman', cat: 'Words', tags: 'tap letters',
  desc: 'Guess the word before the man hangs!\n+15 × letters saved',
  create(env) {
    const words = ['octopus','pyramid','keyboard','aztreasure','javacafe','sunset','pumpkin','watermelon','thunder','pixelart','telescope','dinosaur','chocolate','spaceship','cassette','moonlight','flutterby','quicksand','vibrations','eggshells'];
    const word = env.choice(words);
    const s = { word: [...word], shown: Array(word.length).fill(''), left: 6, used: new Set() };
    env.needPad(false, false);
    env.tap((x, y) => {
      if (y < 460 || y >= 700) return;
      const row = Math.min(3, Math.floor((y - 460) / 60));
      const i = Math.floor((x - 40) / 48) + row * 7;
      const alpha = 'abcdefghijklmnopqrstuvwxyz';
      if (i < 0 || i >= 26) return;
      const L = alpha[i];
      if (s.used.has(L)) return;
      s.used.add(L);
      if (s.word.includes(L)) {
        s.word.forEach((ch, j) => { if (ch === L) s.shown[j] = L; });
        env.score(s.shown.filter(Boolean).length * 10 + s.left);
        if (s.shown.every(v => v)) { env.score(s.left * 15 + 20); return env.over('SAVED HIM! 🎉 "' + word + '"'); }
      } else {
        s.left--;
        if (s.left === 0) return env.over('…it was "' + word + '"');
      }
    });
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#0a0b14');
        c.strokeStyle = '#3a3f6e'; c.lineWidth = 5;
        c.beginPath(); c.moveTo(70, 380); c.lineTo(210, 380); c.moveTo(140, 380); c.lineTo(140, 120); c.lineTo(250, 120); c.lineTo(250, 155); c.stroke();
        const lost = 6 - s.left;
        c.strokeStyle = '#e8eaf6'; c.lineWidth = 4;
        if (lost >= 1) { c.beginPath(); c.arc(250, 180, 22, 0, 7); c.stroke(); }
        if (lost >= 2) { c.beginPath(); c.moveTo(250, 202); c.lineTo(250, 280); c.stroke(); }
        if (lost >= 3) { c.beginPath(); c.moveTo(250, 220); c.lineTo(218, 250); c.stroke(); }
        if (lost >= 4) { c.beginPath(); c.moveTo(250, 220); c.lineTo(282, 250); c.stroke(); }
        if (lost >= 5) { c.beginPath(); c.moveTo(250, 280); c.lineTo(224, 340); c.stroke(); }
        if (lost >= 6) { c.beginPath(); c.moveTo(250, 280); c.lineTo(276, 340); c.stroke(); }
        c.font = '34px monospace'; c.textAlign = 'center';
        c.fillStyle = '#e8eaf6';
        c.fillText(s.shown.map(v => v || '_').join(' '), W/2 + 30, 420);
        U.txt(c, '❤'.repeat(s.left) || '💀', W/2, 60, 26, '#ff4081');
        for (let i = 0; i < 26; i++) {
          const row = (i / 7) | 0, L = 'abcdefghijklmnopqrstuvwxyz'[i];
          const X = 40 + (i % 7) * 48, Y = 460 + row * 60;
          c.fillStyle = s.used.has(L) ? '#2a2d52' : '#7c4dff';
          c.fillRect(X, Y, 44, 52);
          U.txt(c, L, X + 22, Y + 34, 26, '#fff');
        }
      }
    };
  }
});

ARCADE.add({
  id: 'wordle', emoji: '🟩', name: 'Word Hunt', cat: 'Words', tags: 'tap letters · ⏎ submit',
  desc: 'Guess the 5-letter word in 6 tries (🟩=spot 🟨=else).\n+50 − tries × 5',
  create(env) {
    const words = ['candy','mouse','tiger','spice','blink','chart','drive','eagle','flour','grape','hobby','ivory','jumpy','koala','lucky','mango','noble','orbit','pixel','quilt','robot','solar','tulip','ultra','vivid','widen','xenon','yours','zesty','amber'];
    const word = env.choice(words);
    const s = { word, rows: [], cur: [], tries: 0 };
    const submit = () => {
      if (s.cur.length < 5 || s.rows.includes(s.cur.join(''))) return;
      const g = s.cur.join('');
      s.rows.push(g);
      s.cur = []; s.tries++;
      if (g === word) { env.score(Math.max(10, 50 - (s.tries-1)*5)); return env.over('NAILED IT 🟩 ' + s.tries + ' guesses'); }
      env.score(Math.max(0, 20 - s.tries*2));
      if (s.tries >= 6) return env.over('was "' + word + '" 😵');
    };
    env.needPad(false, true);
    env.anyKey(k => {
      if (k >= 'a' && k <= 'z' && s.cur.length < 5) s.cur.push(k);
      if (k === 'bksp' && s.cur.length) s.cur.pop();
    });
    env.key(k => {
      if (k === 'action') return submit();
      if (k === 'backspace' && s.cur.length) s.cur.pop();
    });
    env.tap((x, y) => {
      if (y < 470) return;
      const row = Math.min(3, Math.floor((y - 470) / 64));
      const i = Math.floor((x - 18) / 64);
      if (row < 0 || row > 3 || i < 0) return;
      if (row <= 2) { const L = 'abcdefghijklmnopqrstu'[row * 7 + i]; if (L && s.cur.length < 5) s.cur.push(L); return; }
      if (i === 5 && s.cur.length) s.cur.pop();
      if (i >= 6) submit();
    });
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#0a0b14');
        for (let r = 0; r < 6; r++) {
          const g = s.rows[r] || (r === s.tries ? s.cur.join('') : '');
          for (let i = 0; i < 5; i++) {
            const X = 105 + i*55, Y = 80 + r*58;
            let col = '#1d2040';
            if (s.rows[r]) {
              if (s.rows[r][i] === word[i]) col = '#4dff88';
              else if (word.includes(s.rows[r][i])) col = '#ffd24d';
            }
            c.fillStyle = col; c.fillRect(X, Y, 50, 50);
            if (g[i]) U.txt(c, g[i], X+25, Y+36, 28, '#fff');
          }
        }
        const kb = 'abcdefghijklmnopqrstu';
        for (let i = 0; i < 21; i++) {
          const X = 18 + (i % 7)*64, Y = 470 + Math.floor(i/7)*64;
          c.fillStyle = '#7c4dff'; c.fillRect(X, Y, 58, 56);
          U.txt(c, kb[i].toUpperCase(), X+29, Y+38, 26, '#fff');
        }
        const Y3 = 598;
        'vwxyz'.split('').forEach((L, i) => {
          const X = 18 + i*64;
          c.fillStyle = '#7c4dff'; c.fillRect(X, Y3, 58, 56);
          U.txt(c, L.toUpperCase(), X+29, Y3+38, 26, '#fff');
        });
        c.fillStyle = '#66144a'; c.fillRect(18 + 5*64, Y3, 58, 56);
        U.txt(c, '⌫', 18 + 5*64 + 29, Y3 + 38, 26, '#fff');
        c.fillStyle = '#0e5c46'; c.fillRect(18 + 7*64, Y3, 58, 56);
        U.txt(c, '⏎', 18 + 7*64 + 29, Y3 + 38, 26, '#fff');
        U.txt(c, 'type or tap letters · ⌫ erase · ⏎ submit', W/2, 700, 14, '#8a8fa8');
      }
    };
  }
});

ARCADE.add({
  id: 'scramble', emoji: '🔤', name: 'Word Scramble', cat: 'Words', tags: 'tap 拼order',
  desc: 'Unscramble 3 words against the clock!\n60s to shine',
  create(env) {
    const bank = ['planet','banana','castle','rocket','wizard','monkey','bridge','ticket','sponge','gardens','owl','mirror','dragon','magnet','cheese','gadget','lantern','bicycle'];
    let left = 60, word = '', letters = [], picked = [], sc = 0, solved = 0, msg = '', buzz = false;
    const next = () => {
      word = env.choice(bank.filter(w => (w.length > 5 ? solved > 2 : true)));
      do { letters = word.split('').sort(() => Math.random() - 0.5); } while (letters.join('') === word && word.length > 1);
      picked = [];
    };
    next();
    env.needPad(false, false);
    env.tap((x, y) => {
      if (buzz) return;
      if (y > 380 && y < 460) {
        const i = Math.floor((x - 20)/56);
        if (i >= 0 && i < letters.length && !picked.includes(i)) picked.push(i);
        if (picked.length === word.length) {
          const g = picked.map(i => letters[i]).join('');
          if (g === word) {
            sc += word.length * 10 + Math.floor(left);
            solved++;
            env.score(sc);
            msg = '✔ ' + word.toUpperCase();
            setTimeout(() => { msg = ''; next(); }, 700);
          } else { buzz = true; msg = ''; picked = []; setTimeout(() => buzz = false, 220); }
        }
      }
    });
    return {
      update(t, dt) {
        left -= dt;
        if (left <= 0) return env.over(solved + ' solved');
      },
      draw(c) {
        U.bg(c, '#0a0b14');
        U.txt(c, buzz ? 'BUZZ ❌' : msg, W/2, 300, 26, buzz ? '#ff4081' : '#4dff88');
        picked.forEach((i, j) => { c.fillStyle = '#7c4dff'; c.fillRect(120 + j*56, 200, 50, 56); U.txt(c, letters[i], 145 + j*56, 240, 34, '#fff'); });
        letters.forEach((L, i) => { c.fillStyle = buzz ? '#200a14' : '#1d2040'; c.fillRect(20 + i*56, 400, 50, 56); U.txt(c, L, 45 + i*56, 440, 34, '#8a8fa8'); });
        U.txt(c, '⏳ ' + Math.max(0, Math.ceil(left)) + 's · solved ' + solved, W/2, 60, 24, '#fff');
        U.txt(c, 'SCORE ' + sc, W/2, 100, 20, '#ffd24d');
      }
    };
  }
});

ARCADE.add({
  id: 'pigdice', emoji: '🐖', name: 'Pig Dice', cat: 'Board', tags: 'tap roll · tap bank',
  desc: 'Race the bot to 100! Roll for pot, but roll a ⚄ and lose the batch.\nBank with ↓ or right tap',
  create(env) {
    const s = { me: 0, bot: 0, pot: 0, turn: 'me', msg: 'Your turn: tap ROLL' };
    env.needPad(true, true);
    const roll = () => 1 + env.iri(6);
    const bank = () => {
      if (s.turn !== 'me') return;
      s.me += s.pot; s.pot = 0;
      env.score(s.me);
      if (s.me >= 100) return env.over('PIG WINS! 🐖 +50');
      s.msg = 'You banked. Bot\'s turn…';
      s.turn = 'bot';
      setTimeout(botTurn, 450);
    };
    const doRoll = () => {
      if (s.turn !== 'me') return;
      const r = roll();
      if (r === 1) {
        s.pot = 0; s.msg = 'You rolled ⚄! Bot\'s turn…'; s.turn = 'bot';
        setTimeout(botTurn, 450);
      } else {
        s.pot += r;
        s.msg = '+ ' + r + ' → pot ' + s.pot + ' (bank? ↓)';
      }
    };
    const botTurn = () => {
      if (s.bot >= 100 || s.me >= 100) return;
      let bp = 0, rolls = 0;
      const go = () => {
        if (over) return;
        if (s.turn === 'me') return;
        const r = roll();
        if (r === 1) {
          bp = 0; s.msg = 'Bot rolled ⚄! Your turn 🐖'; s.turn = 'me';
          return;
        }
        bp += r; rolls++;
        if (bp >= 20 || rolls >= 4) {
          s.bot += bp;
          if (s.bot >= 100) return env.over('Bot wins 😵 (you: ' + s.me + ')');
          s.msg = 'Bot banked ' + bp + '. Your 🏦 turn pig!';
          s.turn = 'me';
          return;
        }
        setTimeout(go, 380);
      };
      go();
    };
    let over = false;
    const _over = env.over;
    env.over = m => { over = true; _over(m); };
    env.key(k => {
      if (k === 'action' && s.turn === 'me') doRoll();
      if (k === 'down') bank();
    });
    env.tap((x, y) => {
      if (x < W/2) doRoll(); else bank();
    });
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#0a0b14');
        U.txt(c, 'YOU ' + s.me + ' — BOT ' + s.bot, W/2, 80, 26, '#fff');
        c.fillStyle = '#fff'; c.fillRect(W/2-50, 200, 100, 100);
        c.fillStyle = '#111';
        U.txt(c, s.turn === 'me' ? '👤 YOUR TURN' : '🤖 BOT …', W/2, 350, 22, '#4dd6ff');
        U.txt(c, s.msg, W/2, 400, 19, '#ffd24d');
        U.txt(c, 'POT: ' + s.pot, W/2, 470, 30, '#4dff88');
        U.txt(c, 'ROLL (tap left / ⏎) · BANK (tap right / ↓)', W/2, 560, 16, '#8a8fa8');
        c.fillStyle = '#1a1c3a';
        c.fillRect(40, 600, 180, 70);
        c.fillStyle = '#241a33';
        c.fillRect(260, 600, 180, 70);
        U.txt(c, '🎲 ROLL', 130, 640, 20, '#4dff88');
        U.txt(c, '🏦 BANK', 350, 640, 20, '#ffd24d');
      }
    };
  }
});

ARCADE.add({
  id: 'hilow', emoji: '🃏', name: 'Hi-Lo Streak', cat: 'Board', tags: 'tap ↑ or ↓',
  desc: 'Guess if next card is higher or lower. Build streaks!\n+10 per correct',
  create(env) {
    const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    const val = r => ranks.indexOf(r);
    let card = env.choice(ranks), sc = 0, lives = 3;
    env.needPad(false, false);
    const guess = () => {
      if (lives <= 0) return;
      const k2 = guess.k; if (!k2) return;
      guess.k = null;
      const next = env.choice(ranks);
      const hi = val(next) > val(card), lo = val(next) < val(card), eq = val(next) === val(card);
      const good = (k2 === 'up' && (hi || eq)) || (k2 === 'down' && (lo || eq));
      if (eq) sc += 5; else if (good) sc += 10; else { lives--; sc = 0; }
      card = next;
      env.score(sc);
      if (lives <= 0) return env.over('Streak broken 😵');
    };
    env.key(k => { if (k === 'up' || k === 'down') { guess.k = k; guess(); } });
    env.tap((x, y) => {
      if (y > 400 && y < 520) guess.k = x < W/2 ? 'up' : 'down';
      guess();
    });
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#0a0b14');
        c.fillStyle = '#fff'; c.fillRect(W/2-70, 180, 140, 180);
        c.fillStyle = '#111'; c.fillRect(W/2-70, 180, 140, 20);
        U.txt(c, card, W/2, 290, 60, '#c00');
        U.txt(c, '↑ or ↓  · ❤'.repeat(0), W/2, 100, 24, '#fff');
        U.txt(c, '❤'.repeat(lives), W/2, 420, 24, '#ff4081');
        U.txt(c, '▲', W/4, 460, 50, '#4dff88');
        U.txt(c, '▼', W*3/4, 460, 50, '#ff4081');
      }
    };
  }
});
})();
