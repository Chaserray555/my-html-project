(() => {
const U = ARCADE.utils, W = 480, H = 720;

ARCADE.add({
  id: 'archery', emoji: '🏹', name: 'Archery Range', cat: 'Sports', tags: 'tap when aligned',
  desc: 'Tap when the crosshair meets the bullseye track. Wind drifts!',
  create(env) {
    const s = { ty: 130, tyv: 120, wind: 0, ax: 240, shots: 0, sc: 0 };
    const reset = () => { s.ty = 100 + env.rand(500); s.tyv = 90 + s.shots*14 + env.rand(60); s.wind = (Math.random() < 0.5 ? -1 : 1) * env.rand(40 + s.shots*15); s.ax = 60; };
    reset();
    env.needPad(false, true);
    env.tap(() => {
      if (s.shots >= 10) return;
      const d = Math.abs(s.ty - (s.ax + s.wind*0.6));
      const pts = d < 14 ? 10 : d < 30 ? 7 : d < 46 ? 5 : d < 60 ? 2 : 0;
      s.sc += pts; env.score(s.sc);
      s.fx = { y: s.ty, pts, life: 0.8 };
      s.shots++;
      if (s.shots >= 10) { env.score(s.sc + (s.sc >= 80 ? 30 : 0)); return env.over('Quiver empty — ' + s.sc + ' pts'); }
      reset();
    });
    return {
      update(t, dt) {
        s.ty += s.tyv*dt;
        if (s.ty < 60 || s.ty > 660) s.tyv *= -1;
        if (s.fx) { s.fx.life -= dt; if (s.fx.life <= 0) s.fx = null; }
      },
      draw(c) {
        U.bg(c, '#0a1420');
        c.fillStyle = '#2a4d3a';
        c.fillRect(30, 0, 60, H);
        for (let i = 0; i < 5; i++) {
          c.fillStyle = ['#e8eaf6','#ff4081','#ffd24d','#ff4081','#e8eaf6'][i];
          c.beginPath(); c.arc(60, s.ty, 62 - i*14, 0, 7); c.fill();
        }
        const cx = Math.max(90, Math.min(W-30, s.ax + s.wind*0.6));
        c.strokeStyle = '#4dff88'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(cx-16, s.ty); c.lineTo(cx+16, s.ty); c.moveTo(cx, s.ty-16); c.lineTo(cx, s.ty+16); c.stroke();
        U.txt(c, 'wind ' + (s.wind > 0 ? '→' : '←') + Math.abs(s.wind/10).toFixed(1), 120, 700, 18, '#8a8fa8', 'left');
        if (s.fx) U.txt(c, '+' + s.fx.pts, cx + 40, s.fx.y, 30, '#ffd24d');
        U.txt(c, s.sc, W/2, 46, 30, '#fff');
      }
    };
  }
});

ARCADE.add({
  id: 'darts', emoji: '🎯', name: 'Dart Time', cat: 'Sports', tags: 'tap power as sweep hits',
  desc: 'Stop the sweep on the bullseye, both axes. 3 darts left',
  create(env) {
    const s = { ax: 0, ay: 0, vx: 190, vy: 230, phase: 0, sc: 0, darts: 6, mark: null };
    env.needPad(false, true);
    env.tap(() => {
      if (s.darts <= 0) return;
      if (s.phase === 0) { s.phase = 1; s.mx = s.ax; }
      else {
        s.darts--;
        const d = Math.hypot(s.mx - 240, s.ay - 240);
        const pts = d < 16 ? 15 : d < 40 ? 10 : d < 70 ? 5 : d < 100 ? 2 : 1;
        s.sc += pts; env.score(s.sc);
        s.mark = { x: s.mx, y: s.ay, life: 1 };
        s.phase = 0;
        if (!s.darts) { s.darts = 6; s.rounds = (s.rounds || 0) + 1; if (s.rounds >= 4) { env.score(s.sc + 20); return env.over('180!!! ' + s.sc + ' pts'); } }
      }
    });
    return {
      update(t, dt) {
        if (s.phase === 0) s.ax += s.vx*dt, (s.ax > 420 || s.ax < 60) && (s.vx *= -1);
        if (s.phase === 1) s.ay += s.vy*dt, (s.ay > 420 || s.ay < 60) && (s.vy *= -1);
        if (s.mark && (s.mark.life -= dt) <= 0) s.mark = null;
      },
      draw(c) {
        U.bg(c, '#100a14');
        for (let i = 0; i < 4; i++) {
          c.strokeStyle = '#7c4dff'; c.lineWidth = 1;
          c.beginPath(); c.arc(240, 240, (i+1)*26, 0, 7); c.stroke();
        }
        c.fillStyle = '#ff4081'; c.beginPath(); c.arc(240, 240, 12, 0, 7); c.fill();
        c.strokeStyle = '#4dff88'; c.lineWidth = 3;
        if (s.phase === 0) { c.beginPath(); c.moveTo(s.ax, 40); c.lineTo(s.ax, 440); c.stroke(); }
        else { c.beginPath(); c.moveTo(40, s.ay); c.lineTo(440, s.ay); c.stroke(); c.strokeStyle = '#ffd24d'; c.beginPath(); c.arc(s.mx, s.ay, 8, 0, 7); c.stroke(); }
        if (s.mark) { c.fillStyle = '#fff'; c.fillRect(s.mark.x-3, s.mark.y-10, 5, 18); }
        U.txt(c, s.sc + ' · ' + s.darts + ' darts', W/2, 690, 22, '#fff');
      }
    };
  }
});

ARCADE.add({
  id: 'hoops', emoji: '🏀', name: 'Net Buzzer', cat: 'Sports', tags: 'tap to time the shot',
  desc: 'Stop the meter in the sweet zone while the hoop slides!',
  create(env) {
    const s = { power: 0, dir: 1, hoopX: 0, hoopV: 130, hoopY: 150, sc: 0, made: 0, tries: 0, ballY: 560, fly: null };
    const reset = () => { s.power = 0; s.dir = 1; s.hoopX = 60 + env.rand(280); s.hoopV = 110 + s.made*16; s.fly = null; };
    reset();
    env.needPad(false, true);
    env.tap(() => {
      if (s.fly) { s.fly = null; reset(); return; }
      const ideal = 200 + (s.hoopX/360)*120;
      const err = Math.abs(s.power - ideal);
      s.tries++;
      if (err < 18) { s.sc += err < 8 ? 3 : 2; env.score(s.sc); s.made++; s.result = 'SWISH! 🏀'; }
      else if (err < 42) { s.sc += 1; env.score(s.sc); s.result = 'rimmed out'; }
      else s.result = 'air ball 😬';
      s.fly = { p: 0, mode: s.result };
      if (s.made >= 12) { env.score(s.sc * 10); return env.over('BUZZER HOT SHOOTER 🏀 ' + s.made + '/12'); }
      setTimeout(() => { s.fly = null; reset(); }, 1200);
    });
    return {
      update(t, dt) {
        s.power += s.dir * 260*dt;
        if (s.power > 380) { s.power = 380; s.dir = -1; }
        if (s.power < 0) { s.power = 0; s.dir = 1; }
        if (!s.fly) {
          s.hoopX += s.hoopV*dt;
          if (s.hoopX < 40 || s.hoopX > 300) s.hoopV *= -1;
          s.hoopX = Math.max(40, Math.min(300, s.hoopX));
        } else s.fly.p += dt/0.8;
      },
      draw(c) {
        U.bg(c, '#0a0b20');
        c.fillStyle = '#22133a'; c.fillRect(0, s.hoopY, 90, 56);
        c.strokeStyle = '#ffd24d'; c.lineWidth = 4;
        c.beginPath(); c.arc(s.hoopX + 45, s.hoopY + 60, 36, 0, Math.PI); c.stroke();
        c.fillStyle = '#ff4081'; c.fillRect(s.hoopX + 41, s.hoopY + 58, 8, 6);
        c.fillStyle = '#12142a'; c.fillRect(40, 500, 400, 40);
        const sweet = 200 + (s.hoopX/360)*120;
        c.fillStyle = '#ffd24d'; c.fillRect(40 + sweet - 16, 500, 32, 40);
        c.fillStyle = '#fff'; c.fillRect(40 + s.power - 4, 492, 8, 56);
        if (s.fly) {
          const prog = Math.min(1, s.fly.p);
          const BX = 240 + (s.hoopX + 45 - 240)*prog, BY = 560 - prog*350;
          c.fillStyle = '#ffd24d'; c.beginPath(); c.arc(BX, BY, 16, 0, 7); c.fill();
          if (prog >= 1) U.txt(c, s.fly.mode, W/2, 400, 30, '#fff');
        } else {
          c.fillStyle = '#ffd24d'; c.beginPath(); c.arc(240, 566, 18, 0, 7); c.fill();
        }
        U.txt(c, s.made + '/12 · score ' + s.sc, W/2, 40, 22, '#fff');
      }
    };
  }
});

ARCADE.add({
  id: 'golf', emoji: '⛳', name: 'Windswept Golf', cat: 'Sports', tags: 'tap to set power',
  desc: 'Drive to the hole in as few strokes as possible. Mind the wind!',
  create(env) {
    const s = { ball: 40, hole: 0, wind: 0, power: 0, dir: 1, sc: 0, strokes: 0, fly: null, holes: 0 };
    const gen = () => { s.hole = 110 + env.rand(320); s.wind = (Math.random() < 0.5 ? -1 : 1)*(4 + env.rand(24)); s.hill = env.iri(4); };
    gen();
    env.needPad(false, true);
    env.tap(() => {
      if (s.fly) return;
      s.strokes++;
      const v = s.power * 46 - s.hill * 120;
      const drag = -s.wind * 1.4;
      s.fly = { p: 0, v: Math.max(60, v + drag*2) , wind: s.wind, lift: 1 - s.power/130 };
    });
    const settle = () => {
      const land = Math.max(26, Math.min(560, s.fly.land));
      const d = Math.abs(land - s.hole);
      s.ball = land;
      if (d < 26) {
        const pts = Math.max(8, 110 - s.strokes * 18);
        s.sc += pts; env.score(s.sc);
        s.holes++;
        s.strokes = 0;
        gen();
        if (s.holes >= 4) { env.sc2 = 1; return env.over('CLUB CHAMPION ⛳ ' + s.sc); }
      }
    };
    return {
      update(t, dt) {
        if (!s.fly) {
          s.power += s.dir * 320 * dt;
          if (s.power > 100 || s.power < 0) { s.dir *= -1; s.power = Math.max(0, Math.min(100, s.power)); }
          return;
        }
        s.fly.p += dt * 1.6;
        if (s.fly.p >= 1) {
          s.fly = { p: 1, land: Math.min(560, Math.max(26, s.ball + (s.fly.v - s.fly.wind * 2.4))) };
          settle();
          s.fly = null;
        } else {
          s.fly.land = Math.min(560, Math.max(26, s.ball + (s.fly.v - s.fly.wind * 2.4)));
        }
      },
      draw(c) {
        U.bg(c, '#0a1420');
        c.fillStyle = '#2a6a4a'; c.fillRect(0, 420, W, 300);
        c.fillStyle = '#ff4081'; c.fillRect(s.hole - 4, 400, 8, 22);
        c.strokeStyle = '#fff'; c.beginPath(); c.moveTo(s.hole, 400); c.lineTo(s.hole, 330); c.stroke();
        c.fillStyle = '#ffd24d'; c.beginPath(); c.moveTo(s.hole, 330); c.lineTo(s.hole + 24, 341); c.lineTo(s.hole, 353); c.fill();
        if (s.fly) {
          const tgt = s.fly.land, x0 = s.ball;
          const xx = x0 + (tgt - x0) * s.fly.p;
          const y = 470 - Math.sin(s.fly.p * Math.PI) * 170;
          c.fillStyle = '#fff'; c.beginPath(); c.arc(xx, y, 8, 0, 7); c.fill();
        } else {
          c.fillStyle = '#fff'; c.beginPath(); c.arc(s.ball, 470, 8, 0, 7); c.fill();
        }
        c.fillStyle = '#12142a'; c.fillRect(40, 620, 400, 30);
        c.fillStyle = '#ffd24d'; c.fillRect(40, 620, s.power * 4, 30);
        U.txt(c, 'pin ' + Math.round(s.hole) + '  ·  wind ' + (s.wind > 0 ? '→' : '←') + Math.abs(s.wind).toFixed(0) + '  ·  slope −' + s.hill, 12, 660, 15, '#fff', 'left');
        U.txt(c, 'strokes ' + s.strokes + ' · holes ' + s.holes + '/4 · score ' + s.sc, W/2, 700, 16, '#8a8fa8');
      }
    };
  }
});

ARCADE.add({
  id: 'homerun', emoji: '⚾', name: 'Home Run Derby', cat: 'Sports', tags: 'tap to swing',
  desc: 'Timed swings! Sweet spot = FLY. Strike 3 and done.',
  create(env) {
    const s = { by: 660, bv: -260, sc: 0, swing: null, misses: 0, hit: 0, bull: 0 };
    env.needPad(false, true);
    env.tap(() => {
      if (s.done()) return;
      s.swing = { y: s.by };
      const win = Math.abs(s.by - 520) < 30;
      if (win) {
        const dist = 60 + Math.abs(520 - s.by);
        const pts = Math.round(50 + (40 - dist)*3);
        s.sc += pts; env.score(s.sc);
        s.hit++; if (dist < 12) { s.bull++; s.sc += 20; env.score(s.sc); }
        s.fly = { p: 0, dist };
      } else {
        s.misses++;
        if (s.misses >= 3) { s.doneNow = true; env.score(s.sc); return env.over('STRIKE OUT ⚾ ' + s.sc); }
      }
      s.by = 660; s.bv = -260;
    });
    s.done = () => s.doneNow;
    return {
      update(t, dt) {
        s.by += s.bv*dt; s.bv += 300*dt;
        if (s.by > 700) { s.by = 660; s.bv = -260; }
        if (s.fly) { s.fly.p += dt; if (s.fly.p > 1.4) s.fly = null; }
      },
      draw(c) {
        U.bg(c, '#0a1a28');
        c.fillStyle = '#26294a'; c.fillRect(0, 560, W, 10);
        c.strokeStyle = '#ffd24d'; c.beginPath(); c.arc(240, 520, 32, 0, 7); c.stroke();
        c.strokeStyle = 'rgba(255,210,77,.4)'; c.beginPath(); c.arc(240, 520, 62, 0, 7); c.stroke();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(240, s.by, 10, 0, 7); c.fill();
        c.font = '54px serif'; c.textAlign = 'center'; c.fillText('🧑🏼‍🏏', 240, 660);
        if (s.fly) { const fy = 520 - s.fly.p*300, fx = 240 + s.fly.p*180; c.fillStyle = '#fff'; c.beginPath(); c.arc(fx, fy, 10, 0, 7); c.fill(); if (s.fly.p < 0.6) U.txt(c, 'FLY! ' + Math.round(50 + (40 - s.fly.dist)*3) + ' pts', fx-20, fy, 22, '#4dff88'); }
        U.txt(c, 'score ' + s.sc + ' · hit ' + s.hit + ' ❤'.repeat(3 - Math.max(0, s.misses)), W/2, 60, 22, '#fff');
        U.txt(c, 'Tap when ball is HOME in the gold circle', W/2, 700, 15, '#8a8fa8');
      }
    };
  }
});

ARCADE.add({
  id: 'penalty', emoji: '⚽', name: 'Penalty Shootout', cat: 'Sports', tags: 'tap zone to shoot',
  desc: 'Pick a corner! The keeper guesses. 3 of 5 to win.',
  create(env) {
    const s = { scored: 0, tries: 0, sc: 0, msg: '', fx: 0 };
    env.needPad(false, false);
    env.tap((x, y) => {
      if (s.tries >= 5) return;
      if (y < 420) return;
      const cb = ['↖','↑','↗'];
      const zone = x < 160 ? 0 : x > 320 ? 2 : 1;
      s.tries++;
      const gkeep = env.iri(3);
      if (gkeep === zone && Math.random() < 0.82) s.msg = 'SAVED 🧤 keeper dove ' + cb[gkeep];
      else { s.scored++; s.sc += 10; s.msg = 'GOAL! ⚽ ' + cb[zone]; env.score(s.sc); }
      s.fx = 1;
      setTimeout(() => { s.fx = 0; }, 700);
      if (s.tries >= 5) setTimeout(() => {
        if (s.scored >= 3) { env.score(s.scored * 30 + 20); env.over('SHOOTOUT HERO ⚽ ' + s.scored + '/5'); }
        else env.over('Saved too many… ' + s.scored + '/5');
      }, 900);
    });
    return {
      update(t, dt) {},
      draw(c) {
        U.bg(c, '#0d1e33');
        c.fillStyle = '#1d3a5a'; c.fillRect(40, 140, 400, 260);
        c.strokeStyle = '#fff'; c.lineWidth = 3; c.strokeRect(40, 140, 400, 260);
        c.fillStyle = '#2a6a4a'; c.fillRect(0, 400, W, 320);
        c.font = '30px serif'; c.textAlign = 'center';
        c.fillText('🧤', 240, 260);
        if (s.fx) { c.fillStyle = '#00000099'; c.fillRect(0, 0, W, H); U.txt(c, s.msg, W/2, 300, 34, s.msg.startsWith('GOAL') ? '#4dff88' : '#ff4081'); }
        [['↖ left', 80], ['↑ center', 240], ['↗ right', 400]].forEach(([txt, x]) => U.txt(c, txt, x, 460, 20, '#fff'));
        U.txt(c, s.scored + '/' + s.tries + ' · score ' + s.sc, W/2, 130, 20, '#8a8fa8');
        if (s.tries < 5) U.txt(c, 'tap a corner to shoot!', W/2, 620, 22, '#fff');
      }
    };
  }
});

ARCADE.add({
  id: 'knife', emoji: '🔪', name: 'Knife Toss', cat: 'Sports', tags: 'tap to throw',
  desc: 'Stick knives into the spinning log — no double hits!\nBosses every 8',
  create(env) {
    const s = { rot: 0, rv: (Math.random() < 0.5 ? -1 : 1) * 2.2, spots: [], k: 10, sc: 0, wave: 1, msg: '', msgT: 0 };
    env.needPad(false, true);
    env.tap(() => {
      const a = s.rot % (Math.PI * 2);
      const hit = s.spots.some(sp => {
        let d = Math.abs(sp - a);
        d = Math.min(d, Math.PI * 2 - d);
        return d < 0.38;
      });
      if (hit) { env.score(s.sc); return env.over('Double hit! 🔪💥'); }
      s.spots.push(a);
      s.k--; s.sc += 2; env.score(s.sc);
      if (s.k <= 0) { s.wave++; s.sc += 10; env.score(s.sc); s.spots = []; s.k = 10 + s.wave; s.rv *= -1.15; s.msg = 'LOG SMASHED ✅ wave ' + s.wave; }
    });
    return {
      update(t, dt) {
        s.rot += s.rv * dt;
        s.msgT += dt; if (s.msgT > 1.4) { s.msg = ''; s.msgT = 0; }
      },
      draw(c) {
        U.bg(c, '#0f0a16');
        const cx = W/2, cy = 300;
        c.fillStyle = '#6a3a1e'; c.beginPath(); c.arc(cx, cy, 92, s.rot, s.rot + 2.1); c.fill();
        c.beginPath(); c.arc(cx, cy, 92, s.rot + 2.4, s.rot + 4.2); c.fill();
        s.spots.forEach(a => {
          const X = cx + Math.sin(a) * 86, Y = cy - Math.cos(a) * 86;
          c.fillStyle = '#aa8a6a'; c.fillRect(X-3, Y, 6, 26);
          c.fillStyle = '#e8eaf6'; c.fillRect(X-3, Y-52, 6, 52);
        });
        c.fillStyle = '#e8eaf6'; c.fillRect(cx-6, 40, 12, 130);
        if (s.msg) U.txt(c, s.msg, W/2, 480, 24, '#4dff88');
        U.txt(c, 'knives: ' + s.k + ' · ' + s.sc, W/2, 690, 20, '#fff');
        U.txt(c, 'tap: throw a knife into the log', W/2, 660, 15, '#8a8fa8');
      }
    };
  }
});

ARCADE.add({
  id: 'bottle', emoji: '🍾', name: 'Bottle Flip', cat: 'Sports', tags: 'swipe UP to flip',
  desc: 'Swipe up: too soft = faceplant, too hard = explosion. 3 in 5!',
  create(env) {
    const s = { y: 0, v: 0, rot: 0, rv: 0, made: 0, tries: 0, sc: 0, msg: 'swipe UP to flip!' };
    env.needPad(false, false);
    env.swipe(d => {
      if (d !== 'up' || s.v !== 0) return;
      s.tries++;
      s.msg = '';
      s.v = -(320 + env.rand(220));
      s.rv = -(7 + env.rand(11));
    });
    return {
      update(t, dt) {
        if (s.v !== 0) {
          s.y += s.v*dt; s.rot += s.rv*dt;
          s.v += 300*dt;
          if (s.y >= 0) {
            s.y = 0; s.v = 0;
            const norm = ((s.rot % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
            if (norm < 1.0 || norm > Math.PI*2 - 1.0) {
              s.made++; s.sc += 20; s.msg = 'Perfect landing! ✅ ' + s.made + '/5';
              env.score(s.sc);
              if (s.made >= 5) { env.score(s.sc + 50); return env.over('Champagne time! 🥂'); }
            } else {
              s.sc = Math.max(0, s.sc - 4); s.msg = 'flop 💀 ' + s.tries + ' tries';
              env.score(s.sc);
            }
            s.rot = 0;
          }
        }
      },
      draw(c) {
        U.bg(c, '#0a0b14');
        c.fillStyle = '#2a6a4a'; c.fillRect(120, 600, 240, 24);
        c.save(); c.translate(240, 600 + s.y); c.rotate(s.rot);
        c.fillStyle = '#4dd6ff'; c.fillRect(-14, -84, 28, 84);
        c.fillStyle = '#234059'; c.fillRect(-6, -100, 12, 18);
        c.restore();
        if (s.msg) U.txt(c, s.msg, W/2, 180, 28, '#4dff88');
        U.txt(c, s.made + '/5 clean flips', W/2, 60, 26, '#fff');
        U.txt(c, 'with a touch of rot', W/2, 660, 15, '#3a3f6e');
        U.txt(c, 'SWIPE UP!', W/2, 700, 22, '#8a8fa8');
      }
    };
  }
});

ARCADE.add({
  id: 'juggle', emoji: '🤹', name: 'Keepy Uppy', cat: 'Sports', tags: 'tap the ball',
  desc: 'Tap the ball to keep it aloft. Off-screen = drop!',
  create(env) {
    const s = { x: W/2, y: 500, vx: 40, vy: -380, sc: 0, done: false };
    env.needPad(false, false);
    env.tap((x, y) => {
      if (Math.hypot(s.x-x, s.y-y) < 60) {
        s.vy = -(330 + env.rand(240));
        s.vx = (x - s.x) * 2.4;
        s.vy = Math.min(-140, s.vy);
        s.sc++;
        env.score(s.sc);
      }
    });
    return {
      update(t, dt) {
        s.vy += 620*dt;
        s.x += s.vx*dt; s.y += s.vy*dt;
        if (s.x < 20 || s.x > W-20) s.vx *= -1;
        if (s.y < -60) s.vy = 60;
        if (s.y > 780 && !s.done) { s.done = true; env.over('Dropped! 🥀'); return; }
      },
      draw(c) {
        U.bg(c, '#0a0b14');
        c.fillStyle = '#ffd24d'; c.beginPath(); c.arc(s.x, s.y, 26, 0, 7); c.fill();
        c.strokeStyle = '#ff4081'; c.beginPath(); c.arc(s.x, s.y, 26, 0.6, 2.4); c.stroke();
        U.txt(c, s.sc, W/2, 80, 40, '#fff');
        U.txt(c, 'tap the ball!', W/2, 700, 20, '#8a8fa8');
      }
    };
  }
});
})();
