/* ==========================================================================
   UNFOLD — app
   Hash router · per-browser progress + XP · session renderer · game engine
   Game engine: stages → challenges. Types: mcq · spot · order · match.
   ========================================================================== */
(function () {
  "use strict";

  const SESSIONS = window.UNFOLD_SESSIONS || [];
  const LIVE = SESSIONS.filter((s) => s.status === "live");
  const app = document.getElementById("app");
  const live = document.getElementById("live-region");
  const reduceMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- helpers ---------- */
  const esc = (v) =>
    String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (n) => Number(n || 0).toLocaleString("en-US");
  const pad = (n) => String(n).padStart(2, "0");
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const announce = (msg) => {
    if (!live) return;
    live.textContent = "";
    setTimeout(() => (live.textContent = msg), 30);
  };
  const byId = (id) => SESSIONS.find((s) => s.id === id);

  /* game maths */
  const challengesOf = (s) => (s.game ? s.game.stages.flatMap((st) => st.challenges) : []);
  const basePossible = (s) => (s.game ? s.game.stages.reduce((a, st) => a + st.points * st.challenges.length, 0) : 0);
  /* bonus is rounded per challenge, exactly as scoring does it */
  const maxScore = (s) => (s.game ? s.game.stages.reduce((a, st) => a + (st.points + Math.round(st.points * (s.game.bonus || 0))) * st.challenges.length, 0) : 0);

  /* ---------- seeded mosaic (the pixel motif) ---------- */
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  /* Builds a grid of blocks. Neighbouring cells often copy each other, so colours clump into shapes. */
  function mosaic(cols, rows, seed, colors, gap = 0.28, cls = "") {
    const r = rng(seed), grid = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const left = x > 0 ? grid[y * cols + x - 1] : null, up = y > 0 ? grid[(y - 1) * cols + x] : null;
        let c;
        const roll = r();
        if (left !== null && roll < 0.38) c = left;
        else if (up !== null && roll < 0.62) c = up;
        else c = r() < gap ? "" : colors[Math.floor(r() * colors.length)];
        grid.push(c);
      }
    }
    return `<div class="mosaic ${cls}" style="--cols:${cols};--rows:${rows}" aria-hidden="true">${grid
      .map((c, i) => `<i style="--d:${((i % cols) * 28 + Math.floor(i / cols) * 14)}ms${c ? `;background:var(--${c})` : ""}"></i>`)
      .join("")}</div>`;
  }
  const PAL = ["cobalt", "pink", "mint", "charcoal", "ivory-deep"];

  /* ---------- graphic language: starburst · half-circle tiles · sparkles · ribbon ---------- */
  const BURST = (() => {
    const n = 26, pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (Math.PI * i) / n - Math.PI / 2, r = i % 2 ? 40 : 50;
      pts.push(`${(50 + r * Math.cos(a)).toFixed(2)}% ${(50 + r * Math.sin(a)).toFixed(2)}%`);
    }
    return `polygon(${pts.join(",")})`;
  })();
  document.documentElement.style.setProperty("--burst", BURST);

  const RADII = ["100% 0 0 0", "0 100% 0 0", "0 0 100% 0", "0 0 0 100%", "50%", "100% 0", "0 100%", "100% 100% 0 0", "0 0 100% 100%"];
  function geo(cols, rows, seed, colors, cls = "") {
    const r = rng(seed);
    let h = "";
    for (let i = 0; i < cols * rows; i++) {
      const a = colors[Math.floor(r() * colors.length)];
      let b = colors[Math.floor(r() * colors.length)];
      if (b === a) b = colors[(colors.indexOf(a) + 1) % colors.length];
      h += `<i style="background:var(--${a});--d:${i * 45}ms"><b style="background:var(--${b});border-radius:${RADII[Math.floor(r() * RADII.length)]}"></b></i>`;
    }
    return `<div class="geo ${cls}" style="--cols:${cols}" aria-hidden="true">${h}</div>`;
  }
  const spark = (c, x, y, s, d) => `<i class="spark" style="--c:var(--${c});left:${x}%;top:${y}%;--sz:${s}px;animation-delay:${d}s"></i>`;
  const ribbon = (txt, cls = "") => `<div class="ribbon ${cls}" aria-hidden="true"><span>${(txt + " ✦ ").repeat(10)}</span></div>`;

  const SHAPES = ["burst", "spark", "semi", "diamond", "pixel", "leaf", "circle"];
  const SHAPE_COLORS = ["pink", "mint", "cobalt", "ivory"];
  const shapeFor = (id) => { let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return SHAPES[h % SHAPES.length]; };
  function achObject(a, on, i) {
    const col = SHAPE_COLORS[i % SHAPE_COLORS.length];
    return `<div class="obj obj--${col} ${on ? "is-on" : ""}" style="--i:${i};--c:var(--${col})">
      <span class="obj__meta mono"><span>${a.session ? `S${a.session.number}` : "UNFOLD"}</span><span>${on ? "+50 XP" : "Locked"}</span></span>
      <span class="obj__shape obj__shape--${shapeFor(a.id)}" aria-hidden="true"></span>
      <span class="obj__txt"><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></span>
      <span class="sr-only">${on ? "Unlocked" : "Locked"}</span>
    </div>`;
  }

  /* ---------- the unfolding hero ----------
     Six letter panels form a real 3D accordion. Fold angle θ = (1 − p) × 84°.
     Even panels hinge at z = 0; odd panels start at z = −w·sinθ and rotate back,
     so neighbouring edges always meet. p drives covers, world layers and tagline via --p. */
  const WORD = "UNFOLD", PANELS = 6;
  const FOLD_MAX = (84 * Math.PI) / 180;
  const SLICE = [0, 0, 0, 0, 0, 0]; /* flat state is one seamless word; scroll adds the slice offsets */
  const SCROLL_SLICE = [-0.04, 0.06, -0.02, 0.07, -0.05, 0.03];
  const Hero = { p: 1, s: 0, raf: 0 };

  /* Size the word so it spans the six panels exactly, whatever font actually loaded */
  function fitWord() {
    const fold = document.getElementById("fold");
    if (!fold) return;
    const probe = document.createElement("span");
    probe.className = "fold__probe";
    probe.textContent = WORD;
    fold.appendChild(probe);
    const natural = probe.getBoundingClientRect().width || 1;
    probe.remove();
    const W = fold.getBoundingClientRect().width;
    fold.style.setProperty("--fs", `${(100 * W) / natural}px`);
  }

  function layoutFold(p) {
    const track = document.getElementById("fold-track"), hero = document.getElementById("hero");
    if (!track || !hero) return;
    Hero.p = p;
    const panels = track.children, w = panels[0].offsetWidth, h = panels[0].offsetHeight;
    const th = (1 - p) * FOLD_MAX, c = Math.cos(th), sn = Math.sin(th);
    const x0 = (track.offsetWidth - panels.length * w * c) / 2;
    for (let i = 0; i < panels.length; i++) {
      const x = x0 + i * w * c, y = (SLICE[i] * p + SCROLL_SLICE[i] * Hero.s * 2.6) * h;
      panels[i].style.transform = i % 2 === 0
        ? `translate3d(${x}px,${y}px,0) rotateY(${th}rad)`
        : `translate3d(${x}px,${y}px,${-w * sn}px) rotateY(${-th}rad)`;
      panels[i].style.setProperty("--shade", (sn * 0.9).toFixed(3));
    }
    hero.style.setProperty("--p", p.toFixed(3));
    hero.style.setProperty("--s", Hero.s.toFixed(3));
    const r = document.getElementById("fold-range");
    if (r && document.activeElement !== r) r.value = Math.round(p * 100);
  }

  /* iridescent object: a soft five-lobed form, filled with the palette */
  const BLOB = (() => {
    const pts = [];
    for (let k = 0; k <= 120; k++) {
      const t = (k / 120) * Math.PI * 2, r = 70 + 24 * Math.cos(5 * t) + 6 * Math.cos(3 * t + 1);
      pts.push(`${(100 + r * Math.cos(t)).toFixed(1)},${(100 + r * Math.sin(t)).toFixed(1)}`);
    }
    return `<svg class="w-blob" viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <linearGradient id="irid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#64DCC0"/><stop offset=".35" stop-color="#405CFF"/>
          <stop offset=".65" stop-color="#FF72B6"/><stop offset="1" stop-color="#F5F1E8"/>
        </linearGradient>
        <radialGradient id="shine" cx=".35" cy=".3" r=".5"><stop offset="0" stop-color="#F5F1E8" stop-opacity=".95"/><stop offset="1" stop-color="#F5F1E8" stop-opacity="0"/></radialGradient>
      </defs>
      <polygon points="${pts.join(" ")}" fill="url(#irid)"/>
      <polygon points="${pts.join(" ")}" fill="url(#shine)"/>
      <circle cx="100" cy="100" r="14" fill="#292A2E"/>
    </svg>`;
  })();
  /* glitch matrix: an abstract lost-signal panel. Bands, fragments and RGB-split bars each run on
     their own interval, mostly at rest, so the interference reads as occasional and controlled. */
  function glitchMatrix(seed) {
    const r = rng(seed), cols = ["cobalt", "pink", "mint", "ivory", "cobalt", "charcoal-3"];
    let bands = "", frags = "";
    for (let i = 0; i < 16; i++) {
      const top = (i / 16) * 100 + r() * 3, h = 2 + Math.floor(r() * 3) * 3;
      const left = Math.floor(r() * 30), w = 25 + Math.floor(r() * 60);
      const c = cols[Math.floor(r() * cols.length)];
      const dur = (3.2 + r() * 5).toFixed(2), del = (-r() * 6).toFixed(2), dx = Math.round((r() - .5) * 60);
      bands += `<i style="top:${top.toFixed(1)}%;height:${h}px;left:${left}%;width:${w}%;background:var(--${c});--dur:${dur}s;--del:${del}s;--dx:${dx}px"></i>`;
    }
    for (let i = 0; i < 12; i++) {
      const x = Math.floor(r() * 92), y = Math.floor(r() * 92), sz = 6 + Math.floor(r() * 4) * 6;
      const c = ["pink", "mint", "ivory", "cobalt"][i % 4];
      const fx = Math.round((r() - .5) * 70), fy = Math.round((r() - .5) * 30);
      frags += `<i style="left:${x}%;top:${y}%;width:${sz}px;height:${Math.round(sz * (.4 + r() * .8))}px;background:var(--${c});--fx:${fx}px;--fy:${fy}px;--dur:${(4 + r() * 4).toFixed(2)}s;--del:${(-r() * 5).toFixed(2)}s"></i>`;
    }
    const cluster = `<b style="top:30%;width:72%;left:8%"></b><b style="top:38%;width:46%;left:22%"></b><b style="top:43%;width:84%;left:2%"></b><b style="top:56%;width:38%;left:40%"></b><b style="top:61%;width:60%;left:14%"></b>`;
    return `<div class="w-glitch" aria-hidden="true"><div class="gm__in">
      <div class="gm__grid"></div>
      <div class="gm__rgb"><span class="gm__ch gm__ch--p">${cluster}</span><span class="gm__ch gm__ch--m">${cluster}</span><span class="gm__ch gm__ch--i">${cluster}</span></div>
      <div class="gm__bands">${bands}</div>
      <div class="gm__frags">${frags}</div>
      <i class="gm__roll"></i>
      <span class="gm__code mono">SIG 01 / NO CARRIER</span>
    </div></div>`;
  }
  /* ---------- hero signal field ----------
     One canvas behind the whole hero. It only ever draws background interference:
     the wordmark, tagline, body and buttons live on a separate layer above it and are
     never touched. Density varies across the field (drifting hot spots), and a mask
     built from the measured text boxes keeps a calm zone behind every piece of type.
     ~14 fps, paused off-screen or in a hidden tab, one static frame under reduced motion. */
  const SIG_COLORS = ["#405CFF", "#FF72B6", "#64DCC0", "#F5F1E8", "#44464D", "#2E46D6"];
  const Sig = { raf: 0, ctx: null, cv: null, mask: null, w: 0, h: 0, dpr: 1, bars: [], last: 0, tear: null, nextTear: 0, on: false, io: null, inView: true, frame: 0 };
  function sigDensity(x, y, t) {
    const u = x / Sig.w, v = y / Sig.h, k = t / 1000;
    const spots = [
      [0.84 + 0.03 * Math.sin(k * 0.21), 0.2 + 0.04 * Math.cos(k * 0.17), 0.26, 1],
      [0.08 + 0.03 * Math.cos(k * 0.13), 0.86, 0.24, 0.85],
      [0.5 + 0.18 * Math.sin(k * 0.07), 0.04, 0.16, 0.7],
      [0.97, 0.7 + 0.05 * Math.sin(k * 0.19), 0.2, 0.75],
      [0.3 + 0.05 * Math.sin(k * 0.11), 0.55, 0.3, 0.35]
    ];
    let d = 0.04 + 0.03 * Math.sin(v * 31 + k * 0.6);
    for (const [sx, sy, r, a] of spots) { const dx = (u - sx) / r, dy = (v - sy) / (r * 1.25); d += a * Math.exp(-(dx * dx + dy * dy)); }
    return Math.min(1, d);
  }
  function sigCalmRects() {
    const hero = document.getElementById("hero");
    if (!hero) return [];
    const hb = hero.getBoundingClientRect(), out = [];
    const add = (b, pad) => { if (b.width > 1 && b.height > 1) out.push({ x: b.left - hb.left - pad, y: b.top - hb.top - pad, w: b.width + pad * 2, h: b.height + pad * 2 }); };
    const fold = hero.querySelector(".fold");
    if (fold) add(fold.getBoundingClientRect(), 10);
    /* text: hug each rendered line, not the whole column */
    hero.querySelectorAll(".hero__tag, .hero__body, .hero__meta > *").forEach((el) => {
      const rg = document.createRange(); rg.selectNodeContents(el);
      [...rg.getClientRects()].forEach((b) => add(b, 14));
    });
    hero.querySelectorAll(".hero__cta, .hero__ctl").forEach((el) => [...el.children].forEach((c) => add(c.getBoundingClientRect(), 12)));
    return out;
  }
  function sigMeasure() {
    const hero = document.getElementById("hero"), cv = document.getElementById("hero-signal");
    if (!hero || !cv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    Sig.w = hero.offsetWidth; Sig.h = hero.offsetHeight; Sig.dpr = dpr;
    cv.width = Math.max(1, Math.round(Sig.w * dpr)); cv.height = Math.max(1, Math.round(Sig.h * dpr));
    Sig.cv = cv; Sig.ctx = cv.getContext("2d");
    /* mask: opaque where interference may show, soft holes behind type (8% residual) */
    const m = document.createElement("canvas"); m.width = cv.width; m.height = cv.height;
    const mc = m.getContext("2d");
    mc.fillStyle = "#000"; mc.fillRect(0, 0, m.width, m.height);
    mc.globalCompositeOperation = "destination-out";
    mc.shadowColor = "rgba(0,0,0,.92)"; mc.shadowBlur = 26 * dpr; mc.shadowOffsetX = 100000;
    mc.fillStyle = "#000";
    sigCalmRects().forEach((r) => mc.fillRect(r.x * dpr - 100000, r.y * dpr, r.w * dpr, r.h * dpr));
    Sig.mask = m;
    Sig.bars = [];
    sigDraw(performance.now(), true);
  }
  function sigSpawn(t) {
    for (let tries = 0; tries < 40; tries++) {
      const x = Math.random() * Sig.w, y = Math.random() * Sig.h;
      if (Math.random() > sigDensity(x, y, t)) continue;
      const kind = Math.random();
      const c = SIG_COLORS[Math.floor(Math.random() * SIG_COLORS.length)];
      const life = 3 + Math.floor(Math.random() * 16);
      if (kind < 0.55) return { x: Math.round(x / 2) * 2, y: Math.round(y / 2) * 2, w: 30 + Math.random() * Math.random() * 420, h: [2, 2, 3, 4, 6, 8][Math.floor(Math.random() * 6)], c, a: 0.18 + Math.random() * 0.5, life, jit: Math.random() < 0.3 ? 4 + Math.random() * 24 : 0, rgb: Math.random() < 0.28 };
      if (kind < 0.85) { const s = [4, 6, 8, 12, 16][Math.floor(Math.random() * 5)]; return { x: Math.round(x / 4) * 4, y: Math.round(y / 4) * 4, w: s * (1 + Math.floor(Math.random() * 3)), h: s, c, a: 0.25 + Math.random() * 0.55, life, jit: 0, rgb: false }; }
      return { x: Math.round(x), y: Math.round(y), w: 1 + Math.random() * 2, h: 1 + Math.random() * 2, c: "#F5F1E8", a: 0.5, life: 2, jit: 0, rgb: false, dust: true };
    }
    return null;
  }
  function sigDraw(t, still) {
    const ctx = Sig.ctx;
    if (!ctx || !Sig.mask) return;
    const area = (Sig.w * Sig.h) / (1366 * 900), target = Math.round(220 * Math.max(0.35, Math.min(1.4, area)));
    Sig.bars = Sig.bars.filter((b) => --b.life > 0);
    let guard = 0;
    while (Sig.bars.length < target && guard++ < target * 2) { const b = sigSpawn(t); if (b) Sig.bars.push(b); }
    if (!still && !Sig.tear && t > Sig.nextTear) Sig.tear = { y: Math.random() * Sig.h * 0.9, h: 24 + Math.random() * 110, dx: (Math.random() < 0.5 ? -1 : 1) * (12 + Math.random() * 46), until: t + 160 + Math.random() * 200 };
    if (Sig.tear && t > Sig.tear.until) { Sig.tear = null; Sig.nextTear = t + 2200 + Math.random() * 4200; }
    ctx.setTransform(Sig.dpr, 0, 0, Sig.dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, Sig.w, Sig.h);
    /* slow vertical-hold roll: a faint lighter band drifting down */
    const ry = ((t / 22) % (Sig.h + 260)) - 130;
    const g = ctx.createLinearGradient(0, ry, 0, ry + 130);
    g.addColorStop(0, "rgba(245,241,232,0)"); g.addColorStop(0.5, "rgba(245,241,232,.05)"); g.addColorStop(1, "rgba(245,241,232,0)");
    ctx.fillStyle = g; ctx.fillRect(0, ry, Sig.w, 130);
    for (const b of Sig.bars) {
      const dx = b.jit && Math.random() < 0.25 ? (Math.random() - 0.5) * b.jit : 0;
      if (b.rgb) {
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = b.a * 0.7; ctx.fillStyle = "#FF72B6"; ctx.fillRect(b.x + dx - 4, b.y, b.w, b.h);
        ctx.fillStyle = "#64DCC0"; ctx.fillRect(b.x + dx + 4, b.y + 1, b.w, b.h);
        ctx.fillStyle = "#405CFF"; ctx.fillRect(b.x + dx, b.y, b.w, b.h);
        ctx.globalCompositeOperation = "source-over";
      } else {
        ctx.globalAlpha = b.a; ctx.fillStyle = b.c; ctx.fillRect(b.x + dx, b.y, b.w, b.h);
      }
    }
    ctx.globalAlpha = 1;
    /* tear: a short-lived horizontal slice, displaced sideways, with dense streaks */
    if (Sig.tear) {
      const T = Sig.tear, d = Sig.dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(Sig.cv, 0, Math.round(T.y * d), Sig.cv.width, Math.round(T.h * d), Math.round(T.dx * d), Math.round(T.y * d), Sig.cv.width, Math.round(T.h * d));
      ctx.setTransform(d, 0, 0, d, 0, 0);
      for (let i = 0; i < 14; i++) {
        ctx.globalAlpha = 0.15 + Math.random() * 0.4;
        ctx.fillStyle = SIG_COLORS[i % SIG_COLORS.length];
        ctx.fillRect(Math.random() * Sig.w * 0.5, T.y + Math.random() * T.h, Sig.w * (0.2 + Math.random() * 0.8), 1 + Math.random() * 2);
      }
      ctx.globalAlpha = 1;
    }
    /* calm zones: keep only what the mask allows */
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(Sig.mask, 0, 0);
    ctx.globalCompositeOperation = "source-over";
  }
  function sigLoop(t) {
    Sig.raf = 0;
    if (!Sig.on) return;
    if (Sig.inView && !document.hidden && t - Sig.last > 70) { Sig.last = t; Sig.frame++; sigDraw(t, false); }
    Sig.raf = requestAnimationFrame(sigLoop);
  }
  function sigStart() {
    sigStop();
    const hero = document.getElementById("hero");
    if (!hero || !document.getElementById("hero-signal")) return;
    Sig.on = true; Sig.nextTear = performance.now() + 1800;
    sigMeasure();
    if (reduceMotion()) { Sig.on = false; return; }
    if ("IntersectionObserver" in window) {
      Sig.io = new IntersectionObserver((es) => { Sig.inView = es[0].isIntersecting; });
      Sig.io.observe(hero);
    }
    Sig.raf = requestAnimationFrame(sigLoop);
  }
  function sigStop() {
    Sig.on = false;
    if (Sig.raf) cancelAnimationFrame(Sig.raf);
    Sig.raf = 0;
    if (Sig.io) { Sig.io.disconnect(); Sig.io = null; }
    Sig.inView = true;
  }
  let sigResize = 0;
  window.addEventListener("resize", () => { clearTimeout(sigResize); sigResize = setTimeout(() => { if (document.getElementById("hero-signal")) sigMeasure(); }, 160); });

  const GLOBE = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="4.5" ry="10"/><path d="M2 12h20M4 7h16M4 17h16"/></svg>`;

  function playUnfold() {
    cancelAnimationFrame(Hero.raf);
    if (reduceMotion()) { layoutFold(1); return; }
    const t0 = performance.now() + 280, dur = 1900;
    layoutFold(0);
    const step = (t) => {
      const k = Math.max(0, Math.min(1, (t - t0) / dur));
      layoutFold(k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
      if (k < 1) Hero.raf = requestAnimationFrame(step);
      else sigMeasure();
    };
    Hero.raf = requestAnimationFrame(step);
  }
  let scrollQueued = false;
  window.addEventListener("scroll", () => {
    const hero = document.getElementById("hero");
    if (!hero || reduceMotion() || scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      scrollQueued = false;
      Hero.s = Math.max(0, Math.min(1, window.scrollY / hero.offsetHeight));
      layoutFold(Hero.p);
    });
  }, { passive: true });
  window.addEventListener("resize", () => { fitWord(); layoutFold(Hero.p); });

  /* ---------- progress store (localStorage, this browser only) ---------- */
  const KEY = "unfold.progress.v2";
  let mem = null;
  const storageOK = (() => {
    try { const k = "__unfold_test"; localStorage.setItem(k, "1"); localStorage.removeItem(k); return true; } catch (e) { return false; }
  })();
  function load() {
    if (mem) return mem;
    try { mem = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { mem = {}; }
    if (!mem.sessions) mem.sessions = {};
    return mem;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* storage blocked: progress lasts until this tab closes */ }
  }
  function stat(id) {
    const p = load();
    const d = { plays: 0, best: 0, bestPct: 0, last: null, lastPct: null, completedAt: null, terms: [], flags: {}, runs: [], concepts: {} };
    p.sessions[id] = Object.assign(d, p.sessions[id] || {});
    return p.sessions[id];
  }
  const peek = (id) => load().sessions[id] || {};

  /* ---------- achievements & XP ---------- */
  function allAchievements() {
    const list = [
      { id: "first-fold", name: "First fold", desc: "Finish any session game.", check: () => SESSIONS.some((s) => peek(s.id).plays > 0) },
      { id: "all-live", name: "Full archive", desc: "Finish the game in every open session.", check: () => LIVE.length > 0 && LIVE.every((s) => peek(s.id).plays > 0) }
    ];
    SESSIONS.forEach((s) =>
      (s.achievements || []).forEach((a) =>
        list.push({
          id: a.id, name: a.name, desc: a.desc, session: s,
          check: () => {
            const st = peek(s.id);
            if (a.rule.type === "pct") return (st.bestPct || 0) >= a.rule.min;
            if (a.rule.type === "plays") return (st.plays || 0) >= a.rule.min;
            if (a.rule.type === "flag") return !!(st.flags && st.flags[a.rule.flag]);
            if (a.rule.type === "terms") return (st.terms || []).length >= (s.glossary || []).length;
            if (a.rule.type === "missionPlays") return ((st.mission || {}).plays || 0) >= a.rule.min;
            if (a.rule.type === "mission") return ((st.mission || {}).plays || 0) > 0 && ((st.mission || {}).bestFirst || 0) >= a.rule.min;
            return false;
          }
        })
      )
    );
    return list;
  }
  const unlockedIds = () => allAchievements().filter((a) => a.check()).map((a) => a.id);

  const XP_PER_ACH = 50;
  const LEVELS = [
    { xp: 0, name: "Folded" },
    { xp: 400, name: "Creased" },
    { xp: 1200, name: "Opening up" },
    { xp: 2400, name: "Unfolding" },
    { xp: 3200, name: "Wide open" }
  ];
  function xpInfo() {
    const fromGames = SESSIONS.reduce((a, s) => a + (peek(s.id).best || 0) + ((peek(s.id).mission || {}).best || 0), 0);
    const ach = unlockedIds().length;
    const xp = fromGames + ach * XP_PER_ACH;
    let li = 0;
    LEVELS.forEach((l, i) => { if (xp >= l.xp) li = i; });
    const next = LEVELS[li + 1];
    const into = next ? (xp - LEVELS[li].xp) / (next.xp - LEVELS[li].xp) : 1;
    return { xp, fromGames, ach, level: li + 1, name: LEVELS[li].name, next, into };
  }

  /* ---------- shared bits ---------- */
  function statusChip(s) {
    if (s.status === "live") {
      const st = peek(s.id);
      if (st.plays) return `<span class="chip chip--done">Played · best ${st.bestPct}%</span>`;
      return `<span class="chip chip--live">Open now</span>`;
    }
    return `<span class="chip chip--wait">Awaiting materials</span>`;
  }

  /* Editorial covers: three compositions, chosen by position so the archive never repeats a layout side by side */
  function coverLines(s) {
    const c = s.cover || {};
    const lines = c.lines || (s.title ? s.title.split(" ").slice(0, 2) : ["Session", s.number]);
    return { lines, sub: c.sub || "" };
  }
  function sessionCard(s, i) {
    const v = ["a", "b", "c"][i % 3];
    if (s.status !== "live") {
      return `
      <article class="cover cover--wait cover--${v}" aria-label="Session ${esc(s.number)}, awaiting materials">
        <div class="cover__meta mono"><span>Session ${esc(s.number)}</span><span>${statusChip(s)}</span></div>
        <div class="cover__num" aria-hidden="true">${esc(s.number)}</div>
        <div class="cover__type">
          <h3 class="cover__title"><span>To be</span><span>announced</span></h3>
          <p class="cover__sub">still folded</p>
        </div>
        <p class="cover__note">Held for the next guest speaker. It unfolds once their session has run and the materials are in.</p>
        <div class="cover__foot mono"><span>#Session${esc(s.number)}</span><span aria-hidden="true">+</span></div>
      </article>`;
    }
    const { lines, sub } = coverLines(s);
    return `
    <article class="cover cover--live cover--${v}">
      <div class="cover__art" aria-hidden="true">
        ${mosaic(9, 6, 7 + i * 13, ["pink", "mint", "ivory"], 0.72, "cover__pix")}
        ${spark("mint", 78, 18, 26, 0.3)}
      </div>
      <div class="cover__meta mono"><span>Session ${esc(s.number)}<br>${esc(s.dateLabel)}</span><span>${esc(s.host)}<br>${esc(s.mode || "BUILD MODE")}</span></div>
      <div class="cover__type">
        <h3 class="cover__title"><a href="#${esc(s.id)}" class="card__link">${lines.map((l) => `<span>${esc(l)}</span>`).join("")}<span class="sr-only"> ${esc(sub)}</span></a></h3>
        ${sub ? `<p class="cover__sub" aria-hidden="true">${esc(sub)}</p>` : ""}
      </div>
      <ul class="cover__topics mono" aria-label="Topics">${s.topics.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      <div class="cover__foot mono">${statusChip(s)}<span>Open ${GLOBE} <span aria-hidden="true">↘</span></span></div>
    </article>`;
  }

  /* ---------- paper planes ----------
     A few folded notes placed between sections. Each one unfolds into a sheet that
     quotes a Session takeaway word for word (from sessions.js) and links somewhere useful.
     Planes sit in their own strip, so neither plane nor sheet ever covers content. */
  const PLANE_SVG = `<svg class="plane__svg" viewBox="0 0 120 66" aria-hidden="true">
      <polygon class="pl-under" points="4,30 52,41 40,48"/>
      <polygon class="pl-keel" points="52,41 116,5 62,60"/>
      <polygon class="pl-wing" points="4,30 116,5 52,41"/>
      <polyline class="pl-crease" points="4,30 116,5"/>
      <polyline class="pl-crease pl-crease--b" points="52,41 116,5"/>
    </svg>`;
  function planeNote(id) {
    const s = LIVE[0];
    if (!s || !s.takeaways) return null;
    const notes = {
      p1: { i: 1, cta: [`Read Session ${s.number}`, `#${s.id}`] },
      p2: { i: 2, cta: s.mission ? [`Play ${s.mission.name}`, `#${s.id}-play`] : [`Read Session ${s.number}`, `#${s.id}`] },
      p3: { i: 4, cta: [`Try the concept drill`, `#${s.id}-drill`] }
    };
    const n = notes[id];
    if (!n || !s.takeaways[n.i]) return null;
    return { s, text: s.takeaways[n.i], num: n.i + 1, cta: n.cta };
  }
  function planeStrip(id, pos = "l", tone = "dark") {
    const n = planeNote(id);
    if (!n) return "";
    return `<div class="fly fly--${pos} tone-${tone}" data-plane="${id}">
      <svg class="fly__path" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true"><path d="M-10 44 C 180 8, 330 58, 520 30 S 860 6, 1010 26"/></svg>
      <div class="wrap fly__row">
        <button class="plane" data-action="plane" data-id="${id}" aria-expanded="false" aria-controls="note-${id}">
          ${PLANE_SVG}<span class="plane__tag mono" aria-hidden="true">Folded note · ${pad(n.num)}</span>
          <span class="sr-only">Paper plane. Unfold a takeaway from Session ${esc(n.s.number)}</span>
        </button>
        <div class="pnote" id="note-${id}" role="region" aria-label="Takeaway ${n.num} from Session ${esc(n.s.number)}" hidden>
          <div class="pnote__paper">
            <p class="mono pnote__k">Session ${esc(n.s.number)} · takeaway ${pad(n.num)} of ${pad(n.s.takeaways.length)}</p>
            <p class="pnote__txt" tabindex="-1">${esc(n.text)}</p>
            <p class="mono pnote__src">From the Session ${esc(n.s.number)} takeaways · ${esc(n.s.title)}</p>
            <div class="pnote__act"><a class="btn btn--charcoal" href="${n.cta[1]}">${esc(n.cta[0])} <span aria-hidden="true">→</span></a><button class="btn-mini mono pnote__fold" data-action="plane-fold" data-id="${id}">Fold it back ↺</button></div>
          </div>
        </div>
      </div>
    </div>`;
  }
  let planeTimer = {};
  function planeToggle(id, open) {
    const fly = document.querySelector(`.fly[data-plane="${id}"]`);
    if (!fly) return;
    const btn = fly.querySelector(".plane"), note = fly.querySelector(".pnote");
    clearTimeout(planeTimer[id]);
    const still = reduceMotion();
    if (open) {
      btn.setAttribute("aria-expanded", "true");
      fly.classList.remove("is-folding"); fly.classList.add("is-unfolding");
      planeTimer[id] = setTimeout(() => {
        fly.classList.remove("is-unfolding"); fly.classList.add("is-open");
        note.hidden = false;
        const t = note.querySelector(".pnote__txt"); if (t) t.focus({ preventScroll: true });
        announce("Note unfolded. " + (t ? t.textContent : ""));
      }, still ? 0 : 380);
    } else {
      btn.setAttribute("aria-expanded", "false");
      fly.classList.add("is-folding");
      planeTimer[id] = setTimeout(() => {
        note.hidden = true; fly.classList.remove("is-open", "is-folding");
        btn.focus({ preventScroll: true });
      }, still ? 0 : 320);
    }
  }
  app.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const note = e.target.closest && e.target.closest(".pnote");
    if (note) planeToggle(note.closest(".fly").dataset.plane, false);
  });

  /* ==========================================================================
     VIEWS
     ========================================================================== */
  function heroHtml(first) {
    const slices = Array.from({ length: PANELS }, (_, i) =>
      `<span class="fold__p" style="--i:${i}"><span class="fold__word">${WORD}</span><i class="fold__shade"></i></span>`).join("");
    return `
    <section class="hero" id="hero" aria-labelledby="fold">
      <div class="hero__world" aria-hidden="true">
        <div class="w-field"></div>
        ${mosaic(10, 6, 23, ["pink", "mint", "ivory"], 0.74, "mosaic--load w-pix w-pix--a")}
        ${mosaic(8, 5, 57, ["mint", "cobalt", "ivory"], 0.78, "mosaic--load w-pix w-pix--b")}
        ${spark("mint", 9, 64, 30, 0)}${spark("ivory", 90, 12, 18, 1.2)}
      </div>
      <div class="hero__signal" aria-hidden="true"><canvas id="hero-signal"></canvas></div>
      <div class="hero__covers" aria-hidden="true"><i class="cv cv--l"></i><i class="cv cv--r"></i></div>
      <div class="hero__inner">
        <div class="hero__meta mono">
          <span>UNFOLD<br>Guest-speaker sessions</span>
          <span>Read<br>Play<br>Record</span>
          <span class="hero__meta-r">2026 ${GLOBE}</span>
        </div>
        <h1 class="fold" id="fold" tabindex="-1"><span class="sr-only">UNFOLD</span><span class="fold__track" id="fold-track" aria-hidden="true">${slices}</span></h1>
        <div class="hero__lower">
          <div class="hero__say">
            <p class="hero__tag">Ideas worth <em>opening&nbsp;up.</em></p>
            <p class="hero__body">Every guest speaker this semester, unpacked into a page you can read and a game you can play.</p>
          </div>
          <div class="hero__act">
            <div class="hero__cta">
              ${first ? `<a class="btn btn--ivory btn--big" href="#${first.id}">Open Session ${first.number} <span aria-hidden="true">↘</span></a>` : ""}
              <a class="btn btn--ghost" href="#sessions">The archive</a>
            </div>
            <div class="hero__ctl">
              <label class="foldctl mono" for="fold-range"><span aria-hidden="true">Fold</span>
                <input type="range" id="fold-range" min="0" max="100" value="100" aria-label="Fold or unfold the wordmark">
              <span aria-hidden="true">Open</span></label>
              <button class="btn-mini mono" data-action="refold">↻ Replay</button>
            </div>
          </div>
        </div>
      </div>
    </section>`;
  }

  function viewHome() {
    const first = LIVE[0];
    const x = xpInfo();
    const roundsList = first ? first.game.stages : [];
    return `
    ${heroHtml(first)}

    <section class="band tone-cobalt re" aria-labelledby="re-h">
      ${mosaic(7, 5, 41, ["pink", "mint", "ivory"], 0.75, "re__pix")}
      <div class="wrap re__grid">
        <h2 id="re-h" class="re__mark"><span>RE</span><span class="re__colon">:</span><span class="re__think">THINK</span></h2>
        <div class="re__copy">
          <p class="re__line">Don't just hear an idea.<br><em>Do something with it.</em></p>
          <ul class="re__loop">
            <li><span class="mono">RE·read</span><p>A summary, takeaways and objectives built only from the speaker's own material.</p></li>
            <li><span class="mono">RE·play</span><p>A game made for that session, with rounds that get harder, hints and feedback on every answer.</p></li>
            <li><span class="mono">RE·cord</span><p>XP, achievements and the ideas you've opened up, saved in this browser.</p></li>
          </ul>
        </div>
      </div>
    </section>

    ${planeStrip("p1", "r")}

    <section class="band tone-dark" aria-labelledby="strip-h">
      <div class="wrap">
        <div class="sec-head">
          <h2 id="strip-h" class="sec-title">This <em>semester</em></h2>
          <a class="link" href="#sessions">Full archive →</a>
        </div>
        <div class="covers">${SESSIONS.map(sessionCard).join("")}</div>
      </div>
    </section>

    ${planeStrip("p2", "l", "dark2")}

    ${first ? `
    <section class="band tone-ivory slab" aria-labelledby="rounds-h">
      <div class="wrap">
        <div class="sec-head">
          <h2 id="rounds-h" class="sec-title">Inside <span class="sec-title__chip">${esc(first.mode || "BUILD MODE")}</span></h2>
          <span class="mono">Session ${first.number} · ${first.mission ? `${esc(first.mission.name)} mission · about 4 min` : ""}${x.xp ? ` · you: Lv ${x.level}, ${fmt(x.xp)} XP` : ""}</span>
        </div>
        <ol class="rounds-row">${(first.mission ? MSTAGES.map(([, t, d], i) => [`Stage ${pad(i + 1)}`, t, d]) : roundsList.map((st) => [st.label, st.title, `${st.challenges.length} × ${st.points} pts`])).map(([l, t, d], i) => `
          <li style="--i:${i}"><span class="mono">${esc(l)}</span><b>${esc(t)}</b><small>${esc(d)}</small></li>`).join("")}
        </ol>
        <div class="actions"><a class="btn btn--charcoal btn--big" href="#${first.id}-play">Start the ${esc(first.mission ? first.mission.name : "game")} mission</a>${first.mission ? `<a class="btn btn--ghost" href="#${first.id}-drill">Concept drill · ${challengesOf(first).length} challenges</a>` : ""}</div>
      </div>
    </section>` : ""}`;
  }

  let archiveFilter = "all";
  function viewArchive() {
    const nLive = LIVE.length, nWait = SESSIONS.length - nLive;
    const list = SESSIONS.map((s, i) => [s, i]).filter(([s]) => archiveFilter === "all" || (archiveFilter === "live" ? s.status === "live" : s.status !== "live"));
    const f = (k, label, n) => `<button class="filter" data-action="filter" data-f="${k}" aria-pressed="${archiveFilter === k}">${label} <span class="mono">${n}</span></button>`;
    return `
    <section class="page-head">
      <div class="wrap">
        <p class="eyebrow mono">The archive</p>
        <h1 class="page-title" tabindex="-1">Every session,<br><em>opened up.</em></h1>
        <p class="lead">${nLive} open · ${nWait} awaiting materials. Sessions open here as each speaker's materials come in.</p>
        <div class="filters" role="group" aria-label="Filter sessions">
          ${f("all", "All", SESSIONS.length)}${f("live", "Open", nLive)}${f("upcoming", "Awaiting", nWait)}
        </div>
      </div>
    </section>
    ${planeStrip("p3", "c")}
    <section class="band band--tight">
      <div class="wrap"><div class="covers">${list.map(([s, i]) => sessionCard(s, i)).join("") || `<p class="empty">No sessions in this view yet.</p>`}</div></div>
    </section>`;
  }

  /* ---------- session page ---------- */
  function renderBlock(b, s) {
    let h = `<div class="block"><h4 class="block__h">${esc(b.h)}</h4>`;
    if (b.p) h += `<p>${esc(b.p)}</p>`;
    if (b.bad) h += `<div class="bad"><span class="mono">Weak prompts</span>${b.bad.map((x) => `<p class="bad__item">“${esc(x)}”</p>`).join("")}</div>`;
    if (b.special === "glossary") h += glossary(s);
    if (b.special === "twocopies") h += twoCopies();
    if (b.items) {
      const tag = b.ordered ? "ol" : "ul";
      h += `<${tag} class="defs ${b.ordered ? "defs--steps" : ""}">${b.items
        .map((i) => `<li><strong>${esc(i.t)}</strong><span>${esc(i.d)}</span></li>`)
        .join("")}</${tag}>`;
    }
    if (b.prompt) h += `<figure class="prompt"><figcaption class="mono">Prompt for Claude Code</figcaption><code>${esc(b.prompt)}</code><button class="btn-copy mono" data-action="copy" data-text="${esc(b.prompt)}">Copy</button></figure>`;
    if (b.note) h += `<p class="note">${esc(b.note)}</p>`;
    return h + `</div>`;
  }

  function glossary(s) {
    const opened = peek(s.id).terms || [];
    return `<div class="gloss">
      ${s.glossary.map((g, i) => {
        const open = opened.includes(i);
        return `<button class="gcard ${open ? "is-open" : ""}" data-action="term" data-i="${i}" aria-expanded="${open}">
          <span class="gcard__term">${esc(g.term)}</span>
          <span class="gcard__def">${esc(g.def)}</span>
          <span class="gcard__corner" aria-hidden="true"></span>
        </button>`;
      }).join("")}
      <p class="gloss__count mono" id="gloss-count">${opened.length} / ${s.glossary.length} unfolded</p>
    </div>`;
  }

  function twoCopies() {
    return `<div class="twocopies" role="img" aria-label="Diagram: your computer and GitHub. Commit saves a snapshot on your computer. Push sends commits up to GitHub. Clone copies the repo down. Fork, pull request and merge happen on GitHub.">
      <div class="tc tc--local"><span class="mono">Your computer</span><strong>Your files + saved snapshots</strong><em>commit ↺ stays here</em></div>
      <div class="tc__arrows" aria-hidden="true"><span class="tc__a">push →</span><span class="tc__a tc__a--back">← clone</span></div>
      <div class="tc tc--remote"><span class="mono">GitHub</span><strong>Remote repo, shared by everyone</strong><em>fork ↺ · pull request → merge</em></div>
    </div>`;
  }

  function viewSession(s, tab) {
    if (s.status !== "live") return viewPlaceholder(s);
    const st = peek(s.id);
    const idx = SESSIONS.indexOf(s);
    const tabBtn = (k, label) => `<a class="tab" href="#${s.id}${k === "play" ? "-play" : ""}" ${tab === k || (k === "play" && tab === "drill") ? 'aria-current="page"' : ""}>${label}</a>`;
    return `
    <section class="s-hero">
      <div class="s-hero__art" aria-hidden="true">
        ${mosaic(10, 6, 77 + idx, ["pink", "mint", "ivory"], 0.72, "mosaic--load s-hero__pix")}
        ${glitchMatrix(77 + idx).replace('class="w-glitch"', 'class="w-glitch s-hero__glitch"')}
        <div class="s-hero__num">${esc(s.number)}</div>
        ${spark("mint", 80, 64, 26, 0.4)}
      </div>
      <div class="s-hero__copy">
        <div class="s-hero__meta mono"><a href="#sessions" class="crumb">← Archive</a><span>Session ${esc(s.number)} · ${esc(s.dateLabel)}</span><span>${esc(s.event)}</span></div>
        <h1 class="s-hero__title" tabindex="-1">${coverLines(s).lines.map((l) => `<span>${esc(l)}</span>`).join("")}${coverLines(s).sub ? `<em>${esc(coverLines(s).sub)}</em>` : ""}</h1>
        <p class="lead">${esc(s.summary)}</p>
        <div class="s-hero__facts mono">
          <span><b>Topics</b>${s.topics.map(esc).join(" / ")}</span>
          <span><b>Presenters listed</b>${s.presenters.map(esc).join(", ")}</span>
          <span><b>Game</b>${esc(s.mode || "BUILD MODE")}: ${s.mission ? `${esc(s.mission.name)} mission + ` : ""}${challengesOf(s).length}-challenge drill</span>
        </div>
      </div>
    </section>
    <div class="wrap tabs-wrap">
      <nav class="tabs" aria-label="Session sections">
        ${tabBtn("learn", "Learn")}${tabBtn("play", `Play ${esc(s.mode || "BUILD MODE")}`)}
        <span class="tabs__stat mono">${tabStat(s)}</span>
      </nav>
    </div>
    <div id="session-body">${tab === "play" && s.mission ? missionShell(s) : tab === "play" || tab === "drill" ? gameShell(s) : learnBody(s)}</div>`;
  }

  function learnBody(s) {
    return `
    <section class="band band--tight">
      <div class="wrap two-col">
        <div class="panel tone-ivory panel--take">
          <h2 class="panel__h">Key takeaways</h2>
          <ol class="takeaways">${s.takeaways.map((t) => `<li>${esc(t)}</li>`).join("")}</ol>
        </div>
        <div class="panel">
          <h2 class="panel__h">After this session you can</h2>
          <ul class="checks">${s.objectives.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
        </div>
      </div>
    </section>
    ${s.chapters.map((c, i) => `
    <section class="chapter ${["tone-dark", "tone-ivory", "tone-dark2"][i % 3]}" aria-labelledby="ch-${i}" id="chapter-${i}">
      <div class="wrap chapter__grid">
        <header class="chapter__head">
          <span class="mono chapter__label">${esc(c.label)}</span>
          <h3 id="ch-${i}" class="chapter__title" tabindex="-1">${esc(c.title)}</h3>
          <p>${esc(c.intro)}</p>
        </header>
        <div class="chapter__body">${c.blocks.map((b) => renderBlock(b, s)).join("")}</div>
      </div>
    </section>`).join("")}
    <section class="band tone-cobalt cta-band">
      <div class="wrap cta-band__in">
        <p class="cta-band__line">Read it. Now <em>build</em> it.</p>
        <a class="btn btn--pink" href="#${s.id}-play">Play ${esc(s.mode || "BUILD MODE")}</a>
      </div>
    </section>`;
  }

  function viewPlaceholder(s) {
    return `
    <section class="page-head">
      <div class="wrap">
        <p class="eyebrow mono"><a href="#sessions" class="crumb">Archive</a> / Session ${esc(s.number)}</p>
        <h1 class="page-title" tabindex="-1">Session ${esc(s.number)}<br><em>is still folded.</em></h1>
        <p class="lead">This session hasn't run yet, or its materials haven't been added. Its summary, takeaways, game and achievements will appear here once they are.</p>
        <a class="btn btn--ghost" href="#sessions">Back to the archive</a>
      </div>
    </section>`;
  }

  /* ==========================================================================
     GAME ENGINE
     phase: intro → stage (round card) → play → … → end
     ========================================================================== */
  let G = null;

  function prepChallenge(c) {
    const x = Object.assign({}, c, { answered: false, hinted: false, f: 0 });
    if (c.type === "mcq") x.options = shuffle(c.options);
    if (c.type === "spot") x.view = shuffle(c.statements.map((t, i) => ({ t, i })));
    if (c.type === "order") {
      let o = shuffle(c.items.map((_, i) => i));
      while (o.every((v, i) => v === i)) o = shuffle(o);
      x.current = o;
    }
    if (c.type === "match") { x.order = shuffle(c.items.map((_, i) => i)); x.picks = {}; }
    return x;
  }

  function newGame(s) {
    G = {
      sid: s.id, phase: "intro", si: 0, ci: 0,
      score: 0, streak: 0, bestStreak: 0, hints: 0,
      stages: s.game.stages.map((st) => Object.assign({}, st, { challenges: st.challenges.map(prepChallenge) }))
    };
  }
  const curStage = () => G.stages[G.si];
  const cur = () => curStage().challenges[G.ci];

  function gameShell(s) {
    if (!G || G.sid !== s.id) newGame(s);
    G.lastKey = gameKey();
    return `<section class="game" aria-labelledby="game-h" data-stage="${stageMark()}">
      <div class="game__set" aria-hidden="true">${'<span class="gs"></span>'.repeat(7)}</div>
      <span class="gd--word" aria-hidden="true">UNFOLDED</span>
      <div class="game__decor" aria-hidden="true">
        ${mosaic(8, 5, 91, ["pink", "mint", "ivory"], 0.74, "gd gd--pix")}
        <span class="gd gd--label mono">Concept drill<br>Session ${esc(s.number)}</span>
        <span class="gd gd--plus">+</span>${spark("mint", 93, 78, 24, 0.6)}
      </div>
      <div class="wrap game__wrap"><div class="game__frame" id="game">${gameInner(s)}</div>
        <div class="game__doors" aria-hidden="true"><i></i><i></i></div></div>
    </section>`;
  }

  /* which graphic personality the arena wears: intro · warmup · call · debug · flow · ship · end */
  const stageMark = () => (G.phase === "intro" ? "intro" : G.phase === "end" ? "end" : curStage().id);
  const gameKey = () => `${G.phase}-${G.si}-${G.ci}`;

  function gameInner(s) {
    if (G.phase === "intro") return gameIntro(s);
    if (G.phase === "stage") return stageCard(s);
    if (G.phase === "end") return gameEnd(s);
    return gameRound(s);
  }

  function gameIntro(s) {
    const st = peek(s.id);
    const total = challengesOf(s).length;
    return `
      <div class="gi">
        <p class="mono gi__eyebrow">Session ${esc(s.number)} · the game</p>
        <h2 id="game-h" class="gi__title" tabindex="-1">${esc(s.game.name).replace(" ", "<br>")}</h2>
        <p class="gi__tag">${esc(s.game.tagline)}</p>
        ${s.mission ? `<p class="mono gi__alt">Part of ${esc(s.mode || "BUILD MODE")} · <a class="link" href="#${s.id}-play">The main game is the ${esc(s.mission.name)} mission</a></p>` : ""}
        <ol class="gi__ladder">${s.game.stages.map((x, i) => `
          <li style="--i:${i}"><button class="gi__go" data-action="goto-stage" data-si="${i}" aria-label="Open ${esc(x.label)}: ${esc(x.title)}"><span class="mono">${esc(x.label)}</span><b>${esc(x.title)}</b><small class="mono">${x.challenges.length} × ${x.points}</small></button></li>`).join("")}
        </ol>
        <ul class="gi__rules">
          <li><b>${total}</b> challenges in ${s.game.stages.length} rounds. Later rounds are worth more.</li>
          <li><b>Partial credit</b> on ordering and matching: every correct position counts.</li>
          <li><b>+${Math.round((s.game.bonus || 0) * 100)}% bonus</b> for a fully correct answer without opening its hint.</li>
          <li><b>${fmt(maxScore(s))}</b> points possible. Your best score becomes XP.</li>
        </ul>
        <div class="actions">
          <button class="btn btn--pink btn--big" data-action="start">${st.plays ? "Play again" : "Start building"}</button>
          ${st.plays ? `<span class="mono gi__best">Your best: ${fmt(st.best)} pts · ${st.bestPct}%</span>` : ""}
        </div>
      </div>`;
  }

  function stageCard(s) {
    const st = curStage();
    const prev = G.si > 0 ? G.stages[G.si - 1] : null;
    const prevLine = prev && prev.challenges.every((c) => c.answered) ? (() => {
      const got = prev.challenges.reduce((a, c) => a + c.pts + c.bonus, 0);
      const right = prev.challenges.filter((c) => c.f === 1).length;
      return `<p class="sc__prev mono">${esc(prev.label)} cleared · ${right}/${prev.challenges.length} fully right · +${fmt(got)} pts</p>`;
    })() : "";
    return `${hud(s)}
      <div class="sc">
        ${prevLine}
        <p class="sc__label" aria-hidden="true">${esc(st.label)}</p>
        <h2 id="game-h" class="sc__title" tabindex="-1"><span class="sr-only">${esc(st.label)}: </span>${esc(st.title)}</h2>
        <p class="sc__brief">${esc(st.brief)}</p>
        <p class="mono sc__meta">${st.challenges.length} challenges · ${st.points} pts each · +${Math.round(st.points * (s.game.bonus || 0))} no-hint bonus</p>
        <button class="btn btn--pink btn--big" data-action="begin">Begin ${esc(st.label.toLowerCase())}</button>
      </div>`;
  }

  function hud(s) {
    return `<div class="hud">
      <div class="hud__track" role="group" aria-label="Rounds">${G.stages.map((st, si) => `
        <button class="hud__stage ${si === G.si ? "is-now" : ""}" data-action="goto-stage" data-si="${si}"${si === G.si ? ' aria-current="step"' : ""} aria-label="${esc(st.label)}: ${esc(st.title)}, ${st.challenges.filter((c) => c.answered).length} of ${st.challenges.length} answered">${st.challenges.map((c, ci) => {
          let cls = "";
          if (c.answered) cls = c.f === 1 ? "ok" : c.f > 0 ? "part" : "miss";
          else if (si === G.si && ci === G.ci && G.phase === "play") cls = "now";
          return `<i class="${cls}" aria-hidden="true"></i>`;
        }).join("")}</button>`).join("")}
      </div>
      <div class="hud__row mono">
        <span>${esc(curStage().label)} · ${esc(curStage().title)}${G.phase === "play" ? ` · ${G.ci + 1}/${curStage().challenges.length}` : ""}</span>
        <span class="hud__chips">
          ${G.streak >= 2 ? `<span class="streak">Streak ×${G.streak}</span>` : ""}
          <span class="hud__score" aria-label="Score">${fmt(G.score)} pts${G.lastDelta != null && !G.deltaShown ? `<b class="delta${G.lastDelta ? "" : " delta--zero"}" aria-hidden="true">+${fmt(G.lastDelta)}</b>` : ""}</span>
        </span>
      </div>
    </div>`;
  }

  const typeLabel = { mcq: "Choose one", spot: "Spot the mistake", order: "Put in order", match: "Match each" };

  function gameRound(s) {
    const c = cur();
    let body = "";
    if (c.type === "mcq") body = roundMcq(c);
    if (c.type === "spot") body = roundSpot(c);
    if (c.type === "order") body = roundOrder(c);
    if (c.type === "match") body = roundMatch(c);
    const concept = (s.concepts || {})[c.concept];
    return `${hud(s)}
      <div class="round round--${c.type}${G.fresh !== false ? " is-fresh" : ""}">
        <div class="round__top">
          <p class="round__tag mono">${typeLabel[c.type]}${concept ? ` · ${esc(concept.name)}` : ""}</p>
          <span class="round__worth mono">${curStage().points} pts</span>
        </div>
        <h2 id="game-h" class="round__q" tabindex="-1">${esc(c.prompt)}</h2>
        ${hintBox(s, c)}
        ${body}
        ${c.answered ? feedback(s, c) : ""}
      </div>`;
  }

  function hintBox(s, c) {
    if (c.hinted) return `<div class="hint" role="note"><span class="mono">Hint</span><p>${esc(c.hint)}</p></div>`;
    if (c.answered || !c.hint) return "";
    return `<button class="hint-btn mono" data-action="hint">Need a hint? <span>Costs the +${Math.round(curStage().points * (s.game.bonus || 0))} bonus</span></button>`;
  }

  function roundMcq(c) {
    return `<div class="opts" role="group" aria-label="Answers">${c.options.map((o, i) => {
      let cls = "", mark = "";
      if (c.answered) {
        if (o.id === c.answer) { cls = "is-right"; mark = `<span class="opt__mark">✓<span class="sr-only"> correct answer</span></span>`; }
        else if (o.id === c.chosen) { cls = "is-wrong"; mark = `<span class="opt__mark">✕<span class="sr-only"> your answer</span></span>`; }
        else cls = "is-dim";
      }
      return `<button class="opt ${cls}" style="--n:${i}" data-action="mcq" data-opt="${o.id}" ${c.answered ? "disabled" : ""}>
        <span class="opt__key mono">${"ABCD"[i]}</span><span class="opt__text">${esc(o.text)}</span>${mark}</button>`;
    }).join("")}</div>`;
  }

  function roundSpot(c) {
    return `<div class="opts opts--spot" role="group" aria-label="Statements">${c.view.map((v, n) => {
      let cls = "", mark = "", note = "";
      if (c.answered) {
        if (v.i === c.wrong) { cls = "is-right"; mark = `<span class="opt__mark">✕</span>`; note = `<small class="mono">This is the mistake</small>`; }
        else if (v.i === c.chosen) { cls = "is-wrong"; mark = `<span class="opt__mark">✓</span>`; note = `<small class="mono">You picked this, but it's correct</small>`; }
        else cls = "is-dim";
      }
      return `<button class="opt opt--spot ${cls}" style="--n:${n}" data-action="spot" data-i="${v.i}" ${c.answered ? "disabled" : ""}>
        <span class="opt__key mono" aria-hidden="true">?</span><span class="opt__text">${esc(v.t)}${note}</span>${mark}</button>`;
    }).join("")}</div>`;
  }

  function roundOrder(c) {
    const n = c.current.length;
    return `<ol class="order">${c.current.map((itemIdx, pos) => {
      const ok = c.answered ? itemIdx === pos : null;
      return `<li class="order__row ${ok === true ? "is-right" : ok === false ? "is-wrong" : ""}${G.moved === pos ? " is-moved" : ""}" style="--n:${pos}">
        <span class="order__pos mono">${pad(pos + 1)}</span>
        <span class="order__text">${esc(c.items[itemIdx])}${c.answered && !ok ? `<small class="mono">belongs at ${pad(itemIdx + 1)}</small>` : ""}</span>
        ${c.answered ? `<span class="opt__mark">${ok ? "✓" : "✕"}<span class="sr-only">${ok ? " correct position" : " wrong position"}</span></span>` : `
        <span class="order__ctl">
          <button class="mv" data-action="up" data-pos="${pos}" ${pos === 0 ? "disabled" : ""} aria-label="Move “${esc(c.items[itemIdx])}” up">↑</button>
          <button class="mv" data-action="down" data-pos="${pos}" ${pos === n - 1 ? "disabled" : ""} aria-label="Move “${esc(c.items[itemIdx])}” down">↓</button>
        </span>`}
      </li>`;
    }).join("")}</ol>
    ${c.answered ? "" : `<div class="actions"><button class="btn btn--pink" data-action="lock">Lock in order</button></div>`}`;
  }

  function roundMatch(c) {
    const all = c.items.length, picked = Object.keys(c.picks).length;
    return `<div class="match">${c.order.map((itemIdx) => {
      const it = c.items[itemIdx], pick = c.picks[itemIdx];
      const ok = c.answered ? pick === it.answer : null;
      return `<div class="match__row ${ok === true ? "is-right" : ok === false ? "is-wrong" : ""}${G.picked === itemIdx ? " is-picked-row" : ""}" style="--n:${c.order.indexOf(itemIdx)}" role="radiogroup" aria-label="${esc(it.text)}">
        <p class="match__text">${esc(it.text)}${c.answered && !ok ? `<small class="mono">Answer: ${esc(it.answer)}</small>` : ""}</p>
        <div class="match__cats">${c.categories.map((cat) =>
          `<button class="cat ${pick === cat ? "is-picked" : ""}" role="radio" aria-checked="${pick === cat}" data-action="pick" data-i="${itemIdx}" data-c="${esc(cat)}" ${c.answered ? "disabled" : ""}>${esc(cat)}</button>`
        ).join("")}</div>
      </div>`;
    }).join("")}</div>
    ${c.answered ? "" : `<div class="actions"><button class="btn btn--pink" data-action="check" ${picked < all ? "disabled" : ""}>Check matches</button><span class="mono hint-count">${picked}/${all} placed</span></div>`}`;
  }

  function feedback(s, c) {
    const verdict = c.f === 1 ? (c.bonus ? "Clean hit." : "Correct.") : c.f > 0 ? "Partly right." : "Not this time.";
    const lastInStage = G.ci === curStage().challenges.length - 1;
    const lastStage = G.si === G.stages.length - 1;
    const nt = drillNext();
    const nextLabel = nt.finish ? "See results" : nt.si !== G.si ? `On to ${G.stages[nt.si].label.toLowerCase()} →` : "Next challenge →";
    return `<div class="fb fb--${c.f === 1 ? "ok" : c.f > 0 ? "part" : "miss"}">
      <div class="fb__head">
        <p class="fb__verdict">${verdict}</p>
        <p class="fb__pts mono">+${c.pts}${c.bonus ? ` <span>+${c.bonus} no-hint bonus</span>` : ""}${c.f === 1 && c.hinted ? ` <span>bonus spent on hint</span>` : ""}</p>
      </div>
      <p>${esc(c.explain)}</p>
      <p class="fb__src mono">From the session: ${esc(c.source)}</p>
      <button class="btn btn--charcoal" data-action="next" id="next-btn">${nextLabel}</button>
    </div>`;
  }

  /* Free round navigation for the drill. Opening a round lands on its first unanswered
     challenge (or its title card if untouched); answers already given are kept as they were. */
  function drillOpen(si, ci) {
    const st = G.stages[si], firstOpen = st.challenges.findIndex((c) => !c.answered);
    G.si = si;
    G.ci = ci !== undefined ? ci : firstOpen >= 0 ? firstOpen : 0;
    G.phase = st.challenges.some((c) => c.answered) || ci !== undefined && ci > 0 ? "play" : "stage";
  }
  function drillNext() {
    if (G.ci < curStage().challenges.length - 1 && !curStage().challenges[G.ci + 1].answered) return { si: G.si, ci: G.ci + 1 };
    const later = G.stages.findIndex((st, si) => si > G.si && st.challenges.some((c) => !c.answered));
    const any = later >= 0 ? later : G.stages.findIndex((st) => st.challenges.some((c) => !c.answered));
    if (any < 0) return { finish: true };
    return { si: any, ci: G.stages[any].challenges.findIndex((c) => !c.answered) };
  }

  function scoreChallenge(s, c) {
    let f = 0;
    if (c.type === "mcq") f = c.chosen === c.answer ? 1 : 0;
    if (c.type === "spot") f = c.chosen === c.wrong ? 1 : 0;
    if (c.type === "order") f = c.current.filter((v, i) => v === i).length / c.items.length;
    if (c.type === "match") f = c.items.filter((it, i) => c.picks[i] === it.answer).length / c.items.length;
    const pts = curStage().points;
    c.f = f;
    c.pts = Math.round(pts * f);
    c.bonus = f === 1 && !c.hinted ? Math.round(pts * (s.game.bonus || 0)) : 0;
    c.answered = true;
    G.score += c.pts + c.bonus;
    G.lastDelta = c.pts + c.bonus; G.deltaShown = false;
    if (f === 1) { G.streak++; G.bestStreak = Math.max(G.bestStreak, G.streak); } else G.streak = 0;
    announce(f === 1 ? `Correct. ${c.pts + c.bonus} points.` : f > 0 ? `Partly right. ${c.pts} points.` : "Not correct. 0 points.");
  }

  /* results maths: accuracy excludes bonuses, so hints don't hide what you actually knew */
  function runSummary(s) {
    const all = G.stages.flatMap((st) => st.challenges.map((c) => ({ c, w: st.points })));
    const possible = all.reduce((a, x) => a + x.w, 0);
    const earned = all.reduce((a, x) => a + x.w * x.c.f, 0);
    const pct = possible ? Math.round((earned / possible) * 100) : 0;
    const concepts = {};
    all.forEach(({ c, w }) => {
      const k = c.concept || "other";
      concepts[k] = concepts[k] || { w: 0, e: 0 };
      concepts[k].w += w; concepts[k].e += w * c.f;
    });
    const mastered = [], revisit = [];
    Object.entries(concepts).forEach(([k, v]) => {
      const meta = (s.concepts || {})[k] || { name: k, chapter: 0 };
      const item = { k, name: meta.name, chapter: meta.chapter, pct: Math.round((v.e / v.w) * 100) };
      (item.pct >= 80 ? mastered : revisit).push(item);
    });
    const stages = G.stages.map((st) => {
      const w = st.points * st.challenges.length, e = st.challenges.reduce((a, c) => a + st.points * c.f, 0);
      return { id: st.id, label: st.label, title: st.title, pct: Math.round((e / w) * 100), perfect: st.challenges.every((c) => c.f === 1) };
    });
    const title = (s.game.titles || []).find((t) => pct >= t.min) || { name: "Finished" };
    return { pct, mastered, revisit, stages, title: title.name, perfect: all.every((x) => x.c.f === 1) };
  }

  function finishGame(s) {
    const before = unlockedIds();
    const xpBefore = xpInfo();
    const sum = runSummary(s);
    const st = stat(s.id);
    const prevBest = st.best;
    st.plays += 1;
    st.last = G.score; st.lastPct = sum.pct;
    st.best = Math.max(st.best, G.score);
    st.bestPct = Math.max(st.bestPct, sum.pct);
    st.completedAt = st.completedAt || new Date().toISOString();
    if (G.hints === 0) st.flags.noHints = true;
    if (sum.perfect) st.flags.perfect = true;
    sum.stages.forEach((x) => { if (x.perfect) st.flags["stage:" + x.id] = true; });
    st.concepts = st.concepts || {};
    sum.mastered.concat(sum.revisit).forEach((m) => { st.concepts[m.k] = Math.max(st.concepts[m.k] || 0, m.pct); });
    st.runs = [{ score: G.score, pct: sum.pct, hints: G.hints, streak: G.bestStreak, title: sum.title, at: new Date().toISOString() }].concat(st.runs || []).slice(0, 8);
    save();
    G.summary = sum;
    G.newBest = G.score > prevBest;
    G.newAch = allAchievements().filter((a) => a.check() && !before.includes(a.id));
    G.xpGain = xpInfo().xp - xpBefore.xp;
    G.levelUp = xpInfo().level > xpBefore.level;
    G.phase = "end";
    updateHeaderStat();
    const ts = document.querySelector(".tabs__stat");
    if (ts) ts.textContent = `Best ${fmt(st.best)} pts · ${st.bestPct}% · ${st.plays} run${st.plays > 1 ? "s" : ""}`;
  }

  function gameEnd(s) {
    const sum = G.summary, x = xpInfo();
    return `
      <div class="ge">
        <div class="ge__top">
          <div>
            <p class="mono gi__eyebrow">${esc(s.game.name)} · results</p>
            <h2 id="game-h" class="ge__score" tabindex="-1"><span class="sr-only">Final score: </span><span class="countup" data-to="${G.score}">${fmt(G.score)}</span><small>/ ${fmt(maxScore(s))} pts</small></h2>
            <p class="ge__line mono">${sum.pct}% accuracy · ${G.hints} hint${G.hints === 1 ? "" : "s"} · best streak ×${G.bestStreak}${G.newBest ? ` · <b>new best</b>` : ""}</p>
          </div>
          <div class="earned"><span class="mono">Title earned</span><b>${esc(sum.title)}</b></div>
        </div>

        <div class="ge__xp">
          <p class="mono">XP ${G.xpGain > 0 ? `<b>+${fmt(G.xpGain)}</b>` : "+0 (beat your best or unlock an achievement to earn more)"} · Level ${x.level} ${esc(x.name)}${G.levelUp ? " · <b>level up</b>" : ""}</p>
          ${pixelBar(x.into, 24)}
        </div>

        ${G.newAch.length ? `<div class="ge__ach"><p class="mono">Unlocked this run</p><div class="objs objs--reveal">${G.newAch.map((a, i) => achObject(a, true, i)).join("")}</div></div>` : ""}

        <div class="ge__grid">
          <div>
            <h3 class="ge__h">Rounds</h3>
            <ol class="ge__stages">${sum.stages.map((x) => `
              <li><span class="mono">${esc(x.label)}</span><b>${esc(x.title)}</b>${pixelBar(x.pct / 100, 10)}<span class="mono">${x.pct}%</span></li>`).join("")}
            </ol>
          </div>
          <div>
            <h3 class="ge__h">Concepts mastered</h3>
            ${sum.mastered.length ? `<ul class="chips">${sum.mastered.map((m) => `<li class="chip-c chip-c--ok">${esc(m.name)} <span class="mono">${m.pct}%</span></li>`).join("")}</ul>` : `<p class="ge__empty">None at 80% yet. That's what replay is for.</p>`}
            <h3 class="ge__h">Worth revisiting</h3>
            ${sum.revisit.length ? `<ul class="chips">${sum.revisit.map((m) => `<li><button class="chip-c chip-c--re" data-action="revisit" data-ch="${m.chapter}">${esc(m.name)} <span class="mono">${m.pct}% · reread →</span></button></li>`).join("")}</ul>` : `<p class="ge__empty">Nothing. Every concept at 80% or above.</p>`}
          </div>
        </div>

        <div class="actions">
          <button class="btn btn--pink btn--big" data-action="replay">Replay ${esc(s.game.name)}</button>
          <a class="btn btn--ghost" href="#${s.id}">Review the session</a>
          <a class="btn btn--ghost" href="#progress">My progress</a>
        </div>
      </div>`;
  }

  function pixelBar(frac, cells) {
    const on = Math.round(Math.max(0, Math.min(1, frac)) * cells);
    return `<span class="pbar" aria-hidden="true">${Array.from({ length: cells }, (_, i) => `<i class="${i < on ? "on" : ""}" style="--i:${i}"></i>`).join("")}</span>`;
  }

  function celebrate(pct) {
    const el = document.getElementById("game");
    if (!el) return;
    const counter = el.querySelector(".countup");
    if (reduceMotion()) return;
    if (counter) {
      const to = +counter.dataset.to, t0 = performance.now(), dur = 1100;
      const tick = (t) => {
        const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        counter.textContent = fmt(Math.round(to * e));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    const burst = document.createElement("div");
    burst.className = "burst"; burst.setAttribute("aria-hidden", "true");
    const n = pct >= 80 ? 46 : 24, cols = ["cobalt", "pink", "mint", "ivory"];
    for (let i = 0; i < n; i++) {
      const p = document.createElement("i");
      const ang = Math.random() * Math.PI * 2, dist = 120 + Math.random() * 260;
      p.style.setProperty("--x", `${Math.cos(ang) * dist}px`);
      p.style.setProperty("--y", `${Math.sin(ang) * dist - 80}px`);
      p.style.setProperty("--r", `${Math.random() * 360}deg`);
      p.style.background = `var(--${cols[i % cols.length]})`;
      p.style.animationDelay = `${Math.random() * 120}ms`;
      burst.appendChild(p);
    }
    el.appendChild(burst);
    setTimeout(() => burst.remove(), 1800);
  }

  function rerenderGame(focusSel) {
    const s = byId(G.sid), el = document.getElementById("game");
    if (!el) return;
    const key = gameKey();
    G.fresh = key !== G.lastKey;
    G.lastKey = key;
    const arena = el.closest(".game");
    if (arena) arena.dataset.stage = stageMark();
    el.innerHTML = gameInner(s);
    G.fresh = false; G.moved = null; G.picked = null; G.deltaShown = true;
    const f = el.querySelector(focusSel || "#game-h");
    if (f) f.focus({ preventScroll: true });
    const frameTop = el.getBoundingClientRect().top;
    if (!focusSel && (frameTop < 60 || frameTop > window.innerHeight * 0.6)) {
      window.scrollTo({ top: window.scrollY + frameTop - 90, behavior: reduceMotion() ? "auto" : "smooth" });
    }
    if (G.phase === "end") celebrate(G.summary.pct);
  }

  /* ==========================================================================
     SHIP IT — mission engine
     brief → workflow (pipeline puzzle) → debug (incidents with clues and
     system state) → ship (deploy sequence + one last call) → done.
     Rating = decisions solved on the first try. Wrong moves explain why
     and let you try again; nothing is a lost life.
     ========================================================================== */
  /* ==========================================================================
     PIXEL KIT — original sprites for the BUILD MODE world ("Fold World").
     Every sprite is a grid of characters → crisp SVG rects. Nothing is borrowed
     from an existing game: folded-corner blocks, a paper-plane cursor, a stubby
     ivory rocket and a five-by-seven type set drawn for UNFOLD.
     ========================================================================== */
  const C = { i: "#F5F1E8", d: "#E7E0D0", c: "#405CFF", b: "#2E46D6", p: "#FF72B6", m: "#64DCC0", k: "#292A2E", g: "#44464D", a: "#FFC94D", n: "#1D1E22" };
  function px(rows, pal, cls, groups = {}) {
    const w = Math.max(...rows.map((r) => r.length)), h = rows.length, out = {};
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length;) {
        const ch = row[x];
        if (!pal[ch]) { x++; continue; }
        let e = x; while (e < row.length && row[e] === ch) e++;
        const g = groups[ch] || "";
        (out[g] = out[g] || []).push(`<rect x="${x}" y="${y}" width="${e - x}" height="1" fill="${pal[ch]}"/>`);
        x = e;
      }
    });
    const body = Object.entries(out).map(([g, r]) => (g ? `<g class="${g}">${r.join("")}</g>` : r.join(""))).join("");
    return `<svg class="${cls}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" aria-hidden="true">${body}</svg>`;
  }
  /* rocket: 12 × 24, the last five rows are the exhaust (animated separately) */
  const ROCKET_ROWS = [
    ".....pp.....", "....pppp....", "....iiid....", "...iiiidd...", "...iiiiid...", "..iiiiiidd..",
    "..iiccccdd..", "..iicmmcdd..", "..iicmmcdd..", "..iiccccdd..", "..iiiiiidd..", "..iiiiiidd..",
    "..kkkkkkkk..", "..iiiiiidd..", ".piiiiiiddp.", "ppiiiiiiddpp", "ppiiiiiiddpp", "pp.gggggg.pp",
    "p...gggg...p", "....PPPP....", "....PMMP....", ".....MM.....", ".....II.....", "......I....."
  ];
  const ROCKET_PAL = Object.assign({}, C, { P: C.p, M: C.m, I: C.i });
  const ROCKET = (cls = "") => px(ROCKET_ROWS, ROCKET_PAL, `rk ${cls}`, { P: "rk__flame", M: "rk__flame", I: "rk__flame" });
  /* folded-corner block: the UNFOLD crease, as a tile */
  const BLOCK = (col = "i", cls = "") => px([
    "XXXXXX..", "XXXXXXp.", "XXXXXXpp", "XXXXXXXX", "XXXXXXXX", "XXXXXXXX", "XXXXXXXX", "nnnnnnnn"
  ], Object.assign({}, C, { X: C[col] }), `pxb ${cls}`);
  const STAR = (cls = "") => px(["..i..", "..i..", "iimii", "..i..", "..i.."], C, `pxs ${cls}`);
  /* paper-plane cursor, 11 × 6 */
  const CURSOR = px(["ii.........", ".iiii......", "..iiiiiiii.", "..dddddddii", ".pddd......", "pp........."], C, "pxc");
  /* stepped hills, seeded so they never jump between renders */
  function hills(seed, w = 240, h = 30, col = "#2B2D33", cls = "") {
    const r = rng(seed); let y = 18 + Math.floor(r() * 6), d = "M0 " + h, x = 0;
    while (x < w) { const run = 3 + Math.floor(r() * 9); d += `L${x} ${y}L${x + run} ${y}`; x += run; y = Math.max(4, Math.min(h - 3, y + (Math.floor(r() * 7) - 3))); }
    d += `L${w} ${h}Z`;
    return `<svg class="pxh ${cls}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax slice" shape-rendering="crispEdges" aria-hidden="true"><path d="${d}" fill="${col}"/></svg>`;
  }
  /* 5 × 7 type for the title, the countdown and the big banners */
  const GLYPH = {
    A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"], C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
    E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"], F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
    G: [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".###."], H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
    I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"], L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
    M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"], N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
    O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."], P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
    R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"], S: [".###.", "#...#", "#....", ".###.", "....#", "#...#", ".###."],
    T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."], U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
    1: ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."], 2: [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
    3: ["####.", "....#", "....#", ".###.", "....#", "....#", "####."], "-": [".....", ".....", ".....", ".###.", ".....", ".....", "....."],
    "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."], " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
    D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."], K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
    V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."], X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
    Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."], 0: [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
    4: ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."], "/": ["....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."]
  };
  function pxText(str, cls = "", fill = C.i, shade = C.p, shade2 = "") {
    const chars = [...str.toUpperCase()], w = chars.length * 6 + 1, h = 9;
    let a = "", b = "", c = "";
    chars.forEach((ch, n) => (GLYPH[ch] || GLYPH[" "]).forEach((row, y) => [...row].forEach((v, x) => {
      if (v !== "#") return;
      const X = n * 6 + x;
      a += `<rect x="${X}" y="${y}" width="1" height="1"/>`;
    })));
    if (shade2) c = `<g fill="${shade2}" transform="translate(2 2)">${a}</g>`;
    b = `<g fill="${shade}" transform="translate(1 1)">${a}</g>`;
    return `<svg class="pxt ${cls}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" aria-hidden="true">${c}${b}<g fill="${fill}">${a}</g></svg>`;
  }
  /* a fixed starfield, so stars hold their places across re-renders */
  function stars(seed, n, cls = "") {
    const r = rng(seed);
    return Array.from({ length: n }, (_, i) => {
      const big = r() < 0.22;
      return `<i class="pxstar${big ? " pxstar--big" : ""} ${cls}" style="left:${(r() * 98).toFixed(1)}%;top:${(r() * 86).toFixed(1)}%;--tw:${(2.6 + r() * 4).toFixed(2)}s;--td:${(-r() * 5).toFixed(2)}s"></i>`;
    }).join("");
  }

  const MSTAGES = [["brief", "The brief", "Mission and tools"], ["workflow", "Build the workflow", "Order the pipeline"], ["debug", "Debug", "Two live incidents"], ["ship", "Ship it", "Deploy and review"]];
  let M = null, shipTimer = 0;

  function newMission(s) {
    const w = s.mission.workflow;
    M = {
      sid: s.id, phase: "title",
      tray: shuffle(w.steps.map((x) => x.id).concat(w.decoys.map((x) => x.id))),
      slots: w.steps.map(() => null), locked: w.steps.map(() => false),
      wfAttempts: 0, wfFeedback: null, wfSolved: false, wfFlash: [],
      inc: 0, incs: s.mission.incidents.map(() => ({ opened: [], tried: [], solved: false, ahead: 1, log: [] })),
      shipStep: -1, finalTried: [], finalSolved: false, finalLog: [],
      first: {}, lastKey: null
    };
  }
  const mCard = (s, id) => s.mission.workflow.steps.find((x) => x.id === id) || s.mission.workflow.decoys.find((x) => x.id === id);
  const mMark = () => ({ title: "title", brief: "intro", workflow: "flow", debug: "debug", ship: "ship", done: "end" })[M.phase];
  const mKey = () => `${M.phase}-${M.inc}`;
  const fillAhead = (t, n) => t.replace("{ahead}", n).replace("{s}", n === 1 ? "" : "s");

  function tabStat(s) {
    const st = peek(s.id), ms = st.mission;
    const bits = [];
    if (ms && ms.plays) bits.push(`${s.mission.name}: ${mRating(s, ms.bestFirst).name}`);
    if (st.plays) bits.push(`Drill best ${fmt(st.best)} pts · ${st.bestPct}%`);
    return bits.join(" · ") || "Not played yet";
  }
  const mRating = (s, n) => s.mission.ratings.find((r) => n >= r.min) || s.mission.ratings[s.mission.ratings.length - 1];

  const WIPE = (() => { const r = rng(808); let h = ""; for (let i = 0; i < 60; i++) h += `<i style="--wd:${(r() * 0.42).toFixed(2)}s"></i>`; return h; })();
  function missionShell(s) {
    if (!M || M.sid !== s.id) newMission(s);
    M.lastKey = mKey();
    M.boot = true; /* entering the tab switches the set on */
    const html = `<section class="game game--mission" aria-labelledby="game-h" data-stage="${mMark()}" data-lit="${mSolvedCount(s)}">
      <div class="fw" aria-hidden="true">
        <div class="fw__sky">${stars(77, 54)}</div>
        ${BLOCK("c", "fw__blk fw__blk--1")}${BLOCK("p", "fw__blk fw__blk--2")}${BLOCK("i", "fw__blk fw__blk--3")}${BLOCK("m", "fw__blk fw__blk--4")}${BLOCK("c", "fw__blk fw__blk--5")}${BLOCK("i", "fw__blk fw__blk--6")}
        ${hills(5, 240, 30, "#30323A", "fw__hills fw__hills--far")}${hills(9, 200, 24, "#1D1E22", "fw__hills fw__hills--near")}
        <span class="fw__label mono">${esc(s.mission.name)} · Session ${esc(s.number)}<br>${esc(s.mode || "BUILD MODE")} · Fold World</span>
      </div>
      <div class="wrap game__wrap"><div class="game__frame tv" id="game">${missionInner(s)}</div>
        <p class="tv__brand mono" aria-hidden="true"><i></i>UNFOLD · ${esc(s.mode || "BUILD MODE")} · CH ${esc(s.number)}</p></div>
    </section>`;
    M.boot = false;
    return html;
  }

  /* Free navigation: any stage can be opened at any time. Status is derived from what the
     player actually did, so jumping ahead never marks earlier stages complete. */
  function mDecisionSolved(s, id) {
    const mi = s.mission;
    if (id === "workflow") return M.wfSolved;
    if (id === mi.ship.final.id) return M.finalSolved;
    const k = mi.incidents.findIndex((x) => x.id === id);
    return k >= 0 && M.incs[k].solved;
  }
  const mSolvedCount = (s) => s.mission.decisions.filter((d) => mDecisionSolved(s, d.id)).length;
  function mStageStatus(s, key) {
    if (key === "brief") return M.briefSeen ? "done" : M.briefOpened ? "wip" : "";
    if (key === "workflow") return M.wfSolved ? "done" : M.wfAttempts || M.slots.some(Boolean) ? "wip" : "";
    if (key === "debug") return M.incs.every((x) => x.solved) ? "done" : M.incs.some((x) => x.solved || x.opened.length || x.tried.length) ? "wip" : "";
    if (key === "ship") return M.finalSolved ? "done" : M.shipStep >= 0 || M.finalTried.length ? "wip" : "";
    return "";
  }
  /* where each decision lives, for "jump to what's still open" links */
  function mDecisionTarget(s, id) {
    const mi = s.mission, k = mi.incidents.findIndex((x) => x.id === id);
    if (id === "workflow") return { phase: "workflow", inc: M.inc, label: "Build the workflow" };
    if (k >= 0) return { phase: "debug", inc: k, label: `Debug · incident ${k + 1}` };
    return { phase: "ship", inc: M.inc, label: "Ship it" };
  }
  /* The level map: four platforms in a little world, joined by paths that light up
     as stages are completed, ending at the launchpad. Nodes are ordinary buttons. */
  const NODE = [[8, 34], [28, 54], [49, 38], [69, 58]];
  const NODE_SHORT = ["Brief", "Build", "Debug", "Ship"];
  const UNLOCK = { workflow: [17, 12], push: [38, 8], memory: [58, 10], pr: [77, 6] };
  function mRail() { return mWorld(byId(M.sid), true); }
  function mWorld(s, nav) {
    const mi = s.mission, done = M.phase === "done", n = mSolvedCount(s), total = mi.decisions.length;
    const status = MSTAGES.map(([key]) => (done && key !== "brief" ? "done" : mStageStatus(s, key)));
    const solved = mi.decisions.map((d) => mDecisionSolved(s, d.id));
    const prev = M.prevStatus || status, prevSolved = M.prevSolved || solved;
    M.prevStatus = status; M.prevSolved = solved;
    const here = MSTAGES.findIndex(([k]) => k === M.phase);
    const nodes = MSTAGES.map(([key, t], i) => {
      const st = status[i], now = !done && i === here;
      const said = st === "done" ? "completed" : st === "wip" ? "in progress" : "not started";
      const inner = `<span class="pw__block" aria-hidden="true"><span>${st === "done" ? "✓" : pad(i + 1)}</span></span><span class="pw__lbl" aria-hidden="true"><b>${NODE_SHORT[i]}</b><small>${st === "done" ? "Clear" : st === "wip" ? "In progress" : "Not started"}</small></span>`;
      return `<li class="pw__node${st === "done" ? " done" : ""}${st === "wip" ? " wip" : ""}${now ? " now" : ""}${st === "done" && prev[i] !== "done" ? " is-new" : ""}" style="--x:${NODE[i][0]}%;--y:${NODE[i][1]}%">
        ${nav ? `<button class="mrail__go" data-action="m-goto" data-phase="${key}"${now ? ' aria-current="step"' : ""} aria-label="Stage ${i + 1}: ${esc(t)}, ${said}">${inner}</button>` : `<span class="mrail__go">${inner}</span>`}
        <i class="pw__plat" aria-hidden="true"></i></li>`;
    }).join("");
    const linkSet = (kx, ky, padX) => {
      const pts = NODE.map(([x, y]) => [x * kx, y * ky]).concat([[padX, 16]]);
      return pts.slice(0, -1).map((p0, i) => {
        const p1 = pts[i + 1], lit = status[i] === "done";
        return `<line x1="${p0[0].toFixed(1)}" y1="${(100 - p0[1] + 4).toFixed(1)}" x2="${p1[0].toFixed(1)}" y2="${(100 - p1[1] + 4).toFixed(1)}" class="${lit ? "lit" : ""}${lit && prev[i] !== "done" ? " is-new" : ""}"/>`;
      }).join("");
    };
    const links = `<g class="pw__lg">${linkSet(1, 1, 88)}</g><g class="pw__lg pw__lg--m">${linkSet(0.9, 0.8, 87)}</g>`;
    const unlocks = mi.decisions.map((d, k) => {
      const u = UNLOCK[d.id] || [18 + k * 20, 10], on = solved[k];
      return `<span class="pw__unlock${on ? " on" : ""}${on && !prevSolved[k] ? " is-new" : ""}" style="--x:${u[0]}%;--y:${u[1]}%">${BLOCK(["m", "c", "p", "i"][k % 4])}${BLOCK(["i", "m", "c", "p"][k % 4])}${STAR()}</span>`;
    }).join("");
    const cur = !done && here >= 0 ? `<span class="pw__cur" style="--x:${NODE[here][0]}%;--y:${NODE[here][1]}%" aria-hidden="true">${CURSOR}</span>` : "";
    const first = mi.decisions.filter((d) => M.first[d.id]).length;
    const ready = n === total && !done;
    return `<div class="pw-wrap">
      <p class="pw__hud mono"><span>▶ ${esc(mi.name)} · ${done ? "Mission complete" : here >= 0 ? `Stage ${pad(here + 1)}/${pad(MSTAGES.length)}` : "Title"}</span><span>Launch readiness <b>${n}/${total}</b><span class="pw__hud-x"> · first try <b>${first}</b></span></span></p>
      <div class="pw${done ? " is-done" : ""}${ready ? " is-ready" : ""}">
        <div class="pw__sky" aria-hidden="true">${stars(12, 26)}</div>
        ${hills(3, 240, 30, "#30323A", "pw__hills")}
        <i class="pw__ground" aria-hidden="true"></i>
        <svg class="pw__links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${links}</svg>
        <div class="pw__unlocks" aria-hidden="true">${unlocks}</div>
        ${nav ? `<nav class="pw__nav" aria-label="Mission stages"><ol class="mrail">${nodes}</ol></nav>` : `<ol class="mrail" aria-hidden="true">${nodes}</ol>`}
        ${cur}
        ${mPad(s)}
      </div>
      ${ready ? `<div class="pw__go"><button class="mpad__go" data-action="m-launch"><span aria-hidden="true">▲ </span>All systems go · Launch</button></div>` : ""}
    </div>`;
  }

  /* launchpad: four lamps (one per decision), a T-minus readout and the rocket on its pad */
  function mPad(s) {
    const mi = s.mission, n = mSolvedCount(s), total = mi.decisions.length, done = M.phase === "done";
    const boost = M.lastCharge !== undefined && n > M.lastCharge;
    M.lastCharge = n;
    return `<div class="mpad${boost ? " is-boost" : ""}${n ? " is-armed" : ""}${n === total ? " is-ready" : ""}${done ? " is-gone" : ""}" style="--charge:${(n / total).toFixed(2)}">
      <span class="mpad__t" aria-hidden="true">${n === total ? "GO" : "T-" + (total - n)}</span>
      <ol class="mpad__sys">${mi.decisions.map((d) => `<li class="${mDecisionSolved(s, d.id) ? "on" : ""}" title="${esc(d.label)}"><span class="sr-only">${esc(d.label)}: ${mDecisionSolved(s, d.id) ? "ready" : "not ready"}</span></li>`).join("")}</ol>
      ${done ? "" : ROCKET("rk--pad")}
      <i class="mpad__glow" aria-hidden="true"></i><i class="mpad__base" aria-hidden="true"></i>
    </div>`;
  }

  function missionInner(s) {
    const mi = s.mission;
    let body;
    if (M.phase === "title") body = mTitle(s, mi);
    else if (M.phase === "brief") body = mBrief(s, mi);
    else if (M.phase === "done") body = mDone(s, mi);
    else body = mRail() + (M.phase === "workflow" ? mWorkflow(s, mi) : M.phase === "debug" ? mDebug(s, mi) : mShip(s, mi));
    const still = reduceMotion();
    const pop = M.pop && !still ? `<div class="pxpop" aria-hidden="true">${pxText(M.pop, "pxpop__t", C.i, C.p)}${M.popSub ? `<span class="mono">${esc(M.popSub)}</span>` : ""}</div>` : "";
    return `<div class="crt${M.boot && !still ? " is-boot" : ""}${M.glitch && !still ? " is-glitch" : ""}" data-screen="${M.phase}">
      <div class="crt__in">${body}</div>${pop}
      <i class="crt__fx" aria-hidden="true"></i>${M.glitch && !still ? `<i class="crt__err" aria-hidden="true"></i>` : ""}${M.boot && !still ? `<div class="crt__wipe" aria-hidden="true">${WIPE}</div>` : ""}
    </div>`;
  }

  /* title screen: switch the set on, show the world, press start */
  function mTitle(s, mi) {
    const ms = peek(s.id).mission;
    return `<div class="mt">
      <div class="mt__scene" aria-hidden="true">
        <div class="mt__sky">${stars(31, 40)}</div>
        ${BLOCK("p", "mt__blk mt__blk--1")}${BLOCK("i", "mt__blk mt__blk--2")}${BLOCK("m", "mt__blk mt__blk--3")}${BLOCK("c", "mt__blk mt__blk--4")}${BLOCK("i", "mt__blk mt__blk--5")}
        ${hills(21, 160, 30, "#30323A", "mt__hills mt__hills--far")}${hills(44, 120, 24, "#1D1E22", "mt__hills")}
        <div class="mt__pad"><span class="mt__gantry"><i></i><i></i><i></i><i></i></span>${ROCKET("rk--title")}<i class="mt__base"></i></div>
        <i class="mt__ground"></i>
      </div>
      <div class="mt__copy">
        <p class="mono mt__eyebrow">Session ${esc(s.number)} · ${esc(s.mode || "BUILD MODE")} · 1 player</p>
        <h2 id="game-h" class="mt__title" tabindex="-1"><span class="sr-only">${esc(mi.name)}</span>${pxText(mi.name, "mt__word", C.i, C.p)}</h2>
        <p class="mt__tag">${esc(mi.tagline)}</p>
        <button class="mt__start" data-action="m-title"><span aria-hidden="true">▶&nbsp;</span>Start game</button>
        <p class="mono mt__hint" aria-hidden="true">Press start</p>
        <div class="mt__row">
          <button class="btn-mini mono mt__skip" data-action="m-skip">Skip intro · go to Stage 02</button>
          <span class="mono mt__best">${ms && ms.plays ? `Best · ${esc(mRating(s, ms.bestFirst).name)} · ${ms.bestFirst}/${mi.decisions.length} first try` : "Best · no run yet"}</span>
        </div>
      </div>
    </div>`;
  }

  function mBrief(s, mi) {
    const ms = peek(s.id).mission;
    M.briefOpened = true;
    return `<div class="mb${M.fresh !== false ? " is-fresh" : ""}">
      ${mRail()}
      <p class="mono gi__eyebrow">Session ${esc(s.number)} · ${esc(s.mode || "BUILD MODE")} · mission</p>
      <h2 id="game-h" class="gi__title" tabindex="-1">${esc(mi.name)}</h2>
      <p class="gi__tag">${esc(mi.tagline)}</p>
      <div class="mb__grid">
        <div class="mb__case">
          <p class="mono mb__k">Situation</p>
          <p class="mb__sit">${esc(mi.brief.situation)}</p>
          <p class="mono mb__k">Objective</p>
          <p class="mb__obj">${esc(mi.brief.objective)}</p>
          <ol class="mb__plan">${MSTAGES.slice(1).map(([, t, d], i) => `<li><span class="mono">${pad(i + 2)}</span><b>${esc(t)}</b><small class="mono">${esc(d)}</small></li>`).join("")}</ol>
        </div>
        <div class="mb__tools">
          <p class="mono mb__k">Your tools</p>
          <ul>${mi.brief.tools.map((t) => `<li><b>${esc(t.name)}</b><span>${esc(t.role)}</span></li>`).join("")}</ul>
        </div>
      </div>
      <div class="actions">
        <button class="btn btn--pink btn--big" data-action="m-start">${M.briefSeen || M.resumePhase ? "Back to the mission" : ms && ms.plays ? "Run the mission again" : "Accept the mission"}</button>
        <a class="btn btn--ghost" href="#${s.id}-drill">Concept drill · ${challengesOf(s).length} challenges</a>
        ${ms && ms.plays ? `<span class="mono gi__best">Best: ${esc(mRating(s, ms.bestFirst).name)} · ${ms.bestFirst}/4 first try</span>` : ""}
      </div>
      <p class="mono mb__src">Built from the session: ${esc(mi.brief.source)}</p>
    </div>`;
  }

  function mWorkflow(s, mi) {
    const w = mi.workflow, filled = M.slots.filter(Boolean).length;
    const slots = M.slots.map((id, i) => {
      const card = id ? mCard(s, id) : null, locked = M.locked[i];
      return `<li class="slot${card ? " is-filled" : ""}${locked ? " is-locked" : ""}${M.wfFlash.includes(i) ? " is-bad" : ""}${M.snap === i ? " is-snap" : ""}" data-slot="${i}" style="--n:${i}">
        <span class="slot__n mono" aria-hidden="true">${locked ? "✓" : pad(i + 1)}</span>
        ${card
          ? `<button class="wcard wcard--placed" data-action="m-slot" data-i="${i}" data-card="${id}" data-from="${i}" ${locked ? "disabled" : 'draggable="true"'} aria-label="Step ${i + 1}: ${esc(card.text)}${locked ? ", correct and locked" : ". Activate to send back to the cards"}">${esc(card.text)}</button>`
          : `<button class="slot__empty" data-action="m-place" data-i="${i}" aria-label="Step ${i + 1}, empty.${M.sel ? " Place the selected card here." : " Select a card first."}">Step ${i + 1}<br><small>drop or tap a card</small></button>`}
      </li>`;
    }).join("");
    const tray = M.tray.map((id) => `<button class="wcard${M.sel === id ? " is-selected" : ""}" draggable="true" data-card="${id}" data-action="m-card" aria-pressed="${M.sel === id}" aria-label="Select: ${esc(mCard(s, id).text)}">${esc(mCard(s, id).text)}</button>`).join("");
    const fb = M.wfFeedback;
    return `<div class="mw${M.fresh !== false ? " is-fresh" : ""}">
      <div class="round__top"><p class="round__tag mono">Stage 02 · Build the workflow</p><span class="round__worth mono">Run ${M.wfAttempts + (M.wfSolved ? 0 : 1)}</span></div>
      <h2 id="game-h" class="round__q" tabindex="-1">${esc(w.prompt)}</h2>
      ${M.wfSolved ? "" : `<p class="mw__how">Drag a card onto a step, or tap a card and then tap the step it belongs in. Tap a placed card to send it back. ${w.decoys.length} cards don't belong.</p>`}
      <ol class="pipe${M.wfSolved ? " is-live" : ""}${M.sel ? " is-picking" : ""}" aria-label="Pipeline">${slots}</ol>
      ${M.wfSolved ? "" : `<div class="tray" data-tray aria-label="Cards">${tray || `<p class="mono tray__empty">All cards placed</p>`}</div>
      <div class="actions"><button class="btn btn--pink" data-action="m-check" ${filled < M.slots.length ? "disabled" : ""}>Run the pipeline</button><span class="mono hint-count">${filled}/${M.slots.length} steps filled</span></div>`}
      ${fb ? (fb.ok
        ? `<div class="fb fb--ok" tabindex="-1"><div class="fb__head"><p class="fb__verdict">Pipeline live.</p><p class="fb__pts mono">${M.wfAttempts === 1 ? "first run" : `solved on run ${M.wfAttempts}`}</p></div><p>${esc(w.success)}</p><p class="fb__src mono">From the session: ${esc(w.source)}</p><button class="btn btn--charcoal" id="m-next" data-action="m-next">${mNextLabel(s)}</button></div>`
        : `<div class="fb fb--miss" tabindex="-1"><div class="fb__head"><p class="fb__verdict">Pipeline failed.</p><p class="fb__pts mono">${M.locked.filter(Boolean).length}/${M.slots.length} steps right · locked in</p></div><ul class="fb__why">${fb.items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul><p class="mono">The wrong cards went back. Fix the empty steps and run it again.</p></div>`) : ""}
    </div>`;
  }

  function mCheck(s) {
    const w = s.mission.workflow, bad = [], why = [];
    M.wfAttempts++;
    M.slots.forEach((id, i) => { if (M.locked[i]) return; if (id === w.steps[i].id) M.locked[i] = true; else bad.push(i); });
    if (!bad.length) {
      M.wfSolved = true; M.wfFlash = [];
      if (M.first.workflow === undefined) M.first.workflow = M.wfAttempts === 1;
      M.wfFeedback = { ok: true };
      M.pop = "Pipeline live"; M.popSub = `System ${mSolvedCount(s)}/${s.mission.decisions.length} online`;
      announce("Pipeline live. " + w.success);
      return;
    }
    if (M.first.workflow === undefined) M.first.workflow = false;
    bad.forEach((i) => {
      const id = M.slots[i], d = w.decoys.find((x) => x.id === id);
      if (d) why.push(d.why);
      else { const j = w.steps.findIndex((x) => x.id === id); why.push(w.rules[j > i ? j - 1 : j]); }
    });
    bad.forEach((i) => { M.tray.push(M.slots[i]); M.slots[i] = null; });
    M.wfFlash = bad; M.glitch = true;
    M.wfFeedback = { ok: false, items: [...new Set(why)].slice(0, 3) };
    announce(`Pipeline failed. ${M.locked.filter(Boolean).length} of ${M.slots.length} steps right. ${M.wfFeedback.items.join(" ")}`);
  }

  function mNodes(nodes, solved, ahead, cls = "") {
    return `<ol class="sys${solved ? " is-solved" : ""} ${cls}" aria-label="System state">${nodes.map((n, i) =>
      `<li style="--n:${i}"><span class="mono">${esc(n.label)}</span><b>${esc(fillAhead(solved ? n.after : n.before, ahead))}</b></li>`).join("")}</ol>`;
  }

  function mDebug(s, mi) {
    const inc = mi.incidents[M.inc], st = M.incs[M.inc], gate = !st.opened.length;
    const last = M.inc === mi.incidents.length - 1;
    return `<div class="md${M.fresh !== false ? " is-fresh" : ""}">
      <div class="round__top"><p class="round__tag mono">Stage 03 · Debug · incident ${M.inc + 1} of ${mi.incidents.length}</p><span class="round__worth mono">${st.solved ? "resolved" : "open"}</span></div>
      <div class="minc" role="group" aria-label="Incidents">${mi.incidents.map((x, k) => {
        const xs = M.incs[k], tag = xs.solved ? "✓ resolved" : xs.opened.length || xs.tried.length ? "in progress" : "open";
        return `<button class="minc__go${k === M.inc ? " is-now" : ""}${xs.solved ? " is-done" : ""}" data-action="m-inc" data-i="${k}"${k === M.inc ? ' aria-current="true"' : ""}><span class="mono">Incident ${k + 1} · ${tag}</span><b>${esc(x.title)}</b></button>`;
      }).join("")}</div>
      <h2 id="game-h" class="round__q" tabindex="-1">${esc(inc.title)}</h2>
      <p class="md__report">${esc(inc.report)}</p>
      ${mNodes(inc.nodes, st.solved, st.ahead)}
      <div class="md__grid">
        <div>
          <p class="mono mb__k">Clues · tap to inspect</p>
          <div class="clues">${inc.clues.map((c) => {
            const open = st.opened.includes(c.id);
            return `<div class="clue${open ? " is-open" : ""}${M.justOpened === c.id ? " is-new" : ""}">
              <button class="clue__head" data-action="m-clue" data-id="${c.id}" aria-expanded="${open}"><span class="mono">${open ? "Inspected" : "Inspect"}</span><b>${esc(c.label)}</b></button>
              ${open ? `<pre class="clue__body">${c.lines.map((l) => esc(fillAhead(l, st.ahead))).join("\n")}</pre>` : ""}
            </div>`;
          }).join("")}</div>
        </div>
        <div>
          <p class="mono mb__k">Your move</p>
          <div class="acts" role="group" aria-label="Actions">${inc.actions.map((a) => {
            const tried = st.tried.includes(a.id), win = st.solved && a.correct;
            return `<button class="act${tried ? " is-tried" : ""}${win ? " is-win" : ""}" data-action="m-act" data-id="${a.id}" ${gate || st.solved || tried ? "disabled" : ""}>${esc(a.text)}${tried ? '<span class="sr-only"> (tried)</span>' : ""}</button>`;
          }).join("")}</div>
          ${gate ? `<p class="mono act__gate">Inspect at least one clue to start diagnosing.</p>` : ""}
        </div>
      </div>
      ${st.log.length ? `<ol class="mlog" aria-label="What happened">${st.log.map((l, i) => `<li class="mlog__item ${l.ok ? "ok" : "miss"}${i === st.log.length - 1 ? " is-new" : ""}" tabindex="-1">${esc(l.text)}</li>`).join("")}</ol>` : ""}
      ${st.solved ? `<div class="fb fb--ok"><div class="fb__head"><p class="fb__verdict">Resolved.</p><p class="fb__pts mono">${M.first[inc.id] ? "first try" : `after ${st.tried.length} wrong turn${st.tried.length > 1 ? "s" : ""}`}</p></div><p>${esc(inc.explain)}</p><p class="fb__src mono">From the session: ${esc(inc.source)}</p><button class="btn btn--charcoal" id="m-next" data-action="m-next">${mNextLabel(s)}</button></div>` : ""}
    </div>`;
  }

  function mShip(s, mi) {
    const sh = mi.ship, f = sh.final, step = M.shipStep, done = step >= sh.log.length - 1;
    const lit = step < 0 ? -1 : sh.log[Math.min(step, sh.log.length - 1)].node;
    return `<div class="ms${M.fresh !== false ? " is-fresh" : ""}">
      <div class="round__top"><p class="round__tag mono">Stage 04 · Ship it</p><span class="round__worth mono">${done ? "live" : step >= 0 ? "deploying" : "ready"}</span></div>
      <h2 id="game-h" class="round__q" tabindex="-1">${done ? "It's live." : "Push to main."}</h2>
      <p class="md__report">${esc(sh.intro)}</p>
      <ol class="sys sys--ship" aria-label="Deployment">${sh.nodes.map((n, i) => `<li class="${i <= lit ? "is-lit" : ""}" style="--n:${i}"><span class="mono">${pad(i + 1)}</span><b>${esc(n)}</b></li>`).join("")}</ol>
      ${step < 0 ? `<div class="actions"><button class="btn btn--pink btn--big" data-action="m-ship" id="m-ship">Push to main</button></div>` : ""}
      ${step >= 0 ? `<ol class="deploy mono" aria-label="Deploy log">${sh.log.slice(0, step + 1).map((l, i) => `<li class="${i === step ? "is-new" : ""}">${esc(l.text)}</li>`).join("")}</ol>` : ""}
      ${done ? `<div class="final">
        <p class="mono mb__k">One last call</p>
        <p class="final__q" id="final-q">${esc(f.prompt)}</p>
        <div class="acts" role="group" aria-labelledby="final-q">${f.options.map((o) => {
          const tried = M.finalTried.includes(o.id), win = M.finalSolved && o.correct;
          return `<button class="act${tried ? " is-tried" : ""}${win ? " is-win" : ""}" data-action="m-final" data-id="${o.id}" ${M.finalSolved || tried ? "disabled" : ""}>${esc(o.text)}</button>`;
        }).join("")}</div>
        ${M.finalLog.length ? `<ol class="mlog">${M.finalLog.map((l, i) => `<li class="mlog__item ${l.ok ? "ok" : "miss"}${i === M.finalLog.length - 1 ? " is-new" : ""}" tabindex="-1">${esc(l.text)}</li>`).join("")}</ol>` : ""}
        ${M.finalSolved ? (mSolvedCount(s) === mi.decisions.length
          ? `<div class="actions"><button class="btn btn--pink btn--big" id="m-next" data-action="m-next">Complete the mission · launch</button><span class="mono fb__src">From the session: ${esc(f.source)}</span></div>`
          : `<div class="mhold"><p class="mono">Launch on hold · ${mi.decisions.length - mSolvedCount(s)} system${mi.decisions.length - mSolvedCount(s) > 1 ? "s" : ""} not ready</p><div class="actions">${mi.decisions.filter((d) => !mDecisionSolved(s, d.id)).map((d) => { const tg = mDecisionTarget(s, d.id); return `<button class="btn btn--ghost" data-action="m-goto" data-phase="${tg.phase}" data-inc="${tg.inc}">${esc(tg.label)} →</button>`; }).join("")}</div><p class="mono fb__src">From the session: ${esc(f.source)}</p></div>`) : ""}
      </div>` : ""}
    </div>`;
  }

  function mDone(s, mi) {
    const sum = M.summary, rating = mRating(s, sum.first);
    return `<div class="mdone">
      ${mWorld(s, false)}
      <div class="mdone__banner" aria-hidden="true">${pxText("Mission complete", "mdone__word", C.i, C.p)}</div>
      <p class="mono gi__eyebrow">${esc(mi.name)} · mission complete</p>
      <div class="ge__top">
        <h2 id="game-h" class="mdone__rating" tabindex="-1">${esc(rating.name)}</h2>
        <div class="earned"><span class="mono">First-try decisions</span><b>${sum.first} of ${mi.decisions.length}</b></div>
      </div>
      <p class="gi__tag">${esc(rating.line)}</p>
      <div class="mdone__orbit"><span class="mdone__sky" aria-hidden="true">${stars(5, 12)}</span>${ROCKET("rk--orbit")}<i class="mdone__trail" aria-hidden="true"></i><p class="mono">Launched · all ${mi.decisions.length} systems go</p><button class="btn-mini mono" data-action="m-relaunch">↻ Replay launch</button></div>
      <ol class="mdone__dec">${mi.decisions.map((d) => `<li class="${M.first[d.id] ? "ok" : "retry"}"><span class="mono">${M.first[d.id] ? "First try" : "After a retry"}</span><b>${esc(d.label)}</b></li>`).join("")}</ol>
      <div class="ge__xp"><p class="mono">XP ${sum.xpGain > 0 ? `<b>+${fmt(sum.xpGain)}</b>` : "+0 (beat your best or unlock an achievement to earn more)"} · ${fmt(mi.xpPerDecision)} per first-try decision</p></div>
      ${sum.newAch.length ? `<div class="ge__ach"><p class="mono">Unlocked</p><div class="objs objs--reveal">${sum.newAch.map((a, i) => achObject(a, true, i)).join("")}</div></div>` : ""}
      <h3 class="ge__h">What you opened up</h3>
      <ol class="recap">${mi.recap.map((r, i) => `<li class="recap__item" style="--n:${i}"><span class="mono">${esc(((s.concepts || {})[r.concept] || {}).name || r.concept)}</span><b>${esc(r.title)}</b><p>${esc(r.text)}</p></li>`).join("")}</ol>
      <div class="actions">
        <button class="btn btn--pink btn--big" data-action="m-replay">Replay the mission</button>
        <a class="btn btn--ghost" href="#${s.id}-drill">Concept drill</a>
        <a class="btn btn--ghost" href="#${s.id}">Review the session</a>
      </div>
    </div>`;
  }

  /* Next follows the usual order (workflow → incidents → ship) but skips anything already solved */
  function mNextTarget(s) {
    const mi = s.mission, order = [{ phase: "workflow", inc: 0, done: M.wfSolved }]
      .concat(mi.incidents.map((x, k) => ({ phase: "debug", inc: k, done: M.incs[k].solved })))
      .concat([{ phase: "ship", inc: M.inc, done: false }]);
    const here = order.findIndex((o) => o.phase === M.phase && (o.phase !== "debug" || o.inc === M.inc));
    const after = order.slice(here + 1).find((o) => !o.done) || order[order.length - 1];
    return after;
  }
  function mNextLabel(s) {
    const nx = mNextTarget(s);
    return nx.phase === "debug" ? `Incident ${nx.inc + 1} →` : nx.phase === "ship" ? "Ready to ship →" : "Build the workflow →";
  }
  function mLaunch(s) {
    clearTimeout(shipTimer);
    mFinish(s);
    mRender(undefined);
    playLaunch();
  }
  /* Cinematic launch: countdown → ignition → lift-off. Sits over the arena, never blocks clicks,
     skippable, and removed automatically. Reduced motion: no sequence; the static success state shows. */
  let launchTimer = 0;
  function playLaunch() {
    const arena = document.querySelector(".game--mission");
    if (!arena || reduceMotion()) return;
    const old = document.querySelector(".launch"); if (old) old.remove();
    clearTimeout(launchTimer);
    const r = Math.random;
    let parts = "", streaks = "";
    for (let i = 0; i < 24; i++) {
      const side = i % 2 ? 1 : -1, c = ["p", "m", "i", "g", "i", "d"][i % 6];
      parts += `<i style="--x:${side * Math.round(24 + r() * 170)}px;--y:${Math.round(-30 + r() * 46)}px;--d:${(0.8 + r() * 0.9).toFixed(2)}s;--dl:${(1.15 + r() * 0.7).toFixed(2)}s;--s:${[6, 8, 10, 14][i % 4]}px;background:${C[c]}"></i>`;
    }
    for (let i = 0; i < 28; i++) streaks += `<i style="left:${(r() * 100).toFixed(1)}%;--d:${(0.45 + r() * 0.6).toFixed(2)}s;--dl:${(1.9 + r() * 0.8).toFixed(2)}s;--h:${Math.round(12 + r() * 46)}px;background:${[C.i, C.m, C.p][i % 3]}"></i>`;
    const el = document.createElement("div");
    el.className = "launch";
    el.innerHTML = `<div class="launch__veil"><div class="launch__sky">${stars(88, 44)}</div><div class="launch__streaks">${streaks}</div>
        <div class="launch__ground">${hills(61, 160, 30, "#30323A", "launch__hills")}<i class="launch__floor"></i><i class="launch__padbase"></i></div></div>
      <ol class="launch__count" aria-hidden="true"><li>${pxText("3", "", C.i, C.p)}</li><li>${pxText("2", "", C.m, C.k)}</li><li>${pxText("1", "", C.p, C.k)}</li><li class="launch__go">${pxText("Lift-off", "", C.i, C.p)}</li></ol>
      <div class="launch__stage" aria-hidden="true"><i class="launch__glow"></i><div class="launch__parts">${parts}</div><div class="launch__ship"><i class="launch__trail"></i>${ROCKET("rk--launch")}</div></div>
      <button class="btn-mini mono launch__skip" data-action="launch-skip">Skip launch ✕</button>`;
    arena.appendChild(el);
    announce("Launch sequence. Three, two, one, lift-off. Mission complete.");
    const kill = () => { clearTimeout(launchTimer); el.remove(); document.removeEventListener("keydown", onKey); };
    const end = () => { el.classList.add("is-out"); launchTimer = setTimeout(kill, 380); };
    const onKey = (e) => { if (e.key === "Escape") kill(); };
    document.addEventListener("keydown", onKey);
    launchTimer = setTimeout(end, 3900);
    el.querySelector(".launch__skip").addEventListener("click", (e) => { e.stopPropagation(); kill(); const h = document.getElementById("game-h"); if (h) h.focus({ preventScroll: true }); });
  }

  function mFinish(s) {
    const mi = s.mission, before = unlockedIds(), xpBefore = xpInfo().xp;
    const first = mi.decisions.filter((d) => M.first[d.id]).length;
    const st = stat(s.id);
    st.mission = Object.assign({ plays: 0, best: 0, bestFirst: 0, runs: [] }, st.mission || {});
    st.mission.plays += 1;
    st.mission.best = Math.max(st.mission.best, first * mi.xpPerDecision);
    st.mission.bestFirst = Math.max(st.mission.bestFirst, first);
    st.mission.runs = [{ first, workflowRuns: M.wfAttempts, at: new Date().toISOString() }].concat(st.mission.runs).slice(0, 8);
    st.concepts = st.concepts || {};
    mi.decisions.forEach((d) => d.concepts.forEach((k) => { st.concepts[k] = Math.max(st.concepts[k] || 0, M.first[d.id] ? 100 : 60); }));
    save();
    M.summary = { first, xpGain: xpInfo().xp - xpBefore, newAch: allAchievements().filter((a) => a.check() && !before.includes(a.id)) };
    M.phase = "done";
    updateHeaderStat();
    const ts = document.querySelector(".tabs__stat");
    if (ts) ts.textContent = tabStat(s);
  }

  function mRender(focusSel) {
    const s = byId(M.sid), el = document.getElementById("game");
    if (!el) return;
    const key = mKey();
    M.fresh = key !== M.lastKey; M.lastKey = key;
    const arena = el.closest(".game");
    if (arena) { arena.dataset.stage = mMark(); arena.dataset.lit = mSolvedCount(s); }
    el.innerHTML = missionInner(s);
    M.fresh = false; M.wfFlash = []; M.justOpened = null; M.boot = false; M.glitch = false; M.pop = null; M.popSub = ""; M.snap = null;
    const f = el.querySelector(focusSel || "#game-h");
    if (f) f.focus({ preventScroll: true });
    if (!focusSel) {
      const top = el.getBoundingClientRect().top;
      if (top < 60 || top > window.innerHeight * 0.6) window.scrollTo({ top: window.scrollY + top - 90, behavior: reduceMotion() ? "auto" : "smooth" });
    }
    if (M.phase === "done" && focusSel === undefined && M.celebrate) { M.celebrate = false; celebrate(M.summary.first >= 3 ? 90 : 50); }
  }

  function mDrop(s, id, from, to) {
    if (!M || M.wfSolved || !id) return;
    if (to === "tray") {
      if (from === null || M.locked[from]) return;
      M.slots[from] = null; M.tray.push(id);
    } else {
      if (M.locked[to]) return;
      const occupant = M.slots[to];
      if (from === null) { M.tray = M.tray.filter((x) => x !== id); if (occupant) M.tray.push(occupant); }
      else { if (M.locked[from] || from === to) return; M.slots[from] = occupant; }
      M.slots[to] = id;
      M.snap = to;
    }
    M.wfFeedback = null;
    mRender(`[data-slot="${to === "tray" ? from : to}"] .wcard, [data-action="m-check"]`);
  }

  function mAction(a, t, s) {
    const mi = s.mission;
    if (a === "m-title") { M.phase = "brief"; M.boot = true; announce("Game on. Mission briefing."); return mRender(); }
    if (a === "m-skip") { M.phase = "workflow"; announce("Intro skipped. Stage 2, build the workflow."); return mRender(); }
    if (a === "m-start") { M.briefSeen = true; if (M.phase === "brief") M.phase = M.resumePhase || "workflow"; return mRender(); }
    if (a === "m-replay") { clearTimeout(shipTimer); newMission(s); M.phase = "workflow"; return mRender(); }
    if (a === "m-card") {
      if (M.wfSolved) return;
      const id = t.dataset.card;
      M.sel = M.sel === id ? null : id;
      announce(M.sel ? `Selected: ${mCard(s, id).text}. Now choose a step.` : "Selection cleared.");
      const free = M.slots.findIndex((x, k) => !x && !M.locked[k]), open = M.locked.findIndex((l) => !l);
      return mRender(!M.sel ? `.tray [data-card="${id}"]` : free >= 0 ? `[data-slot="${free}"] [data-action="m-place"]` : `[data-slot="${open}"] [data-action="m-slot"]`);
    }
    if (a === "m-place" || a === "m-slot") {
      const i = +t.dataset.i;
      if (M.wfSolved || M.locked[i]) return;
      if (M.sel) { const id = M.sel; M.sel = null; announce(`Placed in step ${i + 1}.`); return mDrop(s, id, null, i); }
      if (a === "m-place") { announce("Select a card first, then choose this step."); return; }
      if (!M.slots[i]) return;
      M.tray.push(M.slots[i]); M.slots[i] = null; M.wfFeedback = null;
      announce(`Step ${i + 1} cleared.`);
      return mRender(".tray .wcard:last-child");
    }
    if (a === "m-check") { mCheck(s); return mRender(M.wfSolved ? "#m-next" : ".fb"); }
    if (a === "m-clue") {
      const st = M.incs[M.inc], id = t.dataset.id;
      if (!st.opened.includes(id)) st.opened.push(id);
      M.justOpened = id;
      return mRender(`[data-action="m-clue"][data-id="${id}"]`);
    }
    if (a === "m-act") {
      const inc = mi.incidents[M.inc], st = M.incs[M.inc], act = inc.actions.find((x) => x.id === t.dataset.id);
      if (!act || st.solved || !st.opened.length) return;
      if (act.correct) { M.first[inc.id] = st.tried.length === 0; st.solved = true; M.pop = "Fixed!"; M.popSub = `System ${mSolvedCount(s)}/${mi.decisions.length} online`; }
      else { st.tried.push(act.id); if (act.effect === "ahead") st.ahead++; M.glitch = true; }
      st.log.push({ ok: !!act.correct, text: act.result });
      announce(act.result);
      return mRender(st.solved ? "#m-next" : ".mlog__item:last-child");
    }
    if (a === "m-ship") {
      if (M.shipStep >= 0) return;
      const total = mi.ship.log.length;
      if (reduceMotion()) { M.shipStep = total - 1; announce("Deployed. The site is live."); return mRender("#final-q"); }
      M.shipStep = 0; mRender("#game-h");
      const tick = () => {
        if (!M || M.phase !== "ship") return;
        M.shipStep++;
        const done = M.shipStep >= total - 1;
        mRender(done ? ".final .act" : "#game-h");
        if (done) announce("Deployed. The site is live. One last call."); else shipTimer = setTimeout(tick, 420);
      };
      shipTimer = setTimeout(tick, 420);
      return;
    }
    if (a === "m-final") {
      const f = mi.ship.final, o = f.options.find((x) => x.id === t.dataset.id);
      if (!o || M.finalSolved) return;
      if (o.correct) { M.first[f.id] = M.finalTried.length === 0; M.finalSolved = true; M.pop = "Checked!"; M.popSub = `System ${mSolvedCount(s)}/${mi.decisions.length} online`; }
      else { M.finalTried.push(o.id); M.glitch = true; }
      M.finalLog.push({ ok: !!o.correct, text: o.result });
      announce(o.result);
      return mRender(M.finalSolved ? "#m-next" : ".final .mlog__item:last-child");
    }
    if (a === "m-next") {
      if (M.phase === "ship") {
        if (mSolvedCount(s) < mi.decisions.length) return mRender();
        return mLaunch(s);
      }
      const nx = mNextTarget(s);
      M.phase = nx.phase; M.inc = nx.inc;
      return mRender();
    }
    if (a === "m-launch") { if (mSolvedCount(s) === mi.decisions.length && M.phase !== "done") mLaunch(s); return; }
    if (a === "m-relaunch") { playLaunch(); return; }
    if (a === "m-goto") {
      clearTimeout(shipTimer);
      if (M.phase !== "brief" && M.phase !== "title") { if (M.briefOpened) M.briefSeen = true; if (t.dataset.phase === "brief") M.resumePhase = M.phase; }
      M.phase = t.dataset.phase === "done" ? M.phase : t.dataset.phase;
      if (t.dataset.inc !== undefined) M.inc = +t.dataset.inc;
      else if (M.phase === "debug" && M.incs[M.inc].solved) { const open = M.incs.findIndex((x) => !x.solved); if (open >= 0) M.inc = open; }
      if (M.phase === "ship" && M.shipStep >= 0 && M.shipStep < mi.ship.log.length - 1) M.shipStep = mi.ship.log.length - 1;
      return mRender();
    }
    if (a === "m-inc") { M.inc = +t.dataset.i; return mRender(); }
  }

  /* drag and drop (mouse); tap-to-select then tap-a-step does the same job everywhere else.
     Firefox and Safari can report a text node as the event target, which has no .closest(),
     so every handler resolves the target to its element first. */
  const dragEl = (e) => (e.target && e.target.nodeType === 1 ? e.target : e.target && e.target.parentElement) || null;
  const dropZone = (e) => { const el = dragEl(e); return el && el.closest("[data-slot],[data-tray]"); };
  app.addEventListener("dragstart", (e) => {
    const el = dragEl(e), c = el && el.closest("[data-card]");
    if (!c || !M) return;
    M.sel = null;
    e.dataTransfer.setData("text/plain", `${c.dataset.card}|${c.dataset.from ?? ""}`);
    e.dataTransfer.effectAllowed = "move";
    c.classList.add("is-dragging");
  });
  app.addEventListener("dragend", (e) => {
    const el = dragEl(e), c = el && el.closest("[data-card]");
    if (c) c.classList.remove("is-dragging");
    app.querySelectorAll(".slot.is-over, .tray.is-over").forEach((x) => x.classList.remove("is-over"));
  });
  const allowDrop = (e) => {
    const z = dropZone(e);
    if (!z || !M) return;
    e.preventDefault();
    z.classList.add("is-over");
  };
  app.addEventListener("dragenter", allowDrop);
  app.addEventListener("dragover", allowDrop);
  app.addEventListener("dragleave", (e) => {
    const z = dropZone(e);
    if (z && !z.contains(e.relatedTarget)) z.classList.remove("is-over");
  });
  app.addEventListener("drop", (e) => {
    const z = dropZone(e);
    if (!z || !M) return;
    e.preventDefault();
    const [id, from] = (e.dataTransfer.getData("text/plain") || "").split("|");
    mDrop(byId(M.sid), id, from === "" || from === undefined ? null : +from, z.dataset.slot !== undefined ? +z.dataset.slot : "tray");
  });

  /* ---------- progress page ---------- */
  let confirmReset = false;
  function viewProgress() {
    const x = xpInfo();
    const done = LIVE.filter((s) => peek(s.id).plays > 0);
    const ach = allAchievements(), unl = ach.filter((a) => a.check());
    const possible = LIVE.reduce((a, s) => a + maxScore(s) + (s.mission ? s.mission.decisions.length * s.mission.xpPerDecision : 0), 0);
    const histories = LIVE.filter((s) => (peek(s.id).runs || []).length);
    const missionRuns = LIVE.filter((s) => s.mission && ((peek(s.id).mission || {}).runs || []).length);
    const ideas = LIVE.flatMap((s) => Object.entries(s.concepts || {}).map(([k, c]) => {
      const st = peek(s.id), best = st.concepts && k in st.concepts ? st.concepts[k] : null;
      return { s, k, name: c.name, best, state: best === null ? "folded" : best >= 80 ? "open" : "part" };
    }));
    const opened = ideas.filter((i) => i.state === "open").length;
    const legacy = LIVE.some((s) => peek(s.id).plays > 0 && !Object.keys(peek(s.id).concepts || {}).length);
    return `
    <section class="prog-head tone-cobalt">
      ${mosaic(9, 5, 61, ["pink", "mint", "ivory"], 0.74, "prog-head__pix")}
      <div class="wrap prog-head__grid">
        <div class="prog-head__copy">
          <p class="eyebrow mono">My progress · ${storageOK ? "saved in this browser" : "not saved, see note below"}</p>
          <h1 class="prog-title" tabindex="-1"><span class="sr-only">You've opened up ${opened} of ${ideas.length} ideas</span><span class="prog-title__n" aria-hidden="true">${opened}<small>/${ideas.length}</small></span><em aria-hidden="true">ideas opened up.</em></h1>
          <p class="lead">An idea counts as opened when you reach 80% on it in a session game. Your best result for each one is kept.</p>
        </div>
        <div class="xpbox tone-ivory">
          <p class="mono">Level ${x.level}</p>
          <p class="xpbox__level">${esc(x.name)}</p>
          <p class="xpbox__num"><span>${fmt(x.xp)}</span> XP</p>
          ${pixelBar(x.into, 20)}
          <p class="mono">${x.next ? `${fmt(x.next.xp - x.xp)} XP to level ${x.level + 1}: ${esc(x.next.name)}` : "Top level reached"}</p>
          <p class="xpbox__how">XP = best mission score + best drill score in each session (${fmt(x.fromGames)}) + ${XP_PER_ACH} per achievement (${x.ach} × ${XP_PER_ACH}). Replays add XP when you beat your best or unlock an achievement.</p>
        </div>
      </div>
    </section>

    <section class="band tone-dark">
      <div class="wrap">
        <div class="sec-head"><h2 class="sec-title">The idea <em>index</em></h2><span class="mono">${opened} open · ${ideas.filter((i) => i.state === "part").length} half-open · ${ideas.filter((i) => i.state === "folded").length} still folded</span></div>
        ${legacy ? `<p class="note">Runs from before this update didn't record ideas. Play again to fill the index.</p>` : ""}
        <ol class="ideas">${ideas.map((i, n) => `
          <li class="idea idea--${i.state}" style="--c:var(--${["mint", "pink", "ivory"][n % 3]});--n:${n}">
            <span class="idea__flap" aria-hidden="true"></span>
            <span class="mono idea__state">${i.state === "open" ? "Opened" : i.state === "part" ? "Half open" : "Folded"}</span>
            <b>${esc(i.name)}</b>
            <span class="mono">Session ${i.s.number} · ${i.best === null ? "not tested yet" : `best ${i.best}%`}</span>
          </li>`).join("")}
        </ol>
      </div>
    </section>

    <section class="band tone-dark2">
      <div class="wrap">
        <div class="stats">
          <div class="stat"><b>${done.length}/${LIVE.length}</b><span class="mono">open sessions completed</span></div>
          <div class="stat"><b>${unl.length}/${ach.length}</b><span class="mono">achievements</span></div>
          <div class="stat"><b>${fmt(x.fromGames)}</b><span class="mono">best points of ${fmt(possible)}</span></div>
        </div>

        <h2 class="sec-title sec-title--sm">Achievements</h2>
        <div class="objs">${ach.map((a, i) => achObject(a, a.check(), i)).join("")}</div>

        ${missionRuns.map((s) => `
          <h2 class="sec-title sec-title--sm">Mission log · ${esc(s.mission.name)}</h2>
          <ol class="runs">${peek(s.id).mission.runs.map((r) => `
            <li><span class="mono">${new Date(r.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
              <b>${esc(mRating(s, r.first).name)}</b>${pixelBar(r.first / s.mission.decisions.length, 4)}<span class="mono">${r.first}/${s.mission.decisions.length} first try · pipeline run ${r.workflowRuns}×</span></li>`).join("")}
          </ol>`).join("")}
        ${histories.map((s) => `
          <h2 class="sec-title sec-title--sm">Run log · ${esc(s.game.name.toLowerCase().replace(/^./, (c) => c.toUpperCase()))}</h2>
          <ol class="runs">${peek(s.id).runs.map((r) => `
            <li><span class="mono">${new Date(r.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
              <b>${fmt(r.score)} pts</b>${pixelBar(r.pct / 100, 10)}<span class="mono">${r.pct}% · ${r.hints} hint${r.hints === 1 ? "" : "s"} · ${esc(r.title)}</span></li>`).join("")}
          </ol>`).join("")}

        <h2 class="sec-title sec-title--sm">Sessions</h2>
        <div class="ptable" role="table" aria-label="Session progress">
          <div class="ptable__row ptable__head mono" role="row"><span role="columnheader">Session</span><span role="columnheader">Status</span><span role="columnheader">Best</span><span role="columnheader">Accuracy</span><span role="columnheader">Runs</span></div>
          ${SESSIONS.map((s) => {
            const st = peek(s.id);
            if (s.status !== "live") return `<div class="ptable__row is-wait" role="row"><span role="cell"><b class="mono">${s.number}</b> To be announced</span><span role="cell">${statusChip(s)}</span><span role="cell">—</span><span role="cell">—</span><span role="cell">—</span></div>`;
            return `<div class="ptable__row" role="row">
              <span role="cell"><b class="mono">${s.number}</b> <a class="link" href="#${s.id}">${esc(s.title)}</a></span>
              <span role="cell">${statusChip(s)}</span>
              <span role="cell" class="mono">${st.plays ? `${fmt(st.best)} / ${fmt(maxScore(s))}` : "—"}</span>
              <span role="cell" class="mono">${st.plays ? `${st.bestPct}%` : "—"}</span>
              <span role="cell" class="mono">${st.plays || 0}</span>
            </div>`;
          }).join("")}
        </div>

        <div class="reset">
          <p class="note">${storageOK
            ? "Progress is stored only in this browser on this device. It doesn't follow you to another device, another browser or a private window, and clearing site data erases it."
            : "This browser view is blocking storage, so progress lasts only until you close or reload the tab. Open the site in a regular browser window to keep it."}</p>
          ${confirmReset
            ? `<p>Erase all scores, XP, ideas and achievements in this browser? This can't be undone.</p>
               <div class="actions"><button class="btn btn--danger" data-action="reset-yes">Erase progress</button><button class="btn btn--ghost" data-action="reset-no">Keep it</button></div>`
            : `<button class="btn btn--ghost" data-action="reset">Reset my progress</button>`}
        </div>
      </div>
    </section>`;
  }

  function viewAbout() {
    return `
    <section class="page-head">
      <div class="wrap">
        <p class="eyebrow mono">About</p>
        <h1 class="page-title" tabindex="-1">Hearing an idea<br><em>is only the first fold.</em></h1>
        <p class="lead">UNFOLD turns each guest-speaker session of the semester into something you work through: a page that sets out what was taught, and a game that makes you use it.</p>
      </div>
    </section>
    <section class="band band--tight">
      <div class="wrap about">
        <div class="about__col">
          <h2 class="sec-title sec-title--sm">RE:THINK</h2>
          <p>A talk is easy to enjoy and easy to forget. RE:THINK is the habit of returning to it: reread the key ideas, replay them as decisions you have to make, and record how you did. Retrieval and application are what make a session stick.</p>
          <h2 class="sec-title sec-title--sm">What every session contains</h2>
          <ul class="defs">
            <li><strong>Summary</strong><span>What the session covered, in a paragraph.</span></li>
            <li><strong>Key takeaways</strong><span>The points worth remembering a month later.</span></li>
            <li><strong>Learning objectives</strong><span>What you should be able to do afterwards.</span></li>
            <li><strong>Session content</strong><span>The material, organised the way the speaker presented it.</span></li>
            <li><strong>A tailored game</strong><span>Rounds and mechanics chosen for that session's ideas, with its own achievements.</span></li>
          </ul>
          <h2 class="sec-title sec-title--sm">How scoring works</h2>
          <ul class="defs">
            <li><strong>Mission</strong><span>SHIP IT is rated by how many decisions you get right first time. Each first-try decision is worth ${s1MissionXP()} XP. Wrong moves explain why and let you try again.</span></li>
            <li><strong>Drill points</strong><span>Each drill round has a value per challenge. Later rounds are worth more.</span></li>
            <li><strong>Partial credit</strong><span>Ordering and matching score every correct position.</span></li>
            <li><strong>Hints</strong><span>Free to open, but a hinted answer loses its no-hint bonus.</span></li>
            <li><strong>Accuracy</strong><span>Measured without bonuses, so it shows what you actually knew.</span></li>
            <li><strong>XP</strong><span>Your best mission and drill scores per session, plus ${XP_PER_ACH} per achievement.</span></li>
          </ul>
        </div>
        <div class="about__col">
          <h2 class="sec-title sec-title--sm">Where content comes from</h2>
          <p>Every session is built only from the speaker's own materials. Nothing is added about the speaker that their materials don't say, and the game only tests what was presented. Sessions that haven't run, or whose materials aren't in yet, stay as labelled placeholders.</p>
          <h2 class="sec-title sec-title--sm">Your data</h2>
          <p>Scores, XP and achievements are saved in your browser. There are no accounts and nothing is sent anywhere, so progress doesn't carry across devices. Cross-device progress would need a backend such as Supabase, as covered in Session 01.</p>
          <h2 class="sec-title sec-title--sm">Adding a session</h2>
          <p>Sessions live in one file, <code>sessions.js</code>. Replace a placeholder with the same fields Session 01 uses and set <code>status: "live"</code>. Each game picks its own rounds from four challenge types: choose one, spot the mistake, put in order, and match.</p>
          <pre class="code"><code>{ id: "s02", number: "02", status: "live",
  title: "…", theme: { primary: "…" },
  summary: "…", takeaways: [ … ], objectives: [ … ],
  chapters: [ … ], concepts: { … }, achievements: [ … ],
  game: { name: "…", stages: [ { label, title,
    points, challenges: [ … ] } ] } }</code></pre>
        </div>
      </div>
    </section>`;
  }

  const s1MissionXP = () => { const s = LIVE.find((x) => x.mission); return s ? s.mission.xpPerDecision : 0; };

  function viewNotFound() {
    return `<section class="page-head"><div class="wrap">
      <p class="eyebrow mono">Not found</p>
      <h1 class="page-title" tabindex="-1">This page<br><em>doesn't exist.</em></h1>
      <a class="btn btn--ghost" href="#home">Go home</a></div></section>`;
  }

  /* ==========================================================================
     ROUTER
     ========================================================================== */
  function current() {
    const h = (location.hash || "").replace(/^#/, "") || "home";
    const m = h.match(/^(s\d+)(-play|-drill)?$/);
    if (m && byId(m[1])) return { view: "session", s: byId(m[1]), tab: m[2] === "-play" ? "play" : m[2] === "-drill" ? "drill" : "learn", key: h };
    if (["home", "sessions", "progress", "about"].includes(h)) return { view: h, key: h };
    return { view: "404", key: h };
  }

  let lastKey = null, pendingChapter = null, lastMajor = null;
  function render() {
    const r = current();
    let html = "";
    if (r.view === "home") html = viewHome();
    else if (r.view === "sessions") html = viewArchive();
    else if (r.view === "progress") html = viewProgress();
    else if (r.view === "about") html = viewAbout();
    else if (r.view === "session") html = viewSession(r.s, r.tab);
    else html = viewNotFound();
    app.innerHTML = html;
    const major = r.view === "session" ? "session-" + r.s.id : r.view;
    const doTx = lastKey !== null && major !== lastMajor && !reduceMotion();
    lastMajor = major;

    const navKey = r.view === "session" ? "sessions" : r.view;
    document.querySelectorAll(".nav a").forEach((a) => {
      if (a.dataset.nav === navKey) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    document.title = r.view === "session" ? `${r.s.title || "Session " + r.s.number} · UNFOLD` : "UNFOLD";

    if (pendingChapter !== null) {
      const ch = document.getElementById("chapter-" + pendingChapter), h = document.getElementById("ch-" + pendingChapter);
      pendingChapter = null;
      if (ch) { window.scrollTo(0, ch.getBoundingClientRect().top + window.scrollY - 80); if (h) h.focus({ preventScroll: true }); }
    } else if (lastKey !== null && lastKey !== r.key) {
      const body = document.getElementById("session-body");
      window.scrollTo(0, r.view === "session" && r.tab !== "learn" && body ? body.getBoundingClientRect().top + window.scrollY - 80 : 0);
      const h1 = app.querySelector(r.view === "session" && r.tab !== "learn" ? "#game-h" : "h1[tabindex]");
      if (h1) h1.focus({ preventScroll: true });
    }
    lastKey = r.key;
    updateHeaderStat();
    if (doTx) runTransition(r);
    if (r.view === "home") {
      Hero.s = 0; fitWord(); layoutFold(1); sigStart(); playUnfold();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { fitWord(); layoutFold(Hero.p); sigMeasure(); });
    }
    else { cancelAnimationFrame(Hero.raf); sigStop(); }
  }

  /* ---------- page transitions ----------
     home → portal (iris from where you clicked) · sessions → rotating square mask
     progress → spiral sweep · about → fold down · session pages → signal glitch */
  const TX = {
    home: ["portal", "00", "Home"], sessions: ["iris", "01", "Sessions"], progress: ["spiral", "02", "My progress"],
    about: ["fold", "03", "About"], "404": ["glitch", "--", "Not found"]
  };
  let lastPointer = null, txTimer = 0;
  document.addEventListener("pointerdown", (e) => { lastPointer = { x: e.clientX, y: e.clientY, t: Date.now() }; }, { passive: true });
  function runTransition(r) {
    const [kind, code, name] = r.view === "session" ? ["glitch", "S" + r.s.number, r.s.title || "Session " + r.s.number] : TX[r.view] || TX["404"];
    const recent = lastPointer && Date.now() - lastPointer.t < 1200;
    const vx = recent ? lastPointer.x : window.innerWidth / 2, vy = recent ? lastPointer.y : window.innerHeight * 0.55;
    const box = app.getBoundingClientRect();
    app.style.setProperty("--ox", `${Math.round(vx - box.left)}px`);
    app.style.setProperty("--oy", `${Math.round(vy - box.top)}px`);
    app.style.setProperty("--cy", `${Math.round(window.innerHeight * 0.5 - box.top)}px`);
    app.dataset.tx = kind;
    app.classList.remove("tx", "page-in"); void app.offsetWidth; app.classList.add("tx", "page-in");
    const veil = document.getElementById("veil");
    if (veil) {
      veil.style.setProperty("--vx", `${Math.round(vx)}px`);
      veil.style.setProperty("--vy", `${Math.round(vy)}px`);
      veil.dataset.tx = kind;
      const label = veil.querySelector(".veil__label");
      if (label) label.textContent = `→ ${code} / ${name}`;
      veil.classList.remove("run"); void veil.offsetWidth; veil.classList.add("run");
    }
    clearTimeout(txTimer);
    txTimer = setTimeout(() => { app.classList.remove("tx"); if (veil) veil.classList.remove("run"); }, 900);
  }

  function updateHeaderStat() {
    const el = document.getElementById("hdr-stat");
    if (!el) return;
    const x = xpInfo();
    el.textContent = `Lv ${x.level} · ${fmt(x.xp)} XP`;
  }

  /* ---------- events ---------- */
  app.addEventListener("click", (e) => {
    const t = e.target.closest("[data-action]");
    if (!t) {
      const card = e.target.closest(".cover--live");
      if (card && !e.target.closest("a")) { const a = card.querySelector(".card__link"); if (a) location.hash = a.getAttribute("href"); }
      return;
    }
    const a = t.dataset.action;
    const r = current();

    if (a === "refold") { playUnfold(); return; }
    if (a === "plane") { planeToggle(t.dataset.id, t.getAttribute("aria-expanded") !== "true"); return; }
    if (a === "plane-fold") { planeToggle(t.dataset.id, false); return; }
    if (a === "filter") { archiveFilter = t.dataset.f; render(); return; }
    if (a === "copy") {
      const txt = t.dataset.text;
      const done = () => { t.textContent = "Copied"; setTimeout(() => (t.textContent = "Copy"), 1600); };
      try { navigator.clipboard.writeText(txt).then(done, () => selectText(t)); } catch (err) { selectText(t); }
      return;
    }
    if (a === "term") {
      const s = r.s, i = +t.dataset.i, st = stat(s.id);
      const open = !t.classList.contains("is-open");
      t.classList.toggle("is-open", open);
      t.setAttribute("aria-expanded", open);
      if (open && !st.terms.includes(i)) {
        const before = unlockedIds();
        st.terms.push(i); save();
        const fresh = allAchievements().filter((x) => x.check() && !before.includes(x.id));
        if (fresh.length) { announce(`Achievement unlocked: ${fresh[0].name}`); toast(`Unlocked: ${fresh[0].name} · +${XP_PER_ACH} XP`); }
        updateHeaderStat();
      }
      const c = document.getElementById("gloss-count");
      if (c) c.textContent = `${st.terms.length} / ${s.glossary.length} unfolded`;
      return;
    }
    if (a === "reset") { confirmReset = true; render(); return; }
    if (a === "reset-no") { confirmReset = false; render(); return; }
    if (a === "reset-yes") { mem = { sessions: {} }; save(); confirmReset = false; G = null; M = null; render(); announce("Progress erased."); return; }
    if (a === "revisit") { pendingChapter = +t.dataset.ch; if (location.hash === "#" + r.s.id) render(); else location.hash = r.s.id; return; }

    if (a.startsWith("m-")) { if (M && r.view === "session") mAction(a, t, r.s); return; }

    /* game actions */
    if (!G || r.view !== "session") return;
    const s = r.s;
    if (a === "start") { G.phase = "stage"; rerenderGame(); return; }
    if (a === "replay") { newGame(s); G.phase = "stage"; rerenderGame(); return; }
    if (a === "begin") { G.phase = "play"; rerenderGame(); return; }
    if (a === "next") {
      const nt = drillNext();
      if (nt.finish) finishGame(s);
      else drillOpen(nt.si, nt.ci);
      rerenderGame();
      return;
    }
    if (a === "goto-stage") { drillOpen(+t.dataset.si); rerenderGame(); return; }
    const c = G.phase === "play" ? cur() : null;
    if (!c || c.answered) return;
    if (a === "hint") { c.hinted = true; G.hints++; rerenderGame(".hint"); return; }
    if (a === "mcq") { c.chosen = t.dataset.opt; scoreChallenge(s, c); rerenderGame("#next-btn"); return; }
    if (a === "spot") { c.chosen = +t.dataset.i; scoreChallenge(s, c); rerenderGame("#next-btn"); return; }
    if (a === "up" || a === "down") {
      const pos = +t.dataset.pos, to = a === "up" ? pos - 1 : pos + 1;
      [c.current[pos], c.current[to]] = [c.current[to], c.current[pos]];
      G.moved = to;
      rerenderGame(`[data-action="${a}"][data-pos="${to}"]:not([disabled])`);
      return;
    }
    if (a === "lock") { scoreChallenge(s, c); rerenderGame("#next-btn"); return; }
    if (a === "pick") { c.picks[+t.dataset.i] = t.dataset.c; G.picked = +t.dataset.i; rerenderGame(`[data-i="${t.dataset.i}"][data-c="${CSS.escape ? CSS.escape(t.dataset.c) : t.dataset.c}"]`); return; }
    if (a === "check") { scoreChallenge(s, c); rerenderGame("#next-btn"); return; }
  });

  function selectText(btn) {
    const code = btn.parentElement.querySelector("code");
    if (!code) return;
    const range = document.createRange(); range.selectNodeContents(code);
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
    btn.textContent = "Selected. Press Ctrl/Cmd+C";
  }

  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast"; el.textContent = msg; el.setAttribute("aria-hidden", "true");
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  app.addEventListener("input", (e) => {
    if (e.target.id === "fold-range") { cancelAnimationFrame(Hero.raf); layoutFold(+e.target.value / 100); }
  });

  /* mobile nav */
  const toggle = document.getElementById("nav-toggle");
  if (toggle) toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", open);
    document.body.classList.toggle("nav-open", open);
  });
  document.querySelectorAll(".nav a").forEach((a) => a.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }));

  window.addEventListener("hashchange", () => {
    if (location.hash === "#app") {
      try { history.replaceState(null, "", "#" + (lastKey || "home")); } catch (e) { /* ignore */ }
      (app.querySelector("h1[tabindex]") || app).focus();
      return;
    }
    render();
  });

  /* test hook (no effect on the page) */
  window.__unfold = { get G() { return G; }, get M() { return M; }, xpInfo, maxScore, Sig };
  render();
})();
