/* Home intro: dust rushes in and packs into one glowing clump where the title will sit,
   squeezes tighter, then bursts — the burst is what reveals the poster wall and title.
   Canvas layers (bottom → top): drifting gradient mesh, particles, flash. CSS adds the
   veil, grain and vignette on top. Timing is in seconds; every move is eased, never linear. */
(function () {
  "use strict";
  var T = { drift: 1.0, gather: 2.0, hold: 0.7, bang: 1.2 };
  var END = { drift: T.drift, gather: T.drift + T.gather, hold: T.drift + T.gather + T.hold };
  var TOTAL = END.hold + T.bang;

  var outExpo = function (t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); };
  var inExpo = function (t) { return t <= 0 ? 0 : Math.pow(2, 10 * t - 10); };
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

  function sprite(c1, c2) {
    var s = document.createElement("canvas"); s.width = s.height = 64;
    var g = s.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, c1); r.addColorStop(0.3, c2); r.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = r; g.fillRect(0, 0, 64, 64); return s;
  }

  function mount(hi, opts) {
    var cv = hi.querySelector(".hi__fx"), title = hi.querySelector(".hi__title");
    if (!cv || !title) return null;
    var x = cv.getContext("2d");
    var W = 0, H = 0, R = 0, pts = [], t0 = 0, raf = 0, safety = 0, spW, spG, core = { x: 0, y: 0 };

    function size() {
      var d = Math.min(2, window.devicePixelRatio || 1);
      W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; x.setTransform(d, 0, 0, d, 0, 0);
    }
    function build() {
      pts = [];
      spW = sprite("rgba(255,255,255,1)", "rgba(255,255,255,.5)");
      spG = sprite("rgba(255,246,222,1)", "rgba(236,204,140,.55)");
      /* the clump forms where the title will appear, so the burst hands over to it */
      core.x = W / 2; core.y = title.getBoundingClientRect().top - cv.getBoundingClientRect().top + title.offsetHeight / 2;
      R = Math.min(W, H) * (W < 640 ? 0.13 : 0.095);
      var n = W < 640 ? 1000 : W < 1200 ? 1900 : 3000;
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.283, r = Math.random(), spark = Math.random() < 0.1;
        /* targets: dense core, thinning toward the rim (sum of two randoms ≈ bell curve) */
        var ta = Math.random() * 6.283, tr = Math.abs(Math.random() + Math.random() - 1) * R;
        var edge = Math.random() < 0.55; /* over half the dust starts beyond the edges and rushes in */
        pts.push({
          ox: Math.cos(ta) * tr, oy: Math.sin(ta) * tr * 0.8,
          sx: edge ? Math.random() * W * 1.5 - W * 0.25 : Math.random() * W,
          sy: edge ? Math.random() * H * 1.5 - H * 0.25 : Math.random() * H,
          vx: (Math.random() - 0.5) * 18, vy: (Math.random() - 0.5) * 18,
          sw: (Math.random() < 0.5 ? -1 : 1) * (80 + Math.random() * 220),
          bx: Math.cos(a) * (300 + r * W * 1.3), by: Math.sin(a) * (300 + r * H * 1.3),
          j: Math.random(), tw: Math.random() * 6.283,
          r: spark ? 2 + Math.random() * 1.6 : 0.7 + Math.random() * 1.0, spark: spark
        });
      }
    }
    function glow(cx, cy, rad, al, warm) {
      var g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
      g.addColorStop(0, "rgba(255," + (warm ? "240,210" : "255,255") + "," + al + ")");
      g.addColorStop(0.35, "rgba(255,240,215," + al * 0.4 + ")");
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
      if (ph < 3 || k < 0.5) mesh(t);

      x.globalCompositeOperation = "lighter";
      /* the clump's core light: builds while gathering, squeezes brighter, then blows out (no ring) */
      var big = Math.max(W, H);
      if (ph === 1) glow(core.x, core.y, big * 0.28, 0.35 * inExpo(k), true);
      if (ph === 2) { glow(core.x, core.y, big * (0.28 - k * 0.1), 0.35 + 0.45 * inExpo(k) + 0.05 * Math.sin(t * 22), true); glow(core.x, core.y, R * (1.2 - k * 0.5), 0.5 + 0.5 * k, false); }
      if (ph === 3) { var f = 1 - outExpo(k); glow(core.x, core.y, big * 0.75, 0.95 * f, false); glow(core.x, core.y, big * 0.25, 0.6 * f, true); }
      var squeeze = ph === 2 ? 1 - 0.5 * inExpo(k) : 1; /* clump radius shrinks as it charges */

      for (var i = 0; i < pts.length; i++) {
        var p = pts[i], px, py, al, sc = 1;
        var tx = core.x + p.ox * squeeze, ty = core.y + p.oy * squeeze;
        var dx = p.sx + p.vx * t + Math.sin(t * 0.8 + p.tw) * 10, dy = p.sy + p.vy * t + Math.cos(t * 0.6 + p.tw) * 10;
        if (ph === 0) { px = dx; py = dy; al = (0.15 + 0.45 * Math.abs(Math.sin(t * 2 + p.tw))) * outExpo(k); }
        else if (ph === 1) {
          /* slow start, then the whole cloud rushes in at once and spirals into the core */
          var kk = clamp((k - p.j * 0.25) / 0.75);
          var e = kk < 0.6 ? inExpo(kk / 0.6) * 0.5 : 0.5 + outExpo((kk - 0.6) / 0.4) * 0.5;
          var ang = e * 4.2 + p.tw, rad = Math.sin(e * 3.1416) * p.sw * (1 - e * 0.6);
          px = dx + (tx - dx) * e + Math.cos(ang) * rad; py = dy + (ty - dy) * e + Math.sin(ang) * rad * 0.6;
          al = 0.3 + 0.7 * e; sc = 1 + (1 - e) * 0.8;
          if (e > 0.15 && e < 0.97) { /* streak toward the core so the pull reads as force */
            x.globalAlpha = al * (p.spark ? 0.45 : 0.2); x.strokeStyle = "#fff"; x.lineWidth = p.spark ? 1.2 : 0.7;
            x.beginPath(); x.moveTo(px - (tx - dx) * 0.03, py - (ty - dy) * 0.03); x.lineTo(px, py); x.stroke();
          }
        }
        else if (ph === 2) {
          var sh = inExpo(k) * 3; /* the packed clump shakes harder as it charges */
          px = tx + Math.sin(t * 16 + p.tw) * (0.4 + sh); py = ty + Math.cos(t * 13 + p.tw) * (0.4 + sh);
          al = 0.9 + 0.1 * Math.sin(t * 9 + p.tw); sc = 1 + inExpo(k) * 0.6;
        }
        else {
          var e2 = inExpo(clamp(k / (0.45 + p.j * 0.55)));
          var eo = outExpo(clamp(k / (0.45 + p.j * 0.55)));
          var m = e2 * 0.35 + eo * 0.65;
          px = tx + p.bx * m; py = ty + p.by * m; al = (1 - eo) * 0.95; sc = 1 + eo * (p.spark ? 0.3 : 1.0);
          if (k < 0.7) { x.globalAlpha = al * 0.55; x.strokeStyle = "#fff"; x.lineWidth = p.spark ? 1.5 : 0.8;
            x.beginPath(); x.moveTo(px - p.bx * 0.06 * (1 - k), py - p.by * 0.06 * (1 - k)); x.lineTo(px, py); x.stroke(); }
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
      clearTimeout(safety);
      safety = setTimeout(function () {
        hi.classList.add("is-reveal");
        safety = setTimeout(function () { if (raf) { cancelAnimationFrame(raf); raf = 0; x.clearRect(0, 0, W, H); } }, T.bang * 1000 + 400);
      }, END.hold * 1000 + 50);
    }
    function stop() { cancelAnimationFrame(raf); raf = 0; clearTimeout(safety); x.clearRect(0, 0, W, H); }
    function skip() { stop(); hi.classList.add("is-reveal"); }
    function freeze(sec) {
      stop(); hi.classList.remove("is-reveal"); size(); build(); t0 = performance.now() - sec * 1000;
      frame(performance.now()); cancelAnimationFrame(raf);
      if (sec >= END.hold) hi.classList.add("is-reveal");
      hi.setAttribute("data-shot", cv.toDataURL());
    }
    return { play: play, stop: stop, skip: skip, freeze: freeze, duration: TOTAL };
  }
  window.GSIntro = { mount: mount };
})();
