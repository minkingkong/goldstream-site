/* GOLDSTREAM — front-end renderer (2026 renewal)
   Reads data/content.json and fills the pages. No build step.
   The admin editor keeps writing the same content.json, so every field name used here
   must stay as the editor saves it. */
(function () {
  "use strict";

  var CONTENT_URL = "data/content.json?t=" + Date.now();
  /* KR / EN: Korean is content.json, English is js/en.js. The choice is remembered per browser. */
  var LANG = "ko";
  try { LANG = localStorage.getItem("gs_lang") === "en" ? "en" : "ko"; } catch (e) {}
  var EN = LANG === "en" && window.GS_EN ? window.GS_EN : null;
  document.documentElement.lang = LANG;
  function ui(key, fallback) { return EN && EN.ui[key] ? EN.ui[key] : fallback; }
  function creditKey(k) { return EN && EN.creditKeys[k] ? EN.creditKeys[k] : k; }
  var SLIDE_MS = 6000;
  var INTRO_MS = 7600; /* dust gathers (~4.4s) + logo holds ~3s */
  var ARROW =
    '<svg class="arrow" viewBox="0 0 26 10" aria-hidden="true"><path d="M0 5h24M20 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';

  function get(obj, path) {
    return path.split(".").reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function byId(works, id) {
    return (works || []).filter(function (w) { return w.id === id; })[0];
  }
  function clean(v) {
    var s = String(v == null ? "" : v).replace(/\(.*?\)/g, "").trim();
    return s === "-" ? "" : s;
  }

  /* ---------- theme (editor: text / background colours; the gold accent is not used any more) ---------- */
  function applyTheme(t) {
    if (!t) return;
    var s = document.documentElement.style;
    if (t.ink) s.setProperty("--ink", t.ink);
    if (t.inkMuted) s.setProperty("--ink-muted", t.inkMuted);
    if (t.bg) s.setProperty("--bg", t.bg);
  }

  /* ---------- English: overlay js/en.js onto the Korean content ---------- */
  function localize(data) {
    if (!EN) return data;
    var d = JSON.parse(JSON.stringify(data));
    var merge = function (dst, src) {
      Object.keys(src || {}).forEach(function (k) {
        if (src[k] && typeof src[k] === "object" && !Array.isArray(src[k]) && dst[k] && typeof dst[k] === "object") merge(dst[k], src[k]);
        else dst[k] = src[k];
      });
      return dst;
    };
    d.home = merge(d.home || {}, EN.home);
    d.pages = merge(d.pages || {}, EN.pages);
    d.about = merge(d.about || {}, EN.about);
    d.contact = merge(d.contact || {}, EN.contact);
    (d.works || []).forEach(function (w) {
      var t = EN.works[w.id] || {};
      if (t.titleEn) w.titleEn = t.titleEn;
      if (w.titleEn) { w.title = w.titleEn; w.titleEn = ""; }
      if (t.synopsis) w.synopsis = t.synopsis;
      if (t.dateLabel) w.dateLabel = t.dateLabel;
      if (t.credits) w.credits = merge(w.credits || {}, t.credits);
      if (w.format && EN.format[w.format]) w.format = EN.format[w.format];
    });
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var v = EN.ui[el.getAttribute("data-i18n")];
      if (v) el.textContent = v;
    });
    return d;
  }

  /* ---------- plain text / image fields ---------- */
  function applyFields(data) {
    document.querySelectorAll("[data-field]").forEach(function (el) {
      var v = get(data, el.getAttribute("data-field"));
      if (v == null || typeof v === "object" || v === "") return;
      if (el.hasAttribute("data-mailto")) { el.textContent = v; el.setAttribute("href", "mailto:" + v); }
      else if (el.tagName === "IMG") el.setAttribute("src", v);
      else if (el.hasAttribute("data-multiline")) el.innerHTML = esc(v).replace(/\n/g, "<br>");
      else el.textContent = v;
    });
  }

  /* ---------- header: current page, scrolled state, phone menu ---------- */
  function initHeader() {
    var hd = document.getElementById("hd");
    if (!hd) return;
    var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    hd.querySelectorAll(".hd__nav a").forEach(function (a) {
      if (a.getAttribute("href").toLowerCase() === page) a.setAttribute("aria-current", "page");
    });
    var onScroll = function () { hd.classList.toggle("is-scrolled", window.scrollY > 24); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    var burger = hd.querySelector(".hd__burger");
    if (!burger) return;
    var menu = document.createElement("nav");
    menu.className = "mnav";
    menu.id = "mnav";
    menu.setAttribute("aria-label", "모바일 메뉴");
    menu.innerHTML = Array.prototype.map.call(hd.querySelectorAll(".hd__nav a"), function (a) {
      var cur = a.getAttribute("aria-current") ? ' aria-current="page"' : "";
      return '<a href="' + esc(a.getAttribute("href")) + '"' + cur + ">" + esc(a.textContent.trim()) + "</a>";
    }).join("") + '<p class="mnav__mail" data-field="contact.email"></p>' +
      '<div class="mnav__lang"><button type="button" data-lang="ko">KR</button><button type="button" data-lang="en">EN</button></div>';
    document.body.appendChild(menu);
    document.querySelectorAll("[data-lang]").forEach(function (b) {
      b.classList.toggle("is-on", b.getAttribute("data-lang") === LANG);
      b.addEventListener("click", function () {
        var l = b.getAttribute("data-lang");
        if (l === LANG) return;
        try { localStorage.setItem("gs_lang", l); } catch (e) {}
        location.reload();
      });
    });
    burger.setAttribute("aria-controls", "mnav");
    function setOpen(open) {
      hd.classList.toggle("is-open", open);
      menu.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
    }
    burger.addEventListener("click", function () { setOpen(!menu.classList.contains("is-open")); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
    window.addEventListener("resize", function () { if (window.innerWidth > 860) setOpen(false); });
  }

  /* ---------- home: full-screen slides ---------- */
  function slideMeta(w) {
    var plat = clean((w.credits || {})["플랫폼"]);
    var parts = [w.status === "upcoming" ? "COMING " + esc(w.year || "") : esc(w.year || "")];
    if (w.format) parts.push(esc(w.format));
    if (plat) parts.push(esc(plat));
    return parts.map(function (p) { return "<span>" + p + "</span>"; }).join("<i></i>");
  }
  function slidePeople(w) {
    var cr = w.credits || {}, out = [];
    var dir = clean(cr["감독"]);
    if (dir) out.push("<span>" + esc(creditKey("감독")) + "</span>" + esc(dir));
    var cast = String(cr["출연"] || "").split(",").map(function (s) { return s.trim(); })
      .filter(function (s) { return s && s !== "-"; }).slice(0, 3);
    if (cast.length) out.push("<span>" + esc(creditKey("출연")) + "</span>" + esc(cast.join(", ")));
    return out.join("<em>/</em>");
  }

  function introSlide(home) {
    var el = document.createElement("div");
    el.className = "hs__slide hs__slide--dark";
    el.innerHTML =
      '<div class="hi" aria-hidden="true">' +
      '<div class="pw-wall" data-poster-wall></div><div class="hi__shade"></div><div class="hi__veil"></div>' +
      '<img class="hi__logo" src="assets/img/logo-goldstream.png" alt="" width="774" height="170" decoding="async">' +
      '<p class="hi__tag">' + esc(home.heroTagline || "이야기를 현실로 만듭니다") + "</p>" +
      '<canvas class="hi__fx" aria-hidden="true"></canvas><div class="hi__grain"></div></div>' +
      '<p class="sr-only">' + esc(home.heroTitle || "GOLDSTREAM ENTERTAINMENT") + "</p>";
    el.setAttribute("data-dur", String(INTRO_MS));
    var fx = null, reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el._onActive = function () {
      var hi = el.querySelector(".hi");
      if (!fx && window.GSIntro) fx = window.GSIntro.mount(hi, { active: function () { return el.classList.contains("is-active"); } });
      if (fx && !reduced) fx.play(); else hi.classList.add("is-reveal");
    };
    return el;
  }

  function workSlide(w) {
    var el = document.createElement("div");
    el.className = "hs__slide";
    var poster = w.image || "";
    el.innerHTML =
      (w.heroImage
        ? /* wide still on desktop; phones show the vertical poster until a phone cut exists */
          '<picture class="hs__wide"><source media="(min-width: 861px)" srcset="' + esc(w.heroImage) + '">' +
          '<img src="' + esc(poster || w.heroImage) + '" alt="" draggable="false"' +
          (w.heroPos ? ' style="object-position:' + esc(w.heroPos) + '"' : "") + "></picture>"
        : '<div class="hs__bg" style="background-image:url(&quot;' + esc(poster) + '&quot;)"></div>' +
          '<img class="hs__poster" src="' + esc(poster) + '" alt="' + esc(w.title) + ' 포스터" draggable="false">') +
      '<div class="hs__shade"></div>' +
      '<div class="hs__credit">' +
      '<p class="hs__meta">' + slideMeta(w) + "</p>" +
      '<h2 class="hs__title">' + esc(w.title) + "</h2>" +
      (w.titleEn ? '<p class="hs__title-en">' + esc(w.titleEn) + "</p>" : "") +
      (slidePeople(w) ? '<p class="hs__people">' + slidePeople(w) + "</p>" : "") +
      '<a class="lnk hs__more" href="works.html#' + esc(w.id) + '">' + esc(ui("home.more", "작품 정보 보기")) + " " + ARROW + "</a>" +
      "</div>";
    el.querySelector(".hs__more").addEventListener("click", function (e) { e.preventDefault(); openModal(w); });
    return el;
  }

  function renderHero(data) {
    var root = document.getElementById("hs");
    if (!root) return;
    var home = data.home || {};
    var ids = home.slideIds && home.slideIds.length ? home.slideIds : (data.works || []).map(function (w) { return w.id; });
    var slides = [introSlide(home)];
    ids.forEach(function (id) { var w = byId(data.works, id); if (w) slides.push(workSlide(w)); });
    initSlider(root, slides);
  }

  function initSlider(root, slides) {
    var n = slides.length;
    var track = root.querySelector(".hs__track");
    var nums = root.querySelector(".hs__nums");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    track.innerHTML = "";
    var first = slides[0].cloneNode(true), last = slides[n - 1].cloneNode(true);
    [first, last].forEach(function (c) {
      c.inert = true; c.setAttribute("aria-hidden", "true"); c.classList.add("is-clone");
      c.querySelectorAll("a").forEach(function (x) { x.setAttribute("tabindex", "-1"); });
    });
    track.appendChild(last);
    slides.forEach(function (s, i) {
      s.setAttribute("role", "group");
      s.setAttribute("aria-roledescription", "slide");
      s.setAttribute("aria-label", (i + 1) + " / " + n);
      track.appendChild(s);
    });
    track.appendChild(first);

    /* timeline along the very bottom: one segment per slide with its number above.
       past segments full, the current one fills over its duration, upcoming ones dim */
    nums.innerHTML = "";
    var btns = slides.map(function (s, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "hs__num";
      b.innerHTML = "<span>" + (i + 1) + "</span><i><b></b></i>";
      b.setAttribute("aria-label", (i + 1) + "번째 슬라이드");
      b.addEventListener("click", function () { go(i); });
      nums.appendChild(b);
      return b;
    });

    var pos = 1, timer = null, current = 0, fixTimer = null;
    function setX(px, anim) { track.classList.toggle("is-anim", !!anim); track.style.transform = "translate3d(" + px + "px,0,0)"; }
    function place(anim) { setX(-pos * root.clientWidth, anim); }
    function realIndex(p) { return ((p - 1) % n + n) % n; }
    function fill(i) { return btns[i].querySelector("b"); }
    function startGauge(ms) {
      btns.forEach(function (b, i) { var f = fill(i); f.style.transition = "none"; f.style.transform = ""; });
      var bar = fill(current);
      bar.style.transform = "scaleX(0)";
      void bar.offsetWidth;
      bar.style.transition = "transform " + ms + "ms linear";
      bar.style.transform = "scaleX(1)";
    }
    function schedule() {
      clearTimeout(timer);
      var slide = slides[current];
      var ms = +slide.getAttribute("data-dur") || SLIDE_MS;
      if (slide._onActive) slide._onActive();
      startGauge(ms);
      timer = setTimeout(next, ms);
    }
    function markActive() {
      current = realIndex(pos);
      slides.forEach(function (s, i) { s.classList.toggle("is-active", i === current); s.inert = i !== current; });
      btns.forEach(function (b, i) {
        b.classList.toggle("is-active", i === current);
        b.classList.toggle("is-past", i < current);
        b.setAttribute("aria-current", i === current ? "true" : "false");
      });
      schedule();
    }
    function normalize() {
      clearTimeout(fixTimer);
      if (pos === 0) { pos = n; place(false); }
      else if (pos === n + 1) { pos = 1; place(false); }
    }
    function moveTo(p) {
      pos = p; place(!reduce); markActive();
      clearTimeout(fixTimer);
      if (reduce) normalize(); else fixTimer = setTimeout(normalize, 1000);
    }
    function go(i) { moveTo(i + 1); }
    function next() { moveTo(pos + 1); }
    function prev() { moveTo(pos - 1); }
    track.addEventListener("transitionend", function (e) { if (e.target === track) normalize(); });
    root.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") prev(); if (e.key === "ArrowRight") next(); });

    /* drag / swipe */
    var startX = 0, startY = 0, dx = 0, dragging = false, moved = false, base = 0;
    track.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      if (pos === 0 || pos === n + 1) { pos = pos === 0 ? n : 1; place(false); }
      dragging = true; moved = false; startX = e.clientX; startY = e.clientY; dx = 0;
      base = -pos * root.clientWidth;
      clearTimeout(timer);
    });
    window.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(e.clientY - startY)) {
        moved = true; track.classList.add("is-dragging");
        try { track.setPointerCapture(e.pointerId); } catch (err) {}
      }
      if (moved) setX(base + dx, false);
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false; track.classList.remove("is-dragging");
      if (!moved) { schedule(); return; }
      var limit = Math.min(140, root.clientWidth * 0.12);
      if (dx < -limit) next(); else if (dx > limit) prev(); else { place(true); schedule(); }
    }
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    track.addEventListener("click", function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    root.addEventListener("scroll", function () { root.scrollLeft = 0; });
    window.addEventListener("resize", function () { place(false); });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { clearTimeout(timer); fill(current).style.transition = "none"; } else schedule();
    });

    place(false);
    markActive();
  }

  /* ---------- works ---------- */
  function videoEmbed(url) {
    if (!url) return null;
    var yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/);
    if (yt) return { type: "iframe", src: "https://www.youtube.com/embed/" + yt[1] };
    var vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vm) return { type: "iframe", src: "https://player.vimeo.com/video/" + vm[1] };
    if (/\.(mp4|webm|mov)(\?.*)?$/i.test(url)) return { type: "video", src: url };
    return { type: "iframe", src: url };
  }
  function isFilm(w) { return /영화|film/i.test(w.format || ""); }
  function orderedWorks(data) {
    /* editor order; "sortLast" works go to the end */
    return (data.works || []).map(function (w, i) { return { w: w, i: i }; })
      .sort(function (a, b) { return (!!a.w.sortLast - !!b.w.sortLast) || a.i - b.i; })
      .map(function (x) { return x.w; });
  }
  function workCard(w) {
    var a = document.createElement("a");
    a.className = "work";
    a.setAttribute("data-status", w.status || "released");
    a.setAttribute("data-id", w.id);
    a.setAttribute("data-kind", isFilm(w) ? "film" : "series");
    a.href = "works.html#" + w.id;
    a.innerHTML =
      '<div class="work__thumb"><img loading="lazy" alt="' + esc(w.title) + '" src="' + esc(w.image || "") + '"></div>' +
      '<div class="work__row"><h3>' + esc(w.title) + '</h3><span class="work__arrow" aria-hidden="true">&rarr;</span></div>' +
      '<p class="work__date">' + esc(w.status === "upcoming" ? "COMING " + w.year : w.year) + (w.format ? " · " + esc(w.format) : "") + "</p>";
    a.addEventListener("click", function (e) { e.preventDefault(); openModal(w); });
    return a;
  }
  function renderWorks(data) {
    var grid = document.getElementById("works-grid");
    if (!grid) return;
    var works = orderedWorks(data);
    if (grid.hasAttribute("data-featured")) {
      var ids = (data.home && data.home.featuredIds) || [];
      if (ids.length) works = ids.map(function (id) { return byId(data.works, id); }).filter(Boolean);
    }
    grid.innerHTML = "";
    works.forEach(function (w) { grid.appendChild(workCard(w)); });

    var count = document.getElementById("works-count");
    if (count) count.textContent = works.length + " " + ui("works.titles", "TITLES");
    var bar = document.querySelector("[data-filters]");
    if (bar) bar.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-filter]");
      if (!btn) return;
      bar.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === btn ? "true" : "false"); });
      var f = btn.getAttribute("data-filter");
      grid.querySelectorAll(".work").forEach(function (c) { c.hidden = f !== "all" && c.getAttribute("data-kind") !== f; });
    });
    /* works.html#id opens that work */
    if (!document.getElementById("hs") && location.hash.length > 1) {
      var w = byId(data.works, location.hash.slice(1));
      if (w) openModal(w);
    }
  }

  /* ---------- modal ---------- */
  var modalEl;
  function ensureModal() {
    if (modalEl) return modalEl;
    modalEl = document.createElement("div");
    modalEl.className = "modal";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.innerHTML =
      '<button class="modal__close" aria-label="닫기">&times;</button>' +
      '<div class="modal__card"><div class="modal__media" id="modal-media"></div>' +
      '<div class="modal__body"><p class="modal__eyebrow" id="modal-eyebrow"></p>' +
      '<h2 class="modal__title" id="modal-title"></h2><p class="modal__synopsis" id="modal-synopsis"></p>' +
      '<dl class="modal__credits" id="modal-credits"></dl>' +
      '<nav class="modal__links" id="modal-links" aria-label="관련 링크"></nav></div></div>';
    document.body.appendChild(modalEl);
    function shut() {
      if (!modalEl.classList.contains("is-open")) return;
      modalEl.classList.remove("is-open");
      document.getElementById("modal-media").innerHTML = "";
      document.body.style.overflow = "";
      if (location.hash) history.replaceState(history.state, "", location.pathname);
    }
    /* the popup owns one history entry so the phone's back gesture closes it instead of leaving */
    function close() { if (history.state && history.state.gsModal) history.back(); else shut(); }
    window.addEventListener("popstate", shut);
    modalEl.querySelector(".modal__close").addEventListener("click", close);
    modalEl.addEventListener("click", function (e) { if (e.target === modalEl) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    return modalEl;
  }
  function openModal(w) {
    ensureModal();
    var media = document.getElementById("modal-media");
    var emb = videoEmbed(w.video);
    if (emb && emb.type === "iframe") {
      media.innerHTML = '<iframe src="' + esc(emb.src) + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="' + esc(w.title) + ' 예고편"></iframe>';
    } else if (emb && emb.type === "video") {
      media.innerHTML = '<video src="' + esc(emb.src) + '" controls playsinline></video>';
    } else {
      media.innerHTML = w.heroImage
        ? '<img class="is-wide" alt="' + esc(w.title) + '" src="' + esc(w.heroImage) + '">'
        : '<img alt="' + esc(w.title) + '" src="' + esc(w.image || "") + '">';
    }
    document.getElementById("modal-eyebrow").textContent = (w.format ? w.format + " · " : "") + (w.dateLabel || "");
    document.getElementById("modal-title").innerHTML = esc(w.title) + (w.titleEn ? '<span class="modal__title-en">' + esc(w.titleEn) + "</span>" : "");
    document.getElementById("modal-synopsis").textContent = w.synopsis || "";
    var dl = document.getElementById("modal-credits");
    dl.innerHTML = "";
    var cr = w.credits || {};
    Object.keys(cr).forEach(function (k) {
      if (!cr[k] || String(cr[k]).trim() === "-") return;
      var d = document.createElement("div");
      d.innerHTML = "<dt>" + esc(creditKey(k)) + "</dt><dd>" + esc(cr[k]) + "</dd>";
      dl.appendChild(d);
    });
    var lw = document.getElementById("modal-links");
    lw.innerHTML = "";
    (w.links || []).forEach(function (ln) {
      if (!ln || !ln.url) return;
      var a = document.createElement("a");
      a.href = ln.url; a.target = "_blank"; a.rel = "noopener noreferrer";
      a.innerHTML = esc(ln.label || ln.url) + ' <span aria-hidden="true">&#8599;</span>';
      lw.appendChild(a);
    });
    modalEl.classList.add("is-open");
    modalEl.scrollTop = 0;
    document.body.style.overflow = "hidden";
    if (!(history.state && history.state.gsModal)) history.pushState({ gsModal: 1 }, "");
    if (!document.getElementById("hs")) history.replaceState(history.state, "", "#" + w.id);
  }

  /* ---------- about / partners / contact ---------- */
  function fillParas(id, arr) {
    var el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = "";
    (arr || []).forEach(function (p) { var n = document.createElement("p"); n.textContent = p; el.appendChild(n); });
  }
  function fillItems(id, arr) {
    var el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = "";
    (arr || []).forEach(function (t) { var li = document.createElement("li"); li.textContent = t; el.appendChild(li); });
  }
  function fillDefs(id, pairs) {
    var el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = "";
    (pairs || []).forEach(function (p) {
      var d = document.createElement("div");
      d.innerHTML = "<dt>" + esc(p[0]) + "</dt><dd>" + esc(p[1]) + "</dd>";
      el.appendChild(d);
    });
  }
  function fillLinkList(id, arr) {
    var el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = "";
    var list = (arr || []).filter(function (l) { return l && l.url; });
    var wrap = el.closest("[data-optional]");
    if (wrap) wrap.hidden = !list.length;
    list.forEach(function (ln) {
      var a = document.createElement("a");
      a.href = ln.url; a.target = "_blank"; a.rel = "noopener noreferrer";
      a.innerHTML = esc(ln.label || ln.url) + ' <span aria-hidden="true">&#8599;</span>';
      el.appendChild(a);
    });
  }
  function fillPartners(arr) {
    var el = document.getElementById("partners");
    if (!el) return;
    el.innerHTML = "";
    (arr || []).filter(function (p) { return p && p.name; }).forEach(function (p, i) {
      var li = document.createElement("li");
      li.innerHTML = (p.logo ? '<img src="' + esc(p.logo) + '" alt="' + esc(p.name) + '" loading="lazy">' : "<span>" + esc(p.name) + "</span>") +
        "<small>" + (i < 9 ? "0" : "") + (i + 1) + "</small>";
      el.appendChild(li);
    });
  }
  function renderPages(data) {
    var a = data.about || {};
    fillParas("about-greeting", a.greeting);
    fillParas("about-profile", a.profile);
    fillParas("about-vision", a.vision);
    fillItems("about-business", a.currentBusiness);
    fillDefs("about-facts", (a.facts || []).map(function (f) { return [f.k, f.v]; }));
    fillLinkList("about-press", a.press);
    fillPartners(a.partners);

    /* tilted wall of posters behind the intro slide */
    var posters = (data.works || []).map(function (w) { return w.image; }).filter(Boolean);
    document.querySelectorAll("[data-poster-wall]").forEach(function (wall) {
      if (!posters.length) return;
      var html = "";
      for (var i = 0; i < 32; i++) html += '<img src="' + esc(posters[(i * 3 + Math.floor(i / 8)) % posters.length]) + '" alt="">';
      wall.innerHTML = html;
    });

    var c = data.contact || {};
    var off = document.getElementById("contact-offices");
    if (off) {
      off.innerHTML = (c.offices || []).filter(function (o) { return o && o.address; }).map(function (o) {
        return "<p><b>" + esc(o.label) + "</b>" + esc(o.address) +
          '<br><a class="map" href="https://map.naver.com/p/search/' + encodeURIComponent(o.address) + '" target="_blank" rel="noopener noreferrer">' + esc(ui("contact.map", "지도 보기 ↗")) + "</a></p>";
      }).join("");
    }
    var inq = document.getElementById("contact-inquiries");
    if (inq) inq.innerHTML = (c.inquiries || []).map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("");
  }

  /* ---------- reveal ---------- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0, rootMargin: "0px 0px -4% 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- boot ---------- */
  function boot() {
    initHeader();
    fetch(CONTENT_URL, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("content " + r.status); return r.json(); })
      .then(function (data) {
        data = localize(data);
        window.__content = data;
        applyTheme(data.theme);
        applyFields(data);
        renderHero(data);
        renderWorks(data);
        renderPages(data);
      })
      .catch(function (err) { console.error("[GOLDSTREAM] content load failed:", err); })
      .finally(initReveal);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
