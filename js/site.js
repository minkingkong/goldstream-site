/* GOLDSTREAM — front-end renderer
   Reads data/content.json and populates pages. No build step. */
(function () {
  "use strict";

  var CONTENT_URL = "data/content.json?t=" + Date.now();

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
      accent: "--violet",
      ink: "--ink",
      inkMuted: "--ink-muted",
      bg: "--bg",
      heroFrom: "--violet-hero-1",
      heroTo: "--violet-hero-2"
    };
    Object.keys(map).forEach(function (k) {
      if (t[k]) s.setProperty(map[k], t[k]);
    });
    if (t.accent) {
      var soft = hexToRgba(t.accent, 0.1);
      if (soft) s.setProperty("--violet-soft", soft);
      s.setProperty("--violet-ink", shade(t.accent, -0.12));
    }
  }

  /* ---------- text / image fields ---------- */
  function applyFields(data) {
    document.querySelectorAll("[data-field]").forEach(function (el) {
      var v = get(data, el.getAttribute("data-field"));
      if (v == null || typeof v === "object") return;
      if (el.hasAttribute("data-mailto")) {
        el.textContent = v;
        el.setAttribute("href", "mailto:" + v);
      } else if (el.tagName === "IMG") {
        el.setAttribute("src", v);
      } else if (el.hasAttribute("data-multiline")) {
        el.innerHTML = esc(v).replace(/\n/g, "<br>");
      } else {
        el.textContent = v;
      }
    });
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
    if (w.image) {
      var thumb = a.querySelector(".work__thumb");
      if (thumb) thumb.style.setProperty("--thumb-img", 'url("' + w.image + '")');
    }
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
      var n = (data.home && data.home.featuredCount) || 3;
      works = works.slice(0, n);
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

    // deep link (#w2)
    if (location.hash.length > 1) {
      var target = works.filter(function (w) {
        return "#" + w.id === location.hash;
      })[0] || (data.works || []).filter(function (w) {
        return "#" + w.id === location.hash;
      })[0];
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
    history.replaceState(null, "", "#" + w.id);
  }

  /* ---------- about ---------- */
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
    }
    var inq = document.getElementById("contact-inquiries");
    if (inq && data.contact) {
      inq.innerHTML = "";
      (data.contact.inquiries || []).forEach(function (t) {
        var li = document.createElement("p");
        li.textContent = t;
        inq.appendChild(li);
      });
    }
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
    }, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });
    items.forEach(function (el) { io.observe(el); });
    setTimeout(function () {
      items.forEach(function (el) { el.classList.add("in"); });
    }, 3000);
  }

  /* ---------- boot ---------- */
  function boot() {
    fetch(CONTENT_URL, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("content " + r.status);
        return r.json();
      })
      .then(function (data) {
        window.__content = data;
        applyTheme(data.theme);
        applyFields(data);
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
