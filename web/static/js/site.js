// Site chrome: theme toggle, chapter table of contents, reading progress.
(function () {
  "use strict";
  var root = document.documentElement;
  var fa = root.lang === "fa";
  var faNum = function (n) { return fa ? String(n).replace(/[0-9]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹"[d]; }) : String(n); };

  // ---- theme: system -> opposite of system -> back to system
  var btn = document.getElementById("themeBtn");
  function systemDark() { return matchMedia("(prefers-color-scheme: dark)").matches; }
  if (btn) btn.addEventListener("click", function () {
    var cur = root.getAttribute("data-theme");
    var isDark = cur ? cur === "dark" : systemDark();
    var next = isDark ? "light" : "dark";
    if ((next === "dark") === systemDark()) { root.removeAttribute("data-theme"); next = null; }
    else root.setAttribute("data-theme", next);
    try { next ? localStorage.setItem("theme", next) : localStorage.removeItem("theme"); } catch (e) {}
    window.dispatchEvent(new Event("themechange"));
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () { window.dispatchEvent(new Event("themechange")); });

  // ---- table of contents + progress (chapter pages only)
  var article = document.getElementById("article");
  var toc = document.getElementById("toc");
  if (!article || !toc) return;
  var heads = Array.prototype.slice.call(article.querySelectorAll("h2[id]"));
  heads.forEach(function (h) {
    var li = document.createElement("li"), a = document.createElement("a");
    a.href = "#" + h.id; a.textContent = h.textContent;
    li.appendChild(a); toc.appendChild(li);
  });
  var links = Array.prototype.slice.call(toc.querySelectorAll("a"));
  var pct = document.getElementById("pct"), bar = document.getElementById("pbar");
  var ticking = false;
  function onScroll() {
    ticking = false;
    var max = document.documentElement.scrollHeight - innerHeight;
    var p = max > 0 ? Math.round(Math.min(1, scrollY / max) * 100) : 0;
    if (pct) pct.textContent = faNum(p) + (fa ? "٪" : "%");
    if (bar) bar.style.width = p + "%";
    var on = 0;
    heads.forEach(function (h, i) { if (h.getBoundingClientRect().top < 160) on = i; });
    links.forEach(function (a, i) { a.classList.toggle("on", i === on); });
  }
  addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
})();
