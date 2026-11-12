// Chapter 3: fundamental properties. Finite escape time, non-uniqueness, Gronwall bound.
(() => {
  "use strict";
  const { register, text, FONT, C, LANG, makeMap } = NL;
  const T = (en, fa) => LANG === "fa" ? fa : en;

  // ------------------------------------------------ finite escape time
  const F = { sq: x => x * x, lin: x => x, cube: x => -x * x * x };
  const escape = {
    mode: "line",
    params: { f: "sq" },
    controls: [{ type: "select", key: "f", label: "f(x)", options: [
      { value: "sq", label: { en: "ẋ = x²  (escapes in finite time)", fa: "ẋ = x²  (فرار در زمان محدود)" } },
      { value: "lin", label: { en: "ẋ = x  (grows, but forever defined)", fa: "ẋ = x  (رشد می‌کند ولی همیشه تعریف شده)" } },
      { value: "cube", label: { en: "ẋ = −x³  (decays)", fa: "ẋ = −x³  (میرا می‌شود)" } }
    ] }],
    lim: P => P.f === "sq" ? [-3, 3, -2, 9] : (P.f === "lin" ? [-3, 3, -3, 3] : [-2, 2, -8, 8]),
    starts: P => P.f === "cube" ? [[1.8], [-1.2]] : [[0.5], [-1]],
    f: (x, P) => [F[P.f](x[0])],
    dt: 0.002, substeps: 8,
    tWindow: 8,
    series: [{ f: x => x[0], label: "x(t)" }],
    tlim: [-3, 6],
    fLabel: P => ({ sq: "ẋ = x²", lin: "ẋ = x", cube: "ẋ = −x³" })[P.f],
    timeTitle: { en: "x(t); the dashed line is the predicted escape time 1/x₀", fa: "x(t)؛ خط‌چین زمان فرار پیش‌بینی‌شده‌ی 1/x₀ است" },
    phaseTitle: { en: "f(x) and the direction of motion", fa: "f(x) و جهت حرکت" },
    timeRefs: (P, lab) => {
      const t = lab.trajs[0];
      return P.f === "sq" && t && t.x0[0] > 0 ? [{ t: t.t0 + 1 / t.x0[0], label: "t = 1/x₀", color: "--warn" }] : [];
    },
    eq: P => ({
      sq: `ẋ = x²,   x(0) = x₀
x(t) = x₀ / (1 − x₀·t)      →  ∞  as  t → 1/x₀   (x₀ > 0)
f is locally Lipschitz, but not globally: |f(x) − f(y)| = |x + y|·|x − y|`,
      lin: `ẋ = x,   x(0) = x₀
x(t) = x₀·eᵗ      grows without bound, but is finite for every t
f is globally Lipschitz (L = 1)  ⇒  solution exists for all t ≥ 0 (Theorem 3.2)`,
      cube: `ẋ = −x³,   x(0) = x₀
x(t) = x₀ / √(1 + 2x₀²t)      decays to 0
f is only locally Lipschitz, yet the solution stays bounded, so it exists for all t (Theorem 3.3)`
    })[P.f],
    caption: (P, lab) => {
      const t = lab.trajs[0];
      if (P.f === "sq") return t && t.x0[0] > 0
        ? T(`Starting at x₀ = ${t.x0[0].toFixed(2)}, the solution reaches infinity at t = 1/x₀ = ${(1 / t.x0[0]).toFixed(2)}: a finite escape time. It is not a numerical problem; x(t) = x₀/(1 − x₀t) really has a vertical asymptote. Click a larger x₀: it escapes sooner.`,
          `از x₀ = ${t.x0[0].toFixed(2)} جواب در t = 1/x₀ = ${(1 / t.x0[0]).toFixed(2)} به بی‌نهایت می‌رسد: زمان فرار محدود. این مشکل عددی نیست؛ x(t) = x₀/(1 − x₀t) واقعاً یک مجانب عمودی دارد. روی x₀ بزرگ‌تر کلیک کن: زودتر فرار می‌کند.`)
        : T("From x₀ < 0 the solution creeps toward 0 and exists forever. Click a point with x > 0 to see an escape.", "از x₀ < 0 جواب آهسته به صفر نزدیک می‌شود و برای همیشه وجود دارد. روی نقطه‌ای با x > 0 کلیک کن تا فرار را ببینی.");
      if (P.f === "lin") return T("x·eᵗ also leaves the window, but it needs infinite time to reach infinity. A globally Lipschitz f can never produce a finite escape time.", "x·eᵗ هم از پنجره بیرون می‌رود، ولی برای رسیدن به بی‌نهایت زمان بی‌نهایت لازم دارد. یک f با لیپشیتز سراسری هرگز زمان فرار محدود نمی‌سازد.");
      return T("−x³ grows faster than x² for large |x|, yet nothing escapes: the sign points back to the origin, so solutions stay in a compact set and exist for all time.", "−x³ برای |x| بزرگ از x² هم سریع‌تر رشد می‌کند، ولی چیزی فرار نمی‌کند: علامتش به سمت مبدأ است، پس جواب‌ها در یک مجموعه‌ی فشرده می‌مانند و برای همیشه وجود دارند.");
    }
  };

  // ------------------------------------------------ non-uniqueness: x' = x^(1/3), x(0) = 0
  const cbrt = Math.cbrt;
  const sol = (t, tau) => t <= tau ? 0 : Math.pow(2 * (t - tau) / 3, 1.5);
  const nonuniq = {
    static: true,
    aspect: 1.4,
    lim: [0, 6, -0.3, 4.2],
    params: { tau: 1.5, d: 0.5 },
    controls: [
      { type: "slider", key: "tau", label: { en: "leave zero at τ", fa: "ترک صفر در τ" }, min: 0, max: 5, step: 0.05 },
      { type: "slider", key: "d", label: { en: "secant width δ", fa: "پهنای وتر δ" }, min: 0.01, max: 1, step: 0.01 }
    ],
    phaseTitle: { en: "Infinitely many solutions of ẋ = x^(1/3), x(0) = 0", fa: "بی‌نهایت جواب برای ẋ = x^(1/3)، x(0) = 0" },
    sideTitle: { en: "f(x) = x^(1/3) and the secant slope at 0", fa: "f(x) = x^(1/3) و شیب وتر در صفر" },
    drawPhase(ctx, map, lab) {
      const { X, Y, W, H } = map, P = lab.P;
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(W, Y(0)); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), H); ctx.stroke();
      for (let tau = 0; tau <= 5.01; tau += 0.5) {
        ctx.strokeStyle = C.field; ctx.lineWidth = 1.2; ctx.beginPath();
        for (let i = 0; i <= 300; i++) { const t = 6 * i / 300, x = sol(t, tau); i ? ctx.lineTo(X(t), Y(x)) : ctx.moveTo(X(t), Y(x)); }
        ctx.stroke();
      }
      ctx.strokeStyle = C.accent; ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i <= 400; i++) { const t = 6 * i / 400, x = sol(t, P.tau); i ? ctx.lineTo(X(t), Y(x)) : ctx.moveTo(X(t), Y(x)); }
      ctx.stroke();
      ctx.strokeStyle = C.warn; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(6), Y(0)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(X(P.tau), Y(0), 5, 0, 2 * Math.PI); ctx.fill();
      text(ctx, "t", W - 8, Y(0) + 16, { align: "right", font: `italic 14px ${FONT}` });
      text(ctx, "x", X(0) + 8, 16, { font: `italic 14px ${FONT}` });
      text(ctx, { en: "x(t) ≡ 0 is a solution too", fa: "x(t) ≡ 0 هم یک جواب است" }, X(0.2), Y(0) - 8, { color: "--warn" });
      text(ctx, "τ", X(P.tau), Y(0) + 18, { align: "center", color: "--accent", font: `italic 14px ${FONT}` });
    },
    side(ctx, W, H, lab) {
      const P = lab.P, m = makeMap([-1.2, 1.2, -1.2, 1.2], W, H);
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, m.Y(0)); ctx.lineTo(W, m.Y(0)); ctx.moveTo(m.X(0), 0); ctx.lineTo(m.X(0), H); ctx.stroke();
      ctx.strokeStyle = C.accent; ctx.lineWidth = 2.6; ctx.beginPath();
      for (let i = 0; i <= 400; i++) { const x = -1.2 + 2.4 * i / 400; i ? ctx.lineTo(m.X(x), m.Y(cbrt(x))) : ctx.moveTo(m.X(x), m.Y(cbrt(x))); }
      ctx.stroke();
      const s = cbrt(P.d) / P.d;
      ctx.strokeStyle = C.warn; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(m.X(-1.2), m.Y(-1.2 * s)); ctx.lineTo(m.X(1.2), m.Y(1.2 * s)); ctx.stroke();
      ctx.fillStyle = C.warn; ctx.beginPath(); ctx.arc(m.X(P.d), m.Y(cbrt(P.d)), 5, 0, 2 * Math.PI); ctx.fill();
      text(ctx, `|f(δ) − f(0)| / δ = δ^(−2/3) = ${s.toFixed(2)}`, 12, 20, { color: "--warn" });
      text(ctx, "f(x) = x^(1/3)", 12, H - 12, { color: "--accent" });
    },
    eq: P => `ẋ = x^(1/3),   x(0) = 0
x(t) = 0 for t ≤ τ,    x(t) = (2(t − τ)/3)^(3/2) for t > τ      (τ = ${P.tau.toFixed(2)})
every τ ≥ 0 gives a valid solution  ⇒  no uniqueness
secant slope near 0:  f(δ)/δ = δ^(−2/3) = ${(cbrt(P.d) / P.d).toFixed(2)}  →  ∞  as δ → 0`,
    caption: { en: "Each τ gives a different solution through the same initial point, so the future is not determined by the present. The culprit is on the right: shrink δ and the secant slope blows up. No Lipschitz constant L works at x = 0, so Theorem 3.1 does not apply.",
      fa: "هر τ یک جواب متفاوت از همان نقطه‌ی اولیه می‌دهد، پس آینده با حال تعیین نمی‌شود. مقصر در پنل کناری است: δ را کوچک کن تا شیب وتر بی‌نهایت شود. هیچ ثابت لیپشیتز L در x = 0 کار نمی‌کند، پس قضیه‌ی ۳.۱ برقرار نیست." }
  };

  // ------------------------------------------------ continuous dependence and the Gronwall bound
  const LN10 = Math.LN10;
  const gronwall = {
    mode: "time",
    dim: 4,
    params: { A: 1.5, e: -2 },
    controls: [
      { type: "slider", key: "A", label: { en: "initial angle", fa: "زاویه‌ی اولیه" }, min: 0.3, max: 2.8, step: 0.05, reset: true },
      { type: "slider", key: "e", label: { en: "log₁₀ of the initial gap", fa: "log₁₀ فاصله‌ی اولیه" }, min: -4, max: -1, step: 0.1, digits: 1, reset: true }
    ],
    starts: P => [[P.A, 0, P.A + Math.pow(10, P.e), 0]],
    f: x => [x[1], -Math.sin(x[0]), x[3], -Math.sin(x[2])],
    tWindow: 14,
    series: [
      { f: x => Math.log10(Math.max(1e-12, Math.hypot(x[0] - x[2], x[1] - x[3]))), label: { en: "log₁₀ ‖x(t) − y(t)‖ (actual)", fa: "log₁₀ ‖x(t) − y(t)‖ (واقعی)" }, color: "--accent" },
      { f: (x, P, t) => P.e + t / LN10, label: { en: "Gronwall bound log₁₀(‖x₀ − y₀‖·eᴸᵗ), L = 1", fa: "کران گرونوال log₁₀(‖x₀ − y₀‖·eᴸᵗ)، L = 1" }, color: "--warn", dash: [7, 5] }
    ],
    tlim: P => [P.e - 1, P.e + 6.5],
    side(ctx, W, H, lab) {
      const t = lab.trajs[0];
      if (!t) return;
      const cx = W / 2, cy = 40, L = Math.min(W * 0.36, H * 0.6);
      ctx.fillStyle = C.muted; ctx.fillRect(cx - 60, cy - 8, 120, 6);
      [[t.x[2], C.warn], [t.x[0], C.accent]].forEach(([th, c], i) => {
        const bx = cx + L * Math.sin(th), by = cy + L * Math.cos(th);
        ctx.strokeStyle = c; ctx.lineWidth = i ? 3 : 5; ctx.globalAlpha = i ? 1 : 0.55;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(bx, by); ctx.stroke();
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(bx, by, i ? 11 : 16, 0, 2 * Math.PI); ctx.fill(); ctx.globalAlpha = 1;
      });
      const d = Math.hypot(t.x[0] - t.x[2], t.x[1] - t.x[3]);
      text(ctx, `‖x − y‖ = ${d.toExponential(2)}`, 12, H - 12, { color: "--ink", font: `14px ${FONT}` });
    },
    sideTitle: { en: "Two pendulums that start almost together", fa: "دو آونگ که تقریباً با هم شروع می‌کنند" },
    timeTitle: { en: "Distance between the two solutions (log scale)", fa: "فاصله‌ی دو جواب (مقیاس لگاریتمی)" },
    eq: P => `ẋ1 = x2,  ẋ2 = −sin x1     two solutions x(t), y(t)
‖x(0) − y(0)‖ = 10^(${P.e.toFixed(1)})
‖∂f/∂x‖ ≤ 1 = L    ⇒   ‖x(t) − y(t)‖ ≤ ‖x(0) − y(0)‖·e^(L t)     (Theorem 3.4, Gronwall–Bellman)`,
    caption: { en: "The actual gap (solid) stays far below the bound (dashed). The bound is honest but pessimistic: it grows exponentially for every system with Lipschitz constant L, while the pendulum's gap only grows slowly because nearby orbits have slightly different periods. Over any finite time, a smaller initial gap gives a smaller gap: continuous dependence on initial conditions.",
      fa: "فاصله‌ی واقعی (خط پر) خیلی پایین‌تر از کران (خط‌چین) می‌ماند. کران درست ولی بدبینانه است: برای هر سیستم با ثابت لیپشیتز L نمایی رشد می‌کند، در حالی که فاصله‌ی آونگ‌ها فقط آهسته زیاد می‌شود چون مدارهای نزدیک دوره‌ی تناوب کمی متفاوت دارند. در هر بازه‌ی زمانی محدود، فاصله‌ی اولیه‌ی کوچک‌تر فاصله‌ی کوچک‌تری می‌دهد: وابستگی پیوسته به شرایط اولیه." }
  };

  register({ "ch3-escape": escape, "ch3-nonuniq": nonuniq, "ch3-gronwall": gronwall });
})();
