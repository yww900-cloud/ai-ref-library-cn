(function () {
"use strict";

var $ = function (s) { return document.querySelector(s); };
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }

var LIB = {
  face: {
    key: "face", name: "脸库", file: ["data/face.js", "data/face-img-1.js", "data/face-img-2.js", "data/face-img-3.js"], g: "LIB_FACE", total: 1499, unit: "张",
    site: "https://ai-portrait-gallery.pages.dev/",
    remote: function (base) { return "https://ai-portrait-gallery.pages.dev/img/full/" + base + ".png"; }
  },
  pose: {
    key: "pose", name: "姿势库", file: ["data/pose.js", "data/pose-img-1.js", "data/pose-img-2.js"], g: "LIB_POSE", total: 288, unit: "个姿势",
    site: "https://ai-pose-gallery.pages.dev/",
    remote: function (base) { return "https://ai-pose-gallery.pages.dev/img/" + base + ".png"; }
  },
  costume: {
    key: "costume", name: "服装库", file: "data/costume.js", g: "LIB_COSTUME", total: 1407, unit: "套",
    site: "https://ai-costume-gallery.pages.dev/",
    remote: function (base) { return "https://ai-costume-gallery.pages.dev/png/" + base + ".png"; }
  }
};

var LOCAL = window.LOCAL_ORIGINALS || { face: "", pose: "", costume: "" };

var S = {
  lib: "face", q: "",
  face: { sec: -1, hair: -1 },
  pose: { series: -1, cat: "", ang: "", view: "pose" },
  costume: { cat: -1 }
};

var cache = {};
var cur = null;      // 当前弹窗条目
var curLib = null;
var curAngle = "";   // 姿势库当前机位
var localOk = true;  // 本地原图是否可用（用于下载链接）

function data(lib) { return cache[lib].data; }
function imgMap(lib) { return cache[lib].img; }
function thumb(lib, base) { return imgMap(lib)[base] || ""; }

function loadLib(lib) {
  if (cache[lib]) return Promise.resolve(cache[lib]);
  $("#toolbar").innerHTML = '<div class="loading">正在载入' + LIB[lib].name + "（约 15 MB，首次打开需要几秒）…</div>";
  $("#grid").innerHTML = "";
  var files = Array.isArray(LIB[lib].file) ? LIB[lib].file : [LIB[lib].file];
  var chain = Promise.resolve();
  files.forEach(function (f) {
    chain = chain.then(function () {
      return new Promise(function (resolve, reject) {
        var s = document.createElement("script");
        s.src = f;
        s.onload = function () { resolve(); };
        s.onerror = function () { reject(new Error("无法加载 " + f)); };
        document.head.appendChild(s);
      });
    });
  });
  return chain.then(function () {
    var g = window[LIB[lib].g];
    if (!g) throw new Error("数据加载失败");
    cache[lib] = g;
    return g;
  });
}

/* ---------- 卡片 ---------- */
function faceCard(it) {
  var hair = it.h >= 0 ? data("face").hairs[it.h].name : "";
  var sec = data("face").sections[it.s].name;
  return '<article class="card" data-id="' + it.id + '">'
    + '<div class="ph r45"><img loading="lazy" decoding="async" src="' + thumb("face", it.id) + '" alt="' + it.id + '">'
    + '<div class="badge">' + it.id + "</div>" + (it.hot ? '<div class="fire" title="下载榜 Top10">🔥</div>' : "") + "</div>"
    + '<div class="meta"><div class="tags"><span class="cat">' + esc(sec) + "</span>" + (hair ? '<span class="tag">' + esc(hair) + "</span>" : "") + "</div>"
    + (it.sz ? '<p class="en">' + esc(it.sz) + "</p>" : "") + "</div></article>";
}

function poseCard(p) {
  var main = p.ang[S.pose.ang] || p.ang["正面"] || p.ang[Object.keys(p.ang)[0]];
  var strip = Object.keys(p.ang).map(function (a) {
    return '<button data-k="' + esc(p.key) + '" data-a="' + esc(a) + '"' + (a === (S.pose.ang || "正面") ? ' class="on"' : "") + ' title="' + esc(a) + '"><img loading="lazy" decoding="async" src="' + thumb("pose", p.ang[a]) + '" alt="' + esc(a) + '"></button>';
  }).join("");
  return '<article class="card" data-k="' + esc(p.key) + '">'
    + '<div class="ph r34" data-a="' + esc(S.pose.ang || "正面") + '"><img loading="lazy" decoding="async" src="' + thumb("pose", main) + '" alt="' + esc(p.zh) + '"><div class="badge">' + p.id + "</div></div>"
    + '<div class="meta"><h3>' + esc(p.zh) + '</h3><p class="ja">' + esc(p.ja) + "</p>"
    + '<div class="tags"><span class="tag">' + esc(data("pose").series[p.s].name) + '</span><span class="tag">' + esc(p.cat) + "</span></div></div>"
    + (S.pose.view === "one" ? "" : '<div class="strip">' + strip + "</div>")
    + "</article>";
}

function costumeCard(it) {
  var c = data("costume").cats[it.c].name;
  var shown = it.zh.slice(0, 4), rest = it.zh.length - shown.length;
  return '<article class="card" data-id="' + it.id + '">'
    + '<div class="ph r23"><img loading="lazy" decoding="async" src="' + thumb("costume", it.id) + '" alt="' + it.id + '"><div class="badge">' + it.id + "</div></div>"
    + '<div class="meta"><div class="tags"><span class="cat">' + esc(c) + "</span>"
    + shown.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("")
    + (rest > 0 ? '<span class="more">+' + rest + "</span>" : "")
    + '</div><p class="en">' + esc(it.kw.join(" · ")) + "</p></div></article>";
}

/* ---------- 过滤 ---------- */
function faceMatch(it) {
  if (S.face.sec >= 0 && it.s !== S.face.sec) return false;
  if (S.face.hair >= 0 && it.h !== S.face.hair) return false;
  if (S.q) {
    var q = S.q.toLowerCase();
    var hay = (it.id + " " + data("face").sections[it.s].name + " " + (it.sz || "") + " " + (it.sj || "") + " " + (it.h >= 0 ? data("face").hairs[it.h].name : "")).toLowerCase();
    if (hay.indexOf(q) < 0) return false;
  }
  return true;
}
function poseMatch(p) {
  if (S.pose.series >= 0 && p.s !== S.pose.series) return false;
  if (S.pose.cat && p.cat !== S.pose.cat) return false;
  if (S.q) {
    var q = S.q.toLowerCase();
    var hay = (p.zh + " " + p.ja + " " + p.id + " " + p.cat + " " + data("pose").series[p.s].name).toLowerCase();
    if (hay.indexOf(q) < 0) return false;
  }
  return true;
}
function costumeMatch(it) {
  if (S.costume.cat >= 0 && it.c !== S.costume.cat) return false;
  if (S.q) {
    var q = S.q.toLowerCase();
    var hay = (it.id + " " + data("costume").cats[it.c].name + " " + it.kw.join(" ") + " " + it.zh.join(" ")).toLowerCase();
    if (hay.indexOf(q) < 0) return false;
  }
  return true;
}

/* ---------- 工具栏 ---------- */
function tabsHTML(items, active, attr) {
  return items.map(function (x, i) {
    return '<button class="tab' + (i === active ? " on" : "") + '" data-' + attr + '="' + i + '">' + esc(x.label) + "<b>" + x.n + "</b>" + (x.suffix ? "<i>" + x.suffix + "</i>" : "") + "</button>";
  }).join("");
}

function toolbarFace() {
  var d = data("face");
  var tabs = [{ label: "全部", n: d.items.length, suffix: "" }].concat(d.sections.map(function (s) { return { label: s.name, n: s.n, suffix: "" }; }));
  var all = '<button class="tab' + (S.face.sec < 0 ? " on" : "") + '" data-sec="-1">全部<b>' + d.items.length + '</b></button>';
  d.sections.forEach(function (s, i) {
    all += '<button class="tab' + (S.face.sec === i ? " on" : "") + '" data-sec="' + i + '">' + esc(s.name) + "<b>" + s.n + "</b></button>";
  });
  var counts = [0, 0, 0, 0];
  d.items.forEach(function (it) { if ((S.face.sec < 0 || it.s === S.face.sec) && it.h >= 0) counts[it.h]++; });
  var hair = '<button data-hair="-1"' + (S.face.hair < 0 ? ' class="on"' : "") + ">全部发长</button>";
  d.hairs.forEach(function (h, i) {
    hair += '<button data-hair="' + i + '"' + (S.face.hair === i ? ' class="on"' : "") + ">" + esc(h.name) + " " + counts[i] + "</button>";
  });
  $("#toolbar").innerHTML = '<div class="tabs">' + all + "</div>"
    + '<div class="row"><input id="q" type="search" placeholder="搜索：编号 / 造型（蝴蝶剪、狼尾、空气刘海）" autocomplete="off">'
    + '<div class="seg" id="hairseg">' + hair + '</div><span id="count"></span></div>';
  $("#toolbar").querySelectorAll("[data-sec]").forEach(function (b) {
    b.onclick = function () { S.face.sec = +b.dataset.sec; S.q = ""; render(); };
  });
  $("#toolbar").querySelectorAll("[data-hair]").forEach(function (b) {
    b.onclick = function () { S.face.hair = +b.dataset.hair; render(); };
  });
  $("#q").value = S.q;
  $("#q").oninput = function (e) { S.q = e.target.value.trim(); render(true); };
}

function toolbarPose() {
  var d = data("pose");
  var all = '<button class="tab' + (S.pose.series < 0 ? " on" : "") + '" data-series="-1">全部<b>' + d.poses.length + '</b><i>个姿势</i></button>';
  d.series.forEach(function (s, i) {
    all += '<button class="tab' + (S.pose.series === i ? " on" : "") + '" data-series="' + i + '">' + esc(s.name) + "<b>" + s.n + "</b><i>个 / " + s.img + " 张</i></button>";
  });
  var cats = [];
  d.poses.forEach(function (p) { if ((S.pose.series < 0 || p.s === S.pose.series) && cats.indexOf(p.cat) < 0) cats.push(p.cat); });
  var sel = '<select id="cat"><option value="">全部分类</option>' + cats.map(function (c) {
    return '<option value="' + esc(c) + '"' + (S.pose.cat === c ? " selected" : "") + ">" + esc(c) + "</option>";
  }).join("") + "</select>";
  var angs = ["", "正面", "俯视", "仰视", "侧面", "斜45°"];
  var angHTML = angs.map(function (a) {
    return '<button data-ang="' + a + '"' + (S.pose.ang === a ? ' class="on"' : "") + ">" + (a || "全机位") + "</button>";
  }).join("");
  $("#toolbar").innerHTML = '<div class="tabs">' + all + "</div>"
    + '<div class="row"><input id="q" type="search" placeholder="搜索：中文名 / 日文名 / 编号（如 比心、P023、站立）" autocomplete="off">'
    + sel + '<div class="seg" id="angseg">' + angHTML + "</div>"
    + '<div class="seg" id="viewseg"><button data-view="pose"' + (S.pose.view === "pose" ? ' class="on"' : '') + '>按姿势</button><button data-view="one"' + (S.pose.view === "one" ? ' class="on"' : '') + '>按单张</button></div>' 
    + '<span id="count"></span></div>';
  $("#toolbar").querySelectorAll("[data-series]").forEach(function (b) {
    b.onclick = function () { S.pose.series = +b.dataset.series; S.pose.cat = ""; render(); };
  });
  $("#toolbar").querySelectorAll("[data-ang]").forEach(function (b) {
    b.onclick = function () { S.pose.ang = b.dataset.ang; render(); };
  });
  $("#toolbar").querySelectorAll("[data-view]").forEach(function (b) {
    b.onclick = function () { S.pose.view = b.dataset.view; render(); };
  });
  $("#cat").onchange = function (e) { S.pose.cat = e.target.value; render(); };
  $("#q").value = S.q;
  $("#q").oninput = function (e) { S.q = e.target.value.trim(); render(true); };
}

function toolbarCostume() {
  var d = data("costume");
  var all = '<button class="tab' + (S.costume.cat < 0 ? " on" : "") + '" data-cat="-1">全部<b>' + d.items.length + "</b></button>";
  d.cats.forEach(function (c, i) {
    all += '<button class="tab' + (S.costume.cat === i ? " on" : "") + '" data-cat="' + i + '">' + esc(c.name) + "<b>" + c.n + "</b></button>";
  });
  $("#toolbar").innerHTML = '<div class="tabs">' + all + "</div>"
    + '<div class="row"><input id="q" type="search" placeholder="搜索：编号 / 中文（牛仔、蕾丝）/ 英文（denim、lace）" autocomplete="off"><span id="count"></span></div>';
  $("#toolbar").querySelectorAll("[data-cat]").forEach(function (b) {
    b.onclick = function () { S.costume.cat = +b.dataset.cat; render(); };
  });
  $("#q").value = S.q;
  $("#q").oninput = function (e) { S.q = e.target.value.trim(); render(true); };
}

/* ---------- 渲染 ---------- */
function render(gridOnly) {
  if (!cache[S.lib]) return;
  if (!gridOnly) {
    if (S.lib === "face") toolbarFace();
    else if (S.lib === "pose") toolbarPose();
    else toolbarCostume();
  }
  if (S.lib === "face") renderFace();
  else if (S.lib === "pose") renderPose();
  else renderCostume();
}

function renderFace() {
  var d = data("face");
  var list = d.items.filter(faceMatch);
  $("#grid").className = "grid face";
  $("#grid").innerHTML = list.map(faceCard).join("");
  $("#count").textContent = "符合条件：" + list.length + " 张";
  $("#grid").querySelectorAll(".card").forEach(function (c) { c.onclick = function () { openFace(c.dataset.id); }; });
}

function renderPose() {
  var d = data("pose");
  var list = d.poses.filter(poseMatch);
  var html = "", shown = 0;
  if (S.pose.view === "one") {
    var angs = S.pose.ang ? [S.pose.ang] : ["正面", "俯视", "仰视", "侧面", "斜45°"];
    list.forEach(function (p) {
      angs.forEach(function (a) { if (p.ang[a]) { html += poseCardOne(p, a); shown++; } });
    });
  } else {
    html = list.map(poseCard).join("");
    shown = list.length;
  }
  $("#grid").className = "grid pose";
  $("#grid").innerHTML = html;
  $("#count").textContent = "符合条件：" + shown + (S.pose.view === "one" ? " 张" : " 个姿势");
  $("#grid").querySelectorAll(".card").forEach(function (c) {
    var ph = c.querySelector(".ph");
    ph.onclick = function () { openPose(c.dataset.k || c.dataset.key, ph.dataset.a || S.pose.ang || "正面"); };
    c.querySelectorAll(".strip button").forEach(function (b) {
      b.onclick = function (e) { e.stopPropagation(); openPose(b.dataset.k, b.dataset.a); };
    });
  });
}

function poseCardOne(p, a) {
  return '<article class="card" data-key="' + esc(p.key) + '">'
    + '<div class="ph r34" data-a="' + esc(a) + '"><img loading="lazy" decoding="async" src="' + thumb("pose", p.ang[a]) + '" alt="' + esc(p.zh) + '"><div class="badge">' + p.id + " · " + esc(a) + "</div></div>"
    + '<div class="meta"><h3>' + esc(p.zh) + '</h3><p class="ja">' + esc(p.ja) + "</p>"
    + '<div class="tags"><span class="tag">' + esc(data("pose").series[p.s].name) + '</span><span class="tag">' + esc(p.cat) + "</span></div></div></article>";
}

function renderCostume() {
  var d = data("costume");
  var list = d.items.filter(costumeMatch);
  $("#grid").className = "grid";
  $("#grid").innerHTML = list.map(costumeCard).join("");
  $("#count").textContent = "符合条件：" + list.length + " 套";
  $("#grid").querySelectorAll(".card").forEach(function (c) { c.onclick = function () { openCostume(c.dataset.id); }; });
}

/* ---------- 弹窗 ---------- */
function resolveOriginal(lib, base, name) {
  var local = LOCAL[lib] ? (LOCAL[lib] + base + ".png") : "";
  var remote = LIB[lib].remote(base);
  localOk = !!local;
  setDownload(local || remote, name);
  var im = $("#mimg");
  im.onerror = function () {
    if (local && im.getAttribute("src") === local) {
      localOk = false;
      setDownload(remote, name);
      im.onerror = function () { im.onerror = null; im.src = thumb(lib, base); };
      im.src = remote;
    } else { im.onerror = null; im.src = thumb(lib, base); }
  };
  im.onload = function () {
    var el = $("#mdim");
    if (el) el.textContent = im.naturalWidth + "×" + im.naturalHeight;
  };
  im.src = local || remote;
}

function showModal() { $("#modal").classList.add("on"); }
function hideModal() { $("#modal").classList.remove("on"); }

function setDownload(link, name) {
  $("#mdl").href = link;
  $("#mdl").setAttribute("download", name);
}

function openFace(id) {
  curLib = "face"; cur = data("face").items.filter(function (x) { return x.id === id; })[0];
  if (!cur) return;
  var d = data("face");
  resolveOriginal("face", cur.id, cur.id + ".png");
  $("#mtitle").textContent = d.sections[cur.s].name + " · " + cur.id;
  $("#mfields").innerHTML = '<dt>编号</dt><dd>' + cur.id + "</dd><dt>类型</dt><dd>" + esc(d.sections[cur.s].name) + "</dd>"
    + "<dt>发长</dt><dd>" + (cur.h >= 0 ? esc(d.hairs[cur.h].name) : "—") + '</dd><dt>尺寸</dt><dd id="mdim">—</dd>';
  var chips = "";
  if (cur.sz) chips += '<span class="chip">' + esc(cur.sz) + "</span>";
  if (cur.sj) chips += '<span class="chip en">' + esc(cur.sj) + "</span>";
  $("#mextra").innerHTML = '<div class="sect">造型</div>' + (chips || '<span style="color:#9a9aa4;font-size:12px">无（正面向·纯色背景脸部特写）</span>');
  $("#mdl").textContent = "下载原图（PNG 高清）";
  $("#mcopy").dataset.lib = "face";
  showModal();
}

function openPose(key, angle) {
  curLib = "pose";
  cur = data("pose").poses.filter(function (x) { return x.key === key; })[0];
  if (!cur) return;
  curAngle = cur.ang[angle] ? angle : Object.keys(cur.ang)[0];
  var d = data("pose");
  var base = cur.ang[curAngle];
  resolveOriginal("pose", base, base + ".png");
  $("#mtitle").textContent = cur.zh;
  $("#mfields").innerHTML = '<dt>编号</dt><dd>' + cur.id + "</dd><dt>分组</dt><dd>" + esc(d.series[cur.s].name) + "</dd>"
    + "<dt>分类</dt><dd>" + esc(cur.cat) + '</dd><dt>机位</dt><dd id="mangn">' + esc(curAngle) + '</dd>';
  var angs = Object.keys(cur.ang);
  $("#mextra").innerHTML = '<div class="sect">其他机位</div><div class="mang" id="mang">' + angs.map(function (a) {
    return '<button data-a="' + esc(a) + '"' + (a === curAngle ? ' class="on"' : "") + '><img loading="lazy" src="' + thumb("pose", cur.ang[a]) + '" alt="' + esc(a) + '"></button>';
  }).join("") + "</div>";
  $("#mang").querySelectorAll("button").forEach(function (b) {
    b.onclick = function () { openPose(key, b.dataset.a); };
  });
  $("#mdl").textContent = "下载原图（PNG · 900×1200）";
  $("#mcopy").dataset.lib = "pose";
  showModal();
}

function openCostume(id) {
  curLib = "costume"; cur = data("costume").items.filter(function (x) { return x.id === id; })[0];
  if (!cur) return;
  var d = data("costume");
  resolveOriginal("costume", cur.id, cur.id + ".png");
  $("#mtitle").textContent = cur.id + " · " + d.cats[cur.c].name;
  $("#mfields").innerHTML = '<dt>编号</dt><dd>' + cur.id + "</dd><dt>分类</dt><dd>" + esc(d.cats[cur.c].name) + "</dd>"
    + "<dt>标签</dt><dd>" + cur.zh.length + ' 个</dd><dt>尺寸</dt><dd id="mdim">—</dd>';
  $("#mextra").innerHTML = '<div class="sect">中文标签</div>' + cur.zh.map(function (t) { return '<span class="chip">' + esc(t) + "</span>"; }).join("")
    + '<div class="sect">英文标签（可直接搜）</div>' + cur.kw.map(function (t) { return '<span class="chip en">' + esc(t) + "</span>"; }).join("");
  $("#mdl").textContent = "下载原图（PNG · 长边约 2048）";
  $("#mcopy").dataset.lib = "costume";
  showModal();
}

function stepModal(delta) {
  if (!cur) return;
  var list;
  if (curLib === "face") { list = data("face").items.filter(faceMatch); }
  else if (curLib === "costume") { list = data("costume").items.filter(costumeMatch); }
  else { list = data("pose").poses.filter(poseMatch); }
  if (list.length < 2) return;
  var idx = list.findIndex(function (x) {
    return curLib === "pose" ? x.key === cur.key : x.id === cur.id;
  });
  idx = idx < 0 ? 0 : (idx + delta + list.length) % list.length;
  var n = list[idx];
  if (curLib === "face") openFace(n.id);
  else if (curLib === "costume") openCostume(n.id);
  else openPose(n.key, curAngle);
}

function stepAngle(delta) {
  if (curLib !== "pose" || !cur) return;
  var angs = Object.keys(cur.ang);
  var i = angs.indexOf(curAngle);
  curAngle = angs[(i + delta + angs.length) % angs.length];
  openPose(cur.key, curAngle);
}

$("#mimg").onclick = function () {
  if (!cur) return;
  var link = $("#mdl").getAttribute("href");
  if (link) window.open(link, "_blank");
};
$("#mprev").onclick = function () { if (curLib === "pose" && !S.pose.ang) stepAngle(-1); else stepModal(-1); };
$("#mnext").onclick = function () { if (curLib === "pose" && !S.pose.ang) stepAngle(1); else stepModal(1); };
$("#mclose").onclick = hideModal;
$("#modal").onclick = function (e) { if (e.target.id === "modal") hideModal(); };

$("#mcopy").onclick = function () {
  var txt = "";
  if (curLib === "face") {
    var d = data("face");
    var desc = [d.sections[cur.s].name, cur.h >= 0 ? d.hairs[cur.h].name : "", cur.sz || ""].filter(Boolean).join("·");
    txt = "参考脸：" + cur.id + "（" + desc + "）。用图2这张脸作为图1角色的脸部参考，保持五官、脸型、骨相和发型一致；姿势、服装、场景、光线按需求重新生成。";
  } else if (curLib === "pose") {
    var dp = data("pose");
    txt = "参考姿势：" + cur.id + " " + cur.zh + "（" + dp.series[cur.s].name + "·" + cur.cat + "，机位：" + curAngle + "）。把图1中人物的姿势改成图2的姿势；保持脸、发型、服装、光线、画风完全不变，只改变身体姿态和四肢位置。";
  } else {
    var dc = data("costume");
    txt = "参考服装：" + cur.id + "（" + dc.cats[cur.c].name + "，" + cur.zh.slice(0, 6).join("·") + "）。把图1中人物的衣服换成图2的这套服装；保持脸、发型、体型、姿势、背景、光线和画风完全不变。";
  }
  var done = function () { $("#mcopy").textContent = "已复制 ✓"; setTimeout(function () { $("#mcopy").textContent = "复制作图指令"; }, 1600); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).then(done).catch(function () { fallbackCopy(txt, done); });
  } else { fallbackCopy(txt, done); }
};
function fallbackCopy(txt, done) {
  var t = document.createElement("textarea");
  t.value = txt; document.body.appendChild(t); t.select();
  try { document.execCommand("copy"); done(); } catch (e) { $("#mcopy").textContent = "复制失败，请手动选择"; }
  t.remove();
}

document.addEventListener("keydown", function (e) {
  if (!$("#modal").classList.contains("on")) return;
  if (e.key === "Escape") hideModal();
  else if (e.key === "ArrowLeft") { e.preventDefault(); if (curLib === "pose") stepAngle(-1); else stepModal(-1); }
  else if (e.key === "ArrowRight") { e.preventDefault(); if (curLib === "pose") stepAngle(1); else stepModal(1); }
  else if (e.key === "ArrowUp") { e.preventDefault(); if (curLib === "pose") stepModal(-1); }
  else if (e.key === "ArrowDown") { e.preventDefault(); if (curLib === "pose") stepModal(1); }
});

/* ---------- 主切换 ---------- */
function switchLib(lib) {
  S.lib = lib; S.q = "";
  var d = null;
  try { d = window.location.hash; } catch (e) { }
  document.querySelectorAll(".nav button").forEach(function (b) {
    b.classList.toggle("on", b.dataset.lib === lib);
  });
  loadLib(lib).then(function () {
    render();
  }).catch(function (err) {
    $("#toolbar").innerHTML = '<div class="empty">' + esc(err.message) + "<br>请确认 data/ 目录与 index.html 在同一层，并用浏览器直接打开（file:// 或 http）。</div>";
    $("#grid").innerHTML = "";
  });
}

document.querySelectorAll(".nav button").forEach(function (b) {
  b.onclick = function () { switchLib(b.dataset.lib); };
});
$("#rnd").onclick = function () {
  if (!cache[S.lib]) return;
  var list;
  if (S.lib === "face") list = data("face").items.filter(faceMatch);
  else if (S.lib === "pose") list = data("pose").poses.filter(poseMatch);
  else list = data("costume").items.filter(costumeMatch);
  if (!list.length) return;
  var x = list[Math.floor(Math.random() * list.length)];
  if (S.lib === "face") openFace(x.id);
  else if (S.lib === "pose") openPose(x.key, "正面");
  else openCostume(x.id);
};

switchLib("face");
})();
