/* ABOUT / WORK (2026-10 rebuild). Reads data/content.json so the admin editor keeps working.
   - [data-field="a.b.0.c"] gets its text from the data (numbers index into lists)
   - .pg-title[data-split] letters rise in one by one, with a gold dot after the word
   - #works renders the cards, filters (전체 / 공개예정 / 공개완료), view switch (갤러리 / 정보) and the detail window */
(function () {
  "use strict";
  var ARROW = '<svg class="card2__arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  function get(o, path) { return path.split(".").reduce(function (x, k) { return x == null ? undefined : x[k]; }, o); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function clean(v) { var s = String(v == null ? "" : v).replace(/\(.*?\)/g, "").trim(); return s === "-" ? "" : s; }

  /* title letters */
  document.querySelectorAll(".pg-title[data-split]").forEach(function (t) {
    var word = t.textContent.trim();
    t.setAttribute("aria-label", word);
    t.innerHTML = '<span aria-hidden="true">' + word.split("").map(function (c, i) {
      return '<span class="ch"><i style="--i:' + i + '">' + esc(c) + "</i></span>";
    }).join("") + "</span>";
  });

  function fields(d) {
    document.querySelectorAll("[data-field]").forEach(function (el) {
      var v = get(d, el.getAttribute("data-field"));
      if (v == null || typeof v === "object" || v === "") return;
      if (el.hasAttribute("data-mailto")) { el.textContent = v; el.href = "mailto:" + v; }
      else if (el.hasAttribute("data-multiline")) el.innerHTML = esc(v).replace(/\n/g, "<br>");
      else el.textContent = v;
    });
    var off = document.getElementById("ft-offices");
    if (off && d.contact && d.contact.offices) {
      off.innerHTML = d.contact.offices.map(function (o) { return "<p><b>" + esc(o.label) + '</b> <span class="mute">' + esc(o.address) + "</span></p>"; }).join("");
    }
  }

  /* ---------- WORK ---------- */
  function embed(url) {
    if (!url) return "";
    var yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/);
    if (yt) return "https://www.youtube.com/embed/" + yt[1] + "?rel=0";
    var vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return vm ? "https://player.vimeo.com/video/" + vm[1] : "";
  }
  function works(d) {
    var grid = document.getElementById("works");
    if (!grid) return;
    var list = (d.works || []).map(function (w, i) { return { w: w, i: i }; })
      .sort(function (a, b) { return (!!a.w.sortLast - !!b.w.sortLast) || a.i - b.i; }).map(function (x) { return x.w; });
    grid.innerHTML = list.map(function (w, i) {
      var up = w.status === "upcoming", plat = clean((w.credits || {})["플랫폼"]);
      return '<button type="button" class="card2" data-id="' + esc(w.id) + '" data-status="' + (up ? "upcoming" : "released") + '" style="--i:' + i + '">' +
        '<span class="card2__img"><img src="' + esc(w.heroImage || w.image) + '" alt="" style="object-position:' + esc(w.heroPos || "50% 40%") + '"></span>' +
        '<span class="card2__row"><span class="card2__t">' + esc(w.title) + "</span>" + ARROW + "</span>" +
        '<span class="card2__s"><b>' + (up ? "공개예정" : "공개완료") + "</b> , " + esc(w.year) + (w.format ? " · " + esc(w.format) : "") + (plat ? " · " + esc(plat) : "") + "</span></button>";
    }).join("");
    var cards = [].slice.call(grid.querySelectorAll(".card2"));
    /* cards rise in as they come into view */
    var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -6% 0px" }) : null;
    function watch() {
      var n = 0;
      cards.forEach(function (c) { if (c.hidden) return; c.style.setProperty("--i", n++ % 6); c.classList.remove("in"); void c.offsetWidth; if (io) io.observe(c); else c.classList.add("in"); });
    }
    watch();
    var tabs = document.querySelector(".wk2__tabs");
    if (tabs) tabs.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-f]"); if (!b) return;
      tabs.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      var f = b.getAttribute("data-f");
      cards.forEach(function (c) { c.hidden = f !== "all" && c.getAttribute("data-status") !== f; });
      watch();
    });
    var view = document.querySelector(".wk2__view");
    if (view) view.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-v]"); if (!b) return;
      view.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      grid.classList.toggle("is-list", b.getAttribute("data-v") === "list");
      watch();
    });
    /* detail window */
    var wm = document.getElementById("wm");
    function close() { if (!wm.classList.contains("on")) return; wm.classList.remove("on"); wm.querySelector(".wm__media").innerHTML = ""; document.body.style.overflow = ""; if (location.hash) history.replaceState(null, "", location.pathname); }
    function open(w) {
      var cr = w.credits || {}, src = embed(w.video);
      wm.querySelector(".wm__media").innerHTML = src
        ? '<iframe src="' + esc(src) + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="' + esc(w.title) + ' 예고편"></iframe>'
        : '<img src="' + esc(w.heroImage || w.image) + '" alt="">';
      wm.querySelector(".wm__k").textContent = [w.status === "upcoming" ? "공개예정" : "공개완료", w.year, w.format].filter(Boolean).join(" · ");
      wm.querySelector(".wm__t").innerHTML = esc(w.title) + (w.titleEn ? "<small>" + esc(w.titleEn) + "</small>" : "");
      wm.querySelector(".wm__syn").textContent = w.synopsis || "";
      wm.querySelector(".wm__cr").innerHTML = Object.keys(cr).filter(function (k) { return clean(cr[k]); }).map(function (k) { return "<div><dt>" + esc(k) + "</dt><dd>" + esc(cr[k]) + "</dd></div>"; }).join("");
      wm.querySelector(".wm__links").innerHTML = (w.links || []).filter(function (l) { return l && l.url; }).map(function (l) {
        return '<a href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer"><span>' + esc(l.label || l.url) + "</span><span>↗</span></a>";
      }).join("");
      wm.classList.add("on"); wm.scrollTop = 0; document.body.style.overflow = "hidden";
      history.replaceState(null, "", "#" + w.id);
    }
    grid.addEventListener("click", function (e) {
      var c = e.target.closest(".card2"); if (!c) return;
      var w = list.filter(function (x) { return x.id === c.getAttribute("data-id"); })[0]; if (w) open(w);
    });
    wm.querySelector(".wm__close").addEventListener("click", close);
    wm.addEventListener("click", function (e) { if (e.target === wm) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    var fromHash = location.hash.length > 1 && list.filter(function (x) { return x.id === location.hash.slice(1); })[0];
    if (fromHash) open(fromHash);
  }


  /* reveal on scroll for .rv2 blocks and the curtain photo */
  function reveal() {
    var els = document.querySelectorAll(".rv2, .wide, .types .card2");
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- LOCATION (content.json business[id=location]) ---------- */
  function location_(d) {
    var root = document.getElementById("loc");
    if (!root) return;
    var b = (d.business || []).filter(function (x) { return x.id === "location"; })[0];
    if (!b) return;
    var set = function (id, html) { var el = document.getElementById(id); if (el && html) el.innerHTML = html; };
    var nl = function (s) { return esc(s || "").split(String.fromCharCode(10)).join("<br>"); };
    set("loc-tag", nl(b.headline));
    set("loc-lead", esc(b.lead));
    var img = document.getElementById("loc-img"); if (img && b.image) img.src = b.image;
    set("loc-types-t", nl(b.typesTitle));
    set("loc-types", (b.types || []).map(function (t, i) {
      return '<div class="card2 type" style="--i:' + i + '"><span class="card2__img"><img src="' + esc(t.image) + '" alt=""></span>' +
        '<span class="card2__row"><span class="card2__t">' + esc(t.title) + '</span><span class="type__en">' + esc(t.en) + "</span></span>" +
        '<p class="type__d">' + esc(t.desc) + "</p></div>";
    }).join(""));
    set("loc-svc-t", nl(b.servicesTitle));
    set("loc-svc", (b.services || []).map(function (s, i) {
      return '<div class="step rv2" style="transition-delay:' + (i * 0.08) + 's"><b>' + String(i + 1).padStart(2, "0") + "</b><h3>" + esc(s.title) + "</h3><p>" + esc(s.desc) + "</p></div>";
    }).join(""));
    set("loc-why-t", nl(b.whyTitle));
    set("loc-why", (b.why || []).map(function (s, i) {
      return '<div class="step rv2" style="transition-delay:' + (i * 0.08) + 's"><b>' + String(i + 1).padStart(2, "0") + "</b><h3>" + esc(s) + "</h3></div>";
    }).join(""));
    set("loc-end", nl(b.cta));
    set("loc-end-a", esc(b.ctaButton || "로케이션 문의") + " →");
  }

  /* ---------- PARTNERS (content.json about.partners) ---------- */
  function partners(d) {
    var root = document.getElementById("prt");
    if (!root) return;
    var list = ((d.about || {}).partners || []).filter(function (p) { return p && p.name; });
    root.innerHTML = list.map(function (p, i) {
      return '<div class="prt__row rv2" style="transition-delay:' + (0.5 + i * 0.12) + 's"><span class="prt__no">' + String(i + 1).padStart(2, "0") + "</span>" +
        '<span class="prt__name">' + (p.logo ? '<img src="' + esc(p.logo) + '" alt="' + esc(p.name) + '">' : esc(p.name)) + '</span><span class="prt__tag">PARTNER</span></div>';
    }).join("");
  }

  fetch("data/content.json?t=" + Date.now(), { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (d) { fields(d); works(d); location_(d); partners(d); reveal(); })
    .catch(function (e) { console.error("[GOLDSTREAM] content load failed:", e); });
})();
