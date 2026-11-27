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
            if (a.rule.type === "terms") return glossOpened(s, st.terms) >= glossTerms(s).length;
            if (a.rule.type === "missionPlays") return ((st.mission || {}).plays || 0) >= a.rule.min;
            if (a.rule.type === "mission") return ((st.mission || {}).plays || 0) > 0 && ((st.mission || {}).bestFirst || 0) >= a.rule.min;
            if (a.rule.type === "agencyPlays") return ((st.agency || {}).plays || 0) >= a.rule.min;
            if (a.rule.type === "agencyFlag") return !!(((st.agency || {}).flags || {})[a.rule.flag]);
            if (a.rule.type === "fieldPlays") return ((st.field || {}).plays || 0) >= a.rule.min;
            if (a.rule.type === "fieldFlag") return !!(((st.field || {}).flags || {})[a.rule.flag]);
            if (a.rule.type === "fieldPct") return ((st.field || {}).bestPct || 0) >= a.rule.min;
            if (a.rule.type === "agency") return ((st.agency || {}).plays || 0) > 0 && ((st.agency || {}).bestFirst || 0) >= a.rule.min;
            return false;
          }
        })
      )
    );
    /* Earned stays earned: an achievement, once unlocked, is kept in the saved list,
       so a new session opening can never take it (or its XP) away. */
    const earned = earnedIds();
    list.forEach((a) => { const raw = a.check; a.raw = raw; a.check = () => earned.includes(a.id) || raw(); });
    return list;
  }
  /* Sessions that were open before the earned list existed. A browser that saved
     progress before this release is credited with what it had earned then, judged
     against the archive as it was (Session 01 only), so nobody loses "Full archive". */
  const LEGACY_LIVE = ["s01"];
  function earnedIds() {
    const p = load();
    if (!Array.isArray(p.earned)) {
      const seed = [];
      if (SESSIONS.some((s) => (p.sessions[s.id] || {}).plays > 0)) seed.push("first-fold");
      if (LEGACY_LIVE.every((id) => (p.sessions[id] || {}).plays > 0)) seed.push("all-live");
      p.earned = seed;
      if (Object.keys(p.sessions).length) save();
    }
    return p.earned;
  }
  /* record anything newly unlocked; called whenever XP is shown */
  function recordEarned() {
    const p = load(), earned = earnedIds();
    let changed = false;
    allAchievements().forEach((a) => { if (!earned.includes(a.id) && a.raw()) { earned.push(a.id); changed = true; } });
    if (changed) save();
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
    const fromGames = SESSIONS.reduce((a, s) => a + (peek(s.id).best || 0) + ((peek(s.id).mission || {}).best || 0) + ((peek(s.id).agency || {}).best || 0) + ((peek(s.id).field || {}).best || 0), 0);
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
      if (s.agency && st.agency && st.agency.plays) return `<span class="chip chip--done">Played · ${esc(s.agency.name)}</span>`;
      if (s.field && st.field && st.field.plays) return `<span class="chip chip--done">Played · ${esc(s.field.name)}</span>`;
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
    <article class="cover cover--live cover--${v}" data-session="${esc(s.id)}">
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
    </section>` : ""}${whoAmI()}`;
  }

  /* ---------- WHO AM I?? (the last section of the homepage; content in sessions.js) ---------- */
  function whoAmI() {
    const W = window.UNFOLD_WHOAMI;
    if (!W) return "";
    const txt = (v) => /^\[.*\]$/.test(String(v).trim()) ? `<span class="who-ph"><span class="mono">To add</span>${esc(String(v).trim().slice(1, -1))}</span>` : esc(v);
    return `
    <section class="band who" id="who" aria-labelledby="who-h">
      ${mosaic(6, 4, 77, ["pink", "mint", "cobalt"], 0.5, "who__pix")}
      <div class="wrap who__grid">
        <div class="who__head">
          <p class="mono who__k">${esc(W.kicker)}</p>
          <h2 id="who-h" class="who__title" data-text="${esc(W.title)}" tabindex="-1">${esc(W.title)}</h2>
          <p class="who__hello">${esc(W.hello)}</p>
          <a class="btn btn--pink btn--big who__cta" href="${esc(W.linkedin)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(W.cta)} (opens in a new tab)">${esc(W.cta)} <span aria-hidden="true">↗</span></a>
        </div>
        <div class="who__body">
          <div class="who-crt">
            <div class="who-crt__case">
              <div class="who-crt__screen">
                <div class="who-crt__bar mono"><span>ID · 00</span><span class="who-crt__rec" aria-hidden="true"><i></i>REC</span></div>
                <p class="mono who-crt__boot" aria-hidden="true">UNFOLD/OS v2.0 · loading profile… done</p>
                <dl class="who-crt__data">${W.facts.map(([k, v]) => `<div class="who-crt__row"><dt class="mono">${esc(k)}</dt><dd>${txt(v)}</dd></div>`).join("")}</dl>
                <p class="mono who-crt__prompt" aria-hidden="true">&gt; say hi<i class="who-crt__cur"></i></p>
              </div>
              <div class="who-crt__chin" aria-hidden="true"><span class="mono">UNFOLD·TV</span><span class="who-crt__vent"></span><span class="mono who-crt__led"><i></i>System online</span></div>
            </div>
            <div class="who-crt__stand" aria-hidden="true"></div>
          </div>
          <ol class="who__folds">${W.folds.map((f, i) => `
            <li class="who__fold">
              <button class="who__btn" data-who="${i}" aria-expanded="false" aria-controls="who-f${i}"><span class="mono">${esc(f.k)}</span><b>${esc(f.h)}</b><span class="mono who__tap">Tap to unfold</span></button>
              <div class="who__open who__open--${esc(f.kind || "text")}" id="who-f${i}" hidden>${whoFold(f, txt)}</div>
            </li>`).join("")}
          </ol>
        </div>
      </div>
    </section>`;
  }
  function whoFold(f, txt) {
    const lead = f.lead ? `<p class="who__lead">${esc(f.lead)}</p>` : "";
    if (f.kind === "cards") return `${lead}<ul class="who-cards">${f.cards.map((c, n) => `
      <li class="who-card${c.wide ? " is-wide" : ""}" style="--i:${n}"><button class="who-card__b" data-who-card aria-expanded="false">
        <span class="mono who-card__tag">${esc(c.tag)}</span><b class="who-card__t">${esc(c.t)}</b><span class="who-card__p">${esc(c.p)}</span>
        ${c.meter ? `<span class="who-meter" aria-hidden="true"><i></i></span><span class="mono who-meter__l">${esc(c.meter)}</span>` : ""}
        <span class="who-card__more" hidden>${esc(c.more)}</span><span class="mono who-card__hint" aria-hidden="true">+ footnote</span>
      </button></li>`).join("")}</ul>`;
    if (f.kind === "log") return `${lead}<ol class="who-log">${f.log.map((x, n) => `
      <li class="who-log__e${n ? "" : " is-on"}"${n ? " hidden" : ""} style="--i:${n}"><span class="mono who-log__v">${esc(x.v)}</span><div><b>${esc(x.t)}</b><p>${esc(x.p)}</p></div></li>`).join("")}</ol>
      <p class="who-log__end" hidden>${esc(f.end)}</p>
      <button class="who-log__next mono" data-who-next>Load the next patch ▸ ${esc(f.log[1] ? f.log[1].v : "")}</button>`;
    if (f.kind === "snaps") return `${lead}<div class="who-snaps">${f.snaps.map((x, n) => `
      <button class="who-snap" data-who-snap aria-pressed="false" style="--i:${n}"><span class="who-snap__frame" aria-hidden="true"><i></i></span><span class="mono who-snap__n">Snapshot ${pad(n + 1)}</span><b>${esc(x.t)}</b><span class="who-snap__p">${esc(x.p)}</span><span class="mono who-snap__hint" aria-hidden="true">Tap to develop</span></button>`).join("")}</div>
      <div class="who-next"><span class="mono who-next__k">${esc(f.status || "")}</span><p>${esc(f.end)}</p></div>`;
    return `<p>${txt(f.p || "")}</p>`;
  }
  app.addEventListener("click", (e) => {
    const card = e.target.closest && e.target.closest("[data-who-card]");
    if (card) {
      const open = card.getAttribute("aria-expanded") !== "true";
      card.setAttribute("aria-expanded", open);
      card.querySelector(".who-card__more").hidden = !open;
      card.querySelector(".who-card__hint").textContent = open ? "− footnote" : "+ footnote";
      card.parentElement.classList.toggle("is-open", open);
      return;
    }
    const nxt = e.target.closest && e.target.closest("[data-who-next]");
    if (nxt) {
      const box = nxt.parentElement, es = [...box.querySelectorAll(".who-log__e")], end = box.querySelector(".who-log__end");
      const hiddenOnes = es.filter((x) => x.hidden);
      if (!hiddenOnes.length) {
        es.forEach((x, n) => { x.hidden = n > 0; x.classList.toggle("is-on", n === 0); });
        end.hidden = true;
        nxt.textContent = `Load the next patch ▸ ${es[1].querySelector(".who-log__v").textContent}`;
        return;
      }
      hiddenOnes[0].hidden = false; hiddenOnes[0].classList.add("is-on");
      if (hiddenOnes.length === 1) { end.hidden = false; nxt.textContent = "↺ Replay from v0.1"; }
      else nxt.textContent = `Load the next patch ▸ ${hiddenOnes[1].querySelector(".who-log__v").textContent}`;
      return;
    }
    const snap = e.target.closest && e.target.closest("[data-who-snap]");
    if (snap) {
      const on = snap.getAttribute("aria-pressed") !== "true";
      snap.setAttribute("aria-pressed", on);
      snap.classList.toggle("is-dev", on);
      snap.querySelector(".who-snap__hint").textContent = on ? "Developed" : "Tap to develop";
      return;
    }
  });
  app.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("[data-who]");
    if (!b) return;
    const open = b.getAttribute("aria-expanded") !== "true";
    b.setAttribute("aria-expanded", open);
    b.querySelector(".who__tap").textContent = open ? "Fold it back" : "Tap to unfold";
    const panel = document.getElementById(b.getAttribute("aria-controls"));
    if (panel) panel.hidden = !open;
    b.closest(".who__fold").classList.toggle("is-open", open);
  });

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
    if (b.special && b.special.indexOf("dig-") === 0) h += digLearn(b.special, s);
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

  /* glossary entries flagged `note: true` are editorial footnotes, not terms: not flippable, not counted */
  const glossTerms = (s) => (s.glossary || []).map((g, i) => (g.note ? -1 : i)).filter((i) => i >= 0);
  const glossOpened = (s, list) => (list || []).filter((i) => glossTerms(s).includes(i)).length;
  function glossary(s) {
    const opened = peek(s.id).terms || [];
    return `<div class="gloss">
      ${s.glossary.map((g, i) => {
        if (g.note) return `<aside class="gnote" aria-labelledby="gnote-${i}">
          <p class="gnote__k mono" id="gnote-${i}">${esc(g.term)}</p>
          <p class="gnote__t">${esc(g.def)}</p>
        </aside>`;
        const open = opened.includes(i);
        return `<button class="gcard ${open ? "is-open" : ""}" data-action="term" data-i="${i}" aria-expanded="${open}">
          <span class="gcard__term">${esc(g.term)}</span>
          <span class="gcard__def">${esc(g.def)}</span>
          <span class="gcard__corner" aria-hidden="true"></span>
        </button>`;
      }).join("")}
      <p class="gloss__count mono" id="gloss-count">${glossOpened(s, opened)} / ${glossTerms(s).length} unfolded</p>
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
    <section class="s-hero" data-session="${esc(s.id)}">
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
          <span><b>Game</b>${esc(s.mode || "BUILD MODE")}: ${s.mission ? `${esc(s.mission.name)} mission + ` : ""}${s.agency ? `${esc(s.agency.name)} + ` : ""}${s.field ? `${esc(s.field.name)} + ` : ""}${challengesOf(s).length}-challenge drill</span>
        </div>
      </div>
    </section>
    <div class="wrap tabs-wrap">
      <nav class="tabs" aria-label="Session sections">
        ${tabBtn("learn", "Learn")}${tabBtn("play", `Play ${esc(s.mode || "BUILD MODE")}`)}
        <span class="tabs__stat mono">${tabStat(s)}</span>
      </nav>
    </div>
    <div id="session-body">${tab === "play" && s.mission ? missionShell(s) : tab === "play" && s.agency ? agencyShell(s) : tab === "play" && s.field ? fieldShell(s) : tab === "play" || tab === "drill" ? gameShell(s) : learnBody(s)}</div>`;
  }

  function learnBody(s) {
    return `${s.landing ? digLanding(s) : `
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
    </section>`}
    ${s.chapters.map((c, i) => `
    <section class="chapter ${["tone-dark", "tone-ivory", "tone-dark2"][i % 3]}" aria-labelledby="ch-${i}" id="chapter-${i}" data-session="${esc(s.id)}">
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
        <p class="cta-band__line">${s.landing && s.landing.cta ? s.landing.cta : "Read it. Now <em>build</em> it."}</p>
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
    return `<section class="game" aria-labelledby="game-h" data-stage="${stageMark()}" data-session="${esc(s.id)}">
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
        ${s.agency ? `<p class="mono gi__alt">Part of ${esc(s.mode || "AGENCY MODE")} · <a class="link" href="#${s.id}-play">The main game is ${esc(s.agency.name)}</a></p>` : ""}
        ${s.field ? `<p class="mono gi__alt">Part of ${esc(s.mode || "FIELD MODE")} · <a class="link" href="#${s.id}-play">The main game is ${esc(s.field.name)}</a></p>` : ""}
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
    if (s.agency && st.agency && st.agency.plays) bits.push(`${s.agency.name}: ${aRating(s, st.agency.bestFirst).name}`);
    if (s.field && st.field && st.field.plays) bits.push(`${s.field.name}: ${fRank(s, st.field.bestPct).name}`);
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

  /* ==========================================================================
     AGENCY MODE · THE HANDOFF (Session 02)
     A separate game type. It only runs for sessions with an `agency` block, keeps
     its own state (A) and actions (a-*), and saves to stat(id).agency. The SHIP IT
     mission (M) and the concept drill (G) are not touched.
     Each station is one director decision made of steps: pick · multi · match · order.
     A decision is right first time when every step in it was right on the first try.
     ========================================================================== */
  let A = null;
  let aSoundOn = false;        /* optional, off by default, never saved */
  let aAudio = null;

  function newAgency(s) {
    const ag = s.agency;
    A = {
      sid: s.id, phase: peek(s.id).agencySeen ? "intro" : "boot", si: 0, started: false,
      st: ag.stations.map((x) => x.steps.map((p) => ({
        tries: 0, firstOK: null, solved: false, fb: null,
        tried: [],                                   /* pick: wrong options tried */
        sel: [],                                     /* multi: selected ids */
        picks: p.type === "match" ? p.items.map(() => null) : null,
        order: p.type === "order" ? aShuffle(p.items) : null
      }))),
      summary: null, lastKey: null,
      unlocked: [],                /* achievements unlocked during this run */
      flow: null,                  /* the handoff that just happened, for one animation */
      xpShown: 0, lastSi: null, folderTab: "status",
      feed: [], feedAll: false,    /* the activity log */
      resume: aSavedRun(s)         /* an unfinished mission from an earlier visit */
    };
  }
  /* ---- an unfinished mission survives a refresh (saved inside the same progress key) ---- */
  const aShape = (s) => s.agency.stations.map((x) => x.steps.length).join(",");
  function aSavedRun(s) {
    const r = peek(s.id).agencyRun;
    if (!r || r.v !== 1 || r.shape !== aShape(s) || !Array.isArray(r.st)) return null;
    return r;
  }
  function aSaveRun() {
    if (!A || !A.started) return;
    const s = byId(A.sid), st = stat(A.sid);
    if (A.summary) { if (st.agencyRun) { delete st.agencyRun; save(); } return; }
    st.agencyRun = { v: 1, shape: aShape(s), si: A.si, feed: A.feed.slice(-30), unlocked: A.unlocked, at: new Date().toISOString(),
      st: A.st.map((row) => row.map((q) => Object.assign({}, q))) };
    save();
  }
  function aResume(s) {
    const r = A.resume;
    if (!r) return;
    A.st = r.st; A.si = Math.min(r.si || 0, s.agency.stations.length - 1); A.feed = r.feed || []; A.unlocked = r.unlocked || [];
    A.started = true; A.phase = "station"; A.resume = null; A.xpShown = aRunXP(s);
    if (!aUnlocked(s, A.si)) A.si = aNextTarget(s) || 0;
    aLog("system", "Mission resumed from your last visit.");
  }
  /* ---- the activity feed ---- */
  function aLog(kind, text) {
    if (!A) return;
    const d = new Date();
    A.feed.push({ t: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`, kind, text });
    if (A.feed.length > 40) A.feed.shift();
  }
  /* order steps never start in the solved order */
  function aShuffle(items) {
    const idx = items.map((_, i) => i);
    let out = shuffle(idx), guard = 0;
    while (out.every((v, i) => v === i) && guard++ < 10) out = shuffle(idx);
    return out;
  }
  const aStation = (s, i) => s.agency.stations[i];
  const aIdx = (s, id) => s.agency.stations.findIndex((x) => x.id === id);
  const aSolved = (i) => A.st[i].every((x) => x.solved);
  const aTouched = (i) => A.st[i].some((x) => x.tries > 0 || x.sel.length || (x.picks && x.picks.some((v) => v !== null)));
  const aFirst = (i) => A.st[i].every((x) => x.firstOK === true);
  const aSolvedCount = () => A.st.filter((_, i) => aSolved(i)).length;
  const aRating = (s, n) => s.agency.ratings.find((r) => n >= r.min) || s.agency.ratings[s.agency.ratings.length - 1];
  const aKey = () => `${A.phase}-${A.si}`;
  /* a desk opens only when every desk it takes input from is complete */
  const aUnlocked = (s, i) => (aStation(s, i).after || []).every((id) => aSolved(aIdx(s, id)));
  const aWaitingFor = (s, i) => (aStation(s, i).after || []).filter((id) => !aSolved(aIdx(s, id))).map((id) => aStation(s, aIdx(s, id)).agent);
  /* Idle · Working · Awaiting approval · Complete */
  function aState(s, i) {
    const x = aStation(s, i);
    if (aSolved(i)) {
      if (x.id === "strategist" && !aSolved(aIdx(s, "you"))) return "awaiting";
      return "complete";
    }
    if (!aUnlocked(s, i)) return "idle";
    if (A.st[i].some((q) => !q.solved && q.fb && !q.fb.ok)) return "revision";
    return "working";
  }
  const STATE_LABEL = { idle: "Idle", working: "Working", revision: "Needs revision", awaiting: "Awaiting approval", complete: "Complete" };
  /* Every agent here is scripted from the session's material. The one human desk is you. */
  const aKind = (x) => (x.team === "Director" ? "human" : "sim");
  const KIND_LABEL = { human: "Human", sim: "Simulated" };

  /* ---- XP: each desk is worth xpPerDecision, shared across its steps.
     Right first time earns the full share, right after a retry earns half. ---- */
  const SKILLS = [
    ["decision", "Correct decisions"], ["gaps", "Missing information"], ["improve", "Improving outputs"],
    ["strategy", "Strategic reasoning"], ["oversight", "Human oversight"], ["review", "Creative review"]
  ];
  function aStepXP(s, i, k) {
    const share = s.agency.xpPerDecision / aStation(s, i).steps.length, st = A.st[i][k];
    return !st.solved ? 0 : st.firstOK ? share : share / 2;
  }
  const aDeskXP = (s, i) => Math.round(A.st[i].reduce((a, _, k) => a + aStepXP(s, i, k), 0));
  const aRunXP = (s) => s.agency.stations.reduce((a, _, i) => a + aDeskXP(s, i), 0);
  const aMaxXP = (s) => s.agency.stations.length * s.agency.xpPerDecision;
  function aSkillXP(s) {
    const out = {};
    SKILLS.forEach(([k]) => (out[k] = { got: 0, max: 0 }));
    s.agency.stations.forEach((x, i) => x.steps.forEach((p, k) => {
      const share = s.agency.xpPerDecision / x.steps.length, o = out[p.skill || "decision"];
      o.max += share; o.got += aStepXP(s, i, k);
    }));
    return out;
  }

  /* ---- pixel art: every character shares one 12 × 12 grid ---- */
  const PX = { k: "charcoal", i: "ivory", c: "cobalt", p: "pink", m: "mint", d: "ivory-deep" };
  function pxArt(rows, cls = "", label = "") {
    const w = rows[0].length, h = rows.length;
    let rects = "";
    rows.forEach((row, y) => {
      let x = 0;
      while (x < w) {
        const ch = row[x];
        let n = 1;
        while (x + n < w && row[x + n] === ch) n++;
        if (PX[ch]) rects += `<rect x="${x}" y="${y}" width="${n}" height="1" fill="var(--${PX[ch]})"/>`;
        x += n;
      }
    });
    return `<svg class="px ${cls}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" ${label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"'}>${rects}</svg>`;
  }
  const AVATARS = {
    writer: ["............", "....cccc....", "..cccccccc..", "..kiiiiiik..", "..kikiikik..", "..kiiiiiik..", "..kiippiik..", "...kiiiik...", "....kiik..m.", "..ppppppppm.", ".pppppppppm.", ".pppppppppp."],
    validator: ["............", "...kkkkkk...", "..kkkkkkkk..", "..kiiiiiik..", "..kmmkkmmk..", "..kiiiiiik..", "..kiikkiik..", "...kiiiik...", "....kiik....", "..kkkiikkk..", ".kkkkiikkkk.", ".kkkkkkkkkk."],
    strategist: ["....mmmm....", ".....kk.....", "...kkkkkk...", "..kiiiiiik..", "..kikiikik..", "..kiiiiiik..", "..kiiikkik..", "...kiiiik...", "....kiik....", "..cccccccc..", ".cccccccccc.", ".cccccccccc."],
    you: ["............", "...kkkkkk...", "..pkkkkkkp..", ".pkiiiiiikp.", ".pkikiikikp.", "..kiiiiiikp.", "..kiippiikp.", "...kiiiikpp.", "....kiik....", "..cccccccc..", ".cccciicccc.", ".cccccccccc."],
    designer: ["..pppppp....", ".pppppppp...", "..kkkkkkp...", "..kiiiiiik..", "..kikiikik..", "..kiiiiiik..", "..kiippiik.p", "...kiiiik..k", "....kiik...k", "..mmmmmmmmk.", ".mmmmmmmmmm.", ".mmmmmmmmmm."],
    copywriter: ["............", "...kkkkkk.p.", "..kkkkkkkp..", "..kiiiiiip..", "..kikiikik..", "..kiiiiiik..", "..kiippiik..", "...kiiiik...", "....kiik....", "..cccccccc..", ".ccicicccccc", ".cccccccccc."],
    reviewer: ["............", "...kkkkkk...", "..kkkkkkkk..", "..kiiiiiik..", "..mmmmmmmm..", "..kiiiiiik..", "..kiikkiik..", "...kiiiik...", "....kiik....", "..kkkkkkmk..", ".kkkkmkmkkk.", ".kkkkkmkkkk."]
  };
  const avatar = (id, cls = "") => pxArt(AVATARS[id] || AVATARS.you, `ag-av ${cls}`);
  /* key visual sketches: compositions only, not the session's actual renders */
  const KV_ART = {
    held: ["iiiiiiippiiiiiii", "iiiiiikppkiiiiii", "iiiiiikiikiiiiii", "iiiiikiiiikiiiii", "iiiikkkkkkkkiiii", "iiiikkkkkkkkiiii", "iiiikkkmmkkkiiii", "iiiikkkkkkkkiiii", "iiiikkkkkkkkiiii", "iiiiiiiiiiiiiiii"],
    reassembled: ["kkpkkkkkkkkkkmkk", "kkkkkkcckkkkkkkk", "kmkkkkkkkkkpkkkk", "kkkkiiiiiiiikkkk", "kkkkiippmmiikkck", "kckkiippmmiikkkk", "kkkkiiccppiikkkk", "kkkkiiiiiiiikkkk", "kkpkkkkkkkkkkmkk", "kkkkkkkmkkkkkkkk"],
    years: ["mmmmmkiiiiikppppp", "miimmkiiciikppppp", "miimmkiiiiikppiip", "mmmmmkiiiiikppiip", "mmmmmkiiiiikppppp", "mmmmmkiiiiikppppp", "mkkkmkikkkikpkkkp", "mkkkmkikkkikpkkkp", "mmmmmkiiiiikppppp", "kkkkkkkkkkkkkkkkk"],
    clasp: ["iiiiiiiiiiiiiiii", "iiiiiippppiiiiii", "iiiiiippppiiiiii", "ikkkkkkmmkkkkkki", "ikkkkkkmmkkkkkki", "ikkkkkkkkkkkkkki", "ikkkkkkkkkkkkkki", "ikkkkkkkkkkkkkki", "ikkkkkkkkkkkkkki", "iiiiiiiiiiiiiiii"],
    desert: ["cccccccccccciicc", "cccccccccccciicc", "cccccccccccccccc", "cccccccccccccccc", "ccccccckkccccccc", "cccccckcckcccccc", "ppppppkkkkpppppp", "ppppppkkkkpppppp", "pppppppppppppppp", "pppppppppppppppp"]
  };
  const DESK_FILE = { writer: "brief_workspace", validator: "qc_dashboard", strategist: "strategy_lab", you: "approval_console", designer: "kv_board", copywriter: "copy_desk", reviewer: "review_dashboard" };

  /* ---- optional sound: tiny synth blips, muted by default ---- */
  function aBeep(kind) {
    if (!aSoundOn) return;
    try {
      aAudio = aAudio || new (window.AudioContext || window.webkitAudioContext)();
      const notes = { ok: [660, 880], miss: [220], handoff: [523, 659, 784], unlock: [784, 988, 1175], boot: [392, 523] }[kind] || [440];
      notes.forEach((f, n) => {
        const o = aAudio.createOscillator(), g = aAudio.createGain(), t = aAudio.currentTime + n * 0.08;
        o.type = "square"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
        o.connect(g).connect(aAudio.destination); o.start(t); o.stop(t + 0.13);
      });
    } catch (e) { /* no audio: silent */ }
  }

  /* ---- system notices: visual only; screen readers get the same text through announce() ---- */
  function aToast(kind, title, text) {
    const box = document.querySelector(".ag-toasts");
    if (!box) return;
    const el = document.createElement("div");
    el.className = `ag-toast ag-toast--${kind}`;
    el.innerHTML = `<span class="mono ag-toast__k">${esc(title)}</span><span>${text}</span>`;
    box.appendChild(el);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => { el.classList.add("is-out"); setTimeout(() => el.remove(), 400); }, kind === "card" ? 4200 : 3200);
  }

  function agencyShell(s) {
    if (!A || A.sid !== s.id) newAgency(s);
    A.lastKey = aKey();
    return `<section class="game game--agency" aria-labelledby="game-h" data-phase="${A.phase}">
      <div class="ag-set" aria-hidden="true">
        ${mosaic(8, 5, 202, ["pink", "mint", "ivory"], 0.74, "ag-set__pix")}
        <span class="ag-set__label mono">${esc(s.agency.name)}<br>Session ${esc(s.number)} · ${esc(s.mode || "AGENCY MODE")}</span>
      </div>
      <div class="wrap game__wrap"><div class="game__frame ag-frame" id="game">${agencyInner(s)}</div></div>
      <div class="ag-toasts" aria-hidden="true"></div>
    </section>`;
  }

  function agencyInner(s) {
    if (A.phase === "boot") return aBoot(s);
    if (A.phase === "intro") return aIntro(s);
    if (A.phase === "done") return aDone(s);
    return aHud(s) + aPipe(s, true) + aFeed() + aDesk(s);
  }

  /* ---- the boot sequence: plays once, skippable, instant under reduced motion ---- */
  function aBoot(s) {
    const lines = s.agency.boot || [];
    return `<div class="ag-boot">
      <h2 id="game-h" class="sr-only" tabindex="-1">Agency OS is starting. ${lines.map(esc).join(". ")}.</h2>
      <div class="ag-win ag-win--term" aria-hidden="true">
        <div class="ag-win__bar"><i></i><i></i><i></i><span class="mono">agency-os · boot</span></div>
        <div class="ag-term mono">
          ${lines.map((l, n) => `${n === 1 ? `<div class="ag-term__load" style="--n:${n}"><i></i></div>` : ""}<p class="ag-term__l${n >= lines.length - 2 ? " is-big" : ""}${n === lines.length - 1 ? " is-grant" : ""}" style="--n:${n}">${n < lines.length - 2 ? "&gt; " : ""}${esc(l)}${n < lines.length - 2 ? ` <span class="ag-term__ok">OK</span>` : ""}</p>`).join("")}
          <div class="ag-term__team" style="--n:${lines.length}">${["writer", "validator", "strategist", "designer", "copywriter", "reviewer"].map((id) => avatar(id)).join("")}</div>
        </div>
      </div>
      <div class="actions ag-boot__go">
        <button class="btn btn--pink btn--big" id="a-boot-go" data-action="a-boot-done">Enter the agency</button>
        <button class="btn-mini mono" data-action="a-boot-done">Skip intro</button>
      </div>
    </div>`;
  }

  /* ---- the agency dashboard: who you are, the client, the campaign, your level, this mission's XP ---- */
  function aCampaignStatus(s) {
    if (A.phase === "done") return ["signed", "Signed off"];
    const first = s.agency.stations.findIndex((_, i) => !aSolved(i));
    if (first < 0) return ["ready", "Ready for sign-off"];
    return [s.agency.stations[first].id, { writer: "Briefing", validator: "Validation", strategist: "Strategy", you: "Awaiting your approval", designer: "In production", copywriter: "In production", reviewer: "Creative review" }[s.agency.stations[first].id]];
  }
  function aHud(s) {
    const n = s.agency.stations.length, done = aSolvedCount(), xp = aRunXP(s), x = xpInfo(), [ck, cl] = aCampaignStatus(s);
    return `<div class="ag-dash">
      <div class="ag-dash__id">${avatar("you", "ag-dash__av")}<div><span class="mono">Role</span><b>Marketing Director</b></div></div>
      <div class="ag-dash__cell"><span class="mono">Client</span><b>Terra</b></div>
      <div class="ag-dash__cell"><span class="mono">Campaign status</span><b class="ag-dash__status is-${ck}">${esc(cl)}</b></div>
      <div class="ag-dash__cell ag-dash__lvl"><span class="mono">Agency level</span><b>Lv ${x.level} · ${esc(x.name)}</b>${pixelBar(x.into, 10)}<small class="mono">${x.next ? `${fmt(x.next.xp - x.xp)} XP to ${esc(x.next.name)}` : "Top level"}</small></div>
      <div class="ag-dash__cell ag-hud__xp"><span class="mono">Mission XP</span><span><b data-xp="${xp}">${A.xpShown}</b><small class="mono">/ ${aMaxXP(s)}</small></span></div>
      <div class="ag-dash__cell ag-hud__prog" role="img" aria-label="${done} of ${n} desks complete"><span class="mono">Desks ${done}/${n}</span><span class="ag-hud__cells">${s.agency.stations.map((_, i) => { const stt = aState(s, i); return `<i class="${stt === "complete" || stt === "awaiting" ? "on" : stt === "revision" ? "rev" : stt === "idle" ? "" : "wip"}"></i>`; }).join("")}</span></div>
      <button class="ag-hud__snd mono" data-action="a-sound" aria-pressed="${aSoundOn}">Sound ${aSoundOn ? "on" : "off"}</button>
    </div>`;
  }
  function aFeed() {
    if (!A.feed.length) return "";
    const list = A.feedAll ? A.feed.slice().reverse() : A.feed.slice(-3).reverse();
    return `<section class="ag-feed" aria-label="Activity feed">
      <p class="mono ag-feed__k"><i aria-hidden="true"></i>Activity</p>
      <ol class="ag-feed__list">${list.map((e) => `<li class="is-${e.kind}"><span class="mono">${esc(e.t)}</span>${esc(e.text)}</li>`).join("")}</ol>
      ${A.feed.length > 3 ? `<button class="btn-mini mono" data-action="a-feed" aria-expanded="${A.feedAll}">${A.feedAll ? "Show latest" : `Full log (${A.feed.length})`}</button>` : ""}
    </section>`;
  }

  /* ---- the pipeline: Writer → Validator → Strategist → YOU → (Designer ∥ Copywriter) → Reviewer ---- */
  function aPipe(s, nav) {
    const ag = s.agency, fresh = A.flow && Date.now() - A.flow.at < 1600 ? A.flow : null;
    const node = (id) => {
      const i = aIdx(s, id), x = aStation(s, i), state = aState(s, i), kind = aKind(x);
      const now = nav && A.phase === "station" && i === A.si, gate = x.team === "Director";
      const pop = fresh && fresh.from === i;
      const label = `${x.code === "HQ" ? "Human checkpoint" : `Agent ${x.code}`}: ${x.persona}, ${x.agent}. ${KIND_LABEL[kind]}. ${STATE_LABEL[state]}${state === "idle" ? `, waiting for ${aWaitingFor(s, i).join(" and ")}` : ""}${aSolved(i) ? `, ${aDeskXP(s, i)} XP` : ""}.`;
      return `<div class="ag-pn ag-pn--${id} is-${state}${now ? " now" : ""}${gate ? " ag-pn--gate" : ""}${pop ? " is-pop" : ""}" role="listitem" style="grid-area:${id}">
        <button class="ag-pn__go" data-action="a-goto" data-i="${i}"${now ? ' aria-current="step"' : ""}${state === "idle" ? ' aria-disabled="true"' : ""} aria-label="${esc(label)}">
          ${gate ? `<span class="ag-pn__gate mono" aria-hidden="true">${aSolved(i) ? "Approved" : "Human checkpoint"}</span>` : ""}
          <span class="ag-pn__av" aria-hidden="true">${avatar(id)}${state === "idle" ? `<span class="ag-pn__lock"></span>` : ""}</span>
          <span class="ag-pn__txt" aria-hidden="true">
            <span class="ag-pn__code mono">${esc(x.code)}</span>
            <span class="ag-pn__persona">${esc(x.persona)}</span>
            <span class="ag-pn__role mono">${esc(x.agent)}</span>
            <span class="ag-pn__state mono">${STATE_LABEL[state]}${aSolved(i) ? ` · +${aDeskXP(s, i)}` : ""}</span>
            <span class="ag-pn__tag ag-pn__tag--${kind} mono">${KIND_LABEL[kind]}</span>
          </span>
        </button>
      </div>`;
    };
    const solvedId = (id) => aSolved(aIdx(s, id)), flowFrom = (...ids) => !!fresh && ids.some((id) => fresh.from === aIdx(s, id));
    const wire = (area, on, flow, kind) => {
      return `<div class="ag-wire ag-wire--${kind}${on ? " is-on" : ""}${flow ? " is-flow" : ""}" style="grid-area:${area}" aria-hidden="true">${kind === "fork"
        ? `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path class="h" d="M0 50 H50 V25 H100 M50 50 V75 H100"/><path class="v" d="M50 0 V45 H25 V100 M50 45 H75 V100"/></svg>`
        : kind === "join" ? `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path class="h" d="M0 25 H50 V75 H0 M50 50 H100"/><path class="v" d="M25 0 V55 H75 V0 M50 55 V100"/></svg>` : "<i></i>"}</div>`;
    };
    const joinOn = solvedId("designer") && solvedId("copywriter");
    return `<nav class="ag-pipe-wrap" aria-label="Agency pipeline">
      <div class="ag-pipe" role="list">
        ${node("writer")}${wire("w1", solvedId("writer"), flowFrom("writer"), "line")}${node("validator")}${wire("w2", solvedId("validator"), flowFrom("validator"), "line")}${node("strategist")}${wire("w3", solvedId("strategist"), flowFrom("strategist"), "line")}
        ${node("you")}${wire("fk", solvedId("you"), flowFrom("you"), "fork")}${node("designer")}${node("copywriter")}
        ${wire("jn", joinOn, joinOn && flowFrom("designer", "copywriter"), "join")}${node("reviewer")}
      </div>
      <p class="ag-pipe__legend mono"><span class="ag-key ag-key--sim">Simulated</span> agent outputs scripted from the session · <span class="ag-key ag-key--human">Human</span> you, the Marketing Director</p>
    </nav>`;
  }

  function aIntro(s) {
    const ag = s.agency, st = peek(s.id).agency;
    const order = ["writer", "validator", "strategist", "you", "designer", "copywriter", "reviewer"];
    return `<div class="ag-intro">
      <div class="ag-mission" aria-hidden="true"><span class="mono">Mission</span><b>${esc(s.number)}</b><span class="ag-mission__name">Terra</span></div>
      <p class="mono gi__eyebrow">Session ${esc(s.number)} · ${esc(s.mode || "AGENCY MODE")} · access granted</p>
      <h2 id="game-h" class="ag-intro__title" tabindex="-1">${esc(ag.name)}</h2>
      <p class="gi__tag">${esc(ag.tagline)}</p>
      <div class="ag-win ag-memo">
        <div class="ag-win__bar" aria-hidden="true"><i></i><i></i><i></i><span class="mono">incoming · marketing_brief.eml</span></div>
        <div class="ag-memo__body">
          <p class="ag-memo__k mono">Brief to the ${esc(ag.role)}</p>
          <p>${esc(ag.brief.situation)}</p>
          <p><b>Your objective:</b> ${esc(ag.brief.objective)}</p>
          <p class="ag-memo__src mono">From: ${esc(ag.brief.source)}</p>
        </div>
      </div>
      <p class="ag-disclaimer"><span class="mono">Fictional scenario</span> ${esc(ag.brief.disclaimer)}</p>
      <p class="ag-simnote"><span class="mono">How this works</span> ${esc(ag.simNote)}</p>
      <h3 class="ag-h3">Your team</h3>
      <ul class="ag-roster">${order.map((id) => {
        const x = aStation(s, aIdx(s, id)), kind = aKind(x);
        return `<li class="ag-rc ag-rc--${id}${x.team === "Director" ? " ag-rc--you" : ""}">
          <span class="ag-rc__av">${avatar(id)}</span>
          <span class="ag-rc__code mono">${esc(x.code)}</span>
          <b class="ag-rc__persona">${esc(x.persona)}</b>
          <span class="ag-rc__role mono">${esc(x.agent)} <span class="ag-pn__tag ag-pn__tag--${kind}">${KIND_LABEL[kind]}</span></span>
          <p class="ag-rc__p">${esc(x.personality)}</p>
          <p class="ag-rc__io mono"><span>In: ${esc(x.input)}</span><span>Out: ${esc(x.output)}</span></p>
        </li>`;
      }).join("")}</ul>
      <ul class="gi__rules">
        <li><b>${ag.stations.length}</b> desks, unlocked in the order the work flows. Your approval can't be skipped.</li>
        <li><b>Up to ${ag.xpPerDecision} XP</b> a desk: the full amount for a right first call, half after a retry.</li>
        <li><b>Every answer</b> explains why, from the session. No timers, no game over.</li>
      </ul>
      <div class="actions">
        ${A.resume ? `<button class="btn btn--pink btn--big" data-action="a-resume">Resume mission · desk ${Math.min(A.resume.si + 1, ag.stations.length)} of ${ag.stations.length}</button><button class="btn btn--ghost" data-action="a-start">Start a new mission</button>`
          : `<button class="btn btn--pink btn--big" data-action="a-start">${st && st.plays ? "Start a new mission" : "Start mission"}</button>`}
        ${st && st.plays ? `<span class="mono gi__best">Your best: ${esc(aRating(s, st.bestFirst).name)} · ${fmt(st.best)} XP</span>` : ""}
        <button class="btn-mini mono" data-action="a-reboot">Replay the boot</button>
        <a class="link mono" href="#${s.id}-drill">Or the concept drill · ${challengesOf(s).length} challenges</a>
      </div>
      ${aArchive(s)}
    </div>`;
  }

  /* ---- the collectible archive: achievement cards and campaign milestones ---- */
  function aArchive(s) {
    const st = peek(s.id), ag = st.agency || {}, earned = earnedIds();
    const list = allAchievements().filter((a) => a.session === s);
    const played = (ag.plays || 0) > 0;
    const miles = [
      ["Brief validated", played, "Draft, then the validator's top fixes"],
      ["Strategy approved and saved", played, "Your human checkpoint"],
      ["Master key visual: Held", played, "Chosen at the Designer's board"],
      ["Campaign signed off", played, played ? `${ag.plays} mission${ag.plays > 1 ? "s" : ""} completed` : "Finish the Reviewer's desk"],
      ["Agency rank", played, played ? aRating(s, ag.bestFirst).name : "Earned at sign-off"]
    ];
    return `<section class="ag-archive" aria-labelledby="ag-arch-h">
      <h3 class="ag-h3" id="ag-arch-h">Agency archive</h3>
      <div class="ag-cards">${list.map((a, n) => {
        const on = earned.includes(a.id) || a.check();
        return `<div class="ag-ccard${on ? " is-on" : ""}">${mosaic(4, 4, 31 + n * 17, ["pink", "mint", "cobalt"], 0.2, "ag-ccard__em")}<span class="mono ag-ccard__k">${on ? "+50 XP" : "Locked"}</span><b>${esc(a.name)}</b><small>${esc(a.desc)}</small><span class="sr-only">${on ? "Unlocked" : "Locked"}</span></div>`;
      }).join("")}</div>
      <ol class="ag-miles">${miles.map(([t, on, d]) => `<li class="${on ? "is-on" : ""}"><span class="ag-miles__dot" aria-hidden="true"></span><b>${esc(t)}</b><small>${esc(d)}</small><span class="sr-only">${on ? "Reached" : "Not yet"}</span></li>`).join("")}</ol>
    </section>`;
  }

  /* ---- a desk: one window per workspace ---- */
  function aDesk(s) {
    const ag = s.agency, i = A.si, x = aStation(s, i), steps = A.st[i], state = aState(s, i), kind = aKind(x);
    let shown = 0;
    while (shown < steps.length && steps[shown].solved) shown++;
    const upto = Math.min(shown + 1, steps.length);
    const done = aSolved(i), next = aNextTarget(s), enter = A.lastSi !== i;
    A.lastSi = i;
    const gate = x.team === "Director";
    return `<div class="ag-desk ag-desk--${x.id}${gate ? " ag-desk--you" : ""}${enter ? " is-enter" : ""}">
      <div class="ag-win">
        <div class="ag-win__bar"><i aria-hidden="true"></i><i aria-hidden="true"></i><i aria-hidden="true"></i><span class="mono">${esc(DESK_FILE[x.id] || x.id)} · ${esc(x.code)} ${esc(x.persona)}</span><span class="ag-win__state mono is-${state}">${STATE_LABEL[state]}</span></div>
        <div class="ag-desk__grid">
          <aside class="ag-agent">
            <div class="ag-agent__av">${avatar(x.id, "ag-av--big")}</div>
            <p class="mono ag-desk__k">${gate ? "Human checkpoint" : `Agent ${esc(x.code)} · ${esc(x.team)} team`} · desk ${i + 1} of ${ag.stations.length}</p>
            <h2 id="game-h" class="ag-desk__agent" tabindex="-1">${esc(x.agent)}</h2>
            <p class="ag-agent__persona">${esc(x.persona)}</p>
            <p class="ag-agent__p">${esc(x.personality)}</p>
            <dl class="ag-desk__card">
              <div><dt class="mono">Does</dt><dd>${esc(x.does)}</dd></div>
              <div><dt class="mono">Output style</dt><dd>${esc(x.style || x.output)}</dd></div>
            </dl>
            <p class="ag-desk__kind">${kind === "human" ? `<span class="ag-badge ag-badge--you">Human decision</span> No agent at this desk: it's you.` : `<span class="ag-badge ag-badge--sim">Simulated agent</span> Scripted from the session's material. No AI runs here.`}</p>
          </aside>
          <div class="ag-work">
            <p class="ag-sec mono"><b>01</b> Task</p>
            <p class="ag-desk__memo"><span class="mono">Memo</span> ${esc(x.memo)}</p>
            <p class="ag-sec mono"><b>02</b> Received</p>
            <div class="ag-recv"><p class="ag-recv__in"><span class="mono">Input</span> ${esc(x.input)}</p>${aBriefNote(s, i)}</div>
            ${(() => { const art = aArtefact(s, i); return art ? `<p class="ag-sec mono"><b>03</b> Output <span class="ag-pn__tag ag-pn__tag--${kind}">${kind === "human" ? "Your desk" : "Simulated"}</span></p>${art}` : ""; })()}
            <p class="ag-sec mono"><b>${aArtefact(s, i) ? "04" : "03"}</b> Your decisions</p>
            ${steps.slice(0, upto).map((stp, k) => aStep(s, i, k)).join("")}
            ${done ? `<div class="ag-pass${gate ? " ag-pass--stamp" : ""}">
              <p class="ag-pass__line"><span class="ag-pass__stamp mono" aria-hidden="true">${gate ? "Approved" : "Complete"}</span>${aFirst(i) ? "Right first time." : "Done, after a retry."} ${esc(x.agent)} → ${esc(x.output)}. <b class="mono">+${aDeskXP(s, i)} XP</b></p>
              <div class="actions">
                ${next !== null ? `<button class="btn btn--ivory" id="a-next" data-action="a-goto" data-i="${next}">${gate ? "Dispatch" : "Hand off"} to ${esc(aStation(s, next).agent)} →</button>`
                  : aSolvedCount() === ag.stations.length ? `<button class="btn btn--pink btn--big" id="a-next" data-action="a-finish">Sign off the campaign</button>` : ""}
              </div>
            </div>` : ""}
          </div>
        </div>
      </div>
    </div>`;
  }

  /* the next desk the work flows to: the first unlocked, unsolved desk in chain order */
  function aNextTarget(s) {
    for (let j = 0; j < A.st.length; j++) if (!aSolved(j) && aUnlocked(s, j)) return j;
    return null;
  }

  /* desk-specific deliverables beside the decisions */
  function aArtefact(s, i) {
    const x = aStation(s, i), st = A.st[i];
    if (x.id === "writer") {
      const line = aSolved(i) ? "draft saved to the Project · handed to the Brief Validator" : st[1].solved ? "gaps reviewed · your call: where does the draft go next?" : st[0].solved ? "Marketing Brief Builder ran · draft ready for your review" : "scheduled task ready · confirm what the Brief Writer needs";
      return `<div class="ag-art ag-intake"><p class="mono ag-art__k">Client intake terminal</p>
        <div class="ag-minterm mono"><p>&gt; inbox · latest email labelled “Marketing Brief”</p><p>&gt; client: Terra · social media launch · Singapore</p><p class="is-now">&gt; ${esc(line)}<span class="ag-caret" aria-hidden="true"></span></p></div></div>`;
    }
    if (x.id === "validator") {
      const rep = x.steps[1].report, ok = rep.filter((c) => c.ok).length, done = aSolved(i);
      return `<div class="ag-art ag-qc"><p class="mono ag-art__k">Quality control · ${esc(s.agency.draft.title)}</p>
        <div class="ag-qc__score"><b>${ok}<small>/${rep.length}</small></b><span class="mono">checks pass</span></div>
        <span class="ag-qc__bar" aria-hidden="true">${rep.map((c) => `<i class="${c.ok ? "ok" : "flag"}"></i>`).join("")}</span>
        <span class="ag-stamp ag-qc__verdict mono">${done ? "Verdict: validated · top fixes applied" : "Verdict: revise before strategy"}</span></div>
        ${done ? aBriefDoc(s.agency.validated, "Validated brief, saved to the Project for the Strategist") : ""}`;
    }
    if (x.id === "strategist") {
      const roles = ["Stance", "Visual territory", "Proof pillar"];
      return `<div class="ag-art ag-board"><p class="mono ag-art__k">Strategy room · Research & Strategy Foundation</p>
        <div class="ag-board__grid">
          <div class="ag-pin ag-pin--insight"><span class="mono">Insight</span><p class="ag-pin__q">“She does not want a sustainable bag; she wants a bag she never has to justify.”</p>${st[1].solved ? `<span class="ag-stamp mono">Hypothesis</span>` : ""}</div>
          <div class="ag-pin"><span class="mono">Claims</span><p>Terra's green claims are listed as unverified. <mark class="ag-gap">[to verify]</mark></p></div>
          <div class="ag-pin"><span class="mono">Guardrails</span><p>The Art of Renewal can drift into an environmental headline. Made to Be Kept needs tested durability claims.</p></div>
        </div>
        <p class="mono ag-art__k">Big Idea directions</p>
        <div class="ag-terr">${["Nothing to Explain", "The Art of Renewal", "Made to Be Kept"].map((t, n) => `<div class="ag-terr__c ag-terr__c--${n}"><b>${t}</b><small class="mono">${st[0].solved ? roles[n] : "role?"}</small></div>`).join("")}</div>
      </div>`;
    }
    if (x.id === "you") {
      const saved = st[0].solved;
      return `<div class="ag-art ag-approve">
        <div class="ag-doc"><p class="mono ag-art__k">On your desk · Big Idea one-pager</p>
          <dl class="ag-doc__dl">
            <div><dt class="mono">Stance</dt><dd>Nothing to Explain</dd></div>
            <div><dt class="mono">Visual territory</dt><dd>The Art of Renewal</dd></div>
            <div><dt class="mono">Proof pillar</dt><dd>Made to Be Kept</dd></div>
            <div><dt class="mono">Motivation truth</dt><dd>“A bag she never has to justify” <span class="ag-stamp ag-stamp--sm mono">Hypothesis</span></dd></div>
            <div><dt class="mono">Green claims</dt><dd>Unverified <mark class="ag-gap">[to verify]</mark></dd></div>
          </dl></div>
        <div class="ag-kb${saved ? " is-saved" : ""}"><p class="mono ag-art__k">Claude Project · knowledge base</p>
          <ul><li><span class="ag-file" aria-hidden="true"></span>Brand guide and campaign research</li><li><span class="ag-file" aria-hidden="true"></span>${esc(trunc(s.agency.validated.title, 44))} <small class="mono">validated</small></li>
          <li class="ag-kb__new"><span class="ag-file" aria-hidden="true"></span>Big Idea one-pager <small class="mono">${saved ? "saved by you" : "awaiting your approval"}</small></li></ul>
          <p class="mono ag-kb__lock">${saved ? "Production can read the approved strategy" : "Production locked until you approve"}</p></div>
      </div>`;
    }
    if (x.id === "designer") {
      const sheet = `<div class="ag-art ag-sheet"><p class="mono ag-art__k">Contact sheet · 3 KV concepts in from the Higgsfield connector (sketches)</p>
        <div class="ag-kvstrip">${["held", "reassembled", "years"].map((k, n) => `<figure><span class="ag-sheet__n mono" aria-hidden="true">${String(n + 1).padStart(2, "0")}</span>${pxArt(KV_ART[k], "ag-kv")}<figcaption class="mono">${k[0].toUpperCase() + k.slice(1)}</figcaption></figure>`).join("")}</div></div>`;
      if (!st[1].solved) return sheet;
      return `<div class="ag-art ag-mood"><p class="mono ag-art__k">Moodboard · master visual · Held / Nothing to Explain (sketch)</p>
        <div class="ag-mood__grid">
          <figure class="ag-mood__hero">${pxArt(KV_ART.held, "ag-kv")}</figure>
          <div class="ag-sw ag-sw--ivory"><span class="mono">Cream studio backdrop</span></div>
          <div class="ag-sw ag-sw--charcoal"><span class="mono">Object first</span></div>
          <p class="ag-word">Quiet tailoring</p>
          <p class="ag-word">Held by its handle</p>
          <p class="ag-word ag-word--x">No caption · no material claim</p>
        </div>
        <p class="mono ag-mood__next">Later phases: Reassembled (weeks 4–6, TikTok) · Years (weeks 7–12)</p></div>`;
    }
    if (x.id === "copywriter" && st[0].solved) {
      return `<div class="ag-art ag-mocks"><p class="mono ag-art__k">Channel mockups · layout sketches, not final creative</p>
        <div class="ag-mocks__row">
          <figure class="ag-phone"><figcaption class="mono">Instagram · post</figcaption><div class="ag-phone__scr">${pxArt(KV_ART.held, "ag-kv")}<p class="ag-phone__h">Is this really Louis Vuitton?</p><p class="ag-phone__cta mono">Book an appointment to see Terra</p></div></figure>
          <figure class="ag-phone ag-phone--tt"><figcaption class="mono">TikTok · weeks 4–6</figcaption><div class="ag-phone__scr">${pxArt(KV_ART.reassembled, "ag-kv")}<p class="ag-phone__h">What is it made of, and can I trust that?</p><p class="ag-phone__flag mono">Material claims held back: [to verify]</p></div></figure>
          <div class="ag-mocks__key"><p class="mono">How the hierarchy lands</p><ol><li>Lead message in every asset</li><li>Promise carried by the image, not a green headline</li><li>Call to action: the appointment</li></ol></div>
        </div></div>`;
    }
    if (x.id === "reviewer") {
      const fixed = st[1].solved;
      const meter = (label, v) => `<div class="ag-meter${v >= 6 ? " is-good" : ""}"><span class="mono">${esc(label)}</span><b>${v}<small>/10</small></b><span class="ag-meter__bar" aria-hidden="true"><i style="width:${v * 10}%"></i></span></div>`;
      const cw = aStation(s, aIdx(s, "copywriter")).steps, ds = aStation(s, aIdx(s, "designer")).steps;
      const inbox = `<div class="ag-inbox"><p class="mono ag-art__k">In for review from both production desks</p>
        <figure>${pxArt(KV_ART.held, "ag-kv")}<figcaption><span class="mono">Designer · master visual</span><b>${esc(ds[1].options.find((o) => o.correct).text.split(":")[0])}</b></figcaption></figure>
        <div class="ag-inbox__copy"><span class="mono">Copywriter · hierarchy and revised caption</span><ol>${cw[2].revised.lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ol></div>
        <p class="ag-inbox__q mono">The Creative Review Scorer then checked the first Instagram Story and post against the brief and the Big Idea:</p></div>`;
      return inbox + `<div class="ag-art ag-review">
        <div class="ag-post${st[0].solved ? " is-annotated" : ""}" aria-label="The Instagram post under review, as a sketch">
          <div class="ag-post__media">${pxArt(KV_ART.desert, "ag-post__img")}${st[0].solved ? `<span class="ag-note ag-note--1 mono" aria-hidden="true">1</span>` : ""}</div>
          <p class="ag-post__cap"><span class="mono">Caption</span> No environmental claim · <mark>[material fact]</mark>${st[0].solved ? `<span class="ag-note mono" aria-hidden="true">2</span>` : ""} · “Discover Terra” · <mark>#[LV ambassador]</mark> <mark>@LV Ambassador</mark>${st[0].solved ? `<span class="ag-note mono" aria-hidden="true">3</span>` : ""}</p>
          <p class="mono ag-post__alt">Alt text included</p>
          ${st[0].solved ? `<ol class="ag-notes"><li>The bag doesn't match the Terra renders, and the desert setting works against the research.</li><li>The material-fact line is a placeholder.</li><li>Placeholder hashtag and tag still in the caption.</li></ol>` : ""}
        </div>
        <div class="ag-scores"><p class="mono ag-art__k">Creative Scoring · Creative Review Scorer</p>
          ${meter("Instagram Story", 5.7)}${meter("Instagram post", 4.3)}${fixed ? meter("Held, hand on the clasp", 6.7) : ""}
        </div>
        ${fixed ? `<div class="ag-vs"><p class="mono ag-art__k">Weaker vs stronger execution</p>
          <figure class="is-poor">${pxArt(KV_ART.desert, "ag-kv")}<figcaption><b>4.3</b> Desert scene: the idea lives only in the headline</figcaption></figure>
          <figure class="is-good">${pxArt(KV_ART.clasp, "ag-kv")}<figcaption><b>6.7</b> Hand on the clasp: the idea is visible in the picture</figcaption></figure></div>` : ""}
      </div>`;
    }
    return "";
  }

  function aStep(s, i, k) {
    const p = aStation(s, i).steps[k], st = A.st[i][k];
    const id = `ag-${i}-${k}`;
    let body = "";
    if (p.type === "pick") {
      const out = p.output ? `<figure class="ag-out${st.solved && p.revised ? " is-revised" : ""}">
        <figcaption class="mono"><span class="ag-pn__tag ag-pn__tag--sim">Simulated</span> ${esc(p.output.label)}</figcaption>
        <p class="ag-out__title">${esc(p.output.title)}</p>${(p.output.lines || []).length ? `<ul>${p.output.lines.map((l) => `<li>${markGaps(l)}</li>`).join("")}</ul>` : ""}
        ${p.output.note ? `<p class="mono ag-out__note">${esc(p.output.note)}</p>` : ""}
        ${st.solved && p.revised ? `<div class="ag-out__rev"><p class="mono">Revised after your call</p><b>${esc(p.revised.title)}</b><ul>${p.revised.lines.map((l) => `<li>${markGaps(l)}</li>`).join("")}</ul></div>` : ""}
      </figure>` : "";
      body = out + `<div class="ag-opts${p.cards ? " ag-opts--cards" : ""}" role="group" aria-labelledby="${id}-q">${p.options.map((o) => {
        const tried = st.tried.includes(o.id), win = st.solved && o.correct;
        return `<button class="ag-opt${p.cards ? " ag-opt--card" : ""}${tried ? " is-tried" : ""}${win ? " is-win" : ""}" data-action="a-pick" data-i="${i}" data-k="${k}" data-o="${esc(o.id)}" ${st.solved || tried ? "disabled" : ""}>${o.art && KV_ART[o.art] ? pxArt(KV_ART[o.art], "ag-kv") : ""}<span class="ag-opt__t">${esc(o.text)}</span>${o.meta ? `<span class="ag-opt__meta mono">${esc(o.meta)}</span>` : ""}${tried ? `<span class="sr-only"> (tried)</span>` : ""}</button>`;
      }).join("")}</div>`;
    } else if (p.type === "multi") {
      const need = p.options.filter((o) => o.correct).length;
      const doc = p.doc === "draft" ? aBriefDoc(s.agency.draft, "Draft from the Marketing Brief Builder") : "";
      const report = p.report ? `<ul class="ag-report" aria-label="Validator report">${p.report.map((c) => `<li class="${c.ok ? "is-pass" : "is-flag"}"><span class="mono">${c.ok ? "Pass" : "Flag"}</span><b>${esc(c.name)}</b><span>${esc(c.reason)}</span></li>`).join("")}</ul>` : "";
      body = doc + report + `<div class="ag-opts ag-opts--multi" role="group" aria-labelledby="${id}-q">${p.options.map((o) => {
        const on = st.sel.includes(o.id);
        return `<button class="ag-opt ag-opt--tick${on ? " is-on" : ""}${st.solved && o.correct ? " is-win" : ""}" data-action="a-tick" data-i="${i}" data-k="${k}" data-o="${esc(o.id)}" aria-pressed="${on}" ${st.solved ? "disabled" : ""}><span class="ag-tick" aria-hidden="true"></span>${esc(o.text)}</button>`;
      }).join("")}</div>
      ${st.solved ? "" : `<div class="actions"><button class="btn btn--pink" data-action="a-check" data-i="${i}" data-k="${k}" ${st.sel.length ? "" : "disabled"}>Check ${st.sel.length}/${need} selected</button></div>`}`;
    } else if (p.type === "match") {
      body = `<ul class="ag-match" aria-labelledby="${id}-q">${p.items.map((it, j) => {
        const bad = st.fb && st.fb.bad && st.fb.bad.includes(j);
        return `<li class="ag-match__row${bad ? " is-bad" : ""}${st.solved ? " is-ok" : ""}"><b id="${id}-r${j}">${esc(it.text)}</b>
          <div class="ag-match__cats" role="group" aria-labelledby="${id}-r${j}">${p.categories.map((c) => {
            const on = st.picks[j] === c;
            return `<button class="ag-cat${on ? " is-on" : ""}" data-action="a-cat" data-i="${i}" data-k="${k}" data-j="${j}" data-c="${esc(c)}" aria-pressed="${on}" ${st.solved ? "disabled" : ""}>${esc(c)}</button>`;
          }).join("")}</div></li>`;
      }).join("")}</ul>
      ${st.solved ? "" : `<div class="actions"><button class="btn btn--pink" data-action="a-check" data-i="${i}" data-k="${k}" ${st.picks.every((v) => v !== null) ? "" : "disabled"}>${p.categories.length === 2 ? "Dispatch the work" : "Check the match"}</button></div>`}`;
    } else if (p.type === "order") {
      const n = st.order.length, tiers = aStation(s, i).id === "copywriter";
      const tier = (pos) => (pos === 0 ? "Core promise" : pos === n - 1 ? "Call to action" : `Supporting ${pos}`);
      body = `<ol class="ag-order${tiers ? " ag-order--tiers" : ""}" aria-labelledby="${id}-q">${st.order.map((src, pos) => {
        const bad = st.fb && st.fb.bad && st.fb.bad.includes(pos);
        return `<li class="ag-order__row${bad ? " is-bad" : ""}${st.solved ? " is-ok" : ""}" style="--pos:${pos}"><span class="mono ag-order__n" aria-hidden="true">${tiers ? tier(pos) : pos + 1}</span><span class="ag-order__t">${esc(p.items[src])}</span>
          ${st.solved ? "" : `<span class="ag-order__ctl"><button class="btn-mini mono" data-action="a-up" data-i="${i}" data-k="${k}" data-pos="${pos}" aria-label="Move up: ${esc(p.items[src])}" ${pos === 0 ? "disabled" : ""}>↑</button><button class="btn-mini mono" data-action="a-down" data-i="${i}" data-k="${k}" data-pos="${pos}" aria-label="Move down: ${esc(p.items[src])}" ${pos === n - 1 ? "disabled" : ""}>↓</button></span>`}</li>`;
      }).join("")}</ol>
      ${st.solved ? "" : `<div class="actions"><button class="btn btn--pink" data-action="a-check" data-i="${i}" data-k="${k}">Lock the order</button></div>`}`;
    }
    const xp = Math.round(aStepXP(s, i, k));
    const fb = st.fb ? `<div class="ag-fb ag-fb--${st.fb.ok ? "ok" : "miss"}" id="${id}-fb" tabindex="-1">
        <p class="ag-fb__v">${st.fb.ok ? (st.firstOK ? "Right first time." : "That's it.") : "Not yet."}${st.fb.ok ? ` <span class="ag-fb__xp mono">+${xp} XP${st.firstOK ? "" : " · half, after a retry"}</span>` : ""}</p>
        <p>${esc(st.fb.text)}</p>
        ${st.fb.ok && p.source ? `<p class="mono ag-fb__src">From the session: ${esc(p.source)}</p>` : ""}
      </div>` : "";
    const skill = (SKILLS.find(([key]) => key === p.skill) || [0, ""])[1];
    return `<section class="ag-step ag-step--${p.type}${st.solved ? " is-solved" : ""}" aria-labelledby="${id}-q">
      <p class="mono ag-step__k">Your call${aStation(s, i).steps.length > 1 ? ` · ${k + 1}/${aStation(s, i).steps.length}` : ""}${skill ? ` · ${esc(skill)}` : ""}</p>
      <h3 class="ag-step__q" id="${id}-q">${esc(p.prompt)}</h3>
      ${body}${fb}
    </section>`;
  }

  /* Score one submission. Returns true when correct. */
  function aSubmit(s, i, k, optId) {
    const p = aStation(s, i).steps[k], st = A.st[i][k];
    if (st.solved) return true;
    let ok = false, text = "";
    if (p.type === "pick") {
      const o = p.options.find((x) => x.id === optId);
      if (!o) return false;
      ok = !!o.correct; text = o.result || "";
      if (!ok) st.tried.push(o.id);
    } else if (p.type === "multi") {
      const want = p.options.filter((o) => o.correct).map((o) => o.id);
      const wrong = st.sel.filter((id) => !want.includes(id));
      const missing = want.filter((id) => !st.sel.includes(id));
      ok = !wrong.length && !missing.length;
      if (ok) text = p.explain;
      else {
        const why = wrong.map((id) => p.options.find((o) => o.id === id)).filter((o) => o.why).map((o) => `“${o.text}”: ${o.why}`);
        text = (why.length ? why.join(" ") + " " : "") + (missing.length ? `${missing.length} correct ${missing.length === 1 ? "answer is" : "answers are"} still unselected.` : "");
      }
    } else if (p.type === "match") {
      const bad = p.items.map((it, j) => (st.picks[j] === it.answer ? -1 : j)).filter((j) => j >= 0);
      ok = !bad.length;
      text = ok ? p.explain : `${bad.length} of ${p.items.length} ${bad.length === 1 ? "is" : "are"} matched wrongly. The marked ${bad.length === 1 ? "row needs" : "rows need"} another look.`;
      st.fb = { ok, text, bad };
    } else if (p.type === "order") {
      const bad = st.order.map((src, pos) => (src === pos ? -1 : pos)).filter((x) => x >= 0);
      ok = !bad.length;
      text = ok ? p.explain : `${st.order.length - bad.length} of ${st.order.length} are in the right place. The marked positions need to move.`;
      st.fb = { ok, text, bad };
    }
    st.tries += 1;
    if (st.firstOK === null) st.firstOK = ok;
    if (p.type === "pick" || p.type === "multi") st.fb = { ok, text };
    if (ok) st.solved = true;
    return ok;
  }

  /* After a step is solved: achievements earned by the quality of a call, handoff notices. */
  function aAfterSolve(s, i, k) {
    const x = aStation(s, i), st = A.st[i][k];
    const desk = (id) => aIdx(s, id), clean = (id) => aSolved(desk(id)) && aFirst(desk(id));
    const flags = [];
    if (x.id === "writer" && k === 1 && st.firstOK) flags.push("gaps");
    if (x.id === "validator" && clean("validator")) flags.push("validator");
    if (x.id === "strategist" && clean("strategist")) flags.push("strategy");
    if (x.id === "you" && clean("you")) flags.push("oversight");
    if ((x.id === "designer" || x.id === "copywriter") && clean("designer") && clean("copywriter")) flags.push("production");
    if (x.id === "reviewer" && k === 0 && st.firstOK) flags.push("review");
    aLog("ok", `${x.agent}: ${trunc(aStation(s, i).steps[k].prompt, 64)} · +${Math.round(aStepXP(s, i, k))} XP`);
    if (flags.length) {
      const before = unlockedIds(), sst = stat(s.id);
      sst.agency = Object.assign({ plays: 0, best: 0, bestFirst: 0, runs: [] }, sst.agency || {});
      sst.agency.flags = Object.assign({}, sst.agency.flags || {}, ...flags.map((f) => ({ [f]: true })));
      save();
      updateHeaderStat();
      allAchievements().filter((a) => a.check() && !before.includes(a.id)).forEach((a) => {
        A.unlocked.push(a.id);
        aLog("unlock", `Achievement unlocked: ${a.name}`);
        setTimeout(() => {
          aToast("card", "Achievement unlocked · +50 XP", `<b>${esc(a.name)}</b> ${esc(a.desc)}`);
          aBeep("unlock");
        }, 500);
        announce(`Achievement unlocked: ${a.name}.`);
      });
    }
    if (!aSolved(i)) return;
    A.flow = { from: i, at: Date.now() };
    aBeep("handoff");
    const next = aNextTarget(s);
    aLog(x.id === "you" ? "gate" : "handoff", x.id === "you" ? "Strategy approved and saved to the knowledge base. Designer and Copywriter unlocked." : x.id === "reviewer" ? "Reviewer: every desk complete. Ready for sign-off." : (x.id === "designer" || x.id === "copywriter") ? `${x.agent}: ${x.output} ready${aSolved(aIdx(s, x.id === "designer" ? "copywriter" : "designer")) ? ". Reviewer unlocked." : ". Reviewer waits for the other desk."}` : `Handoff: ${x.output} → ${next !== null ? aStation(s, next).agent : "next desk"}`);
    if (x.id === "you") aToast("gate", "Approved", `Strategy saved to the knowledge base. Designer and Copywriter unlocked.`);
    else if (x.id === "designer" || x.id === "copywriter") {
      const other = aStation(s, aIdx(s, x.id === "designer" ? "copywriter" : "designer"));
      aToast("handoff", "Handoff", aSolved(aIdx(s, other.id)) ? `Both production desks complete. The Reviewer is unlocked.` : `${esc(x.output)} ready. The Reviewer waits for the ${esc(other.agent)}.`);
    } else if (x.id === "reviewer") aToast("gate", "Signed off", "Every desk is complete. Sign off the campaign.");
    else if (next !== null) aToast("handoff", "Handoff", `${esc(x.output)} → ${esc(aStation(s, next).agent)}`);
  }

  /* ---- the end: the campaign folder ---- */
  const FOLDER = [
    ["brief", "Campaign brief"], ["validator", "Validator feedback"], ["foundation", "Research & Strategy Foundation"], ["bigidea", "Approved Big Idea"],
    ["kv", "Selected key visual"], ["hierarchy", "Messaging Hierarchy"], ["review", "Creative review"], ["status", "Final status"]
  ];
  function aFolderDoc(s, tab) {
    const ag = s.agency, sum = A.summary, r = aRating(s, sum.first);
    const stn = (id) => aStation(s, aIdx(s, id));
    if (tab === "brief") return aBriefDoc(ag.validated, "Validated brief: the Brief Writer's draft with the validator's top fixes applied");
    if (tab === "validator") {
      const v = stn("validator");
      return `<ul class="ag-report">${v.steps[1].report.map((c) => `<li class="${c.ok ? "is-pass" : "is-flag"}"><span class="mono">${c.ok ? "Pass" : "Flag"}</span><b>${esc(c.name)}</b><span>${esc(c.reason)}</span></li>`).join("")}</ul>
        <p class="mono">Verdict: revise before strategy · top fixes</p><ul>${v.steps[2].revised.lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`;
    }
    if (tab === "foundation") return `<blockquote class="ag-doc__q">“She does not want a sustainable bag; she wants a bag she never has to justify.”<span class="ag-stamp mono">Hypothesis</span></blockquote>
        <p class="ag-doc__row"><span class="mono">Green claims</span> Listed as unverified <mark class="ag-gap">[to verify]</mark></p>
        <p class="ag-doc__row"><span class="mono">Guardrails</span> The Art of Renewal can drift into an environmental headline; Made to Be Kept needs tested durability claims. Neither may be used as a claim until approved.</p>`;
    if (tab === "bigidea") return `<dl class="ag-doc__dl ag-doc__dl--big">${stn("strategist").steps[0].items.map((it) => `<div><dt class="mono">${esc(it.answer)}</dt><dd>${esc(it.text)}</dd></div>`).join("")}</dl>
        <p class="ag-stamp mono">Approved and saved to the knowledge base by you</p>`;
    if (tab === "hierarchy") {
      const cw = stn("copywriter").steps;
      return `<p class="mono ag-doc__k">Messaging Hierarchy</p>
        <ol class="ag-order ag-order--tiers ag-order--static">${cw[0].items.map((t, pos, all) => `<li class="ag-order__row is-ok" style="--pos:${pos}"><span class="mono ag-order__n">${pos === 0 ? "Core promise" : pos === all.length - 1 ? "Call to action" : `Supporting ${pos}`}</span><span class="ag-order__t">${esc(t)}</span></li>`).join("")}</ol>
        <p class="mono ag-doc__k">Channel copy</p>
        <div class="ag-chan">
          <div><b>Instagram caption, revised</b><ul>${cw[2].revised.lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>
          <div><b>TikTok, weeks 4–6 (Reassembled)</b><ul><li>Lead: “Is this really Louis Vuitton?”</li><li>Material claims held back: <mark class="ag-gap">[to verify]</mark></li><li>Call to action: “Book an appointment to see Terra.”</li></ul></div>
        </div>`;
    }
    if (tab === "kv") {
      const kv = stn("designer").steps[1].options;
      return `<div class="ag-kvfinal">${kv.map((o) => `<figure class="${o.correct ? "is-master" : ""}">${pxArt(KV_ART[o.art], "ag-kv")}<figcaption><b>${esc(o.text.split(":")[0])}</b>${o.correct ? ` <span class="ag-stamp ag-stamp--sm mono">Master visual</span>` : ""}<small class="mono">${esc(o.meta)}</small></figcaption></figure>`).join("")}</div>
        <p class="ag-doc__row"><span class="mono">Master visual brief</span> Quiet tailoring: the bag held by its handle against a cream studio backdrop. No caption and no material claim.</p>
        <p class="mono ag-doc__note">Sketches of the compositions, not the session's renders.</p>`;
    }
    if (tab === "review") {
      const rv = stn("reviewer");
      return `<p class="mono ag-doc__k">Creative Scoring · Creative Review Scorer</p><div class="ag-scores">${[["Instagram Story", 5.7], ["Instagram post", 4.3], ["Held, hand on the clasp", 6.7]].map(([l, v]) => `<div class="ag-meter${v >= 6 ? " is-good" : ""}"><span class="mono">${l}</span><b>${v}<small>/10</small></b><span class="ag-meter__bar" aria-hidden="true"><i style="width:${v * 10}%"></i></span></div>`).join("")}</div>
        <p class="mono">Blocking issues you caught</p><ul>${rv.steps[0].options.filter((o) => o.correct).map((o) => `<li>${esc(o.text)}</li>`).join("")}</ul>
        <p class="mono">The one change</p><p>${esc(rv.steps[1].options.find((o) => o.correct).result)}</p>
        <p class="ag-stamp mono">Reviewer sign-off: approved after the change</p>`;
    }
    /* final status + credentials */
    return `<div class="ag-cred">
        <div class="ag-cred__av">${avatar("you", "ag-av--big")}</div>
        <div class="ag-cred__body">
          <p class="mono ag-cred__k">Agency credentials · Terra · Singapore launch</p>
          <h4 class="ag-cred__rank">${esc(r.name)}</h4>
          <p class="ag-cred__role">Marketing Director, THE HANDOFF</p>
          <dl class="ag-cred__dl">
            <div><dt class="mono">Run XP</dt><dd>${fmt(sum.xp)} / ${aMaxXP(s)}</dd></div>
            <div><dt class="mono">Right first time</dt><dd>${sum.first} / ${ag.stations.length} desks</dd></div>
            <div><dt class="mono">Agents managed</dt><dd>6</dd></div>
            <div><dt class="mono">Approvals made</dt><dd>2 (brief, strategy)</dd></div>
            <div><dt class="mono">Issues caught</dt><dd>3 in creative review</dd></div>
            <div><dt class="mono">Status</dt><dd>Signed off</dd></div>
          </dl>
          <p class="ag-cred__line">${esc(r.line)}</p>
        </div>
        <span class="ag-stamp ag-cred__stamp mono" aria-hidden="true">Signed off</span>
      </div>
      <p class="ag-disclaimer"><span class="mono">Fictional scenario</span> ${esc(ag.brief.disclaimer)}</p>
      <p class="ag-simnote"><span class="mono">How this works</span> ${esc(ag.simNote)}</p>`;
  }

  /* ---- the completion report: what went well, what to work on, and where the score came from ---- */
  const DESK_STRENGTH = {
    writer: "You briefed the Brief Writer properly and spotted every [to confirm] gap instead of filling it with a guess.",
    validator: "You used the Brief Validator as the session does: a fresh chat, the four top fixes, and a realistic reach target.",
    strategist: "You read the Big Idea's three layers correctly, kept the hunch labelled as a hypothesis, and turned down the off-brand idea.",
    you: "You held the human checkpoint: approved the strategy, saved it to the knowledge base and dispatched the work.",
    designer: "You tied each key visual to its layer of the Big Idea and chose the master visual on claims risk, not looks.",
    copywriter: "You built the Messaging Hierarchy, kept unverified claims out of the copy and sent back the generic caption.",
    reviewer: "You caught the blocking issues and chose the one change that lifts both scores."
  };
  const SKILL_ORDER = ["oversight", "gaps", "review", "strategy", "improve", "decision"];
  function aFeedback(s) {
    const ag = s.agency, good = [], next = [];
    ag.stations.forEach((x, i) => { if (aFirst(i)) good.push({ desk: x, text: DESK_STRENGTH[x.id] }); });
    ag.stations.forEach((x, i) => x.steps.forEach((p, k) => {
      if (A.st[i][k].firstOK !== false) return;
      const right = p.type === "pick" ? (p.options.find((o) => o.correct) || {}).result : p.explain;
      next.push({ desk: x, p, lesson: String(right || "").replace(/^Right[.:]\s*/, ""), skill: p.skill || "decision" });
    }));
    next.sort((a, b) => SKILL_ORDER.indexOf(a.skill) - SKILL_ORDER.indexOf(b.skill));
    return { good, next };
  }
  const skillName = (key) => (SKILLS.find(([k]) => k === key) || [0, ""])[1];

  function aDone(s) {
    const ag = s.agency, sum = A.summary, x = xpInfo(), skills = aSkillXP(s), r = aRating(s, sum.first);
    const tab = FOLDER.some(([k]) => k === A.folderTab) ? A.folderTab : "brief";
    const unlocked = allAchievements().filter((a) => sum.newAch.includes(a.id) || A.unlocked.includes(a.id));
    const steps = ag.stations.reduce((n, st) => n + st.steps.length, 0);
    const firstSteps = A.st.reduce((n, row) => n + row.filter((q) => q.firstOK === true).length, 0);
    const pct = Math.round((sum.xp / aMaxXP(s)) * 100);
    const fb = aFeedback(s);
    const goodList = fb.good.slice(0, 3), nextList = fb.next.slice(0, 3);
    return `<div class="ag-done">
      ${aPipe(s, false)}
      <div class="ag-reveal" aria-labelledby="game-h">
        <p class="mono ag-reveal__k">Campaign signed off · the reveal</p>
        <h2 id="game-h" class="ag-reveal__h" tabindex="-1">${esc(ag.reveal.headline)}</h2>
        <p class="ag-reveal__promise">${esc(ag.reveal.promise)}</p>
        <p class="ag-reveal__cta mono">${esc(ag.reveal.cta)}</p>
        <p class="ag-reveal__note">${esc(ag.reveal.note)}</p>
      </div>

      <section class="ag-rep" aria-labelledby="ag-rep-h">
        <p class="mono ag-rep__k">Mission report · Terra · Marketing Director</p>
        <div class="ag-rep__grid">
          <div class="ag-rep__score">
            <span class="mono">Mission score</span>
            <p><b>${fmt(sum.xp)}</b><small>/ ${aMaxXP(s)} XP</small></p>
            <span class="ag-rep__meter" aria-hidden="true"><i style="width:${pct}%"></i></span>
            <span class="mono ag-rep__pct">${pct}% of the available XP</span>
          </div>
          <div class="ag-rep__rank">
            <span class="mono">Agency rank</span>
            <h3 class="ag-rep__name" id="ag-rep-h">${esc(r.name)}</h3>
            <p>${esc(r.line)}</p>
            <p class="mono ag-rep__facts">${sum.first} of ${ag.stations.length} desks and ${firstSteps} of ${steps} decisions right first time</p>
          </div>
          <div class="ag-rep__prog">
            <span class="mono">Your UNFOLD progress</span>
            <p>${sum.xpGain > 0 ? `<b>+${fmt(sum.xpGain)} XP</b> added to your total.` : "Your total is unchanged: only your best run counts, and this run didn't beat it."}</p>
            <p class="ag-rep__lvl">Level ${x.level} · ${esc(x.name)}</p>
            ${pixelBar(x.into, 16)}
            <span class="mono ag-rep__best">Best Session 02 run: ${fmt((peek(s.id).agency || {}).best || 0)} XP</span>
          </div>
        </div>
      </section>

      <section class="ag-fbk" aria-labelledby="ag-fbk-h">
        <h3 class="ag-h3" id="ag-fbk-h">Performance feedback</h3>
        <div class="ag-fbk__grid">
          <div class="ag-fbk__col ag-fbk__col--good">
            <h4 class="ag-fbk__h"><span aria-hidden="true">+</span> What you did well</h4>
            ${goodList.length ? `<ul>${goodList.map((g) => `<li><span class="mono">${esc(g.desk.code)} · ${esc(g.desk.agent)}</span>${esc(g.text)}</li>`).join("")}</ul>${fb.good.length > 3 ? `<p class="mono ag-fbk__more">And ${fb.good.length - 3} more ${fb.good.length - 3 === 1 ? "desk" : "desks"} right first time.</p>` : ""}`
              : `<p>Every desk needed a second look this time, and every one got there. The explanations below are where the learning is.</p>`}
          </div>
          <div class="ag-fbk__col ag-fbk__col--next">
            <h4 class="ag-fbk__h"><span aria-hidden="true">→</span> Where to focus next</h4>
            ${nextList.length ? `<ol>${nextList.map((n) => `<li><span class="mono">${esc(n.desk.code)} · ${esc(n.desk.agent)} · ${esc(skillName(n.skill))}</span><b>${esc(n.p.prompt)}</b><p>${markGaps(n.lesson)}</p>${n.p.source ? `<small class="mono">From the session: ${esc(n.p.source)}</small>` : ""}</li>`).join("")}</ol>${fb.next.length > 3 ? `<p class="mono ag-fbk__more">${fb.next.length - 3} more ${fb.next.length - 3 === 1 ? "decision" : "decisions"} took a retry. Run the mission again to make them first-time calls.</p>` : ""}`
              : `<p>No retries anywhere: every decision was right first time. To keep it sharp, try the concept drill, or replay and explain each call out loud before you make it.</p>`}
          </div>
        </div>
      </section>

      <section class="ag-score" aria-labelledby="ag-score-h">
        <div class="ag-score__head">
          <h3 class="ag-h3" id="ag-score-h">Score breakdown</h3>
          <p>Each desk is worth ${ag.xpPerDecision} XP, shared across its decisions. A decision right first time earns its full share; right after a retry, half.</p>
        </div>
        <table class="ag-stable">
          <caption class="sr-only">XP earned at each desk</caption>
          <thead><tr><th scope="col">Desk</th><th scope="col">Decisions</th><th scope="col">XP</th></tr></thead>
          <tbody>${ag.stations.map((st, i) => {
            const n = st.steps.length, f = A.st[i].filter((q) => q.firstOK === true).length, xp = aDeskXP(s, i);
            return `<tr>
              <th scope="row"><span class="mono">${esc(st.code)}</span><b>${esc(st.agent)}</b><small>${esc(st.persona)}</small></th>
              <td><span class="ag-pips" aria-hidden="true">${A.st[i].map((q) => `<i class="${q.firstOK ? "ok" : "retry"}"></i>`).join("")}</span><span class="ag-stable__d">${f} of ${n} right first time</span></td>
              <td><div class="ag-stable__cell"><span class="ag-stable__bar" aria-hidden="true"><i style="width:${(xp / ag.xpPerDecision) * 100}%"></i></span><b class="ag-stable__xp">${xp}<small> / ${ag.xpPerDecision}</small></b></div></td>
            </tr>`;
          }).join("")}</tbody>
          <tfoot><tr><th scope="row"><b>Total</b></th><td><span class="ag-stable__d">${firstSteps} of ${steps} right first time</span></td><td><div class="ag-stable__cell"><span></span><b class="ag-stable__xp">${fmt(sum.xp)}<small> / ${aMaxXP(s)}</small></b></div></td></tr></tfoot>
        </table>
        <p class="mono ag-score__key"><span class="ag-pips" aria-hidden="true"><i class="ok"></i></span> right first time · <span class="ag-pips" aria-hidden="true"><i class="retry"></i></span> right after a retry</p>
        <div class="ag-skills">
          <h4 class="ag-skills__h">XP by skill</h4>
          <ul>${SKILLS.map(([key, label]) => { const k = skills[key], w = k.max ? (k.got / k.max) * 100 : 0; return `<li><span>${esc(label)}</span><span class="ag-stable__bar" aria-hidden="true"><i style="width:${w}%"></i></span><b class="ag-stable__xp">${Math.round(k.got)}<small> / ${Math.round(k.max)}</small></b></li>`; }).join("")}</ul>
        </div>
      </section>

      <section class="ag-folder" aria-labelledby="ag-folder-h">
        <div class="ag-score__head">
          <h3 class="ag-h3" id="ag-folder-h">Campaign folder</h3>
          <p>Every deliverable this mission produced, desk by desk. Open a tab to read it.</p>
        </div>
        <div class="ag-folder__tabs" role="tablist" aria-label="Campaign folder">${FOLDER.map(([key, label], n) => `<button role="tab" class="ag-tab${key === tab ? " is-on" : ""}" id="ag-tab-${key}" aria-selected="${key === tab}" aria-controls="ag-doc" data-action="a-folder" data-o="${key}"><span class="mono">${String(n + 1).padStart(2, "0")}</span>${esc(label)}</button>`).join("")}</div>
        <div class="ag-folder__doc ag-win" role="tabpanel" id="ag-doc" aria-labelledby="ag-tab-${tab}" tabindex="0">
          <div class="ag-win__bar" aria-hidden="true"><i></i><i></i><i></i><span class="mono">terra / ${esc((FOLDER.find(([k]) => k === tab) || [0, tab])[1].toLowerCase())}</span></div>
          <div class="ag-folder__body">${aFolderDoc(s, tab)}</div>
        </div>
      </section>

      ${unlocked.length ? `<section class="ag-unlocked" aria-labelledby="ag-unl-h"><h3 class="ag-h3" id="ag-unl-h">Unlocked this mission</h3><div class="ag-cards">${unlocked.map((a, n) => `<div class="ag-ccard is-on is-new" style="--n:${n}">${mosaic(4, 4, 31 + allAchievements().filter((b) => b.session === s).findIndex((b) => b.id === a.id) * 17, ["pink", "mint", "cobalt"], 0.2, "ag-ccard__em")}<span class="mono ag-ccard__k">+50 XP</span><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></div>`).join("")}</div></section>` : ""}
      <section class="ag-keep" aria-labelledby="ag-keep-h">
        <h3 class="ag-h3" id="ag-keep-h">What to keep</h3>
        <ul class="ag-recap">${ag.recap.map((c) => `<li><b>${esc(c.title)}</b><p>${esc(c.text)}</p></li>`).join("")}</ul>
      </section>
      ${aArchive(s)}
      <div class="actions ag-done__actions">
        <button class="btn btn--pink btn--big" data-action="a-replay">Run ${esc(ag.name)} again</button>
        <a class="btn btn--ghost" href="#${s.id}-drill">Concept drill</a>
        <a class="btn btn--ghost" href="#progress">My progress</a>
      </div>
    </div>`;
  }

  function aFinish(s) {
    const ag = s.agency, before = unlockedIds(), xpBefore = xpInfo().xp;
    const first = ag.stations.filter((_, i) => aFirst(i)).length, xp = aRunXP(s);
    const st = stat(s.id);
    st.agency = Object.assign({ plays: 0, best: 0, bestFirst: 0, runs: [] }, st.agency || {});
    st.agency.plays += 1;
    st.agency.best = Math.max(st.agency.best, xp);
    st.agency.bestFirst = Math.max(st.agency.bestFirst, first);
    st.agency.runs = [{ first, xp, at: new Date().toISOString() }].concat(st.agency.runs).slice(0, 8);
    st.concepts = st.concepts || {};
    ag.stations.forEach((x, i) => x.steps.forEach((p, k) => {
      const score = A.st[i][k].firstOK ? 100 : 60;
      st.concepts[p.concept] = Math.max(st.concepts[p.concept] || 0, score);
    }));
    save();
    A.summary = { first, xp, xpGain: xpInfo().xp - xpBefore, newAch: allAchievements().filter((a) => a.check() && !before.includes(a.id)).map((a) => a.id) };
    A.phase = "done"; A.folderTab = "brief";
    aLog("gate", "Campaign signed off.");
    if (st.agencyRun) delete st.agencyRun;
    save();
    updateHeaderStat();
    const ts = document.querySelector(".tabs__stat");
    if (ts) ts.textContent = tabStat(s);
  }

  function aRender(focusSel) {
    const s = byId(A.sid), el = document.getElementById("game");
    if (!el) return;
    const arena = el.closest(".game");
    if (arena) arena.dataset.phase = A.phase;
    el.innerHTML = agencyInner(s);
    aCountXP(el);
    aSaveRun();
    const f = el.querySelector(focusSel || "#game-h");
    if (f) f.focus({ preventScroll: true });
    if (!focusSel) {
      /* on phones the dashboard and pipeline stack tall, so a new desk scrolls to the desk itself */
      const desk = A.phase === "station" && window.innerWidth < 760 ? el.querySelector(".ag-desk") : null;
      const top = (desk || el).getBoundingClientRect().top;
      if (top < 60 || top > window.innerHeight * 0.6) window.scrollTo({ top: window.scrollY + top - 90, behavior: reduceMotion() ? "auto" : "smooth" });
    } else if (f) {
      const b = f.getBoundingClientRect();
      if (b.bottom > window.innerHeight - 20 || b.top < 70) window.scrollTo({ top: window.scrollY + b.top - window.innerHeight * 0.35, behavior: reduceMotion() ? "auto" : "smooth" });
    }
  }
  /* the HUD's XP counts up to its new value */
  function aCountXP(el) {
    const b = el.querySelector("[data-xp]");
    if (!b) return;
    const to = +b.dataset.xp, from = A.xpShown;
    A.xpShown = to;
    if (to === from) { b.textContent = to; return; }
    if (to > from) {
      const gain = document.createElement("span");
      gain.className = "ag-hud__gain mono"; gain.setAttribute("aria-hidden", "true"); gain.textContent = `+${to - from}`;
      b.parentNode.appendChild(gain);
    }
    if (reduceMotion() || to < from) { b.textContent = to; return; }
    const t0 = performance.now(), dur = 700;
    const tick = (t) => {
      const q = Math.min(1, (t - t0) / dur);
      b.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - q, 3)));
      if (q < 1 && b.isConnected) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- the scripted briefs ----------
     The Brief Writer's draft and the validated brief are fixed, from the session's material
     (sessions.js: agency.draft, agency.validated). No AI runs on this page. */
  const GAP_SECTIONS = [
    ["objective", "Objective"], ["audience", "Audience"], ["keyMessage", "Key message"], ["channels", "Channels"],
    ["budget", "Budget"], ["timeline", "Timeline"], ["successMetrics", "Success metrics"]
  ];
  const BRIEF_SECTIONS = GAP_SECTIONS.concat([["mandatories", "Mandatories"]]);
  const hasGap = (t) => !t || /\[\s*to confirm\s*\]/i.test(t);
  /* the brief the rest of the chain works from: the draft once the Brief Writer's desk is done,
     the validated brief once the Validator's fixes are in */
  function aBrief() {
    if (!A) return null;
    const s = byId(A.sid), w = aIdx(s, "writer"), v = aIdx(s, "validator");
    if (!aSolved(w)) return null;
    return aSolved(v) ? { brief: s.agency.validated, stage: "validated" } : { brief: s.agency.draft, stage: "draft" };
  }
  const trunc = (t, n) => { t = String(t || "").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t; };
  const markGaps = (t) => esc(t).replace(/\[\s*to (confirm|verify)\s*\]/gi, (m) => `<mark class="ag-gap">${m}</mark>`);
  const gapCount = (b) => BRIEF_SECTIONS.filter(([k]) => hasGap(b[k])).length;
  function aBriefDoc(b, label) {
    return `<article class="ag-brief ag-brief--sim">
      <p class="mono ag-brief__src"><span class="ag-badge ag-badge--sim">Simulated</span> ${esc(label)}</p>
      <h4 class="ag-brief__title">${esc(b.title)}</h4>
      <dl class="ag-brief__dl">${BRIEF_SECTIONS.map(([key, name]) => `<div class="${hasGap(b[key]) ? "has-gap" : ""}"><dt class="mono">${name}</dt><dd>${markGaps(b[key] || "[to confirm]")}</dd></div>`).join("")}</dl>
    </article>`;
  }

  function aBriefNote(s, i) {
    const L = aBrief(), id = aStation(s, i).id;
    if (i === 0) return "";
    if (!L) return `<p class="ag-desk__from"><span class="mono">From your brief</span> No accepted brief yet. This desk works with the session's Terra material until the Brief Writer's brief is accepted.</p>`;
    const b = L.brief, src = L.stage === "validated" ? "validated brief" : "draft brief";
    const lines = {
      validator: `“${trunc(b.title, 80)}”. Checking objective, audience, message, metric and channels.`,
      strategist: `Objective: ${trunc(b.objective, 140)} · Audience: ${trunc(b.audience, 120)}`,
      you: `“${trunc(b.title, 80)}”: ${gapCount(b)} ${gapCount(b) === 1 ? "section" : "sections"} still [to confirm] · the validator's 4 top fixes applied.`,
      designer: `Audience: ${trunc(b.audience, 120)} · Key message: ${trunc(b.keyMessage, 140)}`,
      copywriter: `Key message: ${trunc(b.keyMessage, 140)} · Channels: ${trunc(b.channels, 120)}`,
      reviewer: `Success metrics: ${trunc(b.successMetrics, 140)} · Mandatories: ${trunc(b.mandatories, 120)}`
    }[id];
    return lines ? `<p class="ag-desk__from"><span class="mono">From your ${src}</span> ${markGaps(lines)}</p>` : "";
  }

  function aAction(a, t, s) {
    if (!A || A.sid !== s.id) return;
    const i = +t.dataset.i, k = +t.dataset.k;
    if (a === "a-sound") {
      aSoundOn = !aSoundOn;
      if (aSoundOn) aBeep("ok");
      announce(`Sound ${aSoundOn ? "on" : "off"}.`);
      return aRender('[data-action="a-sound"]');
    }
    if (a === "a-boot-done") {
      const st = stat(s.id);
      if (!st.agencySeen) { st.agencySeen = true; save(); }
      A.phase = "intro"; aBeep("boot");
      announce("Access granted. Mission briefing.");
      return aRender();
    }
    if (a === "a-reboot") { A.phase = "boot"; return aRender(); }
    if (a === "a-folder") {
      if (!A.summary || !FOLDER.some(([key]) => key === t.dataset.o)) return;
      A.folderTab = t.dataset.o;
      return aRender(`#ag-tab-${A.folderTab}`);
    }
    if (a === "a-feed") { A.feedAll = !A.feedAll; return aRender('[data-action="a-feed"]'); }
    if (a === "a-resume") { if (!A.resume) return; aResume(s); announce(`Mission resumed. Desk ${A.si + 1}: ${aStation(s, A.si).agent}.`); return aRender(); }
    if (a === "a-start") {
      if (A.resume || peek(s.id).agencyRun) { newAgency(s); A.resume = null; const sst = stat(s.id); delete sst.agencyRun; save(); }
      A.phase = "station"; A.started = true; A.si = 0;
      aLog("system", "Assignment received: Terra, Singapore social media launch. You are the Marketing Director.");
      announce(`Desk 1: ${aStation(s, 0).agent}, ${aStation(s, 0).persona}.`); return aRender();
    }
    if (a === "a-goto") {
      const j = Math.max(0, Math.min(s.agency.stations.length - 1, i));
      if (!aUnlocked(s, j)) {
        const msg = `${aStation(s, j).agent} is idle, waiting for ${aWaitingFor(s, j).join(" and ")}.`;
        announce(msg); aToast("idle", "Idle", esc(msg));
        return;
      }
      A.phase = "station"; A.si = j;
      announce(`Desk ${j + 1}: ${aStation(s, j).agent}, ${aStation(s, j).persona}. ${STATE_LABEL[aState(s, j)]}.`);
      return aRender();
    }
    if (a === "a-finish") {
      if (A.summary) { A.phase = "done"; return aRender(); } /* already signed off this run: never count it twice */
      if (aSolvedCount() < s.agency.stations.length) return;
      aFinish(s);
      const tb = document.querySelector(".ag-toasts"); if (tb) tb.innerHTML = "";   /* the report starts clean */
      aBeep("unlock");
      announce(`Campaign signed off. Rank: ${aRating(s, A.summary.first).name}. ${A.summary.xp} XP this run.`);
      return aRender();
    }
    if (a === "a-replay") { newAgency(s); A.resume = null; A.phase = "station"; A.started = true; A.si = 0; aLog("system", "New mission: Terra, Singapore social media launch."); announce("New mission. Desk 1: Brief Writer."); return aRender(); }
    if (A.phase !== "station" || i !== A.si) return;
    const p = aStation(s, i).steps[k], st = A.st[i] && A.st[i][k];
    if (!p || !st || st.solved) return;
    if (a === "a-pick" || a === "a-check") {
      const ok = aSubmit(s, i, k, a === "a-pick" ? t.dataset.o : undefined);
      announce((ok ? `Right. ${Math.round(aStepXP(s, i, k))} XP. ` : "Not yet. ") + st.fb.text);
      aBeep(ok ? "ok" : "miss");
      if (ok) aAfterSolve(s, i, k);
      else aLog("revise", `Needs revision at the ${aStation(s, i).agent}'s desk: ${trunc(p.prompt, 60)}`);
      return aRender(ok && aSolved(i) ? "#a-next" : `#ag-${i}-${k}-fb`);
    }
    if (a === "a-tick") {
      const o = t.dataset.o, at = st.sel.indexOf(o);
      if (at >= 0) st.sel.splice(at, 1); else st.sel.push(o);
      if (st.fb && !st.fb.ok) st.fb = null;
      return aRender(`[data-action="a-tick"][data-i="${i}"][data-k="${k}"][data-o="${CSS.escape ? CSS.escape(o) : o}"]`);
    }
    if (a === "a-cat") {
      const j = +t.dataset.j;
      st.picks[j] = t.dataset.c;
      return aRender(`[data-action="a-cat"][data-i="${i}"][data-k="${k}"][data-j="${j}"].is-on`);
    }
    if (a === "a-up" || a === "a-down") {
      const pos = +t.dataset.pos, to = a === "a-up" ? pos - 1 : pos + 1;
      if (to < 0 || to >= st.order.length) return;
      [st.order[pos], st.order[to]] = [st.order[to], st.order[pos]];
      if (st.fb && !st.fb.ok) st.fb = null;
      return aRender(`[data-action="${a}"][data-i="${i}"][data-k="${k}"][data-pos="${to}"]:not([disabled])`);
    }
  }

  /* ---------- FIELD MODE: THE DIG (Session 03) ----------
     A separate game type. It runs only for sessions with a `field` block, keeps its own
     state (F) and actions (f-*), and saves to stat(id).field, stat(id).fieldRun and
     stat(id).fieldLast. Drag-and-drop always has a tap/keyboard twin: pick a card,
     then pick a place. Every number in the lab, the builder and the investment room
     is illustrative. */
  let F = null;
  const FV = 2;
  const FCAT = [["evidence", "Evidence"], ["tools", "Tool choice"], ["thinking", "Critical thinking"], ["audience", "Audience"], ["investment", "Investment"], ["recs", "Recommendations"]];
  const fStages = (s) => s.field.stages;
  const fShape = (s) => s.field.stages.map((x) => x.tasks.map((t) => t.id).join("+")).join(",");
  const fRank = (s, pct) => s.field.ranks.find((r) => pct >= r.min) || s.field.ranks[s.field.ranks.length - 1];
  const money = (s, n) => `${s.field.currency}${fmt(Math.round(n))}`;
  const nice = (n) => { if (n <= 0) return 0; const m = Math.pow(10, Math.max(0, Math.floor(Math.log10(n)) - 1)); return Math.round(n / m) * m; };
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const pct0 = (v) => `${Math.round(v * 100)}%`;

  function fTaskState(t, s) {
    const base = { solved: false, firstOK: null, earned: 0, tries: 0, fb: null };
    if (t.type === "sort") return Object.assign(base, { place: {}, miss: {}, got: {} });
    if (t.type === "multi") return Object.assign(base, { sel: [], partial: null });
    if (t.type === "pin" || t.type === "pick") return Object.assign(base, { pick: null, tried: [] });
    if (t.type === "tools") return Object.assign(base, { q: t.questions[0].id, done: {}, miss: {}, tried: {} });
    if (t.type === "slider") return Object.assign(base, { val: t.start });
    if (t.type === "builder") return Object.assign(base, { loc: "apac", platform: "meta", ages: s.field.builder.ages.map((a) => a.id), women: false, interests: [], beh: [], life: [], locked: null });
    if (t.type === "linkedin") return Object.assign(base, { loc: null, fn: [], sen: "any", narrow: [], locked: null });
    if (t.type === "alloc") return Object.assign(base, { split: Object.assign({}, s.field.invest.start), locked: null });
    if (t.type === "roi") return Object.assign(base, { val: "" });
    return base;
  }
  function newField(s) {
    F = {
      v: FV, sid: s.id, phase: "intro", si: 0, started: false,
      st: fStages(s).map((x) => x.tasks.map((t) => fTaskState(t, s))),
      locker: [], pick: null, insp: null, flash: null, fresh: [], celebrate: null,
      summary: null, lockerOpen: false, lastSi: null, prevEst: null, resume: fSavedRun(s), last: peek(s.id).fieldLast || null
    };
  }
  function fSavedRun(s) {
    const r = peek(s.id).fieldRun;
    return r && r.v === FV && r.shape === fShape(s) && Array.isArray(r.st) ? r : null;
  }
  function fSaveRun() {
    if (!F || !F.started) return;
    const s = byId(F.sid), st = stat(F.sid);
    if (F.summary) { if (st.fieldRun) { delete st.fieldRun; save(); } return; }
    st.fieldRun = { v: FV, shape: fShape(s), si: F.si, st: F.st, locker: F.locker, at: new Date().toISOString() };
    save();
  }
  function fResume(s) {
    const r = F.resume;
    if (!r) return;
    Object.assign(F, { st: r.st, si: r.si || 0, locker: r.locker || [], started: true, phase: "stage", resume: null });
    if (!fUnlocked(s, F.si)) F.si = fNext(s);
  }
  const fStageDone = (i) => F.st[i].every((q) => q.solved);
  const fUnlocked = (s, i) => fStages(s).slice(0, i).every((x, j) => fStageDone(j));
  const fNext = (s) => { const i = fStages(s).findIndex((x, j) => !fStageDone(j)); return i < 0 ? fStages(s).length - 1 : i; };
  const fAllDone = (s) => fStages(s).every((x, j) => fStageDone(j));
  const fScore = () => F.st.reduce((a, row) => a + row.reduce((b, q) => b + (q.earned || 0), 0), 0);
  const fStageXP = (i) => F.st[i].reduce((a, q) => a + (q.earned || 0), 0);
  const fStageMax = (s, i) => fStages(s)[i].tasks.reduce((a, t) => a + t.pts, 0);
  const fFind = (s, id) => { for (let i = 0; i < fStages(s).length; i++) { const k = fStages(s)[i].tasks.findIndex((t) => t.id === id); if (k >= 0) return { i, k, t: fStages(s)[i].tasks[k], q: F.st[i][k] }; } return null; };
  function fLock(entry) {
    const at = F.locker.findIndex((e) => e.id === entry.id);
    if (at >= 0) F.locker[at] = entry; else F.locker.push(entry);
    F.fresh.push(entry.id);
  }

  /* achievements earned by an action, the moment it happens */
  function fFlag(s, name) {
    const st = stat(s.id);
    st.field = Object.assign({ plays: 0, best: 0, bestPct: 0, runs: [], flags: {}, scale: s.field.max }, st.field || {});
    st.field.flags = st.field.flags || {};
    if (st.field.flags[name]) return;
    const before = unlockedIds();
    st.field.flags[name] = true; save();
    const fresh = allAchievements().filter((x) => x.check() && !before.includes(x.id));
    if (fresh.length) {
      announce(`Achievement unlocked: ${fresh[0].name}`);
      toast(`Unlocked: ${fresh[0].name} · +${XP_PER_ACH} XP`);
      F.badge = fresh[0].name;
    }
    updateHeaderStat();
  }

  /* ---- the audience builder model (illustrative) ---- */
  function fBuild(s, B) {
    const m = s.field.builder;
    const loc = m.locations.find((x) => x.id === B.loc), pf = m.platforms.find((x) => x.id === B.platform);
    const ages = m.ages.filter((a) => B.ages.includes(a.id));
    const ageShare = ages.reduce((a, x) => a + x.share, 0);
    const steps = [];
    let reach = loc.base;
    steps.push({ k: "Location", v: reach, d: loc.name });
    reach *= pf.factor; steps.push({ k: "Platform", v: reach, d: pf.name });
    if (!ageShare) return { loc, pf, est: 0, rel: 0, waste: 1, empty: true, steps };
    reach *= ageShare; steps.push({ k: "Age", v: reach, d: ages.map((a) => a.name).join(", ") });
    if (B.women) { reach *= m.women; steps.push({ k: "Gender", v: reach, d: "Women" }); }
    const ints = m.interests.filter((x) => B.interests.includes(x.id));
    let prec = m.basePrec;
    if (ints.length) {
      const share = 1 - ints.reduce((a, x) => a * (1 - x.share), 1);
      prec = ints.reduce((a, x) => a + x.share * x.prec, 0) / ints.reduce((a, x) => a + x.share, 0);
      reach *= share; steps.push({ k: "Interests", v: reach, d: ints.map((x) => x.name).join(", ") });
    }
    m.behaviours.filter((x) => B.beh.includes(x.id)).forEach((x) => { reach *= x.reach; prec = 1 - (1 - prec) * x.sharpen; steps.push({ k: "Behaviour", v: reach, d: x.name }); });
    m.lifestyle.filter((x) => B.life.includes(x.id)).forEach((x) => { reach *= x.reach; steps.push({ k: "Lifestyle", v: reach, d: x.name }); });
    const ageW = ages.reduce((a, x) => a + x.share * x.w, 0) / ageShare;
    let rel = loc.inTarget * ageW * (B.women ? 1 : m.women) * prec;
    if (!pf.fit) rel *= 0.3;
    return { loc, pf, est: reach, rel, waste: 1 - rel, steps, low: nice(reach * 0.9), high: nice(reach * 1.1), ageW, prec };
  }
  function fBuildCheck(s, B, c) {
    const m = s.field.builder, warn = [], good = [];
    if (c.empty) return { ok: false, warn: [{ t: "bad", x: "Pick at least one age band. No ages, no audience." }], good };
    if (!c.pf.fit) warn.push({ t: "bad", x: `${c.pf.note} Not how a Gen Z beauty audience is defined.` });
    if (c.loc.id !== "sg") warn.push({ t: "bad", x: `${c.loc.name} is wider than the brief. Everyone outside Singapore is wasted spend.` });
    if (c.est < m.floor) warn.push({ t: "bad", x: `Too many filters. About ${fmt(nice(c.est))} ${c.pf.unit} left: relevant, and almost impossible to reach. Under ${fmt(m.floor)} won't sustain eight weeks (illustrative threshold).` });
    if (c.rel < m.minRel) {
      const causes = [];
      if (B.ages.some((a) => a !== "a18")) causes.push(B.ages.includes("a18") ? "age bands beyond Gen Z" : "no 18–24 band");
      if (!B.women) causes.push("all genders");
      if (B.interests.some((id) => ["gaming", "fitness", "luxury", "fashion"].includes(id))) causes.push("interests that pull in non-beauty audiences");
      if (!B.interests.length && !B.beh.length) causes.push("no interest or behaviour signal at all");
      warn.push({ t: "bad", x: `Too loose. Only ${pct0(c.rel)} of this audience is the brief${causes.length ? `: ${causes.join(", ")}` : ""}.` });
    }
    const ok = !warn.length;
    if (ok && c.rel >= m.sweetRel && c.est >= m.sweet) good.push("Sweet spot. On target and big enough to buy properly.");
    else if (ok && c.est < m.sweet) good.push("Lockable, but small. Each filter you drop buys reach; each one you add buys relevance.");
    else if (ok) good.push("Lockable. You could tighten relevance a little more.");
    return { ok, warn, good };
  }
  function fBuildScore(s, t, c) {
    const m = s.field.builder;
    const qRel = clamp01((c.rel - m.minRel) / (0.8 - m.minRel));
    const qReach = c.est >= m.sweet ? 1 : 0.5 + 0.5 * clamp01((c.est - m.floor) / (m.sweet - m.floor));
    const waste = Math.round(t.pts * 0.35 * (1 - qRel)), small = Math.round(t.pts * 0.25 * (1 - qReach));
    return { earned: t.pts - waste - small, waste, small };
  }

  /* ---- LinkedIn side brief (illustrative) ---- */
  function fLi(s, L) {
    const m = s.field.linkedin;
    if (!L.loc) return { noLoc: true };
    const loc = m.locations.find((x) => x.id === L.loc);
    let est = loc.base;
    const fns = m.functions.filter((x) => L.fn.includes(x.id));
    if (fns.length) est *= fns.reduce((a, x) => a + x.share, 0);
    est *= m.seniority.find((x) => x.id === L.sen).share;
    m.narrow.filter((x) => L.narrow.includes(x.id)).forEach((x) => { est *= x.share; });
    const warn = [];
    if (!loc.ok) warn.push({ t: "bad", x: "The brief is Singapore. Asia-Pacific pays to reach people the programme can't serve." });
    if (!L.fn.includes("hr")) warn.push({ t: "bad", x: "Add the job function the brief asks for: HR and talent leaders." });
    else if (fns.length > 1) warn.push({ t: "bad", x: "Only HR is on the brief. The other functions are wasted spend." });
    if (est < m.min) warn.push({ t: "bad", x: `Under ${m.min} members. LinkedIn won't serve it.` });
    else if (est < m.rec) warn.push({ t: "warn", x: `It'll serve, but it's under the ${fmt(m.rec)}+ LinkedIn recommends.` });
    return { est, loc, warn, ok: !warn.some((w) => w.t === "bad") };
  }

  /* ---- investment model (illustrative) ---- */
  function fInvest(s, split) {
    const m = s.field.invest, B = s.field.budget;
    const total = m.quads.reduce((a, q) => a + (split[q.id] || 0), 0);
    const rows = m.quads.map((q) => { const spend = B * (split[q.id] || 0) / 100; return { q, spend, profit: spend * q.mult, reach: spend / 1000 * q.reachPerK }; });
    const spend = rows.reduce((a, r) => a + r.spend, 0), profit = rows.reduce((a, r) => a + r.profit, 0), reach = rows.reduce((a, r) => a + r.reach, 0);
    const roi = spend ? (profit - spend) / spend : 0;
    const notes = [];
    if (total !== 100) notes.push({ t: "bad", x: `That's ${total}% of the budget. Make it 100%.` });
    if ((split.free || 0) + (split.lost || 0) > 40) notes.push({ t: "bad", x: "Over 40% is chasing free riders and lost causes. You're buying reach, not value." });
    else if ((split.lost || 0) > 10) notes.push({ t: "warn", x: "Lost causes give almost nothing back. Every dollar here is a dollar not spent on stars." });
    if (!(split.star || 0)) notes.push({ t: "warn", x: "Nothing for your stars? They're the ones paying full price." });
    if ((split.vulnerable || 0) === 0 && total === 100) notes.push({ t: "warn", x: "Vulnerable customers are valuable and unhappy. Ignore them and they leave." });
    return { total, rows, spend, profit, reach, roi, notes };
  }

  /* ---- shell ---- */
  function fieldShell(s) {
    if (!F || F.sid !== s.id) newField(s);
    return `<section class="game game--field" aria-labelledby="game-h" data-session="${esc(s.id)}" data-phase="${F.phase}">
      <div class="wrap game__wrap"><div class="game__frame dg-frame" id="game">${fieldInner(s)}</div></div>
    </section>`;
  }
  function fieldInner(s) {
    const html = F.phase === "intro" ? fIntro(s) : F.phase === "done" ? fDone(s, F.summary) : fBoard(s);
    F.fresh = []; F.flash = null; F.badge = null;
    return html;
  }

  function fIntro(s) {
    const fd = s.field, st = peek(s.id).field, b = fd.brief;
    return `<div class="dg-intro">
      <div class="dg-intro__copy">
        <p class="mono dg-k">Session ${esc(s.number)} · ${esc(s.mode)} · you are a ${esc(fd.role)}</p>
        <h2 id="game-h" class="dg-intro__title" tabindex="-1">${esc(fd.name)}</h2>
        <p class="dg-intro__tag">${esc(fd.tagline)}</p>
        <div class="actions">
          ${F.resume ? `<button class="btn btn--pink btn--big" data-action="f-resume" data-fk="resume">Resume the case · stage ${pad(Math.min((F.resume.si || 0) + 1, 7))}</button><button class="btn btn--ghost" data-action="f-start" data-fk="start">Start over</button>`
            : `<button class="btn btn--pink btn--big" data-action="f-start" data-fk="start">${st && st.plays ? "Open a new case" : "Open the case"}</button>`}
          ${F.last ? `<button class="btn btn--ghost" data-action="f-last" data-fk="last">Your last dossier</button>` : ""}
        </div>
        <div class="dg-snd-row">${fSndBtn()}<span class="mono">Short effects on your actions only. No music.</span></div>
        ${st && st.plays ? `<p class="mono dg-best">Best: ${esc(fRank(s, st.bestPct).name)} · ${fmt(st.best)} / ${fmt(fd.max)} XP</p>` : ""}
      </div>
      <div class="dg-folder" aria-hidden="true">
        <span class="dg-folder__tab mono">${esc(fd.caseId)}</span>
        <div class="dg-folder__page">
          <p class="mono dg-folder__from">${esc(b.from)}</p>
          <p class="dg-folder__h">${esc(b.title)}</p>
          <p class="dg-folder__b">${esc(b.body)}</p>
          <i class="dg-redact" style="width:82%"></i><i class="dg-redact" style="width:64%"></i><i class="dg-redact" style="width:74%"></i>
          <span class="dg-stamp mono">${esc(b.stamp)}</span>
        </div>
        <div class="dg-folder__pins">${["?", "?", "?"].map((x, i) => `<b style="--d:${i}">${x}</b>`).join("")}</div>
      </div>
      <ol class="dg-route">${fStages(s).map((x) => `<li><span class="mono">${x.code}</span><b>${esc(x.name)}</b><em>${esc(x.mechanic)}</em></li>`).join("")}</ol>
      <div class="dg-ladder">
        <p class="mono dg-k">Field ranks · ${fmt(fd.max)} XP on the case</p>
        <ol>${fd.ranks.slice().reverse().map((r) => `<li><b>${esc(r.name)}</b><span class="mono">${r.min ? `${fmt(r.min * fd.max / 100)}+` : "0+"} XP</span></li>`).join("")}</ol>
        <p class="dg-rules">Right first time earns the full points, right after a retry half. Experiment as much as you like before you lock a decision. No timers, and finished stages stay open to revisit.</p>
      </div>
      <p class="dg-sim"><span class="mono">Simulated, not real data</span> ${esc(fd.simNote)}</p>
      <p class="mono dg-alt"><a class="link" href="#${s.id}-drill">Or the concept drill · ${challengesOf(s).length} quick challenges</a></p>
    </div>`;
  }

  /* ---- the board ---- */
  function fBoard(s) {
    const stages = fStages(s), i = F.si, x = stages[i], score = fScore(), done = fStageDone(i);
    const enter = F.lastSi !== i; F.lastSi = i;
    const nDone = stages.filter((y, j) => fStageDone(j)).length;
    const evid = F.locker.filter((e) => e.kind === "evidence").length;
    const nextI = i + 1 < stages.length ? i + 1 : -1;
    return `<div class="dg-board">
      <header class="dg-hud">
        <div class="dg-hud__top">
          <p class="mono dg-hud__case">${esc(s.field.caseId)}</p>
          <div class="dg-hud__stats mono">
            <span><b data-count="${score}">${fmt(score)}</b> / ${fmt(s.field.max)} XP</span>
            <span><b>${evid}</b> evidence</span>
            <span><b>${nDone}</b> / ${stages.length} filed</span>
            ${fSndBtn()}
          </div>
        </div>
        <ol class="dg-steps" aria-label="Case progress">${stages.map((y, j) => {
          const stt = fStageDone(j) ? "done" : fUnlocked(s, j) ? "open" : "locked";
          return `<li class="is-${stt}${j === i ? " now" : ""}"><button data-action="f-go" data-i="${j}" data-fk="go${j}" ${stt === "locked" ? 'aria-disabled="true"' : ""}${j === i ? ' aria-current="step"' : ""} aria-label="Stage ${y.code}: ${esc(y.name)}${stt === "done" ? ", filed" : stt === "locked" ? ", locked" : ""}"><span class="mono">${y.code}</span><span class="dg-steps__n">${esc(y.name)}</span></button></li>`;
        }).join("")}</ol>
        <div class="dg-hud__bar" aria-hidden="true"><i style="width:${(score / s.field.max) * 100}%"></i></div>
      </header>
      <div class="dg-main">
        <section class="dg-work${enter ? " is-enter" : ""}" aria-labelledby="game-h">
          <div class="dg-stagehead">
            <p class="mono dg-k">Stage ${x.code} · ${esc(x.mechanic)}</p>
            <h2 id="game-h" tabindex="-1">${esc(x.name)}</h2>
            <p class="dg-stagehead__intro">${esc(x.intro)}</p>
          </div>
          ${fStageBody(s, i)}
          ${done ? fStageFiled(s, i, nextI) : ""}
        </section>
        ${fLocker(s)}
      </div>
    </div>`;
  }

  function fStageFiled(s, i, nextI) {
    const x = fStages(s)[i], xp = fStageXP(i), max = fStageMax(s, i), clean = F.st[i].every((q) => q.firstOK !== false);
    const pop = F.celebrate === i; F.celebrate = null;
    const last = i === fStages(s).length - 1;
    return `<div class="dg-filed${pop ? " is-pop" : ""}" role="status">
      <span class="dg-filed__stamp mono" aria-hidden="true">Filed</span>
      <p><b>Stage ${x.code} filed.</b> ${clean ? "Clean work." : "Done, with a second look or two."} <span class="mono">+${fmt(xp)} of ${fmt(max)} XP</span></p>
      ${i === 0 ? `<p class="dg-objective"><span class="mono">Investigation objective</span>${esc(s.field.objective)}</p>` : ""}
      <div class="actions">${last ? `<button class="btn btn--pink btn--big" data-action="f-finish" data-fk="finish">Submit the dossier</button>`
        : nextI > 0 ? `<button class="btn btn--pink" data-action="f-go" data-i="${nextI}" data-fk="next">Next: ${esc(fStages(s)[nextI].name)} →</button>` : ""}</div>
    </div>`;
  }

  function fLocker(s) {
    const groups = [["lead", "Leads"], ["evidence", "Evidence"], ["flag", "To validate"], ["decision", "Decisions"]];
    const n = F.locker.length;
    return `<aside class="dg-locker${F.lockerOpen ? " is-open" : ""}" aria-label="Evidence locker">
      <button class="dg-locker__toggle mono" data-action="f-locker" data-fk="locker" aria-expanded="${F.lockerOpen}">Evidence locker · ${n} item${n === 1 ? "" : "s"}</button>
      <div class="dg-locker__body">
        <p class="mono dg-locker__k" aria-hidden="true">Evidence locker</p>
        ${n ? groups.map(([k, label]) => {
          const list = F.locker.filter((e) => e.kind === k);
          const shown = list.slice(-4).reverse(), more = list.length - shown.length;
          return list.length ? `<div class="dg-lg"><p class="mono dg-lg__k">${label} · ${list.length}</p><ul>${shown.map((e) => `<li class="dg-li dg-li--${esc(e.tag || k)}${F.fresh.includes(e.id) ? " is-new" : ""}">${e.tagLabel ? `<span class="mono dg-tag">${esc(e.tagLabel)}</span>` : ""}<b>${esc(e.title)}</b>${e.text ? `<span>${esc(e.text)}</span>` : ""}</li>`).join("")}</ul>${more ? `<p class="mono dg-lg__more">+ ${more} earlier</p>` : ""}</div>` : "";
        }).join("") : `<p class="dg-locker__empty">Empty for now. Leads, evidence and decisions land here as you work the case.</p>`}
      </div>
    </aside>`;
  }

  function fStageBody(s, i) {
    const x = fStages(s)[i];
    let html = "", k = 0;
    for (; k < x.tasks.length; k++) {
      const t = x.tasks[k], q = F.st[i][k];
      html += fTaskWrap(s, i, k, t, q);
      if (!q.solved) break;
    }
    if (i === fStages(s).length - 1) html += fDraft(s);
    return html;
  }
  function fTaskWrap(s, i, k, t, q) {
    const n = fStages(s)[i].tasks.length;
    return `<article class="dg-task dg-task--${t.type}${q.solved ? " is-solved" : ""}" id="dg-t-${t.id}">
      <header class="dg-task__head">
        <p class="mono dg-k">${n > 1 ? `Task ${k + 1} of ${n} · ` : ""}${t.pts} XP</p>
        <h3>${esc(t.h)}</h3>
        ${q.solved ? `<span class="mono dg-task__xp">+${fmt(q.earned)} XP</span>` : `<p class="dg-task__ask">${esc(t.ask)}</p>`}
      </header>
      ${fTaskBody(s, i, k, t, q)}
      ${t.type === "tools" && !q.solved ? "" : fFeedback(q)}
    </article>`;
  }
  function fFeedback(q) {
    const f = q.fb;
    if (!f) return "";
    return `<p class="dg-fb dg-fb--${f.ok ? "ok" : f.warn ? "warn" : "bad"}" role="status"><span class="mono">${f.ok ? "Field note" : f.warn ? "Careful" : "Not quite"}</span>${esc(f.text)}</p>`;
  }

  /* ---- task bodies ---- */
  function fTaskBody(s, i, k, t, q) {
    if (t.type === "sort") return fSort(s, t, q);
    if (t.type === "multi") return fMulti(s, t, q);
    if (t.type === "pin") return fPin(s, t, q);
    if (t.type === "pick") return fPick(s, t, q);
    if (t.type === "tools") return fTools(s, t, q);
    if (t.type === "slider") return fSlider(s, t, q);
    if (t.type === "builder") return fBuilder(s, t, q);
    if (t.type === "linkedin") return fLinked(s, t, q);
    if (t.type === "alloc") return fAlloc(s, t, q);
    if (t.type === "roi") return fRoi(s, t, q);
    return "";
  }

  const fZoneName = (t, z) => (t.zones.find((x) => x.id === z) || {}).label || z;
  function fCardInner(t, it) {
    if (t.layout === "matrix") return `<span class="mono dg-card__k">${it.slide ? "From the session" : "Illustrative"}</span><b>${esc(it.name)}</b><span>${esc(it.text)}</span>`;
    if (it.src) return `<span class="mono dg-card__k">${esc(it.src)}${it.unsolicited ? " · turned up unasked" : ""}</span><span>${esc(it.text)}</span><span class="mono dg-card__ill">Illustrative</span>`;
    return `<span>${esc(it.text)}</span>`;
  }
  function fCard(t, it, extra = "") {
    const picked = F.pick && F.pick.t === t.id && F.pick.id === it.id;
    const bounce = F.flash && F.flash.id === it.id && !F.flash.ok;
    return `<button class="dg-card${picked ? " is-picked" : ""}${bounce ? " is-bounce" : ""}${extra}" draggable="true" data-action="f-pick" data-t="${t.id}" data-id="${it.id}" data-fk="c-${it.id}" aria-pressed="${picked}">${fCardInner(t, it)}</button>`;
  }
  function fZone(t, q, z, inner) {
    const live = !q.solved, picked = F.pick && F.pick.t === t.id;
    const placed = t.items.filter((it) => q.place[it.id] === z.id);
    const head = `<span class="dg-zone__l">${esc(z.label)}</span>${z.sub ? `<span class="mono dg-zone__s">${esc(z.sub)}</span>` : ""}<span class="mono dg-zone__n">${placed.length}</span>`;
    return `<div class="dg-zone dg-zone--${z.id}${z.tone ? " is-" + z.tone : ""}${picked && live ? " is-ready" : ""}" ${live ? `data-dz="${t.id}|${z.id}"` : ""}>
      ${live ? `<button class="dg-zone__h" data-action="f-drop" data-t="${t.id}" data-z="${z.id}" data-fk="z-${t.id}-${z.id}" aria-label="Place ${picked ? "the selected card" : "a card"} in ${esc(z.label)}">${head}<span class="mono dg-zone__go">${picked ? "Place here" : "Drop here"}</span></button>` : `<div class="dg-zone__h">${head}</div>`}
      <ul class="dg-zone__list">${placed.map((it) => `<li class="dg-placed${F.fresh.includes("p-" + it.id) ? " is-new" : ""}${q.miss[it.id] ? " was-miss" : ""}">${inner ? inner(it) : fPlacedText(t, it)}</li>`).join("")}</ul>
    </div>`;
  }
  const fPlacedText = (t, it) => t.layout === "matrix" ? `<b>${esc(it.name)}</b>` : it.src ? `<span class="mono">${esc(it.src)}</span> ${esc(it.text)}` : esc(it.text);

  function fSort(s, t, q) {
    const left = t.items.filter((it) => !q.place[it.id]);
    if (t.layout === "stack") {
      const top = left[0];
      const leadOf = (it) => `<span>${esc(it.text)}</span>${it.lead ? `<em class="dg-lead"><span class="mono">Lead</span>${esc(it.lead)}</em>` : ""}`;
      return `<div class="dg-sort dg-sort--stack">
        <div class="dg-stack" data-dz="${t.id}|tray">
          ${top ? `<div class="dg-stack__pile" aria-hidden="true">${left.slice(1, 4).map((x, j) => `<i style="--j:${j + 1}"></i>`).join("")}</div>${fCard(t, top, " dg-card--q")}<p class="mono dg-stack__n">${left.length} card${left.length === 1 ? "" : "s"} on the stack</p>`
            : `<p class="dg-stack__done">Stack cleared. ${t.items.filter((it) => it.zone.includes("ask")).length} questions asked, ${t.items.filter((it) => it.zone.includes("park")).length} parked.</p>`}
        </div>
        <div class="dg-zones dg-zones--2">${t.zones.map((z) => fZone(t, q, z, z.id === "ask" ? leadOf : null)).join("")}</div>
        ${t.leadNote ? `<p class="dg-ill"><span class="mono">Illustrative</span> ${esc(t.leadNote)}</p>` : ""}
      </div>`;
    }
    if (t.layout === "claims") {
      const x = fStages(s).find((y) => y.tasks.includes(t)), r = x.report, ex = s.field.exhibits;
      const ins = F.insp && t.items.find((it) => it.id === F.insp);
      return `<div class="dg-sort dg-sort--claims">
        <div class="dg-report">
          <div class="dg-report__head"><b class="mono">${esc(r.name)}</b><span class="mono">${esc(r.meta)}</span></div>
          <ol class="dg-report__list">${t.items.map((it, n) => {
            const z = q.place[it.id];
            if (z) return `<li class="dg-claim is-placed is-${z}"><span class="mono dg-claim__n">${pad(n + 1)}</span><span>${esc(it.text)}</span><span class="mono dg-verdict">${esc(fZoneName(t, z))}</span></li>`;
            const picked = F.pick && F.pick.t === t.id && F.pick.id === it.id;
            return `<li class="dg-claim"><button class="dg-card dg-card--claim${picked ? " is-picked" : ""}${F.flash && F.flash.id === it.id && !F.flash.ok ? " is-bounce" : ""}" draggable="true" data-action="f-pick" data-t="${t.id}" data-id="${it.id}" data-fk="c-${it.id}" aria-pressed="${picked}"><span class="mono dg-claim__n">${pad(n + 1)}</span><span>${esc(it.text)}</span><span class="mono dg-claim__i">Inspect</span></button>${picked ? `<p class="dg-claim__check"><span class="mono">Check</span>${esc(it.check)}</p>` : ""}</li>`;
          }).join("")}</ol>
          <p class="dg-report__note mono">${esc(r.note)}</p>
        </div>
        <div class="dg-inspect" aria-live="polite">${ins ? `<p class="mono dg-k">Inspecting claim ${pad(t.items.indexOf(ins) + 1)}</p><p class="dg-inspect__q">“${esc(ins.text)}”</p><p class="dg-inspect__c"><span class="mono">Check</span>${esc(ins.check)}</p>${ins.exhibit ? fExhibit(ex[ins.exhibit]) : ""}`
          : `<p class="mono dg-k">Inspector</p><p class="dg-inspect__empty">Tap a claim to check it against your evidence. Then drop it in a bin.</p>`}</div>
        <div class="dg-zones dg-zones--3">${t.zones.map((z) => fZone(t, q, z)).join("")}</div>
      </div>`;
    }
    if (t.layout === "matrix") {
      return `<div class="dg-sort dg-sort--matrix">
        ${q.solved ? "" : `<div class="dg-tray" data-dz="${t.id}|tray">${left.map((it) => fCard(t, it, " dg-card--who")).join("")}</div>`}
        <div class="dg-matrix">
          <span class="mono dg-matrix__y">Satisfaction: value they get ↑</span>
          <div class="dg-matrix__grid">${t.zones.map((z) => fZone(t, q, z)).join("")}</div>
          <span class="mono dg-matrix__x">Profitability to Sephora →</span>
        </div>
      </div>`;
    }
    return `<div class="dg-sort dg-sort--board">
      ${q.solved ? "" : `<div class="dg-tray" data-dz="${t.id}|tray">${left.map((it) => fCard(t, it)).join("")}</div>`}
      <div class="dg-zones dg-zones--${t.zones.length}">${t.zones.map((z) => fZone(t, q, z)).join("")}</div>
    </div>`;
  }
  function fExhibit(e) {
    if (!e) return "";
    return `<figure class="dg-exhibit"><figcaption class="mono">${esc(e.k)}</figcaption><b>${esc(e.h)}</b>${e.stat ? `<div class="dg-bars">${e.stat.map((v, j) => `<div><span class="mono">${esc(e.labels[j])}</span><i style="--w:${v}%"></i><b class="mono">${v}%</b></div>`).join("")}</div>` : ""}<p>${esc(e.text)}</p></figure>`;
  }

  function fMulti(s, t, q) {
    const opts = t.options.map((o) => {
      const on = q.sel.includes(o.id);
      const mark = q.solved ? (o.correct ? " is-right" : "") : "";
      return q.solved ? `<li class="dg-opt${on ? " is-on" : ""}${mark}"><span>${esc(o.text)}</span></li>`
        : `<li><button class="dg-opt${on ? " is-on" : ""}" data-action="f-toggle" data-t="${t.id}" data-o="${o.id}" data-fk="o-${o.id}" aria-pressed="${on}"><span>${esc(o.text)}</span></button></li>`;
    }).join("");
    return `<div class="dg-multi dg-multi--${t.id}"><ul class="dg-opts">${opts}</ul>
      ${q.solved ? "" : `<div class="actions"><button class="btn btn--ivory" data-action="f-submit" data-t="${t.id}" data-fk="sub-${t.id}" ${q.sel.length === t.need ? "" : "disabled"}>${q.sel.length === t.need ? "Lock it in" : `Pick ${t.need - q.sel.length} more`}</button></div>`}</div>`;
  }
  function fPin(s, t, q) {
    return `<ol class="dg-pin">${t.nodes.map((n) => {
      const here = q.solved && n.correct, tried = q.tried.includes(n.id) && !n.correct;
      const inner = `<b>${esc(n.label)}</b><span class="mono">${esc(n.sub)}</span>${here ? `<i class="dg-pin__mark" aria-hidden="true"></i>` : ""}`;
      return `<li class="${here ? "is-here" : ""}${tried ? " is-tried" : ""}">${q.solved ? `<div class="dg-pin__n">${inner}</div>` : `<button class="dg-pin__n" data-action="f-pin" data-t="${t.id}" data-n="${n.id}" data-fk="n-${n.id}">${inner}</button>`}</li>`;
    }).join("")}</ol>`;
  }
  function fPick(s, t, q) {
    return `<ul class="dg-opts dg-opts--pick">${t.options.map((o) => {
      const tried = q.tried.includes(o.id) && !o.correct, right = q.solved && o.correct;
      return q.solved ? `<li class="dg-opt${right ? " is-on is-right" : ""}${tried ? " is-tried" : ""}"><span>${esc(o.text)}</span></li>`
        : `<li><button class="dg-opt${tried ? " is-tried" : ""}" data-action="f-choose" data-t="${t.id}" data-o="${o.id}" data-fk="o-${o.id}"><span>${esc(o.text)}</span></button></li>`;
    }).join("")}</ul>`;
  }

  function fTools(s, t, q) {
    const cur = t.questions.find((x) => x.id === q.q);
    const groups = [...new Set(t.tools.map((x) => x.group))];
    const tags = fFind(s, "tags").t;
    return `<div class="dg-lab">
      <ol class="dg-qs">${t.questions.map((x, n) => {
        const done = q.done[x.id], tool = done && t.tools.find((y) => y.id === done);
        return `<li class="${done ? "is-done" : ""}${x.id === q.q && !done ? " is-now" : ""}">${q.solved || done ? `<div class="dg-q"><span class="mono">Q${n + 1}</span><span>${esc(x.text)}</span>${tool ? `<span class="mono dg-q__tool">${esc(tool.name)}</span>` : ""}</div>`
          : `<button class="dg-q" data-action="f-q" data-t="${t.id}" data-q="${x.id}" data-fk="q-${x.id}" aria-pressed="${x.id === q.q}"><span class="mono">Q${n + 1}</span><span>${esc(x.text)}</span></button>`}</li>`;
      }).join("")}${q.solved ? "" : `<li class="dg-qs__fb">${fFeedback(q)}</li>`}</ol>
      ${q.solved ? "" : `<div class="dg-shelf">
        <p class="mono dg-shelf__k">${cur && !q.done[cur.id] ? `Open a tool for Q${t.questions.indexOf(cur) + 1}` : "Pick a question"}</p>
        ${groups.map((g) => `<div class="dg-shelf__g"><p class="mono">${esc(g)}</p><div class="dg-shelf__row">${t.tools.filter((x) => x.group === g).map((x) => {
          const tried = cur && (q.tried[cur.id] || []).includes(x.id);
          return `<button class="dg-tool${tried ? " is-tried" : ""}" data-action="f-tool" data-t="${t.id}" data-tool="${x.id}" data-fk="tool-${x.id}" ${!cur || q.done[cur.id] ? "disabled" : ""}><b>${esc(x.name)}</b><span>${esc(x.does)}</span></button>`;
        }).join("")}</div></div>`).join("")}
      </div>`}
      ${Object.keys(q.done).length ? `<div class="dg-found"><p class="mono dg-k">Evidence collected · ${Object.keys(q.done).length} of ${t.questions.length}</p><div class="dg-found__row">${t.questions.filter((x) => q.done[x.id]).map((x) => { const c = tags.items.find((y) => y.id === x.card); return `<div class="dg-chip${F.fresh.includes(c.id) ? " is-new" : ""}"><span class="mono">${esc(c.src)}</span>${esc(c.text)}</div>`; }).join("")}</div><p class="dg-ill"><span class="mono">Illustrative</span> Simulated findings. No tool is being queried.</p></div>` : ""}
    </div>`;
  }

  function fSlider(s, t, q) {
    const v = q.solved ? q.val : q.val;
    return `<div class="dg-slider" data-slider="${t.id}">
      <div class="dg-panel">${Array.from({ length: 100 }, (_, j) => `<i class="${j < v / (t.sample / 100) ? "is-syn" : ""}"></i>`).join("")}</div>
      <div class="dg-slider__ctl">
        <label class="mono" for="dg-syn">Synthetic respondents in a ${fmt(t.sample)}-person survey</label>
        <input id="dg-syn" type="range" min="${t.min}" max="${t.max}" step="${t.step}" value="${v}" data-fi="slider" data-t="${t.id}" data-fk="slider" ${q.solved ? "disabled" : ""}>
        <p class="dg-slider__out"><b class="mono" data-out="syn">${fmt(v)}</b> synthetic · <b class="mono" data-out="real">${fmt(t.sample - v)}</b> real people · <b class="mono" data-out="pct">${Math.round(v / t.sample * 100)}%</b> of the sample</p>
        <p class="dg-legend mono"><span class="is-syn">Synthetic</span><span>Real</span><span class="dg-legend__cap">Guidance: 10–20%</span></p>
        ${q.solved ? "" : `<div class="actions"><button class="btn btn--ivory" data-action="f-slide" data-t="${t.id}" data-fk="slide-lock">Commission the survey</button></div>`}
      </div>
    </div>`;
  }

  /* ---- builder ---- */
  function fSeg(act, f, list, curv, extra = "") {
    return `<div class="dg-seg" role="group">${list.map((x) => `<button class="dg-seg__b${String(curv) === String(x.id) ? " is-on" : ""}" data-action="${act}" data-f="${f}" data-v="${x.id}" data-fk="${act}-${f}-${x.id}" aria-pressed="${String(curv) === String(x.id)}" ${extra}>${esc(x.name)}</button>`).join("")}</div>`;
  }
  function fChips(act, f, list, on, extra = "") {
    return `<div class="dg-chips" role="group">${list.map((x) => `<button class="dg-chipb${on.includes(x.id) ? " is-on" : ""}" data-action="${act}" data-f="${f}" data-v="${x.id}" data-fk="${act}-${f}-${x.id}" aria-pressed="${on.includes(x.id)}" ${extra}>${esc(x.name)}</button>`).join("")}</div>`;
  }
  function fBuilder(s, t, q) {
    const m = s.field.builder, B = q.locked ? q.locked.B : q, c = fBuild(s, B), chk = fBuildCheck(s, B, c);
    const dis = q.solved ? "disabled" : "";
    const inT = Math.round(c.rel * 100);
    const max = Math.log10(m.locations[0].base);
    const w = (v) => Math.max(2, Math.min(100, (Math.log10(Math.max(v, 1)) / max) * 100));
    const from = F.prevEst == null ? c.est : F.prevEst; F.prevEst = c.est;
    const wasted = c.waste * s.field.budget;
    return `<div class="dg-build">
      <div class="dg-build__ctl">
        <div class="dg-mini mono" aria-hidden="true"><span><b>${c.empty ? "—" : fmt(nice(c.est))}</b> ${esc(c.pf.unit)}</span><span><b>${inT}%</b> on target</span><span class="${chk.ok ? "is-ok" : "is-bad"}">${chk.ok ? "Lockable" : `${chk.warn.length} warning${chk.warn.length === 1 ? "" : "s"}`}</span></div>
        <div class="dg-field"><p class="mono">Platform</p>${fSeg("f-b", "platform", m.platforms, B.platform, dis)}</div>
        <div class="dg-field"><p class="mono">Location</p>${fSeg("f-b", "loc", m.locations, B.loc, dis)}</div>
        <div class="dg-field"><p class="mono">Age</p>${fChips("f-b", "ages", m.ages, B.ages, dis)}</div>
        <div class="dg-field"><p class="mono">Gender</p>${fSeg("f-b", "women", [{ id: 0, name: "All" }, { id: 1, name: "Women" }], B.women ? 1 : 0, dis)}</div>
        <div class="dg-field"><p class="mono">Interests</p>${fChips("f-b", "interests", m.interests, B.interests, dis)}</div>
        <div class="dg-field"><p class="mono">Behaviours</p>${fChips("f-b", "beh", m.behaviours, B.beh, dis)}</div>
        <div class="dg-field"><p class="mono">Lifestyle</p>${fChips("f-b", "life", m.lifestyle, B.life, dis)}</div>
      </div>
      <div class="dg-build__out" aria-live="polite">
        <p class="mono dg-sim2">Illustrative simulation · not a live platform estimate</p>
        <div class="dg-est"><b class="dg-est__n" data-from="${Math.round(from)}" data-to="${Math.round(c.est)}">${c.empty ? "—" : fmt(nice(c.est))}</b><span class="mono">estimated ${esc(c.pf.unit)}${c.empty ? "" : ` · range ${fmt(c.low)}–${fmt(c.high)}`}</span></div>
        <div class="dg-gauges">
          <div><span class="mono">On target</span><b class="mono">${inT}%</b><i class="dg-g"><i style="width:${inT}%"></i></i></div>
          <div class="is-waste"><span class="mono">Wasted spend</span><b class="mono">${money(s, wasted)}</b><i class="dg-g"><i style="width:${Math.round(c.waste * 100)}%"></i></i></div>
        </div>
        <div class="dg-land" role="img" aria-label="${inT} in every 100 people reached are on target">${Array.from({ length: 100 }, (_, j) => `<i class="${j < inT ? "is-in" : ""}"></i>`).join("")}</div>
        <ol class="dg-funnel">${c.steps.map((x) => `<li><span class="mono">${esc(x.k)}</span><i style="width:${w(x.v)}%"></i><b class="mono">${fmt(nice(x.v))}</b></li>`).join("")}</ol>
        <p class="dg-pnote"><span class="mono">${esc(c.pf.name)}</span>${esc(c.pf.note)}</p>
        <ul class="dg-warns">${chk.warn.map((x) => `<li class="is-${x.t}">${esc(x.x)}</li>`).join("")}${chk.good.map((x) => `<li class="is-good">${esc(x)}</li>`).join("")}</ul>
        ${q.solved ? `<p class="dg-lockline mono">Locked · ${fmt(q.locked.base)} base − ${q.locked.waste} wasted spend − ${q.locked.small} small audience = ${q.earned} XP</p>`
          : `<div class="actions"><button class="btn btn--pink" data-action="f-b-lock" data-t="${t.id}" data-fk="b-lock" ${chk.ok ? "" : "disabled"}>${chk.ok ? "Lock this audience" : "Fix the warnings to lock"}</button></div>`}
      </div>
    </div>`;
  }

  function fLinked(s, t, q) {
    const m = s.field.linkedin, L = q.locked ? q.locked.L : q, r = fLi(s, L), dis = q.solved ? "disabled" : "";
    const lmax = Math.log10(m.locations[1].base);
    const pos = (v) => Math.max(0, Math.min(100, Math.log10(Math.max(v, 1)) / lmax * 100));
    return `<div class="dg-build dg-build--li">
      <div class="dg-build__ctl">
        <div class="dg-field"><p class="mono">Location <em>required</em></p>${fSeg("f-l", "loc", [{ id: "", name: "Not set" }].concat(m.locations), L.loc || "", dis)}</div>
        <div class="dg-field"><p class="mono">Job function</p>${fChips("f-l", "fn", m.functions, L.fn, dis)}</div>
        <div class="dg-field"><p class="mono">Seniority</p>${fSeg("f-l", "sen", m.seniority, L.sen, dis)}</div>
        <div class="dg-field"><p class="mono">Narrow further</p>${fChips("f-l", "narrow", m.narrow, L.narrow, dis)}</div>
      </div>
      <div class="dg-build__out" aria-live="polite">
        <p class="mono dg-sim2">Illustrative · LinkedIn's thresholds are from the session</p>
        ${r.noLoc ? `<div class="dg-est is-blank"><b class="dg-est__n">—</b><span class="mono">Set location first. LinkedIn requires it.</span></div>`
          : `<div class="dg-est"><b class="dg-est__n">${fmt(nice(r.est))}</b><span class="mono">estimated members</span></div>
        <div class="dg-li-bar"><i class="dg-li-bar__fill" style="width:${pos(r.est)}%"></i><span class="dg-li-mk" style="left:${pos(m.min)}%"><b class="mono">300</b><em>minimum to serve</em></span><span class="dg-li-mk is-rec" style="left:${pos(m.rec)}%"><b class="mono">50,000+</b><em>recommended</em></span></div>
        <ul class="dg-warns">${r.warn.map((x) => `<li class="is-${x.t}">${esc(x.x)}</li>`).join("")}${r.ok && !r.warn.length ? `<li class="is-good">Location set, on brief, and above what LinkedIn recommends.</li>` : ""}</ul>`}
        ${q.solved ? `<p class="dg-lockline mono">Locked · ${fmt(nice(q.locked.est))} members · ${q.earned} XP</p>`
          : `<div class="actions"><button class="btn btn--pink" data-action="f-li-lock" data-t="${t.id}" data-fk="li-lock" ${!r.noLoc && r.ok ? "" : "disabled"}>${!r.noLoc && r.ok ? "Lock the LinkedIn audience" : "Not lockable yet"}</button></div>`}
      </div>
    </div>`;
  }

  /* ---- investment ---- */
  function fAlloc(s, t, q) {
    const m = s.field.invest, split = q.locked ? q.locked.split : q.split, r = fInvest(s, split);
    const dis = q.solved ? "disabled" : "";
    return `<div class="dg-alloc" data-alloc="${t.id}">
      <div class="dg-alloc__rows">${m.quads.map((x) => `<div class="dg-arow dg-arow--${x.id}">
        <label class="dg-arow__l" for="dg-al-${x.id}"><b>${esc(x.name)}</b><span class="mono" data-out="amt-${x.id}">${money(s, s.field.budget * split[x.id] / 100)}</span></label>
        <div class="dg-arow__c">
          <button class="dg-step" data-action="f-al" data-q="${x.id}" data-d="-5" data-fk="al-${x.id}-m" aria-label="Less to ${esc(x.name)}" ${dis}>−</button>
          <input id="dg-al-${x.id}" type="range" min="0" max="100" step="5" value="${split[x.id]}" data-fi="alloc" data-q="${x.id}" data-fk="al-${x.id}" ${dis}>
          <button class="dg-step" data-action="f-al" data-q="${x.id}" data-d="5" data-fk="al-${x.id}-p" aria-label="More to ${esc(x.name)}" ${dis}>+</button>
          <b class="mono dg-arow__p" data-out="pct-${x.id}">${split[x.id]}%</b>
        </div>
      </div>`).join("")}</div>
      <div class="dg-alloc__out" aria-live="polite">${fAllocOut(s, r)}</div>
      <p class="dg-ill"><span class="mono">Illustrative</span> ${esc(m.note)}</p>
      ${q.solved ? `<p class="dg-lockline mono">Locked · profit ${money(s, q.locked.profit)} on ${money(s, s.field.budget)} · ${q.earned} XP</p>`
        : `<div class="actions"><button class="btn btn--pink" data-action="f-al-lock" data-t="${t.id}" data-fk="al-lock" ${r.total === 100 ? "" : "disabled"}>Lock the split</button></div>`}
    </div>`;
  }
  function fAllocOut(s, r) {
    const tr = r.reach || 1, tp = r.profit || 1;
    return `<p class="mono dg-total${r.total === 100 ? " is-ok" : ""}">Allocated ${r.total}%</p>
      <div class="dg-trade">
        <div><p class="mono">Reach bought <b>${fmt(nice(r.reach))}</b></p><div class="dg-stackbar">${r.rows.map((x) => `<i class="q-${x.q.id}" style="width:${(x.reach / tr) * 100}%" title="${esc(x.q.name)}"></i>`).join("")}</div></div>
        <div><p class="mono">Profit back <b>${money(s, r.profit)}</b></p><div class="dg-stackbar">${r.rows.map((x) => `<i class="q-${x.q.id}" style="width:${(x.profit / tp) * 100}%" title="${esc(x.q.name)}"></i>`).join("")}</div></div>
      </div>
      <p class="dg-legend mono">${r.rows.map((x) => `<span class="q-${x.q.id}">${esc(x.q.name)}</span>`).join("")}</p>
      <ul class="dg-warns">${r.notes.map((x) => `<li class="is-${x.t}">${esc(x.x)}</li>`).join("")}${!r.notes.length ? `<li class="is-good">The money follows customer quality. Notice how little reach that costs you in profit terms.</li>` : ""}</ul>`;
  }
  function fRoi(s, t, q) {
    const a = fFind(s, "alloc").q.locked;
    if (!a) return "";
    const S = s.field.budget, P = a.profit, roi = Math.round(((P - S) / S) * 100);
    const shown = q.solved || q.tries >= 2;
    return `<div class="dg-roi">
      <div class="dg-roi__f"><span class="mono">From the session</span><b>ROI = (Profit − Ad Spend) / Ad Spend</b></div>
      <dl class="dg-roi__n"><div><dt class="mono">Ad spend</dt><dd>${money(s, S)}</dd></div><div><dt class="mono">Profit from your split</dt><dd>${money(s, P)}</dd></div></dl>
      ${q.solved ? "" : `<div class="dg-roi__in"><label class="mono" for="dg-roi">Your ROI</label><input id="dg-roi" type="text" inputmode="decimal" value="${esc(q.val)}" data-fi="roi" data-t="${t.id}" data-fk="roi" autocomplete="off"><span class="mono">%</span><button class="btn btn--ivory" data-action="f-roi" data-t="${t.id}" data-fk="roi-go">Check</button></div>`}
      ${shown ? `<p class="dg-roi__w mono">(${money(s, P)} − ${money(s, S)}) / ${money(s, S)} = ${((P - S) / S).toFixed(2)} → ${roi}%</p>` : ""}
    </div>`;
  }

  /* the dossier, assembling itself on stage 07 */
  function fDraft(s) {
    const d = fDossier(s);
    return `<aside class="dg-draft" aria-label="Your dossier so far"><p class="mono dg-k">Audience Dossier · draft</p><ol>${d.sections.map((x) => `<li class="${x.ready ? "is-ready" : ""}"><span class="mono">${pad(x.n)}</span>${esc(x.h)}</li>`).join("")}</ol></aside>`;
  }

  /* ---- the dossier, built from the run ---- */
  function fDossier(s) {
    const get = (id) => fFind(s, id), names = (t, z) => fZoneName(t, z);
    const frags = get("frags"), stack = get("stack"), tools = get("tools"), tags = get("tags"), claims = get("claims"), cap = get("cap");
    const build = get("builder"), li = get("li"), matrix = get("matrix"), alloc = get("alloc"), roi = get("roi"), why = get("why"), next = get("next");
    const m = s.field.builder, sec = [];
    const B = build.q.locked;
    let aud = [];
    if (B) {
      const b = B.B;
      aud.push(`${m.ages.filter((a) => b.ages.includes(a.id)).map((a) => a.name).join(", ")} · ${b.women ? "women" : "all genders"} · ${m.locations.find((x) => x.id === b.loc).name}`);
      const ints = m.interests.filter((x) => b.interests.includes(x.id)).map((x) => x.name);
      const beh = m.behaviours.filter((x) => b.beh.includes(x.id)).map((x) => x.name).concat(m.lifestyle.filter((x) => b.life.includes(x.id)).map((x) => x.name));
      aud.push(`Interests: ${ints.length ? ints.join(", ") : "none set"}${beh.length ? ` · Behaviour and lifestyle: ${beh.join(", ")}` : ""}`);
      aud.push(`Proxy built on ${B.platform}: ${B.rel}% on target.`);
    }
    sec.push({ n: 1, h: "Target audience", ready: !!B, lines: [`Brief: Gen Z women early in their beauty journey, new to Sephora, Singapore.`].concat(aud) });

    const insightCards = tags.t.items.filter((it) => tags.q.place[it.id] === "insight");
    const leads = stack.t.items.filter((it) => stack.q.place[it.id] === "ask" && it.lead).slice(0, 3);
    sec.push({ n: 2, h: "Key audience insights", ready: tags.q.solved, lines: insightCards.map((it) => `${it.text} (${it.src}, illustrative)`).concat(leads.map((it) => `Lead to confirm: ${it.lead}`)) });

    const used = tools.t.questions.filter((x) => tools.q.done[x.id]).map((x) => { const tl = tools.t.tools.find((y) => y.id === tools.q.done[x.id]); return `${tl.name} → ${x.text}`; });
    sec.push({ n: 3, h: "Evidence sources", ready: tools.q.solved, lines: used });

    sec.push({ n: 4, h: "Insight vs size", ready: tags.q.solved, lines: tags.t.items.filter((it) => tags.q.place[it.id]).map((it) => `${names(tags.t, tags.q.place[it.id])}: ${it.src}${tags.q.miss[it.id] ? " (filed after a second look)" : ""}`) });

    const sizeLines = B ? [`${fmt(B.low)}–${fmt(B.high)} ${B.unit} on ${B.platform} (illustrative simulation, not a platform estimate).`, B.note, `Wasted spend if the whole budget ran here: ${money(s, B.wasted)}.`] : [];
    if (li.q.locked) sizeLines.push(`Side brief: about ${fmt(nice(li.q.locked.est))} LinkedIn members (HR, Singapore). LinkedIn serves from 300 and recommends 50,000+.`);
    sec.push({ n: 5, h: "Audience size and assumptions", ready: !!B, lines: sizeLines });

    const plats = B ? [`${B.platform}: where the proxy audience was built.`, "Short-form video first, from the GWI evidence and the brand team's lead."] : [];
    if (li.q.locked) plats.push("LinkedIn for the B2B side brief only. It targets by job, not by beauty interest.");
    sec.push({ n: 6, h: "Relevant media platforms", ready: !!B, lines: plats });

    const A = alloc.q.locked, mt = matrix.t;
    const pri = mt.items.filter((it) => matrix.q.place[it.id]).map((it) => `${it.name}: ${names(mt, matrix.q.place[it.id])}`);
    if (A) pri.push(`Budget: ${s.field.invest.quads.map((x) => `${x.name} ${A.split[x.id]}%`).join(" · ")}`);
    sec.push({ n: 7, h: "Customer segment priority", ready: !!A, lines: pri });

    const wo = why.q.solved ? why.t.options.find((o) => o.correct) : null;
    const rl = [];
    if (wo) rl.push(wo.text);
    if (A) rl.push(`ROI = (${money(s, A.profit)} − ${money(s, s.field.budget)}) / ${money(s, s.field.budget)} = ${Math.round(A.roi * 100)}% (illustrative figures).`);
    sec.push({ n: 8, h: "Investment rationale", ready: why.q.solved && roi.q.solved, lines: rl });

    const ai = claims.t.items.filter((it) => ["hypothesis", "unsupported"].includes(claims.q.place[it.id])).map((it) => `${claims.q.place[it.id] === "hypothesis" ? "Test" : "Reject or rework"}: ${it.text}`);
    if (cap.q.solved) ai.push(`Validation survey: ${fmt(cap.q.val)} of ${fmt(cap.t.sample)} synthetic (${Math.round(cap.q.val / cap.t.sample * 100)}%; the guidance caps it at 10–20%).`);
    sec.push({ n: 9, h: "AI assumptions to validate", ready: claims.q.solved, lines: ai });

    sec.push({ n: 10, h: "Next steps", ready: next.q.solved, lines: next.t.options.filter((o) => next.q.sel.includes(o.id)).map((o) => o.text) });
    return { sections: sec, creator: matrix.q.place.p1 ? names(mt, matrix.q.place.p1) : null };
  }

  function fFinish(s) {
    const fd = s.field, score = fScore(), pct = Math.round((score / fd.max) * 100), st = stat(s.id);
    const before = unlockedIds();
    const tasks = [];
    fStages(s).forEach((x, i) => x.tasks.forEach((t, k) => tasks.push({ t, q: F.st[i][k], code: x.code, r: F.st[i][k].earned / t.pts })));
    const well = tasks.filter((x) => x.r >= 0.85).map((x) => x.t.well).filter(Boolean).slice(0, 4);
    const improve = tasks.filter((x) => x.r < 0.75).sort((a, b) => a.r - b.r).map((x) => x.t.improve).filter(Boolean).slice(0, 3);
    const cats = FCAT.map(([id, label]) => {
      const list = tasks.filter((x) => x.t.cat === id);
      return { id, label, got: list.reduce((a, x) => a + x.q.earned, 0), max: list.reduce((a, x) => a + x.t.pts, 0) };
    }).filter((c) => c.max);
    const B = fFind(s, "builder").q.locked;
    const sum = {
      v: FV, score, max: fd.max, pct, rank: fRank(s, pct).name, at: new Date().toISOString(),
      stages: fStages(s).map((x, i) => ({ code: x.code, name: x.name, got: fStageXP(i), max: fStageMax(s, i), clean: F.st[i].every((q) => q.firstOK !== false) })),
      cats, well, improve, waste: B ? { wasted: B.wasted, xp: B.waste } : null, dossier: fDossier(s)
    };
    st.field = Object.assign({ plays: 0, best: 0, bestPct: 0, runs: [], flags: {} }, st.field || {});
    st.field.scale = fd.max;
    st.field.plays += 1;
    st.field.best = Math.max(st.field.best || 0, score);
    st.field.bestPct = Math.max(st.field.bestPct || 0, pct);
    st.field.runs = [{ at: sum.at, score, pct }].concat(st.field.runs || []).slice(0, 8);
    st.fieldLast = sum;
    delete st.fieldRun;
    save(); recordEarned();
    sum.badges = allAchievements().filter((x) => x.check() && !before.includes(x.id)).map((x) => x.name);
    st.fieldLast = sum; save();
    F.summary = sum; F.last = sum; F.phase = "done"; F.viewLast = false;
    updateHeaderStat();
  }

  function fDone(s, sum) {
    const fd = s.field, r = fd.ranks.find((x) => x.name === sum.rank) || fRank(s, sum.pct), x = xpInfo();
    const date = new Date(sum.at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const ach = s.achievements.filter((a) => a.rule.type.indexOf("field") === 0);
    const on = unlockedIds();
    return `<div class="dg-done">
      <div class="dg-cert">
        <p class="mono dg-k">${esc(fd.caseId)} · case closed</p>
        <h2 id="game-h" tabindex="-1" class="dg-cert__rank">${esc(sum.rank)}</h2>
        <p class="dg-cert__line">${esc(r.line)}</p>
        <div class="dg-cert__score"><b>${fmt(sum.score)}</b><span class="mono">/ ${fmt(sum.max)} XP · ${sum.pct}%</span></div>
        <p class="mono dg-cert__meta">${esc(fd.name)} · ${esc(fd.role)} · ${esc(date)} · Level ${x.level}, ${esc(x.name)}</p>
        <ol class="dg-cert__ladder">${fd.ranks.slice().reverse().map((y) => `<li class="${y.name === sum.rank ? "is-me" : ""}"><span>${esc(y.name)}</span></li>`).join("")}</ol>
        ${sum.badges && sum.badges.length ? `<p class="dg-cert__badges mono">Unlocked this run: ${sum.badges.map(esc).join(" · ")}</p>` : ""}
      </div>
      <div class="dg-notes">
        <div class="dg-note is-well"><p class="mono dg-k">What you did well</p>${sum.well.length ? `<ul>${sum.well.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : `<p>Every stage needed a second pass. That's how the method sinks in. Run it again.</p>`}</div>
        <div class="dg-note is-improve"><p class="mono dg-k">What to work on</p>${sum.improve.length ? `<ul>${sum.improve.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : `<p>Nothing big. For Master Planner, it's about getting the last few calls right first time.</p>`}</div>
      </div>
      <div class="dg-score">
        <table class="dg-table"><caption class="mono">Score by stage</caption>
          <thead><tr><th scope="col">Stage</th><th scope="col">First time</th><th scope="col">XP</th></tr></thead>
          <tbody>${sum.stages.map((y) => `<tr><th scope="row"><span class="mono">${y.code}</span> ${esc(y.name)}</th><td>${y.clean ? "Clean" : "Retried"}</td><td><span class="dg-cell"><i style="width:${(y.got / y.max) * 100}%"></i></span><b>${fmt(y.got)}</b><small> / ${fmt(y.max)}</small></td></tr>`).join("")}</tbody>
        </table>
        <div class="dg-cats"><p class="mono dg-k">Where the points came from</p>${sum.cats.map((c) => `<div class="dg-cat"><span>${esc(c.label)}</span><i class="dg-g"><i style="width:${(c.got / c.max) * 100}%"></i></i><b class="mono">${fmt(c.got)} / ${fmt(c.max)}</b></div>`).join("")}
          ${sum.waste ? `<p class="dg-cat__waste mono">Wasted spend in your audience: ${money(s, sum.waste.wasted)} of ${money(s, fd.budget)} (illustrative) · −${sum.waste.xp} XP</p>` : ""}</div>
      </div>
      <section class="dg-dossier" aria-labelledby="dg-dos-h">
        <div class="dg-dossier__head"><p class="mono dg-k">Filed ${esc(date)} · built from your decisions</p><h3 id="dg-dos-h">Audience Dossier</h3><p class="mono dg-dossier__ill">Illustrative case. Not Sephora's data.</p></div>
        <ol class="dg-dossier__list">${sum.dossier.sections.map((y) => `<li><h4><span class="mono">${pad(y.n)}</span>${esc(y.h)}</h4>${y.lines.length ? `<ul>${y.lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>` : `<p class="dg-dossier__none">Nothing filed.</p>`}</li>`).join("")}</ol>
      </section>
      <div class="dg-badges"><p class="mono dg-k">Field achievements</p><ul>${ach.map((a) => `<li class="${on.includes(a.id) ? "is-on" : ""}"><b>${esc(a.name)}</b><span>${esc(a.desc)}</span></li>`).join("")}</ul></div>
      <div class="dg-recap">${fd.recap.map((y) => `<div><b>${esc(y.title)}</b><p>${esc(y.text)}</p></div>`).join("")}</div>
      <div class="actions dg-done__act">
        ${F.viewLast ? `<button class="btn btn--ghost" data-action="f-intro" data-fk="back">Back</button>` : ""}
        <button class="btn btn--pink" data-action="f-replay" data-fk="replay">Open a new case</button>
        <a class="btn btn--ghost" href="#${s.id}">Back to Learn</a>
        <a class="link mono" href="#${s.id}-drill">Try the concept drill</a>
      </div>
    </div>`;
  }

  /* ---- render ---- */
  function fRender(focusSel, top) {
    const s = byId(F.sid), el = document.getElementById("game");
    if (!el) return;
    const arena = el.closest(".game");
    if (arena) arena.dataset.phase = F.phase;
    const prevScore = F.prevScore == null ? fScore() : F.prevScore;
    el.innerHTML = fieldInner(s);
    fSaveRun();
    updateHeaderStat();
    const tabs = document.querySelector(".tabs__stat"); if (tabs) tabs.textContent = tabStat(s);
    const f = focusSel ? el.querySelector(focusSel) : null;
    if (f) f.focus({ preventScroll: true });
    if (top || !f) {
      const h = el.querySelector("#game-h");
      if (!focusSel && h) h.focus({ preventScroll: true });
      const tp = el.getBoundingClientRect().top;
      if (top || tp < 60 || tp > window.innerHeight * 0.6) window.scrollTo({ top: window.scrollY + tp - 80, behavior: reduceMotion() ? "auto" : "smooth" });
    }
    fTween(el, prevScore);
    F.prevScore = F.phase === "stage" ? fScore() : null;
  }
  function fTween(el, prevScore) {
    if (reduceMotion()) return;
    const run = (node, from, to, show) => {
      if (!node || from === to) return;
      const t0 = performance.now(), d = 520;
      const step = (now) => { const p = Math.min(1, (now - t0) / d), e = 1 - Math.pow(1 - p, 3); node.textContent = show(from + (to - from) * e); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    const est = el.querySelector(".dg-est__n[data-to]");
    if (est) run(est, +est.dataset.from, +est.dataset.to, (v) => fmt(nice(v)));
    const sc = el.querySelector("[data-count]");
    if (sc && F.phase === "stage") run(sc, prevScore, +sc.dataset.count, (v) => fmt(Math.round(v)));
  }
  const fk = (t) => (t && t.dataset && t.dataset.fk ? `[data-fk="${t.dataset.fk}"]` : null);

  /* ---- actions ---- */
  function fActionCore(a, t, s) {
    if (!F || F.sid !== s.id) return;
    if (a === "f-start" || a === "f-replay") {
      newField(s); const st = stat(s.id); if (st.fieldRun) { delete st.fieldRun; save(); }
      Object.assign(F, { resume: null, phase: "stage", started: true, si: 0 });
      announce("Case opened. Stage 01: The Case File.");
      return fRender(null, true);
    }
    if (a === "f-resume") { fResume(s); announce(`Case resumed at stage ${fStages(s)[F.si].code}.`); return fRender(null, true); }
    if (a === "f-last") { if (!F.last) return; F.summary = F.last; F.viewLast = true; F.phase = "done"; return fRender(null, true); }
    if (a === "f-intro") { F.summary = null; F.viewLast = false; F.phase = "intro"; return fRender(null, true); }
    if (a === "f-locker") { F.lockerOpen = !F.lockerOpen; return fRender(fk(t)); }
    if (F.phase !== "stage") return;
    if (a === "f-go") {
      const j = +t.dataset.i;
      if (!fUnlocked(s, j)) { announce("That stage opens when the one before it is filed."); return; }
      Object.assign(F, { si: j, pick: null, insp: null, prevEst: null });
      announce(`Stage ${fStages(s)[j].code}: ${fStages(s)[j].name}.`);
      return fRender(null, true);
    }
    if (a === "f-finish") {
      if (!fAllDone(s)) { announce("File every stage first."); return; }
      fFinish(s); announce(`Case closed. ${F.summary.score} XP. Rank: ${F.summary.rank}.`);
      celebrate(F.summary.pct);
      return fRender(null, true);
    }
    const ref = fFind(s, t.dataset.t || (a.indexOf("f-b") === 0 ? "builder" : a.indexOf("f-l") === 0 ? "li" : a.indexOf("f-al") === 0 ? "alloc" : ""));
    if (!ref || ref.i !== F.si || ref.q.solved) return;
    const prev = F.st[ref.i].slice(0, ref.k).every((q) => q.solved);
    if (!prev) return;
    const { t: tk, q } = ref, focus = fk(t);

    if (a === "f-pick") {
      const id = t.dataset.id, same = F.pick && F.pick.t === tk.id && F.pick.id === id;
      F.pick = same ? null : { t: tk.id, id };
      if (tk.layout === "claims") F.insp = id;
      if (!same) announce(`Picked. Now choose where it goes.`);
      return fRender(focus);
    }
    if (a === "f-drop") {
      let id = F.pick && F.pick.t === tk.id ? F.pick.id : null;
      if (!id && tk.layout === "stack") { const top = tk.items.find((it) => !q.place[it.id]); id = top && top.id; }
      if (!id) { announce("Pick a card first, then choose where it goes."); q.fb = { warn: true, text: "Pick a card first (tap it), then tap where it goes. Or just drag it." }; return fRender(focus); }
      fPlace(s, ref, id, t.dataset.z);
      return fRender(q.solved ? fNextFocus(s, ref) : focus);
    }
    if (a === "f-toggle") {
      const o = t.dataset.o;
      q.sel = q.sel.includes(o) ? q.sel.filter((x) => x !== o) : (q.sel.length < tk.need ? q.sel.concat(o) : q.sel);
      return fRender(focus);
    }
    if (a === "f-submit") {
      if (q.sel.length !== tk.need) return;
      const hits = q.sel.filter((o) => tk.options.find((x) => x.id === o).correct).length;
      if (hits === tk.need) {
        q.solved = true; q.firstOK = q.tries === 0;
        q.earned = q.firstOK ? tk.pts : Math.round(tk.pts * Math.max(q.partial || 0, 0.5));
        q.fb = { ok: true, text: tk.ok };
        if (tk.id === "next") fLock({ id: "dec-next", kind: "decision", title: "Next steps", text: tk.options.filter((o) => q.sel.includes(o.id)).map((o) => o.text.split(":")[0]).join(" · ") });
        fSolved(s, ref);
      } else {
        if (q.tries === 0) q.partial = hits / tk.need;
        q.tries++;
        q.fb = { ok: false, text: `${hits} of ${tk.need} right. ${tk.bad}` };
      }
      announce(q.fb.text);
      return fRender(q.solved ? fNextFocus(s, ref) : focus);
    }
    if (a === "f-pin" || a === "f-choose") {
      const id = t.dataset.n || t.dataset.o;
      const list = tk.nodes || tk.options, it = list.find((x) => x.id === id);
      if (it.correct) {
        q.solved = true; q.firstOK = q.tries === 0; q.earned = q.firstOK ? tk.pts : Math.round(tk.pts / 2); q.pick = id;
        q.fb = { ok: true, text: tk.feedback ? tk.feedback[id] : it.ok };
        if (tk.id === "why") fLock({ id: "dec-why", kind: "decision", title: "Rationale", text: it.text });
        fSolved(s, ref);
      } else {
        q.tries++; if (!q.tried.includes(id)) q.tried.push(id);
        q.fb = { ok: false, text: tk.feedback ? tk.feedback[id] : it.bad };
      }
      announce(q.fb.text);
      return fRender(q.solved ? fNextFocus(s, ref) : focus);
    }
    if (a === "f-q") { if (!q.done[t.dataset.q]) q.q = t.dataset.q; q.fb = null; return fRender('[data-fk="tool-gwi"]'); }
    if (a === "f-tool") {
      const cur = tk.questions.find((x) => x.id === q.q), tool = tk.tools.find((x) => x.id === t.dataset.tool);
      if (!cur || q.done[cur.id]) return;
      q.got = q.got || {};
      if (cur.tools.includes(tool.id)) {
        q.done[cur.id] = tool.id; q.got[cur.id] = q.miss[cur.id] ? cur.pts / 2 : cur.pts;
        const card = fFind(s, "tags").t.items.find((y) => y.id === cur.card);
        F.fresh.push(card.id);
        fLock({ id: "ev-" + card.id, kind: "evidence", tag: "unfiled", tagLabel: "Unfiled", title: card.src, text: card.text });
        q.fb = { ok: true, text: `${tool.name} turned something up. It's in the locker, waiting to be filed.` };
        fFlag(s, "clue");
        const nxt = tk.questions.find((x) => !q.done[x.id]);
        if (nxt) q.q = nxt.id;
        else {
          q.solved = true;
          const misses = Object.values(q.miss).reduce((x, y) => x + y, 0);
          q.firstOK = misses === 0; q.earned = Math.round(Object.values(q.got).reduce((x, y) => x + y, 0));
          fFind(s, "tags").t.items.filter((y) => y.unsolicited).forEach((y) => { fLock({ id: "ev-" + y.id, kind: "evidence", tag: "unfiled", tagLabel: "Unfiled", title: y.src, text: y.text }); });
          q.fb = { ok: true, text: "Five questions, five findings. And two more cards turned up on their own: a viral TikTok and a Reddit thread." };
          if (misses <= 1) fFlag(s, "tools");
          fSolved(s, ref);
        }
      } else {
        q.miss[cur.id] = (q.miss[cur.id] || 0) + 1; q.tries++;
        q.tried[cur.id] = (q.tried[cur.id] || []).concat(tool.id);
        q.fb = { ok: false, text: cur.why[tool.id] || cur.why._ || `${tool.name}: ${tool.does} Not what this question needs.` };
      }
      announce(q.fb.text);
      return fRender(q.solved ? fNextFocus(s, ref) : q.fb.ok ? `[data-fk="q-${q.q}"]` : focus);
    }
    if (a === "f-slide") {
      const v = q.val;
      if (v > tk.hi) { q.tries++; q.fb = { ok: false, text: tk.high }; announce(tk.high); return fRender(focus); }
      const base = v >= tk.lo ? 1 : 0.6;
      q.solved = true; q.firstOK = q.tries === 0 && base === 1;
      q.earned = Math.round(tk.pts * base * (q.tries ? 0.5 : 1));
      q.fb = base === 1 ? { ok: true, text: tk.ok } : { warn: true, text: tk.low };
      fLock({ id: "flag-cap", kind: "flag", title: "Synthetic cap", text: `${fmt(v)} of ${fmt(tk.sample)} respondents (${Math.round(v / tk.sample * 100)}%)` });
      announce(q.fb.text); fSolved(s, ref);
      return fRender(fNextFocus(s, ref));
    }
    if (a === "f-b") {
      const f = t.dataset.f, v = t.dataset.v;
      if (f === "platform" || f === "loc") q[f] = v;
      else if (f === "women") q.women = v === "1";
      else q[f] = q[f].includes(v) ? q[f].filter((x) => x !== v) : q[f].concat(v);
      q.fb = null;
      return fRender(focus);
    }
    if (a === "f-b-lock") {
      const c = fBuild(s, q), chk = fBuildCheck(s, q, c);
      if (!chk.ok) return;
      const sc = fBuildScore(s, tk, c);
      q.locked = { B: { loc: q.loc, platform: q.platform, ages: q.ages.slice(), women: q.women, interests: q.interests.slice(), beh: q.beh.slice(), life: q.life.slice() }, est: c.est, low: c.low, high: c.high, rel: Math.round(c.rel * 100), unit: c.pf.unit, platform: c.pf.name, note: c.pf.note, base: tk.pts, waste: sc.waste, small: sc.small, wasted: c.waste * s.field.budget };
      q.solved = true; q.earned = sc.earned; q.firstOK = sc.earned >= tk.pts - 5;
      const sweet = c.rel >= s.field.builder.sweetRel && c.est >= s.field.builder.sweet;
      q.fb = { ok: true, text: sweet ? `Sweet spot: ${pct0(c.rel)} on target, about ${fmt(nice(c.est))} ${c.pf.unit}. Relevant and reachable.` : c.est < s.field.builder.sweet ? `Locked. Very relevant, but small: about ${fmt(nice(c.est))} ${c.pf.unit}. Every filter you added cost you reach.` : `Locked. Big enough, but ${pct0(c.waste)} of the money still reaches people outside the brief.` };
      fLock({ id: "dec-aud", kind: "decision", title: "Audience", text: `${c.pf.name} · ${fmt(c.low)}–${fmt(c.high)} ${c.pf.unit} · ${pct0(c.rel)} on target` });
      if (sweet) fFlag(s, "sweet");
      announce(q.fb.text); fSolved(s, ref);
      return fRender(fNextFocus(s, ref));
    }
    if (a === "f-l") {
      const f = t.dataset.f, v = t.dataset.v;
      if (f === "loc") q.loc = v || null;
      else if (f === "sen") q.sen = v;
      else q[f] = q[f].includes(v) ? q[f].filter((x) => x !== v) : q[f].concat(v);
      q.fb = null;
      return fRender(focus);
    }
    if (a === "f-li-lock") {
      const r = fLi(s, q);
      if (r.noLoc || !r.ok) return;
      q.locked = { L: { loc: q.loc, fn: q.fn.slice(), sen: q.sen, narrow: q.narrow.slice() }, est: r.est };
      const full = r.est >= s.field.linkedin.rec;
      q.solved = true; q.firstOK = full; q.earned = full ? tk.pts : Math.round(tk.pts / 2);
      q.fb = full ? { ok: true, text: `About ${fmt(nice(r.est))} members. Location first, on brief, comfortably past 50,000.` } : { warn: true, text: `About ${fmt(nice(r.est))} members. It'll serve (300+), but LinkedIn recommends 50,000+. Drop a filter next time.` };
      fLock({ id: "dec-li", kind: "decision", title: "LinkedIn side audience", text: `${fmt(nice(r.est))} members · HR · Singapore` });
      announce(q.fb.text); fSolved(s, ref);
      return fRender(fNextFocus(s, ref));
    }
    if (a === "f-al") {
      const id = t.dataset.q;
      q.split[id] = Math.max(0, Math.min(100, (q.split[id] || 0) + +t.dataset.d));
      q.fb = null;
      return fRender(focus);
    }
    if (a === "f-al-lock") {
      const r = fInvest(s, q.split);
      if (r.total !== 100) return;
      q.locked = { split: Object.assign({}, q.split), profit: r.profit, roi: r.roi, reach: r.reach };
      q.solved = true; q.earned = Math.round(tk.pts * clamp01(r.roi / s.field.invest.fullAt)); q.firstOK = q.earned === tk.pts;
      const topQ = s.field.invest.quads.slice().sort((x, y) => q.split[y.id] - q.split[x.id])[0];
      q.fb = r.roi >= s.field.invest.fullAt ? { ok: true, text: `Strong split. Most of the money backs customers who give it back.` } : r.roi > 0 ? { warn: true, text: `It makes money, but a chunk of the budget is buying reach that doesn't pay back. Free riders and lost causes look cheap per head.` } : { ok: false, text: "This split loses money. Reach is up, value is down." };
      fLock({ id: "dec-split", kind: "decision", title: "Budget split", text: `${s.field.invest.quads.map((x) => `${x.name} ${q.split[x.id]}%`).join(" · ")}. Biggest bet: ${topQ.name}.` });
      announce(q.fb.text); fSolved(s, ref);
      return fRender(fNextFocus(s, ref));
    }
    if (a === "f-roi") {
      const A = fFind(s, "alloc").q.locked;
      let v = parseFloat(String(q.val).replace(/[%\s,]/g, ""));
      if (isNaN(v)) { q.fb = { warn: true, text: "Type a number: the ROI as a percentage." }; return fRender(focus); }
      if (Math.abs(v) < 5 && /\./.test(String(q.val))) v *= 100;
      const roi = Math.round(A.roi * 100);
      if (Math.abs(v - roi) <= 1) {
        q.solved = true; q.firstOK = q.tries === 0; q.earned = q.firstOK ? tk.pts : Math.round(tk.pts / 2);
        q.fb = { ok: true, text: `${roi}%. Every S$1 spent brings back S$${(1 + A.roi).toFixed(2)} in profit.` };
        fLock({ id: "dec-roi", kind: "decision", title: "ROI", text: `${roi}% on ${money(s, s.field.budget)}` });
        if (q.firstOK && A.roi >= 1) fFlag(s, "budget");
        fSolved(s, ref);
      } else {
        q.tries++;
        q.fb = { ok: false, text: v > roi + 50 ? "Too high. Did you divide profit by spend without taking the spend off first?" : q.tries >= 2 ? "Here's the working. Follow it through." : "Not quite. Take the spend off the profit first, then divide by the spend." };
      }
      announce(q.fb.text);
      return fRender(q.solved ? fNextFocus(s, ref) : focus);
    }
  }

  /* ---- FIELD MODE sound: short, event-triggered effects only ----
     Synthesised with the Web Audio API (no files, no libraries). Nothing loops and nothing
     plays on load: the audio context is created on the first click inside FIELD MODE, and
     each new effect stops the one before it, so sounds never pile up. Off means silent at once.
     The preference lives in its own key, outside the progress save. */
  const SFX = (() => {
    const KEY = "unfold.fieldSound";
    let ctx = null, out = null, on = true, live = [], lastAt = 0;
    const log = [];
    try { on = localStorage.getItem(KEY) !== "off"; } catch (err) { /* ignore */ }
    function ac() {
      if (!ctx) {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) return null;
        ctx = new C();
        out = ctx.createGain(); out.gain.value = 0.55;
        const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 7000;
        out.connect(lp); lp.connect(ctx.destination);
      }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    }
    function stopAll() {
      live.forEach((n) => { try { n.stop(); } catch (err) { /* already stopped */ } });
      live = [];
    }
    function tone(t, f, d, type = "square", vol = 0.08, to = null) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + d + 0.02); live.push(o);
    }
    function noise(t, d, vol = 0.05, hp = 2500) {
      const len = Math.max(1, Math.floor(ctx.sampleRate * d)), buf = ctx.createBuffer(1, len, ctx.sampleRate), ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = buf; f.type = "highpass"; f.frequency.value = hp; g.gain.value = vol;
      src.connect(f); f.connect(g); g.connect(out); src.start(t); src.stop(t + d + 0.01); live.push(src);
    }
    /* one palette: square-wave bleeps on a C-major-ish ladder, filtered noise for the glitch */
    const LIB = {
      tap: (t) => { tone(t, 1480, 0.03, "square", 0.035); },
      pick: (t) => { tone(t, 880, 0.035, "square", 0.05); tone(t + 0.035, 1320, 0.04, "square", 0.045); },
      ok: (t) => { tone(t, 988, 0.06, "square", 0.06); tone(t + 0.06, 1319, 0.09, "square", 0.06); },
      bad: (t) => { tone(t, 220, 0.12, "square", 0.05, 150); noise(t, 0.05, 0.03, 1200); },
      unlock: (t) => { [784, 1047, 1568].forEach((f, i) => tone(t + i * 0.05, f, 0.07, "triangle", 0.08)); noise(t + 0.15, 0.04, 0.025, 5000); },
      stage: (t) => { noise(t, 0.06, 0.06, 1800); tone(t + 0.02, 330, 0.05, "sawtooth", 0.04, 990); tone(t + 0.08, 1760, 0.025, "square", 0.04); tone(t + 0.11, 660, 0.04, "square", 0.045); },
      filed: (t) => { [523, 659, 784, 1047].forEach((f, i) => tone(t + i * 0.07, f, 0.09, "square", 0.06)); tone(t + 0.3, 2093, 0.12, "triangle", 0.05); },
      badge: (t) => { [1319, 1568, 2093, 2637].forEach((f, i) => tone(t + i * 0.045, f, 0.07, "triangle", 0.07)); },
      finish: (t) => {
        noise(t, 0.08, 0.06, 1500); tone(t + 0.02, 196, 0.08, "sawtooth", 0.05, 784);
        [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(t + 0.12 + i * 0.085, f, 0.1, "square", 0.06));
        noise(t + 0.72, 0.05, 0.05, 4000); tone(t + 0.76, 1568, 0.32, "triangle", 0.07);
      },
      toggle: (t) => { tone(t, 1175, 0.04, "square", 0.05); }
    };
    const RANK = { tap: 0, pick: 0, toggle: 0, ok: 1, bad: 1, stage: 2, unlock: 2, badge: 3, filed: 3, finish: 4 };
    let lastRank = 0;
    function play(name) {
      if (!on || !LIB[name] || !ac()) return;
      const now = performance.now();
      /* a quick follow-up never cuts off a more important sound that has only just started */
      if (now - lastAt < 150 && RANK[name] < lastRank) return;
      if (now - lastAt < 45 && RANK[name] === lastRank) return;
      stopAll(); lastAt = now; lastRank = RANK[name];
      LIB[name](ctx.currentTime + 0.005);
      log.push(name); if (log.length > 60) log.shift();
    }
    function set(v) {
      on = !!v;
      try { localStorage.setItem(KEY, on ? "on" : "off"); } catch (err) { /* ignore */ }
      if (!on) { stopAll(); if (ctx && ctx.state === "running") ctx.suspend(); }
    }
    return { play, set, log, get on() { return on; }, get state() { return ctx ? ctx.state : "none"; } };
  })();
  window.__unfoldSfx = SFX; /* read-only hook for tests: the effects played, the context state */
  const fSndBtn = (extra = "") => `<button class="dg-snd mono${SFX.on ? " is-on" : ""}${extra}" data-action="f-sound" data-fk="sound" aria-pressed="${SFX.on}" aria-label="Sound effects ${SFX.on ? "on" : "off"}"><i aria-hidden="true"></i>Sound ${SFX.on ? "on" : "off"}</button>`;

  function fSnap(s) {
    if (!F) return null;
    const rows = F.st.flat();
    return {
      phase: F.phase, si: F.si, sid: F.sid,
      solved: rows.filter((q) => q.solved).length,
      stages: fStages(s).filter((x, j) => fStageDone(j)).length,
      score: rows.reduce((a, q) => a + (q.earned || 0), 0),
      tries: rows.reduce((a, q) => a + (q.tries || 0), 0),
      steps: rows.reduce((a, q) => a + Object.keys(q.place || {}).length + Object.keys(q.done || {}).length, 0),
      locker: F.locker.length, pick: F.pick ? F.pick.id : null,
      ach: unlockedIds().length
    };
  }
  function fSfx(a, b, n) {
    if (!n) return;
    if (a === "f-finish" && n.phase === "done" && (!b || b.phase !== "done")) return SFX.play("finish");
    if (!b || b.phase !== "stage" || n.phase !== "stage") return SFX.play(n.phase === "stage" ? "stage" : "tap");
    if (n.stages > b.stages) return SFX.play("filed");
    if (n.ach > b.ach) return SFX.play("badge");
    if (n.locker > b.locker) return SFX.play("unlock");
    if (n.solved > b.solved || n.score > b.score || n.steps > b.steps) return SFX.play("ok");
    if (n.tries > b.tries) return SFX.play("bad");
    if (n.si !== b.si) return SFX.play("stage");
    if (a === "f-pick") return SFX.play(n.pick ? "pick" : "tap");
    if (["f-toggle", "f-pin", "f-choose", "f-q", "f-b", "f-l", "f-al", "f-locker"].includes(a)) return SFX.play("pick");
    return SFX.play("tap");
  }
  function fAction(a, t, s) {
    if (!F || F.sid !== s.id) return;
    if (a === "f-sound") {
      SFX.set(!SFX.on);
      if (SFX.on) SFX.play("toggle");
      announce(`Sound effects ${SFX.on ? "on" : "off"}.`);
      return fRender('[data-fk="sound"]');
    }
    const before = fSnap(s);
    fActionCore(a, t, s);
    fSfx(a, before, fSnap(s));
  }

  function fPlace(s, ref, id, zone) {
    const { t, q } = ref, it = t.items.find((x) => x.id === id);
    if (!it || q.place[id]) return;
    const ok = it.zone.includes(zone);
    F.flash = { id, ok };
    if (ok) {
      q.place[id] = zone; q.got[id] = q.miss[id] ? it.pts / 2 : it.pts;
      q.fb = { ok: true, text: it.ok }; F.fresh.push("p-" + id); F.pick = null;
      if (t.id === "stack" && zone === "ask") fLock({ id: "lead-" + id, kind: "lead", title: it.text, text: it.lead });
      if (t.id === "tags") {
        fLock({ id: "ev-" + id, kind: "evidence", tag: zone, tagLabel: fZoneName(t, zone), title: it.src, text: it.text });
        if (zone === "weak" && !q.miss[id]) fFlag(s, "signal");
      }
      if (t.id === "claims") {
        if (zone === "verified") fLock({ id: "ai-" + id, kind: "evidence", tag: "verified", tagLabel: "AI · verified", title: "DeepBrief claim", text: it.text });
        else fLock({ id: "ai-" + id, kind: "flag", tag: zone, tagLabel: zone === "hypothesis" ? "Test it" : "Rejected", title: "DeepBrief claim", text: it.text });
        if (F.insp === id) F.insp = null;
      }
      if (t.id === "matrix" && id === "p1") fLock({ id: "dec-creator", kind: "decision", title: "The creator call", text: fZoneName(t, zone) });
      announce(`Placed in ${fZoneName(t, zone)}. ${it.ok}`);
    } else {
      q.miss[id] = (q.miss[id] || 0) + 1; q.tries++;
      q.fb = { ok: false, text: it.bad }; F.pick = null;
      announce(`Bounced back. ${it.bad}`);
    }
    if (t.items.every((x) => q.place[x.id])) {
      q.solved = true; q.firstOK = !Object.keys(q.miss).length;
      q.earned = Math.round(Object.values(q.got).reduce((x, y) => x + y, 0));
      if (t.id === "claims" && t.items.filter((x) => x.zone.includes("unsupported")).every((x) => !q.miss[x.id])) fFlag(s, "sceptic");
      fSolved(s, ref);
    }
  }
  function fSolved(s, ref) {
    const i = ref.i;
    if (fStageDone(i)) {
      F.celebrate = i; F.pick = null; F.insp = null;
      if (i === 0) fLock({ id: "dec-obj", kind: "decision", title: "Investigation objective", text: s.field.objective });
      announce(`Stage ${fStages(s)[i].code} filed. ${fStageXP(i)} XP.`);
    }
  }
  function fNextFocus(s, ref) {
    const x = fStages(s)[ref.i];
    if (fStageDone(ref.i)) return ref.i === fStages(s).length - 1 ? '[data-fk="finish"]' : '[data-fk="next"]';
    const nt = x.tasks[ref.k + 1];
    return nt ? `#dg-t-${nt.id} h3` : null;
  }

  /* one-time: runs saved by the first THE DIG (scored out of 700) are rescaled to the 1,000-point case,
     so the saved rank, the best score and the percentage agree. Nothing else in the save is touched. */
  (function fMigrate() {
    try {
      const p = load(); let changed = false;
      SESSIONS.filter((s) => s.field).forEach((s) => {
        const f = p.sessions[s.id] && p.sessions[s.id].field;
        if (!f || f.scale === s.field.max) return;
        const k = s.field.max / 700;
        f.best = Math.round((f.best || 0) * k);
        (f.runs || []).forEach((r) => { r.score = Math.round((r.score || 0) * k); });
        f.scale = s.field.max; changed = true;
      });
      if (changed) save();
    } catch (err) { /* ignore */ }
  })();

  /* drag and drop: the twin of tap-to-pick, tap-to-place */
  let fDragId = null;
  app.addEventListener("dragstart", (e) => {
    const c = e.target.closest && e.target.closest('.game--field [draggable="true"][data-id]');
    if (!c || !F) return;
    fDragId = { t: c.dataset.t, id: c.dataset.id };
    SFX.play("pick");
    try { e.dataTransfer.setData("text/plain", `${c.dataset.t}|${c.dataset.id}`); e.dataTransfer.effectAllowed = "move"; } catch (err) { /* ignore */ }
    /* style changes wait a tick: changing the page inside dragstart can cancel the drag in Chrome */
    setTimeout(() => { c.classList.add("is-drag"); app.querySelectorAll(`.game--field [data-dz^="${c.dataset.t}|"]`).forEach((z) => z.classList.add("is-ready")); }, 0);
  });
  app.addEventListener("dragend", () => {
    fDragId = null;
    app.querySelectorAll(".game--field .is-drag, .game--field .is-over").forEach((n) => n.classList.remove("is-drag", "is-over"));
  });
  app.addEventListener("dragenter", (e) => {
    const z = e.target.closest && e.target.closest(".game--field [data-dz]");
    if (z && F) e.preventDefault();
  });
  app.addEventListener("dragover", (e) => {
    const z = e.target.closest && e.target.closest(".game--field [data-dz]");
    if (!z || !F) return;
    e.preventDefault();
    try { e.dataTransfer.dropEffect = "move"; } catch (err) { /* ignore */ }
    app.querySelectorAll(".game--field .is-over").forEach((n) => { if (n !== z) n.classList.remove("is-over"); });
    z.classList.add("is-over");
  });
  app.addEventListener("drop", (e) => {
    const z = e.target.closest && e.target.closest(".game--field [data-dz]");
    if (!z || !F) return;
    e.preventDefault();
    let data = null;
    try { data = e.dataTransfer.getData("text/plain"); } catch (err) { /* ignore */ }
    const [tid, id] = data ? data.split("|") : fDragId ? [fDragId.t, fDragId.id] : [];
    const [zt, zone] = z.dataset.dz.split("|");
    fDragId = null;
    if (!tid || tid !== zt) return;
    const s = byId(F.sid);
    if (zone === "tray") { F.pick = null; return fRender(); }
    const ref = fFind(s, tid);
    if (!ref || ref.q.solved || ref.i !== F.si) return;
    const before = fSnap(s);
    fPlace(s, ref, id, zone);
    fSfx("f-drop", before, fSnap(s));
    fRender(ref.q.solved ? fNextFocus(s, ref) : null);
  });

  /* sliders and inputs update in place, without a re-render */
  app.addEventListener("input", (e) => {
    const el = e.target;
    if (!F || !el.dataset || !el.dataset.fi || !el.closest(".game--field")) return;
    const s = byId(F.sid);
    if (el.dataset.fi === "slider") {
      const ref = fFind(s, el.dataset.t); if (!ref || ref.q.solved) return;
      const v = +el.value, t = ref.t; ref.q.val = v;
      const box = el.closest("[data-slider]");
      box.querySelector('[data-out="syn"]').textContent = fmt(v);
      box.querySelector('[data-out="real"]').textContent = fmt(t.sample - v);
      box.querySelector('[data-out="pct"]').textContent = `${Math.round(v / t.sample * 100)}%`;
      box.querySelectorAll(".dg-panel i").forEach((c, j) => c.classList.toggle("is-syn", j < v / (t.sample / 100)));
      fSaveRun();
    }
    if (el.dataset.fi === "alloc") {
      const ref = fFind(s, "alloc"); if (!ref || ref.q.solved) return;
      ref.q.split[el.dataset.q] = +el.value;
      const box = el.closest("[data-alloc]"), r = fInvest(s, ref.q.split);
      s.field.invest.quads.forEach((x) => {
        box.querySelector(`[data-out="pct-${x.id}"]`).textContent = `${ref.q.split[x.id]}%`;
        box.querySelector(`[data-out="amt-${x.id}"]`).textContent = money(s, s.field.budget * ref.q.split[x.id] / 100);
      });
      box.querySelector(".dg-alloc__out").innerHTML = fAllocOut(s, r);
      const lock = box.querySelector('[data-action="f-al-lock"]'); if (lock) lock.disabled = r.total !== 100;
      fSaveRun();
    }
    if (el.dataset.fi === "roi") { const ref = fFind(s, el.dataset.t); if (ref) ref.q.val = el.value; }
  });
  app.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || !e.target.dataset || e.target.dataset.fi !== "roi") return;
    e.preventDefault();
    const b = app.querySelector('[data-action="f-roi"]'); if (b) b.click();
  });

  /* ---- Session 03 landing and Learn widgets (only for sessions with `landing` / dig-* blocks) ---- */
  function digLanding(s) {
    const L = s.landing;
    return `<section class="band band--tight dig-land" data-session="${esc(s.id)}">
      <div class="wrap">
        <div class="dig-land__head">
          <p class="mono dig-land__k">${esc(L.kicker)}</p>
          <p class="dig-land__tag">${esc(L.tagline)}</p>
        </div>
        <div class="dig-land__cards">${L.cards.map((c, i) => `<div class="dig-land__card"><span class="mono">${pad(i + 1)} · ${esc(c.k)}</span><h2>${esc(c.h)}</h2><p>${esc(c.p)}</p></div>`).join("")}</div>
        <div class="dig-land__modes">
          <button class="dig-mode dig-mode--learn" data-action="revisit" data-ch="0"><span class="mono">Mode 01</span><b>${esc(L.learn.h)}</b><span>${esc(L.learn.p)}</span><em class="mono">Start reading ↓</em></button>
          <a class="dig-mode dig-mode--play" href="#${s.id}-play"><span class="mono">Mode 02</span><b>${esc(L.play.h)}</b><span>${esc(L.play.p)}</span><em class="mono">Open the case →</em></a>
        </div>
        <details class="dig-land__notes"><summary class="mono">${s.takeaways.length} field notes to take away</summary><ol>${s.takeaways.map((t) => `<li>${esc(t)}</li>`).join("")}</ol></details>
      </div>
    </section>`;
  }

  const DIG_LIFE = [
    { id: "brief", t: "Media brief received", d: "The brief lands and gets clarified with the marketing team. Nobody should research a brief they don't understand." },
    { id: "research", t: "Research", d: "Content and media each do their own research. For media, that's the audience work in this session." },
    { id: "align", t: "Align", d: "Content and media agree the upfront strategy together, before they split." },
    { id: "content", t: "Content track", d: "Content strategy (the idea, messaging framework, visuals), then content production." },
    { id: "media", t: "Media track", d: "Media strategy (approach, channels, budgets, audiences), then the media plan (specific targeting, numbers). This session lives here." },
    { id: "live", t: "Campaign goes live", d: "The media team sets the campaign up and it runs." }
  ];
  const DIG_STRAT = [
    { t: "Reach Gen Z beauty newcomers on social, while they're discovering brands.", a: "s", why: "How, where and when to reach the audience: strategy." },
    { t: "S$18,000 on TikTok In-Feed, women 18–24, weeks one to three.", a: "p", why: "Specific platform, targeting, budget and timing: plan." },
    { t: "Lead with video, because that's where this audience researches products.", a: "s", why: "A high-level approach tied to the audience: strategy." },
    { t: "Meta from 3 March, 40% of the budget, two creatives in rotation.", a: "p", why: "Dates, splits and creative rotation: tactical execution, so plan." }
  ];
  const DIG_TOOLS = [
    ["GWI", "insight", "Subscription research: consumer behaviour, data and trends."], ["Nielsen", "insight", "Media measurement and audience insights."],
    ["Semrush", "insight", "Keywords, competitors and SEO. Now part of Adobe."], ["Meltwater", "insight", "News, social and PR monitoring, with sentiment."],
    ["GA4", "insight", "Site-side analytics: who visits your own site or app."], ["Google Trends", "insight", "Free: what people search for around a category or brand."],
    ["Reddit", "insight", "Free: unfiltered opinions and pain points."], ["TikTok, the app", "insight", "Free: viral trends, hashtags, comments."],
    ["Meta, as a DSP", "size", "Where you'd buy, so it can give you an addressable audience size."], ["DV360", "size", "A DSP: addressable audience sizes for its inventory."],
    ["TikTok Ads Manager", "size", "Audience Insights estimates size by demographics, interests and behaviours."], ["LinkedIn Campaign Manager", "size", "Forecasts audience size by job title, industry and company size."]
  ];
  const DIG_MINE = [
    ["Identify the target audience", "Provided by the client team, or worked out through a reverse brief.", "Start"],
    ["Define it in market insight tools", "Apply the attributes the research tools offer to build a proxy for the target audience.", "Insight tools"],
    ["Find key behaviours and insights", "Answer the key questions. The answers point to preferred channels, extra targeting and ad types.", "Insight tools"],
    ["Define it in media buying platforms", "Rebuild the proxy with the attributes the buying platforms offer.", "Ad platforms"],
    ["Size it and cost it", "Identify the key audience sizes and the budget they're likely to need.", "Ad platforms"]
  ];
  const DIG_QUAD = [
    { id: "free", n: "Free riders", d: "Take advantage of all the offers, discounts and promotions. Very happy, not very profitable." },
    { id: "star", n: "Star customers", d: "Receive high value from the firm and deliver high value to it." },
    { id: "lost", n: "Lost causes", d: "Get little value from the product and give little profit back." },
    { id: "vulnerable", n: "Vulnerable customers", d: "Highly valuable to the company, but receive little value in return." }
  ];

  function digLearn(kind, s) {
    if (kind === "dig-lifecycle") return `<div class="dig-w dig-life" data-w="life">
      <ol class="dig-life__flow">${DIG_LIFE.map((x, i) => `<li class="dig-life__n${x.id === "media" ? " is-on is-key" : ""}${x.id === "content" ? " is-side" : ""}"><button data-dl="life" data-v="${i}" aria-pressed="${x.id === "media"}"><span class="mono">${pad(i + 1)}</span>${esc(x.t)}</button></li>`).join("")}</ol>
      <p class="dig-life__d" aria-live="polite"><b>${esc(DIG_LIFE[4].t)}.</b> ${esc(DIG_LIFE[4].d)}</p>
      <p class="mono dig-src">Source: Monks, via the session</p>
    </div>`;
    if (kind === "dig-strategy") return `<div class="dig-w dig-strat">${DIG_STRAT.map((x, i) => `<div class="dig-strat__row" data-row="${i}"><p>${esc(x.t)}</p><div class="dig-strat__b"><button data-dl="strat" data-i="${i}" data-v="s">Strategy</button><button data-dl="strat" data-i="${i}" data-v="p">Plan</button></div><p class="dig-strat__why" aria-live="polite"></p></div>`).join("")}
      <div class="dig-strat__defs"><p><b>Media strategy:</b> the high-level approach that defines how, where and when to reach the right audience to achieve the brand's objectives.</p><p><b>Media plan:</b> the tactical execution of that strategy: specific channels and platforms, budget allocation and timing.</p></div></div>`;
    if (kind === "dig-tools") return `<div class="dig-w dig-tools">
      <div class="dig-tools__chips">${DIG_TOOLS.map((x, i) => `<button class="dig-tool" data-dl="tool" data-i="${i}">${esc(x[0])}</button>`).join("")}</div>
      <div class="dig-tools__cols"><div class="dig-col dig-col--insight"><p class="mono">Insight · qualitative</p><b>Who they are, what moves them</b><ul></ul></div><div class="dig-col dig-col--size"><p class="mono">Size · quantitative</p><b>How many you can reach</b><ul></ul></div></div>
      <p class="dig-tools__why" aria-live="polite">Notice TikTok and Meta appear twice. As places to read trends, they're insight. As places to buy media, they're size.</p>
    </div>`;
    if (kind === "dig-mining") return `<div class="dig-w dig-mine">${DIG_MINE.map((x, i) => `<details class="dig-mine__s"${i === 0 ? " open" : ""}><summary><span class="mono">${pad(i + 1)}</span><b>${esc(x[0])}</b><em class="mono">${esc(x[2])}</em></summary><p>${esc(x[1])}</p></details>`).join("")}<p class="mono dig-src">Source: Monks, via the session</p></div>`;
    if (kind === "dig-proof") return `<div class="dig-w dig-proof">
      <figure class="dig-ex"><figcaption class="mono">Pew Research</figcaption><b>AI twins flattened opinion</b><div class="dig-bars"><div><span class="mono">AI twins</span><i style="--w:98%"></i><b class="mono">98%</b></div><div><span class="mono">Real people</span><i style="--w:42%"></i><b class="mono">42%</b></div></div><p>On one question, the twins were near-unanimous. People weren't.</p></figure>
      <figure class="dig-ex"><figcaption class="mono">Strat7</figcaption><b>Willingness-to-pay ran hot</b><p class="dig-ex__big">+16%</p><p>Synthetic willingness-to-pay came out 16% too high.</p></figure>
      <figure class="dig-ex"><figcaption class="mono">Strat7</figcaption><b>Trend calls</b><div class="dig-meter"><i style="--w:47%"></i></div><p class="dig-ex__big">47%</p><p>Right only 47% of the time. Worse than a coin toss.</p></figure>
      <figure class="dig-ex is-speed"><figcaption class="mono">Aveeno</figcaption><b>The upside is real</b><p class="dig-ex__big">30 → 3</p><p>Days to a strategy brief, using synthetic research. Fast is why people use it.</p></figure>
      <p class="mono dig-src">Sources on the slide: Pew Research (30 Sep 2026); Research Live (15 Jul 2026); Digiday (12 Oct 2026); EY (30 Sep 2026); Dealroom (30 Jul 2026).</p>
    </div>`;
    if (kind === "dig-cap") return `<div class="dig-w dig-cap is-over" data-w="cap">
      <div class="dig-cap__dots">${Array.from({ length: 100 }, (_, j) => `<i class="${j < 30 ? "is-syn" : ""}"></i>`).join("")}</div>
      <div class="dig-cap__ctl"><label class="mono" for="dig-cap">Synthetic share of a 100-person sample</label><input id="dig-cap" type="range" min="0" max="60" step="5" value="30" data-dl="cap"><p class="dig-cap__out" aria-live="polite"><b class="mono">30%</b> <span>Over the 10–20% cap. Synthetic answers are starting to steer the result.</span></p></div>
    </div>`;
    if (kind === "dig-sizer") {
      const st = { loc: true, hr: true, mgr: false, size: false, retail: false };
      return `<div class="dig-w dig-sizer" data-w="sizer">
        <div class="dig-sizer__t">${[["loc", "Location: Singapore", true], ["hr", "Job function: HR", true], ["mgr", "Manager and above"], ["size", "Company size 1,000+"], ["retail", "Industry: retail only"]].map(([k, l, on]) => `<button class="dig-tg" data-dl="sz" data-k="${k}" aria-pressed="${!!on}">${esc(l)}</button>`).join("")}</div>
        <div class="dig-sizer__out" aria-live="polite">${digSize(s, st)}</div>
        <p class="mono dig-src">Illustrative numbers. LinkedIn's 300 and 50,000+ are from the session.</p>
      </div>`;
    }
    if (kind === "dig-matrix") return `<div class="dig-w dig-mx">
      <div class="dig-mx__wrap"><span class="mono dig-mx__y">Satisfaction ↑</span><div class="dig-mx__grid">${DIG_QUAD.map((x, i) => `<button class="dig-q dig-q--${x.id}" data-dl="quad" data-i="${i}" aria-pressed="${x.id === "star"}">${esc(x.n)}</button>`).join("")}</div><span class="mono dig-mx__x">Profitability →</span></div>
      <p class="dig-mx__d" aria-live="polite"><b>Star customers.</b> ${esc(DIG_QUAD[1].d)}</p>
    </div>`;
    if (kind === "dig-roi") return `<div class="dig-w dig-roi" data-w="roi">
      <label><span class="mono">Profit (S$)</span><input type="number" min="0" step="1000" value="150000" data-dl="roi" data-k="p"></label>
      <label><span class="mono">Ad spend (S$)</span><input type="number" min="1" step="1000" value="60000" data-dl="roi" data-k="s"></label>
      <p class="dig-roi__out" aria-live="polite">${digRoi(150000, 60000)}</p>
    </div>`;
    return "";
  }
  function digSize(s, st) {
    const m = s.field.linkedin;
    if (!st.loc) return `<p class="dig-sizer__n">—</p><p class="dig-sizer__w is-bad">Set location first. LinkedIn requires it.</p>`;
    let v = m.locations[0].base;
    if (st.hr) v *= m.functions[0].share;
    if (st.mgr) v *= m.seniority[1].share;
    if (st.size) v *= m.narrow[0].share;
    if (st.retail) v *= m.narrow[1].share;
    const lmax = Math.log10(m.locations[0].base), pos = (x) => Math.max(0, Math.min(100, Math.log10(Math.max(x, 1)) / lmax * 100));
    const w = v < m.min ? ["is-bad", "Under 300: LinkedIn won't serve it."] : v < m.rec ? ["is-warn", "It'll serve, but it's under the 50,000+ LinkedIn recommends."] : ["is-ok", "Comfortably above what LinkedIn recommends."];
    return `<p class="dig-sizer__n">${fmt(nice(v))}<span class="mono"> members</span></p>
      <div class="dg-li-bar"><i class="dg-li-bar__fill" style="width:${pos(v)}%"></i><span class="dg-li-mk" style="left:${pos(m.min)}%"><b class="mono">300</b><em>minimum</em></span><span class="dg-li-mk is-rec" style="left:${pos(m.rec)}%"><b class="mono">50,000+</b><em>recommended</em></span></div>
      <p class="dig-sizer__w ${w[0]}">${w[1]}</p>`;
  }
  function digRoi(p, sp) {
    if (!(sp > 0)) return "Ad spend has to be more than zero.";
    const r = (p - sp) / sp;
    return `<span class="mono">(${fmt(p)} − ${fmt(sp)}) / ${fmt(sp)} =</span> <b>${(r * 100).toFixed(0)}%</b> <span>${r > 0 ? `Every S$1 brings back S$${(1 + r).toFixed(2)}.` : r === 0 ? "You broke even." : "You lost money on the spend."}</span>`;
  }
  app.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("[data-dl]");
    if (!b || !b.closest(".dig-w")) return;
    const w = b.closest(".dig-w"), k = b.dataset.dl;
    if (k === "life") {
      const x = DIG_LIFE[+b.dataset.v];
      w.querySelectorAll("[data-dl=life]").forEach((n) => { const on = n === b; n.setAttribute("aria-pressed", on); n.parentElement.classList.toggle("is-on", on); });
      w.querySelector(".dig-life__d").innerHTML = `<b>${esc(x.t)}.</b> ${esc(x.d)}`;
    }
    if (k === "strat") {
      const x = DIG_STRAT[+b.dataset.i], row = b.closest(".dig-strat__row"), ok = b.dataset.v === x.a;
      row.querySelectorAll("button").forEach((n) => { n.classList.remove("is-ok", "is-bad"); n.setAttribute("aria-pressed", n === b); });
      b.classList.add(ok ? "is-ok" : "is-bad");
      row.querySelector(".dig-strat__why").textContent = `${ok ? "Yes." : "Not quite."} ${x.why}`;
    }
    if (k === "tool") {
      const x = DIG_TOOLS[+b.dataset.i];
      if (b.classList.contains("is-used")) return;
      b.classList.add("is-used", "is-" + x[1]); b.setAttribute("aria-disabled", "true");
      const li = document.createElement("li"); li.textContent = x[0]; li.className = "is-new";
      w.querySelector(`.dig-col--${x[1]} ul`).appendChild(li);
      w.querySelector(".dig-tools__why").innerHTML = `<b>${esc(x[0])}</b> → ${x[1] === "insight" ? "insight" : "size"}. ${esc(x[2])}`;
    }
    if (k === "sz") {
      b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true");
      const st = {}; w.querySelectorAll("[data-dl=sz]").forEach((n) => { st[n.dataset.k] = n.getAttribute("aria-pressed") === "true"; });
      const s = SESSIONS.find((x) => x.field && x.field.linkedin);
      w.querySelector(".dig-sizer__out").innerHTML = digSize(s, st);
    }
    if (k === "quad") {
      const x = DIG_QUAD[+b.dataset.i];
      w.querySelectorAll("[data-dl=quad]").forEach((n) => n.setAttribute("aria-pressed", n === b));
      w.querySelector(".dig-mx__d").innerHTML = `<b>${esc(x.n)}.</b> ${esc(x.d)}`;
    }
  });
  app.addEventListener("input", (e) => {
    const el = e.target;
    if (!el.dataset || !el.dataset.dl || !el.closest(".dig-w")) return;
    const w = el.closest(".dig-w");
    if (el.dataset.dl === "cap") {
      const v = +el.value;
      w.querySelectorAll(".dig-cap__dots i").forEach((c, j) => c.classList.toggle("is-syn", j < v));
      const msg = v === 0 ? "No synthetic respondents. Slower, and fully real." : v <= 20 ? (v >= 10 ? "Inside the 10–20% cap. Faster, still mostly real people." : "Under the cap. Fine, just slower than it could be.") : "Over the 10–20% cap. Synthetic answers are starting to steer the result.";
      w.querySelector(".dig-cap__out").innerHTML = `<b class="mono">${v}%</b> <span>${msg}</span>`;
      w.classList.toggle("is-over", v > 20);
    }
    if (el.dataset.dl === "roi") {
      const p = +w.querySelector('[data-k="p"]').value, sp = +w.querySelector('[data-k="s"]').value;
      w.querySelector(".dig-roi__out").innerHTML = digRoi(p, sp);
    }
  });


  /* ---------- progress page ---------- */
  let confirmReset = false;
  function viewProgress() {
    const x = xpInfo();
    const done = LIVE.filter((s) => peek(s.id).plays > 0);
    const ach = allAchievements(), unl = ach.filter((a) => a.check());
    const possible = LIVE.reduce((a, s) => a + maxScore(s) + (s.mission ? s.mission.decisions.length * s.mission.xpPerDecision : 0) + (s.agency ? s.agency.stations.length * s.agency.xpPerDecision : 0) + (s.field ? s.field.max : 0), 0);
    const agencyRuns = LIVE.filter((s) => s.agency && ((peek(s.id).agency || {}).runs || []).length);
    const fieldRuns = LIVE.filter((s) => s.field && ((peek(s.id).field || {}).runs || []).length);
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
          <p class="xpbox__how">XP = best main-game score (mission or simulation) + best drill score in each session (${fmt(x.fromGames)}) + ${XP_PER_ACH} per achievement (${x.ach} × ${XP_PER_ACH}). Replays add XP when you beat your best or unlock an achievement.</p>
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
        ${agencyRuns.map((s) => `
          <h2 class="sec-title sec-title--sm">Handoff log · ${esc(s.agency.name)}</h2>
          <ol class="runs">${peek(s.id).agency.runs.map((r) => `
            <li><span class="mono">${new Date(r.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
              <b>${esc(aRating(s, r.first).name)}</b>${pixelBar(r.first / s.agency.stations.length, 6)}<span class="mono">${r.first}/${s.agency.stations.length} handoffs first try</span></li>`).join("")}
          </ol>`).join("")}
        ${fieldRuns.map((s) => `
          <h2 class="sec-title sec-title--sm">Case log · ${esc(s.field.name)}</h2>
          <ol class="runs">${peek(s.id).field.runs.map((r) => `
            <li><span class="mono">${new Date(r.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
              <b>${esc(fRank(s, r.pct).name)}</b>${pixelBar(r.pct / 100, 6)}<span class="mono">${fmt(r.score)} / ${s.field.max} XP</span></li>`).join("")}
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
        <p class="eyebrow mono">Manual</p>
        <h1 class="page-title" tabindex="-1">The UNFOLD manual</h1>
        <p class="lead"><em>The useful details, without the unnecessary instructions.</em> Practical notes for using UNFOLD: where your progress lives, how scores are worked out, what a session gives you, and how to add one.</p>
      </div>
    </section>
    <section class="band band--tight">
      <div class="wrap about">
        <div class="about__col">
          <h2 class="sec-title sec-title--sm">01 · Your progress &amp; data</h2>
          <ul class="defs">
            <li><strong>Where it's stored</strong><span>Scores, XP and achievements are saved in your browser. There are no accounts and nothing is sent anywhere.</span></li>
            <li><strong>Limits</strong><span>Progress doesn't carry across devices or browsers. Cross-device progress would need a backend such as Supabase, as covered in Session 01.</span></li>
            <li><strong>Starting over</strong><span>My progress has a reset button that erases your saved progress in this browser.</span></li>
          </ul>
          <h2 class="sec-title sec-title--sm">02 · How scoring works</h2>
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
          <h2 class="sec-title sec-title--sm">03 · How sessions work</h2>
          <p>Each live session has a Learn tab, with what was taught laid out the way the speaker presented it, and a Play tab, with a game made for that session plus a quick concept drill. Sessions are built only from the speaker's own materials, and the games only test what was presented. Sessions without materials stay as labelled placeholders.</p>
          <h2 class="sec-title sec-title--sm">04 · Adding a session</h2>
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
    if (h === "who") return { view: "home", key: "who", who: true };
    return { view: "404", key: h };
  }

  let lastKey = null, pendingChapter = null, lastMajor = null;
  /* WHO AM I?? in the nav: scroll to the existing section on the homepage, clear of the sticky header */
  function goWho(smooth) {
    const sec = document.getElementById("who"), hdr = document.querySelector("body > .site-header");
    if (!sec) return;
    const top = sec.getBoundingClientRect().top + window.scrollY - (hdr ? hdr.offsetHeight : 64);
    window.scrollTo({ top, behavior: smooth && !reduceMotion() ? "smooth" : "auto" });
    const h = document.getElementById("who-h"); if (h) h.focus({ preventScroll: true });
  }
  function render() {
    const r = current();
    if (r.who && lastMajor === "home" && document.getElementById("who")) {
      lastKey = r.key;
      document.querySelectorAll(".nav a").forEach((a) => { if (a.dataset.nav === "who") a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
      goWho(true);
      return;
    }
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

    const navKey = r.view === "session" ? "sessions" : r.who ? "who" : r.view;
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
    if (r.who) requestAnimationFrame(() => goWho(false));
  }

  /* ---------- page transitions ----------
     home → portal (iris from where you clicked) · sessions → rotating square mask
     progress → spiral sweep · about → fold down · session pages → signal glitch */
  const TX = {
    home: ["portal", "00", "Home"], sessions: ["iris", "01", "Sessions"], progress: ["spiral", "02", "My progress"],
    about: ["fold", "03", "Manual"], "404": ["glitch", "--", "Not found"]
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
    recordEarned();
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
      if (c) c.textContent = `${glossOpened(s, st.terms)} / ${glossTerms(s).length} unfolded`;
      return;
    }
    if (a === "reset") { confirmReset = true; render(); return; }
    if (a === "reset-no") { confirmReset = false; render(); return; }
    if (a === "reset-yes") { mem = { sessions: {} }; save(); confirmReset = false; G = null; M = null; A = null; F = null; render(); announce("Progress erased."); return; }
    if (a === "revisit") { pendingChapter = +t.dataset.ch; if (location.hash === "#" + r.s.id) render(); else location.hash = r.s.id; return; }

    if (a.startsWith("m-")) { if (M && r.view === "session") mAction(a, t, r.s); return; }
    if (a.startsWith("a-")) { if (A && r.view === "session" && r.s.agency) aAction(a, t, r.s); return; }
    if (a.startsWith("f-")) { if (F && r.view === "session" && r.s.field) fAction(a, t, r.s); return; }

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
  document.querySelectorAll(".nav a").forEach((a) => a.addEventListener("click", (e) => {
    document.body.classList.remove("nav-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    if (a.dataset.nav === "who" && location.hash === "#who") { e.preventDefault(); goWho(true); }
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
  window.__unfold = { get G() { return G; }, get M() { return M; }, get A() { return A; }, get F() { return F; }, xpInfo, maxScore, Sig };
  render();
})();
