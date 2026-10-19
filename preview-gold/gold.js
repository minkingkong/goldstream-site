/* GOLDSTREAM main-screen intro previews.
   Three canvas sequences; all end with the 07-A gold wordmark holding on black,
   then hand over to slide 2. Timings in seconds, every move eased. */
(function () {
  "use strict";
  var HOLD = 3.2;            /* logo rests this long before slide 2 */
  var outExpo = function (t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); };
  var inExpo = function (t) { return t <= 0 ? 0 : Math.pow(2, 10 * t - 10); };
  var outCubic = function (t) { return 1 - Math.pow(1 - t, 3); };
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var G = { hi: "247,231,176", mid: "211,179,108", lo: "167,126,34" };

  /* ---------- shared page ---------- */
  var LOGO =
    '<svg viewBox="0 0 1000 290" aria-label="GOLDSTREAM ENTERTAINMENT">' +
    '<defs><linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#F7E7B0"/><stop offset=".22" stop-color="#E2C56E"/><stop offset=".48" stop-color="#B78F2E"/>' +
    '<stop offset=".62" stop-color="#F0D98A"/><stop offset=".85" stop-color="#A77E22"/><stop offset="1" stop-color="#E5C86F"/></linearGradient>' +
    '<linearGradient id="gS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EAD48E"/><stop offset=".5" stop-color="#C9A646"/><stop offset="1" stop-color="#A8862A"/></linearGradient>' +
    '<filter id="sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity=".6"/></filter></defs>' +
    '<text class="wm" x="500" y="158" text-anchor="middle" fill="url(#gA)" filter="url(#sh)">GOLDSTREAM</text>' +
    '<text class="sub" x="511" y="246" text-anchor="middle" fill="url(#gS)">ENTERTAINMENT</text></svg>';
  var SHINE =
    '<svg viewBox="0 0 1000 290"><defs><linearGradient id="gW" x1="0" y1="0" x2="1" y2="0">' +
    '<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff8dc" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
    '<mask id="mk"><text class="wm" x="500" y="158" text-anchor="middle" fill="#fff">GOLDSTREAM</text><text class="sub" x="511" y="246" text-anchor="middle" fill="#fff">ENTERTAINMENT</text></mask></defs>' +
    '<rect x="-300" y="0" width="260" height="290" fill="url(#gW)" mask="url(#mk)" transform="skewX(-20)"><animate attributeName="x" from="-300" to="1100" dur="1.4s" begin="indefinite" fill="freeze" id="shineAnim"/></rect></svg>';
  var SMALL =
    '<svg viewBox="0 0 1000 290"><defs><linearGradient id="gH" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#F7E7B0"/><stop offset=".48" stop-color="#C9A646"/><stop offset="1" stop-color="#E5C86F"/></linearGradient></defs>' +
    '<text x="500" y="158" text-anchor="middle" fill="url(#gH)" font-family="Pretendard Variable" font-weight="800" font-size="150" letter-spacing="-2.5">GOLDSTREAM</text>' +
    '<text x="511" y="246" text-anchor="middle" fill="url(#gH)" font-family="Pretendard Variable" font-weight="500" font-size="34" letter-spacing="22">ENTERTAINMENT</text></svg>';

  function build(variant, label) {
    document.body.innerHTML =
      '<header class="hd"><a class="hd__logo" href="#">' + SMALL + '</a>' +
      '<nav class="hd__nav"><a>WORK</a><a>LOCATION</a><a>CAMPAIGN</a><a>SPONSORSHIP</a><a>IMPACT</a><a>ABOUT</a><a>BRAND</a></nav><a class="hd__cta" href="#">CONTACT</a></header>' +
      '<div class="stage">' +
      '<div class="intro ' + variant + '"><canvas class="bg"></canvas><canvas class="fx"></canvas>' +
      (variant === "v-sweep" ? '<div class="bar"></div><div class="shine">' + SHINE + "</div>" : "") +
      '<div class="logo">' + LOGO + '</div><p class="tag">이야기를 현실로 만듭니다</p><div class="grain"></div></div>' +
      '<div class="slide2"><img src="../assets/img/hero/code.jpg" alt=""><div class="shade"></div>' +
      '<div class="credit"><p class="meta">2025 · 영화 · 제작</p><h2>코드</h2><p class="en">CODE</p><a class="more" href="#">작품 정보 보기 →</a></div></div>' +
      '<div class="pager"><span>01</span><i></i><span>08</span></div></div>' +
      '<div class="tools"><button data-replay>↻ 다시 보기</button></div>' +
      '<div class="label">' + label + "</div>";
  }

  /* ---------- canvas helpers ---------- */
  function Canvas(cv) {
    var x = cv.getContext("2d"), o = { x: x, W: 0, H: 0 };
    o.size = function () {
      var d = Math.min(2, window.devicePixelRatio || 1);
      o.W = cv.clientWidth; o.H = cv.clientHeight; cv.width = o.W * d; cv.height = o.H * d; x.setTransform(d, 0, 0, d, 0, 0);
    };
    o.clear = function () { x.clearRect(0, 0, o.W, o.H); };
    o.glow = function (cx, cy, rad, al, rgb) {
      var g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
      g.addColorStop(0, "rgba(" + rgb + "," + al + ")"); g.addColorStop(0.4, "rgba(" + rgb + "," + al * 0.35 + ")"); g.addColorStop(1, "rgba(" + rgb + ",0)");
      x.fillStyle = g; x.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
    };
    o.size();
    return o;
  }
  function sprite(rgb) {
    var s = document.createElement("canvas"); s.width = s.height = 64;
    var g = s.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, "rgba(255,250,230,1)"); r.addColorStop(0.3, "rgba(" + rgb + ",.6)"); r.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = r; g.fillRect(0, 0, 64, 64); return s;
  }
  /* slow gold-tinted pools so the black never looks flat */
  function pools(c, t, k) {
    var x = c.x, W = c.W, H = c.H;
    x.globalCompositeOperation = "source-over";
    var a = x.createRadialGradient(W * (0.32 + Math.sin(t * 0.22) * 0.07), H * 0.42, 0, W * 0.32, H * 0.42, W * 0.65);
    a.addColorStop(0, "rgba(36,30,18," + 0.9 * k + ")"); a.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = a; x.fillRect(0, 0, W, H);
    var b = x.createRadialGradient(W * (0.7 + Math.cos(t * 0.18) * 0.06), H * 0.7, 0, W * 0.7, H * 0.7, W * 0.55);
    b.addColorStop(0, "rgba(22,20,28," + 0.85 * k + ")"); b.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = b; x.fillRect(0, 0, W, H);
  }

  /* ---------- A · gold dust gathers and bursts ---------- */
  function dust(c, bgc, intro) {
    var T = { drift: 1.1, gather: 2.1, hold: 0.75, bang: 1.3 }, E = {};
    E.drift = T.drift; E.gather = E.drift + T.gather; E.hold = E.gather + T.hold; E.bang = E.hold + T.bang;
    var pts = [], core = {}, R, spG, spW;
    function buildPts() {
      var W = c.W, H = c.H; pts = []; core.x = W / 2; core.y = H / 2;
      R = Math.min(W, H) * (W < 640 ? 0.14 : 0.1);
      spG = sprite(G.mid); spW = sprite(G.hi);
      var n = W < 640 ? 900 : W < 1200 ? 1800 : 2800;
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.283, r = Math.random(), spark = Math.random() < 0.12;
        var ta = Math.random() * 6.283, tr = Math.abs(Math.random() + Math.random() - 1) * R;
        var edge = Math.random() < 0.55;
        pts.push({ ox: Math.cos(ta) * tr * 1.6, oy: Math.sin(ta) * tr * 0.7,
          sx: edge ? Math.random() * W * 1.5 - W * 0.25 : Math.random() * W, sy: edge ? Math.random() * H * 1.5 - H * 0.25 : Math.random() * H,
          vx: (Math.random() - 0.5) * 16, vy: (Math.random() - 0.5) * 16, sw: (Math.random() < 0.5 ? -1 : 1) * (80 + Math.random() * 220),
          bx: Math.cos(a) * (300 + r * W * 1.3), by: Math.sin(a) * (300 + r * H * 1.3), j: Math.random(), tw: Math.random() * 6.283,
          r: spark ? 2 + Math.random() * 1.6 : 0.7 + Math.random(), spark: spark });
      }
    }
    buildPts();
    return { total: E.bang, revealAt: E.hold, resize: buildPts, frame: function (t) {
      var x = c.x, W = c.W, H = c.H, ph, k;
      if (t < E.drift) { ph = 0; k = t / T.drift; } else if (t < E.gather) { ph = 1; k = (t - E.drift) / T.gather; }
      else if (t < E.hold) { ph = 2; k = (t - E.gather) / T.hold; } else { ph = 3; k = clamp((t - E.hold) / T.bang); }
      bgc.clear(); pools(bgc, t, ph < 3 ? 1 : 1 - outExpo(k) * 0.6);
      c.clear(); x.globalCompositeOperation = "lighter";
      var big = Math.max(W, H);
      if (ph === 1) c.glow(core.x, core.y, big * 0.3, 0.35 * inExpo(k), G.mid);
      if (ph === 2) { c.glow(core.x, core.y, big * (0.3 - k * 0.1), 0.35 + 0.45 * inExpo(k) + 0.05 * Math.sin(t * 22), G.mid); c.glow(core.x, core.y, R * (1.2 - k * 0.5), 0.5 + 0.5 * k, G.hi); }
      if (ph === 3) { var f = 1 - outExpo(k); c.glow(core.x, core.y, big * 0.8, 0.9 * f, G.hi); c.glow(core.x, core.y, big * 0.28, 0.6 * f, G.mid); }
      var squeeze = ph === 2 ? 1 - 0.5 * inExpo(k) : 1;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i], px, py, al, sc = 1, tx = core.x + p.ox * squeeze, ty = core.y + p.oy * squeeze;
        var dx = p.sx + p.vx * t + Math.sin(t * 0.8 + p.tw) * 10, dy = p.sy + p.vy * t + Math.cos(t * 0.6 + p.tw) * 10;
        if (ph === 0) { px = dx; py = dy; al = (0.15 + 0.45 * Math.abs(Math.sin(t * 2 + p.tw))) * outExpo(k); }
        else if (ph === 1) {
          var kk = clamp((k - p.j * 0.25) / 0.75), e = kk < 0.6 ? inExpo(kk / 0.6) * 0.5 : 0.5 + outExpo((kk - 0.6) / 0.4) * 0.5;
          var ang = e * 4.2 + p.tw, rad = Math.sin(e * 3.1416) * p.sw * (1 - e * 0.6);
          px = dx + (tx - dx) * e + Math.cos(ang) * rad; py = dy + (ty - dy) * e + Math.sin(ang) * rad * 0.6; al = 0.3 + 0.7 * e; sc = 1 + (1 - e) * 0.8;
          if (e > 0.15 && e < 0.97) { x.globalAlpha = al * (p.spark ? 0.45 : 0.2); x.strokeStyle = "rgb(" + G.hi + ")"; x.lineWidth = p.spark ? 1.2 : 0.7;
            x.beginPath(); x.moveTo(px - (tx - dx) * 0.03, py - (ty - dy) * 0.03); x.lineTo(px, py); x.stroke(); }
        } else if (ph === 2) {
          var sh = inExpo(k) * 3; px = tx + Math.sin(t * 16 + p.tw) * (0.4 + sh); py = ty + Math.cos(t * 13 + p.tw) * (0.4 + sh); al = 0.9 + 0.1 * Math.sin(t * 9 + p.tw); sc = 1 + inExpo(k) * 0.6;
        } else {
          var e2 = inExpo(clamp(k / (0.45 + p.j * 0.55))), eo = outExpo(clamp(k / (0.45 + p.j * 0.55))), m = e2 * 0.35 + eo * 0.65;
          px = tx + p.bx * m; py = ty + p.by * m; al = (1 - eo) * 0.95; sc = 1 + eo * (p.spark ? 0.3 : 1);
          if (k < 0.7) { x.globalAlpha = al * 0.55; x.strokeStyle = "rgb(" + G.hi + ")"; x.lineWidth = p.spark ? 1.5 : 0.8;
            x.beginPath(); x.moveTo(px - p.bx * 0.06 * (1 - k), py - p.by * 0.06 * (1 - k)); x.lineTo(px, py); x.stroke(); }
        }
        if (al <= 0.01) continue;
        x.globalAlpha = al;
        if (p.spark) { var s = p.r * sc * 6; x.drawImage(p.j < 0.5 ? spG : spW, px - s / 2, py - s / 2, s, s); }
        else { x.fillStyle = ph === 2 ? "rgb(" + G.hi + ")" : "rgb(" + G.mid + ")"; x.beginPath(); x.arc(px, py, p.r * sc, 0, 6.283); x.fill(); }
      }
      x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
    } };
  }

  /* ---------- B · light streaks converge, one bar sweeps the mark on ---------- */
  function sweep(c, bgc) {
    var T = { streak: 2.2, converge: 0.9, flash: 0.5 }, E = {};
    E.streak = T.streak; E.conv = E.streak + T.converge; E.flash = E.conv + T.flash;
    var lines = [], spG;
    function buildPts() {
      var W = c.W, H = c.H; lines = []; spG = sprite(G.hi);
      var n = W < 640 ? 40 : 90;
      for (var i = 0; i < n; i++) {
        lines.push({ y: Math.random(), len: 0.08 + Math.random() * 0.28, sp: 0.5 + Math.random() * 1.4, off: Math.random(), w: Math.random() < 0.2 ? 1.6 : 0.7,
          dir: Math.random() < 0.5 ? 1 : -1, j: Math.random(), al: 0.25 + Math.random() * 0.6 });
      }
    }
    buildPts();
    return { total: E.flash + 0.2, revealAt: E.flash - 0.1, resize: buildPts, frame: function (t) {
      var x = c.x, W = c.W, H = c.H;
      bgc.clear(); pools(bgc, t, t < E.conv ? 1 : 1 - 0.5 * clamp((t - E.conv) / T.flash));
      c.clear(); x.globalCompositeOperation = "lighter";
      var conv = t < E.streak ? 0 : t < E.conv ? outCubic((t - E.streak) / T.converge) : 1;
      var flash = t < E.conv ? 0 : clamp((t - E.conv) / T.flash);
      for (var i = 0; i < lines.length; i++) {
        var L = lines[i], ly0 = L.y * H, ly = ly0 + (H / 2 - ly0) * conv;
        var phase = ((t * L.sp * 0.5 + L.off) % 1.4) - 0.2, px = (L.dir > 0 ? phase : 1 - phase) * W, len = L.len * W * (1 + conv * 2);
        var al = L.al * (t < 0.6 ? outExpo(t / 0.6) : 1) * (1 - flash);
        if (al <= 0.01) continue;
        var g = x.createLinearGradient(px, 0, px + len * L.dir, 0);
        g.addColorStop(0, "rgba(" + G.hi + ",0)"); g.addColorStop(0.7, "rgba(" + G.mid + "," + al + ")"); g.addColorStop(1, "rgba(" + G.hi + "," + al + ")");
        x.strokeStyle = g; x.lineWidth = L.w * (1 + conv); x.beginPath(); x.moveTo(px, ly); x.lineTo(px + len * L.dir, ly); x.stroke();
        if (L.w > 1) { var s = 10 + conv * 14; x.globalAlpha = al; x.drawImage(spG, px + len * L.dir - s / 2, ly - s / 2, s, s); x.globalAlpha = 1; }
      }
      /* the converged line: a thin horizon of light that brightens, then flares as the bar launches */
      if (conv > 0) {
        var hg = x.createLinearGradient(0, 0, W, 0);
        hg.addColorStop(0, "rgba(" + G.hi + ",0)"); hg.addColorStop(0.5, "rgba(" + G.hi + "," + 0.95 * conv * (1 - flash) + ")"); hg.addColorStop(1, "rgba(" + G.hi + ",0)");
        x.strokeStyle = hg; x.lineWidth = 1 + conv * 1.5; x.beginPath(); x.moveTo(0, H / 2); x.lineTo(W, H / 2); x.stroke();
        c.glow(W / 2, H / 2, Math.max(W, H) * 0.35, 0.3 * conv * (1 - flash), G.mid);
      }
      if (flash > 0) { var f = 1 - outExpo(flash); c.glow(W * 0.06, H / 2, Math.max(W, H) * 0.5, 0.8 * f, G.hi); }
      x.globalCompositeOperation = "source-over";
    } };
  }

  /* ---------- C · a single ember charges, then a shockwave rings out ---------- */
  function wave(c, bgc) {
    var T = { charge: 2.2, bang: 1.4 }, E = { charge: 2.2 }; E.bang = E.charge + T.bang;
    var pts = [], spG, spW;
    function buildPts() {
      var W = c.W, H = c.H; pts = []; spG = sprite(G.mid); spW = sprite(G.hi);
      var n = W < 640 ? 500 : 1400;
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.283, r = 0.3 + Math.random() * 0.7, spark = Math.random() < 0.15;
        pts.push({ a: a, d: r, j: Math.random(), tw: Math.random() * 6.283, r: spark ? 2.2 + Math.random() * 1.6 : 0.7 + Math.random(), spark: spark,
          ia: Math.random() * 6.283, ir: 0.35 + Math.random() * 0.65 });
      }
    }
    buildPts();
    return { total: E.bang, revealAt: E.charge, resize: buildPts, frame: function (t) {
      var x = c.x, W = c.W, H = c.H, cx = W / 2, cy = H / 2, big = Math.max(W, H);
      var ph = t < E.charge ? 0 : 1, k = ph === 0 ? t / T.charge : clamp((t - E.charge) / T.bang);
      bgc.clear(); pools(bgc, t, ph === 0 ? 1 : 1 - outExpo(k) * 0.6);
      c.clear(); x.globalCompositeOperation = "lighter";
      if (ph === 0) {
        /* ember: grows, pulses faster, and drinks in sparks from the dark */
        var g = inExpo(k) * 0.8 + k * 0.2, pulse = 1 + Math.sin(t * (6 + k * 30)) * 0.08 * g;
        c.glow(cx, cy, big * (0.05 + g * 0.3) * pulse, 0.5 + 0.5 * g, G.mid);
        c.glow(cx, cy, (6 + g * 40) * pulse, 1, G.hi);
        for (var i = 0; i < pts.length; i++) {
          var p = pts[i], kk = clamp((k - p.j * 0.5) / 0.5); if (kk <= 0) continue;
          var e = inExpo(kk), rad = p.ir * big * 0.7 * (1 - e), ang = p.ia + e * 2.5;
          var px = cx + Math.cos(ang) * rad, py = cy + Math.sin(ang) * rad * 0.7, al = (0.2 + 0.8 * e) * (1 - e * 0.5);
          x.globalAlpha = al;
          if (p.spark) { var s = p.r * 5; x.drawImage(spW, px - s / 2, py - s / 2, s, s); }
          else { x.fillStyle = "rgb(" + G.mid + ")"; x.beginPath(); x.arc(px, py, p.r, 0, 6.283); x.fill(); }
        }
        x.globalAlpha = 1;
      } else {
        var f = 1 - outExpo(k);
        c.glow(cx, cy, big * 0.9, 0.95 * f, G.hi); c.glow(cx, cy, big * 0.3, 0.7 * f, G.mid);
        /* two rings: a hard bright one and a wide soft one behind it */
        var rr = outExpo(k) * big * 0.8;
        x.globalAlpha = (1 - k) * 0.9; x.strokeStyle = "rgb(" + G.hi + ")"; x.lineWidth = 2 + (1 - k) * 6;
        x.beginPath(); x.ellipse(cx, cy, rr, rr * 0.62, 0, 0, 6.283); x.stroke();
        var rg = x.createRadialGradient(cx, cy, rr * 0.75, cx, cy, rr * 1.05);
        rg.addColorStop(0, "rgba(" + G.mid + ",0)"); rg.addColorStop(0.7, "rgba(" + G.mid + "," + 0.35 * (1 - k) + ")"); rg.addColorStop(1, "rgba(" + G.hi + ",0)");
        x.globalAlpha = 1; x.fillStyle = rg; x.save(); x.scale(1, 0.62); x.beginPath(); x.arc(cx, cy / 0.62, rr * 1.05, 0, 6.283); x.fill(); x.restore();
        for (var j = 0; j < pts.length; j++) {
          var q = pts[j], eo = outExpo(clamp(k / (0.5 + q.j * 0.5))), dist = q.d * big * 0.9 * eo;
          var qx = cx + Math.cos(q.a) * dist, qy = cy + Math.sin(q.a) * dist * 0.7, qa = (1 - eo) * 0.9;
          if (qa <= 0.01) continue;
          x.globalAlpha = qa * 0.5; x.strokeStyle = "rgb(" + G.hi + ")"; x.lineWidth = q.spark ? 1.4 : 0.7;
          x.beginPath(); x.moveTo(qx - Math.cos(q.a) * 18 * (1 - k), qy - Math.sin(q.a) * 12 * (1 - k)); x.lineTo(qx, qy); x.stroke();
          x.globalAlpha = qa;
          if (q.spark) { var s2 = q.r * 5 * (1 + eo); x.drawImage(q.j < 0.5 ? spG : spW, qx - s2 / 2, qy - s2 / 2, s2, s2); }
          else { x.fillStyle = "rgb(" + G.mid + ")"; x.beginPath(); x.arc(qx, qy, q.r, 0, 6.283); x.fill(); }
        }
        x.globalAlpha = 1;
      }
      x.globalCompositeOperation = "source-over";
    } };
  }

  /* ---------- runner ---------- */
  function run(variant, label) {
    build(variant, label);
    var intro = document.querySelector(".intro"), fx = intro.querySelector(".fx"), bg = intro.querySelector(".bg");
    var slide2 = document.querySelector(".slide2"), pager = document.querySelector(".pager");
    var c = Canvas(fx), bgc = Canvas(bg), seq, t0, raf = 0, timers = [];
    var make = variant === "v-dust" ? dust : variant === "v-sweep" ? sweep : wave;
    function frame(now) {
      if (fx.clientWidth !== c.W || fx.clientHeight !== c.H) { c.size(); bgc.size(); seq.resize(); }
      var t = (now - t0) / 1000;
      if (t >= seq.revealAt && !intro.classList.contains("is-reveal")) {
        intro.classList.add("is-reveal"); pager.classList.add("is-run");
        var an = document.getElementById("shineAnim"); if (an && an.beginElement) timers.push(setTimeout(function () { an.beginElement(); }, 1900));
      }
      if (t < seq.total) { seq.frame(t); raf = requestAnimationFrame(frame); }
      else { c.clear(); bgc.clear(); pools(bgc, t, 0.4); raf = 0; }
    }
    function play() {
      cancelAnimationFrame(raf); timers.forEach(clearTimeout); timers = [];
      intro.classList.remove("is-reveal", "is-out"); slide2.classList.remove("is-in"); pager.classList.remove("is-run"); void intro.offsetWidth;
      c.size(); bgc.size(); seq = make(c, bgc); t0 = performance.now(); raf = requestAnimationFrame(frame);
      timers.push(setTimeout(function () { intro.classList.add("is-out"); slide2.classList.add("is-in"); }, (seq.revealAt + HOLD) * 1000));
    }
    document.querySelector("[data-replay]").addEventListener("click", play);
    var at = /[?&]at=([\d.]+)/.exec(location.search);
    if (at) { c.size(); bgc.size(); seq = make(c, bgc); t0 = performance.now() - at[1] * 1000; if (+at[1] >= seq.revealAt) intro.classList.add("is-reveal"); seq.frame(+at[1]); }
    else if (document.fonts && document.fonts.load) document.fonts.load("800 100px 'Pretendard Variable'").then(play, play);
    else play();
  }
  window.GoldPreview = { run: run };
})();
