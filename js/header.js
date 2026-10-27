/* Shared top bar for the pages on the old styles (ABOUT, WORK, PARTNERS, CONTACT).
   Same behaviour as the home header in js/site.js: current page underline, white bar after scrolling,
   phone menu, KR / EN choice (remembered; these pages are Korean until the English copy is finished). */
(function () {
  "use strict";
  var hd = document.getElementById("nh");
  if (!hd) return;
  var LANG = "ko";
  try { LANG = localStorage.getItem("gs_lang") === "en" ? "en" : "ko"; } catch (e) {}

  var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  hd.querySelectorAll(".nh__nav a").forEach(function (a) {
    if (a.getAttribute("href").toLowerCase() === page) a.setAttribute("aria-current", "page");
  });
  var onScroll = function () { hd.classList.toggle("is-scrolled", window.scrollY > 24); };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  var burger = hd.querySelector(".nh__burger");
  var menu = document.createElement("nav");
  menu.className = "nmnav";
  menu.id = "nmnav";
  menu.setAttribute("aria-label", "모바일 메뉴");
  menu.innerHTML = Array.prototype.map.call(hd.querySelectorAll(".nh__nav a"), function (a) {
    var cur = a.getAttribute("aria-current") ? ' aria-current="page"' : "";
    return '<a href="' + a.getAttribute("href") + '"' + cur + ">" + a.textContent.trim() + "</a>";
  }).join("") + '<p class="nmnav__mail">kim@goldstream.kr</p>' +
    '<div class="nmnav__lang"><button type="button" data-lang="ko">KR</button><button type="button" data-lang="en">EN</button></div>';
  document.body.appendChild(menu);
  if (burger) burger.setAttribute("aria-controls", "nmnav");
  function setOpen(open) {
    hd.classList.toggle("is-open", open);
    menu.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    if (burger) {
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
    }
  }
  if (burger) burger.addEventListener("click", function () { setOpen(!menu.classList.contains("is-open")); });
  menu.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
  window.addEventListener("resize", function () { if (window.innerWidth > 860) setOpen(false); });

  document.querySelectorAll(".nh [data-lang], .nmnav [data-lang]").forEach(function (b) {
    b.classList.toggle("is-on", b.getAttribute("data-lang") === LANG);
    b.addEventListener("click", function () {
      var l = b.getAttribute("data-lang");
      if (l === LANG) return;
      try { localStorage.setItem("gs_lang", l); } catch (e) {}
      location.reload();
    });
  });
})();
