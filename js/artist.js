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
      cover: IMG + "seo/portrait.webp",
      gallery: ["g02", "g04", "g05", "g06", "g07"].map(function (g) { return IMG + "seo/" + g + ".webp"; }),
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

  /* every profile is shown in full on the page; the name row at the top jumps to each one */
  function profile(a) {
    var rows = a.info.map(function (r) { return "<div><dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("");
    var blocks = a.blocks.map(function (b) {
      return '<section class="ar-dt__blk"><h3>' + esc(b[0]) + "</h3><ul>" + b[1].map(function (it) {
        return "<li>" + (it[0] ? "<b>" + esc(it[0]) + "</b>" : "") + "<span>" + esc(it[1]) + "</span></li>";
      }).join("") + "</ul></section>";
    }).join("");
    var sns = a.sns.map(function (s) {
      return '<a href="' + esc(s[2]) + '" target="_blank" rel="noopener"><small>' + esc(s[0]) + "</small>" + esc(s[1]) + " ↗</a>";
    }).join("");
    return '<article class="ar-pf" id="' + a.id + '">' +
      '<div class="ar-dt__top">' +
        '<div class="ar-dt__cover"><img src="' + esc(a.cover) + '" alt="' + esc(a.ko) + '"></div>' +
        '<div class="ar-dt__txt">' +
          '<p class="ar-dt__k">ACTOR</p>' +
          "<h2>" + esc(a.ko) + "</h2>" +
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
    "</article>";
  }
  var list = document.getElementById("ar-grid");
  list.className = "ar-pfs";
  list.innerHTML =
    '<nav class="ar-idx" aria-label="배우 바로가기">' + ARTISTS.map(function (a) {
      return '<a href="#' + a.id + '"><b>' + esc(a.ko) + "</b><span>" + esc(a.en) + "</span></a>";
    }).join("") + "</nav>" +
    ARTISTS.map(profile).join("");
})();
