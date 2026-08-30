/* GOLDSTREAM — admin editor
   Reads/writes data/content.json and assets/img/* directly on GitHub
   via a fine-grained personal access token stored in this browser only. */
(function () {
  "use strict";

  var OWNER = "minkingkong";
  var REPO = "goldstream-site";
  var BRANCH = "main";
  var API = "https://api.github.com";
  var TKEY = "gs_gh_token";
  var MAX_BYTES = 40 * 1024 * 1024; // 40 MB soft cap for uploads

  var state = { data: null, sha: null };
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- base64 (utf-8 safe) ---------- */
  function b64encode(str) {
    var bytes = new TextEncoder().encode(str), bin = "";
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin);
  }
  function b64decode(b64) {
    var bin = atob(String(b64).replace(/\s/g, ""));
    var arr = Uint8Array.from(bin, function (c) { return c.charCodeAt(0); });
    return new TextDecoder().decode(arr);
  }

  /* ---------- token ---------- */
  function token() { try { return localStorage.getItem(TKEY) || ""; } catch (e) { return ""; } }
  function setToken(v) {
    try { v ? localStorage.setItem(TKEY, v) : localStorage.removeItem(TKEY); } catch (e) {}
  }

  /* ---------- status ---------- */
  function status(msg, kind) {
    var s = $("status");
    if (!s) return;
    s.textContent = msg;
    s.className = "statusline" + (kind ? " " + kind : "");
  }
  function conn(msg) { $("conn").textContent = msg; }

  /* ---------- GitHub API ---------- */
  async function api(path, opts) {
    opts = opts || {};
    if (!token()) throw new Error("토큰이 없습니다. 먼저 토큰을 저장하세요.");
    var res = await fetch(API + path, {
      method: opts.method || "GET",
      headers: {
        Authorization: "Bearer " + token(),
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json"
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    var text = await res.text();
    var json = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error((json && json.message) || ("HTTP " + res.status));
    return json;
  }

  async function checkConn() {
    try {
      var r = await api("/repos/" + OWNER + "/" + REPO);
      var perm = r.permissions && r.permissions.push ? "쓰기 가능" : "읽기 전용(권한 부족)";
      conn("연결됨: " + r.full_name + " · " + perm);
      return true;
    } catch (e) {
      conn("연결 실패: " + e.message);
      return false;
    }
  }

  async function getContent() {
    var d = await api(
      "/repos/" + OWNER + "/" + REPO + "/contents/data/content.json?ref=" + BRANCH + "&t=" + Date.now()
    );
    state.sha = d.sha;
    return JSON.parse(b64decode(d.content));
  }

  async function putContent(obj, msg) {
    var body = {
      message: msg || "admin: 콘텐츠 수정",
      content: b64encode(JSON.stringify(obj, null, 2)),
      branch: BRANCH
    };
    if (state.sha) body.sha = state.sha;
    var r = await api("/repos/" + OWNER + "/" + REPO + "/contents/data/content.json", {
      method: "PUT",
      body: body
    });
    state.sha = r.content.sha;
    return r;
  }

  function fileToBase64(file) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(String(r.result).split(",")[1]); };
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  async function uploadAsset(file) {
    if (file.size > MAX_BYTES) {
      throw new Error(
        "파일이 너무 큽니다 (" + (file.size / 1048576).toFixed(1) +
        "MB). 40MB 이하만 업로드하세요. 영상은 YouTube/Vimeo 링크를 권장합니다."
      );
    }
    var b64 = await fileToBase64(file);
    var safe = (file.name || "file").toLowerCase().replace(/[^a-z0-9.\-]+/g, "-");
    var path = "assets/img/" + Date.now() + "-" + safe;
    await api("/repos/" + OWNER + "/" + REPO + "/contents/" + path, {
      method: "PUT",
      body: { message: "admin: 미디어 업로드 " + path, content: b64, branch: BRANCH }
    });
    return path;
  }

  /* ---------- work editor ---------- */
  function makeWorkEditor(w) {
    w = w || {};
    var node = $("work-tpl").content.firstElementChild.cloneNode(true);
    var q = function (sel) { return node.querySelector(sel); };
    var cr = w.credits || {};

    q(".f-id").value = w.id || "w" + Date.now();
    q(".f-title").value = w.title || "";
    q(".f-titleEn").value = w.titleEn || "";
    q(".f-status").value = w.status === "upcoming" ? "upcoming" : "released";
    q(".f-dateLabel").value = w.dateLabel || "";
    q(".f-format").value = w.format || "";
    q(".f-video").value = w.video || "";
    q(".f-synopsis").value = w.synopsis || "";
    q(".f-image").value = w.image || "";
    q(".f-c-director").value = cr["감독"] || "";
    q(".f-c-writer").value = cr["각본"] || "";
    q(".f-c-cast").value = cr["출연"] || "";
    q(".f-c-platform").value = cr["플랫폼"] || "";

    var prev = q(".f-image-preview");
    if (w.image) prev.src = w.image;
    var syncName = function () {
      node.querySelector(".we-name").textContent = q(".f-title").value || "(제목 없음)";
    };
    q(".f-title").addEventListener("input", syncName);
    syncName();

    q(".f-image-file").addEventListener("change", async function (e) {
      var file = e.target.files[0];
      if (!file) return;
      status("이미지 업로드 중…");
      try {
        var path = await uploadAsset(file);
        q(".f-image").value = path;
        prev.src = path + "?t=" + Date.now();
        status("이미지 업로드 완료: " + path, "ok");
      } catch (err) {
        status(err.message, "err");
      }
    });

    q(".we-del").addEventListener("click", function () {
      if (confirm("이 작품을 삭제할까요?")) node.remove();
    });
    q(".we-up").addEventListener("click", function () {
      var p = node.previousElementSibling;
      if (p) node.parentNode.insertBefore(node, p);
    });
    q(".we-down").addEventListener("click", function () {
      var n = node.nextElementSibling;
      if (n) node.parentNode.insertBefore(n, node);
    });
    return node;
  }

  function collectWorks() {
    return Array.prototype.map.call(
      document.querySelectorAll("#works-list .work-editor"),
      function (el) {
        var g = function (sel) {
          var n = el.querySelector(sel);
          return n ? n.value.trim() : "";
        };
        return {
          id: g(".f-id") || "w" + Date.now(),
          title: g(".f-title"),
          titleEn: g(".f-titleEn"),
          status: g(".f-status"),
          dateLabel: g(".f-dateLabel"),
          format: g(".f-format"),
          image: g(".f-image"),
          video: g(".f-video"),
          synopsis: g(".f-synopsis"),
          credits: {
            "감독": g(".f-c-director"),
            "각본": g(".f-c-writer"),
            "출연": g(".f-c-cast"),
            "플랫폼": g(".f-c-platform")
          }
        };
      }
    );
  }

  /* ---------- form fill / collect ---------- */
  function v(id) { var el = $(id); return el ? (el.value || "").trim() : ""; }
  function setV(id, val) { var el = $(id); if (el) el.value = val == null ? "" : val; }
  function lines(id) {
    return v(id).split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function fillForm(data) {
    var h = data.home || {}, a = data.about || {}, c = data.contact || {};
    setV("f-heroEyebrow", h.heroEyebrow);
    setV("f-heroTitle", h.heroTitle);
    setV("f-heroTagline", h.heroTagline);
    setV("f-heroTaglineEn", h.heroTaglineEn);

    var list = $("works-list");
    list.innerHTML = "";
    (data.works || []).forEach(function (w) { list.appendChild(makeWorkEditor(w)); });

    setV("f-name", a.name);
    setV("f-role", a.role);
    setV("f-portrait", a.portrait);
    var pv = document.querySelector('[data-preview="f-portrait"]');
    if (pv && a.portrait) pv.src = a.portrait;
    setV("f-bio", (a.bio || []).join("\n"));
    setV("f-bioEn", a.bioEn);
    setV("f-facts", (a.facts || []).map(function (f) { return f.k + " | " + f.v; }).join("\n"));
    setV("f-recognition", (a.recognition || []).map(function (r) { return r.year + " | " + r.text; }).join("\n"));

    setV("f-email", c.email);
    setV("f-hours", c.hours);
    setV("f-address", c.address);
    setV("f-inquiries", (c.inquiries || []).join("\n"));
  }

  function collectForm() {
    var data = JSON.parse(JSON.stringify(state.data || {}));
    data.home = data.home || {};
    data.home.heroEyebrow = v("f-heroEyebrow");
    data.home.heroTitle = v("f-heroTitle");
    data.home.heroTagline = v("f-heroTagline");
    data.home.heroTaglineEn = v("f-heroTaglineEn");
    if (data.home.featuredCount == null) data.home.featuredCount = 3;

    data.works = collectWorks();

    data.about = data.about || {};
    data.about.name = v("f-name");
    data.about.role = v("f-role");
    data.about.portrait = v("f-portrait");
    data.about.bio = lines("f-bio");
    data.about.bioEn = v("f-bioEn");
    data.about.facts = lines("f-facts").map(function (l) {
      var p = l.split("|");
      return { k: (p[0] || "").trim(), v: (p.slice(1).join("|") || "").trim() };
    });
    data.about.recognition = lines("f-recognition").map(function (l) {
      var p = l.split("|");
      return { year: (p[0] || "").trim(), text: (p.slice(1).join("|") || "").trim() };
    });

    data.contact = data.contact || {};
    data.contact.email = v("f-email");
    data.contact.hours = v("f-hours");
    data.contact.address = v("f-address");
    data.contact.inquiries = lines("f-inquiries");
    return data;
  }

  /* ---------- load / save ---------- */
  async function load() {
    if (!token()) {
      conn("토큰을 먼저 저장하세요.");
      return;
    }
    status("불러오는 중…");
    try {
      await checkConn();
      var data = await getContent();
      state.data = data;
      fillForm(data);
      $("editor").hidden = false;
      status("불러오기 완료. 수정 후 [저장하기]를 누르세요.", "ok");
    } catch (e) {
      status("불러오기 실패: " + e.message, "err");
    }
  }

  async function saveAll() {
    status("저장 중…");
    try {
      // re-fetch latest sha to avoid conflicts
      try { await getContent(); } catch (e) {}
      var data = collectForm();
      await putContent(data, "admin: 콘텐츠 수정 (" + new Date().toISOString().slice(0, 16) + ")");
      state.data = data;
      status("저장 완료 ✓  약 1분 뒤 사이트에 반영됩니다.", "ok");
    } catch (e) {
      status("저장 실패: " + e.message, "err");
    }
  }

  /* ---------- portrait upload (delegated) ---------- */
  document.addEventListener("change", async function (e) {
    var input = e.target;
    if (!(input.matches && input.matches('input[type="file"][data-target]'))) return;
    var file = input.files[0];
    if (!file) return;
    var targetId = input.getAttribute("data-target");
    status("이미지 업로드 중…");
    try {
      var path = await uploadAsset(file);
      setV(targetId, path);
      var pv = document.querySelector('[data-preview="' + targetId + '"]');
      if (pv) pv.src = path + "?t=" + Date.now();
      status("이미지 업로드 완료: " + path, "ok");
    } catch (err) {
      status(err.message, "err");
    }
  });

  /* ---------- wire up ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    $("token").value = token();
    if (token()) load();

    $("save-token").addEventListener("click", function () {
      setToken($("token").value.trim());
      conn(token() ? "토큰 저장됨. 불러오는 중…" : "토큰이 비었습니다.");
      if (token()) load();
    });
    $("clear-token").addEventListener("click", function () {
      setToken("");
      $("token").value = "";
      $("editor").hidden = true;
      conn("토큰을 삭제했습니다.");
    });
    $("check").addEventListener("click", checkConn);
    $("reload").addEventListener("click", load);
    $("add-work").addEventListener("click", function () {
      var node = makeWorkEditor({ id: "w" + Date.now(), status: "upcoming" });
      $("works-list").appendChild(node);
      node.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    $("save-all").addEventListener("click", saveAll);
  });
})();
