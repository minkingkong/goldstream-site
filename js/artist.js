/* ARTIST page: actors and artists, each profile shown in full; long career lists fold behind 더보기. */
(function () {
  "use strict";
  var IMG = "assets/img/artist/";
  var ARTISTS = [
    {
      id: "kim-jihyeok",
      ko: "김지혁",
      en: "KIM JI HYEOK",
      cover: IMG + "kim/cover.webp",
      type: "actor",
      info: [["분야", "배우"], ["학력", "성균관대학교 연기예술학과 재학"], ["출생", "2006"], ["신체", "183cm · 73kg"], ["특기", "현대무용 · 영어회화 · 농구"]],
      blocks: [],
      sns: [["Instagram", "@ji_hyeok1", "https://www.instagram.com/ji_hyeok1/"]]
    },
    {
      id: "seo-suyeon",
      ko: "서수연",
      en: "SEO SU YEOUN",
      cover: IMG + "seo/portrait.webp",
      type: "actor",
      info: [["분야", "배우"], ["학력", "경희대학교 간호학과 · 단국대학교 의과대학"], ["출생", "1974"], ["신체", "164cm · 52kg"], ["특기", "피아노 · 기타 · 가야금 · 골프 · 승마 · 당구"]],
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
    },
    {
      id: "kim-changdeok",
      type: "artist",
      ko: "김창덕",
      en: "KIM CHANG DEOK",
      alias: "다음(茶愔)",
      cover: IMG + "kcd/portrait.webp",
      intro: "꿀벌이 남긴 밀랍에 열을 더해 매화를 피워 내는 윤회매(輪廻梅) 작가입니다. 꽃이 꿀이 되고, 꿀이 밀랍이 되고, 밀랍이 다시 꽃이 되는 순환에서 이름을 얻었습니다. 조선 정조 때 이덕무가 찻자리에 두던 밀랍 매화를 오늘의 작품으로 잇고, 돌가루 도자에 윤회매를 꽂은 윤회도자화로 대한명인이 되었습니다.",
      info: [["분야", "윤회매 · 윤회도자화 · 선화(禪畵)"], ["학력", "동국대학교 불교대학원 불교미술사 전공"], ["호", "다음(茶愔)"], ["직함", "윤회매 문화관장 · 대한명인 (윤회도자화)"]],
      works: [["kcd/w1.webp", "윤회도자화 · 60×40cm · 석채"], ["kcd/w2.webp", "윤회도자화"], ["kcd/w3.webp", "윤회도자화"], ["kcd/w4.webp", "윤회도자화"]],
      credit: "작품·인물 사진 ⓒ광주인 · ⓒ광주아트가이드 · ⓒ포털 다음",
      blocks: [["전시 · 공연 경력", [["2023","서울 나우갤러리 개인전(청담동)"],["2023","진주문고 아트스페이스 개인전"],["2022","전주 우진문화공간 개인전"],["2021","부산 비비비당 개인전"],["2020","인천 송도 케이슨24 개인전"],["2020","서울 나우갤러리 개인전(청담동)"],["2019","제10회 광주국제아트페어(김대중컨벤션센터)"],["2018","화엄사성보박물관 윤회매 개인전"],["2018","평창동 화정박물관 윤회매 전시"],["2016","청담동 프리마갤러리 초대개인전"],["2016","리채 갤러리 윤회매 개인전"],["2016","무등산 coboc 전시"],["2015","밀라노 트리에날레 오픈 공연과 윤회매 전시"],["2015","광주 박물관 조선 청화전 윤회매 전시"],["2015","서울역사박물관 윤회매 전시"],["2014","춘천 국립박물관 윤회매 전시"],["2014","서울 국립중앙박물관 조선의 청화백자전 윤회매 전시"],["2014","광주 비엔날레 20주년 공연"],["2014","서울 평창동 가인갤러리 윤회매 개인전"],["2013","광주 국제 미디어아트 공연"],["2013","일본 가고시마 교류전(일본 가고시마)"],["2013","은암미술관 문양그룹전"],["2012","아시아문화전당 문화마루 공연"],["2012","전남대 아트스페이스 윤회매 전시"],["2011","광주 가고시마 교류전"],["2011","부산 불교 콘텐츠 문화원 윤회매 전시"],["2009","광주 디자인 비엔날레 공연, 전시"],["2008","사형폐지 예술제(명동성당)"],["2008","인혁당사건 추모제(불교역사박물관)"],["2007","영국 템즈페스티벌, 대영박물관 공연(한국 문화원)"],["2007","뉴욕 유엔본부 윤회매 전시(한국 공예문화 진흥원)"],["2006","전주소리문화전당 토요마당 공연"],["2005","한·베네수엘라 수교 40주년 기념공연(베네수엘라 카라카스)"],["2004","제10회 안성죽산국제예술제 〈테크노바라〉 공연"],["2004","영암왕인문화축제(구림 氣퍼포먼스) 〈禪香, 빛의 고요〉 기획 및 출연"],["2003","전주전통술박물관 관장 역임"],["2000","〈카르마〉(우바이무용단) 특별출연 및 무대미술 참가"],["2000","전국무용제 문화부장관상 수상"],["1999","〈카르마〉(우바이무용단) 특별출연 및 무대미술 참가"],["1999","제8회 부산무용제 대상 수상"],["1997","탑전 갤러리 선화(禪畵) 개인전(전남 광주)"],["1995","한국현대미술 함부르크전 퍼포먼스 참가(함부르크 갤러리 빌라루피)"],["1991","L.A 관음사 초청 선화 전시"],["1990","시카고주립대 초청 선화(禪畵) 전시, L.A 포크아트페스티벌 참가"],["1983","인간문화재 제50호 정지광스님으로부터 범패와 지화 전수"]], 8]],
      cta: "작품 · 전시 문의",
      sns: []
    }
  ];

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function byId(id) { for (var i = 0; i < ARTISTS.length; i++) if (ARTISTS[i].id === id) return ARTISTS[i]; return null; }

  /* every profile is shown in full on the page; the name row at the top jumps to each one */
  function profile(a) {
    var rows = a.info.map(function (r) { return "<div><dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("");
    var blocks = a.blocks.map(function (b, bi) {
      var show = b[2] || b[1].length, more = b[1].length - show; // long lists show the first few, the rest behind 더보기
      var lid = a.id + "-list-" + bi;
      return '<section class="ar-dt__blk"><h3>' + esc(b[0]) + (more > 0 ? " <small>" + b[1].length + "</small>" : "") + '</h3><ul id="' + lid + '"' + (more > 0 ? ' class="is-folded"' : "") + ">" + b[1].map(function (it, i) {
        return "<li" + (i >= show ? ' class="ar-more"' : "") + ">" + (it[0] ? "<b>" + esc(it[0]) + "</b>" : "") + "<span>" + esc(it[1]) + "</span></li>";
      }).join("") + "</ul>" +
      (more > 0 ? '<button type="button" class="ar-dt__more" aria-controls="' + lid + '" aria-expanded="false" data-more="더보기 (' + more + ')" data-less="접기">더보기 (' + more + ")</button>" : "") +
      "</section>";
    }).join("");
    var works = (a.works || []).length ? '<div class="ar-works">' + a.works.map(function (w) {
      return '<figure><div class="ar-works__img"><img src="' + esc(IMG + w[0]) + '" alt="' + esc(a.ko + " " + w[1]) + '" loading="lazy"></div><figcaption>' + esc(w[1]) + "</figcaption></figure>";
    }).join("") + "</div>" : "";
    var sns = a.sns.map(function (s) {
      return '<a href="' + esc(s[2]) + '" target="_blank" rel="noopener"><small>' + esc(s[0]) + "</small>" + esc(s[1]) + " ↗</a>";
    }).join("");
    return '<article class="ar-pf" id="' + a.id + '">' +
      '<div class="ar-dt__top">' +
        '<div class="ar-dt__cover"><img src="' + esc(a.cover) + '" alt="' + esc(a.ko) + '"></div>' +
        '<div class="ar-dt__txt">' +
          '<p class="ar-dt__k">' + (a.type === "artist" ? "ARTIST" : "ACTOR") + "</p>" +
          "<h2>" + esc(a.ko) + (a.alias ? " <small>" + esc(a.alias) + "</small>" : "") + "</h2>" +
          '<p class="ar-dt__en">' + esc(a.en) + "</p>" +
          (a.intro ? '<p class="ar-dt__intro">' + esc(a.intro) + "</p>" : "") +
          '<dl class="ar-dt__info">' + rows + "</dl>" +
          blocks +
          (sns ? '<div class="ar-dt__sns">' + sns + "</div>" : "") +
          '<a class="ar-dt__cta" href="contact.html">' + esc(a.cta || "캐스팅 · 출연 문의") + " <i>→</i></a>" +
        "</div>" +
      "</div>" +
      (works ? '<section class="ar-wk"><h3>작품</h3>' + works + (a.credit ? '<p class="ar-credit">' + esc(a.credit) + "</p>" : "") + "</section>" : "") +
    "</article>";
  }
  var list = document.getElementById("ar-grid");
  list.className = "ar-pfs";
  list.innerHTML =
    '<nav class="ar-idx" aria-label="아티스트 바로가기">' + ARTISTS.map(function (a) {
      return '<a href="#' + a.id + '"><b>' + esc(a.ko) + "</b><span>" + (a.type === "artist" ? "작가" : "배우") + "</span></a>";
    }).join("") + "</nav>" +
    [["actor", "배우", "ACTOR"], ["artist", "작가", "ARTIST"]].map(function (g) {
      var people = ARTISTS.filter(function (a) { return a.type === g[0]; });
      return people.length ? '<section class="ar-group"><h2 class="ar-group__t">' + g[1] + " <small>" + g[2] + "</small></h2>" + people.map(profile).join("") + "</section>" : "";
    }).join("");
  list.addEventListener("click", function (e) {
    var b = e.target.closest(".ar-dt__more");
    if (!b) return;
    var ul = document.getElementById(b.getAttribute("aria-controls"));
    var open = ul.classList.toggle("is-folded") === false;
    b.setAttribute("aria-expanded", open ? "true" : "false");
    b.textContent = b.getAttribute(open ? "data-less" : "data-more");
    if (!open) ul.closest(".ar-dt__blk").scrollIntoView({ block: "nearest" });
  });
})();
