/* ARTIST page: actor cards, and a full-screen profile that opens from a card (artist.html#id). */
(function () {
  "use strict";
  var IMG = "assets/img/artist/";
  var ARTISTS = [
    {
      id: "kim-jihyeok",
      ko: "김지혁",
      en: "KIM JI HYEOK",
      cover: IMG + "kim/cover.webp",
      gallery: ["g02", "g03", "g04", "g05", "g06", "g07", "g08", "g01"].map(function (g) { return IMG + "kim/" + g + ".webp"; }),
      info: [["출생", "2006"], ["신체", "183cm · 73kg"], ["학력", "성균관대학교 연기예술학과 재학"], ["특기", "현대무용 · 영어회화 · 농구"]],
      blocks: [],
      sns: [["Instagram", "@ji_hyeok1", "https://www.instagram.com/ji_hyeok1/"]]
    },
    {
      id: "seo-suyeon",
      ko: "서수연",
      en: "SEO SU YEOUN",
      cover: IMG + "seo/cover.webp",
      gallery: ["g02", "g04", "g01", "g05", "g06", "g07"].map(function (g) { return IMG + "seo/" + g + ".webp"; }),
      info: [["출생", "1974"], ["신체", "164cm · 52kg"], ["학력", "경희대학교 간호학과 · 단국대학교 의과대학"], ["특기", "피아노 · 기타 · 가야금 · 골프 · 승마 · 당구"]],
      blocks: [
        ["주요 활동", [
          ["2017", "음반 〈리즈〉 발매 · 타이틀곡 〈거기그곳〉"],
          ["2016", "국제미용경기대회 페이스아트·반영구 부문 최우수상 (국회의원상)"],
          ["2012", "뮤지컬 〈힐링하트〉 주인공 ‘박가은’ 역"],
          ["2000", "전국노래자랑 신안군편 최우수상"],
          ["1986", "전국 학생국악경연대회 판소리 부문 장려상 · 전국웅변대회 특등상 (국회의원상)"]
        ]],
        ["경력", [["", "외과전문의 · 건국대학교 의학전문대학원 외래부교수"], ["", "청담에이스 피부성형외과 대표원장"]]],
        ["자격", [["", "바리스타 2급 · 와인 소믈리에 2급 · 정리수납전문가 1급"], ["", "로푸드 요리지도사 · 대한파크골프연맹 2급 지도자"]]]
      ],
      sns: [
        ["YouTube", "@닥터플렉스서원장", "https://www.youtube.com/@%EB%8B%A5%ED%84%B0%ED%94%8C%EB%A0%89%EC%8A%A4%EC%84%9C%EC%9B%90%EC%9E%A5"],
        ["Instagram", "@grace.samjung.ee", "https://www.instagram.com/grace.samjung.ee/"]
      ]
    }
  ];

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function byId(id) { for (var i = 0; i < ARTISTS.length; i++) if (ARTISTS[i].id === id) return ARTISTS[i]; return null; }

  /* cards */
  var grid = document.getElementById("ar-grid");
  grid.innerHTML = ARTISTS.map(function (a, i) {
    return '<a class="ar-card" href="#' + a.id + '" style="--i:' + i + '">' +
      '<span class="ar-card__img"><img src="' + esc(a.cover) + '" alt="' + esc(a.ko) + '" loading="lazy"></span>' +
      '<span class="ar-card__row"><b>' + esc(a.ko) + '</b><i aria-hidden="true">→</i></span>' +
      '<span class="ar-card__en">' + esc(a.en) + "</span></a>";
  }).join("");
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12 }) : null;
  grid.querySelectorAll(".ar-card").forEach(function (c) { io ? io.observe(c) : c.classList.add("in"); });

  /* profile */
  var dt = document.getElementById("ar-dt");
  var lastFocus = null;
  function render(a) {
    var rows = a.info.map(function (r) { return "<div><dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("");
    var blocks = a.blocks.map(function (b) {
      return '<section class="ar-dt__blk"><h3>' + esc(b[0]) + "</h3><ul>" + b[1].map(function (it) {
        return "<li>" + (it[0] ? "<b>" + esc(it[0]) + "</b>" : "") + "<span>" + esc(it[1]) + "</span></li>";
      }).join("") + "</ul></section>";
    }).join("");
    var sns = a.sns.map(function (s) {
      return '<a href="' + esc(s[2]) + '" target="_blank" rel="noopener"><small>' + esc(s[0]) + "</small>" + esc(s[1]) + " ↗</a>";
    }).join("");
    dt.innerHTML =
      '<div class="ar-dt__bar"><span>ARTIST</span><button type="button" class="ar-dt__x" aria-label="닫기">닫기 <i>×</i></button></div>' +
      '<div class="ar-dt__in">' +
        '<div class="ar-dt__top">' +
          '<div class="ar-dt__cover"><img src="' + esc(a.cover) + '" alt="' + esc(a.ko) + '"></div>' +
          '<div class="ar-dt__txt">' +
            '<p class="ar-dt__k">ACTOR</p>' +
            '<h2 id="ar-dt-name">' + esc(a.ko) + "</h2>" +
            '<p class="ar-dt__en">' + esc(a.en) + "</p>" +
            '<dl class="ar-dt__info">' + rows + "</dl>" +
            blocks +
            (sns ? '<div class="ar-dt__sns">' + sns + "</div>" : "") +
            '<a class="ar-dt__cta" href="contact.html">캐스팅 · 출연 문의 <i>→</i></a>' +
          "</div>" +
        "</div>" +
        '<div class="ar-dt__gal">' + a.gallery.map(function (g) {
          return '<figure><img src="' + esc(g) + '" alt="' + esc(a.ko) + ' 프로필 사진" loading="lazy"></figure>';
        }).join("") + "</div>" +
      "</div>";
    dt.querySelector(".ar-dt__x").addEventListener("click", close);
  }
  function open(a) {
    lastFocus = document.activeElement;
    render(a);
    dt.hidden = false;
    dt.scrollTop = 0;
    document.documentElement.classList.add("ar-lock");
    requestAnimationFrame(function () { dt.classList.add("is-open"); });
    dt.querySelector(".ar-dt__x").focus({ preventScroll: true });
    document.title = a.ko + " | 골드스트림엔터테인먼트";
  }
  function hide() {
    dt.classList.remove("is-open");
    document.documentElement.classList.remove("ar-lock");
    setTimeout(function () { if (!dt.classList.contains("is-open")) dt.hidden = true; }, 400);
    document.title = "아티스트 | 골드스트림엔터테인먼트";
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  function close() {
    if (location.hash) {
      try { history.pushState("", document.title, location.pathname + location.search); }
      catch (e) { location.hash = ""; return; } // hashchange closes it
    }
    hide();
  }
  function route() {
    var a = byId(decodeURIComponent(location.hash.slice(1)));
    a ? open(a) : (dt.classList.contains("is-open") && hide());
  }
  window.addEventListener("hashchange", route);
  window.addEventListener("popstate", route);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && dt.classList.contains("is-open")) close(); });
  route();
})();
