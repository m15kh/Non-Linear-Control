// Chapter 7: frequency-domain analysis. Circle criterion and describing function.
(() => {
  "use strict";
  const { register, text, FONT, C, LANG } = NL;
  const T = (en, fa) => LANG === "fa" ? fa : en;

  // ------------------------------------------------ circle criterion for G(s) = 4/((s+1)(s/2+1)(s/3+1))
  function G(w) {
    // product of (1 + j w/p) for p = 1, 2, 3
    let re = 1, im = 0;
    for (const p of [1, 2, 3]) { const a = 1, b = w / p, r = re * a - im * b, i = re * b + im * a; re = r; im = i; }
    const d = re * re + im * im;
    return [4 * re / d, -4 * im / d];
  }
  const nyq = (() => { const pts = []; for (let i = 0; i <= 1200; i++) { const w = Math.pow(10, -2 + 4.5 * i / 1200); pts.push([w, ...G(w)]); } return pts; })();
  function check(P) {
    const a = Math.min(P.alpha, P.beta - 0.01), b = P.beta;
    if (a <= 1e-9) {
      const minRe = Math.min(...nyq.map(p => p[1]));
      return { ok: minRe > -1 / b, a: 0, b, minRe };
    }
    const c = -(1 / a + 1 / b) / 2, r = (1 / a - 1 / b) / 2;
    const dmin = Math.min(...nyq.map(p => Math.hypot(p[1] - c, p[2]))) ;
    return { ok: dmin > r, a, b, c, r, dmin };
  }
  const circle = {
    static: true,
    aspect: 1.25,
    lim: [-3, 4.6, -3.6, 2.4],
    params: { alpha: 0, beta: 1 },
    controls: [
      { type: "slider", key: "alpha", label: "α", min: 0, max: 1.5, step: 0.01 },
      { type: "slider", key: "beta", label: "β", min: 0.1, max: 5, step: 0.01 }
    ],
    phaseTitle: { en: "Nyquist plot of G(jω) (solid: ω > 0, dashed: ω < 0) and the critical disk D(α, β)", fa: "نمودار نایکوئیست G(jω) (پر: ω > 0، خط‌چین: ω < 0) و دیسک بحرانی D(α, β)" },
    sideTitle: { en: "The sector [α, β] and one nonlinearity inside it", fa: "قطاع [α, β] و یک غیرخطی داخل آن" },
    drawPhase(ctx, map, lab) {
      const { X, Y, W, H } = map, k = check(lab.P);
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(W, Y(0)); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), H); ctx.stroke();
      text(ctx, "Re", W - 8, Y(0) - 6, { align: "right", font: `italic 13px ${FONT}` });
      text(ctx, "Im", X(0) + 6, 14, { font: `italic 13px ${FONT}` });
      ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = k.ok ? C.ok : C.warn;
      if (k.a === 0) ctx.fillRect(0, 0, X(-1 / k.b), H);
      else { ctx.beginPath(); ctx.ellipse(X(k.c), Y(0), X(k.c + k.r) - X(k.c), Y(0) - Y(k.r), 0, 0, 2 * Math.PI); ctx.fill(); }
      ctx.restore();
      ctx.strokeStyle = k.ok ? C.ok : C.warn; ctx.lineWidth = 1.8;
      if (k.a === 0) { ctx.beginPath(); ctx.moveTo(X(-1 / k.b), 0); ctx.lineTo(X(-1 / k.b), H); ctx.stroke(); }
      else { ctx.beginPath(); ctx.ellipse(X(k.c), Y(0), X(k.c + k.r) - X(k.c), Y(0) - Y(k.r), 0, 0, 2 * Math.PI); ctx.stroke(); }
      for (const [sgn, dash] of [[1, []], [-1, [6, 4]]]) {
        ctx.strokeStyle = C.accent; ctx.lineWidth = 2.4; ctx.setLineDash(dash); ctx.beginPath();
        nyq.forEach((p, i) => i ? ctx.lineTo(X(p[1]), Y(sgn * p[2])) : ctx.moveTo(X(p[1]), Y(sgn * p[2])));
        ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(X(4), Y(0), 4, 0, 2 * Math.PI); ctx.fill();
      text(ctx, "G(0) = 4", X(4) - 4, Y(0) + 16, { align: "right", font: `12px ${FONT}` });
      text(ctx, k.a === 0 ? "Re s = −1/β" : "D(α, β)", k.a === 0 ? X(-1 / k.b) + 4 : X(k.c - k.r), k.a === 0 ? H - 10 : Y(k.r) - 6, { color: k.ok ? "--ok" : "--warn", font: `12px ${FONT}` });
    },
    side(ctx, W, H, lab) {
      const P = lab.P, a = Math.min(P.alpha, P.beta - 0.01), b = P.beta, s = Math.min(W, H) / 2 - 16, cx = W / 2, cy = H / 2, ym = 2;
      const X = y => cx + y / ym * s, Y = v => cy - v / (ym * Math.max(1, b)) * s;
      ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = C.accent; ctx.beginPath();
      ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(ym), Y(a * ym)); ctx.lineTo(X(ym), Y(b * ym)); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(-ym), Y(-a * ym)); ctx.lineTo(X(-ym), Y(-b * ym)); ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X(-ym), cy); ctx.lineTo(X(ym), cy); ctx.moveTo(cx, 8); ctx.lineTo(cx, H - 8); ctx.stroke();
      ctx.strokeStyle = C.muted; ctx.lineWidth = 1.4;
      for (const k of [a, b]) { ctx.beginPath(); ctx.moveTo(X(-ym), Y(-k * ym)); ctx.lineTo(X(ym), Y(k * ym)); ctx.stroke(); }
      ctx.strokeStyle = C.traj; ctx.lineWidth = 2.6; ctx.beginPath();
      for (let i = 0; i <= 200; i++) { const y = -ym + 2 * ym * i / 200, v = a * y + (b - a) * y / (1 + 2 * y * y); i ? ctx.lineTo(X(y), Y(v)) : ctx.moveTo(X(y), Y(v)); }
      ctx.stroke();
      text(ctx, "βy", X(ym) - 4, Y(b * ym) + 14, { align: "right", font: `italic 13px ${FONT}` });
      text(ctx, "αy", X(ym) - 4, Y(a * ym) - 6, { align: "right", font: `italic 13px ${FONT}` });
      text(ctx, "ψ(y)", X(0.3), Y(b * 0.6) - 6, { color: "--traj", font: `italic 13px ${FONT}` });
    },
    eq: P => {
      const k = check(P);
      return `G(s) = 4 / ((s + 1)(s/2 + 1)(s/3 + 1))      Hurwitz, 0 open-loop poles in Re s > 0
feedback  u = −ψ(t, y),   ψ in the sector [α, β] = [${k.a.toFixed(2)}, ${k.b.toFixed(2)}]
` + (k.a === 0
        ? `α = 0:  condition  Re G(jω) > −1/β = ${(-1 / k.b).toFixed(3)}   for all ω;   min Re G(jω) = ${k.minRe.toFixed(3)}`
        : `0 < α < β:  G(jω) must stay outside the disk D(α,β): center ${k.c.toFixed(3)}, radius ${k.r.toFixed(3)};   closest approach ${k.dmin.toFixed(3)}`);
    },
    caption: P => {
      const k = check(P);
      return k.ok
        ? T(`The Nyquist plot avoids the forbidden ${k.a === 0 ? "half-plane" : "disk"}: by the circle criterion, the loop is absolutely stable for every nonlinearity in the sector [${k.a.toFixed(2)}, ${k.b.toFixed(2)}], even a time-varying one. Push β up until the plot touches the boundary.`,
          `نمودار نایکوئیست از ${k.a === 0 ? "نیم‌صفحه" : "دیسک"} ممنوع دوری می‌کند: طبق معیار دایره، حلقه برای هر غیرخطی داخل قطاع [${k.a.toFixed(2)}, ${k.b.toFixed(2)}]، حتی متغیر با زمان، به‌طور مطلق پایدار است. β را بالا ببر تا نمودار به مرز برسد.`)
        : T("The Nyquist plot enters the forbidden region, so the circle criterion gives no guarantee for this sector. That does not prove instability: the criterion is only sufficient. Shrink β (or raise α).",
          "نمودار نایکوئیست وارد ناحیه‌ی ممنوع می‌شود، پس معیار دایره برای این قطاع تضمینی نمی‌دهد. این ناپایداری را ثابت نمی‌کند: معیار فقط کافی است. β را کوچک کن (یا α را بزرگ).");
    }
  };

  // ------------------------------------------------ describing function: Van der Pol amplitude ≈ 2
  const df = {
    lim: [-4.5, 4.5, -5, 5],
    params: { mu: 0.5 },
    controls: [{ type: "slider", key: "mu", label: "ε", min: 0.05, max: 3, step: 0.05 }],
    starts: [[0.2, 0], [4, 0]],
    f: (x, P) => [x[1], -x[0] + P.mu * (1 - x[0] * x[0]) * x[1]],
    equilibria: () => [[0, 0, "unstable"]],
    onStep(t) {
      if (t.pv !== undefined && t.pv > 0 && t.x[1] <= 0 && t.t > 1) { // velocity crosses zero downward: a peak of x
        if (t.lastPeak !== undefined) t.period = t.t - t.lastPeak;
        t.lastPeak = t.t; t.amp = t.x[0];
      }
      t.pv = t.x[1];
    },
    curves: () => {
      const pts = [];
      for (let i = 0; i <= 200; i++) { const th = 2 * Math.PI * i / 200; pts.push([2 * Math.cos(th), 2 * Math.sin(th)]); }
      return [{ pts, color: "--warn", width: 2, dash: [7, 5], label: { en: "predicted: a = 2", fa: "پیش‌بینی: a = ۲" }, labelAt: [1.45, 1.6] }];
    },
    series: [{ f: x => x[0], label: "x(t)" }],
    tlim: [-3, 3],
    timeTitle: { en: "x(t)", fa: "x(t)" },
    phaseTitle: { en: "Phase plane: dashed circle = describing-function prediction", fa: "صفحه‌ی فاز: دایره‌ی خط‌چین = پیش‌بینی تابع توصیفی" },
    eq: P => `ẍ − ε(1 − x²)ẋ + x = 0          ε = ${P.mu.toFixed(2)}
as a loop:  x = G(s)·(−ψ(x)),   G(s) = εs/(s² − εs + 1),   ψ(x) = x³/3
describing function of ψ:  Ψ(a) = a²/4
harmonic balance  1 + Ψ(a)·G(jω) = 0   ⇒   ω = 1,   a = 2      (independent of ε)`,
    caption: (P, lab) => {
      const t = lab.trajs.find(r => r.amp !== undefined && r.t > 30) || lab.trajs[0];
      if (!t || t.amp === undefined || t.t < 30) return T("Waiting for the oscillation to settle…", "صبر کن تا نوسان به حالت ماندگار برسد…");
      const per = t.period ? (2 * Math.PI / t.period) : NaN;
      return T(`Measured amplitude ${t.amp.toFixed(3)} and frequency ${per.toFixed(3)} rad/s, against the prediction 2 and 1. For small ε the first harmonic dominates and the prediction is excellent; for large ε the wave becomes a relaxation oscillation, the frequency drops, and the approximation degrades.`,
        `دامنه‌ی اندازه‌گیری‌شده ${t.amp.toFixed(3)} و فرکانس ${per.toFixed(3)} رادیان بر ثانیه، در برابر پیش‌بینی ۲ و ۱. برای ε کوچک هارمونیک اول غالب است و پیش‌بینی عالی است؛ برای ε بزرگ موج به نوسان آرام-ناگهانی تبدیل می‌شود، فرکانس کم می‌شود و تقریب ضعیف می‌شود.`);
    }
  };

  register({ "ch7-circle": circle, "ch7-df": df });
})();
