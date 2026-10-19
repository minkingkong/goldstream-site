/* Home intro: white dust drifts in the dark, then spirals in and packs itself into the
   GOLDSTREAM wordmark (each grain already owns a spot on a letter — no clump, no burst).
   While the dust gathers the black veil lifts off the poster wall; once the grains settle
   the real logo PNG surfaces underneath and the grains melt into it. Then the slide holds.
   Layers (bottom → top): poster wall, shade, veil, logo, canvas dust, grain, vignette.
   Timing is in seconds; every move is eased, never linear. */
(function () {
  "use strict";
  var T = { dust: 1.0, gather: 2.6, settle: 0.8 };
  var END = { dust: T.dust, gather: T.dust + T.gather };
  END.settle = END.gather + T.settle;
  var TOTAL = END.settle;
  var VEIL = { at: 1.6, dur: 2.8 };                 /* black lifts off the poster wall */
  var LOGO = { at: END.gather - 0.25, dur: 0.9 };   /* real wordmark surfaces under the dust */

  var outExpo = function (t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); };
  var inCubic = function (t) { return t * t * t; };
  var outCubic = function (t) { return 1 - Math.pow(1 - t, 3); };
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var smooth = function (t) { t = clamp(t); return t * t * (3 - 2 * t); };

  function sprite(c1, c2) {
    var s = document.createElement("canvas"); s.width = s.height = 64;
    var g = s.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, c1); r.addColorStop(0.3, c2); r.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = r; g.fillRect(0, 0, 64, 64); return s;
  }

  function mount(hi, opts) {
    var cv = hi.querySelector(".hi__fx"), logo = hi.querySelector(".hi__logo"), veil = hi.querySelector(".hi__veil");
    if (!cv || !logo) return null;
    var x = cv.getContext("2d");
    var W = 0, H = 0, pts = [], core = { x: 0, y: 0 }, t0 = 0, raf = 0, safety = 0, spW, spG;

    function size() {
      var d = Math.min(2, window.devicePixelRatio || 1);
      W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; x.setTransform(d, 0, 0, d, 0, 0);
    }
    /* sample the on-screen logo PNG so every grain has a target on a letter */
    function sample(n) {
      var r = logo.getBoundingClientRect(), c = cv.getBoundingClientRect(), S = 2;
      var off = document.createElement("canvas"); off.width = Math.max(1, Math.ceil(r.width / S)); off.height = Math.max(1, Math.ceil(r.height / S));
      var g = off.getContext("2d"), out = [], guard = 0;
      try { g.drawImage(logo, 0, 0, off.width, off.height); } catch (e) { return out; }
      var img = g.getImageData(0, 0, off.width, off.height).data;
      while (out.length < n && guard++ < n * 60) {
        var px = (Math.random() * off.width) | 0, py = (Math.random() * off.height) | 0;
        if (img[(py * off.width + px) * 4 + 3] > 120) out.push({ x: r.left - c.left + px * S + Math.random() * S, y: r.top - c.top + py * S + Math.random() * S });
      }
      return out;
    }
    function build() {
      spW = sprite("rgba(255,255,255,1)", "rgba(255,255,255,.55)");
      spG = sprite("rgba(255,250,236,1)", "rgba(236,222,190,.55)");
      var r = logo.getBoundingClientRect(), c = cv.getBoundingClientRect();
      core.x = r.left - c.left + r.width / 2; core.y = r.top - c.top + r.height / 2;
      var n = W < 640 ? 1500 : W < 1200 ? 2800 : 4400;
      pts = sample(n).map(function (p) {
        var edge = Math.random() < 0.6, spark = Math.random() < 0.08;
        return {
          tx: p.x, ty: p.y,
          sx: edge ? Math.random() * W * 1.6 - W * 0.3 : Math.random() * W,
          sy: edge ? Math.random() * H * 1.6 - H * 0.3 : Math.random() * H,
          vx: (Math.random() - 0.5) * 16, vy: (Math.random() - 0.5) * 16,
          j: Math.random(), tw: Math.random() * 6.283,
          sw: (Math.random() < 0.5 ? -1 : 1) * (0.9 + Math.random() * 1.3), /* spiral direction + turn */
          r: spark ? 1.8 + Math.random() * 1.4 : 0.6 + Math.random() * 0.9, spark: spark
        };
      });
    }
    function layers(t) {
      if (veil) veil.style.opacity = 1 - smooth((t - VEIL.at) / VEIL.dur);
      logo.style.opacity = smooth((t - LOGO.at) / LOGO.dur);
      if (t >= LOGO.at && !hi.classList.contains("is-reveal")) hi.classList.add("is-reveal");
    }
    function draw(t) {
      x.clearRect(0, 0, W, H);
      var ph = t < END.dust ? 0 : t < END.gather ? 1 : 2;
      var k = ph === 0 ? t / T.dust : ph === 1 ? (t - END.dust) / T.gather : clamp((t - END.gather) / T.settle);
      x.globalCompositeOperation = "lighter";
      /* a soft warm light grows where the mark forms, then eases away as the mark takes over */
      var big = Math.max(W, H), lamp = ph === 1 ? 0.22 * inCubic(k) : ph === 2 ? 0.22 * (1 - smooth(k)) : 0;
      if (lamp > 0.005) {
        var g = x.createRadialGradient(core.x, core.y, 0, core.x, core.y, big * 0.32);
        g.addColorStop(0, "rgba(255,244,222," + lamp + ")"); g.addColorStop(1, "rgba(255,244,222,0)");
        x.fillStyle = g; x.fillRect(core.x - big * 0.32, core.y - big * 0.32, big * 0.64, big * 0.64);
      }
      var fade = ph === 2 ? 1 - smooth((k - 0.15) / 0.85) : 1;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i], px, py, al, sc = 1, kk = 1;
        var dx = p.sx + p.vx * t + Math.sin(t * 0.8 + p.tw) * 10, dy = p.sy + p.vy * t + Math.cos(t * 0.6 + p.tw) * 10;
        if (ph === 0) { px = dx; py = dy; al = (0.12 + 0.4 * Math.abs(Math.sin(t * 2 + p.tw))) * outCubic(k); }
        else {
          kk = ph === 2 ? 1 : clamp((k - p.j * 0.3) / 0.7); /* staggered start, slow pull, fast arrival */
          var e = kk < 0.55 ? inCubic(kk / 0.55) * 0.5 : 0.5 + outExpo((kk - 0.55) / 0.45) * 0.5;
          /* spiral: the offset from the target shrinks while rotating, so each grain swirls in on its own arc */
          var ox = dx - p.tx, oy = dy - p.ty, ang = (1 - e) * p.sw, cs = Math.cos(ang), sn = Math.sin(ang), m = 1 - e;
          px = p.tx + (ox * cs - oy * sn) * m; py = p.ty + (ox * sn + oy * cs) * m;
          if (ph === 2) { var jit = (1 - smooth(k)) * 1.2; px += Math.sin(t * 15 + p.tw) * jit; py += Math.cos(t * 12 + p.tw) * jit; }
          al = (0.3 + 0.7 * e) * fade; sc = 1 + (1 - e) * 0.7;
          if (ph === 1 && e > 0.1 && e < 0.96) { /* streak toward the target so the pull reads as force */
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
    }
    function finish() { x.clearRect(0, 0, W, H); if (veil) veil.style.opacity = 0; logo.style.opacity = 1; hi.classList.add("is-reveal"); raf = 0; }
    function frame(now) {
      if (cv.clientWidth !== W || cv.clientHeight !== H) { size(); build(); }
      if (opts && opts.active && !opts.active()) { stop(); return; }
      var t = (now - t0) / 1000;
      layers(t);
      if (t < TOTAL) { draw(t); raf = requestAnimationFrame(frame); } else finish();
    }
    function reset() { hi.classList.remove("is-reveal"); if (veil) veil.style.opacity = 1; logo.style.opacity = 0; void hi.offsetWidth; }
    function start() {
      size(); build(); t0 = performance.now(); raf = requestAnimationFrame(frame);
      /* background tabs pause rAF; make sure the slide still lands on the finished state in time */
      clearTimeout(safety);
      safety = setTimeout(function () { if (raf) { cancelAnimationFrame(raf); finish(); } }, TOTAL * 1000 + 400);
    }
    function play() {
      cancelAnimationFrame(raf); reset();
      if (logo.complete && logo.naturalWidth) start();
      else { logo.onload = start; logo.onerror = skip; }
    }
    function stop() { cancelAnimationFrame(raf); raf = 0; clearTimeout(safety); x.clearRect(0, 0, W, H); }
    function skip() { stop(); finish(); }
    function freeze(sec) {
      stop(); reset(); size(); build(); t0 = performance.now() - sec * 1000;
      layers(sec); if (sec < TOTAL) draw(sec); else finish();
      hi.setAttribute("data-shot", cv.toDataURL());
    }
    return { play: play, stop: stop, skip: skip, freeze: freeze, duration: TOTAL };
  }
  window.GSIntro = { mount: mount };
})();
