// Home page background: particles flowing along the damped pendulum's phase portrait.
(function () {
  "use strict";
  var cv = document.getElementById("heroCanvas");
  if (!cv) return;
  var ctx = cv.getContext("2d"), W = 0, H = 0, dpr = 1, pts = [], color = "#1f6f8b";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function f(x, y) { return [y, -Math.sin(x) - 0.12 * y]; }
  function readColor() { color = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || color; }
  function seed() { return { x: (Math.random() * 2 - 1) * 7.5, y: (Math.random() * 2 - 1) * 3, age: Math.random() * 300 }; }
  function resize() {
    dpr = window.devicePixelRatio || 1;
    var r = cv.getBoundingClientRect(); W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pts = []; for (var i = 0; i < Math.min(500, Math.round(W * H / 2200)); i++) pts.push(seed());
  }
  function X(x) { return (x + 7.5) / 15 * W; }
  function Y(y) { return H / 2 - y / 3.2 * (H / 2); }
  function frame() {
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,0.06)"; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.6;
    ctx.beginPath();
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i], v = f(p.x, p.y), h = 0.02;
      var nx = p.x + h * v[0], ny = p.y + h * v[1];
      ctx.moveTo(X(p.x), Y(p.y)); ctx.lineTo(X(nx), Y(ny));
      p.x = nx; p.y = ny; p.age++;
      if (p.age > 420 || Math.abs(p.x) > 8 || Math.abs(p.y) > 3.5) pts[i] = seed();
    }
    ctx.stroke(); ctx.globalAlpha = 1;
    if (!reduce) requestAnimationFrame(frame);
  }
  readColor(); resize();
  if (reduce) { for (var k = 0; k < 120; k++) frame(); } else requestAnimationFrame(frame);
  var rt; addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(resize, 150); });
  addEventListener("themechange", function () { readColor(); ctx.clearRect(0, 0, W, H); });
})();
