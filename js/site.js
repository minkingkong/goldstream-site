/* GOLDSTREAM — front-end renderer
   Reads data/content.json and populates pages. No build step. */
(function () {
  "use strict";

  var CONTENT_URL = "data/content.json?t=" + Date.now();
  var SLIDE_MS = 6000;
  var ARROW =
    '<svg class="arrow" viewBox="0 0 26 10" aria-hidden="true"><path d="M0 5h24M20 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';

  /* default business areas — used until content.json provides its own */
  var BUSINESS_DEFAULT = [
    {
      id: "production", label: "PRODUCTION", title: "영화·드라마 제작",
      lead: "기획부터 투자, 제작까지. 좋은 이야기가 작품이 되는 모든 과정을 함께합니다.",
      keywords: ["원천 IP 발굴", "기획·개발", "투자 구조 설계", "제작"]
    },
    {
      id: "location", label: "LOCATION", title: "로케이션 & 촬영 지원",
      lead: "장소 섭외부터 촬영 허가, 현장 준비까지. 제작진은 촬영에만 집중하세요.",
      keywords: ["장소 섭외", "촬영 허가", "기관 협조", "현장 운영"]
    },
    {
      id: "campaign", label: "CAMPAIGN", title: "공공·브랜드 영상",
      lead: "정책과 브랜드의 메시지를, 사람들이 기억하는 영상으로 만듭니다.",
      keywords: ["공공 캠페인", "홍보 영상", "브랜드 필름", "콘텐츠 기획"]
    },
    {
      id: "sponsorship", label: "SPONSORSHIP", title: "기업 협찬·PPL",
      lead: "브랜드가 작품 속에서 자연스럽게 빛나도록 연결합니다.",
      keywords: ["제작 협찬", "PPL 기획", "브랜드 매칭", "파트너십 운영"]
    }
  ];

  function get(obj, path) {
    return path.split(".").reduce(function (o, k) {
      return o == null ? undefined : o[k];
    }, obj);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }
  function byId(works, id) {
    return (works || []).filter(function (w) { return w.id === id; })[0];
  }

  /* ---------- theme colours ---------- */
  function normHex(hex) {
    hex = String(hex || "").trim().replace("#", "");
    if (hex.length === 3) hex = hex.split("").map(function (c) { return c + c; }).join("");
    return /^[0-9a-fA-F]{6}$/.test(hex) ? hex : null;
  }
  function hexToRgba(hex, a) {
    var h = normHex(hex);
    if (!h) return null;
    return "rgba(" + parseInt(h.substr(0, 2), 16) + "," +
      parseInt(h.substr(2, 2), 16) + "," + parseInt(h.substr(4, 2), 16) + "," + a + ")";
  }
  function shade(hex, pct) {
    var h = normHex(hex);
    if (!h) return hex;
    var out = [0, 2, 4].map(function (i) {
      var v = parseInt(h.substr(i, 2), 16) + Math.round(255 * pct);
      v = Math.max(0, Math.min(255, v));
      return ("0" + v.toString(16)).slice(-2);
    });
    return "#" + out.join("");
  }
  function applyTheme(t) {
    if (!t) return;
    var s = document.documentElement.style;
    var map = {
      accent: "--gold",
      ink: "--ink",
      inkMuted: "--ink-muted",
      bg: "--bg",
      heroFrom: "--hero-1",
      heroTo: "--hero-2"
    };
    Object.keys(map).forEach(function (k) {
      if (t[k]) s.setProperty(map[k], t[k]);
    });
    if (t.accent) {
      s.setProperty("--gold-bright", shade(t.accent, 0.11));
      var soft = hexToRgba(t.accent, 0.12);
      if (soft) s.setProperty("--gold-soft", soft);
      var line = hexToRgba(t.accent, 0.38);
      if (line) s.setProperty("--gold-line", line);
    }
  }

  /* ---------- text / image fields ---------- */
  function applyFields(data) {
    document.querySelectorAll("[data-field]").forEach(function (el) {
      var v = get(data, el.getAttribute("data-field"));
      if (v == null || typeof v === "object" || v === "") return;
      if (el.hasAttribute("data-mailto")) {
        el.textContent = v;
        el.setAttribute("href", "mailto:" + v);
      } else if (el.hasAttribute("data-tel")) {
        el.textContent = v;
        el.setAttribute("href", "tel:" + String(v).replace(/[^0-9+]/g, ""));
      } else if (el.tagName === "IMG") {
        el.setAttribute("src", v);
      } else if (el.hasAttribute("data-multiline")) {
        el.innerHTML = esc(v).replace(/\n/g, "<br>");
      } else {
        el.textContent = v;
      }
    });
  }

  /* ---------- header: current page, scroll state, mobile menu ---------- */
  function initHeader() {
    var hd = document.getElementById("hd");
    if (!hd) return;
    var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    hd.querySelectorAll("a[href]").forEach(function (a) {
      if (a.getAttribute("href").toLowerCase() === page) a.setAttribute("aria-current", "page");
    });

    var onScroll = function () {
      hd.classList.toggle("is-scrolled", window.scrollY > 40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    var burger = hd.querySelector(".hd__burger");
    if (!burger) return;
    var menu = document.createElement("nav");
    menu.className = "mnav";
    menu.id = "mnav";
    menu.setAttribute("aria-label", "모바일 메뉴");
    var links = Array.prototype.slice.call(hd.querySelectorAll(".hd__nav a, .hd__cta"));
    menu.innerHTML = links.map(function (a, i) {
      var cur = a.getAttribute("aria-current") ? ' aria-current="page"' : "";
      return '<a href="' + esc(a.getAttribute("href")) + '"' + cur + "><small>" + pad2(i + 1) +
        "</small>" + esc(a.textContent.trim()) + "</a>";
    }).join("") + '<p class="mnav__mail">kim@goldstream.kr</p>';
    document.body.appendChild(menu);
    burger.setAttribute("aria-controls", "mnav");

    function setOpen(open) {
      hd.classList.toggle("is-open", open);
      menu.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
    }
    burger.addEventListener("click", function () {
      setOpen(!menu.classList.contains("is-open"));
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 1180) setOpen(false);
    });
  }

  /* ---------- home hero slider ---------- */
  function slideMeta(w) {
    var cr = w.credits || {};
    var plat = String(cr["플랫폼"] || "").replace(/\(.*?\)/g, "").trim();
    if (plat === "-") plat = "";
    var first = w.status === "upcoming"
      ? '<b class="hs__coming">COMING ' + esc(w.year || "") + "</b>"
      : "<span>" + esc(w.year || "") + "</span>";
    var parts = [first];
    if (w.format) parts.push("<span>" + esc(w.format) + "</span>");
    if (plat) parts.push("<span>" + esc(plat) + "</span>");
    return parts.join("<i></i>");
  }
  function slidePeople(w) {
    var cr = w.credits || {};
    var out = [];
    var dir = String(cr["감독"] || "").trim();
    if (dir && dir !== "-") out.push("<span>감독</span>" + esc(dir));
    var cast = String(cr["출연"] || "").split(",").map(function (s) { return s.trim(); })
      .filter(function (s) { return s && s !== "-"; }).slice(0, 3);
    if (cast.length) out.push("<span>출연</span>" + esc(cast.join(", ")));
    return out.join("<em>/</em>");
  }

  function introSlide(home) {
    var video = home.introVideo || "";
    var el = document.createElement("div");
    el.className = "hs__slide hs__slide--intro" + (video ? " has-video" : "");
    el.innerHTML =
      (video
        ? '<video class="hs__video" src="' + esc(video) + '" muted playsinline preload="auto"' +
          (home.introPoster ? ' poster="' + esc(home.introPoster) + '"' : "") + "></video>"
        : '<svg class="hs__mark" viewBox="0 0 84 100" aria-hidden="true" focusable="false">' +
          '<defs><linearGradient id="gs-gold" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="#ecd9ab"/><stop offset="0.55" stop-color="#cdb27a"/><stop offset="1" stop-color="#8f7442"/></linearGradient>' +
          '<mask id="gs-inline" maskUnits="userSpaceOnUse" x="-10" y="-10" width="104" height="120">' +
          '<rect x="-10" y="-10" width="104" height="120" fill="#fff"/>' +
          '<text x="42" y="86" text-anchor="middle" font-size="100" fill="none" stroke="#000" stroke-width="0.7">G</text></mask></defs>' +
          '<text x="42" y="86" text-anchor="middle" font-size="100" fill="none" stroke="url(#gs-gold)" stroke-width="1.3" mask="url(#gs-inline)">G</text></svg>') +
      '<div class="hs__shade"></div>' +
      '<div class="hs__credit">' +
      '<p class="hs__meta"><span>' + esc(home.heroEyebrow || "Film & Drama Production") + "</span></p>" +
      '<h1 class="hs__intro-title">' + esc(home.heroTitle || "GOLDSTREAM ENTERTAINMENT").replace(" ", "<br>") + "</h1>" +
      '<p class="hs__intro-tag">' + esc(home.heroTagline || "") +
      (home.heroTaglineEn ? "<small>" + esc(home.heroTaglineEn) + "</small>" : "") + "</p>" +
      '<a class="hs__more" href="about.html">회사 소개 ' + ARROW + "</a>" +
      "</div>";
    return el;
  }

  function workSlide(w) {
    var el = document.createElement("div");
    el.className = "hs__slide";
    var poster = w.image || "";
    el.innerHTML =
      (w.heroImage
        ? '<img class="hs__wide" src="' + esc(w.heroImage) + '" alt="" draggable="false">'
        : '<div class="hs__bg" style="background-image:url(&quot;' + esc(poster) + '&quot;)"></div>' +
          '<img class="hs__poster" src="' + esc(poster) + '" alt="' + esc(w.title) + ' 포스터" draggable="false">') +
      '<div class="hs__shade"></div>' +
      '<div class="hs__credit">' +
      '<p class="hs__meta">' + slideMeta(w) + "</p>" +
      '<h2 class="hs__title">' + esc(w.title) + "</h2>" +
      (w.titleEn ? '<p class="hs__title-en">' + esc(w.titleEn) + "</p>" : "") +
      (slidePeople(w) ? '<p class="hs__people">' + slidePeople(w) + "</p>" : "") +
      '<a class="hs__more" href="works.html#' + esc(w.id) + '" data-work="' + esc(w.id) + '">작품 정보 보기 ' + ARROW + "</a>" +
      "</div>";
    el.querySelector(".hs__more").addEventListener("click", function (e) {
      e.preventDefault();
      openModal(w);
    });
    return el;
  }

  function renderHero(data) {
    var root = document.getElementById("hs");
    if (!root) return;
    var home = data.home || {};
    var ids = home.slideIds && home.slideIds.length
      ? home.slideIds
      : ["pine", "mungmungi", "steelrain2", "steelrain", "code"];
    var slides = [introSlide(home)];
    ids.forEach(function (id) {
      var w = byId(data.works, id);
      if (w) slides.push(workSlide(w));
    });
    initSlider(root, slides);
  }

  function initSlider(root, slides) {
    var n = slides.length;
    var track = root.querySelector(".hs__track");
    var nums = root.querySelector(".hs__nums");
    var gauge = document.createElement("span");
    gauge.className = "hs__gauge";
    gauge.innerHTML = "<i></i>";
    var bar = gauge.firstChild;

    track.innerHTML = "";
    // clones at both ends give a seamless loop
    var first = slides[0].cloneNode(true), last = slides[n - 1].cloneNode(true);
    [first, last].forEach(function (c) {
      c.inert = true;
      c.setAttribute("aria-hidden", "true");
      c.classList.add("is-clone");
      c.querySelectorAll("a,video").forEach(function (x) { x.setAttribute("tabindex", "-1"); });
    });
    track.appendChild(last);
    slides.forEach(function (s, i) {
      s.setAttribute("role", "group");
      s.setAttribute("aria-roledescription", "slide");
      s.setAttribute("aria-label", (i + 1) + " / " + n);
      track.appendChild(s);
    });
    track.appendChild(first);

    nums.innerHTML = "";
    var btns = slides.map(function (s, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "hs__num";
      b.textContent = pad2(i + 1);
      b.setAttribute("aria-label", (i + 1) + "번째 슬라이드");
      b.addEventListener("click", function () { go(i); });
      nums.appendChild(b);
      return b;
    });

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var pos = 1; // index in track (1..n are real slides)
    var timer = null;
    var current = 0;

    function setX(px, anim) {
      track.classList.toggle("is-anim", !!anim);
      track.style.transform = "translate3d(" + px + "px,0,0)";
    }
    function place(anim) {
      setX(-pos * root.clientWidth, anim);
    }
    function realIndex(p) {
      return ((p - 1) % n + n) % n;
    }

    function startGauge(ms) {
      bar.style.transition = "none";
      bar.style.transform = "scaleX(0)";
      void bar.offsetWidth;
      bar.style.transition = "transform " + ms + "ms linear";
      bar.style.transform = "scaleX(1)";
    }
    function schedule() {
      clearTimeout(timer);
      var slide = slides[current];
      var video = slide.querySelector("video");
      slides.forEach(function (s) {
        var v = s.querySelector("video");
        if (v && s !== slide) { v.pause(); }
      });
      if (video) {
        try { video.currentTime = 0; } catch (e) {}
        var play = video.play();
        if (play && play.catch) play.catch(function () {});
        var dur = isFinite(video.duration) && video.duration > 1 ? video.duration * 1000 : 15000;
        startGauge(dur);
        timer = setTimeout(next, dur + 200);
        video.onended = function () { next(); };
        video.onloadedmetadata = function () {
          if (slides[current] !== slide) return;
          clearTimeout(timer);
          var d = video.duration * 1000;
          startGauge(Math.max(1000, d - video.currentTime * 1000));
          timer = setTimeout(next, d - video.currentTime * 1000 + 200);
        };
      } else {
        startGauge(SLIDE_MS);
        timer = setTimeout(next, SLIDE_MS);
      }
    }
    function markActive() {
      current = realIndex(pos);
      slides.forEach(function (s, i) {
        s.classList.toggle("is-active", i === current);
        s.inert = i !== current; // off-screen slides can't take focus (and scroll the slider)
      });
      btns.forEach(function (b, i) {
        b.classList.toggle("is-active", i === current);
        b.setAttribute("aria-current", i === current ? "true" : "false");
      });
      btns[current].after(gauge);
      schedule();
    }
    // after landing on a clone, jump to its real twin without animation
    var fixTimer = null;
    function normalize() {
      clearTimeout(fixTimer);
      if (pos === 0) { pos = n; place(false); }
      else if (pos === n + 1) { pos = 1; place(false); }
    }
    function moveTo(p) {
      pos = p;
      place(!reduce);
      markActive();
      clearTimeout(fixTimer);
      if (reduce) normalize();
      else fixTimer = setTimeout(normalize, 1000); // in case transitionend never fires
    }
    function go(i) { moveTo(i + 1); }
    function next() { moveTo(pos + 1); }
    function prev() { moveTo(pos - 1); }

    track.addEventListener("transitionend", function (e) {
      if (e.target === track) normalize();
    });

    root.querySelector(".hs__arrow--prev").addEventListener("click", prev);
    root.querySelector(".hs__arrow--next").addEventListener("click", next);
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    });

    // drag / swipe
    var startX = 0, startY = 0, dx = 0, dragging = false, moved = false, base = 0;
    track.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      if (pos === 0 || pos === n + 1) {
        pos = pos === 0 ? n : 1;
        place(false);
      }
      dragging = true;
      moved = false;
      startX = e.clientX;
      startY = e.clientY;
      dx = 0;
      base = -pos * root.clientWidth;
      clearTimeout(timer);
    });
    window.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(e.clientY - startY)) {
        moved = true;
        track.classList.add("is-dragging");
        try { track.setPointerCapture(e.pointerId); } catch (err) {}
      }
      if (moved) setX(base + dx, false);
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      track.classList.remove("is-dragging");
      if (!moved) { schedule(); return; }
      var limit = Math.min(140, root.clientWidth * 0.12);
      if (dx < -limit) next();
      else if (dx > limit) prev();
      else { place(true); schedule(); }
    }
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    // a drag must not trigger the link underneath
    track.addEventListener("click", function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);

    root.addEventListener("scroll", function () { root.scrollLeft = 0; });
    window.addEventListener("resize", function () { place(false); });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        clearTimeout(timer);
        bar.style.transition = "none";
      } else {
        schedule();
      }
    });

    place(false);
    markActive();
  }

  /* ---------- business ---------- */
  function businessList(data) {
    var list = data.business && data.business.length ? data.business : BUSINESS_DEFAULT;
    return list.map(function (b) {
      var d = BUSINESS_DEFAULT.filter(function (x) { return x.id === b.id; })[0] || {};
      return Object.assign({}, d, b);
    });
  }

  function renderBusinessCards(data) {
    var grid = document.getElementById("biz-grid");
    if (!grid) return;
    grid.innerHTML = businessList(data).map(function (b, i) {
      return '<a class="biz-card" href="' + esc(b.id) + '.html">' +
        '<span class="biz-card__num">' + pad2(i + 1) + "</span>" +
        '<span class="biz-card__label">' + esc(b.label) + "</span>" +
        '<h3 class="biz-card__title">' + esc(b.title) + "</h3>" +
        '<p class="biz-card__lead">' + esc(b.lead) + "</p>" +
        '<span class="biz-card__go">' + ARROW + "</span></a>";
    }).join("");
  }

  function renderBusinessPage(data) {
    var id = document.body.getAttribute("data-business");
    if (!id) return;
    var list = businessList(data);
    var idx = -1;
    list.forEach(function (b, i) { if (b.id === id) idx = i; });
    if (idx < 0) return;
    var b = list[idx];
    var set = function (sel, val) {
      var el = document.querySelector(sel);
      if (el && val) el.textContent = val;
    };
    set("[data-b='num']", pad2(idx + 1));
    set("[data-b='label']", b.label);
    set("[data-b='title']", b.label);
    set("[data-b='ko']", b.title);
    set("[data-b='lead']", b.lead);
    set("[data-b='word']", b.label);
    var kw = document.querySelector("[data-b='keywords']");
    if (kw && b.keywords && b.keywords.length) {
      kw.innerHTML = b.keywords.map(function (k) { return "<li>" + esc(k) + "</li>"; }).join("");
    }
    var hero = document.querySelector(".bhero");
    if (hero && b.image && !hero.querySelector(".bhero__img")) {
      var img = document.createElement("img");
      img.className = "bhero__img";
      img.alt = "";
      img.src = b.image;
      hero.insertBefore(img, hero.firstChild);
    }
    var others = document.getElementById("biz-grid");
    if (others) renderBusinessCards(data);
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

  function workCard(w) {
    var a = document.createElement("a");
    a.className = "work";
    a.setAttribute("data-status", w.status || "released");
    a.setAttribute("data-id", w.id);
    a.setAttribute("role", "button");
    a.setAttribute("tabindex", "0");
    a.href = "#" + w.id;
    a.innerHTML =
      '<div class="work__thumb"><img loading="lazy" alt="' +
      esc(w.title) +
      '" src="' + esc(w.image || "") + '"></div>' +
      '<div class="work__row"><h3>' + esc(w.title) + "</h3>" +
      '<span class="work__arrow" aria-hidden="true">&rarr;</span></div>' +
      '<p class="work__date">' + esc(w.dateLabel || "") + "</p>" +
      (w.format ? '<span class="work__tag">' + esc(w.format) + "</span>" : "");
    a.addEventListener("click", function (e) {
      e.preventDefault();
      openModal(w);
    });
    a.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModal(w);
      }
    });
    return a;
  }

  function renderWorks(data) {
    var grid = document.getElementById("works-grid");
    if (!grid) return;
    var works = data.works || [];
    var featured = grid.hasAttribute("data-featured");
    if (featured) {
      var ids = (data.home && data.home.featuredIds) || [];
      if (ids.length) {
        works = ids.map(function (id) { return byId(works, id); }).filter(Boolean);
      } else {
        works = works.slice(0, (data.home && data.home.featuredCount) || 5);
      }
    } else {
      works = works.slice().sort(function (a, b) {
        return (!!a.sortLast - !!b.sortLast) || (b.year || 0) - (a.year || 0);
      });
    }
    grid.innerHTML = "";
    works.forEach(function (w) {
      grid.appendChild(workCard(w));
    });

    // filters
    var filterBar = document.querySelector("[data-filters]");
    if (filterBar && !featured) {
      filterBar.addEventListener("click", function (e) {
        var btn = e.target.closest("button[data-filter]");
        if (!btn) return;
        filterBar.querySelectorAll("button").forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        var f = btn.getAttribute("data-filter");
        var shown = 0;
        grid.querySelectorAll(".work").forEach(function (card) {
          var ok = f === "all" || card.getAttribute("data-status") === f;
          card.classList.toggle("is-hidden", !ok);
          if (ok) shown++;
        });
        var empty = document.getElementById("works-empty");
        if (empty) empty.hidden = shown !== 0;
      });
    }

    // view toggle (gallery / list)
    var viewBar = document.querySelector("[data-view]");
    if (viewBar) {
      viewBar.addEventListener("click", function (e) {
        var btn = e.target.closest("button[data-viewmode]");
        if (!btn) return;
        viewBar.querySelectorAll("button").forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        grid.classList.toggle(
          "works-grid--list",
          btn.getAttribute("data-viewmode") === "list"
        );
      });
    }

    // deep link (#steelrain)
    if (!featured && location.hash.length > 1) {
      var target = byId(data.works, location.hash.slice(1));
      if (target) openModal(target);
    }
  }

  /* ---------- modal ---------- */
  var modalEl;
  function ensureModal() {
    if (modalEl) return modalEl;
    modalEl = document.createElement("div");
    modalEl.className = "modal";
    modalEl.innerHTML =
      '<button class="modal__close" aria-label="닫기">&times;</button>' +
      '<div class="modal__card">' +
      '<div class="modal__media" id="modal-media"></div>' +
      '<div class="modal__body">' +
      '<p class="modal__eyebrow" id="modal-eyebrow"></p>' +
      '<h2 class="modal__title" id="modal-title"></h2>' +
      '<p class="modal__synopsis" id="modal-synopsis"></p>' +
      '<dl class="modal__credits" id="modal-credits"></dl>' +
      '<nav class="modal__links" id="modal-links" aria-label="관련 링크"></nav>' +
      "</div></div>";
    document.body.appendChild(modalEl);
    function close() {
      if (!modalEl.classList.contains("is-open")) return;
      modalEl.classList.remove("is-open");
      document.getElementById("modal-media").innerHTML = "";
      document.body.style.overflow = "";
      if (location.hash) history.replaceState(null, "", location.pathname);
    }
    modalEl.querySelector(".modal__close").addEventListener("click", close);
    modalEl.addEventListener("click", function (e) {
      if (e.target === modalEl) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
    return modalEl;
  }

  function openModal(w) {
    ensureModal();
    var media = document.getElementById("modal-media");
    var emb = videoEmbed(w.video);
    if (emb && emb.type === "iframe") {
      media.innerHTML =
        '<iframe src="' + esc(emb.src) +
        '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
    } else if (emb && emb.type === "video") {
      media.innerHTML = '<video src="' + esc(emb.src) + '" controls playsinline></video>';
    } else {
      media.innerHTML = '<img alt="' + esc(w.title) + '" src="' + esc(w.image || "") + '">';
    }
    document.getElementById("modal-eyebrow").textContent =
      (w.format ? w.format + " · " : "") + (w.dateLabel || "");
    document.getElementById("modal-title").innerHTML =
      esc(w.title) +
      (w.titleEn ? '<span class="modal__title-en">' + esc(w.titleEn) + "</span>" : "");
    document.getElementById("modal-synopsis").textContent = w.synopsis || "";
    var dl = document.getElementById("modal-credits");
    dl.innerHTML = "";
    var cr = w.credits || {};
    Object.keys(cr).forEach(function (k) {
      if (!cr[k]) return;
      var d = document.createElement("div");
      d.innerHTML = "<dt>" + esc(k) + "</dt><dd>" + esc(cr[k]) + "</dd>";
      dl.appendChild(d);
    });

    var lw = document.getElementById("modal-links");
    lw.innerHTML = "";
    (w.links || []).forEach(function (ln) {
      if (!ln || !ln.url) return;
      var a = document.createElement("a");
      a.href = ln.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "modal__link";
      a.innerHTML = esc(ln.label || ln.url) + ' <span aria-hidden="true">&#8599;</span>';
      lw.appendChild(a);
    });
    modalEl.classList.add("is-open");
    document.body.style.overflow = "hidden";
    if (!document.getElementById("hs")) history.replaceState(null, "", "#" + w.id);
  }

  /* ---------- about / contact / footer ---------- */
  function fillParas(id, arr) {
    var el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = "";
    (arr || []).forEach(function (p) {
      var n = document.createElement("p");
      n.textContent = p;
      el.appendChild(n);
    });
  }
  function fillItems(id, arr) {
    var el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = "";
    (arr || []).forEach(function (t) {
      var li = document.createElement("li");
      li.textContent = t;
      el.appendChild(li);
    });
  }
  function fillDefs(id, pairs) {
    var el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = "";
    (pairs || []).forEach(function (p) {
      if (p[0] == null && p[1] == null) return;
      var d = document.createElement("div");
      d.innerHTML = "<dt>" + esc(p[0]) + "</dt><dd>" + esc(p[1]) + "</dd>";
      el.appendChild(d);
    });
  }
  function fillLinkList(id, arr) {
    var el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = "";
    (arr || []).forEach(function (ln) {
      if (!ln || !ln.url) return;
      var a = document.createElement("a");
      a.href = ln.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "modal__link";
      a.innerHTML = esc(ln.label || ln.url) + ' <span aria-hidden="true">&#8599;</span>';
      el.appendChild(a);
    });
  }

  function fillPartners(arr) {
    var el = document.getElementById("about-partners");
    if (!el) return;
    var list = (arr || []).filter(function (p) { return p && p.name; });
    var wrap = document.getElementById("about-partners-wrap");
    if (wrap) wrap.hidden = list.length === 0;
    el.innerHTML = "";
    list.forEach(function (p) {
      var li = document.createElement("li");
      li.className = "partner";
      if (p.logo) {
        var img = document.createElement("img");
        img.src = p.logo;
        img.alt = p.name;
        img.loading = "lazy";
        li.appendChild(img);
      } else {
        li.textContent = p.name;
      }
      el.appendChild(li);
    });
  }

  function renderAbout(data) {
    var a = data.about;
    if (a) {
      fillParas("about-greeting", a.greeting);
      fillParas("about-profile", a.profile);
      fillParas("about-vision", a.vision);
      fillItems("about-business", a.currentBusiness);
      fillDefs("about-facts", (a.facts || []).map(function (f) { return [f.k, f.v]; }));
      fillDefs("about-recognition", (a.recognition || []).map(function (r) { return [r.year, r.text]; }));
      fillLinkList("about-press", a.press);
      fillPartners(a.partners);
    }
    var c = data.contact || {};
    var inq = document.getElementById("contact-inquiries");
    if (inq) {
      inq.innerHTML = "";
      (c.inquiries || []).forEach(function (t) {
        var p = document.createElement("p");
        p.textContent = t;
        inq.appendChild(p);
      });
    }
    ["contact-offices", "ft-offices"].forEach(function (id) {
      var off = document.getElementById(id);
      if (!off || !c.offices) return;
      off.innerHTML = "";
      c.offices.forEach(function (o) {
        if (!o || (!o.label && !o.address)) return;
        var p = document.createElement("p");
        p.innerHTML = "<b>" + esc(o.label) + "</b>&nbsp;&nbsp;" + esc(o.address);
        off.appendChild(p);
      });
    });
  }

  /* ---------- reveal ---------- */
  function initReveal() {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var items = document.querySelectorAll(".reveal");
    if (reduce || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- boot ---------- */
  function boot() {
    initHeader();
    fetch(CONTENT_URL, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("content " + r.status);
        return r.json();
      })
      .then(function (data) {
        window.__content = data;
        applyTheme(data.theme);
        applyFields(data);
        renderHero(data);
        renderBusinessCards(data);
        renderBusinessPage(data);
        renderWorks(data);
        renderAbout(data);
      })
      .catch(function (err) {
        console.error("[GOLDSTREAM] content load failed:", err);
      })
      .finally(initReveal);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
