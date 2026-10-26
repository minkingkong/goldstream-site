/* Home intro (slide 01).
   Black fades up into the tilted poster wall while the GOLDSTREAM letters
   rise one by one, then ENTERTAINMENT, and the logo holds.
   The letters are cut from the original logo PNG (its own pixels decide where each letter is),
   so the mark is never redrawn. Timing lives in CSS (.hi.is-play ...); this file only builds
   the letters and restarts the sequence. */
(function () {
  "use strict";
  var SRC = "assets/img/logo-goldstream.png";
  var geo = null, waiting = [];

  /* find the two word bands and every letter inside them; letters that touch get split
     at their thinnest column until the count matches */
  function measure(img) {
    var W = img.naturalWidth, H = img.naturalHeight;
    var c = document.createElement("canvas"); c.width = W; c.height = H;
    var g = c.getContext("2d"); g.drawImage(img, 0, 0);
    var d = g.getImageData(0, 0, W, H).data;
    var on = function (x, y) { return d[(y * W + x) * 4 + 3] > 40; };
    var rows = [], x, y;
    for (y = 0; y < H; y++) { var s = 0; for (x = 0; x < W; x++) if (on(x, y)) s++; rows.push(s); }
    var bands = [], st = -1;
    for (y = 0; y <= H; y++) { var f = y < H && rows[y] > 0; if (f && st < 0) st = y; if (!f && st >= 0) { bands.push([st, y]); st = -1; } }
    bands.sort(function (a, b) { return (b[1] - b[0]) - (a[1] - a[0]); });
    var two = bands.slice(0, 2).sort(function (a, b) { return a[0] - b[0]; });
    if (two.length < 2) return null;
    function letters(y0, y1, expect) {
      var sum = [], out = [], s0 = -1;
      for (x = 0; x < W; x++) { var n = 0; for (var yy = y0; yy < y1; yy++) if (on(x, yy)) n++; sum.push(n); }
      for (x = 0; x <= W; x++) { var ff = x < W && sum[x] > 0; if (ff && s0 < 0) s0 = x; if (!ff && s0 >= 0) { out.push([s0, x]); s0 = -1; } }
      for (var guard = 0; out.length < expect && guard < 40; guard++) {
        var wi = 0; out.forEach(function (r, i) { if (r[1] - r[0] > out[wi][1] - out[wi][0]) wi = i; });
        var r = out[wi], a = r[0] + Math.round((r[1] - r[0]) * 0.25), z = r[0] + Math.round((r[1] - r[0]) * 0.75), best = a;
        for (x = a; x < z; x++) if (sum[x] < sum[best]) best = x;
        out.splice(wi, 1, [r[0], best], [best, r[1]]);
      }
      return out.map(function (q) { return [q[0] / W, q[1] / W]; });
    }
    return {
      px: [1.5 / W, 1.5 / H],
      top: { y0: two[0][0] / H, y1: two[0][1] / H, letters: letters(two[0][0], two[0][1], 10) },
      bot: { y0: two[1][0] / H, y1: two[1][1] / H, letters: letters(two[1][0], two[1][1], 13) }
    };
  }

  /* one letter = a clipping box (positioned in % of the mark) holding the PNG cropped to that letter */
  function letter(band, L, cls, i, px) {
    var x0 = Math.max(0, L[0] - px[0]), x1 = Math.min(1, L[1] + px[0]);
    var y0 = Math.max(0, band.y0 - px[1]), y1 = Math.min(1, band.y1 + px[1]);
    var w = x1 - x0, h = y1 - y0;
    var box = document.createElement("span");
    box.className = "hi__l " + cls;
    box.style.cssText = "left:" + (x0 * 100) + "%;top:" + (y0 * 100) + "%;width:" + (w * 100) + "%;height:" + (h * 100) + "%;--i:" + i;
    var ink = document.createElement("i");
    ink.style.backgroundImage = "url(" + SRC + ")";
    ink.style.backgroundSize = (100 / w) + "% " + (100 / h) + "%";
    ink.style.backgroundPosition = (x0 / (1 - w) * 100) + "% " + (y0 / (1 - h) * 100) + "%";
    box.appendChild(ink);
    return box;
  }

  function build(mark) {
    if (!geo) { mark.classList.add("is-fallback"); return; }
    var frag = document.createDocumentFragment();
    geo.top.letters.forEach(function (L, i) { frag.appendChild(letter(geo.top, L, "is-top", i, geo.px)); });
    geo.bot.letters.forEach(function (L, i) { frag.appendChild(letter(geo.bot, L, "is-bot", i, geo.px)); });
    mark.appendChild(frag);
  }

  var img = new Image();
  img.onload = function () {
    try { geo = measure(img); } catch (e) { geo = null; }
    var w = waiting; waiting = []; w.forEach(function (f) { f(); });
  };
  img.onerror = function () { var w = waiting; waiting = []; w.forEach(function (f) { f(); }); };
  img.src = SRC;

  function mount(hi) {
    var mark = hi.querySelector(".hi__mark"), built = false;
    function ensure(cb) {
      if (built) return cb();
      var go = function () { if (!built) { build(mark); built = true; } cb(); };
      if (img.complete) go(); else waiting.push(go);
    }
    return {
      /* restart the whole sequence from black */
      play: function () {
        ensure(function () {
          /* snap back to the start without animating backwards, then run again */
          hi.classList.add("is-reset");
          hi.classList.remove("is-play", "is-done");
          void hi.offsetWidth;
          hi.classList.remove("is-reset");
          void hi.offsetWidth;
          hi.classList.add("is-play");
        });
      },
      /* jump straight to the finished frame (reduced motion) */
      finish: function () { ensure(function () { hi.classList.add("is-play", "is-done"); }); }
    };
  }
  window.GSIntro = { mount: mount };
})();
