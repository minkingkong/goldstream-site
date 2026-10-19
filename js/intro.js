/* Home intro: dust gathers into the GOLDSTREAM title, charges up and bursts,
   revealing the poster wall. Canvas layers (bottom → top): drifting gradient mesh,
   particles, flash + shockwave. CSS adds the veil, grain and vignette on top.
   Timing is in seconds; every move uses an eased curve, never linear. */
(function () {
  "use strict";
  var T = { drift: 1.2, gather: 2.2, hold: 1.1, bang: 1.3 };
  var END = { drift: T.drift, gather: T.drift + T.gather, hold: T.drift + T.gather + T.hold };
  var TOTAL = END.hold + T.bang;

  var outExpo = function (t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); };
  var inExpo = function (t) { return t <= 0 ? 0 : Math.pow(2, 10 * t - 10); };
  var inOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

  function sprite(c1, c2) {
    var s = document.createElement("canvas"); s.width = s.height = 64;
    var g = s.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, c1); r.addColorStop(0.3, c2); r.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = r; g.fillRect(0, 0, 64, 64); return s;
  }

  function mount(hi, opts) {
    var cv = hi.querySelector(".hi__fx"), title = hi.querySelector(".hi__title"), sub = hi.querySelector(".hi__sub");
    if (!cv || !title) return null;
    var x = cv.getContext("2d");
    var W = 0, H = 0, pts = [], t0 = 0, raf = 0, safety = 0, spW, spG, core = { x: 0, y: 0 };

    function size() {
      var d = Math.min(2, window.devicePixelRatio || 1);
      W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; x.setTransform(d, 0, 0, d, 0, 0);
    }
    /* Sample the real DOM title so the particles land exactly where the text will appear. */
    function textPoints() {
      var o = document.createElement("canvas"), g = o.getContext("2d"); o.width = W; o.height = H;
      var box = cv.getBoundingClientRect();
      [title, sub].forEach(function (el) {
        if (!el) return;
        var cs = getComputedStyle(el), r = el.getBoundingClientRect(), pad = parseFloat(cs.paddingLeft) || 0;
        g.font = cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
        g.letterSpacing = cs.letterSpacing;
        g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fff";
        g.fillText(el.textContent, r.left - box.left + (r.width + pad) / 2, r.top - box.top + r.height / 2);
      });
      var d = g.getImageData(0, 0, W, H).data, step = W < 640 ? 3 : W < 1200 ? 2.5 : 2, out = [];
      for (var yy = 0; yy < H; yy += step) for (var xx = 0; xx < W; xx += step) {
        var ix = ((yy | 0) * W + (xx | 0)) * 4 + 3;
        if (d[ix] > 128) out.push([xx + (Math.random() - 0.5) * step, yy + (Math.random() - 0.5) * step]);
      }
      return out;
    }
    function build() {
      var tg = textPoints(); pts = [];
      spW = sprite("rgba(255,255,255,1)", "rgba(255,255,255,.5)");
      spG = sprite("rgba(255,246,222,1)", "rgba(236,204,140,.55)");
      core.x = W / 2; core.y = title.getBoundingClientRect().top - cv.getBoundingClientRect().top + title.offsetHeight / 2;
      for (var i = 0; i < tg.length; i++) {
        var a = Math.random() * 6.283, r = Math.random(), spark = Math.random() < 0.1;
        var edge = Math.random() < 0.5; /* half the dust starts beyond the edges, so it rushes in from outside */
        pts.push({
          tx: tg[i][0], ty: tg[i][1],
          sx: edge ? Math.random() * W * 1.4 - W * 0.2 : Math.random() * W,
          sy: Math.random() * H * 1.3 - H * 0.15,
          vx: (Math.random() - 0.5) * 18, vy: (Math.random() - 0.5) * 18,
          sw: (Math.random() < 0.5 ? -1 : 1) * (60 + Math.random() * 160),
          bx: Math.cos(a) * (260 + r * W * 1.2), by: Math.sin(a) * (260 + r * H * 1.2),
          d: tg[i][0] / W, j: Math.random(), tw: Math.random() * 6.283,
          r: spark ? 2 + Math.random() * 1.6 : 0.65 + Math.random() * 0.9, spark: spark
        });
      }
    }
    function glow(cx, cy, rad, al, warm) {
      var g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
      g.addColorStop(0, "rgba(255," + (warm ? "238,205" : "255,255") + "," + al + ")");
      g.addColorStop(0.4, "rgba(255,240,215," + al * 0.35 + ")");
      g.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = g; x.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
    }
    function mesh(t) {
      /* layer 1: two slow-drifting colour pools so the black is never flat */
      x.globalCompositeOperation = "source-over";
      var a = x.createRadialGradient(W * (0.3 + Math.sin(t * 0.25) * 0.08), H * 0.4, 0, W * 0.3, H * 0.4, W * 0.7);
      a.addColorStop(0, "rgba(28,34,52,.9)"); a.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = a; x.fillRect(0, 0, W, H);
      var b = x.createRadialGradient(W * (0.72 + Math.cos(t * 0.2) * 0.06), H * 0.7, 0, W * 0.72, H * 0.7, W * 0.6);
      b.addColorStop(0, "rgba(46,36,24,.75)"); b.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = b; x.fillRect(0, 0, W, H);
    }
    function frame(now) {
      if (cv.clientWidth !== W || cv.clientHeight !== H) { size(); build(); }
      if (opts && opts.active && !opts.active()) { stop(); return; }
      var t = (now - t0) / 1000;
      x.clearRect(0, 0, W, H);
      var ph, k;
      if (t < END.drift) { ph = 0; k = t / T.drift; }
      else if (t < END.gather) { ph = 1; k = (t - END.drift) / T.gather; }
      else if (t < END.hold) { ph = 2; k = (t - END.gather) / T.hold; }
      else { ph = 3; k = clamp((t - END.hold) / T.bang); }
      if (ph === 3 && !hi.classList.contains("is-reveal")) hi.classList.add("is-reveal");
      if (ph < 3 || k < 0.6) mesh(t);

      x.globalCompositeOperation = "lighter";
      /* charge-up glow while gathering and holding, then the bang */
      if (ph === 1) glow(core.x, core.y, Math.max(W, H) * 0.3, 0.22 * inExpo(k), true);
      if (ph === 2) glow(core.x, core.y, Math.max(W, H) * (0.3 + k * 0.1), 0.22 + 0.25 * inExpo(k) + 0.04 * Math.sin(t * 18), true);
      if (ph === 3) {
        var f = 1 - outExpo(k);
        glow(core.x, core.y, Math.max(W, H) * 0.7, 0.9 * f, false);
        /* shockwave ring */
        var rr = outExpo(k) * Math.max(W, H) * 0.9;
        x.globalAlpha = (1 - k) * 0.7; x.lineWidth = 2 + (1 - k) * 22; x.strokeStyle = "rgba(255,245,225,1)";
        x.beginPath(); x.arc(core.x, core.y, rr, 0, 6.283); x.stroke();
        x.globalAlpha = (1 - k) * 0.25; x.lineWidth = 60 * (1 - k) + 4;
        x.beginPath(); x.arc(core.x, core.y, rr * 0.82, 0, 6.283); x.stroke();
      }
      var sweep = ph === 2 ? W * 0.15 + W * 0.7 * outExpo(clamp(k * 1.3)) : -1;

      for (var i = 0; i < pts.length; i++) {
        var p = pts[i], px, py, al, sc = 1;
        var dx = p.sx + p.vx * t + Math.sin(t * 0.8 + p.tw) * 10, dy = p.sy + p.vy * t + Math.cos(t * 0.6 + p.tw) * 10;
        if (ph === 0) { px = dx; py = dy; al = (0.15 + 0.45 * Math.abs(Math.sin(t * 2 + p.tw))) * outExpo(k); }
        else if (ph === 1) {
          /* slow start, then everything rushes in at once: inExpo → outExpo blend, staggered left→right */
          var kk = clamp((k - p.d * 0.22 - p.j * 0.08) / 0.7);
          var e = kk < 0.55 ? inExpo(kk / 0.55) * 0.5 : 0.5 + outExpo((kk - 0.55) / 0.45) * 0.5;
          var ang = e * 3.6 + p.tw, rad = Math.sin(e * 3.1416) * p.sw * (1 - e * 0.5);
          px = dx + (p.tx - dx) * e + Math.cos(ang) * rad; py = dy + (p.ty - dy) * e + Math.sin(ang) * rad * 0.6;
          al = 0.3 + 0.7 * e; sc = 1 + (1 - e) * 0.8;
          if (p.spark && e > 0.1 && e < 0.95) { /* streak toward the target */
            x.globalAlpha = al * 0.35; x.strokeStyle = "#fff"; x.lineWidth = 1;
            x.beginPath(); x.moveTo(px - (p.tx - dx) * 0.02, py - (p.ty - dy) * 0.02); x.lineTo(px, py); x.stroke();
          }
        }
        else if (ph === 2) {
          var sh = inExpo(k) * 2.2; /* the formed title trembles harder as it charges */
          px = p.tx + Math.sin(t * 14 + p.tw) * (0.3 + sh); py = p.ty + Math.cos(t * 12 + p.tw) * (0.3 + sh);
          al = 0.85 + 0.15 * Math.sin(t * 7 + p.tw);
          var ds = Math.abs(p.tx - sweep); if (sweep > 0 && ds < 120) { var b = 1 - ds / 120; al = Math.min(1, al + b); sc = 1 + b * (p.spark ? 0.5 : 1.4); }
        }
        else {
          var e2 = inExpo(clamp(k / (0.5 + p.j * 0.5)));
          var eo = outExpo(clamp(k / (0.5 + p.j * 0.5)));
          var m = e2 * 0.4 + eo * 0.6;
          px = p.tx + p.bx * m; py = p.ty + p.by * m; al = (1 - eo) * 0.95; sc = 1 + eo * (p.spark ? 0.3 : 1.1);
          if (k < 0.6) { x.globalAlpha = al * 0.5; x.strokeStyle = "#fff"; x.lineWidth = p.spark ? 1.4 : 0.8;
            x.beginPath(); x.moveTo(px - p.bx * 0.05 * (1 - k), py - p.by * 0.05 * (1 - k)); x.lineTo(px, py); x.stroke(); }
        }
        if (al <= 0.01) continue;
        x.globalAlpha = al;
        if (p.spark) { var s = p.r * sc * 6; x.drawImage(p.j < 0.5 ? spG : spW, px - s / 2, py - s / 2, s, s); }
        else { x.fillStyle = ph === 2 ? "#fff" : "#eeeeee"; x.beginPath(); x.arc(px, py, p.r * sc, 0, 6.283); x.fill(); }
      }
      x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
      if (t < TOTAL + 0.3) raf = requestAnimationFrame(frame); else { x.clearRect(0, 0, W, H); raf = 0; }
    }
    function play() {
      cancelAnimationFrame(raf);
      hi.classList.remove("is-reveal"); void hi.offsetWidth;
      size(); build(); t0 = performance.now(); raf = requestAnimationFrame(frame);
      /* background tabs pause rAF; make sure the wall is revealed on time regardless */
      clearTimeout(safety); safety = setTimeout(function () { hi.classList.add("is-reveal"); safety = setTimeout(function () { if (raf) { cancelAnimationFrame(raf); raf = 0; x.clearRect(0, 0, W, H); } }, T.bang * 1000 + 400); }, END.hold * 1000 + 50);
    }
    function stop() { cancelAnimationFrame(raf); raf = 0; clearTimeout(safety); x.clearRect(0, 0, W, H); }
    function skip() { stop(); hi.classList.add("is-reveal"); }
    function freeze(sec) { stop(); hi.classList.remove("is-reveal"); size(); build(); t0 = performance.now() - sec * 1000; frame(performance.now()); cancelAnimationFrame(raf); if (sec >= END.hold) hi.classList.add("is-reveal"); hi.setAttribute("data-shot", cv.toDataURL()); }
    return { play: play, stop: stop, skip: skip, freeze: freeze, duration: TOTAL };
  }
  window.GSIntro = { mount: mount };
})();
