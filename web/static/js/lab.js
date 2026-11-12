/* Nonlinear Control, Visualized: interactive lab engine.
 *
 * A chapter page contains placeholders like <div class="lab" data-lab="ch4-ex44"></div>.
 * The chapter script (web/static/js/labs/chNN.js) calls NL.register({ "ch4-ex44": config, ... })
 * and every placeholder becomes a live lab: optional physical view, phase plane (or 1-D plot),
 * and a time plot, with sliders, toggles and click-to-start trajectories.
 *
 * Strings can be plain or bilingual objects {fa: "...", en: "..."}; the page language picks one.
 *
 * Main config fields (all optional unless noted):
 *   mode       "plane" (default) | "line" (1-D system) | "time" (time plot only)
 *   static     true for a figure with no simulation
 *   dim        state dimension (default 2, or 1 for "line")
 *   f(x,P,t)   vector field, returns an array (required unless static)
 *   V(x,P)     Lyapunov / energy function; enables level sets, gauge and V(t)
 *   lim        [x1min, x1max, x2min, x2max] (or a function of P). For "line": [xmin, xmax, fmin, fmax]
 *   params     initial parameter object;  controls: slider | toggle | button | select
 *   starts     initial states (array or function of P)
 *   levels, shades, contours, curves, domainLines, equilibria   (values or functions of P)
 *   side       "pendulum" | "spring" | "msd" | "dog" | "bowl1d" | function(ctx, W, H, lab)
 *   series     time-plot series: function or [{f, label, color, dash}]
 *   eq(P), caption(P, lab), sideTitle, phaseTitle, timeTitle, hint
 *   onParams(P, lab), onStep(tr, lab), drawBg(ctx, map, lab), drawTop(ctx, map, lab), drawPhase(ctx, map, lab)
 */
(() => {
  "use strict";

  const LANG = document.documentElement.lang === "fa" ? "fa" : "en";
  const FONT = "Vazirmatn, Tahoma, system-ui, -apple-system, 'Segoe UI', sans-serif";
  const PALETTE = ["#1f6f8b", "#b5532c", "#6a8d3a", "#8e4bb0", "#c9a227", "#2e8b7a", "#c2185b"];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const UI = {
    pause: { en: "Pause", fa: "توقف" },
    play: { en: "Play", fa: "ادامه" },
    reset: { en: "Reset", fa: "شروع دوباره" },
    field: { en: "vector field", fa: "میدان برداری" },
    levels: { en: "level sets V = c", fa: "سطوح تراز V = c" },
    hintPlane: { en: "Click the phase plane to start a new trajectory there. The thick dark curve is the newest one, and the side panel follows it.",
      fa: "روی صفحه‌ی فاز کلیک کن تا مسیر جدیدی از همان نقطه شروع شود. منحنی ضخیم تیره جدیدترین مسیر است و پنل کناری همان را نشان می‌دهد." },
    hintLine: { en: "Click the plot to add a new initial condition x(0).", fa: "روی نمودار کلیک کن تا شرط اولیه‌ی جدید x(0) اضافه شود." },
    phase: { en: "Phase plane: arrows = f(x), dashed = level sets", fa: "صفحه‌ی فاز: پیکان‌ها = f(x)، خط‌چین = سطوح تراز" },
    timeV: { en: "V(x(t)) for each trajectory", fa: "V(x(t)) برای هر مسیر" },
    timeX: { en: "x₁(t) for each trajectory", fa: "x₁(t) برای هر مسیر" },
    rising: { en: "↑ rising", fa: "↑ بالا می‌رود" },
    falling: { en: "↓ falling", fa: "↓ پایین می‌آید" },
    flat: { en: "– flat", fa: "– ثابت" },
    error: { en: "This figure could not start: ", fa: "این شکل اجرا نشد: " }
  };

  // ------------------------------------------------------------------ helpers
  const tr = v => (v && typeof v === "object" && !Array.isArray(v) && ("en" in v || "fa" in v)) ? (v[LANG] ?? v.en ?? v.fa) : v;
  const val = (v, ...a) => tr(typeof v === "function" ? v(...a) : v);
  const C = {};
  const TOKENS = ["bg", "panel", "soft", "ink", "muted", "grid", "accent", "warn", "ok", "bad", "field", "traj", "shade", "shade2", "robot", "ground"];
  function readColors() {
    const s = getComputedStyle(document.documentElement);
    for (const n of TOKENS) C[n] = s.getPropertyValue("--" + n).trim();
  }
  const col = c => !c ? C.ink : (c.startsWith("--") ? (C[c.slice(2)] || c) : c);

  function rk4(f, x, t, h, P) {
    const add = (a, k, s) => a.map((v, i) => v + s * k[i]);
    const k1 = f(x, P, t);
    const k2 = f(add(x, k1, h / 2), P, t + h / 2);
    const k3 = f(add(x, k2, h / 2), P, t + h / 2);
    const k4 = f(add(x, k3, h), P, t + h);
    return x.map((v, i) => v + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  }

  function text(ctx, s, x, y, o = {}) {
    s = tr(s);
    if (s == null || s === "") return;
    s = String(s);
    ctx.save();
    ctx.font = o.font || `13px ${FONT}`;
    ctx.fillStyle = col(o.color || "--muted");
    ctx.direction = /[؀-ۿ]/.test(s) ? "rtl" : "ltr";
    ctx.textAlign = o.align || "left";
    ctx.textBaseline = o.baseline || "alphabetic";
    ctx.fillText(s, x, y);
    ctx.restore();
  }

  function arrow(ctx, x0, y0, dx, dy, color, width, hs = 6) {
    const len = Math.hypot(dx, dy);
    if (len < 0.5) return;
    const ux = dx / len, uy = dy / len;
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + dx, y0 + dy); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x0 + dx, y0 + dy);
    ctx.lineTo(x0 + dx - hs * ux + hs * 0.5 * uy, y0 + dy - hs * uy - hs * 0.5 * ux);
    ctx.lineTo(x0 + dx - hs * ux - hs * 0.5 * uy, y0 + dy - hs * uy + hs * 0.5 * ux);
    ctx.closePath(); ctx.fill();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // map between state coordinates and canvas pixels
  function makeMap(lim, W, H) {
    const [a, b, lo, hi] = lim;
    return {
      lim, W, H,
      X: x => (x - a) / (b - a) * W,
      Y: y => (hi - y) / (hi - lo) * H,
      inv: (px, py) => [a + px / W * (b - a), hi - py / H * (hi - lo)]
    };
  }

  // sample F on an (N+1) x (N+1) grid over the map's window
  function sampleGrid(F, map, N = 140) {
    const [a, b, lo, hi] = map.lim, v = new Float64Array((N + 1) * (N + 1));
    for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) v[i * (N + 1) + j] = F([a + i * (b - a) / N, lo + j * (hi - lo) / N]);
    return { N, v, map };
  }

  // marching squares on a sampled grid
  function contourGrid(ctx, g, c, color, width = 1, dash = []) {
    const { N, v, map } = g, [a, b, lo, hi] = map.lim, dx = (b - a) / N, dy = (hi - lo) / N, M = N + 1;
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash);
    ctx.beginPath();
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const cs = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]], pts = [];
      for (let e = 0; e < 4; e++) {
        const [i0, j0] = cs[e], [i1, j1] = cs[(e + 1) % 4];
        const v0 = v[i0 * M + j0] - c, v1 = v[i1 * M + j1] - c;
        if (!isFinite(v0) || !isFinite(v1)) continue;
        if ((v0 < 0) !== (v1 < 0)) {
          const s = v0 / (v0 - v1);
          pts.push([map.X(a + (i0 + s * (i1 - i0)) * dx), map.Y(lo + (j0 + s * (j1 - j0)) * dy)]);
        }
      }
      for (let k = 0; k + 1 < pts.length; k += 2) { ctx.moveTo(pts[k][0], pts[k][1]); ctx.lineTo(pts[k + 1][0], pts[k + 1][1]); }
    }
    ctx.stroke();
    ctx.restore();
  }
  const contour = (ctx, F, c, map, color, width, dash, N) => contourGrid(ctx, sampleGrid(F, map, N), c, color, width, dash);

  // fill the cells where pred(x) holds; cells snap to device pixels so they never overlap
  function shade(ctx, pred, map, color, N = 130) {
    const [a, b, lo, hi] = map.lim, d = window.devicePixelRatio || 1;
    const px = i => Math.round(i * map.W * d / N) / d, py = j => Math.round(j * map.H * d / N) / d;
    ctx.fillStyle = color;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const x = [a + (i + 0.5) * (b - a) / N, hi - (j + 0.5) * (hi - lo) / N];
      if (pred(x)) ctx.fillRect(px(i), py(j), px(i + 1) - px(i), py(j + 1) - py(j));
    }
  }

  function sizeCanvas(cv, aspect, minH = 0, maxH = 1e9) {
    const w = cv.clientWidth || cv.parentElement.clientWidth;
    if (!w) return null;
    const h = Math.round(Math.min(maxH, Math.max(minH, w / aspect))), d = window.devicePixelRatio || 1;
    cv.style.height = h + "px";
    cv.width = Math.round(w * d); cv.height = Math.round(h * d);
    const ctx = cv.getContext("2d"); ctx.setTransform(d, 0, 0, d, 0, 0);
    return { cv, ctx, W: w, H: h, d };
  }

  function numGrad(V, x, P) {
    return x.map((_, i) => {
      const h = 1e-5, xp = x.slice(), xm = x.slice();
      xp[i] += h; xm[i] -= h;
      return (V(xp, P) - V(xm, P)) / (2 * h);
    });
  }

  // ------------------------------------------------------------------ physical views
  function drawGauge(ctx, W, H, lab, x0 = W - 46) {
    const cfg = lab.cfg, tr0 = lab.trajs[0];
    if (!cfg.V || !tr0) return;
    const top = 34, gH = H - 92, vmax = val(cfg.vmax, lab.P) || 4;
    const v = Math.max(0, Math.min(cfg.V(tr0.x, lab.P), vmax));
    const vd = tr0.done || tr0.fallen ? 0 : lab.Vdot(tr0.x, tr0.t);
    ctx.strokeStyle = C.muted; ctx.lineWidth = 1; ctx.strokeRect(x0, top, 20, gH);
    ctx.fillStyle = vd > 1e-4 ? C.warn : C.ok;
    const fh = v / vmax * gH;
    ctx.fillRect(x0 + 1, top + gH - fh, 18, fh);
    text(ctx, "V", x0 + 10, top - 10, { color: "--ink", align: "center", font: `italic 14px ${FONT}` });
    text(ctx, vd > 1e-4 ? UI.rising : (vd < -1e-4 ? UI.falling : UI.flat), x0 + 10, top + gH + 20, { align: "center", font: `12px ${FONT}`, color: vd > 1e-4 ? "--warn" : "--muted" });
  }

  // angle in degrees, wrapped to (-180, 180] for display
  const deg = th => Math.round((((th + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI) * 180 / Math.PI);
  const SIDES = {
    pendulum(ctx, W, H, lab) {
      const o = val(lab.cfg.sideOpts, lab.P, lab) || {}, x = lab.trajs[0].x, th = x[0];
      // inverted: pivot mid-panel so the rod stays visible when the pendulum falls below horizontal
      const inv = !!o.inverted, cx = W / 2 - 24, L = Math.min(W * 0.36, H * (inv ? 0.36 : 0.6));
      const cy = inv ? H * 0.52 : 44;
      const bx = cx + L * Math.sin(th), by = inv ? cy - L * Math.cos(th) : cy + L * Math.cos(th);
      ctx.setLineDash([4, 6]); ctx.strokeStyle = C.muted; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, inv ? cy - L - 20 : cy + L + 20); ctx.stroke(); ctx.setLineDash([]);
      if (inv) { ctx.fillStyle = C.ground; ctx.fillRect(cx - 70, cy + 10, 140, 6); ctx.fillStyle = C.robot; roundRect(ctx, cx - 26, cy - 4, 52, 16, 5); ctx.fill(); }
      else { ctx.fillStyle = C.muted; ctx.fillRect(cx - 60, cy - 8, 120, 6); }
      ctx.strokeStyle = C.ink; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(bx, by); ctx.stroke();
      ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(bx, by, 15, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(cx, cy, 4.5, 0, 2 * Math.PI); ctx.fill();
      if (o.u !== undefined && isFinite(o.u) && Math.abs(o.u) > 0.02) {
        const r = 24, s = Math.sign(o.u), a0 = inv ? -Math.PI * 0.85 : Math.PI * 0.15, a1 = inv ? -Math.PI * 0.15 : Math.PI * 0.85;
        ctx.strokeStyle = C.warn; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1); ctx.stroke();
        const ae = s > 0 ? (inv ? a1 : a0) : (inv ? a0 : a1);
        const ex = cx + r * Math.cos(ae), ey = cy + r * Math.sin(ae);
        ctx.fillStyle = C.warn; ctx.beginPath(); ctx.arc(ex, ey, 4, 0, 2 * Math.PI); ctx.fill();
        text(ctx, (o.uLabel || "u") + " = " + o.u.toFixed(2), cx + r + 6, inv ? cy + 30 : cy - 6, { color: "--warn", font: `13px ${FONT}` });
      }
      text(ctx, (o.angleLabel || "θ = x₁") + " = " + deg(th) + "°", 12, 20, { color: "--ink", font: `14px ${FONT}` });
      text(ctx, (o.speedLabel || "ω = x₂") + " = " + x[1].toFixed(2), 12, 40, { color: "--ink", font: `14px ${FONT}` });
      if (o.status) text(ctx, o.status[0], 12, H - 14, { color: o.status[1] || "--accent", font: `bold 16px ${FONT}` });
      drawGauge(ctx, W, H, lab);
    },

    spring(ctx, W, H, lab) {
      const x = lab.trajs[0].x, wallX = 26, cy = H / 2, rest = W / 2 - 30, scale = (W / 2 - 80) / ((val(lab.cfg.lim, lab.P)[1]) || 3);
      const mx = Math.max(wallX + 60, Math.min(W - 90, rest + x[0] * scale));
      ctx.fillStyle = C.muted; ctx.fillRect(wallX - 10, cy - 70, 10, 140); ctx.fillRect(wallX, cy + 40, W - 80, 4);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(wallX, cy);
      const coils = 12, sx = (mx - 30 - wallX) / coils;
      for (let k = 0; k < coils; k++) ctx.lineTo(wallX + (k + 0.5) * sx, cy + (k % 2 ? 13 : -13));
      ctx.lineTo(mx - 30, cy); ctx.stroke();
      ctx.fillStyle = C.accent; roundRect(ctx, mx - 30, cy - 30, 60, 70, 8); ctx.fill();
      ctx.setLineDash([4, 6]); ctx.strokeStyle = C.muted;
      ctx.beginPath(); ctx.moveTo(rest, cy - 70); ctx.lineTo(rest, cy + 60); ctx.stroke(); ctx.setLineDash([]);
      text(ctx, "x₁ = " + x[0].toFixed(2), 12, 20, { color: "--ink", font: `14px ${FONT}` });
      text(ctx, "x₂ = " + x[1].toFixed(2), 12, 40, { color: "--ink", font: `14px ${FONT}` });
      text(ctx, "x₁ = 0", rest, cy + 78, { align: "center", font: `12px ${FONT}` });
      drawGauge(ctx, W, H, lab);
    },

    msd(ctx, W, H, lab) {
      const o = val(lab.cfg.sideOpts, lab.P, lab) || {}, x = lab.trajs[0].x, xmax = o.xmax || 3;
      const ground = H * 0.62, wall = 14, cx = W * 0.56, scale = W * 0.3 / xmax, bw = Math.min(60, W * 0.14), bh = bw;
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(wall, ground); ctx.lineTo(W - 8, ground); ctx.moveTo(wall, ground); ctx.lineTo(wall, ground - 86); ctx.stroke();
      ctx.lineWidth = 1; ctx.strokeStyle = C.muted;
      for (let y = ground - 80; y < ground; y += 10) { ctx.beginPath(); ctx.moveTo(wall, y); ctx.lineTo(wall - 8, y + 8); ctx.stroke(); }
      ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(cx, ground + 4); ctx.lineTo(cx, ground - 74); ctx.stroke(); ctx.setLineDash([]);
      const bx = Math.max(wall + 70, Math.min(W - bw / 2 - 4, cx + x[0] * scale)), left = bx - bw / 2;
      // spring
      const sy = ground - 34, n = 10, amp = 7, a = wall + (left - wall) * 0.12, b = left - (left - wall) * 0.12;
      ctx.strokeStyle = col(o.springColor || "--ink"); ctx.lineWidth = 1.7; ctx.beginPath(); ctx.moveTo(wall, sy); ctx.lineTo(a, sy);
      for (let i = 1; i <= n; i++) ctx.lineTo(a + (b - a) * (i - 0.5) / n, sy + (i % 2 ? -amp : amp));
      ctx.lineTo(b, sy); ctx.lineTo(left, sy); ctx.stroke();
      // damper
      const dy = ground - 12, cyl = Math.max(24, (cx - xmax * scale - bw / 2 - wall) * 0.85);
      ctx.strokeStyle = col(o.dampColor || "--accent"); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(wall, dy - 7); ctx.lineTo(wall + cyl, dy - 7); ctx.moveTo(wall, dy + 7); ctx.lineTo(wall + cyl, dy + 7);
      const plate = wall + 4 + Math.max(0, Math.min(1, (left - wall - 40) / (W - wall - 40))) * (cyl - 8);
      ctx.moveTo(plate, dy - 5); ctx.lineTo(plate, dy + 5); ctx.moveTo(plate, dy); ctx.lineTo(left, dy); ctx.stroke();
      // mass
      ctx.fillStyle = C.panel; ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
      roundRect(ctx, left, ground - bh, bw, bh, 6); ctx.fill(); ctx.stroke();
      text(ctx, "m", bx, ground - bh / 2 + 6, { align: "center", color: "--ink", font: `italic 17px ${FONT}` });
      if (o.dampText) text(ctx, o.dampText, W / 2, ground + 28, { align: "center", color: o.dampColor || "--muted" });
      if (o.springText) text(ctx, o.springText, W / 2, ground + 48, { align: "center", color: o.springColor || "--muted" });
      text(ctx, "x = " + x[0].toFixed(2) + "   v = " + x[1].toFixed(2), 12, 20, { color: "--ink", font: `14px ${FONT}` });
      if (o.inset) o.inset(ctx, W, H);
    },

    dog(ctx, W, H, lab) {
      const tr0 = lab.trajs[0], P = lab.P, gy = H - 54, cx = W / 2 - 30, fall = lab.cfg.fallAngle || Math.PI / 2;
      const s = Math.min(1, H / 330);
      ctx.fillStyle = C.ground; ctx.fillRect(0, gy, W, 6);
      ctx.setLineDash([4, 6]); ctx.strokeStyle = C.muted; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, gy); ctx.lineTo(cx, gy - 230 * s); ctx.stroke(); ctx.setLineDash([]);
      const theta = Math.max(-fall, Math.min(fall, tr0.x[0]));
      ctx.save(); ctx.translate(cx, gy); ctx.rotate(theta); ctx.scale(s, s);
      ctx.strokeStyle = C.robot; ctx.lineWidth = 12; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-38, -110); ctx.lineTo(-42, -55); ctx.lineTo(-36, -4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(38, -110); ctx.lineTo(42, -55); ctx.lineTo(36, -4); ctx.stroke();
      ctx.fillStyle = C.ink;
      ctx.beginPath(); ctx.arc(-36, -4, 8, 0, 2 * Math.PI); ctx.fill();
      ctx.beginPath(); ctx.arc(36, -4, 8, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = C.robot; roundRect(ctx, -70, -175, 140, 72, 16); ctx.fill();
      roundRect(ctx, -34, -222, 68, 52, 12); ctx.fill();
      ctx.fillStyle = C.panel;
      ctx.beginPath(); ctx.arc(-13, -197, 7, 0, 2 * Math.PI); ctx.fill();
      ctx.beginPath(); ctx.arc(13, -197, 7, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = C.accent;
      ctx.beginPath(); ctx.arc(-13, -197, 3.5, 0, 2 * Math.PI); ctx.fill();
      ctx.beginPath(); ctx.arc(13, -197, 3.5, 0, 2 * Math.PI); ctx.fill();
      ctx.restore();
      text(ctx, { en: "tilt x₁ = ", fa: "کج شدن x₁ = " }[LANG] + deg(tr0.x[0]) + "°", 12, 20, { color: "--ink", font: `14px ${FONT}` });
      text(ctx, { en: "tilt speed x₂ = ", fa: "سرعت کج شدن x₂ = " }[LANG] + tr0.x[1].toFixed(2), 12, 40, { color: "--ink", font: `14px ${FONT}` });
      let status, color;
      if (tr0.fallen) { status = { en: "FALLEN", fa: "افتاد" }; color = "--warn"; }
      else if (Math.abs(tr0.x[0]) < 0.03 && Math.abs(tr0.x[1]) < 0.03) { status = { en: "STANDING", fa: "ایستاده" }; color = "--ok"; }
      else if (P.on) { status = { en: "RECOVERING", fa: "در حال برگشت" }; color = "--accent"; }
      else { status = { en: "TIPPING OVER", fa: "در حال افتادن" }; color = "--warn"; }
      text(ctx, status, 12, H - 16, { color, font: `bold 17px ${FONT}` });
      drawGauge(ctx, W, H, lab);
    },

    bowl1d(ctx, W, H, lab) {
      const cfg = lab.cfg, [a, b] = cfg.lim, vmax = val(cfg.vmax, lab.P) || 2;
      const toP = (x, y) => [(x - a) / (b - a) * (W - 70) + 10, H - 36 - y / vmax * (H - 76)];
      ctx.strokeStyle = C.accent; ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i <= 300; i++) { const x = a + (b - a) * i / 300, [px, py] = toP(x, cfg.V([x], lab.P)); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke();
      lab.trajs.forEach((t, i) => {
        const [px, py] = toP(t.x[0], cfg.V(t.x, lab.P));
        ctx.fillStyle = i === 0 ? C.ink : t.color;
        ctx.beginPath(); ctx.arc(px, py - 8, i === 0 ? 9 : 7, 0, 2 * Math.PI); ctx.fill();
      });
      text(ctx, val(cfg.bowlLabel) || "V(x)", 14, 20);
      drawGauge(ctx, W, H, lab);
    }
  };

  // ------------------------------------------------------------------ the lab
  let nextColor = 0;
  const ALL = [];

  class Lab {
    constructor(el, cfg) {
      this.el = el; this.cfg = cfg;
      this.mode = cfg.mode || "plane";
      this.dim = cfg.dim || (this.mode === "line" ? 1 : 2);
      this.dynamic = !cfg.static && typeof cfg.f === "function";
      this.hasSide = !!cfg.side;
      this.hasPhase = this.mode !== "time";
      this.hasTime = this.dynamic && cfg.time !== false;
      this.P = JSON.parse(JSON.stringify(cfg.params || {}));
      this.trajs = []; this.t = 0; this.playing = true; this.visible = true; this.dirty = true; this.width = 0;
      this.showField = cfg.field !== false; this.showLevels = true;
      if (cfg.series) this.series = typeof cfg.series === "function" ? [{ f: cfg.series }] : cfg.series;
      else if (cfg.V) this.series = [{ f: (x, P) => cfg.V(x, P), label: "V" }];
      else this.series = [{ f: x => x[0], label: "x₁" }];
      this.build();
      this.resize();
      this.paramsChanged();
      this.reset();
    }

    lim() { return (typeof this.cfg.lim === "function" ? this.cfg.lim(this.P) : this.cfg.lim) || [-1, 1, -1, 1]; }

    Vdot(x, t = 0) {
      const cfg = this.cfg;
      if (cfg.Vdot) return cfg.Vdot(x, this.P, t);
      const g = numGrad(cfg.V, x, this.P), fx = cfg.f(x, this.P, t);
      return g.reduce((s, gi, i) => s + gi * fx[i], 0);
    }

    // ---------------- DOM
    build() {
      const cfg = this.cfg, el = this.el;
      const mk = (tag, cls, parent, attrs = {}) => {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
        parent.appendChild(n); return n;
      };
      el.innerHTML = "";
      if (cfg.eq) this.eqEl = mk("div", "lab-eq", el, { dir: "ltr" });
      if (cfg.caption) this.capEl = mk("div", "lab-caption", el, { "aria-live": "polite" });
      this.ctlEl = mk("div", "lab-controls", el);
      this.buildControls();
      const grid = mk("div", "lab-grid" + (this.hasSide ? "" : " no-side"), el, { dir: "ltr" });
      this.grid = grid;
      const panel = (cls, titleKey) => {
        const p = mk("div", "lab-panel " + cls, grid);
        const t = mk("div", "lab-ptitle", p, { dir: document.documentElement.dir || "ltr" });
        const cv = mk("canvas", "", p);
        return { p, t, cv, titleKey };
      };
      if (this.hasSide) this.side = panel("p-side", "sideTitle");
      if (this.hasPhase) this.phase = panel("p-phase", "phaseTitle");
      if (this.hasTime) { this.time = panel("p-time", "timeTitle"); this.readout = mk("div", "lab-readout", this.time.p); }
      if (this.hasPhase && this.dynamic && cfg.click !== false) {
        this.phase.cv.classList.add("clickable");
        this.phase.cv.addEventListener("click", e => this.onClick(e));
      }
      if (this.dynamic || (cfg.V && cfg.levels)) {
        const act = mk("div", "lab-actions", el, { dir: "ltr" });
        if (this.dynamic) {
          const play = mk("button", "", act, { type: "button" });
          play.textContent = tr(UI.pause);
          play.addEventListener("click", () => { this.playing = !this.playing; play.textContent = tr(this.playing ? UI.pause : UI.play); });
          this.playBtn = play;
          const rs = mk("button", "", act, { type: "button" });
          rs.textContent = tr(UI.reset);
          rs.addEventListener("click", () => { this.P = JSON.parse(JSON.stringify(cfg.params || {})); this.paramsChanged(); this.reset(); });
        }
        const check = (label, get, set) => {
          const l = mk("label", "", act), c = mk("input", "", l, { type: "checkbox" });
          c.checked = get(); l.append(" " + tr(label));
          c.addEventListener("change", () => { set(c.checked); this.dirty = true; });
        };
        if (this.mode === "plane" && this.dynamic && cfg.field !== false) check(UI.field, () => this.showField, v => this.showField = v);
        if (this.mode === "plane" && cfg.V && cfg.levels) check(UI.levels, () => this.showLevels, v => this.showLevels = v);
      }
      if (this.dynamic && cfg.hint !== false && this.hasPhase && cfg.click !== false) {
        const hint = mk("p", "lab-hint", el);
        hint.textContent = val(cfg.hint) || tr(this.mode === "line" ? UI.hintLine : UI.hintPlane);
      }
    }

    buildControls() {
      const cfg = this.cfg;
      this.ctlEl.innerHTML = "";
      this.syncers = [];
      for (const c of cfg.controls || []) {
        if (c.type === "slider") {
          const lab = document.createElement("label");
          const inp = document.createElement("input");
          Object.assign(inp, { type: "range", min: c.min, max: c.max, step: c.step });
          inp.dir = "ltr";
          const out = document.createElement("output");
          const digits = c.digits ?? 2;
          const sync = () => { inp.value = this.P[c.key]; out.textContent = Number(this.P[c.key]).toFixed(digits); };
          inp.addEventListener("input", () => { this.P[c.key] = parseFloat(inp.value); out.textContent = this.P[c.key].toFixed(digits); this.paramsChanged(); if (c.reset) this.reset(); });
          lab.append(tr(c.label) + " ", inp, out);
          this.ctlEl.appendChild(lab); this.syncers.push(sync);
        } else if (c.type === "toggle") {
          const b = document.createElement("button");
          b.type = "button";
          const sync = () => { b.textContent = tr(this.P[c.key] ? c.labelOn : c.labelOff); b.className = this.P[c.key] ? "on" : "off"; };
          b.addEventListener("click", () => { this.P[c.key] = !this.P[c.key]; this.paramsChanged(); if (c.reset) this.reset(); });
          this.ctlEl.appendChild(b); this.syncers.push(sync);
        } else if (c.type === "button") {
          const b = document.createElement("button");
          b.type = "button"; b.textContent = tr(c.label);
          b.addEventListener("click", () => { c.action(this.P, this); this.paramsChanged(); });
          this.ctlEl.appendChild(b);
        } else if (c.type === "select") {
          const lab = document.createElement("label"), s = document.createElement("select");
          for (const o of c.options) { const op = document.createElement("option"); op.value = o.value; op.textContent = tr(o.label); s.appendChild(op); }
          const sync = () => { s.value = this.P[c.key]; };
          s.addEventListener("change", () => { this.P[c.key] = s.value; this.paramsChanged(); this.reset(); });
          lab.append(tr(c.label) + " ", s);
          this.ctlEl.appendChild(lab); this.syncers.push(sync);
        }
      }
    }

    paramsChanged() {
      const cfg = this.cfg;
      if (cfg.onParams) cfg.onParams(this.P, this);
      if (this.eqEl) this.eqEl.textContent = val(cfg.eq, this.P, this);
      const def = { sideTitle: "", phaseTitle: this.mode === "line" ? "f(x)" : UI.phase, timeTitle: cfg.V && !cfg.series ? UI.timeV : (cfg.series ? "" : UI.timeX) };
      for (const p of [this.side, this.phase, this.time]) if (p) p.t.textContent = val(cfg[p.titleKey], this.P, this) ?? tr(def[p.titleKey]);
      (this.syncers || []).forEach(s => s());
      this.dirty = true;
    }

    resize() {
      const cfg = this.cfg, narrow = this.el.clientWidth < 700;
      if (this.phase) {
        const asp = cfg.aspect || (this.hasSide && !narrow ? 1.12 : 1.6);
        this.phaseC = sizeCanvas(this.phase.cv, asp, 220, 560);
        if (this.phaseC) {
          this.bg = this.bg || document.createElement("canvas");
          this.bg.width = this.phaseC.cv.width; this.bg.height = this.phaseC.cv.height;
        }
      }
      if (this.side) {
        // beside the phase plane: same height, so the two panels line up
        const sw = this.side.cv.clientWidth;
        const asp = !narrow && this.phaseC && sw ? sw / this.phaseC.H : (cfg.sideAspect || 1.15);
        this.sideC = sizeCanvas(this.side.cv, asp, 220, 560);
      }
      if (this.time) this.timeC = sizeCanvas(this.time.cv, cfg.timeAspect || (this.mode === "time" ? 2.2 : 3.6), 140, 360);
      this.width = this.el.clientWidth;
      this.dirty = true;
    }

    makeTraj(x0) {
      const x = x0.slice(0, this.dim);
      while (x.length < this.dim) x.push(0);
      const t = { x, x0: x.slice(), t0: this.t, t: 0, trail: [[x[0], x[1] ?? 0]], hist: [], color: PALETTE[nextColor++ % PALETTE.length], done: false, fallen: false };
      t.hist.push([this.t, ...this.series.map(s => s.f(x, this.P, 0))]);
      return t;
    }

    reset() {
      this.t = 0; this.trange = null;
      const starts = val(this.cfg.starts, this.P, this) || (this.dynamic ? [[0.5, 0]] : []);
      nextColor = 0;
      this.trajs = starts.map(s => this.makeTraj(s));
      if (this.cfg.onReset) this.cfg.onReset(this);
      this.dirty = true;
    }

    addTraj(x0) {
      const t = this.makeTraj(x0);
      this.trajs.unshift(t);
      if (this.trajs.length > (this.cfg.maxTrajs || 7)) this.trajs.pop();
      this.dirty = true;
      return t;
    }

    onClick(e) {
      const r = this.phase.cv.getBoundingClientRect(), map = this.phaseMap();
      if (!map) return;
      const p = map.inv(e.clientX - r.left, e.clientY - r.top);
      const x0 = this.cfg.makeStart ? this.cfg.makeStart(p, this.P) : (this.mode === "line" ? [p[0]] : p);
      this.addTraj(x0);
    }

    phaseMap() { return this.phaseC ? makeMap(this.lim(), this.phaseC.W, this.phaseC.H) : null; }

    // ---------------- simulation
    step() {
      if (!this.dynamic || !this.playing) return;
      const h = this.cfg.dt || 0.01, n = this.cfg.substeps || 3;
      this.t += h * n;
      for (const t of this.trajs) this.advance(t, h, n);
    }

    advance(tr0, h, n) {
      const cfg = this.cfg, P = this.P;
      if (!tr0.done && !tr0.fallen) {
        for (let k = 0; k < n; k++) {
          tr0.x = rk4(cfg.f, tr0.x, tr0.t, h, P); tr0.t += h;
          if (cfg.wrap) {
            const { period, max } = cfg.wrap;
            if (tr0.x[0] > max) { tr0.x[0] -= period; tr0.trail.push(null); }
            else if (tr0.x[0] < -max) { tr0.x[0] += period; tr0.trail.push(null); }
          }
          if (cfg.onStep) cfg.onStep(tr0, this);
          if (tr0.done || tr0.fallen) break;
        }
        const x = tr0.x;
        if (!x.every(isFinite)) tr0.done = true;
        else if (this.mode === "time") { if (x.some(v => Math.abs(v) > (cfg.escape || 1e6))) tr0.done = true; }
        else {
          const [a, b, lo, hi] = this.lim(), mx = (b - a) * 0.6, my = (hi - lo) * 0.6;
          if (x[0] < a - mx || x[0] > b + mx) tr0.done = true;
          if (this.mode === "plane" && (x[1] < lo - my || x[1] > hi + my)) tr0.done = true;
        }
        if (x.every(isFinite)) tr0.trail.push([x[0], x[1] ?? 0]);
      }
      const vals = this.series.map(s => s.f(tr0.x, P, tr0.t));
      tr0.hist.push([this.t, ...vals]);
      if (tr0.trail.length > 2200) tr0.trail.splice(0, tr0.trail.length - 2200);
      const W = (cfg.tWindow || 25) + 2;
      while (tr0.hist.length > 2 && tr0.hist[0][0] < this.t - W) tr0.hist.shift();
    }

    // ---------------- drawing
    renderBg() {
      const cfg = this.cfg, P = this.P, pc = this.phaseC;
      if (!pc) return;
      const ctx = this.bg.getContext("2d");
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, this.bg.width, this.bg.height);
      ctx.setTransform(pc.d, 0, 0, pc.d, 0, 0);
      const map = makeMap(this.lim(), pc.W, pc.H), W = pc.W, H = pc.H;
      ctx.fillStyle = C.panel; ctx.fillRect(0, 0, W, H);
      if (cfg.drawPhase) { cfg.drawPhase(ctx, map, this); return; }
      if (this.mode === "line") return this.renderLineBg(ctx, map);

      for (const s of val(cfg.shades, P, this) || []) {
        ctx.save(); ctx.globalAlpha = s.alpha ?? 1;
        shade(ctx, x => s.when(x, P), map, col(s.color || "--shade"), s.N || 130);
        ctx.restore();
      }
      // axes
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      const ox = map.X(0), oy = map.Y(0);
      ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.moveTo(ox, 0); ctx.lineTo(ox, H); ctx.stroke();
      const ax = cfg.axes || {};
      text(ctx, ax.x || "x₁", W - 8, oy - 7, { align: "right", font: `italic 14px ${FONT}` });
      text(ctx, ax.y || "x₂", ox + 7, 16, { font: `italic 14px ${FONT}` });
      if (ax.pi) {
        for (const [k, s] of [[-2, "−2π"], [-1, "−π"], [1, "π"], [2, "2π"]]) {
          const px = map.X(k * Math.PI);
          if (px > 12 && px < W - 12) {
            ctx.strokeStyle = C.grid; ctx.beginPath(); ctx.moveTo(px, oy - 4); ctx.lineTo(px, oy + 4); ctx.stroke();
            text(ctx, s, px, oy + 16, { align: "center", font: `12px ${FONT}` });
          }
        }
      }
      // domain boundaries
      const dl = val(cfg.domainLines, P, this);
      if (dl && dl.length) {
        ctx.save(); ctx.setLineDash([2, 4]); ctx.strokeStyle = C.warn; ctx.lineWidth = 1.3;
        for (const s of dl) { const fx = map.X(s); ctx.beginPath(); ctx.moveTo(fx, 0); ctx.lineTo(fx, H); ctx.stroke(); }
        ctx.restore();
        text(ctx, val(cfg.domainLabel, P) || { en: "edge of D", fa: "مرز D" }, map.X(dl[dl.length - 1]) + 4, 14, { color: "--warn", font: `12px ${FONT}` });
      }
      // level sets of V
      const levels = val(cfg.levels, P, this);
      if (this.showLevels && cfg.V && levels && levels.length) {
        const g = sampleGrid(x => cfg.V(x, P), map, 140);
        for (const c of levels) contourGrid(ctx, g, c, c < 0 ? C.warn : C.muted, 1, [5, 5]);
      }
      for (const k of val(cfg.contours, P, this) || []) contour(ctx, x => k.F(x, P), k.c, map, col(k.color || "--accent"), k.width || 2.4, k.dash || [], k.N || 160);
      for (const cv of val(cfg.curves, P, this) || []) {
        if (!cv.pts || !cv.pts.length) continue;
        ctx.save(); ctx.strokeStyle = col(cv.color || "--ink"); ctx.lineWidth = cv.width || 1.6; ctx.setLineDash(cv.dash || []);
        ctx.beginPath();
        let pen = false;
        for (const p of cv.pts) { if (!p) { pen = false; continue; } pen ? ctx.lineTo(map.X(p[0]), map.Y(p[1])) : ctx.moveTo(map.X(p[0]), map.Y(p[1])); pen = true; }
        ctx.stroke(); ctx.restore();
        if (cv.label) { const p = cv.labelAt || cv.pts[Math.floor(cv.pts.length * 0.15)]; text(ctx, cv.label, map.X(p[0]) + 6, map.Y(p[1]) - 6, { color: cv.color || "--ink", font: `12px ${FONT}` }); }
      }
      if (cfg.drawBg) cfg.drawBg(ctx, map, this);
      // vector field
      if (this.showField && this.dynamic) {
        const [a, b, lo, hi] = map.lim, nx = cfg.fieldN || 11, ny = Math.max(5, Math.round(nx * H / W));
        for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
          const x1 = a + (i + 0.5) * (b - a) / nx, x2 = lo + (j + 0.5) * (hi - lo) / ny;
          const x = [x1, x2]; while (x.length < this.dim) x.push(0);
          const v = cfg.f(x, P, 0);
          const vx = v[0] / (b - a) * W, vy = -v[1] / (hi - lo) * H, m = Math.hypot(vx, vy);
          if (!(m > 1e-9)) continue;
          const L = Math.min(W / nx, H / ny) * 0.62;
          arrow(ctx, map.X(x1) - vx / m * L / 2, map.Y(x2) - vy / m * L / 2, vx / m * L, vy / m * L, C.field, 1.2, 5);
        }
      }
    }

    renderLineBg(ctx, map) {
      const cfg = this.cfg, P = this.P, W = map.W, H = map.H, [a, b] = map.lim;
      const fx = x => cfg.f([x], P, 0)[0];
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, map.Y(0)); ctx.lineTo(W, map.Y(0)); ctx.moveTo(map.X(0), 0); ctx.lineTo(map.X(0), H); ctx.stroke();
      ctx.strokeStyle = C.accent; ctx.lineWidth = 2.5; ctx.beginPath();
      for (let i = 0; i <= 400; i++) { const x = a + (b - a) * i / 400, y = fx(x); i ? ctx.lineTo(map.X(x), map.Y(y)) : ctx.moveTo(map.X(x), map.Y(y)); }
      ctx.stroke();
      text(ctx, val(cfg.fLabel, P) || "ẋ = f(x)", 10, 18, { color: "--accent", font: `13px ${FONT}` });
      text(ctx, "x", W - 8, map.Y(0) - 7, { align: "right", font: `italic 14px ${FONT}` });
      // direction of motion along the axis
      for (let i = 1; i < 12; i++) {
        const x = a + (b - a) * i / 12, v = fx(x);
        if (Math.abs(v) < 1e-6) continue;
        arrow(ctx, map.X(x) - Math.sign(v) * 9, map.Y(0) + 16, Math.sign(v) * 18, 0, C.muted, 1.5, 5);
      }
      // equilibria = zeros of f
      let prev = fx(a);
      for (let i = 1; i <= 800; i++) {
        const x = a + (b - a) * i / 800, v = fx(x);
        if (v === 0 || prev * v < 0) {
          const stable = prev > 0 && v <= 0;
          ctx.beginPath(); ctx.arc(map.X(x), map.Y(0), 6, 0, 2 * Math.PI);
          ctx.fillStyle = stable ? C.accent : C.panel; ctx.fill();
          ctx.strokeStyle = stable ? C.accent : C.warn; ctx.lineWidth = 2; ctx.stroke();
        }
        prev = v;
      }
      if (cfg.drawBg) cfg.drawBg(ctx, map, this);
    }

    drawEquilibria(ctx, map) {
      for (const [e1, e2, type] of val(this.cfg.equilibria, this.P, this) || []) {
        const px = map.X(e1), py = map.Y(e2);
        if (px < -10 || px > map.W + 10) continue;
        ctx.lineWidth = 2;
        if (type === "stable") { ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(px, py, 6.5, 0, 2 * Math.PI); ctx.fill(); }
        else if (type === "saddle") {
          ctx.fillStyle = C.panel; ctx.strokeStyle = C.warn;
          ctx.beginPath(); ctx.moveTo(px, py - 8); ctx.lineTo(px + 8, py); ctx.lineTo(px, py + 8); ctx.lineTo(px - 8, py); ctx.closePath(); ctx.fill(); ctx.stroke();
        } else {
          ctx.fillStyle = C.panel; ctx.strokeStyle = type === "center" ? C.accent : C.warn;
          ctx.beginPath(); ctx.arc(px, py, 6.5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
        }
      }
    }

    drawPhaseFrame() {
      const pc = this.phaseC;
      if (!pc) return;
      const ctx = pc.ctx, map = makeMap(this.lim(), pc.W, pc.H);
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(this.bg, 0, 0);
      ctx.setTransform(pc.d, 0, 0, pc.d, 0, 0);
      if (this.cfg.drawPhase) { if (this.cfg.drawTop) this.cfg.drawTop(ctx, map, this); return; }
      if (this.mode === "line") {
        this.trajs.forEach((t, i) => {
          ctx.fillStyle = i === 0 ? C.ink : t.color;
          ctx.beginPath(); ctx.arc(map.X(t.x[0]), map.Y(0), i === 0 ? 8 : 6, 0, 2 * Math.PI); ctx.fill();
        });
      } else {
        for (let i = this.trajs.length - 1; i >= 0; i--) {
          const t = this.trajs[i], color = i === 0 ? C.ink : t.color;
          ctx.strokeStyle = color; ctx.lineWidth = i === 0 ? 3 : 1.9; ctx.lineJoin = "round";
          ctx.beginPath();
          let pen = false;
          for (const p of t.trail) { if (!p) { pen = false; continue; } pen ? ctx.lineTo(map.X(p[0]), map.Y(p[1])) : ctx.moveTo(map.X(p[0]), map.Y(p[1])); pen = true; }
          ctx.stroke();
          const bx = map.X(t.x[0]), by = map.Y(t.x[1]);
          ctx.fillStyle = color; ctx.beginPath(); ctx.arc(bx, by, i === 0 ? 6.5 : 4.5, 0, 2 * Math.PI); ctx.fill();
          if (i === 0 && !t.done && !t.fallen && this.dynamic) {
            const v = this.cfg.f(t.x, this.P, t.t), [a, b, lo, hi] = map.lim;
            const vx = v[0] / (b - a) * map.W, vy = -v[1] / (hi - lo) * map.H, m = Math.hypot(vx, vy);
            if (m > 0.5) arrow(ctx, bx, by, vx / m * 20, vy / m * 20, C.warn, 2);
          }
        }
        this.drawEquilibria(ctx, map);
      }
      if (this.cfg.drawTop) this.cfg.drawTop(ctx, map, this);
    }

    drawSide() {
      const sc = this.sideC;
      if (!sc || !this.trajs.length && !this.cfg.static) return;
      const ctx = sc.ctx;
      ctx.clearRect(0, 0, sc.W, sc.H);
      ctx.fillStyle = C.panel; ctx.fillRect(0, 0, sc.W, sc.H);
      const s = this.cfg.side;
      if (typeof s === "function") s(ctx, sc.W, sc.H, this);
      else if (SIDES[s] && this.trajs.length) SIDES[s](ctx, sc.W, sc.H, this);
    }

    drawTime() {
      const tc = this.timeC;
      if (!tc) return;
      const cfg = this.cfg, ctx = tc.ctx, W = tc.W, H = tc.H;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.panel; ctx.fillRect(0, 0, W, H);
      const padL = 46, padR = 14, padT = 14, padB = 26, WIN = cfg.tWindow || 25;
      const t0 = Math.max(0, this.t - WIN), t1 = Math.max(WIN, this.t);
      let [ymin, ymax] = val(cfg.tlim, this.P, this) || [NaN, NaN];
      if (!isFinite(ymin) && cfg.V && !cfg.series) { ymin = 0; ymax = val(cfg.vmax, this.P) || 4; }
      if (!isFinite(ymin)) {
        // auto range that only grows until the next reset (no jitter)
        let lo = Infinity, hi = -Infinity;
        for (const t of this.trajs) for (const h of t.hist) for (let k = 1; k < h.length; k++) if (isFinite(h[k])) { lo = Math.min(lo, h[k]); hi = Math.max(hi, h[k]); }
        if (!isFinite(lo)) { lo = -1; hi = 1; }
        if (this.trange) { lo = Math.min(lo, this.trange[0]); hi = Math.max(hi, this.trange[1]); }
        this.trange = [lo, hi];
        const pad = Math.max(1e-3, (hi - lo) * 0.08);
        ymin = lo - pad; ymax = hi + pad;
      }
      const X = t => padL + (t - t0) / (t1 - t0) * (W - padL - padR);
      const Y = v => H - padB - (Math.max(ymin, Math.min(ymax, v)) - ymin) / (ymax - ymin) * (H - padT - padB);
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      for (let k = 0; k <= 4; k++) {
        const v = ymin + (ymax - ymin) * k / 4, y = Y(v);
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
        const a = Math.abs(v);
        text(ctx, a >= 100 ? v.toFixed(0) : a >= 10 ? v.toFixed(1) : v.toFixed(2), padL - 6, y + 4, { align: "right", font: `11px ${FONT}` });
      }
      if (ymin < 0 && ymax > 0) { ctx.strokeStyle = C.muted; ctx.beginPath(); ctx.moveTo(padL, Y(0)); ctx.lineTo(W - padR, Y(0)); ctx.stroke(); }
      for (let s = Math.ceil(t0 / 5) * 5; s <= t1; s += 5) text(ctx, String(s), X(s), H - 8, { align: "center", font: `11px ${FONT}` });
      text(ctx, "t", W - padR, H - 8, { align: "right", font: `italic 13px ${FONT}` });
      for (const r of val(cfg.timeRefs, this.P, this) || []) {
        ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = col(r.color || "--ok"); ctx.lineWidth = 1.4;
        if (r.t !== undefined) { ctx.beginPath(); ctx.moveTo(X(r.t), padT); ctx.lineTo(X(r.t), H - padB); ctx.stroke(); if (r.label) text(ctx, r.label, X(r.t) + 4, padT + 12, { color: r.color || "--ok", font: `12px ${FONT}` }); }
        else { ctx.beginPath(); ctx.moveTo(padL, Y(r.y)); ctx.lineTo(W - padR, Y(r.y)); ctx.stroke(); if (r.label) text(ctx, r.label, W - padR - 4, Y(r.y) - 5, { align: "right", color: r.color || "--ok", font: `12px ${FONT}` }); }
        ctx.restore();
      }
      const multi = this.series.length > 1;
      for (let i = this.trajs.length - 1; i >= 0; i--) {
        const t = this.trajs[i];
        this.series.forEach((s, k) => {
          if (multi && i > 0 && !s.all) return;
          ctx.save();
          ctx.strokeStyle = s.color ? col(s.color) : (i === 0 ? C.ink : t.color);
          ctx.lineWidth = i === 0 ? 2.6 : 1.5;
          ctx.setLineDash(s.dash || []);
          ctx.beginPath(); let started = false, prev = 0;
          const jump = (ymax - ymin) * 0.6;
          for (const h of t.hist) {
            const v = h[k + 1];
            if (h[0] < t0 || !isFinite(v)) { started = false; continue; }
            if (!started || Math.abs(v - prev) > jump) { ctx.moveTo(X(h[0]), Y(v)); started = true; } else ctx.lineTo(X(h[0]), Y(v));
            prev = v;
          }
          ctx.stroke(); ctx.restore();
        });
      }
      if (multi) {
        let x = padL + 8;
        this.series.forEach(s => {
          ctx.save(); ctx.strokeStyle = s.color ? col(s.color) : C.ink; ctx.lineWidth = 2.4; ctx.setLineDash(s.dash || []);
          ctx.beginPath(); ctx.moveTo(x, padT + 8); ctx.lineTo(x + 22, padT + 8); ctx.stroke(); ctx.restore();
          const label = tr(s.label) || "";
          text(ctx, label, x + 28, padT + 12, { font: `12px ${FONT}`, color: "--ink" });
          ctx.save(); ctx.font = `12px ${FONT}`; x += 48 + ctx.measureText(label).width; ctx.restore();
        });
      }
      if (cfg.timeOverlay) cfg.timeOverlay(ctx, { X, Y, t0, t1, W, H, padL, padR, padT, padB }, this);
      // numeric readout for the highlighted trajectory
      if (this.readout && this.trajs.length) {
        const t = this.trajs[0];
        let s;
        if (cfg.readout) s = val(cfg.readout, t, this.P, this);
        else {
          s = t.x.map((v, i) => `x${"₁₂₃₄₅₆"[i] || i + 1} = ${v.toFixed(3)}`).join("   ");
          if (cfg.V) s += `\nV = ${cfg.V(t.x, this.P).toFixed(4)}   V̇ = ${(t.done || t.fallen ? 0 : this.Vdot(t.x, t.t)).toFixed(4)}`;
        }
        if (s !== this._ro) { this.readout.textContent = s; this._ro = s; }
      }
    }

    frame() {
      if (this.el.clientWidth && Math.abs(this.el.clientWidth - this.width) > 1) this.resize();
      const moving = this.dynamic && this.playing;
      if (!moving && !this.dirty && !this.cfg.animate) return;
      this.step();
      if (this.dirty) { this.renderBg(); }
      this.drawPhaseFrame();
      this.drawSide();
      this.drawTime();
      if (this.capEl) {
        const c = val(this.cfg.caption, this.P, this);
        if (c !== this._cap) { this.capEl.textContent = c; this._cap = c; }
      }
      this.dirty = false;
    }
  }

  // ------------------------------------------------------------------ registry & loop
  function mount(el, cfg) {
    try {
      const lab = new Lab(el, cfg);
      ALL.push(lab);
      if ("IntersectionObserver" in window) new IntersectionObserver(es => es.forEach(en => { lab.visible = en.isIntersecting; })).observe(el);
      if (reduceMotion && lab.dynamic) {
        // no animation: run the simulation forward and show the result
        for (let k = 0; k < 600; k++) lab.step();
        lab.playing = false;
        if (lab.playBtn) lab.playBtn.textContent = tr(UI.play);
        lab.dirty = true;
      }
      lab.frame();
    } catch (err) {
      console.error(err);
      el.innerHTML = "";
      const p = document.createElement("p"); p.className = "lab-error";
      p.textContent = tr(UI.error) + err.message; el.appendChild(p);
    }
  }

  function register(map) {
    for (const [id, cfg] of Object.entries(map)) {
      document.querySelectorAll(`.lab[data-lab="${id}"]`).forEach(el => mount(el, cfg));
    }
  }

  readColors();
  addEventListener("themechange", () => { readColors(); ALL.forEach(l => { l.dirty = true; l.frame(); }); });
  let rt;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => ALL.forEach(l => { l.resize(); l.frame(); }), 120); });
  (function loop() {
    for (const l of ALL) if (l.visible) l.frame();
    requestAnimationFrame(loop);
  })();

  window.NL = {
    register, tr, val, LANG, FONT, PALETTE, C, col, text, arrow, roundRect, rk4,
    contour, shade, sampleGrid, contourGrid, makeMap, drawGauge, SIDES,
    fa: LANG === "fa"
  };
})();
