(() => {
const U = ARCADE.utils, W = 480, H = 720;
const SUITS = ['♠','♥','♦','♣'], RN = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const deck = () => SUITS.flatMap(s => RN.map(r => ({s, r}))).sort(() => Math.random() - 0.5);

ARCADE.add({
  id: 'blackjack', emoji: '♠️', name: 'Blackjack 21', cat: 'Cards', tags: 'HIT / STAND',
  desc: 'Beat the dealer without busting. 21 pays 2.5×!\nScore: chips',
  create(env) {
    let d = deck(), p = [], dHide = null, dShow = null, phase = 'bet', chips = 100, last = '';
    const by = h => {
      let t = 0, aces = 0;
      for (const c of h) {
        if (['10','J','Q','K'].includes(c.r)) t += 10;
        else if (c.r === 'A') { t += 11; aces++; }
        else t += +c.r;
      }
      while (aces-- > 0 && t > 21) t -= 10;
      return t;
    };
    const finish = winy => {
      const pt = by(p), dt = by(dHide);
      if (winy === undefined) {
        if (pt > 21) winy = false;
        else if (dt > 21) winy = true;
        else winy = pt > dt;
      }
      if (winy) { chips += (pt === 21 && p.length === 2) ? 35 : 20; last = 'YOU WIN 💰'; }
      else if (!winy && pt === dt && pt <= 21) { chips += 10; last = 'push 🔁'; }
      else last = 'dealer wins';
      env.score(chips);
      if (chips < 10) { phase = 'end'; return env.over('BANKRUPT 💸 ' + chips); }
      setTimeout(() => { phase = 'bet'; p = []; dHide = null; dShow = null; last = ''; }, 1300);
    };
    env.needPad(false, false);
    env.tap((x, y) => {
      if (phase === 'bet' && x > 140 && x < 340 && y > 260 && y < 340) {
        chips -= 10; d = deck();
        p = [d.pop(), d.pop()];
        dHide = [d.pop(), d.pop()];
        phase = 'play';
        if (by(p) === 21) return finish(true);
        return;
      }
      if (phase !== 'play') return;
      if (y < 520) return;
      if (x < W/2) {
        p.push(d.pop());
        if (by(p) > 21) { dShow = dHide; phase = 'end'; return finish(); }
        if (by(p) === 21) { dShow = dHide; phase = 'end'; return finish(true); }
      } else {
        dShow = dHide;
        while (by(dHide) < 17) dHide.push(d.pop());
        phase = 'end';
        finish();
      }
    });
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#07230f');
        if (dHide) {
          dHide.forEach((cd, i) => {
            const hide = phase === 'play' && i === 1;
            c.fillStyle = '#fff'; c.fillRect(40 + i*46, 60, 80, 110);
            U.txt(c, hide ? '🂠' : cd.r + cd.s, 80 + i*46, 118, 20, '♥♦'.includes(cd.s) ? '#c00' : '#111');
          });
          U.txt(c, 'dealer ' + (phase === 'play' ? '?' : by(dHide)), 90, 190, 18, '#8a8fa8');
        }
        p.forEach((cd, i) => {
          c.fillStyle = '#fff'; c.fillRect(40 + i*46, 300, 80, 110);
          U.txt(c, cd.r + cd.s, 80 + i*46, 358, 20, '♥♦'.includes(cd.s) ? '#c00' : '#111');
        });
        if (p.length) U.txt(c, 'you ' + by(p), 90, 440, 18, '#8a8fa8');
        if (phase === 'play') {
          U.txt(c, 'HIT', 130, 610, 32, '#4dff88');
          U.txt(c, 'STAND', 330, 610, 32, '#ff4081');
        } else if (phase === 'bet') {
          c.fillStyle = '#ffd24d'; c.fillRect(140, 260, 200, 80);
          U.txt(c, 'DEAL −10', 240, 312, 28, '#111');
        }
        U.txt(c, 'CHIPS ' + chips, W/2, 24, 26, '#ffd24d');
        if (last) U.txt(c, last, W/2, 700, 22, '#8a8fa8');
      }
    };
  }
});

ARCADE.add({
  id: 'war', emoji: '⚔️', name: 'Cards War', cat: 'Cards', tags: 'tap deck',
  desc: 'Higher card takes the pile. Lose 3 times = done.',
  create(env) {
    let mine = deck(), theirs = deck(), flipped = null, flipped2 = null, lives = 3;
    env.needPad(false, false);
    env.tap(() => {
      if (lives <= 0) return;
      const a = mine.pop(), b = theirs.pop();
      flipped = a; flipped2 = b;
      const va = RN.indexOf(a.r), vb = RN.indexOf(b.r);
      if (va > vb) { streak(); }
      else if (va < vb) { hearts(); }
      if (mine.length === 0 || theirs.length === 0) { mine = deck(); theirs = deck(); }
    });
    let sc = 0, streakN = 0;
    const streak = () => { streakN++; sc += 10 * streakN; env.score(sc); };
    const hearts = () => { lives--; streakN = 0; if (lives <= 0) { env.score(sc); return env.over('War lost 😵 ' + sc + ' pts'); } };
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#0a0b14');
        c.fillStyle = '#fff';
        c.fillRect(60, 200, 100, 140);
        c.fillRect(W-160, 200, 100, 140);
        if (flipped) {
          U.txt(c, flipped.r + flipped.s, 110, 260, 30, '♥♦'.includes(flipped.s) ? '#c00' : '#111');
        }
        if (flipped2) U.txt(c, flipped2.r + flipped2.s, W-110, 260, 30, '♥♦'.includes(flipped2.s) ? '#c00' : '#111');
        U.txt(c, 'win streak ' + streakN + ' · ' + sc, W/2, 100, 22, '#fff');
        U.txt(c, 'tap to flip! ❤'.repeat(0), W/2, 420, 18, '#8a8fa8');
        U.txt(c, '❤'.repeat(Math.max(0, lives)), W/2, 600, 26, '#ff4081');
      }
    };
  }
});

ARCADE.add({
  id: 'poker', emoji: '🃏', name: 'Draw Poker', cat: 'Cards', tags: 'tap to HOLD · deal',
  desc: 'Five-card draw. Keep the winners, swap the rest.\nChips by hand rank',
  create(env) {
    let chips = 100, hand = [], hold = [0,0,0,0,0], phase = 'bet', s = {};
    const start = () => { hand = []; const dk = deck(); for (let i = 0; i < 5; i++) hand.push(dk.pop()); phase = 'hold'; hold = hand.map(() => 0); };
    const rank = h => {
      const vs = h.map(c => RN.indexOf(c.r)).sort((a, b) => a - b);
      const flush = new Set(h.map(c => c.s)).size === 1;
      let straight = vs.every((v, i) => i === 0 || v === vs[i-1] + 1);
      if (!straight && (vs.join() === '0,9,10,11,12')) straight = true;
      const cnt = {};
      vs.forEach(v => cnt[v] = (cnt[v] || 0) + 1);
      const vals = Object.values(cnt).sort((a, b) => b - a);
      if (flush && straight) return vs[4] === 12 && vs[0] === 0 ? 250 : 60;
      if (vals[0] === 4) return 25;
      if (vals[0] === 3 && vals[1] === 2) return 12;
      if (flush) return 9;
      if (straight) return 6;
      if (vals[0] === 3) return 5;
      if (vals[0] === 2 && vals[1] === 2) return 3;
      if (vals[0] === 2) {
        const pairR = +(Object.keys(cnt).find(k => cnt[k] === 2));
        return pairR >= 9 ? 2 : 0;
      }
      return 0;
    };
    start();
    env.needPad(false, false);
    env.tap((x, y) => {
      if (phase === 'hold' && y > 380 && y < 500) {
        const i = Math.floor((x - 50)/76);
        if (i >= 0 && i < 5) { hold[i] = 1 - hold[i]; return; }
      }
      if (phase === 'bet') { chips -= 5; phase = 'hold'; start(); return; }
      if (y > 560 && y < 660 && phase === 'hold') {
        if (x < W/2) {
          env.score(chips);
        } else {
          const dk = deck();
          hand = hand.map((c, i) => hold[i] ? c : dk.pop());
          const r = rank(hand);
          chips += r;
          env.score(chips);
          s.last = r > 0 ? 'paid +' + r : 'no pay';
          phase = 'bet';
        }
      }
      if (phase === 'bet' && chips < 5) { env.over('No chips left 💸'); }
    });
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#0a1a14');
        hand.forEach((cd, i) => {
          c.fillStyle = '#fff'; c.fillRect(50+i*76, 380, 70, 100);
          U.txt(c, cd.r+cd.s, 85+i*76, 440, 20, '♥♦'.includes(cd.s) ? '#c00' : '#111');
          if (phase === 'hold' && hold[i]) { c.fillStyle = '#ffd24d'; c.fillRect(50+i*76, 480, 70, 20); U.txt(c, 'HOLD', 85+i*76, 496, 14, '#111'); }
        });
        c.fillStyle = '#4dff88'; c.fillRect(50, 560, 175, 100);
        c.fillStyle = '#ff4081'; c.fillRect(250, 560, 175, 100);
        U.txt(c, phase === 'bet' ? 'BET −5' : 'DEAL', 137, 630, 30, '#111');
        U.txt(c, 'SWAP', 340, 630, 30, '#111');
        U.txt(c, 'chips ' + chips, W/2, 60, 30, '#ffd24d');
        if (s.last) U.txt(c, s.last, W/2, 720, 20, '#8a8fa8');
      }
    };
  }
});

ARCADE.add({
  id: 'crazy', emoji: '🎭', name: 'Crazy Eights', cat: 'Cards', tags: 'tap cards',
  desc: 'Match suit or rank, drop your 8s to switch suits!\nWin: 120',
  create(env) {
    let d = deck(), mine = [], bot = [], pile = [], curSuit = 0, turn = 'me', st = 0;
    for (let i = 0; i < 7; i++) { mine.push(d.pop()); bot.push(d.pop()); }
    pile = d.pop();
    env.needPad(false, false);
    env.tap((x, y) => {
      if (turn !== 'me') return;
      if (y > 560 && y < 700) {
        const i = Math.floor((x - 15)/76);
        if (i < 0 || i >= mine.length) return;
        const cd = mine[i];
        if (cd.r === '8') { curSuit = SUITS.indexOf(cd.s); } else if (cd.r === pile.r || cd.s === SUITS[curSuit]) { curSuit = SUITS.indexOf(cd.s); } else { return; }
        mine.splice(i, 1); pile = cd;
        env.score(streak());
        if (!mine.length) return env.over('EMPTY! 🎉 +50');
        turn = 'bot'; setTimeout(botPlay, 600);
        return;
      }
      if (y > 420 && y < 520) {
        const cd = d.pop();
        mine.push(cd);
        turn = 'bot'; setTimeout(botPlay, 600);
        return;
      }
    });
    function streak() { return mine.length ? mine.length * 5 : 50; }
    const botPlay = () => {
      const play = bot.findIndex(cd => cd.r === pile.r || cd.r === '8' || cd.s === SUITS[curSuit]);
      if (play >= 0) {
        const cd = bot.splice(play, 1)[0];
        if (cd.r === '8') curSuit = SUITS.indexOf(env.choice(SUITS));
        pile = cd;
        if (!bot.length) return env.over('Bot emptied first 😵');
      } else if (d.length) bot.push(d.pop());
      turn = 'me';
      const playable = cd => cd.r === pile.r || (cd.r !== '8' && cd.s === SUITS[curSuit]);
      if (!d.length && !mine.some(playable) && !bot.some(playable)) return env.over('Deadlock — draw 🎭');
    };
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#101425');
        c.fillStyle = '#e8eaf6'; c.fillRect(W/2-45, 180, 90, 126);
        U.txt(c, pile.r + pile.s, W/2-20, 250, 30, '♥♦'.includes(pile.s) ? '#c00' : '#111');
        U.txt(c, 'suit: ' + SUITS[curSuit], W/2, 150, 22, '#8a8fa8');
        mine.forEach((cd, i) => {
          c.fillStyle = '#fff'; c.fillRect(15 + i*76, 560, 70, 100);
          U.txt(c, cd.r+cd.s, 50 + i*76, 625, 20, '♥♦'.includes(cd.s) ? '#c00' : '#111');
        });
        U.txt(c, 'draw pile ↓ ' + d.length, W/2, 470, 20, d.length ? '#4dd6ff' : '#ff4081');
        U.txt(c, 'bot: ' + bot.length, W/2, 60, 24, '#fff');
      }
    };
  }
});

ARCADE.add({
  id: 'az', emoji: '🅰️', name: 'A-Z Hunt', cat: 'Words', tags: 'tap A then B then C…',
  desc: 'Tear through the alphabet in order!\nScore: time saved × 10',
  create(env) {
    const s = { need: 'a', t: 0, spots: Array.from({length: 26}, (_, i) => ({ ch: String.fromCharCode(97 + i), x: 40 + env.rand(400), y: 40 + env.rand(640) })) };
    env.needPad(false, false);
    env.tap((x, y) => {
      const i = s.need.charCodeAt(0) - 97;
      if (Math.hypot(s.spots[i].x - x, s.spots[i].y - y) < 40) { s.spots[i] = { x: -99, y: -99 }; s.need = String.fromCharCode(s.need.charCodeAt(0) + 1); }
    });
    return {
      update(t, dt) {
        s.t += dt;
        if (s.need > 'z') { s.spent = s.t; env.score(Math.max(50, 260 - Math.floor(s.t*10))); return env.over('ALPHABET SMASHED 🎉'); }
        if (t2()) {}
        function t2() { return false; }
      },
      draw(c) {
        U.bg(c, '#0a0b14');
        s.spots.forEach(sp => {
          if (sp.x < 0) return;
          c.fillStyle = '#7c4dff'; c.beginPath(); c.arc(sp.x, sp.y, 28, 0, 7); c.fill();
          U.txt(c, sp.ch, sp.x, sp.y + 9, 30, '#fff');
        });
        U.txt(c, 'find: ' + s.need.toUpperCase() + ' · ' + s.t.toFixed(1) + 's', W/2, 720, 22, '#fff');
      }
    };
  }
});

ARCADE.add({
  id: 'rps', emoji: '✂️', name: 'RockPaperSlash', cat: 'Cards', tags: 'tap ✊✋✌',
  desc: 'Bot studies your habits! Streaks score ×10.',
  create(env) {
    const s = { sc: 0, streak: 0, msg: '', mine: null, bot: null, stats: [0,0,0] };
    env.needPad(false, false);
    env.tap((x, y) => {
      const i = y > 200 && y < 320 ? Math.floor((x - 30)/145) : -1;
      if (i < 0 || i > 2) return;
      s.mine = i;
      s.stats[i]++;
      let predict = Math.max(...s.stats);
      let bi = env.iri(3);
      if (s.stats[0] + s.stats[1] + s.stats[2] > 4) {
        const li = predict === s.stats[0] ? 1 : Bi();
        function Bi() { return predict === s.stats[1] ? 2 : 0; }
        bi = (li + 1) % 3;
      }
      s.bot = bi;
      if (i === bi) { s.msg = 'tie 😐'; }
      else if ((i + 1) % 3 === bi) { s.streak++; s.sc += 10 + (s.streak > 1 ? 5 : 0); s.msg = 'win! ⚡'; }
      else { if (s.streak >= 3) { s.sc += s.streak * 10; s.msg = 'streak banked 🔥'; } s.streak = 0; s.msg = 'lost 💔'; }
      env.score(s.sc);
    });
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#0a0b14');
        ['✊','✋','✌️'].forEach((e, i) => { c.fillStyle = '#1d2040'; c.fillRect(30 + i*145, 200, 140, 120); c.font = '60px serif'; c.textAlign = 'center'; c.fillText(e, 100 + i*145, 290); });
        U.txt(c, s.mine !== null ? 'you: ' + ['✊','✋','✌️'][s.mine] : '', W/2, 380, 28, '#4dff88');
        U.txt(c, s.bot !== null ? 'bot: ' + ['✊','✋','✌️'][s.bot] : '', W/2, 430, 28, '#ff4081');
        if (s.msg) U.txt(c, s.msg, W/2, 500, 26, '#ffd24d');
        U.txt(c, 'streak ' + s.streak + ' · ' + s.sc, W/2, 100, 24, '#fff');
      }
    };
  }
});

ARCADE.add({
  id: 'cointoss', emoji: '🪙', name: 'Coin Quest', cat: 'Cards', tags: 'tap call · TAP bank',
  desc: 'Call heads/tails and RIDE the streak — bank before tails!\n+streak×10',
  create(env) {
    const s = { pot: 0, sc: 0, phase: 'call', last: '', streak: 0 };
    env.needPad(false, true);
    const coin = () => env.iri(2);
    function bank() {
      s.sc += s.pot; s.pot = 0; s.phase = 'call'; s.last = 'banked! 🔒';
      env.score(s.sc);
    }
    env.key(k => { if (k === 'action' && s.phase === 'ride') bank(); });
    env.tap((x, y) => {
      if (s.phase === 'call') {
        const call = x < W/2 ? 0 : 1;
        const got = coin();
        if (got === call) { s.pot += 10; s.streak++; s.phase = 'ride'; s.last = ['heads','tails'][got] + ' ✔ +10 pot'; env.score(s.sc); }
        else { if (s.streak >= 3) s.sc += s.streak*10; s.streak = 0; s.pot = 0; s.phase = 'call'; s.last = ['heads','tails'][got] + ' ✘ streak reset'; }
      } else if (s.phase === 'ride') {
        if (x < W/2) {
          const got = coin();
          if (got === 0) { s.pot += 10; s.streak++; s.last = 'heads rides again ✔ pot ' + s.pot; }
          else { if (s.streak >= 3) s.sc += s.streak*10; s.streak = 0; s.pot = 0; s.phase = 'call'; s.last = 'TAILS! 💀 pot gone'; }
          env.score(s.sc);
        } else bank();
      }
    });
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#12102a');
        U.txt(c, s.phase === 'call' ? 'CALL IT!' : 'STREAK ' + s.streak + ' — ride or TAP bank?', W/2, 90, 22, '#fff');
        c.fillStyle = '#ffd24d'; c.beginPath(); c.arc(W/2, 300, 90, 0, 7); c.fill();
        if (s.phase === 'ride') { c.fillStyle = '#12102a'; c.font = '60px serif'; c.textAlign = 'center'; c.fillText('🪙', W/2, 320); }
        U.txt(c, 'HEADS', W/4, 300, 30, '#4dff88');
        U.txt(c, 'TAILS', W*3/4, 300, 30, '#ff4081');
        U.txt(c, s.phase === 'call' ? 'tap HEADS / TAILS to call the flip' : 'TAP left = flip again · right btn/bank = bank', W/2, 480, 16, '#8a8fa8');
        c.fillStyle = '#4dff88'; c.fillRect(30, 600, 180, 80);
        c.fillStyle = '#ff4081'; c.fillRect(W-210, 600, 180, 80);
        U.txt(c, s.phase === 'call' ? 'HEADS' : s.phase === 'ride' ? 'FLIP' : '', 120, 650, 26, '#050a1a');
        U.txt(c, s.phase === 'call' ? 'TAILS' : s.phase === 'ride' ? 'BANK' : '', W-120, 650, 26, '#050a1a');
        U.txt(c, 'pot ' + s.pot + ' · banked ' + s.sc, W/2, 420, 24, '#ffd24d');
        if (s.last) U.txt(c, s.last, W/2, 545, 20, '#8a8fa8');
      }
    };
  }
});

ARCADE.add({
  id: 'bingo', emoji: '🎱', name: 'Bingo Rush', cat: 'Cards', tags: 'tap numbers',
  desc: 'Tap called numbers before they fly away. Lines score!\nCareful: wrong tap −5',
  create(env) {
    const s = { card: Array.from({length: 4}, () => Array.from({length: 4}, (_, j) => j === 0 ? (i => 0)() : 0)), sc: 0, lines: 0, called: 0, num: 0, timer: 0 };
    const pool = [];
    for (let r = 1; r <= 40; r++) pool.push(r);
    const nums = pool.sort(() => Math.random() - 0.5).slice(0, 16);
    s.card = [[], [], [], []];
    nums.forEach((n, i) => s.card[(i/4)|0][i%4] = n);
    s.num = 1 + env.iri(40);
    env.needPad(false, false);
    env.tap((x, y) => {
      const col = Math.floor((x - 60)/90), row = Math.floor((y - 140)/90);
      if (col < 0 || col > 3 || row < 0 || row > 3) return;
      if (s.card[row][col] !== s.num) { s.sc = Math.max(0, s.sc - 5); env.score(s.sc); return; }
      s.card[row][col] = -1;
      s.sc += 10;
      for (let r = 0; r < 4; r++) {
        if (s.card[r].every(v => v === -1)) { s.lines++; s.sc += 50; s.card[r] = [-2,-2,-2,-2]; }
      }
      for (let c2 = 0; c2 < 4; c2++) {
        if (s.card.every(row2 => row2[c2] === -1)) { s.lines++; s.sc += 50; s.card.forEach(row2 => row2[c2] = -2); }
      }
      env.score(s.sc);
      if (s.lines >= 3) { env.score(s.sc + 40); return env.over('3 LINES! 🎉 +40'); }
      if (s.card.flat().every(v => v !== -1) && s.lines < 3) {
        return env.over('Out of plays 😵 ' + s.sc + ' pts');
      }
    });
    return {
      update(t, dt) {
        s.timer += dt;
        if (s.timer > 2.4) {
          s.timer = 0;
          s.num = 1 + env.iri(40);
        }
      },
      draw(c) {
        U.bg(c, '#0a0b14');
        for (let r = 0; r < 4; r++) for (let col = 0; col < 4; col++) {
          const v = s.card[r][col];
          c.fillStyle = v < 0 ? '#123a2a' : '#1d2040';
          c.fillRect(60 + col*90, 140 + r*90, 84, 84);
          if (v < 0) U.txt(c, '✔', 60 + col*90 + 42, 140 + r*90 + 52, 30, '#4dff88');
          else if (v > 0) U.txt(c, v, 60 + col*90 + 42, 140 + r*90 + 52, 36, '#fff');
        }
        c.fillStyle = '#ff4081'; c.fillRect(W/2-80, 620, 160, 80);
        U.txt(c, s.num, W/2, 675, 48, '#fff');
        U.txt(c, s.sc + ' · lines ' + s.lines, W/2, 60, 24, '#fff');
      }
    };
  }
});
})();
