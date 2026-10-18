(() => {
const U = ARCADE.utils, W = 480, H = 720;

ARCADE.add({
  id: 'flap', emoji: '🐤', name: 'Flap Dash', cat: 'Jump', tags: 'tap / ↑ to flap',
  desc: 'Flap between the pipes. One tap = one hop.',
  create(env) {
    const s = { y: H/2, vy: 0, gap: 175, sc: 0, pillars: [] };
    const spawn = x => s.pillars.push({ x, top: 80 + env.rand(H - s.gap - 180), scored: false });
    [0, 1, 2].forEach(i => spawn(W + 80 + i * 200));
    env.needPad(false, true);
    env.tap(() => s.vy = -280);
    env.key(k => { if (k === 'action' || k === 'up') s.vy = -280; });
    return {
      update(t, dt) {
        s.vy += 660*dt; s.y += s.vy*dt;
        if (s.y > H - 8 || s.y < -20) return env.over('Off the map 💫');
        s.pillars.forEach(p => p.x -= 180*dt);
        if (s.pillars[0].x < -60) { s.pillars.shift(); spawn(W + 130); }
        for (const p of s.pillars) {
          if (!p.scored && p.x + 60 < 100) { p.scored = true; s.sc++; env.score(s.sc); s.gap = Math.max(120, s.gap - 5); }
          const near = 100 + 12 > p.x && 100 - 12 < p.x + 60;
          if (near && (s.y - 14 < p.top || s.y + 14 > p.top + s.gap)) return env.over('Clipped the pipe 🚧');
        }
      },
      draw(c) {
        U.bg(c, '#0a1428');
        s.pillars.forEach(p => { c.fillStyle = '#2d7a3a'; c.fillRect(p.x, 0, 60, p.top); c.fillRect(p.x, p.top + s.gap, 60, H - p.top - s.gap); c.fillStyle = '#43c968'; c.fillRect(p.x - 5, p.top - 14, 70, 14); c.fillRect(p.x - 5, p.top + s.gap, 70, 14); });
        c.save(); c.translate(100, s.y); c.rotate(Math.max(-0.6, Math.min(0.6, s.vy/480)));
        c.font = '36px serif'; c.textAlign = 'center'; c.fillText('🐤', 0, 12); c.restore();
        U.txt(c, s.sc, W/2, 46, 36, '#fff');
      }
    };
  }
});

ARCADE.add({
  id: 'dino', emoji: '🦖', name: 'Dino Runner', cat: 'Jump', tags: 'tap / ↑ to jump',
  desc: 'Leap the cacti and low-flying birds. Endless!',
  create(env) {
    const s = { y: 620, vy: 0, spd: 300, sc: 0, obs: [], next: 0 };
    const spawn = () => s.obs.push({ x: W + 50, kind: Math.random() < 0.7 ? 0 : 1, h: 40 + env.iri(3)*18 });
    env.needPad(false, true);
    env.tap(() => { if (s.y >= 619) s.vy = -560; });
    env.key(k => { if ((k === 'action' || k === 'up') && s.y >= 619) s.vy = -560; });
    return {
      update(t, dt) {
        s.vy += 1560*dt; s.y += s.vy*dt;
        if (s.y > 620) { s.y = 620; s.vy = 0; }
        s.spd += 7*dt; s.sc += s.spd*dt*0.045; env.score(Math.floor(s.sc));
        s.next -= dt;
        if (s.next <= 0) { s.next = 0.9 + env.rand(0.9); spawn(); }
        s.obs.forEach(o => o.x -= s.spd*dt);
        s.obs = s.obs.filter(o => o.x > -70);
        for (const o of s.obs) {
          const oTop = o.kind ? 500 : 620 - o.h, oBot = o.kind ? 540 : 620;
          if (o.x < 108 && o.x + (o.kind ? 44 : 18) > 58 && s.y > oTop - 44 && s.y < oBot + 6)
            return env.over(o.kind ? 'Clipped by the bird 🐦' : 'Bitten by the cactus 🌵');
        }
      },
      draw(c) {
        U.bg(c, '#10122a');
        c.fillStyle = '#1d2040'; c.fillRect(0, 664, W, 4);
        s.obs.forEach(o => {
          if (o.kind) { c.fillStyle = '#4dd6ff'; c.fillRect(o.x, 504, 42, 20); c.fillStyle = '#fff'; c.fillRect(o.x + 30, 496, 10, 10); }
          else { c.fillStyle = '#22885a'; c.fillRect(o.x, 620 - o.h, 18, o.h); c.fillRect(o.x - 14, 620 - o.h/2, 14, 10); c.fillRect(o.x + 18, 620 - o.h/1.4, 14, 10); }
        });
        c.font = '44px serif'; c.textAlign = 'center'; c.fillText('🦖', 80, s.y + 14);
        U.txt(c, s.sc.toFixed(0) + 'm', W/2, 40, 30, '#fff');
      }
    };
  }
});

ARCADE.add({
  id: 'bounce', emoji: '🦘', name: 'Bounce Up', cat: 'Jump', tags: 'arrows / drag',
  desc: 'Auto-bounce ever higher. Purple pads move!\nHeight = points',
  create(env) {
    const s = { x: W/2, y: 600, vy: -560, vx: 0, plats: [], genY: 660, top: 0, bestH: 0 };
    const mk = yy => s.plats.push({ x: env.rand(W - 110), y: yy, mv: Math.random() < 0.25 ? (Math.random() < 0.5 ? -55 : 55) : 0 });
    mk(660);
    env.needPad(true, false);
    env.drag(x1 => s.vx = Math.max(-280, Math.min(280, (x1 - s.x) * 4)));
    return {
      update(t, dt) {
        if (env.keys.has('left')) s.vx = -250;
        if (env.keys.has('right')) s.vx = 250;
        s.x = (s.x + s.vx*dt + W) % W;
        s.plats.forEach(p => { if (p.mv) p.x += p.mv*dt; if (p.x < 0 || p.x > W-110) p.mv *= -1; });
        s.vy += 1150*dt; s.y += s.vy*dt;
        if (s.vy > 0) for (const p of s.plats) {
          if (s.y > p.y - 6 && s.y < p.y + 20 && s.x > p.x - 6 && s.x < p.x + 116) { s.vy = -560; break; }
        }
        const h = 600 - s.y;
        if (h > s.bestH) { s.bestH = h; env.score(Math.floor(h/10)); }
        if (s.y < H/2) { const d = H/2 - s.y; s.y = H/2; s.plats.forEach(p => p.y += d); s.genY += d; }
        s.plats = s.plats.filter(p => p.y < H + 40);
        while (s.genY > -120) { mk(s.genY); s.genY -= 78 + env.rand(26); }
        if (s.y > H + 30) return env.over('Fell into the abyss 🫥');
      },
      draw(c) {
        U.bg(c, '#0a0b20');
        s.plats.forEach(p => { c.fillStyle = p.mv ? '#c04dff' : '#4dff88'; c.fillRect(p.x, p.y, 110, 12); });
        c.fillStyle = '#ffd24d'; c.fillRect(s.x-10, s.y-30, 20, 34);
        c.fillStyle = '#fff'; c.fillRect(s.x-5, s.y-25, 5, 6); c.fillRect(s.x+2, s.y-25, 5, 6);
        U.txt(c, Math.floor(s.bestH/10), W/2, 40, 34, '#fff');
      }
    };
  }
});

ARCADE.add({
  id: 'hopper', emoji: '✨', name: 'Platform Hopper', cat: 'Jump', tags: '←→ + auto-bounce',
  desc: 'The lava floor rises from below. Climb!\nHeight = points',
  create(env) {
    const s = { x: W/2, y: 600, vy: -540, kill: 700, plats: [], genY: 660, sc: 0 };
    const mk = yy => s.plats.push({ x: env.rand(W - 120), y: yy });
    mk(660);
    env.needPad(true, false);
    return {
      update(t, dt) {
        if (env.keys.has('left')) s.x -= 270*dt;
        if (env.keys.has('right')) s.x += 270*dt;
        s.x = Math.max(14, Math.min(W-14, s.x));
        s.kill -= 15*dt;
        s.plats.forEach(p => p.y += 15*dt);
        s.plats = s.plats.filter(p => p.y < s.kill + 80 && p.y > -60);
        while (s.genY > -120) { mk(s.genY); s.genY -= 85 + env.rand(20); }
        s.genY += 15*dt;
        s.vy += 1200*dt; s.y += s.vy*dt;
        if (s.vy > 0) for (const p of s.plats) if (s.y > p.y - 4 && s.y < p.y + 20 && Math.abs(s.x - (p.x + 60)) < 68) { s.vy = -560; break; }
        if (s.y > s.kill) return env.over('The lava caught you 🔥');
        env.score(s.sc = Math.floor(Math.max(0, (600 - s.y + 200)/10)));
      },
      draw(c) {
        U.bg(c, '#0b0a18');
        c.fillStyle = '#ff4081'; c.fillRect(0, s.kill, W, H - s.kill);
        c.fillStyle = '#ff80ab33'; for (let i = 0; i < 5; i++) c.fillRect(i*100, s.kill - 6 - env.rand(8), 40, 6);
        s.plats.forEach(p => { c.fillStyle = '#c08bff'; c.fillRect(p.x, p.y, 120, 12); });
        c.fillStyle = '#ffd24d'; c.fillRect(s.x-10, s.y-30, 20, 34);
        c.fillStyle = '#fff'; c.fillRect(s.x-5, s.y-25, 5, 6); c.fillRect(s.x+2, s.y-25, 5, 6);
        U.txt(c, s.sc, W/2, 40, 34, '#fff');
      }
    };
  }
});

ARCADE.add({
  id: 'gravflip', emoji: '🔄', name: 'Gravity Flip', cat: 'Jump', tags: 'tap / space to flip',
  desc: 'Tap to flip between floor and ceiling. Dodge everything!',
  create(env) {
    const s = { y: 640, g: 1, spd: 260, sc: 0, dist: 0, obs: [], next: 0 };
    const spawn = () => s.obs.push({ x: W + 50, side: env.iri(2), h: 50 + env.iri(3)*24 });
    env.needPad(false, true);
    env.tap(() => s.g *= -1);
    env.key(k => { if (k === 'action') s.g *= -1; });
    return {
      update(t, dt) {
        s.spd += 6*dt; s.dist += s.spd*dt; env.score(Math.floor(s.dist/20));
        s.y += s.g * 640*dt;
        if (s.y > 656) s.y = 656;
        if (s.y < 84) s.y = 84;
        s.next -= dt;
        if (s.next <= 0) { s.next = 0.8 + env.rand(0.7); spawn(); }
        s.obs.forEach(o => o.x -= s.spd*dt);
        s.obs = s.obs.filter(o => o.x > -80);
        for (const o of s.obs) {
          const oTop = o.side ? 76 : 650 - o.h, oH = o.h;
          if (o.x < 60 && o.x + 46 > 24 && s.y > oTop - 26 && s.y < oTop + oH + 26) return env.over('Concussed 🧱');
        }
      },
      draw(c) {
        U.bg(c, '#0a0d22');
        c.fillStyle = '#1d2040'; c.fillRect(0, 64, W, 8); c.fillRect(0, 654, W, 8);
        s.obs.forEach(o => { c.fillStyle = o.side ? '#b388ff' : '#4dd6ff'; c.fillRect(o.x, o.side ? 72 : 650 - o.h, 46, o.h); });
        c.font = '38px serif'; c.textAlign = 'center'; c.fillText('⚡', 40, s.y + (s.g < 0 ? -14 : 14));
        U.txt(c, s.sc.toFixed(0), W/2, 40, 30, '#fff');
      }
    };
  }
});

ARCADE.add({
  id: 'thrust', emoji: '🌠', name: 'Star Thrust', cat: 'Jump', tags: 'arrows / d-pad',
  desc: 'Drift in zero-g: grab stars ★ +10, avoid the rocks.',
  create(env) {
    const s = { x: W/2, y: H/2, vx: 50, vy: -40, stars: [], rocks: [], sc: 0 };
    for (let i = 0; i < 5; i++) s.stars.push({ x: env.rand(W-60) + 30, y: env.rand(H-60) + 30 });
    for (let i = 0; i < 3; i++) s.rocks.push({ x: env.rand(W), y: env.rand(H), vx: (Math.random()-0.5)*100, vy: (Math.random()-0.5)*100 });
    env.needPad(true, true);
    return {
      update(t, dt) {
        if (env.keys.has('up')) s.vy -= 210*dt;
        if (env.keys.has('down')) s.vy += 210*dt;
        if (env.keys.has('left')) s.vx -= 210*dt;
        if (env.keys.has('right')) s.vx += 210*dt;
        s.vx *= 1 - 0.25*dt; s.vy *= 1 - 0.25*dt;
        s.vx = Math.max(-280, Math.min(280, s.vx)); s.vy = Math.max(-280, Math.min(280, s.vy));
        s.x = (s.x + s.vx*dt + W) % W; s.y = (s.y + s.vy*dt + H) % H;
        for (const r of s.rocks) { r.x = (r.x + r.vx*dt + W) % W; r.y = (r.y + r.vy*dt + H) % H; }
        for (let i = s.stars.length-1; i >= 0; i--) {
          if (Math.hypot(s.stars[i].x - s.x, s.stars[i].y - s.y) < 26) {
            s.stars.splice(i, 1); s.sc += 10; env.score(s.sc);
            s.stars.push({ x: env.rand(W-60) + 30, y: env.rand(H-60) + 30 });
          }
        }
        for (const r of s.rocks) if (Math.hypot(r.x - s.x, r.y - s.y) < 40) return env.over('Clipped by an asteroid ☄️');
      },
      draw(c) {
        U.bg(c, '#02030a');
        c.font = '30px serif'; c.textAlign = 'center';
        s.stars.forEach(st => c.fillText('⭐', st.x, st.y - 18));
        s.rocks.forEach(r => { c.fillStyle = '#6a6f94'; c.beginPath(); c.ellipse(r.x, r.y, 22, 15, r.x * 0.01, 0, 7); c.fill(); });
        c.font = '34px serif'; c.fillText('🛸', s.x, s.y + 12);
        U.txt(c, s.sc, W/2, 36, 26, '#fff');
      }
    };
  }
});

ARCADE.add({
  id: 'chute', emoji: '🪂', name: 'Parachute Drop', cat: 'Jump', tags: 'hold ↑ / TAP to brake',
  desc: 'Skydive forever: hold to slow, grab stars, dodge birds!!',
  create(env) {
    const s = { x: W/2, y: 60, vy: 80, sc: 0, things: [], next: 0 };
    env.needPad(false, true);
    return {
      update(t, dt) {
        const open = env.keys.has('action') || env.keys.has('up');
        s.vy += (open ? -320 : 90) * dt;
        if (open) s.vy = Math.max(70, s.vy); else s.vy = Math.min(450, s.vy);
        s.vy = Math.max(40, Math.min(470, s.vy));
        s.y += s.vy*dt;
        s.next -= dt;
        if (s.next <= 0) { s.next = 0.55; s.things.push({ x: env.rand(W-40) + 20, y: s.y - 420, kind: Math.random() < 0.6 ? 0 : 1 }); }
        s.things.forEach(o => o.y += s.vy*dt);
        s.things = s.things.filter(o => o.y < s.y + 500);
        for (const o of s.things) {
          if (o.kind === 0 && Math.abs(o.x - s.x) < 36 && Math.abs(o.y - s.y) < 36) { o.kind = 2; s.sc += 10; }
          if (o.kind === 1 && Math.abs(o.x - s.x) < 30 && Math.abs(o.y - s.y) < 36) return env.over('Bird strike! 🦅');
        }
        env.score(s.sc + Math.floor((s.y - 60)/8));
      },
      draw(c) {
        U.bg(c, '#0a1030');
        for (let i = 0; i < 5; i++) { c.fillStyle = '#141838'; const yy = ((i*180) - s.y*0.06) % H; c.fillRect(0, yy < 0 ? yy + H : yy, W, 72); }
        c.font = '30px serif'; c.textAlign = 'center';
        s.things.forEach(o => { if (o.kind !== 2) c.fillText(o.kind ? '🦅' : '⭐', o.x, o.y + 10); });
        if (s.vy < 160) { c.fillStyle = '#ff80ab'; c.beginPath(); c.moveTo(s.x - 36, s.y - 46); c.lineTo(s.x + 36, s.y - 46); c.lineTo(s.x - 0, s.y - 8); c.closePath(); c.fill(); }
        c.fillStyle = '#ffd24d'; c.fillRect(s.x-9, s.y-8, 18, 28);
        U.txt(c, s.sc, W/2, 40, 30, '#fff');
      }
    };
  }
});

ARCADE.add({
  id: 'zigzag', emoji: '🧭', name: 'Zigzag Runner', cat: 'Jump', tags: 'tap to turn 90°',
  desc: 'Never touch the walls. Tap to turn 90°, ride the corners.',
  create(env) {
    const s = { x: 60, y: 60, d: 'right', dist: 0, spd: 175 };
    const turn = () => {
      const order = ['right', 'down', 'left', 'up'];
      s.d = order[(order.indexOf(s.d) + 1) % 4];
    };
    env.needPad(false, true);
    env.tap(turn);
    env.key(k => { if (k === 'action') turn(); });
    return {
      update(t, dt) {
        s.spd += 4*dt;
        s.dist += s.spd*dt; env.score(Math.floor(s.dist/20));
        const v = { right: [1, 0], left: [-1, 0], up: [0, -1], down: [0, 1] }[s.d];
        s.x += v[0]*s.spd*dt; s.y += v[1]*s.spd*dt;
        if (s.x < 12 || s.x > W-12 || s.y < 12 || s.y > H-12) return env.over('Kissed the wall 💀');
      },
      draw(c) {
        U.bg(c, '#0a0b20');
        c.strokeStyle = '#3a3f6e'; c.lineWidth = 8; c.strokeRect(4, 4, W-8, H-8);
        c.fillStyle = '#7c4dff22';
        for (let i = 1; i < 12; i++) c.fillRect((i*97) % (W-70) + 30, (i*151) % (H-70) + 30, 26, 26);
        c.fillStyle = '#4dff88'; c.beginPath(); c.arc(s.x, s.y, 10, 0, 7); c.fill();
        U.txt(c, EnvironmentNoop(), W/2, 40, 26, '#fff');
        function EnvironmentNoop() { return Math.floor(s.dist/20); }
      }
    };
  }
});
})();
