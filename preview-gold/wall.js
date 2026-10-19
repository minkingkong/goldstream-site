/* Previews 1 & 2 on the real poster-wall slide. No gather, no flash:
   1 · 글자 자체가 입자 — scattered gold dust drifts, each grain already owns a spot in the wordmark,
       slowly flows home, the mark fades in underneath, the grains melt into it.
   2 · 금빛 강물 — a gold stream flows left→right through the title line; where it has passed,
       the wordmark is left behind; the stream exits and only the mark remains. */
(function () {
  "use strict";
  var HOLD = 3.2;
  var POSTERS = ["assets/img/1789518254143--.png", "assets/img/forbidden-poster.jpg", "assets/img/1789518301734--.png", "assets/img/1789518312319--.png",
    "assets/img/1789518284030--2.png", "assets/img/1789518267017--1.png", "assets/img/suanara-poster.webp", "assets/img/demon-killer-poster.jpg"];
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var inOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var outCubic = function (t) { return 1 - Math.pow(1 - t, 3); };
  var inCubic = function (t) { return t * t * t; };
  var smooth = function (t) { t = clamp(t); return t * t * (3 - 2 * t); };

  var LOGO =
    '<svg viewBox="0 0 1000 290" aria-label="GOLDSTREAM ENTERTAINMENT">' +
    '<defs><linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#F7E7B0"/><stop offset=".22" stop-color="#E2C56E"/><stop offset=".48" stop-color="#B78F2E"/>' +
    '<stop offset=".62" stop-color="#F0D98A"/><stop offset=".85" stop-color="#A77E22"/><stop offset="1" stop-color="#E5C86F"/></linearGradient>' +
    '<linearGradient id="gS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EAD48E"/><stop offset=".5" stop-color="#C9A646"/><stop offset="1" stop-color="#A8862A"/></linearGradient>' +
    '<filter id="sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity=".6"/></filter></defs>' +
    '<text class="wm" x="500" y="158" text-anchor="middle" fill="url(#gA)" filter="url(#sh)">GOLDSTREAM</text>' +
    '<text class="sub" x="511" y="246" text-anchor="middle" fill="url(#gS)">ENTERTAINMENT</text></svg>';

  function build(label, imgLogo) {
    var wall = "";
    for (var i = 0; i < 32; i++) wall += '<img src="../' + POSTERS[(i * 3 + Math.floor(i / 8)) % POSTERS.length] + '" alt="">';
    var nums = ""; for (var n = 2; n <= 9; n++) nums += '<span class="num">0' + n + "</span>";
    document.body.innerHTML =
      '<header class="hd"><a class="hd__logo" href="#"><img src="../assets/img/logo-goldstream-dark.png" alt="GOLDSTREAM ENTERTAINMENT"></a>' +
      '<nav class="hd__nav"><a>WORK</a><a>LOCATION</a><a>CAMPAIGN</a><a>SPONSORSHIP</a><a>IMPACT</a><a>ABOUT</a><a>BRAND</a></nav><span class="hd__cta">CONTACT</span></header>' +
      '<section class="hs">' +
      '<div class="slide slide1"><div class="pw-wall">' + wall + '</div><div class="shade"></div>' +
      (imgLogo ? '<img class="logo logo--img" src="../assets/img/logo-goldstream.png" alt="GOLDSTREAM ENTERTAINMENT">' : '<div class="logo">' + LOGO + '</div>') + '<canvas class="fx"></canvas><div class="grain"></div></div>' +
      '<div class="slide slide2"><img src="../assets/img/hero/code.jpg" alt=""><div class="s2shade"></div>' +
      '<div class="credit"><p class="meta">2025 · 영화 · 제작</p><h2>코드</h2><p class="en">CODE</p><a class="more" href="#">작품 정보 보기 →</a></div></div>' +
      '<div class="pager"><span class="arrow"><svg viewBox="0 0 40 12"><path d="M40 6H2M7 1L2 6l5 5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></span>' +
      '<div class="nums"><span class="num is-active">01</span><span class="gauge"><i></i></span>' + nums + "</div>" +
      '<span class="arrow"><svg viewBox="0 0 40 12"><path d="M0 6h38M33 1l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></span></div>' +
      "</section>" +
      '<div class="tools"><button data-replay>↻ 다시 보기</button></div><div class="label">' + label + "</div>";
  }

  function Canvas(cv) {
    var x = cv.getContext("2d"), o = { x: x, W: 0, H: 0, d: 1 };
    o.size = function () { o.d = Math.min(2, window.devicePixelRatio || 1); o.W = cv.clientWidth; o.H = cv.clientHeight; cv.width = o.W * o.d; cv.height = o.H * o.d; x.setTransform(o.d, 0, 0, o.d, 0, 0); };
    o.clear = function () { x.clearRect(0, 0, o.W, o.H); };
    o.size(); return o;
  }
  function sprite(rgb) {
    var s = document.createElement("canvas"); s.width = s.height = 64;
    var g = s.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, "rgba(255,250,230,1)"); r.addColorStop(0.3, "rgba(" + rgb + ",.6)"); r.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = r; g.fillRect(0, 0, 64, 64); return s;
  }
  /* sample the on-screen wordmark into canvas-space points (so grains land exactly on the letters) */
  function samplePoints(logoEl, cv, n) {
    var r = logoEl.getBoundingClientRect(), c = cv.getBoundingClientRect();
    var sx = r.left - c.left, sy = r.top - c.top, w = r.width, h = r.height;
    var off = document.createElement("canvas"), S = 2; off.width = Math.ceil(w / S); off.height = Math.ceil(h / S);
    var x = off.getContext("2d"), k = (w / 1000) / S;
    x.fillStyle = "#fff"; x.textAlign = "center";
    x.font = "800 " + 150 * k + "px 'Pretendard Variable'"; x.letterSpacing = (-2.5 * k) + "px"; x.fillText("GOLDSTREAM", 500 * k, 158 * k);
    x.font = "500 " + 34 * k + "px 'Pretendard Variable'"; x.letterSpacing = (22 * k) + "px"; x.fillText("ENTERTAINMENT", 511 * k, 246 * k);
    var img = x.getImageData(0, 0, off.width, off.height).data, pts = [], guard = 0;
    while (pts.length < n && guard++ < n * 60) {
      var px = (Math.random() * off.width) | 0, py = (Math.random() * off.height) | 0;
      if (img[(py * off.width + px) * 4 + 3] > 120) pts.push({ x: sx + px * S + Math.random() * S, y: sy + py * S + Math.random() * S, sub: py * S > h * 0.68 });
    }
    return pts;
  }

  /* ---------- 1 · grains become letters ---------- */
  function grains(c, logoEl) {
    var T = { drift: 1.2, flow: 3.6, melt: 1.2 }, E = { drift: 1.2 }; E.flow = E.drift + T.flow; E.melt = E.flow + T.melt;
    var pts = [], spG = sprite("211,179,108"), spW = sprite("247,231,176");
    function make() {
      var W = c.W, H = c.H, n = W < 640 ? 1400 : W < 1200 ? 2600 : 4200;
      pts = samplePoints(logoEl, c.x.canvas, n).map(function (p) {
        var spark = Math.random() < 0.08;
        return { tx: p.x, ty: p.y, sx: Math.random() * W, sy: Math.random() * H, j: Math.random(), tw: Math.random() * 6.283,
          vx: (Math.random() - 0.5) * 14, vy: (Math.random() - 0.5) * 10, r: spark ? 1.6 + Math.random() * 1.2 : 0.6 + Math.random() * 0.9, spark: spark, sub: p.sub };
      });
    }
    make();
    return { total: E.melt, logoAt: E.flow - 1.4, logoDur: 1.9, resize: make, frame: function (t) {
      var x = c.x; c.clear(); x.globalCompositeOperation = "lighter";
      var melt = t > E.flow ? smooth((t - E.flow) / T.melt) : 0;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        var dx = p.sx + p.vx * t + Math.sin(t * 0.7 + p.tw) * 12, dy = p.sy + p.vy * t + Math.cos(t * 0.5 + p.tw) * 9;
        /* each grain starts its journey at its own moment; the move itself is a long ease-in-out */
        var k = t < E.drift ? 0 : clamp(((t - E.drift) / T.flow - p.j * 0.35) / 0.65), e = inOut(k);
        var curve = Math.sin(e * 3.1416) * (p.j - 0.5) * 120; /* gentle arc so paths don't look mechanical */
        var px = dx + (p.tx - dx) * e + curve * 0.3, py = dy + (p.ty - dy) * e + curve;
        var al = (t < 0.8 ? outCubic(t / 0.8) : 1) * (0.25 + 0.6 * Math.abs(Math.sin(t * 1.6 + p.tw)) * (1 - e) + 0.75 * e) * (1 - melt);
        if (al <= 0.01) continue;
        x.globalAlpha = al;
        if (p.spark) { var s = p.r * 6 * (1 - melt * 0.5); x.drawImage(p.j < 0.5 ? spG : spW, px - s / 2, py - s / 2, s, s); }
        else { x.fillStyle = e > 0.9 ? "#F2DC9A" : "#D3B36C"; x.beginPath(); x.arc(px, py, p.r * (1 - melt * 0.4), 0, 6.283); x.fill(); }
      }
      x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
    } };
  }

  /* ---------- 2 · gold river leaves the letters behind ---------- */
  function river(c, logoEl) {
    var T = { flow: 4.6 }, pts = [], spG = sprite("211,179,108"), spW = sprite("247,231,176"), band = {};
    function make() {
      var W = c.W, H = c.H, r = logoEl.getBoundingClientRect(), cb = c.x.canvas.getBoundingClientRect();
      band.y = r.top - cb.top + r.height * 0.5; band.h = r.height * 0.9; band.x0 = r.left - cb.left; band.x1 = band.x0 + r.width;
      pts = []; var n = W < 640 ? 900 : 2200;
      for (var i = 0; i < n; i++) {
        var spark = Math.random() < 0.1;
        pts.push({ u: Math.random(), v: (Math.random() + Math.random() + Math.random()) / 3 - 0.5, sp: 0.85 + Math.random() * 0.3, tw: Math.random() * 6.283, j: Math.random(),
          r: spark ? 1.5 + Math.random() * 1.3 : 0.5 + Math.random() * 0.9, spark: spark });
      }
    }
    make();
    return { total: T.flow + 0.4, logoAt: 0, logoDur: 0, river: true, resize: make, frame: function (t, setClip) {
      var x = c.x, W = c.W, H = c.H; c.clear();
      var k = clamp(t / T.flow), head = -0.15 + inOut(k) * 1.45; /* head of the stream in screen fractions */
      var hx = head * W;
      /* reveal the mark where the stream has passed (slightly behind the head so grains seem to leave it) */
      var passed = clamp((hx - 40 - band.x0) / (band.x1 - band.x0));
      setClip(passed);
      x.globalCompositeOperation = "lighter";
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        var back = p.u * 0.55; /* distance behind the head, in screen fractions */
        var px = hx - back * W * p.sp + Math.sin(t * 2 + p.tw) * 6;
        var spread = band.h * (0.25 + back * 1.1);
        var py = band.y + p.v * spread + Math.sin(px * 0.012 + t * 1.2 + p.tw) * 10;
        if (px < -20 || px > W + 20) continue;
        var tail = 1 - back / 0.55, al = (0.15 + 0.8 * tail) * (t < 0.6 ? outCubic(t / 0.6) : 1) * (head > 1.15 ? clamp((1.3 - head) / 0.15) : 1);
        if (al <= 0.01) continue;
        x.globalAlpha = al;
        if (p.spark) { var s = p.r * 6; x.drawImage(p.j < 0.5 ? spG : spW, px - s / 2, py - s / 2, s, s); }
        else { x.fillStyle = tail > 0.7 ? "#F2DC9A" : "#D3B36C"; x.beginPath(); x.arc(px, py, p.r, 0, 6.283); x.fill(); }
      }
      /* soft warm light riding with the head — a lamp, not a flash */
      if (head < 1.2) { var g = x.createRadialGradient(hx, band.y, 0, hx, band.y, band.h * 1.4); g.addColorStop(0, "rgba(247,231,176,.28)"); g.addColorStop(1, "rgba(247,231,176,0)"); x.globalAlpha = 1; x.fillStyle = g; x.fillRect(hx - band.h * 1.4, band.y - band.h * 1.4, band.h * 2.8, band.h * 2.8); }
      x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
    } };
  }

  /* sample the on-screen PNG wordmark into canvas-space points */
  function sampleImage(imgEl, cv, n) {
    var r = imgEl.getBoundingClientRect(), c = cv.getBoundingClientRect(), S = 2;
    var off = document.createElement("canvas"); off.width = Math.ceil(r.width / S); off.height = Math.ceil(r.height / S);
    var x = off.getContext("2d"); x.drawImage(imgEl, 0, 0, off.width, off.height);
    var img = x.getImageData(0, 0, off.width, off.height).data, pts = [], guard = 0;
    while (pts.length < n && guard++ < n * 60) {
      var px = (Math.random() * off.width) | 0, py = (Math.random() * off.height) | 0;
      if (img[(py * off.width + px) * 4 + 3] > 120) pts.push({ x: r.left - c.left + px * S + Math.random() * S, y: r.top - c.top + py * S + Math.random() * S });
    }
    return pts;
  }

  /* ---------- 3 · dust spirals in and packs into the wordmark (no burst) ---------- */
  function gather(c, logoEl) {
    var T = { dust: 1.0, gather: 2.6, settle: 0.8 }, E = { dust: 1.0 }; E.gather = E.dust + T.gather; E.settle = E.gather + T.settle;
    var outExpo = function (t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); };
    var pts = [], core = {}, spG = sprite("236,222,190"), spW = sprite("255,255,255");
    function make() {
      var W = c.W, H = c.H, n = W < 640 ? 1500 : W < 1200 ? 2800 : 4400;
      var r = logoEl.getBoundingClientRect(), cb = c.x.canvas.getBoundingClientRect();
      core.x = r.left - cb.left + r.width / 2; core.y = r.top - cb.top + r.height / 2;
      pts = sampleImage(logoEl, c.x.canvas, n).map(function (p) {
        var edge = Math.random() < 0.6, spark = Math.random() < 0.08;
        return { tx: p.x, ty: p.y, sx: edge ? Math.random() * W * 1.6 - W * 0.3 : Math.random() * W, sy: edge ? Math.random() * H * 1.6 - H * 0.3 : Math.random() * H,
          vx: (Math.random() - 0.5) * 16, vy: (Math.random() - 0.5) * 16, j: Math.random(), tw: Math.random() * 6.283,
          sw: (Math.random() < 0.5 ? -1 : 1) * (0.9 + Math.random() * 1.3), r: spark ? 1.8 + Math.random() * 1.4 : 0.6 + Math.random() * 0.9, spark: spark };
      });
    }
    make();
    return { total: E.settle, logoAt: E.gather - 0.25, logoDur: 0.9, veilAt: 1.6, veilDur: 2.8, resize: make, frame: function (t) {
      var x = c.x; c.clear(); x.globalCompositeOperation = "lighter";
      var ph = t < E.dust ? 0 : t < E.gather ? 1 : 2, k = ph === 0 ? t / T.dust : ph === 1 ? (t - E.dust) / T.gather : clamp((t - E.gather) / T.settle);
      /* a soft warm light grows where the mark will form, then eases away as the mark takes over */
      var big = Math.max(c.W, c.H), lamp = ph === 1 ? 0.22 * inCubic(k) : ph === 2 ? 0.22 * (1 - smooth(k)) : 0;
      if (lamp > 0.005) { var g = x.createRadialGradient(core.x, core.y, 0, core.x, core.y, big * 0.32); g.addColorStop(0, "rgba(255,244,222," + lamp + ")"); g.addColorStop(1, "rgba(255,244,222,0)"); x.fillStyle = g; x.fillRect(core.x - big * 0.32, core.y - big * 0.32, big * 0.64, big * 0.64); }
      var fade = ph === 2 ? 1 - smooth((k - 0.15) / 0.85) : 1;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i], px, py, al, sc = 1;
        var dx = p.sx + p.vx * t + Math.sin(t * 0.8 + p.tw) * 10, dy = p.sy + p.vy * t + Math.cos(t * 0.6 + p.tw) * 10;
        if (ph === 0) { px = dx; py = dy; al = (0.12 + 0.4 * Math.abs(Math.sin(t * 2 + p.tw))) * outCubic(k); }
        else {
          var kk = ph === 2 ? 1 : clamp((k - p.j * 0.3) / 0.7);
          var e = kk < 0.55 ? inCubic(kk / 0.55) * 0.5 : 0.5 + outExpo((kk - 0.55) / 0.45) * 0.5;
          /* spiral: the offset from the target shrinks while rotating, so every grain swirls in on its own arc */
          var ox = dx - p.tx, oy = dy - p.ty, ang = (1 - e) * p.sw, cs = Math.cos(ang), sn = Math.sin(ang), m = 1 - e;
          px = p.tx + (ox * cs - oy * sn) * m; py = p.ty + (ox * sn + oy * cs) * m;
          if (ph === 2) { var jit = (1 - smooth(k)) * 1.2; px += Math.sin(t * 15 + p.tw) * jit; py += Math.cos(t * 12 + p.tw) * jit; }
          al = (0.3 + 0.7 * e) * fade; sc = 1 + (1 - e) * 0.7;
          if (ph === 1 && e > 0.1 && e < 0.96) { /* motion streak toward the target so the pull reads as force */
            x.globalAlpha = al * (p.spark ? 0.5 : 0.22); x.strokeStyle = "#fff"; x.lineWidth = p.spark ? 1.2 : 0.7;
            var vx2 = (px - p.tx) * 0.06 * (1 - e), vy2 = (py - p.ty) * 0.06 * (1 - e);
            x.beginPath(); x.moveTo(px + vx2, py + vy2); x.lineTo(px, py); x.stroke();
          }
        }
        if (al <= 0.01) continue;
        x.globalAlpha = al;
        if (p.spark) { var s = p.r * sc * 6; x.drawImage(p.j < 0.5 ? spG : spW, px - s / 2, py - s / 2, s, s); }
        else { x.fillStyle = ph === 2 || (ph === 1 && kk > 0.9) ? "#ffffff" : "#ece6d8"; x.beginPath(); x.arc(px, py, p.r * sc, 0, 6.283); x.fill(); }
      }
      x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
    } };
  }

  function run(which, label) {
    build(label, which === 3);
    var slide1 = document.querySelector(".slide1"), slide2 = document.querySelector(".slide2"), fx = slide1.querySelector(".fx"), logoEl = slide1.querySelector(".logo");
    var gauge = document.querySelector(".gauge"), c = Canvas(fx), seq, t0, raf = 0, timers = [];
    var make = which === 1 ? grains : which === 2 ? river : gather;
    var veil = document.createElement("div"); veil.className = "veil"; slide1.insertBefore(veil, logoEl);
    function setClip(f) { logoEl.style.opacity = f > 0 ? 1 : 0; logoEl.style.clipPath = "inset(0 " + ((1 - f) * 100).toFixed(2) + "% 0 0)"; }
    function frame(now) {
      if (fx.clientWidth !== c.W || fx.clientHeight !== c.H) { c.size(); seq.resize(); }
      var t = (now - t0) / 1000;
      if (!seq.river) logoEl.style.opacity = smooth((t - seq.logoAt) / seq.logoDur);
      if (seq.veilAt != null) veil.style.opacity = 1 - smooth((t - seq.veilAt) / seq.veilDur); else veil.style.opacity = 0;
      if (t < seq.total) { seq.frame(t, setClip); raf = requestAnimationFrame(frame); }
      else { c.clear(); if (seq.river) setClip(1); else logoEl.style.opacity = 1; veil.style.opacity = 0; raf = 0; }
    }
    function play() {
      cancelAnimationFrame(raf); timers.forEach(clearTimeout); timers = [];
      slide1.classList.remove("is-out"); slide2.classList.remove("is-in"); gauge.classList.remove("is-run"); void gauge.offsetWidth;
      logoEl.style.opacity = 0; logoEl.style.clipPath = ""; veil.style.opacity = 1;
      c.size(); seq = make(c, logoEl); t0 = performance.now(); raf = requestAnimationFrame(frame);
      var dur = seq.total + HOLD; gauge.style.setProperty("--dur", dur + "s"); gauge.classList.add("is-run");
      timers.push(setTimeout(function () { slide1.classList.add("is-out"); slide2.classList.add("is-in"); }, dur * 1000));
    }
    document.querySelector("[data-replay]").addEventListener("click", play);
    document.fonts.load("800 100px 'Pretendard Variable'").then(function () { return document.fonts.load("500 30px 'Pretendard Variable'"); }).then(function () {
      var im = logoEl.tagName === "IMG" ? logoEl : null;
      if (im && !im.complete) im.onload = play; else play();
    }, play);
  }
  window.WallPreview = { run: run };
})();
