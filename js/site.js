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
      id: "campaign", label: "CAMPAIGN", title: "캠페인·홍보물 제작",
      lead: "포스터, 명함, 현수막부터 차량 래핑, SNS 영상까지. 캠페인에 필요한 모든 홍보물을 기획부터 설치까지 한 번에 제작합니다.",
      keywords: []
    },
    {
      id: "sponsorship", label: "BRAND & SPONSORSHIP", title: "브랜드·협찬",
      lead: "협찬이 필요한 제작사와 콘텐츠로 브랜드를 알리고 싶은 기업을 연결합니다.",
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
    // --gold-bright / --gold-soft / --gold-line stay as defined in style.css (light theme uses ink for "active")
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
        : '<canvas class="hs__ribbon" aria-hidden="true"></canvas>') +
      '<h1 class="sr-only">' + esc(home.heroTitle || "GOLDSTREAM ENTERTAINMENT") + "</h1>";
    if (!video) {
      el.setAttribute("data-dur", String(RIBBON_MS));
      ribbonIntro(el.querySelector("canvas"), el, home.heroTagline || "이야기를 현실로 만듭니다");
    }
    return el;
  }

  /* Intro motion: a ribbon of fine lines twists through the frame like film turning in light,
     then the logo and tagline settle in. One pass = RIBBON_MS; restarts whenever the slide is shown. */
  var RIBBON_MS = 11000;
  function ribbonIntro(canvas, slide, tag) {
    var x = canvas.getContext("2d"), W = 0, H = 0, t0 = performance.now(), raf = 0;
    var logo = new Image();
    logo.src = "assets/img/logo-goldstream-dark.png";
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
    var ease = function (v) { v = clamp(v); return v * v * (3 - 2 * v); };
    function size() {
      var d = Math.min(window.devicePixelRatio || 1, 2);
      W = slide.clientWidth; H = slide.clientHeight;
      canvas.width = W * d; canvas.height = H * d;
      x.setTransform(d, 0, 0, d, 0, 0);
    }
    function draw(t) {
      var hd = document.getElementById("hd"), top = hd ? hd.offsetHeight : 0;
      var cy = top + (H - top) * .5;
      var lw = Math.min(W * .62, 540), lh = lw * 170 / 774;
      var reveal = reduce ? 1 : ease(t / 3), fade = reduce ? 1 : 1 - ease((t - 9.6) / 1.4);
      var front = -60 + (W + 120) * reveal, A = Math.min(H, W) * .12, R = Math.min(H, W) * .2;
      var band = cy + lh * .2, N = 70;
      x.fillStyle = "#fafaf8"; x.fillRect(0, 0, W, H);
      for (var i = 0; i < N; i++) {
        var o = i / (N - 1) - .5;
        x.beginPath();
        for (var X = -60; X <= front; X += 5) {
          var y = band + Math.sin(X * .0026 + t * .4) * A + o * R * Math.cos(X * .0019 - t * .55);
          X === -60 ? x.moveTo(X, y) : x.lineTo(X, y);
        }
        var v = Math.round(25 + 145 * Math.abs(o) * 2);
        x.strokeStyle = "rgba(" + v + "," + v + "," + (v + 6) + "," + (.5 - Math.abs(o) * .55) * fade + ")";
        x.lineWidth = .8; x.stroke();
      }
      var la = reduce ? 1 : ease((t - 3.6) / 1.4) * fade;
      if (la > 0) {
        var g = x.createRadialGradient(W / 2, cy, 0, W / 2, cy, lw * .75);
        g.addColorStop(0, "rgba(250,250,248," + .92 * la + ")"); g.addColorStop(1, "rgba(250,250,248,0)");
        x.fillStyle = g; x.fillRect(0, 0, W, H);
        if (logo.complete && logo.naturalWidth) {
          x.globalAlpha = la;
          x.drawImage(logo, W / 2 - lw / 2, cy - lh * .6 + (1 - la) * 14, lw, lh);
          x.globalAlpha = 1;
        }
      }
      var ta = reduce ? 1 : ease((t - 4.6) / 1.2) * fade;
      if (ta > 0 && tag) {
        var fs = Math.max(12, lw * .028);
        x.globalAlpha = ta; x.fillStyle = "#555"; x.textAlign = "center";
        x.font = "500 " + fs + "px 'Pretendard Variable', sans-serif";
        if ("letterSpacing" in x) x.letterSpacing = ".38em";
        x.fillText(tag, W / 2 + fs * .19, cy + lh * .85);
        x.globalAlpha = 1;
      }
    }
    function loop(n) {
      draw((n - t0) / 1000);
      raf = slide.classList.contains("is-active") ? requestAnimationFrame(loop) : 0;
    }
    function restart() {
      size();
      t0 = performance.now();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    }
    slide._onActive = restart;
    window.addEventListener("resize", function () { if (raf) size(); });
  }

  function workSlide(w) {
    var el = document.createElement("div");
    el.className = "hs__slide" + (w.heroImage ? " hs__slide--wide" : "");
    var poster = w.image || "";
    el.innerHTML =
      (w.heroImage
        ? // wide photo on desktop; phones keep the vertical poster until a mobile cut exists
          '<picture class="hs__wide"><source media="(min-width: 861px)" srcset="' + esc(w.heroImage) + '">' +
          '<img src="' + esc(poster || w.heroImage) + '" alt="" draggable="false"' +
          // heroPos keeps faces in frame when the wide crop trims top/bottom (e.g. "50% 0%")
          (w.heroPos ? ' style="object-position:' + esc(w.heroPos) + '"' : "") + "></picture>"
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
      : ["code", "pine", "mungmungi", "steelrain2", "steelrain", "suanara", "demonkiller"];
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
        var ms = +slide.getAttribute("data-dur") || SLIDE_MS;
        if (slide._onActive) slide._onActive();
        startGauge(ms);
        timer = setTimeout(next, ms);
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
      // full-bleed photo slides carry white type, so the pager flips to light too
      root.classList.toggle("is-dark", slides[current].classList.contains("hs__slide--wide"));
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
      return '<a class="biz-card" href="' + (b.id === "production" ? "works" : esc(b.id)) + '.html">' +
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
    var all = function (key) { return document.querySelectorAll("[data-b='" + key + "']"); };
    var text = function (key, val, multi) {
      all(key).forEach(function (el) {
        if (!val) return;
        if (multi) el.innerHTML = esc(val).replace(/\n/g, "<br>");
        else el.textContent = val;
      });
    };
    var show = function (sec, on) {
      var s = document.querySelector("[data-sec='" + sec + "']");
      if (s) s.hidden = !on;
    };
    var num = function (i) { return '<span class="bx-num">' + pad2(i + 1) + "</span>"; };
    var pic = function (src, cls) {
      return src ? '<span class="' + cls + '"><img loading="lazy" src="' + esc(src) + '" alt=""></span>' : "";
    };

    text("label", b.label + " — " + b.title);
    text("headline", b.headline || b.title, true);
    text("lead", b.lead);
    text("ctaButton", b.ctaButton || "문의하기");
    text("typesTitle", b.typesTitle);
    text("servicesTitle", b.servicesTitle);
    text("whyTitle", b.whyTitle, true);
    text("cta", b.cta, true);

    var media = all("image")[0];
    if (media && b.image) {
      media.innerHTML = '<img src="' + esc(b.image) + '" alt="">';
      media.hidden = false;
    }

    var types = b.types || [];
    all("types").forEach(function (el) {
      el.innerHTML = types.map(function (t, i) {
        return '<article class="bx-type' + (t.image ? " has-img" : "") + '">' + pic(t.image, "bx-type__img") +
          '<div class="bx-type__body">' + num(i) +
          "<h3>" + esc(t.title) + "</h3><p class=\"bx-en\">" + esc(t.en || "") + "</p><p>" + esc(t.desc || "") + "</p></div></article>";
      }).join("");
    });
    show("types", types.length > 0);

    // two-sided intro (e.g. for producers / for brands)
    var paths = b.paths || [];
    text("pathsTitle", b.pathsTitle, true);
    all("paths").forEach(function (el) {
      el.innerHTML = paths.map(function (p) {
        return '<article class="bx-path"><p class="bx-k">' + esc(p.en || "") + "</p><h3>" + esc(p.title) + "</h3>" +
          "<p>" + esc(p.desc || "") + "</p>" +
          ((p.points || []).length ? '<ul class="bx-checks">' + p.points.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" : "") +
          "</article>";
      }).join("");
    });
    show("paths", paths.length > 0);

    var cards = function (list) {
      return list.map(function (s, i) {
        return '<article class="bx-card">' + pic(s.image, "bx-card__img") + num(i) +
          "<h3>" + esc(s.title) + "</h3><p>" + esc(s.desc || "") + "</p></article>";
      }).join("");
    };
    var cols = function (n) { return n % 3 === 0 ? 3 : n % 4 === 0 ? 4 : 3; };
    var svc = b.services || [];
    all("services").forEach(function (el) {
      el.style.setProperty("--cols", cols(svc.length));
      el.innerHTML = cards(svc);
    });
    show("services", svc.length > 0);
    text("note", b.note);

    var extras = b.extras || [];
    text("extrasTitle", b.extrasTitle, true);
    all("extras").forEach(function (el) {
      el.style.setProperty("--cols", cols(extras.length));
      el.innerHTML = cards(extras);
    });
    show("extras", extras.length > 0);

    var steps = b.process || [];
    all("process").forEach(function (el) {
      el.innerHTML = steps.map(function (s, i) {
        return "<li>" + num(i) + "<span>" + esc(s) + "</span></li>";
      }).join("");
    });
    show("process", steps.length > 0);

    var why = b.why || [];
    all("why").forEach(function (el) {
      el.innerHTML = why.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("");
    });
    show("why", why.length > 0);
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

  /* ---------- WORK page: featured work on top, all works below ---------- */
  function isFilm(w) {
    return /영화|film/i.test(w.format || "");
  }
  function orderedWorks(data) {
    // order = content.json order (admin ↑↓); "sortLast" works go to the end
    return (data.works || []).map(function (w, i) { return { w: w, i: i }; })
      .sort(function (a, b) { return (!!a.w.sortLast - !!b.w.sortLast) || a.i - b.i; })
      .map(function (x) { return x.w; });
  }

  function renderWorkPage(data) {
    var hero = document.getElementById("wk-hero");
    var grid = document.getElementById("wk-grid");
    if (!hero || !grid) return;
    var works = orderedWorks(data);
    if (!works.length) return;
    var latest = works[0];
    var current = null;
    var count = document.getElementById("wk-count");
    if (count) count.textContent = "ALL WORKS — " + pad2(works.length);

    function feature(w, scroll) {
      current = w;
      var cr = w.credits || {};
      var plat = String(cr["플랫폼"] || "").replace(/\(.*?\)/g, "").trim();
      var dir = String(cr["감독"] || "").trim();
      var cast = String(cr["출연"] || "").split(",").map(function (s) { return s.trim(); })
        .filter(function (s) { return s && s !== "-"; }).slice(0, 4).join(", ");
      var label = [w === latest ? "LATEST" : "", w.status === "upcoming" ? "COMING " + w.year : w.year,
        w.format, plat !== "-" ? plat : ""].filter(Boolean).map(esc).join(" · ");
      var emb = videoEmbed(w.video);
      hero.classList.remove("is-in");
      hero.innerHTML =
        '<div class="wk-hero__bg" style="background-image:url(&quot;' + esc(w.image || "") + '&quot;)"></div>' +
        '<div class="wk-hero__in wrap">' +
        '<img class="wk-hero__poster" src="' + esc(w.image || "") + '" alt="' + esc(w.title) + ' 포스터">' +
        '<div class="wk-hero__body">' +
        '<p class="wk-hero__label">' + label + "</p>" +
        '<h2 class="wk-hero__title">' + esc(w.title) + "</h2>" +
        (w.titleEn ? '<p class="wk-hero__en">' + esc(w.titleEn) + "</p>" : "") +
        (w.synopsis ? '<p class="wk-hero__syn">' + esc(w.synopsis) + "</p>" : "") +
        '<dl class="wk-hero__cr">' +
        (dir && dir !== "-" ? "<div><dt>DIRECTOR</dt><dd>" + esc(dir) + "</dd></div>" : "") +
        (cast ? "<div><dt>CAST</dt><dd>" + esc(cast) + "</dd></div>" : "") +
        "</dl>" +
        '<div class="wk-hero__btns">' +
        '<button type="button" class="wk-btn wk-btn--solid" data-act="info">작품 정보 ' + ARROW + "</button>" +
        (emb ? '<button type="button" class="wk-btn" data-act="trailer">예고편</button>' : "") +
        "</div></div></div>";
      hero.querySelectorAll("[data-act]").forEach(function (b) {
        b.addEventListener("click", function () { openModal(w); });
      });
      requestAnimationFrame(function () { hero.classList.add("is-in"); });
      grid.querySelectorAll(".wk-card").forEach(function (c) {
        var on = c.getAttribute("data-id") === w.id;
        c.classList.toggle("is-on", on);
        c.setAttribute("aria-current", on ? "true" : "false");
      });
      if (scroll) {
        history.replaceState(null, "", "#" + w.id);
        var top = hero.getBoundingClientRect().top + window.scrollY - (document.getElementById("hd") || { offsetHeight: 0 }).offsetHeight;
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      }
    }

    grid.innerHTML = "";
    works.forEach(function (w) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "wk-card";
      b.setAttribute("data-id", w.id);
      b.setAttribute("data-kind", isFilm(w) ? "film" : "series");
      b.innerHTML =
        '<span class="wk-card__thumb"><img loading="lazy" src="' + esc(w.image || "") + '" alt=""></span>' +
        '<span class="wk-card__title">' + esc(w.title) + "</span>" +
        '<span class="wk-card__meta">' + esc(w.status === "upcoming" ? "COMING " + w.year : w.year) +
        (w.format ? " · " + esc(w.format) : "") + "</span>";
      b.addEventListener("click", function () { feature(w, true); });
      grid.appendChild(b);
    });

    var bar = document.querySelector("[data-filters]");
    if (bar) bar.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-filter]");
      if (!btn) return;
      bar.querySelectorAll("button").forEach(function (x) {
        x.setAttribute("aria-pressed", x === btn ? "true" : "false");
      });
      var f = btn.getAttribute("data-filter");
      grid.querySelectorAll(".wk-card").forEach(function (c) {
        c.hidden = f !== "all" && c.getAttribute("data-kind") !== f;
      });
    });

    var fromHash = location.hash.length > 1 && byId(works, location.hash.slice(1));
    feature(fromHash || latest, false);
  }

  // home "SELECTED WORK" poster grid
  function renderWorks(data) {
    if (document.getElementById("wk-hero")) return renderWorkPage(data);
    var grid = document.getElementById("works-grid");
    if (!grid) return;
    var works = data.works || [];
    var ids = (data.home && data.home.featuredIds) || [];
    works = ids.length
      ? ids.map(function (id) { return byId(works, id); }).filter(Boolean)
      : orderedWorks(data).slice(0, (data.home && data.home.featuredCount) || 5);
    grid.innerHTML = "";
    works.forEach(function (w) {
      grid.appendChild(workCard(w));
    });
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

  // desktop: shrink the card until media + title + synopsis fit the first screen;
  // credits and links stay below for scrolling
  function fitModal() {
    if (!modalEl || !modalEl.classList.contains("is-open")) return;
    var card = modalEl.querySelector(".modal__card");
    var credits = document.getElementById("modal-credits");
    card.style.maxWidth = "";
    credits.style.marginTop = "";
    if (window.innerWidth < 861) return;
    var body = modalEl.querySelector(".modal__body");
    var syn = document.getElementById("modal-synopsis");
    var pad = parseFloat(getComputedStyle(modalEl).paddingTop) || 0;
    var fold = window.innerHeight - 40; // synopsis ends here, nothing else peeks in
    var maxW = Math.min(1200, window.innerWidth - pad * 2 - 120);
    for (var i = 0; i < 3; i++) { // synopsis rewraps once the width changes
      var textH = syn.getBoundingClientRect().bottom - body.getBoundingClientRect().top;
      var mediaH = fold - pad - textH;
      card.style.maxWidth = Math.round(Math.max(480, Math.min(maxW, mediaH * 16 / 9))) + "px";
    }
    // if the width hit a limit, push the credits below the fold instead
    var gap = window.innerHeight - syn.getBoundingClientRect().bottom;
    if (gap > 0) credits.style.marginTop = Math.max(26, gap + 32) + "px";
  }
  window.addEventListener("resize", fitModal);

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
      // no trailer: the 16:9 hero image fills the frame; a bare poster is letterboxed
      media.innerHTML = w.heroImage
        ? '<img class="is-wide" alt="' + esc(w.title) + '" src="' + esc(w.heroImage) + '">'
        : '<img alt="' + esc(w.title) + '" src="' + esc(w.image || "") + '">';
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
    modalEl.scrollTop = 0;
    fitModal();
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
        p.innerHTML = "<b>" + esc(o.label) + "</b>" + (id === "ft-offices" ? "" : "&nbsp;&nbsp;") + esc(o.address);
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
